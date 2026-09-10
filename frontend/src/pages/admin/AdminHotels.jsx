import { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';

export default function AdminHotels() {
  const { addToast } = useToast();
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchAllHotels();
  }, []);

  const fetchAllHotels = async () => {
    try {
      const data = await api.getAllHotels();
      setHotels(data);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.approveHotel(id);
      addToast('Hotel approved successfully!', 'success');
      setHotels(prev => prev.map(h => h.id === id ? { ...h, status: 'APPROVED' } : h));
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleSuspend = async (id) => {
    try {
      await api.suspendHotel(id);
      addToast('Hotel has been suspended.', 'info');
      setHotels(prev => prev.map(h => h.id === id ? { ...h, status: 'SUSPENDED' } : h));
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  if (loading) return <div className="fade-in">Loading hotels...</div>;

  // Filter hotels based on search query
  const filteredHotels = hotels.filter(h => {
    const q = searchQuery.toLowerCase();
    return (
      (h.name || '').toLowerCase().includes(q) ||
      (h.location || '').toLowerCase().includes(q) ||
      (h.email || '').toLowerCase().includes(q)
    );
  });

  // Group hotels by location
  const locationGroups = filteredHotels.reduce((acc, h) => {
    const loc = h.location || 'Other';
    if (!acc[loc]) acc[loc] = [];
    acc[loc].push(h);
    return acc;
  }, {});

  const cityList = Object.keys(locationGroups);

  const displayedGroups = selectedCity === 'All'
    ? locationGroups
    : { [selectedCity]: locationGroups[selectedCity] || [] };

  const cityThemes = {
    'Hyderabad': { bg: '#eff6ff', border: '#93c5fd', badge: '#1d4ed8', tagBg: '#dbeafe', tagText: '#1e40af' },
    'Vizag': { bg: '#fffbe6', border: '#ffe58f', badge: '#d48806', tagBg: '#fff1b8', tagText: '#873800' },
    'Chennai': { bg: '#fff0f6', border: '#ffadd2', badge: '#c41d7f', tagBg: '#ffd6e7', tagText: '#9e1068' },
    'Goa': { bg: '#f6ffed', border: '#b7eb8f', badge: '#389e0d', tagBg: '#d9f7be', tagText: '#135200' },
    'Bangalore': { bg: '#f9f0ff', border: '#d3ade6', badge: '#722ed1', tagBg: '#efdbff', tagText: '#531dab' }
  };

  return (
    <div className="fade-in" style={{ paddingBottom: 60 }}>
      {/* Header Bar */}
      <div className="flex-between mb-4" style={{ marginBottom: 24 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', margin: 0, color: 'var(--primary)' }}>
            Manage Properties by Location
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0', fontSize: '0.95rem' }}>
            Filter by city tabs or search any property instantly
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span className="badge badge-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
            {filteredHotels.length} Properties
          </span>
          <span className="badge badge-neutral" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
            {cityList.length} Cities
          </span>
        </div>
      </div>

      {/* Control Panel: Sticky City Tabs & Real-time Search */}
      <div style={{ 
        position: 'sticky', 
        top: 0, 
        zIndex: 100, 
        background: 'white', 
        padding: '16px 20px', 
        borderRadius: 16, 
        border: '1px solid var(--border)', 
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
        marginBottom: 32,
        display: 'flex',
        alignItems: 'center',
        justify: 'space-between',
        flexWrap: 'wrap',
        gap: 16
      }}>
        {/* City Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          <button
            className={`btn btn-sm ${selectedCity === 'All' ? 'btn-primary' : 'btn-outline'}`}
            style={{ borderRadius: 20, padding: '8px 18px', fontWeight: 700, fontSize: '0.85rem' }}
            onClick={() => setSelectedCity('All')}
          >
            🏢 All Cities ({filteredHotels.length})
          </button>
          
          {cityList.map(city => {
            const count = locationGroups[city].length;
            const isSelected = selectedCity === city;
            return (
              <button
                key={city}
                className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-outline'}`}
                style={{ 
                  borderRadius: 20, 
                  padding: '8px 18px', 
                  fontWeight: 700, 
                  fontSize: '0.85rem',
                  whiteSpace: 'nowrap'
                }}
                onClick={() => setSelectedCity(city)}
              >
                📍 {city} ({count})
              </button>
            );
          })}
        </div>

        {/* Live Search Input */}
        <div style={{ position: 'relative', width: 260 }}>
          <input
            type="text"
            className="form-input"
            placeholder="🔍 Search hotel or city..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ 
              borderRadius: 20, 
              paddingLeft: 36, 
              paddingRight: 16, 
              fontSize: '0.85rem',
              background: '#f8fafc',
              border: '1px solid var(--border)'
            }}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Render Location City Groups */}
      {Object.keys(displayedGroups).length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', border: '1px dashed var(--border)', background: 'white', borderRadius: 16 }}>
          <h3 style={{ color: 'var(--text-secondary)' }}>No hotels found</h3>
          <p style={{ color: 'var(--text-muted)' }}>Try adjusting your city selection or search keywords.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {Object.entries(displayedGroups).map(([location, cityHotels]) => {
            if (!cityHotels || cityHotels.length === 0) return null;
            const theme = cityThemes[location] || { bg: '#f8fafc', border: '#cbd5e1', badge: '#475569', tagBg: '#e2e8f0', tagText: '#334155' };

            return (
              <div 
                key={location}
                className="card"
                style={{ 
                  border: `2px solid ${theme.border}`,
                  borderRadius: 16,
                  overflow: 'hidden',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'all 0.3s ease'
                }}
              >
                {/* Header Banner */}
                <div style={{ 
                  background: theme.bg, 
                  padding: '16px 24px', 
                  borderBottom: `2px solid ${theme.border}`,
                  display: 'flex', 
                  justify: 'space-between', 
                  alignItems: 'center' 
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ background: theme.badge, color: 'white', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 800 }}>
                      📍
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--primary)', fontWeight: 800 }}>
                        {location}
                      </h3>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        {cityHotels.length} {cityHotels.length === 1 ? 'Hotel Property' : 'Hotel Properties'} Available
                      </span>
                    </div>
                  </div>

                  <span style={{ 
                    background: theme.tagBg, 
                    color: theme.tagText, 
                    fontWeight: 800, 
                    padding: '6px 16px', 
                    borderRadius: 20, 
                    fontSize: '0.82rem',
                    border: `1px solid ${theme.border}`
                  }}>
                    {cityHotels.length} Active {cityHotels.length === 1 ? 'Hotel' : 'Hotels'}
                  </span>
                </div>

                {/* Hotel Cards Grid Inside Location Cluster */}
                <div style={{ padding: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20, background: '#fafafa' }}>
                  {cityHotels.map(h => (
                    <div 
                      key={h.id} 
                      style={{ 
                        background: 'white', 
                        borderRadius: 12, 
                        border: '1px solid var(--border-light)', 
                        padding: 16, 
                        display: 'flex', 
                        flexDirection: 'column', 
                        justify: 'space-between',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', gap: 14, marginBottom: 12, alignItems: 'flex-start' }}>
                          {h.photos && h.photos.length > 0 ? (
                            <div style={{ width: 60, height: 60, borderRadius: 10, backgroundImage: `url(${h.photos[0]})`, backgroundSize: 'cover', backgroundPosition: 'center', border: '1px solid var(--border-light)', flexShrink: 0 }} />
                          ) : (
                            <div style={{ width: 60, height: 60, borderRadius: 10, background: '#e2e8f0', flexShrink: 0 }} />
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <strong style={{ fontSize: '1rem', color: 'var(--text)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={h.name}>
                              {h.name}
                            </strong>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                              ✉️ {h.email}
                            </div>
                            <div style={{ marginTop: 6 }}>
                              <span className={`badge ${h.status === 'APPROVED' ? 'badge-success' : h.status === 'SUSPENDED' ? 'badge-danger' : 'badge-warning'}`} style={{ fontSize: '0.7rem' }}>
                                {h.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 8, paddingTop: 12, borderTop: '1px solid var(--border-light)', marginTop: 12 }}>
                        {h.status !== 'APPROVED' && (
                          <button className="btn btn-outline btn-sm" style={{ flex: 1 }} onClick={() => handleApprove(h.id)}>
                            ✓ Approve
                          </button>
                        )}
                        {h.status !== 'SUSPENDED' && (
                          <button className="btn btn-sm" style={{ flex: 1, background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca' }} onClick={() => handleSuspend(h.id)}>
                            🚫 Suspend
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
