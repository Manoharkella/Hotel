import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { 
  MapPin, 
  Calendar, 
  Users, 
  Search, 
  Send, 
  MessageSquare, 
  Handshake, 
  QrCode, 
  Heart, 
  Star, 
  ShieldCheck, 
  Sparkles,
  ChevronDown
} from 'lucide-react';

export default function CustomerHome() {
  const navigate = useNavigate();
  const { toggleWishlist, isWishlisted } = useApp();
  const { t } = useLanguage();
  const { addToast } = useToast();
  const [matchedHotels, setMatchedHotels] = useState([]);

  // Search state
  const [destination, setDestination] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(2);
  const [guestDropdown, setGuestDropdown] = useState(false);
  const guestRef = useRef(null);

  useEffect(() => {
    api.searchApprovedHotels().then(data => {
      setMatchedHotels(data.slice(0, 12));
    }).catch(console.error);
  }, []);

  // Close guest dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (guestRef.current && !guestRef.current.contains(e.target)) {
        setGuestDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    const params = new URLSearchParams();
    if (destination.trim()) params.append('location', destination.trim());
    if (checkIn) params.append('checkIn', checkIn);
    if (checkOut) params.append('checkOut', checkOut);
    if (guests) params.append('guests', guests.toString());

    navigate(`/customer/find?${params.toString()}`);
  };

  return (
    <div style={{ background: 'var(--bg)', width: '100%', overflowX: 'hidden' }}>
      {/* Luxury Hero Banner */}
      <section className="luxury-hero">
        <div className="luxury-hero-bg" />
        <div className="luxury-hero-overlay" />
        
        <div className="luxury-hero-content">
          {/* Main Title & Handwritten Quote Row */}
          <div className="hero-header-section">
            <div className="hero-main-copy">
              <span className="luxury-hero-subtitle">BESPOKE HOSPITALITY</span>
              <h1 className="luxury-hero-title">
                Discover Your<br />Next Extraordinary Stay
              </h1>
              <p className="luxury-hero-description">
                Post your travel needs, receive exclusive bids from hotels, 
                negotiate the best rates, and experience seamless, contactless stays with <strong>HotelIQ</strong>.
              </p>
            </div>

            {/* Handwritten Luxury Tagline */}
            <div className="hero-cursive-quote hide-on-mobile">
              <span className="hero-cursive-quote-text">
                More Than a Stay,<br />A Better Way to Travel
              </span>
              <div className="hero-cursive-quote-line" />
            </div>
          </div>

          {/* Floating Pill Search Card */}
          <form className="hero-search-card" onSubmit={handleSearchSubmit}>
            {/* Where to? */}
            <div className="search-field-segment">
              <div className="search-field-icon">
                <MapPin size={20} color="#EA580C" />
              </div>
              <div className="search-field-text">
                <span className="search-field-label">Where to?</span>
                <input 
                  type="text"
                  placeholder="e.g. Goa, Mumbai"
                  className="search-field-input"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                />
              </div>
            </div>

            <div className="search-field-divider hide-on-mobile" />

            {/* Check-in & Check-out Container (Grid on mobile, inline on desktop) */}
            <div className="search-mobile-date-grid" style={{ display: 'contents' }}>
              {/* Check-in */}
              <div className="search-field-segment">
                <div className="search-field-icon">
                  <Calendar size={18} color="#64748B" />
                </div>
                <div className="search-field-text">
                  <span className="search-field-label">Check-in</span>
                  <input 
                    type="date"
                    className="search-field-input"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    style={{ cursor: 'pointer' }}
                  />
                </div>
              </div>

              <div className="search-field-divider hide-on-mobile" />

              {/* Check-out */}
              <div className="search-field-segment">
                <div className="search-field-icon">
                  <Calendar size={18} color="#64748B" />
                </div>
                <div className="search-field-text">
                  <span className="search-field-label">Check-out</span>
                  <input 
                    type="date"
                    className="search-field-input"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    style={{ cursor: 'pointer' }}
                  />
                </div>
              </div>
            </div>

            <div className="search-field-divider hide-on-mobile" />

            {/* Guests */}
            <div className="search-field-segment" ref={guestRef} onClick={() => setGuestDropdown(!guestDropdown)}>
              <div className="search-field-icon">
                <Users size={19} color="#64748B" />
              </div>
              <div className="search-field-text">
                <span className="search-field-label">Guests</span>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <span className="search-field-sub" style={{ color: '#0F172A', fontWeight: 600 }}>
                    {guests} guest{guests > 1 ? 's' : ''}
                  </span>
                  <ChevronDown size={14} color="#64748B" style={{ marginLeft: 4 }} />
                </div>
              </div>

              {/* Guest dropdown */}
              {guestDropdown && (
                <div 
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: 10,
                    background: '#FFFFFF',
                    borderRadius: 14,
                    padding: '16px 20px',
                    boxShadow: '0 16px 36px rgba(0,0,0,0.18)',
                    border: '1px solid #E2E8F0',
                    zIndex: 100,
                    minWidth: 200,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0F172A' }}>Guests</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button 
                      type="button"
                      onClick={() => setGuests(Math.max(1, guests - 1))}
                      style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid #CBD5E1', background: '#F8FAFC', cursor: 'pointer', fontWeight: 700 }}
                    >-</button>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{guests}</span>
                    <button 
                      type="button"
                      onClick={() => setGuests(Math.min(10, guests + 1))}
                      style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid #CBD5E1', background: '#F8FAFC', cursor: 'pointer', fontWeight: 700 }}
                    >+</button>
                  </div>
                </div>
              )}
            </div>

            {/* Solid Orange Pill Search Button */}
            <button className="hero-search-btn" type="submit">
              <Search size={18} strokeWidth={2.5} />
              <span>Search</span>
            </button>
          </form>

          {/* 4 Feature Badges in Hero */}
          <div className="hero-features-grid">
            {/* 1. Post a Stay Lead */}
            <div className="hero-feature-pill" onClick={() => navigate('/customer/find')}>
              <div className="hero-feature-icon-badge">
                <Send size={20} />
              </div>
              <div className="hero-feature-text">
                <span className="hero-feature-title">Post a Stay Lead</span>
                <span className="hero-feature-desc">Share your travel needs</span>
              </div>
            </div>

            {/* 2. Get Hotel Bids */}
            <div className="hero-feature-pill" onClick={() => navigate('/customer/trips')}>
              <div className="hero-feature-icon-badge">
                <MessageSquare size={20} />
              </div>
              <div className="hero-feature-text">
                <span className="hero-feature-title">Get Hotel Bids</span>
                <span className="hero-feature-desc">Receive and compare offers</span>
              </div>
            </div>

            {/* 3. Negotiate & Book */}
            <div className="hero-feature-pill" onClick={() => navigate('/customer/find')}>
              <div className="hero-feature-icon-badge">
                <Handshake size={20} />
              </div>
              <div className="hero-feature-text">
                <span className="hero-feature-title">Negotiate & Book</span>
                <span className="hero-feature-desc">Chat and confirm best rates</span>
              </div>
            </div>

            {/* 4. Contactless Check-In */}
            <div className="hero-feature-pill" onClick={() => navigate('/customer/find')}>
              <div className="hero-feature-icon-badge">
                <QrCode size={20} />
              </div>
              <div className="hero-feature-text">
                <span className="hero-feature-title">Contactless Check-In</span>
                <span className="hero-feature-desc">Fast, secure and easy</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Trust Text with Carousel Dots */}
        <div style={{ textAlign: 'center', marginTop: 24, padding: '0 16px', display: 'none' }} className="mobile-trust-bar">
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.8rem', margin: '0 0 8px' }}>
            Trusted by travelers and hotels across India
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#EA580C' }} />
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(255,255,255,0.3)' }} />
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(255,255,255,0.3)' }} />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="section" style={{ background: '#FFFFFF', padding: '90px 0' }}>
        <div className="container">
          <div className="text-center" style={{ marginBottom: 64 }}>
            <span style={{ 
              fontFamily: 'var(--font-sans)', 
              fontSize: '0.82rem', 
              textTransform: 'uppercase', 
              letterSpacing: '0.2em', 
              color: '#EA580C', 
              fontWeight: 800,
              display: 'block', 
              marginBottom: 12 
            }}>
              HOW HOTELIQ WORKS
            </span>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '2.4rem', fontWeight: 600, color: '#0F172A' }}>
              A Smarter, Reverse Hotel Marketplace
            </h2>
            <p style={{ maxWidth: 620, margin: '16px auto 0', color: '#64748B', fontSize: '1rem', lineHeight: 1.6 }}>
              Instead of browsing fixed prices, post your trip requirements and let top-rated hotels compete with custom discounted bids.
            </p>
          </div>

          <div className="grid-3" style={{ gap: 32 }}>
            {[
              {
                num: '01',
                title: 'Broadcast Your Stay',
                desc: 'Set your destination, dates, budget and room preferences. Verified hotels receive your request instantly.',
                icon: Send
              },
              {
                num: '02',
                title: 'Receive Tailored Bids',
                desc: 'Hotels offer customized deals and room upgrades. Compare offers and negotiate directly in real-time chat.',
                icon: MessageSquare
              },
              {
                num: '03',
                title: 'Digital Contactless Check-In',
                desc: 'Confirm your booking, upload IDs securely online, and scan your instant QR Pass at the reception desk.',
                icon: QrCode
              }
            ].map((step, i) => (
              <div 
                key={i} 
                style={{ 
                  background: '#F8FAFC', 
                  borderRadius: 20, 
                  padding: '36px 30px', 
                  border: '1px solid #E2E8F0',
                  position: 'relative',
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: '#FFF7ED', color: '#EA580C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <step.icon size={24} />
                  </div>
                  <span style={{ fontSize: '2rem', fontFamily: 'Playfair Display, serif', color: '#CBD5E1', fontWeight: 700 }}>
                    {step.num}
                  </span>
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A', marginBottom: 10 }}>{step.title}</h3>
                <p style={{ color: '#64748B', fontSize: '0.92rem', lineHeight: 1.6 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Top South Indian Destinations */}
      <section className="section" style={{ background: '#FFFFFF', padding: '80px 0 30px' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <span style={{ 
              fontFamily: 'var(--font-sans)', 
              fontSize: '0.82rem', 
              textTransform: 'uppercase', 
              letterSpacing: '0.2em', 
              color: '#EA580C', 
              fontWeight: 800,
              display: 'block', 
              marginBottom: 8 
            }}>
              TOP REGIONS & STATES
            </span>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '2.4rem', fontWeight: 600, color: '#0F172A', margin: 0 }}>
              Explore South India Stays
            </h2>
            <p style={{ color: '#64748B', fontSize: '0.95rem', marginTop: 8 }}>
              Direct bookings, verified beach resorts, palace hotels & hill retreats
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 16
          }}>
            {[
              { name: 'Goa', tag: 'Beach Resorts & Villas', img: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=500&q=80', count: '5 Verified Stays' },
              { name: 'Kerala', tag: 'Backwaters & Tea Hills', img: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=500&q=80', count: '5 Verified Stays' },
              { name: 'Karnataka', tag: 'Palaces & Coffee Estates', img: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&q=80', count: '5 Verified Stays' },
              { name: 'Tamil Nadu', tag: 'Heritage & Hill Stations', img: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=500&q=80', count: '5 Verified Stays' },
              { name: 'Telangana', tag: 'Royal Nizam Luxury', img: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=500&q=80', count: '6 Verified Stays' },
              { name: 'Andhra Pradesh', tag: 'Coastal & Hill Valleys', img: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=500&q=80', count: '5 Verified Stays' }
            ].map(item => (
              <div
                key={item.name}
                onClick={() => navigate(`/customer/find?location=${encodeURIComponent(item.name)}`)}
                style={{
                  position: 'relative',
                  borderRadius: 16,
                  overflow: 'hidden',
                  height: 180,
                  cursor: 'pointer',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                  transition: 'all 0.25s ease'
                }}
                className="destination-card-hover"
              >
                <img src={item.img} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(15,23,42,0.85) 100%)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  padding: '16px 14px',
                  color: '#FFFFFF'
                }}>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.01em' }}>{item.name}</div>
                  <div style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>{item.tag}</div>
                  <div style={{ fontSize: '0.72rem', color: '#FBBF24', fontWeight: 700, marginTop: 4 }}>{item.count}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Collection Section */}
      <section id="featured" className="section" style={{ background: '#F8FAFC', padding: '90px 0' }}>
        <div className="container">
          <div className="flex-between" style={{ marginBottom: 48, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 20 }}>
            <div>
              <span style={{ 
                fontFamily: 'var(--font-sans)', 
                fontSize: '0.82rem', 
                textTransform: 'uppercase', 
                letterSpacing: '0.2em', 
                color: '#EA580C', 
                fontWeight: 800,
                display: 'block', 
                marginBottom: 8 
              }}>
                PREMIUM PORTFOLIO
              </span>
              <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '2.4rem', fontWeight: 600, color: '#0F172A', margin: 0 }}>
                Featured Extraordinary Stays
              </h2>
            </div>
            <button 
              className="btn" 
              onClick={() => navigate('/customer/find')}
              style={{
                background: '#FFFFFF',
                border: '1.5px solid #CBD5E1',
                color: '#0F172A',
                fontWeight: 700,
                padding: '12px 24px',
                borderRadius: 9999
              }}
            >
              View Full Portfolio →
            </button>
          </div>

          <div className="grid-3" style={{ gap: 28 }}>
            {matchedHotels.map((hotel) => (
              <div 
                key={hotel.id} 
                className="premium-hotel-card" 
                style={{
                  background: '#FFFFFF',
                  borderRadius: 18,
                  overflow: 'hidden',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                  cursor: 'pointer'
                }}
                onClick={() => navigate(`/customer/hotel/${hotel.id}`)}
              >
                <div className="img-wrapper" style={{ height: 240, position: 'relative' }}>
                  <img 
                    src={hotel.photos[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600'} 
                    alt={hotel.name} 
                    loading="lazy" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{ position: 'absolute', top: 16, left: 16 }}>
                    <span style={{ 
                      background: 'rgba(15, 23, 42, 0.75)', 
                      backdropFilter: 'blur(8px)',
                      color: '#FBBF24', 
                      fontSize: '0.75rem', 
                      fontWeight: 800, 
                      padding: '4px 10px', 
                      borderRadius: 9999,
                      letterSpacing: '0.05em'
                    }}>
                      ★ {hotel.rating || '4.9'} LUXURY
                    </span>
                  </div>

                  <button 
                    className={`wishlist-btn ${isWishlisted(hotel.id) ? 'active' : ''}`}
                    title={isWishlisted(hotel.id) ? "Remove from wishlist" : "Add to wishlist"}
                    onClick={(e) => {
                      e.stopPropagation();
                      const added = toggleWishlist(hotel.id);
                      if (added) {
                        addToast(`Added "${hotel.name}" to your wishlist!`, 'success');
                      } else {
                        addToast(`Removed "${hotel.name}" from wishlist`, 'info');
                      }
                    }}
                    style={{
                      position: 'absolute',
                      top: 14,
                      right: 14,
                      background: '#FFFFFF',
                      borderRadius: '50%',
                      width: 36,
                      height: 36,
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                    }}
                  >
                    <Heart 
                      size={18} 
                      color={isWishlisted(hotel.id) ? "#E11D48" : "#64748B"} 
                      fill={isWishlisted(hotel.id) ? "#E11D48" : "none"} 
                    />
                  </button>
                </div>

                <div style={{ padding: '22px 24px' }}>
                  <div style={{ fontSize: '0.78rem', color: '#EA580C', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
                    {hotel.location}
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A', marginBottom: 8, lineHeight: 1.3 }}>
                    {hotel.name}
                  </h3>
                  <p style={{ fontSize: '0.86rem', color: '#64748B', lineHeight: 1.5, marginBottom: 16, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {hotel.description || 'Experience world-class hospitality, gourmet dining, and beachfront infinity pools with bespoke service.'}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 14, borderTop: '1px solid #F1F5F9' }}>
                    <div>
                      <span style={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>Starting from</span>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A' }}>
                        ₹{hotel.rooms && hotel.rooms[0] ? hotel.rooms[0].price_per_night.toLocaleString() : '3,500'}
                        <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#64748B' }}> / night</span>
                      </div>
                    </div>
                    <button 
                      className="btn"
                      style={{
                        background: '#FFF7ED',
                        color: '#EA580C',
                        border: '1px solid #FFEDD5',
                        fontWeight: 700,
                        padding: '8px 16px',
                        fontSize: '0.82rem',
                        borderRadius: 10
                      }}
                    >
                      Explore Deals →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About & Trust Section */}
      <section id="about" className="section" style={{ background: '#FFFFFF', padding: '90px 0', borderTop: '1px solid #E2E8F0' }}>
        <div className="container">
          <div style={{ maxWidth: 840, margin: '0 auto', textAlign: 'center' }}>
            <span style={{ 
              fontFamily: 'var(--font-sans)', 
              fontSize: '0.82rem', 
              textTransform: 'uppercase', 
              letterSpacing: '0.2em', 
              color: '#EA580C', 
              fontWeight: 800,
              display: 'block', 
              marginBottom: 12 
            }}>
              ABOUT HOTELIQ
            </span>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '2.4rem', fontWeight: 600, color: '#0F172A', marginBottom: 20 }}>
              Reimagining Luxury Hospitality Across India
            </h2>
            <p style={{ color: '#64748B', fontSize: '1.05rem', lineHeight: 1.7, marginBottom: 36 }}>
              HotelIQ bridges discerning travelers with premier hotels, boutique resorts, and heritage properties.
              We empower guests with transparent live bidding and contactless digital check-in passes, ensuring every journey is seamless and rewarding.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 20, flexWrap: 'wrap' }}>
              <button 
                onClick={() => navigate('/customer/find')}
                className="btn btn-accent" 
                style={{ background: '#EA580C', padding: '14px 32px', fontSize: '0.95rem' }}
              >
                Discover Hotels Now
              </button>
              <button 
                onClick={() => navigate('/hotel_login')}
                className="btn btn-outline" 
                style={{ padding: '14px 32px', fontSize: '0.95rem', borderColor: '#CBD5E1', color: '#0F172A' }}
              >
                List Your Hotel Partner Property
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
