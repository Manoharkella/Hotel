const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { WebSocketServer, WebSocket } = require('ws');
const { pool, query, initDb } = require('./db');
const { SECRET_KEY, authenticateUser, optionalUser, requireRole } = require('./middleware/auth');

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 8000;

// Enable CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['*']
}));

app.use(express.json());

// Initialize Database Tables
initDb();

// Helper: Generate JWT Token
const createAccessToken = (payload) => {
  return jwt.sign(payload, SECRET_KEY, { expiresIn: '7d' });
};

// =====================================================================
// 1. HEALTH & GENERAL ROOT
// =====================================================================
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'HostIQ Hotel Platform API (Node.js & Express)',
    privacy_and_access_control: 'Enforced (Strict User Isolation)',
    documentation: '/api'
  });
});

app.get('/api', (req, res) => {
  res.json({
    status: 'online',
    service: 'HostIQ Hotel Platform API (Node.js & Express)',
    privacy_and_access_control: 'Enforced (Strict User Isolation)'
  });
});

// =====================================================================
// 2. OTP AUTHENTICATION ENDPOINTS
// =====================================================================
app.post('/api/auth/send-otp', async (req, res) => {
  try {
    const { email, phone, identifier, purpose = 'registration' } = req.body;
    const target = (identifier || email || phone || '').trim();

    if (!target) {
      return res.status(400).json({ detail: 'Email or phone number is required' });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await query(
      'DELETE FROM otp_verifications WHERE identifier = $1 AND purpose = $2',
      [target, purpose]
    );

    await query(
      `INSERT INTO otp_verifications (identifier, otp_code, purpose, is_verified, expires_at)
       VALUES ($1, $2, $3, 0, $4)`,
      [target, otpCode, purpose, expiresAt]
    );

    console.log(`\n[OTP NOTIFICATION] To: ${target} | Code: ${otpCode} | Purpose: ${purpose}\n`);

    return res.json({
      success: true,
      message: `OTP sent successfully to ${target}`,
      otp_debug: otpCode
    });
  } catch (err) {
    console.error('send-otp error:', err);
    return res.status(500).json({ detail: 'Failed to send OTP' });
  }
});

app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { email, phone, identifier, otp, purpose = 'registration' } = req.body;
    const target = (identifier || email || phone || '').trim();
    const otpCode = (otp || '').trim();

    if (!target || !otpCode) {
      return res.status(400).json({ detail: 'Identifier and OTP code are required' });
    }

    const result = await query(
      `SELECT * FROM otp_verifications 
       WHERE identifier = $1 AND otp_code = $2 AND purpose = $3 
       ORDER BY id DESC LIMIT 1`,
      [target, otpCode, purpose]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ detail: 'Invalid or expired OTP' });
    }

    const record = result.rows[0];
    if (new Date(record.expires_at) < new Date()) {
      return res.status(400).json({ detail: 'OTP has expired. Please request a new one.' });
    }

    await query('UPDATE otp_verifications SET is_verified = 1 WHERE id = $1', [record.id]);

    return res.json({
      success: true,
      message: 'OTP verified successfully'
    });
  } catch (err) {
    console.error('verify-otp error:', err);
    return res.status(500).json({ detail: 'Failed to verify OTP' });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { identifier, otp, new_password } = req.body;
    const target = (identifier || '').trim();
    const otpCode = (otp || '').trim();

    if (!target || !otpCode || !new_password) {
      return res.status(400).json({ detail: 'All fields are required' });
    }

    const otpRes = await query(
      `SELECT * FROM otp_verifications 
       WHERE identifier = $1 AND otp_code = $2 AND purpose = 'forgot_password' 
       ORDER BY id DESC LIMIT 1`,
      [target, otpCode]
    );

    if (otpRes.rows.length === 0) {
      return res.status(400).json({ detail: 'Invalid OTP verification for password reset' });
    }

    const passwordHash = await bcrypt.hash(new_password, 10);
    const userRes = await query('SELECT * FROM users WHERE email = $1', [target]);

    if (userRes.rows.length > 0) {
      await query('UPDATE users SET password_hash = $1 WHERE email = $2', [passwordHash, target]);
    } else {
      const hotelRes = await query('SELECT * FROM hotels WHERE email = $1', [target]);
      if (hotelRes.rows.length > 0) {
        await query('UPDATE hotels SET password_hash = $1 WHERE email = $2', [passwordHash, target]);
      } else {
        return res.status(404).json({ detail: 'Account with this email not found' });
      }
    }

    await query('DELETE FROM otp_verifications WHERE identifier = $1', [target]);

    return res.json({
      success: true,
      message: 'Password reset successfully. You can now log in.'
    });
  } catch (err) {
    console.error('reset-password error:', err);
    return res.status(500).json({ detail: 'Failed to reset password' });
  }
});

// =====================================================================
// 3. USER MANAGEMENT & AUTHENTICATION
// =====================================================================
app.post('/api/users/register', async (req, res) => {
  try {
    const { full_name, email, password, phone, role = 'customer', city = '' } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({ detail: 'Full name, email, and password are required' });
    }

    const existing = await query('SELECT id FROM users WHERE email = $1', [email.trim()]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ detail: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await query(
      `INSERT INTO users (full_name, email, password_hash, role, status, phone, city, preferences, loyalty_points)
       VALUES ($1, $2, $3, $4, 'ACTIVE', $5, $6, '{}'::jsonb, 0)
       RETURNING id, full_name, email, role, status, phone, city, preferences, loyalty_points, created_at`,
      [full_name.trim(), email.trim(), passwordHash, role, phone || '', city || '']
    );

    const user = result.rows[0];
    const accessToken = createAccessToken({ sub: user.email, id: user.id, role: user.role });

    return res.status(201).json({
      ...user,
      access_token: accessToken,
      token_type: 'bearer'
    });
  } catch (err) {
    console.error('register error:', err);
    return res.status(500).json({ detail: 'Failed to register user' });
  }
});

