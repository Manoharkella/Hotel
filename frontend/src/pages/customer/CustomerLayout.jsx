import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function CustomerLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Check if we are on a page that needs a transparent nav (like the home page hero)
  const isHomePage = location.pathname === '/customer' || location.pathname === '/customer/';

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check on mount
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => { logout(); navigate('/auth'); };

  // If not on home page, nav is always solid
  const navClass = `customer-nav ${scrolled || !isHomePage ? 'scrolled' : ''}`;

  return (
    <div>
      <nav className={navClass}>
        <Link to="/customer" className="logo">Hotel<span>Lead</span></Link>
        <div className="nav-links">
          <Link to="/customer" style={{ opacity: location.pathname === '/customer' ? 1 : 0.7 }}>Home</Link>
          <Link to="/customer/find" style={{ opacity: location.pathname.includes('find') ? 1 : 0.7 }}>Find a Stay</Link>
          <Link to="/customer/trips" style={{ opacity: location.pathname.includes('trips') ? 1 : 0.7 }}>My Trips</Link>
          <Link to="/customer/profile" style={{ opacity: location.pathname.includes('profile') ? 1 : 0.7 }}>Profile</Link>
          
          <button 
            onClick={handleLogout} 
            className={`btn ${scrolled || !isHomePage ? 'btn-outline' : 'btn-outline-light'}`}
            style={{ borderRadius: 0, padding: '10px 24px' }}
          >
            Logout
          </button>
        </div>
        
        <button 
          className="mobile-menu-btn" 
          onClick={() => setMenuOpen(!menuOpen)}
          style={{ color: (scrolled || !isHomePage) ? 'var(--text)' : 'white' }}
        >
          ☰
        </button>
      </nav>
      
      {menuOpen && (
        <div style={{ position: 'fixed', top: (scrolled || !isHomePage) ? 73 : 89, left: 0, width: '100%', background: 'white', padding: '24px', borderBottom: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: 16, zIndex: 99, boxShadow: 'var(--shadow-md)' }}>
          <Link to="/customer" onClick={() => setMenuOpen(false)} style={{ textDecoration: 'none', color: 'var(--text)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Home</Link>
          <Link to="/customer/find" onClick={() => setMenuOpen(false)} style={{ textDecoration: 'none', color: 'var(--text)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Find a Stay</Link>
          <Link to="/customer/trips" onClick={() => setMenuOpen(false)} style={{ textDecoration: 'none', color: 'var(--text)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>My Trips</Link>
          <Link to="/customer/profile" onClick={() => setMenuOpen(false)} style={{ textDecoration: 'none', color: 'var(--text)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Profile</Link>
          <button onClick={handleLogout} className="btn btn-outline btn-block mt-2">Logout</button>
        </div>
      )}
      
      {/* Add top padding for pages that don't have a hero section to prevent content from hiding under the fixed nav */}
      <div style={{ paddingTop: !isHomePage ? '120px' : '0', minHeight: '100vh', background: 'var(--bg)' }}>
        <Outlet />
      </div>
    </div>
  );
}
