import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { 
  Heart, 
  MapPin, 
  Calendar, 
  Users, 
  Bed, 
  Search, 
  Handshake, 
  ShieldCheck, 
  Lock, 
  Star, 
  ListFilter, 
  ChevronDown,
  ChevronRight,
  Waves,
  Sparkles,
  Coffee,
  Utensils,
  Map as MapIcon,
  LayoutGrid,
  Columns3
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

// Helper to safely get hotel starting price
const getHotelPrice = (hotel) => {
  if (!hotel) return 3500;
  if (hotel.roomTypes && hotel.roomTypes[0] && hotel.roomTypes[0].price) {
    return Number(hotel.roomTypes[0].price) || 3500;
  }
  if (hotel.rooms && hotel.rooms[0]) {
    const r = hotel.rooms[0];
    return Number(r.price_per_night || r.price || 3500) || 3500;
  }
  if (hotel.price) return Number(hotel.price) || 3500;
  return 3500;
};

// Helper to safely get hotel photo
const getHotelPhoto = (hotel) => {
  if (hotel?.photos && Array.isArray(hotel.photos) && hotel.photos[0]) return hotel.photos[0];
  if (hotel?.roomTypes && hotel.roomTypes[0]?.images?.[0]?.url) return hotel.roomTypes[0].images[0].url;
  return 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500';
};

// Custom Price Tag Marker for individual hotel
const createHotelPriceMarker = (hotel, isSelected) => {
  const price = getHotelPrice(hotel);
  return L.divIcon({
    className: 'custom-hotel-price-marker',
    html: `
      <div class="map-price-bubble ${isSelected ? 'selected' : ''}">
        <span>₹${price.toLocaleString()}</span>
      </div>
    `,
    iconSize: [56, 22],
    iconAnchor: [28, 11]
  });
};

// Custom City Bubble Marker dynamically created from real database clusters
const createCityBubbleIcon = (cityName, hotelCount, samplePhoto) => {
  return L.divIcon({
    className: 'custom-leaflet-city-marker',
    html: `
      <div class="map-city-marker-card">
        <img src="${samplePhoto}" class="map-city-thumb" alt="${cityName}" />
        <div>
          <div class="map-city-marker-name">${cityName}</div>
          <div class="map-city-marker-count">${hotelCount} hotel${hotelCount > 1 ? 's' : ''}</div>
        </div>
      </div>
    `,
    iconSize: [120, 36],
    iconAnchor: [60, 18]
  });
};

function MapController({ center, zoom, selectedHotel, bounds }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    try {
      setTimeout(() => map.invalidateSize(), 200);

      if (selectedHotel && typeof selectedHotel.latitude === 'number' && typeof selectedHotel.longitude === 'number') {
        map.flyTo([selectedHotel.latitude, selectedHotel.longitude], 14, { animate: true, duration: 0.8 });
      } else if (bounds && bounds.isValid()) {
        map.flyToBounds(bounds, { animate: true, duration: 0.8, padding: [40, 40], maxZoom: 13 });
      } else if (center) {
        map.flyTo(center, zoom || 6, { animate: true, duration: 0.8 });
      }
    } catch (e) {
      console.warn('Map zoom error:', e);
    }
  }, [center, zoom, selectedHotel, bounds, map]);

  return null;
}

