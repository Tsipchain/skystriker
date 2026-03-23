"""Domain models for the Thronos Chain SkyStriker Global Guides platform.

Every table lives in one file so the import graph stays flat.  The models
capture *verified local guides* who offer *destination experiences* in
specific *cities* that belong to *countries*.

Verification is the platform's core differentiator: guides go through a
multi-step process backed by an external VerifyID provider, and every
status change is recorded in an audit log.
"""

from __future__ import annotations

import enum
import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from models.base import Base


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _uuid() -> str:
    return str(uuid.uuid4())


def _utcnow() -> datetime:
    return datetime.utcnow()


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class VerificationStatus(str, enum.Enum):
    unverified = "unverified"
    pending = "pending"
    verified = "verified"
    rejected = "rejected"
    suspended = "suspended"


class ExperienceCategory(str, enum.Enum):
    walking_tour = "walking_tour"
    food_and_drink = "food_and_drink"
    history_and_culture = "history_and_culture"
    adventure = "adventure"
    nature = "nature"
    nightlife = "nightlife"
    workshop = "workshop"
    photography = "photography"
    wellness = "wellness"
    custom = "custom"


class BookingStatus(str, enum.Enum):
    requested = "requested"
    confirmed = "confirmed"
    completed = "completed"
    cancelled = "cancelled"
    declined = "declined"


class UserRole(str, enum.Enum):
    guest = "guest"
    guide = "guide"
    admin = "admin"


class AuthProvider(str, enum.Enum):
    email = "email"
    google = "google"


class AuditAction(str, enum.Enum):
    guide_registered = "guide_registered"
    verification_submitted = "verification_submitted"
    verification_approved = "verification_approved"
    verification_rejected = "verification_rejected"
    experience_created = "experience_created"
    experience_updated = "experience_updated"
    experience_deleted = "experience_deleted"
    booking_requested = "booking_requested"
    booking_confirmed = "booking_confirmed"
    booking_completed = "booking_completed"
    booking_cancelled = "booking_cancelled"
    booking_declined = "booking_declined"
    review_submitted = "review_submitted"
    review_flagged = "review_flagged"
    admin_action = "admin_action"
    user_registered = "user_registered"


# ---------------------------------------------------------------------------
# User (authentication)
# ---------------------------------------------------------------------------

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=_uuid)
    email = Column(String(254), unique=True, nullable=False, index=True)
    full_name = Column(String(200), nullable=False)
    avatar_url = Column(Text, default="")
    password_hash = Column(String(255), default="")   # empty for Google-only users
    auth_provider = Column(Enum(AuthProvider), default=AuthProvider.email, nullable=False)
    google_sub = Column(String(255), default="", index=True)  # Google subject ID
    role = Column(Enum(UserRole), default=UserRole.guest, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=_utcnow, nullable=False)
    updated_at = Column(DateTime, default=_utcnow, onupdate=_utcnow, nullable=False)

    guide = relationship("Guide", back_populates="user", uselist=False)


# ---------------------------------------------------------------------------
# Country / City
# ---------------------------------------------------------------------------

class Country(Base):
    __tablename__ = "countries"

    id = Column(String(36), primary_key=True, default=_uuid)
    code = Column(String(4), unique=True, nullable=False, index=True)
    name = Column(String(120), nullable=False)
    flag_emoji = Column(String(8), default="")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=_utcnow, nullable=False)

    cities = relationship("City", back_populates="country", cascade="all, delete-orphan")


class City(Base):
    __tablename__ = "cities"

    id = Column(String(36), primary_key=True, default=_uuid)
    country_id = Column(String(36), ForeignKey("countries.id"), nullable=False)
    name = Column(String(120), nullable=False)
    slug = Column(String(140), unique=True, nullable=False, index=True)
    tagline = Column(String(255), default="")
    description = Column(Text, default="")
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)
    photo_url = Column(Text, default="")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=_utcnow, nullable=False)

    country = relationship("Country", back_populates="cities")
    guides = relationship("Guide", back_populates="city")
    experiences = relationship("Experience", back_populates="city")


# ---------------------------------------------------------------------------
# Guide
# ---------------------------------------------------------------------------

class Guide(Base):
    __tablename__ = "guides"

    id = Column(String(36), primary_key=True, default=_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True, unique=True)
    full_name = Column(String(200), nullable=False)
    email = Column(String(254), unique=True, nullable=False, index=True)
    phone = Column(String(40), default="")
    bio = Column(Text, default="")
    avatar_url = Column(Text, default="")
    languages = Column(Text, default="")          # comma-separated
    specialties = Column(Text, default="")         # comma-separated
    city_id = Column(String(36), ForeignKey("cities.id"), nullable=True)
    verification_status = Column(
        Enum(VerificationStatus), default=VerificationStatus.unverified, nullable=False,
    )
    verifyid_reference = Column(String(200), default="")
    is_active = Column(Boolean, default=True)
    rating = Column(Float, default=0.0)
    total_reviews = Column(Integer, default=0)
    created_at = Column(DateTime, default=_utcnow, nullable=False)
    updated_at = Column(DateTime, default=_utcnow, onupdate=_utcnow, nullable=False)

    user = relationship("User", back_populates="guide")
    city = relationship("City", back_populates="guides")
    experiences = relationship("Experience", back_populates="guide", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="guide", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="guide", cascade="all, delete-orphan")
    availability_slots = relationship("GuideAvailability", back_populates="guide", cascade="all, delete-orphan")


# ---------------------------------------------------------------------------
# Experience
# ---------------------------------------------------------------------------

