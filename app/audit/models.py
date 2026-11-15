"""
ProfileGuard – Audit-log SQLAlchemy model (re-export from db_models).

Kept here for package-local imports in ``app.audit``.
"""

from app.db_models import AuditLog  # noqa: F401

__all__ = ["AuditLog"]
