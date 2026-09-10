from fastapi import FastAPI, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, timedelta
import jwt
import bcrypt
import json
import asyncio
from contextlib import asynccontextmanager

SECRET_KEY = "your-super-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 300

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/login")

def verify_password(plain_password, hashed_password):
    if isinstance(plain_password, str):
        plain_password = plain_password.encode('utf-8')
    if isinstance(hashed_password, str):
        hashed_password = hashed_password.encode('utf-8')
    try:
        return bcrypt.checkpw(plain_password, hashed_password)
    except ValueError:
        return False

def get_password_hash(password):
    if isinstance(password, str):
        password = password.encode('utf-8')
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password, salt).decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Email/SMS Notification Stub
def send_notification(notification_type: str, recipient: str, message: str):
    print(f"\n[{datetime.utcnow().isoformat()}] SENDING {notification_type.upper()} TO: {recipient}")
    print(f"MESSAGE: {message}\n")

import models, schemas
from database import engine, get_db, SessionLocal

# Create tables
models.Base.metadata.create_all(bind=engine)

async def cleanup_idle_chats():
    while True:
        try:
            db = SessionLocal()
            cutoff_time = (datetime.utcnow() - timedelta(hours=24)).isoformat()
            db.query(models.Message).filter(models.Message.created_at < cutoff_time).delete(synchronize_session=false)
            db.commit()
            db.close()
        except Exception as e:
            print("Cleanup task error:", e)
        await asyncio.sleep(300) # Run every 5 minutes

@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(cleanup_idle_chats())
    yield
    task.cancel()

app = FastAPI(title="HostIQ API", lifespan=lifespan)

# Allow frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
@app.get("/api")
def root():
    return {
        "status": "online",
        "service": "HostIQ Hotel Platform API",
        "database": "Neon PostgreSQL Connected",
        "documentation": "/docs"
    }

@app.post("/api/users/register", response_model=schemas.UserResponse)
def register_user(user: schemas.UserRegister, db: Session = Depends(get_db)):
    """Customer registration endpoint. Instantly approved without admin confirmation."""
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_user = models.User(
        full_name=user.full_name,
        email=user.email,
        password_hash=get_password_hash(user.password),
        role=user.role,
        status="ACTIVE" # Auto-approved
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    send_notification("email", new_user.email, "Welcome to HostIQ! Your account is ready.")
    return new_user

class UserLogin(BaseModel):
    email: str
    password: str

@app.post("/api/users/login")
def login_user(creds: UserLogin, db: Session = Depends(get_db)):
    """Customer login endpoint."""
    user = db.query(models.User).filter(models.User.email == creds.email).first()
    if not user or not verify_password(creds.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "role": "customer", "id": user.id}, expires_delta=access_token_expires
    )
        
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.full_name,
            "email": user.email,
            "role": "customer",
            "phone": user.phone,
            "loyalty_points": user.loyalty_points
        }
    }

@app.post("/api/admin/login")
def login_admin(creds: UserLogin, db: Session = Depends(get_db)):
    """Admin login endpoint."""
    if creds.email == "admin@gmail.com" and creds.password == "admin":
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": creds.email, "role": "admin", "id": "admin_1"}, expires_delta=access_token_expires
        )
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": "admin_1",
                "name": "System Admin",
                "email": "admin@gmail.com",
                "role": "admin"
            }
        }
    
    user = db.query(models.User).filter(models.User.email == creds.email, models.User.role == "admin").first()
    if not user or not verify_password(creds.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid admin email or password")
        
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "role": "admin", "id": user.id}, expires_delta=access_token_expires
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.full_name,
            "email": user.email,
            "role": "admin"
        }
    }

@app.post("/api/hotels/register", response_model=schemas.HotelResponse)
def register_hotel(hotel: schemas.HotelRegister, db: Session = Depends(get_db)):
    """Hotel submits their registration details including rooms and photos. Goes into PENDING state."""
    db_hotel = db.query(models.Hotel).filter(models.Hotel.email == hotel.email).first()
    if db_hotel:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_hotel = models.Hotel(
        name=hotel.name,
        location=hotel.location,
        address=hotel.address,
        latitude=hotel.latitude,
        longitude=hotel.longitude,
        email=hotel.email,
        password_hash=get_password_hash(hotel.password),
        photos=hotel.photos,
        status="PENDING"
    )
    db.add(new_hotel)
    db.commit()
    db.refresh(new_hotel)
    
    send_notification("email", "admin@hostiq.com", f"New Hotel Registration: {new_hotel.name} is waiting for approval.")

    for room in hotel.rooms:
        new_room = models.Room(
            hotel_id=new_hotel.id,
            room_type=room.room_type,
            quantity=room.quantity,
            price_per_night=room.price_per_night
        )
        db.add(new_room)
    db.commit()
    db.refresh(new_hotel)
    
    return new_hotel


