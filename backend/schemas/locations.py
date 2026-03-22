from typing import Optional
from pydantic import BaseModel


class POICreate(BaseModel):
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    city: Optional[str] = None
    country: str = "Greece"
    region: Optional[str] = None
    opening_hours: dict = {}
    admission_fee: Optional[str] = None
    website: Optional[str] = None
    photos: list[str] = []
    tags: list[str] = []


class POIResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    city: Optional[str] = None
    country: str
    region: Optional[str] = None
    opening_hours: dict = {}
    admission_fee: Optional[str] = None
    website: Optional[str] = None
    photos: list = []
    tags: list = []

    class Config:
        from_attributes = True
