"""Lightweight auth helpers.

The platform currently uses a simple demo-token scheme.  A production
deployment would replace this with proper JWT / OAuth.
"""

import logging

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from dependencies.database import get_db
from models.platform import Guide

logger = logging.getLogger(__name__)


async def get_current_guide(
    x_guide_id: str = Header(default=""),
    db: AsyncSession = Depends(get_db),
) -> Guide:
    """Return the guide identified by the ``X-Guide-Id`` header.

    In production this would decode a JWT.  For the initial launch the
    header-based approach lets the frontend switch roles instantly.
    """
    if not x_guide_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing X-Guide-Id header",
        )
    result = await db.execute(select(Guide).where(Guide.id == x_guide_id))
    guide = result.scalar_one_or_none()
    if not guide:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Guide not found",
        )
    return guide


async def require_admin(
    x_admin_token: str = Header(default=""),
) -> bool:
    """Very simple admin gate – expects a static token.

    Replace with real RBAC before going to production.
    """
    if x_admin_token != "skystriker-admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return True
