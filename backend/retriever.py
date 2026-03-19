"""
retriever.py - Semantic retrieval for NexaFi.
"""

import os
import json
import math
from typing import Any

from openai import OpenAI
from config import OPENAI_API_KEY, OPENAI_EMBEDDING_MODEL, DATABASE_URL, DATA_DIR
from utils import load_json

_openai_client: OpenAI | None = None


def _get_openai() -> OpenAI:
    global _openai_client
    if _openai_client is None:
        if not OPENAI_API_KEY:
            raise RuntimeError("OPENAI_API_KEY is not set.")
        _openai_client = OpenAI(api_key=OPENAI_API_KEY)
    return _openai_client


_KB_FILES: dict[str, str] = {
    "education": os.path.join(DATA_DIR, "education_kb.json"),
    "support":   os.path.join(DATA_DIR, "support_kb.json"),
    "retention": os.path.join(DATA_DIR, "retention_kb.json"),
    "market":    os.path.join(DATA_DIR, "market_news.json"),
}

_embedded_cache: dict[str, list[tuple[dict, list[float]]]] = {}


def _embed(text: str) -> list[float]:
    resp = _get_openai().embeddings.create(model=OPENAI_EMBEDDING_MODEL, input=text)
    return resp.data[0].embedding


def _cosine(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    mag_a = math.sqrt(sum(x * x for x in a))
    mag_b = math.sqrt(sum(x * x for x in b))
    if mag_a == 0 or mag_b == 0:
        return 0.0
    return dot / (mag_a * mag_b)


def _doc_text(doc: dict) -> str:
    parts = [
        doc.get("title", ""),
        doc.get("content", ""),
        doc.get("summary", ""),
        " ".join(doc.get("keywords", [])),
    ]
    return " ".join(p for p in parts if p)


def _load_embedded_kb(kb_name: str) -> list[tuple[dict, list[float]]]:
    """Load and embed KB docs, cached in memory after first call."""
    if kb_name in _embedded_cache:
        return _embedded_cache[kb_name]
    docs = load_json(_KB_FILES[kb_name])
    embedded = [(doc, _embed(_doc_text(doc))) for doc in docs]
    _embedded_cache[kb_name] = embedded
    return embedded


def _retrieve_pgvector(
    query_vec: list[float],
    kb_name: str,
    top_k: int,
    filters: dict[str, Any] | None,
) -> list[dict]:
    """
    Query pgvector for nearest neighbours.

    Expected table schema:
        CREATE TABLE documents (
            id TEXT PRIMARY KEY, kb_name TEXT, doc_type TEXT,
            symbol TEXT, recency TEXT, intent_category TEXT,
            issue_type TEXT, payload JSONB, embedding vector(1536)
        );
        CREATE INDEX ON documents USING ivfflat (embedding vector_cosine_ops);
    """
    import asyncio
    import asyncpg
    from pgvector.asyncpg import register_vector

    vec_literal = "[" + ",".join(str(v) for v in query_vec) + "]"
    where_clauses = ["kb_name = $1"]
    params: list[Any] = [kb_name]
    idx = 2

    if filters:
        for col, val in filters.items():
            where_clauses.append(f"{col} = ${idx}")
            params.append(val)
            idx += 1

    where_sql = " AND ".join(where_clauses)
    sql = f"""
        SELECT payload, 1 - (embedding <=> '{vec_literal}'::vector) AS score
        FROM documents WHERE {where_sql}
        ORDER BY score DESC LIMIT {top_k}
    """

    async def _run() -> list[dict]:
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


def retrieve(
    query: str,
    kb_name: str,
    top_k: int = 3,
    filters: dict[str, Any] | None = None,
) -> list[dict]:
    """
    Retrieve top-k semantically relevant documents.
    - DATABASE_URL set: pgvector (production)
    - No DATABASE_URL: OpenAI embeddings + in-memory cosine (dev)
    """
    query_vec = _embed(query)

    if DATABASE_URL:
        return _retrieve_pgvector(query_vec, kb_name, top_k, filters)

    embedded_docs = _load_embedded_kb(kb_name)

    if filters:
        filtered = [
            (doc, vec) for doc, vec in embedded_docs
            if all(doc.get(k) == v for k, v in filters.items())
        ]
        embedded_docs = filtered if filtered else embedded_docs

    scored = []
    for doc, vec in embedded_docs:
        doc_copy = dict(doc)
        doc_copy["_score"] = round(_cosine(query_vec, vec), 4)
        scored.append(doc_copy)

    scored.sort(key=lambda d: d["_score"], reverse=True)
    return scored[:top_k]
