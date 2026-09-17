import { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Search,
  MapPin,
  Heart,
  Star,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  LayoutGrid,
  Palmtree,
  Mountain,
  Landmark,
  Castle,
  Footprints,
  Droplets,
  Compass,
  ShoppingBag,
  Layers,
  Map as MapIcon,
  Navigation,
  Clock,
  Ticket,
  Calendar,
  Sparkles,
  X,
  ExternalLink
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { api } from '../../services/api';

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Category Icons and Labels matching the mockup
const CATEGORIES = [
  { id: 'All', label: 'All', icon: LayoutGrid },
  { id: 'Beaches', label: 'Beaches', icon: Palmtree },
  { id: 'Hill Stations', label: 'Hill Stations', icon: Mountain },
  { id: 'Temples', label: 'Temples', icon: Landmark },
  { id: 'Monuments', label: 'Monuments', icon: Castle },
  { id: 'Wildlife', label: 'Wildlife', icon: Footprints },
  { id: 'Waterfalls', label: 'Waterfalls', icon: Droplets },
  { id: 'Adventure', label: 'Adventure', icon: Compass },
  { id: 'Shopping', label: 'Shopping', icon: ShoppingBag }
];

// Top 5 Must-Visit Attractions matching the mockup
const TOP_VIEW_ATTRACTIONS = [
  {
    id: 'manali',
    rank: '#1',
    name: 'Manali',
    city: 'Manali',
    location: 'Himachal Pradesh',
    rating: 4.8,
    reviews: '12.4K',
    image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800&auto=format&fit=crop&q=80',
    tags: [
      { label: 'Hill Station', bg: '#EFF6FF', color: '#2563EB' },
      { label: 'Nature', bg: '#F0FDF4', color: '#16A34A' }
    ],
    lat: 32.2396,
    lng: 77.1887
  },
  {
    id: 'goa',
    rank: '#2',
    name: 'Goa',
    city: 'Goa',
    location: 'Goa',
    rating: 4.7,
    reviews: '10.2K',
    image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&auto=format&fit=crop&q=80',
    tags: [
      { label: 'Beach', bg: '#EFF6FF', color: '#0284C7' },
      { label: 'Adventure', bg: '#FAF5FF', color: '#9333EA' }
    ],
    lat: 15.4920,
    lng: 73.7737
  },
  {
    id: 'taj-mahal',
    rank: '#3',
    name: 'Taj Mahal',
    city: 'Agra',
    location: 'Agra, Uttar Pradesh',
    rating: 4.9,
    reviews: '18.6K',
    image: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800&auto=format&fit=crop&q=80',
    tags: [
      { label: 'Heritage', bg: '#FFF7ED', color: '#EA580C' },
      { label: 'Monument', bg: '#FEF2F2', color: '#DC2626' }
    ],
    lat: 27.1751,
    lng: 78.0421
  },
  {
    id: 'alleppey',
    rank: '#4',
    name: 'Alleppey Backwaters',
    city: 'Alleppey',
    location: 'Kerala',
    rating: 4.8,
    reviews: '9.1K',
    image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&auto=format&fit=crop&q=80',
    tags: [
      { label: 'Nature', bg: '#F0FDF4', color: '#16A34A' },
      { label: 'Water Activity', bg: '#F0F9FF', color: '#0284C7' }
    ],
    lat: 9.4981,
    lng: 76.3388
  },
  {
    id: 'hampi',
    rank: '#5',
    name: 'Hampi',
    city: 'Hampi',
    location: 'Karnataka',
    rating: 4.7,
    reviews: '8.3K',
    image: 'https://images.unsplash.com/photo-1600100397608-f010f44e138a?w=800&auto=format&fit=crop&q=80',
    tags: [
      { label: 'Heritage', bg: '#FFF7ED', color: '#EA580C' },
      { label: 'Culture', bg: '#FDF2F8', color: '#DB2777' }
    ],
    lat: 15.3350,
    lng: 76.4600
  }
];

// Major Indian Destinations on Map
const MAP_DESTINATIONS = [
  { name: 'Leh', lat: 34.1526, lng: 77.5771, image: 'https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?w=150&auto=format&fit=crop&q=80' },
  { name: 'Manali', lat: 32.2396, lng: 77.1887, image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=150&auto=format&fit=crop&q=80' },
  { name: 'Jaipur', lat: 26.9124, lng: 75.7873, image: 'https://images.unsplash.com/photo-1599661046827-dacff0c0f09a?w=150&auto=format&fit=crop&q=80' },
  { name: 'Agra', lat: 27.1751, lng: 78.0421, image: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=150&auto=format&fit=crop&q=80' },
  { name: 'Varanasi', lat: 25.3176, lng: 82.9739, image: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=150&auto=format&fit=crop&q=80' },
  { name: 'Visakhapatnam', lat: 17.6868, lng: 83.2185, image: 'https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?w=150&auto=format&fit=crop&q=80' },
  { name: 'Goa', lat: 15.4920, lng: 73.7737, image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=150&auto=format&fit=crop&q=80' },
  { name: 'Hampi', lat: 15.3350, lng: 76.4600, image: 'https://images.unsplash.com/photo-1600100397608-f010f44e138a?w=150&auto=format&fit=crop&q=80' },
  { name: 'Alleppey', lat: 9.4981, lng: 76.3388, image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=150&auto=format&fit=crop&q=80' },
  { name: 'Rameswaram', lat: 9.2876, lng: 79.3129, image: 'https://images.unsplash.com/photo-1621252179027-94459d278660?w=150&auto=format&fit=crop&q=80' }
];

// Map Controller Component to Fly/Pan
function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && map) {
      map.flyTo(center, zoom || 6, { animate: true, duration: 1 });
    }
  }, [center, zoom, map]);
  return null;
}

// Custom Leaflet Round Thumbnail Marker
function createRoundMarkerIcon(name, image, isSelected) {
  return L.divIcon({
    className: 'custom-map-pin',
    html: `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        cursor: pointer;
        transform: translate(-50%, -100%);
      ">
        <div style="
          width: ${isSelected ? '48px' : '40px'};
          height: ${isSelected ? '48px' : '40px'};
          border-radius: 50%;
          border: 3px solid ${isSelected ? '#EA580C' : '#FFFFFF'};
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          overflow: hidden;
          background: #0F172A;
          transition: transform 0.2s ease;
        ">
          <img src="${image}" alt="${name}" style="width: 100%; height: 100%; object-fit: cover;" />
        </div>
        <div style="
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 8px solid ${isSelected ? '#EA580C' : '#FFFFFF'};
          margin-top: -1px;
        "></div>
        <span style="
          background: rgba(15, 23, 42, 0.85);
          color: #FFFFFF;
          font-size: 11px;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: 10px;
          margin-top: 2px;
          white-space: nowrap;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        ">${name}</span>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0]
  });
}

export default function ExploreNearbyPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryCity = searchParams.get('city') || '';

  // Active States
  const [selectedDestination, setSelectedDestination] = useState(() => queryCity || 'Visakhapatnam');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchInput, setSearchInput] = useState('');
  const [activeSubTab, setActiveSubTab] = useState('nearest'); // 'nearest' | 'top-rated' | 'trending'
  const [mapLayer, setMapLayer] = useState('map'); // 'map' | 'satellite'
  const [wishlist, setWishlist] = useState({});
  const [activeSpotModal, setActiveSpotModal] = useState(null);

  // Spots Data
  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState([17.6868, 83.2185]); // Visakhapatnam default
  const [mapZoom, setMapZoom] = useState(6);

  // Sync with URL params
  useEffect(() => {
    if (queryCity) {
      setSelectedDestination(queryCity);
    }
  }, [queryCity]);

  // Fetch Nearby Tourist Spots from API
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    api.getNearbyTouristSpots({
      city: selectedDestination,
      category: selectedCategory !== 'All' ? selectedCategory : '',
      search: searchInput,
      limit: 25
    })
      .then(res => {
        if (isMounted) {
          const list = res.spots || [];
          setSpots(list);
          if (res.target_location?.latitude && res.target_location?.longitude) {
            setMapCenter([res.target_location.latitude, res.target_location.longitude]);
            setMapZoom(9);
          }
          setLoading(false);
        }
      })
      .catch(err => {
        if (isMounted) {
          console.warn('Tourist spots fetch error:', err);
          setLoading(false);
        }
      });

    return () => { isMounted = false; };
  }, [selectedDestination, selectedCategory, searchInput]);

  const handleSelectDestination = (destName, lat, lng) => {
    setSelectedDestination(destName);
    setSearchParams({ city: destName });
    if (lat && lng) {
      setMapCenter([lat, lng]);
      setMapZoom(10);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    setSelectedDestination(searchInput.trim());
    setSearchParams({ city: searchInput.trim() });
  };

  const toggleWishlist = (id, e) => {
    e?.stopPropagation();
    setWishlist(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Filtered & Sorted Nearby Spots for Right Column
  const sortedNearbySpots = useMemo(() => {
    let list = [...spots];
    if (activeSubTab === 'top-rated') {
      list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (activeSubTab === 'trending') {
      list.sort((a, b) => (b.review_count || 0) - (a.review_count || 0));
    } else {
      // nearest
      list.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    }
    return list;
  }, [spots, activeSubTab]);

  return (
    <div style={{ maxWidth: 1360, margin: '0 auto', padding: '16px 24px 80px', fontFamily: 'var(--font-sans)' }}>
      
      {/* 1. Full-Width Panoramic Hero Section (Matching User Screenshot) */}
      <section style={{
        position: 'relative',
        borderRadius: 24,
        overflow: 'hidden',
        minHeight: 340,
        marginBottom: 28,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '36px 44px',
        boxShadow: '0 8px 30px rgba(0,0,0,0.06)'
      }}>
        {/* Background Image: Kerala Backwaters Sunset */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'url(https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=1800&auto=format&fit=crop&q=85)',
          backgroundSize: 'cover',
          backgroundPosition: 'center 40%',
          zIndex: 1
        }} />

        {/* Soft Warm Gradient Overlay for Perfect Typography Contrast */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.94) 0%, rgba(255, 255, 255, 0.82) 48%, rgba(255, 255, 255, 0.25) 100%)',
          zIndex: 2
        }} />

        {/* Hero Content (Left Side) */}
        <div style={{ position: 'relative', zIndex: 3, maxWidth: 640 }}>
          {/* Top Tagline */}
          <div style={{
            fontSize: '0.82rem',
            fontWeight: 800,
            letterSpacing: '0.22em',
            color: '#EA580C',
            textTransform: 'uppercase',
            marginBottom: 8
          }}>
            TRAVEL . DISCOVER . STAY
          </div>

          {/* Main Headline */}
          <h1 style={{
            fontSize: 'clamp(2.2rem, 3.8vw, 3.2rem)',
            fontWeight: 900,
            color: '#0F172A',
            margin: '0 0 10px',
            lineHeight: 1.15,
            letterSpacing: '-0.03em'
          }}>
            Explore the<br />Beauty of India
          </h1>

          {/* Subtitle */}
          <p style={{
            color: '#475569',
            fontSize: '0.98rem',
            lineHeight: 1.5,
            margin: '0 0 20px',
            maxWidth: 480
          }}>
            From serene beaches to historic monuments, find the best places to explore near your stay.
          </p>

          {/* Search Pill Card */}
          <form onSubmit={handleSearchSubmit} style={{
            display: 'flex',
            alignItems: 'center',
            background: '#FFFFFF',
            borderRadius: 14,
            padding: '5px 6px 5px 16px',
            boxShadow: '0 6px 24px rgba(0,0,0,0.08)',
            border: '1px solid #E2E8F0',
            maxWidth: 520,
            marginBottom: 14
          }}>
            <Search size={18} color="#94A3B8" style={{ marginRight: 10, flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search destinations, attractions, or experiences..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                fontSize: '0.92rem',
                color: '#0F172A',
                background: 'transparent'
              }}
            />
            <button
              type="submit"
              style={{
                background: '#EA580C',
                color: '#FFFFFF',
                border: 'none',
                padding: '9px 24px',
                borderRadius: 10,
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#C2410C'}
              onMouseLeave={e => e.currentTarget.style.background = '#EA580C'}
            >
              Search
            </button>
          </form>

          {/* Popular Tag Pills Row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>Popular:</span>
            {['Beaches', 'Temples', 'Hill Stations', 'Museums', 'Wildlife', 'Heritage', 'Adventure'].map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => {
                  setSelectedCategory(tag === 'Museums' ? 'Museum' : tag);
                  setSearchInput(tag);
                }}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: 20,
                  padding: '3px 10px',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  color: '#475569',
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#EA580C'; e.currentTarget.style.color = '#EA580C'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.color = '#475569'; }}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Cursive "Incredible India" Watermark Overlay (Right Side) */}
        <div style={{
          position: 'absolute',
          right: 36,
          top: 36,
          zIndex: 3,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          pointerEvents: 'none'
        }}>
          <span style={{
            fontFamily: 'Playfair Display, Georgia, serif',
            fontStyle: 'italic',
            fontSize: '2.8rem',
            fontWeight: 800,
            color: 'rgba(255, 255, 255, 0.95)',
            textShadow: '0 2px 10px rgba(0,0,0,0.4)',
            lineHeight: 1
          }}>
            Incredible<br /><span style={{ marginLeft: 20 }}>India</span>
          </span>
        </div>

        {/* Floating Right Bottom Location Badge */}
        <div style={{
          position: 'absolute',
          right: 28,
          bottom: 24,
          zIndex: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 10
        }}>
          <div style={{
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)',
            borderRadius: 20,
            padding: '6px 14px',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: '0.76rem',
            fontWeight: 700
          }}>
            <MapPin size={12} color="#EA580C" />
            <span>Alleppey, Kerala <span style={{ opacity: 0.7, fontWeight: 400 }}>Backwaters</span></span>
          </div>
          
          <button
            type="button"
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.9)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
            }}
          >
            <ChevronRight size={18} color="#0F172A" />
          </button>
        </div>
      </section>

      {/* 2. Category Selector Cards Row */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(105px, 1fr))',
        gap: 12,
        marginBottom: 32
      }}>
        {CATEGORIES.map(cat => {
          const isSelected = selectedCategory === cat.id;
          const IconComp = cat.icon;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                background: '#FFFFFF',
                borderRadius: 16,
                padding: '16px 10px',
                border: isSelected ? '2px solid #EA580C' : '1px solid #E2E8F0',
                boxShadow: isSelected ? '0 6px 16px rgba(234, 88, 12, 0.15)' : '0 2px 8px rgba(0,0,0,0.02)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => {
                if (!isSelected) e.currentTarget.style.borderColor = '#CBD5E1';
              }}
              onMouseLeave={e => {
                if (!isSelected) e.currentTarget.style.borderColor = '#E2E8F0';
              }}
            >
              <div style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: isSelected ? '#FFF7ED' : '#F8FAFC',
                color: isSelected ? '#EA580C' : '#475569',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <IconComp size={20} />
              </div>
              <span style={{
                fontSize: '0.8rem',
                fontWeight: isSelected ? 800 : 600,
                color: isSelected ? '#EA580C' : '#334155'
              }}>
                {cat.label}
              </span>
            </button>
          );
        })}
      </section>

      {/* 3. Top View Attractions Row (Must-Visit Places across India) */}
      <section style={{ marginBottom: 36 }}>
        {/* Section Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0F172A', margin: '0 0 2px', letterSpacing: '-0.02em' }}>
              Top View Attractions
            </h2>
            <p style={{ color: '#64748B', fontSize: '0.85rem', margin: 0 }}>
              Must-visit places across India
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              type="button"
              onClick={() => setSelectedCategory('All')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                background: 'none',
                border: 'none',
                color: '#EA580C',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              <span>View All</span>
              <ArrowRight size={14} />
            </button>

            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  border: '1px solid #E2E8F0',
                  background: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#64748B'
                }}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  border: '1px solid #E2E8F0',
                  background: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#64748B'
                }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* 5 Cards Horizontal Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
          gap: 16
        }}>
          {TOP_VIEW_ATTRACTIONS.map(item => {
            const isWishlisted = Boolean(wishlist[item.id]);
            const isSelected = selectedDestination.toLowerCase() === item.city.toLowerCase();
            return (
              <div
                key={item.id}
                onClick={() => handleSelectDestination(item.city, item.lat, item.lng)}
                style={{
                  background: '#FFFFFF',
                  borderRadius: 16,
                  overflow: 'hidden',
                  border: isSelected ? '2px solid #EA580C' : '1px solid #E2E8F0',
                  boxShadow: isSelected ? '0 8px 24px rgba(234, 88, 12, 0.16)' : '0 2px 10px rgba(0,0,0,0.03)',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
                onMouseEnter={e => {
                  if (!isSelected) {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.08)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isSelected) {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.03)';
                  }
                }}
              >
                {/* Photo Thumbnail */}
                <div style={{ position: 'relative', height: 140, background: '#CBD5E1', overflow: 'hidden' }}>
                  <img
                    src={item.image}
                    alt={item.name}
                    loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  
                  {/* Rank Badge (#1, #2, etc.) */}
                  <div style={{
                    position: 'absolute',
                    top: 10,
                    left: 10,
                    background: '#EA580C',
                    color: '#FFFFFF',
                    fontSize: '0.72rem',
                    fontWeight: 900,
                    padding: '2px 8px',
                    borderRadius: 6
                  }}>
                    {item.rank}
                  </div>

                  {/* Heart / Wishlist Icon */}
                  <button
                    type="button"
                    onClick={(e) => toggleWishlist(item.id, e)}
                    style={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: 'rgba(0,0,0,0.4)',
                      backdropFilter: 'blur(4px)',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <Heart
                      size={14}
                      color={isWishlisted ? '#EF4444' : '#FFFFFF'}
                      fill={isWishlisted ? '#EF4444' : 'none'}
                    />
                  </button>
                </div>

                {/* Card Info */}
                <div style={{ padding: '12px 14px' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.98rem', color: '#0F172A', marginBottom: 3 }}>
                    {item.name}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.76rem', color: '#64748B', marginBottom: 8 }}>
                    <MapPin size={12} color="#EA580C" />
                    <span>{item.location}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', color: '#475569', marginBottom: 10 }}>
                    <Star size={13} color="#F59E0B" fill="#F59E0B" />
                    <span style={{ fontWeight: 800, color: '#0F172A' }}>{item.rating}</span>
                    <span style={{ color: '#94A3B8' }}>({item.reviews})</span>
                  </div>

                  {/* Category / Type Tag Pills */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {item.tags.map(t => (
                      <span
                        key={t.label}
                        style={{
                          background: t.bg,
                          color: t.color,
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 6
                        }}
                      >
                        {t.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Bottom Split Section: Explore on Map (Left) + Popular Attractions Nearby (Right) */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.35fr) minmax(0, 1fr)',
        gap: 20,
        alignItems: 'start'
      }}>
        
        {/* Left Column: Interactive Map Box */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 20,
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Map Card Header */}
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid #F1F5F9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: '#FFF7ED',
                color: '#EA580C',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <MapPin size={17} />
              </div>
              <div>
                <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Explore on Map
                </h3>
                <p style={{ color: '#64748B', fontSize: '0.78rem', margin: 0 }}>
                  Find top attractions near your location
                </p>
              </div>
            </div>

            <div style={{ fontSize: '0.78rem', color: '#EA580C', fontWeight: 700, background: '#FFF7ED', padding: '3px 10px', borderRadius: 8 }}>
              📍 {selectedDestination}
            </div>
          </div>

          {/* Leaflet Map Canvas */}
          <div style={{ position: 'relative', height: 420, width: '100%', background: '#E2E8F0' }}>
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              scrollWheelZoom={false}
              style={{ height: '100%', width: '100%' }}
            >
              <MapController center={mapCenter} zoom={mapZoom} />

              {/* Standard Map or Satellite Tiles */}
              {mapLayer === 'map' ? (
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
              ) : (
                <TileLayer
                  attribution='Tiles &copy; Esri'
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                />
              )}

              {/* Major Destination Pins on Map */}
              {MAP_DESTINATIONS.map(dest => {
                const isSelected = selectedDestination.toLowerCase() === dest.name.toLowerCase();
                return (
                  <Marker
                    key={dest.name}
                    position={[dest.lat, dest.lng]}
                    icon={createRoundMarkerIcon(dest.name, dest.image, isSelected)}
                    eventHandlers={{
                      click: () => handleSelectDestination(dest.name, dest.lat, dest.lng)
                    }}
                  >
                    <Popup>
                      <div style={{ textAlign: 'center', padding: '4px 2px' }}>
                        <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0F172A', marginBottom: 2 }}>
                          {dest.name}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleSelectDestination(dest.name, dest.lat, dest.lng)}
                          style={{
                            background: '#EA580C',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: 6,
                            padding: '3px 8px',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            marginTop: 4
                          }}
                        >
                          View Attractions
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

              {/* Location-Specific Tourist Spot Pins */}
              {spots.map(s => {
                if (typeof s.latitude !== 'number' || typeof s.longitude !== 'number') return null;
                return (
                  <Marker
                    key={s.id}
                    position={[s.latitude, s.longitude]}
                    eventHandlers={{
                      click: () => setActiveSpotModal(s)
                    }}
                  >
                    <Popup>
                      <div style={{ maxWidth: 200 }}>
                        <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#0F172A' }}>{s.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#EA580C', marginTop: 2 }}>⭐ {s.rating} • {s.category}</div>
                        <button
                          type="button"
                          onClick={() => setActiveSpotModal(s)}
                          style={{
                            width: '100%',
                            marginTop: 6,
                            padding: '4px 8px',
                            background: '#EA580C',
                            color: 'white',
                            border: 'none',
                            borderRadius: 6,
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          Details & Route
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>

            {/* Bottom-Right Layer Switcher Pill */}
            <div style={{
              position: 'absolute',
              bottom: 16,
              right: 16,
              zIndex: 500,
              background: '#FFFFFF',
              borderRadius: 10,
              padding: 3,
              boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
              display: 'flex',
              gap: 2
            }}>
              <button
                type="button"
                onClick={() => setMapLayer('map')}
                style={{
                  padding: '4px 10px',
                  borderRadius: 7,
                  border: 'none',
                  background: mapLayer === 'map' ? '#EA580C' : 'transparent',
                  color: mapLayer === 'map' ? '#FFFFFF' : '#475569',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Map
              </button>
              <button
                type="button"
                onClick={() => setMapLayer('satellite')}
                style={{
                  padding: '4px 10px',
                  borderRadius: 7,
                  border: 'none',
                  background: mapLayer === 'satellite' ? '#EA580C' : 'transparent',
                  color: mapLayer === 'satellite' ? '#FFFFFF' : '#475569',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Satellite
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Popular Attractions Nearby List */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 20,
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
          padding: '18px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14
        }}>
          {/* Header Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <MapPin size={17} color="#EA580C" />
              <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Popular Attractions Nearby
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setSelectedCategory('All')}
              style={{ background: 'none', border: 'none', color: '#EA580C', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
            >
              See All
            </button>
          </div>

          {/* Sub-Filter Tabs: Nearest | Top Rated | Trending */}
          <div style={{
            display: 'flex',
            background: '#F8FAFC',
            borderRadius: 10,
            padding: 3,
            border: '1px solid #F1F5F9',
            gap: 4
          }}>
            {[
              { id: 'nearest', label: 'Nearest' },
              { id: 'top-rated', label: 'Top Rated' },
              { id: 'trending', label: 'Trending' }
            ].map(tab => {
              const isActive = activeSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveSubTab(tab.id)}
                  style={{
                    flex: 1,
                    padding: '6px 0',
                    border: 'none',
                    borderRadius: 8,
                    background: isActive ? '#EA580C' : 'transparent',
                    color: isActive ? '#FFFFFF' : '#64748B',
                    fontSize: '0.78rem',
                    fontWeight: isActive ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Attraction Items List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 370, overflowY: 'auto', paddingRight: 4 }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748B', fontSize: '0.85rem' }}>
                Loading nearby sights...
              </div>
            ) : sortedNearbySpots.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 0', color: '#64748B' }}>
                <div style={{ fontSize: '1.8rem', marginBottom: 6 }}>📍</div>
                <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600 }}>No spots found for this filter.</p>
              </div>
            ) : (
              sortedNearbySpots.map(spot => (
                <div
                  key={spot.id}
                  onClick={() => setActiveSpotModal(spot)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 12px',
                    borderRadius: 12,
                    border: '1px solid #F1F5F9',
                    background: '#FFFFFF',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = '#F8FAFC';
                    e.currentTarget.style.borderColor = '#E2E8F0';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = '#FFFFFF';
                    e.currentTarget.style.borderColor = '#F1F5F9';
                  }}
                >
                  {/* Item Image */}
                  <div style={{ width: 48, height: 48, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: '#CBD5E1' }}>
                    <img
                      src={spot.image_url || 'https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?w=150'}
                      alt={spot.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>

                  {/* Title & Location */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontWeight: 800,
                      fontSize: '0.88rem',
                      color: '#0F172A',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {spot.name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.74rem', color: '#64748B', marginTop: 2 }}>
                      <MapPin size={11} color="#EA580C" />
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {spot.city || spot.address || selectedDestination}
                      </span>
                    </div>
                  </div>

                  {/* Distance in km */}
                  <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600, flexShrink: 0 }}>
                    {typeof spot.distance === 'number' ? `${spot.distance} km` : 'Near'}
                  </div>

                  {/* Rating with Star */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.82rem', fontWeight: 800, color: '#0F172A', flexShrink: 0 }}>
                    <Star size={13} color="#F59E0B" fill="#F59E0B" />
                    <span>{spot.rating || 4.7}</span>
                  </div>

                  {/* Chevron Right */}
                  <ChevronRight size={16} color="#94A3B8" style={{ flexShrink: 0 }} />
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* 5. Detailed Attraction Modal */}
      {activeSpotModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(6px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: 20,
            maxWidth: 540,
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            position: 'relative',
            boxShadow: '0 20px 40px rgba(0,0,0,0.25)'
          }}>
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setActiveSpotModal(null)}
              style={{
                position: 'absolute',
                top: 14,
                right: 14,
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'rgba(0,0,0,0.5)',
                color: '#FFFFFF',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 10
              }}
            >
              <X size={16} />
            </button>

            {/* Modal Image */}
            <div style={{ height: 220, position: 'relative', background: '#CBD5E1' }}>
              <img
                src={activeSpotModal.image_url || 'https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?w=800'}
                alt={activeSpotModal.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{
                position: 'absolute',
                bottom: 12,
                left: 14,
                background: '#EA580C',
                color: '#FFFFFF',
                fontSize: '0.74rem',
                fontWeight: 800,
                padding: '3px 10px',
                borderRadius: 20
              }}>
                {activeSpotModal.category}
              </div>
            </div>

            {/* Modal Content */}
            <div style={{ padding: '20px 24px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0F172A', margin: '0 0 6px' }}>
                {activeSpotModal.name}
              </h3>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: '#64748B', marginBottom: 14 }}>
                <MapPin size={13} color="#EA580C" />
                <span>{activeSpotModal.address || activeSpotModal.city}</span>
                <span>•</span>
                <Star size={13} color="#F59E0B" fill="#F59E0B" />
                <span style={{ fontWeight: 800, color: '#0F172A' }}>{activeSpotModal.rating}</span>
                <span style={{ color: '#94A3B8' }}>({activeSpotModal.review_count || '5K+'} reviews)</span>
              </div>

              <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: 1.55, margin: '0 0 18px' }}>
                {activeSpotModal.description || 'Famous attraction known for panoramic views, rich cultural significance, and scenic experiences.'}
              </p>

              {/* Info Badges Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 10,
                marginBottom: 20
              }}>
                <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: 10, border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>Distance & Travel Time</div>
                  <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#0F172A', marginTop: 2 }}>
                    📍 {activeSpotModal.distance !== null ? `${activeSpotModal.distance} km` : 'Nearby'} • {activeSpotModal.estimated_travel_time || '15 mins drive'}
                  </div>
                </div>

                <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: 10, border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>Opening Hours</div>
                  <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#0F172A', marginTop: 2 }}>
                    ⏰ {activeSpotModal.opening_hours || '09:00 AM'} - {activeSpotModal.closing_hours || '06:00 PM'}
                  </div>
                </div>

                <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: 10, border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>Entry Ticket</div>
                  <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#0F172A', marginTop: 2 }}>
                    🎟️ {activeSpotModal.entry_fee || 'Free Entry'}
                  </div>
                </div>

                <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: 10, border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>Best Time to Visit</div>
                  <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#0F172A', marginTop: 2 }}>
                    🌅 {activeSpotModal.best_time_to_visit || 'Morning / Sunset'}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 10 }}>
                <a
                  href={activeSpotModal.google_maps_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeSpotModal.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    flex: 1,
                    background: '#EA580C',
                    color: '#FFFFFF',
                    padding: '11px 16px',
                    borderRadius: 10,
                    fontWeight: 800,
                    fontSize: '0.88rem',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6
                  }}
                >
                  <Navigation size={16} />
                  <span>Start Navigation (Google Maps)</span>
                  <ExternalLink size={14} />
                </a>

                <button
                  type="button"
                  onClick={() => setActiveSpotModal(null)}
                  style={{
                    padding: '11px 18px',
                    borderRadius: 10,
                    border: '1px solid #E2E8F0',
                    background: '#FFFFFF',
                    color: '#334155',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    cursor: 'pointer'
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
