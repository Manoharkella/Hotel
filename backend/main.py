from fastapi import FastAPI, Depends, HTTPException, status, WebSocket, WebSocketDisconnect, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime, timedelta, timezone
import jwt
import bcrypt
import json
import asyncio
import random
from contextlib import asynccontextmanager

SECRET_KEY = "your-super-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 7 days

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/users/login", auto_error=False)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    if isinstance(plain_password, str):
        plain_password = plain_password.encode('utf-8')
    if isinstance(hashed_password, str):
        hashed_password = hashed_password.encode('utf-8')
    try:
        return bcrypt.checkpw(plain_password, hashed_password)
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    if isinstance(password, str):
        password = password.encode('utf-8')
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password, salt).decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

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
            db.query(models.Message).filter(models.Message.created_at < cutoff_time).delete(synchronize_session=False)
            db.commit()
            db.close()
        except Exception as e:
            print("Cleanup task error:", e)
        await asyncio.sleep(300)

@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(cleanup_idle_chats())
    yield
    task.cancel()

app = FastAPI(title="HostIQ API", lifespan=lifespan)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Authentication Dependency & Security Filter
def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme), 
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> dict:
    raw_token = token
    if not raw_token and authorization:
        if authorization.startswith("Bearer "):
            raw_token = authorization.split("Bearer ")[1].strip()
        else:
            raw_token = authorization.strip()
            
    if not raw_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Authentication credentials were not provided"
        )
    
    try:
        payload = jwt.decode(raw_token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("id")
        role = payload.get("role", "customer")
        email = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, 
                detail="Invalid token payload"
            )
        return {"id": user_id, "role": role, "email": email}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired. Please log in again.")
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication token")

def get_optional_user(
    token: Optional[str] = Depends(oauth2_scheme),
    authorization: Optional[str] = Header(None)
) -> Optional[dict]:
    raw_token = token
    if not raw_token and authorization:
        if authorization.startswith("Bearer "):
            raw_token = authorization.split("Bearer ")[1].strip()
        else:
            raw_token = authorization.strip()
    if not raw_token:
        return None
    try:
        payload = jwt.decode(raw_token, SECRET_KEY, algorithms=[ALGORITHM])
        return {"id": payload.get("id"), "role": payload.get("role", "customer"), "email": payload.get("sub")}
    except Exception:
        return None


# --- General / Health Root ---
@app.get("/")
@app.get("/api")
def root():
    return {
        "status": "online",
        "service": "HostIQ Hotel Platform API",
        "privacy_and_access_control": "Enforced (Strict User Isolation)",
        "documentation": "/docs"
    }


# =====================================================================
# OTP AUTHENTICATION ENDPOINTS
# =====================================================================

@app.post("/api/auth/send-otp", response_model=schemas.OtpResponse)
def send_otp_endpoint(req: schemas.SendOtpRequest, db: Session = Depends(get_db)):
    identifier = (req.identifier or req.email or req.phone or "").strip()
    if not identifier:
        raise HTTPException(status_code=400, detail="Email or phone number is required")
    
    otp_code = str(random.randint(100000, 999999))
    expires_at = datetime.utcnow() + timedelta(minutes=10)
    
    db.query(models.OTPVerification).filter(
        models.OTPVerification.identifier == identifier,
        models.OTPVerification.purpose == (req.purpose or "registration")
    ).delete(synchronize_session=False)
    
    otp_record = models.OTPVerification(
        identifier=identifier,
        otp_code=otp_code,
        purpose=req.purpose or "registration",
        is_verified=0,
        expires_at=expires_at
    )
    db.add(otp_record)
    db.commit()
    
    send_notification("sms/email", identifier, f"Your HostIQ Verification OTP is: {otp_code}. Valid for 10 minutes.")
    return {
        "success": True,
        "message": f"OTP sent successfully to {identifier}",
        "otp_debug": otp_code
    }

@app.post("/api/auth/verify-otp", response_model=schemas.OtpResponse)
def verify_otp_endpoint(req: schemas.VerifyOtpRequest, db: Session = Depends(get_db)):
    identifier = (req.identifier or req.email or req.phone or "").strip()
    otp_code = (req.otp or "").strip()
    
    if not identifier or not otp_code:
        raise HTTPException(status_code=400, detail="Identifier and OTP are required")
        
    record = db.query(models.OTPVerification).filter(
        models.OTPVerification.identifier == identifier,
        models.OTPVerification.otp_code == otp_code,
        models.OTPVerification.purpose == (req.purpose or "registration")
    ).order_by(models.OTPVerification.id.desc()).first()
    
    if not record:
        raise HTTPException(status_code=400, detail="Invalid OTP code. Please check and try again.")
        
    if record.expires_at:
        now_utc = datetime.now(timezone.utc)
        exp = record.expires_at if getattr(record.expires_at, 'tzinfo', None) else record.expires_at.replace(tzinfo=timezone.utc)
        if exp < now_utc:
            raise HTTPException(status_code=400, detail="OTP has expired. Please request a new code.")
        
    record.is_verified = 1
    db.commit()
    return {"success": True, "message": "OTP verified successfully"}

@app.post("/api/auth/reset-password", response_model=schemas.OtpResponse)
def reset_password_endpoint(req: schemas.ResetPasswordRequest, db: Session = Depends(get_db)):
    identifier = (req.identifier or req.email or req.phone or "").strip()
    otp_code = (req.otp or "").strip()
    new_password = (req.new_password or "").strip()
    
    if not identifier or not otp_code or not new_password:
        raise HTTPException(status_code=400, detail="Identifier, OTP, and new password are required")
    if len(new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
        
    record = db.query(models.OTPVerification).filter(
        models.OTPVerification.identifier == identifier,
        models.OTPVerification.otp_code == otp_code,
        models.OTPVerification.purpose == "forgot_password"
    ).order_by(models.OTPVerification.id.desc()).first()
    
    if not record:
        raise HTTPException(status_code=400, detail="Invalid or unverified OTP code")
    if record.expires_at:
        now_utc = datetime.now(timezone.utc)
        exp = record.expires_at if getattr(record.expires_at, 'tzinfo', None) else record.expires_at.replace(tzinfo=timezone.utc)
        if exp < now_utc:
            raise HTTPException(status_code=400, detail="OTP code has expired")
        
    user = db.query(models.User).filter(
        (models.User.email == identifier) | (models.User.phone == identifier)
    ).first()
    
    if not user:
        hotel = db.query(models.Hotel).filter(models.Hotel.email == identifier).first()
        if not hotel:
            raise HTTPException(status_code=404, detail="No account found with this identifier")
        hotel.password_hash = get_password_hash(new_password)
    else:
        user.password_hash = get_password_hash(new_password)
        
    db.delete(record)
    db.commit()
    return {"success": True, "message": "Password has been successfully updated. You can now log in."}


# =====================================================================
# CUSTOMER AUTH & USER PROFILE ENDPOINTS
# =====================================================================

@app.post("/api/users/register", response_model=schemas.UserResponse)
def register_user(user: schemas.UserRegister, db: Session = Depends(get_db)):
    """Customer registration endpoint."""
    existing_email = db.query(models.User).filter(models.User.email == user.email.strip().lower()).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="An account with this email address already exists")
    
    if user.phone:
        existing_phone = db.query(models.User).filter(models.User.phone == user.phone.strip()).first()
        if existing_phone:
            raise HTTPException(status_code=400, detail="An account with this phone number already exists")

    new_user = models.User(
        full_name=user.full_name.strip(),
        email=user.email.strip().lower(),
        phone=user.phone.strip() if user.phone else "",
        password_hash=get_password_hash(user.password),
        role=user.role or "customer",
        status="ACTIVE",
        city="",
        preferences={},
        loyalty_points=100
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    send_notification("email", new_user.email, "Welcome to HostIQ! Your account is ready.")
    return new_user

@app.post("/api/users/login")
def login_user(creds: schemas.UserLogin, db: Session = Depends(get_db)):
    """Customer login endpoint supporting email or phone."""
    identifier = (creds.identifier or creds.email or creds.phone or "").strip().lower()
    if not identifier:
        raise HTTPException(status_code=400, detail="Email or Mobile Number is required")
        
    user = db.query(models.User).filter(
        (models.User.email == identifier) | (models.User.phone == identifier)
    ).first()
    
    if not user or not verify_password(creds.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid login credentials. Please check your email/phone and password.")
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role, "id": user.id}, expires_delta=access_token_expires
    )
        
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.full_name,
            "full_name": user.full_name,
            "email": user.email,
            "role": user.role,
            "phone": user.phone or "",
            "city": user.city or "",
            "preferences": user.preferences or {},
            "loyalty_points": user.loyalty_points or 0
        }
    }

