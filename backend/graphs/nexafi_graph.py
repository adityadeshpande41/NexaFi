"""
graphs/nexafi_graph.py — LangGraph multi-agent graph for NexaFi.

Async nodes + asyncio.to_thread for blocking agent calls.
LangGraph's Send() fan-out runs async nodes concurrently, giving true
parallel execution. Latency = max(slowest_agent) instead of sum(all_agents).

Flow:
  START → parse_intent → route (Send fan-out)
    ├── run_market_node    ─┐
    ├── run_education_node ─┤ (parallel)
    ├── run_profile_node   ─┤
    ├── run_support_node   ─┤
    └── run_retention_node ─┘
          → synthesize → judge ──pass──→ END
                           └──fail──→ regenerate → judge (max 2 retries)
"""

import asyncio
import json
import operator
from typing import Annotated, Any

from langgraph.graph import StateGraph, START, END
from langgraph.types import Send
from langchain_openai import ChatOpenAI
from typing_extensions import TypedDict

from config import OPENAI_API_KEY, OPENAI_MODEL

MAX_JUDGE_RETRIES = 2

# ---------------------------------------------------------------------------
# State
# ---------------------------------------------------------------------------

class AgentOutput(TypedDict):
    agent: str
    response: str
    citations: list[dict]
    tools_used: list[str]
    tool_calls: list[dict]
    used_vector_search: bool
    workflow_card: dict | None


class NexaFiState(TypedDict):
    message: str
    context: dict[str, Any]
    intents: list[str]
    ticker: str
    time_range: str
    kpis: list[str]
    is_compound: bool
    agent_outputs: Annotated[list[AgentOutput], operator.add]
    response: str
    citations: list[dict]
    tools_used: list[str]
    tool_calls: list[dict]
    used_vector_search: bool
    workflow_card: dict | None
    agents_used: list[str]
    judge_retry_count: int
    judge_scores: dict
    judge_passed: bool
    judge_reason: str
    correction_hint: str
    judge_ref_docs: list   # pre-fetched during synthesize to save latency


# ---------------------------------------------------------------------------
# LLM clients
# ---------------------------------------------------------------------------

_llm = ChatOpenAI(model=OPENAI_MODEL, api_key=OPENAI_API_KEY, temperature=0, max_tokens=200)
_synthesis_llm = ChatOpenAI(model=OPENAI_MODEL, api_key=OPENAI_API_KEY, temperature=0.3, max_tokens=500)
_regenerate_llm = ChatOpenAI(model=OPENAI_MODEL, api_key=OPENAI_API_KEY, temperature=0.2, max_tokens=500)

# ---------------------------------------------------------------------------
# Node: parse_intent (async)
# ---------------------------------------------------------------------------

_PARSE_PROMPT = """You are a query parser for NexaFi, an AI investing copilot.

Parse the user query and return ONLY valid JSON:
{{
  "intents": ["<intent1>", "<intent2>"],
  "ticker": "<TICKER or null>",
  "time_range": "<1d|1w|1m|1y>",
  "kpis": ["<kpi1>"]
}}

Valid intents: education_basic, market_explanation, support_issue, churn_risk, profile_transparency, off_topic
Valid KPIs: price, change_pct, volume, earnings, pe_ratio, market_cap, news, risk, rebalance

Rules:
- List multiple intents only if the query clearly spans them.
- ticker: extract stock symbol if mentioned, else null.
- time_range: infer from query, default "1w".

User query: {message}"""


async def parse_intent(state: NexaFiState) -> dict:
    # If orchestrator already passed pre-classified intents, skip the LLM call
    if state.get("intents"):
        return {
            "is_compound": len(state["intents"]) > 1,
            "agent_outputs": [],
            "judge_retry_count": 0,
            "judge_passed": False,
            "judge_scores": {},
            "judge_reason": "",
            "correction_hint": "",
        }

    prompt = _PARSE_PROMPT.format(message=state["message"])
    result = await _llm.ainvoke(prompt)
    try:
        parsed = json.loads(result.content.strip())
    except Exception:
        parsed = {"intents": ["market_explanation"], "ticker": None, "time_range": "1w", "kpis": ["price"]}

    intents = parsed.get("intents", ["market_explanation"])
    return {
        "intents": intents,
        "ticker": parsed.get("ticker") or "SPY",
        "time_range": parsed.get("time_range") or "1w",
        "kpis": parsed.get("kpis") or [],
        "is_compound": len(intents) > 1,
        "agent_outputs": [],
        "judge_retry_count": 0,
        "judge_passed": False,
        "judge_scores": {},
        "judge_reason": "",
        "correction_hint": "",
        "judge_ref_docs": [],
    }