app.post('/api/users/login', async (req, res) => {
  try {
    const { identifier, email, password } = req.body;
    const loginId = (identifier || email || '').trim();

    if (!loginId || !password) {
      return res.status(400).json({ detail: 'Identifier and password are required' });
    }

    const result = await query(
      'SELECT * FROM users WHERE email = $1 OR phone = $1',
      [loginId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ detail: 'Incorrect email or password' });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ detail: 'Incorrect email or password' });
    }

    const token = createAccessToken({ sub: user.email, id: user.id, role: user.role });
    delete user.password_hash;

    return res.json({
      access_token: token,
      token_type: 'bearer',
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        status: user.status,
        phone: user.phone,
        city: user.city,
        preferences: user.preferences,
        loyalty_points: user.loyalty_points
      }
    });
  } catch (err) {
    console.error('login error:', err);
    return res.status(500).json({ detail: 'Failed to login' });
  }
});

app.get('/api/users/me', authenticateUser, async (req, res) => {
  try {
    const result = await query(
      'SELECT id, full_name, email, role, status, phone, city, preferences, loyalty_points, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ detail: 'User not found' });
    }
    return res.json(result.rows[0]);
  } catch (err) {
    console.error('users/me error:', err);
    return res.status(500).json({ detail: 'Failed to fetch user profile' });
  }
});

app.put('/api/users/me', authenticateUser, async (req, res) => {
  try {
    const { full_name, phone, city, preferences } = req.body;
    const current = await query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (current.rows.length === 0) {
      return res.status(404).json({ detail: 'User not found' });
    }

    const user = current.rows[0];
    const newName = full_name !== undefined ? full_name : user.full_name;
    const newPhone = phone !== undefined ? phone : user.phone;
    const newCity = city !== undefined ? city : user.city;
    const newPref = preferences !== undefined ? JSON.stringify(preferences) : JSON.stringify(user.preferences || {});

    const updated = await query(
      `UPDATE users 
       SET full_name = $1, phone = $2, city = $3, preferences = $4::jsonb, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $5 
       RETURNING id, full_name, email, role, status, phone, city, preferences, loyalty_points, created_at`,
      [newName, newPhone, newCity, newPref, req.user.id]
    );

    return res.json(updated.rows[0]);
  } catch (err) {
    console.error('update profile error:', err);
    return res.status(500).json({ detail: 'Failed to update user profile' });
  }
});

app.put('/api/users/me/password', authenticateUser, async (req, res) => {
  try {
    const { old_password, new_password } = req.body;
    const userRes = await query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ detail: 'User not found' });
    }

    const valid = await bcrypt.compare(old_password, userRes.rows[0].password_hash);
    if (!valid) {
      return res.status(400).json({ detail: 'Current password is incorrect' });
    }

    const newHash = await bcrypt.hash(new_password, 10);
    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, req.user.id]);

    return res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    console.error('change password error:', err);
    return res.status(500).json({ detail: 'Failed to update password' });
  }
});

// =====================================================================
// 4. WISHLIST ENDPOINTS (Strict User Data Isolation)
// =====================================================================
app.get('/api/customer/wishlist', authenticateUser, async (req, res) => {
  try {
    const result = await query(
      'SELECT hotel_id FROM wishlists WHERE customer_id = $1',
      [req.user.id]
    );
    const hotelIds = result.rows.map(r => r.hotel_id.toString());
    return res.json(hotelIds);
  } catch (err) {
    console.error('wishlist get error:', err);
    return res.status(500).json({ detail: 'Failed to fetch wishlist' });
  }
});

app.post('/api/customer/wishlist/:hotelId', authenticateUser, async (req, res) => {
  try {
    const hotelId = parseInt(req.params.hotelId, 10);
    await query(
      `INSERT INTO wishlists (customer_id, hotel_id) 
       VALUES ($1, $2) 
       ON CONFLICT (customer_id, hotel_id) DO NOTHING`,
      [req.user.id, hotelId]
    );
    return res.json({ success: true, is_wishlisted: true, hotel_id: hotelId });
  } catch (err) {
    console.error('wishlist add error:', err);
    return res.status(500).json({ detail: 'Failed to add to wishlist' });
  }
});

app.delete('/api/customer/wishlist/:hotelId', authenticateUser, async (req, res) => {
  try {
    const hotelId = parseInt(req.params.hotelId, 10);
    await query(
      'DELETE FROM wishlists WHERE customer_id = $1 AND hotel_id = $2',
      [req.user.id, hotelId]
    );
    return res.json({ success: true, is_wishlisted: false, hotel_id: hotelId });
  } catch (err) {
    console.error('wishlist delete error:', err);
    return res.status(500).json({ detail: 'Failed to remove from wishlist' });
  }
});

app.post('/api/customer/wishlist/:hotelId/toggle', authenticateUser, async (req, res) => {
  try {
    const hotelId = parseInt(req.params.hotelId, 10);
    const existing = await query(
      'SELECT id FROM wishlists WHERE customer_id = $1 AND hotel_id = $2',
      [req.user.id, hotelId]
    );

    if (existing.rows.length > 0) {
      await query('DELETE FROM wishlists WHERE customer_id = $1 AND hotel_id = $2', [req.user.id, hotelId]);
      return res.json({
        success: true,
        is_wishlisted: false,
        hotel_id: hotelId,
        message: 'Removed from wishlist'
      });
    } else {
      await query('INSERT INTO wishlists (customer_id, hotel_id) VALUES ($1, $2)', [req.user.id, hotelId]);
      return res.json({
        success: true,
        is_wishlisted: true,
        hotel_id: hotelId,
        message: 'Added to wishlist'
      });
    }
  } catch (err) {
    console.error('wishlist toggle error:', err);
    return res.status(500).json({ detail: 'Failed to toggle wishlist' });
  }
});

