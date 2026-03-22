from sqlalchemy import Boolean, Column, DateTime, Float, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSON

from models.base import BaseModel


class TourGuide(BaseModel):
    __tablename__ = "tour_guides"

    user_id = Column(String(36), nullable=False, unique=True, index=True)
    email = Column(String(255), nullable=False, unique=True, index=True)
    name = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True)
    bio = Column(Text, nullable=True)

    languages = Column(JSON, default=list)  # ["el", "en", "de", "fr"]
    specialties = Column(JSON, default=list)  # ["archaeological", "food", "cultural"]

    license_number = Column(String(100), nullable=True)
    certification_type = Column(String(100), nullable=True)  # official, licensed, freelance
    verified = Column(Boolean, default=False)

    rating = Column(Float, default=0.0)
    total_tours = Column(Integer, default=0)
    total_reviews = Column(Integer, default=0)
    total_earnings = Column(Float, default=0.0)

    location_city = Column(String(100), nullable=True)
    location_country = Column(String(100), default="Greece")
    location_lat = Column(Float, nullable=True)
    location_lng = Column(Float, nullable=True)
    availability_schedule = Column(JSON, default=dict)  # {mon: [{start, end}], ...}

    hourly_rate = Column(Float, default=0.0)
    currency = Column(String(3), default="EUR")
    payment_methods = Column(JSON, default=list)  # ["card", "cash", "crypto"]

    profile_image_url = Column(String(500), nullable=True)
    portfolio_images = Column(JSON, default=list)

    # ether.fi card integration
    etherfi_card_issued = Column(Boolean, default=False)
    etherfi_card_id = Column(String(100), nullable=True)
    wallet_address = Column(String(100), nullable=True)

    is_active = Column(Boolean, default=True)
    last_active_at = Column(DateTime, nullable=True)
