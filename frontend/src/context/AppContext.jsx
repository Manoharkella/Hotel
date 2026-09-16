import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const { user } = useAuth();
  const [leads, setLeads] = useState([]);
  const [unlocks, setUnlocks] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [notifications, setNotifications] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('hotellead_notifications') || '[]');
    } catch {
      return [];
    }
  });
  const [globalChat, setGlobalChat] = useState(null);
  const [walletBalances, setWalletBalances] = useState({});
  const [reviews, setReviews] = useState([]);

  // --- Wishlist State (Backend Synchronized & Strict User Isolation) ---
  const [wishlist, setWishlist] = useState([]);

  // Sync wishlist from backend whenever authenticated customer changes
  useEffect(() => {
    let isMounted = true;
    if (user && user.role === 'customer') {
      api.getWishlist()
        .then(items => {
          if (isMounted) {
            setWishlist(Array.isArray(items) ? items.map(id => id.toString()) : []);
          }
        })
        .catch(() => {
          if (isMounted) setWishlist([]);
        });
    } else {
      setWishlist([]);
    }
    return () => { isMounted = false; };
  }, [user?.id, user?.email]);

  // Sync notifications in real-time across tabs/windows
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'hotellead_notifications' && e.newValue) {
        try {
          setNotifications(JSON.parse(e.newValue));
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Immediately wipe previous user state when user logs out or switches
  useEffect(() => {
    if (!user) {
      setLeads([]);
      setBookings([]);
      setQuotes([]);
      setWishlist([]);
    }
  }, [user?.id, user?.role]);

  const toggleWishlist = useCallback(async (hotelId) => {
    if (!hotelId) return false;
    const strId = hotelId.toString();
    const numId = parseInt(hotelId);
    
    // Optimistic update
    const alreadyWishlisted = wishlist.includes(strId);
    const newIsWishlisted = !alreadyWishlisted;
    setWishlist(prev => alreadyWishlisted ? prev.filter(id => id !== strId) : [...prev, strId]);

    try {
      if (user && user.role === 'customer') {
        const res = await api.toggleWishlist(numId);
        if (res && res.wishlist) {
          setWishlist(res.wishlist.map(id => id.toString()));
        }
      }
    } catch (e) {
      console.error("Failed to toggle wishlist on server:", e);
    }
    return newIsWishlisted;
  }, [wishlist, user]);

  const isWishlisted = useCallback((hotelId) => {
    if (!hotelId) return false;
    return wishlist.includes(hotelId.toString());
  }, [wishlist]);

  const refreshData = useCallback(async () => {
    try {
      let leadsPromise, quotesPromise, bookingsPromise;

      const currentRole = user?.role || (localStorage.getItem('hotel_user_hotel') ? 'hotel' : localStorage.getItem('hotel_user_admin') ? 'admin' : (localStorage.getItem('hotel_user_customer') || localStorage.getItem('hostiq_access_token')) ? 'customer' : null);

      if (currentRole === 'customer') {
        leadsPromise = api.getCustomerLeads().catch(() => []);
        quotesPromise = api.getMyQuotes().catch(() => []);
        bookingsPromise = api.getCustomerBookings().catch(() => []);
      } else if (currentRole === 'hotel') {
        leadsPromise = api.getAllLeads().catch(() => []);
        quotesPromise = api.getMyQuotes().catch(() => []);
        bookingsPromise = api.getAllBookings().catch(() => []);
      } else if (currentRole === 'admin') {
        leadsPromise = api.getAllLeads().catch(() => []);
        quotesPromise = api.getAllQuotes().catch(() => []);
        bookingsPromise = api.getAllBookings().catch(() => []);
      } else {
        leadsPromise = Promise.resolve([]);
        quotesPromise = Promise.resolve([]);
        bookingsPromise = Promise.resolve([]);
      }

      const [apiHotels, apiLeads, apiQuotes, apiBookings, apiAllTxs, apiAllReviews] = await Promise.all([
        api.getAllHotels().catch(() => []),
        leadsPromise,
        quotesPromise,
        bookingsPromise,
        api.getAllTransactions().catch(() => []),
        api.getAllReviews().catch(() => [])
      ]);

      const DEFAULT_ROOM_PRESETS = [
        {
          id: 'room-std', type: 'Standard Room', price: 2500, quantity: 5, maxGuests: 2, bedType: 'Queen Bed', roomSize: '280 sq.ft',
          amenities: ['Free Wi-Fi', 'AC', 'TV', 'In-room Safe', 'Coffee Maker'], breakfast: 'Available for purchase', cancellationPolicy: 'Free cancellation up to 24h before check-in',
          description: 'Cozy and modern room equipped with essential luxury amenities for a comfortable stay.',
          images: [
            { label: 'Bedroom', url: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=1000&q=80' },
            { label: 'Bed', url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1000&q=80' },
            { label: 'Bathroom', url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1000&q=80' },
            { label: 'Balcony', url: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=1000&q=80' },
            { label: 'Interior', url: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=1000&q=80' }
          ]
        },
        {
          id: 'room-deluxe', type: 'Deluxe Room', price: 3500, quantity: 3, maxGuests: 2, bedType: 'King Bed', roomSize: '350 sq.ft',
          amenities: ['Free Wi-Fi', 'Breakfast Included', 'AC', 'Mini Bar', 'Work Desk'], breakfast: 'Breakfast Included', cancellationPolicy: 'Free cancellation up to 24h before check-in',
          description: 'Spacious deluxe room featuring a plush king-size bed, high-speed Wi-Fi, and scenic view.',
          images: [
            { label: 'Bedroom', url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1000&q=80' },
            { label: 'Bed', url: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=1000&q=80' },
            { label: 'Bathroom', url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1000&q=80' },
            { label: 'Balcony', url: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=1000&q=80' },
            { label: 'Interior', url: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=1000&q=80' }
          ]
        },
        {
          id: 'room-exec', type: 'Executive Room', price: 5200, quantity: 4, maxGuests: 2, bedType: 'King Bed', roomSize: '450 sq.ft',
          amenities: ['Free Wi-Fi', 'Breakfast Included', 'Executive Lounge', 'AC', 'Espresso Machine'], breakfast: 'Buffet Breakfast Included', cancellationPolicy: 'Free cancellation up to 48h before check-in',
          description: 'Premium executive room tailored for business & luxury travelers with exclusive club privileges.',
          images: [
            { label: 'Bedroom', url: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1000&q=80' },
            { label: 'Bed', url: 'https://images.unsplash.com/photo-1591088398332-8a7791972843?w=1000&q=80' },
            { label: 'Bathroom', url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1000&q=80' },
            { label: 'Balcony', url: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=1000&q=80' },
            { label: 'Interior', url: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=1000&q=80' }
          ]
        },
        {
          id: 'room-suite', type: 'Suite', price: 8500, quantity: 2, maxGuests: 4, bedType: 'King Bed + Sofa Bed', roomSize: '650 sq.ft',
          amenities: ['Free Wi-Fi', 'Breakfast Included', 'Living Room', 'Bathtub', 'Balcony View', '24/7 Butler Service'], breakfast: 'Gourmet Breakfast Included', cancellationPolicy: 'Free cancellation up to 48h before check-in',
          description: 'Expansive suite featuring separate living space, marble bathroom with deep soaking bathtub, and views.',
          images: [
            { label: 'Bedroom', url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1000&q=80' },
            { label: 'Bed', url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1000&q=80' },
            { label: 'Bathroom', url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1000&q=80' },
            { label: 'Balcony', url: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=1000&q=80' },
            { label: 'Interior', url: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=1000&q=80' }
          ]
        },
        {
          id: 'room-premium', type: 'Premium Room', price: 6800, quantity: 3, maxGuests: 3, bedType: 'Super King Bed', roomSize: '500 sq.ft',
          amenities: ['Free Wi-Fi', 'Breakfast Included', 'Private Balcony', 'Rain Shower', 'Smart Automation'], breakfast: 'Breakfast Included', cancellationPolicy: 'Free cancellation up to 24h before check-in',
          description: 'High-floor premium accommodation offering ultra-comfortable bedding, automated climate controls, and terrace.',
          images: [
            { label: 'Bedroom', url: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=1000&q=80' },
            { label: 'Bed', url: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1000&q=80' },
            { label: 'Bathroom', url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1000&q=80' },
            { label: 'Balcony', url: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=1000&q=80' },
            { label: 'Interior', url: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=1000&q=80' }
          ]
        }
      ];

      const mappedHotels = apiHotels.map((h) => {
        let roomsList = [];
        if (h.rooms && h.rooms.length > 0) {
          roomsList = h.rooms.map((r, idx) => {
            const presetMatch = DEFAULT_ROOM_PRESETS.find(p => p.type.toLowerCase().includes(r.room_type?.toLowerCase() || '')) || DEFAULT_ROOM_PRESETS[idx % DEFAULT_ROOM_PRESETS.length];
            const exactPrice = r.price_per_night || presetMatch.price;
            
            return {
              id: r.id ? r.id.toString() : `room-${h.id}-${idx}`,
              type: r.room_type || presetMatch.type,
              price: exactPrice,
              quantity: r.quantity || presetMatch.quantity || 5,
              maxGuests: r.max_guests || presetMatch.maxGuests || 2,
              bedType: r.bed_type || presetMatch.bedType || 'King Bed',
              roomSize: r.room_size || presetMatch.roomSize || '350 sq.ft',
              amenities: (r.amenities && r.amenities.length > 0) ? r.amenities : presetMatch.amenities,
              breakfast: r.breakfast_included || presetMatch.breakfast || 'Included',
              cancellationPolicy: r.cancellation_policy || presetMatch.cancellationPolicy || 'Free cancellation',
              description: r.description || presetMatch.description || `${r.room_type || 'Luxury Room'} with premium amenities and scenic views.`,
              images: (r.images && r.images.length > 0) 
                ? r.images.map((img, i) => (typeof img === 'string' ? { label: ['Bedroom', 'Bed', 'Bathroom', 'Balcony', 'Interior'][i % 5], url: img } : img))
                : presetMatch.images
            };
          });
        } else {
          roomsList = DEFAULT_ROOM_PRESETS.map((preset) => ({
            ...preset,
            id: `room-${h.id}-${preset.id}`
          }));
        }

        const hotelRevs = apiAllReviews.filter(r => r.hotel_id === h.id);
        const avg = hotelRevs.length > 0 ? (hotelRevs.reduce((sum, r) => sum + r.rating, 0) / hotelRevs.length).toFixed(1) : 4.8;
        const minPrice = roomsList.length > 0 ? Math.min(...roomsList.map(r => r.price)) : 3000;

        return {
          id: h.id.toString(),
          name: h.name,
          location: h.location || (h.city && h.state ? `${h.city}, ${h.state}` : h.city || h.state || 'India'),
          city: h.city || '',
          state: h.state || '',
          address: h.address || 'Address not provided',
          latitude: typeof h.latitude === 'number' ? h.latitude : 20.5937,
          longitude: typeof h.longitude === 'number' ? h.longitude : 78.9629,
          category: h.property_type || 'Resort',
          property_type: h.property_type || 'Resort',
          star_rating: h.star_rating || '5 Stars',
          status: h.status || 'APPROVED',
          amenities: h.amenities || ['WiFi', 'Parking', 'Room Service', 'Swimming Pool', 'Spa'],
          photos: h.photos && h.photos.length > 0 ? h.photos : ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80'],
          rooms: roomsList,
          roomTypes: roomsList,
          minPrice: minPrice,
          rating: h.star_rating ? (parseFloat(h.star_rating) || avg) : avg,
          reviewCount: hotelRevs.length || 120,
          description: h.description || 'A luxurious property ready to serve you.',
          email: h.email,
          contact_number: h.contact_number || '',
          website: h.website || ''
        };
      });
      
      setReviews(apiAllReviews);
      setHotels(mappedHotels);

      // Auto-sync notifications for pending hotels so admin bell displays the red dot
      apiHotels.forEach(h => {
        if ((h.status || '').toUpperCase() === 'PENDING') {
          const notifId = `pending-hotel-${h.id}`;
          setNotifications(prev => {
            if (prev.some(n => n.id === notifId)) return prev;
            const newItem = {
              id: notifId,
              role: 'admin',
              type: 'hotel_registration',
              title: `🏨 New Hotel Registration: ${h.name}`,
              message: `${h.name} (${h.location || 'India'}) registered and requires verification. Review and approve/reject.`,
              hotelId: h.id,
              hotelName: h.name,
              createdAt: h.created_at || new Date().toISOString(),
              link: '/admin/hotels',
              read: false
            };
            const updated = [newItem, ...prev].slice(0, 50);
            try { localStorage.setItem('hotellead_notifications', JSON.stringify(updated)); } catch(e){}
            return updated;
          });
        }
      });
      
      setLeads(apiLeads.map(l => ({
        ...l,
        id: l.id.toString(),
        customerId: (l.customer_id || l.customerId)?.toString() || '',
        customerEmail: l.customer_email || l.customerEmail || '',
        customerName: l.customer_name || l.customerName || 'Valued Guest',
        customerPhone: l.customer_phone || l.customerPhone || '',
        checkIn: l.check_in || l.checkIn,
        checkOut: l.check_out || l.checkOut,
        roomType: l.room_type || l.roomType,
        destination: l.destination,
        budget: l.budget,
        status: l.status || 'active',
        matchedHotelIds: (l.matched_hotel_ids || l.matchedHotelIds || []).map(id => id.toString()),
        created_at: l.created_at
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
        commissionAmount: b.commission_amount || 0,
        payoutAmount: b.payout_amount || (b.total_price - (b.commission_amount || 0)),
        checkIn: b.check_in || apiLeads.find(l => l.id === b.lead_id)?.check_in,
        checkOut: b.check_out || apiLeads.find(l => l.id === b.lead_id)?.check_out,
        roomType: b.room_type || apiLeads.find(l => l.id === b.lead_id)?.room_type || 'Standard Room',
        hotelName: mappedHotels.find(h => h.id === b.hotel_id?.toString())?.name || 'Hotel',
        customerName: apiLeads.find(l => l.id === b.lead_id)?.customer_name || 'Guest'
      })));

      setTransactions(apiAllTxs.map(tx => ({
        id: tx.id.toString(),
        hotelId: tx.hotel_id.toString(),
        amount: tx.amount,
        type: tx.transaction_type || (tx.amount > 0 ? 'purchase' : 'spend'),
        description: tx.description,
        date: tx.created_at
      })));

    } catch (err) {
      console.error("Failed to load backend data", err);
    }
  }, [user?.id, user?.role]);

  const syncLiveUpdates = useCallback(async () => {
    try {
      if (!user) return;

      let leadsPromise, quotesPromise, bookingsPromise;

      if (user.role === 'customer') {
        leadsPromise = api.getCustomerLeads().catch(() => []);
        quotesPromise = api.getMyQuotes().catch(() => []);
        bookingsPromise = api.getCustomerBookings().catch(() => []);
      } else if (user.role === 'hotel') {
        leadsPromise = api.getAllLeads().catch(() => []);
        quotesPromise = api.getMyQuotes().catch(() => []);
        bookingsPromise = api.getAllBookings().catch(() => []);
      } else {
        leadsPromise = api.getAllLeads().catch(() => []);
        quotesPromise = api.getAllQuotes().catch(() => []);
        bookingsPromise = api.getAllBookings().catch(() => []);
      }

      const [apiLeads, apiQuotes, apiBookings] = await Promise.all([
        leadsPromise,
        quotesPromise,
        bookingsPromise
      ]);

      setLeads(apiLeads.map(l => ({
        ...l,
        id: l.id.toString(),
        customerId: (l.customer_id || l.customerId)?.toString() || '',
        customerEmail: l.customer_email || l.customerEmail || '',
        customerName: l.customer_name || l.customerName || 'Valued Guest',
        customerPhone: l.customer_phone || l.customerPhone || '',
        checkIn: l.check_in || l.checkIn,
        checkOut: l.check_out || l.checkOut,
        roomType: l.room_type || l.roomType,
        destination: l.destination,
        budget: l.budget,
        status: l.status || 'active',
        matchedHotelIds: (l.matched_hotel_ids || l.matchedHotelIds || []).map(id => id.toString())
      })));

      setQuotes(apiQuotes.map(q => ({
        ...q,
        id: q.id.toString(),
        leadId: q.lead_id?.toString(),
        hotelId: q.hotel_id?.toString()
      })));

      setBookings(apiBookings.map(b => ({
        ...b,
        id: b.id.toString(),
        leadId: b.lead_id?.toString(),
        hotelId: b.hotel_id?.toString(),
        customerId: b.customer_id?.toString(),
        qrCode: b.qr_code,
        totalPrice: b.total_price,
        commissionAmount: b.commission_amount || 0,
        payoutAmount: b.payout_amount || (b.total_price - (b.commission_amount || 0)),
        checkIn: b.check_in,
        checkOut: b.check_out,
        roomType: b.room_type || 'Standard Room'
      })));
    } catch (err) {
      // background sync catch
    }
  }, [user?.id, user?.role]);

  useEffect(() => {
    refreshData();
    
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible' && user) {
        syncLiveUpdates();
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [refreshData, syncLiveUpdates, user]);

  const loadWallet = useCallback(async (hotelId) => {
    try {
      const res = await api.getWallet(hotelId);
      setWalletBalances(prev => ({...prev, [hotelId]: res.balance}));
      
      const txs = await api.getTransactions(hotelId);
      const mappedTxs = txs.map(tx => ({
        id: tx.id.toString(),
        hotelId: tx.hotel_id.toString(),
        amount: tx.amount,
        type: tx.amount > 0 ? 'purchase' : 'spend',
        package: tx.description,
        balanceAfter: res.balance,
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
      const activeCustomerId = user?.id ? parseInt(user.id) : (req.customerId ? parseInt(req.customerId) : 1);
      const specificHotelId = req.matchedHotelIds && req.matchedHotelIds.length === 1 
        ? parseInt(req.matchedHotelIds[0]) 
        : (req.specific_hotel_id ? parseInt(req.specific_hotel_id) : null);

      const dbLead = await api.createLead({
        customer_id: activeCustomerId,
        destination: req.destination,
        check_in: req.checkIn,
        check_out: req.checkOut,
        guests: req.guests,
        room_type: req.roomType,
        budget: req.budget,
        purpose: req.purpose || 'Leisure',
        preferences: req.preferences || '',
        specific_hotel_id: specificHotelId
      });
      
      const newLead = {
        ...req,
        id: dbLead.id.toString(),
        customerId: activeCustomerId.toString(),
        matchedHotelIds: (dbLead.matched_hotel_ids || (specificHotelId ? [specificHotelId] : [])).map(id => id.toString()),
        status: dbLead.status || 'active',
        createdAt: new Date().toISOString(),
        customerName: dbLead.customer_name || req.customerName || user?.name || 'Guest User',
        customerPhone: dbLead.customer_phone || req.customerPhone || user?.phone || ''
      };
      
      setLeads(prev => [newLead, ...prev.filter(l => l.id !== newLead.id)]);
      syncLiveUpdates();
      return newLead;
    } catch(err) {
      console.error(err);
      return null;
    }
  }, [user, syncLiveUpdates]);

  const updateLeadDates = useCallback(async (leadId, checkIn, checkOut) => {
    try {
      await api.updateLeadDates(leadId, checkIn, checkOut);
      setLeads(prev => prev.map(l => l.id.toString() === leadId.toString() ? { ...l, checkIn, checkOut } : l));
      setTimeout(() => refreshData(), 300);
      return true;
    } catch (err) {
      console.error("Failed to update dates", err);
      return false;
    }
  }, [refreshData]);

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
      if (hotelId) {
        loadWallet(hotelId);
        loadUnlocks(hotelId);
      }
      setTimeout(() => refreshData(), 300);
      return newQuote;
    } catch(err) {
      console.error(err);
      return null;
    }
  }, [loadWallet, loadUnlocks, refreshData]);

  const counterQuote = useCallback(async (quoteId, newPrice) => {
    try {
      const q = await api.counterQuote(quoteId, newPrice);
      setQuotes(prev => prev.map(old => old.id.toString() === quoteId.toString() ? { ...old, price: q.price, status: 'countered' } : old));
      setTimeout(() => refreshData(), 300);
      return true;
    } catch(err) {
      console.error(err);
      return false;
    }
  }, [refreshData]);

  const acceptQuote = useCallback(async (quoteId, leadId, customerId, customerName, hotelId, hotelName, roomType, checkIn, checkOut, price) => {
    try {
      const activeCustomerId = user?.id ? parseInt(user.id) : (parseInt(customerId) || 1);
      const b = await api.createBooking({
        lead_id: parseInt(leadId),
        customer_id: activeCustomerId,
        hotel_id: parseInt(hotelId),
        total_price: parseInt(price)
      });
      
      setQuotes(prev => prev.map(q => q.id === quoteId.toString() ? { ...q, status: 'accepted' } : q.leadId === leadId.toString() && q.id !== quoteId.toString() ? { ...q, status: 'rejected' } : q));
      setLeads(prev => prev.map(l => l.id === leadId.toString() ? { ...l, status: 'won' } : l));
      
      const newBooking = { ...b, id: b.id.toString(), leadId: leadId.toString(), hotelId: hotelId.toString(), hotelName, customerId: activeCustomerId.toString(), customerName: customerName || user?.name || 'Guest', roomType, checkIn, checkOut, qrCode: b.qr_code, status: b.status };
      setBookings(prev => [newBooking, ...prev]);
      if (hotelId) {
        loadWallet(hotelId);
      }
      setTimeout(() => refreshData(), 300);
      return newBooking;
    } catch(err) {
      console.error(err);
      return null;
    }
  }, [user, loadWallet, refreshData]);

  const getWalletBalance = useCallback((hotelId) => {
    return walletBalances[hotelId] !== undefined ? walletBalances[hotelId] : 0;
  }, [walletBalances]);

  const completeCheckIn = useCallback((bookingId, form) => {
    const newCheckIn = {
      bookingId: bookingId.toString(),
      arrivalTime: form.arrivalTime || '14:00',
      idDocumentUrl: form.idDocumentUrl,
      selectedRoom: form.selectedRoom,
      specialRequests: form.specialRequests,
      accompanyingGuests: form.accompanyingGuests,
      completedAt: new Date().toISOString()
    };
    setCheckins(prev => [...prev.filter(c => c.bookingId !== bookingId.toString()), newCheckIn]);
    setBookings(prev => prev.map(b => b.id.toString() === bookingId.toString() ? { ...b, onlineCheckInCompleted: true, arrivalTime: form.arrivalTime } : b));
  }, []);
  
  const scanQrCheckIn = useCallback(async (qrCode, hotelId) => {
    try {
      const res = await api.scanQrCheckIn(qrCode, hotelId);
      if (res.success && res.booking) {
        setBookings(prev => prev.map(b => b.id.toString() === res.booking.id.toString() ? { ...b, status: 'checked-in' } : b));
        return { success: true, booking: { ...res.booking, id: res.booking.id.toString(), customerName: res.booking.customerName || 'Guest' } };
      }
      return { success: false, error: 'Failed to verify' };
    } catch(err) {
      console.error(err);
      return { success: false, error: err.message };
    }
  }, []);

  const checkOutBooking = useCallback(async (bookingId) => {
    try {
      const res = await api.checkOutBooking(bookingId);
      if (res.success) {
        setBookings(prev => prev.map(b => b.id.toString() === bookingId.toString() ? { ...b, status: 'checked-out' } : b));
        return true;
      }
      return false;
    } catch(err) {
      console.error(err);
      return false;
    }
  }, []);

  const cancelBooking = useCallback(async (bookingId) => {
    try {
      const res = await api.cancelBooking(bookingId);
      if (res.success) {
        setBookings(prev => prev.map(b => b.id.toString() === bookingId.toString() ? { ...b, status: 'cancelled' } : b));
        return true;
      }
      return false;
    } catch(err) {
      console.error(err);
      return false;
    }
  }, []);

  const updateHotelProperty = useCallback(async (hotelId, data) => {
    try {
      const updated = await api.updateHotel(hotelId, data);
      setHotels(prev => prev.map(h => h.id.toString() === hotelId.toString() ? { ...h, ...updated, id: h.id } : h));
      await refreshData();
      return true;
    } catch(err) {
      console.error(err);
      return false;
    }
  }, [refreshData]);

  const createHotelRoom = useCallback(async (hotelId, roomData) => {
    try {
      await api.createRoom(hotelId, roomData);
      await refreshData();
      return true;
    } catch(err) {
      console.error("Failed to create room:", err);
      return false;
    }
  }, [refreshData]);

  const updateHotelRoom = useCallback(async (roomId, roomData) => {
    try {
      await api.updateRoom(roomId, roomData);
      await refreshData();
      return true;
    } catch(err) {
      console.error("Failed to update room:", err);
      return false;
    }
  }, [refreshData]);

  const deleteHotelRoom = useCallback(async (roomId) => {
    try {
      await api.deleteRoom(roomId);
      await refreshData();
      return true;
    } catch(err) {
      console.error("Failed to delete room:", err);
      return false;
    }
  }, [refreshData]);
  
  const rateBooking = useCallback(async (bookingId, rating, comment = "") => {
    try {
      const booking = bookings.find(b => b.id.toString() === bookingId.toString());
      if (!booking) return false;
      
      const newReview = await api.createReview({
        booking_id: parseInt(bookingId),
        hotel_id: parseInt(booking.hotelId),
        customer_id: parseInt(booking.customerId || (user?.id ? user.id : 1)),
        rating: rating,
        comment: comment
      });
      
      setReviews(prev => [...prev, newReview]);
      setBookings(prev => prev.map(b => b.id.toString() === bookingId.toString() ? { ...b, rating: rating } : b));
      return true;
    } catch(err) {
      console.error(err);
      return false;
    }
  }, [bookings, user]);

  const purchaseCredits = useCallback(async (hotelId, amount, packageName) => {
    try {
      const res = await api.purchaseCredits(hotelId, amount, packageName);
      setWalletBalances(prev => ({...prev, [hotelId]: res.balance}));
      await loadWallet(hotelId);
      return true;
    } catch(err) {
      console.error("Failed to purchase credits:", err);
      return false;
    }
  }, [loadWallet]);

  const openChat = useCallback((chatData) => {
    setGlobalChat(chatData);
  }, []);

  const closeChat = useCallback(() => {
    setGlobalChat(null);
  }, []);

  const addNotification = useCallback((notif) => {
    setNotifications(prev => {
      if (notif.id && prev.some(n => n.id === notif.id)) return prev;
      const newItem = {
        id: notif.id || `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        read: false,
        createdAt: notif.createdAt || new Date().toISOString(),
        ...notif
      };
      const updated = [newItem, ...prev].slice(0, 50);
      try {
        localStorage.setItem('hotellead_notifications', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  }, []);

  const markNotificationsRead = useCallback((userId, role) => {
    setNotifications(prev => {
      const updated = prev.map(n => {
        if (role === 'admin' && n.role === 'admin') return { ...n, read: true };
        if (role && n.role === role) return { ...n, read: true };
        if (!userId || n.userId?.toString() === userId?.toString()) return { ...n, read: true };
        return n;
      });
      try {
        localStorage.setItem('hotellead_notifications', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  }, []);

  const markSingleNotificationRead = useCallback((notifId) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === notifId ? { ...n, read: true } : n);
      try {
        localStorage.setItem('hotellead_notifications', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  }, []);

  const clearNotifications = useCallback((userId, role) => {
    setNotifications(prev => {
      const updated = prev.filter(n => {
        if (role === 'admin' && n.role === 'admin') return false;
        if (role && n.role === role) return false;
        if (userId && n.userId?.toString() === userId?.toString()) return false;
        if (!userId && !role) return false;
        return true;
      });
      try {
        localStorage.setItem('hotellead_notifications', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  }, []);

  const hasUnreadMessagesForLead = useCallback((leadId) => {
    if (!leadId) return false;
    return notifications.some(n => 
      !n.read && 
      (n.type === 'message' || n.type === 'quote') && 
      n.leadId?.toString() === leadId.toString()
    );
  }, [notifications]);

  const addMockHotel = () => {};

  return (
    <AppContext.Provider value={{
      leads, hotels, unlocks, quotes, bookings, checkins, wallets, transactions, notifications, reviews,
      wishlist, toggleWishlist, isWishlisted,
      submitRequirement, updateLeadDates, unlockLead, isLeadUnlocked, sendQuote, acceptQuote, counterQuote,
      completeCheckIn, scanQrCheckIn, checkOutBooking, cancelBooking, updateHotelProperty, createHotelRoom, updateHotelRoom, deleteHotelRoom, rateBooking, purchaseCredits, getWalletBalance,
      addNotification, markNotificationsRead, markSingleNotificationRead, clearNotifications, hasUnreadMessagesForLead, globalChat, openChat, closeChat,
      addMockHotel, loadWallet, loadUnlocks, refreshData
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
