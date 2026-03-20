"""
orchestrator.py - The brain of NexaFi's chatbot backend.

Flow:
  1. Guardrails check  →  short-circuit if unsafe / off-topic
  2. Intent classification (rule-based → LLM fallback)
  3. Routing decision:
       a. Compound / multi-intent query  →  LangGraph multi-agent graph
       b. Single-intent query            →  direct agent call (fast path)
  4. Response normalization → ChatResponse

The fast path (single-intent) is unchanged from before — zero LangGraph overhead.
The graph path handles compound queries with parallel agent fan-out + synthesis.
"""

from typing import Any
from models import ChatRequest, ChatResponse, Citation, WorkflowCard, ClassificationResult
from utils import now_ms
import guardrails
import classifier
import agents


# ---------------------------------------------------------------------------
# Route → agent function mapping  (fast path)
# ---------------------------------------------------------------------------

_ROUTE_MAP = {
    "direct_answer_path":      agents.education_agent,
    "market_context_path":     agents.market_agent,
    "support_workflow_path":   agents.support_agent,
    "retention_workflow_path": agents.retention_agent,
    "profile_state_path":      agents.profile_agent,
    "fallback_path":           agents.fallback_agent,
}

_ROUTE_TO_AGENT_NAME = {
    "direct_answer_path":      "education_agent",
    "market_context_path":     "market_agent",
    "support_workflow_path":   "support_agent",
    "retention_workflow_path": "retention_agent",
    "profile_state_path":      "profile_agent",
    "fallback_path":           "fallback_agent",
}

# Intents that can meaningfully combine in a compound query
_COMPOUND_ELIGIBLE = {
    "market_explanation",
    "education_basic",
    "profile_transparency",
}


def _is_compound(message: str) -> bool:
    """
    Lightweight heuristic to detect compound queries before spending an LLM
    call on the full graph parse.

    Looks for conjunctions that join two distinct topics:
      "explain X and also tell me about Y"
      "market prep + what is beta"
    """
    import re
    compound_signals = [
        r"\band (also|tell me|explain|show|give me|teach)\b",
        r"\bplus\b.{5,50}\b(explain|what is|tell me|teach)\b",
        r"\b(what is|explain|teach).{5,60}\band\b.{5,60}\b(market|portfolio|stock|risk|price|week|today)\b",
        r"\b(market|portfolio|stock|price|stocks).{5,60}\band\b.{5,60}\b(what is|explain|teach|about)\b",
        # "X stocks this week and teach me about Y"
        r"\bstocks?\b.{3,40}\band\b.{3,40}\b(teach|explain|what is|about)\b",
        # "teach me about X and also Y market"
        r"\b(teach|explain|learn).{3,60}\band\b.{3,60}\b(stock|market|price|etf|equity|equities)\b",
    ]
    for pattern in compound_signals:
        if re.search(pattern, message, re.IGNORECASE):
            return True
    return False


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------

async def handle(request: ChatRequest) -> ChatResponse:
    start_ms = now_ms()

    # ------------------------------------------------------------------
    # Step 0: Response cache — identical message = instant reply
    # ------------------------------------------------------------------
    from utils import get_cached_response, set_cached_response
    cached = get_cached_response(request.message)
    if cached:
        import logging
        logging.getLogger(__name__).info("Cache hit for: %s", request.message[:60])
        return _build_response(
            response=cached.get("response", ""),
            intent=cached.get("intent", "cached"),
            route=cached.get("route", "cache_path"),
            agent_used=cached.get("agent_used", "cache"),
            classification=None,
            agent_result=cached,
            start_ms=start_ms,
        )

    # ------------------------------------------------------------------
    # Step 1: Guardrails — always runs first, zero cost
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
    # Step 2: Classify intent
    # ------------------------------------------------------------------
    classification: ClassificationResult = classifier.classify(request.message)

    context: dict[str, Any] = {
        "user_id": request.user_id,
        "session_id": request.session_id,
        "history": [m.model_dump() for m in request.history],
        "classification": classification.model_dump(),
    }

    # ------------------------------------------------------------------
    # Step 3: Routing decision
    # ------------------------------------------------------------------
    use_graph = (
        classification.intent in _COMPOUND_ELIGIBLE
        and _is_compound(request.message)
    )

    if use_graph:
        agent_result = await _run_graph(request.message, context)
        agent_name = "nexafi_graph[" + ", ".join(agent_result.get("agents_used", [])) + "]"
        route = "graph_path"
    else:
        # Fast path — run blocking agent in thread so we don't block the event loop
        import asyncio
        route = classification.route
        agent_fn = _ROUTE_MAP.get(route, agents.fallback_agent)
        agent_name = _ROUTE_TO_AGENT_NAME.get(route, "fallback_agent")
        agent_result = await asyncio.to_thread(agent_fn, request.message, context)

    # ------------------------------------------------------------------
    # Step 4: Cache result + return
    # ------------------------------------------------------------------
    final = _build_response(
        response=agent_result.get("response", ""),
        intent=classification.intent,
        route=route,
        agent_used=agent_name,
        classification=classification,
        agent_result=agent_result,
        start_ms=start_ms,
    )
    set_cached_response(request.message, {
        **agent_result,
        "intent": classification.intent,
        "route": route,
        "agent_used": agent_name,
    })
    return final


