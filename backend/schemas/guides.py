from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class GuideRegister(BaseModel):
    email: str
    name: str
    phone: Optional[str] = None
    bio: Optional[str] = None
    languages: list[str] = ["el"]
    specialties: list[str] = []
    license_number: Optional[str] = None
    certification_type: Optional[str] = None
    location_city: Optional[str] = None
    location_country: str = "Greece"
    hourly_rate: float = 0.0
    currency: str = "EUR"
    payment_methods: list[str] = ["card"]
    wallet_address: Optional[str] = None


class GuideUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = None
    languages: Optional[list[str]] = None
    specialties: Optional[list[str]] = None
    location_city: Optional[str] = None
    location_country: Optional[str] = None
    hourly_rate: Optional[float] = None
    availability_schedule: Optional[dict] = None
    payment_methods: Optional[list[str]] = None
    profile_image_url: Optional[str] = None
    portfolio_images: Optional[list] = None
    wallet_address: Optional[str] = None


class GuideResponse(BaseModel):
    id: str
    user_id: str
    email: str
    name: str
    phone: Optional[str] = None
    bio: Optional[str] = None
    languages: list = []
    specialties: list = []
    license_number: Optional[str] = None
    certification_type: Optional[str] = None
    verified: bool
    rating: float
    total_tours: int
    total_reviews: int
    total_earnings: float
    location_city: Optional[str] = None
    location_country: str
    hourly_rate: float
    currency: str
    payment_methods: list = []
    profile_image_url: Optional[str] = None
    portfolio_images: list = []
    etherfi_card_issued: bool
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class GuidePublicResponse(BaseModel):
    id: str
    name: str
    bio: Optional[str] = None
    languages: list = []
    specialties: list = []
    verified: bool
    rating: float
    total_tours: int
    total_reviews: int
    location_city: Optional[str] = None
    location_country: str
    hourly_rate: float
    currency: str
    profile_image_url: Optional[str] = None
    portfolio_images: list = []

    class Config:
        from_attributes = True
