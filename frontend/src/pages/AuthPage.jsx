import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Eye, EyeOff, Lock, Mail, User, Building, MapPin } from 'lucide-react';

export default function AuthPage({ initialRole }) {
  const { addToast } = useToast();
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const routerLocation = useLocation();

  const getRoleFromPath = () => {
    if (initialRole) return initialRole;
    const p = routerLocation.pathname.toLowerCase();
    if (p.includes('hotel')) return 'hotel';
    if (p.includes('admin')) return 'admin';
    return 'customer';
  };

  const [role, setRole] = useState(getRoleFromPath);
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  // Input refs for smooth Enter navigation
  const nameInputRef = useRef(null);
  const locationInputRef = useRef(null);
  const addressInputRef = useRef(null);
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);

  // Hotel registration specific state
  const [step, setStep] = useState(1);
  const [location, setLocation] = useState('');
  const [address, setAddress] = useState('');
  const [rooms, setRooms] = useState([{ room_type: 'Single', quantity: 10, price_per_night: 2000 }]);
  const [photos, setPhotos] = useState(['https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2000&auto=format&fit=crop']);

  // Sync role when URL route changes
  useEffect(() => {
    const current = getRoleFromPath();
    setRole(current);
    setIsLogin(true);
    setError('');
    setStep(1);
  }, [routerLocation.pathname, initialRole]);

  const handleAddRoom = () => setRooms([...rooms, { room_type: 'Deluxe', quantity: 5, price_per_night: 4000 }]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!isLogin && role === 'hotel' && step === 1) {
      if (!name.trim() || !email.trim() || !password || !location.trim() || !address.trim()) { 
        setError('Please fill in all basic property details.'); 
        return; 
      }
      setStep(2);
      return;
    }

    if (!email.trim()) { 
      setError('Please enter your email address.'); 
      emailInputRef.current?.focus(); 
      return; 
    }
    if (!password) { 
      setError('Please enter your password.'); 
      passwordInputRef.current?.focus(); 
      return; 
    }
    if (!isLogin && !name.trim() && role !== 'admin') { 
      setError('Please enter your name.'); 
      nameInputRef.current?.focus(); 
      return; 
    }

    setIsLoading(true);
    
    try {
      let loggedUser;
      if (isLogin || role === 'admin') {
        if (role === 'hotel') {
          const hotelData = await api.loginHotel(email.trim(), password);
          loggedUser = login(email.trim(), password, role, hotelData.user);
          loggedUser.hotelId = hotelData.user.id.toString();
          loggedUser.name = hotelData.user.name;
        } else if (role === 'customer') {
          const userData = await api.loginUser(email.trim(), password);
          loggedUser = login(email.trim(), password, role, userData.user);
        } else {
          const adminData = await api.loginAdmin(email.trim(), password);
          loggedUser = login(email.trim(), password, role, adminData.user);
        }
      } else {
        if (role === 'hotel') {
          await api.registerHotel({ 
            name: name.trim(), 
            location: location.trim(), 
            address: address.trim(), 
            email: email.trim(), 
            password, 
            photos, 
            rooms 
          });
          addToast('Hotel registered successfully! Awaiting approval.', 'success');
          setIsLogin(true);
          setStep(1);
          setIsLoading(false);
          return; 
        } else {
          const newUser = await api.registerUser({ 
            full_name: name.trim(), 
            email: email.trim(), 
            password, 
            role 
          });
          loggedUser = signup(name.trim(), email.trim(), password, role, newUser);
        }
      }
      
      if (loggedUser.role === 'customer') navigate('/customer');
      else if (loggedUser.role === 'hotel') navigate('/hotel');
      else navigate('/admin');
    } catch (err) {
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const portalDetails = {
    customer: {
      title: isLogin ? 'Welcome Back' : 'Create Traveler Account',
      subtitle: isLogin ? 'Sign in to explore stays and negotiate live rates' : 'Sign up in seconds to start booking',
      btnText: isLogin ? 'Sign In' : 'Create Account',
      btnClass: 'btn-auth-customer',
      accentColor: '#D97706',
      switchText: 'Are you a Hotel Partner?',
      switchLinkText: 'Hotel Partner Login →',
      switchPath: '/hotel_login'
    },
    hotel: {
      title: isLogin ? 'Hotel Partner Sign In' : 'Register Your Hotel',
      subtitle: isLogin ? 'Access your leads, guest passes, and property inventory' : 'List your property to receive traveler booking leads',
      btnText: isLogin ? 'Enter Partner Portal' : 'Next: Add Rooms',
      btnClass: 'btn-auth-hotel',
      accentColor: '#059669',
      switchText: 'Looking to book a stay as a guest?',
      switchLinkText: 'Traveler Login →',
      switchPath: '/customer_login'
    },
    admin: {
      title: 'Administrator Sign In',
      subtitle: 'Secure portal access for platform administrators',
      btnText: 'Authorize & Sign In',
      btnClass: 'btn-auth-admin',
      accentColor: '#3B82F6',
      switchText: 'Not an administrator?',
      switchLinkText: '← Return to Traveler Login',
      switchPath: '/customer_login'
    }
  }[role] || {
    title: 'Sign In',
    subtitle: 'Please enter your credentials to continue',
    btnText: 'Sign In',
    btnClass: 'btn-primary',
    accentColor: 'var(--primary)',
    switchText: '',
    switchLinkText: '',
    switchPath: '/customer_login'
  };

  return (
    <div className={`auth-layout ${role} fade-in`}>
      {/* Background Dimming / Themed Blur Overlay */}
      <div className={`auth-overlay ${role}`} />

      {/* Centered Themed Floating Card */}
      <div className={`auth-card ${role} fade-up`}>
        {/* Brand Logo Header */}
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 4
          }}>
            <span style={{ fontSize: '1.8rem' }}>{role === 'customer' ? '🏨' : role === 'hotel' ? '🏢' : '🛡️'}</span>
            <span className="logo-text" style={{
              fontFamily: 'var(--font-serif, Georgia, serif)',
              fontSize: '1.9rem',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: role === 'admin' ? '#FFFFFF' : 'var(--primary)'
            }}>
              Host<span style={{ color: portalDetails.accentColor, fontStyle: 'italic' }}>IQ</span>
            </span>
          </div>
        </div>

        {/* Heading & Subtitle */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h2 style={{
            margin: '0 0 6px',
            fontSize: '1.4rem',
            fontWeight: 700,
            color: role === 'admin' ? '#FFFFFF' : 'var(--text)',
            letterSpacing: '-0.01em'
          }}>
            {portalDetails.title}
          </h2>
          <p style={{
            margin: 0,
            fontSize: '0.88rem',
            color: role === 'admin' ? '#94A3B8' : 'var(--text-secondary)',
            lineHeight: 1.4
          }}>
            {portalDetails.subtitle}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            background: role === 'admin' ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2',
            border: '1px solid #FCA5A5',
            color: role === 'admin' ? '#FCA5A5' : '#B91C1C',
            borderRadius: 10,
            padding: '10px 14px',
            fontSize: '0.85rem',
            marginBottom: 18,
            textAlign: 'center',
            fontWeight: 500
          }}>
            {error}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit}>
          {/* Hotel Registration Step 2: Room setup */}
          {!isLogin && role === 'hotel' && step === 2 ? (
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 12px', color: 'var(--text)' }}>Room Inventory</h3>
              {rooms.map((r, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  <select 
                    className="form-input" 
                    style={{ flex: 2, padding: '10px 12px', fontSize: '0.88rem' }} 
                    value={r.room_type} 
                    onChange={e => { const newRooms = [...rooms]; newRooms[i].room_type = e.target.value; setRooms(newRooms); }}
                  >
                    <option value="Single">Single</option>
                    <option value="Deluxe">Deluxe</option>
                    <option value="Suite">Suite</option>
                  </select>
                  <input 
                    className="form-input" 
                    type="number" 
                    placeholder="Qty" 
                    style={{ flex: 1, padding: '10px 12px', fontSize: '0.88rem' }} 
                    value={r.quantity} 
                    onChange={e => { const newRooms = [...rooms]; newRooms[i].quantity = Number(e.target.value); setRooms(newRooms); }} 
                  />
                  <input 
                    className="form-input" 
                    type="number" 
                    placeholder="₹ Rate" 
                    style={{ flex: 1, padding: '10px 12px', fontSize: '0.88rem' }} 
                    value={r.price_per_night} 
                    onChange={e => { const newRooms = [...rooms]; newRooms[i].price_per_night = Number(e.target.value); setRooms(newRooms); }} 
                  />
                </div>
              ))}
              <button 
                type="button" 
                className="btn btn-outline btn-sm" 
                style={{ padding: '6px 14px', fontSize: '0.8rem', marginBottom: 16 }} 
                onClick={handleAddRoom}
              >
                + Add Room Type
              </button>

              <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 8px', color: 'var(--text)' }}>Property Cover Photo</h3>
              <div style={{ marginBottom: 18 }}>
                <input 
                  className="form-input" 
                  style={{ padding: '10px 14px', fontSize: '0.88rem' }} 
                  placeholder="https://images.unsplash.com/..." 
                  value={photos[0]} 
                  onChange={e => setPhotos([e.target.value])} 
                />
              </div>
              
              <div style={{ display: 'flex', gap: 10 }}>
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  style={{ flex: 1, padding: '11px' }} 
                  onClick={() => setStep(1)}
                >
                  Back
                </button>
                <button 
                  className={`btn ${portalDetails.btnClass}`} 
                  type="submit" 
                  disabled={isLoading}
                  style={{ flex: 2, padding: '11px', fontWeight: 600 }}
                >
                  {isLoading ? 'Registering...' : 'Complete Registration'}
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Full Name / Hotel Name when Signing Up */}
              {!isLogin && role !== 'admin' && (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: role === 'admin' ? '#94A3B8' : '#334155', marginBottom: 6 }}>
                    {role === 'hotel' ? 'Property / Hotel Name' : 'Full Name'}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}>
                      {role === 'hotel' ? <Building size={18} /> : <User size={18} />}
                    </div>
                    <input 
                      ref={nameInputRef}
                      type="text"
                      className="form-input" 
                      placeholder={role === 'hotel' ? 'e.g. The Grand Palace' : 'e.g. Arjun Kumar'} 
                      value={name} 
                      onChange={e => { setName(e.target.value); setError(''); }} 
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (role === 'hotel') locationInputRef.current?.focus();
                          else emailInputRef.current?.focus();
                        }
                      }}
                      style={{ padding: '11px 14px 11px 42px', fontSize: '0.92rem', borderRadius: 10, width: '100%' }}
                      required
                    />
                  </div>
                </div>
              )}

              {/* Hotel Location & Address (Sign up only) */}
              {!isLogin && role === 'hotel' && (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                      City / Destination
                    </label>
                    <div style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}>
                        <MapPin size={18} />
                      </div>
                      <input 
                        ref={locationInputRef}
                        type="text"
                        className="form-input" 
                        placeholder="e.g. Goa, India" 
                        value={location} 
                        onChange={e => { setLocation(e.target.value); setError(''); }} 
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addressInputRef.current?.focus();
                          }
                        }}
                        style={{ padding: '11px 14px 11px 42px', fontSize: '0.92rem', borderRadius: 10, width: '100%' }}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                      Complete Street Address
                    </label>
                    <input 
                      ref={addressInputRef}
                      type="text"
                      className="form-input" 
                      placeholder="e.g. 123 Beach Road, North Goa" 
                      value={address} 
                      onChange={e => { setAddress(e.target.value); setError(''); }} 
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          emailInputRef.current?.focus();
                        }
                      }}
                      style={{ padding: '11px 14px', fontSize: '0.92rem', borderRadius: 10, width: '100%' }}
                      required
                    />
                  </div>
                </>
              )}

              {/* Email Address */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: role === 'admin' ? '#94A3B8' : '#334155', marginBottom: 6 }}>
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}>
                    <Mail size={18} />
                  </div>
                  <input 
                    ref={emailInputRef}
                    type="email" 
                    className="form-input" 
                    placeholder="name@example.com" 
                    value={email} 
                    onChange={e => { setEmail(e.target.value); setError(''); }} 
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        passwordInputRef.current?.focus();
                      }
                    }}
                    style={{ padding: '11px 14px 11px 42px', fontSize: '0.92rem', borderRadius: 10, width: '100%' }}
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: role === 'admin' ? '#94A3B8' : '#334155', margin: 0 }}>
                    Password
                  </label>
                </div>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}>
                    <Lock size={18} />
                  </div>
                  <input 
                    ref={passwordInputRef}
                    type={showPassword ? "text" : "password"} 
                    className="form-input" 
                    placeholder="••••••••" 
                    value={password} 
                    onChange={e => { setPassword(e.target.value); setError(''); }} 
                    style={{ padding: '11px 44px 11px 42px', fontSize: '0.92rem', borderRadius: 10, width: '100%' }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: role === 'admin' ? '#94A3B8' : 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 4
                    }}
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button 
                type="submit" 
                disabled={isLoading}
                className={`btn ${portalDetails.btnClass} btn-block`}
                style={{
                  padding: '13px 20px',
                  borderRadius: 10,
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  cursor: isLoading ? 'not-allowed' : 'pointer'
                }}
              >
                {isLoading ? 'Signing in...' : (isLogin || role === 'admin' ? portalDetails.btnText : (role === 'hotel' ? 'Next: Add Rooms' : 'Create Account'))}
              </button>
            </>
          )}
        </form>

        {/* Toggle between Sign In / Sign Up */}
        {role !== 'admin' && (
          <div style={{
            textAlign: 'center',
            marginTop: 18,
            fontSize: '0.85rem',
            color: role === 'admin' ? '#94A3B8' : 'var(--text-secondary)'
          }}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              type="button" 
              onClick={() => { setIsLogin(!isLogin); setError(''); setStep(1); }} 
              style={{ 
                background: 'none', 
                border: 'none', 
                color: portalDetails.accentColor, 
                fontWeight: 700, 
                cursor: 'pointer', 
                textDecoration: 'none',
                padding: 0
              }}
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </div>
        )}

        {/* Portal Switch Link at Bottom */}
        <div style={{ 
          marginTop: 18, 
          paddingTop: 12, 
          borderTop: role === 'admin' ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid var(--border-light, #E2E8F0)', 
          textAlign: 'center', 
          fontSize: '0.82rem', 
          color: role === 'admin' ? '#64748B' : 'var(--text-muted, #94A3B8)' 
        }}>
          <span>{portalDetails.switchText} </span>
          <a 
            href={portalDetails.switchPath} 
            onClick={(e) => { e.preventDefault(); navigate(portalDetails.switchPath); }} 
            style={{ 
              color: portalDetails.accentColor, 
              fontWeight: 700, 
              textDecoration: 'none' 
            }}
          >
            {portalDetails.switchLinkText}
          </a>
        </div>
      </div>
    </div>
  );
}
