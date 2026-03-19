"""
models.py - Pydantic schemas for NexaFi request/response contracts.
All agent outputs are normalized into ChatResponse before returning to the client.
"""

from typing import Any, Optional
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Inbound
# ---------------------------------------------------------------------------

class ChatMessage(BaseModel):
    """A single turn in the conversation history."""
    role: str  # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    """Payload sent by the frontend to POST /chat."""
    user_id: str
    session_id: str
    message: str
    history: list[ChatMessage] = Field(default_factory=list)
    system_view: bool = False  # if True, include debug metadata in response


# ---------------------------------------------------------------------------
# Outbound building blocks
# ---------------------------------------------------------------------------

class Citation(BaseModel):
    """A source reference attached to a response."""
    title: str
    source: str
    url: Optional[str] = None


class WorkflowCard(BaseModel):
    """Structured UI card returned alongside a response (e.g. troubleshooting steps)."""
    type: str                        # e.g. "market_summary", "support_steps", "retention_offer"
    title: str
    items: list[str] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Classification result (internal, also surfaced in system_view)
# ---------------------------------------------------------------------------

class ClassificationResult(BaseModel):
    """Output of the intent classifier."""
    intent: str                      # e.g. "market_explanation"
    route: str                       # e.g. "market_context_path"
    confidence: float
    needs_tools: bool = False
    needs_vector_search: bool = False
    needs_followup: bool = False


# ---------------------------------------------------------------------------
# Outbound
# ---------------------------------------------------------------------------

class ChatResponse(BaseModel):
    """Unified response schema returned by POST /chat."""
    response: str
    intent: str
    route: str
    agent_used: str
    tools_used: list[str] = Field(default_factory=list)
    used_vector_search: bool = False
    confidence: float
    latency_ms: int
    citations: list[Citation] = Field(default_factory=list)
    state: Optional[dict[str, Any]] = None      # profile state, session state, etc.
    workflow_card: Optional[WorkflowCard] = None
