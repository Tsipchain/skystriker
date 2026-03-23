"""Guide availability management + public calendar view."""

import logging
from datetime import date, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select, func, and_
from sqlalchemy.orm import Session

from dependencies.auth import get_current_guide
from dependencies.database import get_db
from models.platform import Booking, BookingStatus, Guide, GuideAvailability

logger = logging.getLogger(__name__)
router = APIRouter(tags=["availability"])


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class AvailabilitySlot(BaseModel):
    id: str
    guide_id: str
    date: str
    start_time: str
    end_time: str
    max_bookings: int
    note: str
    is_available: bool

    class Config:
        from_attributes = True


class AvailabilityCreate(BaseModel):
    date: str           # YYYY-MM-DD
    start_time: str = "09:00"
    end_time: str = "18:00"
    max_bookings: int = 3
    note: str = ""
    is_available: bool = True


class AvailabilityBulkCreate(BaseModel):
    dates: list[str]     # list of YYYY-MM-DD
    start_time: str = "09:00"
    end_time: str = "18:00"
    max_bookings: int = 3
    note: str = ""


class CalendarDay(BaseModel):
    date: str
    is_available: bool
    start_time: str = ""
    end_time: str = ""
    spots_left: int = 0


# ---------------------------------------------------------------------------
# Guide endpoints (authenticated)
# ---------------------------------------------------------------------------

@router.get("/api/v1/guide/availability", response_model=list[AvailabilitySlot])
def list_my_availability(
    month: Optional[str] = Query(None, description="YYYY-MM"),
    guide: Guide = Depends(get_current_guide),
    db: Session = Depends(get_db),
):
    stmt = select(GuideAvailability).where(GuideAvailability.guide_id == guide.id)
    if month:
        stmt = stmt.where(
            func.strftime("%Y-%m", GuideAvailability.date) == month
        )
    stmt = stmt.order_by(GuideAvailability.date)
    rows = db.execute(stmt).scalars().all()
    return [
        AvailabilitySlot(
            id=r.id,
            guide_id=r.guide_id,
            date=str(r.date),
            start_time=r.start_time,
            end_time=r.end_time,
            max_bookings=r.max_bookings,
            note=r.note or "",
            is_available=r.is_available,
        )
        for r in rows
    ]


@router.post("/api/v1/guide/availability", response_model=AvailabilitySlot)
def add_availability(
    req: AvailabilityCreate,
    guide: Guide = Depends(get_current_guide),
    db: Session = Depends(get_db),
):
    parsed_date = date.fromisoformat(req.date)

    # Upsert: update if exists
    existing = db.execute(
        select(GuideAvailability).where(
            GuideAvailability.guide_id == guide.id,
            GuideAvailability.date == parsed_date,
        )
    ).scalar_one_or_none()

    if existing:
        existing.start_time = req.start_time
        existing.end_time = req.end_time
        existing.max_bookings = req.max_bookings
        existing.note = req.note
        existing.is_available = req.is_available
        db.commit()
        db.refresh(existing)
        slot = existing
    else:
        slot = GuideAvailability(
            guide_id=guide.id,
            date=parsed_date,
            start_time=req.start_time,
            end_time=req.end_time,
            max_bookings=req.max_bookings,
            note=req.note,
            is_available=req.is_available,
        )
        db.add(slot)
        db.commit()
        db.refresh(slot)

    return AvailabilitySlot(
        id=slot.id,
        guide_id=slot.guide_id,
        date=str(slot.date),
        start_time=slot.start_time,
        end_time=slot.end_time,
        max_bookings=slot.max_bookings,
        note=slot.note or "",
        is_available=slot.is_available,
    )