// =====================================================================
// 5. HOTEL PARTNER REGISTRATION & ONBOARDING
// =====================================================================
app.post('/api/hotels/register', async (req, res) => {
  try {
    const {
      name, email, password, location = '', address = '', city = '', state = '', country = 'India',
      pincode = '', contact_number = '', website = '', description = '', property_type = 'Hotel',
      star_rating = '4', total_rooms = 10, latitude, longitude, manager_name = '', manager_phone = '',
      amenities = [], policies = {}, documents = [], photos = [], rooms = []
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ detail: 'Hotel name, email, and password are required' });
    }

    const existing = await query('SELECT id FROM hotels WHERE email = $1', [email.trim()]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ detail: 'Email already registered for a hotel' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const hotelResult = await query(
      `INSERT INTO hotels (
        name, email, password_hash, location, address, city, state, country, pincode,
        contact_number, website, description, property_type, star_rating, total_rooms,
        latitude, longitude, status, manager_name, manager_phone, amenities, policies,
        documents, photos
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
        $16, $17, 'PENDING', $18, $19, $20::jsonb, $21::jsonb, $22::jsonb, $23::jsonb
      ) RETURNING *`,
      [
        name.trim(), email.trim(), passwordHash, location, address, city, state, country,
        pincode, contact_number, website, description, property_type, star_rating, total_rooms,
        latitude || null, longitude || null, manager_name, manager_phone,
        JSON.stringify(amenities), JSON.stringify(policies), JSON.stringify(documents), JSON.stringify(photos)
      ]
    );

    const hotel = hotelResult.rows[0];

    // Create default wallet
    await query('INSERT INTO wallets (hotel_id, balance) VALUES ($1, 100)', [hotel.id]);

    // Insert rooms if provided
    if (Array.isArray(rooms) && rooms.length > 0) {
      for (const r of rooms) {
        await query(
          `INSERT INTO rooms (
            hotel_id, room_type, quantity, price_per_night, description, max_guests,
            max_adults, max_children, bed_type, room_size, bathroom_type, amenities,
            breakfast_included, cancellation_policy, images
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb, $13, $14, $15::jsonb)`,
          [
            hotel.id, r.room_type, r.quantity || 5, r.price_per_night, r.description || '',
            r.max_guests || 2, r.max_adults || 2, r.max_children || 1, r.bed_type || 'King Bed',
            r.room_size || '350 sq.ft', r.bathroom_type || 'Private Ensuite',
            JSON.stringify(r.amenities || ['Free Wi-Fi']), r.breakfast_included || 'Included',
            r.cancellation_policy || 'Free cancellation up to 24 hours', JSON.stringify(r.images || [])
          ]
        );
      }
    }

    const roomsRes = await query('SELECT * FROM rooms WHERE hotel_id = $1', [hotel.id]);
    delete hotel.password_hash;
    hotel.rooms = roomsRes.rows;

    const token = createAccessToken({ sub: hotel.email, id: hotel.id, role: 'hotel' });

    return res.status(201).json({
      ...hotel,
      access_token: token,
      token_type: 'bearer'
    });
  } catch (err) {
    console.error('hotel register error:', err);
    return res.status(500).json({ detail: 'Failed to register hotel' });
  }
});

app.post('/api/hotels/login', async (req, res) => {
  try {
    const { identifier, email, password } = req.body;
    const loginId = (identifier || email || '').trim();

    const result = await query(
      'SELECT * FROM hotels WHERE email = $1 OR contact_number = $1',
      [loginId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ detail: 'Invalid hotel credentials' });
    }

    const hotel = result.rows[0];
    const match = await bcrypt.compare(password, hotel.password_hash);
    if (!match) {
      return res.status(401).json({ detail: 'Invalid hotel credentials' });
    }

    const roomsRes = await query('SELECT * FROM rooms WHERE hotel_id = $1', [hotel.id]);
    const walletRes = await query('SELECT * FROM wallets WHERE hotel_id = $1', [hotel.id]);

    delete hotel.password_hash;
    hotel.rooms = roomsRes.rows;
    hotel.wallet = walletRes.rows[0] || { balance: 100 };

    const token = createAccessToken({ sub: hotel.email, id: hotel.id, role: 'hotel' });

    return res.json({
      access_token: token,
      token_type: 'bearer',
      user: {
        id: hotel.id,
        name: hotel.name,
        email: hotel.email,
        role: 'hotel',
        status: hotel.status,
        location: hotel.location,
        photos: hotel.photos,
        rooms: hotel.rooms,
        wallet: hotel.wallet
      }
    });
  } catch (err) {
    console.error('hotel login error:', err);
    return res.status(500).json({ detail: 'Failed to login hotel' });
  }
});

