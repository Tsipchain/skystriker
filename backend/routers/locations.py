import logging

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from dependencies.auth import get_current_user
from dependencies.database import get_db
from models.locations import PointOfInterest
from schemas.locations import POICreate, POIResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/locations", tags=["locations"])


@router.get("/", response_model=list[POIResponse])
async def list_pois(
    city: str | None = None,
    category: str | None = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    query = select(PointOfInterest).where(PointOfInterest.is_active == True)
    if city:
        query = query.where(PointOfInterest.city.ilike(f"%{city}%"))
    if category:
        query = query.where(PointOfInterest.category == category)
    query = query.offset((page - 1) * per_page).limit(per_page)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/", response_model=POIResponse, status_code=201)
async def create_poi(
    data: POICreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    poi = PointOfInterest(**data.model_dump())
    db.add(poi)
    await db.commit()
    await db.refresh(poi)
    return poi


@router.get("/{poi_id}", response_model=POIResponse)
async def get_poi(poi_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PointOfInterest).where(PointOfInterest.id == poi_id))
    poi = result.scalar_one_or_none()
    if not poi:
        raise HTTPException(status_code=404, detail="Point of interest not found")
    return poi
