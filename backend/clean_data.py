import sqlite3
import bcrypt

def get_password_hash(password):
    if isinstance(password, str):
        password = password.encode('utf-8')
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password, salt).decode('utf-8')

def clean_database():
    conn = sqlite3.connect('hotel.db')
    cursor = conn.cursor()
    
    try:
        # Clear bookings, leads, quotes, unlocks, messages, reviews, transactions
        cursor.execute("DELETE FROM bookings")
        cursor.execute("DELETE FROM leads")
        cursor.execute("DELETE FROM quotes")
        cursor.execute("DELETE FROM lead_unlocks")
        cursor.execute("DELETE FROM messages")
        cursor.execute("DELETE FROM reviews")
        cursor.execute("DELETE FROM wallet_transactions")
        
        # Clear all customer users completely
        cursor.execute("DELETE FROM users WHERE LOWER(role) = 'customer' OR email LIKE '%customer%'")
        
        default_pwd = get_password_hash("password123")
        
        customers = [
            ("Arjun Kumar", "arjun@gmail.com", default_pwd, "customer", "+91 9876543210", "approved", 500),
            ("Priya Sharma", "priya@gmail.com", default_pwd, "customer", "+91 9876543211", "approved", 250),
            ("Rahul Verma", "rahul@gmail.com", default_pwd, "customer", "+91 9876543212", "approved", 100)
        ]
        
        for full_name, email, password_hash, role, phone, status, loyalty_points in customers:
            cursor.execute("""
                INSERT INTO users (full_name, email, password_hash, role, phone, status, loyalty_points)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (full_name, email, password_hash, role, phone, status, loyalty_points))
            
        conn.commit()
        print("Database successfully cleaned!")
        print("1. All booking data, leads, quotes, and reviews cleared.")
        print("2. Exactly 3 customer accounts seeded (arjun@gmail.com, priya@gmail.com, rahul@gmail.com).")
    except Exception as e:
        print("Error during clean database script:", e)
    finally:
        conn.close()

if __name__ == "__main__":
    clean_database()
