"""Auth helpers – supports JWT tokens and legacy X-Guide-Id header."""

import logging

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from dependencies.database import get_db
from models.platform import Guide, User
from services.auth import decode_token

logger = logging.getLogger(__name__)


def get_current_guide(
    authorization: str = Header(default=""),
    x_guide_id: str = Header(default=""),
    db: Session = Depends(get_db),
) -> Guide:
    """Return the guide for the current session.

    Supports:
    1. JWT Bearer token (Authorization header) → resolve user → guide
    2. Legacy X-Guide-Id header (for demo/RoleSwitcher)
    """
    # Try JWT first
    if authorization.startswith("Bearer "):
        token = authorization[7:]
        payload = decode_token(token)
        if payload:
            user = db.execute(
                select(User).where(User.id == payload["sub"])
            ).scalar_one_or_none()
            if user:
                guide = db.execute(
                    select(Guide).where(Guide.user_id == user.id)
                ).scalar_one_or_none()
                if guide:
                    return guide
                logger.warning("Auth: user %s found but no guide record (user_id match)", user.id)
            else:
                logger.warning("Auth: JWT valid but user %s not in DB", payload.get("sub"))
        else:
            logger.warning("Auth: Bearer token present but decode failed")

    # Fallback to X-Guide-Id header
    if x_guide_id:
        guide = db.execute(
            select(Guide).where(Guide.id == x_guide_id)
        ).scalar_one_or_none()
        if guide:
            return guide
        logger.warning("Auth: X-Guide-Id %s not found in DB", x_guide_id)

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required – log in or select a guide",
    )


def require_admin(
    authorization: str = Header(default=""),
    x_admin_token: str = Header(default=""),
    db: Session = Depends(get_db),
) -> bool:
    """Admin gate – supports JWT (role=admin) or legacy static token."""
    # Try JWT
    if authorization.startswith("Bearer "):
        token = authorization[7:]
        payload = decode_token(token)
        if payload and payload.get("role") == "admin":
            return True

    # Legacy token
    if x_admin_token == "skystriker-admin":
        return True

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Admin access required",
    )
