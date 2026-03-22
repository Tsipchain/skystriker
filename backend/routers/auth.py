import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from dependencies.database import get_db
from models.guides import TourGuide
from schemas.guides import GuideRegister, GuideResponse
from services.auth import create_access_token

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/auth", tags=["authentication"])


class LoginRequest(BaseModel):
    email: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    guide_id: str | None = None


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register_guide(data: GuideRegister, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(TourGuide).where(TourGuide.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Guide with this email already exists")

    user_id = str(uuid.uuid4())
    guide = TourGuide(
        user_id=user_id,
        email=data.email,
        name=data.name,
        phone=data.phone,
        bio=data.bio,
        languages=data.languages,
        specialties=data.specialties,
        license_number=data.license_number,
        certification_type=data.certification_type,
        location_city=data.location_city,
        location_country=data.location_country,
        hourly_rate=data.hourly_rate,
        currency=data.currency,
        payment_methods=data.payment_methods,
        wallet_address=data.wallet_address,
    )
    db.add(guide)
    await db.commit()
    await db.refresh(guide)

    token = create_access_token(user_id=user_id, email=data.email, role="guide", guide_id=guide.id)
    return TokenResponse(access_token=token, user_id=user_id, guide_id=guide.id)


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(TourGuide).where(TourGuide.email == data.email))
    guide = result.scalar_one_or_none()
    if not guide:
        raise HTTPException(status_code=404, detail="Guide not found. Please register first.")

    token = create_access_token(
        user_id=guide.user_id, email=guide.email, role="guide", guide_id=guide.id
    )
    return TokenResponse(access_token=token, user_id=guide.user_id, guide_id=guide.id)
