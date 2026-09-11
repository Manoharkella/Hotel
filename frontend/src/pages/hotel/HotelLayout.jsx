import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import NotificationDropdown from '../../components/NotificationDropdown';

const Icon = ({ d, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const icons = {
  dashboard: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0v-6a1 1 0 011-1h2a1 1 0 011 1v6m-6 0h6',
  calendar: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  leads: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  bookings: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
  wallet: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
  scanner: 'M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z',
  property: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  logout: 'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
  menu: 'M4 6h16M4 12h16M4 18h16',
  close: 'M6 18L18 6M6 6l12 12'
};

export default function HotelLayout() {
  const { user, logout } = useAuth();
  const { hotels, getWalletBalance } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDark, setIsDark] = useState(document.documentElement.getAttribute('data-theme') === 'dark');

  const hotelId = user?.hotelId || user?.id;
  const hotelData = hotels.find(h => h.id === hotelId?.toString());
  const credits = getWalletBalance(hotelId?.toString() || '1');

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme ? 'dark' : 'light');
  };

  const handleLogout = () => { logout(); navigate('/hotel_login'); };

  const navItems = [
    { path: '/hotel', icon: icons.dashboard, label: 'Dashboard' },
    { path: '/hotel/calendar', icon: icons.calendar, label: 'Room Calendar' },
    { path: '/hotel/leads', icon: icons.leads, label: 'Leads Inbox' },
    { path: '/hotel/bookings', icon: icons.bookings, label: 'Bookings' },
    { path: '/hotel/wallet', icon: icons.wallet, label: 'Credit Wallet' },
    { path: '/hotel/scanner', icon: icons.scanner, label: 'QR Scanner' },
    { path: '/hotel/property', icon: icons.property, label: 'My Property' },
  ];

  return (
    <div className="layout fade-in">
      {/* Mobile Drawer Overlay Backdrop */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 99,
            transition: 'opacity 0.3s'
          }}
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`} style={{
        zIndex: 100,
        transition: 'transform 0.3s ease'
      }}>
        {/* Brand Header */}
        <div className="sidebar-header" style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Link to="/hotel" style={{ textDecoration: 'none' }}>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '1.35rem', fontWeight: 800, color: 'white', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 6 }}>
                🏨 Hotel<span style={{ color: '#EA580C', fontStyle: 'italic', fontFamily: "'Playfair Display', serif" }}>IQ</span>
              </span>
            </Link>
            <div style={{ fontSize: '0.65rem', color: '#EA580C', textTransform: 'uppercase', letterSpacing: '0.12em', marginTop: 2, fontWeight: 700 }}>
              Hotel Partner Portal
            </div>
          </div>

          {/* Close button on mobile */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="mobile-close-btn"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: 4,
              display: 'none'
            }}
          >
            <Icon d={icons.close} size={22} />
          </button>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {navItems.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`sidebar-link ${isActive ? 'active' : ''}`}
                style={{ display: 'flex', alignItems: 'center', gap: 12 }}
              >
                <span style={{ opacity: isActive ? 1 : 0.5, display: 'flex' }}>
                  <Icon d={item.icon} size={18} />
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          {/* Credits */}
          <div style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 10, padding: '10px 12px', marginBottom: 12,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Credits</span>
            <span style={{ fontSize: '0.82rem', color: '#10B981', fontWeight: 700 }}>{credits}</span>
          </div>

          {/* User */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'rgba(16,185,129,0.15)', color: '#34d399',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.8rem', fontWeight: 600,
            }}>
              {(hotelData?.name || user?.name || 'H')[0]}
            </div>
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }}>
                {hotelData?.name || user?.name || 'Hotel'}
              </div>
              <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Partner</div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            style={{
              width: '100%', padding: '8px', borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'transparent', color: '#94a3b8',
              fontSize: '0.78rem', fontWeight: 500, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#fca5a5'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8'; }}
          >
            <Icon d={icons.logout} size={15} />
            Sign Out
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="mobile-hamburger-btn"
              style={{
                background: 'transparent',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '6px 8px',
                cursor: 'pointer',
                color: 'var(--text)',
                display: 'none',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Toggle navigation"
            >
              <Icon d={icons.menu} size={20} />
            </button>
            <h2 style={{ fontSize: '1.15rem', margin: 0, fontWeight: 600, color: 'var(--text)' }}>
              {navItems.find(i => i.path === location.pathname)?.label || 'Dashboard'}
            </h2>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <NotificationDropdown
              role="hotel"
              userId={hotelId}
              isDark={isDark}
            />
            <button
              onClick={toggleTheme}
              style={{
                background: 'transparent', border: '1px solid var(--border)',
                width: 34, height: 34, borderRadius: 8, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-secondary)', fontSize: '0.85rem',
              }}
              title="Toggle theme"
            >
              {isDark ? '☀' : '☾'}
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
