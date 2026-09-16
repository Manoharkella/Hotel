import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Building2,
  MapPin,
  Search,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Star,
  ExternalLink,
  Layers,
  Sparkles
} from 'lucide-react';

// Custom Map Pins for Admin View
const createAdminClusterPin = (city, count, isSelected = false) => {
  return L.divIcon({
    className: 'custom-admin-map-pin',
    html: `
      <div style="
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      ">
        <div style="
          width: ${isSelected ? '36px' : '30px'};
          height: ${isSelected ? '36px' : '30px'};
          border-radius: 50%;
          background: #2563EB;
          border: 3px solid #FFFFFF;
          box-shadow: 0 0 14px rgba(37, 99, 235, 0.6), 0 3px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 800;
          font-size: 13px;
          font-family: var(--font-sans);
        ">
          ${count}
        </div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  });
};

function MapController({ selectedHotel, hotels }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    try {
      setTimeout(() => map.invalidateSize(), 250);
      if (selectedHotel && typeof selectedHotel.latitude === 'number' && typeof selectedHotel.longitude === 'number') {
        map.flyTo([selectedHotel.latitude, selectedHotel.longitude], 12, { animate: true, duration: 1 });
      } else if (hotels && hotels.length > 0) {
        const points = hotels
          .filter(h => typeof h.latitude === 'number' && typeof h.longitude === 'number')
          .map(h => [h.latitude, h.longitude]);
        if (points.length > 0) {
          const bounds = L.latLngBounds(points);
          if (bounds.isValid()) {
            map.flyToBounds(bounds, { animate: true, duration: 1.2, padding: [40, 40] });
          }
        }
      }
    } catch (e) {}
  }, [selectedHotel, hotels, map]);

  return null;
}

export default function AdminHotelMap() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [hotelsList, setHotelsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locationFilter, setLocationFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [mapLayerType, setMapLayerType] = useState('Map'); // 'Map' | 'Satellite' | 'Hybrid'
  const [sortBy, setSortBy] = useState('Name');

  useEffect(() => {
    api.getAllHotels().then(data => {
      const cityCoords = {
        'Mumbai': { lat: 19.0760, lng: 72.8777 },
        'Hyderabad': { lat: 17.3850, lng: 78.4867 },
        'Bangalore': { lat: 12.9716, lng: 77.5946 },
        'Bengaluru': { lat: 12.9716, lng: 77.5946 },
        'Chennai': { lat: 13.0827, lng: 80.2707 },
        'Goa': { lat: 15.2993, lng: 74.1240 },
        'Delhi': { lat: 28.6139, lng: 77.2090 },
        'Vizag': { lat: 17.6868, lng: 83.2185 },
        'Jaipur': { lat: 26.9124, lng: 75.7873 }
      };

      const mapped = (data || []).map((h, i) => {
        const roomPrices = (h.rooms && h.rooms.length > 0) ? h.rooms.map(r => r.price_per_night) : [3500];
        const cityKey = h.location || h.city || 'Hyderabad';
        const coords = cityCoords[cityKey] || { lat: 20.5937 + (i * 0.2), lng: 78.9629 + (i * 0.2) };

        return {
          ...h,
          id: h.id.toString(),
          latitude: h.latitude || coords.lat,
          longitude: h.longitude || coords.lng,
          minPrice: Math.min(...roomPrices),
          starScore: '4.8',
          property_type: h.property_type || 'Business Hotel'
        };
      });
      setHotelsList(mapped);
      if (mapped.length > 0) setSelectedHotel(mapped[0]);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const locationsList = useMemo(() => {
    const set = new Set();
    hotelsList.forEach(h => {
      if (h.city) set.add(h.city.trim());
      if (h.state) set.add(h.state.trim());
      if (h.location) set.add(h.location.trim());
    });
    return ['All', ...Array.from(set).sort()];
  }, [hotelsList]);

  // Filtered & Sorted hotels
  const filteredHotels = useMemo(() => {
    return hotelsList.filter(h => {
      const loc = (h.location || h.city || '').toLowerCase();
      const matchLoc = locationFilter === 'All' || loc.includes(locationFilter.toLowerCase());
      const matchStatus = statusFilter === 'All' || (h.status || 'APPROVED').toUpperCase() === statusFilter.toUpperCase();
      const matchCategory = categoryFilter === 'All' || (h.property_type || '').toLowerCase().includes(categoryFilter.toLowerCase());
      const matchSearch = !searchQuery || (h.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || loc.includes(searchQuery.toLowerCase());
      return matchLoc && matchStatus && matchCategory && matchSearch;
    }).sort((a, b) => {
      if (sortBy === 'Name') return (a.name || '').localeCompare(b.name || '');
      if (sortBy === 'Price') return (a.minPrice || 0) - (b.minPrice || 0);
      return (b.id || 0) - (a.id || 0);
    });
  }, [hotelsList, locationFilter, statusFilter, categoryFilter, searchQuery, sortBy]);

  // Aggregate markers by city
  const cityClusters = useMemo(() => {
    const map = {};
    filteredHotels.forEach(h => {
      const city = h.location || h.city || 'Other';
      if (!map[city]) {
        map[city] = {
          city,
          lat: h.latitude,
          lng: h.longitude,
          count: 0,
          hotels: []
        };
      }
      map[city].count += 1;
      map[city].hotels.push(h);
    });
    return Object.values(map);
  }, [filteredHotels]);

  const tileLayerUrl = mapLayerType === 'Satellite'
    ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  return (
    <div className="fade-in" style={{ paddingBottom: 40, fontFamily: 'var(--font-sans)', height: 'calc(100vh - 110px)', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '1.6rem' }}>🗺️</span>
            <span>Hotel Locations Across India</span>
          </h1>
          <p style={{ color: '#64748B', fontSize: '0.88rem', margin: '4px 0 0' }}>
            Explore and manage your hotel properties on an interactive map.
          </p>
        </div>

        <button
          onClick={() => navigate('/admin/hotels')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '9px 18px',
            borderRadius: 10,
            background: '#2563EB',
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: '0.86rem',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
            transition: 'all 0.15s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#1D4ED8'}
          onMouseLeave={e => e.currentTarget.style.background = '#2563EB'}
        >
          <Plus size={16} />
          <span>Add New Hotel</span>
        </button>
      </div>

      {/* Filter Toolbar Bar */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: 14,
        padding: '12px 18px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
        marginBottom: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap'
      }}>
        {/* Locations Dropdown */}
        <select
          value={locationFilter}
          onChange={e => setLocationFilter(e.target.value)}
          style={{
            padding: '8px 14px',
            borderRadius: 8,
            border: '1px solid #CBD5E1',
            background: '#F8FAFC',
            fontSize: '0.82rem',
            fontWeight: 600,
            color: '#1E293B',
            cursor: 'pointer',
            outline: 'none'
          }}
        >
          <option value="All">📍 All Locations</option>
          {locationsList.filter(l => l !== 'All').map(loc => (
            <option key={loc} value={loc}>{loc}</option>
          ))}
        </select>

        {/* Status Dropdown */}
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{
            padding: '8px 14px',
            borderRadius: 8,
            border: '1px solid #CBD5E1',
            background: '#F8FAFC',
            fontSize: '0.82rem',
            fontWeight: 600,
            color: '#1E293B',
            cursor: 'pointer',
            outline: 'none'
          }}
        >
          <option value="All">All Status</option>
          <option value="APPROVED">Approved</option>
          <option value="PENDING">Pending</option>
          <option value="SUSPENDED">Suspended</option>
        </select>

        {/* Categories Dropdown */}
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          style={{
            padding: '8px 14px',
            borderRadius: 8,
            border: '1px solid #CBD5E1',
            background: '#F8FAFC',
            fontSize: '0.82rem',
            fontWeight: 600,
            color: '#1E293B',
            cursor: 'pointer',
            outline: 'none'
          }}
        >
          <option value="All">🗂 All Categories</option>
          <option value="Business">Business Hotel</option>
          <option value="Resort">Resort</option>
          <option value="Boutique">Boutique Hotel</option>
          <option value="Villa">Villa</option>
        </select>

        {/* Search Input */}
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input
            type="text"
            placeholder="Search hotel, city..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 34px',
              borderRadius: 8,
              border: '1px solid #CBD5E1',
              background: '#F8FAFC',
              fontSize: '0.82rem',
              color: '#1E293B',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>
      </div>

      {/* Main 2-Pane Split (Left: Hotel Cards, Right: Leaflet Map) */}
      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 16, flex: 1, minHeight: 0 }}>
        {/* Left Pane: Property List */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 14,
          border: '1px solid #E2E8F0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* List Header */}
          <div style={{
            padding: '14px 18px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#F8FAFC'
          }}>
            <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0F172A' }}>
              Properties ({filteredHotels.length})
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: '#64748B' }}>
              <span>Sort by:</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                style={{
                  padding: '3px 8px',
                  borderRadius: 6,
                  border: '1px solid #CBD5E1',
                  background: 'white',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="Name">Name</option>
                <option value="Price">Price</option>
              </select>
            </div>
          </div>

          {/* Scrollable Property Cards */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filteredHotels.map(h => {
              const isSelected = selectedHotel?.id === h.id;
              const status = (h.status || 'APPROVED').toUpperCase();
              const isApproved = status === 'APPROVED';

              return (
                <div
                  key={h.id}
                  onClick={() => setSelectedHotel(h)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 12,
                    border: `1.5px solid ${isSelected ? '#2563EB' : '#E2E8F0'}`,
                    background: isSelected ? '#EFF6FF' : '#FFFFFF',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    boxShadow: isSelected ? '0 4px 12px rgba(37, 99, 235, 0.1)' : '0 1px 3px rgba(0,0,0,0.02)'
                  }}
                >
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    {/* Thumbnail */}
                    <div style={{
                      width: 50,
                      height: 50,
                      borderRadius: 10,
                      backgroundImage: `url(${h.photos?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200&q=80'})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      border: '1px solid #E2E8F0',
                      flexShrink: 0
                    }} />

                    {/* Details */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                        <strong style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {h.name}
                        </strong>
                        <span style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: 6,
                          background: isApproved ? '#ECFDF5' : '#FEF3C7',
                          color: isApproved ? '#059669' : '#D97706',
                          whiteSpace: 'nowrap'
                        }}>
                          {status}
                        </span>
                      </div>

                      {/* Stars & Rating */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        <span style={{ fontSize: '0.74rem', color: '#F59E0B' }}>★★★★☆</span>
                        <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569' }}>{h.starScore || '4.8'}</span>
                      </div>

                      {/* Location & Nightly Price */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, fontSize: '0.76rem' }}>
                        <span style={{ color: '#64748B' }}>📍 {h.location || h.city}</span>
                        <span style={{ fontWeight: 800, color: '#0F172A' }}>₹{(h.minPrice || 3500).toLocaleString('en-IN')}<span style={{ fontSize: '0.68rem', fontWeight: 500, color: '#64748B' }}>/night</span></span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Pane: Leaflet Interactive Map */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 14,
          border: '1px solid #E2E8F0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
          overflow: 'hidden',
          position: 'relative'
        }}>
          {/* Top-Right Map Layer Switcher */}
          <div style={{
            position: 'absolute',
            top: 14,
            right: 14,
            zIndex: 1000,
            background: '#FFFFFF',
            borderRadius: 10,
            padding: '6px 10px',
            border: '1px solid #CBD5E1',
            boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontSize: '0.78rem',
            fontWeight: 700,
            color: '#1E293B'
          }}>
            {['Map', 'Satellite', 'Hybrid'].map(mode => (
              <label key={mode} style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="mapLayer"
                  checked={mapLayerType === mode}
                  onChange={() => setMapLayerType(mode)}
                  style={{ cursor: 'pointer' }}
                />
                <span>{mode}</span>
              </label>
            ))}
          </div>

          {/* Leaflet Map Container */}
          <MapContainer
            center={[20.5937, 78.9629]}
            zoom={5}
            style={{ width: '100%', height: '100%' }}
            scrollWheelZoom={true}
          >
            <TileLayer url={tileLayerUrl} />
            <MapController selectedHotel={selectedHotel} hotels={filteredHotels} />

            {/* City Clusters Markers */}
            {cityClusters.map(cluster => (
              <Marker
                key={cluster.city}
                position={[cluster.lat, cluster.lng]}
                icon={createAdminClusterPin(cluster.city, cluster.count, selectedHotel?.location === cluster.city)}
                eventHandlers={{
                  click: () => {
                    if (cluster.hotels.length > 0) setSelectedHotel(cluster.hotels[0]);
                  }
                }}
              >
                <Popup>
                  <div style={{ minWidth: 200, padding: 4 }}>
                    <h4 style={{ margin: '0 0 6px', fontSize: '0.96rem', color: '#0F172A', fontWeight: 800 }}>
                      📍 {cluster.city} ({cluster.count} {cluster.count === 1 ? 'Hotel' : 'Hotels'})
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 160, overflowY: 'auto' }}>
                      {cluster.hotels.map(h => (
                        <div key={h.id} style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: 4 }}>
                          <strong style={{ fontSize: '0.82rem', color: '#2563EB', display: 'block' }}>{h.name}</strong>
                          <span style={{ fontSize: '0.72rem', color: '#64748B' }}>₹{(h.minPrice || 3500).toLocaleString('en-IN')}/night · ⭐ {h.starScore || '4.8'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {/* Bottom-Right Legend Box */}
          <div style={{
            position: 'absolute',
            bottom: 16,
            right: 16,
            zIndex: 1000,
            background: '#FFFFFF',
            borderRadius: 10,
            padding: '10px 14px',
            border: '1px solid #CBD5E1',
            boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            fontSize: '0.76rem',
            fontWeight: 700,
            color: '#334155'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }} />
              <span>Approved</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B' }} />
              <span>Pending</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444' }} />
              <span>Rejected</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#2563EB' }} />
              <span>Multiple Hotels</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
