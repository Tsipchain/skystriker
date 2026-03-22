from sqlalchemy import Column, DateTime, Float, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSON

from models.base import BaseModel


class Booking(BaseModel):
    __tablename__ = "bookings"

    tour_id = Column(String(36), nullable=False, index=True)
    guide_id = Column(String(36), nullable=False, index=True)

    # Customer info
    customer_name = Column(String(255), nullable=False)
    customer_email = Column(String(255), nullable=False, index=True)
    customer_phone = Column(String(50), nullable=True)
    customer_country = Column(String(100), nullable=True)

    # Booking details
    booking_date = Column(DateTime, nullable=False)  # when booking was made
    tour_date = Column(DateTime, nullable=False, index=True)  # actual tour date
    tour_time = Column(String(10), nullable=True)  # "09:00"
    participants_count = Column(Integer, default=1)

    # Pricing
    price_per_person = Column(Float, nullable=False)
    total_price = Column(Float, nullable=False)
    platform_commission = Column(Float, default=0.0)  # 20% to SkyStriker
    guide_payout = Column(Float, default=0.0)  # 80% to guide
    currency = Column(String(3), default="EUR")

    # Payment
    payment_status = Column(String(30), default="pending")  # pending, paid, refunded
    payment_method = Column(String(50), nullable=True)  # card, crypto, cash
    blockchain_tx_hash = Column(String(255), nullable=True)

    # Status
    status = Column(String(30), default="pending", index=True)
    # pending, confirmed, cancelled, completed, no_show

    special_requests = Column(Text, nullable=True)
    internal_notes = Column(Text, nullable=True)

    # Cancellation
    cancellation_reason = Column(Text, nullable=True)
    cancelled_at = Column(DateTime, nullable=True)
    cancelled_by = Column(String(20), nullable=True)  # customer, guide, system

    completed_at = Column(DateTime, nullable=True)
    confirmation_code = Column(String(20), nullable=True, unique=True)
