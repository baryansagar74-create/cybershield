"""
ProfileGuard — Case Workflow and SLA Tracking
=============================================

Implements the central nodal cell takedown state machine and statutory SLA timers
under the Information Technology (Intermediary Guidelines and Digital Media Ethics Code)
Rules, 2021 as amended in 2026.

All legal timelines and citations are advisory and marked CONFIRM WITH LEGAL.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from enum import Enum
from typing import Any, Dict, Optional


class CaseStatus(str, Enum):
    DRAFT = "draft"
    ANALYST_REVIEW = "analyst_review"
    SUBMITTED = "submitted"                    # Submitted to Central Nodal Cell / Sahyog
    PLATFORM_REVIEW = "platform_review"        # Notice issued to social media platform
    RESOLVED = "resolved"                      # Platform deleted/suspended account
    ESCALATED = "escalated"                    # Escalated to CERT-In / I4C / MLAT / FIR
    APPEALED = "appealed"                      # Counter-notice or appeal filed


class NoticeTriggerType(str, Enum):
    # Timelines per IT Rules 2026 amendments (in force Feb 2026) — CONFIRM WITH LEGAL
    GOVERNMENT_NOTICE_REASONED = "govt_reasoned"   # 3 hours (Rule 3(1)(d) order)
    URGENT_COMPLAINT = "urgent_complaint"           # 36 hours (previously 72h)
    GENERAL_GRIEVANCE = "general_grievance"         # 7 days (previously 15d)
    INTIMATE_IMAGERY = "intimate_imagery"           # 2 hours (Rule 3(2)(b))


# Statutory SLA durations in hours — CONFIRM WITH LEGAL
SLA_HOURS_MAP: Dict[NoticeTriggerType, float] = {
    NoticeTriggerType.GOVERNMENT_NOTICE_REASONED: 3.0,
    NoticeTriggerType.URGENT_COMPLAINT: 36.0,
    NoticeTriggerType.GENERAL_GRIEVANCE: 168.0,  # 7 days * 24
    NoticeTriggerType.INTIMATE_IMAGERY: 2.0,
}


def calculate_sla_due_at(
    trigger_type: NoticeTriggerType = NoticeTriggerType.URGENT_COMPLAINT,
    start_time: Optional[datetime] = None,
) -> datetime:
    """
    Calculate SLA deadline for intermediary response under IT Rules 2026.
    NOTE: CONFIRM WITH LEGAL before citing deadlines in formal court documents.
    """
    base = start_time or datetime.now(timezone.utc)
    hours = SLA_HOURS_MAP.get(trigger_type, 36.0)
    return base + timedelta(hours=hours)


def get_sla_status(sla_due_at: Optional[datetime]) -> Dict[str, Any]:
    """Calculate remaining time and breach status for a case."""
    if not sla_due_at:
        return {"status": "NO_SLA", "hours_remaining": None, "is_breached": False}

    now = datetime.now(timezone.utc)
    delta = sla_due_at - now
    hours_remaining = round(delta.total_seconds() / 3600.0, 2)

    return {
        "status": "BREACHED" if hours_remaining < 0 else "ACTIVE",
        "hours_remaining": hours_remaining,
        "is_breached": hours_remaining < 0,
        "is_critical": 0 <= hours_remaining <= 1.0,  # Less than 1 hour remaining
    }


def validate_status_transition(current: str, target: str) -> bool:
    """Ensure orderly case progression without illegal jumps."""
    allowed = {
        CaseStatus.DRAFT.value: [CaseStatus.ANALYST_REVIEW.value, CaseStatus.SUBMITTED.value],
        CaseStatus.ANALYST_REVIEW.value: [CaseStatus.SUBMITTED.value, CaseStatus.DRAFT.value, CaseStatus.RESOLVED.value],
        CaseStatus.SUBMITTED.value: [CaseStatus.PLATFORM_REVIEW.value, CaseStatus.ESCALATED.value],
        CaseStatus.PLATFORM_REVIEW.value: [CaseStatus.RESOLVED.value, CaseStatus.ESCALATED.value, CaseStatus.APPEALED.value],
        CaseStatus.ESCALATED.value: [CaseStatus.RESOLVED.value],
        CaseStatus.APPEALED.value: [CaseStatus.PLATFORM_REVIEW.value, CaseStatus.RESOLVED.value],
        CaseStatus.RESOLVED.value: [CaseStatus.APPEALED.value],
    }
    return target in allowed.get(current, [])
