import sqlite3
import bcrypt

def hash_pw(pw):
    return bcrypt.hashpw(pw.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def seed_customized_10_hotels_per_city():
    conn = sqlite3.connect('hotel.db')
    c = conn.cursor()

    # Clear existing tables for fresh seed
    c.execute("DELETE FROM rooms")
    c.execute("DELETE FROM wallet_transactions")
    c.execute("DELETE FROM wallets")
    c.execute("DELETE FROM lead_unlocks")
    c.execute("DELETE FROM quotes")
    c.execute("DELETE FROM bookings")
    c.execute("DELETE FROM hotels")

    hotel_pw = hash_pw("hotel123")

    # Real hotels per city with distinct room compositions (Deluxe-only, Ultra Luxury-only, Mixed, Budget)
    cities_data = {
        "Hyderabad": [
            # 1. Ultra Luxury Only
            {"name": "Taj Falaknuma Palace", "address": "Engine Bowli, Falaknuma, Hyderabad", "lat": 17.3315, "lng": 78.4673,
             "rooms": [("Nizam Ultra Suite", 45000), ("Royal Imperial Chamber", 65000)]},
            # 2. Mixed Luxury
            {"name": "Taj Krishna", "address": "Road No 1, Banjara Hills, Hyderabad", "lat": 17.4162, "lng": 78.4497,
             "rooms": [("Deluxe Room", 9500), ("Executive Suite", 14500), ("Presidential Ultra Suite", 28000)]},
            # 3. Deluxe Only
            {"name": "ITC Kohenur", "address": "Knowledge City, Madhapur, Hyderabad", "lat": 17.4395, "lng": 78.3855,
             "rooms": [("Deluxe Executive Club", 11500), ("Deluxe Eva Room", 13000)]},
            # 4. Ultra Luxury Only
            {"name": "Park Hyatt Hyderabad", "address": "Road No 2, Banjara Hills, Hyderabad", "lat": 17.4265, "lng": 78.4312,
             "rooms": [("Ultra Luxury Villa", 38000), ("Presidential Suite", 52000)]},
            # 5. Mixed Medium
            {"name": "Novotel Convention Centre", "address": "Near Hitec City, Kondapur, Hyderabad", "lat": 17.4735, "lng": 78.3756,
             "rooms": [("Standard Room", 5800), ("Deluxe Room", 7500), ("Ultra Executive Suite", 12500)]},
            # 6. Deluxe Only
            {"name": "Mercure Hyderabad KCP", "address": "Somajiguda, Erramanzil, Hyderabad", "lat": 17.4230, "lng": 78.4580,
             "rooms": [("Deluxe King", 4800), ("Deluxe Queen", 5600)]},
            # 7. Mixed Medium
            {"name": "Lemon Tree Premier Gachibowli", "address": "Financial District, Nanakramguda, Hyderabad", "lat": 17.4150, "lng": 78.3430,
             "rooms": [("Superior Room", 4200), ("Deluxe Room", 5400), ("Executive Suite", 8500)]},
            # 8. Budget Standard Only
            {"name": "Treebo Trend Universal", "address": "Lakdikapul, Hyderabad", "lat": 17.4020, "lng": 78.4620,
             "rooms": [("Budget Standard", 1800)]},
            # 9. Deluxe Only (Budget)
            {"name": "FabHotel Abids Residency", "address": "Abids, Nampally, Hyderabad", "lat": 17.3870, "lng": 78.4730,
             "rooms": [("Deluxe Saver", 1400), ("Deluxe Prime", 1900)]},
            # 10. Cheap Budget Only
            {"name": "OYO Townhouse 084 Gachibowli", "address": "Telecom Nagar, Gachibowli, Hyderabad", "lat": 17.4420, "lng": 78.3610,
             "rooms": [("Economy Room", 950)]}
        ],

        "Vizag": [
            # 1. Ultra Luxury Only
            {"name": "Radisson Blu Resort Vizag", "address": "Rushikonda Beach, Visakhapatnam", "lat": 17.7845, "lng": 83.3850,
             "rooms": [("Ultra Oceanfront Villa", 26000), ("Presidential Beach Suite", 39000)]},
            # 2. Mixed Luxury
            {"name": "Novotel Varun Beach", "address": "Beach Road, Maharani Peta, Visakhapatnam", "lat": 17.7126, "lng": 83.3150,
             "rooms": [("Superior Ocean View", 8200), ("Deluxe Room", 9800), ("Ultra Executive Suite", 18500)]},
            # 3. Deluxe Only
            {"name": "The Gateway Hotel Beach Road", "address": "Beach Road, Visakhapatnam", "lat": 17.7118, "lng": 83.3142,
             "rooms": [("Deluxe Sea View", 7500), ("Deluxe Executive", 8900)]},
            # 4. Mixed Medium
            {"name": "The Park Visakhapatnam", "address": "Beach Road, Lawsons Bay Colony, Visakhapatnam", "lat": 17.7212, "lng": 83.3323,
             "rooms": [("Superior Room", 5200), ("Deluxe Room", 6800), ("Ultra Suite", 11500)]},
            # 5. Deluxe Only
            {"name": "Four Points by Sheraton Vizag", "address": "Waltair Uplands, Visakhapatnam", "lat": 17.7262, "lng": 83.3182,
             "rooms": [("Deluxe Comfort King", 4800), ("Deluxe Executive", 6200)]},
            # 6. Mixed Medium
            {"name": "Fairfield by Marriott Vizag", "address": "NAD X Road, Visakhapatnam", "lat": 17.7410, "lng": 83.2250,
             "rooms": [("Standard Room", 3900), ("Deluxe Room", 5100)]},
            # 7. Deluxe Only
            {"name": "Best Western Ramachandra", "address": "Gajuwaka, Visakhapatnam", "lat": 17.6900, "lng": 83.2100,
             "rooms": [("Deluxe Room", 3400), ("Deluxe Club", 4200)]},
            # 8. Budget Standard Only
            {"name": "Treebo Trend Beach City", "address": "Dabagardens, Visakhapatnam", "lat": 17.7180, "lng": 83.3020,
             "rooms": [("Standard Room", 1600)]},
            # 9. Deluxe Only (Budget)
            {"name": "FabHotel Dwaraka Grand", "address": "Dwaraka Nagar, Visakhapatnam", "lat": 17.7280, "lng": 83.3080,
             "rooms": [("Deluxe Saver", 1350), ("Deluxe Executive", 1850)]},
            # 10. Cheap Budget Only
            {"name": "OYO 14389 Hotel Sea Rock", "address": "Beach Road, Pandurangapuram, Visakhapatnam", "lat": 17.7140, "lng": 83.3190,
             "rooms": [("Economy Room", 850)]}
        ],

        "Chennai": [
            # 1. Ultra Luxury Only
            {"name": "The Leela Palace Chennai", "address": "Adyar Seaface, MRC Nagar, Chennai", "lat": 13.0175, "lng": 80.2764,
             "rooms": [("Ultra Ocean Suite", 32000), ("Royal Presidential Villa", 55000)]},
            # 2. Mixed Luxury
            {"name": "ITC Grand Chola", "address": "63 Mount Road, Guindy, Chennai", "lat": 13.0104, "lng": 80.2208,
             "rooms": [("Executive Club", 10800), ("Deluxe Tower Room", 14500), ("Ultra Chola Suite", 34000)]},
            # 3. Deluxe Only
            {"name": "Taj Coromandel", "address": "MG Road, Nungambakkam, Chennai", "lat": 13.0583, "lng": 80.2435,
             "rooms": [("Deluxe Superior", 9800), ("Deluxe Luxury", 12500)]},
            # 4. Mixed Medium
            {"name": "Hyatt Regency Chennai", "address": "365 Anna Salai, Teynampet, Chennai", "lat": 13.0425, "lng": 80.2458,
             "rooms": [("Standard King", 6900), ("Deluxe Club", 9800), ("Ultra Regency Suite", 16500)]},
            # 5. Deluxe Only
            {"name": "Radisson Blu Chennai City Centre", "address": "Egmore, Chennai", "lat": 13.0720, "lng": 80.2580,
             "rooms": [("Deluxe Superior", 5500), ("Deluxe Business Class", 7200)]},
            # 6. Mixed Medium
            {"name": "Courtyard by Marriott Chennai", "address": "Anna Salai, Teynampet, Chennai", "lat": 13.0460, "lng": 80.2480,
             "rooms": [("Standard Room", 5200), ("Deluxe Room", 6800)]},
            # 7. Deluxe Only
            {"name": "The Residency Towers", "address": "T. Nagar, Chennai", "lat": 13.0410, "lng": 80.2350,
             "rooms": [("Deluxe Executive", 4500), ("Deluxe Suite", 6200)]},
            # 8. Budget Standard Only
            {"name": "Treebo Trend Central Hotel", "address": "Central Railway Station Area, Chennai", "lat": 13.0810, "lng": 80.2740,
             "rooms": [("Standard Room", 1750)]},
            # 9. Deluxe Only (Budget)
            {"name": "FabHotel T Nagar Inn", "address": "Thyagaraya Nagar, Chennai", "lat": 13.0400, "lng": 80.2300,
             "rooms": [("Deluxe Saver", 1450), ("Deluxe Prime", 1950)]},
            # 10. Cheap Budget Only
            {"name": "OYO Flagship 474 Egmore", "address": "Gandhi Irwin Road, Egmore, Chennai", "lat": 13.0780, "lng": 80.2610,
             "rooms": [("Economy Single", 900)]}
        ],

        "Mumbai": [
            # 1. Ultra Luxury Only
            {"name": "The Taj Mahal Palace", "address": "Apollo Bunder, Colaba, Mumbai", "lat": 18.9220, "lng": 72.8332,
             "rooms": [("Ultra Sea View Suite", 38000), ("Tata Grand Presidential Suite", 75000)]},
            # 2. Mixed Luxury
            {"name": "The St. Regis Mumbai", "address": "Lower Parel, Mumbai", "lat": 18.9950, "lng": 72.8250,
             "rooms": [("Deluxe King", 15000), ("Deluxe Suite", 22000), ("Ultra St. Regis Suite", 34000)]},
            # 3. Deluxe Only
            {"name": "JW Marriott Mumbai Juhu", "address": "Juhu Tara Road, Mumbai", "lat": 19.1010, "lng": 72.8260,
             "rooms": [("Deluxe Ocean View", 14000), ("Deluxe Executive", 17500)]},
            # 4. Mixed Medium
            {"name": "Trident Nariman Point", "address": "Nariman Point, Mumbai", "lat": 18.9270, "lng": 72.8210,
             "rooms": [("Superior City View", 8500), ("Deluxe Ocean View", 11500), ("Ultra Suite", 19500)]},
            # 5. Deluxe Only
            {"name": "Holiday Inn Mumbai Airport", "address": "Andheri East, Mumbai", "lat": 19.1080, "lng": 72.8870,
             "rooms": [("Deluxe Room", 6200), ("Deluxe Executive", 7800)]},
            # 6. Mixed Medium
            {"name": "Courtyard Mumbai Airport", "address": "Andheri Kurla Road, Mumbai", "lat": 19.1140, "lng": 72.8690,
             "rooms": [("Standard Queen", 5800), ("Deluxe Room", 7200)]},
            # 7. Deluxe Only
            {"name": "Ginger Mumbai Airport", "address": "Vile Parle East, Mumbai", "lat": 19.0980, "lng": 72.8530,
             "rooms": [("Deluxe Luxe Room", 4200)]},
            # 8. Budget Standard Only
            {"name": "Treebo Trend Residency Andheri", "address": "Andheri West, Mumbai", "lat": 19.1200, "lng": 72.8360,
             "rooms": [("Standard Room", 2200)]},
            # 9. Deluxe Only (Budget)
            {"name": "FabHotel Bandra Park", "address": "Bandra West, Mumbai", "lat": 19.0600, "lng": 72.8330,
             "rooms": [("Deluxe Saver", 1850), ("Deluxe Executive", 2400)]},
            # 10. Cheap Budget Only
            {"name": "OYO 8841 Hotel Airport Metro", "address": "Saki Naka, Andheri East, Mumbai", "lat": 19.1040, "lng": 72.8840,
             "rooms": [("Economy Room", 990)]}
        ],

        "Bengaluru": [
            # 1. Ultra Luxury Only
            {"name": "The Leela Palace Bengaluru", "address": "HAL Old Airport Road, Kodihalli, Bengaluru", "lat": 12.9606, "lng": 77.6484,
             "rooms": [("Ultra Royal Premier", 28000), ("Maharaja Presidential Villa", 60000)]},
            # 2. Mixed Luxury
            {"name": "Taj West End", "address": "Race Course Road, High Grounds, Bengaluru", "lat": 12.9840, "lng": 77.5830,
             "rooms": [("Deluxe Luxury Room", 12800), ("Deluxe Garden Suite", 18500), ("Ultra Heritage Villa", 32000)]},
            # 3. Deluxe Only
            {"name": "The Ritz-Carlton Bangalore", "address": "Residency Road, Bengaluru", "lat": 12.9670, "lng": 77.6010,
             "rooms": [("Deluxe King", 13500), ("Deluxe Club", 16800)]},
            # 4. Mixed Medium
            {"name": "ITC Gardenia", "address": "Residency Road, Bengaluru", "lat": 12.9660, "lng": 77.5960,
             "rooms": [("Executive Club", 8900), ("Deluxe Towers Room", 11500), ("Ultra Garden Suite", 18500)]},
            # 5. Deluxe Only
            {"name": "Radisson Blu Outer Ring Road", "address": "Marathahalli, Bengaluru", "lat": 12.9430, "lng": 77.6960,
             "rooms": [("Deluxe Superior", 5800), ("Deluxe Business Class", 7400)]},
            # 6. Mixed Medium
            {"name": "Lemon Tree Premier Ulsoor Lake", "address": "St. John Road, Bengaluru", "lat": 12.9830, "lng": 77.6180,
             "rooms": [("Standard Room", 4200), ("Deluxe Room", 5600)]},
            # 7. Deluxe Only
            {"name": "ibis Bengaluru MG Road", "address": "MG Road, Bengaluru", "lat": 12.9720, "lng": 77.6080,
             "rooms": [("Deluxe Queen", 3800), ("Deluxe Twin", 4500)]},
            # 8. Budget Standard Only
            {"name": "Treebo Trend Indiranagar", "address": "100 Feet Road, Indiranagar, Bengaluru", "lat": 12.9780, "lng": 77.6400,
             "rooms": [("Standard Room", 1950)]},
            # 9. Deluxe Only (Budget)
            {"name": "FabHotel Majestic Inn", "address": "Majestic Area, Bengaluru", "lat": 12.9760, "lng": 77.5720,
             "rooms": [("Deluxe Saver", 1400), ("Deluxe Executive", 1900)]},
            # 10. Cheap Budget Only
            {"name": "OYO 10543 Hotel Koramangala", "address": "5th Block, Koramangala, Bengaluru", "lat": 12.9340, "lng": 77.6220,
             "rooms": [("Economy Room", 920)]}
        ]
    }

    hotel_count = 0
    room_count = 0

    hotel_id_counter = 1
    for city, hotels_list in cities_data.items():
        for h in hotels_list:
            email = f"hotel{hotel_id_counter}@{city.lower().replace(' ', '')}.com"
            c.execute("""INSERT INTO hotels (id, name, location, address, latitude, longitude, email, password_hash, status, photos)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'APPROVED', ?)""",
                      (hotel_id_counter, h["name"], city, h["address"], h["lat"], h["lng"], email, hotel_pw,
                       '["https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80"]'))
            
            for r_type, price in h["rooms"]:
                c.execute("""INSERT INTO rooms (hotel_id, room_type, price_per_night, quantity, max_guests, bed_type, room_size, breakfast_included)
                             VALUES (?, ?, ?, 5, 2, 'King Bed', '350 sq.ft', 'Included')""",
                          (hotel_id_counter, r_type, price))
                room_count += 1
            
            # Seed wallet
            c.execute("INSERT INTO wallets (hotel_id, balance) VALUES (?, 100)", (hotel_id_counter,))
            hotel_id_counter += 1
            hotel_count += 1

    conn.commit()
    conn.close()
    print(f"Successfully configured 50 hotels ({hotel_count} hotels across 5 cities) with Deluxe-only, Ultra Luxury-only, Mixed, and Budget tiers!")

if __name__ == '__main__':
    seed_customized_10_hotels_per_city()
