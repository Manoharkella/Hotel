import { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useNavigate } from 'react-router-dom';

export default function HotelRoomCalendar() {
  const { user } = useAuth();
  const { hotels, bookings, setBookings } = useApp();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const hotelId = (user?.hotelId || user?.id) ? (user.hotelId || user.id).toString() : null;
  const hotelData = hotels.find(h => h.id?.toString() === hotelId);

  // --- CALENDAR DATE STATE ---
  const today = useMemo(() => new Date(), []);
  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(new Date(today.getFullYear(), today.getMonth(), today.getDate()));
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [selectedBookedRoom, setSelectedBookedRoom] = useState(null);
  const [newBookingRoom, setNewBookingRoom] = useState(null);

  // New Booking Form state
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [numGuests, setNumGuests] = useState(2);
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('Paid in Full (Online / UPI)');
  const [bookingNotes, setBookingNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper to format Date object into local 'YYYY-MM-DD'
  const formatLocalDate = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // --- DYNAMIC ROOM UNITS GENERATOR ---
  // Generates room units strictly from the hotel's configured roomTypes
  const hotelRooms = useMemo(() => {
    const categories = (hotelData?.roomTypes && hotelData.roomTypes.length > 0)
      ? hotelData.roomTypes
      : (hotelData?.rooms && hotelData.rooms.length > 0)
        ? hotelData.rooms
        : [
            { type: 'Deluxe Room', price: 3500, quantity: 5 },
            { type: 'Executive Suite', price: 6500, quantity: 5 }
          ];

    const roomsList = [];
    let floorNum = 1;

    categories.forEach((cat, cIdx) => {
      const qty = cat.quantity || 5;
      const typeName = cat.type || cat.room_type || `Category ${cIdx + 1}`;
      const price = cat.price || cat.price_per_night || 25000;
      const lower = typeName.toLowerCase();
      const isVilla = lower.includes('villa');
      const isSuite = lower.includes('suite');
      const prefix = isVilla ? 'Villa' : isSuite ? 'Suite' : 'Room';
      const floorLabel = isVilla ? 'Beachfront Wing' : isSuite ? `Level ${floorNum} (Panoramic)` : `Floor ${floorNum}`;
      const icon = isVilla ? '🏖️' : isSuite ? '👑' : '🛏️';
      const features = cat.bedType ? `${cat.bedType} • ${cat.roomSize || 'Luxury'}` : 'Private Balcony • King Bed • High-Speed Wi-Fi';

      for (let i = 1; i <= qty; i++) {
        const roomNum = `${floorNum}0${i}`;
        roomsList.push({
          id: `RM-${floorNum}0${i}`,
          number: `${prefix} ${roomNum}`,
          category: typeName,
          floor: floorLabel,
          price: price,
          icon: icon,
          features: features
        });
      }
      floorNum++;
    });

    return roomsList;
  }, [hotelData]);

  // --- REAL BOOKINGS ONLY (AUTO-PURGE DUMMY DATA) ---
  const [customBookings, setCustomBookings] = useState(() => {
    try {
      const storageKey = `hotel_calendar_bookings_${hotelId}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Permanently filter out any fake seeded entries
        const clean = parsed.filter(b => 
          b.customerName !== 'Arjun Verma' && 
          b.customerName !== 'Priya Sharma' &&
          b.id !== 'BK-VIZ-8041' && 
          b.id !== 'BK-VIZ-7920'
        );
        return clean;
      }
    } catch (e) {}
    return [];
  });

  // Keep customBookings saved in localStorage and auto-purge dummy keys
  useEffect(() => {
    try {
      const storageKey = `hotel_calendar_bookings_${hotelId}`;
      const clean = customBookings.filter(b => 
        b.customerName !== 'Arjun Verma' && 
        b.customerName !== 'Priya Sharma' &&
        b.id !== 'BK-VIZ-8041' && 
        b.id !== 'BK-VIZ-7920'
      );
      localStorage.setItem(storageKey, JSON.stringify(clean));
    } catch (e) {}
  }, [customBookings, hotelId]);

  // Reset/Clear all front-desk bookings to return to 100% empty state
  const handleResetToEmpty = () => {
    try {
      localStorage.removeItem(`hotel_calendar_bookings_${hotelId}`);
    } catch (e) {}
    setCustomBookings([]);
    addToast('Calendar reset: All rooms are now vacant and empty.', 'success');
  };

  // Combine AppContext real bookings with custom front-desk bookings (ZERO DUMMY DATA)
  const allActiveBookings = useMemo(() => {
    const appContextHotelBookings = (bookings || []).filter(b => 
      b.hotelId?.toString() === hotelId.toString() ||
      (hotelId === '11' && (b.hotelName?.toLowerCase().includes('radisson') || b.hotelId?.toString() === '11'))
    ).filter(b => 
      b.customerName !== 'Arjun Verma' && 
      b.customerName !== 'Priya Sharma' &&
      b.id !== 'BK-VIZ-8041' &&
      b.id !== 'BK-VIZ-7920'
    ).map((b, idx) => {
      let rNum = b.roomNumber;
      if (!rNum) {
        const matchingRooms = hotelRooms.filter(rm => rm.category.toLowerCase() === (b.roomType || '').toLowerCase());
        rNum = matchingRooms[idx % (matchingRooms.length || 1)]?.number || hotelRooms[idx % (hotelRooms.length || 1)]?.number || `Room 10${idx + 1}`;
      }
      return {
        id: b.id || `BK-${hotelId}-${idx}`,
        hotelId: hotelId,
        roomNumber: rNum,
        roomType: b.roomType || hotelRooms[0]?.category || 'Room',
        customerName: b.customerName || 'Direct Guest',
        contactPhone: b.contactPhone || '+91 98000 00000',
        contactEmail: b.contactEmail || 'guest@example.com',
        guests: b.guests || 2,
        checkIn: (b.checkIn || '').split('T')[0],
        checkOut: (b.checkOut || '').split('T')[0],
        totalPrice: b.totalPrice || 0,
        status: b.status || 'confirmed',
        paymentStatus: b.paymentStatus || 'Paid',
        notes: b.notes || 'Platform reservation'
      };
    });

    const combined = [...customBookings];
    appContextHotelBookings.forEach(ab => {
      if (!combined.some(cb => cb.id === ab.id)) {
        combined.push(ab);
      }
    });

    return combined;
  }, [customBookings, bookings, hotelId, hotelRooms]);

  // Helper: check if a room is booked on a specific date (YYYY-MM-DD string)
  const getBookingForRoomOnDate = (roomNumber, dateObj) => {
    const targetDateStr = formatLocalDate(dateObj);
    return allActiveBookings.find(b => {
      if (b.roomNumber !== roomNumber) return false;
      if (!b.checkIn || !b.checkOut) return false;
      const checkInStr = b.checkIn.split('T')[0];
      const checkOutStr = b.checkOut.split('T')[0];
      return targetDateStr >= checkInStr && targetDateStr < checkOutStr;
    });
  };

  // Helper: count bookings for an entire date across all rooms
  const getDayAvailabilityStats = (dateObj) => {
    const targetDateStr = formatLocalDate(dateObj);
    let bookedCount = 0;
    hotelRooms.forEach(rm => {
      const isBooked = allActiveBookings.some(b => {
        if (b.roomNumber !== rm.number) return false;
        if (!b.checkIn || !b.checkOut) return false;
        const checkInStr = b.checkIn.split('T')[0];
        const checkOutStr = b.checkOut.split('T')[0];
        return targetDateStr >= checkInStr && targetDateStr < checkOutStr;
      });
      if (isBooked) bookedCount++;
    });
    return {
      total: hotelRooms.length,
      booked: bookedCount,
      available: Math.max(0, hotelRooms.length - bookedCount)
    };
  };

  // --- MONTHLY CALENDAR GRID BUILDER ---
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    // Shift to Monday-first: Monday=0, ..., Sunday=6
    const startPadding = (firstDayIndex + 6) % 7;

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const days = [];

    // Previous month padding
    for (let i = startPadding - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthDays - i);
      days.push({ date: d, isCurrentMonth: false, dayNum: prevMonthDays - i });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      const isToday = d.toDateString() === today.toDateString();
      const isSelected = d.toDateString() === selectedDate.toDateString();
      const stats = getDayAvailabilityStats(d);
      days.push({ date: d, isCurrentMonth: true, dayNum: i, isToday, isSelected, stats });
    }

    // Next month padding to fill grid
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({ date: d, isCurrentMonth: false, dayNum: i });
    }

    return days;
  }, [currentMonth, selectedDate, today, allActiveBookings, hotelRooms]);

  // Selected date stats
  const selectedDateStats = useMemo(() => {
    return getDayAvailabilityStats(selectedDate);
  }, [selectedDate, allActiveBookings, hotelRooms]);

  // Rooms with status for selected date
  const roomsWithStatus = useMemo(() => {
    return hotelRooms.map(rm => {
      const booking = getBookingForRoomOnDate(rm.number, selectedDate);
      return {
        ...rm,
        isBooked: !!booking,
        booking: booking || null
      };
    }).filter(rm => {
      const matchCat = selectedCategory === 'all' || rm.category === selectedCategory;
      const matchSearch = !searchQuery.trim() || 
        rm.number.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (rm.booking && rm.booking.customerName.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [hotelRooms, selectedDate, allActiveBookings, selectedCategory, searchQuery]);

  // Group rooms by Category
  const groupedRooms = useMemo(() => {
    const groups = {};
    roomsWithStatus.forEach(rm => {
      if (!groups[rm.category]) {
        groups[rm.category] = {
          categoryName: rm.category,
          floorName: rm.floor,
          price: rm.price,
          icon: rm.icon,
          rooms: []
        };
      }
      groups[rm.category].rooms.push(rm);
    });
    return Object.values(groups);
  }, [roomsWithStatus]);

  // Month Navigation
  const handlePrevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };
  const handleNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };
  const handleJumpToday = () => {
    const now = new Date();
    setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDate(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
  };

  // Open Room Modals
  const handleRoomClick = (room) => {
    if (room.isBooked) {
      setSelectedBookedRoom(room);
    } else {
      setNewBookingRoom(room);
      const selStr = formatLocalDate(selectedDate);
      const nextDay = new Date(selectedDate);
      nextDay.setDate(nextDay.getDate() + 1);
      const nextStr = formatLocalDate(nextDay);
      
      setCheckInDate(selStr);
      setCheckOutDate(nextStr);
      setGuestName('');
      setGuestPhone('');
      setGuestEmail('');
      setNumGuests(2);
      setPaymentStatus('Paid in Full (Online / UPI)');
      setBookingNotes('');
    }
  };

  // Handle Submit New Booking
  const handleCreateBookingSubmit = (e) => {
    e.preventDefault();
    if (!guestName.trim()) {
      addToast('Please enter the guest full name.', 'error');
      return;
    }
    if (!checkInDate || !checkOutDate) {
      addToast('Please specify valid check-in and check-out dates.', 'error');
      return;
    }
    if (checkOutDate <= checkInDate) {
      addToast('Check-out date must be after check-in date.', 'error');
      return;
    }

    setIsSubmitting(true);

    const nights = Math.max(1, Math.round((new Date(checkOutDate) - new Date(checkInDate)) / (1000 * 60 * 60 * 24)));
    const totalPrice = nights * newBookingRoom.price;
    const newId = `BK-${hotelId}-${Date.now().toString().slice(-4)}`;

    const newBookingObj = {
      id: newId,
      hotelId: hotelId,
      roomNumber: newBookingRoom.number,
      roomType: newBookingRoom.category,
      customerName: guestName.trim(),
      contactPhone: guestPhone.trim() || '+91 98000 12345',
      contactEmail: guestEmail.trim() || `${guestName.toLowerCase().replace(/\s+/g, '')}@example.com`,
      guests: Number(numGuests),
      checkIn: checkInDate,
      checkOut: checkOutDate,
      totalPrice: totalPrice,
      status: 'confirmed',
      paymentStatus: paymentStatus,
      notes: bookingNotes.trim() || 'Direct Front Desk Reservation'
    };

    setCustomBookings(prev => [newBookingObj, ...prev]);
    if (setBookings) {
      setBookings(prev => [newBookingObj, ...prev]);
    }

    setIsSubmitting(false);
    setNewBookingRoom(null);
    addToast(`Room ${newBookingRoom.number} booked successfully for ${guestName}!`, 'success');
  };

  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const selectedDateFormatted = selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
  const uniqueCategories = Array.from(new Set(hotelRooms.map(r => r.category)));

  return (
    <div className="room-calendar-page fade-in" style={{ maxWidth: 1200, margin: '0 auto' }}>
      
      {/* 1. CLEAN & SIMPLE TOP HEADER */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 20,
        paddingBottom: 16,
        borderBottom: '1px solid var(--border-light)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--primary)', letterSpacing: '-0.02em' }}>
              Room Availability Calendar
            </h1>
            <span style={{ 
              fontSize: '0.74rem', 
              fontWeight: 700, 
              padding: '2px 8px', 
              borderRadius: '6px', 
              background: '#ecfdf5', 
              color: '#059669', 
              border: '1px solid #a7f3d0' 
            }}>
              {hotelData?.name || 'Radisson Blu Resort Vizag'}
            </span>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
            Select any date on the calendar to view and manage available or booked rooms.
          </p>
        </div>

        {/* Legend & Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: 'white',
            padding: '6px 14px',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            fontSize: '0.82rem',
            fontWeight: 600
          }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#059669' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }}></span>
              🟢 Available (Empty)
            </span>
            <span style={{ color: '#CBD5E1' }}>|</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#DC2626' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444' }}></span>
              🔴 Booked
            </span>
          </div>

          <button 
            className="btn btn-sm btn-outline"
            onClick={() => navigate('/hotel/bookings')}
            style={{ fontWeight: 600, fontSize: '0.82rem' }}
          >
            📋 Bookings Ledger
          </button>

          {customBookings.length > 0 && (
            <button 
              className="btn btn-sm"
              onClick={handleResetToEmpty}
              title="Clear all manual test bookings"
              style={{
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                color: '#DC2626',
                fontSize: '0.8rem',
                fontWeight: 600
              }}
            >
              🧹 Reset to Empty
            </button>
          )}
        </div>
      </div>

      {/* 2. SIMPLE & CLEAN MONTHLY CALENDAR CARD */}
      <div style={{
        background: 'white',
        borderRadius: '14px',
        border: '1px solid var(--border)',
        padding: '18px 20px',
        marginBottom: 22,
        boxShadow: '0 1px 4px rgba(0,0,0,0.03)'
      }}>
        {/* Month Navigation Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--primary)' }}>
              {monthName}
            </h2>
            <div style={{ display: 'inline-flex', gap: 4 }}>
              <button 
                onClick={handlePrevMonth}
                style={{
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  width: 28,
                  height: 28,
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontWeight: 700,
                  color: 'var(--text)'
                }}
                title="Previous month"
              >
                ‹
              </button>
              <button 
                onClick={handleNextMonth}
                style={{
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  width: 28,
                  height: 28,
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontWeight: 700,
                  color: 'var(--text)'
                }}
                title="Next month"
              >
                ›
              </button>
            </div>
            <button 
              onClick={handleJumpToday}
              style={{
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                padding: '3px 10px',
                borderRadius: '6px',
                fontSize: '0.76rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              Today
            </button>
          </div>

          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Selected Date: <strong style={{ color: 'var(--primary)' }}>{selectedDateFormatted}</strong>
          </div>
        </div>

        {/* Days of Week Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          textAlign: 'center',
          fontSize: '0.74rem',
          fontWeight: 700,
          color: 'var(--text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          paddingBottom: 8,
          borderBottom: '1px solid var(--border-light)'
        }}>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
          <div>Sun</div>
        </div>

        {/* 7-Column Calendar Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 6,
          marginTop: 8
        }}>
          {calendarDays.map((day, idx) => {
            if (!day.isCurrentMonth) {
              return (
                <div 
                  key={idx}
                  style={{
                    minHeight: 58,
                    padding: '6px 8px',
                    borderRadius: '8px',
                    background: 'var(--bg)',
                    opacity: 0.35,
                    fontSize: '0.82rem',
                    color: 'var(--text-muted)'
                  }}
                >
                  {day.dayNum}
                </div>
              );
            }

            const hasBookings = day.stats.booked > 0;

            return (
              <div
                key={idx}
                onClick={() => setSelectedDate(day.date)}
                style={{
                  minHeight: 58,
                  padding: '6px 8px',
                  borderRadius: '8px',
                  border: day.isSelected ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                  background: day.isSelected 
                    ? '#eff6ff' 
                    : hasBookings 
                      ? '#fef2f2' 
                      : '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all 0.15s ease',
                  boxShadow: day.isSelected ? '0 2px 8px rgba(37,99,235,0.15)' : 'none'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ 
                    fontSize: '0.88rem', 
                    fontWeight: day.isSelected ? 800 : 700,
                    color: day.isSelected ? 'var(--primary)' : 'var(--text)'
                  }}>
                    {day.dayNum}
                  </span>
                  {day.isToday && (
                    <span style={{ 
                      fontSize: '0.6rem', 
                      background: '#3B82F6', 
                      color: 'white', 
                      padding: '1px 4px', 
                      borderRadius: '4px', 
                      fontWeight: 800 
                    }}>
                      TODAY
                    </span>
                  )}
                </div>

                <div style={{ fontSize: '0.7rem', fontWeight: 600 }}>
                  {hasBookings ? (
                    <span style={{ color: '#DC2626' }}>🔴 {day.stats.booked} Booked</span>
                  ) : (
                    <span style={{ color: '#059669' }}>🟢 {day.stats.available} Empty</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. CLEAN ROOM AVAILABILITY MATRIX HEADER */}
      <div style={{
        background: 'white',
        borderRadius: '14px 14px 0 0',
        border: '1px solid var(--border)',
        borderBottom: 'none',
        padding: '18px 22px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16
      }}>
        {/* Date & Occupancy Counts */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--primary)' }}>
              {selectedDateFormatted}
            </h2>
            <span style={{ 
              fontSize: '0.74rem', 
              fontWeight: 700, 
              padding: '2px 8px', 
              borderRadius: '6px', 
              background: selectedDateStats.booked === 0 ? '#ecfdf5' : '#fef2f2',
              color: selectedDateStats.booked === 0 ? '#059669' : '#dc2626'
            }}>
              {selectedDateStats.booked === 0 ? '✓ 100% Vacant' : `${selectedDateStats.booked} Occupied`}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 14, fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            <span>Total: <strong>{selectedDateStats.total} Rooms</strong></span>
            <span>•</span>
            <span style={{ color: '#059669' }}>🟢 Available: <strong>{selectedDateStats.available} Empty</strong></span>
            <span>•</span>
            <span style={{ color: selectedDateStats.booked > 0 ? '#DC2626' : 'var(--text-secondary)' }}>
              🔴 Booked: <strong>{selectedDateStats.booked}</strong>
            </span>
            <span>•</span>
            <span>Occupancy: <strong>{Math.round((selectedDateStats.booked / (selectedDateStats.total || 1)) * 100)}%</strong></span>
          </div>
        </div>

        {/* Filter Pills & Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', background: 'var(--bg)', padding: 3, borderRadius: 8, gap: 2 }}>
            <button
              onClick={() => setSelectedCategory('all')}
              style={{
                border: 'none',
                background: selectedCategory === 'all' ? 'white' : 'transparent',
                color: selectedCategory === 'all' ? 'var(--primary)' : 'var(--text-secondary)',
                fontWeight: selectedCategory === 'all' ? 700 : 500,
                fontSize: '0.78rem',
                padding: '6px 12px',
                borderRadius: 6,
                cursor: 'pointer',
                boxShadow: selectedCategory === 'all' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              All ({hotelRooms.length})
            </button>
            {uniqueCategories.map(cat => {
              const count = hotelRooms.filter(r => r.category === cat).length;
              const isSel = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    border: 'none',
                    background: isSel ? 'white' : 'transparent',
                    color: isSel ? 'var(--primary)' : 'var(--text-secondary)',
                    fontWeight: isSel ? 700 : 500,
                    fontSize: '0.78rem',
                    padding: '6px 12px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    boxShadow: isSel ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
                  }}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>

          <input 
            type="text" 
            placeholder="Search room..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              fontSize: '0.8rem',
              width: 140
            }}
          />
        </div>
      </div>

      {/* 4. BUS-SEAT ROOM GRID CONTAINER */}
      <div style={{
        background: 'white',
        borderRadius: '0 0 14px 14px',
        border: '1px solid var(--border)',
        padding: '20px 22px',
        marginBottom: 32,
        boxShadow: '0 1px 4px rgba(0,0,0,0.03)'
      }}>
        {groupedRooms.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
            <p>No rooms match your filter criteria.</p>
            <button className="btn btn-sm btn-outline" onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}>
              Reset Filters
            </button>
          </div>
        ) : (
          groupedRooms.map((group, gIdx) => {
            const availCount = group.rooms.filter(r => !r.isBooked).length;

            return (
              <div key={gIdx} style={{ marginBottom: gIdx === groupedRooms.length - 1 ? 0 : 24 }}>
                {/* Category Header Bar */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  background: 'var(--bg)',
                  borderRadius: '10px',
                  marginBottom: 12,
                  border: '1px solid var(--border-light)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '1.2rem' }}>{group.icon}</span>
                    <strong style={{ fontSize: '0.98rem', color: 'var(--primary)' }}>{group.categoryName}</strong>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>• {group.floorName}</span>
                    <span style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 700 }}>• ₹{group.price.toLocaleString('en-IN')} / night</span>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: availCount === group.rooms.length ? '#059669' : 'var(--text-secondary)', fontWeight: 600 }}>
                    {availCount} of {group.rooms.length} rooms empty & available
                  </div>
                </div>

                {/* 5-Column Bus-Seat Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: 12
                }}>
                  {group.rooms.map(room => {
                    const isBooked = room.isBooked;

                    return (
                      <div 
                        key={room.id}
                        onClick={() => handleRoomClick(room)}
                        style={{
                          background: isBooked ? '#fef2f2' : '#f0fdf4',
                          border: isBooked ? '1.5px solid #f87171' : '1.5px solid #86efac',
                          borderRadius: '10px',
                          padding: '14px',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          minHeight: 120,
                          transition: 'all 0.15s ease'
                        }}
                        title={isBooked ? `Booked by ${room.booking.customerName} - Click to view details` : 'Vacant - Click to book room'}
                      >
                        {/* Top: Room Number & Status Pill */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--primary)' }}>
                              {room.number}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                              ₹{room.price.toLocaleString('en-IN')} / night
                            </div>
                          </div>

                          <span style={{
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: isBooked ? '#EF4444' : '#10B981',
                            color: 'white',
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em'
                          }}>
                            {isBooked ? 'BOOKED' : 'EMPTY'}
                          </span>
                        </div>

                        {/* Middle: Features or Guest Name */}
                        <div style={{ margin: '8px 0', fontSize: '0.74rem' }}>
                          {isBooked ? (
                            <div style={{ fontWeight: 700, color: '#DC2626', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              👤 {room.booking.customerName}
                            </div>
                          ) : (
                            <div style={{ color: 'var(--text-secondary)' }}>
                              {room.features}
                            </div>
                          )}
                        </div>

                        {/* Bottom: Action hint */}
                        <div style={{
                          borderTop: isBooked ? '1px solid #fecaca' : '1px solid #bbf7d0',
                          paddingTop: 8,
                          fontSize: '0.74rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <span style={{ fontWeight: 700, color: isBooked ? '#DC2626' : '#059669' }}>
                            {isBooked ? 'Inspect Folio' : '+ Reserve Room'}
                          </span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                            {isBooked ? 'Details →' : 'Vacant'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 5. GUEST DOSSIER MODAL (WHEN CLICKING BOOKED ROOM) */}
      {selectedBookedRoom && (
        <div className="modal-overlay" onClick={() => setSelectedBookedRoom(null)}>
          <div className="modal" style={{ maxWidth: 540, padding: '24px 28px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
              <div>
                <span style={{ background: '#EF4444', color: 'white', fontSize: '0.68rem', fontWeight: 800, padding: '2px 8px', borderRadius: 4 }}>
                  BOOKED ROOM
                </span>
                <h2 style={{ margin: '6px 0 0 0', fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary)' }}>
                  {selectedBookedRoom.number} — {selectedBookedRoom.category}
                </h2>
              </div>
              <button onClick={() => setSelectedBookedRoom(null)} style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ background: 'var(--bg)', padding: '14px 16px', borderRadius: 10, marginBottom: 16 }}>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>Guest Information</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)', marginTop: 4 }}>
                {selectedBookedRoom.booking?.customerName}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                📞 {selectedBookedRoom.booking?.contactPhone} &nbsp;|&nbsp; ✉️ {selectedBookedRoom.booking?.contactEmail}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18, fontSize: '0.84rem' }}>
              <div style={{ background: 'var(--bg)', padding: 10, borderRadius: 8 }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block' }}>Check-In</span>
                <strong>📅 {selectedBookedRoom.booking?.checkIn}</strong>
              </div>
              <div style={{ background: 'var(--bg)', padding: 10, borderRadius: 8 }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block' }}>Check-Out</span>
                <strong>📅 {selectedBookedRoom.booking?.checkOut}</strong>
              </div>
              <div style={{ background: 'var(--bg)', padding: 10, borderRadius: 8 }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block' }}>Guests</span>
                <strong>👥 {selectedBookedRoom.booking?.guests} Guests</strong>
              </div>
              <div style={{ background: 'var(--bg)', padding: 10, borderRadius: 8 }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block' }}>Total Paid</span>
                <strong style={{ color: '#059669' }}>₹{selectedBookedRoom.booking?.totalPrice?.toLocaleString('en-IN')}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button 
                className="btn btn-sm"
                style={{ background: '#0F172A', color: 'white' }}
                onClick={() => {
                  addToast(`Folio printed for ${selectedBookedRoom.number}`, 'success');
                  setSelectedBookedRoom(null);
                }}
              >
                🖨️ Print Slip
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedBookedRoom(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. NEW BOOKING CREATION MODAL (WHEN CLICKING EMPTY ROOM) */}
      {newBookingRoom && (
        <div className="modal-overlay" onClick={() => setNewBookingRoom(null)}>
          <div className="modal" style={{ maxWidth: 500, padding: '24px 28px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <span style={{ background: '#10B981', color: 'white', fontSize: '0.68rem', fontWeight: 800, padding: '2px 8px', borderRadius: 4 }}>
                  NEW RESERVATION
                </span>
                <h2 style={{ margin: '4px 0 0 0', fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary)' }}>
                  Reserve {newBookingRoom.number}
                </h2>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  {newBookingRoom.category} • ₹{newBookingRoom.price.toLocaleString('en-IN')} / night
                </div>
              </div>
              <button onClick={() => setNewBookingRoom(null)} style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleCreateBookingSubmit}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Guest Full Name *
                </label>
                <input 
                  type="text"
                  className="form-input"
                  placeholder="e.g. Ramesh Chandra"
                  value={guestName}
                  onChange={e => setGuestName(e.target.value)}
                  required
                  style={{ padding: '8px 12px', fontSize: '0.88rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
                    Contact Phone
                  </label>
                  <input 
                    type="tel"
                    className="form-input"
                    placeholder="+91 98765 00000"
                    value={guestPhone}
                    onChange={e => setGuestPhone(e.target.value)}
                    style={{ padding: '8px 12px', fontSize: '0.88rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
                    Guests
                  </label>
                  <select 
                    className="form-input"
                    value={numGuests}
                    onChange={e => setNumGuests(Number(e.target.value))}
                    style={{ padding: '8px 12px', fontSize: '0.88rem' }}
                  >
                    <option value={1}>1 Guest</option>
                    <option value={2}>2 Guests</option>
                    <option value={3}>3 Guests</option>
                    <option value={4}>4 Guests</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
                    Check-In Date
                  </label>
                  <input 
                    type="date"
                    className="form-input"
                    value={checkInDate}
                    onChange={e => setCheckInDate(e.target.value)}
                    required
                    style={{ padding: '8px 12px', fontSize: '0.88rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
                    Check-Out Date
                  </label>
                  <input 
                    type="date"
                    className="form-input"
                    value={checkOutDate}
                    onChange={e => setCheckOutDate(e.target.value)}
                    required
                    style={{ padding: '8px 12px', fontSize: '0.88rem' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Payment Method
                </label>
                <select 
                  className="form-input"
                  value={paymentStatus}
                  onChange={e => setPaymentStatus(e.target.value)}
                  style={{ padding: '8px 12px', fontSize: '0.88rem' }}
                >
                  <option value="Paid in Full (Online / UPI)">Paid in Full (Online / UPI)</option>
                  <option value="Pay at Hotel Desk on Arrival">Pay at Hotel Desk on Arrival</option>
                  <option value="Corporate Billing">Corporate Billing</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  style={{ flex: 1 }}
                  onClick={() => setNewBookingRoom(null)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn" 
                  disabled={isSubmitting}
                  style={{
                    flex: 2,
                    background: 'linear-gradient(135deg, #059669, #10B981)',
                    color: 'white',
                    fontWeight: 700,
                    border: 'none'
                  }}
                >
                  {isSubmitting ? 'Confirming...' : 'Lock Room & Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
