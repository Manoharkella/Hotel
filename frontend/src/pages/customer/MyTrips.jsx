import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  Hotel
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

  const userBookings = bookings.filter(b => b.customerId?.toString() === user?.id?.toString());
  const upcoming = userBookings.filter(b => ['confirmed', 'checked-in'].includes(b.status));
  const past = userBookings.filter(b => ['checked-out', 'cancelled'].includes(b.status));

  const userLeads = leads.filter(l => {
    const isCustomerMatch = !user || !l.customerId || l.customerId?.toString() === user?.id?.toString() || user?.id === 1 || l.customerId === '1';
    const isActive = l.status === 'active' || !l.status;
    return isCustomerMatch && isActive;
  });

  const tabParam = searchParams.get('tab');
  const initialTab = tabParam || (upcoming.length > 0 ? 'upcoming' : userLeads.length > 0 ? 'requests' : 'upcoming');
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

  const displayed = activeTab === 'upcoming' ? upcoming : activeTab === 'past' ? past : userLeads;

  const handleRateSubmit = () => {
    rateBooking(ratingModal.bookingId, ratingModal.rating, ratingModal.comment);
    setRatingModal({ show: false, bookingId: null, rating: 0, comment: '' });
    addToast('Thank you for rating your stay!', 'success');
  };

  const calcNights = (inDate, outDate) => {
    if (!inDate || !outDate) return 1;
    const start = new Date(inDate);
    const end = new Date(outDate);
    const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 1;
  };

  const cleanRoomName = (name) => {
    if (!name) return 'Standard Room';
    return name.replace(/\s+Room$/i, '') + ' Room';
  };

  const primaryUpcoming = upcoming[0];
  const primaryHotel = primaryUpcoming 
    ? hotels.find(h => h.id?.toString() === primaryUpcoming.hotelId?.toString() || h.name?.toLowerCase() === primaryUpcoming.hotelName?.toLowerCase())
    : null;

  return (
    <div className="fade-in" style={{ maxWidth: 1380, margin: '0 auto', padding: '24px 28px 80px' }}>
      
      {/* 1. CLEAN EXPANDED HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16, marginBottom: 24, borderBottom: '1px solid var(--border-light)', paddingBottom: 20 }}>
        <div>
          <h1 style={{ margin: '0 0 6px', fontFamily: 'var(--font-serif)', fontSize: '2.4rem', color: 'var(--text)' }}>
            My Trips
          </h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Manage your confirmed hotel reservations, online check-in, and contactless QR passes
          </p>
        </div>

        {/* Clean Pill Tabs */}
        <div style={{
          display: 'flex',
          gap: 6,
          background: 'white',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: '4px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <button 
            onClick={() => handleTabChange('upcoming')}
            style={{
              padding: '9px 20px',
              borderRadius: 8,
              border: 'none',
              fontSize: '0.88rem',
              fontWeight: 700,
              cursor: 'pointer',
              background: activeTab === 'upcoming' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'upcoming' ? 'white' : 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.15s'
            }}
          >
            <span>Upcoming Stays</span>
            <span style={{
              background: activeTab === 'upcoming' ? 'rgba(255,255,255,0.2)' : 'var(--bg)',
              color: activeTab === 'upcoming' ? 'white' : 'var(--text)',
              padding: '1px 8px',
              borderRadius: 9999,
              fontSize: '0.75rem',
              fontWeight: 800
            }}>
              {upcoming.length}
            </span>
          </button>

          <button 
            onClick={() => handleTabChange('requests')}
            style={{
              padding: '9px 20px',
              borderRadius: 8,
              border: 'none',
              fontSize: '0.88rem',
              fontWeight: 700,
              cursor: 'pointer',
              background: activeTab === 'requests' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'requests' ? 'white' : 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.15s'
            }}
          >
            <span>Active Requests</span>
            <span style={{
              background: activeTab === 'requests' ? 'rgba(255,255,255,0.2)' : 'var(--bg)',
              color: activeTab === 'requests' ? 'white' : 'var(--text)',
              padding: '1px 8px',
              borderRadius: 9999,
              fontSize: '0.75rem',
              fontWeight: 800
            }}>
              {userLeads.length}
            </span>
          </button>

          <button 
            onClick={() => handleTabChange('past')}
            style={{
              padding: '9px 20px',
              borderRadius: 8,
              border: 'none',
              fontSize: '0.88rem',
              fontWeight: 700,
              cursor: 'pointer',
              background: activeTab === 'past' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'past' ? 'white' : 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.15s'
            }}
          >
            <span>Past Trips</span>
            <span style={{
              background: activeTab === 'past' ? 'rgba(255,255,255,0.2)' : 'var(--bg)',
              color: activeTab === 'past' ? 'white' : 'var(--text)',
              padding: '1px 8px',
              borderRadius: 9999,
              fontSize: '0.75rem',
              fontWeight: 800
            }}>
              {past.length}
            </span>
          </button>
        </div>
      </div>

      {/* 2. MAIN 2-COLUMN BALANCED DASHBOARD */}
      {displayed.length === 0 ? (
        <div style={{
          background: 'white',
          borderRadius: 20,
          border: '1px solid var(--border)',
          padding: '60px 24px',
          textAlign: 'center',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>🧳</div>
          <h3 style={{ margin: '0 0 6px', color: 'var(--text)', fontSize: '1.35rem', fontFamily: 'var(--font-serif)' }}>
            {activeTab === 'requests' ? 'No Active Stay Requests' : activeTab === 'upcoming' ? 'No Upcoming Stays' : 'No Past Trips History'}
          </h3>
          <p style={{ margin: '0 auto 24px', color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: 460, lineHeight: 1.6 }}>
            {activeTab === 'requests' 
              ? 'Tell hotels your budget and dates. Partner properties will compete with direct discounted offers.'
              : activeTab === 'upcoming' 
              ? 'Your upcoming reservations with online check-in and QR door keys will appear here.'
              : 'Past completed stays and reviews will be saved here for easy rebooking.'}
          </p>
          <button 
            className="btn btn-primary"
            onClick={() => navigate('/customer/find')}
            style={{ padding: '12px 28px', fontSize: '0.9rem' }}
          >
            <Compass size={16} /> Explore Partner Hotels
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 28, alignItems: 'start' }}>
          
          {/* LEFT COLUMN: FULL WIDTH STAY CARDS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {activeTab === 'upcoming' || activeTab === 'past' ? (
              displayed.map(booking => {
                const hotel = hotels.find(h => h.id?.toString() === booking.hotelId?.toString() || h.name?.toLowerCase() === booking.hotelName?.toLowerCase());
                const photo = hotel?.photos?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800';
                const location = hotel?.location || hotel?.address || 'Visakhapatnam, Andhra Pradesh';
                const rating = hotel?.rating || 4.8;
                const nights = calcNights(booking.checkIn, booking.checkOut);

                const isCheckedIn = booking.status === 'checked-in';
                const isConfirmed = booking.status === 'confirmed';

                return (
                  <div 
                    key={booking.id}
                    style={{
                      background: 'white',
                      borderRadius: 20,
                      border: '1px solid var(--border)',
                      overflow: 'hidden',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                      display: 'grid',
                      gridTemplateColumns: '300px 1fr',
                      transition: 'all 0.2s'
                    }}
                  >
                    {/* Hotel Image with rating */}
                    <div style={{
                      backgroundImage: `url(${photo})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      minHeight: 220,
                      position: 'relative'
                    }}>
                      <div style={{
                        position: 'absolute',
                        top: 14,
                        left: 14,
                        background: 'rgba(0,0,0,0.7)',
                        color: '#FBBF24',
                        padding: '3px 10px',
                        borderRadius: 8,
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        backdropFilter: 'blur(4px)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                      }}>
                        <Star size={13} fill="#FBBF24" /> {rating}
                      </div>

                      <div style={{
                        position: 'absolute',
                        bottom: 14,
                        left: 14,
                        right: 14,
                        background: 'rgba(0, 0, 0, 0.75)',
                        color: 'white',
                        padding: '6px 12px',
                        borderRadius: 8,
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        backdropFilter: 'blur(4px)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}>
                        <QrCode size={14} color="#D4AF37" />
                        <span>QR Contactless Check-In Ready</span>
                      </div>
                    </div>

                    {/* Booking Details & Actions */}
                    <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        {/* Header & Status */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, gap: 12 }}>
                          <div>
                            <h3 style={{ margin: '0 0 4px', fontSize: '1.35rem', fontFamily: 'var(--font-serif)', color: 'var(--text)' }}>
                              {booking.hotelName}
                            </h3>
                            <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                              📍 {location}
                            </span>
                          </div>

                          <div>
                            {isCheckedIn ? (
                              <span style={{ background: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0', padding: '4px 12px', borderRadius: 9999, fontSize: '0.78rem', fontWeight: 800 }}>
                                🏨 Checked-In (Room Active)
                              </span>
                            ) : isConfirmed ? (
                              <span style={{ background: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0', padding: '4px 12px', borderRadius: 9999, fontSize: '0.78rem', fontWeight: 800 }}>
                                ✓ Confirmed & Guaranteed
                              </span>
                            ) : (
                              <span style={{ background: '#FEF2F2', color: '#B91C1C', padding: '4px 12px', borderRadius: 9999, fontSize: '0.78rem', fontWeight: 700 }}>
                                {booking.status}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Stay Specs Grid Bar */}
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                          gap: 12,
                          background: 'var(--bg)',
                          borderRadius: 12,
                          padding: '12px 16px',
                          margin: '12px 0 16px',
                          border: '1px solid var(--border-light)'
                        }}>
                          <div>
                            <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 800, display: 'block' }}>
                              Check-In
                            </span>
                            <strong style={{ fontSize: '0.9rem', color: 'var(--text)' }}>
                              {new Date(booking.checkIn).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </strong>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block' }}>From 2:00 PM</span>
                          </div>

                          <div>
                            <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 800, display: 'block' }}>
                              Check-Out
                            </span>
                            <strong style={{ fontSize: '0.9rem', color: 'var(--text)' }}>
                              {new Date(booking.checkOut).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </strong>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block' }}>Until 11:00 AM</span>
                          </div>

                          <div>
                            <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 800, display: 'block' }}>
                              Room & Duration
                            </span>
                            <strong style={{ fontSize: '0.9rem', color: 'var(--text)' }}>
                              {cleanRoomName(booking.roomType)}
                            </strong>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block' }}>{nights} Nights • 2 Guests</span>
                          </div>

                          <div>
                            <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 800, display: 'block' }}>
                              Total Paid
                            </span>
                            <strong style={{ fontSize: '1.05rem', color: 'var(--primary)' }}>
                              ₹{(booking.totalPrice || 9000).toLocaleString()}
                            </strong>
                            <span style={{ fontSize: '0.72rem', color: '#059669', display: 'block', fontWeight: 600 }}>Taxes Included</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons Row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-light)', paddingTop: 14, flexWrap: 'wrap', gap: 10 }}>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                          {isConfirmed && (
                            <>
                              <button 
                                className="btn btn-primary btn-sm" 
                                onClick={() => navigate(`/customer/checkin/${booking.id}`)}
                                style={{ height: 38, padding: '0 18px', fontSize: '0.82rem' }}
                              >
                                📇 Online Check-In
                              </button>
                              <button 
                                className="btn btn-outline btn-sm" 
                                onClick={() => navigate(`/customer/qr/${booking.id}`)}
                                style={{ height: 38, padding: '0 18px', fontSize: '0.82rem', borderColor: 'var(--accent)', color: 'var(--accent-dark)' }}
                              >
                                📱 View QR Pass
                              </button>
                            </>
                          )}

                          {isCheckedIn && (
                            <button 
                              className="btn btn-primary btn-sm" 
                              onClick={() => navigate(`/customer/qr/${booking.id}`)}
                              style={{ height: 38, padding: '0 18px', fontSize: '0.82rem' }}
                            >
                              📱 Show Digital Keypass
                            </button>
                          )}

                          {hotel && (
                            <button 
                              className="btn btn-outline btn-sm"
                              onClick={() => navigate(`/customer/hotel/${hotel.id}`)}
                              style={{ height: 38, padding: '0 16px', fontSize: '0.82rem' }}
                            >
                              🏨 View Hotel Info
                            </button>
                          )}

                          {booking.status === 'checked-out' && !booking.rating && (
                            <button 
                              className="btn btn-outline btn-sm" 
                              onClick={() => setRatingModal({ show: true, bookingId: booking.id, rating: 5, comment: '' })}
                              style={{ height: 38, padding: '0 16px', fontSize: '0.82rem' }}
                            >
                              ⭐ Leave a Review
                            </button>
                          )}
                        </div>

                        {isConfirmed && (
                          <button 
                            onClick={async () => {
                              if (window.confirm('Are you sure you want to cancel this booking?')) {
                                const ok = await cancelBooking(booking.id);
                                if (ok) addToast('Booking cancelled successfully', 'info');
                                else addToast('Failed to cancel booking', 'error');
                              }
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#EF4444',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            ✕ Cancel Stay
                          </button>
                        )}
                      </div>

                    </div>
                  </div>
                );
              })
            ) : (
              /* --- ACTIVE REQUESTS CARDS --- */
              displayed.map(lead => {
                const leadQuotes = quotes.filter(q => q.leadId.toString() === lead.id.toString());
                const matchedHotels = hotels.filter(h => h.location?.toLowerCase().includes(lead.destination?.toLowerCase() || ''));

                return (
                  <div 
                    key={lead.id} 
                    style={{ 
                      padding: '24px 28px', 
                      borderRadius: 20, 
                      border: '1px solid var(--border)', 
                      background: 'white', 
                      boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 14
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h3 style={{ margin: '0 0 2px', fontSize: '1.25rem', color: 'var(--text)', fontFamily: 'var(--font-serif)' }}>
                          Stay Request in {lead.destination || 'India'}
                        </h3>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          Request #{lead.id} • Posted {new Date(lead.createdAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>

                      <div>
                        {leadQuotes.length > 0 ? (
                          <span style={{ background: '#ECFDF5', color: '#065F46', padding: '4px 12px', borderRadius: 9999, fontSize: '0.78rem', fontWeight: 800 }}>
                            🎉 {leadQuotes.length} Special Offer{leadQuotes.length > 1 ? 's' : ''} Received
                          </span>
                        ) : (
                          <span style={{ background: 'var(--bg)', color: 'var(--text-secondary)', padding: '4px 12px', borderRadius: 9999, fontSize: '0.78rem', fontWeight: 600 }}>
                            ⏳ Waiting for Hotel Offers
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: '0.85rem', color: 'var(--text-secondary)', background: 'var(--bg)', padding: '12px 16px', borderRadius: 12 }}>
                      <span>📅 {new Date(lead.checkIn).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – {new Date(lead.checkOut).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                      <span>👥 {lead.guests} Guests</span>
                      <span>🛏️ {cleanRoomName(lead.roomType)}</span>
                      {lead.budget && <strong>Budget: ₹{Number(lead.budget).toLocaleString()}</strong>}
                    </div>

                    {/* Received quotes */}
                    {leadQuotes.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--primary)' }}>
                          Special Discount Bids Received:
                        </span>
                        {leadQuotes.map(q => {
                          const h = hotels.find(item => item.id.toString() === q.hotelId.toString());
                          return (
                            <div key={q.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFFBEB', border: '1px solid #FDE68A', padding: '12px 16px', borderRadius: 12 }}>
                              <div>
                                <strong style={{ fontSize: '0.95rem', color: 'var(--text)' }}>{h?.name || 'Hotel'}</strong>
                                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block' }}>{q.message}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <strong style={{ fontSize: '1.15rem', color: 'var(--primary)' }}>₹{q.offeredPrice?.toLocaleString()}</strong>
                                <button
                                  className="btn btn-accent btn-sm"
                                  onClick={() => navigate(`/customer/hotel/${q.hotelId}?quoteId=${q.id}`)}
                                  style={{ height: 34, fontSize: '0.8rem', padding: '0 14px' }}
                                >
                                  Book Offer
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* RIGHT COLUMN: TRAVEL PASS & QUICK ASSISTANT SIDEBAR */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            
            {/* Contactless QR Pass Card */}
            {primaryUpcoming && (
              <div style={{
                background: 'linear-gradient(135deg, #18181b 0%, #09090b 100%)',
                borderRadius: 20,
                padding: '24px',
                color: 'white',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#D4AF37' }}>
                    ⚡ Digital Boarding Pass
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', fontFamily: 'monospace' }}>
                    #{primaryUpcoming.id}
                  </span>
                </div>

                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <div style={{
                    width: 72,
                    height: 72,
                    borderRadius: 16,
                    background: 'white',
                    color: '#0F0F0F',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px',
                    boxShadow: '0 8px 20px rgba(212, 175, 55, 0.25)'
                  }}>
                    <QrCode size={46} />
                  </div>
                  <strong style={{ fontSize: '1rem', color: 'white', display: 'block' }}>
                    {primaryUpcoming.hotelName}
                  </strong>
                  <p style={{ margin: '4px 0 16px', fontSize: '0.78rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
                    Show your digital QR pass at the front desk or express mobile kiosk for contactless key retrieval.
                  </p>
                </div>

                <button 
                  onClick={() => navigate(`/customer/qr/${primaryUpcoming.id}`)}
                  className="btn btn-accent btn-block"
                  style={{ height: 42, fontSize: '0.85rem' }}
                >
                  📱 Open Full QR Pass
                </button>
              </div>
            )}

            {/* Hotel Direct Support Card */}
            <div style={{
              background: 'white',
              borderRadius: 20,
              padding: '20px',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <h4 style={{ margin: '0 0 12px', fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>🛎️</span>
                <span>Need Assistance with Your Stay?</span>
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ShieldCheck size={16} color="#10B981" />
                  <span>100% Guaranteed Booking on HostIQ</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Clock size={16} color="#ca8a04" />
                  <span>24/7 Front Desk Guest Support</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MapPin size={16} color="var(--primary)" />
                  <span>Instant Maps & GPS Directions</span>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-light)', marginTop: 14, paddingTop: 12 }}>
                <button
                  onClick={() => navigate('/customer/find')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary)',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: 0
                  }}
                >
                  <span>Book Another Hotel Stay</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Edit Dates Modal */}
      {editingDatesLead && (
        <div className="modal-overlay" onClick={() => setEditingDatesLead(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420, borderRadius: 16, padding: 24 }}>
            <h3 style={{ fontSize: '1.3rem', margin: '0 0 16px' }}>📅 Modify Trip Dates</h3>

            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label">Check-In Date</label>
              <input 
                type="date" 
                className="form-input" 
                value={newCheckIn} 
                onChange={e => setNewCheckIn(e.target.value)} 
              />
            </div>

            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label">Check-Out Date</label>
              <input 
                type="date" 
                className="form-input" 
                value={newCheckOut} 
                onChange={e => setNewCheckOut(e.target.value)} 
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn btn-outline btn-sm" onClick={() => setEditingDatesLead(null)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={handleSaveDates}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Rating Modal */}
      {ratingModal.show && (
        <div className="modal-overlay" onClick={() => setRatingModal({ show: false, bookingId: null, rating: 0, comment: '' })}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ textAlign: 'center', maxWidth: 420, borderRadius: 16, padding: 28 }}>
            <h3 style={{ fontSize: '1.4rem', margin: '0 0 8px' }}>Rate Your Stay</h3>
            <p style={{ color: 'var(--text-secondary)', margin: '0 0 20px', fontSize: '0.85rem' }}>How was your experience at the property?</p>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 20 }}>
              {[1, 2, 3, 4, 5].map(star => (
                <button 
                  key={star} 
                  onClick={() => setRatingModal({ ...ratingModal, rating: star })}
                  style={{ background: 'none', border: 'none', fontSize: '2.2rem', cursor: 'pointer', color: star <= ratingModal.rating ? '#F59E0B' : '#E2E8F0' }}
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
              style={{ background: 'var(--bg)', minHeight: 70, fontSize: '0.85rem', marginBottom: 20 }}
            />
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn btn-outline btn-sm" onClick={() => setRatingModal({ show: false, bookingId: null, rating: 0, comment: '' })}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={handleRateSubmit}>Submit</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
