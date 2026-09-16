import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import NotificationDropdown from '../../components/NotificationDropdown';
import {
  LayoutDashboard,
  Calendar,
  MapPin,
  Users,
  Building2,
  Mail,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Search,
  ChevronDown
} from 'lucide-react';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const { hotels } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = () => { logout(); navigate('/admin_login'); };

  const pendingHotelsCount = (hotels || []).filter(h => (h.status || '').toUpperCase() === 'PENDING').length;

  const navItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/calendar', icon: Calendar, label: 'Business Calendar' },
    { path: '/admin/map', icon: MapPin, label: 'Map View' },
    { path: '/admin/users', icon: Users, label: 'Customers' },
    { path: '/admin/hotels', icon: Building2, label: 'Hotels', badge: pendingHotelsCount },
    { path: '/admin/leads', icon: Mail, label: 'Leads' },
    { path: '/admin/credits', icon: CreditCard, label: 'Credit Log' },
    { path: '/admin/reports', icon: BarChart3, label: 'Reports' },
    { path: '/admin/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', background: '#F8FAFC', fontFamily: 'var(--font-sans)' }}>
      {/* Mobile Drawer Overlay Backdrop */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 99,
            transition: 'opacity 0.3s'
          }}
        />
      )}

      {/* Modern Dark Navy Sidebar */}
      <aside style={{
        width: 260,
        minWidth: 260,
        height: '100vh',
        flexShrink: 0,
        background: '#0B132B',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        zIndex: 100,
        borderRight: '1px solid rgba(255, 255, 255, 0.06)',
        boxShadow: '4px 0 24px rgba(0, 0, 0, 0.12)',
        overflowY: 'auto'
      }}>
        <div>
          {/* Brand Header */}
          <div style={{
            padding: '24px 20px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <Link to="/admin" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Pink Hotel Icon */}
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #EC4899, #F43F5E)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(236, 72, 153, 0.35)',
                color: 'white',
                fontSize: '1.2rem'
              }}>
                🏨
              </div>
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center' }}>
                  Hotel <span style={{ color: '#38BDF8', fontStyle: 'italic', marginLeft: 4, fontFamily: "'Playfair Display', serif" }}>IQ</span>
                </div>
                <div style={{ fontSize: '0.68rem', color: '#94A3B8', fontWeight: 600, letterSpacing: '0.04em', marginTop: 1 }}>
                  Admin Control Center
                </div>
              </div>
            </Link>

            <button
              onClick={() => setSidebarOpen(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94A3B8',
                cursor: 'pointer',
                padding: 4,
                display: 'none'
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Nav Items */}
          <nav style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {navItems.map(item => {
              const isActive = location.pathname === item.path || (item.path === '/admin' && location.pathname === '/admin/');
              const IconComp = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '11px 16px',
                    borderRadius: 10,
                    textDecoration: 'none',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '0.88rem',
                    transition: 'all 0.2s ease',
                    background: isActive 
                      ? 'linear-gradient(135deg, #2563EB, #1D4ED8)' 
                      : 'transparent',
                    color: isActive ? '#FFFFFF' : '#94A3B8',
                    boxShadow: isActive ? '0 4px 14px rgba(37, 99, 235, 0.35)' : 'none'
                  }}
                  onMouseEnter={e => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                      e.currentTarget.style.color = '#F8FAFC';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#94A3B8';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <IconComp size={18} style={{ opacity: isActive ? 1 : 0.8 }} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge > 0 && (
                    <span style={{
                      background: '#EF4444',
                      color: '#FFFFFF',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      padding: '2px 7px',
                      borderRadius: 12,
                      lineHeight: 1.2
                    }}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer (User Profile & Sign Out) */}
        <div style={{ padding: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.9rem',
              fontWeight: 800
            }}>
              {(user?.name || 'S')[0]}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#F8FAFC', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.name || 'System Admin'}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                Administrator
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '9px',
              borderRadius: 8,
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(255, 255, 255, 0.03)',
              color: '#94A3B8',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.15s'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
              e.currentTarget.style.color = '#FCA5A5';
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
              e.currentTarget.style.color = '#94A3B8';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            <LogOut size={15} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, height: '100vh', display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        {/* Top Navigation Bar (Fixed) */}
        <header style={{
          height: 70,
          minHeight: 70,
          flexShrink: 0,
          background: '#FFFFFF',
          borderBottom: '1px solid #E2E8F0',
          padding: '0 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 50
        }}>
          {/* Search Box on Topbar */}
          <div style={{ position: 'relative', width: 340 }}>
            <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Search hotels, managers, locations..."
              value={globalSearch}
              onChange={e => setGlobalSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 14px 9px 38px',
                borderRadius: 22,
                border: '1px solid #E2E8F0',
                background: '#F8FAFC',
                fontSize: '0.84rem',
                color: '#1E293B',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Right Profile & Notifications */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <NotificationDropdown role="admin" userId={user?.id || 999999} isDark={false} />
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: '#0F172A',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.85rem',
                fontWeight: 800
              }}>
                {(user?.name || 'S')[0]}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A' }}>
                  {user?.name || 'System Admin'}
                </span>
                <ChevronDown size={14} style={{ color: '#64748B' }} />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content Body (Independently scrollable) */}
        <main style={{ padding: '24px 28px', flex: 1, overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
