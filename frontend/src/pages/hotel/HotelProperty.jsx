import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function HotelProperty() {
  const { user } = useAuth();
  const { hotels } = useApp();
  const { addToast } = useToast();
  
  const hotelId = (user?.hotelId || user?.id) ? (user.hotelId || user.id).toString() : '1';
  const hotel = hotels.find(h => h.id === hotelId);

  if (!hotel) return (
    <div style={{ textAlign: 'center', padding: '100px 0' }}>
      <h3 style={{ fontFamily: 'var(--font-sans)' }}>No property linked</h3>
    </div>
  );

  return (
    <div className="fade-in">
      <div className="flex-between" style={{ marginBottom: 32 }}>
        <h2 style={{ margin: 0, fontFamily: 'var(--font-sans)', fontSize: '1.5rem', fontWeight: 600 }}>Property Settings</h2>
        <button 
          className="btn btn-primary" 
          onClick={() => addToast('Property details saved successfully.', 'success')}
          style={{ padding: '10px 24px' }}
        >
          Save Changes
        </button>
      </div>

      {/* Photos Section - Clean Grid */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-body">
          <div className="flex-between" style={{ marginBottom: 24 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>Property Gallery</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>High-quality images increase booking conversion.</p>
            </div>
            <button className="btn btn-outline btn-sm">Upload Photo</button>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
            {hotel.photos.map((p, i) => (
              <div key={i} style={{ position: 'relative', height: 160, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-light)' }}>
                <img src={p} alt={`Property ${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>✕</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Core Information */}
        <div className="card">
          <div className="card-body">
            <h3 style={{ margin: '0 0 24px', fontSize: '1.1rem', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>Basic Information</h3>
            
            <div className="form-group">
              <label className="form-label">Property Name</label>
              <input className="form-input" defaultValue={hotel.name} />
            </div>
            
            <div className="form-group">
              <label className="form-label">Full Location (City, Country)</label>
              <input className="form-input" defaultValue={hotel.location} />
            </div>
            
            <div className="form-group">
              <label className="form-label">Classification Category</label>
              <select className="form-select" defaultValue={hotel.category}>
                {['Luxury', 'Premium', 'Business', 'Heritage', 'Boutique', 'Budget'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Property Description</label>
              <textarea className="form-textarea" defaultValue={hotel.description} style={{ minHeight: 140 }} />
            </div>
          </div>
        </div>

        {/* Brand Portfolio & Media */}
        <div className="card">
          <div className="card-body">
            <h3 style={{ margin: '0 0 24px', fontSize: '1.1rem', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>Brand Portfolio</h3>
            
            <div className="form-group">
              <label className="form-label">Brand Story / Our Philosophy</label>
              <textarea className="form-textarea" placeholder="Tell the story of your property and what makes it unique..." style={{ minHeight: 100 }} />
            </div>
            
            <div className="form-group">
              <label className="form-label">Virtual Tour Link (360° Video)</label>
              <input className="form-input" placeholder="e.g., https://youtube.com/watch?v=..." />
            </div>

            <div className="form-group">
              <label className="form-label">Awards & Recognitions</label>
              <input className="form-input" placeholder="e.g., TripAdvisor Excellence 2025, Michelin Star..." />
            </div>

            <div style={{ padding: 16, border: '1px dashed var(--border)', borderRadius: 8, textAlign: 'center', background: 'var(--bg)' }}>
              <span style={{ fontSize: '2rem', display: 'block', marginBottom: 8 }}>📄</span>
              <span style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)' }}>Upload Portfolio Documents</span>
              <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 12 }}>PDF brochures, banquet menus, or spa catalogs.</span>
              <button className="btn btn-outline btn-sm">Select Files</button>
            </div>
          </div>
        </div>

        {/* Configurations */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Amenities */}
          <div className="card">
            <div className="card-body">
              <div className="flex-between" style={{ marginBottom: 24 }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>Amenities</h3>
                <button className="btn btn-outline btn-sm">+ Add</button>
              </div>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {hotel.amenities.map(a => (
                  <div key={a} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 4, fontSize: '0.85rem', fontWeight: 500 }}>
                    {a}
                    <span style={{ cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.7rem' }}>✕</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Detailed Room Types */}
          <div className="card" style={{ flex: 1 }}>
            <div className="card-body">
              <div className="flex-between" style={{ marginBottom: 24 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>Detailed Room Configuration</h3>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Add descriptions and photos for each room type.</p>
                </div>
                <button className="btn btn-outline btn-sm">+ Add Room Category</button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {hotel.roomTypes.map((rt, i) => (
                  <div key={i} style={{ background: 'var(--bg)', padding: 24, borderRadius: 8, border: '1px solid var(--border-light)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 4 }}>Room Category Name</label>
                        <input className="form-input" defaultValue={rt.type} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 4 }}>Quantity</label>
                        <input className="form-input" type="number" defaultValue={rt.quantity || 5} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 4 }}>Price / Night (₹)</label>
                        <input className="form-input" type="number" defaultValue={rt.price} />
                      </div>
                    </div>
                    
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 4 }}>Room Description & Features</label>
                      <textarea className="form-textarea" placeholder="Describe the room, view, and specific amenities..." defaultValue={rt.description || ''} style={{ minHeight: 80 }} />
                    </div>

                    <div>
                      <div className="flex-between" style={{ marginBottom: 8 }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Room Photos</label>
                        <button className="btn btn-sm" style={{ padding: '2px 8px', fontSize: '0.7rem' }}>+ Add Photo</button>
                      </div>
                      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8 }}>
                        {rt.photos ? rt.photos.map((p, idx) => (
                           <div key={idx} style={{ minWidth: 100, height: 70, borderRadius: 4, backgroundImage: `url(${p})`, backgroundSize: 'cover' }} />
                        )) : (
                          <div style={{ width: 100, height: 70, borderRadius: 4, background: 'var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: 'var(--text-muted)' }}>No photos</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
