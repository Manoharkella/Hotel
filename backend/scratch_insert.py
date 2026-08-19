import sys
sys.path.append("c:\\Hotel\\backend")

from database import SessionLocal
import models
import bcrypt

def get_password_hash(password):
    if isinstance(password, str):
        password = password.encode('utf-8')
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password, salt).decode('utf-8')

db = SessionLocal()

locations = {
    "Hyderabad": ["HYD1", "HYD2", "HYD3", "HYD4"],
    "Vizag": ["VZG1", "VZG2", "VZG3", "VZG4"],
    "Chennai": ["CHN1", "CHN2", "CHN3", "CHN4"]
}

for loc, codes in locations.items():
    for code in codes:
        email = f"{code}@gmail.com"
        exists = db.query(models.Hotel).filter(models.Hotel.email == email).first()
        if not exists:
            new_hotel = models.Hotel(
                name=code,
                location=loc,
                email=email,
                password_hash=get_password_hash(code),
                status="APPROVED",
                photos=["https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2000&auto=format&fit=crop"]
            )
            db.add(new_hotel)
            db.commit()
            db.refresh(new_hotel)
            
            room = models.Room(
                hotel_id=new_hotel.id,
                room_type="Deluxe",
                quantity=10,
                price_per_night=3000
            )
            db.add(room)
            db.commit()
            print(f"Added {code} in {loc}")
        else:
            print(f"Already exists: {code} in {loc}")

print("Done")
