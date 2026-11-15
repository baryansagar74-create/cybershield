"""
ProfileGuard — Takedown Case Management API Routes
==================================================

CRUD endpoints for managing investigations, legal notices, and statutory SLA workflows.
"""

from __future__ import annotations

import uuid
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.audit.hash_chain import create_audit_entry
from app.cases.notice_templates import generate_sahyog_notice
from app.cases.workflow import (
    CaseStatus,
    NoticeTriggerType,
    calculate_sla_due_at,
    get_sla_status,
    validate_status_transition,
)
from app.database import get_db
from app.db_models import Assessment, Evidence, PlatformAccount, TakedownCase, UserAnalyst
from app.security.auth import get_current_user
from app.security.rbac import Role, require_role

router = APIRouter(prefix="/cases", tags=["Takedown Cases"])


class CreateCaseRequest(BaseModel):
    assessment_id: str
    trigger_type: NoticeTriggerType = NoticeTriggerType.URGENT_COMPLAINT
    notes: Optional[str] = None


class UpdateStatusRequest(BaseModel):
    status: CaseStatus
    outcome: Optional[str] = None
    notes: Optional[str] = None


class AttachEvidenceRequest(BaseModel):
    file_path: Optional[str] = None
    screenshot_hash: Optional[str] = None
    content_type: Optional[str] = "image/png"


