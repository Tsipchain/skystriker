"""Public discovery endpoints - no authentication required."""
import logging

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from dependencies.database import get_db
from models.guides import TourGuide
from models.reviews import Review
from models.tours import Tour
from schemas.guides import GuidePublicResponse
from schemas.tours import TourResponse
from services.tours import TourService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/public", tags=["public"])


@router.get("/tours", response_model=list[TourResponse])
async def search_tours(
    city: str | None = None,
    country: str | None = None,
    category: str | None = None,
    language: str | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    difficulty: str | None = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    svc = TourService(db)
    return await svc.search_tours(
        city=city, country=country, category=category, language=language,
        min_price=min_price, max_price=max_price, difficulty=difficulty,
        limit=per_page, offset=(page - 1) * per_page,
    )


@router.get("/tours/{tour_id}", response_model=TourResponse)
async def get_tour_details(tour_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Tour).where(and_(Tour.id == tour_id, Tour.is_active == True))
    )
    tour = result.scalar_one_or_none()
    if not tour:
        raise HTTPException(status_code=404, detail="Tour not found")
    return tour


@router.get("/tours/{tour_id}/reviews")
async def get_tour_reviews(tour_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Review).where(and_(Review.tour_id == tour_id, Review.is_published == True))
        .order_by(Review.created_at.desc()).limit(50)
    )
    reviews = result.scalars().all()
    return [
        {
            "id": r.id, "customer_name": r.customer_name, "rating": r.rating,
            "title": r.title, "comment": r.comment, "guide_response": r.guide_response,
            "is_verified": r.is_verified, "date": r.created_at.isoformat(),
        }
        for r in reviews
    ]


@router.get("/guides", response_model=list[GuidePublicResponse])
async def browse_guides(
    city: str | None = None,
    country: str | None = None,
    specialty: str | None = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    query = select(TourGuide).where(and_(TourGuide.is_active == True, TourGuide.verified == True))
    if city:
        query = query.where(TourGuide.location_city.ilike(f"%{city}%"))
    if country:
        query = query.where(TourGuide.location_country.ilike(f"%{country}%"))
    query = query.order_by(TourGuide.rating.desc()).offset((page - 1) * per_page).limit(per_page)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/guides/{guide_id}", response_model=GuidePublicResponse)
async def get_guide_profile(guide_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(TourGuide).where(TourGuide.id == guide_id))
    guide = result.scalar_one_or_none()
    if not guide:
        raise HTTPException(status_code=404, detail="Guide not found")
    return guide


@router.get("/guides/{guide_id}/tours", response_model=list[TourResponse])
async def get_guide_tours(guide_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Tour).where(and_(Tour.guide_id == guide_id, Tour.is_active == True))
        .order_by(Tour.avg_rating.desc())
    )
    return result.scalars().all()


@router.get("/featured", response_model=list[TourResponse])
async def featured_tours(db: AsyncSession = Depends(get_db)):
    svc = TourService(db)
    return await svc.get_featured_tours()


@router.get("/cities")
async def list_cities(db: AsyncSession = Depends(get_db)):
    """Get all cities with active tours."""
    from sqlalchemy import distinct
    result = await db.execute(
        select(distinct(Tour.city), Tour.country).where(
            and_(Tour.is_active == True, Tour.city != None)
        ).order_by(Tour.city)
    )
    return [{"city": r[0], "country": r[1]} for r in result.all()]