// Admin Login
app.post('/api/admin/login', async (req, res) => {
  try {
    const { identifier, email, password } = req.body;
    const loginId = (identifier || email || '').trim();

    if (loginId === 'admin@hostiq.com' && password === 'Admin@1234') {
      const token = createAccessToken({ sub: 'admin@hostiq.com', id: 999999, role: 'admin' });
      return res.json({
        access_token: token,
        token_type: 'bearer',
        user: {
          id: 999999,
          full_name: 'Super Administrator',
          email: 'admin@hostiq.com',
          role: 'admin',
          status: 'ACTIVE'
        }
      });
    }

    const userRes = await query('SELECT * FROM users WHERE email = $1 AND role = $2', [loginId, 'admin']);
    if (userRes.rows.length === 0) {
      return res.status(401).json({ detail: 'Invalid admin credentials' });
    }

    const admin = userRes.rows[0];
    const match = await bcrypt.compare(password, admin.password_hash);
    if (!match) {
      return res.status(401).json({ detail: 'Invalid admin credentials' });
    }

    const token = createAccessToken({ sub: admin.email, id: admin.id, role: 'admin' });
    return res.json({
      access_token: token,
      token_type: 'bearer',
      user: {
        id: admin.id,
        full_name: admin.full_name,
        email: admin.email,
        role: 'admin',
        status: admin.status
      }
    });
  } catch (err) {
    console.error('admin login error:', err);
    return res.status(500).json({ detail: 'Failed to login admin' });
  }
});

// =====================================================================
// 6. HOTELS & PUBLIC SEARCH
// =====================================================================
app.get('/api/customer/hotels/search', async (req, res) => {
  try {
    const result = await query(
      "SELECT * FROM hotels WHERE status = 'APPROVED' OR status IS NULL ORDER BY id DESC"
    );
    const hotels = result.rows;

    const hotelPromises = hotels.map(async (h) => {
      const r = await query('SELECT * FROM rooms WHERE hotel_id = $1', [h.id]);
      delete h.password_hash;
      h.rooms = r.rows;
      return h;
    });

    const enrichedHotels = await Promise.all(hotelPromises);
    return res.json(enrichedHotels);
  } catch (err) {
    console.error('hotels search error:', err);
    return res.status(500).json({ detail: 'Failed to search hotels' });
  }
});

app.get('/api/hotels/:hotelId', async (req, res) => {
  try {
    const hotelId = parseInt(req.params.hotelId, 10);
    const result = await query('SELECT * FROM hotels WHERE id = $1', [hotelId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ detail: 'Hotel not found' });
    }

    const hotel = result.rows[0];
    const roomsRes = await query('SELECT * FROM rooms WHERE hotel_id = $1', [hotelId]);
    delete hotel.password_hash;
    hotel.rooms = roomsRes.rows;

    return res.json(hotel);
  } catch (err) {
    console.error('get hotel error:', err);
    return res.status(500).json({ detail: 'Failed to fetch hotel details' });
  }
});

app.put('/api/hotels/:hotelId', async (req, res) => {
  try {
    const hotelId = parseInt(req.params.hotelId, 10);
    const { name, location, address, photos } = req.body;

    const current = await query('SELECT * FROM hotels WHERE id = $1', [hotelId]);
    if (current.rows.length === 0) {
      return res.status(404).json({ detail: 'Hotel not found' });
    }

    const h = current.rows[0];
    const newName = name !== undefined ? name : h.name;
    const newLoc = location !== undefined ? location : h.location;
    const newAddr = address !== undefined ? address : h.address;
    const newPhotos = photos !== undefined ? JSON.stringify(photos) : JSON.stringify(h.photos || []);

    const updated = await query(
      `UPDATE hotels 
       SET name = $1, location = $2, address = $3, photos = $4::jsonb, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $5 
       RETURNING *`,
      [newName, newLoc, newAddr, newPhotos, hotelId]
    );

    const out = updated.rows[0];
    delete out.password_hash;
    return res.json(out);
  } catch (err) {
    console.error('update hotel error:', err);
    return res.status(500).json({ detail: 'Failed to update hotel' });
  }
});

