"""
orchestrator.py - The brain of NexaFi's chatbot backend.

Flow:
  1. Guardrails check  →  short-circuit if unsafe / off-topic
  2. Intent classification
  3. Route selection
  4. Agent invocation
  5. Response normalization → ChatResponse

The orchestrator is intentionally simple and linear.
It does NOT use autonomous chains or dynamic tool selection.
Each step is explicit and easy to trace.
"""

from typing import Any
from models import ChatRequest, ChatResponse, Citation, WorkflowCard, ClassificationResult
from utils import now_ms
import guardrails
import classifier
import agents


# ---------------------------------------------------------------------------
# Route → agent function mapping
# ---------------------------------------------------------------------------

_ROUTE_MAP = {
    "direct_answer_path":     agents.education_agent,
    "market_context_path":    agents.market_agent,
    "support_workflow_path":  agents.support_agent,
    "retention_workflow_path": agents.retention_agent,
    "profile_state_path":     agents.profile_agent,
    "fallback_path":          agents.fallback_agent,
}

_ROUTE_TO_AGENT_NAME = {
    "direct_answer_path":     "education_agent",
    "market_context_path":    "market_agent",
    "support_workflow_path":  "support_agent",
    "retention_workflow_path": "retention_agent",
    "profile_state_path":     "profile_agent",
    "fallback_path":          "fallback_agent",
}


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------

def handle(request: ChatRequest) -> ChatResponse:
    """
    Process a chat request end-to-end and return a normalized ChatResponse.

    Args:
        request: Validated ChatRequest from the /chat endpoint.

    Returns:
        ChatResponse ready to serialize and return to the client.
    """
    start_ms = now_ms()

    # ------------------------------------------------------------------
    # Step 1: Guardrails
    # ------------------------------------------------------------------
    guard = guardrails.check(request.message)
    if not guard.passed:
        return _build_response(
            response=guard.response,
            intent=guard.reason or "blocked",
            route="guardrail_path",
            agent_used="guardrail",
            classification=None,
            agent_result={},
            start_ms=start_ms,
        )

    # ------------------------------------------------------------------
    # Step 2: Intent classification
    # ------------------------------------------------------------------
    classification: ClassificationResult = classifier.classify(request.message)

    # ------------------------------------------------------------------
    # Step 3: Route selection
    # ------------------------------------------------------------------
    route = classification.route
    agent_fn = _ROUTE_MAP.get(route, agents.fallback_agent)
    agent_name = _ROUTE_TO_AGENT_NAME.get(route, "fallback_agent")

    # ------------------------------------------------------------------
    # Step 4: Agent invocation
    # Build a context dict so agents can access session/user info
    # without coupling to the full request schema.
    # ------------------------------------------------------------------
    context: dict[str, Any] = {
        "user_id": request.user_id,
        "session_id": request.session_id,
        "history": [m.model_dump() for m in request.history],
        "classification": classification.model_dump(),
    }

    agent_result: dict[str, Any] = agent_fn(request.message, context)

    # ------------------------------------------------------------------
    # Step 5: Normalize and return
    # ------------------------------------------------------------------
    return _build_response(
        response=agent_result.get("response", ""),
        intent=classification.intent,
        route=route,
        agent_used=agent_name,
        classification=classification,
        agent_result=agent_result,
        start_ms=start_ms,
    )


# ---------------------------------------------------------------------------
# Response builder
# ---------------------------------------------------------------------------

def _build_response(
    response: str,
    intent: str,
    route: str,
    agent_used: str,
    classification: ClassificationResult | None,
    agent_result: dict[str, Any],
    start_ms: int,
) -> ChatResponse:
    """Assemble a ChatResponse from orchestrator outputs."""

    # Citations
    raw_citations = agent_result.get("citations", [])
    citations = [
        Citation(
            title=c.get("title", ""),
            source=c.get("source", ""),
            url=c.get("url"),
        )
        for c in raw_citations
    ]

    # Workflow card
    raw_card = agent_result.get("workflow_card")
    workflow_card = None
    if raw_card:
        workflow_card = WorkflowCard(
            type=raw_card.get("type", "info"),
            title=raw_card.get("title", ""),
            items=raw_card.get("items", []),
        )

    return ChatResponse(
        response=response,
        intent=intent,
        route=route,
        agent_used=agent_used,
        tools_used=agent_result.get("tools_used", []),
        used_vector_search=agent_result.get("used_vector_search", False),
        confidence=classification.confidence if classification else 1.0,
        latency_ms=now_ms() - start_ms,
        citations=citations,
        state=agent_result.get("state"),
        workflow_card=workflow_card,
    )
