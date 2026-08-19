from sqlalchemy import Column, Integer, String, ForeignKey, JSON, Float
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
    
    rooms = relationship("Room", back_populates="hotel", cascade="all, delete-orphan")
    wallet = relationship("Wallet", back_populates="hotel", uselist=False, cascade="all, delete-orphan")

class Room(Base):
    __tablename__ = "rooms"
    id = Column(Integer, primary_key=True, index=True)
    hotel_id = Column(Integer, ForeignKey("hotels.id"))
    room_type = Column(String)
    quantity = Column(Integer)
    price_per_night = Column(Integer)
    hotel = relationship("Hotel", back_populates="rooms")

class Wallet(Base):
    __tablename__ = "wallets"
    id = Column(Integer, primary_key=True, index=True)
    hotel_id = Column(Integer, ForeignKey("hotels.id"), unique=True)
    balance = Column(Integer, default=100)
    hotel = relationship("Hotel", back_populates="wallet")

class WalletTransaction(Base):
    __tablename__ = "wallet_transactions"
    id = Column(Integer, primary_key=True, index=True)
    hotel_id = Column(Integer, ForeignKey("hotels.id"))
    amount = Column(Integer)
    description = Column(String)
    created_at = Column(String)

class Lead(Base):
    __tablename__ = "leads"
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("users.id"))
    destination = Column(String)
    check_in = Column(String)
    check_out = Column(String)
    guests = Column(Integer)
    room_type = Column(String)
    budget = Column(Integer)
    purpose = Column(String)
    preferences = Column(String)
    status = Column(String, default="active") # active, won, closed
    matched_hotel_ids = Column(JSON, default=[]) # Storing matched hotel IDs as a list

class LeadUnlock(Base):
    __tablename__ = "lead_unlocks"
    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id"))
    hotel_id = Column(Integer, ForeignKey("hotels.id"))
    credits_spent = Column(Integer)
    unlocked_at = Column(String)

class Quote(Base):
    __tablename__ = "quotes"
    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id"))
    hotel_id = Column(Integer, ForeignKey("hotels.id"))
    price = Column(Integer)
    message = Column(String)
    status = Column(String, default="sent") # sent, accepted, rejected

class Booking(Base):
    __tablename__ = "bookings"
    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id"))
    customer_id = Column(Integer, ForeignKey("users.id"))
    hotel_id = Column(Integer, ForeignKey("hotels.id"))
    total_price = Column(Integer)
    status = Column(String, default="confirmed") # confirmed, checked-in, checked-out
    qr_code = Column(String)
    created_at = Column(String)

class Message(Base):
    __tablename__ = "messages"
    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id"))
    hotel_id = Column(Integer, ForeignKey("hotels.id"))
    sender = Column(String)
    text = Column(String)
    created_at = Column(String)

class Review(Base):
    __tablename__ = "reviews"
    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), unique=True)
    hotel_id = Column(Integer, ForeignKey("hotels.id"))
    customer_id = Column(Integer, ForeignKey("users.id"))
    rating = Column(Integer)
    comment = Column(String, default="")
    created_at = Column(String)
