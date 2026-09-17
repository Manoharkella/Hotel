import { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  Compass,
  Star,
  Clock,
  Car,
  Ticket,
  Sparkles,
  Search,
  SlidersHorizontal,
  Navigation,
  ExternalLink,
  ChevronRight,
  Info,
  Layers,
  Grid,
  Map as MapIcon,
  X,
  Building,
  Landmark,
  Trees,
  ShoppingBag,
  Film,
  Smile,
  ShieldCheck,
  Check,
  Flame
} from 'lucide-react';

// Custom Map Icons
const createHotelPin = (hotelName) => {
  return L.divIcon({
    className: 'custom-hotel-pin',
    html: `
      <div style="
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        cursor: pointer;
        transform: translate(-50%, -100%);
      ">
        <div style="
          background: linear-gradient(135deg, #F59E0B, #D97706);
          color: white;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 800;
          font-family: var(--font-sans, sans-serif);
          white-space: nowrap;
          box-shadow: 0 4px 14px rgba(217, 119, 6, 0.4);
          border: 2px solid #FFFFFF;
          display: flex;
          align-items: center;
          gap: 4px;
          margin-bottom: 2px;
        ">
          <span>🏨</span>
          <span>${hotelName || 'Your Hotel'}</span>
        </div>
        <div style="
          width: 14px;
          height: 14px;
          background: #D97706;
          border: 3px solid #FFFFFF;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        "></div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0]
  });
};

const createSpotPin = (spot, isSelected = false) => {
  const categoryColors = {
    'Historical': '#8B5CF6',
    'Religious': '#F59E0B',
    'Nature': '#10B981',
    'Beach': '#06B6D4',
    'Shopping': '#EC4899',
    'Entertainment': '#F43F5E',
    'Museum': '#3B82F6',
    'Adventure': '#EF4444',
    'Family / Kids': '#14B8A6'
  };
  const color = categoryColors[spot.category] || '#6366F1';

  return L.divIcon({
    className: 'custom-spot-pin',
    html: `
      <div style="
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        cursor: pointer;
        transform: translate(-50%, -100%);
      ">
        <div style="
          background: ${color};
          color: white;
          width: ${isSelected ? '38px' : '32px'};
          height: ${isSelected ? '38px' : '32px'};
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 14px ${color}66, 0 2px 6px rgba(0,0,0,0.2);
          border: 2px solid #FFFFFF;
          transition: all 0.2s ease;
        ">
          <div style="transform: rotate(45deg); font-size: 13px; font-weight: 800;">
            📍
          </div>
        </div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0]
  });
};

function MapAutoBounds({ hotelCoords, spots, selectedSpot }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    try {
      setTimeout(() => map.invalidateSize(), 200);

      if (selectedSpot && typeof selectedSpot.latitude === 'number' && typeof selectedSpot.longitude === 'number') {
        map.flyTo([selectedSpot.latitude, selectedSpot.longitude], 14, { animate: true, duration: 0.8 });
        return;
      }

      const points = [];
      if (hotelCoords && typeof hotelCoords.lat === 'number' && typeof hotelCoords.lng === 'number') {
        points.push([hotelCoords.lat, hotelCoords.lng]);
      }
      if (spots && spots.length > 0) {
        spots.forEach(s => {
          if (typeof s.latitude === 'number' && typeof s.longitude === 'number') {
            points.push([s.latitude, s.longitude]);
          }
        });
      }

      if (points.length > 0) {
        const bounds = L.latLngBounds(points);
        if (bounds.isValid()) {
          map.flyToBounds(bounds, { animate: true, duration: 1, padding: [40, 40], maxZoom: 14 });
        }
      }
    } catch (e) {}
  }, [hotelCoords, spots, selectedSpot, map]);

  return null;
}

const CATEGORY_ICONS = {
  'All': Compass,
  'Historical': Landmark,
  'Religious': Sparkles,
  'Nature': Trees,
  'Beach': WavesIcon,
  'Shopping': ShoppingBag,
  'Entertainment': Film,
  'Museum': Building,
  'Adventure': Compass,
  'Family / Kids': Smile
};

function WavesIcon(props) {
  return <span style={{ fontSize: 14, lineHeight: 1 }}>🏖️</span>;
}