@router.post("/api/v1/guide/availability/bulk", response_model=list[AvailabilitySlot])
def bulk_add_availability(
    req: AvailabilityBulkCreate,
    guide: Guide = Depends(get_current_guide),
    db: Session = Depends(get_db),
):
    results = []
    for d in req.dates:
        parsed_date = date.fromisoformat(d)
        existing = db.execute(
            select(GuideAvailability).where(
                GuideAvailability.guide_id == guide.id,
                GuideAvailability.date == parsed_date,
            )
        ).scalar_one_or_none()

        if existing:
            existing.start_time = req.start_time
            existing.end_time = req.end_time
            existing.max_bookings = req.max_bookings
            existing.note = req.note
            existing.is_available = True
            slot = existing
        else:
            slot = GuideAvailability(
                guide_id=guide.id,
                date=parsed_date,
                start_time=req.start_time,
                end_time=req.end_time,
                max_bookings=req.max_bookings,
                note=req.note,
                is_available=True,
            )
            db.add(slot)

        results.append(slot)

    db.commit()
    return [
        AvailabilitySlot(
            id=s.id,
            guide_id=s.guide_id,
            date=str(s.date),
            start_time=s.start_time,
            end_time=s.end_time,
            max_bookings=s.max_bookings,
            note=s.note or "",
            is_available=s.is_available,
        )
        for s in results
    ]


@router.delete("/api/v1/guide/availability/{slot_id}")
def delete_availability(
    slot_id: str,
    guide: Guide = Depends(get_current_guide),
    db: Session = Depends(get_db),
):
    slot = db.execute(
        select(GuideAvailability).where(
            GuideAvailability.id == slot_id,
            GuideAvailability.guide_id == guide.id,
        )
    ).scalar_one_or_none()
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")
    db.delete(slot)
    db.commit()
    return {"ok": True}


# ---------------------------------------------------------------------------
# Public calendar endpoint
# ---------------------------------------------------------------------------

@router.get("/api/v1/public/guides/{guide_id}/calendar", response_model=list[CalendarDay])
def get_guide_calendar(
    guide_id: str,
    month: Optional[str] = Query(None, description="YYYY-MM, defaults to current month"),
    db: Session = Depends(get_db),
):
    """Public calendar showing guide's available dates for a month."""
    guide = db.execute(
        select(Guide).where(Guide.id == guide_id)
    ).scalar_one_or_none()
    if not guide:
        raise HTTPException(status_code=404, detail="Guide not found")

    today = date.today()
    if month:
        parts = month.split("-")
        year, mo = int(parts[0]), int(parts[1])
    else:
        year, mo = today.year, today.month

    # Build date range for the month
    first_day = date(year, mo, 1)
    if mo == 12:
        last_day = date(year + 1, 1, 1) - timedelta(days=1)
    else:
        last_day = date(year, mo + 1, 1) - timedelta(days=1)

    # Get availability slots
    slots = db.execute(
        select(GuideAvailability).where(
            GuideAvailability.guide_id == guide_id,
            GuideAvailability.date >= first_day,
            GuideAvailability.date <= last_day,
            GuideAvailability.is_available == True,
        )
    ).scalars().all()

    slot_map = {s.date: s for s in slots}

    # Count existing bookings per date
    booking_counts = {}
    if slots:
        rows = db.execute(
            select(
                Booking.requested_date,
                func.count(Booking.id),
            ).where(
                Booking.guide_id == guide_id,
                Booking.status.in_([BookingStatus.requested, BookingStatus.confirmed]),
            ).group_by(Booking.requested_date)
        ).all()
        for row in rows:
            booking_counts[row[0]] = row[1]

    # Build calendar days
    calendar = []
    current = first_day
    while current <= last_day:
        slot = slot_map.get(current)
        if slot and current >= today:
            booked = booking_counts.get(str(current), 0)
            spots = max(0, slot.max_bookings - booked)
            calendar.append(CalendarDay(
                date=str(current),
                is_available=spots > 0,
                start_time=slot.start_time,
                end_time=slot.end_time,
                spots_left=spots,
            ))
        else:
            calendar.append(CalendarDay(
                date=str(current),
                is_available=False,
            ))
        current += timedelta(days=1)

    return calendar
