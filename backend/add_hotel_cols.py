import sqlite3

def run():
    conn = sqlite3.connect('hotel.db')
    c = conn.cursor()
    try:
        c.execute("ALTER TABLE hotels ADD COLUMN address VARCHAR DEFAULT ''")
        c.execute("ALTER TABLE hotels ADD COLUMN latitude FLOAT")
        c.execute("ALTER TABLE hotels ADD COLUMN longitude FLOAT")
        
        # Add mock coordinates to Vizag and Hyderabad hotels for demo
        c.execute("UPDATE hotels SET address = 'Beach Road, Vizag', latitude = 17.720, longitude = 83.325 WHERE location = 'Vizag'")
        c.execute("UPDATE hotels SET address = 'Banjara Hills, Hyderabad', latitude = 17.415, longitude = 78.435 WHERE location = 'Hyderabad'")
        c.execute("UPDATE hotels SET address = 'T Nagar, Chennai', latitude = 13.040, longitude = 80.235 WHERE location = 'Chennai'")
        
        conn.commit()
        print("Updated hotels table!")
    except Exception as e:
        print("Error:", e)
    finally:
        conn.close()

if __name__ == '__main__':
    run()
