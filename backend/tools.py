"""
tools.py - Deterministic tool functions for NexaFi.
All tools call real external APIs (Finnhub for market data).
Falls back to local JSON only if FINNHUB_API_KEY is not set (dev convenience).
"""

import os
import httpx
from datetime import datetime, timedelta
from typing import Any

from config import FINNHUB_API_KEY, DATA_DIR
from utils import load_json

_FINNHUB_BASE = "https://finnhub.io/api/v1"


# ---------------------------------------------------------------------------
# Internal HTTP helper
# ---------------------------------------------------------------------------

def _finnhub_get(path: str, params: dict) -> dict | list:
    """Synchronous Finnhub GET. Raises on non-200."""
    params["token"] = FINNHUB_API_KEY
    with httpx.Client(timeout=10) as client:
        resp = client.get(f"{_FINNHUB_BASE}{path}", params=params)
        resp.raise_for_status()
        return resp.json()


def _date_range(time_range: str) -> tuple[str, str]:
    """Convert a time_range code to (from_date, to_date) strings YYYY-MM-DD."""
    to_dt = datetime.utcnow()
    delta_map = {"1d": 1, "1w": 7, "1m": 30, "1y": 365}
    days = delta_map.get(time_range, 7)
    from_dt = to_dt - timedelta(days=days)
    return from_dt.strftime("%Y-%m-%d"), to_dt.strftime("%Y-%m-%d")


# ---------------------------------------------------------------------------
# Market tools
# ---------------------------------------------------------------------------

def get_market_snapshot(symbol: str, time_range: str = "1w") -> dict[str, Any]:
    """
    Fetch a real-time price quote for a ticker via Finnhub.
    Endpoint: GET /quote
    """
    if not FINNHUB_API_KEY:
        return _mock_snapshot(symbol, time_range)

    try:
        data = _finnhub_get("/quote", {"symbol": symbol.upper()})
        return {
            "symbol": symbol.upper(),
            "time_range": time_range,
            "current_price": data.get("c"),          # current price
            "open_price": data.get("o"),              # open
            "high_price": data.get("h"),              # day high
            "low_price": data.get("l"),               # day low
            "prev_close": data.get("pc"),             # previous close
            "change": data.get("d"),                  # change
            "change_pct": data.get("dp"),             # change percent
            "source": "finnhub",
        }
    except Exception as e:
        return {"error": str(e), "symbol": symbol.upper(), "source": "finnhub_error"}


def get_recent_news(symbol: str, time_range: str = "1w", limit: int = 5) -> list[dict]:
    """
    Fetch real company news from Finnhub.
    Endpoint: GET /company-news
    """
    if not FINNHUB_API_KEY:
        return _mock_news(symbol, limit)

    from_date, to_date = _date_range(time_range)
    try:
        articles = _finnhub_get("/company-news", {
            "symbol": symbol.upper(),
            "from": from_date,
            "to": to_date,
        })
        results = []
        for a in articles[:limit]:
            results.append({
                "id": str(a.get("id", "")),
                "symbol": symbol.upper(),
                "title": a.get("headline", ""),
                "source": a.get("source", ""),
                "url": a.get("url", ""),
                "published_date": datetime.utcfromtimestamp(a.get("datetime", 0)).strftime("%Y-%m-%d"),
                "summary": a.get("summary", ""),
            })
        return results
    except Exception as e:
        return [{"error": str(e), "source": "finnhub_error"}]


# ---------------------------------------------------------------------------
# User / profile tools
# ---------------------------------------------------------------------------

def get_user_profile(user_id: str) -> dict[str, Any] | None:
    """
    Fetch user profile from local store.
    In production: query your users table / auth provider.
    """
    profiles = load_json(os.path.join(DATA_DIR, "mock_profiles.json"))
    for profile in profiles:
        if profile["user_id"] == user_id:
            return profile
    return None


# ---------------------------------------------------------------------------
# Support tools
# ---------------------------------------------------------------------------

def get_support_playbook(issue_type: str) -> dict[str, Any] | None:
    """Return the troubleshooting playbook for a given support issue type."""
    docs = load_json(os.path.join(DATA_DIR, "support_kb.json"))
    for doc in docs:
        if doc.get("issue_type") == issue_type:
            return doc.get("playbook")
    return docs[0].get("playbook") if docs else None


# ---------------------------------------------------------------------------
# Retention tools
# ---------------------------------------------------------------------------

def log_churn_reason(user_id: str, reason: str) -> dict[str, str]:
    """
    Log a churn signal. In production: write to DB + trigger CRM workflow.
    """
    print(f"[CHURN LOG] user_id={user_id} reason={reason!r}")
    return {"status": "logged", "user_id": user_id, "reason": reason}


# ---------------------------------------------------------------------------
# Local fallbacks (used only when API key is missing — dev mode)
# ---------------------------------------------------------------------------

def _mock_snapshot(symbol: str, time_range: str) -> dict[str, Any]:
    mock = {
        "NVDA": {"current_price": 842.50, "change_pct": -4.2},
        "AAPL": {"current_price": 172.30, "change_pct": -1.8},
        "TSLA": {"current_price": 178.90, "change_pct": -6.1},
        "MSFT": {"current_price": 415.20, "change_pct": 0.4},
        "SPY":  {"current_price": 512.40, "change_pct": -1.2},
    }
    d = mock.get(symbol.upper(), {"current_price": 100.0, "change_pct": 0.0})
    return {"symbol": symbol.upper(), "time_range": time_range, "source": "local_fallback", **d}


def _mock_news(symbol: str, limit: int) -> list[dict]:
    all_news = load_json(os.path.join(DATA_DIR, "market_news.json"))
    relevant = [n for n in all_news if n.get("symbol", "").upper() == symbol.upper()]
    return (relevant or all_news)[:limit]