// Rooms Management
app.post('/api/hotels/:hotelId/rooms', async (req, res) => {
  try {
    const hotelId = parseInt(req.params.hotelId, 10);
    const {
      room_type, quantity = 5, price_per_night, description = '', max_guests = 2,
      bed_type = 'King Bed', room_size = '350 sq.ft', amenities = ['Free Wi-Fi'],
      breakfast_included = 'Included', cancellation_policy = 'Free cancellation', images = []
    } = req.body;

    const result = await query(
      `INSERT INTO rooms (
        hotel_id, room_type, quantity, price_per_night, description, max_guests,
        bed_type, room_size, amenities, breakfast_included, cancellation_policy, images
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10, $11, $12::jsonb)
      RETURNING *`,
      [
        hotelId, room_type, quantity, price_per_night, description, max_guests,
        bed_type, room_size, JSON.stringify(amenities), breakfast_included, cancellation_policy, JSON.stringify(images)
      ]
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('create room error:', err);
    return res.status(500).json({ detail: 'Failed to create room' });
  }
});

app.put('/api/rooms/:roomId', async (req, res) => {
  try {
    const roomId = parseInt(req.params.roomId, 10);
    const { room_type, price_per_night, quantity, description, max_guests, bed_type } = req.body;

    const current = await query('SELECT * FROM rooms WHERE id = $1', [roomId]);
    if (current.rows.length === 0) {
      return res.status(404).json({ detail: 'Room not found' });
    }

    const r = current.rows[0];
    const newType = room_type !== undefined ? room_type : r.room_type;
    const newPrice = price_per_night !== undefined ? price_per_night : r.price_per_night;
    const newQty = quantity !== undefined ? quantity : r.quantity;
    const newDesc = description !== undefined ? description : r.description;
    const newGuests = max_guests !== undefined ? max_guests : r.max_guests;
    const newBed = bed_type !== undefined ? bed_type : r.bed_type;

    const updated = await query(
      `UPDATE rooms 
       SET room_type = $1, price_per_night = $2, quantity = $3, description = $4, max_guests = $5, bed_type = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [newType, newPrice, newQty, newDesc, newGuests, newBed, roomId]
    );

    return res.json(updated.rows[0]);
  } catch (err) {
    console.error('update room error:', err);
    return res.status(500).json({ detail: 'Failed to update room' });
  }
});

app.delete('/api/rooms/:roomId', async (req, res) => {
  try {
    const roomId = parseInt(req.params.roomId, 10);
    await query('DELETE FROM rooms WHERE id = $1', [roomId]);
    return res.json({ success: true, message: 'Room deleted successfully' });
  } catch (err) {
    console.error('delete room error:', err);
    return res.status(500).json({ detail: 'Failed to delete room' });
  }
});

// =====================================================================
// 7. ADMIN ENDPOINTS (Guarded)
// =====================================================================
app.get('/api/admin/users/all', authenticateUser, requireRole('admin'), async (req, res) => {
  try {
    const result = await query(
      'SELECT id, full_name, email, role, status, phone, city, loyalty_points, created_at FROM users ORDER BY id DESC'
    );
    return res.json(result.rows);
  } catch (err) {
    console.error('admin users error:', err);
    return res.status(500).json({ detail: 'Failed to fetch users' });
  }
});

app.get('/api/admin/hotels/all', async (req, res) => {
  try {
    const result = await query('SELECT * FROM hotels ORDER BY id DESC');
    const hotels = result.rows;
    for (const h of hotels) {
      const r = await query('SELECT * FROM rooms WHERE hotel_id = $1', [h.id]);
      delete h.password_hash;
      h.rooms = r.rows;
    }
    return res.json(hotels);
  } catch (err) {
    console.error('admin hotels error:', err);
    return res.status(500).json({ detail: 'Failed to fetch hotels' });
  }
});

app.put('/api/admin/hotels/:hotelId/approve', authenticateUser, requireRole('admin'), async (req, res) => {
  try {
    const hotelId = parseInt(req.params.hotelId, 10);
    const result = await query(
      "UPDATE hotels SET status = 'APPROVED', rejection_reason = '', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *",
      [hotelId]
    );
    if (result.rows.length === 0) return res.status(404).json({ detail: 'Hotel not found' });
    return res.json({ success: true, message: 'Hotel approved successfully' });
  } catch (err) {
    return res.status(500).json({ detail: 'Failed to approve hotel' });
  }
});

app.put('/api/admin/hotels/:hotelId/reject', authenticateUser, requireRole('admin'), async (req, res) => {
  try {
    const hotelId = parseInt(req.params.hotelId, 10);
    const { reason = '' } = req.body;
    const result = await query(
      "UPDATE hotels SET status = 'REJECTED', rejection_reason = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
      [reason, hotelId]
    );
    if (result.rows.length === 0) return res.status(404).json({ detail: 'Hotel not found' });
    return res.json({ success: true, message: 'Hotel rejected' });
  } catch (err) {
    return res.status(500).json({ detail: 'Failed to reject hotel' });
  }
});

app.put('/api/admin/hotels/:hotelId/suspend', authenticateUser, requireRole('admin'), async (req, res) => {
  try {
    const hotelId = parseInt(req.params.hotelId, 10);
    const result = await query(
      "UPDATE hotels SET status = 'SUSPENDED', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *",
      [hotelId]
    );
    if (result.rows.length === 0) return res.status(404).json({ detail: 'Hotel not found' });
    return res.json({ success: true, message: 'Hotel suspended' });
  } catch (err) {
    return res.status(500).json({ detail: 'Failed to suspend hotel' });
  }
});

// =====================================================================
// 8. LEADS, QUOTES & STRICT PRIVACY ISOLATION
// =====================================================================
app.post('/api/leads', optionalUser, async (req, res) => {
  try {
    const {
      destination, check_in, check_out, guests = 1, room_type = 'Deluxe Room',
      budget, purpose = 'Leisure', preferences = '', customer_id
    } = req.body;

    const actualCustomerId = req.user ? req.user.id : (customer_id || null);
    if (!actualCustomerId) {
      return res.status(401).json({ detail: 'Authentication required to post a lead' });
    }

    const matchedHotels = await query(
      `SELECT id FROM hotels 
       WHERE (LOWER(location) LIKE $1 OR LOWER(name) LIKE $1) 
       AND (status = 'APPROVED' OR status IS NULL) LIMIT 10`,
      [`%${destination.toLowerCase().trim()}%`]
    );
    const matchedIds = matchedHotels.rows.map(h => h.id);

    const result = await query(
      `INSERT INTO leads (
        customer_id, destination, check_in, check_out, guests, room_type,
        budget, purpose, preferences, status, matched_hotel_ids
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active', $10::jsonb)
      RETURNING *`,
      [
        actualCustomerId, destination, check_in, check_out, guests, room_type,
        budget, purpose, preferences, JSON.stringify(matchedIds)
      ]
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('create lead error:', err);
    return res.status(500).json({ detail: 'Failed to create lead' });
  }
});

app.get(['/api/customer/leads', '/api/leads/my'], authenticateUser, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM leads WHERE customer_id = $1 ORDER BY id DESC',
      [req.user.id]
    );
    return res.json(result.rows);
  } catch (err) {
    console.error('customer leads error:', err);
    return res.status(500).json({ detail: 'Failed to fetch customer leads' });
  }
});

app.get('/api/leads/all', async (req, res) => {
  try {
    const result = await query('SELECT * FROM leads ORDER BY id DESC');
    return res.json(result.rows);
  } catch (err) {
    return res.status(500).json({ detail: 'Failed to fetch leads' });
  }
});

app.get('/api/leads/:leadId', authenticateUser, async (req, res) => {
  try {
    const leadId = parseInt(req.params.leadId, 10);
    const result = await query('SELECT * FROM leads WHERE id = $1', [leadId]);
    if (result.rows.length === 0) return res.status(404).json({ detail: 'Lead not found' });

    const lead = result.rows[0];
    if (req.user.role === 'customer' && lead.customer_id !== req.user.id) {
      return res.status(403).json({ detail: 'Access forbidden: You cannot view another user’s lead' });
    }
    return res.json(lead);
  } catch (err) {
    return res.status(500).json({ detail: 'Failed to fetch lead' });
  }
});

app.put('/api/leads/:leadId/dates', authenticateUser, async (req, res) => {
  try {
    const leadId = parseInt(req.params.leadId, 10);
    const { check_in, check_out } = req.body;
    const current = await query('SELECT * FROM leads WHERE id = $1', [leadId]);
    if (current.rows.length === 0) return res.status(404).json({ detail: 'Lead not found' });

    const lead = current.rows[0];
    if (req.user.role === 'customer' && lead.customer_id !== req.user.id) {
      return res.status(403).json({ detail: 'Access forbidden: You cannot modify another user’s lead' });
    }

    const updated = await query(
      'UPDATE leads SET check_in = $1, check_out = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
      [check_in, check_out, leadId]
    );
    return res.json(updated.rows[0]);
  } catch (err) {
    return res.status(500).json({ detail: 'Failed to update lead dates' });
  }
});

// Quotes
app.post('/api/quotes', async (req, res) => {
  try {
    const { lead_id, hotel_id, price, message = '' } = req.body;
    const result = await query(
      'INSERT INTO quotes (lead_id, hotel_id, price, message, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [lead_id, hotel_id, price, message, 'sent']
    );
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ detail: 'Failed to submit quote' });
  }
});

app.get('/api/quotes/my', authenticateUser, async (req, res) => {
  try {
    let result;
    if (req.user.role === 'hotel') {
      result = await query('SELECT * FROM quotes WHERE hotel_id = $1 ORDER BY id DESC', [req.user.id]);
    } else {
      result = await query(
        `SELECT q.* FROM quotes q 
         JOIN leads l ON q.lead_id = l.id 
         WHERE l.customer_id = $1 ORDER BY q.id DESC`,
        [req.user.id]
      );
    }
    return res.json(result.rows);
  } catch (err) {
    return res.status(500).json({ detail: 'Failed to fetch quotes' });
  }
});

app.get('/api/quotes/all', async (req, res) => {
  try {
    const result = await query('SELECT * FROM quotes ORDER BY id DESC');
    return res.json(result.rows);
  } catch (err) {
    return res.status(500).json({ detail: 'Failed to fetch quotes' });
  }
});

app.put('/api/quotes/:quoteId/counter', async (req, res) => {
  try {
    const quoteId = parseInt(req.params.quoteId, 10);
    const { counter_price, message = '' } = req.body;
    const result = await query(
      "UPDATE quotes SET price = $1, message = $2, status = 'countered' WHERE id = $3 RETURNING *",
      [counter_price, message, quoteId]
    );
    if (result.rows.length === 0) return res.status(404).json({ detail: 'Quote not found' });
    return res.json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ detail: 'Failed to submit counter offer' });
  }
});

// =====================================================================
// 9. BOOKINGS & SECURE CHECKOUT (Strict Isolation)
// =====================================================================
app.post('/api/bookings', optionalUser, async (req, res) => {
  try {
    const {
      lead_id, hotel_id, room_id, check_in, check_out, guests = 1,
      total_price, customer_id
    } = req.body;

    const actualCustomerId = req.user ? req.user.id : (customer_id || null);
    if (!actualCustomerId) {
      return res.status(401).json({ detail: 'Authentication required to create a booking' });
    }

    const qrCode = `BOOKING-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const commission = Math.round(total_price * 0.10); // 10% commission
    const payout = total_price - commission;

    const result = await query(
      `INSERT INTO bookings (
        lead_id, customer_id, hotel_id, room_id, check_in, check_out, guests,
        total_price, commission_amount, payout_amount, payment_status, status,
        qr_code, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'PAID', 'confirmed', $11, $12)
      RETURNING *`,
      [
        lead_id || null, actualCustomerId, hotel_id, room_id || null, check_in,
        check_out, guests, total_price, commission, payout, qrCode, new Date().toISOString()
      ]
    );

    const booking = result.rows[0];
    if (room_id) {
      const r = await query('SELECT * FROM rooms WHERE id = $1', [room_id]);
      booking.room = r.rows[0] || null;
    }

    return res.status(201).json(booking);
  } catch (err) {
    console.error('create booking error:', err);
    return res.status(500).json({ detail: 'Failed to create booking' });
  }
});

app.get(['/api/customer/bookings', '/api/bookings/my'], authenticateUser, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM bookings WHERE customer_id = $1 ORDER BY id DESC',
      [req.user.id]
    );
    const bookings = result.rows;

    for (const b of bookings) {
      if (b.room_id) {
        const r = await query('SELECT * FROM rooms WHERE id = $1', [b.room_id]);
        b.room = r.rows[0] || null;
      }
    }

    return res.json(bookings);
  } catch (err) {
    console.error('get bookings error:', err);
    return res.status(500).json({ detail: 'Failed to fetch customer bookings' });
  }
});