class HotelLogin(BaseModel):
    email: str
    password: str

@app.post("/api/hotels/login")
def login_hotel(creds: HotelLogin, db: Session = Depends(get_db)):
    """Hotel login endpoint that checks approval status."""
    hotel = db.query(models.Hotel).filter(models.Hotel.email == creds.email).first()
    if not hotel or not verify_password(creds.password, hotel.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if hotel.status == "PENDING":
        raise HTTPException(status_code=403, detail="Your hotel account is still pending admin approval.")
    if hotel.status == "SUSPENDED":
        raise HTTPException(status_code=403, detail="Your account has been suspended.")
        
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": hotel.email, "role": "hotel", "id": hotel.id}, expires_delta=access_token_expires
    )
        
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": hotel.id,
            "name": hotel.name,
            "email": hotel.email,
            "role": "hotel",
            "hotelId": hotel.id
        }
    }

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid authorization credentials")
        return payload
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token signature")

from sqlalchemy.orm import joinedload

@app.get("/api/admin/users/all", response_model=List[schemas.UserResponse])
def get_all_users(db: Session = Depends(get_db)):
    """Admin endpoint to see all users."""
    return db.query(models.User).all()

@app.get("/api/admin/hotels/all", response_model=List[schemas.HotelResponse])
def get_all_hotels(db: Session = Depends(get_db)):
    """Admin endpoint to see all hotels with eager loaded rooms."""
    return db.query(models.Hotel).options(joinedload(models.Hotel.rooms)).all()


@app.put("/api/admin/hotels/{hotel_id}/approve")
def approve_hotel(hotel_id: int, db: Session = Depends(get_db)):
    """Admin approves a hotel, making it visible to customers."""
    db_hotel = db.query(models.Hotel).filter(models.Hotel.id == hotel_id).first()
    if not db_hotel:
        raise HTTPException(status_code=404, detail="Hotel not found")
    
    db_hotel.status = "APPROVED"
    db.commit()
    send_notification("sms", db_hotel.email, f"Congratulations! Your hotel {db_hotel.name} has been APPROVED and is now live on HostIQ.")
    return {"message": f"{db_hotel.name} has been APPROVED and is now live."}


@app.put("/api/admin/hotels/{hotel_id}/suspend")
def suspend_hotel(hotel_id: int, db: Session = Depends(get_db)):
    """Admin suspends a hotel."""
    db_hotel = db.query(models.Hotel).filter(models.Hotel.id == hotel_id).first()
    if not db_hotel:
        raise HTTPException(status_code=404, detail="Hotel not found")
    
    db_hotel.status = "SUSPENDED"
    db.commit()
    return {"message": f"{db_hotel.name} has been SUSPENDED."}
@app.get("/api/customer/hotels/search", response_model=List[schemas.HotelResponse])
def search_approved_hotels(db: Session = Depends(get_db)):
    """Customer search endpoint. ONLY returns APPROVED hotels with eager loaded rooms."""
    return db.query(models.Hotel).options(joinedload(models.Hotel.rooms)).filter(models.Hotel.status == "APPROVED").all()

# --- Business Logic Endpoints ---

