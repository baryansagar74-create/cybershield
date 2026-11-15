"""
Minimal config stub for ML modules.

The authoritative ``app.config`` with the full ``Settings`` class is created by
the core-backend worker.  This stub is only used when that file does not yet
exist so that the ML and feature-extraction modules can be imported and tested
in isolation.
"""

from __future__ import annotations

import os
from pathlib import Path

try:
    from dotenv import load_dotenv
except ImportError:  # pragma: no cover
    load_dotenv = None  # type: ignore[assignment]

# Load .env from project root
_project_root = Path(__file__).resolve().parent.parent
_env_path = _project_root / ".env"
if load_dotenv and _env_path.exists():
    load_dotenv(_env_path)


class _StubSettings:
    """Fallback settings object when pydantic-settings ``Settings`` is not
    available.  Only the keys needed by ML / feature-extraction are exposed."""

    # --- risk thresholds ---
    RISK_HIGH: float = float(os.getenv("RISK_HIGH", "0.80"))
    RISK_MEDIUM: float = float(os.getenv("RISK_MEDIUM", "0.50"))

    # --- model registry ---
    MODEL_REGISTRY_DIR: str = os.getenv(
        "MODEL_REGISTRY_DIR",
        str(_project_root / "app" / "models" / "model_registry"),
    )

    # --- API keys (external services) ---
    GOOGLE_SAFE_BROWSING_KEY: str = os.getenv("GOOGLE_SAFE_BROWSING_KEY", "")
    VIRUSTOTAL_API_KEY: str = os.getenv("VIRUSTOTAL_API_KEY", "")
    GOOGLE_APPLICATION_CREDENTIALS: str = os.getenv(
        "GOOGLE_APPLICATION_CREDENTIALS", ""
    )
    TINEYE_API_KEY: str = os.getenv("TINEYE_API_KEY", "")

    # --- app env ---
    APP_ENV: str = os.getenv("APP_ENV", "dev")


# Try to import the real Settings; fall back to stub
try:
    from app.config import Settings as _RealSettings  # type: ignore[import-untyped]

    settings = _RealSettings()  # type: ignore[call-arg]
except Exception:
    settings = _StubSettings()  # type: ignore[assignment]
