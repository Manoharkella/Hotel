import sqlite3

def run():
    conn = sqlite3.connect('hotel.db')
    c = conn.cursor()
    try:
        # VIZAG HOTELS
        c.execute("""UPDATE hotels SET 
            name = 'Novotel Varun Beach', 
            address = 'Beach Road, Krishna Nagar, Maharani Peta, Visakhapatnam, Andhra Pradesh', 
            latitude = 17.7126, longitude = 83.3150 
            WHERE id = 8""")
            
        c.execute("""UPDATE hotels SET 
            name = 'The Park Visakhapatnam', 
            address = 'Beach Road, Lawsons Bay Colony, Pedda Waltair, Visakhapatnam, Andhra Pradesh', 
            latitude = 17.7212, longitude = 83.3323 
            WHERE id = 9""")
            
        c.execute("""UPDATE hotels SET 
            name = 'Four Points by Sheraton', 
            address = '10-28-3 Waltair Uplands, Visakhapatnam, Andhra Pradesh', 
            latitude = 17.7262, longitude = 83.3182 
            WHERE id = 10""")
            
        c.execute("""UPDATE hotels SET 
            name = 'Gateway Hotel Beach Road', 
            address = 'Beach Road, Visakhapatnam, Andhra Pradesh', 
            latitude = 17.7118, longitude = 83.3142 
            WHERE id = 11""")

        # HYDERABAD HOTELS
        c.execute("""UPDATE hotels SET 
            name = 'Taj Krishna', 
            address = 'Road No 1, Banjara Hills, Hyderabad, Telangana', 
            latitude = 17.4162, longitude = 78.4497 
            WHERE id = 4""")
            
        c.execute("""UPDATE hotels SET 
            name = 'Novotel Hyderabad Convention Centre', 
            address = 'Near Hitec City, Kondapur, Hyderabad, Telangana', 
            latitude = 17.4735, longitude = 78.3756 
            WHERE id = 5""")
            
        c.execute("""UPDATE hotels SET 
            name = 'ITC Kohenur', 
            address = 'Knowledge City, Madhapur, Hyderabad, Telangana', 
            latitude = 17.4395, longitude = 78.3855 
            WHERE id = 6""")
            
        c.execute("""UPDATE hotels SET 
            name = 'Park Hyatt Hyderabad', 
            address = 'Road No. 2, Banjara Hills, Hyderabad, Telangana', 
            latitude = 17.4265, longitude = 78.4312 
            WHERE id = 7""")
            
        c.execute("""UPDATE hotels SET 
            address = 'HITEC City, Hyderabad, Telangana', 
            latitude = 17.4447, longitude = 78.3728 
            WHERE id = 1""")

        # CHENNAI HOTELS
        c.execute("""UPDATE hotels SET 
            name = 'ITC Grand Chola', 
            address = '63 Mount Road, Guindy, Chennai, Tamil Nadu', 
            latitude = 13.0104, longitude = 80.2208 
            WHERE id = 12""")
            
        c.execute("""UPDATE hotels SET 
            name = 'Taj Coromandel', 
            address = '37 Mahatma Gandhi Road, Nungambakkam, Chennai, Tamil Nadu', 
            latitude = 13.0583, longitude = 80.2435 
            WHERE id = 13""")
            
        c.execute("""UPDATE hotels SET 
            name = 'The Leela Palace Chennai', 
            address = 'Adyar Seaface, MRC Nagar, Chennai, Tamil Nadu', 
            latitude = 13.0175, longitude = 80.2764 
            WHERE id = 14""")
            
        c.execute("""UPDATE hotels SET 
            name = 'Hyatt Regency Chennai', 
            address = '365 Anna Salai, Teynampet, Chennai, Tamil Nadu', 
            latitude = 13.0425, longitude = 80.2458 
            WHERE id = 15""")
        
        conn.commit()
        print("Updated existing mock hotels with real world addresses and exact coordinates.")
    except Exception as e:
        print("Error:", e)
    finally:
        conn.close()

if __name__ == '__main__':
    run()