# ---------------------------------------------------------------------------
# Node: route
# ---------------------------------------------------------------------------

def route(state: NexaFiState):
    sends = []
    for intent in state["intents"]:
        if intent == "market_explanation":
            sends.append(Send("run_market_node", {**state}))
        elif intent == "education_basic":
            sends.append(Send("run_education_node", {**state}))
        elif intent == "profile_transparency":
            sends.append(Send("run_profile_node", {**state}))
        elif intent == "support_issue":
            sends.append(Send("run_support_node", {**state}))
        elif intent == "churn_risk":
            sends.append(Send("run_retention_node", {**state}))
    if not sends:
        sends.append(Send("run_fallback_node", {**state}))
    return sends


# ---------------------------------------------------------------------------
# Async agent runner — wraps blocking agent in thread pool
# ---------------------------------------------------------------------------

async def _run_agent_async(agent_name: str, state: NexaFiState) -> dict:
    """
    Run a blocking agent function in a thread pool so LangGraph's async
    event loop isn't blocked. This is what enables true parallel execution.
    """
    import agents as ag
    fn_map = {
        "market_agent":    ag.market_agent,
        "education_agent": ag.education_agent,
        "profile_agent":   ag.profile_agent,
        "support_agent":   ag.support_agent,
        "retention_agent": ag.retention_agent,
        "fallback_agent":  ag.fallback_agent,
    }
    fn = fn_map[agent_name]

    context = {
        **state.get("context", {}),
        "ticker": state.get("ticker"),
        "time_range": state.get("time_range"),
        "kpis": state.get("kpis"),
        "classification": {
            "intent": state["intents"][0] if state["intents"] else "off_topic",
            "needs_tools": agent_name in ("market_agent", "profile_agent"),
            "needs_vector_search": agent_name in (
                "market_agent", "education_agent", "support_agent", "retention_agent"
            ),
        },
    }

    # asyncio.to_thread releases the event loop while the blocking call runs
    result = await asyncio.to_thread(fn, state["message"], context)

    return {
        "agent_outputs": [{
            "agent": agent_name,
            "response": result.get("response", ""),
            "citations": result.get("citations", []),
            "tools_used": result.get("tools_used", []),
            "tool_calls": result.get("tool_calls", []),
            "used_vector_search": result.get("used_vector_search", False),
            "workflow_card": result.get("workflow_card"),
        }]
    }


async def run_market_node(state: NexaFiState) -> dict:
    return await _run_agent_async("market_agent", state)

async def run_education_node(state: NexaFiState) -> dict:
    return await _run_agent_async("education_agent", state)

async def run_profile_node(state: NexaFiState) -> dict:
    return await _run_agent_async("profile_agent", state)

async def run_support_node(state: NexaFiState) -> dict:
    return await _run_agent_async("support_agent", state)

async def run_retention_node(state: NexaFiState) -> dict:
    return await _run_agent_async("retention_agent", state)

async def run_fallback_node(state: NexaFiState) -> dict:
    return await _run_agent_async("fallback_agent", state)


# ---------------------------------------------------------------------------
# Node: synthesize (async)
# ---------------------------------------------------------------------------

_SYNTHESIS_PROMPT = """You are Nova, NexaFi's AI investing copilot.

Multiple specialised agents have each answered part of the user's query.
Synthesise their outputs into ONE coherent, well-structured response.

User query: {message}

Agent outputs:
{agent_outputs}

Instructions:
- Combine naturally — do not just concatenate.
- Use markdown headers/bullets to separate distinct topics if needed.
- Keep under 400 words. Cite sources where provided.
- Do not mention "agents" or "synthesis" — just answer the user directly."""


