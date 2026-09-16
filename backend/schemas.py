from pydantic import BaseModel
from typing import List, Optional, Dict, Any, Union

class UserRegister(BaseModel):
    full_name: str
    email: str
    phone: Optional[str] = ""
    password: str
    role: str = "customer"
    otp: Optional[str] = None

class UserLogin(BaseModel):
    email: Optional[str] = None
    phone: Optional[str] = None
    identifier: Optional[str] = None # Email or Mobile Number
    password: str

class HotelLogin(BaseModel):
    email: str
    password: str


class SendOtpRequest(BaseModel):
    email: Optional[str] = None
    phone: Optional[str] = None
    identifier: Optional[str] = None
    purpose: Optional[str] = "registration"

class VerifyOtpRequest(BaseModel):
    email: Optional[str] = None
    phone: Optional[str] = None
    identifier: Optional[str] = None
    otp: str
    purpose: Optional[str] = "registration"

class ResetPasswordRequest(BaseModel):
    email: Optional[str] = None
    phone: Optional[str] = None
    identifier: Optional[str] = None
    otp: str
    new_password: str

class OtpResponse(BaseModel):
    success: bool
    message: str
    otp_debug: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    full_name: str
    email: str
    role: str
    status: str
    phone: Optional[str] = ""
    city: Optional[str] = ""
    preferences: Optional[Dict[str, Any]] = {}
    loyalty_points: Optional[int] = 0
    class Config: from_attributes = True

class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    preferences: Optional[Dict[str, Any]] = None

class UserPasswordChange(BaseModel):
    current_password: str
    new_password: str

class WishlistResponse(BaseModel):
    id: int
    customer_id: int
    hotel_id: int
    created_at: Optional[Any] = None
    class Config: from_attributes = True

class WishlistToggleResponse(BaseModel):
    success: bool
    is_wishlisted: bool
    hotel_id: int
    wishlist: List[int]


class RoomCreate(BaseModel):
    room_type: str
    quantity: int = 5
    price_per_night: int
    description: Optional[str] = None
    max_guests: Optional[int] = 2
    max_adults: Optional[int] = 2
    max_children: Optional[int] = 1
    bed_type: Optional[str] = "King Bed"
    room_size: Optional[str] = "350 sq.ft"
    bathroom_type: Optional[str] = "Private Ensuite"
    amenities: Optional[List[str]] = []
    breakfast_included: Optional[str] = "Included"
    cancellation_policy: Optional[str] = "Free cancellation up to 24 hours before check-in"
    images: Optional[List[str]] = []

class HotelRegister(BaseModel):
    name: str
    location: Optional[str] = ""
    address: Optional[str] = ""
    city: Optional[str] = ""
    state: Optional[str] = ""
    country: Optional[str] = "India"
    pincode: Optional[str] = ""
    contact_number: Optional[str] = ""
    website: Optional[str] = ""
    description: Optional[str] = ""
    property_type: Optional[str] = "Hotel"
    star_rating: Optional[str] = "4"
    total_rooms: Optional[int] = 10
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    email: str
    password: Optional[str] = ""
    status: Optional[str] = "PENDING"
    manager_name: Optional[str] = ""
    manager_phone: Optional[str] = ""
    manager_id: Optional[int] = None
    amenities: Optional[List[str]] = []
    policies: Optional[Dict[str, Any]] = {}
    documents: Optional[List[Dict[str, Any]]] = []
    photos: Optional[List[Any]] = []
    rooms: Optional[List[RoomCreate]] = []

class HotelRejectRequest(BaseModel):
    reason: str

class RoomResponse(BaseModel):
    id: int
    room_type: str
    quantity: int = 5
    price_per_night: int
    description: Optional[str] = None
    max_guests: Optional[int] = 2
    max_adults: Optional[int] = 2
    max_children: Optional[int] = 1
    bed_type: Optional[str] = "King Bed"
    room_size: Optional[str] = "350 sq.ft"
    bathroom_type: Optional[str] = "Private Ensuite"
    amenities: Optional[List[str]] = []
    breakfast_included: Optional[str] = "Included"
    cancellation_policy: Optional[str] = "Free cancellation"
    images: Optional[List[str]] = []
    class Config: from_attributes = True

class HotelResponse(BaseModel):
    id: int
    name: str
    location: Optional[str] = ""
    address: Optional[str] = ""
    city: Optional[str] = ""
    state: Optional[str] = ""
    country: Optional[str] = "India"
    pincode: Optional[str] = ""
    contact_number: Optional[str] = ""
    website: Optional[str] = ""
    description: Optional[str] = ""
    property_type: Optional[str] = "Hotel"
    star_rating: Optional[str] = "4"
    total_rooms: Optional[int] = 10
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    email: str
    status: str
    rejection_reason: Optional[str] = ""
    manager_name: Optional[str] = ""
    manager_phone: Optional[str] = ""
    amenities: Optional[List[str]] = []
    policies: Optional[Dict[str, Any]] = {}
    documents: Optional[List[Dict[str, Any]]] = []
    photos: Optional[List[Any]] = []
    rooms: Optional[List[RoomResponse]] = []
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
    customer_name: Optional[str] = "Guest User"
    customer_email: Optional[str] = "guest@email.com"
    customer_phone: Optional[str] = ""
    created_at: Optional[str] = ""
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
    room_id: Optional[int] = None
    check_in: Optional[str] = None
    check_out: Optional[str] = None
    guests: Optional[int] = 1
    payment_status: Optional[str] = "PAID"

class BookingResponse(BookingCreate):
    id: int
    status: str
    qr_code: str
    created_at: str
    commission_amount: Optional[int] = 0
    payout_amount: Optional[int] = 0
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