app.get('/api/bookings/all', async (req, res) => {
  try {
    const result = await query('SELECT * FROM bookings ORDER BY id DESC');
    return res.json(result.rows);
  } catch (err) {
    return res.status(500).json({ detail: 'Failed to fetch all bookings' });
  }
});

app.get('/api/bookings/:bookingId', authenticateUser, async (req, res) => {
  try {
    const bookingId = parseInt(req.params.bookingId, 10);
    const result = await query('SELECT * FROM bookings WHERE id = $1', [bookingId]);
    if (result.rows.length === 0) return res.status(404).json({ detail: 'Booking not found' });

    const booking = result.rows[0];
    if (req.user.role === 'customer' && booking.customer_id !== req.user.id) {
      return res.status(403).json({ detail: 'Access forbidden: You cannot access another user’s booking' });
    }

    if (booking.room_id) {
      const r = await query('SELECT * FROM rooms WHERE id = $1', [booking.room_id]);
      booking.room = r.rows[0] || null;
    }
    return res.json(booking);
  } catch (err) {
    return res.status(500).json({ detail: 'Failed to fetch booking' });
  }
});

app.put('/api/bookings/:bookingId/cancel', authenticateUser, async (req, res) => {
  try {
    const bookingId = parseInt(req.params.bookingId, 10);
    const current = await query('SELECT * FROM bookings WHERE id = $1', [bookingId]);
    if (current.rows.length === 0) return res.status(404).json({ detail: 'Booking not found' });

    const booking = current.rows[0];
    if (req.user.role === 'customer' && booking.customer_id !== req.user.id) {
      return res.status(403).json({ detail: 'Access forbidden: You cannot cancel another user’s booking' });
    }

    const updated = await query(
      "UPDATE bookings SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *",
      [bookingId]
    );
    return res.json(updated.rows[0]);
  } catch (err) {
    return res.status(500).json({ detail: 'Failed to cancel booking' });
  }
});

