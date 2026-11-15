"""
ProfileGuard — Authentication & User Management API Routes
===========================================================

Routes for login, registration, TOTP 2FA setup/verification, and current user profile.
"""

from __future__ import annotations

import uuid
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.audit.hash_chain import create_audit_entry
from app.database import get_db
from app.db_models import UserAnalyst
from app.security.auth import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)
from app.security.totp import setup_totp, verify_totp

router = APIRouter(prefix="/auth", tags=["Authentication"])


class RegisterRequest(BaseModel):
    email: EmailStr
    name: str
    password: str
    role: str = "analyst"  # admin / nodal_officer / analyst / viewer
    unit: Optional[str] = "ITBP General"


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    twofa_required: bool = False


class TOTPVerifyRequest(BaseModel):
    code: str


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new analyst/officer."""
    existing = db.query(UserAnalyst).filter(UserAnalyst.email == req.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists.",
        )

    user = UserAnalyst(
        email=req.email,
        name=req.name,
        hashed_password=hash_password(req.password),
        role=req.role,
        unit=req.unit,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    create_audit_entry(
        db,
        actor_id=user.id,
        action="USER_REGISTERED",
        details={"email": user.email, "role": user.role},
    )

    return {"message": "User registered successfully", "id": str(user.id)}


@router.post("/login", response_model=TokenResponse)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """Authenticate with email and password; returns JWT token."""
    user = db.query(UserAnalyst).filter(UserAnalyst.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )

    token = create_access_token(user_id=str(user.id), role=user.role)
    create_audit_entry(
        db,
        actor_id=user.id,
        action="USER_LOGIN_SUCCESS",
        details={"email": user.email},
    )

    return TokenResponse(
        access_token=token,
        role=user.role,
        twofa_required=user.twofa_enabled,
    )


@router.post("/2fa/setup")
def init_2fa(
    current_user: UserAnalyst = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate TOTP secret and provisioning URI."""
    setup_info = setup_totp(current_user.email)
    current_user.totp_secret = setup_info.secret
    db.commit()

    return {
        "secret": setup_info.secret,
        "provisioning_uri": setup_info.provisioning_uri,
    }


@router.post("/2fa/verify")
def confirm_2fa(
    req: TOTPVerifyRequest,
    current_user: UserAnalyst = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Verify TOTP code and enable 2FA on account."""
    if not current_user.totp_secret:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="2FA setup not initiated. Call /auth/2fa/setup first.",
        )

    if not verify_totp(current_user.totp_secret, req.code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid 2FA verification code.",
        )

    current_user.twofa_enabled = True
    db.commit()

    create_audit_entry(
        db,
        actor_id=current_user.id,
        action="2FA_ENABLED",
        details={"email": current_user.email},
    )
    return {"message": "Two-factor authentication enabled successfully"}


@router.get("/me")
def get_me(current_user: UserAnalyst = Depends(get_current_user)):
    """Return profile details of currently authenticated user."""
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "name": current_user.name,
        "role": current_user.role,
        "unit": current_user.unit,
        "twofa_enabled": current_user.twofa_enabled,
    }
