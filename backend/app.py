"""
app.py - FastAPI application entry point for NexaFi backend.

Run locally:
    uvicorn app:app --reload --port 8000

The frontend (running on a separate Replit or localhost:3000) connects to:
    POST http://localhost:8000/chat
    GET  http://localhost:8000/health
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import router
from config import ALLOWED_ORIGINS

app = FastAPI(
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
