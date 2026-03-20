"""
utils.py - Shared helper utilities for NexaFi backend.
"""

import json
import os
import re
import time
import threading
from typing import Any
from functools import wraps

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


# ---------------------------------------------------------------------------
# TTL cache — thread-safe, no external deps
# ---------------------------------------------------------------------------

class _TTLCache:
    """Simple in-process TTL cache. Evicts stale entries on read."""

    def __init__(self):
        self._store: dict[str, tuple[Any, float]] = {}
        self._lock = threading.Lock()

    def get(self, key: str) -> Any:
        with self._lock:
            entry = self._store.get(key)
            if entry is None:
                return None
            value, expires_at = entry
            if time.time() > expires_at:
                del self._store[key]
                return None
            return value

    def set(self, key: str, value: Any, ttl_seconds: int) -> None:
        with self._lock:
            self._store[key] = (value, time.time() + ttl_seconds)

    def clear(self) -> None:
        with self._lock:
            self._store.clear()


_cache = _TTLCache()


def ttl_cache(ttl_seconds: int = 60):
    """
    Decorator that caches a function's return value for `ttl_seconds`.
    Cache key is built from the function name + all positional/keyword args.
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            key = f"{fn.__name__}:{args}:{sorted(kwargs.items())}"
            cached = _cache.get(key)
            if cached is not None:
                return cached
            result = fn(*args, **kwargs)
            # Only cache successful (non-error) results
            if isinstance(result, dict) and result.get("error"):
                return result
            if isinstance(result, list) and result and result[0].get("error"):
                return result
            _cache.set(key, result, ttl_seconds)
            return result
        return wrapper
    return decorator
