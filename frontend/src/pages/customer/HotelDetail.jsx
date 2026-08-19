import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function HotelDetail() {
  const { id } = useParams();
  const { hotels, quotes, leads, acceptQuote, counterQuote } = useApp();
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const hotel = hotels.find(h => h.id === id);
  const [selectedRoom, setSelectedRoom] = useState(hotel?.roomTypes[0] || null);
  const [bookingQuote, setBookingQuote] = useState(null);
  const [guestName, setGuestName] = useState(user?.name || '');
  const [paymentStep, setPaymentStep] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [addons, setAddons] = useState({ transfer: false, breakfast: false, spa: false });

  // Calculate dynamic total
  const addonTotal = (addons.transfer ? 1500 : 0) + (addons.breakfast ? 800 : 0) + (addons.spa ? 2000 : 0);
  const finalPrice = bookingQuote ? bookingQuote.price + addonTotal : 0;

  if (!hotel) return (
    <div style={{ textAlign: 'center', padding: '120px 0' }}>
      <h3 style={{ fontFamily: 'var(--font-sans)', color: 'var(--text-secondary)' }}>Hotel not found</h3>
    </div>
  );

  const userLeads = leads.filter(l => l.customerId === (user?.id || '').toString());
  const userLeadIds = userLeads.map(l => l.id.toString());
  const hotelQuotes = quotes.filter(q => q.hotelId === id && userLeadIds.includes(q.leadId.toString()));

  const handleConfirmBooking = () => {
    if (!guestName.trim()) {
      addToast('Please provide a guest name', 'error');
      return;
    }
    setPaymentStep(true);
  };

  const processPaymentAndBook = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const lead = leads.find(l => l.id === bookingQuote.leadId);
      if (!lead) return;
      acceptQuote(bookingQuote.id, lead.id, user.id, guestName, hotel.id, hotel.name, lead.roomType, lead.checkIn, lead.checkOut, finalPrice);
      setIsProcessing(false);
      setBookingQuote(null);
      setPaymentStep(false);
      addToast('Payment successful! Booking confirmed.', 'success');
      navigate('/customer/trips');
    }, 1500);
  };

  return (
    <div className="fade-in pb-5" style={{ paddingBottom: 120 }}>
      {/* Full-bleed style photo gallery */}
      <div style={{ position: 'relative', height: '60vh', minHeight: 400, width: '100%', marginBottom: 48, background: 'black' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', height: '100%', gap: 4 }}>
          {hotel.photos.length >= 1 && (
            <div style={{ backgroundImage: `url(${hotel.photos[0]})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.9 }} />
          )}
          {hotel.photos.length >= 2 && (
            <div style={{ backgroundImage: `url(${hotel.photos[1]})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.9 }} />
          )}
          {/* Fallback image if there isn't a 3rd one */}
          <div style={{ backgroundImage: `url(${hotel.photos[2] || hotel.photos[0]})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.9 }} />
        </div>
        
        {/* Gradient overlay at bottom for smooth transition */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 160, background: 'linear-gradient(to top, var(--bg) 0%, transparent 100%)' }} />
        
        {/* Back button over the image */}
        <button 
          onClick={() => navigate(-1)} 
          style={{ position: 'absolute', top: 32, left: 48, background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.4)', color: 'white', padding: '10px 24px', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', transition: 'var(--transition)' }}
          onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.4)'}
          onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
        >
          ← Back
        </button>
      </div>

      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 64 }}>
          
          {/* Left Column: Details */}
          <div>
            <div className="flex-between" style={{ marginBottom: 16, alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 8 }}>{hotel.category} Collection</span>
                <h1 style={{ fontSize: '3rem', marginBottom: 16, lineHeight: 1.1 }}>{hotel.name}</h1>
                <p style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6, fontSize: '1.1rem' }}>📍 {hotel.location}</p>
              </div>
            </div>

            <p style={{ color: 'var(--text)', fontSize: '1.1rem', lineHeight: 1.8, marginBottom: 48, opacity: 0.9 }}>
              {hotel.description}
            </p>

            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 48, marginBottom: 48 }}>
              <h3 style={{ fontSize: '1.6rem', marginBottom: 24 }}>Property Amenities</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {hotel.amenities.map(a => (
                  <span key={a} style={{ padding: '10px 20px', border: '1px solid var(--border)', borderRadius: 0, fontSize: '0.85rem', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text)' }}>
                    {a}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 48, marginBottom: 48 }}>
              <h3 style={{ fontSize: '1.6rem', marginBottom: 24 }}>Accommodations</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {hotel.roomTypes.map(rt => (
                  <div 
                    key={rt.type} 
                    onClick={() => setSelectedRoom(rt)}
                    style={{ 
                      padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                      background: 'white', cursor: 'pointer', transition: 'var(--transition)',
                      border: selectedRoom?.type === rt.type ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                      boxShadow: selectedRoom?.type === rt.type ? 'var(--shadow-md)' : 'none'
                    }}
                  >
                    <span style={{ fontWeight: 600, fontSize: '1.2rem', fontFamily: 'var(--font-serif)' }}>{rt.type}</span>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontWeight: 600, color: 'var(--primary)', fontSize: '1.4rem' }}>₹{rt.price.toLocaleString()}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>Per Night</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quotes */}
            {hotelQuotes.length > 0 && (
              <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 48 }}>
                <h3 style={{ fontSize: '1.6rem', marginBottom: 24 }}>Your Exclusive Offers</h3>
                {hotelQuotes.map(q => (
                  <div key={q.id} style={{ padding: 32, marginBottom: 24, background: 'var(--primary)', color: 'white' }}>
                    <div className="flex-between" style={{ marginBottom: 16 }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: q.status === 'accepted' ? 'var(--success)' : 'var(--accent)' }}>
                        {q.status === 'accepted' ? '✓ Accepted' : '★ Custom Quote Received'}
                      </span>
                      <span style={{ fontWeight: 600, fontSize: '1.5rem', color: 'white' }}>₹{q.price.toLocaleString()}</span>
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.1rem', lineHeight: 1.6, marginBottom: 24 }}>"{q.message}"</p>
                    {q.status === 'sent' && (
                      <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
                        <button className="btn btn-accent" onClick={() => {
                          setGuestName(user?.name || '');
                          setBookingQuote(q);
                        }} style={{ padding: '14px 32px' }}>
                          Accept & Book Now
                        </button>
                        <button className="btn btn-outline" onClick={async () => {
                          const newPrice = prompt(`Enter your counter-offer for ${hotel.name} (Current Quote: ₹${q.price}):`);
                          if(newPrice && !isNaN(newPrice)) {
                            const success = await counterQuote(q.id, parseInt(newPrice));
                            if (success) {
                              addToast(`Counter-offer of ₹${newPrice} submitted to ${hotel.name}! They will review it shortly.`, 'success');
                            } else {
                              addToast('Failed to submit counter-offer', 'error');
                            }
                          }
                        }} style={{ padding: '14px 32px', color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}>
                          Make Counter-Offer
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Booking Widget */}
          <div>
            <div style={{ position: 'sticky', top: 120, background: 'white', padding: 40, border: '1px solid var(--border)', boxShadow: 'var(--shadow-xl)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, paddingBottom: 32, borderBottom: '1px solid var(--border-light)' }}>
                <div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 400, fontFamily: 'var(--font-serif)', color: 'var(--primary)', lineHeight: 1 }}>
                    {hotel.rating}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 4 }}>
                    {hotel.reviewCount} Reviews
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4, color: 'var(--accent)' }}>
                  ★★★★★
                </div>
              </div>
              
              <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                  {selectedRoom?.type || 'Starting'} Rate
                </div>
                <div style={{ fontSize: '2.5rem', fontWeight: 600, color: 'var(--primary)', lineHeight: 1 }}>
                  ₹{selectedRoom ? selectedRoom.price.toLocaleString() : hotel.roomTypes[0].price.toLocaleString()}
                </div>
              </div>
              
              <button 
                className="btn btn-primary btn-block" 
                style={{ padding: '16px', fontSize: '1rem', letterSpacing: '0.1em' }}
                onClick={() => navigate(`/customer/find?room=${selectedRoom?.type}&destination=${encodeURIComponent(hotel.location)}`)}
              >
                Submit Requirement
              </button>
              
              <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 16, lineHeight: 1.5 }}>
                Submit your exact dates and preferences.<br/>Let our properties compete for you.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Booking / Payment Modal */}
      {bookingQuote && (
        <div className="modal-overlay" onClick={() => !isProcessing && setBookingQuote(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            {!paymentStep ? (
              <>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', marginBottom: 12 }}>Confirm Reservation</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Please confirm the primary guest details for this booking.</p>
                
                <div className="form-group" style={{ marginBottom: 32 }}>
                  <label className="form-label">Primary Guest Name</label>
                  <input 
                    className="form-input" 
                    value={guestName} 
                    onChange={e => setGuestName(e.target.value)} 
                    placeholder="Enter the name of the guest checking in"
                  />
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 8 }}>
                    You can book this for yourself or on behalf of someone else.
                  </div>
                </div>

                <div style={{ background: 'var(--bg)', padding: 16, borderRadius: 8, marginBottom: 32, display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Total Amount</span>
                  <span style={{ fontSize: '1.2rem', fontFamily: 'var(--font-serif)', fontWeight: 600, color: 'var(--primary)' }}>
                    ₹{bookingQuote.price.toLocaleString()}
                  </span>
                </div>

                <div className="modal-actions" style={{ marginTop: 0 }}>
                  <button className="btn btn-outline" onClick={() => setBookingQuote(null)}>Cancel</button>
                  <button className="btn btn-accent" onClick={handleConfirmBooking}>Proceed to Payment</button>
                </div>
              </>
            ) : (
              <>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', marginBottom: 12 }}>Secure Payment</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Enhance your stay and choose your payment method.</p>

                {/* Upselling Add-ons */}
                <div style={{ background: 'var(--bg)', padding: '16px', borderRadius: '8px', marginBottom: '24px', border: '1px solid var(--border-light)' }}>
                  <h4 style={{ marginBottom: 16, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Enhance Your Stay</h4>
                  
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <input type="checkbox" checked={addons.transfer} onChange={e => setAddons({...addons, transfer: e.target.checked})} style={{ width: 18, height: 18, accentColor: 'var(--primary)' }} />
                      <span>🚖 Airport Chauffeur Transfer</span>
                    </div>
                    <span style={{ fontWeight: 600 }}>+₹1,500</span>
                  </label>
                  
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <input type="checkbox" checked={addons.breakfast} onChange={e => setAddons({...addons, breakfast: e.target.checked})} style={{ width: 18, height: 18, accentColor: 'var(--primary)' }} />
                      <span>🥐 Daily Buffet Breakfast</span>
                    </div>
                    <span style={{ fontWeight: 600 }}>+₹800</span>
                  </label>
                  
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <input type="checkbox" checked={addons.spa} onChange={e => setAddons({...addons, spa: e.target.checked})} style={{ width: 18, height: 18, accentColor: 'var(--primary)' }} />
                      <span>🧖‍♀️ Premium Spa Access</span>
                    </div>
                    <span style={{ fontWeight: 600 }}>+₹2,000</span>
                  </label>
                </div>

                <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                  <button 
                    className="btn" 
                    style={{ flex: 1, padding: 12, border: `2px solid ${paymentMethod === 'card' ? 'var(--accent)' : 'var(--border)'}`, background: paymentMethod === 'card' ? 'var(--bg)' : 'transparent', color: 'var(--text)' }}
                    onClick={() => setPaymentMethod('card')}
                  >
                    💳 Credit/Debit
                  </button>
                  <button 
                    className="btn" 
                    style={{ flex: 1, padding: 12, border: `2px solid ${paymentMethod === 'upi' ? 'var(--accent)' : 'var(--border)'}`, background: paymentMethod === 'upi' ? 'var(--bg)' : 'transparent', color: 'var(--text)' }}
                    onClick={() => setPaymentMethod('upi')}
                  >
                    📱 UPI
                  </button>
                </div>

                {paymentMethod === 'card' ? (
                  <div style={{ marginBottom: 24 }}>
                    <div className="form-group mb-2">
                      <input className="form-input" placeholder="Card Number (e.g. 4111 1111 1111 1111)" />
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <input className="form-input" placeholder="MM/YY" style={{ flex: 1 }} />
                      <input className="form-input" placeholder="CVV" style={{ flex: 1 }} />
                    </div>
                  </div>
                ) : (
                  <div className="form-group" style={{ marginBottom: 24 }}>
                    <input className="form-input" placeholder="Enter UPI ID (e.g. username@okaxis)" />
                  </div>
                )}

                <div style={{ background: 'var(--bg)', padding: 16, borderRadius: 8, marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'block' }}>Amount to Pay</span>
                    {addonTotal > 0 && <span style={{ fontSize: '0.75rem', color: 'var(--accent)' }}>Includes ₹{addonTotal.toLocaleString()} in add-ons</span>}
                  </div>
                  <span style={{ fontSize: '1.6rem', fontFamily: 'var(--font-serif)', fontWeight: 600, color: 'var(--primary)', transition: 'all 0.3s' }}>
                    ₹{finalPrice.toLocaleString()}
                  </span>
                </div>

                <div className="modal-actions" style={{ marginTop: 0 }}>
                  <button className="btn btn-outline" disabled={isProcessing} onClick={() => setPaymentStep(false)}>Back</button>
                  <button className="btn btn-accent" disabled={isProcessing} onClick={processPaymentAndBook}>
                    {isProcessing ? 'Processing Payment...' : `Pay ₹${finalPrice.toLocaleString()}`}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
