import logging
from sqlalchemy import select, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from models.tours import Tour

logger = logging.getLogger(__name__)


class TourService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def search_tours(
        self, city: str | None = None, country: str | None = None,
        category: str | None = None, language: str | None = None,
        min_price: float | None = None, max_price: float | None = None,
        difficulty: str | None = None, limit: int = 50, offset: int = 0,
    ) -> list[Tour]:
        query = select(Tour).where(Tour.is_active == True)
        if city:
            query = query.where(Tour.city.ilike(f"%{city}%"))
        if country:
            query = query.where(Tour.country.ilike(f"%{country}%"))
        if category:
            query = query.where(Tour.category == category)
        if min_price is not None:
            query = query.where(Tour.price_per_person >= min_price)
        if max_price is not None:
            query = query.where(Tour.price_per_person <= max_price)
        if difficulty:
            query = query.where(Tour.difficulty_level == difficulty)
        query = query.order_by(Tour.avg_rating.desc(), Tour.total_bookings.desc())
        query = query.offset(offset).limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_featured_tours(self, limit: int = 10) -> list[Tour]:
        result = await self.db.execute(
            select(Tour).where(and_(Tour.is_active == True, Tour.is_featured == True))
            .order_by(Tour.avg_rating.desc()).limit(limit)
        )
        return list(result.scalars().all())

    async def clone_tour(self, tour_id: str, guide_id: str) -> Tour:
        result = await self.db.execute(
            select(Tour).where(and_(Tour.id == tour_id, Tour.guide_id == guide_id))
        )
        original = result.scalar_one_or_none()
        if not original:
            raise ValueError("Tour not found")
        new_tour = Tour(
            guide_id=guide_id,
            title=f"{original.title} (Copy)",
            description=original.description,
            short_description=original.short_description,
            category=original.category,
            languages=original.languages,
            duration_hours=original.duration_hours,
            max_participants=original.max_participants,
            min_participants=original.min_participants,
            price_per_person=original.price_per_person,
            group_price=original.group_price,
            currency=original.currency,
            meeting_point=original.meeting_point,
            meeting_point_lat=original.meeting_point_lat,
            meeting_point_lng=original.meeting_point_lng,
            city=original.city,
            country=original.country,
            region=original.region,
            route_points=original.route_points,
            included_items=original.included_items,
            excluded_items=original.excluded_items,
            what_to_bring=original.what_to_bring,
            difficulty_level=original.difficulty_level,
            accessibility_info=original.accessibility_info,
            photos=original.photos,
            tags=original.tags,
            schedule_type=original.schedule_type,
            fixed_schedule=original.fixed_schedule,
            cancellation_policy=original.cancellation_policy,
            is_active=False,
        )
        self.db.add(new_tour)
        await self.db.commit()
        await self.db.refresh(new_tour)
        return new_tour
