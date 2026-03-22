"""Core platform business logic.

Centralises operations that touch multiple models or need audit logging.
"""

import logging
import re
import uuid
from datetime import datetime

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from models.platform import (
    AuditAction,
    AuditLog,
    Booking,
    BookingStatus,
    City,
    Country,
    Experience,
    ExperienceCategory,
    Guide,
    Review,
    VerificationStatus,
)
from schemas.platform import (
    BookingCreate,
    ExperienceCreate,
    ReviewCreate,
    StatsOut,
)

logger = logging.getLogger(__name__)


def _uuid() -> str:
    return str(uuid.uuid4())


def _slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    return re.sub(r"[\s_]+", "-", text)[:270]


class PlatformService:
    def __init__(self, db: Session):
        self.db = db

    # ------------------------------------------------------------------
    # Stats
    # ------------------------------------------------------------------

    def get_stats(self) -> StatsOut:
        countries = (self.db.execute(select(func.count(Country.id)))).scalar() or 0
        cities = (self.db.execute(select(func.count(City.id)))).scalar() or 0
        guides = (self.db.execute(select(func.count(Guide.id)))).scalar() or 0
        experiences = (self.db.execute(select(func.count(Experience.id)))).scalar() or 0
        verified = (
            self.db.execute(
                select(func.count(Guide.id)).where(
                    Guide.verification_status == VerificationStatus.verified
                )
            )
        ).scalar() or 0
        return StatsOut(
            countries=countries,
            cities=cities,
            guides=guides,
            experiences=experiences,
            verified_guides=verified,
        )

    # ------------------------------------------------------------------
    # Verification
    # ------------------------------------------------------------------

    def set_verification_status(
        self,
        guide_id: str,
        status: VerificationStatus,
        actor: str = "system",
    ) -> Guide:
        result = self.db.execute(select(Guide).where(Guide.id == guide_id))
        guide = result.scalar_one_or_none()
        if not guide:
            raise HTTPException(status_code=404, detail="Guide not found")

        old_status = guide.verification_status
        guide.verification_status = status
        self._audit(
            action=(
                AuditAction.verification_approved
                if status == VerificationStatus.verified
                else AuditAction.verification_rejected
                if status == VerificationStatus.rejected
                else AuditAction.verification_submitted
            ),
            actor=actor,
            target_type="guide",
            target_id=guide.id,
            detail=f"{old_status.value} -> {status.value}",
        )
        self.db.commit()
        self.db.refresh(guide)
        return guide

    # ------------------------------------------------------------------
    # Experience CRUD
    # ------------------------------------------------------------------

    def create_experience(self, guide: Guide, payload: ExperienceCreate) -> Experience:
        slug = _slugify(payload.title) + "-" + _uuid()[:8]
        city_id = payload.city_id or guide.city_id
        exp = Experience(
            id=_uuid(),
            guide_id=guide.id,
            city_id=city_id,
            title=payload.title,
            slug=slug,
            description=payload.description,
            category=ExperienceCategory(payload.category) if payload.category else ExperienceCategory.walking_tour,
            duration_minutes=payload.duration_minutes,
            price=payload.price,
            currency=payload.currency,
            max_guests=payload.max_guests,
            languages=payload.languages,
            photo_url=payload.photo_url,
        )
        self.db.add(exp)
        self._audit(
            AuditAction.experience_created,
            actor=guide.full_name,
            target_type="experience",
            target_id=exp.id,
            detail=payload.title,
        )
        self.db.commit()
        self.db.refresh(exp)
        return exp

    # ------------------------------------------------------------------
    # Bookings
    # ------------------------------------------------------------------

    def create_booking(self, payload: BookingCreate) -> Booking:
        result = self.db.execute(
            select(Experience).where(Experience.id == payload.experience_id)
        )
        exp = result.scalar_one_or_none()
        if not exp:
            raise HTTPException(status_code=404, detail="Experience not found")

        total = exp.price * payload.guests_count
        booking = Booking(
            id=_uuid(),
            experience_id=exp.id,
            guide_id=exp.guide_id,
            guest_name=payload.guest_name,
            guest_email=payload.guest_email,
            guest_phone=payload.guest_phone,
            requested_date=payload.requested_date,
            requested_time=payload.requested_time,
            guests_count=payload.guests_count,
            total_price=total,
            currency=exp.currency,
            note=payload.note,
        )
        self.db.add(booking)
        exp.total_bookings = (exp.total_bookings or 0) + 1
        self._audit(
            AuditAction.booking_requested,
            actor=payload.guest_email,
            target_type="booking",
            target_id=booking.id,
            detail=f"{exp.title} on {payload.requested_date}",
        )
        self.db.commit()
        self.db.refresh(booking)
        return booking

    # ------------------------------------------------------------------
    # Reviews
    # ------------------------------------------------------------------

    def create_review(self, payload: ReviewCreate) -> Review:
        result = self.db.execute(
            select(Experience).where(Experience.id == payload.experience_id)
        )
        exp = result.scalar_one_or_none()
        if not exp:
            raise HTTPException(status_code=404, detail="Experience not found")

        review = Review(
            id=_uuid(),
            experience_id=exp.id,
            guide_id=exp.guide_id,
            booking_id=payload.booking_id,
            reviewer_name=payload.reviewer_name,
            rating=max(1, min(5, payload.rating)),
            comment=payload.comment,
        )
        self.db.add(review)

        # update averages
        all_reviews = (
            self.db.execute(
                select(Review.rating).where(Review.experience_id == exp.id)
            )
        ).scalars().all()
        ratings = list(all_reviews) + [review.rating]
        exp.avg_rating = round(sum(ratings) / len(ratings), 2)

        guide_result = self.db.execute(select(Guide).where(Guide.id == exp.guide_id))
        guide = guide_result.scalar_one_or_none()
        if guide:
            guide.total_reviews = (guide.total_reviews or 0) + 1
            guide_reviews = (
                self.db.execute(
                    select(Review.rating).where(Review.guide_id == guide.id)
                )
            ).scalars().all()
            all_guide_ratings = list(guide_reviews) + [review.rating]
            guide.rating = round(sum(all_guide_ratings) / len(all_guide_ratings), 2)

        self._audit(
            AuditAction.review_submitted,
            actor=payload.reviewer_name,
            target_type="review",
            target_id=review.id,
            detail=f"{payload.rating}/5 for {exp.title}",
        )
        self.db.commit()
        self.db.refresh(review)
        return review

    # ------------------------------------------------------------------
    # Audit helper
    # ------------------------------------------------------------------

    def _audit(
        self,
        action: AuditAction,
        actor: str = "system",
        target_type: str = "",
        target_id: str = "",
        detail: str = "",
    ):
        entry = AuditLog(
            id=_uuid(),
            action=action,
            actor=actor,
            target_type=target_type,
            target_id=target_id,
            detail=detail,
        )
        self.db.add(entry)
