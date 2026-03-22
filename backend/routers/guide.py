"""Guide-authenticated endpoints.

Routes that require a valid ``X-Guide-Id`` header identifying the
currently-logged-in guide.
"""

import logging
import re

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from dependencies.auth import get_current_guide
from dependencies.database import get_db
from models.platform import (
    Booking,
    BookingStatus,
    Experience,
    Guide,
    Review,
    VerificationStatus,
)
from schemas.platform import (
    BookingOut,
    ExperienceCard,
    ExperienceCreate,
    ExperienceUpdate,
    GuideDetail,
    GuideProfileUpdate,
    ReviewOut,
)
from services.platform import PlatformService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/guide", tags=["guide"])


# ---------------------------------------------------------------------------
# Profile
# ---------------------------------------------------------------------------

@router.get("/me", response_model=GuideDetail)
async def my_profile(
    guide: Guide = Depends(get_current_guide),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Guide)
        .options(
            joinedload(Guide.city),
            joinedload(Guide.experiences).joinedload(Experience.guide),
            joinedload(Guide.experiences).joinedload(Experience.city),
        )
        .where(Guide.id == guide.id)
    )
    return result.unique().scalars().first()


@router.patch("/me", response_model=GuideDetail)
async def update_profile(
    payload: GuideProfileUpdate,
    guide: Guide = Depends(get_current_guide),
    db: AsyncSession = Depends(get_db),
):
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(guide, field, value)
    await db.commit()
    await db.refresh(guide)
    return guide


# ---------------------------------------------------------------------------
# Verification
# ---------------------------------------------------------------------------

@router.post("/verification/submit")
async def submit_verification(
    guide: Guide = Depends(get_current_guide),
    db: AsyncSession = Depends(get_db),
):
    svc = PlatformService(db)
    updated = await svc.set_verification_status(
        guide.id, VerificationStatus.pending, actor=guide.full_name
    )
    return {"status": updated.verification_status.value}


# ---------------------------------------------------------------------------
# Experiences
# ---------------------------------------------------------------------------

def _slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    return re.sub(r"[\s_]+", "-", text)[:270]


@router.get("/experiences", response_model=list[ExperienceCard])
async def my_experiences(
    guide: Guide = Depends(get_current_guide),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Experience)
        .options(joinedload(Experience.guide), joinedload(Experience.city))
        .where(Experience.guide_id == guide.id)
        .order_by(Experience.created_at.desc())
    )
    return result.unique().scalars().all()


@router.post("/experiences", response_model=ExperienceCard, status_code=201)
async def create_experience(
    payload: ExperienceCreate,
    guide: Guide = Depends(get_current_guide),
    db: AsyncSession = Depends(get_db),
):
    svc = PlatformService(db)
    return await svc.create_experience(guide, payload)


@router.patch("/experiences/{experience_id}", response_model=ExperienceCard)
async def update_experience(
    experience_id: str,
    payload: ExperienceUpdate,
    guide: Guide = Depends(get_current_guide),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Experience).where(
            Experience.id == experience_id,
            Experience.guide_id == guide.id,
        )
    )
    exp = result.scalar_one_or_none()
    if not exp:
        raise HTTPException(status_code=404, detail="Experience not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(exp, field, value)
    await db.commit()
    await db.refresh(exp)
    return exp


@router.delete("/experiences/{experience_id}")
async def delete_experience(
    experience_id: str,
    guide: Guide = Depends(get_current_guide),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Experience).where(
            Experience.id == experience_id,
            Experience.guide_id == guide.id,
        )
    )
    exp = result.scalar_one_or_none()
    if not exp:
        raise HTTPException(status_code=404, detail="Experience not found")
    await db.delete(exp)
    await db.commit()
    return {"deleted": True}


# ---------------------------------------------------------------------------
# Bookings
# ---------------------------------------------------------------------------

@router.get("/bookings", response_model=list[BookingOut])
async def my_bookings(
    guide: Guide = Depends(get_current_guide),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Booking)
        .where(Booking.guide_id == guide.id)
        .order_by(Booking.created_at.desc())
    )
    return result.scalars().all()


@router.post("/bookings/{booking_id}/confirm")
async def confirm_booking(
    booking_id: str,
    guide: Guide = Depends(get_current_guide),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Booking).where(Booking.id == booking_id, Booking.guide_id == guide.id)
    )
    booking = result.scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    booking.status = BookingStatus.confirmed
    await db.commit()
    return {"status": "confirmed"}


@router.post("/bookings/{booking_id}/decline")
async def decline_booking(
    booking_id: str,
    guide: Guide = Depends(get_current_guide),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Booking).where(Booking.id == booking_id, Booking.guide_id == guide.id)
    )
    booking = result.scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    booking.status = BookingStatus.declined
    await db.commit()
    return {"status": "declined"}


@router.post("/bookings/{booking_id}/complete")
async def complete_booking(
    booking_id: str,
    guide: Guide = Depends(get_current_guide),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Booking).where(Booking.id == booking_id, Booking.guide_id == guide.id)
    )
    booking = result.scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    booking.status = BookingStatus.completed
    await db.commit()
    return {"status": "completed"}


# ---------------------------------------------------------------------------
# Reviews
# ---------------------------------------------------------------------------

@router.get("/reviews", response_model=list[ReviewOut])
async def my_reviews(
    guide: Guide = Depends(get_current_guide),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Review)
        .where(Review.guide_id == guide.id)
        .order_by(Review.created_at.desc())
    )
    return result.scalars().all()


@router.post("/reviews/{review_id}/respond")
async def respond_to_review(
    review_id: str,
    response_text: str,
    guide: Guide = Depends(get_current_guide),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Review).where(Review.id == review_id, Review.guide_id == guide.id)
    )
    review = result.scalar_one_or_none()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    review.guide_response = response_text
    await db.commit()
    return {"responded": True}