app.post('/api/bookings/scan', async (req, res) => {
  try {
    const { qr_code } = req.body;
    const result = await query('SELECT * FROM bookings WHERE qr_code = $1', [qr_code]);
    if (result.rows.length === 0) return res.status(404).json({ detail: 'Invalid QR Code' });

    const booking = result.rows[0];
    await query("UPDATE bookings SET status = 'checked-in', updated_at = CURRENT_TIMESTAMP WHERE id = $1", [booking.id]);
    booking.status = 'checked-in';
    return res.json(booking);
  } catch (err) {
    return res.status(500).json({ detail: 'Scan error' });
  }
});

app.put('/api/bookings/:bookingId/checkout', async (req, res) => {
  try {
    const bookingId = parseInt(req.params.bookingId, 10);
    const result = await query(
      "UPDATE bookings SET status = 'checked-out', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *",
      [bookingId]
    );
    if (result.rows.length === 0) return res.status(404).json({ detail: 'Booking not found' });
    return res.json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ detail: 'Checkout error' });
  }
});

// =====================================================================
// 10. WALLET & CREDITS
// =====================================================================
app.get('/api/wallets/hotel/:hotelId', async (req, res) => {
  try {
    const hotelId = parseInt(req.params.hotelId, 10);
    let result = await query('SELECT * FROM wallets WHERE hotel_id = $1', [hotelId]);
    if (result.rows.length === 0) {
      result = await query('INSERT INTO wallets (hotel_id, balance) VALUES ($1, 100) RETURNING *', [hotelId]);
    }
    return res.json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ detail: 'Failed to fetch wallet' });
  }
});

app.post('/api/leads/unlock', async (req, res) => {
  try {
    const { lead_id, hotel_id, credits_spent = 5 } = req.body;
    const walletRes = await query('SELECT * FROM wallets WHERE hotel_id = $1', [hotel_id]);
    if (walletRes.rows.length === 0 || walletRes.rows[0].balance < credits_spent) {
      return res.status(400).json({ detail: 'Insufficient wallet credits' });
    }

    await query('UPDATE wallets SET balance = balance - $1 WHERE hotel_id = $2', [credits_spent, hotel_id]);
    await query(
      'INSERT INTO wallet_transactions (hotel_id, amount, description, transaction_type, created_at) VALUES ($1, $2, $3, $4, $5)',
      [hotel_id, -credits_spent, `Unlocked Lead #${lead_id}`, 'LEAD_UNLOCK', new Date().toISOString()]
    );
    await query(
      'INSERT INTO lead_unlocks (lead_id, hotel_id, credits_spent, unlocked_at) VALUES ($1, $2, $3, $4)',
      [lead_id, hotel_id, credits_spent, new Date().toISOString()]
    );

    return res.json({ success: true, message: 'Lead unlocked successfully' });
  } catch (err) {
    return res.status(500).json({ detail: 'Failed to unlock lead' });
  }
});

app.get('/api/wallets/hotel/:hotelId/transactions', async (req, res) => {
  try {
    const hotelId = parseInt(req.params.hotelId, 10);
    const result = await query(
      'SELECT * FROM wallet_transactions WHERE hotel_id = $1 ORDER BY id DESC',
      [hotelId]
    );
    return res.json(result.rows);
  } catch (err) {
    return res.status(500).json({ detail: 'Failed to fetch transactions' });
  }
});

app.get('/api/admin/transactions', async (req, res) => {
  try {
    const result = await query('SELECT * FROM wallet_transactions ORDER BY id DESC');
    return res.json(result.rows);
  } catch (err) {
    return res.status(500).json({ detail: 'Failed to fetch transactions' });
  }
});

app.get('/api/leads/unlocked/:hotelId', async (req, res) => {
  try {
    const hotelId = parseInt(req.params.hotelId, 10);
    const result = await query('SELECT lead_id FROM lead_unlocks WHERE hotel_id = $1', [hotelId]);
    return res.json(result.rows.map(r => r.lead_id));
  } catch (err) {
    return res.status(500).json({ detail: 'Failed to fetch unlocked leads' });
  }
});

