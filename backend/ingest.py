"""
ingest.py - Pre-populate ChromaDB with all knowledge-base documents.

Run once before starting the server (or whenever KB files change):
    conda run -n base python ingest.py

This avoids the cold-start embedding delay on the first user query.
"""

import logging
import sys
import os

logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(message)s")
logger = logging.getLogger(__name__)

# Ensure backend/ is on the path when run directly
sys.path.insert(0, os.path.dirname(__file__))

from retriever import reingest_kb

KB_NAMES = ["education", "support", "retention", "market"]

if __name__ == "__main__":
    logger.info("Starting ChromaDB ingestion for all knowledge bases…\n")
    total = 0
    for kb in KB_NAMES:
        count = reingest_kb(kb)
        logger.info("  ✓ %-12s  %d documents ingested", kb, count)
        total += count
    logger.info("\nDone. %d total documents stored in ChromaDB at ./chroma_db/", total)
