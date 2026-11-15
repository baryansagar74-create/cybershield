"""
ProfileGuard – Hash-chained audit log.

Every audit entry includes a SHA-256 digest of the previous entry's hash,
forming a tamper-evident chain.  ``verify_chain()`` walks the full chain
and reports any inconsistencies.

Optional ledger anchoring stub is provided for future blockchain integration.
"""

from __future__ import annotations

import hashlib
import json
import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.db_models import AuditLog

logger = logging.getLogger(__name__)

_GENESIS_HASH = "0" * 64  # sentinel for the very first entry


def _format_dt(dt: datetime | str) -> str:
    """Canonical ISO string for deterministic hashing across SQLite/Postgres."""
    if isinstance(dt, str):
        try:
            dt = datetime.fromisoformat(dt)
        except Exception:
            return dt
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    else:
        dt = dt.astimezone(timezone.utc)
    return dt.strftime("%Y-%m-%dT%H:%M:%S.%fZ")


def _normalize_payload(val: Any) -> Any:
    """Recursively normalize dicts, UUIDs, and lists for consistent JSON serialization."""
    if isinstance(val, dict):
        return {k: _normalize_payload(v) for k, v in val.items()}
    elif isinstance(val, (list, tuple)):
        return [_normalize_payload(v) for v in val]
    elif isinstance(val, uuid.UUID):
        return str(val)
    return val


def _compute_hash(
    actor_id: Optional[Any],
    action: str,
    details: Any,
    prev_hash: str,
    created_at: datetime | str,
) -> str:
    """Deterministic SHA-256 over the entry payload."""
    blob = json.dumps(
        {
            "actor_id": str(actor_id) if actor_id else None,
            "action": action,
            "details": _normalize_payload(details),
            "prev_hash": prev_hash,
            "created_at": _format_dt(created_at),
        },
        sort_keys=True,
        default=str,
    )
    return hashlib.sha256(blob.encode("utf-8")).hexdigest()


def create_audit_entry(
    db: Session,
    actor_id: Optional[uuid.UUID | str],
    action: str,
    details: Optional[Dict[str, Any]] = None,
) -> AuditLog:
    """
    Append a new audit-log entry, chaining it to the previous one.
    """
    # Get hash of the most recent entry (or genesis sentinel)
    last_entry = (
        db.query(AuditLog)
        .order_by(desc(AuditLog.created_at))
        .first()
    )
    prev_hash = last_entry.this_hash if last_entry else _GENESIS_HASH

    now = datetime.now(timezone.utc)
    this_hash = _compute_hash(
        actor_id=actor_id,
        action=action,
        details=details,
        prev_hash=prev_hash,
        created_at=now,
    )

    entry = AuditLog(
        actor_id=actor_id,
        action=action,
        details=_normalize_payload(details),
        prev_hash=prev_hash,
        this_hash=this_hash,
        created_at=now,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def verify_chain(db: Session) -> Dict[str, Any]:
    """
    Walk every audit-log row in chronological order and verify the hash chain.

    Returns
    -------
    dict
        ``{"valid": True/False, "total": int, "errors": [...]}``
    """
    entries: List[AuditLog] = (
        db.query(AuditLog).order_by(AuditLog.created_at).all()
    )

    errors: List[Dict[str, Any]] = []
    expected_prev = _GENESIS_HASH

    for entry in entries:
        # Check prev_hash linkage
        if entry.prev_hash != expected_prev:
            errors.append(
                {
                    "entry_id": str(entry.id),
                    "error": "prev_hash mismatch",
                    "expected": expected_prev,
                    "got": entry.prev_hash,
                }
            )

        # Recompute this_hash
        recomputed = _compute_hash(
            actor_id=entry.actor_id,
            action=entry.action,
            details=entry.details,
            prev_hash=entry.prev_hash,
            created_at=entry.created_at,
        )
        if recomputed != entry.this_hash:
            errors.append(
                {
                    "entry_id": str(entry.id),
                    "error": "this_hash mismatch (data tampered?)",
                    "expected": recomputed,
                    "got": entry.this_hash,
                }
            )

        expected_prev = entry.this_hash

    return {
        "valid": len(errors) == 0,
        "total": len(entries),
        "errors": errors,
    }


# ---------------------------------------------------------------------------
# Ledger anchoring stub (optional future integration)
# ---------------------------------------------------------------------------
def anchor_to_ledger(entry: AuditLog) -> Optional[str]:
    """
    Anchor an audit-log entry hash to an external ledger/blockchain.

    Returns the transaction ID if successful, ``None`` otherwise.

    TODO(user-input): Implement when ``LEDGER_TYPE`` is configured.
    """
    from app.config import settings

    if not settings.ledger_type:
        logger.debug("Ledger anchoring not configured — skipping.")
        return None

    # TODO(user-input): Implement ledger submission.
    # Example: submit entry.this_hash to Hyperledger Fabric via LEDGER_GATEWAY_URL.
    logger.info(
        "Ledger anchor stub called for entry %s (hash=%s)",
        entry.id,
        entry.this_hash,
    )
    return None
