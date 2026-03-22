"""Public discovery endpoints – no authentication required.

These power the main marketing / discovery pages of the frontend:
countries, cities, guides, experiences, bookings, and reviews.
"""

import logging
import re

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from dependencies.database import get_db
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
    BookingOut,
    CityDetail,
    CityOut,
    CountryOut,
    ExperienceCard,
    GuideCard,
    GuideDetail,
    ReviewCreate,
    ReviewOut,
    StatsOut,
)
from services.platform import PlatformService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/public", tags=["public"])


# ---------------------------------------------------------------------------
# Stats
# ---------------------------------------------------------------------------

@router.get("/stats", response_model=StatsOut)
async def platform_stats(db: AsyncSession = Depends(get_db)):
    svc = PlatformService(db)
    return await svc.get_stats()


# ---------------------------------------------------------------------------
# Countries
# ---------------------------------------------------------------------------

@router.get("/countries", response_model=list[CountryOut])
async def list_countries(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Country).where(Country.is_active == True).order_by(Country.name)
    )
    return result.scalars().all()


# ---------------------------------------------------------------------------
# Cities
# ---------------------------------------------------------------------------

@router.get("/cities", response_model=list[CityOut])
async def list_cities(
    country_id: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    q = (
        select(City)
        .options(joinedload(City.country))
        .where(City.is_active == True)
        .order_by(City.name)
    )
    if country_id:
        q = q.where(City.country_id == country_id)
    result = await db.execute(q)
    cities = result.unique().scalars().all()

    out: list[CityOut] = []
    for c in cities:
        d = CityOut.model_validate(c)
        d.country_name = c.country.name if c.country else ""
        d.country_code = c.country.code if c.country else ""
        out.append(d)
    return out


@router.get("/cities/{slug}", response_model=CityDetail)
async def city_detail(slug: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(City)
        .options(
            joinedload(City.country),
            joinedload(City.guides).joinedload(Guide.city).joinedload(City.country),
            joinedload(City.experiences).joinedload(Experience.guide),
            joinedload(City.experiences).joinedload(Experience.city),
        )
        .where(City.slug == slug)
    )
    city = result.unique().scalars().first()
    if not city:
        raise HTTPException(status_code=404, detail="City not found")

    d = CityDetail.model_validate(city)
    d.country_name = city.country.name if city.country else ""
    d.country_code = city.country.code if city.country else ""
    d.guides = [GuideCard.model_validate(g) for g in city.guides if g.is_active]
    d.experiences = [ExperienceCard.model_validate(e) for e in city.experiences if e.is_active]
    d.guide_count = len(d.guides)
    d.experience_count = len(d.experiences)
    return d


# ---------------------------------------------------------------------------
# Guides
# ---------------------------------------------------------------------------

@router.get("/guides", response_model=list[GuideCard])
async def list_guides(
    city_id: str | None = None,
    verification: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    q = (
        select(Guide)
        .options(joinedload(Guide.city).joinedload(City.country))
        .where(Guide.is_active == True)
        .order_by(Guide.rating.desc())
    )
    if city_id:
        q = q.where(Guide.city_id == city_id)
    if verification:
        q = q.where(Guide.verification_status == verification)
    result = await db.execute(q)
    return result.unique().scalars().all()


@router.get("/guides/{guide_id}", response_model=GuideDetail)
async def guide_detail(guide_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Guide)
        .options(
            joinedload(Guide.city).joinedload(City.country),
            joinedload(Guide.experiences).joinedload(Experience.guide),
            joinedload(Guide.experiences).joinedload(Experience.city),
        )
        .where(Guide.id == guide_id)
    )
    guide = result.unique().scalars().first()
    if not guide:
        raise HTTPException(status_code=404, detail="Guide not found")
    return guide


# ---------------------------------------------------------------------------
# Experiences
# ---------------------------------------------------------------------------

@router.get("/experiences", response_model=list[ExperienceCard])
async def list_experiences(
    city_id: str | None = None,
    guide_id: str | None = None,
    category: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    q = (
        select(Experience)
        .options(
            joinedload(Experience.guide),
            joinedload(Experience.city),
        )
        .where(Experience.is_active == True)
        .order_by(Experience.avg_rating.desc())
    )
    if city_id:
        q = q.where(Experience.city_id == city_id)
    if guide_id:
        q = q.where(Experience.guide_id == guide_id)
    if category:
        q = q.where(Experience.category == category)
    result = await db.execute(q)
    return result.unique().scalars().all()


@router.get("/experiences/{slug}", response_model=ExperienceCard)
async def experience_detail(slug: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Experience)
        .options(joinedload(Experience.guide), joinedload(Experience.city))
        .where(Experience.slug == slug)
    )
    exp = result.unique().scalars().first()
    if not exp:
        raise HTTPException(status_code=404, detail="Experience not found")
    return exp


# ---------------------------------------------------------------------------
# Bookings (public creation)
# ---------------------------------------------------------------------------

@router.post("/bookings", response_model=BookingOut, status_code=201)
async def create_booking(payload: BookingCreate, db: AsyncSession = Depends(get_db)):
    svc = PlatformService(db)
    return await svc.create_booking(payload)


# ---------------------------------------------------------------------------
# Reviews (public creation)
# ---------------------------------------------------------------------------

@router.post("/reviews", response_model=ReviewOut, status_code=201)
async def create_review(payload: ReviewCreate, db: AsyncSession = Depends(get_db)):
    svc = PlatformService(db)
    return await svc.create_review(payload)


@router.get("/reviews", response_model=list[ReviewOut])
async def list_reviews(
    experience_id: str | None = None,
    guide_id: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    q = select(Review).where(Review.is_published == True).order_by(Review.created_at.desc()).limit(100)
    if experience_id:
        q = q.where(Review.experience_id == experience_id)
    if guide_id:
        q = q.where(Review.guide_id == guide_id)
    result = await db.execute(q)
    return result.scalars().all()
