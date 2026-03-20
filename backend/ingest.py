"""
ingest.py - Pre-populate ChromaDB with all knowledge-base documents.

Skips any collection that already has documents (idempotent).
"""

import logging
import sys
import os

logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(message)s")
logger = logging.getLogger(__name__)

sys.path.insert(0, os.path.dirname(__file__))

import chromadb
from retriever import reingest_kb, CHROMA_PATH

KB_NAMES = ["education", "support", "retention", "market"]

if __name__ == "__main__":
    logger.info("Starting ChromaDB ingestion for all knowledge bases…")
    logger.info("ChromaDB initialised at %s", CHROMA_PATH)

    client = chromadb.PersistentClient(path=CHROMA_PATH)
    total = 0
    for kb in KB_NAMES:
        try:
            col = client.get_collection(kb)
            count = col.count()
            if count > 0:
                logger.info("  ✓ %-12s  already has %d docs, skipping", kb, count)
                continue
        except Exception:
            pass  # collection doesn't exist yet

        count = reingest_kb(kb)
        logger.info("  ✓ %-12s  %d documents ingested", kb, count)
        total += count

    logger.info("Done. %d new documents stored.", total)
