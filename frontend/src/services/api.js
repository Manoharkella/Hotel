const rawUrl = (import.meta.env.VITE_API_URL || '').trim();
export const API_BASE_URL = rawUrl 
  ? (rawUrl.endsWith('/api') ? rawUrl : (rawUrl.endsWith('/') ? `${rawUrl}api` : `${rawUrl}/api`))
  : (import.meta.env.PROD ? '/api' : 'http://localhost:8000/api');

let activeAuthToken = localStorage.getItem('hostiq_access_token') || sessionStorage.getItem('hostiq_access_token') || null;

export const setAuthToken = (token) => {
  activeAuthToken = token;
  if (token) {
    localStorage.setItem('hostiq_access_token', token);
  } else {
    localStorage.removeItem('hostiq_access_token');
    sessionStorage.removeItem('hostiq_access_token');
  }
};

export const getAuthToken = () => activeAuthToken;

const getHeaders = (extra = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...extra
  };
  if (activeAuthToken) {
    headers['Authorization'] = `Bearer ${activeAuthToken}`;
  }
  return headers;
};

export const api = {
  // --- Token Management ---
  setAuthToken,
  getAuthToken,

  // --- Customer & Hotel Registration & Auth ---
  sendOtp: async ({ email, phone, identifier, purpose = 'registration' }) => {
    const response = await fetch(`${API_BASE_URL}/auth/send-otp`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, phone, identifier, purpose })
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || 'Failed to send OTP code');
    }
    return response.json();
  },

  verifyOtp: async ({ email, phone, identifier, otp, purpose = 'registration' }) => {
    const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, phone, identifier, otp, purpose })
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || 'Invalid or expired OTP code');
    }
    return response.json();
  },

  resetPassword: async ({ identifier, otp, new_password }) => {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ identifier, otp, new_password })
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || 'Failed to reset password');
    }
    return response.json();
  },

  registerUser: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/users/register`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(userData)
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || 'Failed to register user');
    }
    return response.json();
  },

  loginUser: async (identifier, password) => {
    const response = await fetch(`${API_BASE_URL}/users/login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ identifier, password })
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || 'Failed to login');
    }
    const data = await response.json();
    if (data.access_token) {
      setAuthToken(data.access_token);
    }
    return data;
  },

  loginHotel: async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/hotels/login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, password })
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || 'Failed to login');
    }
    const data = await response.json();
    if (data.access_token) {
      setAuthToken(data.access_token);
    }
    return data;
  },

  loginAdmin: async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/admin/login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, password })
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || 'Failed to login');
    }
    const data = await response.json();
    if (data.access_token) {
      setAuthToken(data.access_token);
    }
    return data;
  },

  registerHotel: async (hotelData) => {
    const response = await fetch(`${API_BASE_URL}/hotels/register`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(hotelData)
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || 'Failed to submit hotel onboarding');
    }
    return response.json();
  },

  // --- User Profile & Preferences ---
  getUserProfile: async () => {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      headers: getHeaders()
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || 'Failed to fetch user profile');
    }
    return response.json();
  },

  updateUserProfile: async (data) => {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || 'Failed to update profile');
    }
    return response.json();
  },

  changeUserPassword: async (currentPassword, newPassword) => {
    const response = await fetch(`${API_BASE_URL}/users/me/password`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword })
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || 'Failed to change password');
    }
    return response.json();
  },

  // --- Wishlist (Strict User Isolation) ---
  getWishlist: async () => {
    const response = await fetch(`${API_BASE_URL}/customer/wishlist`, {
      headers: getHeaders()
    });
    if (!response.ok) {
      return [];
    }
    return response.json();
  },

  toggleWishlist: async (hotelId) => {
    const response = await fetch(`${API_BASE_URL}/customer/wishlist/${hotelId}/toggle`, {
      method: 'POST',
      headers: getHeaders()
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || 'Failed to update wishlist');
    }
    return response.json();
  },

  addToWishlist: async (hotelId) => {
    const response = await fetch(`${API_BASE_URL}/customer/wishlist/${hotelId}`, {
      method: 'POST',
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to add to wishlist');
    return response.json();
  },

  removeFromWishlist: async (hotelId) => {
    const response = await fetch(`${API_BASE_URL}/customer/wishlist/${hotelId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to remove from wishlist');
    return response.json();
  },

  // --- Admin Endpoints ---
  getAllUsers: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/users/all`, {
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
  },

  getAllHotels: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/hotels/all`, {
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch hotels');
    return response.json();
  },

  getHotelDetails: async (hotelId) => {
    const response = await fetch(`${API_BASE_URL}/hotels/${hotelId}`, {
      headers: getHeaders()
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || 'Failed to fetch hotel details');
    }
    return response.json();
  },

  approveHotel: async (hotelId) => {
    const response = await fetch(`${API_BASE_URL}/admin/hotels/${hotelId}/approve`, {
      method: 'PUT',
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to approve hotel');
    return response.json();
  },

  rejectHotel: async (hotelId, reason) => {
    const response = await fetch(`${API_BASE_URL}/admin/hotels/${hotelId}/reject`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ reason })
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || 'Failed to reject hotel');
    }
    return response.json();
  },

  suspendHotel: async (hotelId) => {
    const response = await fetch(`${API_BASE_URL}/admin/hotels/${hotelId}/suspend`, {
      method: 'PUT',
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to suspend hotel');
    return response.json();
  },

  // --- Customer Search ---
  searchApprovedHotels: async () => {
    const response = await fetch(`${API_BASE_URL}/customer/hotels/search`, {
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch hotels');
    return response.json();
  },

  // --- Leads / Trips (Strict User Isolation) ---
  createLead: async (leadData) => {
    const response = await fetch(`${API_BASE_URL}/leads`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(leadData)
    });
    if (!response.ok) throw new Error('Failed to create lead');
    return response.json();
  },

  getCustomerLeads: async () => {
    const response = await fetch(`${API_BASE_URL}/customer/leads`, {
      headers: getHeaders()
    });
    if (!response.ok) return [];
    return response.json();
  },

  getAllLeads: async () => {
    const response = await fetch(`${API_BASE_URL}/leads/all`, {
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch leads');
    return response.json();
  },

  updateLeadDates: async (leadId, checkIn, checkOut) => {
    const response = await fetch(`${API_BASE_URL}/leads/${leadId}/dates`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ check_in: checkIn, check_out: checkOut })
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || 'Failed to update lead dates');
    }
    return response.json();
  },

  // --- Quotes ---
  createQuote: async (quoteData) => {
    const response = await fetch(`${API_BASE_URL}/quotes`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(quoteData)
    });
    if (!response.ok) throw new Error('Failed to create quote');
    return response.json();
  },

  getMyQuotes: async () => {
    const response = await fetch(`${API_BASE_URL}/quotes/my`, {
      headers: getHeaders()
    });
    if (!response.ok) return [];
    return response.json();
  },

  getAllQuotes: async () => {
    const response = await fetch(`${API_BASE_URL}/quotes/all`, {
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch quotes');
    return response.json();
  },

  counterQuote: async (quoteId, price) => {
    const response = await fetch(`${API_BASE_URL}/quotes/${quoteId}/counter`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ price: parseInt(price) })
    });
    if (!response.ok) throw new Error('Failed to counter quote');
    return response.json();
  },

  // --- Bookings (Strict User Isolation) ---
  createBooking: async (bookingData) => {
    const response = await fetch(`${API_BASE_URL}/bookings`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(bookingData)
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || 'Failed to create booking');
    }
    return response.json();
  },

  getCustomerBookings: async () => {
    const response = await fetch(`${API_BASE_URL}/customer/bookings`, {
      headers: getHeaders()
    });
    if (!response.ok) return [];
    return response.json();
  },

  getAllBookings: async () => {
    const response = await fetch(`${API_BASE_URL}/bookings/all`, {
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch bookings');
    return response.json();
  },

  scanQrCheckIn: async (qrCode, hotelId) => {
    const response = await fetch(`${API_BASE_URL}/bookings/scan`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ qr_code: qrCode, hotel_id: parseInt(hotelId) })
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.detail || 'Failed to scan QR code');
    }
    return response.json();
  },

  checkOutBooking: async (bookingId) => {
    const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/checkout`, {
      method: 'PUT',
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to process check-out');
    return response.json();
  },

  cancelBooking: async (bookingId) => {
    const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/cancel`, {
      method: 'PUT',
      headers: getHeaders()
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || 'Failed to cancel booking');
    }
    return response.json();
  },

  // --- Wallets & Unlocks ---
  getWallet: async (hotelId) => {
    const response = await fetch(`${API_BASE_URL}/wallets/hotel/${hotelId}`, {
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch wallet');
    return response.json();
  },

  getTransactions: async (hotelId) => {
    const response = await fetch(`${API_BASE_URL}/wallets/hotel/${hotelId}/transactions`, {
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch transactions');
    return response.json();
  },

  getAllTransactions: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/transactions`, {
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch all transactions');
    return response.json();
  },

  unlockLead: async (leadId, hotelId) => {
    const response = await fetch(`${API_BASE_URL}/leads/unlock`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ lead_id: parseInt(leadId), hotel_id: parseInt(hotelId) })
    });
    if (!response.ok) throw new Error('Failed to unlock lead');
    return response.json();
  },

  getUnlockedLeads: async (hotelId) => {
    const response = await fetch(`${API_BASE_URL}/leads/unlocked/${hotelId}`, {
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch unlocked leads');
    return response.json();
  },

  purchaseCredits: async (hotelId, amount, packageName) => {
    const response = await fetch(`${API_BASE_URL}/wallets/purchase`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ hotel_id: parseInt(hotelId), amount, package: packageName })
    });
    if (!response.ok) throw new Error('Failed to purchase credits');
    return response.json();
  },

  // --- Messages & Chat ---
  sendMessage: async (messageData) => {
    const response = await fetch(`${API_BASE_URL}/messages`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(messageData)
    });
    if (!response.ok) throw new Error('Failed to send message');
    return response.json();
  },

  getMessages: async (leadId, hotelId) => {
    const response = await fetch(`${API_BASE_URL}/messages/${leadId}/${hotelId}`, {
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch messages');
    return response.json();
  },

  getRecentMessages: async ({ hotelId, customerId, since } = {}) => {
    try {
      const params = new URLSearchParams();
      if (hotelId) params.append('hotel_id', hotelId);
      if (customerId) params.append('customer_id', customerId);
      if (since) params.append('since', since);
      const response = await fetch(`${API_BASE_URL}/messages/recent?${params.toString()}`, {
        headers: getHeaders()
      });
      if (!response.ok) return [];
      return response.json();
    } catch {
      return [];
    }
  },

  // --- Reviews ---
  createReview: async (reviewData) => {
    const response = await fetch(`${API_BASE_URL}/reviews`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(reviewData)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to submit review');
    }
    return response.json();
  },

  getHotelReviews: async (hotelId) => {
    const response = await fetch(`${API_BASE_URL}/reviews/hotel/${hotelId}`, {
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch reviews');
    return response.json();
  },

  getAllReviews: async () => {
    const response = await fetch(`${API_BASE_URL}/reviews/all`, {
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch all reviews');
    return response.json();
  },

  // --- Property & Rooms ---
  updateHotel: async (hotelId, data) => {
    const response = await fetch(`${API_BASE_URL}/hotels/${hotelId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update hotel details');
    return response.json();
  },

  updateRoom: async (roomId, data) => {
    const response = await fetch(`${API_BASE_URL}/rooms/${roomId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update room details');
    return response.json();
  },

  createRoom: async (hotelId, roomData) => {
    const response = await fetch(`${API_BASE_URL}/hotels/${hotelId}/rooms`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(roomData)
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to create room');
    }
    return response.json();
  },

  deleteRoom: async (roomId) => {
    const response = await fetch(`${API_BASE_URL}/rooms/${roomId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to delete room');
    return response.json();
  }
};
