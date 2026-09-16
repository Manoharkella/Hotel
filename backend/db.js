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
      `);
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
