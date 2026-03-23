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
    "JPM", "BAC", "GS", "MS", "V", "MA", "PYPL",
    "DIS", "NFLX", "UBER", "LYFT", "SNAP", "TWTR", "COIN",
}

# Company name → ticker mapping (case-insensitive)
_NAME_TO_TICKER: dict[str, str] = {
    "apple": "AAPL",
    "microsoft": "MSFT",
    "google": "GOOGL",
    "alphabet": "GOOGL",
    "amazon": "AMZN",
    "tesla": "TSLA",
    "nvidia": "NVDA",
    "meta": "META",
    "facebook": "META",
    "netflix": "NFLX",
    "amd": "AMD",
    "intel": "INTC",
    "disney": "DIS",
    "uber": "UBER",
    "paypal": "PYPL",
    "jpmorgan": "JPM",
    "jp morgan": "JPM",
    "goldman": "GS",
    "goldman sachs": "GS",
    "bank of america": "BAC",
    "coinbase": "COIN",
    "snapchat": "SNAP",
    "snap": "SNAP",
    "s&p": "SPY",
    "s&p 500": "SPY",
    "nasdaq": "QQQ",
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
    Checks company name mapping first (case-insensitive), then
    looks for uppercase ticker symbols. Returns None if nothing found.
    """
    lower = text.lower()

    # 1. Check multi-word company names first (longest match wins)
    for name in sorted(_NAME_TO_TICKER, key=len, reverse=True):
        if name in lower:
            return _NAME_TO_TICKER[name]

    # 2. Look for uppercase ticker symbols in the original text
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

# ---------------------------------------------------------------------------
# Response cache — file-backed so it survives uvicorn --reload restarts
# ---------------------------------------------------------------------------

import hashlib
import pickle

# Intent-aware TTL — market data expires fast, education answers last longer
_CACHE_TTL_BY_INTENT = {
    "market_explanation":   60,    # 1 min — live prices change constantly
    "education_basic":      86400, # 24h — "what is a bond" doesn't change
    "support_issue":        3600,  # 1h
    "retention_workflow":   3600,  # 1h
    "profile_transparency": 300,   # 5 min
    "off_topic":            300,   # 5 min
}
_RESPONSE_CACHE_TTL = 300  # default fallback (5 minutes)
_CACHE_DIR = os.path.join(os.path.dirname(__file__), ".response_cache")


def _normalize_message(message: str) -> str:
    """Lowercase, strip punctuation, collapse whitespace for cache key."""
    msg = message.lower().strip()
    msg = re.sub(r"[^\w\s]", "", msg)
    msg = re.sub(r"\s+", " ", msg)
    return msg


def _cache_path(key: str) -> str:
    os.makedirs(_CACHE_DIR, exist_ok=True)
    return os.path.join(_CACHE_DIR, key + ".pkl")


def get_cached_response(message: str) -> dict | None:
    """Return cached agent result for this message, or None if not cached/expired."""
    key = hashlib.md5(_normalize_message(message).encode()).hexdigest()
    path = _cache_path(key)
    try:
        if not os.path.exists(path):
            return None
        with open(path, "rb") as f:
            entry = pickle.load(f)
        if time.time() > entry["expires_at"]:
            os.remove(path)
            return None
        return entry["value"]
    except Exception:
        return None


def set_cached_response(message: str, result: dict, intent: str | None = None) -> None:
    """Persist an agent result to disk cache with intent-aware TTL."""
    key = hashlib.md5(_normalize_message(message).encode()).hexdigest()
    path = _cache_path(key)
    try:
        ttl = _CACHE_TTL_BY_INTENT.get(intent or "", _RESPONSE_CACHE_TTL)
        safe = {k: v for k, v in result.items() if isinstance(v, (str, int, float, bool, list, dict, type(None)))}
        with open(path, "wb") as f:
            pickle.dump({"value": safe, "expires_at": time.time() + ttl}, f)
    except Exception:
        pass  # cache write failure is non-fatal
