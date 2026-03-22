import logging
import secrets
from datetime import datetime

from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from models.bookings import Booking
from models.tours import Tour
from models.guides import TourGuide

logger = logging.getLogger(__name__)


class BookingService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_booking(
        self, tour_id: str, customer_name: str, customer_email: str,
        tour_date: datetime, participants_count: int = 1,
        customer_phone: str | None = None, customer_country: str | None = None,
        tour_time: str | None = None, payment_method: str | None = None,
        special_requests: str | None = None,
    ) -> Booking:
        # Get tour
        tour_result = await self.db.execute(select(Tour).where(Tour.id == tour_id))
        tour = tour_result.scalar_one_or_none()
        if not tour:
            raise ValueError("Tour not found")
        if not tour.is_active:
            raise ValueError("Tour is not currently available")
        if participants_count > tour.max_participants:
            raise ValueError(f"Maximum {tour.max_participants} participants allowed")

        # Check existing bookings for same date don't exceed capacity
        existing = await self.db.execute(
            select(func.sum(Booking.participants_count)).where(
                and_(
                    Booking.tour_id == tour_id,
                    Booking.tour_date == tour_date,
                    Booking.status.in_(["pending", "confirmed"]),
                )
            )
        )
        booked_count = existing.scalar() or 0
        if booked_count + participants_count > tour.max_participants:
            raise ValueError(f"Only {tour.max_participants - booked_count} spots left for this date")

        # Calculate pricing with 20% platform commission
        total_price = tour.price_per_person * participants_count
        commission = total_price * (settings.platform_commission_pct / 100)
        guide_payout = total_price - commission

        confirmation_code = f"SK-{secrets.token_hex(4).upper()}"

        booking = Booking(
            tour_id=tour_id,
            guide_id=tour.guide_id,
            customer_name=customer_name,
            customer_email=customer_email,
            customer_phone=customer_phone,
            customer_country=customer_country,
            booking_date=datetime.utcnow(),
            tour_date=tour_date,
            tour_time=tour_time,
            participants_count=participants_count,
            price_per_person=tour.price_per_person,
            total_price=total_price,
            platform_commission=commission,
            guide_payout=guide_payout,
            currency=tour.currency,
            payment_method=payment_method,
            special_requests=special_requests,
            confirmation_code=confirmation_code,
        )
        self.db.add(booking)

        # Update tour stats
        tour.total_bookings += 1
        tour.total_revenue += total_price

        await self.db.commit()
        await self.db.refresh(booking)
        logger.info(f"Booking created: {booking.id}, conf={confirmation_code}, total={total_price}")
        return booking

    async def confirm_booking(self, booking_id: str, guide_id: str) -> Booking:
        result = await self.db.execute(
            select(Booking).where(and_(Booking.id == booking_id, Booking.guide_id == guide_id))
        )
        booking = result.scalar_one_or_none()
        if not booking:
            raise ValueError("Booking not found")
        if booking.status != "pending":
            raise ValueError(f"Cannot confirm booking in status '{booking.status}'")
        booking.status = "confirmed"
        booking.payment_status = "paid"
        await self.db.commit()
        await self.db.refresh(booking)
        return booking

    async def cancel_booking(self, booking_id: str, cancelled_by: str, reason: str | None = None) -> Booking:
        result = await self.db.execute(select(Booking).where(Booking.id == booking_id))
        booking = result.scalar_one_or_none()
        if not booking:
            raise ValueError("Booking not found")
        if booking.status in ("completed", "cancelled"):
            raise ValueError(f"Cannot cancel booking in status '{booking.status}'")
        booking.status = "cancelled"
        booking.cancelled_at = datetime.utcnow()
        booking.cancelled_by = cancelled_by
        booking.cancellation_reason = reason
        if booking.payment_status == "paid":
            booking.payment_status = "refunded"
        await self.db.commit()
        await self.db.refresh(booking)
        return booking

    async def complete_booking(self, booking_id: str, guide_id: str) -> Booking:
        result = await self.db.execute(
            select(Booking).where(and_(Booking.id == booking_id, Booking.guide_id == guide_id))
        )
        booking = result.scalar_one_or_none()
        if not booking:
            raise ValueError("Booking not found")
        booking.status = "completed"
        booking.completed_at = datetime.utcnow()

        # Update guide earnings
        guide_result = await self.db.execute(select(TourGuide).where(TourGuide.id == guide_id))
        guide = guide_result.scalar_one_or_none()
        if guide:
            guide.total_tours += 1
            guide.total_earnings += booking.guide_payout

        await self.db.commit()
        await self.db.refresh(booking)
        return booking

    async def check_availability(self, tour_id: str, tour_date: datetime) -> dict:
        tour_result = await self.db.execute(select(Tour).where(Tour.id == tour_id))
        tour = tour_result.scalar_one_or_none()
        if not tour:
            return {"available": False, "reason": "Tour not found"}
        existing = await self.db.execute(
            select(func.sum(Booking.participants_count)).where(
                and_(Booking.tour_id == tour_id, Booking.tour_date == tour_date,
                     Booking.status.in_(["pending", "confirmed"]))
            )
        )
        booked = existing.scalar() or 0
        spots_left = tour.max_participants - booked
        return {
            "available": spots_left > 0,
            "max_participants": tour.max_participants,
            "booked": booked,
            "spots_left": max(0, spots_left),
            "price_per_person": tour.price_per_person,
            "currency": tour.currency,
        }
