import logging
from datetime import datetime, timedelta
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from models.bookings import Booking
from models.reviews import Review
from models.tours import Tour

logger = logging.getLogger(__name__)


class AnalyticsService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def guide_revenue(self, guide_id: str, days: int = 30) -> dict:
        since = datetime.utcnow() - timedelta(days=days)
        result = await self.db.execute(
            select(
                func.count().label("total_bookings"),
                func.sum(Booking.guide_payout).label("total_earnings"),
                func.sum(Booking.total_price).label("gross_revenue"),
                func.sum(Booking.platform_commission).label("total_commission"),
                func.sum(Booking.participants_count).label("total_participants"),
            ).where(
                and_(Booking.guide_id == guide_id, Booking.status == "completed",
                     Booking.completed_at >= since)
            )
        )
        row = result.one()
        return {
            "period_days": days,
            "total_bookings": row.total_bookings or 0,
            "total_earnings": round(row.total_earnings or 0, 2),
            "gross_revenue": round(row.gross_revenue or 0, 2),
            "platform_commission": round(row.total_commission or 0, 2),
            "total_participants": row.total_participants or 0,
            "avg_per_booking": round((row.total_earnings or 0) / max(row.total_bookings or 1, 1), 2),
        }

    async def popular_tours(self, guide_id: str, limit: int = 5) -> list[dict]:
        result = await self.db.execute(
            select(Tour).where(Tour.guide_id == guide_id)
            .order_by(Tour.total_bookings.desc()).limit(limit)
        )
        tours = result.scalars().all()
        return [
            {"id": t.id, "title": t.title, "city": t.city, "bookings": t.total_bookings,
             "revenue": round(t.total_revenue, 2), "rating": t.avg_rating}
            for t in tours
        ]

    async def booking_stats(self, guide_id: str) -> dict:
        result = await self.db.execute(
            select(Booking.status, func.count().label("count")).where(
                Booking.guide_id == guide_id
            ).group_by(Booking.status)
        )
        return {row.status: row.count for row in result.all()}

    async def rating_summary(self, guide_id: str) -> dict:
        result = await self.db.execute(
            select(
                func.count().label("total"),
                func.avg(Review.rating).label("avg_rating"),
            ).where(and_(Review.guide_id == guide_id, Review.is_published == True))
        )
        row = result.one()
        # Distribution
        dist_result = await self.db.execute(
            select(Review.rating, func.count().label("count")).where(
                and_(Review.guide_id == guide_id, Review.is_published == True)
            ).group_by(Review.rating)
        )
        distribution = {r.rating: r.count for r in dist_result.all()}
        return {
            "total_reviews": row.total or 0,
            "avg_rating": round(row.avg_rating or 0, 2),
            "distribution": distribution,
        }

    async def pending_reviews(self, guide_id: str) -> list[dict]:
        result = await self.db.execute(
            select(Review).where(
                and_(Review.guide_id == guide_id, Review.guide_response == None, Review.is_published == True)
            ).order_by(Review.created_at.desc())
        )
        reviews = result.scalars().all()
        return [
            {"id": r.id, "tour_id": r.tour_id, "customer": r.customer_name,
             "rating": r.rating, "comment": r.comment, "date": r.created_at.isoformat()}
            for r in reviews
        ]
