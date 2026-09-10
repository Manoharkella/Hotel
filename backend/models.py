from sqlalchemy import Column, Integer, String, ForeignKey, JSON, Float, DateTime, func, CheckConstraint
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    role = Column(String, default="customer") # 'customer' or 'admin'
    status = Column(String, default="ACTIVE")
    phone = Column(String, default="")
    loyalty_points = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class Hotel(Base):
    __tablename__ = "hotels"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    location = Column(String, index=True)
    address = Column(String, default="")
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String) 
    status = Column(String, default="PENDING")
    photos = Column(JSON, default=[])
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    rooms = relationship("Room", back_populates="hotel", cascade="all, delete-orphan")
    wallet = relationship("Wallet", back_populates="hotel", uselist=False, cascade="all, delete-orphan")

class Room(Base):
    __tablename__ = "rooms"
    id = Column(Integer, primary_key=True, index=True)
    hotel_id = Column(Integer, ForeignKey("hotels.id"), index=True)
    room_type = Column(String)
    quantity = Column(Integer, default=5)
    price_per_night = Column(Integer)
    description = Column(String, nullable=True)
    max_guests = Column(Integer, default=2)
    bed_type = Column(String, default="King Bed")
    room_size = Column(String, default="350 sq.ft")
    amenities = Column(JSON, default=["Free Wi-Fi", "Breakfast Included", "AC"])
    breakfast_included = Column(String, default="Included")
    cancellation_policy = Column(String, default="Free cancellation up to 24 hours before check-in")
    images = Column(JSON, default=[])
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    hotel = relationship("Hotel", back_populates="rooms")

class Wallet(Base):
    __tablename__ = "wallets"
    __table_args__ = (
        CheckConstraint("balance >= 0", name="check_wallet_balance_positive"),
    )
    id = Column(Integer, primary_key=True, index=True)
    hotel_id = Column(Integer, ForeignKey("hotels.id"), unique=True, index=True)
    balance = Column(Integer, default=100)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    hotel = relationship("Hotel", back_populates="wallet")

class WalletTransaction(Base):
    __tablename__ = "wallet_transactions"
    id = Column(Integer, primary_key=True, index=True)
    hotel_id = Column(Integer, ForeignKey("hotels.id"), index=True)
    amount = Column(Integer)
    description = Column(String)
    transaction_type = Column(String, default="GENERAL")
    created_at = Column(String)

class Lead(Base):
    __tablename__ = "leads"
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("users.id"), index=True)
    destination = Column(String, index=True)
    check_in = Column(String)
    check_out = Column(String)
    guests = Column(Integer)
    room_type = Column(String)
    budget = Column(Integer)
    purpose = Column(String)
    preferences = Column(String)
    status = Column(String, default="active", index=True) # active, won, closed
    matched_hotel_ids = Column(JSON, default=[]) # Storing matched hotel IDs as a list
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class LeadUnlock(Base):
    __tablename__ = "lead_unlocks"
    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id"), index=True)
    hotel_id = Column(Integer, ForeignKey("hotels.id"), index=True)
    credits_spent = Column(Integer)
    unlocked_at = Column(String)

class Quote(Base):
    __tablename__ = "quotes"
    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id"), index=True)
    hotel_id = Column(Integer, ForeignKey("hotels.id"), index=True)
    price = Column(Integer)
    message = Column(String)
    status = Column(String, default="sent", index=True) # sent, accepted, rejected
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Booking(Base):
    __tablename__ = "bookings"
    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=True, index=True)
    customer_id = Column(Integer, ForeignKey("users.id"), index=True)
    hotel_id = Column(Integer, ForeignKey("hotels.id"), index=True)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=True, index=True)
    check_in = Column(String, nullable=True)
    check_out = Column(String, nullable=True)
    guests = Column(Integer, default=1)
    total_price = Column(Integer)
    commission_amount = Column(Integer, default=0)
    payout_amount = Column(Integer, default=0)
    payment_status = Column(String, default="PAID")
    status = Column(String, default="confirmed", index=True) # confirmed, checked-in, checked-out
    qr_code = Column(String)
    created_at = Column(String)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    room = relationship("Room")

class Message(Base):
    __tablename__ = "messages"
    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id"), index=True)
    hotel_id = Column(Integer, ForeignKey("hotels.id"), index=True)
    sender = Column(String)
    text = Column(String)
    created_at = Column(String)

class Review(Base):
    __tablename__ = "reviews"
    __table_args__ = (
        CheckConstraint("rating >= 1 AND rating <= 5", name="check_review_rating_range"),
    )
    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), unique=True)
    hotel_id = Column(Integer, ForeignKey("hotels.id"), index=True)
    customer_id = Column(Integer, ForeignKey("users.id"), index=True)
    rating = Column(Integer)
    comment = Column(String, default="")
    created_at = Column(String)
