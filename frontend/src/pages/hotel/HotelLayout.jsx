import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

export default function HotelLayout() {
  const { user, logout } = useAuth();
  const { hotels, getWalletBalance } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const hotelId = (user?.hotelId || user?.id) ? (user.hotelId || user.id).toString() : '1';
  const hotelData = hotels.find(h => h.id === hotelId);
  const credits = getWalletBalance(hotelId);
  const { notifications, markNotificationsRead } = useApp();

  const [isDark, setIsDark] = useState(document.documentElement.getAttribute('data-theme') === 'dark');
  const [showNotifications, setShowNotifications] = useState(false);

  const userNotifications = notifications.filter(n => n.userId === user?.hotelId);
  const unreadCount = userNotifications.filter(n => !n.read).length;

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme ? 'dark' : 'light');
  };

  const handleLogout = () => { logout(); navigate('/auth'); };

  const navItems = [
    { path: '/hotel', icon: '📊', label: 'Dashboard' },
    { path: '/hotel/leads', icon: '📩', label: 'Leads Inbox' },
    { path: '/hotel/bookings', icon: '📋', label: 'Bookings' },
    { path: '/hotel/wallet', icon: '💳', label: 'Credit Wallet' },
    { path: '/hotel/scanner', icon: '📷', label: 'QR Scanner' },
    { path: '/hotel/property', icon: '🏨', label: 'My Property' },
  ];

  return (
    <div className="layout fade-in">
      {/* Luxury Dark Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <Link to="/hotel" className="sidebar-logo" style={{ textDecoration: 'none' }}>
            Hotel<span>Lead</span>
          </Link>
          <div style={{ fontSize: '0.75rem', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 8 }}>
            Partner Portal
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => (
            <Link 
              key={item.path} 
              to={item.path} 
              className={`sidebar-link ${location.pathname === item.path ? 'active' : ''}`}
            >
              <span style={{ fontSize: '1.2rem', opacity: location.pathname === item.path ? 1 : 0.7 }}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '8px', marginBottom: 16 }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Credit Balance</div>
            <div style={{ fontSize: '1.25rem', fontFamily: 'var(--font-sans)', fontWeight: 600, color: 'white', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: 'var(--accent)' }}>●</span> {credits} 
            </div>
            {credits < 20 && (
              <div style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: 8 }}>Low balance</div>
            )}
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, background: 'var(--accent)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600 }}>
              {(hotelData?.name || user?.name || 'H')[0]}
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'white' }}>{hotelData?.name || user?.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>Manager</div>
            </div>
          </div>
          <button className="btn btn-outline-light btn-block btn-sm" onClick={handleLogout}>Logout</button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="topbar">
          <h2 style={{ fontSize: '1.25rem', margin: 0, fontFamily: 'var(--font-sans)', fontWeight: 600 }}>
            {navItems.find(i => i.path === location.pathname)?.label || 'Dashboard'}
          </h2>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  if(!showNotifications && unreadCount > 0) markNotificationsRead(user?.hotelId);
                }}
                style={{ background: 'transparent', border: '1px solid var(--border)', width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)', position: 'relative' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                {unreadCount > 0 && (
                  <span style={{ position: 'absolute', top: -4, right: -4, background: 'var(--danger)', color: 'white', fontSize: '0.65rem', padding: '2px 6px', borderRadius: 10, fontWeight: 'bold' }}>
                    {unreadCount}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div style={{ position: 'absolute', top: 48, right: 0, width: 320, background: 'var(--bg-card)', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-xl)', borderRadius: 'var(--radius)', zIndex: 1000, overflow: 'hidden' }}>
                  <div style={{ padding: '16px', borderBottom: '1px solid var(--border-light)', fontWeight: 600, fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Notifications
                  </div>
                  <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                    {userNotifications.length === 0 ? (
                      <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>No notifications yet.</div>
                    ) : (
                      userNotifications.map(n => (
                        <div key={n.id} style={{ padding: '16px', borderBottom: '1px solid var(--border-light)', fontSize: '0.85rem', background: n.read ? 'transparent' : 'var(--info-bg)' }}>
                          <div style={{ color: 'var(--text)', marginBottom: 8, lineHeight: 1.4 }}>{n.message}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(n.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <button 
              onClick={toggleTheme} 
              style={{ background: 'transparent', border: '1px solid var(--border)', width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)' }}
            >
              {isDark ? '☀️' : '🌙'}
            </button>
            <button className="btn btn-accent btn-sm" onClick={() => navigate('/hotel/wallet')}>
              Buy Credits
            </button>
          </div>
        </header>
        
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
