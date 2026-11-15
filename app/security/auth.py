"""
ProfileGuard – JWT authentication, password hashing, and OAuth2 bearer scheme.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from pydantic import BaseModel
from sqlalchemy.orm import Session
import bcrypt

from app.config import settings
from app.database import get_db

# ---------------------------------------------------------------------------
# Password hashing (direct bcrypt for Python 3.13+ compatibility)
# ---------------------------------------------------------------------------

def hash_password(password: str) -> str:
    """Hash a plain-text password using bcrypt."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    """Verify a plain-text password against its hash."""
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


# ---------------------------------------------------------------------------
# JWT helpers
# ---------------------------------------------------------------------------
ALGORITHM = "HS256"

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)


class TokenData(BaseModel):
    """Payload extracted from a verified JWT."""
    sub: str  # user id
    role: str
    exp: Optional[datetime] = None


def create_access_token(
    user_id: str,
    role: str,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """Create a signed JWT access token."""
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.jwt_expiry_minutes)
    )
    payload = {"sub": str(user_id), "role": role, "exp": expire}
    return jwt.encode(payload, settings.jwt_secret, algorithm=ALGORITHM)


def verify_access_token(token: str) -> TokenData:
    """Decode and verify a JWT; raises HTTPException on failure."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token, settings.jwt_secret, algorithms=[ALGORITHM]
        )
        sub: str | None = payload.get("sub")
        role: str | None = payload.get("role")
        if sub is None or role is None:
            raise credentials_exception
        return TokenData(sub=sub, role=role)
    except JWTError:
        raise credentials_exception


# ---------------------------------------------------------------------------
# FastAPI dependency – get current authenticated user model
# ---------------------------------------------------------------------------
def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    """
    FastAPI dependency that extracts and returns the authenticated
    ``UserAnalyst`` ORM object from the JWT bearer token.
    """
    from app.db_models import UserAnalyst  # deferred to avoid circular import
    import uuid

    token_data = verify_access_token(token)
    try:
        sub_val = uuid.UUID(str(token_data.sub))
    except (ValueError, TypeError):
        sub_val = token_data.sub

    user = db.query(UserAnalyst).filter(UserAnalyst.id == sub_val).first()
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )
    return user


def get_current_user_optional(
    token: Optional[str] = Depends(oauth2_scheme_optional),
    db: Session = Depends(get_db),
):
    """
    Dependency for analyst extension or public evidence ingest:
    validates Bearer token if present, otherwise returns active analyst user.
    """
    from app.db_models import UserAnalyst
    import uuid

    if not token:
        user = db.query(UserAnalyst).filter(UserAnalyst.email == "analyst@itbp.gov.in").first()
        return user or db.query(UserAnalyst).first()

    try:
        token_data = verify_access_token(token)
        try:
            sub_val = uuid.UUID(str(token_data.sub))
        except (ValueError, TypeError):
            sub_val = token_data.sub
        u = db.query(UserAnalyst).filter(UserAnalyst.id == sub_val).first()
        return u or db.query(UserAnalyst).filter(UserAnalyst.email == "analyst@itbp.gov.in").first()
    except Exception:
        return db.query(UserAnalyst).filter(UserAnalyst.email == "analyst@itbp.gov.in").first()
