"""Admin endpoints for platform management.

All routes require the ``X-Admin-Token`` header or a JWT with admin role.
"""

import logging
import time

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.orm import Session, joinedload
from typing import Optional

from dependencies.auth import require_admin
from dependencies.database import get_db
from models.platform import (
    AuditAction,
    AuditLog,
    Booking,
    BookingStatus,
    Experience,
    Guide,
    Review,
    VerificationStatus,
)
from schemas.platform import (
    AuditLogOut,
    BookingOut,
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
def admin_list_guides(
    status: str | None = None,
    db: Session = Depends(get_db),
):
    q = select(Guide).options(joinedload(Guide.city)).order_by(Guide.created_at.desc())
    if status:
        q = q.where(Guide.verification_status == status)
    result = db.execute(q)
    return result.unique().scalars().all()


@router.get("/guides/{guide_id}", response_model=GuideDetail)
def admin_guide_detail(guide_id: str, db: Session = Depends(get_db)):
    result = db.execute(
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
# Verification (synced with VerifyID + Thronos blockchain)
# ---------------------------------------------------------------------------

class VerificationDecisionRequest(BaseModel):
    notes: str = ""


@router.post("/guides/{guide_id}/verify")
async def approve_verification(
    guide_id: str,
    body: VerificationDecisionRequest = VerificationDecisionRequest(),
    db: Session = Depends(get_db),
):
    from services.verifyid import verifyid_service
    from services.blockchain import thronos_blockchain

    svc = PlatformService(db)
    guide = svc.set_verification_status(guide_id, VerificationStatus.verified, actor="admin")

    # Hash the decision and submit to Thronos blockchain
    ts = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    verification_hash = verifyid_service.hash_verification(
        guide_id=guide.id, guide_email=guide.email,
        decision="verified", verifyid_ref=guide.verifyid_reference or "", timestamp=ts,
    )
    chain_result = thronos_blockchain._submit_to_node(
        thronos_blockchain.node1_url,
        {
            "tx": f"0xVERIF{verification_hash[:16]}",
            "network": "mainnet",
            "verification_data": {
                "type": "guide_verification",
                "guide_id": guide.id,
                "decision": "verified",
                "hash": verification_hash,
                "timestamp": ts,
                "source": "skystriker",
            },
        },
        verification_hash,
    )

    # Sync decision to VerifyID platform
    verifyid_result = await verifyid_service.notify_decision(
        guide_id=guide.id, guide_email=guide.email,
        guide_name=guide.full_name, decision="verified",
        verifyid_ref=guide.verifyid_reference or "", notes=body.notes,
    )

    svc._audit(
        AuditAction.verification_approved, actor="admin",
        target_type="guide", target_id=guide.id,
        detail=f"Verified | blockchain_hash={verification_hash[:16]}… | verifyid_synced={verifyid_result.get('synced', False)}",
    )
    db.commit()

    return {
        "status": "verified",
        "guide_id": guide.id,
        "blockchain_hash": verification_hash,
        "blockchain_submitted": chain_result.get("success", False),
        "verifyid_synced": verifyid_result.get("synced", False),
    }


@router.post("/guides/{guide_id}/reject")
async def reject_verification(
    guide_id: str,
    body: VerificationDecisionRequest = VerificationDecisionRequest(),
    db: Session = Depends(get_db),
):
    from services.verifyid import verifyid_service

    svc = PlatformService(db)
    guide = svc.set_verification_status(guide_id, VerificationStatus.rejected, actor="admin")

    # Sync rejection to VerifyID
    verifyid_result = await verifyid_service.notify_decision(
        guide_id=guide.id, guide_email=guide.email,
        guide_name=guide.full_name, decision="rejected",
        verifyid_ref=guide.verifyid_reference or "", notes=body.notes,
    )

    svc._audit(
        AuditAction.verification_rejected, actor="admin",
        target_type="guide", target_id=guide.id,
        detail=f"Rejected | verifyid_synced={verifyid_result.get('synced', False)} | notes={body.notes}",
    )
    db.commit()

    return {
        "status": "rejected",
        "guide_id": guide.id,
        "verifyid_synced": verifyid_result.get("synced", False),
    }


@router.post("/guides/{guide_id}/suspend")
async def suspend_guide(
    guide_id: str,
    body: VerificationDecisionRequest = VerificationDecisionRequest(),
    db: Session = Depends(get_db),
):
    from services.verifyid import verifyid_service

    svc = PlatformService(db)
    guide = svc.set_verification_status(guide_id, VerificationStatus.suspended, actor="admin")

    verifyid_result = await verifyid_service.notify_decision(
        guide_id=guide.id, guide_email=guide.email,
        guide_name=guide.full_name, decision="suspended",
        verifyid_ref=guide.verifyid_reference or "", notes=body.notes,
    )
    db.commit()

    return {
        "status": "suspended",
        "guide_id": guide.id,
        "verifyid_synced": verifyid_result.get("synced", False),
    }


# ---------------------------------------------------------------------------
# VerifyID cross-platform endpoints
# ---------------------------------------------------------------------------

@router.get("/verifyid/status")
async def verifyid_platform_status():
    """Check VerifyID platform connectivity and agent availability."""
    from services.verifyid import verifyid_service

    agent_info = await verifyid_service.check_agent_available()
    return {
        "verifyid_configured": verifyid_service.available,
        "agent_available": agent_info.get("agent_available", False),
        "online_agents": agent_info.get("count", 0),
    }


@router.get("/verifyid/verifications")
async def list_verifyid_verifications(status: Optional[str] = None):
    """Fetch verification records from the VerifyID platform."""
    from services.verifyid import verifyid_service

    records = await verifyid_service.list_verifications(status=status)
    return {"records": records, "count": len(records)}


# ---------------------------------------------------------------------------
# Experiences
# ---------------------------------------------------------------------------

@router.get("/experiences", response_model=list[ExperienceCard])
def admin_list_experiences(db: Session = Depends(get_db)):
    result = db.execute(
        select(Experience)
        .options(joinedload(Experience.guide), joinedload(Experience.city))
        .order_by(Experience.created_at.desc())
    )
    return result.unique().scalars().all()


@router.delete("/experiences/{experience_id}")
def admin_delete_experience(experience_id: str, db: Session = Depends(get_db)):
    result = db.execute(select(Experience).where(Experience.id == experience_id))
    exp = result.scalar_one_or_none()
    if not exp:
        raise HTTPException(status_code=404, detail="Experience not found")
    db.delete(exp)
    db.commit()
    return {"deleted": True}


# ---------------------------------------------------------------------------
# Reviews
# ---------------------------------------------------------------------------

@router.get("/reviews", response_model=list[ReviewOut])
def admin_list_reviews(
    flagged: bool | None = None,
    db: Session = Depends(get_db),
):
    q = select(Review).order_by(Review.created_at.desc()).limit(200)
    if flagged is not None:
        q = q.where(Review.is_flagged == flagged)
    result = db.execute(q)
    return result.scalars().all()


@router.post("/reviews/{review_id}/flag")
def flag_review(review_id: str, db: Session = Depends(get_db)):
    result = db.execute(select(Review).where(Review.id == review_id))
    review = result.scalar_one_or_none()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    review.is_flagged = True
    review.is_published = False
    db.commit()
    return {"flagged": True}


# ---------------------------------------------------------------------------
# Audit log
# ---------------------------------------------------------------------------

# ---------------------------------------------------------------------------
# Bookings & Payouts
# ---------------------------------------------------------------------------

@router.get("/bookings", response_model=list[BookingOut])
def admin_list_bookings(
    status: str | None = None,
    payout_status: str | None = None,
    db: Session = Depends(get_db),
):
    q = select(Booking).order_by(Booking.created_at.desc()).limit(200)
    if status:
        q = q.where(Booking.status == status)
    if payout_status:
        q = q.where(Booking.payout_status == payout_status)
    result = db.execute(q)
    return result.scalars().all()


@router.post("/bookings/{booking_id}/release-payout")
def release_payout(booking_id: str, db: Session = Depends(get_db)):
    """Admin releases payout to guide – hashes the payout and submits to Thronos blockchain."""
    from services.blockchain import thronos_blockchain

    result = db.execute(
        select(Booking).options(joinedload(Booking.guide)).where(Booking.id == booking_id)
    )
    booking = result.unique().scalars().first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.status != BookingStatus.completed:
        raise HTTPException(status_code=400, detail="Booking must be completed before payout release")

    # Hash & submit to Thronos blockchain
    guide_email = booking.guide.email if booking.guide else "unknown"
    chain_result = thronos_blockchain.submit_payout_to_chain(
        booking_id=booking.id,
        guide_id=booking.guide_id,
        guide_email=guide_email,
        amount=booking.guide_payout,
        currency=booking.currency,
        platform_fee=booking.platform_fee,
    )

    booking.payout_status = "released"
    booking.payout_tx_hash = chain_result.get("tx_hash", "")

    svc = PlatformService(db)
    svc._audit(
        AuditAction.admin_action,
        actor="admin",
        target_type="booking",
        target_id=booking.id,
        detail=(
            f"Payout released: {booking.currency} {booking.guide_payout:.2f} to guide | "
            f"Blockchain hash: {booking.payout_tx_hash[:16]}... | "
            f"Chain submitted: {chain_result['success']}"
        ),
    )
    db.commit()
    return {
        "payout_status": "released",
        "guide_payout": booking.guide_payout,
        "tx_hash": booking.payout_tx_hash,
        "blockchain_submitted": chain_result["success"],
    }


@router.get("/audit", response_model=list[AuditLogOut])
def audit_log(
    limit: int = Query(100, le=500),
    db: Session = Depends(get_db),
):
    result = db.execute(
        select(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit)
    )
    return result.scalars().all()
