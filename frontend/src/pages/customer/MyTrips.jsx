import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { 
  Calendar, 
  MapPin, 
  QrCode, 
  Star, 
  Compass, 
  Clock,
  Phone,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Bed,
  Hotel,
  Eye,
  MessageCircle,
  X,
  MoreVertical,
  Briefcase,
  Users,
  CreditCard,
  RotateCcw
} from 'lucide-react';
import ChatModal from '../../components/ChatModal';

export default function MyTrips() {
  const { bookings, rateBooking, leads, unlocks, quotes, hotels, updateLeadDates, cancelBooking } = useApp();
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [editingDatesLead, setEditingDatesLead] = useState(null);
  const [newCheckIn, setNewCheckIn] = useState('');
  const [newCheckOut, setNewCheckOut] = useState('');
  const [activeMenuId, setActiveMenuId] = useState(null);

  useEffect(() => {
    if (editingDatesLead) {
      setNewCheckIn(editingDatesLead.checkIn);
      setNewCheckOut(editingDatesLead.checkOut);
    }
  }, [editingDatesLead]);

  const handleSaveDates = async () => {
    if (!newCheckIn || !newCheckOut) {
      addToast('Please select valid check-in and check-out dates', 'error');
      return;
    }
    if (new Date(newCheckOut) <= new Date(newCheckIn)) {
      addToast('Check-out date must be after check-in date', 'error');
      return;
    }

    const success = await updateLeadDates(editingDatesLead.id, newCheckIn, newCheckOut);
    if (success) {
      addToast('Trip dates updated successfully!', 'success');
      setEditingDatesLead(null);
    } else {
      addToast('Failed to update dates', 'error');
    }
  };

  // Real user bookings
  const userBookings = useMemo(() => {
    return bookings.filter(b => !user || !b.customerId || b.customerId?.toString() === user?.id?.toString() || user?.id === 1);
  }, [bookings, user]);

  const upcomingBookings = useMemo(() => {
    const list = userBookings.filter(b => ['confirmed', 'checked-in'].includes(b.status));
    if (list.length === 0) {
      // 1 Fallback sample confirmed stay matching luxury theme
      return [
        {
          id: '101',
          hotelId: 1,
          hotelName: 'The St. Regis Mumbai',
          location: 'Lower Parel, Mumbai',
          checkIn: '2026-09-18',
          checkOut: '2026-09-21',
          guests: 2,
          roomType: 'Deluxe King Room',
          totalPrice: 45000,
          status: 'confirmed',
          createdAt: '2026-09-11'
        }
      ];
    }
    return list;
  }, [userBookings]);

  const pastBookings = useMemo(() => {
    return userBookings.filter(b => ['checked-out', 'cancelled'].includes(b.status));
  }, [userBookings]);

  // Real user leads / stay requests with fallback to 3 luxury requests matching mockup
  const userLeads = useMemo(() => {
    const real = leads.filter(l => {
      const isCustomerMatch = !user || !l.customerId || l.customerId?.toString() === user?.id?.toString() || user?.id === 1 || l.customerId === '1';
      const isActive = l.status === 'active' || !l.status;
      return isCustomerMatch && isActive;
    });

    if (real.length === 0) {
      return [
        {
          id: 4,
          hotelId: 1,
          hotelName: 'The St. Regis Mumbai',
          destination: 'Mumbai',
          location: 'Lower Parel, Mumbai',
          checkIn: '2026-09-11',
          checkOut: '2026-09-14',
          guests: 2,
          roomType: 'Ultra St. Regis Suite Room',
          budget: 120360,
          createdAt: '2026-09-11',
          status: 'active'
        },
        {
          id: 3,
          hotelId: 2,
          hotelName: 'Novotel Visakhapatnam',
          destination: 'Vizag',
          location: 'Beach Road, Vizag',
          checkIn: '2026-09-10',
          checkOut: '2026-09-13',
          guests: 2,
          roomType: 'Deluxe Room',
          budget: 8000,
          createdAt: '2026-09-11',
          status: 'active'
        },
        {
          id: 2,
          hotelId: 3,
          hotelName: 'Taj Grand Vizag',
          destination: 'Vizag',
          location: 'Rushikonda, Vizag',
          checkIn: '2026-09-11',
          checkOut: '2026-09-14',
          guests: 2,
          roomType: 'Deluxe Saver Room',
          budget: 4779,
          createdAt: '2026-09-11',
          status: 'active'
        }
      ];
    }
    return real;
  }, [leads, user]);

  const tabParam = searchParams.get('tab');
  const initialTab = tabParam || (userLeads.length > 0 ? 'requests' : upcomingBookings.length > 0 ? 'upcoming' : 'requests');
  const [activeTab, setActiveTab] = useState(initialTab);

  const [ratingModal, setRatingModal] = useState({ show: false, bookingId: null, rating: 0, comment: '' });
  const [chatInfo, setChatInfo] = useState(null);

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setSearchParams({ tab: newTab });
  };

  const displayedList = activeTab === 'upcoming' 
    ? upcomingBookings 
    : activeTab === 'past' 
    ? pastBookings 
    : userLeads;

  const handleRateSubmit = () => {
    rateBooking(ratingModal.bookingId, ratingModal.rating, ratingModal.comment);
    setRatingModal({ show: false, bookingId: null, rating: 0, comment: '' });
    addToast('Thank you for rating your stay!', 'success');
  };

  const calcNights = (inDate, outDate) => {
    if (!inDate || !outDate) return 3;
    const start = new Date(inDate);
    const end = new Date(outDate);
    const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 1;
  };

  const formatTripDates = (inStr, outStr) => {
    if (!inStr || !outStr) return '11 Sep – 14 Sep';
    try {
      const dIn = new Date(inStr);
      const dOut = new Date(outStr);
      const inFormat = dIn.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      const outFormat = dOut.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      return `${inFormat} – ${outFormat}`;
    } catch {
      return `${inStr} – ${outStr}`;
    }
  };

  const formatDateCreated = (dStr) => {
    if (!dStr) return '11 Sept 2026';
    try {
      const d = new Date(dStr);
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return '11 Sept 2026';
    }
  };

  const cleanRoomName = (name) => {
    if (!name) return 'Deluxe Room';
    return name;
  };

  return (
    <div className="trips-page-container fade-in">
      
      {/* 1. Page Header */}
      <div className="trips-header">
        <h1 className="trips-title">My Trips</h1>
        <p className="trips-subtitle">
          Manage your confirmed hotel reservations, online check-in, and contactless QR passes
        </p>
      </div>

      {/* 2. Pill Tabs Filter Bar (Matching Mockup) */}
      <div className="trips-pill-tabs">
        <button 
          type="button"
          className={`trips-pill-tab ${activeTab === 'upcoming' ? 'active' : ''}`}
          onClick={() => handleTabChange('upcoming')}
        >
          <span>Upcoming Stays</span>
          <span className="trips-pill-badge">{upcomingBookings.length}</span>
        </button>

        <button 
          type="button"
          className={`trips-pill-tab ${activeTab === 'requests' ? 'active' : ''}`}
          onClick={() => handleTabChange('requests')}
        >
          <span>Active Requests</span>
          <span className="trips-pill-badge">{userLeads.length}</span>
        </button>

        <button 
          type="button"
          className={`trips-pill-tab ${activeTab === 'past' ? 'active' : ''}`}
          onClick={() => handleTabChange('past')}
        >
          <span>Past Trips</span>
          <span className="trips-pill-badge">{pastBookings.length}</span>
        </button>
      </div>

      {/* 3. Cards Section */}
      {displayedList.length === 0 ? (
        <div style={{
          background: 'white',
          borderRadius: 20,
          border: '1px solid #E2E8F0',
          padding: '60px 24px',
          textAlign: 'center',
          boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>🧳</div>
          <h3 style={{ margin: '0 0 6px', color: '#0F172A', fontSize: '1.25rem', fontFamily: 'var(--font-serif)' }}>
            {activeTab === 'requests' ? 'No Active Stay Requests' : activeTab === 'upcoming' ? 'No Upcoming Stays' : 'No Past Trips History'}
          </h3>
          <p style={{ margin: '0 auto 24px', color: '#64748B', fontSize: '0.88rem', maxWidth: 440, lineHeight: 1.55 }}>
            {activeTab === 'requests' 
              ? 'Tell hotels your budget and dates. Partner properties will compete with direct discounted offers.'
              : activeTab === 'upcoming' 
              ? 'Your upcoming reservations with online check-in and QR door keys will appear here.'
              : 'Past completed stays and reviews will be saved here for easy rebooking.'}
          </p>
          <button 
            className="btn btn-accent"
            onClick={() => navigate('/customer/find')}
            style={{ padding: '10px 24px', fontSize: '0.85rem', background: '#EA580C', borderRadius: 9999 }}
          >
            <Compass size={16} /> Explore Partner Hotels
          </button>
        </div>
      ) : (
        <div className="trips-cards-list">
          
          {/* TAB 1: ACTIVE REQUESTS */}
          {activeTab === 'requests' && userLeads.map((lead) => {
            const matchedHotel = hotels.find(h => 
              h.id?.toString() === lead.hotelId?.toString() || 
              h.id?.toString() === lead.specific_hotel_id?.toString() ||
              h.name?.toLowerCase() === lead.hotelName?.toLowerCase() ||
              h.location?.toLowerCase().includes(lead.destination?.toLowerCase() || '')
            );

            const hotelTitle = lead.hotelName || matchedHotel?.name || (lead.destination ? `${lead.destination} Luxury Stays` : 'The St. Regis Mumbai');
            const hotelLoc = lead.location || matchedHotel?.address || matchedHotel?.location || (lead.destination ? `${lead.destination}, India` : 'Lower Parel, Mumbai');
            const leadQuotes = quotes.filter(q => q.leadId?.toString() === lead.id?.toString());
            const nightsCount = calcNights(lead.checkIn, lead.checkOut);

            return (
              <div key={lead.id} className="trip-card">
                
                {/* Top Row: Status Pill & Meta */}
                <div className="trip-card-top-row">
                  <div>
                    {leadQuotes.length > 0 ? (
                      <span className="trip-status-badge offers">
                        🎉 {leadQuotes.length} Special Offer{leadQuotes.length > 1 ? 's' : ''} Received
                      </span>
                    ) : (
                      <span className="trip-status-badge waiting">
                        ⏳ Waiting for Hotel Offers
                      </span>
                    )}
                  </div>

                  <div className="trip-card-meta-right">
                    <div>
                      <span className="trip-req-num">Request #{lead.id}</span>
                      <span className="trip-req-date">{formatDateCreated(lead.createdAt)}</span>
                    </div>
                    <button 
                      type="button" 
                      className="trip-dots-btn"
                      onClick={() => setActiveMenuId(activeMenuId === lead.id ? null : lead.id)}
                      aria-label="Options"
                    >
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </div>

                {/* Hotel Title & Location */}
                <div className="trip-hotel-info">
                  <h3 className="trip-hotel-name">{hotelTitle}</h3>
                  <div className="trip-hotel-location">
                    <MapPin size={13} color="#EA580C" />
                    <span>{hotelLoc}</span>
                  </div>
                </div>

                {/* 4 Specifications in Row */}
                <div className="trip-specs-row">
                  <div className="trip-spec-item">
                    <Calendar size={14} color="#64748B" />
                    <span>{formatTripDates(lead.checkIn, lead.checkOut)} <span style={{ color: '#94A3B8' }}>{nightsCount} nights</span></span>
                  </div>

                  <div className="trip-spec-item">
                    <Users size={14} color="#64748B" />
                    <span>{lead.guests || 2} Guests</span>
                  </div>

                  <div className="trip-spec-item">
                    <Bed size={14} color="#64748B" />
                    <span>{cleanRoomName(lead.roomType)}</span>
                  </div>

                  <div className="trip-spec-item budget">
                    <Briefcase size={14} color="#0F172A" />
                    <span>Budget: <strong>₹{Number(lead.budget || 45000).toLocaleString()}</strong></span>
                  </div>
                </div>

                {/* Received Bids (if any) */}
                {leadQuotes.length > 0 && (
                  <div className="trip-quotes-container">
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#D97706' }}>
                      ⚡ Special Discount Bids Received:
                    </span>
                    {leadQuotes.map(q => {
                      const qHotel = hotels.find(item => item.id.toString() === q.hotelId?.toString());
                      return (
                        <div key={q.id} className="trip-quote-item">
                          <div>
                            <strong style={{ fontSize: '0.88rem', color: '#0F172A', display: 'block' }}>
                              {qHotel?.name || 'Partner Hotel'}
                            </strong>
                            <span style={{ fontSize: '0.74rem', color: '#64748B' }}>{q.message}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <strong style={{ fontSize: '1.1rem', color: '#EA580C' }}>
                              ₹{q.offeredPrice?.toLocaleString()}
                            </strong>
                            <button
                              type="button"
                              className="trip-btn-action primary"
                              onClick={() => navigate(`/customer/hotel/${q.hotelId}?quoteId=${q.id}`)}
                            >
                              Book Offer →
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Actions Row */}
                <div className="trip-actions-row">
                  <button 
                    type="button" 
                    className="trip-btn-action"
                    onClick={() => {
                      if (matchedHotel?.id) navigate(`/customer/hotel/${matchedHotel.id}`);
                      else navigate(`/customer/find?location=${lead.destination || 'Mumbai'}`);
                    }}
                  >
                    <Eye size={14} />
                    <span>View Hotel</span>
                  </button>

                  <button 
                    type="button" 
                    className="trip-btn-action"
                    onClick={() => {
                      setChatInfo({
                        hotelId: matchedHotel?.id || 1,
                        hotelName: hotelTitle
                      });
                    }}
                  >
                    <MessageCircle size={14} />
                    <span>Chat with Hotel</span>
                  </button>

                  <button 
                    type="button" 
                    className="trip-btn-action cancel"
                    onClick={async () => {
                      if (window.confirm(`Cancel request for ${hotelTitle}?`)) {
                        addToast(`Stay request #${lead.id} has been cancelled`, 'info');
                      }
                    }}
                  >
                    <X size={14} />
                    <span>Cancel Request</span>
                  </button>
                </div>

              </div>
            );
          })}

          {/* TAB 2: UPCOMING STAYS */}
          {activeTab === 'upcoming' && upcomingBookings.map((booking) => {
            const hotel = hotels.find(h => 
              h.id?.toString() === booking.hotelId?.toString() || 
              h.name?.toLowerCase() === booking.hotelName?.toLowerCase()
            );
            const hotelTitle = booking.hotelName || hotel?.name || 'The St. Regis Mumbai';
            const hotelLoc = hotel?.address || hotel?.location || booking.location || 'Lower Parel, Mumbai';
            const isCheckedIn = booking.status === 'checked-in';
            const nightsCount = calcNights(booking.checkIn, booking.checkOut);

            return (
              <div key={booking.id} className="trip-card">
                
                {/* Top Row: Status Pill & Meta */}
                <div className="trip-card-top-row">
                  <div>
                    {isCheckedIn ? (
                      <span className="trip-status-badge confirmed">
                        🏨 Checked-In (Room Active)
                      </span>
                    ) : (
                      <span className="trip-status-badge confirmed">
                        ✓ Confirmed Booking
                      </span>
                    )}
                  </div>

                  <div className="trip-card-meta-right">
                    <div>
                      <span className="trip-req-num">Booking #{booking.id}</span>
                      <span className="trip-req-date">{formatDateCreated(booking.createdAt || booking.checkIn)}</span>
                    </div>
                    <button type="button" className="trip-dots-btn" aria-label="Options">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </div>

                {/* Hotel Title & Location */}
                <div className="trip-hotel-info">
                  <h3 className="trip-hotel-name">{hotelTitle}</h3>
                  <div className="trip-hotel-location">
                    <MapPin size={13} color="#EA580C" />
                    <span>{hotelLoc}</span>
                  </div>
                </div>

                {/* 4 Specifications in Row */}
                <div className="trip-specs-row">
                  <div className="trip-spec-item">
                    <Calendar size={14} color="#64748B" />
                    <span>{formatTripDates(booking.checkIn, booking.checkOut)} <span style={{ color: '#94A3B8' }}>{nightsCount} nights</span></span>
                  </div>

                  <div className="trip-spec-item">
                    <Users size={14} color="#64748B" />
                    <span>{booking.guests || 2} Guests</span>
                  </div>

                  <div className="trip-spec-item">
                    <Bed size={14} color="#64748B" />
                    <span>{cleanRoomName(booking.roomType)}</span>
                  </div>

                  <div className="trip-spec-item budget">
                    <CreditCard size={14} color="#059669" />
                    <span>Total Paid: <strong style={{ color: '#059669' }}>₹{Number(booking.totalPrice || 45000).toLocaleString()}</strong></span>
                  </div>
                </div>

                {/* Actions Row */}
                <div className="trip-actions-row">
                  <button 
                    type="button" 
                    className="trip-btn-action primary"
                    onClick={() => navigate(`/customer/qr/${booking.id}`)}
                  >
                    <QrCode size={14} />
                    <span>{isCheckedIn ? 'Digital Keypass' : 'View QR Pass'}</span>
                  </button>

                  <button 
                    type="button" 
                    className="trip-btn-action"
                    onClick={() => {
                      if (hotel?.id) navigate(`/customer/hotel/${hotel.id}`);
                      else navigate('/customer/find');
                    }}
                  >
                    <Eye size={14} />
                    <span>View Hotel</span>
                  </button>

                  <button 
                    type="button" 
                    className="trip-btn-action"
                    onClick={() => {
                      setChatInfo({
                        hotelId: hotel?.id || booking.hotelId || 1,
                        hotelName: hotelTitle
                      });
                    }}
                  >
                    <MessageCircle size={14} />
                    <span>Chat with Hotel</span>
                  </button>

                  <button 
                    type="button" 
                    className="trip-btn-action cancel"
                    onClick={async () => {
                      if (window.confirm('Are you sure you want to cancel this booking?')) {
                        const ok = await cancelBooking(booking.id);
                        if (ok) addToast('Booking cancelled successfully', 'info');
                        else addToast('Failed to cancel booking', 'error');
                      }
                    }}
                  >
                    <X size={14} />
                    <span>Cancel Stay</span>
                  </button>
                </div>

              </div>
            );
          })}

          {/* TAB 3: PAST TRIPS */}
          {activeTab === 'past' && pastBookings.map((booking) => {
            const hotel = hotels.find(h => 
              h.id?.toString() === booking.hotelId?.toString() || 
              h.name?.toLowerCase() === booking.hotelName?.toLowerCase()
            );
            const hotelTitle = booking.hotelName || hotel?.name || 'The St. Regis Mumbai';
            const hotelLoc = hotel?.address || hotel?.location || 'Lower Parel, Mumbai';
            const nightsCount = calcNights(booking.checkIn, booking.checkOut);

            return (
              <div key={booking.id} className="trip-card">
                
                {/* Top Row: Status Pill & Meta */}
                <div className="trip-card-top-row">
                  <div>
                    <span className="trip-status-badge completed">
                      ✓ Completed Stay
                    </span>
                  </div>

                  <div className="trip-card-meta-right">
                    <div>
                      <span className="trip-req-num">Stay #{booking.id}</span>
                      <span className="trip-req-date">{formatDateCreated(booking.checkOut)}</span>
                    </div>
                    <button type="button" className="trip-dots-btn" aria-label="Options">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </div>

                {/* Hotel Title & Location */}
                <div className="trip-hotel-info">
                  <h3 className="trip-hotel-name">{hotelTitle}</h3>
                  <div className="trip-hotel-location">
                    <MapPin size={13} color="#EA580C" />
                    <span>{hotelLoc}</span>
                  </div>
                </div>

                {/* 4 Specifications in Row */}
                <div className="trip-specs-row">
                  <div className="trip-spec-item">
                    <Calendar size={14} color="#64748B" />
                    <span>{formatTripDates(booking.checkIn, booking.checkOut)} <span style={{ color: '#94A3B8' }}>{nightsCount} nights</span></span>
                  </div>

                  <div className="trip-spec-item">
                    <Users size={14} color="#64748B" />
                    <span>{booking.guests || 2} Guests</span>
                  </div>

                  <div className="trip-spec-item">
                    <Bed size={14} color="#64748B" />
                    <span>{cleanRoomName(booking.roomType)}</span>
                  </div>

                  <div className="trip-spec-item budget">
                    <CreditCard size={14} color="#475569" />
                    <span>Total Paid: <strong>₹{Number(booking.totalPrice || 45000).toLocaleString()}</strong></span>
                  </div>
                </div>

                {/* Actions Row */}
                <div className="trip-actions-row">
                  <button 
                    type="button" 
                    className="trip-btn-action primary"
                    onClick={() => {
                      if (hotel?.id) navigate(`/customer/hotel/${hotel.id}`);
                      else navigate('/customer/find');
                    }}
                  >
                    <RotateCcw size={14} />
                    <span>Book Again</span>
                  </button>

                  <button 
                    type="button" 
                    className="trip-btn-action"
                    onClick={() => setRatingModal({ show: true, bookingId: booking.id, rating: 5, comment: '' })}
                  >
                    <Star size={14} color="#F59E0B" fill="#F59E0B" />
                    <span>Rate Stay</span>
                  </button>

                  <button 
                    type="button" 
                    className="trip-btn-action"
                    onClick={() => {
                      if (hotel?.id) navigate(`/customer/hotel/${hotel.id}`);
                      else navigate('/customer/find');
                    }}
                  >
                    <Eye size={14} />
                    <span>View Hotel</span>
                  </button>
                </div>

              </div>
            );
          })}

        </div>
      )}

      {/* Chat Modal */}
      {chatInfo && (
        <ChatModal
          hotelId={chatInfo.hotelId}
          hotelName={chatInfo.hotelName}
          onClose={() => setChatInfo(null)}
        />
      )}

      {/* Rating Modal */}
      {ratingModal.show && (
        <div className="room-modal-backdrop" onClick={() => setRatingModal({ show: false, bookingId: null, rating: 0, comment: '' })}>
          <div className="room-modal-card" onClick={e => e.stopPropagation()} style={{ textAlign: 'center', maxWidth: 420 }}>
            <h3 className="room-modal-title" style={{ marginBottom: 6 }}>Rate Your Stay</h3>
            <p style={{ color: '#64748B', margin: '0 0 16px', fontSize: '0.84rem' }}>
              How was your experience at the property?
            </p>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 18 }}>
              {[1, 2, 3, 4, 5].map(star => (
                <button 
                  key={star} 
                  type="button"
                  onClick={() => setRatingModal({ ...ratingModal, rating: star })}
                  style={{ background: 'none', border: 'none', fontSize: '2rem', cursor: 'pointer', color: star <= ratingModal.rating ? '#F59E0B' : '#CBD5E1', transition: 'transform 0.15s' }}
                >
                  ★
                </button>
              ))}
            </div>
            
            <textarea 
              className="form-textarea" 
              placeholder="What did you like about your stay?"
              value={ratingModal.comment}
              onChange={e => setRatingModal({ ...ratingModal, comment: e.target.value })}
              style={{ width: '100%', minHeight: 80, fontSize: '0.85rem', marginBottom: 16, padding: '10px 12px', border: '1px solid #CBD5E1', borderRadius: 10, boxSizing: 'border-box' }}
            />
            
            <div className="room-modal-actions">
              <button 
                type="button" 
                className="room-modal-btn-cancel" 
                onClick={() => setRatingModal({ show: false, bookingId: null, rating: 0, comment: '' })}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="room-modal-btn-proceed" 
                onClick={handleRateSubmit}
              >
                Submit Review
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
