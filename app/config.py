"""
ProfileGuard – centralised configuration via pydantic-settings.

All values come from `.env`; see `.env.example` for documentation.
Never hardcode secrets — use this Settings class everywhere.
"""

from __future__ import annotations

from typing import Optional

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables / `.env`."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # --- Project Settings (C1) ---
    app_env: str = Field("dev", description="dev / staging / prod")
    app_base_url: str = Field("http://localhost:8000")
    dashboard_url: str = Field("http://localhost:3000")
    timezone: str = Field("Asia/Kolkata")
    admin_email: str = Field("admin@profileguard.local")
    risk_high: float = Field(0.80, description="Score >= this → HIGH band")
    risk_medium: float = Field(0.50, description="Score >= this → MEDIUM band")
    retention_days: int = Field(365, description="Case-data retention in days")

    # --- Infrastructure (C2) ---
    database_url: str = Field(
        "postgresql://profileguard:profileguard_dev@localhost:5432/profileguard"
    )
    redis_url: str = Field("redis://localhost:6379/0")
    elasticsearch_url: Optional[str] = Field(None)
    jwt_secret: str = Field(
        "CHANGE_ME_INSECURE_DEV_SECRET_DO_NOT_USE_IN_PRODUCTION"  # TODO(user-input)
    )
    jwt_expiry_minutes: int = Field(30)
    smtp_host: str = Field("localhost")
    smtp_port: int = Field(1025)
    smtp_user: Optional[str] = Field(None)
    smtp_password: Optional[str] = Field(None)
    evidence_storage_path: str = Field("./data/evidence")
    vault_addr: Optional[str] = Field(None)
    vault_token: Optional[str] = Field(None)

    # --- Meta: Facebook & Instagram (C3) ---
    meta_app_id: Optional[str] = Field(None)  # TODO(user-input)
    meta_app_secret: Optional[str] = Field(None)  # TODO(user-input)
    meta_long_lived_token: Optional[str] = Field(None)  # TODO(user-input)
    meta_graph_version: str = Field("v21.0")
    ig_viewer_business_id: Optional[str] = Field(None)  # TODO(user-input)
    meta_page_id: Optional[str] = Field(None)

    # --- X / Twitter (C4) ---
    x_bearer_token: Optional[str] = Field(None)  # TODO(user-input)
    x_api_key: Optional[str] = Field(None)
    x_api_secret: Optional[str] = Field(None)
    x_client_id: Optional[str] = Field(None)
    x_api_base: str = Field("https://api.x.com/2")
    x_monthly_credit_budget: Optional[float] = Field(None)

    # --- Telegram (C5) ---
    telegram_bot_token: Optional[str] = Field(None)  # TODO(user-input)
    telegram_api_id: Optional[str] = Field(None)
    telegram_api_hash: Optional[str] = Field(None)

    # --- Reputation & Image Services (C6) ---
    google_safe_browsing_key: Optional[str] = Field(None)  # TODO(user-input)
    virustotal_api_key: Optional[str] = Field(None)  # TODO(user-input)
    google_application_credentials: Optional[str] = Field(None)
    tineye_api_key: Optional[str] = Field(None)

    # --- Blockchain Anchoring (C8, optional) ---
    ledger_type: Optional[str] = Field(None)
    ledger_gateway_url: Optional[str] = Field(None)
    ledger_channel: Optional[str] = Field(None)
    ledger_chaincode: Optional[str] = Field(None)
    ledger_wallet_path: Optional[str] = Field(None)

    # --- Derived helpers ---
    @property
    def is_production(self) -> bool:
        return self.app_env == "prod"


# Singleton instance – import this wherever needed.
settings = Settings()
