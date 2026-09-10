import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom Map Pins for Admin View
const createAdminPin = (status) => {
  const isApproved = status === 'APPROVED';
  const color = isApproved ? '#10b981' : '#f59e0b';
  
  return L.divIcon({
    className: 'custom-admin-pin',
    html: `
      <div style="
        background: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 14px;
      ">
        ${isApproved ? '🏨' : '⏳'}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
};

function MapController({ selectedHotel, hotels, adminMobileTab }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    try {
      setTimeout(() => map.invalidateSize(), 250);

      if (selectedHotel && typeof selectedHotel.latitude === 'number' && typeof selectedHotel.longitude === 'number') {
        map.flyTo([selectedHotel.latitude, selectedHotel.longitude], 14, { animate: true, duration: 1.2 });
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
  }, [selectedHotel, hotels, map, adminMobileTab]);

  return null;
}

export default function AdminHotelMap() {
  const { hotels: contextHotels } = useApp();
  const [hotelsList, setHotelsList] = useState([]);
  const [cityFilter, setCityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [adminMobileTab, setAdminMobileTab] = useState('map'); // 'map' | 'list'

  useEffect(() => {
    api.getAllHotels().then(data => {
      const mapped = data.map(h => {
        const roomPrices = (h.rooms && h.rooms.length > 0) ? h.rooms.map(r => r.price_per_night) : [2500];
        return {
          ...h,
          id: h.id.toString(),
          latitude: h.latitude || 20.5937,
          longitude: h.longitude || 78.9629,
          minPrice: Math.min(...roomPrices),
          rating: '4.8'
        };
      });
      setHotelsList(mapped);
    }).catch(console.error);
  }, []);

  const cities = ['All', 'Hyderabad', 'Vizag', 'Chennai', 'Mumbai', 'Bengaluru'];

  const filteredHotels = hotelsList.filter(h => {
    const loc = (h.location || '').toLowerCase();
    const add = (h.address || '').toLowerCase();
    const targetCity = cityFilter.toLowerCase();

    const matchCity = cityFilter === 'All' || loc.includes(targetCity) || add.includes(targetCity);
    const matchStatus = statusFilter === 'All' || (h.status || 'APPROVED') === statusFilter;
    const matchSearch = !searchQuery || h.name?.toLowerCase().includes(searchQuery.toLowerCase()) || loc.includes(searchQuery.toLowerCase());
    return matchCity && matchStatus && matchSearch;
  });

  return (
    <div className="fade-in" style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header & Filter Controls Bar */}
      <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 18px', marginBottom: 12, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', margin: 0, fontFamily: 'var(--font-serif)', color: 'var(--primary)' }}>
            🗺️ Admin Geographic Hotel Monitor
          </h2>
          <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Showing <strong>{filteredHotels.length}</strong> property locations across India
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* City Filter Pills */}
          <div style={{ display: 'flex', background: 'var(--bg)', padding: 3, borderRadius: 8, gap: 3, overflowX: 'auto', maxWidth: '100%' }}>
            {cities.map(city => (
              <button
                key={city}
                className={`btn btn-sm ${cityFilter === city ? 'btn-primary' : 'btn-ghost'}`}
                style={{ padding: '4px 10px', fontSize: '0.75rem', borderRadius: 6, flexShrink: 0 }}
                onClick={() => setCityFilter(city)}
              >
                {city}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <input
            type="text"
            className="form-input"
            placeholder="Search hotel..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ padding: '6px 12px', fontSize: '0.82rem', width: 140 }}
          />
        </div>
      </div>

      {/* Main Map View & Quick List Panel */}
      <div className="admin-hotel-map-grid" style={{ flex: 1, minHeight: 0 }}>
        
        {/* Left Side: Property Cards List */}
        <div className={`admin-hotel-list-pane ${adminMobileTab === 'list' ? 'mobile-active' : 'mobile-hidden'}`}>
          <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', margin: '4px 8px' }}>
            Properties ({filteredHotels.length})
          </h3>

          {filteredHotels.map(h => (
            <div
              key={h.id}
              onClick={() => {
                setSelectedHotel(h);
                setAdminMobileTab('map');
              }}
              style={{
                padding: 10,
                borderRadius: 10,
                border: `1px solid ${selectedHotel?.id === h.id ? 'var(--primary)' : 'var(--border-light)'}`,
                background: selectedHotel?.id === h.id ? 'var(--bg)' : 'white',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6, marginBottom: 4 }}>
                <strong style={{ fontSize: '0.9rem', color: 'var(--primary)', wordBreak: 'break-word', lineHeight: 1.3 }}>{h.name}</strong>
                <span className={`badge ${h.status === 'PENDING' ? 'badge-warning' : 'badge-success'}`} style={{ fontSize: '0.65rem', flexShrink: 0 }}>
                  {h.status || 'APPROVED'}
                </span>
              </div>
              <p style={{ margin: '0 0 4px', fontSize: '0.76rem', color: 'var(--text-secondary)', wordBreak: 'break-word' }}>📍 {h.location}</p>
              <div className="flex-between" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                <span>Starting ₹{(h.minPrice || 2500).toLocaleString()}/night</span>
                <span>⭐ {h.rating || '4.8'}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Right Side: Leaflet Interactive Map */}
        <div className={`admin-hotel-map-pane ${adminMobileTab === 'map' ? 'mobile-active' : 'mobile-hidden'}`}>
          <MapContainer
            center={[20.5937, 78.9629]}
            zoom={5}
            style={{ width: '100%', height: '100%' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            <MapController selectedHotel={selectedHotel} hotels={filteredHotels} adminMobileTab={adminMobileTab} />

            {filteredHotels.map(h => {
              if (typeof h.latitude !== 'number' || typeof h.longitude !== 'number') return null;
              return (
                <Marker
                  key={h.id}
                  position={[h.latitude, h.longitude]}
                  icon={createAdminPin(h.status || 'APPROVED')}
                  eventHandlers={{ click: () => setSelectedHotel(h) }}
                >
                  <Popup>
                    <div style={{ minWidth: 200, maxWidth: 240 }}>
                      <h4 style={{ margin: '0 0 6px', fontSize: '0.95rem', color: 'var(--primary)', wordBreak: 'break-word' }}>{h.name}</h4>
                      <p style={{ margin: '0 0 8px', fontSize: '0.78rem', color: '#64748b', wordBreak: 'break-word' }}>📍 {h.address || h.location}</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6, borderTop: '1px solid #e2e8f0' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--success)' }}>
                          Status: {h.status || 'APPROVED'}
                        </span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>⭐ {h.rating || '4.8'}</span>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>

      </div>

      {/* Admin Floating Mobile Map / List Toggle */}
      <div className="admin-map-mobile-toggle">
        <button 
          type="button" 
          className="btn-map-toggle"
          onClick={() => setAdminMobileTab(adminMobileTab === 'map' ? 'list' : 'map')}
        >
          {adminMobileTab === 'map' ? (
            <>
              <span>📋</span>
              <span>View Properties List ({filteredHotels.length})</span>
            </>
          ) : (
            <>
              <span>🗺️</span>
              <span>View Interactive Map</span>
            </>
          )}
        </button>
      </div>

    </div>
  );
}