export default function NearbyAttractions({
  hotelId,
  hotelName = 'Booked Hotel',
  hotelLatitude,
  hotelLongitude,
  hotelCity = '',
  standalone = false,
  defaultViewMode = 'map', // default to 'map'
  showCitySelector = true,
  onlyMapView = false,
  hideViewToggle = false,
  hideSearchBar = false,
  category: externalCategory,
  distance: externalDistance,
  rating: externalRating,
  openNow: externalOpenNow,
  search: externalSearch
}) {
  const [spotsData, setSpotsData] = useState({ spots: [], top_recommended: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // City & Destination Hubs
  const [selectedCity, setSelectedCity] = useState(() => hotelCity || '');

  // Filter States
  const [selectedDistance, setSelectedDistance] = useState('All'); // 'All' | '2' | '5' | '10' | '25'
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedRating, setSelectedRating] = useState('All'); // 'All' | '4.5' | '4.0' | '3.5'
  const [openNowOnly, setOpenNowOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState(onlyMapView ? 'map' : defaultViewMode); // 'grid' | 'map'
  
  // Modals & Active Selections
  const [activeSpotModal, setActiveSpotModal] = useState(null);
  const [selectedMapSpot, setSelectedMapSpot] = useState(null);

  const effectiveCategory = externalCategory !== undefined ? externalCategory : selectedCategory;
  const effectiveDistance = externalDistance !== undefined ? externalDistance : selectedDistance;
  const effectiveRating = externalRating !== undefined ? externalRating : selectedRating;
  const effectiveOpenNow = externalOpenNow !== undefined ? externalOpenNow : openNowOnly;
  const effectiveSearch = externalSearch !== undefined ? externalSearch : searchQuery;

  // Sync defaultViewMode if changed externally
  useEffect(() => {
    if (defaultViewMode) setViewMode(defaultViewMode);
  }, [defaultViewMode]);

  // If hotelCity changes, update selectedCity
  useEffect(() => {
    if (hotelCity) {
      setSelectedCity(hotelCity);
    }
  }, [hotelCity]);

  // Fetch Nearby Attractions
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    const effectiveCity = selectedCity && selectedCity !== 'All' ? selectedCity : (hotelCity || '');

    api.getNearbyTouristSpots({
      hotelId: hotelId,
      lat: hotelLatitude,
      lng: hotelLongitude,
      city: effectiveCity,
      maxDistance: effectiveDistance,
      category: effectiveCategory,
      rating: effectiveRating,
      openNow: effectiveOpenNow,
      search: effectiveSearch,
      limit: 35
    })
      .then(res => {
        if (isMounted) {
          setSpotsData(res || { spots: [], top_recommended: [], total: 0 });
          setLoading(false);
        }
      })
      .catch(err => {
        if (isMounted) {
          setError(err.message || 'Failed to load nearby tourist spots');
          setLoading(false);
        }
      });

    return () => { isMounted = false; };
  }, [hotelId, hotelLatitude, hotelLongitude, hotelCity, selectedCity, effectiveDistance, effectiveCategory, effectiveRating, effectiveOpenNow, effectiveSearch]);

  const popularCities = [
    { label: 'All Locations', value: 'All', icon: '🌐' },
    { label: 'Hyderabad', value: 'Hyderabad', icon: '🏛️' },
    { label: 'Visakhapatnam', value: 'Visakhapatnam', icon: '🌊' },
    { label: 'Mumbai', value: 'Mumbai', icon: '🏙️' },
    { label: 'Goa', value: 'Goa', icon: '🏖️' },
    { label: 'Bangalore', value: 'Bangalore', icon: '🌳' },
    { label: 'Chennai', value: 'Chennai', icon: '🛕' }
  ];

  const categories = useMemo(() => [
    'All',
    'Historical',
    'Religious',
    'Nature',
    'Beach',
    'Shopping',
    'Entertainment',
    'Museum',
    'Adventure',
    'Family / Kids'
  ], []);

  const distanceOptions = [
    { label: 'All Distances', value: 'All' },
    { label: 'Within 2 km', value: '2' },
    { label: 'Within 5 km', value: '5' },
    { label: 'Within 10 km', value: '10' },
    { label: 'Within 25 km', value: '25' }
  ];

  const ratingOptions = [
    { label: 'All Ratings', value: 'All' },
    { label: '⭐ 4.5 & Above', value: '4.5' },
    { label: '⭐ 4.0 & Above', value: '4.0' },
    { label: '⭐ 3.5 & Above', value: '3.5' }
  ];

  const hotelCoords = useMemo(() => {
    if (typeof hotelLatitude === 'number' && typeof hotelLongitude === 'number') {
      return { lat: hotelLatitude, lng: hotelLongitude };
    }
    if (spotsData.target_location?.latitude && spotsData.target_location?.longitude) {
      return { lat: spotsData.target_location.latitude, lng: spotsData.target_location.longitude };
    }
    return { lat: 17.3850, lng: 78.4867 }; // Default fallback
  }, [hotelLatitude, hotelLongitude, spotsData]);

  return (
    <div className="nearby-attractions-module" style={{ width: '100%' }}>
      
      {/* 1. Header Section */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 16,
        marginBottom: 20
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{
              background: 'linear-gradient(135deg, #EA580C, #F97316)',
              color: 'white',
              padding: '3px 8px',
              borderRadius: 6,
              fontSize: '0.72rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Discover & Explore
            </span>
            <span style={{ fontSize: '0.85rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}>
              <MapPin size={13} color="#EA580C" /> Near {hotelName}
            </span>
          </div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>
            Explore Nearby Tourist Spots & Attractions
          </h2>
          <p style={{ color: '#64748B', fontSize: '0.9rem', margin: '4px 0 0' }}>
            Top sights, heritage monuments, beaches, and experiences around your stay location.
          </p>
        </div>

        {/* View Switcher: Grid vs Map (Hidden if onlyMapView) */}
        {!onlyMapView && !hideViewToggle && (
          <div style={{
            display: 'flex',
            background: '#F1F5F9',
            padding: 3,
            borderRadius: 10,
            border: '1px solid #E2E8F0'
          }}>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 14px',
                borderRadius: 8,
                border: 'none',
                background: viewMode === 'grid' ? '#FFFFFF' : 'transparent',
                color: viewMode === 'grid' ? '#0F172A' : '#64748B',
                fontWeight: viewMode === 'grid' ? 700 : 500,
                fontSize: '0.82rem',
                cursor: 'pointer',
                boxShadow: viewMode === 'grid' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <Grid size={14} />
              <span>Cards</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('map')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 14px',
                borderRadius: 8,
                border: 'none',
                background: viewMode === 'map' ? '#FFFFFF' : 'transparent',
                color: viewMode === 'map' ? '#0F172A' : '#64748B',
                fontWeight: viewMode === 'map' ? 700 : 500,
                fontSize: '0.82rem',
                cursor: 'pointer',
                boxShadow: viewMode === 'map' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <MapIcon size={14} />
              <span>Map View</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. Top Recommended Carousel / Quick Strip */}
      {spotsData.top_recommended && spotsData.top_recommended.length > 0 && !searchQuery && selectedCategory === 'All' && (
        <div style={{
          background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
          border: '1px solid #FDE68A',
          borderRadius: 14,
          padding: '14px 18px',
          marginBottom: 22,
          display: 'flex',
          flexDirection: 'column',
          gap: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Flame size={18} color="#D97706" />
              <span style={{ fontWeight: 800, fontSize: '0.92rem', color: '#92400E' }}>
                Top Ranked Sights Near Your Hotel
              </span>
            </div>
            <span style={{ fontSize: '0.78rem', color: '#B45309', fontWeight: 600 }}>
              Closest Popular Highlights
            </span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 10
          }}>
            {spotsData.top_recommended.map((spot, idx) => (
              <div
                key={spot.id}
                onClick={() => setActiveSpotModal(spot)}
                style={{
                  background: '#FFFFFF',
                  borderRadius: 10,
                  padding: '10px 12px',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  transition: 'transform 0.15s, box-shadow 0.15s',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.15)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'; }}
              >
                <div style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: '#FEF3C7',
                  color: '#B45309',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {idx + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {spot.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: '#64748B', marginTop: 1 }}>
                    <span style={{ color: '#EA580C', fontWeight: 700 }}>
                      📍 {spot.distance !== null ? `${spot.distance} km` : 'Nearby'}
                    </span>
                    <span>•</span>
                    <span>⭐ {spot.rating}</span>
                  </div>
                </div>
                <ChevronRight size={14} color="#94A3B8" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Search & Interactive Filter Controls */}
      {!hideSearchBar && (
        <div style={{
          background: '#FFFFFF',
          borderRadius: 14,
          padding: '16px 18px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
          marginBottom: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 14
        }}>
          {/* City / Destination Quick Hubs */}
          {showCitySelector && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              overflowX: 'auto',
              paddingBottom: 4,
              scrollbarWidth: 'none',
              borderBottom: '1px solid #F1F5F9',
              paddingBottom: 10
            }}>
              <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                <Compass size={13} color="#EA580C" /> Explore Hubs:
              </span>
              {popularCities.map(city => {
                const isSelected = selectedCity === city.value || (city.value === 'All' && !selectedCity);
                return (
                  <button
                    key={city.value}
                    type="button"
                    onClick={() => setSelectedCity(city.value)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '5px 12px',
                      borderRadius: 20,
                      border: isSelected ? '1px solid #EA580C' : '1px solid #E2E8F0',
                      background: isSelected ? '#FFF7ED' : '#FFFFFF',
                      color: isSelected ? '#C2410C' : '#475569',
                      fontSize: '0.78rem',
                      fontWeight: isSelected ? 800 : 500,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      boxShadow: isSelected ? '0 1px 4px rgba(234, 88, 12, 0.15)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span>{city.icon}</span>
                    <span>{city.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Search Bar + Quick Toggles Row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
            
            {/* Live Search Input */}
            <div style={{
              position: 'relative',
              flex: '1 1 260px',
              display: 'flex',
              alignItems: 'center'
            }}>
              <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: 14 }} />
              <input
                type="text"
                placeholder="Search destination, city, monuments, beaches, heritage..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 38px',
                  borderRadius: 9,
                  border: '1px solid #CBD5E1',
                  fontSize: '0.88rem',
                  outline: 'none',
                  background: '#F8FAFC',
                  color: '#0F172A',
                  transition: 'border 0.2s, background 0.2s'
                }}
                onFocus={e => { e.target.style.borderColor = '#2563EB'; e.target.style.background = '#FFFFFF'; }}
                onBlur={e => { e.target.style.borderColor = '#CBD5E1'; e.target.style.background = '#F8FAFC'; }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{ position: 'absolute', right: 10, background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 4 }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Distance Dropdown / Radius Pill */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>Distance:</span>
              <select
                value={selectedDistance}
                onChange={e => setSelectedDistance(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid #CBD5E1',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: '#0F172A',
                  background: '#FFFFFF',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                {distanceOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Min Rating Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>Rating:</span>
              <select
                value={selectedRating}
                onChange={e => setSelectedRating(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid #CBD5E1',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: '#0F172A',
                  background: '#FFFFFF',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                {ratingOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Open Now Switch */}
            <button
              type="button"
              onClick={() => setOpenNowOnly(!openNowOnly)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '7px 12px',
                borderRadius: 8,
                border: openNowOnly ? '1px solid #10B981' : '1px solid #CBD5E1',
                background: openNowOnly ? '#ECFDF5' : '#FFFFFF',
                color: openNowOnly ? '#065F46' : '#475569',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <span style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: openNowOnly ? '#10B981' : '#94A3B8',
                boxShadow: openNowOnly ? '0 0 6px #10B981' : 'none'
              }} />
              <span>Open Now Only</span>
            </button>
          </div>

          {/* Category Pills Slider */}
          <div style={{
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
            paddingBottom: 4,
            scrollbarWidth: 'none'
          }}>
            {categories.map(cat => {
              const isSelected = selectedCategory === cat;
              const IconComponent = CATEGORY_ICONS[cat] || Compass;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 13px',
                    borderRadius: 20,
                    border: isSelected ? '1px solid #2563EB' : '1px solid #E2E8F0',
                    background: isSelected ? '#2563EB' : '#F8FAFC',
                    color: isSelected ? '#FFFFFF' : '#334155',
                    fontSize: '0.8rem',
                    fontWeight: isSelected ? 700 : 500,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <IconComponent size={13} />
                  <span>{cat}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Attractions Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#FFFFFF', borderRadius: 14, border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'inline-block', width: 36, height: 36, border: '3px solid #E2E8F0', borderTopColor: '#2563EB', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: 14, color: '#64748B', fontWeight: 600, fontSize: '0.9rem' }}>
            Locating tourist spots around {hotelName || selectedCity}...
          </p>
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', background: '#FEF2F2', borderRadius: 14, border: '1px solid #FCA5A5' }}>
          <p style={{ color: '#991B1B', fontWeight: 600 }}>{error}</p>
        </div>
      ) : spotsData.no_location ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#FFFFFF', borderRadius: 16, border: '1px solid #E2E8F0' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#FFF7ED', color: '#EA580C', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <Compass size={28} />
          </div>
          <h3 style={{ fontSize: '1.18rem', fontWeight: 800, color: '#0F172A', margin: '0 0 6px' }}>
            Enter a Location to View Nearby Tourist Spots
          </h3>
          <p style={{ color: '#64748B', fontSize: '0.88rem', maxWidth: 460, margin: '0 auto' }}>
            Search any city, monument, or destination above or select a popular hub to see spots on the interactive map.
          </p>
        </div>
      ) : spotsData.spots.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#FFFFFF', borderRadius: 14, border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>🗺️</div>
          <h3 style={{ fontSize: '1.15rem', color: '#0F172A', marginBottom: 6 }}>No Tourist Spots Found</h3>
          <p style={{ color: '#64748B', fontSize: '0.85rem', maxWidth: 400, margin: '0 auto 16px' }}>
            We couldn't find any places matching your current filters. Try resetting the filters or picking another destination hub.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedCity('All');
              setSelectedDistance('All');
              setSelectedCategory('All');
              setSelectedRating('All');
              setOpenNowOnly(false);
              setSearchQuery('');
            }}
            style={{
              padding: '8px 16px',
              background: '#2563EB',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer'
            }}
          >
            Reset All Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* 4A. Grid Cards View */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
          gap: 18
        }}>
          {spotsData.spots.map(spot => (
            <div
              key={spot.id}
              className="tourist-spot-card"
              style={{
                background: '#FFFFFF',
                borderRadius: 14,
                border: '1px solid #E2E8F0',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 10px 24px rgba(0,0,0,0.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'; }}
            >
              {/* Card Image Banner with Category Badge */}
              <div style={{ position: 'relative', width: '100%', height: 160, background: '#E2E8F0', overflow: 'hidden' }}>
                <img
                  src={spot.image_url || 'https://images.unsplash.com/photo-1572445271230-a78b5944a659?w=800&auto=format&fit=crop&q=80'}
                  alt={spot.name}
                  loading="lazy"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                
                {/* Category Badge */}
                <div style={{
                  position: 'absolute',
                  top: 10,
                  left: 10,
                  background: 'rgba(15, 23, 42, 0.82)',
                  backdropFilter: 'blur(4px)',
                  color: 'white',
                  padding: '3px 8px',
                  borderRadius: 6,
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  letterSpacing: '0.02em'
                }}>
                  {spot.category}
                </div>

                {/* Rating Badge */}
                <div style={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(4px)',
                  color: '#0F172A',
                  padding: '3px 7px',
                  borderRadius: 6,
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                }}>
                  <Star size={12} color="#F59E0B" fill="#F59E0B" />
                  <span>{spot.rating}</span>
                </div>

                {/* Open Status Ribbon */}
                <div style={{
                  position: 'absolute',
                  bottom: 8,
                  left: 10,
                  background: spot.is_open_now ? '#10B981' : '#64748B',
                  color: 'white',
                  padding: '2px 7px',
                  borderRadius: 4,
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  textTransform: 'uppercase'
                }}>
                  {spot.is_open_now ? 'Open Now' : 'Closed'}
                </div>
              </div>

              {/* Card Body Info */}
              <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', margin: '0 0 4px', lineHeight: 1.3 }}>
                  {spot.name}
                </h3>
                
                <p style={{
                  color: '#64748B',
                  fontSize: '0.8rem',
                  margin: '0 0 12px',
                  lineHeight: 1.45,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {spot.description}
                </p>

                {/* Key Metrics Chips (Distance & Travel Time) */}
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 6,
                  marginBottom: 12,
                  marginTop: 'auto'
                }}>
                  {spot.distance !== null && (
                    <span style={{
                      background: '#FFF7ED',
                      color: '#C2410C',
                      border: '1px solid #FFEDD5',
                      padding: '3px 8px',
                      borderRadius: 6,
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}>
                      <MapPin size={11} color="#EA580C" />
                      {spot.distance} km away
                    </span>
                  )}

                  {spot.estimated_travel_time && (
                    <span style={{
                      background: '#EFF6FF',
                      color: '#1D4ED8',
                      border: '1px solid #DBEAFE',
                      padding: '3px 8px',
                      borderRadius: 6,
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}>
                      <Car size={11} color="#2563EB" />
                      {spot.estimated_travel_time}
                    </span>
                  )}

                  {spot.entry_fee && (
                    <span style={{
                      background: '#F8FAFC',
                      color: '#475569',
                      border: '1px solid #E2E8F0',
                      padding: '3px 8px',
                      borderRadius: 6,
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 3
                    }}>
                      <Ticket size={11} color="#64748B" />
                      {spot.entry_fee}
                    </span>
                  )}
                </div>

                {/* Action Buttons Row with Route View */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 8,
                  paddingTop: 10,
                  borderTop: '1px solid #F1F5F9'
                }}>
                  {/* Route & Map Pin View Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMapSpot(spot);
                      setViewMode('map');
                    }}
                    style={{
                      padding: '8px 10px',
                      background: '#FFF7ED',
                      color: '#C2410C',
                      border: '1px solid #FFEDD5',
                      borderRadius: 8,
                      fontWeight: 700,
                      fontSize: '0.76rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#EA580C'; e.currentTarget.style.color = '#FFFFFF'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#FFF7ED'; e.currentTarget.style.color = '#C2410C'; }}
                  >
                    <Compass size={13} />
                    <span>View Route</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveSpotModal(spot)}
                    style={{
                      padding: '8px 10px',
                      background: '#F8FAFC',
                      color: '#0F172A',
                      border: '1px solid #CBD5E1',
                      borderRadius: 8,
                      fontWeight: 700,
                      fontSize: '0.76rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                      transition: 'background 0.15s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#E2E8F0'}
                    onMouseLeave={e => e.currentTarget.style.background = '#F8FAFC'}
                  >
                    <Info size={13} />
                    <span>Details</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
        {/* 4B. Interactive Map View with Polyline Route & Floating HUD */}
        <div style={{
          height: 560,
          borderRadius: 14,
          overflow: 'hidden',
          border: '1px solid #CBD5E1',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          position: 'relative'
        }}>
          <MapContainer
            center={[hotelCoords.lat, hotelCoords.lng]}
            zoom={12}
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapAutoBounds
              hotelCoords={hotelCoords}
              spots={spotsData.spots}
              selectedSpot={selectedMapSpot}
            />

            {/* Selected Spot Route Connection Polyline */}
            {selectedMapSpot && (
              <Polyline
                positions={[
                  [hotelCoords.lat, hotelCoords.lng],
                  [selectedMapSpot.latitude, selectedMapSpot.longitude]
                ]}
                pathOptions={{
                  color: '#2563EB',
                  weight: 4,
                  opacity: 0.85,
                  dashArray: '8, 8',
                  lineCap: 'round',
                  lineJoin: 'round'
                }}
              >
                <Tooltip permanent={false} direction="center" opacity={0.9}>
                  <div style={{ fontWeight: 800, fontSize: '11px', color: '#1E40AF' }}>
                    🚗 {selectedMapSpot.distance} km • {selectedMapSpot.estimated_travel_time}
                  </div>
                </Tooltip>
              </Polyline>
            )}

            {/* Hotel Location Marker */}
            <Marker
              position={[hotelCoords.lat, hotelCoords.lng]}
              icon={createHotelPin(hotelName)}
            >
              <Popup>
                <div style={{ padding: 4, minWidth: 160 }}>
                  <div style={{ fontWeight: 800, color: '#D97706', fontSize: '0.85rem' }}>
                    🏨 {hotelName}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 2 }}>
                    Your Departure Stay Location
                  </div>
                </div>
              </Popup>
            </Marker>

            {/* Tourist Spots Markers */}
            {spotsData.spots.map(spot => (
              <Marker
                key={spot.id}
                position={[spot.latitude, spot.longitude]}
                icon={createSpotPin(spot, selectedMapSpot?.id === spot.id)}
                eventHandlers={{
                  click: () => setSelectedMapSpot(spot)
                }}
              >
                <Popup>
                  <div style={{ padding: 4, maxWidth: 220 }}>
                    <div style={{ width: '100%', height: 90, borderRadius: 6, overflow: 'hidden', marginBottom: 6 }}>
                      <img src={spot.image_url} alt={spot.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0F172A', marginBottom: 2 }}>
                      {spot.name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.74rem', color: '#EA580C', fontWeight: 700, marginBottom: 6 }}>
                      <span>📍 {spot.distance} km away</span>
                      <span>•</span>
                      <span>🚗 {spot.estimated_travel_time}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        type="button"
                        onClick={() => setActiveSpotModal(spot)}
                        style={{
                          flex: 1,
                          padding: '5px 8px',
                          background: '#F1F5F9',
                          color: '#0F172A',
                          border: 'none',
                          borderRadius: 6,
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Details
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedMapSpot(spot)}
                        style={{
                          flex: 1,
                          padding: '5px 8px',
                          background: '#2563EB',
                          color: 'white',
                          border: 'none',
                          borderRadius: 6,
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Set Route
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {/* Floating Active Route HUD */}
          {selectedMapSpot && (
            <div style={{
              position: 'absolute',
              bottom: 16,
              left: 16,
              right: 16,
              maxWidth: 440,
              background: 'rgba(255, 255, 255, 0.96)',
              backdropFilter: 'blur(10px)',
              borderRadius: 14,
              padding: '14px 18px',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.18)',
              border: '1px solid #CBD5E1',
              zIndex: 1000
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    fontSize: '0.72rem',
                    background: '#DBEAFE',
                    color: '#1E40AF',
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontWeight: 800,
                    letterSpacing: '0.04em'
                  }}>
                    ACTIVE ROUTE
                  </span>
                  <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0F172A', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {hotelName} ➔ {selectedMapSpot.name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedMapSpot(null)}
                  style={{ border: 'none', background: '#F1F5F9', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748B' }}
                >
                  <X size={14} />
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.82rem', color: '#475569', marginBottom: 12 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700, color: '#EA580C' }}>
                  <MapPin size={13} /> {selectedMapSpot.distance} km
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700, color: '#2563EB' }}>
                  <Car size={13} /> {selectedMapSpot.estimated_travel_time}
                </span>
                <span style={{ color: '#059669', fontWeight: 700 }}>
                  🎟️ {selectedMapSpot.entry_fee}
                </span>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setActiveSpotModal(selectedMapSpot)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    background: '#F8FAFC',
                    color: '#0F172A',
                    border: '1px solid #CBD5E1',
                    borderRadius: 8,
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Spot Info
                </button>
                <a
                  href={selectedMapSpot.google_maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    flex: 1.5,
                    padding: '8px 12px',
                    background: '#2563EB',
                    color: '#FFFFFF',
                    borderRadius: 8,
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    textAlign: 'center',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6
                  }}
                >
                  <Navigation size={13} />
                  <span>Start Navigation</span>
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Connected Interactive Spots Cards Tray */}
        {spotsData.spots.length > 0 && (
          <div style={{ marginTop: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Compass size={18} color="#EA580C" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0F172A', margin: 0 }}>
                  Places & Sights in {selectedCity !== 'All' ? selectedCity : (hotelCity || hotelName)} ({spotsData.spots.length})
                </h3>
              </div>
              <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>
                Click any place below to focus on the map & view route
              </span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 16
            }}>
              {spotsData.spots.map(spot => {
                const isSelected = selectedMapSpot?.id === spot.id;
                return (
                  <div
                    key={spot.id}
                    onClick={() => setSelectedMapSpot(spot)}
                    style={{
                      background: isSelected ? '#FFF7ED' : '#FFFFFF',
                      borderRadius: 14,
                      border: isSelected ? '2px solid #EA580C' : '1px solid #E2E8F0',
                      boxShadow: isSelected ? '0 8px 24px rgba(234, 88, 12, 0.16)' : '0 2px 8px rgba(0,0,0,0.03)',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'all 0.2s ease',
                      transform: isSelected ? 'translateY(-2px)' : 'none'
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 18px rgba(0,0,0,0.08)';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) {
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.03)';
                      }
                    }}
                  >
                    <div style={{ position: 'relative', width: '100%', height: 140, background: '#CBD5E1', overflow: 'hidden' }}>
                      <img src={spot.image_url} alt={spot.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{
                        position: 'absolute',
                        top: 8,
                        left: 8,
                        background: 'rgba(15, 23, 42, 0.85)',
                        backdropFilter: 'blur(4px)',
                        color: 'white',
                        padding: '3px 8px',
                        borderRadius: 6,
                        fontSize: '0.72rem',
                        fontWeight: 700
                      }}>
                        {spot.category}
                      </div>
                      <div style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        background: 'rgba(255, 255, 255, 0.95)',
                        color: '#0F172A',
                        padding: '2px 6px',
                        borderRadius: 6,
                        fontSize: '0.74rem',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2
                      }}>
                        <Star size={11} color="#F59E0B" fill="#F59E0B" />
                        <span>{spot.rating}</span>
                      </div>
                    </div>

                    <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <h4 style={{ margin: '0 0 4px', fontSize: '0.98rem', fontWeight: 800, color: isSelected ? '#C2410C' : '#0F172A' }}>
                        {spot.name}
                      </h4>
                      <p style={{
                        fontSize: '0.78rem',
                        color: '#64748B',
                        margin: '0 0 10px',
                        lineHeight: 1.4,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {spot.description}
                      </p>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 8, borderTop: '1px solid #F1F5F9', fontSize: '0.75rem' }}>
                        <span style={{ fontWeight: 700, color: '#EA580C', display: 'flex', alignItems: 'center', gap: 3 }}>
                          <MapPin size={11} /> {spot.distance !== null ? `${spot.distance} km` : 'Nearby'}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveSpotModal(spot);
                          }}
                          style={{
                            background: '#F1F5F9',
                            border: '1px solid #CBD5E1',
                            borderRadius: 6,
                            padding: '4px 8px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            color: '#0F172A',
                            cursor: 'pointer'
                          }}
                        >
                          Details
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </>
      )}

      {/* 5. Comprehensive Tourist Spot Details Modal */}
      {activeSpotModal && (
        <div
          className="spot-details-overlay"
          onClick={() => setActiveSpotModal(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(5px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16
          }}
        >
          <div
            className="spot-details-modal"
            onClick={e => e.stopPropagation()}
            style={{
              background: '#FFFFFF',
              borderRadius: 20,
              maxWidth: 620,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              position: 'relative',
              animation: 'scaleIn 0.2s ease-out'
            }}
          >
            {/* Modal Image Header */}
            <div style={{ position: 'relative', width: '100%', height: 240, background: '#0F172A' }}>
              <img
                src={activeSpotModal.image_url}
                alt={activeSpotModal.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <button
                type="button"
                onClick={() => setActiveSpotModal(null)}
                style={{
                  position: 'absolute',
                  top: 14,
                  right: 14,
                  background: 'rgba(0, 0, 0, 0.6)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: 36,
                  height: 36,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  backdropFilter: 'blur(4px)'
                }}
              >
                <X size={18} />
              </button>

              <div style={{
                position: 'absolute',
                bottom: 14,
                left: 16,
                display: 'flex',
                gap: 8
              }}>
                <span style={{
                  background: '#2563EB',
                  color: 'white',
                  padding: '4px 10px',
                  borderRadius: 6,
                  fontSize: '0.78rem',
                  fontWeight: 800
                }}>
                  {activeSpotModal.category}
                </span>
                <span style={{
                  background: activeSpotModal.is_open_now ? '#10B981' : '#64748B',
                  color: 'white',
                  padding: '4px 10px',
                  borderRadius: 6,
                  fontSize: '0.78rem',
                  fontWeight: 800
                }}>
                  {activeSpotModal.is_open_now ? 'Open Now' : 'Closed'}
                </span>
              </div>
            </div>

            {/* Modal Content Body */}
            <div style={{ padding: '22px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
                <div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                    {activeSpotModal.name}
                  </h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748B', fontSize: '0.85rem', marginTop: 4 }}>
                    <MapPin size={14} color="#EA580C" />
                    <span>{activeSpotModal.address || activeSpotModal.city}</span>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  background: '#FEF3C7',
                  color: '#B45309',
                  padding: '6px 12px',
                  borderRadius: 10,
                  fontWeight: 800,
                  fontSize: '0.9rem'
                }}>
                  <Star size={16} fill="#F59E0B" color="#F59E0B" />
                  <span>{activeSpotModal.rating}</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#92400E' }}>
                    ({(activeSpotModal.review_count || 100).toLocaleString()})
                  </span>
                </div>
              </div>

              {/* Distance from Hotel Highlight Banner */}
              <div style={{
                background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)',
                border: '1px solid #BFDBFE',
                borderRadius: 12,
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                margin: '16px 0'
              }}>
                <div>
                  <div style={{ fontSize: '0.78rem', color: '#1E40AF', fontWeight: 700 }}>
                    Distance from {hotelName}
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1E3A8A' }}>
                    {activeSpotModal.distance !== null ? `${activeSpotModal.distance} km` : 'Near Hotel'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.78rem', color: '#1E40AF', fontWeight: 700 }}>
                    Estimated Travel Time
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#2563EB', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Car size={16} />
                    <span>{activeSpotModal.estimated_travel_time}</span>
                  </div>
                </div>
              </div>

              {/* Spot Specifications 4-Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: 10,
                marginBottom: 18
              }}>
                <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: 10, border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>Timings</div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A', marginTop: 2 }}>
                    {activeSpotModal.opening_hours} - {activeSpotModal.closing_hours}
                  </div>
                </div>

                <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: 10, border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>Entry Fee</div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A', marginTop: 2 }}>
                    {activeSpotModal.entry_fee || 'Free Entry'}
                  </div>
                </div>

                <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: 10, border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>Best Time to Visit</div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A', marginTop: 2 }}>
                    {activeSpotModal.best_time_to_visit || 'Morning / Evening'}
                  </div>
                </div>

                <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: 10, border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>Avg Duration</div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A', marginTop: 2 }}>
                    {activeSpotModal.estimated_duration || '1 - 2 hours'}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>
                  About this Attraction
                </h4>
                <p style={{ color: '#475569', fontSize: '0.88rem', lineHeight: 1.6, margin: 0 }}>
                  {activeSpotModal.description}
                </p>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setActiveSpotModal(null)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#F1F5F9',
                    color: '#475569',
                    border: 'none',
                    borderRadius: 10,
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: 'pointer'
                  }}
                >
                  Close
                </button>
                <a
                  href={activeSpotModal.google_maps_url || `https://www.google.com/maps/dir/?api=1&origin=${hotelCoords.lat},${hotelCoords.lng}&destination=${activeSpotModal.latitude},${activeSpotModal.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    flex: 2,
                    padding: '12px',
                    background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 10,
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
                  }}
                >
                  <Navigation size={18} />
                  <span>Navigate with Google Maps</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
