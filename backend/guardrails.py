"""
guardrails.py - Input safety and domain relevance checks.

Runs before classification. If a message fails guardrails, the orchestrator
short-circuits and returns a safe response without invoking any agent.
"""

import re
from prompts import GUARDRAIL_UNSAFE_RESPONSE, OFF_TOPIC_RESPONSE

# ---------------------------------------------------------------------------
# Blocked patterns (unsafe / out-of-scope)
# ---------------------------------------------------------------------------

_UNSAFE_PATTERNS: list[str] = [
    r"\bhack\b",
    r"\bexploit\b",
    r"\billegal\b",
    r"\blaunder\b",
    r"\bfraud\b",
    r"\bscam\b",
    r"\binsider trading\b",
    r"\bmanipulate.{0,20}market\b",
]

# Topics clearly outside finance / product scope
_OFF_TOPIC_PATTERNS: list[str] = [
    r"\bweather\b",
    r"\brecipe\b",
    r"\bsports score\b",
    r"\bhoroscope\b",
    r"\bpolitics\b",
    r"\belection\b",
    r"\bcelebrity\b",
    r"\bmovie\b",
    r"\bsong\b",
    r"\blyrics\b",
    r"\brelationship advice\b",
    r"\bmedical advice\b",
    r"\bdiet\b",
    r"\bworkout\b",
]

_UNSAFE_RE = re.compile("|".join(_UNSAFE_PATTERNS), re.IGNORECASE)
_OFF_TOPIC_RE = re.compile("|".join(_OFF_TOPIC_PATTERNS), re.IGNORECASE)


class GuardrailResult:
    """Result of a guardrail check."""

    def __init__(self, passed: bool, reason: str | None = None, response: str | None = None):
        self.passed = passed          # True = safe to proceed
        self.reason = reason          # why it was blocked
        self.response = response      # canned response to return if blocked


def check(message: str) -> GuardrailResult:
    """
    Run all guardrail checks against the user message.

    Returns GuardrailResult with passed=True if the message is safe,
    or passed=False with a canned response if it should be blocked.
    """
    if _UNSAFE_RE.search(message):
        return GuardrailResult(
            passed=False,
            reason="unsafe_content",
            response=GUARDRAIL_UNSAFE_RESPONSE,
        )

    if _OFF_TOPIC_RE.search(message):
        return GuardrailResult(
            passed=False,
            reason="off_topic",
            response=OFF_TOPIC_RESPONSE,
        )

    return GuardrailResult(passed=True)
