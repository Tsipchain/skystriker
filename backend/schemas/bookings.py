from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class BookingCreate(BaseModel):
    tour_id: str
    customer_name: str
    customer_email: str
    customer_phone: Optional[str] = None
    customer_country: Optional[str] = None
    tour_date: datetime
    tour_time: Optional[str] = None
    participants_count: int = 1
    payment_method: Optional[str] = None
    special_requests: Optional[str] = None


class BookingStatusUpdate(BaseModel):
    status: str  # confirmed, cancelled, completed, no_show
    internal_notes: Optional[str] = None
    cancellation_reason: Optional[str] = None


class BookingResponse(BaseModel):
    id: str
    tour_id: str
    guide_id: str
    customer_name: str
    customer_email: str
    customer_phone: Optional[str] = None
    tour_date: datetime
    tour_time: Optional[str] = None
    participants_count: int
    price_per_person: float
    total_price: float
    platform_commission: float
    guide_payout: float
    currency: str
    payment_status: str
    payment_method: Optional[str] = None
    blockchain_tx_hash: Optional[str] = None
    status: str
    special_requests: Optional[str] = None
    confirmation_code: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
