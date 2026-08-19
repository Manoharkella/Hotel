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
            msgs = db.query(models.Message).all()
            chat_groups = {}
            for m in msgs:
                key = (m.lead_id, m.hotel_id)
                if key not in chat_groups or datetime.fromisoformat(m.created_at) > datetime.fromisoformat(chat_groups[key].created_at):
                    chat_groups[key] = m
            
            for key, latest_msg in chat_groups.items():
                if datetime.utcnow() - datetime.fromisoformat(latest_msg.created_at) > timedelta(minutes=5):
                    db.query(models.Message).filter(models.Message.lead_id == key[0], models.Message.hotel_id == key[1]).delete()
            db.commit()
            db.close()
        except Exception as e:
            print("Cleanup task error:", e)
        await asyncio.sleep(60) # Run every 60 seconds

@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(cleanup_idle_chats())
    yield
    task.cancel()

app = FastAPI(title="HotelLead API", lifespan=lifespan)

# Allow frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    
    send_notification("email", new_user.email, "Welcome to HotelLead! Your account is ready.")
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
            "phone": user.phone
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
    
    send_notification("email", "admin@hotellead.com", f"New Hotel Registration: {new_hotel.name} is waiting for approval.")

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

@app.get("/api/admin/users/all", response_model=List[schemas.UserResponse])
def get_all_users(db: Session = Depends(get_db)):
    """Admin endpoint to see all users."""
    return db.query(models.User).all()

@app.get("/api/admin/hotels/all", response_model=List[schemas.HotelResponse])
def get_all_hotels(db: Session = Depends(get_db)):
    """Admin endpoint to see all hotels."""
    return db.query(models.Hotel).all()


@app.put("/api/admin/hotels/{hotel_id}/approve")
def approve_hotel(hotel_id: int, db: Session = Depends(get_db)):
    """Admin approves a hotel, making it visible to customers."""
    db_hotel = db.query(models.Hotel).filter(models.Hotel.id == hotel_id).first()
    if not db_hotel:
        raise HTTPException(status_code=404, detail="Hotel not found")
    
    db_hotel.status = "APPROVED"
    db.commit()
    send_notification("sms", db_hotel.email, f"Congratulations! Your hotel {db_hotel.name} has been APPROVED and is now live on HotelLead.")
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
    """Customer search endpoint. ONLY returns APPROVED hotels."""
    return db.query(models.Hotel).filter(models.Hotel.status == "APPROVED").all()

# --- Business Logic Endpoints ---

@app.post("/api/leads", response_model=schemas.LeadResponse)
def create_lead(lead: schemas.LeadCreate, db: Session = Depends(get_db)):
    try:
        if lead.specific_hotel_id:
            matched_ids = [lead.specific_hotel_id]
        else:
            matched_hotels = db.query(models.Hotel).filter(models.Hotel.location.ilike(f"%{lead.destination}%")).all()
            matched_ids = [h.id for h in matched_hotels]
        
        # Exclude specific_hotel_id when passing to models.Lead
        lead_data = lead.dict(exclude={'specific_hotel_id'})
        new_lead = models.Lead(**lead_data, matched_hotel_ids=matched_ids)
        db.add(new_lead)
        db.commit()
        db.refresh(new_lead)
        return new_lead
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/leads/all", response_model=List[schemas.LeadResponse])
def get_all_leads(db: Session = Depends(get_db)):
    return db.query(models.Lead).all()

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
    
    if wallet.balance < 10:
        raise HTTPException(status_code=400, detail="Insufficient credits")
    
    wallet.balance -= 10
    
    unlock = models.LeadUnlock(
        lead_id=req.lead_id, 
        hotel_id=req.hotel_id, 
        credits_spent=10, 
        unlocked_at=datetime.utcnow().isoformat()
    )
    db.add(unlock)
    
    lead = db.query(models.Lead).filter(models.Lead.id == req.lead_id).first()
    dest = lead.destination if lead else "Unknown"
    
    tx = models.WalletTransaction(
        hotel_id=req.hotel_id,
        amount=-10,
        description=f"Unlocked lead for {dest}",
        created_at=datetime.utcnow().isoformat()
    )
    db.add(tx)
    db.commit()
    
    send_notification("email", "hotel@hotellead.com", f"10 credits spent to unlock lead {req.lead_id}")
    return {"status": "success", "balance": wallet.balance}

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
    new_booking = models.Booking(**booking.dict(), qr_code=qr, created_at=datetime.utcnow().isoformat())
    db.add(new_booking)
    
    db.query(models.Quote).filter(models.Quote.lead_id == booking.lead_id, models.Quote.hotel_id == booking.hotel_id).update({"status": "accepted"})
    db.query(models.Quote).filter(models.Quote.lead_id == booking.lead_id, models.Quote.hotel_id != booking.hotel_id).update({"status": "rejected"})
    db.query(models.Lead).filter(models.Lead.id == booking.lead_id).update({"status": "won"})
    
    db.commit()
    db.refresh(new_booking)
    return new_booking

@app.post("/api/bookings/scan")
def scan_booking(scan: schemas.BookingScan, db: Session = Depends(get_db)):
    booking = db.query(models.Booking).filter(models.Booking.qr_code == scan.qr_code, models.Booking.hotel_id == scan.hotel_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Invalid QR Code or Booking not found for this property")
    if booking.status == "checked-in":
        raise HTTPException(status_code=400, detail="Booking is already checked-in")
    
    booking.status = "checked-in"
    db.commit()
    db.refresh(booking)
    return {"success": True, "booking": booking}

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8080, reload=True)
