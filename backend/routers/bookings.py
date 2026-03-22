import logging

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from dependencies.auth import get_current_guide, get_current_user
from dependencies.database import get_db
from models.bookings import Booking
from models.guides import TourGuide
from schemas.bookings import BookingCreate, BookingResponse, BookingStatusUpdate
from services.bookings import BookingService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/bookings", tags=["bookings"])


@router.get("/", response_model=list[BookingResponse])
async def list_my_bookings(
    status: str | None = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
    guide: TourGuide = Depends(get_current_guide),
    db: AsyncSession = Depends(get_db),
):
    query = select(Booking).where(Booking.guide_id == guide.id)
    if status:
        query = query.where(Booking.status == status)
    query = query.order_by(Booking.tour_date.desc()).offset((page - 1) * per_page).limit(per_page)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/", response_model=BookingResponse, status_code=201)
async def create_booking(data: BookingCreate, db: AsyncSession = Depends(get_db)):
    """Public endpoint - customers create bookings (no auth required)."""
    svc = BookingService(db)
    try:
        return await svc.create_booking(
            tour_id=data.tour_id, customer_name=data.customer_name,
            customer_email=data.customer_email, tour_date=data.tour_date,
            participants_count=data.participants_count, customer_phone=data.customer_phone,
            customer_country=data.customer_country, tour_time=data.tour_time,
            payment_method=data.payment_method, special_requests=data.special_requests,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{booking_id}", response_model=BookingResponse)
async def get_booking(
    booking_id: str,
    guide: TourGuide = Depends(get_current_guide),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Booking).where(and_(Booking.id == booking_id, Booking.guide_id == guide.id))
    )
    booking = result.scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking


@router.patch("/{booking_id}/confirm", response_model=BookingResponse)
async def confirm_booking(
    booking_id: str,
    guide: TourGuide = Depends(get_current_guide),
    db: AsyncSession = Depends(get_db),
):
    svc = BookingService(db)
    try:
        return await svc.confirm_booking(booking_id, guide.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/{booking_id}/complete", response_model=BookingResponse)
async def complete_booking(
    booking_id: str,
    guide: TourGuide = Depends(get_current_guide),
    db: AsyncSession = Depends(get_db),
):
    svc = BookingService(db)
    try:
        return await svc.complete_booking(booking_id, guide.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/{booking_id}/cancel", response_model=BookingResponse)
async def cancel_booking(
    booking_id: str,
    data: BookingStatusUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    svc = BookingService(db)
    try:
        return await svc.cancel_booking(booking_id, "guide", data.cancellation_reason)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/check-availability/{tour_id}")
async def check_availability(
    tour_id: str, tour_date: str, db: AsyncSession = Depends(get_db),
):
    """Public endpoint to check tour availability."""
    from datetime import datetime
    try:
        date = datetime.fromisoformat(tour_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use ISO format.")
    svc = BookingService(db)
    return await svc.check_availability(tour_id, date)