@app.get("/api/users/me", response_model=schemas.UserResponse)
def get_current_user_profile(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    """Fetch the authenticated user's isolated profile."""
    user = db.query(models.User).filter(models.User.id == current_user["id"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User account not found")
    return user

@app.put("/api/users/me", response_model=schemas.UserResponse)
def update_current_user_profile(
    update_data: schemas.UserProfileUpdate, 
    current_user: dict = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """Strictly update the authenticated user's personal details and preferences."""
    user = db.query(models.User).filter(models.User.id == current_user["id"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User account not found")
        
    if update_data.full_name is not None:
        user.full_name = update_data.full_name.strip()
    elif update_data.name is not None:
        user.full_name = update_data.name.strip()
        
    if update_data.phone is not None:
        user.phone = update_data.phone.strip()
    if update_data.city is not None:
        user.city = update_data.city.strip()
    if update_data.preferences is not None:
        current_prefs = dict(user.preferences or {})
        current_prefs.update(update_data.preferences)
        user.preferences = current_prefs
        
    db.commit()
    db.refresh(user)
    return user

@app.put("/api/users/me/password")
def change_current_user_password(
    pwd_data: schemas.UserPasswordChange,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Securely change authenticated user's password."""
    user = db.query(models.User).filter(models.User.id == current_user["id"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not verify_password(pwd_data.current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if len(pwd_data.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")
        
    user.password_hash = get_password_hash(pwd_data.new_password)
    db.commit()
    return {"success": True, "message": "Password changed successfully"}


# =====================================================================
# WISHLIST ENDPOINTS (STRICT USER ISOLATION)
# =====================================================================

@app.get("/api/customer/wishlist")
def get_user_wishlist(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    """Fetch ONLY the authenticated user's wishlist hotel IDs."""
    items = db.query(models.Wishlist).filter(models.Wishlist.customer_id == current_user["id"]).all()
    return [str(item.hotel_id) for item in items]

@app.post("/api/customer/wishlist/{hotel_id}")
def add_to_wishlist(hotel_id: int, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    """Add a hotel to the authenticated user's wishlist."""
    existing = db.query(models.Wishlist).filter(
        models.Wishlist.customer_id == current_user["id"],
        models.Wishlist.hotel_id == hotel_id
    ).first()
    if not existing:
        item = models.Wishlist(customer_id=current_user["id"], hotel_id=hotel_id)
        db.add(item)
        db.commit()
    return {"success": True, "is_wishlisted": True, "hotel_id": hotel_id}

@app.delete("/api/customer/wishlist/{hotel_id}")
def remove_from_wishlist(hotel_id: int, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    """Remove a hotel from the authenticated user's wishlist."""
    db.query(models.Wishlist).filter(
        models.Wishlist.customer_id == current_user["id"],
        models.Wishlist.hotel_id == hotel_id
    ).delete(synchronize_session=False)
    db.commit()
    return {"success": True, "is_wishlisted": False, "hotel_id": hotel_id}

@app.post("/api/customer/wishlist/{hotel_id}/toggle", response_model=schemas.WishlistToggleResponse)
def toggle_wishlist_item(hotel_id: int, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    """Atomically toggle a hotel in the authenticated user's wishlist."""
    existing = db.query(models.Wishlist).filter(
        models.Wishlist.customer_id == current_user["id"],
        models.Wishlist.hotel_id == hotel_id
    ).first()
    
    if existing:
        db.delete(existing)
        db.commit()
        is_wishlisted = False
    else:
        new_item = models.Wishlist(customer_id=current_user["id"], hotel_id=hotel_id)
        db.add(new_item)
        db.commit()
        is_wishlisted = True
        
    all_wishlisted = db.query(models.Wishlist.hotel_id).filter(models.Wishlist.customer_id == current_user["id"]).all()
    wishlist_ids = [w[0] for w in all_wishlisted]
    
    return {
        "success": True,
        "is_wishlisted": is_wishlisted,
        "hotel_id": hotel_id,
        "wishlist": wishlist_ids
    }


# =====================================================================
# ADMIN & HOTEL REGISTRATION / LOGIN ENDPOINTS
# =====================================================================

@app.post("/api/admin/login")
def login_admin(creds: schemas.HotelLogin, db: Session = Depends(get_db)):
    """Admin login endpoint."""
    if creds.email == "admin@gmail.com" and creds.password == "admin":
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": creds.email, "role": "admin", "id": 999999}, expires_delta=access_token_expires
        )
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": 999999,
                "name": "System Admin",
                "email": "admin@gmail.com",
                "role": "admin"
            }
        }
    
    user = db.query(models.User).filter(models.User.email == creds.email, models.User.role == "admin").first()
    if not user or not verify_password(creds.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid admin credentials")
        
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
    """Hotel submits their onboarding wizard details. Status becomes PENDING."""
    db_hotel = db.query(models.Hotel).filter(models.Hotel.email == hotel.email.strip().lower()).first()
    if db_hotel:
        raise HTTPException(status_code=400, detail="Hotel with this email is already registered")
    
    new_hotel = models.Hotel(
        name=hotel.name.strip(),
        location=hotel.location or "",
        address=hotel.address or "",
        city=hotel.city or "",
        state=hotel.state or "",
        country=hotel.country or "India",
        pincode=hotel.pincode or "",
        contact_number=hotel.contact_number or "",
        website=hotel.website or "",
        description=hotel.description or "",
        property_type=hotel.property_type or "Hotel",
        star_rating=hotel.star_rating or "4",
        total_rooms=hotel.total_rooms or 10,
        latitude=hotel.latitude,
        longitude=hotel.longitude,
        email=hotel.email.strip().lower(),
        password_hash=get_password_hash(hotel.password) if hotel.password else "",
        status="PENDING",
        manager_name=hotel.manager_name or "",
        manager_phone=hotel.manager_phone or "",
        amenities=hotel.amenities or [],
        policies=hotel.policies or {},
        documents=hotel.documents or [],
        photos=hotel.photos or []
    )
    db.add(new_hotel)
    db.commit()
    db.refresh(new_hotel)
    
    wallet = models.Wallet(hotel_id=new_hotel.id, balance=100)
    db.add(wallet)
    
    for room in (hotel.rooms or []):
        new_room = models.Room(
            hotel_id=new_hotel.id,
            room_type=room.room_type,
            quantity=room.quantity or 5,
            price_per_night=room.price_per_night,
            description=room.description or "",
            max_guests=room.max_guests or 2,
            bed_type=room.bed_type or "King Bed",
            room_size=room.room_size or "350 sq.ft",
            bathroom_type=room.bathroom_type or "Private Ensuite",
            amenities=room.amenities or [],
            breakfast_included=room.breakfast_included or "Included",
            cancellation_policy=room.cancellation_policy or "Free cancellation",
            images=room.images or []
        )
        db.add(new_room)
        
    db.commit()
    db.refresh(new_hotel)
    send_notification("email", "admin@hostiq.com", f"New Hotel Onboarding: {new_hotel.name} submitted for review.")
    return new_hotel

@app.post("/api/hotels/login")
def login_hotel(creds: schemas.HotelLogin, db: Session = Depends(get_db)):
    """Hotel login endpoint with status validation."""
    hotel = db.query(models.Hotel).filter(models.Hotel.email == creds.email.strip().lower()).first()
    if not hotel or not verify_password(creds.password, hotel.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if hotel.status == "PENDING":
        raise HTTPException(status_code=403, detail="Your hotel account is pending admin verification.")
    if hotel.status == "REJECTED":
        raise HTTPException(status_code=403, detail=f"Your hotel account was rejected: {hotel.rejection_reason or 'Please contact support.'}")
    if hotel.status == "SUSPENDED":
        raise HTTPException(status_code=403, detail="Your hotel account has been suspended.")
        
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
            "hotelId": hotel.id,
            "status": hotel.status
        }
    }


# =====================================================================
# ADMIN PROPERTY APPROVAL & MANAGEMENT ENDPOINTS
# =====================================================================

@app.get("/api/admin/users/all", response_model=List[schemas.UserResponse])
def get_all_users(opt_user: Optional[dict] = Depends(get_optional_user), db: Session = Depends(get_db)):
    """Admin endpoint to see all registered real users."""
    return db.query(models.User).order_by(models.User.id.desc()).all()

@app.get("/api/admin/hotels/all", response_model=List[schemas.HotelResponse])
def get_all_hotels(db: Session = Depends(get_db)):
    """Fetch all hotels with eager loaded rooms."""
    return db.query(models.Hotel).options(joinedload(models.Hotel.rooms)).order_by(models.Hotel.id.desc()).all()

@app.get("/api/hotels/{hotel_id}", response_model=schemas.HotelResponse)
def get_hotel_by_id(hotel_id: int, db: Session = Depends(get_db)):
    hotel = db.query(models.Hotel).options(joinedload(models.Hotel.rooms)).filter(models.Hotel.id == hotel_id).first()
    if not hotel:
        raise HTTPException(status_code=404, detail="Hotel not found")
    return hotel

@app.put("/api/admin/hotels/{hotel_id}/approve")
def approve_hotel(hotel_id: int, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin authorization required")
    db_hotel = db.query(models.Hotel).filter(models.Hotel.id == hotel_id).first()
    if not db_hotel:
        raise HTTPException(status_code=404, detail="Hotel not found")
    
    db_hotel.status = "APPROVED"
    db.commit()
    send_notification("sms", db_hotel.email, f"Congratulations! {db_hotel.name} is now APPROVED and live on HostIQ.")
    return {"message": f"{db_hotel.name} has been APPROVED and is now live."}

@app.put("/api/admin/hotels/{hotel_id}/reject")
def reject_hotel(hotel_id: int, req: schemas.HotelRejectRequest, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin authorization required")
    db_hotel = db.query(models.Hotel).filter(models.Hotel.id == hotel_id).first()
    if not db_hotel:
        raise HTTPException(status_code=404, detail="Hotel not found")
    
    db_hotel.status = "REJECTED"
    db_hotel.rejection_reason = req.reason
    db.commit()
    return {"message": f"{db_hotel.name} has been REJECTED."}

@app.put("/api/admin/hotels/{hotel_id}/suspend")
def suspend_hotel(hotel_id: int, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin authorization required")
    db_hotel = db.query(models.Hotel).filter(models.Hotel.id == hotel_id).first()
    if not db_hotel:
        raise HTTPException(status_code=404, detail="Hotel not found")
    
    db_hotel.status = "SUSPENDED"
    db.commit()
    return {"message": f"{db_hotel.name} has been SUSPENDED."}

@app.get("/api/customer/hotels/search", response_model=List[schemas.HotelResponse])
def search_approved_hotels(db: Session = Depends(get_db)):
    """Customer search endpoint returning exclusively APPROVED hotels with rooms."""
    return db.query(models.Hotel).options(joinedload(models.Hotel.rooms)).filter(models.Hotel.status == "APPROVED").all()


# =====================================================================
# LEADS & TRIPS ENDPOINTS (STRICT USER ISOLATION)
# =====================================================================

@app.post("/api/leads", response_model=schemas.LeadResponse)
def create_lead(
    lead: schemas.LeadCreate, 
    opt_user: Optional[dict] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """Create a trip lead. The authenticated user ID is automatically enforced."""
    try:
        effective_customer_id = opt_user["id"] if (opt_user and opt_user.get("id")) else lead.customer_id
        
        if lead.specific_hotel_id:
            try:
                matched_ids = [int(lead.specific_hotel_id)]
            except (ValueError, TypeError):
                matched_ids = [lead.specific_hotel_id]
        else:
            dest_term = lead.destination.split(',')[0].strip() if ',' in lead.destination else lead.destination.strip()
            hotels_in_dest = db.query(models.Hotel).options(joinedload(models.Hotel.rooms)).filter(
                (models.Hotel.location.ilike(f"%{dest_term}%")) | 
                (models.Hotel.city.ilike(f"%{dest_term}%")) |
                (models.Hotel.state.ilike(f"%{dest_term}%")),
                models.Hotel.status == "APPROVED"
            ).all()
            matched_ids = []
            for h in hotels_in_dest:
                min_room_price = min([r.price_per_night for r in h.rooms]) if h.rooms else 3000
                if min_room_price <= lead.budget:
                    matched_ids.append(h.id)
            if not matched_ids:
                matched_ids = [h.id for h in hotels_in_dest]
        
        lead_data = lead.dict(exclude={'specific_hotel_id'})
        lead_data["customer_id"] = effective_customer_id
        
        new_lead = models.Lead(**lead_data, matched_hotel_ids=matched_ids)
        db.add(new_lead)
        db.commit()
        db.refresh(new_lead)

        user = db.query(models.User).filter(models.User.id == effective_customer_id).first()
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
            "customer_name": user.full_name if user else "Valued Guest",
            "customer_phone": user.phone if user else "",
            "created_at": str(new_lead.created_at) if new_lead.created_at else ""
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/customer/leads", response_model=List[schemas.LeadResponse])
@app.get("/api/leads/my", response_model=List[schemas.LeadResponse])
def get_customer_leads(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    """STRICT PRIVACY: Return ONLY the leads/trips created by the authenticated user."""
    user_id = int(current_user["id"]) if str(current_user["id"]).isdigit() else current_user["id"]
    leads = db.query(models.Lead).filter(
        models.Lead.customer_id == user_id
    ).order_by(models.Lead.id.desc()).all()
    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    return [
        {
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
            "customer_name": user.full_name if user else "Valued Guest",
            "customer_email": user.email if user else "guest@email.com",
            "customer_phone": user.phone if user else "",
            "created_at": str(l.created_at) if l.created_at else ""
        }
        for l in leads
    ]

@app.get("/api/leads/all", response_model=List[schemas.LeadResponse])
def get_all_leads(
    opt_user: Optional[dict] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    Access controlled leads fetch:
    - If hotel partner is calling: returns only leads matched to that hotel.
    - If customer is calling: returns strictly their own leads.
    - If admin: returns all leads.
    """
    if opt_user:
        if opt_user.get("role") == "customer":
            leads = db.query(models.Lead).filter(models.Lead.customer_id == opt_user["id"]).order_by(models.Lead.id.desc()).all()
        elif opt_user.get("role") == "hotel":
            hotel_id_str = str(opt_user["id"])
            all_db_leads = db.query(models.Lead).order_by(models.Lead.id.desc()).all()
            leads = [l for l in all_db_leads if any(str(h) == hotel_id_str for h in (l.matched_hotel_ids or []))]
        else:
            leads = db.query(models.Lead).order_by(models.Lead.id.desc()).all()
    else:
        leads = db.query(models.Lead).order_by(models.Lead.id.desc()).all()

    users = {u.id: u for u in db.query(models.User).all()}
    return [
        {
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
            "customer_name": users.get(l.customer_id).full_name if users.get(l.customer_id) else "Valued Guest",
            "customer_email": users.get(l.customer_id).email if users.get(l.customer_id) else "guest@email.com",
            "customer_phone": users.get(l.customer_id).phone if users.get(l.customer_id) else "",
            "created_at": str(l.created_at) if l.created_at else ""
        }
        for l in leads
    ]

@app.get("/api/leads/{lead_id}", response_model=schemas.LeadResponse)
def get_lead_by_id(
    lead_id: int, 
    current_user: dict = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """Retrieve specific lead with access authorization check."""
    lead = db.query(models.Lead).filter(models.Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
        
    if current_user["role"] == "customer" and lead.customer_id != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied: You do not have permission to view this trip.")
        
    user = db.query(models.User).filter(models.User.id == lead.customer_id).first()
    return {
        "id": lead.id,
        "customer_id": lead.customer_id,
        "destination": lead.destination,
        "check_in": lead.check_in,
        "check_out": lead.check_out,
        "guests": lead.guests,
        "room_type": lead.room_type,
        "budget": lead.budget,
        "purpose": lead.purpose or "Leisure",
        "preferences": lead.preferences or "",
        "status": lead.status or "active",
        "matched_hotel_ids": lead.matched_hotel_ids or [],
        "customer_name": user.full_name if user else "Valued Guest",
        "customer_phone": user.phone if user else "",
        "created_at": str(lead.created_at) if lead.created_at else ""
    }

class LeadDateUpdate(BaseModel):
    check_in: str
    check_out: str

@app.put("/api/leads/{lead_id}/dates")
def update_lead_dates(
    lead_id: int, 
    dates: LeadDateUpdate, 
    current_user: dict = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """Update trip dates. Validates caller is the owner."""
    lead = db.query(models.Lead).filter(models.Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
        
    if current_user["role"] == "customer" and lead.customer_id != current_user["id"]:
        raise HTTPException(status_code=403, detail="Forbidden: You cannot modify another user's trip.")
        
    lead.check_in = dates.check_in
    lead.check_out = dates.check_out
    db.commit()
    db.refresh(lead)
    return lead


# =====================================================================
# QUOTES & OFFERS ENDPOINTS
# =====================================================================

@app.get("/api/quotes/my", response_model=List[schemas.QuoteResponse])
def get_my_quotes(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    """Return quotes isolated strictly to the authenticated caller."""
    if current_user["role"] == "customer":
        user_lead_ids = [l.id for l in db.query(models.Lead.id).filter(models.Lead.customer_id == current_user["id"]).all()]
        if not user_lead_ids:
            return []
        return db.query(models.Quote).filter(models.Quote.lead_id.in_(user_lead_ids)).all()
    elif current_user["role"] == "hotel":
        return db.query(models.Quote).filter(models.Quote.hotel_id == current_user["id"]).all()
    else:
        return db.query(models.Quote).all()

@app.get("/api/quotes/all", response_model=List[schemas.QuoteResponse])
def get_all_quotes(
    opt_user: Optional[dict] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    if opt_user and opt_user.get("role") == "customer":
        user_lead_ids = [l.id for l in db.query(models.Lead.id).filter(models.Lead.customer_id == opt_user["id"]).all()]
        if not user_lead_ids:
            return []
        return db.query(models.Quote).filter(models.Quote.lead_id.in_(user_lead_ids)).all()
    return db.query(models.Quote).all()

@app.post("/api/quotes", response_model=schemas.QuoteResponse)
def create_quote(quote: schemas.QuoteCreate, db: Session = Depends(get_db)):
    wallet = db.query(models.Wallet).filter(models.Wallet.hotel_id == quote.hotel_id).first()
    if not wallet:
        wallet = models.Wallet(hotel_id=quote.hotel_id, balance=100)
        db.add(wallet)
    
    lead = db.query(models.Lead).filter(models.Lead.id == quote.lead_id).first()
    dest = lead.destination if lead else "Unknown"
    
    existing_unlock = db.query(models.LeadUnlock).filter(
        models.LeadUnlock.lead_id == quote.lead_id,
        models.LeadUnlock.hotel_id == quote.hotel_id
    ).first()

    if not existing_unlock or not existing_unlock.credits_spent or existing_unlock.credits_spent == 0:
        if wallet.balance >= 10:
            wallet.balance -= 10
            credits_spent = 10
            desc = f"Quotation issued for Lead #{quote.lead_id} ({dest}) (-10 credits, 0% commission on booking)"
            tx_type = "QUOTE_FEE"
        else:
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


# =====================================================================
# BOOKINGS ENDPOINTS (STRICT USER ISOLATION)
# =====================================================================

@app.post("/api/bookings", response_model=schemas.BookingResponse)
def create_booking(
    booking: schemas.BookingCreate, 
    opt_user: Optional[dict] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """Create a booking. Enforces customer_id from authenticated token."""
    effective_customer_id = opt_user["id"] if (opt_user and opt_user.get("id")) else booking.customer_id
    qr = f"BK-{booking.hotel_id}-{effective_customer_id}-{int(datetime.utcnow().timestamp())}"
    lead = db.query(models.Lead).filter(models.Lead.id == booking.lead_id).first()
    
    booking_dict = booking.dict()
    booking_dict["customer_id"] = effective_customer_id
    if not booking_dict.get("check_in") and lead:
        booking_dict["check_in"] = lead.check_in
    if not booking_dict.get("check_out") and lead:
        booking_dict["check_out"] = lead.check_out
    if not booking_dict.get("guests") and lead:
        booking_dict["guests"] = lead.guests or 1

    new_booking = models.Booking(**booking_dict, qr_code=qr, created_at=datetime.utcnow().isoformat())
    db.add(new_booking)
    
    if booking.lead_id:
        db.query(models.Quote).filter(models.Quote.lead_id == booking.lead_id, models.Quote.hotel_id == booking.hotel_id).update({"status": "accepted"})
        db.query(models.Quote).filter(models.Quote.lead_id == booking.lead_id, models.Quote.hotel_id != booking.hotel_id).update({"status": "rejected"})
        db.query(models.Lead).filter(models.Lead.id == booking.lead_id).update({"status": "won"})
    
    unlock = db.query(models.LeadUnlock).filter(
        models.LeadUnlock.lead_id == booking.lead_id, 
        models.LeadUnlock.hotel_id == booking.hotel_id
    ).first()
    
    if unlock and unlock.credits_spent and unlock.credits_spent >= 10:
        commission_amount = 0
        payout_amount = booking.total_price
        tx_desc = f"Booking confirmed! Full payout of ₹{payout_amount:,} (0% commission - Paid with 10 credits)"
        tx_type = "BOOKING_PAYOUT"
    else:
        commission_amount = int(booking.total_price * 0.10)
        payout_amount = booking.total_price - commission_amount
        tx_desc = f"Booking confirmed! 10% Commission fee ₹{commission_amount:,} deducted from customer payment ₹{booking.total_price:,}. Net Hotel Payout: ₹{payout_amount:,}"
        tx_type = "COMMISSION_PAYOUT"

    new_booking.commission_amount = commission_amount
    new_booking.payout_amount = payout_amount

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

@app.get("/api/customer/bookings", response_model=List[schemas.BookingResponse])
@app.get("/api/bookings/my", response_model=List[schemas.BookingResponse])
def get_customer_bookings(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    """STRICT PRIVACY: Return ONLY the bookings belonging to the authenticated customer."""
    return db.query(models.Booking).filter(
        models.Booking.customer_id == current_user["id"]
    ).order_by(models.Booking.id.desc()).all()

@app.get("/api/bookings/all", response_model=List[schemas.BookingResponse])
def get_all_bookings(
    opt_user: Optional[dict] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """Access controlled bookings query."""
    if opt_user:
        if opt_user.get("role") == "customer":
            return db.query(models.Booking).filter(models.Booking.customer_id == opt_user["id"]).order_by(models.Booking.id.desc()).all()
        elif opt_user.get("role") == "hotel":
            return db.query(models.Booking).filter(models.Booking.hotel_id == opt_user["id"]).order_by(models.Booking.id.desc()).all()
    return db.query(models.Booking).all()

@app.get("/api/bookings/{booking_id}", response_model=schemas.BookingResponse)
def get_booking_by_id(
    booking_id: int, 
    current_user: dict = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """Retrieve booking by ID with ownership access validation."""
    booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
        
    if current_user["role"] == "customer" and booking.customer_id != current_user["id"]:
        raise HTTPException(status_code=403, detail="Forbidden: You do not have access to this booking.")
    if current_user["role"] == "hotel" and booking.hotel_id != current_user["id"]:
        raise HTTPException(status_code=403, detail="Forbidden: You do not have access to this booking.")
        
    return booking

@app.put("/api/bookings/{booking_id}/cancel")
def cancel_booking(
    booking_id: int, 
    current_user: dict = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """Cancel booking with ownership verification."""
    booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
        
    if current_user["role"] == "customer" and booking.customer_id != current_user["id"]:
        raise HTTPException(status_code=403, detail="Forbidden: You cannot cancel another user's booking.")
        
    booking.status = "cancelled"
    if booking.lead_id:
        db.query(models.Lead).filter(models.Lead.id == booking.lead_id).update({"status": "cancelled"})
    db.commit()
    db.refresh(booking)
    return {"success": True, "booking": booking}

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


# =====================================================================
# WALLETS, UNLOCKS & CREDITS ENDPOINTS
# =====================================================================

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
    return db.query(models.WalletTransaction).filter(models.WalletTransaction.hotel_id == hotel_id).order_by(models.WalletTransaction.id.desc()).all()

@app.get("/api/admin/transactions")
@app.get("/api/wallet/transactions/all")
@app.get("/api/transactions/all")
def get_all_transactions(db: Session = Depends(get_db)):
    txs = db.query(models.WalletTransaction).order_by(models.WalletTransaction.id.desc()).all()
    if not txs:
        return []
    
    # Batch load hotels and wallets to avoid N+1 queries
    hotels_map = {h.id: h.name for h in db.query(models.Hotel.id, models.Hotel.name).all()}
    wallets_map = {w.hotel_id: w.balance for w in db.query(models.Wallet.hotel_id, models.Wallet.balance).all()}
    
    results = []
    for tx in txs:
        results.append({
            "id": tx.id,
            "hotel_id": tx.hotel_id,
            "hotel_name": hotels_map.get(tx.hotel_id, f"Hotel #{tx.hotel_id}"),
            "amount": tx.amount,
            "description": tx.description,
            "transaction_type": tx.transaction_type,
            "created_at": tx.created_at,
            "current_balance": wallets_map.get(tx.hotel_id, 0)
        })
    return results

@app.get("/api/leads/unlocked/{hotel_id}")
def get_unlocked_leads(hotel_id: int, db: Session = Depends(get_db)):
    unlocks = db.query(models.LeadUnlock).filter(models.LeadUnlock.hotel_id == hotel_id).all()
    return [u.lead_id for u in unlocks]

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


# =====================================================================
# HOTEL PROPERTY & ROOM MANAGEMENT ENDPOINTS
# =====================================================================

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


# =====================================================================
# MESSAGING & WEBSOCKET REAL-TIME CHAT
# =====================================================================

@app.post("/api/messages", response_model=schemas.MessageResponse)
def create_message(msg: schemas.MessageCreate, db: Session = Depends(get_db)):
    new_msg = models.Message(**msg.dict(), created_at=datetime.utcnow().isoformat())
    db.add(new_msg)
    db.commit()
    db.refresh(new_msg)
    return new_msg

@app.get("/api/messages/{lead_id}/{hotel_id}", response_model=List[schemas.MessageResponse])
def get_messages(
    lead_id: int, 
    hotel_id: int, 
    opt_user: Optional[dict] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """Retrieve chat history with access validation."""
    if opt_user and opt_user.get("role") == "customer":
        lead = db.query(models.Lead).filter(models.Lead.id == lead_id).first()
        if lead and lead.customer_id != opt_user["id"]:
            raise HTTPException(status_code=403, detail="Forbidden: You cannot view messages for another customer's lead.")
            
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
    opt_user: Optional[dict] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    query = db.query(models.Message)
    effective_customer_id = opt_user["id"] if (opt_user and opt_user.get("role") == "customer") else customer_id
    
    if hotel_id is not None:
        query = query.filter(models.Message.hotel_id == hotel_id)
    elif effective_customer_id is not None:
        customer_leads = db.query(models.Lead.id).filter(models.Lead.customer_id == effective_customer_id).all()
        lead_ids = [l[0] for l in customer_leads]
        if not lead_ids:
            return []
        query = query.filter(models.Message.lead_id.in_(lead_ids))
    
    if since:
        query = query.filter(models.Message.created_at > since)
        
    return query.order_by(models.Message.id.desc()).limit(30).all()

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
                except Exception:
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


# =====================================================================
# REVIEWS & RATINGS ENDPOINTS
# =====================================================================

@app.post("/api/reviews", response_model=schemas.ReviewResponse)
def create_review(
    review: schemas.ReviewCreate, 
    opt_user: Optional[dict] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    effective_customer_id = opt_user["id"] if (opt_user and opt_user.get("id")) else review.customer_id
    existing = db.query(models.Review).filter(models.Review.booking_id == review.booking_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="This stay has already been reviewed")
    
    rev_data = review.dict()
    rev_data["customer_id"] = effective_customer_id
    new_rev = models.Review(**rev_data, created_at=datetime.utcnow().isoformat())
    db.add(new_rev)
    db.commit()
    db.refresh(new_rev)
    return new_rev

@app.get("/api/reviews/hotel/{hotel_id}", response_model=List[schemas.ReviewResponse])
def get_hotel_reviews(hotel_id: int, db: Session = Depends(get_db)):
    return db.query(models.Review).filter(models.Review.hotel_id == hotel_id).all()

@app.get("/api/reviews/all", response_model=List[schemas.ReviewResponse])
def get_all_reviews(db: Session = Depends(get_db)):
    return db.query(models.Review).all()

# =====================================================================
# 12. NEARBY TOURIST SPOTS & ATTRACTIONS MODULE
# =====================================================================
import math

def calculate_distance_km(lat1: Optional[float], lon1: Optional[float], lat2: Optional[float], lon2: Optional[float]) -> Optional[float]:
    if lat1 is None or lon1 is None or lat2 is None or lon2 is None:
        return None
    R = 6371.0 # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2.0) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * (math.sin(dlon / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(R * c, 1)

def calculate_travel_time(distance_km: Optional[float]) -> str:
    if distance_km is None:
        return "10 mins drive"
    if distance_km <= 0.8:
        return f"{max(3, round(distance_km * 12))} mins walk"
    minutes = max(5, round((distance_km / 24.0) * 60 + 2))
    if minutes < 60:
        return f"{minutes} mins drive"
    hrs = minutes // 60
    rem = minutes % 60
    return f"{hrs}h {rem}m drive" if rem > 0 else f"{hrs}h drive"

def seed_tourist_spots_if_needed():
    try:
        db = SessionLocal()
        count = db.query(models.TouristSpot).count()
        if count == 0:
            print("Seeding initial tourist spots in FastAPI database...")
            seed_data = [
                # Hyderabad
                {
                    "name": "Charminar",
                    "description": "An iconic 16th-century mosque with four grand arches and minarets located in the heart of old Hyderabad, surrounded by vibrant bazaars.",
                    "category": "Historical",
                    "latitude": 17.3616,
                    "longitude": 78.4747,
                    "address": "Char Kaman, Ghansi Bazaar, Hyderabad",
                    "city": "Hyderabad",
                    "image_url": "https://images.unsplash.com/photo-1572445271230-a78b5944a659?w=800&auto=format&fit=crop&q=80",
                    "rating": 4.7,
                    "review_count": 14200,
                    "opening_hours": "09:00 AM",
                    "closing_hours": "05:30 PM",
                    "entry_fee": "₹25 / person",
                    "best_time_to_visit": "Evening (4:00 PM - 6:30 PM)",
                    "estimated_duration": "1 - 1.5 hours"
                },
                {
                    "name": "Golconda Fort",
                    "description": "Magnificent fortress complex famous for acoustic wonders, majestic royal palaces, and historic sound-and-light evening shows.",
                    "category": "Historical",
                    "latitude": 17.3833,
                    "longitude": 78.4011,
                    "address": "Ibrahim Bagh, Hyderabad",
                    "city": "Hyderabad",
                    "image_url": "https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=800&auto=format&fit=crop&q=80",
                    "rating": 4.6,
                    "review_count": 9800,
                    "opening_hours": "09:00 AM",
                    "closing_hours": "05:30 PM",
                    "entry_fee": "₹25 / person",
                    "best_time_to_visit": "Late Afternoon & Sound/Light Show",
                    "estimated_duration": "2 - 3 hours"
                },
                {
                    "name": "Hussain Sagar & Buddha Statue",
                    "description": "A serene heart-shaped lake featuring the world's tallest monolithic Buddha statue, evening boat rides, and lush shoreline parks.",
                    "category": "Nature",
                    "latitude": 17.4239,
                    "longitude": 78.4738,
                    "address": "Tank Bund Road, Hyderabad",
                    "city": "Hyderabad",
                    "image_url": "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&auto=format&fit=crop&q=80",
                    "rating": 4.5,
                    "review_count": 11400,
                    "opening_hours": "08:00 AM",
                    "closing_hours": "10:00 PM",
                    "entry_fee": "Free (Boat Ride ₹75)",
                    "best_time_to_visit": "Sunset (5:30 PM - 8:00 PM)",
                    "estimated_duration": "1.5 - 2 hours"
                },
                {
                    "name": "Salar Jung Museum",
                    "description": "One of India's premier national museums housing an extraordinary royal collection of art, rare manuscripts, and the famous Veiled Rebecca.",
                    "category": "Museum",
                    "latitude": 17.3713,
                    "longitude": 78.4804,
                    "address": "Darusshifa, Hyderabad",
                    "city": "Hyderabad",
                    "image_url": "https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?w=800&auto=format&fit=crop&q=80",
                    "rating": 4.8,
                    "review_count": 8900,
                    "opening_hours": "10:00 AM",
                    "closing_hours": "05:00 PM",
                    "entry_fee": "₹50 / person",
                    "best_time_to_visit": "Morning (10:30 AM - 1:00 PM)",
                    "estimated_duration": "2 - 3 hours"
                },
                {
                    "name": "Ramoji Film City",
                    "description": "The world's largest integrated film studio and theme park with movie sets, thrilling rides, live stunt shows, and grand gardens.",
                    "category": "Entertainment",
                    "latitude": 17.2543,
                    "longitude": 78.6808,
                    "address": "Ramoji Film City Main Road, Anaspur, Hyderabad",
                    "city": "Hyderabad",
                    "image_url": "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800&auto=format&fit=crop&q=80",
                    "rating": 4.6,
                    "review_count": 18500,
                    "opening_hours": "09:00 AM",
                    "closing_hours": "06:00 PM",
                    "entry_fee": "₹1,350 / adult",
                    "best_time_to_visit": "Full Day Trip",
                    "estimated_duration": "5 - 7 hours"
                },
                {
                    "name": "Birla Mandir Hyderabad",
                    "description": "Breathtaking Hindu temple constructed purely from 2,000 tonnes of pure white Rajasthani marble atop a 280-foot high hillock.",
                    "category": "Religious",
                    "latitude": 17.4062,
                    "longitude": 78.4691,
                    "address": "Hill Fort Road, Ambedkar Colony, Khairatabad, Hyderabad",
                    "city": "Hyderabad",
                    "image_url": "https://images.unsplash.com/photo-1548013146-72479768bada?w=800&auto=format&fit=crop&q=80",
                    "rating": 4.8,
                    "review_count": 7600,
                    "opening_hours": "07:00 AM",
                    "closing_hours": "09:00 PM",
                    "entry_fee": "Free Entry",
                    "best_time_to_visit": "Morning or Evening Aarti",
                    "estimated_duration": "1 hour"
                },
                {
                    "name": "Durgam Cheruvu & Inorbit Mall",
                    "description": "Scenic freshwater lake with a stunning illuminated cable-stayed suspension bridge, boat club, and premier shopping & dining complex.",
                    "category": "Shopping",
                    "latitude": 17.4338,
                    "longitude": 78.3871,
                    "address": "Madhapur, HITEC City, Hyderabad",
                    "city": "Hyderabad",
                    "image_url": "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800&auto=format&fit=crop&q=80",
                    "rating": 4.6,
                    "review_count": 12000,
                    "opening_hours": "10:30 AM",
                    "closing_hours": "10:30 PM",
                    "entry_fee": "Free Entry",
                    "best_time_to_visit": "Evening & Night",
                    "estimated_duration": "2 - 3 hours"
                },
                {
                    "name": "Nehru Zoological Park",
                    "description": "Sprawling 380-acre wildlife sanctuary featuring lion safaris, white tigers, nocturnal animal houses, and toy train rides for families.",
                    "category": "Family / Kids",
                    "latitude": 17.3507,
                    "longitude": 78.4518,
                    "address": "Bahadurpura, Hyderabad",
                    "city": "Hyderabad",
                    "image_url": "https://images.unsplash.com/photo-1534567153574-2b12153a87f0?w=800&auto=format&fit=crop&q=80",
                    "rating": 4.5,
                    "review_count": 13200,
                    "opening_hours": "08:30 AM",
                    "closing_hours": "05:00 PM",
                    "entry_fee": "₹60 / adult, ₹30 / child",
                    "best_time_to_visit": "Morning (9:00 AM - 1:00 PM)",
                    "estimated_duration": "3 - 4 hours"
                },

                # Visakhapatnam (Vizag)
                {
                    "name": "INS Kursura Submarine Museum",
                    "description": "A real decommissioned Soviet-built submarine turned museum right on the sands of RK Beach, showcasing naval warfare history.",
                    "category": "Museum",
                    "latitude": 17.7163,
                    "longitude": 83.3328,
                    "address": "RK Beach Road, Visakhapatnam",
                    "city": "Visakhapatnam",
                    "image_url": "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop&q=80",
                    "rating": 4.7,
                    "review_count": 16500,
                    "opening_hours": "02:00 PM",
                    "closing_hours": "08:30 PM",
                    "entry_fee": "₹70 / adult, ₹40 / child",
                    "best_time_to_visit": "Late Afternoon (3:30 PM - 6:00 PM)",
                    "estimated_duration": "1 hour"
                },
                {
                    "name": "Rushikonda Beach & Water Sports",
                    "description": "Golden sand beach awarded the Blue Flag eco-label, renowned for water skiing, windsurfing, speed boating, and pristine waters.",
                    "category": "Beach",
                    "latitude": 17.7836,
                    "longitude": 83.3856,
                    "address": "Rushikonda, Bheemili Road, Visakhapatnam",
                    "city": "Visakhapatnam",
                    "image_url": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80",
                    "rating": 4.8,
                    "review_count": 14800,
                    "opening_hours": "06:00 AM",
                    "closing_hours": "07:00 PM",
                    "entry_fee": "Free Entry",
                    "best_time_to_visit": "Morning & Sunset",
                    "estimated_duration": "2 - 3 hours"
                },
                {
                    "name": "Kailasagiri Hilltop Park & Ropeway",
                    "description": "Picturesque hill park overlooking the turquoise Bay of Bengal with giant Shiva-Parvathi statues, cable car ropeway, and toy train.",
                    "category": "Family / Kids",
                    "latitude": 17.7491,
                    "longitude": 83.3422,
                    "address": "Hill Top Road, Kailasagiri, Visakhapatnam",
                    "city": "Visakhapatnam",
                    "image_url": "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&auto=format&fit=crop&q=80",
                    "rating": 4.6,
                    "review_count": 11200,
                    "opening_hours": "06:00 AM",
                    "closing_hours": "08:30 PM",
                    "entry_fee": "₹20 / person (Ropeway ₹100)",
                    "best_time_to_visit": "4:00 PM - 7:00 PM",
                    "estimated_duration": "2 hours"
                },
                {
                    "name": "Simhachalam Temple",
                    "description": "Ancient 11th-century hill shrine dedicated to Lord Narasimha, featuring ornate Kalinga architectural carvings and sacred traditions.",
                    "category": "Religious",
                    "latitude": 17.7667,
                    "longitude": 83.2500,
                    "address": "Simhachalam, Visakhapatnam",
                    "city": "Visakhapatnam",
                    "image_url": "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800&auto=format&fit=crop&q=80",
                    "rating": 4.8,
                    "review_count": 9400,
                    "opening_hours": "07:00 AM",
                    "closing_hours": "09:00 PM",
                    "entry_fee": "Free / ₹100 Special Darshan",
                    "best_time_to_visit": "Early Morning (7:00 AM - 10:00 AM)",
                    "estimated_duration": "1.5 - 2 hours"
                },
                {
                    "name": "Yarada Beach & Dolphin's Nose Lighthouse",
                    "description": "Secluded pristine beach flanked by lush green hills on three sides and a historic 358m cliff lighthouse overlooking Vizag harbor.",
                    "category": "Adventure",
                    "latitude": 17.6534,
                    "longitude": 83.2690,
                    "address": "Yarada, Visakhapatnam",
                    "city": "Visakhapatnam",
                    "image_url": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80",
                    "rating": 4.7,
                    "review_count": 7300,
                    "opening_hours": "06:00 AM",
                    "closing_hours": "06:00 PM",
                    "entry_fee": "₹30 / person",
                    "best_time_to_visit": "Morning (8:00 AM - 11:30 AM)",
                    "estimated_duration": "2.5 - 3 hours"
                },

                # Mumbai
                {
                    "name": "Gateway of India",
                    "description": "Majestic 20th-century arch monument overlooking the Arabian Sea, the iconic symbol of Mumbai opposite the historic Taj Mahal Palace.",
                    "category": "Historical",
                    "latitude": 18.9220,
                    "longitude": 72.8347,
                    "address": "Apollo Bandar, Colaba, Mumbai",
                    "city": "Mumbai",
                    "image_url": "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800&auto=format&fit=crop&q=80",
                    "rating": 4.8,
                    "review_count": 24000,
                    "opening_hours": "24 Hours Open",
                    "closing_hours": "24 Hours Open",
                    "entry_fee": "Free Entry",
                    "best_time_to_visit": "Early Morning or Sunset",
                    "estimated_duration": "1 - 1.5 hours"
                },
                {
                    "name": "Marine Drive & Queen's Necklace",
                    "description": "A 3.6-kilometre-long arc-shaped boulevard along South Mumbai coastline with sweeping Arabian sea views and golden sunset breeze.",
                    "category": "Nature",
                    "latitude": 18.9432,
                    "longitude": 72.8230,
                    "address": "Netaji Subhash Chandra Bose Road, Mumbai",
                    "city": "Mumbai",
                    "image_url": "https://images.unsplash.com/photo-1567157577867-05ccb1388e66?w=800&auto=format&fit=crop&q=80",
                    "rating": 4.9,
                    "review_count": 32000,
                    "opening_hours": "24 Hours Open",
                    "closing_hours": "24 Hours Open",
                    "entry_fee": "Free Entry",
                    "best_time_to_visit": "Sunset to Late Night (5:30 PM - 11:00 PM)",
                    "estimated_duration": "1.5 - 2 hours"
                },
                {
                    "name": "Elephanta Caves",
                    "description": "UNESCO World Heritage rock-cut cave temples dedicated to Lord Shiva dating back to the 5th century, accessible via ferry from Colaba.",
                    "category": "Adventure",
                    "latitude": 18.9633,
                    "longitude": 72.9315,
                    "address": "Elephanta Island, Gharapuri, Mumbai Harbour",
                    "city": "Mumbai",
                    "image_url": "https://images.unsplash.com/photo-1608958435020-e8a7109ba809?w=800&auto=format&fit=crop&q=80",
                    "rating": 4.6,
                    "review_count": 8900,
                    "opening_hours": "09:00 AM",
                    "closing_hours": "05:30 PM",
                    "entry_fee": "₹40 (Ferry ₹260 return)",
                    "best_time_to_visit": "Morning (9:30 AM ferry)",
                    "estimated_duration": "4 - 5 hours"
                },
                {
                    "name": "Siddhivinayak Temple",
                    "description": "Celebrated 19th-century Hindu temple dedicated to Lord Ganesha, attracting devotees and celebrities from across the globe.",
                    "category": "Religious",
                    "latitude": 19.0169,
                    "longitude": 72.8304,
                    "address": "SK Bole Marg, Prabhadevi, Mumbai",
                    "city": "Mumbai",
                    "image_url": "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80",
                    "rating": 4.8,
                    "review_count": 19500,
                    "opening_hours": "05:30 AM",
                    "closing_hours": "09:45 PM",
                    "entry_fee": "Free Entry",
                    "best_time_to_visit": "Early Morning (6:00 AM - 8:30 AM)",
                    "estimated_duration": "1 - 1.5 hours"
                },
                {
                    "name": "High Street Phoenix & Palladium",
                    "description": "Mumbai's luxury lifestyle and entertainment destination with designer flagship stores, fine dining restaurants, and cinema halls.",
                    "category": "Shopping",
                    "latitude": 18.9950,
                    "longitude": 72.8247,
                    "address": "Senapati Bapat Marg, Lower Parel, Mumbai",
                    "city": "Mumbai",
                    "image_url": "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=800&auto=format&fit=crop&q=80",
                    "rating": 4.7,
                    "review_count": 15400,
                    "opening_hours": "11:00 AM",
                    "closing_hours": "10:30 PM",
                    "entry_fee": "Free Entry",
                    "best_time_to_visit": "Afternoon & Evening",
                    "estimated_duration": "2 - 3 hours"
                },

                # Chennai
                {
                    "name": "Marina Beach & Lighthouse",
                    "description": "The world's second-longest natural urban beach extending over 13 km along the Coromandel coast with iconic statues and fresh seafood stalls.",
                    "category": "Beach",
                    "latitude": 13.0499,
                    "longitude": 80.2824,
                    "address": "Kamarajar Salai, Triplicane, Chennai",
                    "city": "Chennai",
                    "image_url": "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=800&auto=format&fit=crop&q=80",
                    "rating": 4.6,
                    "review_count": 21000,
                    "opening_hours": "24 Hours Open",
                    "closing_hours": "24 Hours Open",
                    "entry_fee": "Free (Lighthouse ₹20)",
                    "best_time_to_visit": "Sunrise & Evening (5:00 PM - 8:00 PM)",
                    "estimated_duration": "2 hours"
                },
                {
                    "name": "Kapaleeshwarar Temple",
                    "description": "Splendid 7th-century Dravidian architectural masterpiece dedicated to Lord Shiva with an intricately sculpted 37-meter rainbow gopuram.",
                    "category": "Religious",
                    "latitude": 13.0336,
                    "longitude": 80.2699,
                    "address": "Vadakku Maada Veethi, Mylapore, Chennai",
                    "city": "Chennai",
                    "image_url": "https://images.unsplash.com/photo-1609766857041-ed402ea8069a?w=800&auto=format&fit=crop&q=80",
                    "rating": 4.9,
                    "review_count": 14200,
                    "opening_hours": "06:00 AM",
                    "closing_hours": "09:00 PM",
                    "entry_fee": "Free Entry",
                    "best_time_to_visit": "Morning (7:00 AM - 9:30 AM)",
                    "estimated_duration": "1.5 hours"
                },
                {
                    "name": "Guindy National Park & Children's Park",
                    "description": "Rare protected urban national park with spotted deer, blackbucks, birds, and an adjacent snake and reptile rescue park.",
                    "category": "Family / Kids",
                    "latitude": 13.0067,
                    "longitude": 80.2206,
                    "address": "Rangeguindy, Guindy, Chennai",
                    "city": "Chennai",
                    "image_url": "https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=800&auto=format&fit=crop&q=80",
                    "rating": 4.5,
                    "review_count": 8700,
                    "opening_hours": "09:00 AM",
                    "closing_hours": "05:30 PM",
                    "entry_fee": "₹30 / adult, ₹10 / child",
                    "best_time_to_visit": "Morning (9:30 AM - 12:30 PM)",
                    "estimated_duration": "2 - 3 hours"
                },

                # Bangalore
                {
                    "name": "Lalbagh Botanical Garden & Glass House",
                    "description": "Sprawling 240-acre botanical haven dating to Hyder Ali, featuring over 1,800 exotic plant species, a 3,000-million-year-old rock, and Victorian glass house.",
                    "category": "Nature",
                    "latitude": 12.9507,
                    "longitude": 77.5848,
                    "address": "Mavalli, Bengaluru",
                    "city": "Bangalore",
                    "image_url": "https://images.unsplash.com/photo-1588714477688-cf28a50e94f7?w=800&auto=format&fit=crop&q=80",
                    "rating": 4.7,
                    "review_count": 19800,
                    "opening_hours": "06:00 AM",
                    "closing_hours": "07:00 PM",
                    "entry_fee": "₹25 / person",
                    "best_time_to_visit": "Early Morning (6:30 AM - 9:30 AM)",
                    "estimated_duration": "2 - 3 hours"
                },
                {
                    "name": "Bangalore Palace",
                    "description": "Tudor-style royal castle reminiscent of Windsor Castle, adorned with fortified towers, stained-glass windows, and royal artifacts.",
                    "category": "Historical",
                    "latitude": 12.9988,
                    "longitude": 77.5921,
                    "address": "Vasanth Nagar, Bengaluru",
                    "city": "Bangalore",
                    "image_url": "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=800&auto=format&fit=crop&q=80",
                    "rating": 4.6,
                    "review_count": 13500,
                    "opening_hours": "10:00 AM",
                    "closing_hours": "05:30 PM",
                    "entry_fee": "₹250 / Indian, ₹500 / Foreigner",
                    "best_time_to_visit": "10:30 AM - 2:00 PM",
                    "estimated_duration": "1.5 - 2 hours"
                },
                {
                    "name": "Wonderla Amusement Park Bangalore",
                    "description": "India's premier high-tech theme park featuring 60+ thrill rides, massive wave pools, water coasters, and family adventure attractions.",
                    "category": "Entertainment",
                    "latitude": 12.8343,
                    "longitude": 77.4010,
                    "address": "28th k.m., Mysore Road, Bengaluru",
                    "city": "Bangalore",
                    "image_url": "https://images.unsplash.com/photo-1513889961551-628c1e5e2ee9?w=800&auto=format&fit=crop&q=80",
                    "rating": 4.8,
                    "review_count": 27000,
                    "opening_hours": "11:00 AM",
                    "closing_hours": "06:00 PM",
                    "entry_fee": "₹1,450 / adult",
                    "best_time_to_visit": "Full Day Adventure",
                    "estimated_duration": "6 - 7 hours"
                },

                # Goa
                {
                    "name": "Aguada Fort & Lighthouse",
                    "description": "Well-preserved 17th-century Portuguese coastal fort standing grandly on Sinquerim Beach offering 360-degree Arabian Sea panoramas.",
                    "category": "Historical",
                    "latitude": 15.4920,
                    "longitude": 73.7737,
                    "address": "Fort Aguada Road, Candolim, Goa",
                    "city": "Goa",
                    "image_url": "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&auto=format&fit=crop&q=80",
                    "rating": 4.7,
                    "review_count": 17400,
                    "opening_hours": "09:30 AM",
                    "closing_hours": "06:00 PM",
                    "entry_fee": "₹25 / person",
                    "best_time_to_visit": "Sunset (4:30 PM - 6:30 PM)",
                    "estimated_duration": "1.5 - 2 hours"
                },
                {
                    "name": "Baga Beach Watersports & Shacks",
                    "description": "Lively North Goa beach famous for parasailing, jet skis, dolphin spotting, beach shacks with live music, and evening nightlife.",
                    "category": "Beach",
                    "latitude": 15.5553,
                    "longitude": 73.7517,
                    "address": "Baga Beach, Calangute, Goa",
                    "city": "Goa",
                    "image_url": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80",
                    "rating": 4.7,
                    "review_count": 26000,
                    "opening_hours": "24 Hours Open",
                    "closing_hours": "24 Hours Open",
                    "entry_fee": "Free Entry",
                    "best_time_to_visit": "Afternoon watersports & Evening nightlife",
                    "estimated_duration": "3 - 4 hours"
                },
                {
                    "name": "Basilica of Bom Jesus",
                    "description": "UNESCO World Heritage baroque Catholic basilica holding the sacred mortal remains of St. Francis Xavier in Old Goa.",
                    "category": "Religious",
                    "latitude": 15.5009,
                    "longitude": 73.9116,
                    "address": "Old Goa Road, Bainguinim, Goa",
                    "city": "Goa",
                    "image_url": "https://images.unsplash.com/photo-1548013146-72479768bada?w=800&auto=format&fit=crop&q=80",
                    "rating": 4.8,
                    "review_count": 12800,
                    "opening_hours": "09:00 AM",
                    "closing_hours": "06:30 PM",
                    "entry_fee": "Free Entry",
                    "best_time_to_visit": "Morning (9:30 AM - 12:00 PM)",
                    "estimated_duration": "1 hour"
                }
            ]

            for s in seed_data:
                spot_obj = models.TouristSpot(
                    name=s["name"],
                    description=s.get("description", ""),
                    category=s.get("category", "Historical"),
                    latitude=s["latitude"],
                    longitude=s["longitude"],
                    address=s.get("address", ""),
                    city=s.get("city", ""),
                    image_url=s.get("image_url", ""),
                    rating=s.get("rating", 4.5),
                    review_count=s.get("review_count", 100),
                    opening_hours=s.get("opening_hours", "09:00 AM"),
                    closing_hours=s.get("closing_hours", "06:00 PM"),
                    entry_fee=s.get("entry_fee", "Free Entry"),
                    best_time_to_visit=s.get("best_time_to_visit", "Morning / Evening"),
                    estimated_duration=s.get("estimated_duration", "1-2 hours"),
                    is_active=True,
                    source="system"
                )
                db.add(spot_obj)
            db.commit()
            print(f"Successfully seeded {len(seed_data)} tourist spots into database.")
        db.close()
    except Exception as e:
        print("Error seeding tourist spots:", e)

# Auto seed on module load
seed_tourist_spots_if_needed()

@app.get("/api/tourist-spots/nearby")
def get_nearby_tourist_spots(
    hotel_id: Optional[int] = None,
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    city: Optional[str] = None,
    max_distance: Optional[str] = None,
    category: Optional[str] = None,
    rating: Optional[str] = None,
    open_now: Optional[str] = None,
    search: Optional[str] = None,
    limit: Optional[int] = 30,
    db: Session = Depends(get_db)
):
    target_lat = lat
    target_lng = lng
    target_city = city or ""

    if hotel_id:
        hotel = db.query(models.Hotel).filter(models.Hotel.id == hotel_id).first()
        if hotel:
            if hotel.latitude and hotel.longitude:
                target_lat = hotel.latitude
                target_lng = hotel.longitude
            if not target_city:
                target_city = hotel.city or hotel.location or ""

    if target_lat is None or target_lng is None:
        city_lower = (target_city or "").lower()
        if "hyderabad" in city_lower:
            target_lat, target_lng = 17.3850, 78.4867
        elif "vizag" in city_lower or "visakhapatnam" in city_lower:
            target_lat, target_lng = 17.6868, 83.2185
        elif "mumbai" in city_lower:
            target_lat, target_lng = 18.9220, 72.8347
        elif "chennai" in city_lower:
            target_lat, target_lng = 13.0827, 80.2707
        elif "bangalore" in city_lower or "bengaluru" in city_lower:
            target_lat, target_lng = 12.9716, 77.5946
        elif "goa" in city_lower:
            target_lat, target_lng = 15.4920, 73.7737
        else:
            target_lat, target_lng = 17.3850, 78.4867 # Default

    all_spots = db.query(models.TouristSpot).filter(models.TouristSpot.is_active == True).all()

    enriched_spots = []
    for s in all_spots:
        dist = calculate_distance_km(target_lat, target_lng, s.latitude, s.longitude)
        travel_time = calculate_travel_time(dist)
        maps_url = f"https://www.google.com/maps/dir/?api=1&origin={target_lat},{target_lng}&destination={s.latitude},{s.longitude}"
        
        spot_dict = {
            "id": s.id,
            "name": s.name,
            "description": s.description or "",
            "category": s.category,
            "latitude": s.latitude,
            "longitude": s.longitude,
            "address": s.address or "",
            "city": s.city or "",
            "image_url": s.image_url or "",
            "rating": s.rating or 4.5,
            "review_count": s.review_count or 100,
            "opening_hours": s.opening_hours or "09:00 AM",
            "closing_hours": s.closing_hours or "06:00 PM",
            "entry_fee": s.entry_fee or "Free Entry",
            "best_time_to_visit": s.best_time_to_visit or "Morning / Evening",
            "estimated_duration": s.estimated_duration or "1-2 hours",
            "is_active": bool(s.is_active),
            "distance": dist,
            "estimated_travel_time": travel_time,
            "is_open_now": True,
            "google_maps_url": maps_url
        }
        enriched_spots.append(spot_dict)

    # 1. Search Query Filter
    if search and search.strip():
        q = search.strip().lower()
        enriched_spots = [
            s for s in enriched_spots
            if q in s["name"].lower() or q in s["description"].lower() or q in s["category"].lower() or q in s["address"].lower() or q in s["city"].lower()
        ]

    # 2. Category Filter
    if category and category != "All" and category != "all":
        c_low = category.strip().lower()
        enriched_spots = [s for s in enriched_spots if s["category"].lower() == c_low]

    # 3. Rating Filter
    if rating and rating != "All":
        try:
            min_r = float(rating)
            enriched_spots = [s for s in enriched_spots if s["rating"] >= min_r]
        except ValueError:
            pass

    # 4. Max Distance Filter
    if max_distance and max_distance != "All":
        try:
            max_d = float(max_distance)
            enriched_spots = [s for s in enriched_spots if s["distance"] is not None and s["distance"] <= max_d]
        except ValueError:
            pass

    # Sort by Distance Ascending
    enriched_spots.sort(key=lambda x: x["distance"] if x["distance"] is not None else 999999)

    top_recommended = sorted(enriched_spots, key=lambda x: x["rating"], reverse=True)[:4]

    return {
        "target_location": {
            "latitude": target_lat,
            "longitude": target_lng,
            "city": target_city
        },
        "total": len(enriched_spots),
        "top_recommended": top_recommended,
        "spots": enriched_spots[:limit]
    }

@app.get("/api/tourist-spots/categories")
def get_tourist_spot_categories(db: Session = Depends(get_db)):
    spots = db.query(models.TouristSpot).filter(models.TouristSpot.is_active == True).all()
    counts = {}
    for s in spots:
        counts[s.category] = counts.get(s.category, 0) + 1
    return [{"category": cat, "count": cnt} for cat, cnt in counts.items()]

@app.get("/api/tourist-spots/{spot_id}")
def get_tourist_spot_detail(spot_id: int, db: Session = Depends(get_db)):
    spot = db.query(models.TouristSpot).filter(models.TouristSpot.id == spot_id).first()
    if not spot:
        raise HTTPException(status_code=404, detail="Tourist spot not found")
    return spot

@app.get("/api/admin/tourist-spots")
def get_admin_tourist_spots(
    search: Optional[str] = None,
    category: Optional[str] = None,
    city: Optional[str] = None,
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(models.TouristSpot)
    if search and search.strip():
        q = f"%{search.strip().lower()}%"
        query = query.filter(
            models.TouristSpot.name.ilike(q) |
            models.TouristSpot.description.ilike(q) |
            models.TouristSpot.address.ilike(q) |
            models.TouristSpot.city.ilike(q)
        )
    if category and category != "All":
        query = query.filter(models.TouristSpot.category == category)
    if city and city != "All":
        query = query.filter(models.TouristSpot.city.ilike(f"%{city.strip()}%"))
    if status == "active":
        query = query.filter(models.TouristSpot.is_active == True)
    elif status == "inactive":
        query = query.filter(models.TouristSpot.is_active == False)

    spots = query.order_by(models.TouristSpot.id.desc()).all()
    total_spots = db.query(models.TouristSpot).count()
    active_spots = db.query(models.TouristSpot).filter(models.TouristSpot.is_active == True).count()
    top_rated_spots = db.query(models.TouristSpot).filter(models.TouristSpot.rating >= 4.7).count()
    categories_count = db.query(models.TouristSpot.category).distinct().count()

    return {
        "stats": {
            "total_spots": total_spots,
            "active_spots": active_spots,
            "top_rated_spots": top_rated_spots,
            "total_categories": categories_count
        },
        "spots": spots
    }

@app.post("/api/admin/tourist-spots")
def create_admin_tourist_spot(
    spot: schemas.TouristSpotCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    spot_data = spot.dict()
    spot_data["is_active"] = bool(spot.is_active)
    spot_data["source"] = "admin"
    new_spot = models.TouristSpot(**spot_data)
    db.add(new_spot)
    db.commit()
    db.refresh(new_spot)
    return new_spot

@app.put("/api/admin/tourist-spots/{spot_id}")
def update_admin_tourist_spot(
    spot_id: int,
    spot_update: schemas.TouristSpotUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    spot = db.query(models.TouristSpot).filter(models.TouristSpot.id == spot_id).first()
    if not spot:
        raise HTTPException(status_code=404, detail="Tourist spot not found")
    
    for key, val in spot_update.dict(exclude_unset=True).items():
        if key == "is_active" and val is not None:
            setattr(spot, key, bool(val))
        elif val is not None:
            setattr(spot, key, val)
    db.commit()
    db.refresh(spot)
    return spot

@app.patch("/api/admin/tourist-spots/{spot_id}/toggle-status")
def toggle_admin_tourist_spot_status(
    spot_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    spot = db.query(models.TouristSpot).filter(models.TouristSpot.id == spot_id).first()
    if not spot:
        raise HTTPException(status_code=404, detail="Tourist spot not found")
    spot.is_active = not bool(spot.is_active)
    db.commit()
    db.refresh(spot)
    return {"success": True, "spot": {"id": spot.id, "name": spot.name, "is_active": bool(spot.is_active)}}

@app.delete("/api/admin/tourist-spots/{spot_id}")
def delete_admin_tourist_spot(
    spot_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    spot = db.query(models.TouristSpot).filter(models.TouristSpot.id == spot_id).first()
    if not spot:
        raise HTTPException(status_code=404, detail="Tourist spot not found")
    db.delete(spot)
    db.commit()
    return {"success": True, "message": f"Deleted tourist spot: {spot.name}"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

