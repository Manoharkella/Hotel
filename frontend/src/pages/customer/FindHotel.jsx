import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet's default icon path issues with React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom Icon for unselected markers
const defaultIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Custom Icon for selected markers
const selectedIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Helper component to center map on selected hotel
function MapUpdater({ selectedHotel, hotels }) {
  const map = useMap();
  
  if (selectedHotel && selectedHotel.latitude && selectedHotel.longitude) {
    map.flyTo([selectedHotel.latitude, selectedHotel.longitude], 14, { animate: true, duration: 1.5 });
  } else if (hotels.length > 0) {
    // If no hotel is selected, fit bounds to show all hotels
    const bounds = L.latLngBounds(hotels.filter(h => h.latitude && h.longitude).map(h => [h.latitude, h.longitude]));
    if (bounds.isValid()) {
      map.flyToBounds(bounds, { animate: true, duration: 1.5, padding: [50, 50] });
    }
  }
  return null;
}

export default function FindHotel() {
  const { submitRequirement, hotels } = useApp();
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [matchedHotels, setMatchedHotels] = useState([]);
  const [selectedMapHotel, setSelectedMapHotel] = useState(null);
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({ 
    destination: searchParams.get('destination') || '', 
    checkIn: '', 
    checkOut: '', 
    guests: 2, 
    budget: 8000, 
    roomType: searchParams.get('room') || 'Deluxe', 
    purpose: 'Leisure',
    preferences: '' 
  });

  const handleSubmitSearch = (e) => {
    e.preventDefault();
    if (!form.destination || !form.checkIn || !form.checkOut) {
      addToast('Please fill destination and dates', 'error');
      return;
    }
    const matched = hotels.filter(h => h.location.toLowerCase().includes(form.destination.toLowerCase()));
    setMatchedHotels(matched);
    setSubmitted(true);
    addToast(`Found ${matched.length} hotels in ${form.destination}. Please select one from the map.`, 'info');
  };

  const handleSendRequestToSelected = async () => {
    if (!selectedMapHotel) return;
    
    const lead = await submitRequirement({
      customerId: user.id, customerName: user.name, customerEmail: user.email,
      customerPhone: user.phone || '', ...form,
      specific_hotel_id: selectedMapHotel.id
    });
    
    if (lead) {
      addToast(`Request successfully sent to ${selectedMapHotel.name}!`, 'success');
      navigate('/customer/trips?tab=requests');
    }
  };

  if (submitted) {
    let displayedHotels = [...matchedHotels];

    return (
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 24 }} className="fade-in">
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>🗺️</div>
          <h2>Select a Hotel</h2>
          <p style={{ color: '#64748b' }}>We found {matchedHotels.length} hotels in {form.destination}. Click a marker to view details and submit your request.</p>
        </div>

        <div style={{ display: 'flex', gap: 24, height: 600 }}>
          {/* Map Area */}
          <div style={{ flex: 2, background: '#e2e8f0', borderRadius: 12, position: 'relative', overflow: 'hidden', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', zIndex: 1 }}>
            <MapContainer 
              center={[20.5937, 78.9629]} // Center of India
              zoom={5} 
              style={{ height: '100%', width: '100%' }}
              zoomControl={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapUpdater selectedHotel={selectedMapHotel} hotels={displayedHotels} />
              
              {displayedHotels.map(hotel => {
                if (!hotel.latitude || !hotel.longitude) return null;
                const isSelected = selectedMapHotel?.id === hotel.id;
                
                return (
                  <Marker 
                    key={hotel.id}
                    position={[hotel.latitude, hotel.longitude]}
                    icon={isSelected ? selectedIcon : defaultIcon}
                    eventHandlers={{
                      click: () => setSelectedMapHotel(hotel)
                    }}
                  >
                    <Popup>
                      <div style={{ textAlign: 'center', fontWeight: 'bold' }}>
                        {hotel.name}<br/>
                        <span style={{ color: 'var(--primary)' }}>₹{hotel.roomTypes[0]?.price.toLocaleString()}</span>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>

          {/* Side Panel */}
          <div style={{ flex: 1, background: 'white', borderRadius: 12, border: '1px solid var(--border-light)', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-md)' }}>
            {selectedMapHotel ? (
              <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ height: 220, backgroundImage: `url(${selectedMapHotel.photos[0]})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
                  <button onClick={() => setSelectedMapHotel(null)} style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(0,0,0,0.9)'} onMouseOut={e => e.currentTarget.style.background = 'rgba(0,0,0,0.6)'}>✕</button>
                  <div style={{ position: 'absolute', bottom: 12, left: 12, background: 'rgba(255,255,255,0.95)', padding: '4px 10px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)', backdropFilter: 'blur(4px)' }}>
                    ⭐ {selectedMapHotel.rating} ({selectedMapHotel.reviewCount} Reviews)
                  </div>
                </div>
                <div style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ margin: '0 0 8px', fontSize: '1.4rem', fontFamily: 'var(--font-serif)', color: 'var(--text)' }}>{selectedMapHotel.name}</h3>
                  
                  <p style={{ color: 'var(--text-secondary)', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.9rem' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                    {selectedMapHotel.location}
                  </p>
                  
                  <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 20 }}>
                    {selectedMapHotel.description}
                  </p>
                  
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 'auto' }}>
                    {selectedMapHotel.amenities.slice(0, 4).map(a => (
                      <span key={a} style={{ fontSize: '0.75rem', background: 'var(--bg)', padding: '4px 10px', borderRadius: 20, color: 'var(--text-secondary)', fontWeight: 600 }}>{a}</span>
                    ))}
                  </div>
                  
                  <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border-light)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Starting from</div>
                      <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)', lineHeight: 1 }}>₹{selectedMapHotel.roomTypes[0]?.price.toLocaleString()}</div>
                    </div>
                    <button className="btn btn-accent btn-block" style={{ height: 48, fontSize: '1rem' }} onClick={handleSendRequestToSelected}>
                      Submit Request to this Hotel
                    </button>
                    <button className="btn btn-outline btn-block mt-2" onClick={() => navigate(`/customer/hotel/${selectedMapHotel.id}`)}>
                      View Full Details
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                </div>
                <h3 style={{ margin: '0 0 12px', color: 'var(--text)', fontSize: '1.2rem' }}>Interactive Map</h3>
                <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.5 }}>Select any red marker on the map to preview the hotel details and submit your request.</p>
              </div>
            )}
          </div>
        </div>
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <button className="btn btn-outline" onClick={() => { setSubmitted(false); setForm({ destination: '', checkIn: '', checkOut: '', guests: 2, budget: 8000, roomType: 'Deluxe', preferences: '' }); }}>Submit Another Requirement</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: 24 }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 style={{ marginBottom: 8 }}>Find My Hotel</h1>
        <p style={{ color: '#64748b' }}>Tell us exactly what you're looking for. We'll match you with hotels that fit.</p>
      </div>
      <div className="card">
        <div className="card-body" style={{ padding: 32 }}>
          <form onSubmit={handleSubmitSearch}>
            <div className="form-group">
              <label className="form-label">📍 Destination</label>
              <input className="form-input" placeholder="e.g., Goa, Manali, Jaipur..." value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value })} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">📅 Check-In</label>
                <input className="form-input" type="date" value={form.checkIn} onChange={e => setForm({ ...form, checkIn: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">📅 Check-Out</label>
                <input className="form-input" type="date" value={form.checkOut} onChange={e => setForm({ ...form, checkOut: e.target.value })} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">👥 Guests</label>
                <select className="form-select" value={form.guests} onChange={e => setForm({ ...form, guests: Number(e.target.value) })}>
                  {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} {n === 1 ? 'Guest' : 'Guests'}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">🛏️ Room Type</label>
                <select className="form-select" value={form.roomType} onChange={e => setForm({ ...form, roomType: e.target.value })}>
                  {['Standard', 'Deluxe', 'Suite', 'Villa', 'Executive'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">💰 Budget per night (₹{form.budget.toLocaleString()})</label>
              <input type="range" min="1000" max="50000" step="500" value={form.budget} onChange={e => setForm({ ...form, budget: Number(e.target.value) })}
                style={{ width: '100%', accentColor: '#0f766e' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8' }}>
                <span>₹1,000</span><span>₹50,000</span>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">🥂 Purpose of Visit</label>
              <select className="form-select" value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })}>
                {['Leisure', 'Business', 'Honeymoon', 'Anniversary', 'Family Vacation'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">💬 Special Preferences</label>
              <textarea className="form-textarea" placeholder="e.g., Sea-facing room, pet-friendly, late check-out, honeymoon package..." value={form.preferences} onChange={e => setForm({ ...form, preferences: e.target.value })} />
            </div>
            <button className="btn btn-accent btn-block btn-lg" type="submit">🔍 Find Matching Hotels</button>
          </form>
        </div>
      </div>
    </div>
  );
}
