import sys
sys.path.append(r'c:\Hotel\backend')
import database
import models

db = next(database.get_db())

print("=== USERS ===")
for u in db.query(models.User).all():
    print(f"User ID: {u.id}, Name: {u.full_name}, Email: {u.email}, Role: {u.role}")

print("\n=== LEADS ===")
for l in db.query(models.Lead).all():
    print(f"Lead ID: {l.id}, Customer ID: {l.customer_id}, Destination: {l.destination}, Status: {l.status}, Matched Hotels: {l.matched_hotel_ids}")

print("\n=== MESSAGES ===")
for m in db.query(models.Message).all():
    print(f"Msg ID: {m.id}, Lead ID: {m.lead_id}, Hotel ID: {m.hotel_id}, Sender: {m.sender}, Text: {m.text}")