@router.post("", status_code=status.HTTP_201_CREATED)
def create_case(
    req: CreateCaseRequest,
    current_user: UserAnalyst = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new takedown case from an assessment."""
    assessment = db.query(Assessment).filter(Assessment.id == req.assessment_id).first()
    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Referenced assessment ID does not exist.",
        )

    # Generate reference number e.g. ITBP-PG-2026-UUID
    notice_ref = f"ITBP-PG-{uuid.uuid4().hex[:8].upper()}"
    sla_deadline = calculate_sla_due_at(req.trigger_type)

    case = TakedownCase(
        assessment_id=assessment.id,
        status=CaseStatus.DRAFT.value,
        notice_ref=notice_ref,
        sla_due_at=sla_deadline,
        analyst_id=current_user.id,
    )
    db.add(case)
    db.commit()
    db.refresh(case)

    create_audit_entry(
        db,
        actor_id=current_user.id,
        action="CASE_CREATED",
        details={
            "case_id": str(case.id),
            "notice_ref": notice_ref,
            "sla_due_at": sla_deadline.isoformat(),
        },
    )

    return {
        "id": str(case.id),
        "notice_ref": notice_ref,
        "status": case.status,
        "sla_due_at": sla_deadline.isoformat(),
    }


@router.get("")
def list_cases(
    status_filter: Optional[str] = Query(None, alias="status"),
    limit: int = Query(50, ge=1, le=200),
    current_user: UserAnalyst = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List takedown cases with SLA status."""
    query = db.query(TakedownCase, Assessment, PlatformAccount).join(
        Assessment, TakedownCase.assessment_id == Assessment.id
    ).join(
        PlatformAccount, Assessment.account_id == PlatformAccount.id
    )

    if status_filter:
        query = query.filter(TakedownCase.status == status_filter)

    records = query.order_by(desc(TakedownCase.created_at)).limit(limit).all()

    results = []
    for case, ass, acc in records:
        sla_info = get_sla_status(case.sla_due_at)
        results.append(
            {
                "id": str(case.id),
                "notice_ref": case.notice_ref,
                "status": case.status,
                "platform": acc.platform,
                "handle": acc.handle,
                "risk_score": ass.score,
                "risk_band": ass.band,
                "sla_due_at": case.sla_due_at.isoformat() if case.sla_due_at else None,
                "sla_hours_remaining": sla_info["hours_remaining"],
                "is_sla_breached": sla_info["is_breached"],
                "outcome": case.outcome,
                "created_at": case.created_at.isoformat(),
            }
        )
    return results


@router.get("/{case_id}")
def get_case(
    case_id: str,
    current_user: UserAnalyst = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve full details for an individual case."""
    case = db.query(TakedownCase).filter(TakedownCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found.")

    assessment = case.assessment
    account = assessment.account
    sla_info = get_sla_status(case.sla_due_at)

    evidence_list = db.query(Evidence).filter(Evidence.account_id == account.id).all()

    return {
        "id": str(case.id),
        "notice_ref": case.notice_ref,
        "status": case.status,
        "outcome": case.outcome,
        "sla_due_at": case.sla_due_at.isoformat() if case.sla_due_at else None,
        "sla_info": sla_info,
        "account": {
            "id": str(account.id),
            "platform": account.platform,
            "handle": account.handle,
            "profile_url": account.profile_url,
            "first_seen": account.first_seen.isoformat() if account.first_seen else None,
            "raw_json": account.raw_json,
        },
        "assessment": {
            "id": str(assessment.id),
            "score": assessment.score,
            "band": assessment.band,
            "features": assessment.features_json,
            "model_version": assessment.model_version,
            "created_at": assessment.created_at.isoformat(),
        },
        "evidence": [
            {
                "id": str(e.id),
                "file_path": e.file_path,
                "screenshot_hash": e.screenshot_hash,
                "captured_at": e.captured_at.isoformat() if e.captured_at else None,
            }
            for e in evidence_list
        ],
        "created_at": case.created_at.isoformat(),
    }


@router.patch("/{case_id}/status")
def update_case_status(
    case_id: str,
    req: UpdateStatusRequest,
    current_user: UserAnalyst = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Transition case status and record in audit chain."""
    case = db.query(TakedownCase).filter(TakedownCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found.")

    if not validate_status_transition(case.status, req.status.value):
        raise HTTPException(
            status_code=400,
            detail=f"Illegal state transition from '{case.status}' to '{req.status.value}'.",
        )

    prev_status = case.status
    case.status = req.status.value
    if req.outcome:
        case.outcome = req.outcome

    if req.status == CaseStatus.SUBMITTED and not case.nodal_officer_id:
        case.nodal_officer_id = current_user.id

    db.commit()

    create_audit_entry(
        db,
        actor_id=current_user.id,
        action="CASE_STATUS_UPDATED",
        details={
            "case_id": case_id,
            "from_status": prev_status,
            "to_status": req.status.value,
            "outcome": req.outcome,
            "notes": req.notes,
        },
    )

    return {"message": "Status updated successfully", "status": case.status}


@router.post("/{case_id}/generate-notice")
def get_notice_draft(
    case_id: str,
    current_user: UserAnalyst = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Generate standard Section 79(3)(b) notice package ready for Sahyog submission.
    NOTE: CONFIRM WITH LEGAL before dispatch.
    """
    case = db.query(TakedownCase).filter(TakedownCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found.")

    account = case.assessment.account

    notice_pkg = generate_sahyog_notice(
        case_ref=case.notice_ref or f"ITBP-PG-{case_id[:8]}",
        target_platform=account.platform,
        target_handle=account.handle,
        target_url=account.profile_url or f"https://{account.platform}.com/{account.handle}",
        impersonated_entity="Indo-Tibetan Border Police (ITBP) / Ministry of Home Affairs",
        nodal_officer_name=current_user.name,
        nodal_officer_unit=current_user.unit or "ITBP Cyber Security Cell",
    )

    return notice_pkg


@router.post("/{case_id}/evidence")
def attach_evidence(
    case_id: str,
    req: AttachEvidenceRequest,
    current_user: UserAnalyst = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Attach screenshot evidence hash to case."""
    case = db.query(TakedownCase).filter(TakedownCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found.")

    account = case.assessment.account
    ev = Evidence(
        account_id=account.id,
        file_path=req.file_path,
        screenshot_hash=req.screenshot_hash,
        content_type=req.content_type,
    )
    db.add(ev)
    db.commit()
    db.refresh(ev)

    create_audit_entry(
        db,
        actor_id=current_user.id,
        action="EVIDENCE_ATTACHED",
        details={"case_id": case_id, "evidence_id": str(ev.id), "hash": req.screenshot_hash},
    )
    return {"message": "Evidence attached", "evidence_id": str(ev.id)}
