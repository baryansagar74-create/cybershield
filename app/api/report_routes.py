"""
ProfileGuard — Reports & Evidence Dossier API Routes
===================================================

Endpoints for exporting PDF evidence dossiers and summary performance metrics.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.cases.pdf_generator import generate_case_pdf
from app.database import get_db
from app.db_models import Assessment, PlatformAccount, TakedownCase, UserAnalyst
from app.security.auth import get_current_user

router = APIRouter(prefix="/reports", tags=["Reports & Analytics"])


@router.get("/evidence-pdf/{case_id}")
def download_evidence_pdf(
    case_id: str,
    current_user: UserAnalyst = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate and download forensic evidence dossier as PDF."""
    case = db.query(TakedownCase).filter(TakedownCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found.")

    assessment = case.assessment
    account = assessment.account

    pdf_bytes = generate_case_pdf(
        case_data={
            "id": str(case.id),
            "notice_ref": case.notice_ref,
            "status": case.status,
            "sla_due_at": case.sla_due_at.isoformat() if case.sla_due_at else "N/A",
        },
        assessment_data={
            "score": assessment.score,
            "band": assessment.band,
            "features_json": assessment.features_json,
        },
        account_data={
            "platform": account.platform,
            "handle": account.handle,
            "profile_url": account.profile_url,
        },
    )

    filename = f"ProfileGuard_Evidence_{case.notice_ref or case_id[:8]}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/weekly")
def get_weekly_report(
    current_user: UserAnalyst = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Aggregate statistics for weekly operational reviews."""
    one_week_ago = datetime.now(timezone.utc) - timedelta(days=7)

    scans_count = db.query(Assessment).filter(Assessment.created_at >= one_week_ago).count()
    high_risk_count = (
        db.query(Assessment)
        .filter(Assessment.created_at >= one_week_ago, Assessment.band == "HIGH")
        .count()
    )
    cases_opened = db.query(TakedownCase).filter(TakedownCase.created_at >= one_week_ago).count()
    cases_resolved = (
        db.query(TakedownCase)
        .filter(TakedownCase.created_at >= one_week_ago, TakedownCase.status == "resolved")
        .count()
    )

    return {
        "period": "Last 7 Days",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "total_scans": scans_count,
        "high_risk_profiles": high_risk_count,
        "takedown_cases_opened": cases_opened,
        "accounts_removed_or_suspended": cases_resolved,
        "action_rate": round(cases_resolved / max(cases_opened, 1), 3),
    }