class Experience(Base):
    __tablename__ = "experiences"

    id = Column(String(36), primary_key=True, default=_uuid)
    guide_id = Column(String(36), ForeignKey("guides.id"), nullable=False)
    city_id = Column(String(36), ForeignKey("cities.id"), nullable=False)
    title = Column(String(255), nullable=False)
    slug = Column(String(280), unique=True, nullable=False, index=True)
    description = Column(Text, default="")
    category = Column(Enum(ExperienceCategory), default=ExperienceCategory.walking_tour)
    duration_minutes = Column(Integer, default=120)
    price = Column(Float, default=0.0)
    currency = Column(String(6), default="EUR")
    max_guests = Column(Integer, default=10)
    languages = Column(Text, default="")          # comma-separated
    photo_url = Column(Text, default="")
    is_active = Column(Boolean, default=True)
    avg_rating = Column(Float, default=0.0)
    total_bookings = Column(Integer, default=0)
    created_at = Column(DateTime, default=_utcnow, nullable=False)
    updated_at = Column(DateTime, default=_utcnow, onupdate=_utcnow, nullable=False)

    guide = relationship("Guide", back_populates="experiences")
    city = relationship("City", back_populates="experiences")
    bookings = relationship("Booking", back_populates="experience", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="experience", cascade="all, delete-orphan")


# ---------------------------------------------------------------------------
# Booking
# ---------------------------------------------------------------------------

class Booking(Base):
    __tablename__ = "bookings"

    id = Column(String(36), primary_key=True, default=_uuid)
    experience_id = Column(String(36), ForeignKey("experiences.id"), nullable=False)
    guide_id = Column(String(36), ForeignKey("guides.id"), nullable=False)
    guest_name = Column(String(200), nullable=False)
    guest_email = Column(String(254), nullable=False)
    guest_phone = Column(String(40), default="")
    requested_date = Column(String(10), nullable=False)      # YYYY-MM-DD
    requested_time = Column(String(5), default="10:00")       # HH:MM
    guests_count = Column(Integer, default=1)
    total_price = Column(Float, default=0.0)
    currency = Column(String(6), default="EUR")
    status = Column(Enum(BookingStatus), default=BookingStatus.requested)
    note = Column(Text, default="")
    created_at = Column(DateTime, default=_utcnow, nullable=False)
    updated_at = Column(DateTime, default=_utcnow, onupdate=_utcnow, nullable=False)

    experience = relationship("Experience", back_populates="bookings")
    guide = relationship("Guide", back_populates="bookings")


# ---------------------------------------------------------------------------
# Review
# ---------------------------------------------------------------------------

class Review(Base):
    __tablename__ = "reviews"

    id = Column(String(36), primary_key=True, default=_uuid)
    experience_id = Column(String(36), ForeignKey("experiences.id"), nullable=False)
    guide_id = Column(String(36), ForeignKey("guides.id"), nullable=False)
    booking_id = Column(String(36), ForeignKey("bookings.id"), nullable=True)
    reviewer_name = Column(String(200), nullable=False)
    rating = Column(Integer, nullable=False)       # 1-5
    comment = Column(Text, default="")
    guide_response = Column(Text, default="")
    is_published = Column(Boolean, default=True)
    is_flagged = Column(Boolean, default=False)
    created_at = Column(DateTime, default=_utcnow, nullable=False)

    experience = relationship("Experience", back_populates="reviews")
    guide = relationship("Guide", back_populates="reviews")
    booking = relationship("Booking")


# ---------------------------------------------------------------------------
# Audit log
# ---------------------------------------------------------------------------

# ---------------------------------------------------------------------------
# Guide Availability
# ---------------------------------------------------------------------------

class GuideAvailability(Base):
    __tablename__ = "guide_availability"
    __table_args__ = (
        UniqueConstraint("guide_id", "date", name="uq_guide_date"),
    )

    id = Column(String(36), primary_key=True, default=_uuid)
    guide_id = Column(String(36), ForeignKey("guides.id"), nullable=False)
    date = Column(Date, nullable=False, index=True)
    start_time = Column(String(5), default="09:00")   # HH:MM
    end_time = Column(String(5), default="18:00")      # HH:MM
    max_bookings = Column(Integer, default=3)
    note = Column(Text, default="")
    is_available = Column(Boolean, default=True)
    created_at = Column(DateTime, default=_utcnow, nullable=False)

    guide = relationship("Guide", back_populates="availability_slots")


# ---------------------------------------------------------------------------
# Subscription (AI Translator)
# ---------------------------------------------------------------------------

class SubscriptionStatus(str, enum.Enum):
    trial = "trial"
    active = "active"
    cancelled = "cancelled"
    expired = "expired"


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(String(36), primary_key=True, default=_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    plan = Column(String(50), default="translator_monthly")
    status = Column(Enum(SubscriptionStatus), default=SubscriptionStatus.trial, nullable=False)
    price = Column(Float, default=4.99)
    currency = Column(String(6), default="EUR")
    started_at = Column(DateTime, default=_utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=_utcnow, nullable=False)

    user = relationship("User", backref="subscriptions")


# ---------------------------------------------------------------------------
# Audit log
# ---------------------------------------------------------------------------

class AuditLog(Base):
    __tablename__ = "audit_log"

    id = Column(String(36), primary_key=True, default=_uuid)
    action = Column(Enum(AuditAction), nullable=False)
    actor = Column(String(200), default="system")
    target_type = Column(String(60), default="")
    target_id = Column(String(36), default="")
    detail = Column(Text, default="")
    created_at = Column(DateTime, default=_utcnow, nullable=False)