async def synthesize(state: NexaFiState) -> dict:
    outputs = state.get("agent_outputs", [])

    if not outputs:
        return {
            "response": "I wasn't able to process that request. Could you rephrase?",
            "citations": [], "tools_used": [], "tool_calls": [],
            "used_vector_search": False, "workflow_card": None, "agents_used": [],
        }

    if len(outputs) == 1:
        o = outputs[0]
        return {
            "response": o["response"], "citations": o["citations"],
            "tools_used": o["tools_used"], "tool_calls": o["tool_calls"],
            "used_vector_search": o["used_vector_search"],
            "workflow_card": o["workflow_card"], "agents_used": [o["agent"]],
        }

    agent_outputs_text = "\n\n".join(
        f"[{o['agent']}]:\n{o['response']}" for o in outputs
    )
    prompt = _SYNTHESIS_PROMPT.format(
        message=state["message"], agent_outputs=agent_outputs_text
    )

    # Run synthesis LLM + judge KB prefetch concurrently
    async def _prefetch_judge_docs():
        from graphs.judge_node import _retrieve_reference_docs
        return await asyncio.to_thread(
            _retrieve_reference_docs,
            state["message"],
            2,
        )

    synthesis_result, judge_ref_docs = await asyncio.gather(
        _synthesis_llm.ainvoke(prompt),
        _prefetch_judge_docs(),
    )

    all_citations, all_tools_used, all_tool_calls = [], [], []
    used_vector, primary_card = False, None
    for o in outputs:
        all_citations.extend(o.get("citations", []))
        all_tools_used.extend(o.get("tools_used", []))
        all_tool_calls.extend(o.get("tool_calls", []))
        if o.get("used_vector_search"):
            used_vector = True
        if o.get("workflow_card") and primary_card is None:
            primary_card = o["workflow_card"]

    return {
        "response": synthesis_result.content.strip(),
        "citations": all_citations,
        "tools_used": list(set(all_tools_used)),
        "tool_calls": all_tool_calls,
        "used_vector_search": used_vector,
        "workflow_card": primary_card,
        "agents_used": [o["agent"] for o in outputs],
        "judge_ref_docs": judge_ref_docs,   # pre-fetched for judge node
    }


# ---------------------------------------------------------------------------
# Node: judge (async)
# ---------------------------------------------------------------------------

async def judge(state: NexaFiState) -> dict:
    from graphs.judge_node import judge_response
    # Pass pre-fetched ref docs so judge skips the embedding call
    result = await asyncio.to_thread(
        judge_response,
        state["message"],
        state["response"],
        state.get("judge_retry_count", 0),
        state.get("judge_ref_docs"),   # pre-fetched during synthesize
    )
    return {
        "judge_passed":    result["pass"],
        "judge_scores":    result["scores"],
        "judge_reason":    result["reason"],
        "correction_hint": result["correction_hint"],
    }


def _judge_router(state: NexaFiState) -> str:
    if state.get("judge_passed"):
        return END
    if state.get("judge_retry_count", 0) >= MAX_JUDGE_RETRIES:
        return END
    return "regenerate"


# ---------------------------------------------------------------------------
# Node: regenerate (async)
# ---------------------------------------------------------------------------

_REGENERATE_PROMPT = """You are Nova, NexaFi's AI investing copilot.

A quality judge reviewed your previous response and found it needs improvement.

User query: {message}

Your previous response:
{previous_response}

Judge feedback:
- Reason it failed: {judge_reason}
- Specific correction needed: {correction_hint}
- Scores: groundedness={groundedness}, relevance={relevance}, factual_accuracy={factual_accuracy}, safety={safety}

Rewrite the response addressing the judge's feedback.
Keep it concise (under 400 words), grounded in facts, directly answering the query.
Do not give investment advice or predict prices."""


async def regenerate(state: NexaFiState) -> dict:
    scores = state.get("judge_scores", {})
    prompt = _REGENERATE_PROMPT.format(
        message=state["message"],
        previous_response=state["response"],
        judge_reason=state.get("judge_reason", ""),
        correction_hint=state.get("correction_hint", ""),
        groundedness=scores.get("groundedness", "?"),
        relevance=scores.get("relevance", "?"),
        factual_accuracy=scores.get("factual_accuracy", "?"),
        safety=scores.get("safety", "?"),
    )
    result = await _regenerate_llm.ainvoke(prompt)
    return {
        "response": result.content.strip(),
        "judge_retry_count": state.get("judge_retry_count", 0) + 1,
    }


# ---------------------------------------------------------------------------
# Build the graph
# ---------------------------------------------------------------------------

def build_graph():
    g = StateGraph(NexaFiState)

    g.add_node("parse_intent",       parse_intent)
    g.add_node("run_market_node",    run_market_node)
    g.add_node("run_education_node", run_education_node)
    g.add_node("run_profile_node",   run_profile_node)
    g.add_node("run_support_node",   run_support_node)
    g.add_node("run_retention_node", run_retention_node)
    g.add_node("run_fallback_node",  run_fallback_node)
    g.add_node("synthesize",         synthesize)
    g.add_node("judge",              judge)
    g.add_node("regenerate",         regenerate)

    g.add_edge(START, "parse_intent")
    g.add_conditional_edges("parse_intent", route)

    for node in [
        "run_market_node", "run_education_node", "run_profile_node",
        "run_support_node", "run_retention_node", "run_fallback_node",
    ]:
        g.add_edge(node, "synthesize")

    g.add_edge("synthesize", "judge")
    g.add_conditional_edges("judge", _judge_router)
    g.add_edge("regenerate", "judge")

    return g.compile()


nexafi_graph = build_graph()