# ---------------------------------------------------------------------------
# LangGraph invocation
# ---------------------------------------------------------------------------

async def _run_graph(message: str, context: dict[str, Any]) -> dict[str, Any]:
    """Run the NexaFi LangGraph using ainvoke for true async execution."""
    from graphs.nexafi_graph import nexafi_graph

    # Extract pre-classified data from context to skip parse_intent LLM call
    clf = context.get("classification", {})
    intent = clf.get("intent", "")
    from utils import extract_ticker, parse_time_range

    # Map single intent + compound signals into intents list
    # The orchestrator already detected compound — derive both intents from message
    import re
    intents = [intent] if intent else ["market_explanation"]
    # Add education intent if compound signals present
    if re.search(r"\b(what is|explain|define|how does|teach me|about equities|about etf|about stocks)\b", message, re.IGNORECASE):
        if "education_basic" not in intents:
            intents.append("education_basic")
    if re.search(r"\b(my profile|what do you know|assumptions)\b", message, re.IGNORECASE):
        if "profile_transparency" not in intents:
            intents.append("profile_transparency")

    initial_state = {
        "message": message,
        "context": context,
        "intents": intents,                              # pre-filled — skips parse LLM
        "ticker": extract_ticker(message) or "SPY",
        "time_range": parse_time_range(message),
        "kpis": [],
        "is_compound": len(intents) > 1,
        "agent_outputs": [],
        "response": "",
        "citations": [],
        "tools_used": [],
        "tool_calls": [],
        "used_vector_search": False,
        "workflow_card": None,
        "agents_used": [],
        "judge_retry_count": 0,
        "judge_passed": False,
        "judge_scores": {},
        "judge_reason": "",
        "correction_hint": "",
        "judge_ref_docs": [],
    }

    final_state = await nexafi_graph.ainvoke(initial_state)

    return {
        "response":           final_state.get("response", ""),
        "citations":          final_state.get("citations", []),
        "tools_used":         final_state.get("tools_used", []),
        "tool_calls":         final_state.get("tool_calls", []),
        "used_vector_search": final_state.get("used_vector_search", False),
        "workflow_card":      final_state.get("workflow_card"),
        "agents_used":        final_state.get("agents_used", []),
        "state":              None,
    }


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

    from models import ToolCall

    citations = [
        Citation(title=c.get("title", ""), source=c.get("source", ""), url=c.get("url"))
        for c in agent_result.get("citations", [])
    ]

    tool_calls = [
        ToolCall(
            tool=tc.get("tool", ""),
            api=tc.get("api", ""),
            endpoint=tc.get("endpoint", ""),
            url=tc.get("url", ""),
            params=tc.get("params", {}),
            description=tc.get("description", ""),
        )
        for tc in agent_result.get("tool_calls", [])
    ]

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
        tool_calls=tool_calls,
        used_vector_search=agent_result.get("used_vector_search", False),
        confidence=classification.confidence if classification else 1.0,
        latency_ms=now_ms() - start_ms,
        citations=citations,
        state=agent_result.get("state"),
        workflow_card=workflow_card,
    )
