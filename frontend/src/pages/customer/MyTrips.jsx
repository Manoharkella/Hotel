import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import ChatModal from '../../components/ChatModal';

export default function MyTrips() {
  const { bookings, rateBooking } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'upcoming');
  const [ratingModal, setRatingModal] = useState({ show: false, bookingId: null, rating: 0, comment: '' });
  const [chatInfo, setChatInfo] = useState(null);

  // Update tab if URL changes
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  const userBookings = bookings.filter(b => b.customerId === user?.id.toString());
  const upcoming = userBookings.filter(b => ['confirmed', 'checked-in'].includes(b.status));
  const past = userBookings.filter(b => ['checked-out', 'cancelled'].includes(b.status));
  
  const { leads, unlocks, quotes, hotels } = useApp();
  
  const userLeads = leads.filter(l => l.customerId === user?.id.toString() && l.status === 'active');
  const displayed = activeTab === 'upcoming' ? upcoming : activeTab === 'past' ? past : userLeads;

  const statusConfig = {
    confirmed: { label: 'Confirmed', class: 'badge-success', icon: '✓' },
    'checked-in': { label: 'Checked In', class: 'badge-info', icon: '🏨' },
    'checked-out': { label: 'Checked Out', class: 'badge-neutral', icon: '👋' },
    cancelled: { label: 'Cancelled', class: 'badge-danger', icon: '✕' },
  };

  const handleRateSubmit = () => {
    rateBooking(ratingModal.bookingId, ratingModal.rating, ratingModal.comment);
    setRatingModal({ show: false, bookingId: null, rating: 0, comment: '' });
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }} className="fade-in">
      <h1 className="mb-2">My Trips</h1>
      <p style={{ color: '#64748b', marginBottom: 24 }}>Manage your bookings and check-in digitally</p>

      <div className="tabs">
        <button className={`tab ${activeTab === 'requests' ? 'active' : ''}`} onClick={() => setActiveTab('requests')}>Active Requests ({userLeads.length})</button>
        <button className={`tab ${activeTab === 'upcoming' ? 'active' : ''}`} onClick={() => setActiveTab('upcoming')}>Upcoming ({upcoming.length})</button>
        <button className={`tab ${activeTab === 'past' ? 'active' : ''}`} onClick={() => setActiveTab('past')}>Past ({past.length})</button>
      </div>

      {displayed.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">{activeTab === 'requests' ? '🔎' : '🧳'}</div>
          <h3>No {activeTab}</h3>
          <p>{activeTab === 'requests' ? 'Submit a requirement to get hotel offers!' : activeTab === 'upcoming' ? 'No confirmed bookings.' : 'Your past trips will show up here.'}</p>
          {(activeTab === 'upcoming' || activeTab === 'requests') && <button className="btn btn-primary mt-3" onClick={() => navigate('/customer/find')}>Find Hotels</button>}
        </div>
      ) : activeTab === 'requests' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {displayed.map(lead => {
            const leadUnlocks = unlocks.filter(u => u.leadId === lead.id);
            const isSpecificHotel = lead.matchedHotelIds && lead.matchedHotelIds.length === 1;
            const targetedHotel = isSpecificHotel ? hotels.find(h => h.id.toString() === lead.matchedHotelIds[0].toString()) : null;
            
            return (
              <div key={lead.id} className="card p-3">
                <div className="flex-between">
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.2rem' }}>
                      {targetedHotel ? `Request to ${targetedHotel.name}` : `Trip to ${lead.destination}`}
                    </h3>
                    <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      {new Date(lead.checkIn).toLocaleDateString()} - {new Date(lead.checkOut).toLocaleDateString()}
                    </p>
                    {targetedHotel && (
                      <span style={{ display: 'inline-block', marginTop: 6, fontSize: '0.8rem', background: 'var(--bg)', padding: '2px 8px', borderRadius: 12, color: 'var(--text-muted)' }}>
                        📍 {targetedHotel.location}
                      </span>
                    )}
                  </div>
                  <span className="badge badge-info">Searching...</span>
                </div>
                <div style={{ background: 'var(--bg)', padding: 12, borderRadius: 8, marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontSize: '1.5rem' }}>{leadUnlocks.length > 0 ? '👀' : '⏳'}</div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{leadUnlocks.length > 0 ? `${leadUnlocks.length} Hotel(s) viewed your request!` : 'Waiting for hotels to view your request...'}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>You will receive offers shortly.</div>
                  </div>
                </div>
                
                {/* Display Received Quotes (1-to-1 Conv style) */}
                {(() => {
                  const leadQuotes = quotes.filter(q => q.leadId.toString() === lead.id.toString());
                  if (leadQuotes.length === 0) return null;
                  
                  return (
                    <div style={{ marginTop: 16 }}>
                      <h4 style={{ fontSize: '1rem', marginBottom: 12 }}>Received Offers ({leadQuotes.length})</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {leadQuotes.map(q => {
                          const hotel = hotels.find(h => h.id.toString() === q.hotelId.toString());
                          return (
                            <div key={q.id} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
                              <div className="flex-between" style={{ marginBottom: 8 }}>
                                <strong style={{ fontSize: '1.1rem' }}>{hotel?.name || 'Hotel'}</strong>
                                <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '1.2rem' }}>₹{q.price.toLocaleString()}</span>
                              </div>
                              <p style={{ margin: '0 0 12px 0', color: 'var(--text-secondary)', fontStyle: 'italic' }}>"{q.message}"</p>
                              <div style={{ display: 'flex', gap: 8 }}>
                                <button className="btn btn-outline btn-sm" onClick={() => setChatInfo({ leadId: q.leadId, hotelId: q.hotelId })}>💬 Chat</button>
                                <button className="btn btn-primary btn-sm" onClick={() => navigate(`/customer/hotel/${q.hotelId}`)}>View & Accept</button>
                                <span style={{ padding: '6px 12px', background: 'var(--bg)', borderRadius: 4, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                  Status: {q.status}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {displayed.map(booking => {
            const sc = statusConfig[booking.status] || statusConfig.confirmed;
            return (
              <div key={booking.id} className="card" style={{ overflow: 'hidden' }}>
                <div className="card-body">
                  <div className="flex-between mb-2">
                    <div>
                      <h3 style={{ marginBottom: 4 }}>{booking.hotelName}</h3>
                      <p style={{ color: '#64748b', fontSize: '0.85rem' }}>🛏️ {booking.roomType} Room</p>
                    </div>
                    <span className={`badge ${sc.class}`}>{sc.icon} {sc.label}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 24, fontSize: '0.9rem', color: '#475569', marginBottom: 16, flexWrap: 'wrap' }}>
                    <span>📅 {new Date(booking.checkIn).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    <span>→</span>
                    <span>{new Date(booking.checkOut).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    <span style={{ fontWeight: 700, color: '#0f766e' }}>₹{booking.totalPrice?.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {booking.status === 'confirmed' && (
                      <>
                        <button className="btn btn-primary btn-sm" onClick={() => navigate(`/customer/checkin/${booking.id}`)}>📋 Online Check-In</button>
                        <button className="btn btn-outline btn-sm" onClick={() => navigate(`/customer/qr/${booking.id}`)}>📱 View QR Pass</button>
                      </>
                    )}
                    {booking.status === 'checked-in' && (
                      <button className="btn btn-primary btn-sm" onClick={() => navigate(`/customer/qr/${booking.id}`)}>📱 Show QR Pass</button>
                    )}
                    {booking.status === 'checked-out' && !booking.rating && (
                      <button className="btn btn-outline btn-sm" onClick={() => setRatingModal({ show: true, bookingId: booking.id, rating: 5, comment: '' })}>⭐ Leave a Review</button>
                    )}
                    {booking.rating && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#fef3c7', padding: '4px 12px', borderRadius: 100, fontSize: '0.85rem', color: '#b45309', fontWeight: 600 }}>
                        {booking.rating} ★ Rated
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Rating Modal */}
      {ratingModal.show && (
        <div className="modal-overlay" onClick={() => setRatingModal({ show: false, bookingId: null, rating: 0, comment: '' })}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: 16 }}>Rate Your Stay</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>How was your experience at the property?</p>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 32 }}>
              {[1, 2, 3, 4, 5].map(star => (
                <button 
                  key={star} 
                  onClick={() => setRatingModal({ ...ratingModal, rating: star })}
                  style={{ background: 'none', border: 'none', fontSize: '2.5rem', cursor: 'pointer', color: star <= ratingModal.rating ? 'var(--warning)' : 'var(--border)' }}
                >
                  ★
                </button>
              ))}
            </div>
            
            <div style={{ marginBottom: 24, textAlign: 'left' }}>
              <label className="form-label" style={{ fontSize: '0.9rem' }}>Share your experience (Optional)</label>
              <textarea 
                className="form-textarea" 
                placeholder="What did you like about your stay?"
                value={ratingModal.comment}
                onChange={e => setRatingModal({ ...ratingModal, comment: e.target.value })}
                style={{ background: 'var(--bg)', minHeight: 80 }}
              />
            </div>
            
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setRatingModal({ show: false, bookingId: null, rating: 0, comment: '' })}>Cancel</button>
              <button className="btn btn-primary" onClick={handleRateSubmit}>Submit Review</button>
            </div>
          </div>
        </div>
      )}

      {chatInfo && (
        <ChatModal 
          leadId={chatInfo.leadId} 
          hotelId={chatInfo.hotelId} 
          sender="customer" 
          onClose={() => setChatInfo(null)} 
        />
      )}
    </div>
  );
}
