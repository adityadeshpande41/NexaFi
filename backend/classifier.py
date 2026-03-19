"""
classifier.py - Intent classification for NexaFi.

Strategy (cheapest-valid-path):
  1. Rule-based keyword matching  →  fast, zero cost, handles ~80% of cases
  2. OpenAI LLM classification    →  for ambiguous messages that rules miss
  3. Heuristic fallback           →  if OpenAI call fails

Each intent maps to a route and a set of capability flags that tell the
orchestrator what resources the downstream agent will need.
"""

import re
import json
from openai import OpenAI
from models import ClassificationResult
from config import OPENAI_API_KEY, OPENAI_MODEL
from utils import normalize_confidence

_openai_client: OpenAI | None = None

def _get_openai() -> OpenAI:
    global _openai_client
    if _openai_client is None:
        _openai_client = OpenAI(api_key=OPENAI_API_KEY)
    return _openai_client

# ---------------------------------------------------------------------------
# Intent → route + capability flags
# ---------------------------------------------------------------------------

INTENT_CONFIG: dict[str, dict] = {
    "education_basic": {
        "route": "direct_answer_path",
        "needs_tools": False,
        "needs_vector_search": True,
        "needs_followup": False,
        "base_confidence": 0.90,
    },
    "market_explanation": {
        "route": "market_context_path",
        "needs_tools": True,
        "needs_vector_search": True,
        "needs_followup": False,
        "base_confidence": 0.88,
    },
    "support_issue": {
        "route": "support_workflow_path",
        "needs_tools": False,
        "needs_vector_search": True,
        "needs_followup": True,
        "base_confidence": 0.85,
    },
    "churn_risk": {
        "route": "retention_workflow_path",
        "needs_tools": False,
        "needs_vector_search": True,
        "needs_followup": True,
        "base_confidence": 0.82,
    },
    "profile_transparency": {
        "route": "profile_state_path",
        "needs_tools": True,
        "needs_vector_search": False,
        "needs_followup": False,
        "base_confidence": 0.92,
    },
    "off_topic": {
        "route": "fallback_path",
        "needs_tools": False,
        "needs_vector_search": False,
        "needs_followup": False,
        "base_confidence": 0.75,
    },
}

# ---------------------------------------------------------------------------
# Keyword rules  (intent → list of regex patterns)
# ---------------------------------------------------------------------------

_RULES: dict[str, list[str]] = {
    "education_basic": [
        r"\bwhat is (a |an |the )?(etf|stock|bond|equity|dividend|index fund|mutual fund|"
        r"roth ira|401k|option|derivative|hedge fund|portfolio|asset|yield|coupon|"
        r"market cap|p\/e|pe ratio|dollar.cost averaging|dca|diversif)",
        r"\bexplain (a |an |the )?(etf|stock|bond|equity|dividend)",
        r"\bhow does? (a |an |the )?(stock market|etf|bond|dividend|compound interest) work",
        r"\bdefine\b.{0,30}\b(invest|stock|bond|etf|equity|fund)\b",
        r"\bteach me\b.{0,40}\b(invest|finance|stock|bond)\b",
    ],
    "market_explanation": [
        r"\bwhy is\b.{0,40}\b(up|down|falling|rising|dropping|surging|crashing|rallying)\b",
        r"\bwhat happened (to|with)\b.{0,30}\b(stock|market|nvda|aapl|tsla|spy|nasdaq|s&p)\b",
        r"\b(nvda|aapl|tsla|msft|googl|amzn|meta|amd|intc|nflx|spy|qqq)\b.{0,30}"
        r"\b(up|down|fall|rise|drop|surge|crash|rally|move|perform)\b",
        r"\bmarket (is |was )?(down|up|falling|rising|volatile|crashing|rallying)\b",
        r"\bwhat.{0,20}(driving|causing|behind).{0,30}(market|stock|price|move|drop|rally)\b",
        r"\bsector (rotation|pullback|selloff|rally)\b",
    ],
    "support_issue": [
        r"\b(error|issue|problem|bug|broken|not working|can.t|cannot|unable to)\b",
        r"\b(link|connect|sync).{0,20}(bank|account|card|plaid)\b",
        r"\b(deposit|transfer|withdrawal).{0,30}(not|missing|pending|stuck|failed|delayed)\b",
        r"\b(login|log in|sign in|password|locked out|access)\b.{0,20}(issue|problem|error|can.t)\b",
        r"\btrade.{0,20}(not|failed|stuck|pending|didn.t)\b",
        r"\bhelp.{0,20}(with|me).{0,20}(account|app|feature)\b",
        r"\bsupport\b",
        r"\bcontact.{0,10}(you|team|someone)\b",
    ],
    "churn_risk": [
        r"\b(don.t|do not|doesn.t|not).{0,20}(like|enjoy|want|need|use)\b.{0,20}(app|nexafi|this|it)\b",
        r"\b(cancel|canceling|cancellation|delete|close).{0,20}(account|subscription|plan)\b",
        r"\b(leave|leaving|quit|quitting|unsubscribe|switching)\b",
        r"\b(hate|terrible|awful|useless|waste|disappointed|frustrat)\b",
        r"\bnot worth\b",
        r"\btoo expensive\b",
        r"\bbetter (app|alternative|option|platform)\b",
    ],
    "profile_transparency": [
        r"\bwhat (do you|are you).{0,30}(know|assuming|think|infer).{0,20}(about me|my profile)\b",
        r"\bwhat assumptions\b",
        r"\bmy (profile|data|information|preferences|settings)\b",
        r"\bwhat.{0,20}(you know|you have|stored|collected).{0,20}(about me|on me)\b",
        r"\bshow me my\b",
        r"\bmy investor profile\b",
    ],
}

