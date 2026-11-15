"""
ProfileGuard – SQLAlchemy ORM models.

All tables live here so Alembic can auto-detect them from a single import.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    CHAR,
    Column,
    DateTime,
    Float,
    ForeignKey,
    JSON,
    String,
    Text,
    TypeDecorator,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID as PG_UUID
from sqlalchemy.orm import relationship

from app.database import Base


class GUID(TypeDecorator):
    """Platform-independent GUID/UUID type.
    Uses PostgreSQL native UUID, otherwise CHAR(36).
    Accepts both uuid.UUID and str.
    """
    impl = CHAR(36)
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(PG_UUID(as_uuid=True))
        return dialect.type_descriptor(CHAR(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if dialect.name == "postgresql":
            if isinstance(value, uuid.UUID):
                return value
            return uuid.UUID(str(value))
        if isinstance(value, uuid.UUID):
            return str(value)
        return str(uuid.UUID(str(value)))

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, uuid.UUID):
            return value
        return uuid.UUID(str(value))


JsonType = JSON().with_variant(JSONB, "postgresql")


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _new_uuid():
    return uuid.uuid4()


# ---------------------------------------------------------------------------
# platform_account
# ---------------------------------------------------------------------------
class PlatformAccount(Base):
    __tablename__ = "platform_account"

    id = Column(GUID, primary_key=True, default=_new_uuid)
    platform = Column(String(64), nullable=False, index=True)
    handle = Column(String(255), nullable=False, index=True)
    profile_url = Column(Text, nullable=True)
    first_seen = Column(DateTime(timezone=True), default=_utcnow)
    raw_json = Column(JsonType, nullable=True)
    created_at = Column(DateTime(timezone=True), default=_utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow, nullable=False)

    assessments = relationship("Assessment", back_populates="account", lazy="selectin")
    evidence_items = relationship("Evidence", back_populates="account", lazy="selectin")


# ---------------------------------------------------------------------------
# assessment
# ---------------------------------------------------------------------------
class Assessment(Base):
    __tablename__ = "assessment"

    id = Column(GUID, primary_key=True, default=_new_uuid)
    account_id = Column(GUID, ForeignKey("platform_account.id"), nullable=False)
    score = Column(Float, nullable=False)
    band = Column(String(16), nullable=False)  # HIGH / MEDIUM / LOW
    features_json = Column(JsonType, nullable=True)
    model_version = Column(String(64), nullable=True)
    created_at = Column(DateTime(timezone=True), default=_utcnow, nullable=False)

    account = relationship("PlatformAccount", back_populates="assessments")
    takedown_cases = relationship("TakedownCase", back_populates="assessment", lazy="selectin")


# ---------------------------------------------------------------------------
# takedown_case
# ---------------------------------------------------------------------------
class TakedownCase(Base):
    __tablename__ = "takedown_case"

    id = Column(GUID, primary_key=True, default=_new_uuid)
    assessment_id = Column(GUID, ForeignKey("assessment.id"), nullable=False)
    status = Column(
        String(32),
        nullable=False,
        default="draft",
        index=True,
    )  # draft / submitted / platform_review / resolved / escalated / appealed
    notice_ref = Column(String(128), nullable=True)
    sla_due_at = Column(DateTime(timezone=True), nullable=True)
    outcome = Column(String(64), nullable=True)
    analyst_id = Column(GUID, ForeignKey("user_analyst.id"), nullable=True)
    nodal_officer_id = Column(GUID, ForeignKey("user_analyst.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=_utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow, nullable=False)

    assessment = relationship("Assessment", back_populates="takedown_cases")
    analyst = relationship("UserAnalyst", foreign_keys=[analyst_id])
    nodal_officer = relationship("UserAnalyst", foreign_keys=[nodal_officer_id])


# ---------------------------------------------------------------------------
# evidence
# ---------------------------------------------------------------------------
class Evidence(Base):
    __tablename__ = "evidence"

    id = Column(GUID, primary_key=True, default=_new_uuid)
    account_id = Column(GUID, ForeignKey("platform_account.id"), nullable=False)
    file_path = Column(Text, nullable=True)
    screenshot_hash = Column(String(128), nullable=True)
    content_type = Column(String(64), nullable=True)
    captured_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=_utcnow, nullable=False)

    account = relationship("PlatformAccount", back_populates="evidence_items")


# ---------------------------------------------------------------------------
# user_analyst
# ---------------------------------------------------------------------------
class UserAnalyst(Base):
    __tablename__ = "user_analyst"

    id = Column(GUID, primary_key=True, default=_new_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(32), nullable=False, default="viewer")
    unit = Column(String(128), nullable=True)
    totp_secret = Column(String(64), nullable=True)
    twofa_enabled = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=_utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow, nullable=False)


# ---------------------------------------------------------------------------
# audit_log
# ---------------------------------------------------------------------------
class AuditLog(Base):
    __tablename__ = "audit_log"

    id = Column(GUID, primary_key=True, default=_new_uuid)
    actor_id = Column(GUID, ForeignKey("user_analyst.id"), nullable=True)
    action = Column(String(128), nullable=False)
    details = Column(JsonType, nullable=True)
    prev_hash = Column(String(128), nullable=True)
    this_hash = Column(String(128), nullable=False)
    created_at = Column(DateTime(timezone=True), default=_utcnow, nullable=False)

    actor = relationship("UserAnalyst", foreign_keys=[actor_id])
