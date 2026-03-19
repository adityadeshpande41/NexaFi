"""
utils.py - Shared helper utilities for NexaFi backend.
"""

import json
import os
import re
import time
from typing import Any

# Common ticker symbols for extraction heuristics
_TICKER_PATTERN = re.compile(r"\b([A-Z]{1,5})\b")
_KNOWN_TICKERS = {
    "NVDA", "AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "META",
    "AMD", "INTC", "NFLX", "SPY", "QQQ", "BTC", "ETH",
}

# Time-range keywords
_TIME_RANGE_MAP = {
    "today": "1d",
    "yesterday": "1d",
    "this week": "1w",
    "week": "1w",
    "this month": "1m",
    "month": "1m",
    "this year": "1y",
    "year": "1y",
    "ytd": "1y",
}


def extract_ticker(text: str) -> str | None:
    """
    Extract the first recognizable stock ticker from a message.
    Returns None if no known ticker is found.
    """
    candidates = _TICKER_PATTERN.findall(text.upper())
    for c in candidates:
        if c in _KNOWN_TICKERS:
            return c
    return None


def parse_time_range(text: str) -> str:
    """
    Map natural language time references to a short code.
    Defaults to '1w' if nothing is matched.
    """
    lower = text.lower()
    for phrase, code in _TIME_RANGE_MAP.items():
        if phrase in lower:
            return code
    return "1w"


def load_json(path: str) -> Any:
    """Load and return a JSON file. Raises FileNotFoundError if missing."""
    if not os.path.exists(path):
        raise FileNotFoundError(f"Data file not found: {path}")
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def normalize_confidence(raw: float) -> float:
    """Clamp confidence to [0.0, 1.0]."""
    return max(0.0, min(1.0, raw))


def now_ms() -> int:
    """Current time in milliseconds (used for latency tracking)."""
    return int(time.time() * 1000)
