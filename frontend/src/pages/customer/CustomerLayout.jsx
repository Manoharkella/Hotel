import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import NotificationDropdown from '../../components/NotificationDropdown';
import { Compass, Search, Briefcase, Heart, Gift, User as UserIcon } from 'lucide-react';

export default function CustomerLayout() {
  const { user, logout } = useAuth();
  const { quotes, wishlist = [] } = useApp();
  const { t, lang, setLang, LANG_NAMES } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [langDropdown, setLangDropdown] = useState(false);

  // Dark mode
  const [isDark, setIsDark] = useState(() => {
    try { return localStorage.getItem('hostiq_customer_dark') === 'true'; } catch { return false; }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    try { localStorage.setItem('hostiq_customer_dark', isDark ? 'true' : 'false'); } catch {}
  }, [isDark]);

  // Close mobile drawer when route changes
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const unreadQuotesCount = quotes ? quotes.length : 0;
  const customerId = user?.id || 1;
  const loyaltyPoints = user?.loyalty_points || 0;

  const isHomePage = location.pathname === '/customer' || location.pathname === '/customer/';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => { logout(); navigate('/customer_login'); };

  const navSolid = scrolled || !isHomePage;
  const navClass = `customer-nav ${navSolid ? 'scrolled' : ''}`;
  const linkColor = navSolid ? 'var(--text)' : 'white';

  const bottomNavItems = [
    { path: '/customer', label: 'Explore', icon: Compass, exact: true },
    { path: '/customer/find', label: 'Find', icon: Search },
    { path: '/customer/trips', label: 'Trips', icon: Briefcase, badge: unreadQuotesCount },
    { path: '/customer/wishlist', label: 'Saved', icon: Heart, badge: wishlist.length },
    { path: '/customer/profile', label: 'Profile', icon: UserIcon }
  ];

  return (
    <div style={{ position: 'relative', minHeight: '100vh', minHeight: '100dvh' }}>
      {/* Top Navigation */}
      <nav className={navClass}>
        <Link to="/customer" className="logo" style={{ textDecoration: 'none' }}>Host<span>IQ</span></Link>
        
        {/* Desktop Nav Links */}
        <div className="nav-links" style={{ alignItems: 'center' }}>
          <Link to="/customer" style={{ opacity: location.pathname === '/customer' ? 1 : 0.7 }}>{t('home')}</Link>
          <Link to="/customer/find" style={{ opacity: location.pathname.includes('find') ? 1 : 0.7 }}>{t('findStay')}</Link>
          <Link to="/customer/trips" style={{ opacity: location.pathname.includes('trips') ? 1 : 0.7, position: 'relative' }}>
            {t('myTrips')}
            {unreadQuotesCount > 0 && (
              <span style={{ 
                position: 'absolute', top: -6, right: -14, background: 'var(--accent)', color: 'white', 
                borderRadius: '50%', padding: '2px 6px', fontSize: '0.65rem', fontWeight: 800 
              }}>
                {unreadQuotesCount}
              </span>
            )}
          </Link>
          <Link to="/customer/wishlist" style={{ opacity: location.pathname.includes('wishlist') ? 1 : 0.7, position: 'relative' }}>
            {t('wishlist')}
            {wishlist.length > 0 && (
              <span className="nav-badge-red" style={{ position: 'absolute', top: -6, right: -16 }}>
                {wishlist.length}
              </span>
            )}
          </Link>
          <Link to="/customer/rewards" style={{ opacity: location.pathname.includes('rewards') ? 1 : 0.7, position: 'relative' }}>
            {t('rewards')}
            {loyaltyPoints > 0 && (
              <span style={{ 
                position: 'absolute', top: -6, right: -18, 
                background: '#6366f1', color: 'white',
                borderRadius: '50%', padding: '2px 6px', fontSize: '0.6rem', fontWeight: 800,
                minWidth: 20, textAlign: 'center',
              }}>
                {loyaltyPoints > 999 ? `${(loyaltyPoints/1000).toFixed(1)}k` : loyaltyPoints}
              </span>
            )}
          </Link>
          <Link to="/customer/profile" style={{ opacity: location.pathname.includes('profile') ? 1 : 0.7 }}>{t('profile')}</Link>
          
          {/* Language Switcher */}
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setLangDropdown(!langDropdown)}
              style={{
                background: navSolid ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.15)',
                border: `1px solid ${navSolid ? 'var(--border)' : 'rgba(255,255,255,0.3)'}`,
                color: linkColor,
                padding: '5px 12px', borderRadius: 6, cursor: 'pointer',
                fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4,
                transition: 'all 0.2s',
              }}
            >
              {lang.toUpperCase()}
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 9l6 6 6-6"/></svg>
            </button>
            {langDropdown && (
              <>
                <div onClick={() => setLangDropdown(false)} style={{ position: 'fixed', inset: 0, zIndex: 90 }} />
                <div style={{
                  position: 'absolute', top: '100%', right: 0, marginTop: 6,
                  background: isDark ? '#1e293b' : 'white', borderRadius: 10, padding: 6,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)', border: '1px solid var(--border)',
                  zIndex: 100, minWidth: 120,
                }}>
                  {Object.entries(LANG_NAMES).map(([code, name]) => (
                    <button key={code} onClick={() => { setLang(code); setLangDropdown(false); }}
                      style={{
                        display: 'block', width: '100%', padding: '8px 14px', border: 'none',
                        background: lang === code ? (isDark ? '#334155' : '#f0f4ff') : 'transparent',
                        color: lang === code ? '#6366f1' : (isDark ? '#e2e8f0' : '#374151'),
                        fontSize: '0.82rem', fontWeight: lang === code ? 700 : 500,
                        cursor: 'pointer', borderRadius: 6, textAlign: 'left',
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

          {/* Dark Mode Toggle */}
          <button
            onClick={() => setIsDark(!isDark)}
            title={isDark ? t('lightMode') : t('darkMode')}
            style={{
              background: navSolid ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.15)',
              border: `1px solid ${navSolid ? 'var(--border)' : 'rgba(255,255,255,0.3)'}`,
              color: linkColor,
              width: 34, height: 34, borderRadius: 8, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.9rem', transition: 'all 0.2s',
            }}
          >
            {isDark ? '☀' : '☾'}
          </button>

          <NotificationDropdown 
            role="customer" 
            userId={customerId} 
            lightNav={!scrolled && isHomePage} 
          />

          <button 
            onClick={handleLogout} 
            className={`btn ${navSolid ? 'btn-outline' : 'btn-outline-light'}`}
            style={{ borderRadius: 0, padding: '10px 24px' }}
          >
            {t('logout')}
          </button>
        </div>
        
        {/* Mobile Header Controls */}
        <div style={{ display: 'none', alignItems: 'center', gap: 8 }} className="mobile-header-controls">
          <NotificationDropdown 
            role="customer" 
            userId={customerId} 
            lightNav={!scrolled && isHomePage} 
          />
          <button 
            className="mobile-menu-btn" 
            onClick={() => setMenuOpen(!menuOpen)}
            style={{ color: navSolid ? 'var(--text)' : 'white', fontSize: '1.2rem', background: 'none', border: 'none', cursor: 'pointer', padding: 8 }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
          </button>
        </div>
      </nav>
      
      {/* Mobile Drawer Menu */}
      {menuOpen && (
        <>
          <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 98 }} />
          <div style={{ 
            position: 'fixed', 
            top: navSolid ? 64 : 76, 
            left: 0, 
            width: '100%', 
            background: isDark ? '#1e293b' : 'white', 
            padding: '20px 24px', 
            borderBottom: '1px solid var(--border-light)', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 14, 
            zIndex: 99, 
            boxShadow: 'var(--shadow-lg)' 
          }}>
            <Link to="/customer" onClick={() => setMenuOpen(false)} style={{ textDecoration: 'none', color: 'var(--text)', fontWeight: 600, fontSize: '0.95rem' }}>{t('home')}</Link>
            <Link to="/customer/find" onClick={() => setMenuOpen(false)} style={{ textDecoration: 'none', color: 'var(--text)', fontWeight: 600, fontSize: '0.95rem' }}>{t('findStay')}</Link>
            <Link to="/customer/trips" onClick={() => setMenuOpen(false)} style={{ textDecoration: 'none', color: 'var(--text)', fontWeight: 600, fontSize: '0.95rem' }}>{t('myTrips')}</Link>
            <Link to="/customer/wishlist" onClick={() => setMenuOpen(false)} style={{ textDecoration: 'none', color: 'var(--text)', fontWeight: 600, fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>{t('wishlist')}</span>
              {wishlist.length > 0 && (<span className="nav-badge-red">{wishlist.length}</span>)}
            </Link>
            <Link to="/customer/rewards" onClick={() => setMenuOpen(false)} style={{ textDecoration: 'none', color: 'var(--text)', fontWeight: 600, fontSize: '0.95rem' }}>{t('rewards')}</Link>
            <Link to="/customer/profile" onClick={() => setMenuOpen(false)} style={{ textDecoration: 'none', color: 'var(--text)', fontWeight: 600, fontSize: '0.95rem' }}>{t('profile')}</Link>
            
            {/* Mobile language & dark mode */}
            <div style={{ display: 'flex', gap: 8, paddingTop: 12, borderTop: '1px solid var(--border)', alignItems: 'center' }}>
              {Object.entries(LANG_NAMES).map(([code, name]) => (
                <button key={code} onClick={() => setLang(code)} style={{
                  padding: '6px 12px', borderRadius: 6, border: 'none',
                  background: lang === code ? '#6366f1' : (isDark ? '#334155' : '#f1f5f9'),
                  color: lang === code ? 'white' : (isDark ? '#e2e8f0' : '#475569'),
                  fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
                }}>{name}</button>
              ))}
              <button onClick={() => setIsDark(!isDark)} style={{
                marginLeft: 'auto', padding: '6px 12px', borderRadius: 6, border: 'none',
                background: isDark ? '#334155' : '#f1f5f9', color: isDark ? '#fbbf24' : '#475569',
                fontSize: '0.85rem', cursor: 'pointer',
              }}>{isDark ? '☀ Light' : '☾ Dark'}</button>
            </div>
            
            <button onClick={handleLogout} className="btn btn-outline btn-block mt-2" style={{ padding: '10px' }}>{t('logout')}</button>
          </div>
        </>
      )}
      
      {/* Main Content Area */}
      <div className="customer-main-wrap" style={{ paddingTop: !isHomePage ? '84px' : '0', minHeight: '100vh', minHeight: '100dvh', background: 'var(--bg)' }}>
        <Outlet />
      </div>

      {/* Mobile Native-Style Bottom Navigation Bar */}
      <div 
        className="customer-bottom-nav"
        style={{
          display: 'none',
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: 62,
          background: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(16px)',
          borderTop: '1px solid var(--border)',
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
                color: isActive ? '#4F46E5' : 'var(--text-secondary)',
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
                    background: '#EF4444',
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
