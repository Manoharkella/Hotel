export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export const api = {
  // --- Hotel Registration & Auth ---
  registerUser: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to register user');
    }
    return response.json();
  },

  loginUser: async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to login');
    }
    return response.json();
  },

  loginHotel: async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/hotels/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to login');
    }
    return response.json();
  },

  registerHotel: async (hotelData) => {
    const response = await fetch(`${API_BASE_URL}/hotels/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(hotelData)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to register hotel');
    }
    return response.json();
  },

  // --- Admin Endpoints ---
  getAllUsers: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/users/all`);
    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
  },

  getAllHotels: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/hotels/all`);
    if (!response.ok) throw new Error('Failed to fetch hotels');
    return response.json();
  },

  approveHotel: async (hotelId) => {
    const response = await fetch(`${API_BASE_URL}/admin/hotels/${hotelId}/approve`, {
      method: 'PUT'
    });
    if (!response.ok) throw new Error('Failed to approve hotel');
    return response.json();
  },

  suspendHotel: async (hotelId) => {
    const response = await fetch(`${API_BASE_URL}/admin/hotels/${hotelId}/suspend`, {
      method: 'PUT'
    });
    if (!response.ok) throw new Error('Failed to suspend hotel');
    return response.json();
  },

  // --- Customer Endpoints ---
  searchApprovedHotels: async () => {
    const response = await fetch(`${API_BASE_URL}/customer/hotels/search`);
    if (!response.ok) throw new Error('Failed to fetch hotels');
    return response.json();
  },

  // --- Leads ---
  createLead: async (leadData) => {
    const response = await fetch(`${API_BASE_URL}/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(leadData)
    });
    if (!response.ok) throw new Error('Failed to create lead');
    return response.json();
  },

  getAllLeads: async () => {
    const response = await fetch(`${API_BASE_URL}/leads/all`);
    if (!response.ok) throw new Error('Failed to fetch leads');
    return response.json();
  },

  // --- Quotes ---
  createQuote: async (quoteData) => {
    const response = await fetch(`${API_BASE_URL}/quotes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(quoteData)
    });
    if (!response.ok) throw new Error('Failed to create quote');
    return response.json();
  },

  getAllQuotes: async () => {
    const response = await fetch(`${API_BASE_URL}/quotes/all`);
    if (!response.ok) throw new Error('Failed to fetch quotes');
    return response.json();
  },

  counterQuote: async (quoteId, price) => {
    const response = await fetch(`${API_BASE_URL}/quotes/${quoteId}/counter`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ price: parseInt(price) })
    });
    if (!response.ok) throw new Error('Failed to counter quote');
    return response.json();
  },

  // --- Bookings ---
  createBooking: async (bookingData) => {
    const response = await fetch(`${API_BASE_URL}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingData)
    });
    if (!response.ok) throw new Error('Failed to create booking');
    return response.json();
  },

  getAllBookings: async () => {
    const response = await fetch(`${API_BASE_URL}/bookings/all`);
    if (!response.ok) throw new Error('Failed to fetch bookings');
    return response.json();
  },

  scanQrCheckIn: async (qrCode, hotelId) => {
    const response = await fetch(`${API_BASE_URL}/bookings/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qr_code: qrCode, hotel_id: parseInt(hotelId) })
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.detail || 'Failed to scan QR code');
    }
    return response.json();
  },

  // --- Wallets & Unlocks ---
  getWallet: async (hotelId) => {
    const response = await fetch(`${API_BASE_URL}/wallets/hotel/${hotelId}`);
    if (!response.ok) throw new Error('Failed to fetch wallet');
    return response.json();
  },

  getTransactions: async (hotelId) => {
    const response = await fetch(`${API_BASE_URL}/wallets/hotel/${hotelId}/transactions`);
    if (!response.ok) throw new Error('Failed to fetch transactions');
    return response.json();
  },

  getAllTransactions: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/transactions`);
    if (!response.ok) throw new Error('Failed to fetch all transactions');
    return response.json();
  },

  unlockLead: async (leadId, hotelId) => {
    const response = await fetch(`${API_BASE_URL}/leads/unlock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead_id: parseInt(leadId), hotel_id: parseInt(hotelId) })
    });
    if (!response.ok) throw new Error('Failed to unlock lead');
    return response.json();
  },

  getUnlockedLeads: async (hotelId) => {
    const response = await fetch(`${API_BASE_URL}/leads/unlocked/${hotelId}`);
    if (!response.ok) throw new Error('Failed to fetch unlocked leads');
    return response.json(); // array of lead ids
  },

  // --- Messages ---
  sendMessage: async (messageData) => {
    const response = await fetch(`${API_BASE_URL}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messageData)
    });
    if (!response.ok) throw new Error('Failed to send message');
    return response.json();
  },

  getMessages: async (leadId, hotelId) => {
    const response = await fetch(`${API_BASE_URL}/messages/${leadId}/${hotelId}`);
    if (!response.ok) throw new Error('Failed to fetch messages');
    return response.json();
  },

  // --- Reviews ---
  createReview: async (reviewData) => {
    const response = await fetch(`${API_BASE_URL}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reviewData)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to submit review');
    }
    return response.json();
  },

  getHotelReviews: async (hotelId) => {
    const response = await fetch(`${API_BASE_URL}/reviews/hotel/${hotelId}`);
    if (!response.ok) throw new Error('Failed to fetch reviews');
    return response.json();
  }
};
