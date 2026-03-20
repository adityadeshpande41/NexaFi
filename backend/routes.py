"""
routes.py - HTTP route definitions for NexaFi backend.

Business logic lives in orchestrator.py.
This file only handles HTTP concerns: request parsing, response serialization,
and error handling.
"""

from fastapi import APIRouter, HTTPException
from models import ChatRequest, ChatResponse
import orchestrator

router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    """
    Main chat endpoint.

    Accepts a ChatRequest, runs it through the orchestrator, and returns
    a structured ChatResponse.
    """
    try:
        return await orchestrator.handle(request)
    except Exception as e:
        # Surface unexpected errors as 500 with a safe message
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


@router.get("/health")
async def health() -> dict:
    """Simple liveness check."""
    return {"status": "ok", "service": "nexafi-backend", "version": "1.0.0"}
