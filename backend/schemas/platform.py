"""Pydantic schemas for the platform API.

Every schema is intentionally flat -- no nested ORM-lazy loads required.
Comma-separated DB columns (languages, specialties) are split into
``list[str]`` on the way out via ``model_validator``.
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, field_validator, model_validator


# ---------------------------------------------------------------------------
# Country / City
# ---------------------------------------------------------------------------

class CountryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    code: str
    name: str
    flag_emoji: str = ""
    is_active: bool = True


class CityOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    country_id: str
    name: str
    slug: str
    tagline: str = ""
    description: str = ""
    lat: Optional[float] = None
    lng: Optional[float] = None
    photo_url: str = ""
    is_active: bool = True
    country_name: str = ""
    country_code: str = ""
    guide_count: int = 0
    experience_count: int = 0


class CityDetail(CityOut):
    guides: list[GuideCard] = []
    experiences: list[ExperienceCard] = []


# ---------------------------------------------------------------------------
# Guide
# ---------------------------------------------------------------------------

class GuideCard(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    full_name: str
    bio: str = ""
    avatar_url: str = ""
    languages: list[str] = []
    specialties: list[str] = []
    city_name: str = ""
    country_name: str = ""
    verification_status: str = "unverified"
    rating: float = 0.0
    total_reviews: int = 0

    @model_validator(mode="before")
    @classmethod
    def _split_csv(cls, values):
        if hasattr(values, "__dict__"):
            d = {c.key: getattr(values, c.key) for c in values.__table__.columns}
            # attach joined city/country names when present
            if hasattr(values, "city") and values.city:
                d["city_name"] = values.city.name
                if values.city.country:
                    d["country_name"] = values.city.country.name
            return d
        return values

    @field_validator("languages", "specialties", mode="before")
    @classmethod
    def _csv_to_list(cls, v):
        if isinstance(v, str):
            return [s.strip() for s in v.split(",") if s.strip()]
        return v or []


class GuideDetail(GuideCard):
    email: str = ""
    phone: str = ""
    verifyid_reference: str = ""
    is_active: bool = True
    payment_method: str = ""
    stripe_account_id: str = ""
    crypto_wallet_address: str = ""
    created_at: Optional[datetime] = None
    experiences: list[ExperienceCard] = []


class GuideProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    phone: Optional[str] = None
    languages: Optional[str] = None
    specialties: Optional[str] = None
    payment_method: Optional[str] = None
    stripe_account_id: Optional[str] = None
    crypto_wallet_address: Optional[str] = None


# ---------------------------------------------------------------------------
# Experience
# ---------------------------------------------------------------------------

class ExperienceCard(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    guide_id: str
    city_id: str
    title: str
    slug: str
    description: str = ""
    category: str = "walking_tour"
    duration_minutes: int = 120
    price: float = 0.0
    currency: str = "EUR"
    max_guests: int = 10
    languages: list[str] = []
    photo_url: str = ""
    is_active: bool = True
    avg_rating: float = 0.0
    total_bookings: int = 0
    guide_name: str = ""
    city_name: str = ""

    @model_validator(mode="before")
    @classmethod
    def _enrich(cls, values):
        if hasattr(values, "__dict__"):
            d = {c.key: getattr(values, c.key) for c in values.__table__.columns}
            if hasattr(values, "guide") and values.guide:
                d["guide_name"] = values.guide.full_name
            if hasattr(values, "city") and values.city:
                d["city_name"] = values.city.name
            # Enum -> str
            if "category" in d and hasattr(d["category"], "value"):
                d["category"] = d["category"].value
            return d
        return values

    @field_validator("languages", mode="before")
    @classmethod
    def _csv_to_list(cls, v):
        if isinstance(v, str):
            return [s.strip() for s in v.split(",") if s.strip()]
        return v or []


class ExperienceCreate(BaseModel):
    title: str
    description: str = ""
    category: str = "walking_tour"
    duration_minutes: int = 120
    price: float = 0.0
    currency: str = "EUR"
    max_guests: int = 10
    languages: str = ""
    photo_url: str = ""
    city_id: str = ""


class ExperienceUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    duration_minutes: Optional[int] = None
    price: Optional[float] = None
    currency: Optional[str] = None
    max_guests: Optional[int] = None
    languages: Optional[str] = None
    photo_url: Optional[str] = None
    is_active: Optional[bool] = None


# ---------------------------------------------------------------------------
# Booking
# ---------------------------------------------------------------------------

class BookingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    experience_id: str
    guide_id: str
    guest_name: str
    guest_email: str
    guest_phone: str = ""
    requested_date: str
    requested_time: str = "10:00"
    guests_count: int = 1
    total_price: float = 0.0
    platform_fee: float = 0.0
    guide_payout: float = 0.0
    payout_status: str = "pending"
    currency: str = "EUR"
    status: str = "requested"
    note: str = ""
    created_at: Optional[datetime] = None

    @model_validator(mode="before")
    @classmethod
    def _enum_to_str(cls, values):
        if hasattr(values, "__dict__"):
            d = {c.key: getattr(values, c.key) for c in values.__table__.columns}
            if "status" in d and hasattr(d["status"], "value"):
                d["status"] = d["status"].value
            return d
        return values


class BookingCreate(BaseModel):
    experience_id: str
    guest_name: str
    guest_email: str
    guest_phone: str = ""
    requested_date: str
    requested_time: str = "10:00"
    guests_count: int = 1
    note: str = ""


# ---------------------------------------------------------------------------
# Review
# ---------------------------------------------------------------------------

class ReviewOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    experience_id: str
    guide_id: str
    booking_id: Optional[str] = None
    reviewer_name: str
    rating: int
    comment: str = ""
    guide_response: str = ""
    is_published: bool = True
    is_flagged: bool = False
    created_at: Optional[datetime] = None


class ReviewCreate(BaseModel):
    experience_id: str
    reviewer_name: str
    rating: int
    comment: str = ""
    booking_id: Optional[str] = None


# ---------------------------------------------------------------------------
# Audit
# ---------------------------------------------------------------------------

class AuditLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    action: str
    actor: str = "system"
    target_type: str = ""
    target_id: str = ""
    detail: str = ""
    created_at: Optional[datetime] = None

    @model_validator(mode="before")
    @classmethod
    def _enum_to_str(cls, values):
        if hasattr(values, "__dict__"):
            d = {c.key: getattr(values, c.key) for c in values.__table__.columns}
            if "action" in d and hasattr(d["action"], "value"):
                d["action"] = d["action"].value
            return d
        return values


# ---------------------------------------------------------------------------
# Misc
# ---------------------------------------------------------------------------

class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    environment: str


class StatsOut(BaseModel):
    countries: int = 0
    cities: int = 0
    guides: int = 0
    experiences: int = 0
    verified_guides: int = 0


# forward-ref fix
CityDetail.model_rebuild()
GuideDetail.model_rebuild()
