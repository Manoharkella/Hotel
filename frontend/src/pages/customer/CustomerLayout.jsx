import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import NotificationDropdown from '../../components/NotificationDropdown';
import HotelLogo from '../../components/HotelLogo';
import { Compass, Search, Briefcase, Heart, Gift, User as UserIcon, Globe, Menu, X, LogOut, ChevronDown } from 'lucide-react';

export default function CustomerLayout() {
  const { user, logout } = useAuth();
  const { quotes, wishlist = [] } = useApp();
  const { t, lang, setLang, LANG_NAMES } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [langDropdown, setLangDropdown] = useState(false);

  // Close mobile drawer when route changes
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const unreadQuotesCount = quotes ? quotes.length : 0;
  const customerId = user?.id || 1;
  const isHomePage = location.pathname === '/customer' || location.pathname === '/customer/' || location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/customer_login');
  };

  const navSolid = scrolled || !isHomePage;

  const bottomNavItems = [
    { path: '/customer', label: 'Home', icon: Compass, exact: true },
    { path: '/customer/find', label: 'Find a Stay', icon: Search },
    { path: '/customer/trips', label: 'My Trips', icon: Briefcase, badge: unreadQuotesCount },
    { path: '/customer/wishlist', label: 'Wishlist', icon: Heart, badge: wishlist.length },
    { path: '/customer/profile', label: 'Profile', icon: UserIcon }
  ];

  return (
    <div style={{ position: 'relative', minHeight: '100vh', minHeight: '100dvh', background: 'var(--bg)' }}>
      {/* Top Navbar */}
      <nav className={`customer-nav ${navSolid ? 'scrolled' : ''}`}>
        {/* Brand Logo */}
        <Link to="/customer" style={{ textDecoration: 'none' }}>
          <HotelLogo light={!navSolid} size="default" />
        </Link>
        
        {/* Desktop Nav Center Links */}
        <div className="nav-center-links" style={{ display: 'flex', alignItems: 'center' }}>
          <Link to="/customer" className={`nav-link-item ${location.pathname === '/customer' ? 'active' : ''}`}>
            Home
          </Link>
          <Link to="/customer/find" className={`nav-link-item ${location.pathname.includes('/customer/find') ? 'active' : ''}`}>
            Find a Stay
          </Link>
          <a href="#how-it-works" onClick={(e) => {
            if (location.pathname !== '/customer') {
              e.preventDefault();
              navigate('/customer#how-it-works');
            }
          }} className="nav-link-item">
            How It Works
          </a>
          <Link to="/hotel_login" className="nav-link-item">
            For Hotels
          </Link>
          <a href="#about" onClick={(e) => {
            if (location.pathname !== '/customer') {
              e.preventDefault();
              navigate('/customer#about');
            }
          }} className="nav-link-item">
            About
          </a>

          {/* If user logged in, show their links */}
          {user && (
            <>
              <Link to="/customer/trips" className={`nav-link-item ${location.pathname.includes('trips') ? 'active' : ''}`} style={{ position: 'relative' }}>
                Trips
                {unreadQuotesCount > 0 && (
                  <span style={{ 
                    position: 'absolute', top: -4, right: -12, background: '#EA580C', color: 'white', 
                    borderRadius: '50%', padding: '1px 5px', fontSize: '0.62rem', fontWeight: 800 
                  }}>
                    {unreadQuotesCount}
                  </span>
                )}
              </Link>
              <Link to="/customer/wishlist" className={`nav-link-item ${location.pathname.includes('wishlist') ? 'active' : ''}`}>
                Saved
              </Link>
            </>
          )}
        </div>

        {/* Right Actions: Language + Sign In + Sign Up / User Profile */}
        <div className="nav-actions-right">
          {/* Language Selector (Desktop) */}
          <div className="desktop-header-lang" style={{ position: 'relative' }}>
            <button 
              onClick={() => setLangDropdown(!langDropdown)}
              style={{
                background: navSolid ? '#F1F5F9' : 'rgba(255,255,255,0.12)',
                border: `1px solid ${navSolid ? '#E2E8F0' : 'rgba(255,255,255,0.25)'}`,
                color: navSolid ? '#1E293B' : '#FFFFFF',
                padding: '7px 14px',
                borderRadius: 9999,
                cursor: 'pointer',
                fontSize: '0.82rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.2s',
              }}
            >
              <Globe size={15} />
              <span>{lang.toUpperCase()}</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>
            </button>

            {langDropdown && (
              <>
                <div onClick={() => setLangDropdown(false)} style={{ position: 'fixed', inset: 0, zIndex: 90 }} />
                <div style={{
                  position: 'absolute', top: '100%', right: 0, marginTop: 8,
                  background: '#FFFFFF', borderRadius: 12, padding: 6,
                  boxShadow: '0 12px 30px rgba(0,0,0,0.18)', border: '1px solid #E2E8F0',
                  zIndex: 100, minWidth: 140,
                }}>
                  {Object.entries(LANG_NAMES).map(([code, name]) => (
                    <button 
                      key={code} 
                      onClick={() => { setLang(code); setLangDropdown(false); }}
                      style={{
                        display: 'block', width: '100%', padding: '8px 14px', border: 'none',
                        background: lang === code ? '#FFF7ED' : 'transparent',
                        color: lang === code ? '#EA580C' : '#334155',
                        fontSize: '0.82rem', fontWeight: lang === code ? 700 : 500,
                        cursor: 'pointer', borderRadius: 8, textAlign: 'left',
                        transition: 'all 0.15s',
                      }}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Mobile Right Controls: Notification Bell + Hamburger */}
          <div className="mobile-header-controls" style={{ display: 'none', alignItems: 'center', gap: 8 }}>
            <NotificationDropdown 
              role="customer" 
              userId={customerId} 
              lightNav={!navSolid} 
            />
            <button 
              className="mobile-menu-btn"
              onClick={() => setMenuOpen(!menuOpen)}
              style={{ 
                color: navSolid ? '#0F172A' : '#FFFFFF', 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer', 
                padding: 4,
                display: 'flex',
                alignItems: 'center'
              }}
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>

          {/* User Auth or Profile Actions (Desktop) */}
          <div className="desktop-header-auth" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {!user ? (
              <>
                <Link to="/customer_login" className="nav-btn-signin">
                  Sign In
                </Link>
                <Link to="/customer_login?mode=signup" className="nav-btn-signup">
                  Sign Up
                </Link>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <NotificationDropdown 
                  role="customer" 
                  userId={customerId} 
                  lightNav={!navSolid} 
                />
                <Link 
                  to="/customer/profile"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    textDecoration: 'none',
                    color: navSolid ? '#0F172A' : '#FFFFFF',
                    background: navSolid ? '#F1F5F9' : 'rgba(255,255,255,0.15)',
                    padding: '5px 12px',
                    borderRadius: 9999,
                    fontSize: '0.82rem',
                    fontWeight: 600
                  }}
                >
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#EA580C', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800 }}>
                    {user.name ? user.name[0].toUpperCase() : 'A'}
                  </div>
                  <span>{user.name ? user.name.split(' ')[0] : 'Arjun'}</span>
                  <ChevronDown size={13} color={navSolid ? '#64748B' : 'white'} />
                </Link>
                <button 
                  onClick={handleLogout} 
                  title="Logout"
                  style={{ 
                    background: 'none', border: 'none', cursor: 'pointer', 
                    color: navSolid ? '#64748B' : 'rgba(255,255,255,0.8)',
                    padding: 6, display: 'flex', alignItems: 'center'
                  }}
                >
                  <LogOut size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Drawer Menu */}
      {menuOpen && (
        <>
          <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 98 }} />
          <div style={{ 
            position: 'fixed', 
            top: 68, 
            left: 0, 
            width: '100%', 
            background: '#FFFFFF', 
            padding: '24px 20px', 
            borderBottom: '1px solid #E2E8F0', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 16, 
            zIndex: 99, 
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)' 
          }}>
            <Link to="/customer" onClick={() => setMenuOpen(false)} style={{ textDecoration: 'none', color: '#0F172A', fontWeight: 700, fontSize: '1.05rem' }}>Home</Link>
            <Link to="/customer/find" onClick={() => setMenuOpen(false)} style={{ textDecoration: 'none', color: '#0F172A', fontWeight: 700, fontSize: '1.05rem' }}>Find a Stay</Link>
            <a href="#how-it-works" onClick={() => setMenuOpen(false)} style={{ textDecoration: 'none', color: '#0F172A', fontWeight: 700, fontSize: '1.05rem' }}>How It Works</a>
            <Link to="/hotel_login" onClick={() => setMenuOpen(false)} style={{ textDecoration: 'none', color: '#0F172A', fontWeight: 700, fontSize: '1.05rem' }}>For Hotels</Link>
            <a href="#about" onClick={() => setMenuOpen(false)} style={{ textDecoration: 'none', color: '#0F172A', fontWeight: 700, fontSize: '1.05rem' }}>About</a>
            
            {/* Mobile Drawer Language Row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0 6px', borderTop: '1px solid #E2E8F0' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#475569', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Globe size={16} color="#EA580C" /> Language
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                {Object.entries(LANG_NAMES).map(([code, name]) => (
                  <button 
                    key={code} 
                    type="button"
                    onClick={() => setLang(code)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 8,
                      border: `1px solid ${lang === code ? '#EA580C' : '#E2E8F0'}`,
                      background: lang === code ? '#EA580C' : '#F8FAFC',
                      color: lang === code ? '#FFFFFF' : '#334155',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {code.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ paddingTop: 10, borderTop: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {!user ? (
                <>
                  <Link to="/customer_login" onClick={() => setMenuOpen(false)} className="btn btn-outline" style={{ width: '100%', textAlign: 'center', justifyContent: 'center' }}>
                    Sign In
                  </Link>
                  <Link to="/customer_login?mode=signup" onClick={() => setMenuOpen(false)} className="btn btn-accent" style={{ width: '100%', textAlign: 'center', justifyContent: 'center', background: '#EA580C' }}>
                    Sign Up
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/customer/trips" onClick={() => setMenuOpen(false)} style={{ textDecoration: 'none', color: '#0F172A', fontWeight: 600 }}>My Trips ({unreadQuotesCount})</Link>
                  <Link to="/customer/wishlist" onClick={() => setMenuOpen(false)} style={{ textDecoration: 'none', color: '#0F172A', fontWeight: 600 }}>Saved Hotels ({wishlist.length})</Link>
                  <Link to="/customer/profile" onClick={() => setMenuOpen(false)} style={{ textDecoration: 'none', color: '#0F172A', fontWeight: 600 }}>My Profile</Link>
                  <button onClick={handleLogout} className="btn btn-outline" style={{ width: '100%', marginTop: 8 }}>Logout</button>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* Main Content Area */}
      <div className="customer-main-wrap" style={{ paddingTop: !isHomePage ? '84px' : '0', minHeight: '100vh', minHeight: '100dvh', background: 'var(--bg)' }}>
        <Outlet />
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div 
        className="customer-bottom-nav"
        style={{
          display: 'none',
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: 62,
          background: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(16px)',
          borderTop: '1px solid #E2E8F0',
          zIndex: 90,
          justifyContent: 'space-around',
          alignItems: 'center',
          padding: '0 8px',
          boxShadow: '0 -4px 16px rgba(0,0,0,0.06)'
        }}
      >
        {bottomNavItems.map(item => {
          const isActive = item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path);
          const IconComp = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none',
                color: isActive ? '#EA580C' : '#64748B',
                position: 'relative',
                flex: 1,
                padding: '6px 0',
                transition: 'all 0.15s'
              }}
            >
              <div style={{ position: 'relative' }}>
                <IconComp size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                {Boolean(item.badge) && item.badge > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: -4,
                    right: -8,
                    background: '#EA580C',
                    color: 'white',
                    fontSize: '0.62rem',
                    fontWeight: 800,
                    borderRadius: 10,
                    padding: '1px 5px',
                    minWidth: 14,
                    textAlign: 'center'
                  }}>
                    {item.badge}
                  </span>
                )}
              </div>
              <span style={{ fontSize: '0.68rem', fontWeight: isActive ? 700 : 500, marginTop: 3 }}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
