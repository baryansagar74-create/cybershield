#!/usr/bin/env python3
"""
ProfileGuard — Database Seeding Script (Synthetic demo accounts & cases)
"""

import sys
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.audit.hash_chain import create_audit_entry
from app.database import Base, SessionLocal, engine
from app.db_models import Assessment, PlatformAccount, TakedownCase, UserAnalyst
from app.security.auth import hash_password


def seed():
    print("Seeding database with synthetic records...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Create Analyst user
        admin = db.query(UserAnalyst).filter(UserAnalyst.email == "analyst@itbp.gov.in").first()
        if not admin:
            admin = UserAnalyst(
                email="analyst@itbp.gov.in",
                name="Inspector Rajesh Kumar",
                hashed_password=hash_password("DevPassword123!"),
                role="analyst",
                unit="ITBP IT & Cyber Cell",
                is_active=True,
            )
            db.add(admin)
            db.flush()

        # 2. Sample Accounts
        samples = [
            {
                "platform": "instagram",
                "handle": "officer_rajesh_8841",
                "score": 0.88,
                "band": "HIGH",
                "status": "submitted",
            },
            {
                "platform": "facebook",
                "handle": "itbp_recruit_2024",
                "score": 0.92,
                "band": "HIGH",
                "status": "platform_review",
            },
            {
                "platform": "x",
                "handle": "bsf.jawan.fan",
                "score": 0.62,
                "band": "MEDIUM",
                "status": "draft",
            },
            {
                "platform": "instagram",
                "handle": "priya.sharma",
                "score": 0.32,
                "band": "LOW",
                "status": None,
            },
        ]

        now = datetime.now(timezone.utc)
        for s in samples:
            acc = db.query(PlatformAccount).filter(PlatformAccount.handle == s["handle"]).first()
            if not acc:
                acc = PlatformAccount(
                    platform=s["platform"],
                    handle=s["handle"],
                    profile_url=f"https://{s['platform']}.com/{s['handle']}",
                    raw_json={"handle": s["handle"]},
                )
                db.add(acc)
                db.flush()

            ass = Assessment(
                account_id=acc.id,
                score=s["score"],
                band=s["band"],
                features_json={"followers": 15, "following": 2500, "username_digit_ratio": 0.4},
                model_version="rf_v1",
            )
            db.add(ass)
            db.flush()

            if s["status"]:
                case = TakedownCase(
                    assessment_id=ass.id,
                    status=s["status"],
                    notice_ref=f"ITBP-PG-{uuid.uuid4().hex[:8].upper()}",
                    sla_due_at=now + timedelta(hours=36),
                    analyst_id=admin.id,
                )
                db.add(case)
                db.flush()

            create_audit_entry(
                db,
                actor_id=admin.id,
                action="SEED_DATA_INSERTED",
                details={"handle": s["handle"], "score": s["score"]},
            )

        db.commit()
        print("Database successfully populated with synthetic demonstration cases.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
