import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { 
  Heart, 
  Trash2, 
  ArrowRight, 
  MapPin, 
  Star, 
  Compass, 
  Bed, 
  Sparkles 
} from 'lucide-react';

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
    <div className="wishlist-page-container fade-in">
      
      {/* Header Row with Stay count & Explore button */}
      <div className="wishlist-header-row">
        <div className="wishlist-title-group">
          <span className="wishlist-pill-badge">
            <Heart size={11} fill="#E11D48" />
            <span>Saved Properties ({wishlistedHotels.length})</span>
          </span>
          <h1 className="wishlist-main-title">My Wishlist</h1>
          <p className="wishlist-subtitle">
            Your private collection of favorite properties & dream stays.
          </p>
        </div>

        {wishlistedHotels.length > 0 && (
          <button 
            type="button"
            className="wishlist-explore-btn"
            onClick={() => navigate('/customer/find')}
          >
            <Compass size={14} color="#EA580C" />
            <span>Explore Stays</span>
          </button>
        )}
      </div>

      {/* Empty State */}
      {wishlistedHotels.length === 0 ? (
        <div 
          className="card fade-up" 
          style={{ 
            padding: '48px 24px', 
            textAlign: 'center', 
            maxWidth: 480, 
            margin: '20px auto 0',
            borderRadius: 20,
            background: 'white',
            boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
            border: '1px solid #E2E8F0'
          }}
        >
          <div style={{ 
            width: 64, 
            height: 64, 
            borderRadius: '50%', 
            background: '#FFF1F2', 
            color: '#E11D48', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            margin: '0 auto 16px' 
          }}>
            <Heart size={32} color="#E11D48" fill="#FFF1F2" />
          </div>

          <h2 style={{ fontSize: '1.3rem', marginBottom: 8, color: '#0F172A', fontWeight: 800 }}>
            Your wishlist is empty
          </h2>
          <p style={{ color: '#64748B', lineHeight: 1.5, fontSize: '0.86rem', marginBottom: 22 }}>
            Explore luxury stays, tap the heart icon on any hotel card, and save your dream destinations here.
          </p>

          <button 
            className="btn btn-primary" 
            onClick={() => navigate('/customer/find')}
            style={{ padding: '10px 24px', fontSize: '0.84rem', borderRadius: 9999 }}
          >
            Discover Hotels
          </button>
        </div>
      ) : (
        /* Compact Luxury Wishlist List / Grid */
        <div className="wishlist-cards-list">
          {wishlistedHotels.map((hotel, i) => {
            const price = hotel.rooms?.[0]?.price_per_night || hotel.roomTypes?.[0]?.price || 3000;
            const roomType = hotel.roomTypes?.[0]?.type || 'Deluxe Room Available';
            const locationName = hotel.city || hotel.location || 'Mumbai';

            return (
              <div 
                key={hotel.id} 
                className="wishlist-card fade-up"
                style={{ animationDelay: `${i * 0.05}s` }}
                onClick={() => navigate(`/customer/hotel/${hotel.id}`)}
              >
                {/* Thumbnail */}
                <div className="wishlist-thumb-wrapper">
                  <img 
                    src={hotel.photos?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400'} 
                    alt={hotel.name} 
                    className="wishlist-thumb-img"
                    loading="lazy" 
                  />
                  <span className="wishlist-thumb-badge">
                    {hotel.category || 'Premium'}
                  </span>
                </div>

                {/* Content */}
                <div className="wishlist-card-content">
                  <div className="wishlist-card-loc-rating">
                    <div className="wishlist-card-location">
                      <MapPin size={11} color="#EA580C" />
                      <span>{locationName}</span>
                    </div>

                    <div className="wishlist-card-rating">
                      <Star size={12} color="#F59E0B" fill="#F59E0B" />
                      <span>{hotel.rating || '4.8'}</span>
                    </div>
                  </div>

                  <h3 className="wishlist-card-title">{hotel.name}</h3>
                  <div className="wishlist-card-room-tag">🛏️ {roomType}</div>

                  {/* Bottom Row: Price & Actions */}
                  <div className="wishlist-card-bottom">
                    <div className="wishlist-card-price">
                      <span className="wishlist-card-price-label">Starting</span>
                      <span className="wishlist-card-price-val">
                        ₹{Number(price).toLocaleString()}
                        <small> /nt</small>
                      </span>
                    </div>

                    <div className="wishlist-card-actions">
                      <button 
                        type="button" 
                        className="wishlist-btn-book"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/customer/hotel/${hotel.id}`);
                        }}
                      >
                        <span>Book</span>
                        <ArrowRight size={12} />
                      </button>

                      <button 
                        type="button" 
                        className="wishlist-btn-remove"
                        title="Remove from wishlist"
                        onClick={(e) => handleRemove(hotel, e)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
