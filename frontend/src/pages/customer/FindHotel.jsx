import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { 
  Heart, 
  MapPin, 
  Calendar, 
  Users, 
  Sparkles, 
  X, 
  Search, 
  Bed, 
  Star, 
  SlidersHorizontal,
  ChevronRight,
  Info
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet default marker icons in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Google Hotels / Airbnb Style Price Pill Marker Icon
const createPriceIcon = (price, isSelected) => {
  const formattedPrice = `₹${(price || 3000).toLocaleString()}`;
  return L.divIcon({
    className: 'price-marker-wrapper',
    html: `<div class="map-price-badge ${isSelected ? 'selected' : ''}">${formattedPrice}</div>`,
    iconSize: [80, 32],
    iconAnchor: [40, 16],
    popupAnchor: [0, -18]
  });
};

const CITY_COORDINATES = {
  'vizag': [17.72, 83.31],
  'visakhapatnam': [17.72, 83.31],
  'hyderabad': [17.40, 78.47],
  'mumbai': [19.01, 72.85],
  'chennai': [13.06, 80.25],
  'bengaluru': [12.97, 77.59],
  'bangalore': [12.97, 77.59],
  'goa': [15.30, 74.12],
  'delhi': [28.61, 77.21],
  'jaipur': [26.91, 75.78]
};

function matchesDestination(hotel, query) {
  if (!query || !query.trim()) return true;
  const q = query.toLowerCase().trim();
  const loc = (hotel.location || '').toLowerCase();
  const name = (hotel.name || '').toLowerCase();
  const addr = (hotel.address || '').toLowerCase();

  if (loc.includes(q) || name.includes(q) || addr.includes(q)) return true;

  const synonyms = {
    'vizag': ['visakhapatnam', 'vizag', 'waltair', 'rushikonda'],
    'visakhapatnam': ['visakhapatnam', 'vizag', 'waltair', 'rushikonda'],
    'hyderabad': ['hyderabad', 'secunderabad', 'hitec', 'gachibowli', 'cyberabad', 'telangana'],
    'bangalore': ['bangalore', 'bengaluru', 'karnataka'],
    'bengaluru': ['bangalore', 'bengaluru', 'karnataka'],
    'chennai': ['chennai', 'madras', 'tamil nadu'],
    'mumbai': ['mumbai', 'bombay', 'maharashtra'],
    'delhi': ['delhi', 'new delhi', 'ncr', 'gurgaon', 'noida'],
    'goa': ['goa', 'panaji', 'calangute', 'candolim', 'baga', 'anjuna'],
    'jaipur': ['jaipur', 'rajasthan']
  };

  for (const [key, variants] of Object.entries(synonyms)) {
    if (q.includes(key) || variants.some(v => q.includes(v))) {
      if (variants.some(v => loc.includes(v) || name.includes(v) || addr.includes(v))) {
        return true;
      }
    }
  }

  return false;
}

function MapUpdater({ selectedHotel, hotels, destination, mobileTab }) {
  const map = useMap();
  
  useEffect(() => {
    if (!map) return;
    try {
      setTimeout(() => map.invalidateSize(), 250);

      if (selectedHotel && typeof selectedHotel.latitude === 'number' && typeof selectedHotel.longitude === 'number') {
        map.flyTo([selectedHotel.latitude, selectedHotel.longitude], 15, { animate: true, duration: 0.9 });
      } else if (hotels && hotels.length > 0) {
        const validPoints = hotels
          .filter(h => h && typeof h.latitude === 'number' && typeof h.longitude === 'number' && h.latitude !== 0 && h.longitude !== 0)
          .map(h => [h.latitude, h.longitude]);
        if (validPoints.length > 0) {
          const bounds = L.latLngBounds(validPoints);
          if (bounds.isValid()) {
            map.flyToBounds(bounds, { animate: true, duration: 0.9, padding: [40, 40], maxZoom: 13 });
          }
        }
      } else if (destination) {
        const destKey = destination.toLowerCase().trim();
        const cityCenter = CITY_COORDINATES[destKey];
        if (cityCenter) {
          map.flyTo(cityCenter, 12, { animate: true, duration: 0.9 });
        }
      }
    } catch (err) {
      console.warn('Map update error:', err);
    }
  }, [selectedHotel, hotels, destination, map, mobileTab]);

  return null;
}

export default function FindHotel() {
  const { submitRequirement, hotels, toggleWishlist, isWishlisted } = useApp();
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Mobile View Tab: 'list' or 'map'
  const [mobileTab, setMobileTab] = useState('list');

  // Search Filters
  const initialDestination = searchParams.get('location') || searchParams.get('destination') || '';
  const [destination, setDestination] = useState(initialDestination);

  const today = new Date().toISOString().split('T')[0];
  const nextThreeDays = new Date();
  nextThreeDays.setDate(nextThreeDays.getDate() + 3);
  const defaultCheckOut = nextThreeDays.toISOString().split('T')[0];

  const [checkIn, setCheckIn] = useState(searchParams.get('checkIn') || today);
  const [checkOut, setCheckOut] = useState(searchParams.get('checkOut') || defaultCheckOut);
  const [guests, setGuests] = useState(Number(searchParams.get('guests')) || 2);
  const [roomTypeFilter, setRoomTypeFilter] = useState(searchParams.get('room') || 'all');
  const [priceTier, setPriceTier] = useState('all'); // 'all' | 'under4k' | '4k-8k' | 'over8k'
  const [filterText, setFilterText] = useState('');

  // Selection & UI State
  const [selectedMapHotel, setSelectedMapHotel] = useState(null);
  const [showBidModal, setShowBidModal] = useState(false);
  const [isSubmittingBid, setIsSubmittingBid] = useState(false);

  // Reverse Bidding Modal Form
  const [bidForm, setBidForm] = useState({
    budgetMode: 'overall', // 'overall' | 'per_night'
    budget: 8000,
    purpose: 'Leisure',
    preferences: ''
  });

  const calcNights = () => {
    if (!checkIn || !checkOut) return 3;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  };
  const nights = calcNights();
  const [overallBidBudget, setOverallBidBudget] = useState(bidForm.budget * nights);

  // Sync with searchParams
  useEffect(() => {
    const loc = searchParams.get('location') || searchParams.get('destination') || '';
    if (loc) {
      setDestination(loc);
    }
  }, [searchParams]);

  // Filtered Hotels
  const displayedHotels = hotels.filter(h => {
    // Destination filter
    if (destination.trim() && !matchesDestination(h, destination)) return false;

    // Search input filter in sidebar
    if (filterText.trim()) {
      const ft = filterText.toLowerCase().trim();
      const match = (h.name || '').toLowerCase().includes(ft) || (h.address || '').toLowerCase().includes(ft) || (h.location || '').toLowerCase().includes(ft);
      if (!match) return false;
    }

    // Room Type filter
    if (roomTypeFilter !== 'all') {
      const hasRoom = (h.roomTypes || []).some(r => r.type?.toLowerCase().includes(roomTypeFilter.toLowerCase()));
      if (!hasRoom) return false;
    }

    // Price Tier filter
    const startingRate = h.roomTypes?.[0]?.price || 3000;
    if (priceTier === 'under4k' && startingRate >= 4000) return false;
    if (priceTier === '4k-8k' && (startingRate < 4000 || startingRate > 8000)) return false;
    if (priceTier === 'over8k' && startingRate <= 8000) return false;

    return true;
  });

  // Submit Reverse Bidding Stay Request
  const handleBidSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingBid(true);
    try {
      const calculatedBudget = bidForm.budgetMode === 'overall' 
        ? Math.round(overallBidBudget / nights) 
        : bidForm.budget;

      const lead = await submitRequirement({
        customerId: user?.id || 1,
        customerName: user?.name || 'Guest User',
        customerEmail: user?.email || 'guest@hotel.com',
        customerPhone: user?.phone || '',
        destination: destination || (selectedMapHotel ? selectedMapHotel.location : 'India'),
        checkIn,
        checkOut,
        guests,
        budget: calculatedBudget,
        roomType: roomTypeFilter === 'all' ? 'Deluxe' : roomTypeFilter,
        purpose: bidForm.purpose,
        preferences: bidForm.preferences,
        specific_hotel_id: selectedMapHotel ? selectedMapHotel.id : null
      });

      if (lead) {
        addToast(
          selectedMapHotel 
            ? `Exclusive stay request sent to ${selectedMapHotel.name}!` 
            : `Stay request broadcasted to hotels in ${destination || 'your destination'}!`, 
          'success'
        );
        setShowBidModal(false);
        navigate('/customer/trips?tab=requests');
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to post stay request. Please try again.', 'error');
    } finally {
      setIsSubmittingBid(false);
    }
  };

  const defaultCenter = CITY_COORDINATES[(destination || '').toLowerCase().trim()] || [17.72, 83.31];

  return (
    <div className="fade-in" style={{ maxWidth: 1440, margin: '0 auto', padding: '14px 20px 40px' }}>
      
      {/* 1. TOP MODERN SEARCH & FILTER CAPSULE */}
      <div className="search-capsule-container">
        <div className="search-capsule-row">
                   {/* Destination Search Pill */}
          <div className="search-input-pill">
            <MapPin size={21} color="var(--accent)" style={{ flexShrink: 0 }} />
            <input 
              type="text"
              className="search-input-field"
              placeholder="Where are you going? (e.g. Vizag, Mumbai...)"
              value={destination}
              onChange={(e) => {
                setDestination(e.target.value);
                setSelectedMapHotel(null);
              }}
            />
            {destination && (
              <button 
                type="button" 
                onClick={() => { setDestination(''); setSelectedMapHotel(null); setSearchParams({}); }}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                title="Clear"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Dates Selector */}
          <div className="capsule-group">
            <Calendar size={18} color="var(--primary)" style={{ flexShrink: 0 }} />
            <input 
              type="date" 
              className="capsule-date-input" 
              value={checkIn}
              min={today}
              onChange={e => setCheckIn(e.target.value)}
              title="Check-In Date"
            />
            <span style={{ color: 'var(--border)', fontWeight: 300 }}>—</span>
            <input 
              type="date" 
              className="capsule-date-input" 
              value={checkOut}
              min={checkIn || today}
              onChange={e => setCheckOut(e.target.value)}
              title="Check-Out Date"
            />
          </div>

          {/* Guests */}
          <div className="capsule-group">
            <Users size={18} color="var(--primary)" style={{ flexShrink: 0 }} />
            <select 
              className="capsule-select"
              value={guests}
              onChange={e => setGuests(Number(e.target.value))}
            >
              {[1, 2, 3, 4, 5, 6].map(n => (
                <option key={n} value={n}>{n} {n === 1 ? 'Guest' : 'Guests'}</option>
              ))}
            </select>
          </div>

          {/* Room Type */}
          <div className="capsule-group">
            <Bed size={18} color="var(--primary)" style={{ flexShrink: 0 }} />
            <select 
              className="capsule-select"
              value={roomTypeFilter}
              onChange={e => setRoomTypeFilter(e.target.value)}
            >
              <option value="all">All Rooms</option>
              <option value="Deluxe">Deluxe</option>
              <option value="Executive">Executive</option>
              <option value="Suite">Suite</option>
              <option value="Standard">Standard</option>
            </select>
          </div>

          {/* Budget Tier */}
          <div className="capsule-group">
            <SlidersHorizontal size={18} color="var(--primary)" style={{ flexShrink: 0 }} />
            <select 
              className="capsule-select"
              value={priceTier}
              onChange={e => setPriceTier(e.target.value)}
            >
              <option value="all">Any Budget</option>
              <option value="under4k">Under ₹4,000</option>
              <option value="4k-8k">₹4,000 - ₹8,000</option>
              <option value="over8k">Luxury ₹8,000+</option>
            </select>
          </div>

          {/* Reverse Bidding Action CTA */}
          <button 
            type="button" 
            className="bid-action-btn"
            onClick={() => setShowBidModal(true)}
            title="Post a stay request and let hotels give you discounted bids"
          >
            <Sparkles size={17} color="#D4AF37" />
            <span>⚡ Let Hotels Bid</span>
          </button>

        </div>

      </div>

      {/* 2. SPLIT-SCREEN EXPLORER (MAP + HOTEL FEED) */}
      <div className="find-hotel-explorer-grid">
        
        {/* Left / Tab 1: Leaflet Interactive Map */}
        <div className={`find-hotel-map-pane ${mobileTab === 'map' ? 'mobile-active' : 'mobile-hidden'}`}>
          <MapContainer 
            center={defaultCenter} 
            zoom={12} 
            style={{ height: '100%', width: '100%' }}
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapUpdater selectedHotel={selectedMapHotel} hotels={displayedHotels} destination={destination} mobileTab={mobileTab} />
            
            {displayedHotels.map(h => {
              const lat = typeof h.latitude === 'number' ? h.latitude : 17.72;
              const lng = typeof h.longitude === 'number' ? h.longitude : 83.31;
              const isSelected = selectedMapHotel?.id === h.id;
              const startingPrice = h.roomTypes?.[0]?.price || 3000;

              return (
                <Marker 
                  key={h.id}
                  position={[lat, lng]}
                  icon={createPriceIcon(startingPrice, isSelected)}
                  eventHandlers={{
                    click: () => setSelectedMapHotel(h)
                  }}
                >
                  <Popup>
                    <div style={{ textAlign: 'center', padding: '4px', maxWidth: 210 }}>
                      <img 
                        src={h.photos?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=300'} 
                        alt={h.name} 
                        style={{ width: '100%', height: 90, borderRadius: 8, objectFit: 'cover', marginBottom: 6 }} 
                      />
                      <strong style={{ fontSize: '0.92rem', color: 'var(--text)', display: 'block', marginBottom: 2 }}>{h.name}</strong>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>📍 {h.location}</span>
                      <div style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '0.92rem', margin: '6px 0' }}>
                        ₹{startingPrice.toLocaleString()} <span style={{ fontSize: '0.72rem', fontWeight: 400, color: 'var(--text-muted)' }}>/ night</span>
                      </div>
                      <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                        <button 
                          onClick={() => navigate(`/customer/hotel/${h.id}?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`)}
                          style={{ 
                            background: 'var(--primary)', 
                            color: 'white', 
                            border: 'none', 
                            padding: '6px 12px', 
                            borderRadius: 12, 
                            fontSize: '0.75rem', 
                            cursor: 'pointer', 
                            fontWeight: 600, 
                            flex: 1 
                          }}
                        >
                          View Rooms
                        </button>
                        <button
                          onClick={() => { setSelectedMapHotel(h); setShowBidModal(true); }}
                          style={{
                            background: '#FFFBEB',
                            color: '#B45309',
                            border: '1px solid #FDE68A',
                            padding: '6px 8px',
                            borderRadius: 12,
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            fontWeight: 700
                          }}
                          title="Let this hotel bid"
                        >
                          ⚡ Bid
                        </button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>

          {/* Floating Map Status Overlay */}
          <div style={{ 
            position: 'absolute', 
            top: 14, 
            left: 56, 
            zIndex: 1000, 
            background: 'rgba(255, 255, 255, 0.94)', 
            backdropFilter: 'blur(10px)', 
            padding: '6px 14px', 
            borderRadius: 9999, 
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-sm)',
            fontSize: '0.82rem',
            fontWeight: 700,
            color: 'var(--text)',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}>
            <span>📍</span>
            <span>{displayedHotels.length} {displayedHotels.length === 1 ? 'Hotel' : 'Hotels'} on Map</span>
          </div>

        </div>

        {/* Right / Tab 2: Hotel List or Selected Hotel Details */}
        <div className={`find-hotel-list-pane ${mobileTab === 'list' ? 'mobile-active' : 'mobile-hidden'}`}>
          
          {selectedMapHotel ? (
            /* Selected Hotel Preview */
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
              <div style={{ 
                height: 190, 
                backgroundImage: `url(${selectedMapHotel.photos?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'})`, 
                backgroundSize: 'cover', 
                backgroundPosition: 'center', 
                position: 'relative' 
              }}>
                <button 
                  onClick={() => setSelectedMapHotel(null)} 
                  style={{ 
                    position: 'absolute', 
                    top: 12, 
                    right: 12, 
                    background: 'rgba(0,0,0,0.65)', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '50%', 
                    width: 30, 
                    height: 30, 
                    cursor: 'pointer', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    backdropFilter: 'blur(4px)'
                  }}
                  title="Close preview"
                >
                  ✕
                </button>

                {/* Wishlist Button */}
                <button 
                  type="button"
                  className={`wishlist-btn ${isWishlisted(selectedMapHotel.id) ? 'active' : ''}`}
                  title={isWishlisted(selectedMapHotel.id) ? "Remove from wishlist" : "Add to wishlist"}
                  onClick={(e) => {
                    e.stopPropagation();
                    const added = toggleWishlist(selectedMapHotel.id);
                    if (added) addToast(`Added "${selectedMapHotel.name}" to your wishlist!`, 'success');
                    else addToast(`Removed "${selectedMapHotel.name}" from your wishlist`, 'info');
                  }}
                  style={{ top: 12, right: 50, width: 34, height: 34 }}
                >
                  <Heart 
                    size={16} 
                    color={isWishlisted(selectedMapHotel.id) ? "#E11D48" : "#475569"} 
                    fill={isWishlisted(selectedMapHotel.id) ? "#E11D48" : "none"} 
                  />
                </button>

                <div style={{ 
                  position: 'absolute', 
                  bottom: 12, 
                  left: 12, 
                  background: 'rgba(255,255,255,0.96)', 
                  padding: '4px 12px', 
                  borderRadius: 16, 
                  fontSize: '0.78rem', 
                  fontWeight: 800, 
                  color: 'var(--primary)',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  ⭐ {selectedMapHotel.rating || 4.8} ({selectedMapHotel.reviewCount || 14} Reviews)
                </div>
              </div>

              <div style={{ padding: 18, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontFamily: 'var(--font-serif)', color: 'var(--text)', wordBreak: 'break-word', lineHeight: 1.3 }}>
                      {selectedMapHotel.name}
                    </h3>
                  </div>
                  
                  <p style={{ color: 'var(--text-secondary)', margin: '0 0 10px', fontSize: '0.82rem', wordBreak: 'break-word', lineHeight: 1.4 }}>
                    📍 {selectedMapHotel.location} — {selectedMapHotel.address}
                  </p>
                  
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.55, marginBottom: 14 }}>
                    {selectedMapHotel.description}
                  </p>
                  
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                    {(selectedMapHotel.amenities || ['Free High-Speed WiFi', 'Valet Parking', 'Luxury Spa', 'Swimming Pool']).map(a => (
                      <span key={a} style={{ fontSize: '0.72rem', background: 'var(--bg)', padding: '4px 10px', borderRadius: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>
                        ✓ {a}
                      </span>
                    ))}
                  </div>

                  {/* Room Types teaser */}
                  {selectedMapHotel.roomTypes && selectedMapHotel.roomTypes.length > 0 && (
                    <div style={{ background: 'var(--bg)', borderRadius: 12, padding: 12, marginBottom: 16 }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                        Available Room Tiers:
                      </span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {selectedMapHotel.roomTypes.map(r => (
                          <div key={r.id || r.type} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                            <span style={{ fontWeight: 600, color: 'var(--text)' }}>{r.type}</span>
                            <span style={{ fontWeight: 800, color: 'var(--primary)' }}>₹{r.price.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }}>
                    <div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>Starting From</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)', lineHeight: 1.1 }}>
                        ₹{(selectedMapHotel.roomTypes?.[0]?.price || 3000).toLocaleString()} 
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}> / night</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => setSelectedMapHotel(null)}
                      style={{ border: 'none', background: 'none', color: 'var(--text-muted)', fontSize: '0.75rem', textDecoration: 'underline', cursor: 'pointer' }}
                    >
                      ← Back to list
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <button 
                      className="btn btn-primary" 
                      style={{ height: 42, fontSize: '0.85rem' }} 
                      onClick={() => navigate(`/customer/hotel/${selectedMapHotel.id}?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`)}
                    >
                      🛏️ Book Rooms
                    </button>
                    <button 
                      className="btn btn-outline" 
                      onClick={() => setShowBidModal(true)}
                      style={{ height: 42, fontSize: '0.85rem', borderColor: 'var(--accent)', color: 'var(--accent-dark)' }}
                    >
                      ⚡ Request Quote
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* All Matched Hotels List */
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              
              {/* Header inside right panel */}
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-light)', background: 'var(--bg)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <strong style={{ fontSize: '0.9rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>🏨</span>
                    <span>{destination ? `Hotels in ${destination}` : 'All Featured Hotels'}</span>
                    <span style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '1px 8px', fontSize: '0.75rem', fontWeight: 800 }}>
                      {displayedHotels.length}
                    </span>
                  </strong>
                  {destination && (
                    <button 
                      onClick={() => { setDestination(''); setSearchParams({}); }}
                      style={{ border: 'none', background: 'none', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      View All Cities
                    </button>
                  )}
                </div>

                <div style={{ position: 'relative' }}>
                  <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: 10, top: 10 }} />
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Search by hotel name or neighborhood..." 
                    value={filterText}
                    onChange={e => setFilterText(e.target.value)}
                    style={{ padding: '6px 12px 6px 30px', fontSize: '0.82rem', borderRadius: 9999 }}
                  />
                  {filterText && (
                    <button 
                      onClick={() => setFilterText('')}
                      style={{ position: 'absolute', right: 10, top: 8, border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Scrollable Hotel Cards Feed */}
              <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {displayedHotels.length === 0 ? (
                  <div style={{ padding: '40px 16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🔍</div>
                    <h4 style={{ margin: '0 0 6px', color: 'var(--text)', fontSize: '1.05rem' }}>No hotels match your filters</h4>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
                      {destination ? `We didn't find properties matching "${destination}".` : 'Try clearing your search or exploring one of our partner cities.'}
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
                      {['Vizag', 'Hyderabad', 'Mumbai', 'Bengaluru', 'Goa'].map(city => (
                        <button 
                          key={city}
                          onClick={() => { setDestination(city); setSearchParams({ location: city }); }}
                          className="btn btn-outline btn-sm"
                          style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                        >
                          📍 {city}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  displayedHotels.map(h => (
                    <div 
                      key={h.id}
                      onClick={() => setSelectedMapHotel(h)}
                      style={{
                        padding: 12, 
                        borderRadius: 14, 
                        border: '1px solid var(--border-light)', 
                        background: 'white', 
                        cursor: 'pointer',
                        display: 'flex', 
                        gap: 12, 
                        alignItems: 'center', 
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', 
                        flexShrink: 0,
                        boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                      }}
                      onMouseOver={e => {
                        e.currentTarget.style.borderColor = 'var(--accent)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.06)';
                      }}
                      onMouseOut={e => {
                        e.currentTarget.style.borderColor = 'var(--border-light)';
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.02)';
                      }}
                    >
                      <div style={{ position: 'relative', width: 80, height: 80, flexShrink: 0 }}>
                        <img 
                          src={h.photos?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=300'} 
                          alt={h.name} 
                          style={{ width: '100%', height: '100%', borderRadius: 10, objectFit: 'cover' }}
                        />
                        <div style={{ 
                          position: 'absolute', 
                          top: 4, 
                          left: 4, 
                          background: 'rgba(0,0,0,0.65)', 
                          color: '#FBBF24', 
                          padding: '2px 5px', 
                          borderRadius: 6, 
                          fontSize: '0.65rem', 
                          fontWeight: 800,
                          backdropFilter: 'blur(3px)'
                        }}>
                          ⭐ {h.rating || 4.8}
                        </div>
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                          <strong style={{ fontSize: '0.94rem', color: 'var(--text)', lineHeight: 1.35, wordBreak: 'break-word', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {h.name}
                          </strong>
                          
                          {/* Heart Wishlist Toggle */}
                          <button
                            type="button"
                            title={isWishlisted(h.id) ? "Remove from wishlist" : "Add to wishlist"}
                            onClick={(e) => {
                              e.stopPropagation();
                              const added = toggleWishlist(h.id);
                              if (added) addToast(`Added "${h.name}" to your wishlist!`, 'success');
                              else addToast(`Removed "${h.name}" from your wishlist`, 'info');
                            }}
                            style={{
                              background: isWishlisted(h.id) ? '#FFF1F2' : '#F8FAFC',
                              border: `1px solid ${isWishlisted(h.id) ? '#FECDD3' : '#E2E8F0'}`,
                              borderRadius: '50%',
                              width: 28,
                              height: 28,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              flexShrink: 0,
                              marginLeft: 6,
                              transition: 'all 0.2s',
                            }}
                          >
                            <Heart 
                              size={13} 
                              color={isWishlisted(h.id) ? "#E11D48" : "#94A3B8"} 
                              fill={isWishlisted(h.id) ? "#E11D48" : "none"} 
                            />
                          </button>
                        </div>

                        <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', display: 'block', wordBreak: 'break-word', margin: '2px 0 6px', lineHeight: 1.3 }}>
                          📍 {h.location} • {h.address}
                        </span>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                          <div>
                            <span style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--primary)' }}>
                              ₹{(h.roomTypes?.[0]?.price || 3000).toLocaleString()}
                            </span>
                            <span style={{ fontSize: '0.7rem', fontWeight: 400, color: 'var(--text-muted)' }}> / night</span>
                          </div>

                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/customer/hotel/${h.id}?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`);
                              }}
                              className="btn btn-outline"
                              style={{ padding: '4px 10px', fontSize: '0.72rem', height: 26, borderRadius: 8 }}
                            >
                              Explore →
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Floating Mobile Map / List Toggle Button */}
      <div className="find-hotel-mobile-toggle-wrapper">
        <button 
          type="button" 
          className="find-hotel-mobile-toggle-btn"
          onClick={() => setMobileTab(mobileTab === 'list' ? 'map' : 'list')}
        >
          {mobileTab === 'list' ? (
            <>
              <span style={{ fontSize: '1.1rem' }}>🗺️</span>
              <span>View Map ({displayedHotels.length})</span>
            </>
          ) : (
            <>
              <span style={{ fontSize: '1.1rem' }}>📋</span>
              <span>View List ({displayedHotels.length})</span>
            </>
          )}
        </button>
      </div>

      {/* 3. REVERSE BIDDING MODAL ("LET HOTELS BID") */}
      {showBidModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20
        }}>
          <div className="fade-in" style={{
            background: 'white',
            borderRadius: 24,
            width: '100%',
            maxWidth: 580,
            boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '90vh'
          }}>
            
            {/* Modal Header */}
            <div style={{
              background: 'linear-gradient(135deg, #0F0F0F 0%, #1c1c1c 100%)',
              color: 'white',
              padding: '20px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid rgba(212, 175, 55, 0.2)'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ background: 'rgba(212, 175, 55, 0.2)', color: '#D4AF37', border: '1px solid #D4AF37', borderRadius: 9999, padding: '2px 10px', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase' }}>
                    ⚡ HostIQ Reverse Bidding
                  </span>
                </div>
                <h3 style={{ margin: 0, color: 'white', fontSize: '1.25rem', fontFamily: 'var(--font-serif)' }}>
                  {selectedMapHotel ? `Request Custom Quote from ${selectedMapHotel.name}` : 'Broadcast Stay Request to Partner Hotels'}
                </h3>
                <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.7)', fontSize: '0.78rem' }}>
                  Set your desired budget. Verified hotels will review and send personalized counter-offers.
                </p>
              </div>

              <button 
                onClick={() => setShowBidModal(false)}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  color: 'white',
                  borderRadius: '50%',
                  width: 32,
                  height: 32,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body / Form */}
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
              <form onSubmit={handleBidSubmit}>
                
                {/* Destination & Selected Hotel Info */}
                <div style={{ marginBottom: 16 }}>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700 }}>📍 Destination</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={selectedMapHotel ? `${selectedMapHotel.name} (${selectedMapHotel.location})` : (destination || 'India')}
                    onChange={e => !selectedMapHotel && setDestination(e.target.value)}
                    readOnly={!!selectedMapHotel}
                    required
                  />
                </div>

                {/* Dates & Guests */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 700 }}>Check-In</label>
                    <input 
                      type="date" 
                      className="form-input" 
                      value={checkIn}
                      onChange={e => setCheckIn(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 700 }}>Check-Out</label>
                    <input 
                      type="date" 
                      className="form-input" 
                      value={checkOut}
                      onChange={e => setCheckOut(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 700 }}>Guests</label>
                    <select 
                      className="form-select"
                      value={guests}
                      onChange={e => setGuests(Number(e.target.value))}
                    >
                      {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n} {n === 1 ? 'Guest' : 'Guests'}</option>)}
                    </select>
                  </div>
                </div>

                {/* Budget Mode & Selector */}
                <div style={{ background: 'var(--bg)', padding: 16, borderRadius: 14, border: '1px solid var(--border)', marginBottom: 16 }}>
                  <div className="flex-between mb-2" style={{ alignItems: 'center' }}>
                    <label className="form-label" style={{ margin: 0, fontWeight: 700, fontSize: '0.82rem' }}>💰 Target Budget</label>
                    <div style={{ display: 'flex', background: 'white', padding: 2, borderRadius: 8, border: '1px solid var(--border)' }}>
                      <button
                        type="button"
                        onClick={() => setBidForm({ ...bidForm, budgetMode: 'overall' })}
                        style={{
                          padding: '3px 10px', fontSize: '0.75rem', fontWeight: 600, border: 'none', borderRadius: 6, cursor: 'pointer',
                          background: bidForm.budgetMode === 'overall' ? 'var(--primary)' : 'transparent',
                          color: bidForm.budgetMode === 'overall' ? 'white' : 'var(--text-secondary)'
                        }}
                      >
                        Total Stay
                      </button>
                      <button
                        type="button"
                        onClick={() => setBidForm({ ...bidForm, budgetMode: 'per_night' })}
                        style={{
                          padding: '3px 10px', fontSize: '0.75rem', fontWeight: 600, border: 'none', borderRadius: 6, cursor: 'pointer',
                          background: bidForm.budgetMode === 'per_night' ? 'var(--primary)' : 'transparent',
                          color: bidForm.budgetMode === 'per_night' ? 'white' : 'var(--text-secondary)'
                        }}
                      >
                        Per Night
                      </button>
                    </div>
                  </div>

                  {bidForm.budgetMode === 'overall' ? (
                    <div>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                          <span style={{ position: 'absolute', left: 10, top: 8, fontWeight: 700, color: 'var(--text-muted)' }}>₹</span>
                          <input 
                            type="number"
                            className="form-input"
                            style={{ paddingLeft: 24, fontSize: '1.05rem', fontWeight: 700, color: 'var(--primary)' }}
                            value={overallBidBudget}
                            onChange={e => {
                              const val = Number(e.target.value) || 0;
                              setOverallBidBudget(val);
                              setBidForm({ ...bidForm, budget: Math.round(val / nights) });
                            }}
                            step="500"
                            min="2000"
                          />
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                          Total for <strong>{nights} {nights === 1 ? 'night' : 'nights'}</strong>
                        </div>
                      </div>
                      
                      <input 
                        type="range" 
                        min="3000" 
                        max="120000" 
                        step="1000" 
                        value={overallBidBudget} 
                        onChange={e => {
                          const val = Number(e.target.value);
                          setOverallBidBudget(val);
                          setBidForm({ ...bidForm, budget: Math.round(val / nights) });
                        }}
                        style={{ width: '100%', accentColor: 'var(--primary)' }} 
                      />
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 600, marginTop: 4 }}>
                        <span>Min ₹3k</span>
                        <span>Approx. ₹{Math.round(overallBidBudget / nights).toLocaleString()} / night</span>
                        <span>Max ₹1,20,000</span>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                          <span style={{ position: 'absolute', left: 10, top: 8, fontWeight: 700, color: 'var(--text-muted)' }}>₹</span>
                          <input 
                            type="number"
                            className="form-input"
                            style={{ paddingLeft: 24, fontSize: '1.05rem', fontWeight: 700, color: 'var(--primary)' }}
                            value={bidForm.budget}
                            onChange={e => {
                              const val = Number(e.target.value) || 0;
                              setBidForm({ ...bidForm, budget: val });
                              setOverallBidBudget(val * nights);
                            }}
                            step="500"
                            min="500"
                          />
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                          Rate per night
                        </div>
                      </div>

                      <input 
                        type="range" 
                        min="1000" 
                        max="40000" 
                        step="500" 
                        value={bidForm.budget} 
                        onChange={e => {
                          const val = Number(e.target.value);
                          setBidForm({ ...bidForm, budget: val });
                          setOverallBidBudget(val * nights);
                        }}
                        style={{ width: '100%', accentColor: 'var(--primary)' }} 
                      />

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 600, marginTop: 4 }}>
                        <span>₹1,000 / nt</span>
                        <span>Total Stay: ₹{(bidForm.budget * nights).toLocaleString()} ({nights} nights)</span>
                        <span>₹40,000 / nt</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Purpose of Visit */}
                <div style={{ marginBottom: 16 }}>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700 }}>🥂 Purpose of Visit</label>
                  <select 
                    className="form-select"
                    value={bidForm.purpose}
                    onChange={e => setBidForm({ ...bidForm, purpose: e.target.value })}
                  >
                    <option value="Leisure">Leisure & Vacation</option>
                    <option value="Business">Business & Work</option>
                    <option value="Honeymoon">Honeymoon / Romantic Getaway</option>
                    <option value="Anniversary">Anniversary Celebration</option>
                    <option value="Family Vacation">Family Vacation</option>
                  </select>
                </div>

                {/* Special Preferences */}
                <div style={{ marginBottom: 20 }}>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700 }}>💬 Special Requests or Notes (Optional)</label>
                  <textarea 
                    className="form-textarea"
                    rows={2}
                    placeholder="e.g., Sea view room, complimentary breakfast, early check-in requested..."
                    value={bidForm.preferences}
                    onChange={e => setBidForm({ ...bidForm, preferences: e.target.value })}
                    style={{ fontSize: '0.82rem' }}
                  />
                </div>

                {/* Submit Action */}
                <button 
                  type="submit" 
                  className="btn btn-accent btn-block"
                  disabled={isSubmittingBid}
                  style={{ height: 46, fontSize: '0.95rem' }}
                >
                  {isSubmittingBid ? 'Submitting Request...' : '🚀 Submit Request & Let Hotels Bid'}
                </button>

              </form>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
