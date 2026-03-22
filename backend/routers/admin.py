"""Admin endpoints for platform management.

All routes require the ``X-Admin-Token`` header.
"""

import logging

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from dependencies.auth import require_admin
from dependencies.database import get_db
from models.platform import (
    AuditAction,
    AuditLog,
    Experience,
    Guide,
    Review,
    VerificationStatus,
)
from schemas.platform import (
    AuditLogOut,
    ExperienceCard,
    GuideCard,
    GuideDetail,
    ReviewOut,
)
from services.platform import PlatformService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/admin", tags=["admin"], dependencies=[Depends(require_admin)])


# ---------------------------------------------------------------------------
# Guides
# ---------------------------------------------------------------------------

@router.get("/guides", response_model=list[GuideCard])
async def admin_list_guides(
    status: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    q = select(Guide).options(joinedload(Guide.city)).order_by(Guide.created_at.desc())
    if status:
        q = q.where(Guide.verification_status == status)
    result = await db.execute(q)
    return result.unique().scalars().all()


@router.get("/guides/{guide_id}", response_model=GuideDetail)
async def admin_guide_detail(guide_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Guide)
        .options(
            joinedload(Guide.city),
            joinedload(Guide.experiences),
        )
        .where(Guide.id == guide_id)
    )
    guide = result.unique().scalars().first()
    if not guide:
        raise HTTPException(status_code=404, detail="Guide not found")
    return guide


# ---------------------------------------------------------------------------
# Verification
# ---------------------------------------------------------------------------

@router.post("/guides/{guide_id}/verify")
async def approve_verification(guide_id: str, db: AsyncSession = Depends(get_db)):
    svc = PlatformService(db)
    guide = await svc.set_verification_status(guide_id, VerificationStatus.verified, actor="admin")
    return {"status": "verified", "guide_id": guide.id}


@router.post("/guides/{guide_id}/reject")
async def reject_verification(guide_id: str, db: AsyncSession = Depends(get_db)):
    svc = PlatformService(db)
    guide = await svc.set_verification_status(guide_id, VerificationStatus.rejected, actor="admin")
    return {"status": "rejected", "guide_id": guide.id}


@router.post("/guides/{guide_id}/suspend")
async def suspend_guide(guide_id: str, db: AsyncSession = Depends(get_db)):
    svc = PlatformService(db)
    guide = await svc.set_verification_status(guide_id, VerificationStatus.suspended, actor="admin")
    return {"status": "suspended", "guide_id": guide.id}


# ---------------------------------------------------------------------------
# Experiences
# ---------------------------------------------------------------------------

@router.get("/experiences", response_model=list[ExperienceCard])
async def admin_list_experiences(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Experience)
        .options(joinedload(Experience.guide), joinedload(Experience.city))
        .order_by(Experience.created_at.desc())
    )
    return result.unique().scalars().all()


@router.delete("/experiences/{experience_id}")
async def admin_delete_experience(experience_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Experience).where(Experience.id == experience_id))
    exp = result.scalar_one_or_none()
    if not exp:
        raise HTTPException(status_code=404, detail="Experience not found")
    await db.delete(exp)
    await db.commit()
    return {"deleted": True}


# ---------------------------------------------------------------------------
# Reviews
# ---------------------------------------------------------------------------

@router.get("/reviews", response_model=list[ReviewOut])
async def admin_list_reviews(
    flagged: bool | None = None,
    db: AsyncSession = Depends(get_db),
):
    q = select(Review).order_by(Review.created_at.desc()).limit(200)
    if flagged is not None:
        q = q.where(Review.is_flagged == flagged)
    result = await db.execute(q)
    return result.scalars().all()


@router.post("/reviews/{review_id}/flag")
async def flag_review(review_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Review).where(Review.id == review_id))
    review = result.scalar_one_or_none()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    review.is_flagged = True
    review.is_published = False
    await db.commit()
    return {"flagged": True}


# ---------------------------------------------------------------------------
# Audit log
# ---------------------------------------------------------------------------

@router.get("/audit", response_model=list[AuditLogOut])
async def audit_log(
    limit: int = Query(100, le=500),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit)
    )
    return result.scalars().all()
