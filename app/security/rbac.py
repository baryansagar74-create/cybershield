"""
ProfileGuard – Role-Based Access Control (RBAC).

Defines the role hierarchy and a ``require_role`` dependency factory.
"""

from __future__ import annotations

from enum import Enum
from functools import wraps
from typing import List

from fastapi import Depends, HTTPException, status

from app.security.auth import get_current_user


class Role(str, Enum):
    """Supported user roles (ordered by privilege, highest first)."""
    admin = "admin"
    nodal_officer = "nodal_officer"
    analyst = "analyst"
    viewer = "viewer"


# Privilege ranking – lower index = higher privilege.
_ROLE_RANK = {r: idx for idx, r in enumerate(Role)}


def require_role(allowed_roles: List[Role]):
    """
    FastAPI dependency that restricts access to users whose role is in
    *allowed_roles*.

    Usage::

        @router.get("/admin-only", dependencies=[Depends(require_role([Role.admin]))])
        def admin_view(): ...

    Or inject the user directly::

        @router.get("/analyst-up")
        def analyst_view(user=Depends(require_role([Role.admin, Role.analyst]))):
            ...
    """

    def _dependency(current_user=Depends(get_current_user)):
        user_role = current_user.role
        if user_role not in [r.value for r in allowed_roles]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{user_role}' is not permitted. Required: {[r.value for r in allowed_roles]}",
            )
        return current_user

    return _dependency
