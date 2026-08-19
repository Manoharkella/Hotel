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

names = ["arjun", "priya", "karthik", "sneha", "rahul"]
base_phone = 9876543200

for i, name in enumerate(names):
    email = f"{name}@gmail.com"
    exists = db.query(models.User).filter(models.User.email == email).first()
    if not exists:
        user = models.User(
            full_name=name.capitalize(),
            email=email,
            password_hash=get_password_hash(name),
            role='customer',
            status='ACTIVE',
            phone=str(base_phone + i)
        )
        db.add(user)
        db.commit()
        print(f"Added {name}")
    else:
        print(f"Already exists: {name}")

# Also add the admin user
admin_exists = db.query(models.User).filter(models.User.email == "admin@gmail.com").first()
if not admin_exists:
    admin = models.User(
        full_name="System Admin",
        email="admin@gmail.com",
        password_hash=get_password_hash("admin"),
        role="admin",
        status="ACTIVE",
        phone="9999999999"
    )
    db.add(admin)
    db.commit()
    print("Added admin user")

print("Done")