_COMPILED_RULES: dict[str, list[re.Pattern]] = {
    intent: [re.compile(p, re.IGNORECASE) for p in patterns]
    for intent, patterns in _RULES.items()
}


def _rule_match(message: str) -> tuple[str | None, float]:
    """
    Try each intent's rules in priority order.
    Returns (intent, confidence) or (None, 0.0) if no match.
    """
    scores: dict[str, int] = {}
    for intent, patterns in _COMPILED_RULES.items():
        hit_count = sum(1 for p in patterns if p.search(message))
        if hit_count > 0:
            scores[intent] = hit_count

    if not scores:
        return None, 0.0

    best_intent = max(scores, key=lambda k: scores[k])
    # Confidence scales with number of pattern hits (capped at 0.97)
    raw_conf = INTENT_CONFIG[best_intent]["base_confidence"] + (scores[best_intent] - 1) * 0.03
    return best_intent, normalize_confidence(raw_conf)


_LLM_CLASSIFY_PROMPT = """You are an intent classifier for NexaFi, an AI investing copilot.

Classify the user message into exactly one of these intents:
- education_basic: user wants to learn a finance concept
- market_explanation: user asks why a stock/market moved
- support_issue: user has a product/account problem
- churn_risk: user is unhappy or wants to leave
- profile_transparency: user asks what the system knows about them
- off_topic: unrelated to finance or the NexaFi product

Respond with ONLY valid JSON in this exact format:
{"intent": "<intent>", "confidence": <0.0-1.0>}"""


def _llm_classify(message: str) -> tuple[str, float]:
    """
    Use OpenAI to classify ambiguous messages that rules didn't catch.
    Falls back to off_topic if the API call fails.
    """
    if not OPENAI_API_KEY:
        return _heuristic_fallback(message)
    try:
        resp = _get_openai().chat.completions.create(
            model=OPENAI_MODEL,
            messages=[
                {"role": "system", "content": _LLM_CLASSIFY_PROMPT},
                {"role": "user", "content": message},
            ],
            temperature=0,
            max_tokens=60,
        )
        raw = resp.choices[0].message.content.strip()
        data = json.loads(raw)
        intent = data.get("intent", "off_topic")
        confidence = float(data.get("confidence", 0.70))
        if intent not in INTENT_CONFIG:
            intent = "off_topic"
        return intent, normalize_confidence(confidence)
    except Exception:
        return _heuristic_fallback(message)


def _heuristic_fallback(message: str) -> tuple[str, float]:
    """Last-resort fallback when both rules and LLM fail."""
    finance_signals = re.compile(
        r"\b(invest|portfolio|market|stock|fund|money|finance|trading|asset|return|profit|loss)\b",
        re.IGNORECASE,
    )
    if finance_signals.search(message):
        return "education_basic", 0.55
    return "off_topic", 0.70


def classify(message: str) -> ClassificationResult:
    """
    Classify the user message into an intent.

    1. Try fast rule matching (free, <1ms)
    2. If no rule match, call OpenAI for classification (~200ms, ~$0.00001)
    3. If OpenAI fails, use heuristic fallback
    """
    intent, confidence = _rule_match(message)

    if intent is None:
        # Rules didn't fire — use LLM for accurate classification
        intent, confidence = _llm_classify(message)

    cfg = INTENT_CONFIG[intent]
    return ClassificationResult(
        intent=intent,
        route=cfg["route"],
        confidence=confidence,
        needs_tools=cfg["needs_tools"],
        needs_vector_search=cfg["needs_vector_search"],
        needs_followup=cfg["needs_followup"],
    )
