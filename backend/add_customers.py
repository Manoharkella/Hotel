import sqlite3
import bcrypt

def run():
    conn = sqlite3.connect('hotel.db')
    c = conn.cursor()
    
    try:
        # Try to add phone column if it doesn't exist
        c.execute("ALTER TABLE users ADD COLUMN phone VARCHAR DEFAULT ''")
    except Exception as e:
        # Column probably already exists
        print("Phone column already exists or error:", e)
        
    names = [
        "arjun", "priya", "karthik", "sneha", "rahul",
        "ananya", "vikram", "neha", "rohit", "pooja"
    ]
    
    customers_added = []
    
    # Starting phone number base
    base_phone = 9876543200
    
    for i, name in enumerate(names):
        email = f"{name}@gmail.com"
        password = name
        phone = str(base_phone + i)
        
        # Hash the password
        salt = bcrypt.gensalt()
        hashed_pw = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
        
        try:
            c.execute("""
                INSERT INTO users (full_name, email, password_hash, role, status, phone) 
                VALUES (?, ?, ?, 'customer', 'ACTIVE', ?)
            """, (name.capitalize(), email, hashed_pw, phone))
            
            customers_added.append({
                "Name": name.capitalize(),
                "Email": email,
                "Password": password,
                "Phone": phone
            })
        except sqlite3.IntegrityError:
            print(f"User {email} already exists. Skipping.")
            
    conn.commit()
    conn.close()
    
    print("--- CUSTOMER DETAILS ---")
    for c in customers_added:
        print(f"Name: {c['Name']} | Email: {c['Email']} | Password: {c['Password']} | Phone: {c['Phone']}")

if __name__ == '__main__':
    run()
