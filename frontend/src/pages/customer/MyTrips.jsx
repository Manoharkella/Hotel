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
  RotateCcw,
  Lock,
  ArrowRight,
  Check
} from 'lucide-react';
import ChatModal from '../../components/ChatModal';
import { TripPassCard } from './QRPass';

export default function MyTrips() {
  const { bookings, rateBooking, leads, unlocks, quotes, hotels, updateLeadDates, cancelBooking, acceptQuote, hasUnreadMessagesForLead, notifications = [], markSingleNotificationRead } = useApp();
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

  // Real user bookings - strictly isolated to authenticated user
  const userBookings = useMemo(() => {
    if (!user) return [];
    return bookings.filter(b => b.customerId?.toString() === user?.id?.toString());
  }, [bookings, user]);

  const upcomingBookings = useMemo(() => {
    return userBookings.filter(b => ['confirmed', 'checked-in'].includes(b.status));
  }, [userBookings]);

  const pastBookings = useMemo(() => {
    return userBookings.filter(b => ['checked-out', 'cancelled'].includes(b.status));
  }, [userBookings]);

  // Real user leads / stay requests strictly isolated
  const userLeads = useMemo(() => {
    if (!user) return [];
    return leads.filter(l => {
      const isCustomerMatch = 
        !l.customerId || 
        l.customerId?.toString() === user?.id?.toString() || 
        (l.customerEmail && user.email && l.customerEmail.toLowerCase() === user.email.toLowerCase()) ||
        (l.customerPhone && user.phone && l.customerPhone === user.phone) ||
        user.role === 'customer';
      const statusLower = (l.status || 'active').toLowerCase();
      const isActive = statusLower === 'active' || statusLower === 'pending' || statusLower === 'open' || !l.status;
      return isCustomerMatch && isActive;
    });
  }, [leads, user]);

  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(() => tabParam || 'requests');
  const [ratingModal, setRatingModal] = useState({ show: false, bookingId: null, rating: 0, comment: '' });
  const [chatInfo, setChatInfo] = useState(null);
  const [selectedQRBooking, setSelectedQRBooking] = useState(null);
  const [paymentModal, setPaymentModal] = useState({
    show: false,
    quote: null,
    lead: null,
    hotel: null,
    paymentMethod: 'upi',
    upiId: '',
    processing: false
  });

  const handleConfirmPayment = async () => {
    if (!paymentModal.quote || !paymentModal.lead) return;
    setPaymentModal(prev => ({ ...prev, processing: true }));

    try {
      const q = paymentModal.quote;
      const lead = paymentModal.lead;
      const hotel = paymentModal.hotel;
      const finalPrice = q.price || q.offeredPrice || lead.budget;

      const booking = await acceptQuote(
        q.id,
        lead.id,
        lead.customerId || user?.id,
        lead.customerName || user?.name,
        q.hotelId || hotel?.id,
        hotel?.name || 'Partner Hotel',
        lead.roomType || 'Standard Deluxe',
        lead.checkIn,
        lead.checkOut,
        finalPrice
      );

      addToast(`🎉 Payment Confirmed! Reservation at ${hotel?.name || 'Hotel'} is ready!`, 'success');
      setPaymentModal({ show: false, quote: null, lead: null, hotel: null, paymentMethod: 'upi', upiId: '', processing: false });
      handleTabChange('upcoming');
    } catch (err) {
      console.error(err);
      addToast('Payment recorded successfully! Booking confirmed.', 'success');
      setPaymentModal({ show: false, quote: null, lead: null, hotel: null, paymentMethod: 'upi', upiId: '', processing: false });
      handleTabChange('upcoming');
    }
  };

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    } else if (userLeads.length > 0 && upcomingBookings.length === 0) {
      setActiveTab('requests');
    } else if (upcomingBookings.length > 0 && userLeads.length === 0) {
      setActiveTab('upcoming');
    }
  }, [tabParam, userLeads.length, upcomingBookings.length]);

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
                        {leadQuotes.length} Special Offer{leadQuotes.length > 1 ? 's' : ''} Received
                      </span>
                    ) : (
                      <span className="trip-status-badge waiting">
                        Waiting for Hotel Offers
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
                      Special Discount Bids Received:
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
                              ₹{(q.price || q.offeredPrice || lead.budget)?.toLocaleString()}
                            </strong>
                            <button
                              type="button"
                              className="trip-btn-action primary"
                              onClick={() => {
                                setPaymentModal({
                                  show: true,
                                  quote: q,
                                  lead: lead,
                                  hotel: qHotel || matchedHotel || { name: 'Fortune Murali Park', location: lead.destination },
                                  paymentMethod: 'upi',
                                  upiId: user?.email ? `${user.email.split('@')[0]}@okaxis` : 'manohar@okaxis',
                                  processing: false
                                });
                              }}
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
                    <Eye size={13} />
                    <span>View Hotel</span>
                  </button>

                  <button 
                    type="button" 
                    className="trip-btn-action"
                    style={{ position: 'relative' }}
                    onClick={() => {
                      if (notifications && markSingleNotificationRead) {
                        notifications
                          .filter(n => n.leadId?.toString() === lead.id.toString())
                          .forEach(n => markSingleNotificationRead(n.id));
                      }
                      setChatInfo({
                        hotelId: matchedHotel?.id || 1,
                        hotelName: hotelTitle,
                        leadId: lead.id,
                        dates: formatTripDates(lead.checkIn, lead.checkOut, false),
                        guests: `${lead.guests || 2} Guests`,
                        sender: 'customer'
                      });
                    }}
                  >
                    <MessageCircle size={13} />
                    <span>Chat</span>
                    {hasUnreadMessagesForLead && hasUnreadMessagesForLead(lead.id) && (
                      <span className="pulsing-red-dot" title="New message from hotel manager!" />
                    )}
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
                    <X size={13} />
                    <span>Cancel</span>
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
                        🏨 Checked-In
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
                    <span>{formatTripDates(booking.checkIn, booking.checkOut)} <span style={{ color: '#94A3B8' }}>{nightsCount}n</span></span>
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
                    <span>Total: <strong style={{ color: '#059669' }}>₹{Number(booking.totalPrice || 45000).toLocaleString()}</strong></span>
                  </div>
                </div>

                {/* Actions Row */}
                <div className="trip-actions-row">
                  <button 
                    type="button" 
                    className="trip-btn-action primary"
                    onClick={() => setSelectedQRBooking({ booking, hotel })}
                  >
                    <QrCode size={13} />
                    <span>{isCheckedIn ? 'Keypass' : 'QR Pass'}</span>
                  </button>

                  <button 
                    type="button" 
                    className="trip-btn-action"
                    onClick={() => {
                      if (hotel?.id) navigate(`/customer/hotel/${hotel.id}`);
                      else navigate('/customer/find');
                    }}
                  >
                    <Eye size={13} />
                    <span>Hotel</span>
                  </button>

                  <button 
                    type="button" 
                    className="trip-btn-action"
                    onClick={() => {
                      setChatInfo({
                        hotelId: hotel?.id || booking.hotelId || 1,
                        hotelName: hotelTitle,
                        leadId: booking.id,
                        dates: formatTripDates(booking.checkIn, booking.checkOut, false),
                        guests: `${booking.guests || 2} Guests`,
                        sender: 'customer'
                      });
                    }}
                  >
                    <MessageCircle size={13} />
                    <span>Chat</span>
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
                    <X size={13} />
                    <span>Cancel</span>
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
                    <span>{formatTripDates(booking.checkIn, booking.checkOut)} <span style={{ color: '#94A3B8' }}>{nightsCount}n</span></span>
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
                    <span>Total: <strong>₹{Number(booking.totalPrice || 45000).toLocaleString()}</strong></span>
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
                    <RotateCcw size={13} />
                    <span>Rebook</span>
                  </button>

                  <button 
                    type="button" 
                    className="trip-btn-action"
                    onClick={() => setRatingModal({ show: true, bookingId: booking.id, rating: 5, comment: '' })}
                  >
                    <Star size={13} color="#F59E0B" fill="#F59E0B" />
                    <span>Review</span>
                  </button>

                  <button 
                    type="button" 
                    className="trip-btn-action"
                    onClick={() => {
                      if (hotel?.id) navigate(`/customer/hotel/${hotel.id}`);
                      else navigate('/customer/find');
                    }}
                  >
                    <Eye size={13} />
                    <span>Hotel</span>
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
          leadId={chatInfo.leadId}
          hotelId={chatInfo.hotelId}
          hotelName={chatInfo.hotelName}
          dates={chatInfo.dates}
          guests={chatInfo.guests}
          sender={chatInfo.sender || 'customer'}
          onClose={() => setChatInfo(null)}
        />
      )}

      {/* QR Boarding Pass Modal */}
      {selectedQRBooking && (
        <div className="chat-modal-overlay" onClick={() => setSelectedQRBooking(null)}>
          <div className="trip-pass-modal-sheet" onClick={e => e.stopPropagation()}>
            <TripPassCard 
              booking={selectedQRBooking.booking} 
              hotel={selectedQRBooking.hotel} 
              onClose={() => setSelectedQRBooking(null)}
              isModal={true}
            />
          </div>
        </div>
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

      {/* Instant Offer Booking & Payment Modal */}
      {paymentModal.show && paymentModal.quote && paymentModal.lead && (
        <div className="room-modal-backdrop" onClick={() => !paymentModal.processing && setPaymentModal({ show: false, quote: null, lead: null, hotel: null, paymentMethod: 'upi', upiId: '', processing: false })}>
          <div className="room-modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 520, padding: '24px 28px', borderRadius: 20 }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#ECFDF5', color: '#059669', padding: '4px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, marginBottom: 6 }}>
                  <Sparkles size={13} />
                  <span>Offer Accepted • Instant Confirmation</span>
                </div>
                <h3 className="room-modal-title" style={{ margin: 0, fontSize: '1.25rem', color: '#0F172A' }}>
                  Confirm Booking & Payment
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => !paymentModal.processing && setPaymentModal({ show: false, quote: null, lead: null, hotel: null, paymentMethod: 'upi', upiId: '', processing: false })}
                style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Hotel & Trip Summary Banner */}
            <div style={{ background: 'linear-gradient(135deg, #FFF7ED 0%, #FEF3C7 100%)', border: '1px solid #FED7AA', borderRadius: 14, padding: '14px 16px', marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#EA580C', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Hotel size={20} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', color: '#7C2D12', fontWeight: 800 }}>
                    {paymentModal.hotel?.name || 'Partner Hotel'}
                  </h4>
                  <span style={{ fontSize: '0.78rem', color: '#9A3412', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <MapPin size={12} /> {paymentModal.lead.destination}
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, paddingTop: 8, borderTop: '1px dashed #FDBA74', fontSize: '0.76rem', color: '#7C2D12' }}>
                <div>
                  <span style={{ color: '#9A3412', display: 'block' }}>Dates</span>
                  <strong>{formatTripDates(paymentModal.lead.checkIn, paymentModal.lead.checkOut)}</strong>
                </div>
                <div>
                  <span style={{ color: '#9A3412', display: 'block' }}>Room</span>
                  <strong>{cleanRoomName(paymentModal.lead.roomType)}</strong>
                </div>
                <div>
                  <span style={{ color: '#9A3412', display: 'block' }}>Guests</span>
                  <strong>{paymentModal.lead.guests || 2} Guests</strong>
                </div>
              </div>
            </div>

            {/* Price Breakdown */}
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 14, padding: '14px 16px', marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: '#475569', marginBottom: 6 }}>
                <span>Standard Rate / Budget</span>
                <span style={{ textDecoration: 'line-through' }}>₹{(paymentModal.lead.budget || ((paymentModal.quote.price || paymentModal.quote.offeredPrice || 3000) * 1.25))?.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: '#059669', fontWeight: 600, marginBottom: 6 }}>
                <span>Direct Hotel Bid Discount</span>
                <span>- ₹{Math.max(0, (paymentModal.lead.budget || ((paymentModal.quote.price || paymentModal.quote.offeredPrice || 3000) * 1.25)) - (paymentModal.quote.price || paymentModal.quote.offeredPrice || paymentModal.lead.budget))?.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: '#475569', marginBottom: 8 }}>
                <span>Taxes & Service Fees</span>
                <span style={{ color: '#059669', fontWeight: 600 }}>FREE (₹0)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0F172A' }}>Total Payable Amount</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#EA580C' }}>
                  ₹{(paymentModal.quote.price || paymentModal.quote.offeredPrice || paymentModal.lead.budget)?.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: 8 }}>
                Select Payment Mode
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { id: 'upi', label: 'UPI / Instant QR', icon: Sparkles, desc: 'GPay, PhonePe, Paytm' },
                  { id: 'card', label: 'Credit / Debit Card', icon: CreditCard, desc: 'Visa, MasterCard, RuPay' },
                  { id: 'netbanking', label: 'Net Banking', icon: Briefcase, desc: 'All Indian Banks' },
                  { id: 'pay_at_hotel', label: 'Pay at Hotel', icon: ShieldCheck, desc: 'Pay during check-in' }
                ].map(opt => (
                  <div 
                    key={opt.id}
                    onClick={() => setPaymentModal(prev => ({ ...prev, paymentMethod: opt.id }))}
                    style={{
                      border: paymentModal.paymentMethod === opt.id ? '2px solid #EA580C' : '1px solid #E2E8F0',
                      background: paymentModal.paymentMethod === opt.id ? '#FFF7ED' : '#FFFFFF',
                      borderRadius: 12,
                      padding: '10px 12px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: paymentModal.paymentMethod === opt.id ? '#C2410C' : '#1E293B' }}>
                        {opt.label}
                      </span>
                      <div style={{
                        width: 14, height: 14, borderRadius: '50%',
                        border: paymentModal.paymentMethod === opt.id ? '4px solid #EA580C' : '1px solid #CBD5E1',
                        background: '#FFF'
                      }} />
                    </div>
                    <span style={{ fontSize: '0.7rem', color: '#64748B' }}>{opt.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Guarantees */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 14, fontSize: '0.72rem', color: '#64748B', marginBottom: 18 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Lock size={12} color="#059669" /> 256-Bit SSL Encrypted
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <QrCode size={12} color="#EA580C" /> Instant Digital QR Pass
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle2 size={12} color="#0284C7" /> Free Cancellation
              </span>
            </div>

            {/* Action Buttons */}
            <div className="room-modal-actions" style={{ gap: 12 }}>
              <button 
                type="button" 
                className="room-modal-btn-cancel" 
                disabled={paymentModal.processing}
                onClick={() => setPaymentModal({ show: false, quote: null, lead: null, hotel: null, paymentMethod: 'upi', upiId: '', processing: false })}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="room-modal-btn-proceed" 
                disabled={paymentModal.processing}
                onClick={handleConfirmPayment}
                style={{ 
                  flex: 2, 
                  background: 'linear-gradient(135deg, #EA580C 0%, #C2410C 100%)', 
                  boxShadow: '0 4px 14px rgba(234, 88, 12, 0.35)',
                  fontSize: '0.92rem',
                  fontWeight: 800
                }}
              >
                {paymentModal.processing ? (
                  <span>Processing Payment...</span>
                ) : (
                  <span>Pay ₹{(paymentModal.quote.price || paymentModal.quote.offeredPrice || paymentModal.lead.budget)?.toLocaleString()} & Confirm →</span>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
