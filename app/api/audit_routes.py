"""
ProfileGuard — Audit Log & Chain Verification API Routes
========================================================

Endpoints for inspecting immutable audit trail and verifying cryptographic chain integrity.
"""

from __future__ import annotations

from typing import Any, Dict, List

from fastapi import APIRouter, Depends, Query
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.audit.hash_chain import verify_chain
from app.database import get_db
from app.db_models import AuditLog, UserAnalyst
from app.security.auth import get_current_user
from app.security.rbac import Role, require_role

router = APIRouter(prefix="/audit", tags=["Audit Log & Evidence Integrity"])


@router.get("/log")
def get_audit_log(
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    current_user: UserAnalyst = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List paginated audit log entries."""
    entries = (
        db.query(AuditLog)
        .order_by(desc(AuditLog.created_at))
        .offset(offset)
        .limit(limit)
        .all()
    )

    return [
        {
            "id": str(e.id),
            "actor_id": str(e.actor_id) if e.actor_id else None,
            "action": e.action,
            "details": e.details,
            "prev_hash": e.prev_hash,
            "this_hash": e.this_hash,
            "created_at": e.created_at.isoformat(),
        }
        for e in entries
    ]


@router.get("/verify")
def verify_audit_integrity(
    current_user: UserAnalyst = Depends(require_role([Role.admin, Role.nodal_officer, Role.analyst])),
    db: Session = Depends(get_db),
):
    """
    Cryptographically verify the SHA-256 hash-chain across all recorded entries.
    Confirms zero evidence tampering in court proceedings.
    """
    result = verify_chain(db)
    return {
        "is_valid": result.get("valid", False),
        "tamper_detected": not result.get("valid", False),
        "total_records": result.get("total", 0),
        "error_count": len(result.get("errors", [])),
        "errors": result.get("errors", [])[:10],
    }