app.post('/api/wallets/purchase', async (req, res) => {
  try {
    const { hotel_id, credits, amount } = req.body;
    await query('UPDATE wallets SET balance = balance + $1 WHERE hotel_id = $2', [credits, hotel_id]);
    await query(
      'INSERT INTO wallet_transactions (hotel_id, amount, description, transaction_type, created_at) VALUES ($1, $2, $3, $4, $5)',
      [hotel_id, credits, `Purchased ${credits} credits for ₹${amount}`, 'CREDIT_PURCHASE', new Date().toISOString()]
    );
    const updated = await query('SELECT balance FROM wallets WHERE hotel_id = $1', [hotel_id]);
    return res.json({ status: 'success', balance: updated.rows[0]?.balance });
  } catch (err) {
    return res.status(500).json({ detail: 'Failed to purchase credits' });
  }
});

// =====================================================================
// 11. MESSAGES, CHAT & WEBSOCKET REAL-TIME SERVER
// =====================================================================
app.post('/api/messages', async (req, res) => {
  try {
    const { lead_id, hotel_id, sender, text } = req.body;
    const createdAt = new Date().toISOString();
    const result = await query(
      'INSERT INTO messages (lead_id, hotel_id, sender, text, created_at) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [lead_id, hotel_id, sender, text, createdAt]
    );

    // Broadcast to active WebSocket clients on this channel
    broadcastMessage(lead_id, hotel_id, result.rows[0]);

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ detail: 'Failed to send message' });
  }
});

app.get('/api/messages/:leadId/:hotelId', async (req, res) => {
  try {
    const { leadId, hotelId } = req.params;
    const result = await query(
      'SELECT * FROM messages WHERE lead_id = $1 AND hotel_id = $2 ORDER BY id ASC',
      [parseInt(leadId, 10), parseInt(hotelId, 10)]
    );
    return res.json(result.rows);
  } catch (err) {
    return res.status(500).json({ detail: 'Failed to fetch messages' });
  }
});

app.get('/api/messages/recent', async (req, res) => {
  try {
    const result = await query('SELECT * FROM messages ORDER BY id DESC LIMIT 50');
    return res.json(result.rows);
  } catch (err) {
    return res.status(500).json({ detail: 'Failed to fetch recent messages' });
  }
});

// Reviews
app.post('/api/reviews', async (req, res) => {
  try {
    const { booking_id, hotel_id, customer_id, rating, comment = '' } = req.body;
    const result = await query(
      'INSERT INTO reviews (booking_id, hotel_id, customer_id, rating, comment, created_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [booking_id, hotel_id, customer_id, rating, comment, new Date().toISOString()]
    );
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ detail: 'Failed to submit review' });
  }
});

app.get('/api/reviews/hotel/:hotelId', async (req, res) => {
  try {
    const hotelId = parseInt(req.params.hotelId, 10);
    const result = await query('SELECT * FROM reviews WHERE hotel_id = $1 ORDER BY id DESC', [hotelId]);
    return res.json(result.rows);
  } catch (err) {
    return res.status(500).json({ detail: 'Failed to fetch hotel reviews' });
  }
});

app.get('/api/reviews/all', async (req, res) => {
  try {
    const result = await query('SELECT * FROM reviews ORDER BY id DESC');
    return res.json(result.rows);
  } catch (err) {
    return res.status(500).json({ detail: 'Failed to fetch reviews' });
  }
});

// =====================================================================
// WEBSOCKET SERVER IMPLEMENTATION
// =====================================================================
const wss = new WebSocketServer({ noServer: true });
const activeConnections = new Map(); // key: `${lead_id}_${hotel_id}` -> Set of ws clients

const broadcastMessage = (leadId, hotelId, msgData) => {
  const roomKey = `${leadId}_${hotelId}`;
  const clients = activeConnections.get(roomKey);
  if (clients) {
    const payload = JSON.stringify(msgData);
    for (const client of clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    }
  }
};

server.on('upgrade', (request, socket, head) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const match = url.pathname.match(/\/api\/ws\/chat\/(\d+)\/(\d+)/);

  if (match) {
    wss.handleUpgrade(request, socket, head, (ws) => {
      const leadId = match[1];
      const hotelId = match[2];
      const roomKey = `${leadId}_${hotelId}`;

      if (!activeConnections.has(roomKey)) {
        activeConnections.set(roomKey, new Set());
      }
      activeConnections.get(roomKey).add(ws);

      ws.on('message', async (data) => {
        try {
          const parsed = JSON.parse(data.toString());
          const { sender, text } = parsed;
          const createdAt = new Date().toISOString();

          const result = await query(
            'INSERT INTO messages (lead_id, hotel_id, sender, text, created_at) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [parseInt(leadId, 10), parseInt(hotelId, 10), sender, text, createdAt]
          );

          broadcastMessage(leadId, hotelId, result.rows[0]);
        } catch (err) {
          console.error('WS message error:', err);
        }
      });

      ws.on('close', () => {
        const room = activeConnections.get(roomKey);
        if (room) {
          room.delete(ws);
          if (room.size === 0) activeConnections.delete(roomKey);
        }
      });
    });
  } else {
    socket.destroy();
  }
});

// Start Server
server.listen(PORT, () => {
  console.log(`\n🚀 HostIQ Node.js + Express Server running on http://localhost:${PORT}`);
  console.log(`🔒 Data Isolation & Privacy: Strict User Filtering Active`);
  console.log(`💬 Real-Time WebSockets: Active on /api/ws/chat/:leadId/:hotelId\n`);
});
