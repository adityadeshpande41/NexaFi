"""
app.py - FastAPI application entry point for NexaFi backend.

Run locally:
    uvicorn app:app --reload --port 8000

The frontend (running on a separate Replit or localhost:3000) connects to:
    POST http://localhost:8000/chat
    GET  http://localhost:8000/health
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import router
from config import ALLOWED_ORIGINS

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Warm up ChromaDB collections at startup so first user query isn't slow
    try:
        from retriever import _ensure_collection
        import asyncio, logging
        logger = logging.getLogger(__name__)
        for kb in ["education", "support", "retention", "market"]:
            await asyncio.to_thread(_ensure_collection, kb)
        logger.info("ChromaDB warmup complete")
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning("ChromaDB warmup failed: %s", e)
    yield

app = FastAPI(
    lifespan=lifespan,
    title="NexaFi Backend",
    description="Intent-aware chatbot backend for Nova, NexaFi's AI investing copilot.",
    version="1.0.0",
)

# ---------------------------------------------------------------------------
# CORS — allow the frontend origin(s) to call this API
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=r"https://.*\.replit\.app",  # allow any Replit deployment
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
app.include_router(router)
