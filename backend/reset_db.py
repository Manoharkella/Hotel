import sqlite3

def reset_tables():
    conn = sqlite3.connect('hotel.db') # Assuming database is hotel.db
    cursor = conn.cursor()
    
    try:
        cursor.execute("DROP TABLE IF EXISTS leads")
        cursor.execute("DROP TABLE IF EXISTS lead_unlocks")
        cursor.execute("DROP TABLE IF EXISTS quotes")
        cursor.execute("DROP TABLE IF EXISTS bookings")
        cursor.execute("DROP TABLE IF EXISTS wallets")
        cursor.execute("DROP TABLE IF EXISTS wallet_transactions")
        conn.commit()
        print("Successfully dropped transaction tables. They will be recreated by main.py.")
    except Exception as e:
        print("Error:", e)
    finally:
        conn.close()

if __name__ == "__main__":
    reset_tables()
