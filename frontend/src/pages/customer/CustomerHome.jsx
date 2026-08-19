import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';

export default function CustomerHome() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [matchedHotels, setMatchedHotels] = useState([]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    api.searchApprovedHotels().then(data => {
      setMatchedHotels(data.slice(0, 6));
    }).catch(console.error);
  }, []);

  return (
    <div style={{ background: 'var(--bg)' }}>
      {/* Cinematic Hero */}
      <section className="luxury-hero">
        <div className="luxury-hero-bg" />
        <div className="luxury-hero-overlay" />
        
        <div className="luxury-hero-content">
          <span className="luxury-hero-subtitle">Bespoke Hospitality</span>
          <h1 className="luxury-hero-title">Discover your next<br/>extraordinary stay.</h1>
          
          <div className="luxury-hero-search" onClick={() => navigate('/customer/find')}>
            <span style={{ padding: '0 12px', fontSize: '1.2rem', color: 'rgba(255,255,255,0.7)' }}>⚲</span>
            <input 
              type="text" 
              placeholder="Where would you like to go?" 
              readOnly 
              style={{ cursor: 'pointer' }}
            />
            <button className="btn btn-accent" style={{ padding: '12px 32px' }}>
              Explore
            </button>
          </div>
        </div>
      </section>

      {/* The Experience (How it works) */}
      <section className="section" style={{ background: 'white' }}>
        <div className="container">
          <div className="text-center" style={{ marginBottom: 80 }}>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--accent)', display: 'block', marginBottom: 16 }} className="fade-up">The Process</span>
            <h2 className="fade-up delay-1">A Curated Journey</h2>
            <p style={{ maxWidth: 600, margin: '24px auto 0', color: 'var(--text-secondary)' }} className="fade-up delay-2">
              We've refined the booking experience. Tell us your desires, and allow premier properties to present their finest offerings.
            </p>
          </div>

          <div className="grid-3">
            {[
              { num: '01', title: 'Define Your Desires', desc: 'Detail your ideal destination, dates, and bespoke preferences through our intuitive interface.' },
              { num: '02', title: 'Curated Offers', desc: 'Matched luxury properties will present personalized quotes, allowing you to select the perfect fit.' },
              { num: '03', title: 'Seamless Arrival', desc: 'Secure your booking and experience frictionless, digital check-in via your exclusive QR pass.' }
            ].map((step, i) => (
              <div key={i} className="fade-up" style={{ animationDelay: `${0.2 + (i * 0.1)}s`, padding: '0 24px', position: 'relative' }}>
                <div style={{ fontSize: '3rem', fontFamily: 'var(--font-serif)', color: 'var(--border)', lineHeight: 1, marginBottom: 24, opacity: 0.5 }}>{step.num}</div>
                <h3 style={{ marginBottom: 16, fontSize: '1.4rem' }}>{step.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.7 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Collection */}
      <section className="section">
        <div className="container">
          <div className="flex-between" style={{ marginBottom: 64 }}>
            <div>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--accent)', display: 'block', marginBottom: 16 }}>Collection</span>
              <h2>Featured Properties</h2>
            </div>
            <button className="btn btn-outline" onClick={() => navigate('/customer/find')}>
              View Portfolio
            </button>
          </div>

          <div className="grid-3">
            {matchedHotels.map((hotel, i) => (
              <div 
                key={hotel.id} 
                className="premium-hotel-card fade-up" 
                style={{ animationDelay: `${i * 0.1}s` }}
                onClick={() => navigate(`/customer/hotel/${hotel.id}`)}
              >
                <div className="img-wrapper">
                  <img src={hotel.photos[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500'} alt={hotel.name} loading="lazy" />
                  <div className="overlay">
                    <span className="badge badge-primary" style={{ background: 'var(--accent)', color: 'white' }}>
                      Luxury
                    </span>
                  </div>
                </div>
                <div className="content">
                  <div className="location">{hotel.location}</div>
                  <h3>{hotel.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 24, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <span style={{ color: 'var(--warning)' }}>★</span> {hotel.rating || '4.8'} 
                    <span style={{ opacity: 0.5 }}>({hotel.reviewCount || '124'} reviews)</span>
                  </div>
                  <div className="price">
                    ₹{hotel.rooms && hotel.rooms.length > 0 ? hotel.rooms[0].price_per_night.toLocaleString() : 'N/A'} <span>/ Night</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ position: 'relative', padding: '160px 0', overflow: 'hidden', color: 'white' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url(https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2000&auto=format&fit=crop)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed', zIndex: 0 }} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1 }} />
        
        <div className="container" style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
          <h2 style={{ fontSize: '3rem', marginBottom: 24, color: 'white' }} className="fade-up">Ready to escape?</h2>
          <p style={{ maxWidth: 500, margin: '0 auto 40px', fontSize: '1.1rem', opacity: 0.9, lineHeight: 1.6 }} className="fade-up delay-1">
            Submit your requirements and let our premier properties compete to host your next unforgettable stay.
          </p>
          <div className="fade-up delay-2">
            <button className="btn btn-accent btn-lg" onClick={() => navigate('/customer/find')}>
              Begin Your Journey
            </button>
          </div>
        </div>
      </section>
      
      {/* Simple Footer */}
      <footer style={{ background: 'var(--primary)', color: 'white', padding: '64px 0', textAlign: 'center' }}>
        <div className="container">
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', marginBottom: 24, letterSpacing: '0.05em' }}>
            Hotel<span style={{ fontStyle: 'italic', color: 'var(--accent)' }}>Lead</span>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
            © 2026 HotelLead. Curated Luxury Stays.
          </p>
        </div>
      </footer>
    </div>
  );
}