@app.post("/api/leads", response_model=schemas.LeadResponse)
def create_lead(lead: schemas.LeadCreate, db: Session = Depends(get_db)):
    try:
        if lead.specific_hotel_id:
            matched_ids = [lead.specific_hotel_id]
        else:
            # Query location matched hotels
            dest_term = lead.destination.split(',')[0].strip() if ',' in lead.destination else lead.destination.strip()
            hotels_in_dest = db.query(models.Hotel).options(joinedload(models.Hotel.rooms)).filter(models.Hotel.location.ilike(f"%{dest_term}%")).all()
            matched_ids = []
            for h in hotels_in_dest:
                min_room_price = min([r.price_per_night for r in h.rooms]) if h.rooms else 3000
                if min_room_price <= lead.budget:
                    matched_ids.append(h.id)
            
            # Fallback to all location hotels if none are below budget
            if not matched_ids:
                matched_ids = [h.id for h in hotels_in_dest]
        
        # Exclude specific_hotel_id when passing to models.Lead
        lead_data = lead.dict(exclude={'specific_hotel_id'})
        new_lead = models.Lead(**lead_data, matched_hotel_ids=matched_ids)
        db.add(new_lead)
        db.commit()
        db.refresh(new_lead)

        user = db.query(models.User).filter(models.User.id == new_lead.customer_id).first()
        return {
            "id": new_lead.id,
            "customer_id": new_lead.customer_id,
            "destination": new_lead.destination,
            "check_in": new_lead.check_in,
            "check_out": new_lead.check_out,
            "guests": new_lead.guests,
            "room_type": new_lead.room_type,
            "budget": new_lead.budget,
            "purpose": new_lead.purpose or "Leisure",
            "preferences": new_lead.preferences or "",
            "status": new_lead.status or "active",
            "matched_hotel_ids": new_lead.matched_hotel_ids or [],
            "customer_name": user.full_name if user else "Guest User",
            "customer_phone": user.phone if user else "",
            "created_at": str(new_lead.created_at) if new_lead.created_at else ""
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/leads/all", response_model=List[schemas.LeadResponse])
def get_all_leads(db: Session = Depends(get_db)):
    leads = db.query(models.Lead).order_by(models.Lead.id.desc()).all()
    users = {u.id: u for u in db.query(models.User).all()}
    result = []
    for l in leads:
        u = users.get(l.customer_id)
        result.append({
            "id": l.id,
            "customer_id": l.customer_id,
            "destination": l.destination,
            "check_in": l.check_in,
            "check_out": l.check_out,
            "guests": l.guests,
            "room_type": l.room_type,
            "budget": l.budget,
            "purpose": l.purpose or "Leisure",
            "preferences": l.preferences or "",
            "status": l.status or "active",
            "matched_hotel_ids": l.matched_hotel_ids or [],
            "customer_name": u.full_name if u else "Guest User",
            "customer_phone": u.phone if u else "",
            "created_at": str(l.created_at) if l.created_at else ""
        })
    return result

class LeadDateUpdate(BaseModel):
    check_in: str
    check_out: str

@app.put("/api/leads/{lead_id}/dates")
def update_lead_dates(lead_id: int, dates: LeadDateUpdate, db: Session = Depends(get_db)):
    lead = db.query(models.Lead).filter(models.Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    lead.check_in = dates.check_in
    lead.check_out = dates.check_out
    db.commit()
    db.refresh(lead)
    return lead

@app.get("/api/quotes/all", response_model=List[schemas.QuoteResponse])
def get_all_quotes(db: Session = Depends(get_db)):
    return db.query(models.Quote).all()

@app.get("/api/bookings/all", response_model=List[schemas.BookingResponse])
def get_all_bookings(db: Session = Depends(get_db)):
    return db.query(models.Booking).all()

@app.get("/api/wallets/hotel/{hotel_id}", response_model=schemas.WalletResponse)
def get_wallet(hotel_id: int, db: Session = Depends(get_db)):
    wallet = db.query(models.Wallet).filter(models.Wallet.hotel_id == hotel_id).first()
    if not wallet:
        wallet = models.Wallet(hotel_id=hotel_id, balance=100)
        db.add(wallet)
        db.commit()
        db.refresh(wallet)
    return wallet

@app.post("/api/leads/unlock")
def unlock_lead(req: schemas.LeadUnlockCreate, db: Session = Depends(get_db)):
    wallet = db.query(models.Wallet).filter(models.Wallet.hotel_id == req.hotel_id).first()
    if not wallet:
        wallet = models.Wallet(hotel_id=req.hotel_id, balance=100)
        db.add(wallet)
    
    existing_unlock = db.query(models.LeadUnlock).filter(
        models.LeadUnlock.lead_id == req.lead_id,
        models.LeadUnlock.hotel_id == req.hotel_id
    ).first()

    if not existing_unlock:
        # Free unlock for initial chat & negotiation phase (0 credits)
        unlock = models.LeadUnlock(
            lead_id=req.lead_id, 
            hotel_id=req.hotel_id, 
            credits_spent=0, 
            unlocked_at=datetime.utcnow().isoformat()
        )
        db.add(unlock)
        db.commit()
    
    return {"status": "success", "balance": wallet.balance, "commission_mode": False}

@app.get("/api/wallets/hotel/{hotel_id}/transactions")
def get_transactions(hotel_id: int, db: Session = Depends(get_db)):
    txs = db.query(models.WalletTransaction).filter(models.WalletTransaction.hotel_id == hotel_id).order_by(models.WalletTransaction.id.desc()).all()
    return txs

@app.get("/api/admin/transactions")
def get_all_transactions(db: Session = Depends(get_db)):
    txs = db.query(models.WalletTransaction).order_by(models.WalletTransaction.id.desc()).all()
    results = []
    for tx in txs:
        hotel = db.query(models.Hotel).filter(models.Hotel.id == tx.hotel_id).first()
        wallet = db.query(models.Wallet).filter(models.Wallet.hotel_id == tx.hotel_id).first()
        results.append({
            "id": tx.id,
            "hotel_id": tx.hotel_id,
            "hotel_name": hotel.name if hotel else f"Hotel #{tx.hotel_id}",
            "amount": tx.amount,
            "description": tx.description,
            "created_at": tx.created_at,
            "current_balance": wallet.balance if wallet else 0
        })
    return results

@app.get("/api/leads/unlocked/{hotel_id}")
def get_unlocked_leads(hotel_id: int, db: Session = Depends(get_db)):
    unlocks = db.query(models.LeadUnlock).filter(models.LeadUnlock.hotel_id == hotel_id).all()
    return [u.lead_id for u in unlocks]

@app.post("/api/quotes", response_model=schemas.QuoteResponse)
def create_quote(quote: schemas.QuoteCreate, db: Session = Depends(get_db)):
    wallet = db.query(models.Wallet).filter(models.Wallet.hotel_id == quote.hotel_id).first()
    if not wallet:
        wallet = models.Wallet(hotel_id=quote.hotel_id, balance=100)
        db.add(wallet)
    
    lead = db.query(models.Lead).filter(models.Lead.id == quote.lead_id).first()
    dest = lead.destination if lead else "Unknown"
    
    # Check if this hotel has already paid credits for this lead
    existing_unlock = db.query(models.LeadUnlock).filter(
        models.LeadUnlock.lead_id == quote.lead_id,
        models.LeadUnlock.hotel_id == quote.hotel_id
    ).first()

    # OPTION A: If credits have not yet been charged for this lead
    if not existing_unlock or not existing_unlock.credits_spent or existing_unlock.credits_spent == 0:
        if wallet.balance >= 10:
            # Hotel has credits -> spend 10 credits -> 0% commission on booking!
            wallet.balance -= 10
            credits_spent = 10
            desc = f"Quotation issued for Lead #{quote.lead_id} ({dest}) (-10 credits, 0% commission on booking)"
            tx_type = "QUOTE_FEE"
        else:
            # Hotel has 0 credits -> 10% commission mode applied on customer payment!
            credits_spent = 0
            desc = f"Quotation issued for Lead #{quote.lead_id} ({dest}) (Zero credits: 10% commission applies on booking)"
            tx_type = "COMMISSION_LEAD"

        if not existing_unlock:
            existing_unlock = models.LeadUnlock(
                lead_id=quote.lead_id, 
                hotel_id=quote.hotel_id, 
                credits_spent=credits_spent, 
                unlocked_at=datetime.utcnow().isoformat()
            )
            db.add(existing_unlock)
        else:
            existing_unlock.credits_spent = credits_spent

        tx = models.WalletTransaction(
            hotel_id=quote.hotel_id,
            amount=-credits_spent,
            description=desc,
            transaction_type=tx_type,
            created_at=datetime.utcnow().isoformat()
        )
        db.add(tx)

    new_quote = models.Quote(**quote.dict())
    db.add(new_quote)
    db.commit()
    db.refresh(new_quote)
    return new_quote

@app.put("/api/quotes/{quote_id}/counter", response_model=schemas.QuoteResponse)
def counter_quote(quote_id: int, counter: schemas.QuoteCounter, db: Session = Depends(get_db)):
    quote = db.query(models.Quote).filter(models.Quote.id == quote_id).first()
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")
    
    quote.price = counter.price
    quote.status = "countered"
    db.commit()
    db.refresh(quote)
    return quote

@app.post("/api/bookings", response_model=schemas.BookingResponse)
def create_booking(booking: schemas.BookingCreate, db: Session = Depends(get_db)):
    qr = f"BK-{booking.hotel_id}-{booking.customer_id}-{datetime.utcnow().timestamp()}"
    lead = db.query(models.Lead).filter(models.Lead.id == booking.lead_id).first()
    
    booking_dict = booking.dict()
    if not booking_dict.get("check_in") and lead:
        booking_dict["check_in"] = lead.check_in
    if not booking_dict.get("check_out") and lead:
        booking_dict["check_out"] = lead.check_out
    if not booking_dict.get("guests") and lead:
        booking_dict["guests"] = lead.guests or 1

    new_booking = models.Booking(**booking_dict, qr_code=qr, created_at=datetime.utcnow().isoformat())
    db.add(new_booking)
    
    db.query(models.Quote).filter(models.Quote.lead_id == booking.lead_id, models.Quote.hotel_id == booking.hotel_id).update({"status": "accepted"})
    db.query(models.Quote).filter(models.Quote.lead_id == booking.lead_id, models.Quote.hotel_id != booking.hotel_id).update({"status": "rejected"})
    db.query(models.Lead).filter(models.Lead.id == booking.lead_id).update({"status": "won"})
    
    # OPTION A: Check commission eligibility
    unlock = db.query(models.LeadUnlock).filter(
        models.LeadUnlock.lead_id == booking.lead_id, 
        models.LeadUnlock.hotel_id == booking.hotel_id
    ).first()
    
    if unlock and unlock.credits_spent and unlock.credits_spent >= 10:
        # Hotel spent credits -> 0% commission! Hotel gets 100% of customer pay.
        commission_amount = 0
        payout_amount = booking.total_price
        tx_desc = f"Booking confirmed! Full payout of ₹{payout_amount:,} (0% commission - Paid with 10 credits)"
        tx_type = "BOOKING_PAYOUT"
    else:
        # Hotel had 0 credits -> 10% commission applied on customer payment!
        commission_amount = int(booking.total_price * 0.10)
        payout_amount = booking.total_price - commission_amount
        tx_desc = f"Booking confirmed! 10% Commission fee ₹{commission_amount:,} deducted from customer payment ₹{booking.total_price:,}. Net Hotel Payout: ₹{payout_amount:,}"
        tx_type = "COMMISSION_PAYOUT"

    new_booking.commission_amount = commission_amount
    new_booking.payout_amount = payout_amount

    # Record transaction log (amount=0 credits so credit wallet balance is not corrupted by rupee amounts)
    commission_tx = models.WalletTransaction(
        hotel_id=booking.hotel_id,
        amount=0,
        description=tx_desc,
        transaction_type=tx_type,
        created_at=datetime.utcnow().isoformat()
    )
    db.add(commission_tx)

    db.commit()
    db.refresh(new_booking)
    return new_booking

@app.post("/api/bookings/scan")
def scan_booking(scan: schemas.BookingScan, db: Session = Depends(get_db)):
    booking = None
    if scan.qr_code.isdigit():
        booking = db.query(models.Booking).filter(models.Booking.id == int(scan.qr_code), models.Booking.hotel_id == scan.hotel_id).first()
    if not booking:
        booking = db.query(models.Booking).filter(models.Booking.qr_code == scan.qr_code, models.Booking.hotel_id == scan.hotel_id).first()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Invalid QR Code or Booking not found for this property")
    if booking.status == "checked-in":
        raise HTTPException(status_code=400, detail="Booking is already checked-in")
    
    booking.status = "checked-in"
    
    # Award loyalty points for checking in
    user = db.query(models.User).filter(models.User.id == booking.customer_id).first()
    if user:
        user.loyalty_points = (user.loyalty_points or 0) + 100
        
    db.commit()
    db.refresh(booking)
    return {
        "success": True, 
        "booking": {
            "id": booking.id,
            "customer_id": booking.customer_id,
            "customerName": user.full_name if user else "Valued Guest",
            "hotel_id": booking.hotel_id,
            "total_price": booking.total_price,
            "status": booking.status,
            "qr_code": booking.qr_code,
            "check_in": booking.check_in,
            "check_out": booking.check_out,
            "guests": booking.guests
        }
    }

@app.put("/api/bookings/{booking_id}/checkout")
def checkout_booking(booking_id: int, db: Session = Depends(get_db)):
    booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    booking.status = "checked-out"
    db.commit()
    db.refresh(booking)
    return {"success": True, "booking": booking}

@app.put("/api/bookings/{booking_id}/cancel")
def cancel_booking(booking_id: int, db: Session = Depends(get_db)):
    booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    booking.status = "cancelled"
    if booking.lead_id:
        db.query(models.Lead).filter(models.Lead.id == booking.lead_id).update({"status": "cancelled"})
    db.commit()
    db.refresh(booking)
    return {"success": True, "booking": booking}

class HotelUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    address: Optional[str] = None
    photos: Optional[List[str]] = None

@app.put("/api/hotels/{hotel_id}")
def update_hotel(hotel_id: int, update: HotelUpdate, db: Session = Depends(get_db)):
    hotel = db.query(models.Hotel).filter(models.Hotel.id == hotel_id).first()
    if not hotel:
        raise HTTPException(status_code=404, detail="Hotel not found")
    if update.name is not None: hotel.name = update.name
    if update.location is not None: hotel.location = update.location
    if update.address is not None: hotel.address = update.address
    if update.photos is not None: hotel.photos = update.photos
    db.commit()
    db.refresh(hotel)
    return hotel

class RoomUpdate(BaseModel):
    room_type: Optional[str] = None
    price_per_night: Optional[int] = None
    quantity: Optional[int] = None
    description: Optional[str] = None
    max_guests: Optional[int] = None
    bed_type: Optional[str] = None
    room_size: Optional[str] = None
    amenities: Optional[List[str]] = None
    breakfast_included: Optional[str] = None
    cancellation_policy: Optional[str] = None
    images: Optional[List[str]] = None

@app.post("/api/hotels/{hotel_id}/rooms", response_model=schemas.RoomResponse)
def create_hotel_room(hotel_id: int, room: schemas.RoomCreate, db: Session = Depends(get_db)):
    hotel = db.query(models.Hotel).filter(models.Hotel.id == hotel_id).first()
    if not hotel:
        raise HTTPException(status_code=404, detail="Hotel not found")
    new_room = models.Room(**room.dict(), hotel_id=hotel_id)
    db.add(new_room)
    db.commit()
    db.refresh(new_room)
    return new_room

@app.put("/api/rooms/{room_id}")
def update_room(room_id: int, update: RoomUpdate, db: Session = Depends(get_db)):
    room = db.query(models.Room).filter(models.Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    if update.room_type is not None: room.room_type = update.room_type
    if update.price_per_night is not None: room.price_per_night = update.price_per_night
    if update.quantity is not None: room.quantity = update.quantity
    if update.description is not None: room.description = update.description
    if update.max_guests is not None: room.max_guests = update.max_guests
    if update.bed_type is not None: room.bed_type = update.bed_type
    if update.room_size is not None: room.room_size = update.room_size
    if update.amenities is not None: room.amenities = update.amenities
    if update.breakfast_included is not None: room.breakfast_included = update.breakfast_included
    if update.cancellation_policy is not None: room.cancellation_policy = update.cancellation_policy
    if update.images is not None: room.images = update.images
    db.commit()
    db.refresh(room)
    return room

@app.delete("/api/rooms/{room_id}")
def delete_room(room_id: int, db: Session = Depends(get_db)):
    room = db.query(models.Room).filter(models.Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    db.delete(room)
    db.commit()
    return {"message": "Room deleted successfully", "id": room_id}


@app.post("/api/messages", response_model=schemas.MessageResponse)
def create_message(msg: schemas.MessageCreate, db: Session = Depends(get_db)):
    new_msg = models.Message(**msg.dict(), created_at=datetime.utcnow().isoformat())
    db.add(new_msg)
    db.commit()
    db.refresh(new_msg)
    return new_msg

@app.get("/api/messages/{lead_id}/{hotel_id}", response_model=List[schemas.MessageResponse])
def get_messages(lead_id: int, hotel_id: int, db: Session = Depends(get_db)):
    # We keep the GET messages endpoint for initial load
    msgs = db.query(models.Message).filter(
        models.Message.lead_id == lead_id, 
        models.Message.hotel_id == hotel_id
    ).order_by(models.Message.created_at.asc()).all()
    return msgs

@app.get("/api/messages/recent", response_model=List[schemas.MessageResponse])
def get_recent_messages(
    hotel_id: Optional[int] = None, 
    customer_id: Optional[int] = None, 
    since: Optional[str] = None, 
    db: Session = Depends(get_db)
):
    query = db.query(models.Message)
    if hotel_id is not None:
        query = query.filter(models.Message.hotel_id == hotel_id)
    elif customer_id is not None:
        customer_leads = db.query(models.Lead.id).filter(
            (models.Lead.customer_id == customer_id) | (models.Lead.customer_id == None) | (models.Lead.customer_id == 1)
        ).all()
        lead_ids = [l[0] for l in customer_leads]
        if not lead_ids:
            return []
        query = query.filter(models.Message.lead_id.in_(lead_ids))
    
    if since:
        query = query.filter(models.Message.created_at > since)
        
    return query.order_by(models.Message.id.desc()).limit(30).all()

# --- WebSocket Chat ---
class ConnectionManager:
    def __init__(self):
        self.active_connections = {}

    async def connect(self, websocket: WebSocket, lead_id: int, hotel_id: int):
        await websocket.accept()
        key = (lead_id, hotel_id)
        if key not in self.active_connections:
            self.active_connections[key] = []
        self.active_connections[key].append(websocket)

    def disconnect(self, websocket: WebSocket, lead_id: int, hotel_id: int):
        key = (lead_id, hotel_id)
        if key in self.active_connections and websocket in self.active_connections[key]:
            self.active_connections[key].remove(websocket)

    async def broadcast(self, message: dict, lead_id: int, hotel_id: int):
        key = (lead_id, hotel_id)
        if key in self.active_connections:
            for connection in self.active_connections[key]:
                try:
                    await connection.send_json(message)
                except:
                    pass

manager = ConnectionManager()

@app.websocket("/api/ws/chat/{lead_id}/{hotel_id}")
async def websocket_endpoint(websocket: WebSocket, lead_id: int, hotel_id: int, db: Session = Depends(get_db)):
    await manager.connect(websocket, lead_id, hotel_id)
    try:
        while True:
            data = await websocket.receive_text()
            payload = json.loads(data)
            new_msg = models.Message(
                lead_id=lead_id, 
                hotel_id=hotel_id, 
                sender=payload["sender"], 
                text=payload["text"],
                created_at=datetime.utcnow().isoformat()
            )
            db.add(new_msg)
            db.commit()
            db.refresh(new_msg)
            
            await manager.broadcast({
                "id": new_msg.id,
                "lead_id": new_msg.lead_id,
                "hotel_id": new_msg.hotel_id,
                "sender": new_msg.sender,
                "text": new_msg.text,
                "created_at": new_msg.created_at
            }, lead_id, hotel_id)
    except WebSocketDisconnect:
        manager.disconnect(websocket, lead_id, hotel_id)

# --- Reviews ---
@app.post("/api/reviews", response_model=schemas.ReviewResponse)
def create_review(review: schemas.ReviewCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Review).filter(models.Review.booking_id == review.booking_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Booking already reviewed")
    
    new_rev = models.Review(**review.dict(), created_at=datetime.utcnow().isoformat())
    db.add(new_rev)
    
    # Update booking rating internally if needed, or just rely on reviews table
    db.commit()
    db.refresh(new_rev)
    return new_rev

@app.get("/api/reviews/hotel/{hotel_id}", response_model=List[schemas.ReviewResponse])
def get_hotel_reviews(hotel_id: int, db: Session = Depends(get_db)):
    return db.query(models.Review).filter(models.Review.hotel_id == hotel_id).all()

@app.get("/api/reviews/all", response_model=List[schemas.ReviewResponse])
def get_all_reviews(db: Session = Depends(get_db)):
    return db.query(models.Review).all()

@app.post("/api/wallets/purchase")
def purchase_credits(req: dict, db: Session = Depends(get_db)):
    hotel_id = req.get("hotel_id")
    amount = req.get("amount", 100)
    package_name = req.get("package", "Credit Package")
    if not hotel_id:
        raise HTTPException(status_code=400, detail="hotel_id required")
    
    wallet = db.query(models.Wallet).filter(models.Wallet.hotel_id == hotel_id).first()
    if not wallet:
        wallet = models.Wallet(hotel_id=hotel_id, balance=100)
        db.add(wallet)
    
    wallet.balance += amount
    tx = models.WalletTransaction(
        hotel_id=hotel_id,
        amount=amount,
        description=f"Purchased {package_name} (+{amount} credits)",
        transaction_type="CREDIT_PURCHASE",
        created_at=datetime.utcnow().isoformat()
    )
    db.add(tx)
    db.commit()
    return {"status": "success", "balance": wallet.balance}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8080, reload=True)
