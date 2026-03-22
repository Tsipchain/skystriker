"""Guide-authenticated endpoints.

Routes that require a valid ``X-Guide-Id`` header identifying the
currently-logged-in guide.
"""

import logging
import re

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

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
def my_profile(
    guide: Guide = Depends(get_current_guide),
    db: Session = Depends(get_db),
):
    result = db.execute(
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
def update_profile(
    payload: GuideProfileUpdate,
    guide: Guide = Depends(get_current_guide),
    db: Session = Depends(get_db),
):
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(guide, field, value)
    db.commit()
    db.refresh(guide)
    return guide


# ---------------------------------------------------------------------------
# Verification
# ---------------------------------------------------------------------------

@router.post("/verification/submit")
def submit_verification(
    guide: Guide = Depends(get_current_guide),
    db: Session = Depends(get_db),
):
    svc = PlatformService(db)
    updated = svc.set_verification_status(
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
def my_experiences(
    guide: Guide = Depends(get_current_guide),
    db: Session = Depends(get_db),
):
    result = db.execute(
        select(Experience)
        .options(joinedload(Experience.guide), joinedload(Experience.city))
        .where(Experience.guide_id == guide.id)
        .order_by(Experience.created_at.desc())
    )
    return result.unique().scalars().all()


@router.post("/experiences", response_model=ExperienceCard, status_code=201)
def create_experience(
    payload: ExperienceCreate,
    guide: Guide = Depends(get_current_guide),
    db: Session = Depends(get_db),
):
    svc = PlatformService(db)
    return svc.create_experience(guide, payload)


@router.patch("/experiences/{experience_id}", response_model=ExperienceCard)
def update_experience(
    experience_id: str,
    payload: ExperienceUpdate,
    guide: Guide = Depends(get_current_guide),
    db: Session = Depends(get_db),
):
    result = db.execute(
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
    db.commit()
    db.refresh(exp)
    return exp


@router.delete("/experiences/{experience_id}")
def delete_experience(
    experience_id: str,
    guide: Guide = Depends(get_current_guide),
    db: Session = Depends(get_db),
):
    result = db.execute(
        select(Experience).where(
            Experience.id == experience_id,
            Experience.guide_id == guide.id,
        )
    )
    exp = result.scalar_one_or_none()
    if not exp:
        raise HTTPException(status_code=404, detail="Experience not found")
    db.delete(exp)
    db.commit()
    return {"deleted": True}


# ---------------------------------------------------------------------------
# Bookings
# ---------------------------------------------------------------------------

@router.get("/bookings", response_model=list[BookingOut])
def my_bookings(
    guide: Guide = Depends(get_current_guide),
    db: Session = Depends(get_db),
):
    result = db.execute(
        select(Booking)
        .where(Booking.guide_id == guide.id)
        .order_by(Booking.created_at.desc())
    )
    return result.scalars().all()


@router.post("/bookings/{booking_id}/confirm")
def confirm_booking(
    booking_id: str,
    guide: Guide = Depends(get_current_guide),
    db: Session = Depends(get_db),
):
    result = db.execute(
        select(Booking).where(Booking.id == booking_id, Booking.guide_id == guide.id)
    )
    booking = result.scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    booking.status = BookingStatus.confirmed
    db.commit()
    return {"status": "confirmed"}


@router.post("/bookings/{booking_id}/decline")
def decline_booking(
    booking_id: str,
    guide: Guide = Depends(get_current_guide),
    db: Session = Depends(get_db),
):
    result = db.execute(
        select(Booking).where(Booking.id == booking_id, Booking.guide_id == guide.id)
    )
    booking = result.scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    booking.status = BookingStatus.declined
    db.commit()
    return {"status": "declined"}


@router.post("/bookings/{booking_id}/complete")
def complete_booking(
    booking_id: str,
    guide: Guide = Depends(get_current_guide),
    db: Session = Depends(get_db),
):
    result = db.execute(
        select(Booking).where(Booking.id == booking_id, Booking.guide_id == guide.id)
    )
    booking = result.scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    booking.status = BookingStatus.completed
    db.commit()
    return {"status": "completed"}


# ---------------------------------------------------------------------------
# Reviews
# ---------------------------------------------------------------------------

@router.get("/reviews", response_model=list[ReviewOut])
def my_reviews(
    guide: Guide = Depends(get_current_guide),
    db: Session = Depends(get_db),
):
    result = db.execute(
        select(Review)
        .where(Review.guide_id == guide.id)
        .order_by(Review.created_at.desc())
    )
    return result.scalars().all()


@router.post("/reviews/{review_id}/respond")
def respond_to_review(
    review_id: str,
    response_text: str,
    guide: Guide = Depends(get_current_guide),
    db: Session = Depends(get_db),
):
    result = db.execute(
        select(Review).where(Review.id == review_id, Review.guide_id == guide.id)
    )
    review = result.scalar_one_or_none()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    review.guide_response = response_text
    db.commit()
    return {"responded": True}
