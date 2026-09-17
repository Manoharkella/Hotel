const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString,
  ssl: connectionString && connectionString.includes('neon.tech') 
    ? { rejectUnauthorized: false } 
    : false
});

// Helper for single queries
const query = (text, params) => pool.query(text, params);

// Database Auto-Initialization: Ensure tables exist
const initDb = async () => {
  try {
    const client = await pool.connect();
    try {
      console.log('Connected to PostgreSQL database successfully.');
      
      // Ensure all required tables and constraints are present
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          full_name VARCHAR,
          email VARCHAR UNIQUE,
          password_hash VARCHAR,
          role VARCHAR DEFAULT 'customer',
          status VARCHAR DEFAULT 'ACTIVE',
          phone VARCHAR DEFAULT '',
          city VARCHAR DEFAULT '',
          preferences JSONB DEFAULT '{}'::jsonb,
          loyalty_points INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS hotels (
          id SERIAL PRIMARY KEY,
          name VARCHAR,
          location VARCHAR,
          address VARCHAR DEFAULT '',
          city VARCHAR DEFAULT '',
          state VARCHAR DEFAULT '',
          country VARCHAR DEFAULT 'India',
          pincode VARCHAR DEFAULT '',
          contact_number VARCHAR DEFAULT '',
          website VARCHAR DEFAULT '',
          description VARCHAR DEFAULT '',
          property_type VARCHAR DEFAULT 'Hotel',
          star_rating VARCHAR DEFAULT '4',
          total_rooms INTEGER DEFAULT 10,
          latitude DOUBLE PRECISION,
          longitude DOUBLE PRECISION,
          email VARCHAR UNIQUE,
          password_hash VARCHAR,
          status VARCHAR DEFAULT 'PENDING',
          rejection_reason VARCHAR DEFAULT '',
          manager_name VARCHAR DEFAULT '',
          manager_phone VARCHAR DEFAULT '',
          manager_id INTEGER,
          amenities JSONB DEFAULT '[]'::jsonb,
          policies JSONB DEFAULT '{}'::jsonb,
          documents JSONB DEFAULT '[]'::jsonb,
          photos JSONB DEFAULT '[]'::jsonb,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS rooms (
          id SERIAL PRIMARY KEY,
          hotel_id INTEGER REFERENCES hotels(id) ON DELETE CASCADE,
          room_type VARCHAR,
          quantity INTEGER DEFAULT 5,
          price_per_night INTEGER,
          description VARCHAR,
          max_guests INTEGER DEFAULT 2,
          max_adults INTEGER DEFAULT 2,
          max_children INTEGER DEFAULT 1,
          bed_type VARCHAR DEFAULT 'King Bed',
          room_size VARCHAR DEFAULT '350 sq.ft',
          bathroom_type VARCHAR DEFAULT 'Private Ensuite',
          amenities JSONB DEFAULT '["Free Wi-Fi", "Breakfast Included", "AC"]'::jsonb,
          breakfast_included VARCHAR DEFAULT 'Included',
          cancellation_policy VARCHAR DEFAULT 'Free cancellation up to 24 hours before check-in',
          images JSONB DEFAULT '[]'::jsonb,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS wallets (
          id SERIAL PRIMARY KEY,
          hotel_id INTEGER UNIQUE REFERENCES hotels(id) ON DELETE CASCADE,
          balance INTEGER DEFAULT 100 CHECK (balance >= 0),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS wallet_transactions (
          id SERIAL PRIMARY KEY,
          hotel_id INTEGER REFERENCES hotels(id) ON DELETE CASCADE,
          amount INTEGER,
          description VARCHAR,
          transaction_type VARCHAR DEFAULT 'GENERAL',
          created_at VARCHAR
        );

        CREATE TABLE IF NOT EXISTS leads (
          id SERIAL PRIMARY KEY,
          customer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          destination VARCHAR,
          check_in VARCHAR,
          check_out VARCHAR,
          guests INTEGER,
          room_type VARCHAR,
          budget INTEGER,
          purpose VARCHAR,
          preferences VARCHAR,
          status VARCHAR DEFAULT 'active',
          matched_hotel_ids JSONB DEFAULT '[]'::jsonb,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS lead_unlocks (
          id SERIAL PRIMARY KEY,
          lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
          hotel_id INTEGER REFERENCES hotels(id) ON DELETE CASCADE,
          credits_spent INTEGER,
          unlocked_at VARCHAR
        );

        CREATE TABLE IF NOT EXISTS quotes (
          id SERIAL PRIMARY KEY,
          lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
          hotel_id INTEGER REFERENCES hotels(id) ON DELETE CASCADE,
          price INTEGER,
          message VARCHAR,
          status VARCHAR DEFAULT 'sent',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS bookings (
          id SERIAL PRIMARY KEY,
          lead_id INTEGER REFERENCES leads(id) ON DELETE SET NULL,
          customer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          hotel_id INTEGER REFERENCES hotels(id) ON DELETE CASCADE,
          room_id INTEGER REFERENCES rooms(id) ON DELETE SET NULL,
          check_in VARCHAR,
          check_out VARCHAR,
          guests INTEGER DEFAULT 1,
          total_price INTEGER,
          commission_amount INTEGER DEFAULT 0,
          payout_amount INTEGER DEFAULT 0,
          payment_status VARCHAR DEFAULT 'PAID',
          status VARCHAR DEFAULT 'confirmed',
          qr_code VARCHAR,
          created_at VARCHAR,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS messages (
          id SERIAL PRIMARY KEY,
          lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
          hotel_id INTEGER REFERENCES hotels(id) ON DELETE CASCADE,
          sender VARCHAR,
          text VARCHAR,
          created_at VARCHAR
        );

        CREATE TABLE IF NOT EXISTS reviews (
          id SERIAL PRIMARY KEY,
          booking_id INTEGER UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
          hotel_id INTEGER REFERENCES hotels(id) ON DELETE CASCADE,
          customer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          rating INTEGER CHECK (rating >= 1 AND rating <= 5),
          comment VARCHAR DEFAULT '',
          created_at VARCHAR
        );

        CREATE TABLE IF NOT EXISTS otp_verifications (
          id SERIAL PRIMARY KEY,
          identifier VARCHAR,
          otp_code VARCHAR,
          purpose VARCHAR DEFAULT 'registration',
          is_verified INTEGER DEFAULT 0,
          expires_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS wishlists (
          id SERIAL PRIMARY KEY,
          customer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          hotel_id INTEGER REFERENCES hotels(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT uq_customer_hotel_wishlist UNIQUE (customer_id, hotel_id)
        );

        CREATE TABLE IF NOT EXISTS tourist_spots (
          id SERIAL PRIMARY KEY,
          name VARCHAR NOT NULL,
          description TEXT,
          category VARCHAR NOT NULL DEFAULT 'Historical',
          latitude DOUBLE PRECISION NOT NULL,
          longitude DOUBLE PRECISION NOT NULL,
          address VARCHAR DEFAULT '',
          city VARCHAR DEFAULT '',
          image_url VARCHAR DEFAULT '',
          rating DOUBLE PRECISION DEFAULT 4.5,
          review_count INTEGER DEFAULT 120,
          opening_hours VARCHAR DEFAULT '09:00 AM',
          closing_hours VARCHAR DEFAULT '06:00 PM',
          entry_fee VARCHAR DEFAULT 'Free Entry',
          best_time_to_visit VARCHAR DEFAULT 'Morning / Evening',
          estimated_duration VARCHAR DEFAULT '1-2 hours',
          is_active BOOLEAN DEFAULT true,
          source VARCHAR DEFAULT 'system',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Seed initial tourist spots if table is empty
      const spotsCountRes = await client.query('SELECT COUNT(*) FROM tourist_spots');
      const spotCount = parseInt(spotsCountRes.rows[0].count, 10);
      if (spotCount === 0) {
        console.log('Seeding initial curated tourist spots...');
        const seedSpots = [
          // Hyderabad
          {
            name: "Charminar",
            description: "An iconic 16th-century mosque with four grand arches and minarets located in the heart of old Hyderabad, surrounded by vibrant bazaars.",
            category: "Historical",
            latitude: 17.3616,
            longitude: 78.4747,
            address: "Char Kaman, Ghansi Bazaar, Hyderabad",
            city: "Hyderabad",
            image_url: "https://images.unsplash.com/photo-1572445271230-a78b5944a659?w=800&auto=format&fit=crop&q=80",
            rating: 4.7,
            review_count: 14200,
            opening_hours: "09:00 AM",
            closing_hours: "05:30 PM",
            entry_fee: "₹25 / person",
            best_time_to_visit: "Evening (4:00 PM - 6:30 PM)",
            estimated_duration: "1 - 1.5 hours"
          },
          {
            name: "Golconda Fort",
            description: "Magnificent fortress complex famous for acoustic wonders, majestic royal palaces, and historic sound-and-light evening shows.",
            category: "Historical",
            latitude: 17.3833,
            longitude: 78.4011,
            address: "Ibrahim Bagh, Hyderabad",
            city: "Hyderabad",
            image_url: "https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=800&auto=format&fit=crop&q=80",
            rating: 4.6,
            review_count: 9800,
            opening_hours: "09:00 AM",
            closing_hours: "05:30 PM",
            entry_fee: "₹25 / person",
            best_time_to_visit: "Late Afternoon & Sound/Light Show",
            estimated_duration: "2 - 3 hours"
          },
          {
            name: "Hussain Sagar & Buddha Statue",
            description: "A serene heart-shaped lake featuring the world's tallest monolithic Buddha statue, evening boat rides, and lush shoreline parks.",
            category: "Nature",
            latitude: 17.4239,
            longitude: 78.4738,
            address: "Tank Bund Road, Hyderabad",
            city: "Hyderabad",
            image_url: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&auto=format&fit=crop&q=80",
            rating: 4.5,
            review_count: 11400,
            opening_hours: "08:00 AM",
            closing_hours: "10:00 PM",
            entry_fee: "Free (Boat Ride ₹75)",
            best_time_to_visit: "Sunset (5:30 PM - 8:00 PM)",
            estimated_duration: "1.5 - 2 hours"
          },
          {
            name: "Salar Jung Museum",
            description: "One of India's premier national museums housing an extraordinary royal collection of art, rare manuscripts, and the famous Veiled Rebecca.",
            category: "Museum",
            latitude: 17.3713,
            longitude: 78.4804,
            address: "Darusshifa, Hyderabad",
            city: "Hyderabad",
            image_url: "https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?w=800&auto=format&fit=crop&q=80",
            rating: 4.8,
            review_count: 8900,
            opening_hours: "10:00 AM",
            closing_hours: "05:00 PM",
            entry_fee: "₹50 / person",
            best_time_to_visit: "Morning (10:30 AM - 1:00 PM)",
            estimated_duration: "2 - 3 hours"
          },
          {
            name: "Ramoji Film City",
            description: "The world's largest integrated film studio and theme park with movie sets, thrilling rides, live stunt shows, and grand gardens.",
            category: "Entertainment",
            latitude: 17.2543,
            longitude: 78.6808,
            address: "Ramoji Film City Main Road, Anaspur, Hyderabad",
            city: "Hyderabad",
            image_url: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800&auto=format&fit=crop&q=80",
            rating: 4.6,
            review_count: 18500,
            opening_hours: "09:00 AM",
            closing_hours: "06:00 PM",
            entry_fee: "₹1,350 / adult",
            best_time_to_visit: "Full Day Trip",
            estimated_duration: "5 - 7 hours"
          },
          {
            name: "Birla Mandir Hyderabad",
            description: "Breathtaking Hindu temple constructed purely from 2,000 tonnes of pure white Rajasthani marble atop a 280-foot high hillock.",
            category: "Religious",
            latitude: 17.4062,
            longitude: 78.4691,
            address: "Hill Fort Road, Ambedkar Colony, Khairatabad, Hyderabad",
            city: "Hyderabad",
            image_url: "https://images.unsplash.com/photo-1548013146-72479768bada?w=800&auto=format&fit=crop&q=80",
            rating: 4.8,
            review_count: 7600,
            opening_hours: "07:00 AM",
            closing_hours: "09:00 PM",
            entry_fee: "Free Entry",
            best_time_to_visit: "Morning or Evening Aarti",
            estimated_duration: "1 hour"
          },
          {
            name: "Durgam Cheruvu & Inorbit Mall",
            description: "Scenic freshwater lake with a stunning illuminated cable-stayed suspension bridge, boat club, and premier shopping & dining complex.",
            category: "Shopping",
            latitude: 17.4338,
            longitude: 78.3871,
            address: "Madhapur, HITEC City, Hyderabad",
            city: "Hyderabad",
            image_url: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800&auto=format&fit=crop&q=80",
            rating: 4.6,
            review_count: 12000,
            opening_hours: "10:30 AM",
            closing_hours: "10:30 PM",
            entry_fee: "Free Entry",
            best_time_to_visit: "Evening & Night",
            estimated_duration: "2 - 3 hours"
          },
          {
            name: "Nehru Zoological Park",
            description: "Sprawling 380-acre wildlife sanctuary featuring lion safaris, white tigers, nocturnal animal houses, and toy train rides for families.",
            category: "Family / Kids",
            latitude: 17.3507,
            longitude: 78.4518,
            address: "Bahadurpura, Hyderabad",
            city: "Hyderabad",
            image_url: "https://images.unsplash.com/photo-1534567153574-2b12153a87f0?w=800&auto=format&fit=crop&q=80",
            rating: 4.5,
            review_count: 13200,
            opening_hours: "08:30 AM",
            closing_hours: "05:00 PM",
            entry_fee: "₹60 / adult, ₹30 / child",
            best_time_to_visit: "Morning (9:00 AM - 1:00 PM)",
            estimated_duration: "3 - 4 hours"
          },

          // Visakhapatnam (Vizag)
          {
            name: "INS Kursura Submarine Museum",
            description: "A real decommissioned Soviet-built submarine turned museum right on the sands of RK Beach, showcasing naval warfare history.",
            category: "Museum",
            latitude: 17.7163,
            longitude: 83.3328,
            address: "RK Beach Road, Visakhapatnam",
            city: "Visakhapatnam",
            image_url: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop&q=80",
            rating: 4.7,
            review_count: 16500,
            opening_hours: "02:00 PM",
            closing_hours: "08:30 PM",
            entry_fee: "₹70 / adult, ₹40 / child",
            best_time_to_visit: "Late Afternoon (3:30 PM - 6:00 PM)",
            estimated_duration: "1 hour"
          },
          {
            name: "Rushikonda Beach & Water Sports",
            description: "Golden sand beach awarded the Blue Flag eco-label, renowned for water skiing, windsurfing, speed boating, and pristine waters.",
            category: "Beach",
            latitude: 17.7836,
            longitude: 83.3856,
            address: "Rushikonda, Bheemili Road, Visakhapatnam",
            city: "Visakhapatnam",
            image_url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80",
            rating: 4.8,
            review_count: 14800,
            opening_hours: "06:00 AM",
            closing_hours: "07:00 PM",
            entry_fee: "Free Entry",
            best_time_to_visit: "Morning & Sunset",
            estimated_duration: "2 - 3 hours"
          },
          {
            name: "Kailasagiri Hilltop Park & Ropeway",
            description: "Picturesque hill park overlooking the turquoise Bay of Bengal with giant Shiva-Parvathi statues, cable car ropeway, and toy train.",
            category: "Family / Kids",
            latitude: 17.7491,
            longitude: 83.3422,
            address: "Hill Top Road, Kailasagiri, Visakhapatnam",
            city: "Visakhapatnam",
            image_url: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&auto=format&fit=crop&q=80",
            rating: 4.6,
            review_count: 11200,
            opening_hours: "06:00 AM",
            closing_hours: "08:30 PM",
            entry_fee: "₹20 / person (Ropeway ₹100)",
            best_time_to_visit: "4:00 PM - 7:00 PM",
            estimated_duration: "2 hours"
          },
          {
            name: "Simhachalam Temple",
            description: "Ancient 11th-century hill shrine dedicated to Lord Narasimha, featuring ornate Kalinga architectural carvings and sacred traditions.",
            category: "Religious",
            latitude: 17.7667,
            longitude: 83.2500,
            address: "Simhachalam, Visakhapatnam",
            city: "Visakhapatnam",
            image_url: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800&auto=format&fit=crop&q=80",
            rating: 4.8,
            review_count: 9400,
            opening_hours: "07:00 AM",
            closing_hours: "09:00 PM",
            entry_fee: "Free / ₹100 Special Darshan",
            best_time_to_visit: "Early Morning (7:00 AM - 10:00 AM)",
            estimated_duration: "1.5 - 2 hours"
          },
          {
            name: "Yarada Beach & Dolphin's Nose Lighthouse",
            description: "Secluded pristine beach flanked by lush green hills on three sides and a historic 358m cliff lighthouse overlooking Vizag harbor.",
            category: "Adventure",
            latitude: 17.6534,
            longitude: 83.2690,
            address: "Yarada, Visakhapatnam",
            city: "Visakhapatnam",
            image_url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80",
            rating: 4.7,
            review_count: 7300,
            opening_hours: "06:00 AM",
            closing_hours: "06:00 PM",
            entry_fee: "₹30 / person",
            best_time_to_visit: "Morning (8:00 AM - 11:30 AM)",
            estimated_duration: "2.5 - 3 hours"
          },

          // Mumbai
          {
            name: "Gateway of India",
            description: "Majestic 20th-century arch monument overlooking the Arabian Sea, the iconic symbol of Mumbai opposite the historic Taj Mahal Palace.",
            category: "Historical",
            latitude: 18.9220,
            longitude: 72.8347,
            address: "Apollo Bandar, Colaba, Mumbai",
            city: "Mumbai",
            image_url: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800&auto=format&fit=crop&q=80",
            rating: 4.8,
            review_count: 24000,
            opening_hours: "24 Hours Open",
            closing_hours: "24 Hours Open",
            entry_fee: "Free Entry",
            best_time_to_visit: "Early Morning or Sunset",
            estimated_duration: "1 - 1.5 hours"
          },
          {
            name: "Marine Drive & Queen's Necklace",
            description: "A 3.6-kilometre-long arc-shaped boulevard along South Mumbai coastline with sweeping Arabian sea views and golden sunset breeze.",
            category: "Nature",
            latitude: 18.9432,
            longitude: 72.8230,
            address: "Netaji Subhash Chandra Bose Road, Mumbai",
            city: "Mumbai",
            image_url: "https://images.unsplash.com/photo-1567157577867-05ccb1388e66?w=800&auto=format&fit=crop&q=80",
            rating: 4.9,
            review_count: 32000,
            opening_hours: "24 Hours Open",
            closing_hours: "24 Hours Open",
            entry_fee: "Free Entry",
            best_time_to_visit: "Sunset to Late Night (5:30 PM - 11:00 PM)",
            estimated_duration: "1.5 - 2 hours"
          },
          {
            name: "Elephanta Caves",
            description: "UNESCO World Heritage rock-cut cave temples dedicated to Lord Shiva dating back to the 5th century, accessible via ferry from Colaba.",
            category: "Adventure",
            latitude: 18.9633,
            longitude: 72.9315,
            address: "Elephanta Island, Gharapuri, Mumbai Harbour",
            city: "Mumbai",
            image_url: "https://images.unsplash.com/photo-1608958435020-e8a7109ba809?w=800&auto=format&fit=crop&q=80",
            rating: 4.6,
            review_count: 8900,
            opening_hours: "09:00 AM",
            closing_hours: "05:30 PM",
            entry_fee: "₹40 (Ferry ₹260 return)",
            best_time_to_visit: "Morning (9:30 AM ferry)",
            estimated_duration: "4 - 5 hours"
          },
          {
            name: "Siddhivinayak Temple",
            description: "Celebrated 19th-century Hindu temple dedicated to Lord Ganesha, attracting devotees and celebrities from across the globe.",
            category: "Religious",
            latitude: 19.0169,
            longitude: 72.8304,
            address: "SK Bole Marg, Prabhadevi, Mumbai",
            city: "Mumbai",
            image_url: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80",
            rating: 4.8,
            review_count: 19500,
            opening_hours: "05:30 AM",
            closing_hours: "09:45 PM",
            entry_fee: "Free Entry",
            best_time_to_visit: "Early Morning (6:00 AM - 8:30 AM)",
            estimated_duration: "1 - 1.5 hours"
          },
          {
            name: "High Street Phoenix & Palladium",
            description: "Mumbai's luxury lifestyle and entertainment destination with designer flagship stores, fine dining restaurants, and cinema halls.",
            category: "Shopping",
            latitude: 18.9950,
            longitude: 72.8247,
            address: "Senapati Bapat Marg, Lower Parel, Mumbai",
            city: "Mumbai",
            image_url: "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=800&auto=format&fit=crop&q=80",
            rating: 4.7,
            review_count: 15400,
            opening_hours: "11:00 AM",
            closing_hours: "10:30 PM",
            entry_fee: "Free Entry",
            best_time_to_visit: "Afternoon & Evening",
            estimated_duration: "2 - 3 hours"
          },

          // Chennai
          {
            name: "Marina Beach & Lighthouse",
            description: "The world's second-longest natural urban beach extending over 13 km along the Coromandel coast with iconic statues and fresh seafood stalls.",
            category: "Beach",
            latitude: 13.0499,
            longitude: 80.2824,
            address: "Kamarajar Salai, Triplicane, Chennai",
            city: "Chennai",
            image_url: "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=800&auto=format&fit=crop&q=80",
            rating: 4.6,
            review_count: 21000,
            opening_hours: "24 Hours Open",
            closing_hours: "24 Hours Open",
            entry_fee: "Free (Lighthouse ₹20)",
            best_time_to_visit: "Sunrise & Evening (5:00 PM - 8:00 PM)",
            estimated_duration: "2 hours"
          },
          {
            name: "Kapaleeshwarar Temple",
            description: "Splendid 7th-century Dravidian architectural masterpiece dedicated to Lord Shiva with an intricately sculpted 37-meter rainbow gopuram.",
            category: "Religious",
            latitude: 13.0336,
            longitude: 80.2699,
            address: "Vadakku Maada Veethi, Mylapore, Chennai",
            city: "Chennai",
            image_url: "https://images.unsplash.com/photo-1609766857041-ed402ea8069a?w=800&auto=format&fit=crop&q=80",
            rating: 4.9,
            review_count: 14200,
            opening_hours: "06:00 AM",
            closing_hours: "09:00 PM",
            entry_fee: "Free Entry",
            best_time_to_visit: "Morning (7:00 AM - 9:30 AM)",
            estimated_duration: "1.5 hours"
          },
          {
            name: "Guindy National Park & Children's Park",
            description: "Rare protected urban national park with spotted deer, blackbucks, birds, and an adjacent snake and reptile rescue park.",
            category: "Family / Kids",
            latitude: 13.0067,
            longitude: 80.2206,
            address: "Rangeguindy, Guindy, Chennai",
            city: "Chennai",
            image_url: "https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=800&auto=format&fit=crop&q=80",
            rating: 4.5,
            review_count: 8700,
            opening_hours: "09:00 AM",
            closing_hours: "05:30 PM",
            entry_fee: "₹30 / adult, ₹10 / child",
            best_time_to_visit: "Morning (9:30 AM - 12:30 PM)",
            estimated_duration: "2 - 3 hours"
          },

          // Bangalore
          {
            name: "Lalbagh Botanical Garden & Glass House",
            description: "Sprawling 240-acre botanical haven dating to Hyder Ali, featuring over 1,800 exotic plant species, a 3,000-million-year-old rock, and Victorian glass house.",
            category: "Nature",
            latitude: 12.9507,
            longitude: 77.5848,
            address: "Mavalli, Bengaluru",
            city: "Bangalore",
            image_url: "https://images.unsplash.com/photo-1588714477688-cf28a50e94f7?w=800&auto=format&fit=crop&q=80",
            rating: 4.7,
            review_count: 19800,
            opening_hours: "06:00 AM",
            closing_hours: "07:00 PM",
            entry_fee: "₹25 / person",
            best_time_to_visit: "Early Morning (6:30 AM - 9:30 AM)",
            estimated_duration: "2 - 3 hours"
          },
          {
            name: "Bangalore Palace",
            description: "Tudor-style royal castle reminiscent of Windsor Castle, adorned with fortified towers, stained-glass windows, and royal artifacts.",
            category: "Historical",
            latitude: 12.9988,
            longitude: 77.5921,
            address: "Vasanth Nagar, Bengaluru",
            city: "Bangalore",
            image_url: "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=800&auto=format&fit=crop&q=80",
            rating: 4.6,
            review_count: 13500,
            opening_hours: "10:00 AM",
            closing_hours: "05:30 PM",
            entry_fee: "₹250 / Indian, ₹500 / Foreigner",
            best_time_to_visit: "10:30 AM - 2:00 PM",
            estimated_duration: "1.5 - 2 hours"
          },
          {
            name: "Wonderla Amusement Park Bangalore",
            description: "India's premier high-tech theme park featuring 60+ thrill rides, massive wave pools, water coasters, and family adventure attractions.",
            category: "Entertainment",
            latitude: 12.8343,
            longitude: 77.4010,
            address: "28th k.m., Mysore Road, Bengaluru",
            city: "Bangalore",
            image_url: "https://images.unsplash.com/photo-1513889961551-628c1e5e2ee9?w=800&auto=format&fit=crop&q=80",
            rating: 4.8,
            review_count: 27000,
            opening_hours: "11:00 AM",
            closing_hours: "06:00 PM",
            entry_fee: "₹1,450 / adult",
            best_time_to_visit: "Full Day Adventure",
            estimated_duration: "6 - 7 hours"
          },

          // Goa
          {
            name: "Aguada Fort & Lighthouse",
            description: "Well-preserved 17th-century Portuguese coastal fort standing grandly on Sinquerim Beach offering 360-degree Arabian Sea panoramas.",
            category: "Historical",
            latitude: 15.4920,
            longitude: 73.7737,
            address: "Fort Aguada Road, Candolim, Goa",
            city: "Goa",
            image_url: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&auto=format&fit=crop&q=80",
            rating: 4.7,
            review_count: 17400,
            opening_hours: "09:30 AM",
            closing_hours: "06:00 PM",
            entry_fee: "₹25 / person",
            best_time_to_visit: "Sunset (4:30 PM - 6:30 PM)",
            estimated_duration: "1.5 - 2 hours"
          },
          {
            name: "Baga Beach Watersports & Shacks",
            description: "Lively North Goa beach famous for parasailing, jet skis, dolphin spotting, beach shacks with live music, and evening nightlife.",
            category: "Beach",
            latitude: 15.5553,
            longitude: 73.7517,
            address: "Baga Beach, Calangute, Goa",
            city: "Goa",
            image_url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80",
            rating: 4.7,
            review_count: 26000,
            opening_hours: "24 Hours Open",
            closing_hours: "24 Hours Open",
            entry_fee: "Free Entry",
            best_time_to_visit: "Afternoon watersports & Evening nightlife",
            estimated_duration: "3 - 4 hours"
          },
          {
            name: "Basilica of Bom Jesus",
            description: "UNESCO World Heritage baroque Catholic basilica holding the sacred mortal remains of St. Francis Xavier in Old Goa.",
            category: "Religious",
            latitude: 15.5009,
            longitude: 73.9116,
            address: "Old Goa Road, Bainguinim, Goa",
            city: "Goa",
            image_url: "https://images.unsplash.com/photo-1548013146-72479768bada?w=800&auto=format&fit=crop&q=80",
            rating: 4.8,
            review_count: 12800,
            opening_hours: "09:00 AM",
            closing_hours: "06:30 PM",
            entry_fee: "Free Entry",
            best_time_to_visit: "Morning (9:30 AM - 12:00 PM)",
            estimated_duration: "1 hour"
          }
        ];

        for (const spot of seedSpots) {
          await client.query(
            `INSERT INTO tourist_spots (
              name, description, category, latitude, longitude, address, city,
              image_url, rating, review_count, opening_hours, closing_hours,
              entry_fee, best_time_to_visit, estimated_duration, is_active, source
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, true, 'system')`,
            [
              spot.name, spot.description, spot.category, spot.latitude, spot.longitude,
              spot.address, spot.city, spot.image_url, spot.rating, spot.review_count,
              spot.opening_hours, spot.closing_hours, spot.entry_fee, spot.best_time_to_visit,
              spot.estimated_duration
            ]
          );
        }
        console.log(`Seeded ${seedSpots.length} curated tourist spots successfully.`);
      }

      console.log('Database tables verified and ready.');
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Database connection / init error:', err);
  }
};

module.exports = {
  pool,
  query,
  initDb
};
