"""
ProfileGuard – Secrets loader.

Loads secrets from ``.env`` (default) or optionally from HashiCorp Vault
when ``VAULT_ADDR`` and ``VAULT_TOKEN`` are configured.
"""

from __future__ import annotations

import logging
from typing import Optional

from app.config import settings

logger = logging.getLogger(__name__)


def _load_from_vault(key: str) -> Optional[str]:
    """
    Attempt to read *key* from HashiCorp Vault KV v2 engine at
    ``secret/data/profileguard``.

    Returns ``None`` if Vault is not configured or the key is missing.
    """
    if not settings.vault_addr or not settings.vault_token:
        return None

    try:
        import requests  # deferred – only needed when Vault is enabled

        url = f"{settings.vault_addr}/v1/secret/data/profileguard"
        headers = {"X-Vault-Token": settings.vault_token}
        resp = requests.get(url, headers=headers, timeout=5)
        resp.raise_for_status()
        data = resp.json().get("data", {}).get("data", {})
        return data.get(key)
    except Exception:
        logger.warning("Vault lookup failed for key '%s'; falling back to .env", key)
        return None


def get_secret(key: str, default: Optional[str] = None) -> Optional[str]:
    """
    Retrieve a secret by *key*.

    Resolution order:
    1. HashiCorp Vault (if configured)
    2. Environment / ``.env`` via ``settings``
    3. Provided *default*

    Usage::

        jwt = get_secret("jwt_secret")
    """
    # 1. Vault
    vault_value = _load_from_vault(key)
    if vault_value is not None:
        return vault_value

    # 2. Settings / .env
    env_value = getattr(settings, key, None)
    if env_value is not None:
        return str(env_value)

    # 3. Default
    return default
