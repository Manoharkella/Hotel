import os
from database import SessionLocal
import models
import bcrypt

def get_password_hash(password):
    if isinstance(password, str):
        password = password.encode('utf-8')
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password, salt).decode('utf-8')

def clean_pg_database():
    db = SessionLocal()
    try:
        # Delete dependent operational tables
        db.query(models.Booking).delete()
        db.query(models.Quote).delete()
        db.query(models.LeadUnlock).delete()
        db.query(models.Lead).delete()
        db.query(models.Message).delete()
        db.query(models.Review).delete()
        db.query(models.WalletTransaction).delete()
        
        # Delete all customer users
        customers = db.query(models.User).filter(models.User.role == 'customer').all()
        for c in customers:
            db.delete(c)
        db.commit()

        # Seed exactly 3 customers
        default_pwd = get_password_hash("password123")
        three_customers = [
            ("Arjun Kumar", "arjun@gmail.com", default_pwd, "customer", "+91 9876543210", "ACTIVE", 500),
            ("Priya Sharma", "priya@gmail.com", default_pwd, "customer", "+91 9876543211", "ACTIVE", 250),
            ("Rahul Verma", "rahul@gmail.com", default_pwd, "customer", "+91 9876543212", "ACTIVE", 100)
        ]

        for name, email, pwd, role, phone, status, pts in three_customers:
            u = models.User(
                full_name=name,
                email=email,
                password_hash=pwd,
                role=role,
                phone=phone,
                status=status,
                loyalty_points=pts
            )
            db.add(u)
        
        db.commit()
        print("PostgreSQL Database cleaned successfully!")
        print("Exactly 3 customer accounts seeded.")
    except Exception as e:
        print("Error cleaning DB:", e)
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    clean_pg_database()
