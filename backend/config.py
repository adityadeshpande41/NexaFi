"""
config.py - Environment configuration for NexaFi backend.
Copy .env.example to .env and fill in your keys.
"""

import os
from dotenv import load_dotenv

load_dotenv(override=True)  # .env always takes precedence over shell env vars

# --- LLM ---
OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
OPENAI_EMBEDDING_MODEL: str = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")

# --- Market data ---
FINNHUB_API_KEY: str = os.getenv("FINNHUB_API_KEY", "")

# --- Database (pgvector) ---
# Format: postgresql+asyncpg://user:password@host:5432/dbname
DATABASE_URL: str = os.getenv("DATABASE_URL", "")

# --- CORS ---
ALLOWED_ORIGINS: list[str] = os.getenv(
    "ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173"
).split(",")

# --- Data paths ---
DATA_DIR: str = os.path.join(os.path.dirname(__file__), "data")

# --- Validation helpers ---
def require_openai() -> str:
    if not OPENAI_API_KEY:
        raise RuntimeError("OPENAI_API_KEY is not set. Add it to your .env file.")
    return OPENAI_API_KEY

def require_finnhub() -> str:
    if not FINNHUB_API_KEY:
        raise RuntimeError("FINNHUB_API_KEY is not set. Add it to your .env file.")
    return FINNHUB_API_KEY
