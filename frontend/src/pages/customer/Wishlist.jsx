import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { Heart, Trash2, ArrowRight, MapPin, Star, Compass } from 'lucide-react';

export default function Wishlist() {
  const { wishlist, hotels, toggleWishlist } = useApp();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const wishlistedHotels = hotels.filter(h => wishlist.includes(h.id?.toString()));

  const handleRemove = (hotel, e) => {
    e.stopPropagation();
    toggleWishlist(hotel.id);
    addToast(`Removed "${hotel.name}" from your wishlist`, 'info');
  };

  return (
    <div className="fade-in" style={{ padding: '40px 0 80px', minHeight: '80vh' }}>
      <div className="container">
        
        {/* Header */}
        <div className="flex-between" style={{ marginBottom: 40, flexWrap: 'wrap', gap: 16, alignItems: 'flex-end' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ 
                background: '#FFF1F2', 
                color: '#E11D48', 
                border: '1px solid #FECDD3', 
                padding: '4px 12px', 
                borderRadius: '9999px', 
                fontSize: '0.75rem', 
                fontWeight: 800, 
                letterSpacing: '0.08em', 
                textTransform: 'uppercase' 
              }}>
                ❤️ Saved Properties
              </span>
              <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                {wishlistedHotels.length} {wishlistedHotels.length === 1 ? 'Stay' : 'Stays'}
              </span>
            </div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.4rem', margin: 0, color: 'var(--primary)' }}>
              My Wishlist
            </h1>
            <p style={{ color: 'var(--text-secondary)', margin: '6px 0 0', fontSize: '1rem' }}>
              Your private collection of favorite properties and dream getaways.
            </p>
          </div>

          {wishlistedHotels.length > 0 && (
            <button 
              className="btn btn-outline" 
              onClick={() => navigate('/customer/find')}
              style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.88rem', padding: '10px 20px' }}
            >
              <Compass size={16} />
              Explore More Stays
            </button>
          )}
        </div>

        {/* Empty State */}
        {wishlistedHotels.length === 0 ? (
          <div 
            className="card fade-up" 
            style={{ 
              padding: '64px 32px', 
              textAlign: 'center', 
              maxWidth: 580, 
              margin: '40px auto 0',
              borderRadius: 20,
              background: 'white',
              boxShadow: 'var(--shadow-md)'
            }}
          >
            <div style={{ 
              width: 80, 
              height: 80, 
              borderRadius: '50%', 
              background: '#FFF1F2', 
              color: '#E11D48', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 20px',
              fontSize: '2.2rem'
            }}>
              <Heart size={40} color="#E11D48" fill="#FFF1F2" />
            </div>

            <h2 style={{ fontSize: '1.6rem', marginBottom: 10, color: 'var(--primary)' }}>
              Your wishlist is empty
            </h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.96rem', marginBottom: 28 }}>
              Explore our curated stays, click the heart icon on any hotel card, and save your dream destinations here for easy booking and rate negotiations.
            </p>

            <button 
              className="btn btn-primary" 
              onClick={() => navigate('/customer/find')}
              style={{ padding: '14px 32px', fontSize: '0.92rem', borderRadius: 10 }}
            >
              Discover Hotels
            </button>
          </div>
        ) : (
          /* Wishlist Grid */
          <div className="grid-3" style={{ gap: 32 }}>
            {wishlistedHotels.map((hotel, i) => (
              <div 
                key={hotel.id} 
                className="premium-hotel-card fade-up"
                style={{ animationDelay: `${i * 0.08}s` }}
                onClick={() => navigate(`/customer/hotel/${hotel.id}`)}
              >
                {/* Image & Top Badges */}
                <div className="img-wrapper">
                  <img 
                    src={hotel.photos?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600'} 
                    alt={hotel.name} 
                    loading="lazy" 
                  />
                  <div className="overlay">
                    <span className="badge badge-primary" style={{ background: 'var(--accent)', color: 'white' }}>
                      {hotel.category || 'Luxury'}
                    </span>
                  </div>

                  {/* Wishlist Remove Button */}
                  <button 
                    className="wishlist-btn active"
                    title="Remove from wishlist"
                    onClick={(e) => handleRemove(hotel, e)}
                    style={{
                      background: '#FFF1F2',
                      borderColor: '#FECDD3'
                    }}
                  >
                    <Heart size={20} color="#E11D48" fill="#E11D48" className="wishlist-heart-pulse" />
                  </button>
                </div>

                {/* Content */}
                <div className="content">
                  <div>
                    <div className="location" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <MapPin size={14} color="var(--accent)" />
                      {hotel.location}
                    </div>
                    <h3 style={{ fontSize: '1.45rem', marginBottom: 8 }}>{hotel.name}</h3>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <Star size={14} color="var(--warning)" fill="var(--warning)" />
                      <span style={{ fontWeight: 700, color: 'var(--text)' }}>{hotel.rating || '4.8'}</span>
                      <span style={{ opacity: 0.6 }}>({hotel.reviewCount || '98'} reviews)</span>
                    </div>

                    {/* Room Type Tag */}
                    <div style={{ marginBottom: 16 }}>
                      <span style={{ 
                        fontSize: '0.75rem', 
                        padding: '4px 10px', 
                        background: 'var(--bg)', 
                        border: '1px solid var(--border-light)', 
                        borderRadius: 6,
                        color: 'var(--text-secondary)'
                      }}>
                        🛏️ {hotel.roomTypes?.[0]?.type || 'Deluxe Room'} Available
                      </span>
                    </div>
                  </div>

                  {/* Price & Action Buttons */}
                  <div>
                    <div className="price" style={{ marginBottom: 16 }}>
                      <span>Starting from</span>
                      <strong style={{ fontSize: '1.3rem', color: 'var(--primary)' }}>
                        ₹{(hotel.rooms?.[0]?.price_per_night || hotel.roomTypes?.[0]?.price || 3000).toLocaleString()}
                        <small style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-muted)' }}> / night</small>
                      </strong>
                    </div>

                    <div style={{ display: 'flex', gap: 10 }}>
                      <button 
                        className="btn btn-primary" 
                        style={{ flex: 1, padding: '10px 16px', fontSize: '0.84rem', borderRadius: 8, gap: 6 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/customer/hotel/${hotel.id}`);
                        }}
                      >
                        Book & Negotiate
                        <ArrowRight size={14} />
                      </button>

                      <button 
                        className="btn btn-outline" 
                        title="Remove from wishlist"
                        style={{ padding: '10px 12px', borderRadius: 8, color: '#DC2626' }}
                        onClick={(e) => handleRemove(hotel, e)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
