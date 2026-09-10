import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import { Heart } from 'lucide-react';

export default function HotelDetail() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { hotels, quotes, leads, acceptQuote, counterQuote, submitRequirement, toggleWishlist, isWishlisted } = useApp();
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const hotel = hotels.find(h => h.id === id);
  const [hotelReviews, setHotelReviews] = useState([]);

  useEffect(() => {
    if (hotel?.id) {
      api.getHotelReviews(hotel.id)
        .then(data => setHotelReviews(Array.isArray(data) ? data : []))
        .catch(() => setHotelReviews([]));
    }
  }, [hotel?.id]);

  // Dates & Stay State
  const defaultCheckIn = searchParams.get('checkIn') || new Date().toISOString().split('T')[0];
  const nextThreeDays = new Date();
  nextThreeDays.setDate(nextThreeDays.getDate() + 3);
  const defaultCheckOut = searchParams.get('checkOut') || nextThreeDays.toISOString().split('T')[0];

  const [checkIn, setCheckIn] = useState(defaultCheckIn);
  const [checkOut, setCheckOut] = useState(defaultCheckOut);
  const [guests, setGuests] = useState(Number(searchParams.get('guests')) || 2);
  const [roomsCount, setRoomsCount] = useState(Number(searchParams.get('rooms')) || 1);

  // Selected Room & Modal States
  const [selectedRoom, setSelectedRoom] = useState(hotel?.roomTypes?.[0] || null);
  const [viewRoomModal, setViewRoomModal] = useState({ show: false, room: null, activeImgIdx: 0 });
  const [selectRoomModal, setSelectRoomModal] = useState({ show: false, room: null });

  // Payment / Existing Quote Flow States
  const [bookingQuote, setBookingQuote] = useState(null);
  const [guestName, setGuestName] = useState(user?.name || '');
  const [paymentStep, setPaymentStep] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [addons, setAddons] = useState({ transfer: false, breakfast: false, spa: false });

  if (!hotel) return (
    <div style={{ textAlign: 'center', padding: '120px 0' }}>
      <h3 style={{ fontFamily: 'var(--font-sans)', color: 'var(--text-secondary)' }}>Hotel not found</h3>
    </div>
  );

  // Night calculation helper
  const calcNights = () => {
    if (!checkIn || !checkOut) return 3;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  };

  const nights = calcNights();

  // Price calculations
  const addonTotal = (addons.transfer ? 1500 : 0) + (addons.breakfast ? 800 : 0) + (addons.spa ? 2000 : 0);
  const finalPrice = bookingQuote ? bookingQuote.price + addonTotal : 0;

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

  const handleSelectRoomSubmit = async (room) => {
    const baseStayPrice = room.price * nights * roomsCount;
    const taxes = Math.round(baseStayPrice * 0.18);
    const totalEst = baseStayPrice + taxes;

    const lead = await submitRequirement({
      customerId: user?.id || 1,
      customerName: user?.name || 'Guest User',
      customerEmail: user?.email || 'guest@hotel.com',
      customerPhone: user?.phone || '',
      destination: hotel.location,
      checkIn: checkIn,
      checkOut: checkOut,
      guests: guests,
      roomType: room.type,
      budget: totalEst,
      purpose: 'Leisure',
      preferences: `Selected ${roomsCount}x ${room.type} at ₹${room.price}/night. Total quote: ₹${totalEst.toLocaleString()}`,
      specific_hotel_id: parseInt(hotel.id)
    });

    setSelectRoomModal({ show: false, room: null });

    if (lead) {
      addToast(`Selected ${room.type} at ${hotel.name}! Your lead request has been placed.`, 'success');
      navigate('/customer/trips?tab=requests');
    }
  };

  return (
    <div className="fade-in pb-5" style={{ paddingBottom: 120 }}>
      {/* Photo gallery header */}
      <div style={{ position: 'relative', height: '55vh', minHeight: 380, width: '100%', marginBottom: 40, background: 'black' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', height: '100%', gap: 4 }}>
          {hotel.photos.length >= 1 && (
            <div style={{ backgroundImage: `url(${hotel.photos[0]})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.9 }} />
          )}
          {hotel.photos.length >= 2 && (
            <div style={{ backgroundImage: `url(${hotel.photos[1]})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.9 }} />
          )}
          <div style={{ backgroundImage: `url(${hotel.photos[2] || hotel.photos[0]})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.9 }} />
        </div>
        
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 140, background: 'linear-gradient(to top, var(--bg) 0%, transparent 100%)' }} />
        
        <button 
          onClick={() => navigate(-1)} 
          style={{ position: 'absolute', top: 32, left: 48, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', padding: '10px 24px', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', transition: 'var(--transition)' }}
        >
          ← Back
        </button>

        {/* Floating Heart Button in Gallery */}
        <button 
          onClick={() => {
            const added = toggleWishlist(hotel.id);
            if (added) addToast(`Added "${hotel.name}" to your wishlist!`, 'success');
            else addToast(`Removed "${hotel.name}" from your wishlist`, 'info');
          }}
          style={{ position: 'absolute', top: 32, right: 48, background: isWishlisted(hotel.id) ? '#FFF1F2' : 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', border: `1px solid ${isWishlisted(hotel.id) ? '#FECDD3' : 'rgba(255,255,255,0.3)'}`, color: isWishlisted(hotel.id) ? '#E11D48' : 'white', width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'var(--transition)', zIndex: 10 }}
          title={isWishlisted(hotel.id) ? "Remove from wishlist" : "Save to wishlist"}
        >
          <Heart size={20} color={isWishlisted(hotel.id) ? "#E11D48" : "white"} fill={isWishlisted(hotel.id) ? "#E11D48" : "none"} />
        </button>
      </div>

      <div className="container">
        <div className="hotel-detail-grid">
          
          {/* Main Content */}
          <div>
            <div style={{ marginBottom: 32 }}>
              <div className="flex-between" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 8 }}>{hotel.category} Collection</span>
                  <h1 className="hotel-detail-title" style={{ marginBottom: 12, lineHeight: 1.15, wordBreak: 'break-word' }}>{hotel.name}</h1>
                  <p style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6, fontSize: '1.05rem', wordBreak: 'break-word' }}>📍 {hotel.location} — {hotel.address}</p>
                </div>

                <button 
                  type="button"
                  onClick={() => {
                    const added = toggleWishlist(hotel.id);
                    if (added) addToast(`Added "${hotel.name}" to your wishlist!`, 'success');
                    else addToast(`Removed "${hotel.name}" from your wishlist`, 'info');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 22px',
                    borderRadius: 9999,
                    border: `1.5px solid ${isWishlisted(hotel.id) ? '#FECDD3' : 'var(--border)'}`,
                    background: isWishlisted(hotel.id) ? '#FFF1F2' : 'white',
                    color: isWishlisted(hotel.id) ? '#E11D48' : 'var(--text)',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'all 0.2s',
                    marginTop: 8
                  }}
                >
                  <Heart 
                    size={18} 
                    color={isWishlisted(hotel.id) ? "#E11D48" : "var(--text-secondary)"} 
                    fill={isWishlisted(hotel.id) ? "#E11D48" : "none"} 
                    className={isWishlisted(hotel.id) ? "wishlist-heart-pulse" : ""}
                  />
                  <span>{isWishlisted(hotel.id) ? 'Saved in Wishlist' : 'Save to Wishlist'}</span>
                </button>
              </div>
            </div>

            <p style={{ color: 'var(--text)', fontSize: '1.05rem', lineHeight: 1.8, marginBottom: 40, opacity: 0.9 }}>
              {hotel.description}
            </p>

            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 32, marginBottom: 48 }}>
              <h3 style={{ fontSize: '1.5rem', marginBottom: 20 }}>Property Amenities</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {hotel.amenities.map(a => (
                  <span key={a} style={{ padding: '8px 18px', border: '1px solid var(--border)', borderRadius: 20, fontSize: '0.85rem', fontWeight: 500, color: 'var(--text)', background: 'white' }}>
                    ✓ {a}
                  </span>
                ))}
              </div>
            </div>

            {/* --- ROOM SELECTION SECTION --- */}
            <div id="available-rooms" style={{ borderTop: '2px solid var(--primary)', paddingTop: 36, marginBottom: 48 }}>
              <div className="flex-between mb-4" style={{ alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <h2 style={{ fontSize: '2rem', margin: 0, fontFamily: 'var(--font-serif)' }}>Rooms Available</h2>
                  <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0', fontSize: '0.95rem' }}>Select your preferred room type for your stay</p>
                </div>
                <div style={{ background: 'var(--primary)', color: 'white', padding: '6px 16px', borderRadius: 20, fontSize: '0.85rem', fontWeight: 600 }}>
                  {hotel.roomTypes.length} Room Types Available
                </div>
              </div>

              {/* Interactive Stay Selector Bar */}
              <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 32, boxShadow: 'var(--shadow-sm)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16, alignItems: 'center' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Check-In</label>
                  <input type="date" className="form-input" style={{ padding: '8px 12px', fontSize: '0.9rem' }} value={checkIn} onChange={e => setCheckIn(e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Check-Out</label>
                  <input type="date" className="form-input" style={{ padding: '8px 12px', fontSize: '0.9rem' }} value={checkOut} onChange={e => setCheckOut(e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Guests</label>
                  <select className="form-select" style={{ padding: '8px 12px', fontSize: '0.9rem' }} value={guests} onChange={e => setGuests(Number(e.target.value))}>
                    {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} {n === 1 ? 'Guest' : 'Guests'}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Rooms</label>
                  <select className="form-select" style={{ padding: '8px 12px', fontSize: '0.9rem' }} value={roomsCount} onChange={e => setRoomsCount(Number(e.target.value))}>
                    {[1,2,3,4].map(n => <option key={n} value={n}>{n} {n === 1 ? 'Room' : 'Rooms'}</option>)}
                  </select>
                </div>
                <div style={{ textAlign: 'center', background: 'var(--bg)', padding: '10px 14px', borderRadius: 8 }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Stay Duration</div>
                  <div style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1.1rem' }}>{nights} {nights === 1 ? 'Night' : 'Nights'}</div>
                </div>
              </div>

              {/* Room Cards List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                {hotel.roomTypes.map(rt => {
                  const baseStayPrice = rt.price * nights * roomsCount;

                  return (
                    <div 
                      key={rt.type} 
                      style={{ 
                        background: 'white', borderRadius: 12, border: selectedRoom?.type === rt.type ? '2px solid var(--primary)' : '1px solid var(--border)',
                        overflow: 'hidden', boxShadow: selectedRoom?.type === rt.type ? 'var(--shadow-md)' : 'var(--shadow-sm)',
                        display: 'grid', gridTemplateColumns: '300px 1fr', transition: 'all 0.2s'
                      }}
                    >
                      {/* Left Room Thumbnail */}
                      <div style={{ position: 'relative', height: '100%', minHeight: 240 }}>
                        <img 
                          src={rt.images?.[0]?.url || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600'} 
                          alt={rt.type} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <span style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(15,118,110,0.9)', color: 'white', fontSize: '0.75rem', fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}>
                          {rt.quantity || 3} Rooms Available
                        </span>
                      </div>

                      {/* Right Details */}
                      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <div className="flex-between" style={{ alignItems: 'flex-start', marginBottom: 8 }}>
                            <h3 style={{ margin: 0, fontSize: '1.4rem', fontFamily: 'var(--font-serif)', color: 'var(--text)' }}>{rt.type}</h3>
                            <span style={{ fontSize: '0.8rem', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '4px 10px', borderRadius: 16, fontWeight: 600 }}>
                              ✓ {rt.cancellationPolicy || 'Free Cancellation'}
                            </span>
                          </div>

                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: '0 0 12px 0', fontWeight: 600 }}>
                            👥 {rt.maxGuests || 2} Guests &nbsp;|&nbsp; 🛏️ {rt.bedType || 'King Bed'} &nbsp;|&nbsp; 📐 {rt.roomSize || '350 sq.ft'}
                          </p>

                          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0 0 16px 0', lineHeight: 1.5 }}>
                            {rt.description}
                          </p>

                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                            {(rt.amenities || ['Free Wi-Fi', 'Breakfast Included', 'AC']).map(a => (
                              <span key={a} style={{ fontSize: '0.75rem', background: 'var(--bg)', padding: '3px 10px', borderRadius: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>
                                ✓ {a}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Pricing & Action buttons */}
                        <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                          <div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', lineHeight: 1 }}>
                              ₹{rt.price.toLocaleString()} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 400 }}>/ night</span>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                              Total stay: <strong>₹{baseStayPrice.toLocaleString()}</strong> for {nights} {nights === 1 ? 'night' : 'nights'}
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: 10 }}>
                            <button 
                              className="btn btn-outline" 
                              style={{ padding: '8px 16px', fontSize: '0.9rem' }}
                              onClick={() => {
                                setSelectedRoom(rt);
                                setViewRoomModal({ show: true, room: rt, activeImgIdx: 0 });
                              }}
                            >
                              View Room
                            </button>
                            <button 
                              className="btn btn-accent" 
                              style={{ padding: '8px 20px', fontSize: '0.9rem' }}
                              onClick={() => {
                                setSelectedRoom(rt);
                                setSelectRoomModal({ show: true, room: rt });
                              }}
                            >
                              Select Room
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Exclusive Quotes received for this hotel */}
            {hotelQuotes.length > 0 && (
              <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 36 }}>
                <h3 style={{ fontSize: '1.6rem', marginBottom: 24 }}>Your Exclusive Offers</h3>
                {hotelQuotes.map(q => (
                  <div key={q.id} style={{ padding: 32, marginBottom: 24, background: 'var(--primary)', color: 'white', borderRadius: 12 }}>
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

          {/* Sticky Sidebar Summary */}
          <div>
            <div style={{ position: 'sticky', top: 100, background: 'white', padding: 32, borderRadius: 12, border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid var(--border-light)' }}>
                <div>
                  <div style={{ fontSize: '2.2rem', fontWeight: 700, fontFamily: 'var(--font-serif)', color: 'var(--primary)', lineHeight: 1 }}>
                    ⭐ {hotel.rating}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 4 }}>
                    {hotel.reviewCount} Guest Reviews
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.75rem', background: '#e0f2fe', color: '#0369a1', padding: '4px 10px', borderRadius: 12, fontWeight: 700 }}>
                    Verified Hotel
                  </span>
                </div>
              </div>
              
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                  {selectedRoom ? selectedRoom.type : 'Selected Room'}
                </div>
                <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--primary)', lineHeight: 1 }}>
                  ₹{selectedRoom ? selectedRoom.price.toLocaleString() : hotel.roomTypes[0].price.toLocaleString()}
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 400 }}> / night</span>
                </div>
              </div>

              <a 
                href="#available-rooms" 
                className="btn btn-primary btn-block" 
                style={{ padding: '14px', fontSize: '0.95rem', letterSpacing: '0.05em', textAlign: 'center', display: 'block', textDecoration: 'none' }}
              >
                Browse & Select Rooms
              </a>
              
              <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 16, lineHeight: 1.5 }}>
                Choose your room above to get custom quotes directly from hotel managers.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Guest Reviews & Star Ratings Section */}
      <div className="card" style={{ marginTop: 32, marginBottom: 40 }}>
        <div className="card-body" style={{ padding: 32 }}>
          <div className="flex-between" style={{ marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.6rem', margin: '0 0 6px' }}>Guest Reviews & Ratings</h3>
              <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>Verified feedback from guests who stayed at {hotel.name}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg)', padding: '10px 20px', borderRadius: 12, border: '1px solid var(--border)' }}>
              <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)', fontFamily: 'var(--font-serif)' }}>
                {hotelReviews.length > 0 ? (hotelReviews.reduce((acc, r) => acc + r.rating, 0) / hotelReviews.length).toFixed(1) : '4.8'}
              </span>
              <div>
                <div style={{ color: '#f59e0b', fontSize: '1.1rem' }}>★★★★★</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {hotelReviews.length} {hotelReviews.length === 1 ? 'verified review' : 'verified reviews'}
                </div>
              </div>
            </div>
          </div>

          {hotelReviews.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', background: 'var(--bg)', borderRadius: 12, border: '1px dashed var(--border)' }}>
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>🌟</div>
              <p style={{ color: 'var(--text)', fontWeight: 600, margin: '0 0 4px' }}>Be the first to review!</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
                Guests who complete their stay can leave verified reviews from their Trips page.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
              {hotelReviews.map((r, i) => (
                <div key={r.id || i} style={{ background: 'var(--bg)', padding: 20, borderRadius: 12, border: '1px solid var(--border-light)' }}>
                  <div className="flex-between" style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>
                        {(r.customerName || 'G')[0]}
                      </div>
                      <div>
                        <strong style={{ fontSize: '0.9rem', display: 'block', color: 'var(--text)' }}>{r.customerName || 'Verified Traveler'}</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'Recent Stay'}</span>
                      </div>
                    </div>
                    <span style={{ background: '#fef3c7', color: '#b45309', fontWeight: 700, fontSize: '0.8rem', padding: '2px 8px', borderRadius: 4 }}>
                      ★ {r.rating}.0
                    </span>
                  </div>
                  <p style={{ color: 'var(--text)', fontSize: '0.9rem', lineHeight: 1.5, margin: 0 }}>
                    "{r.comment || 'Wonderful stay with excellent hospitality and comfort.'}"
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* --- VIEW ROOM DETAILS MODAL & IMAGE GALLERY --- */}
      {viewRoomModal.show && viewRoomModal.room && (
        <div 
          className="modal-overlay" 
          style={{ 
            position: 'fixed', top: 70, left: 0, right: 0, bottom: 0, 
            height: 'calc(100vh - 70px)', zIndex: 99999, 
            padding: '12px 16px 20px', display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
            background: 'rgba(15,15,15,0.75)', backdropFilter: 'blur(12px)' 
          }} 
          onClick={() => setViewRoomModal({ show: false, room: null, activeImgIdx: 0 })}
        >
          <div 
            className="modal" 
            onClick={e => e.stopPropagation()} 
            style={{ 
              maxWidth: 760, 
              width: '100%',
              maxHeight: 'calc(100vh - 100px)', 
              padding: 0, 
              overflow: 'hidden', 
              borderRadius: 16, 
              display: 'flex', 
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              margin: '0 auto'
            }}
          >
            {/* Modal Header */}
            <div style={{ padding: '14px 20px', background: 'var(--primary)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '1.2rem' }}>🛏️</span>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontFamily: 'var(--font-serif)', color: 'white' }}>{viewRoomModal.room.type}</h3>
              </div>
              <button 
                onClick={() => setViewRoomModal({ show: false, room: null, activeImgIdx: 0 })}
                style={{ 
                  background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', 
                  borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', 
                  fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.35)'}
                onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              >
                ✕
              </button>
            </div>

            {/* Scrollable Modal Body */}
            <div style={{ flex: 1, overflowY: 'auto', background: 'white' }}>
              {/* Gallery Image Display */}
              <div style={{ position: 'relative', height: 230, background: '#0f172a' }}>
                <img 
                  src={viewRoomModal.room.images?.[viewRoomModal.activeImgIdx]?.url || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1000'} 
                  alt={viewRoomModal.room.images?.[viewRoomModal.activeImgIdx]?.label || viewRoomModal.room.type}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'all 0.3s' }}
                />
                
                <div style={{ position: 'absolute', bottom: 10, left: 14, background: 'rgba(0,0,0,0.75)', color: 'white', padding: '4px 10px', borderRadius: 16, fontSize: '0.78rem', backdropFilter: 'blur(6px)' }}>
                  📷 {viewRoomModal.room.images?.[viewRoomModal.activeImgIdx]?.label || `Photo ${viewRoomModal.activeImgIdx + 1}`} ({viewRoomModal.activeImgIdx + 1}/{viewRoomModal.room.images?.length || 1})
                </div>
              </div>

              {/* Gallery Thumbnails Strip */}
              {viewRoomModal.room.images && viewRoomModal.room.images.length > 0 && (
                <div style={{ display: 'flex', gap: 6, padding: '8px 14px', background: '#0f172a', overflowX: 'auto' }}>
                  {viewRoomModal.room.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setViewRoomModal(prev => ({ ...prev, activeImgIdx: idx }))}
                      style={{
                        border: viewRoomModal.activeImgIdx === idx ? '2px solid var(--accent)' : '2px solid transparent',
                        borderRadius: 6, overflow: 'hidden', padding: 0, cursor: 'pointer', background: 'none', flexShrink: 0
                      }}
                    >
                      <img src={img.url} alt={img.label} style={{ width: 56, height: 38, objectFit: 'cover', display: 'block', opacity: viewRoomModal.activeImgIdx === idx ? 1 : 0.5 }} />
                    </button>
                  ))}
                </div>
              )}

              {/* Room Specs & Details Content */}
              <div style={{ padding: '18px 20px' }}>
                <div className="flex-between mb-2" style={{ alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.5rem', fontFamily: 'var(--font-serif)' }}>{viewRoomModal.room.type}</h3>
                    <p style={{ margin: '3px 0 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      👥 Max {viewRoomModal.room.maxGuests || 2} Guests &nbsp;•&nbsp; 🛏️ {viewRoomModal.room.bedType || 'King Bed'} &nbsp;•&nbsp; 📐 {viewRoomModal.room.roomSize || '350 sq.ft'}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>₹{viewRoomModal.room.price.toLocaleString()}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>per night</div>
                  </div>
                </div>

                <p style={{ color: 'var(--text)', fontSize: '0.88rem', lineHeight: 1.5, marginBottom: 14 }}>
                  {viewRoomModal.room.description}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, background: 'var(--bg)', padding: 12, borderRadius: 10, marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 2 }}>Breakfast</div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--primary)' }}>☕ {viewRoomModal.room.breakfast || 'Breakfast Included'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 2 }}>Cancellation Policy</div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--success)' }}>🛡️ {viewRoomModal.room.cancellationPolicy || 'Free Cancellation'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 2 }}>Check-In / Check-Out</div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>🕒 Check-In: 02:00 PM | Check-Out: 11:00 AM</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 2 }}>Availability</div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--accent)' }}>🏨 {viewRoomModal.room.quantity || 3} Rooms Available</div>
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: 6 }}>Room Amenities</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {(viewRoomModal.room.amenities || ['Free Wi-Fi', 'Breakfast Included', 'AC']).map(a => (
                      <span key={a} style={{ padding: '4px 10px', background: 'white', border: '1px solid var(--border)', borderRadius: 14, fontSize: '0.78rem', fontWeight: 600 }}>
                        ✓ {a}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Sticky Modal Footer */}
            <div style={{ padding: '12px 20px', background: '#f8fafc', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button 
                className="btn btn-outline" 
                style={{ padding: '8px 20px', fontSize: '0.85rem' }} 
                onClick={() => setViewRoomModal({ show: false, room: null, activeImgIdx: 0 })}
              >
                Close
              </button>
              <button 
                className="btn btn-accent" 
                style={{ padding: '8px 24px', fontSize: '0.85rem' }}
                onClick={() => {
                  const rm = viewRoomModal.room;
                  setViewRoomModal({ show: false, room: null, activeImgIdx: 0 });
                  setSelectRoomModal({ show: true, room: rm });
                }}
              >
                Select This Room
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- SELECT ROOM & QUOTE CONFIRMATION MODAL --- */}
      {selectRoomModal.show && selectRoomModal.room && (
        <div 
          className="modal-overlay" 
          style={{ 
            position: 'fixed', top: 70, left: 0, right: 0, bottom: 0, 
            height: 'calc(100vh - 70px)', zIndex: 99999, 
            padding: '16px', display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
            background: 'rgba(15,15,15,0.75)', backdropFilter: 'blur(12px)' 
          }} 
          onClick={() => setSelectRoomModal({ show: false, room: null })}
        >
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 550, maxHeight: 'calc(100vh - 100px)', overflowY: 'auto', borderRadius: 16 }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', marginBottom: 8 }}>Selected Room Summary</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 20, fontSize: '0.95rem' }}>Review your stay details and calculate total quote.</p>

            <div style={{ background: 'var(--bg)', padding: 18, borderRadius: 12, marginBottom: 20, border: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase' }}>Selected Room</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--font-serif)', color: 'var(--primary)', margin: '2px 0 6px' }}>
                {selectRoomModal.room.type}
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                📍 {hotel.name} ({hotel.location})
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20, fontSize: '0.9rem' }}>
              <div style={{ background: 'white', border: '1px solid var(--border)', padding: 12, borderRadius: 8 }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Check-In Date</span>
                <strong>📅 {new Date(checkIn).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
              </div>
              <div style={{ background: 'white', border: '1px solid var(--border)', padding: 12, borderRadius: 8 }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Check-Out Date</span>
                <strong>📅 {new Date(checkOut).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
              </div>
              <div style={{ background: 'white', border: '1px solid var(--border)', padding: 12, borderRadius: 8 }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Guests & Rooms</span>
                <strong>👥 {guests} Guests | 🛏️ {roomsCount} {roomsCount === 1 ? 'Room' : 'Rooms'}</strong>
              </div>
              <div style={{ background: 'white', border: '1px solid var(--border)', padding: 12, borderRadius: 8 }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Stay Duration</span>
                <strong>🌙 {nights} {nights === 1 ? 'Night' : 'Nights'}</strong>
              </div>
            </div>

            {/* Dynamic Quote Calculation Breakdown */}
            {(() => {
              const roomPrice = selectRoomModal.room.price;
              const subtotal = roomPrice * nights * roomsCount;
              const taxes = Math.round(subtotal * 0.18);
              const totalAmount = subtotal + taxes;

              return (
                <div style={{ background: '#f8fafc', padding: 20, borderRadius: 12, border: '1px dashed var(--border)', marginBottom: 24 }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Price & Quote Calculation</h4>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.95rem' }}>
                    <span>Selected Room: <strong>{selectRoomModal.room.type}</strong></span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                    <span>₹{roomPrice.toLocaleString()} × {nights} {nights === 1 ? 'night' : 'nights'} × {roomsCount} {roomsCount === 1 ? 'room' : 'rooms'}</span>
                    <span style={{ fontWeight: 600 }}>= ₹{subtotal.toLocaleString()}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                    <span>Taxes / existing charges (18% GST)</span>
                    <span style={{ fontWeight: 600 }}>= ₹{taxes.toLocaleString()}</span>
                  </div>

                  <div style={{ borderTop: '2px solid var(--border)', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text)' }}>Total</span>
                    <span style={{ fontWeight: 800, fontSize: '1.6rem', color: 'var(--primary)', fontFamily: 'var(--font-serif)' }}>
                      = ₹{totalAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })()}

            <div className="modal-actions" style={{ marginTop: 0 }}>
              <button className="btn btn-outline" onClick={() => setSelectRoomModal({ show: false, room: null })}>Cancel</button>
              <button className="btn btn-accent btn-lg" onClick={() => handleSelectRoomSubmit(selectRoomModal.room)}>
                Confirm & Submit Request
              </button>
            </div>
          </div>
        </div>
      )}

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
                <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Choose your payment method.</p>

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

                <div style={{ background: 'var(--bg)', padding: 16, borderRadius: 8, marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Amount to Pay</span>
                  <span style={{ fontSize: '1.6rem', fontFamily: 'var(--font-serif)', fontWeight: 600, color: 'var(--primary)' }}>
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
