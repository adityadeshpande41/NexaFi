"""
retriever.py - Semantic retrieval for NexaFi.

Priority order:
  1. pgvector (Postgres)  -- when DATABASE_URL is set
  2. ChromaDB             -- local persistent vector DB (default)
"""

import os
import json
import logging
from typing import Any

import chromadb
from chromadb.config import Settings
from openai import OpenAI

from config import OPENAI_API_KEY, OPENAI_EMBEDDING_MODEL, DATABASE_URL, DATA_DIR
from utils import load_json

logger = logging.getLogger(__name__)

_openai_client = None


def _get_openai():
    global _openai_client
    if _openai_client is None:
        if not OPENAI_API_KEY:
            raise RuntimeError("OPENAI_API_KEY is not set.")
        _openai_client = OpenAI(api_key=OPENAI_API_KEY)
    return _openai_client


def _embed(text: str) -> list:
    resp = _get_openai().embeddings.create(model=OPENAI_EMBEDDING_MODEL, input=text)
    return resp.data[0].embedding


_KB_FILES = {
    "education": os.path.join(DATA_DIR, "education_kb.json"),
    "support":   os.path.join(DATA_DIR, "support_kb.json"),
    "retention": os.path.join(DATA_DIR, "retention_kb.json"),
    "market":    os.path.join(DATA_DIR, "market_news.json"),
}

CHROMA_PATH = os.path.join(os.path.dirname(__file__), "chroma_db")
_chroma_client = None


def _get_chroma():
    global _chroma_client
    if _chroma_client is None:
        _chroma_client = chromadb.PersistentClient(
            path=CHROMA_PATH,
            settings=Settings(anonymized_telemetry=False),
        )
        logger.info("ChromaDB initialised at %s", CHROMA_PATH)
    return _chroma_client


def _doc_text(doc: dict) -> str:
    playbook_summary = ""
    if isinstance(doc.get("playbook"), dict):
        playbook_summary = doc["playbook"].get("summary", "")
    parts = [
        doc.get("title", ""),
        doc.get("content", ""),
        doc.get("summary", ""),
        " ".join(doc.get("keywords", [])),
        playbook_summary,
    ]
    return " ".join(p for p in parts if p).strip()


def _ensure_collection(kb_name: str):
    client = _get_chroma()
    collection = client.get_or_create_collection(
        name=kb_name,
        metadata={"hnsw:space": "cosine"},
    )
    if collection.count() == 0:
        logger.info("Ingesting '%s' KB into ChromaDB...", kb_name)
        docs = load_json(_KB_FILES[kb_name])
        ids, embeddings, documents, metadatas = [], [], [], []
        for doc in docs:
            text = _doc_text(doc)
            if not text:
                continue
            ids.append(doc["id"])
            embeddings.append(_embed(text))
            documents.append(text)
            metadatas.append({"payload": json.dumps(doc), "kb_name": kb_name})
        if ids:
            collection.add(
                ids=ids,
                embeddings=embeddings,
                documents=documents,
                metadatas=metadatas,
            )
            logger.info("Ingested %d documents into '%s' collection.", len(ids), kb_name)
    return collection


def _retrieve_pgvector(query_vec, kb_name, top_k, filters):
    import asyncio
    import asyncpg
    from pgvector.asyncpg import register_vector

    vec_literal = "[" + ",".join(str(v) for v in query_vec) + "]"
    where_clauses = ["kb_name = $1"]
    params = [kb_name]
    idx = 2
    if filters:
        for col, val in filters.items():
            where_clauses.append(f"{col} = \${idx}")
            params.append(val)
            idx += 1
    where_sql = " AND ".join(where_clauses)
    sql = f"""
        SELECT payload, 1 - (embedding <=> '{vec_literal}'::vector) AS score
        FROM documents WHERE {where_sql}
        ORDER BY score DESC LIMIT {top_k}
    """

    async def _run():
        conn = await asyncpg.connect(DATABASE_URL)
        await register_vector(conn)
        rows = await conn.fetch(sql, *params)
        await conn.close()
        results = []
        for row in rows:
            doc = json.loads(row["payload"])
            doc["_score"] = float(row["score"])
            results.append(doc)
        return results

    return asyncio.get_event_loop().run_until_complete(_run())


def _retrieve_chroma(query_vec, kb_name, top_k, filters):
    collection = _ensure_collection(kb_name)
    where = None
    if filters:
        conditions = [{"metadata." + k: {"$eq": v}} for k, v in filters.items()]
        where = {"$and": conditions} if len(conditions) > 1 else conditions[0]
    results = collection.query(
        query_embeddings=[query_vec],
        n_results=min(top_k, collection.count()),
        where=where,
        include=["metadatas", "distances"],
    )
    docs = []
    for meta, dist in zip(results["metadatas"][0], results["distances"][0]):
        doc = json.loads(meta["payload"])
        doc["_score"] = round(1.0 - dist, 4)
        docs.append(doc)
    return docs


def retrieve(query: str, kb_name: str, top_k: int = 3, filters=None) -> list:
    """
    Retrieve top-k semantically relevant documents.
    - DATABASE_URL set -> pgvector (production Postgres)
    - Otherwise        -> ChromaDB (local persistent, auto-ingested)
    """
    query_vec = _embed(query)
    if DATABASE_URL:
        logger.info("Using pgvector for '%s' retrieval", kb_name)
        return _retrieve_pgvector(query_vec, kb_name, top_k, filters)
    logger.info("Using ChromaDB for '%s' retrieval", kb_name)
    return _retrieve_chroma(query_vec, kb_name, top_k, filters)


def reingest_kb(kb_name: str) -> int:
    """Force re-ingest a KB collection. Useful when KB JSON files are updated."""
    client = _get_chroma()
    try:
        client.delete_collection(kb_name)
        logger.info("Deleted existing '%s' collection for re-ingestion.", kb_name)
    except Exception:
        pass
    collection = _ensure_collection(kb_name)
    return collection.count()
