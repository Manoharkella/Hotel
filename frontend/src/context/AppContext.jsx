import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { api } from '../services/api';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [leads, setLeads] = useState([]);
  const [unlocks, setUnlocks] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [walletBalances, setWalletBalances] = useState({});
  const [reviews, setReviews] = useState([]);

  const refreshData = useCallback(async () => {
    try {
      const [apiHotels, apiLeads, apiQuotes, apiBookings, apiAllTxs] = await Promise.all([
        api.searchApprovedHotels(),
        api.getAllLeads(),
        api.getAllQuotes(),
        api.getAllBookings(),
        api.getAllTransactions().catch(() => [])
      ]);

      const mappedHotels = apiHotels.map(h => ({
        id: h.id.toString(),
        name: h.name,
        location: h.location,
        address: h.address || 'Address not provided',
        latitude: h.latitude || 20.5937,
        longitude: h.longitude || 78.9629,
        category: 'Premium',
        amenities: ['WiFi', 'Parking', 'Room Service'],
        photos: h.photos && h.photos.length > 0 ? h.photos : ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80'],
        roomTypes: (h.rooms && h.rooms.length > 0) ? h.rooms.map(r => ({ type: r.room_type, price: r.price_per_night })) : [{ type: 'Deluxe', price: 3000 }],
        rating: 4.8,
        reviewCount: 0,
        description: 'A luxurious property ready to serve you.',
        email: h.email
      }));
      
      const allReviewsPromises = mappedHotels.map(h => api.getHotelReviews(h.id));
      const allReviewsResults = await Promise.all(allReviewsPromises);
      
      let allReviewsList = [];
      allReviewsResults.forEach((revs, i) => {
        allReviewsList = [...allReviewsList, ...revs];
        if (revs.length > 0) {
          const avg = revs.reduce((sum, r) => sum + r.rating, 0) / revs.length;
          mappedHotels[i].rating = avg.toFixed(1);
          mappedHotels[i].reviewCount = revs.length;
        }
      });
      
      setReviews(allReviewsList);
      setHotels(mappedHotels);
      
      setLeads(apiLeads.map(l => ({
        ...l,
        id: l.id.toString(),
        customerId: l.customer_id?.toString() || '1',
        checkIn: l.check_in,
        checkOut: l.check_out,
        roomType: l.room_type,
        matchedHotelIds: (l.matched_hotel_ids || []).map(id => id.toString()),
        customerName: l.customer_name || 'Customer User',
        customerEmail: l.customer_email || 'customer@hotel.com',
        customerPhone: l.customer_phone || '+91 9000000000'
      })));

      setQuotes(apiQuotes.map(q => ({
        ...q,
        id: q.id.toString(),
        leadId: q.lead_id?.toString(),
        hotelId: q.hotel_id?.toString(),
        hotelName: mappedHotels.find(h => h.id === q.hotel_id?.toString())?.name || 'Hotel'
      })));

      setBookings(apiBookings.map(b => ({
        ...b,
        id: b.id.toString(),
        leadId: b.lead_id?.toString(),
        hotelId: b.hotel_id?.toString(),
        customerId: b.customer_id?.toString(),
        qrCode: b.qr_code,
        totalPrice: b.total_price,
        checkIn: apiLeads.find(l => l.id === b.lead_id)?.check_in,
        checkOut: apiLeads.find(l => l.id === b.lead_id)?.check_out,
        roomType: apiLeads.find(l => l.id === b.lead_id)?.room_type,
        hotelName: mappedHotels.find(h => h.id === b.hotel_id?.toString())?.name || 'Hotel',
        customerName: apiLeads.find(l => l.id === b.lead_id)?.customer_name || 'Guest'
      })));

      setTransactions(apiAllTxs.map(tx => ({
        id: tx.id.toString(),
        hotelId: tx.hotel_id.toString(),
        amount: tx.amount,
        type: tx.amount > 0 ? 'purchase' : 'spend',
        date: tx.created_at
      })));

    } catch (err) {
      console.error("Failed to load backend data", err);
    }
  }, []);

  useEffect(() => {
    refreshData();
    
    // Poll every 10 seconds to keep data synced automatically
    const interval = setInterval(refreshData, 10000);
    return () => clearInterval(interval);
  }, [refreshData]);

  const loadWallet = useCallback(async (hotelId) => {
    try {
      const res = await api.getWallet(hotelId);
      setWalletBalances(prev => ({...prev, [hotelId]: res.balance}));
      
      // Fetch and set transactions
      const txs = await api.getTransactions(hotelId);
      const mappedTxs = txs.map(tx => ({
        id: tx.id.toString(),
        hotelId: tx.hotel_id.toString(),
        amount: tx.amount,
        type: tx.amount > 0 ? 'purchase' : 'spend',
        package: tx.description,
        balanceAfter: res.balance, // Simplified, backend should ideally return running balance
        createdAt: tx.created_at
      }));
      setTransactions(mappedTxs);
    } catch(err) {
      console.error("Failed to load wallet/transactions:", err);
    }
  }, []);

  const loadUnlocks = useCallback(async (hotelId) => {
    try {
      const unlockedIds = await api.getUnlockedLeads(hotelId);
      const newUnlocks = unlockedIds.map(leadId => ({ leadId: leadId.toString(), hotelId: hotelId.toString() }));
      setUnlocks(prev => [...prev.filter(u => u.hotelId !== hotelId.toString()), ...newUnlocks]);
    } catch(err) {}
  }, []);

  const submitRequirement = useCallback(async (req) => {
    try {
      const dbLead = await api.createLead({
        customer_id: parseInt(req.customerId) || 1,
        destination: req.destination,
        check_in: req.checkIn,
        check_out: req.checkOut,
        guests: req.guests,
        room_type: req.roomType,
        budget: req.budget,
        purpose: req.purpose || 'Leisure',
        preferences: req.preferences || ''
      });
      
      const newLead = {
        ...req,
        id: dbLead.id.toString(),
        matchedHotelIds: (dbLead.matched_hotel_ids || []).map(id => id.toString()),
        status: dbLead.status,
        createdAt: new Date().toISOString(),
      };
      setLeads(prev => [newLead, ...prev]);
      return newLead;
    } catch(err) {
      console.error(err);
      return null;
    }
  }, []);

  const unlockLead = useCallback(async (leadId, hotelId) => {
    try {
      const res = await api.unlockLead(leadId, hotelId);
      setUnlocks(prev => [...prev, { leadId: leadId.toString(), hotelId: hotelId.toString() }]);
      setWalletBalances(prev => ({...prev, [hotelId]: res.balance}));
      return true;
    } catch (err) {
      console.error("Unlock failed", err);
      return false;
    }
  }, []);

  const isLeadUnlocked = useCallback((leadId, hotelId) => {
    return unlocks.some(u => u.leadId === leadId.toString() && u.hotelId === hotelId.toString());
  }, [unlocks]);

  const sendQuote = useCallback(async (leadId, hotelId, hotelName, message, price) => {
    try {
      const q = await api.createQuote({
        lead_id: parseInt(leadId),
        hotel_id: parseInt(hotelId),
        price: parseInt(price),
        message: message
      });
      const newQuote = { ...q, id: q.id.toString(), leadId: leadId.toString(), hotelId: hotelId.toString(), hotelName, status: q.status };
      setQuotes(prev => [newQuote, ...prev]);
      return newQuote;
    } catch(err) {
      console.error(err);
      return null;
    }
  }, []);

  const counterQuote = useCallback(async (quoteId, newPrice) => {
    try {
      const q = await api.counterQuote(quoteId, newPrice);
      setQuotes(prev => prev.map(old => old.id.toString() === quoteId.toString() ? { ...old, price: q.price, status: 'countered' } : old));
      return true;
    } catch(err) {
      console.error(err);
      return false;
    }
  }, []);

  const acceptQuote = useCallback(async (quoteId, leadId, customerId, customerName, hotelId, hotelName, roomType, checkIn, checkOut, price) => {
    try {
      const b = await api.createBooking({
        lead_id: parseInt(leadId),
        customer_id: parseInt(customerId) || 1,
        hotel_id: parseInt(hotelId),
        total_price: parseInt(price)
      });
      
      setQuotes(prev => prev.map(q => q.id === quoteId.toString() ? { ...q, status: 'accepted' } : q.leadId === leadId.toString() && q.id !== quoteId.toString() ? { ...q, status: 'rejected' } : q));
      setLeads(prev => prev.map(l => l.id === leadId.toString() ? { ...l, status: 'won' } : l));
      
      const newBooking = { ...b, id: b.id.toString(), leadId: leadId.toString(), hotelId: hotelId.toString(), hotelName, customerId: customerId.toString(), customerName, roomType, checkIn, checkOut, qrCode: b.qr_code, status: b.status };
      setBookings(prev => [newBooking, ...prev]);
      return newBooking;
    } catch(err) {
      console.error(err);
      return null;
    }
  }, []);

  const getWalletBalance = useCallback((hotelId) => {
    return walletBalances[hotelId] ?? 100;
  }, [walletBalances]);

  const completeCheckIn = () => {};
  
  const scanQrCheckIn = useCallback(async (qrCode, hotelId) => {
    try {
      const res = await api.scanQrCheckIn(qrCode, hotelId);
      if (res.success && res.booking) {
        setBookings(prev => prev.map(b => b.id.toString() === res.booking.id.toString() ? { ...b, status: 'checked-in' } : b));
        return { success: true, booking: { ...res.booking, id: res.booking.id.toString(), customerName: 'Guest' } };
      }
      return { success: false, error: 'Failed to verify' };
    } catch(err) {
      console.error(err);
      return { success: false, error: err.message };
    }
  }, []);

  const checkOutBooking = () => {};
  
  const rateBooking = useCallback(async (bookingId, rating, comment = "") => {
    try {
      const booking = bookings.find(b => b.id.toString() === bookingId.toString());
      if (!booking) return false;
      
      const newReview = await api.createReview({
        booking_id: parseInt(bookingId),
        hotel_id: parseInt(booking.hotelId),
        customer_id: parseInt(booking.customerId),
        rating: rating,
        comment: comment
      });
      
      setReviews(prev => [...prev, newReview]);
      
      // Update booking to show it's rated
      setBookings(prev => prev.map(b => b.id.toString() === bookingId.toString() ? { ...b, rating: rating } : b));
      return true;
    } catch(err) {
      console.error(err);
      return false;
    }
  }, [bookings]);

  const purchaseCredits = () => {};
  const markNotificationsRead = () => {};
  const addMockHotel = () => {};

  return (
    <AppContext.Provider value={{
      leads, hotels, unlocks, quotes, bookings, checkins, wallets, transactions, notifications, reviews,
      submitRequirement, unlockLead, isLeadUnlocked, sendQuote, acceptQuote, counterQuote,
      completeCheckIn, scanQrCheckIn, checkOutBooking, rateBooking, purchaseCredits, getWalletBalance, markNotificationsRead,
      addMockHotel, loadWallet, loadUnlocks, refreshData
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