export default function FindHotel() {
  const { hotels, toggleWishlist, isWishlisted } = useApp();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Search Filters
  const initialLocation = searchParams.get('location') || searchParams.get('destination') || '';
  const [destination, setDestination] = useState(initialLocation);
  const [activeCityName, setActiveCityName] = useState(initialLocation || 'All India');

  const [checkIn, setCheckIn] = useState(searchParams.get('checkIn') || '2026-09-11');
  const [checkOut, setCheckOut] = useState(searchParams.get('checkOut') || '2026-09-14');
  const [guests, setGuests] = useState(Number(searchParams.get('guests')) || 2);
  const [rooms, setRooms] = useState(1);
  const [sortBy, setSortBy] = useState('recommended');

  const [guestDropdown, setGuestDropdown] = useState(false);
  const [roomDropdown, setRoomDropdown] = useState(false);
  const guestRef = useRef(null);
  const roomRef = useRef(null);

  // Map & View Mode state
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [viewMode, setViewMode] = useState('split'); // 'split' | 'map' | 'list'

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (guestRef.current && !guestRef.current.contains(e.target)) setGuestDropdown(false);
      if (roomRef.current && !roomRef.current.contains(e.target)) setRoomDropdown(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync with searchParams
  useEffect(() => {
    const loc = searchParams.get('location') || searchParams.get('destination') || '';
    if (loc) {
      setDestination(loc);
      setActiveCityName(loc);
    }
  }, [searchParams]);

  // Dynamically compute unique cities from REAL database hotels
  const cityClusters = useMemo(() => {
    const map = {};
    hotels.forEach(h => {
      const loc = (h.city || h.state || h.location || 'Other').trim();
      if (!map[loc]) {
        map[loc] = {
          name: loc,
          count: 0,
          latSum: 0,
          lngSum: 0,
          validCoords: 0,
          samplePhoto: getHotelPhoto(h)
        };
      }
      map[loc].count += 1;
      if (typeof h.latitude === 'number' && typeof h.longitude === 'number' && h.latitude !== 0) {
        map[loc].latSum += h.latitude;
        map[loc].lngSum += h.longitude;
        map[loc].validCoords += 1;
      }
    });

    return Object.values(map).map(c => ({
      name: c.name,
      count: c.count,
      lat: c.validCoords > 0 ? c.latSum / c.validCoords : 20.5937,
      lng: c.validCoords > 0 ? c.lngSum / c.validCoords : 78.9629,
      samplePhoto: c.samplePhoto
    })).sort((a, b) => b.count - a.count);
  }, [hotels]);

  // Filtered Hotels based on Real Database Data
  const filteredHotels = useMemo(() => {
    if (!destination.trim() || destination.toLowerCase() === 'all india') {
      return hotels;
    }
    const q = destination.toLowerCase().trim();
    return hotels.filter(h => {
      const loc = (h.location || '').toLowerCase();
      const name = (h.name || '').toLowerCase();
      const addr = (h.address || '').toLowerCase();
      const city = (h.city || '').toLowerCase();
      const state = (h.state || '').toLowerCase();
      const cat = (h.category || h.property_type || '').toLowerCase();
      return loc.includes(q) || name.includes(q) || addr.includes(q) || city.includes(q) || state.includes(q) || cat.includes(q);
    });
  }, [hotels, destination]);

  // Map Bounds based on filtered hotels
  const mapBounds = useMemo(() => {
    const validPoints = filteredHotels
      .filter(h => typeof h.latitude === 'number' && typeof h.longitude === 'number' && h.latitude !== 0 && h.longitude !== 0)
      .map(h => [h.latitude, h.longitude]);
    
    if (validPoints.length > 0) {
      return L.latLngBounds(validPoints);
    }
    return null;
  }, [filteredHotels]);

  // Displayed hotels: Show all matched hotels without artificial truncation
  const displayedHotels = useMemo(() => {
    let list = [...filteredHotels];
    
    // Sort
    list.sort((a, b) => {
      const priceA = getHotelPrice(a);
      const priceB = getHotelPrice(b);
      const ratingA = Number(a.rating) || 4.8;
      const ratingB = Number(b.rating) || 4.8;

      if (sortBy === 'price_asc') return priceA - priceB;
      if (sortBy === 'price_desc') return priceB - priceA;
      if (sortBy === 'rating') return ratingB - ratingA;
      
    // Default: sort highest rating first
    return ratingB - ratingA;
  });

  return list;
}, [filteredHotels, sortBy]);

const isPlaceSearched = Boolean(destination && destination.trim() && destination.toLowerCase() !== 'all india');

  // Handle City Chip Click
  const handleCitySelect = (cityName) => {
    setActiveCityName(cityName);
    setSelectedHotel(null);
    if (cityName === 'All India') {
      setDestination('');
      setSearchParams({});
    } else {
      setDestination(cityName);
      setSearchParams({ location: cityName });
    }
  };

  const hotelListRef = useRef(null);
  const scrollToHotelList = () => {
    if (hotelListRef.current) {
      hotelListRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div style={{ background: '#F8FAFC', minHeight: '100vh', minHeight: '100dvh', width: '100%' }}>
      
      {/* 1. Top Hero Banner with Search Bar */}
      <section className="find-hero-banner">
        <div className="find-hero-content">
          {/* Top Title & 3 Value Badges */}
          <div className="find-hero-top-row">
            <div>
              <h1 className="find-hero-title">Find Your Perfect Stay</h1>
              <p className="find-hero-subtitle">
                Compare, Negotiate & Book with <span>HotelIQ</span>.
              </p>
            </div>

            {/* 3 Value Prop Pills on Right (Desktop) */}
            <div className="find-hero-badges-row">
              <div className="find-hero-badge-pill">
                <Handshake size={16} />
                <span>Best Deals via Negotiation</span>
              </div>
              <div className="find-hero-badge-pill">
                <ShieldCheck size={16} />
                <span>Verified Hotel Partners</span>
              </div>
              <div className="find-hero-badge-pill">
                <Lock size={16} />
                <span>Secure & Easy Booking</span>
              </div>
            </div>
          </div>

          {/* Floating Horizontal Search Bar Card */}
          <div className="find-search-card">
            {/* Where are you going? */}
            <div className="find-search-segment" style={{ flex: 1.3 }}>
              <div className="find-search-icon">
                <MapPin size={18} color="#EA580C" />
              </div>
              <div className="find-search-text">
                <span className="find-search-label">Where are you going?</span>
                <input 
                  type="text"
                  placeholder="e.g. Vizag, Mumbai, Hyderabad..."
                  className="find-search-input"
                  value={destination}
                  onChange={(e) => {
                    setDestination(e.target.value);
                    setActiveCityName(e.target.value || 'All India');
                  }}
                />
              </div>
            </div>

            <div className="find-search-divider hide-on-mobile" />

            {/* Check-in */}
            <div className="find-search-segment">
              <div className="find-search-icon">
                <Calendar size={17} color="#64748B" />
              </div>
              <div className="find-search-text">
                <span className="find-search-label">Check-in</span>
                <input 
                  type="date"
                  className="find-search-input"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  style={{ cursor: 'pointer' }}
                />
              </div>
            </div>

            <div className="find-search-divider hide-on-mobile" />

            {/* Check-out */}
            <div className="find-search-segment">
              <div className="find-search-icon">
                <Calendar size={17} color="#64748B" />
              </div>
              <div className="find-search-text">
                <span className="find-search-label">Check-out</span>
                <input 
                  type="date"
                  className="find-search-input"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  style={{ cursor: 'pointer' }}
                />
              </div>
            </div>

            <div className="find-search-divider hide-on-mobile" />

            {/* Guests */}
            <div className="find-search-segment" ref={guestRef} onClick={() => setGuestDropdown(!guestDropdown)}>
              <div className="find-search-icon">
                <Users size={17} color="#64748B" />
              </div>
              <div className="find-search-text">
                <span className="find-search-label">Guests</span>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="find-search-sub" style={{ color: '#0F172A', fontWeight: 600 }}>
                    {guests} Guest{guests > 1 ? 's' : ''}
                  </span>
                  <ChevronDown size={13} color="#64748B" style={{ marginLeft: 4 }} />
                </div>
              </div>

              {guestDropdown && (
                <div 
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    position: 'absolute', top: '100%', right: 0, marginTop: 8,
                    background: '#FFFFFF', borderRadius: 12, padding: '14px 18px',
                    boxShadow: '0 12px 30px rgba(0,0,0,0.18)', border: '1px solid #E2E8F0',
                    zIndex: 100, minWidth: 180, display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                  }}
                >
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0F172A' }}>Guests</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button type="button" onClick={() => setGuests(Math.max(1, guests - 1))} style={{ width: 26, height: 26, borderRadius: '50%', border: '1px solid #CBD5E1', cursor: 'pointer' }}>-</button>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{guests}</span>
                    <button type="button" onClick={() => setGuests(Math.min(10, guests + 1))} style={{ width: 26, height: 26, borderRadius: '50%', border: '1px solid #CBD5E1', cursor: 'pointer' }}>+</button>
                  </div>
                </div>
              )}
            </div>

            <div className="find-search-divider hide-on-mobile" />

            {/* Rooms */}
            <div className="find-search-segment" ref={roomRef} onClick={() => setRoomDropdown(!roomDropdown)}>
              <div className="find-search-icon">
                <Bed size={17} color="#64748B" />
              </div>
              <div className="find-search-text">
                <span className="find-search-label">Rooms</span>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="find-search-sub" style={{ color: '#0F172A', fontWeight: 600 }}>
                    {rooms} Room{rooms > 1 ? 's' : ''}
                  </span>
                  <ChevronDown size={13} color="#64748B" style={{ marginLeft: 4 }} />
                </div>
              </div>

              {roomDropdown && (
                <div 
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    position: 'absolute', top: '100%', right: 0, marginTop: 8,
                    background: '#FFFFFF', borderRadius: 12, padding: '14px 18px',
                    boxShadow: '0 12px 30px rgba(0,0,0,0.18)', border: '1px solid #E2E8F0',
                    zIndex: 100, minWidth: 180, display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                  }}
                >
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0F172A' }}>Rooms</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button type="button" onClick={() => setRooms(Math.max(1, rooms - 1))} style={{ width: 26, height: 26, borderRadius: '50%', border: '1px solid #CBD5E1', cursor: 'pointer' }}>-</button>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{rooms}</span>
                    <button type="button" onClick={() => setRooms(Math.min(5, rooms + 1))} style={{ width: 26, height: 26, borderRadius: '50%', border: '1px solid #CBD5E1', cursor: 'pointer' }}>+</button>
                  </div>
                </div>
              )}
            </div>

            {/* Orange Search CTA Button */}
            <button className="find-search-btn" type="button" onClick={() => scrollToHotelList()}>
              <Search size={17} strokeWidth={2.5} />
              <span>Search</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. City Photo Filter Chips Row (Derived dynamically from real database hotels) */}
      <section className="city-chips-scroller-wrap">
        <div className="city-chips-row">
          {/* All India Chip */}
          <button 
            className={`city-photo-chip ${(!destination || activeCityName === 'All India') ? 'active' : ''}`}
            onClick={() => handleCitySelect('All India')}
          >
            <span style={{ fontSize: '1rem' }}>🇮🇳</span>
            <span>All India ({hotels.length})</span>
          </button>

          {/* Real Database City Chips */}
          {cityClusters.map((city) => (
            <button 
              key={city.name}
              className={`city-photo-chip ${activeCityName.toLowerCase() === city.name.toLowerCase() ? 'active' : ''}`}
              onClick={() => handleCitySelect(city.name)}
            >
              <img src={city.samplePhoto} alt={city.name} className="city-chip-thumb" />
              <span>{city.name} ({city.count})</span>
            </button>
          ))}
        </div>
      </section>

      {/* 2.5 View Mode Selector Bar & Quick Stats */}
      <section style={{ maxWidth: 1360, margin: '0 auto', padding: '0 36px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0F172A' }}>
            {filteredHotels.length} Verified Stays Found
          </span>
          {destination && (
            <span style={{ fontSize: '0.8rem', background: '#FEE2E2', color: '#DC2626', padding: '2px 8px', borderRadius: 9999, fontWeight: 700 }}>
              {destination}
            </span>
          )}
        </div>

        {/* View Mode Toggle Pill Group */}
        <div style={{
          display: 'flex',
          background: '#FFFFFF',
          padding: 4,
          borderRadius: 12,
          border: '1px solid #E2E8F0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          gap: 4
        }}>
          <button
            type="button"
            onClick={() => setViewMode('split')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              borderRadius: 8,
              fontSize: '0.82rem',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              background: viewMode === 'split' ? '#0F172A' : 'transparent',
              color: viewMode === 'split' ? '#FFFFFF' : '#64748B',
              transition: 'all 0.15s ease'
            }}
          >
            <Columns3 size={15} />
            <span>Map & List</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('map')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              borderRadius: 8,
              fontSize: '0.82rem',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              background: viewMode === 'map' ? '#0F172A' : 'transparent',
              color: viewMode === 'map' ? '#FFFFFF' : '#64748B',
              transition: 'all 0.15s ease'
            }}
          >
            <MapIcon size={15} />
            <span>Full Map</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('list')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              borderRadius: 8,
              fontSize: '0.82rem',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              background: viewMode === 'list' ? '#0F172A' : 'transparent',
              color: viewMode === 'list' ? '#FFFFFF' : '#64748B',
              transition: 'all 0.15s ease'
            }}
          >
            <LayoutGrid size={15} />
            <span>List Only</span>
          </button>
        </div>
      </section>

      {/* 3. Main Content: Split / Full Map / List Views */}
      <section 
        className="find-main-split"
        style={{
          gridTemplateColumns: viewMode === 'split' ? '1.05fr 1fr' : '1fr',
          maxWidth: viewMode === 'map' ? '1480px' : '1360px'
        }}
      >
        {/* Left / Full Column: Interactive Leaflet Map */}
        {(viewMode === 'split' || viewMode === 'map') && (
          <div 
            className="find-map-box"
            style={{
              height: viewMode === 'map' ? '780px' : '740px',
              position: 'relative'
            }}
          >
            {/* Top Left Badge showing real count */}
            <div className="map-badge-top-left">
              <MapPin size={15} color="#EA580C" />
              <span>{filteredHotels.length} Hotels on Map</span>
            </div>

            {/* Top Right Area Search Button */}
            <button 
              type="button" 
              className="map-btn-top-right"
              onClick={() => addToast(`Showing ${filteredHotels.length} properties in ${destination || 'India'}`, 'success')}
            >
              <Search size={14} color="#0F172A" />
              <span>Search this area</span>
            </button>

            {/* Bottom Left Quick List Button */}
            {viewMode === 'split' && (
              <button 
                type="button" 
                className="map-btn-bottom-left"
                onClick={scrollToHotelList}
              >
                <ListFilter size={15} />
                <span>View List</span>
              </button>
            )}

            {/* Bottom Right Legend */}
            <div className="map-legend-bottom-right">
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#EA580C' }} /> Popular
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#059669' }} /> Best Price
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2563EB' }} /> Luxury
              </span>
            </div>

            {/* Selected Hotel Floating Card in Full Map Mode */}
            {viewMode === 'map' && selectedHotel && (
              <div 
                style={{
                  position: 'absolute',
                  bottom: 24,
                  left: 24,
                  zIndex: 600,
                  background: '#FFFFFF',
                  borderRadius: 16,
                  padding: 16,
                  boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  maxWidth: 420,
                  animation: 'fadeIn 0.2s ease-out'
                }}
              >
                <img 
                  src={getHotelPhoto(selectedHotel)} 
                  alt={selectedHotel.name}
                  style={{ width: 90, height: 90, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{ margin: '0 0 4px', fontSize: '0.95rem', fontWeight: 800, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {selectedHotel.name}
                  </h4>
                  <div style={{ fontSize: '0.8rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                    <MapPin size={12} color="#EA580C" />
                    <span>{selectedHotel.location}</span>
                    <span>•</span>
                    <span style={{ color: '#059669', fontWeight: 700 }}>★ {selectedHotel.rating || '4.8'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '1rem', fontWeight: 800, color: '#EA580C' }}>
                      ₹{getHotelPrice(selectedHotel).toLocaleString()} <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 500 }}>/night</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => navigate(`/customer/hotel/${selectedHotel.id}`)}
                      style={{
                        background: '#EA580C',
                        color: 'white',
                        border: 'none',
                        borderRadius: 8,
                        padding: '6px 14px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Leaflet Map with Clean OpenStreetMap Tiles */}
            <MapContainer 
              center={[20.5937, 78.9629]} 
              zoom={5} 
              style={{ width: '100%', height: '100%', zIndex: 1 }}
              zoomControl={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapController bounds={mapBounds} selectedHotel={selectedHotel} />

              {/* Render real database hotel price markers */}
              {filteredHotels.map(h => {
                const lat = typeof h.latitude === 'number' && h.latitude !== 0 ? h.latitude : 17.6868;
                const lng = typeof h.longitude === 'number' && h.longitude !== 0 ? h.longitude : 83.2185;
                const isSelected = selectedHotel?.id === h.id;
                const price = getHotelPrice(h);

                return (
                  <Marker 
                    key={h.id}
                    position={[lat, lng]}
                    icon={createHotelPriceMarker(h, isSelected)}
                    eventHandlers={{
                      click: () => {
                        setSelectedHotel(h);
                        if (viewMode === 'split') scrollToHotelList();
                      }
                    }}
                  >
                    <Popup>
                      <div style={{ padding: 4, textAlign: 'center', minWidth: 160 }}>
                        <strong style={{ fontSize: '0.85rem', display: 'block', marginBottom: 2 }}>{h.name}</strong>
                        <div style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: 4 }}>📍 {h.location}</div>
                        <div style={{ color: '#EA580C', fontWeight: 800, fontSize: '0.9rem', marginBottom: 6 }}>
                          ₹{price.toLocaleString()}/night
                        </div>
                        <button 
                          onClick={() => navigate(`/customer/hotel/${h.id}`)}
                          style={{ background: '#EA580C', color: 'white', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                        >
                          View Property
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
        )}

        {/* Right / Grid Column: Featured Hotels List */}
        {(viewMode === 'split' || viewMode === 'list') && (
          <div className="find-list-column" ref={hotelListRef}>
            {/* Header Row */}
            <div className="find-list-header">
              <div className="find-list-title-wrap">
                <h2 className="find-list-title">
                  {isPlaceSearched ? `Hotels in ${destination}` : 'All Verified Hotels'}
                </h2>
                <span className="find-list-count">
                  {displayedHotels.length} Properties
                </span>
              </div>

              {/* Sort Dropdown */}
              <select 
                className="find-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="recommended">Sort: Recommended</option>
                <option value="rating">Highest Rated</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>

            {/* Scrollable / Grid Hotel Cards */}
            <div 
              className={viewMode === 'list' ? 'find-hotel-cards-grid' : 'find-hotel-cards-scroll'}
              style={viewMode === 'list' ? {
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
                gap: 20
              } : {}}
            >
              {displayedHotels.map((hotel) => {
                const price = getHotelPrice(hotel);
                const photoUrl = getHotelPhoto(hotel);
                const isSelected = selectedHotel?.id === hotel.id;

                return (
                  <div 
                    key={hotel.id} 
                    className="hotel-horizontal-card"
                    style={isSelected ? { borderColor: '#EA580C', boxShadow: '0 8px 24px rgba(234, 88, 12, 0.18)' } : {}}
                    onClick={() => {
                      setSelectedHotel(hotel);
                      navigate(`/customer/hotel/${hotel.id}`);
                    }}
                  >
                    {/* Left Thumbnail */}
                    <div className="hotel-h-image-wrap">
                      <img src={photoUrl} alt={hotel.name} className="hotel-h-image" loading="lazy" />
                    </div>

                    {/* Right Content */}
                    <div className="hotel-h-content">
                      <div>
                        {/* Title & Wishlist */}
                        <div className="hotel-h-top">
                          <h3 className="hotel-h-title">{hotel.name}</h3>
                          <button 
                            type="button" 
                            onClick={(e) => {
                              e.stopPropagation();
                              const added = toggleWishlist(hotel.id);
                              if (added) addToast(`Added "${hotel.name}" to wishlist!`, 'success');
                              else addToast(`Removed "${hotel.name}" from wishlist`, 'info');
                            }}
                            style={{
                              background: 'none', border: 'none', cursor: 'pointer', padding: 2,
                              color: isWishlisted(hotel.id) ? '#EF4444' : '#94A3B8'
                            }}
                            title={isWishlisted(hotel.id) ? 'Remove' : 'Save'}
                          >
                            <Heart 
                              size={18} 
                              fill={isWishlisted(hotel.id) ? '#EF4444' : 'none'} 
                              color={isWishlisted(hotel.id) ? '#EF4444' : '#94A3B8'} 
                            />
                          </button>
                        </div>

                        {/* Rating & Location */}
                        <div className="hotel-h-rating-row">
                          <span className="hotel-h-rating-star">★ {hotel.rating || '4.8'}</span>
                          <span className="hotel-h-reviews">({hotel.reviews_count || '1.2K'} reviews)</span>
                        </div>
                        <div className="hotel-h-location">
                          <MapPin size={13} color="#EA580C" />
                          <span>{hotel.location} • {hotel.address ? hotel.address.split(',')[0] : 'Central'}</span>
                        </div>

                        {/* Amenities Chips */}
                        <div className="hotel-h-amenities">
                          <span className="hotel-h-amenity-item"><Waves size={13} color="#0284C7" /> Pool</span>
                          <span className="hotel-h-amenity-item"><Sparkles size={13} color="#8B5CF6" /> Spa</span>
                          <span className="hotel-h-amenity-item"><Coffee size={13} color="#D97706" /> Breakfast</span>
                          <span className="hotel-h-amenity-item"><Utensils size={13} color="#059669" /> Restaurant</span>
                        </div>
                      </div>

                      {/* Price & Explore Button */}
                      <div className="hotel-h-bottom-row">
                        <div>
                          <span className="hotel-h-price-num">₹{price.toLocaleString()}</span>
                          <span className="hotel-h-price-unit"> / night</span>
                        </div>

                        <button 
                          type="button" 
                          className="hotel-h-explore-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/customer/hotel/${hotel.id}`);
                          }}
                        >
                          <span>Explore</span>
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Floating Mobile Toggle Button */}
      <div className="show-on-mobile" style={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        display: 'none' // Controlled by CSS media query
      }}>
        <button
          type="button"
          onClick={() => setViewMode(viewMode === 'map' ? 'list' : 'map')}
          style={{
            background: '#0F172A',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 9999,
            padding: '12px 24px',
            fontSize: '0.88rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
            cursor: 'pointer'
          }}
        >
          {viewMode === 'map' ? <LayoutGrid size={18} /> : <MapIcon size={18} />}
          <span>{viewMode === 'map' ? 'Show List' : 'Show Map'}</span>
        </button>
      </div>
    </div>
  );
}
