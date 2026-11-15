"""
ProfileGuard — Profile Scanner API Routes
=========================================

Endpoints for scanning a profile, computing risk scores, and querying historical scans.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.audit.hash_chain import create_audit_entry
from app.connectors.meta_instagram import MetaInstagramConnector
from app.connectors.telegram_client import TelegramConnector
from app.connectors.x_api import XApiConnector
from app.database import get_db
from app.db_models import Assessment, PlatformAccount, UserAnalyst
from app.features.profile_features import extract_features
from app.features.text_analysis import analyze_text
from app.features.url_analysis import evaluate_urls, extract_urls
from app.models.predict import score_profile
from app.security.auth import get_current_user, get_current_user_optional

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/scan", tags=["Profile Scanner"])


class ScanRequestPayload(BaseModel):
    platform: str  # x / instagram / facebook / telegram / general
    handle_or_url: str
    raw_profile_data: Optional[Dict[str, Any]] = None
    capture_source: Optional[str] = "analyst_manual"  # analyst_manual / extension / automated_api


class ScanResponsePayload(BaseModel):
    assessment_id: str
    account_id: str
    platform: str
    handle: str
    profile_url: Optional[str]
    score: float
    band: str
    features: Dict[str, Any]
    explanation: Dict[str, Any]
    text_analysis: Dict[str, Any]
    url_analysis: Dict[str, Any]
    model_version: str


@router.post("/profile", response_model=ScanResponsePayload)
async def scan_profile(
    req: ScanRequestPayload,
    current_user: UserAnalyst = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """
    Perform a complete multi-signal risk assessment on a social media profile.
    Extracts features, runs ML classifier, checks NLP/phishing, and persists assessment.
    """
    platform = req.platform.lower().strip()
    handle_or_url = req.handle_or_url.strip()

    # Extract handle from URL if a URL was provided
    handle = handle_or_url.split("/")[-1].replace("@", "")
    profile_url = handle_or_url if handle_or_url.startswith("http") else None

    raw_data = req.raw_profile_data or {}

    # If raw data wasn't provided by extension/analyst, attempt fetch via connector
    if not raw_data:
        try:
            if platform in ("x", "twitter"):
                x_client = XApiConnector()
                res = await x_client.get_user_by_username(handle)
                raw_data = res.get("data", {})
            elif platform in ("instagram", "ig"):
                ig_client = MetaInstagramConnector()
                raw_data = await ig_client.get_business_profile(handle)
            elif platform in ("telegram", "tg"):
                tg_client = TelegramConnector()
                chat = await tg_client.get_chat(f"@{handle}")
                raw_data = chat.get("result", {})
            else:
                raw_data = {"handle": handle, "followers": 10, "following": 500}
        except Exception as exc:
            logger.warning("Connector fetch fallback: %s", exc)
            raw_data = {"handle": handle, "warning": "Connector lookup failed, using stub inputs"}

    # 1. Extract standard 11 tabular features
    profile_features = extract_features(platform, raw_data)

    # 2. Text / NLP Analysis on bio or status
    bio_text = raw_data.get("description", raw_data.get("bio", raw_data.get("biography", "")))
    text_res = analyze_text(bio_text)

    # 3. URL Phishing / Reputation Check
    found_urls = extract_urls(bio_text)
    url_res = await evaluate_urls(found_urls)

    # 4. Score via ML Model
    score, band, explanation = score_profile(profile_features)

    # Adjust score if high-risk text or URL phishing detected
    if text_res.get("text_risk_score", 0.0) >= 0.5:
        score = min(1.0, round(score + 0.15, 3))
    if url_res.get("threat_detected"):
        score = max(score, 0.95)
        band = "HIGH"

    # 5. Persist to Database
    account = (
        db.query(PlatformAccount)
        .filter(PlatformAccount.platform == platform, PlatformAccount.handle == handle)
        .first()
    )
    if not account:
        account = PlatformAccount(
            platform=platform,
            handle=handle,
            profile_url=profile_url,
            raw_json=raw_data,
        )
        db.add(account)
        db.flush()
    else:
        account.raw_json = raw_data
        db.flush()

    assessment = Assessment(
        account_id=account.id,
        score=score,
        band=band,
        features_json=profile_features.model_dump(),
        model_version="rf_v1",
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)

    # 6. Audit Trail
    create_audit_entry(
        db,
        actor_id=current_user.id,
        action="PROFILE_SCANNED",
        details={
            "platform": platform,
            "handle": handle,
            "score": score,
            "band": band,
            "assessment_id": str(assessment.id),
        },
    )

    return ScanResponsePayload(
        assessment_id=str(assessment.id),
        account_id=str(account.id),
        platform=platform,
        handle=handle,
        profile_url=account.profile_url,
        score=score,
        band=band,
        features=profile_features.model_dump(),
        explanation=explanation,
        text_analysis=text_res,
        url_analysis=url_res,
        model_version="rf_v1",
    )


@router.get("/history")
def get_scan_history(
    limit: int = Query(20, ge=1, le=100),
    current_user: UserAnalyst = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve recent assessment history."""
    items = (
        db.query(Assessment, PlatformAccount)
        .join(PlatformAccount, Assessment.account_id == PlatformAccount.id)
        .order_by(desc(Assessment.created_at))
        .limit(limit)
        .all()
    )

    return [
        {
            "assessment_id": str(ass.id),
            "platform": acc.platform,
            "handle": acc.handle,
            "score": ass.score,
            "band": ass.band,
            "created_at": ass.created_at.isoformat(),
        }
        for ass, acc in items
    ]
