"""
ProfileGuard – TOTP-based two-factor authentication.

Uses ``pyotp`` to generate and verify time-based one-time passwords.
"""

from __future__ import annotations

import pyotp
from pydantic import BaseModel


class TOTPSetupResponse(BaseModel):
    """Returned when a user sets up 2FA."""
    secret: str
    provisioning_uri: str


def generate_totp_secret() -> str:
    """Generate a new random TOTP secret."""
    return pyotp.random_base32()


def get_provisioning_uri(secret: str, email: str) -> str:
    """Build an ``otpauth://`` URI for QR-code display."""
    totp = pyotp.TOTP(secret)
    return totp.provisioning_uri(name=email, issuer_name="ProfileGuard")


def setup_totp(email: str) -> TOTPSetupResponse:
    """Create a new TOTP secret and return setup information."""
    secret = generate_totp_secret()
    uri = get_provisioning_uri(secret, email)
    return TOTPSetupResponse(secret=secret, provisioning_uri=uri)


def verify_totp(secret: str, code: str, valid_window: int = 1) -> bool:
    """
    Verify a TOTP code against the secret.

    ``valid_window`` allows ±N 30-second windows to account for clock drift.
    """
    totp = pyotp.TOTP(secret)
    return totp.verify(code, valid_window=valid_window)
