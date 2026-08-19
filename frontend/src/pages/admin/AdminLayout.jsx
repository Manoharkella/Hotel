import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/auth'); };

  const navItems = [
    { path: '/admin', icon: '📈', label: 'Dashboard' },
    { path: '/admin/users', icon: '👥', label: 'Customers' },
    { path: '/admin/hotels', icon: '🏨', label: 'Hotels' },
    { path: '/admin/leads', icon: '📩', label: 'Leads' },
    { path: '/admin/credits', icon: '💳', label: 'Credit Log' },
    { path: '/admin/reports', icon: '📊', label: 'Reports' },
    { path: '/admin/settings', icon: '⚙️', label: 'Settings' },
  ];

  return (
    <div className="layout fade-in">
      {/* Luxury Dark Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <Link to="/admin" className="sidebar-logo" style={{ textDecoration: 'none' }}>
            Hotel<span>Lead</span>
          </Link>
          <div style={{ fontSize: '0.75rem', color: '#ff8080', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 8 }}>
            System Admin
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, background: 'var(--danger)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600 }}>
              {user.name[0]}
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'white' }}>{user.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>Super Admin</div>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>System Status: <span style={{ color: 'var(--success)' }}>Operational</span></span>
          </div>
        </header>
        
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
