import sys
sys.path.append("c:\\Hotel\\backend")
from database import SessionLocal
import models

db = SessionLocal()
test_hotels = db.query(models.Hotel).filter(models.Hotel.name.in_(["Test Hotel 4", "Test Hotel 5"])).all()
for hotel in test_hotels:
    print(f"Deleting hotel: {hotel.name}")
    db.delete(hotel)

db.commit()
print("Deletion complete.")
