import sqlite3
import random
import bcrypt

def hash_pw(pw):
    return bcrypt.hashpw(pw.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def seed_10_hotels_per_city():
    conn = sqlite3.connect('hotel.db')
    c = conn.cursor()

    # Clear existing hotels, rooms, and wallet tables for a fresh 10 hotels/city seed
    c.execute("DELETE FROM rooms")
    c.execute("DELETE FROM wallet_transactions")
    c.execute("DELETE FROM wallets")
    c.execute("DELETE FROM lead_unlocks")
    c.execute("DELETE FROM quotes")
    c.execute("DELETE FROM bookings")
    c.execute("DELETE FROM hotels")
    
    # Reset autoincrement ID if possible or just let it generate
    hotel_pw = hash_pw("hotel123")

    cities_data = {
        "Hyderabad": [
            # Costly / Luxury (₹10,000+)
            {"name": "Taj Falaknuma Palace", "address": "Engine Bowli, Falaknuma, Hyderabad", "lat": 17.3315, "lng": 78.4673, "category": "Luxury",
             "rooms": [("Royal Suite", 35000), ("Grand Deluxe", 18500), ("Palace Chamber", 24000)]},
            {"name": "Taj Krishna", "address": "Road No 1, Banjara Hills, Hyderabad", "lat": 17.4162, "lng": 78.4497, "category": "Luxury",
             "rooms": [("Deluxe Room", 9500), ("Executive Suite", 14500), ("Luxury Room", 11800)]},
            {"name": "ITC Kohenur", "address": "Knowledge City, Madhapur, Hyderabad", "lat": 17.4395, "lng": 78.3855, "category": "Luxury",
             "rooms": [("Executive Club", 11500), ("Eva Room", 13000), ("Grand Suite", 22000)]},
            {"name": "Park Hyatt Hyderabad", "address": "Road No 2, Banjara Hills, Hyderabad", "lat": 17.4265, "lng": 78.4312, "category": "Luxury",
             "rooms": [("Park Room", 10500), ("View Deluxe", 14000), ("Park Suite", 25000)]},
             
            # Medium / Comfort (₹3,500 - ₹8,000)
            {"name": "Novotel Convention Centre", "address": "Near Hitec City, Kondapur, Hyderabad", "lat": 17.4735, "lng": 78.3756, "category": "Medium",
             "rooms": [("Superior Room", 6200), ("Executive Room", 8500)]},
            {"name": "Mercure Hyderabad KCP", "address": "Somajiguda, Erramanzil, Hyderabad", "lat": 17.4230, "lng": 78.4580, "category": "Medium",
             "rooms": [("Superior King", 4800), ("Deluxe Room", 6200)]},
            {"name": "Lemon Tree Hotel Gachibowli", "address": "Financial District, Nanakramguda, Hyderabad", "lat": 17.4150, "lng": 78.3430, "category": "Medium",
             "rooms": [("Superior Room", 4200), ("Executive Room", 5800)]},

            # Cheap / Budget (₹1,000 - ₹3,000)
            {"name": "Treebo Trend Universal", "address": "Lakdikapul, Hyderabad", "lat": 17.4020, "lng": 78.4620, "category": "Budget",
             "rooms": [("Standard Room", 1800), ("Deluxe Room", 2400)]},
            {"name": "FabHotel Abids Residency", "address": "Abids, Nampally, Hyderabad", "lat": 17.3870, "lng": 78.4730, "category": "Budget",
             "rooms": [("Standard Room", 1400), ("Deluxe Room", 1900)]},
            {"name": "OYO Townhouse 084 Gachibowli", "address": "Telecom Nagar, Gachibowli, Hyderabad", "lat": 17.4420, "lng": 78.3610, "category": "Budget",
             "rooms": [("Classic Room", 1200), ("Saver Room", 950)]}
        ],
        
        "Vizag": [
            # Costly / Luxury (₹8,000+)
            {"name": "Novotel Varun Beach", "address": "Beach Road, Maharani Peta, Visakhapatnam", "lat": 17.7126, "lng": 83.3150, "category": "Luxury",
             "rooms": [("Superior Ocean View", 8200), ("Executive Beach Suite", 15500)]},
            {"name": "Radisson Blu Resort Vizag", "address": "Rushikonda, Visakhapatnam", "lat": 17.7845, "lng": 83.3850, "category": "Luxury",
             "rooms": [("Superior Sea View", 9500), ("Executive Suite", 17000)]},
            {"name": "The Gateway Hotel Beach Road", "address": "Beach Road, Visakhapatnam", "lat": 17.7118, "lng": 83.3142, "category": "Luxury",
             "rooms": [("Executive Sea View", 7500), ("Deluxe Suite", 13000)]},

            # Medium / Comfort (₹3,000 - ₹7,000)
            {"name": "The Park Visakhapatnam", "address": "Beach Road, Lawsons Bay Colony, Visakhapatnam", "lat": 17.7212, "lng": 83.3323, "category": "Medium",
             "rooms": [("Deluxe Sea View", 5400), ("Studio Suite", 8900)]},
            {"name": "Four Points by Sheraton Vizag", "address": "Waltair Uplands, Visakhapatnam", "lat": 17.7262, "lng": 83.3182, "category": "Medium",
             "rooms": [("Comfort King", 4800), ("Executive Room", 6800)]},
            {"name": "Fairfield by Marriott Vizag", "address": "NAD X Road, Visakhapatnam", "lat": 17.7410, "lng": 83.2250, "category": "Medium",
             "rooms": [("Standard Room", 4100), ("Deluxe Queen", 5600)]},
            {"name": "Best Western Ramachandra", "address": "Gajuwaka, Visakhapatnam", "lat": 17.6900, "lng": 83.2100, "category": "Medium",
             "rooms": [("Executive Room", 3400), ("Deluxe Suite", 4900)]},

            # Cheap / Budget (₹900 - ₹2,500)
            {"name": "Treebo Trend Beach City", "address": "Dabagardens, Visakhapatnam", "lat": 17.7180, "lng": 83.3020, "category": "Budget",
             "rooms": [("Standard Room", 1600), ("Deluxe Room", 2200)]},
            {"name": "FabHotel Dwaraka Grand", "address": "Dwaraka Nagar, Visakhapatnam", "lat": 17.7280, "lng": 83.3080, "category": "Budget",
             "rooms": [("Standard Room", 1350), ("Executive Room", 1850)]},
            {"name": "OYO 14389 Hotel Sea Rock", "address": "Beach Road, Pandurangapuram, Visakhapatnam", "lat": 17.7140, "lng": 83.3190, "category": "Budget",
             "rooms": [("Classic Room", 1100), ("Budget Single", 850)]}
        ],

        "Chennai": [
            # Costly / Luxury (₹10,000+)
            {"name": "The Leela Palace Chennai", "address": "Adyar Seaface, MRC Nagar, Chennai", "lat": 13.0175, "lng": 80.2764, "category": "Luxury",
             "rooms": [("Deluxe Sea View", 13500), ("Royal Club", 18500), ("Grand Suite", 31000)]},
            {"name": "ITC Grand Chola", "address": "63 Mount Road, Guindy, Chennai", "lat": 13.0104, "lng": 80.2208, "category": "Luxury",
             "rooms": [("Executive Club", 10800), ("Tower Room", 14500), ("Presidential Suite", 34000)]},
            {"name": "Taj Coromandel", "address": "MG Road, Nungambakkam, Chennai", "lat": 13.0583, "lng": 80.2435, "category": "Luxury",
             "rooms": [("Superior Room", 9800), ("Luxury Room", 12500), ("Grand Suite", 23000)]},

            # Medium / Comfort (₹3,500 - ₹8,000)
            {"name": "Hyatt Regency Chennai", "address": "365 Anna Salai, Teynampet, Chennai", "lat": 13.0425, "lng": 80.2458, "category": "Medium",
             "rooms": [("King Room", 6900), ("Club Room", 9800)]},
            {"name": "Radisson Blu Hotel Chennai City Centre", "address": "Egmore, Chennai", "lat": 13.0720, "lng": 80.2580, "category": "Medium",
             "rooms": [("Superior Room", 5500), ("Business Class", 7400)]},
            {"name": "Courtyard by Marriott Chennai", "address": "Anna Salai, Teynampet, Chennai", "lat": 13.0460, "lng": 80.2480, "category": "Medium",
             "rooms": [("Deluxe Room", 5800), ("Executive Suite", 8200)]},
            {"name": "The Residency Towers", "address": "T. Nagar, Chennai", "lat": 13.0410, "lng": 80.2350, "category": "Medium",
             "rooms": [("Executive Room", 4500), ("Suite", 6800)]},

            # Cheap / Budget (₹1,000 - ₹2,800)
            {"name": "Treebo Trend Central Hotel", "address": "Central Railway Station Area, Chennai", "lat": 13.0810, "lng": 80.2740, "category": "Budget",
             "rooms": [("Standard Room", 1750), ("Deluxe Room", 2400)]},
            {"name": "FabHotel T Nagar Inn", "address": "Thyagaraya Nagar, Chennai", "lat": 13.0400, "lng": 80.2300, "category": "Budget",
             "rooms": [("Standard Room", 1450), ("Deluxe Room", 1950)]},
            {"name": "OYO Flagship 474 Egmore", "address": "Gandhi Irwin Road, Egmore, Chennai", "lat": 13.0780, "lng": 80.2610, "category": "Budget",
             "rooms": [("Classic Room", 1150), ("Saver Room", 900)]}
        ],

        "Mumbai": [
            # Costly / Luxury (₹14,000+)
            {"name": "The Taj Mahal Palace", "address": "Apollo Bunder, Colaba, Mumbai", "lat": 18.9220, "lng": 72.8332, "category": "Luxury",
             "rooms": [("Tower Wing Superior", 16500), ("Sea View Deluxe", 24500), ("Palace Suite", 45000)]},
            {"name": "The St. Regis Mumbai", "address": "Lower Parel, Mumbai", "lat": 18.9950, "lng": 72.8250, "category": "Luxury",
             "rooms": [("Deluxe Room", 15000), ("St. Regis Suite", 28000)]},
            {"name": "JW Marriott Mumbai Juhu", "address": "Juhu Tara Road, Mumbai", "lat": 19.1010, "lng": 72.8260, "category": "Luxury",
             "rooms": [("Executive Ocean View", 14000), ("Grand Suite", 26000)]},

            # Medium / Comfort (₹4,500 - ₹9,500)
            {"name": "Trident Nariman Point", "address": "Nariman Point, Mumbai", "lat": 18.9270, "lng": 72.8210, "category": "Medium",
             "rooms": [("Superior City View", 8500), ("Ocean View Deluxe", 11500)]},
            {"name": "Holiday Inn Mumbai International Airport", "address": "Andheri East, Mumbai", "lat": 19.1080, "lng": 72.8870, "category": "Medium",
             "rooms": [("Superior Room", 6200), ("Executive Suite", 9400)]},
            {"name": "Courtyard Mumbai International Airport", "address": "Andheri Kurla Road, Mumbai", "lat": 19.1140, "lng": 72.8690, "category": "Medium",
             "rooms": [("Deluxe Queen", 6800), ("Executive Room", 8900)]},
            {"name": "Ginger Mumbai Airport", "address": "Vile Parle East, Mumbai", "lat": 19.0980, "lng": 72.8530, "category": "Medium",
             "rooms": [("Luxe Room", 4200), ("Executive Room", 5500)]},

            # Cheap / Budget (₹1,200 - ₹3,200)
            {"name": "Treebo Trend Residency Andheri", "address": "Andheri West, Mumbai", "lat": 19.1200, "lng": 72.8360, "category": "Budget",
             "rooms": [("Oak Standard", 2200), ("Maple Deluxe", 2900)]},
            {"name": "FabHotel Bandra Park", "address": "Bandra West, Mumbai", "lat": 19.0600, "lng": 72.8330, "category": "Budget",
             "rooms": [("Standard Room", 1850), ("Executive Room", 2400)]},
            {"name": "OYO 8841 Hotel Airport Metro", "address": "Saki Naka, Andheri East, Mumbai", "lat": 19.1040, "lng": 72.8840, "category": "Budget",
             "rooms": [("Classic Room", 1300), ("Saver Single", 990)]}
        ],

        "Bengaluru": [
            # Costly / Luxury (₹11,000+)
            {"name": "The Leela Palace Bengaluru", "address": "HAL Old Airport Road, Kodihalli, Bengaluru", "lat": 12.9606, "lng": 77.6484, "category": "Luxury",
             "rooms": [("Deluxe Room", 14500), ("Royal Premier", 19500), ("Executive Suite", 32000)]},
            {"name": "Taj West End", "address": "Race Course Road, High Grounds, Bengaluru", "lat": 12.9840, "lng": 77.5830, "category": "Luxury",
             "rooms": [("Luxury room", 12800), ("Garden Suite", 22000)]},
            {"name": "The Ritz-Carlton Bangalore", "address": "Residency Road, Bengaluru", "lat": 12.9670, "lng": 77.6010, "category": "Luxury",
             "rooms": [("Deluxe King", 13500), ("Club Executive", 18000)]},

            # Medium / Comfort (₹3,800 - ₹8,500)
            {"name": "ITC Gardenia", "address": "Residency Road, Bengaluru", "lat": 12.9660, "lng": 77.5960, "category": "Medium",
             "rooms": [("Executive Club", 8900), ("Towers Room", 11500)]},
            {"name": "Radisson Blu Bengaluru Outer Ring Road", "address": "Marathahalli, Bengaluru", "lat": 12.9430, "lng": 77.6960, "category": "Medium",
             "rooms": [("Superior Room", 5800), ("Business Class", 7900)]},
            {"name": "Lemon Tree Premier Ulsoor Lake", "address": "St. John Road, Bengaluru", "lat": 12.9830, "lng": 77.6180, "category": "Medium",
             "rooms": [("Deluxe Room", 4600), ("Executive Suite", 6800)]},
            {"name": "ibis Bengaluru MG Road", "address": "MG Road, Bengaluru", "lat": 12.9720, "lng": 77.6080, "category": "Medium",
             "rooms": [("Standard Queen", 3800), ("Superior Twin", 4700)]},

            # Cheap / Budget (₹1,100 - ₹2,900)
            {"name": "Treebo Trend Indiranagar", "address": "100 Feet Road, Indiranagar, Bengaluru", "lat": 12.9780, "lng": 77.6400, "category": "Budget",
             "rooms": [("Oak Room", 1950), ("Maple Room", 2600)]},
            {"name": "FabHotel Majestic Inn", "address": "Majestic Bus Stand Area, Bengaluru", "lat": 12.9760, "lng": 77.5720, "category": "Budget",
             "rooms": [("Standard Room", 1400), ("Deluxe Room", 1900)]},
            {"name": "OYO 10543 Hotel Koramangala", "address": "5th Block, Koramangala, Bengaluru", "lat": 12.9340, "lng": 77.6220, "category": "Budget",
             "rooms": [("Classic Room", 1200), ("Budget Single", 920)]}
        ]
    }

    hotel_count = 0
    room_count = 0

    hotel_id_counter = 1
    for city, hotels_list in cities_data.items():
        for h in hotels_list:
            email = f"hotel{hotel_id_counter}@{city.lower()}.com"
            c.execute("""INSERT INTO hotels (id, name, location, address, latitude, longitude, email, password_hash, status, photos)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'APPROVED', ?)""",
                      (hotel_id_counter, h["name"], city, h["address"], h["lat"], h["lng"], email, hotel_pw,
                       '["https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80"]'))
            
            for r_type, price in h["rooms"]:
                c.execute("""INSERT INTO rooms (hotel_id, room_type, price_per_night, quantity, max_guests, bed_type, room_size, breakfast_included)
                             VALUES (?, ?, ?, 5, 2, 'King Bed', '350 sq.ft', 'Included')""",
                          (hotel_id_counter, r_type, price))
                room_count += 1
            
            # Seed initial wallet balance
            c.execute("INSERT INTO wallets (hotel_id, balance) VALUES (?, 100)", (hotel_id_counter,))
            hotel_id_counter += 1
            hotel_count += 1

    conn.commit()
    conn.close()
    print(f"Successfully seeded {hotel_count} hotels (10 hotels per city across 5 major cities: Hyderabad, Vizag, Chennai, Mumbai, Bengaluru) and {room_count} rooms!")

if __name__ == '__main__':
    seed_10_hotels_per_city()
