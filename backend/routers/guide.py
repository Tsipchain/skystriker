"""Guide-authenticated endpoints.

Routes that require a valid ``X-Guide-Id`` header identifying the
currently-logged-in guide.
"""

import base64
import logging
import os
import re
import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
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
    VerificationSubmit,
)
from services.platform import PlatformService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/guide", tags=["guide"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


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
# File upload
# ---------------------------------------------------------------------------

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    guide: Guide = Depends(get_current_guide),
):
    """Upload a file (avatar, ID document, selfie, license). Returns the URL."""
    ext = os.path.splitext(file.filename or "file.jpg")[1].lower()
    if ext not in (".jpg", ".jpeg", ".png", ".webp", ".pdf"):
        raise HTTPException(status_code=400, detail="Unsupported file type")
    if file.size and file.size > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")

    filename = f"{guide.id}_{uuid.uuid4().hex[:8]}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)
    url = f"/static/uploads/{filename}"
    return {"url": url}


# ---------------------------------------------------------------------------
# Verification
# ---------------------------------------------------------------------------

@router.post("/verification/submit")
def submit_verification(
    payload: VerificationSubmit,
    guide: Guide = Depends(get_current_guide),
    db: Session = Depends(get_db),
):
    """Submit verification with documents. Calls VerifyID agent if available."""
    if not payload.id_document_url or not payload.selfie_url:
        raise HTTPException(status_code=400, detail="ID document and selfie are required")

    # Store document URLs
    guide.id_document_url = payload.id_document_url
    guide.selfie_url = payload.selfie_url
    if payload.guide_license_url:
        guide.guide_license_url = payload.guide_license_url

    # Attempt VerifyID agent call
    fraud_score = None
    fraud_notes = ""
    verifyid_ref = ""
    try:
        from core.config import settings
        import httpx
        verify_url = settings.verifyid_base_url.rstrip("/")
        resp = httpx.post(
            f"{verify_url}/verify",
            json={
                "guide_id": guide.id,
                "full_name": guide.full_name,
                "id_document_url": payload.id_document_url,
                "selfie_url": payload.selfie_url,
                "guide_license_url": payload.guide_license_url or "",
            },
            timeout=15.0,
        )
        if resp.status_code == 200:
            data = resp.json()
            verifyid_ref = data.get("reference", "")
            fraud_score = data.get("fraud_score")
            fraud_notes = data.get("notes", "")
            logger.info("VerifyID response for guide %s: ref=%s score=%s", guide.id, verifyid_ref, fraud_score)
    except Exception as e:
        # VerifyID agent not available – fall back to manual review by manager
        logger.warning("VerifyID agent unavailable for guide %s: %s – routing to manager", guide.id, e)
        fraud_notes = "VerifyID agent unavailable – routed to manager for manual review"

    guide.verifyid_reference = verifyid_ref
    if fraud_score is not None:
        guide.fraud_score = fraud_score
    guide.fraud_notes = fraud_notes

    svc = PlatformService(db)
    updated = svc.set_verification_status(
        guide.id, VerificationStatus.pending, actor=guide.full_name
    )
    return {
        "status": updated.verification_status.value,
        "verifyid_reference": verifyid_ref,
        "fraud_score": fraud_score,
        "fraud_notes": fraud_notes,
    }


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
    if guide.verification_status != VerificationStatus.verified:
        raise HTTPException(
            status_code=403,
            detail="Only verified guides can create experiences. Please complete verification first.",
        )
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
