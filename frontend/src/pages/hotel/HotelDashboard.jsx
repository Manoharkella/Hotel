import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

export default function HotelDashboard() {
  const { user } = useAuth();
  const { leads, bookings, hotels, getWalletBalance } = useApp();
  const navigate = useNavigate();

  const hotelId = (user?.hotelId || user?.id) ? (user.hotelId || user.id).toString() : '1';
  console.log("DASHBOARD RENDER - user:", user);
  console.log("DASHBOARD RENDER - hotelId:", hotelId);
  console.log("DASHBOARD RENDER - hotels.length:", hotels.length);
  const hotelData = hotels.find(h => h.id === hotelId);
  console.log("DASHBOARD RENDER - hotelData:", hotelData);
  const credits = getWalletBalance(hotelId);

  const relevantLeads = leads.filter(l => l.matchedHotelIds?.includes(hotelId));
  const newLeads = relevantLeads.filter(l => l.status === 'active').length;
  
  const relevantBookings = bookings.filter(b => b.hotelId === hotelId);
  const todayArrivals = relevantBookings.filter(b => b.status === 'confirmed').length;

  return (
    <div className="fade-in">
      {credits < 20 && (
        <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger)', borderLeft: '4px solid var(--danger)', padding: '16px 24px', marginBottom: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h4 style={{ color: 'var(--danger)', margin: '0 0 4px', fontSize: '1rem', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>Low Credit Balance</h4>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#B91C1C' }}>You have {credits} credits remaining. Top up to ensure you don't miss out on premium leads.</p>
          </div>
          <button className="btn btn-sm" style={{ background: 'var(--danger)', color: 'white' }} onClick={() => navigate('/hotel/wallet')}>
            Top Up Now
          </button>
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card slide-up delay-1">
          <div className="stat-icon" style={{ color: 'var(--info)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
          </div>
          <div className="stat-value">{newLeads}</div>
          <div className="stat-label">New Leads Available</div>
          <div className="stat-change up">+{newLeads} this week</div>
        </div>
        
        <div className="stat-card slide-up delay-2">
          <div className="stat-icon" style={{ color: 'var(--accent)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
          </div>
          <div className="stat-value">{credits}</div>
          <div className="stat-label">Credits Balance</div>
          <div className="stat-change up">Good standing</div>
        </div>
        
        <div className="stat-card slide-up delay-3">
          <div className="stat-icon" style={{ color: 'var(--warning)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          </div>
          <div className="stat-value">{todayArrivals}</div>
          <div className="stat-label">Today's Arrivals</div>
          <div className="stat-change down">Action required</div>
        </div>
      </div>

      {/* Analytics Card */}
      <div className="card slide-up delay-2" style={{ marginBottom: 32 }}>
        <div className="card-body">
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontFamily: 'var(--font-sans)', fontWeight: 600, marginBottom: 8 }}>Market Demand Forecast</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 24 }}>Traveler search volume for {hotelData?.location || 'your region'} over the next 7 days</p>
          
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, height: 180, paddingBottom: 24, borderBottom: '1px solid var(--border-light)' }}>
            {[
              { day: 'Mon', searches: 42 },
              { day: 'Tue', searches: 38 },
              { day: 'Wed', searches: 56 },
              { day: 'Thu', searches: 72 },
              { day: 'Fri', searches: 110, highlight: true },
              { day: 'Sat', searches: 85 },
              { day: 'Sun', searches: 64 },
            ].map(d => (
              <div key={d.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <div style={{ 
                  width: '100%', maxWidth: 48, height: `${(d.searches / 120) * 130}px`, 
                  background: d.highlight ? 'var(--accent)' : 'var(--primary-light)', 
                  borderRadius: '6px 6px 0 0', opacity: d.highlight ? 1 : 0.6,
                  transition: 'var(--transition)' 
                }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{d.day}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16 }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <span style={{ color: 'var(--accent)', fontWeight: 700, marginRight: 8 }}>✦ AI INSIGHT</span>
              Recommendation: <strong>Increase quote prices by 15% for Friday arrivals</strong> due to high predicted search volume.
            </div>
            <button className="btn btn-outline btn-sm">Generate Full Report</button>
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Recent Leads */}
        <div className="card slide-up delay-3">
          <div className="card-body">
            <div className="flex-between" style={{ marginBottom: 24 }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>Recent Market Leads</h3>
              <button className="btn btn-outline btn-sm" onClick={() => navigate('/hotel/leads')}>View All</button>
            </div>
            
            {relevantLeads.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No recent market leads.</p>
            ) : (
              relevantLeads.slice(0, 4).map(l => (
                <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid var(--border-light)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 4 }}>
                      <span style={{ color: 'var(--accent)', marginRight: 6 }}>•</span>{l.destination}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {l.guests} Guests • ₹{l.budget.toLocaleString()} / Night
                    </div>
                  </div>
                  <span className="badge badge-locked" style={{ fontSize: '0.7rem' }}>Locked</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="card slide-up delay-3">
          <div className="card-body">
            <div className="flex-between" style={{ marginBottom: 24 }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>Upcoming Arrivals</h3>
              <button className="btn btn-outline btn-sm" onClick={() => navigate('/hotel/bookings')}>View All</button>
            </div>
            
            {relevantBookings.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No upcoming arrivals.</p>
            ) : (
              relevantBookings.slice(0, 4).map(b => (
                <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid var(--border-light)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 4 }}>{b.customerName}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {b.roomType} • {new Date(b.checkIn).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                  <span className={`badge ${b.status === 'confirmed' ? 'badge-success' : b.status === 'checked-in' ? 'badge-primary' : 'badge-neutral'}`} style={{ fontSize: '0.7rem' }}>
                    {b.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
