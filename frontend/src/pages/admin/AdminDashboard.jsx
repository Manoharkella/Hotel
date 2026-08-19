import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';

export default function AdminDashboard() {
  const { leads, bookings, hotels, transactions } = useApp();
  const [customerCount, setCustomerCount] = useState(0);

  useEffect(() => {
    api.getAllUsers().then(users => {
      setCustomerCount(users.filter(u => u.role === 'customer').length);
    }).catch(err => console.error("Failed to fetch dashboard users", err));
  }, []);

  const totalCredSold = transactions.filter(t => t.type === 'purchase').reduce((s, t) => s + t.amount, 0);
  const totalRevenue = transactions.filter(t => t.type === 'purchase').length * 999;
  const convRate = leads.length > 0 ? Math.round((bookings.length / leads.length) * 100) : 0;

  const stats = [
    { 
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>, 
      color: 'var(--info)', value: customerCount, label: 'Customers', change: 'Registered', trend: 'up' 
    },
    { 
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><path d="M9 22v-4h6v4"></path><path d="M8 6h.01"></path><path d="M16 6h.01"></path><path d="M12 6h.01"></path><path d="M12 10h.01"></path><path d="M12 14h.01"></path><path d="M16 10h.01"></path><path d="M16 14h.01"></path><path d="M8 10h.01"></path><path d="M8 14h.01"></path></svg>, 
      color: 'var(--primary)', value: hotels.length, label: 'Properties', change: '+1 new', trend: 'up' 
    },
    { 
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>, 
      color: 'var(--warning)', value: leads.length, label: 'Market Leads', change: '+8 this month', trend: 'up' 
    },
    { 
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>, 
      color: 'var(--success)', value: totalCredSold, label: 'Credits Sold', change: `Active volume`, trend: 'up' 
    },
    { 
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>, 
      color: 'var(--accent)', value: bookings.length, label: 'Bookings', change: `${convRate}% conversion`, trend: 'up' 
    },
    { 
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>, 
      color: 'var(--danger)', value: `₹${(totalRevenue/1000).toFixed(1)}k`, label: 'Platform Revenue', change: '+22% growth', trend: 'up' 
    },
  ];

  return (
    <div className="fade-in">
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        {stats.map((s, i) => (
          <div key={i} className="stat-card slide-up" style={{ animationDelay: `${i * 0.05}s`, padding: '32px 24px' }}>
            <div className="stat-icon" style={{ color: s.color, marginBottom: '16px' }}>{s.icon}</div>
            <div className="stat-value" style={{ fontSize: '2rem', fontFamily: 'var(--font-serif)', color: 'var(--text)', marginBottom: 8, lineHeight: 1 }}>{s.value}</div>
            <div className="stat-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', fontWeight: 600 }}>{s.label}</div>
            <div className={`stat-change ${s.trend}`} style={{ fontSize: '0.75rem', marginTop: 16 }}>{s.change}</div>
          </div>
        ))}
      </div>

      {/* Revenue Chart Section */}
      <div className="card slide-up delay-2" style={{ marginBottom: 32 }}>
        <div className="card-body">
          <div className="flex-between" style={{ marginBottom: 24 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>Platform Revenue (Last 6 Months)</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Revenue generated from Hotel Credit Package sales.</p>
            </div>
            <select className="form-select" style={{ width: 140 }}><option>2026</option></select>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'flex-end', height: 200, gap: 16, marginTop: 24, padding: '0 16px' }}>
            {[12, 19, 15, 25, 22, 38].map((val, i) => (
              <div key={i} style={{ flex: 1, background: 'linear-gradient(to top, var(--primary), var(--accent))', height: `${(val/40)*100}%`, borderRadius: '4px 4px 0 0', position: 'relative', transition: 'height 1s ease-out' }}>
                <span style={{ position: 'absolute', top: -24, left: '50%', transform: 'translateX(-50%)', fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)' }}>₹{val}k</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 12, padding: '0 16px', color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map(m => <div key={m} style={{ flex: 1, textAlign: 'center' }}>{m}</div>)}
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Real-time Activity Feed */}
        <div className="card slide-up delay-3">
          <div className="card-body">
            <h3 style={{ margin: '0 0 24px', fontSize: '1.2rem', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>Live Platform Activity</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { type: 'lead', text: 'Traveler John submitted a requirement for Goa.', time: '2 mins ago', icon: '🟢' },
                { type: 'payment', text: 'Ocean View Resort purchased 50 Credits.', time: '14 mins ago', icon: '💳' },
                { type: 'booking', text: 'Sunrise Hotel successfully confirmed a booking.', time: '1 hr ago', icon: '🤝' },
                { type: 'lead', text: 'Traveler Sarah submitted a requirement for Manali.', time: '2 hrs ago', icon: '🟢' },
                { type: 'admin', text: 'Admin approved Grand Hyatt registration.', time: '3 hrs ago', icon: '⚙️' }
              ].map((act, i) => (
                <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'center', paddingBottom: 16, borderBottom: i === 4 ? 'none' : '1px solid var(--border-light)' }}>
                  <div style={{ fontSize: '1.5rem', background: 'var(--bg)', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
                    {act.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text)' }}>{act.text}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{act.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="card slide-up delay-3">
          <div className="card-body">
            <h3 style={{ margin: '0 0 24px', fontSize: '1.2rem', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>Latest Transactions</h3>
            {transactions.slice(0, 5).map(t => (
              <div key={t.id} style={{ padding: '16px 0', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 4, color: 'var(--text)' }}>{t.package || 'Lead Unlock'}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Hotel {t.hotelId} • {new Date(t.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                </div>
                <span style={{ fontWeight: 700, color: t.amount > 0 ? 'var(--success)' : 'var(--danger)', fontFamily: 'var(--font-serif)', fontSize: '1.1rem' }}>{t.amount > 0 ? '+' : ''}{t.amount}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
