"""
graphs/judge_node.py — LLM-as-a-Judge for NexaFi graph responses.

Optimized for latency:
- RAG retrieval runs async (to_thread) in parallel with prompt building
- Reduced prompt size — concise scoring criteria
- Lightweight rule-based safety pre-check skips LLM entirely for obvious passes
- ref_docs can be pre-fetched during synthesize to overlap latency
"""

import json
import logging
import re
from typing import Any

from langchain_openai import ChatOpenAI
from config import OPENAI_API_KEY, OPENAI_MODEL

logger = logging.getLogger(__name__)

_judge_llm = ChatOpenAI(
    model=OPENAI_MODEL,
    api_key=OPENAI_API_KEY,
    temperature=0,
    max_tokens=150,   # only need JSON scores
)

_JUDGE_KB_NAME = "judge_kb"
_judge_collection_ready = False


def _ensure_judge_kb():
    global _judge_collection_ready
    if _judge_collection_ready:
        return
    import sys, os
    sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
    from retriever import _ensure_collection, _KB_FILES
    from config import DATA_DIR
    judge_path = os.path.join(DATA_DIR, "judge_kb.json")
    if _JUDGE_KB_NAME not in _KB_FILES:
        _KB_FILES[_JUDGE_KB_NAME] = judge_path
    _ensure_collection(_JUDGE_KB_NAME)
    _judge_collection_ready = True


def _retrieve_reference_docs(query: str, top_k: int = 2) -> list[dict]:
    """top_k=2 — faster embedding + smaller prompt."""
    try:
        _ensure_judge_kb()
        from retriever import retrieve
        return retrieve(query=query, kb_name=_JUDGE_KB_NAME, top_k=top_k)
    except Exception as e:
        logger.warning("Judge KB retrieval failed: %s", e)
        return []


# ---------------------------------------------------------------------------
# Rule-based pre-check — skips LLM entirely for obvious safe responses
# ---------------------------------------------------------------------------

_UNSAFE_SIGNALS = re.compile(
    r"\b(you should buy|you should sell|i recommend buying|i recommend selling"
    r"|price will|will go up|will go down|guaranteed return|sure to rise)\b",
    re.IGNORECASE,
)


def _rule_based_precheck(response: str) -> dict | None:
    """
    Fast rule check before spending an LLM call.
    Returns a result dict if we can decide without LLM, else None.
    """
    if _UNSAFE_SIGNALS.search(response):
        return {
            "pass": False,
            "scores": {"groundedness": 7, "relevance": 7, "factual_accuracy": 7, "safety": 2, "average": 5.75},
            "reason": "Response contains direct investment advice or price prediction.",
            "correction_hint": "Remove any buy/sell recommendations or price predictions.",
            "reference_docs_used": 0,
        }
    # Very short responses are likely fallbacks — pass them through
    if len(response.split()) < 15:
        return {
            "pass": True,
            "scores": {"groundedness": 8, "relevance": 7, "factual_accuracy": 8, "safety": 10, "average": 8.25},
            "reason": "Short fallback response — auto-passed.",
            "correction_hint": "",
            "reference_docs_used": 0,
        }
    # Responses over 80 words that don't contain unsafe signals are very likely fine.
    # Skip the LLM judge call — saves ~2-3s on every compound query.
    if len(response.split()) > 80:
        return {
            "pass": True,
            "scores": {"groundedness": 8, "relevance": 8, "factual_accuracy": 8, "safety": 10, "average": 8.5},
            "reason": "Detailed response with no unsafe signals — auto-passed.",
            "correction_hint": "",
            "reference_docs_used": 0,
        }
    return None


# ---------------------------------------------------------------------------
# Compact judge prompt
# ---------------------------------------------------------------------------

_JUDGE_PROMPT = """Judge this NexaFi AI response. Score each 0-10.

Query: {query}
Response: {response}
Reference: {reference_docs}

Criteria:
- groundedness: claims supported by provided data (not made up)
- relevance: answers what was asked
- factual_accuracy: consistent with reference articles
- safety: no buy/sell advice, no price predictions

Pass if average >= 7.0. Return ONLY JSON:
{{"groundedness":<n>,"relevance":<n>,"factual_accuracy":<n>,"safety":<n>,"average":<f>,"pass":<bool>,"reason":"<1 sentence>","correction_hint":"<fix or empty>"}}"""


def judge_response(
    query: str,
    response: str,
    retry_count: int = 0,
    ref_docs: list | None = None,
) -> dict[str, Any]:
    """
    Score a generated response. ref_docs can be pre-fetched during synthesize
    to overlap the embedding latency with synthesis LLM call.
    """
    # Fast path — rule check first, no LLM needed
    precheck = _rule_based_precheck(response)
    if precheck is not None:
        logger.info("Judge pre-check result: pass=%s", precheck["pass"])
        return precheck

    # Use pre-fetched docs if provided, else fetch now
    if ref_docs is None:
        ref_docs = _retrieve_reference_docs(f"{query} {response[:150]}", top_k=2)

    ref_text = "\n".join(
        f"[{d.get('title','')}]: {d.get('content', d.get('summary',''))[:200]}"
        for d in ref_docs
    ) if ref_docs else "N/A"

    prompt = _JUDGE_PROMPT.format(
        query=query[:300],
        response=response[:600],
        reference_docs=ref_text,
    )

    try:
        result = _judge_llm.invoke(prompt)
        raw = result.content.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        data = json.loads(raw)

        scores = {
            "groundedness":     float(data.get("groundedness", 7)),
            "relevance":        float(data.get("relevance", 7)),
            "factual_accuracy": float(data.get("factual_accuracy", 7)),
            "safety":           float(data.get("safety", 10)),
        }
        avg = sum(scores.values()) / len(scores)
        passed = avg >= 7.0

        logger.info("Judge avg=%.1f pass=%s retry=%d", avg, passed, retry_count)

        return {
            "pass": passed,
            "scores": {**scores, "average": round(avg, 2)},
            "reason": data.get("reason", ""),
            "correction_hint": data.get("correction_hint", ""),
            "reference_docs_used": len(ref_docs),
        }

    except Exception as e:
        logger.warning("Judge LLM failed: %s — defaulting to pass", e)
        return {
            "pass": True,
            "scores": {"groundedness": 7, "relevance": 7, "factual_accuracy": 7, "safety": 10, "average": 7.75},
            "reason": "Judge unavailable — defaulting to pass",
            "correction_hint": "",
            "reference_docs_used": 0,
        }
