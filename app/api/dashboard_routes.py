"""
ProfileGuard — Dashboard Analytics API Routes
=============================================

Aggregated statistics and telemetry for the analyst command console.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.cases.workflow import get_sla_status
from app.database import get_db
from app.db_models import Assessment, PlatformAccount, TakedownCase, UserAnalyst
from app.security.auth import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats")
def get_dashboard_stats(
    current_user: UserAnalyst = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Aggregate statistics for summary cards and chart rendering."""
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)

    scanned_today = db.query(Assessment).filter(Assessment.created_at >= today_start).count()
    total_scanned = db.query(Assessment).count()

    high_risk_count = db.query(Assessment).filter(Assessment.band == "HIGH").count()
    medium_risk_count = db.query(Assessment).filter(Assessment.band == "MEDIUM").count()
    low_risk_count = db.query(Assessment).filter(Assessment.band == "LOW").count()

    active_cases = (
        db.query(TakedownCase)
        .filter(TakedownCase.status.in_(["submitted", "platform_review"]))
        .count()
    )
    resolved_cases = db.query(TakedownCase).filter(TakedownCase.status == "resolved").count()

    # Check for SLA breaches or impending deadlines
    cases_with_sla = (
        db.query(TakedownCase)
        .filter(TakedownCase.status.in_(["submitted", "platform_review"]))
        .all()
    )
    breached_count = sum(1 for c in cases_with_sla if get_sla_status(c.sla_due_at)["is_breached"])
    critical_count = sum(1 for c in cases_with_sla if get_sla_status(c.sla_due_at)["is_critical"])

    return {
        "scanned_today": scanned_today,
        "total_scanned": total_scanned,
        "high_risk": high_risk_count,
        "medium_risk": medium_risk_count,
        "low_risk": low_risk_count,
        "active_cases": active_cases,
        "resolved_takedowns": resolved_cases,
        "sla_breached": breached_count,
        "sla_critical": critical_count,
        "risk_distribution": [
            {"name": "High Risk", "value": high_risk_count, "color": "#E53E3E"},
            {"name": "Medium Risk", "value": medium_risk_count, "color": "#DD6B20"},
            {"name": "Low Risk", "value": low_risk_count, "color": "#38A169"},
        ],
    }
