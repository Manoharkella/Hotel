from pydantic import BaseModel
from typing import List, Optional

class UserRegister(BaseModel):
    full_name: str
    email: str
    password: str
    role: str = "customer"

class UserResponse(BaseModel):
    id: int
    full_name: str
    email: str
    role: str
    status: str
    class Config: from_attributes = True

class RoomCreate(BaseModel):
    room_type: str
    quantity: int
    price_per_night: int

class HotelRegister(BaseModel):
    name: str
    location: str
    address: str = ""
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    email: str
    password: str
    photos: List[str] = []
    rooms: List[RoomCreate]

class RoomResponse(BaseModel):
    id: int
    room_type: str
    quantity: int
    price_per_night: int
    class Config: from_attributes = True

class HotelResponse(BaseModel):
    id: int
    name: str
    location: str
    address: str
    latitude: Optional[float]
    longitude: Optional[float]
    email: str
    status: str
    photos: List[str]
    rooms: List[RoomResponse]
    class Config: from_attributes = True

class LeadCreate(BaseModel):
    customer_id: int
    destination: str
    check_in: str
    check_out: str
    guests: int
    room_type: str
    budget: int
    purpose: str
    preferences: Optional[str] = ""
    specific_hotel_id: Optional[int] = None

class LeadResponse(LeadCreate):
    id: int
    status: str
    matched_hotel_ids: List[int]
    class Config: from_attributes = True

class QuoteCreate(BaseModel):
    lead_id: int
    hotel_id: int
    price: int
    message: str

class QuoteResponse(QuoteCreate):
    id: int
    status: str
    class Config: from_attributes = True

class QuoteCounter(BaseModel):
    price: int

class LeadUnlockCreate(BaseModel):
    lead_id: int
    hotel_id: int

class BookingCreate(BaseModel):
    lead_id: int
    customer_id: int
    hotel_id: int
    total_price: int

class BookingResponse(BookingCreate):
    id: int
    status: str
    qr_code: str
    created_at: str
    class Config: from_attributes = True

class BookingScan(BaseModel):
    qr_code: str
    hotel_id: int

class WalletResponse(BaseModel):
    id: int
    hotel_id: int
    balance: int
    class Config: from_attributes = True

class MessageCreate(BaseModel):
    lead_id: int
    hotel_id: int
    sender: str
    text: str

class MessageResponse(MessageCreate):
    id: int
    created_at: str
    class Config: from_attributes = True

class ReviewCreate(BaseModel):
    booking_id: int
    hotel_id: int
    customer_id: int
    rating: int
    comment: Optional[str] = ""

class ReviewResponse(ReviewCreate):
    id: int
    created_at: str
    class Config: from_attributes = True
