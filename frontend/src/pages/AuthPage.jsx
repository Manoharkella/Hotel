import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import HotelLogo from '../components/HotelLogo';
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
  
  // Check if ?mode=signup or ?signup=true in URL
  const queryParams = new URLSearchParams(routerLocation.search);
  const isSignupQuery = queryParams.get('mode') === 'signup' || queryParams.get('signup') === 'true';
  const [isLogin, setIsLogin] = useState(!isSignupQuery);

  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [error, setError] = useState('');

  // Hotel registration specific state
  const [step, setStep] = useState(1);
  const [location, setLocation] = useState('');
  const [address, setAddress] = useState('');
  const [rooms, setRooms] = useState([{ room_type: 'Single', quantity: 10, price_per_night: 2000 }]);
  const [photos, setPhotos] = useState(['https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2000&auto=format&fit=crop']);

  // Sync role and signup mode when URL route changes
  useEffect(() => {
    const current = getRoleFromPath();
    setRole(current);
    const qp = new URLSearchParams(routerLocation.search);
    const wantsSignup = qp.get('mode') === 'signup' || qp.get('signup') === 'true';
    setIsLogin(!wantsSignup);
    setError('');
    setStep(1);
  }, [routerLocation.pathname, routerLocation.search, initialRole]);

  const handleAddRoom = () => setRooms([...rooms, { room_type: 'Deluxe', quantity: 5, price_per_night: 4000 }]);

  // Social login mock handler for Google & Microsoft
  const handleSocialLogin = (provider) => {
    setIsLoading(true);
    setTimeout(() => {
      const mockEmail = `${provider.toLowerCase()}.user@example.com`;
      const mockName = `${provider} Traveler`;
      try {
        const loggedUser = signup(mockName, mockEmail, 'password123', 'customer', {
          id: Date.now(),
          full_name: mockName,
          email: mockEmail,
          role: 'customer'
        });
        addToast(`Signed in with ${provider} successfully!`, 'success');
        navigate('/customer');
      } catch (err) {
        setError(`Failed to sign in with ${provider}.`);
      } finally {
        setIsLoading(false);
      }
    }, 600);
  };

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
      return; 
    }
    if (!password) { 
      setError('Please enter your password.'); 
      return; 
    }
    if (!isLogin && !name.trim() && role !== 'admin') { 
      setError('Please enter your full name.'); 
      return; 
    }
    if (!isLogin && role === 'customer' && !agreeTerms) {
      setError('Please agree to the Terms & Conditions and Privacy Policy.');
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

  // Banner Content based on Role & Auth Mode
  const bannerImage = isLogin 
    ? 'https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=1200&auto=format&fit=crop'
    : 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=1200&auto=format&fit=crop';

  return (
    <div className={`auth-layout ${role}`}>
      <div className="auth-overlay" />

      {/* 2-Column Split Authentication Card */}
      <div className="auth-split-card">
        {/* Left Photo Column */}
        <div 
          className="auth-split-banner"
          style={{ backgroundImage: `url(${bannerImage})` }}
        >
          {/* Top Banner Text */}
          <div className="auth-banner-top">
            {role === 'customer' ? (
              isLogin ? (
                <>
                  <h2 className="auth-banner-heading">Good to<br />See You Again</h2>
                  <p className="auth-banner-sub">Continue your journey with HotelIQ</p>
                </>
              ) : (
                <>
                  <h2 className="auth-banner-heading">Join HotelIQ</h2>
                  <p className="auth-banner-sub">Be part of a smarter way to travel</p>
                </>
              )
            ) : role === 'hotel' ? (
              <>
                <h2 className="auth-banner-heading">Hotel Partner<br />Portal</h2>
                <p className="auth-banner-sub">Receive guest leads and optimize occupancy</p>
              </>
            ) : (
              <>
                <h2 className="auth-banner-heading">Administrator<br />Command</h2>
                <p className="auth-banner-sub">Secure platform governance & analytics</p>
              </>
            )}
          </div>

          {/* Bottom Banner Quote or Taglines */}
          <div className="auth-banner-bottom">
            {role === 'customer' ? (
              isLogin ? (
                <div className="auth-banner-quote">
                  "Better Stays<br />Create Brighter Journeys"
                </div>
              ) : (
                <div className="auth-banner-taglines">
                  <span className="auth-banner-tagline-item">Explore.</span>
                  <span className="auth-banner-tagline-item">Negotiate.</span>
                  <span className="auth-banner-tagline-item">Book.</span>
                  <span className="auth-banner-tagline-item">Experience More.</span>
                </div>
              )
            ) : (
              <div className="auth-banner-quote">
                Empowering India's finest hospitality networks with live bidding intelligence.
              </div>
            )}
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="auth-split-panel">
          {/* Header with Logo, Title & Subtitle */}
          <div className="auth-form-header">
            <HotelLogo size="default" />
            <h1 className="auth-form-title">
              {role === 'customer' 
                ? (isLogin ? 'Welcome Back' : 'Create an Account') 
                : role === 'hotel' 
                ? (isLogin ? 'Hotel Partner Sign In' : 'Register Your Hotel') 
                : 'Administrator Sign In'}
            </h1>
            <p className="auth-form-subtitle">
              {role === 'customer' 
                ? (isLogin ? 'Sign in to explore stays and negotiate live rates' : 'Sign up to start your journey with HotelIQ') 
                : role === 'hotel' 
                ? (isLogin ? 'Access your leads, guest passes, and bookings' : 'List your property to receive live traveler booking requests') 
                : 'Enter your administrator credentials to proceed'}
            </p>
          </div>

          {/* Error message alert */}
          {error && (
            <div style={{
              background: '#FEF2F2',
              border: '1px solid #FCA5A5',
              color: '#B91C1C',
              borderRadius: 10,
              padding: '10px 14px',
              fontSize: '0.82rem',
              marginBottom: 16,
              fontWeight: 500,
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          {/* Form Content */}
          <form onSubmit={handleSubmit}>
            {/* Hotel Multi-step Registration Step 2: Room Inventory */}
            {!isLogin && role === 'hotel' && step === 2 ? (
              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 10px', color: '#0F172A' }}>Room Types</h3>
                {rooms.map((r, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                    <select 
                      className="auth-input-field" 
                      style={{ flex: 2, padding: '9px 12px' }} 
                      value={r.room_type} 
                      onChange={e => { const newRooms = [...rooms]; newRooms[i].room_type = e.target.value; setRooms(newRooms); }}
                    >
                      <option value="Single">Single</option>
                      <option value="Deluxe">Deluxe</option>
                      <option value="Suite">Suite</option>
                    </select>
                    <input 
                      className="auth-input-field" 
                      type="number" 
                      placeholder="Qty" 
                      style={{ flex: 1, padding: '9px 12px' }} 
                      value={r.quantity} 
                      onChange={e => { const newRooms = [...rooms]; newRooms[i].quantity = Number(e.target.value); setRooms(newRooms); }} 
                    />
                    <input 
                      className="auth-input-field" 
                      type="number" 
                      placeholder="₹ Rate" 
                      style={{ flex: 1, padding: '9px 12px' }} 
                      value={r.price_per_night} 
                      onChange={e => { const newRooms = [...rooms]; newRooms[i].price_per_night = Number(e.target.value); setRooms(newRooms); }} 
                    />
                  </div>
                ))}
                <button 
                  type="button" 
                  onClick={handleAddRoom}
                  style={{
                    background: 'none', border: '1px dashed #CBD5E1', borderRadius: 8, padding: '6px 12px',
                    fontSize: '0.78rem', color: '#EA580C', fontWeight: 600, cursor: 'pointer', marginBottom: 14, width: '100%'
                  }}
                >
                  + Add Another Room Type
                </button>

                <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                  <button 
                    type="button" 
                    onClick={() => setStep(1)}
                    style={{ flex: 1, padding: '12px', background: '#F1F5F9', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}
                  >
                    Back
                  </button>
                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className="auth-submit-btn" 
                    style={{ flex: 2 }}
                  >
                    {isLoading ? 'Registering...' : 'Complete Registration'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Full Name / Property Name (When creating account) */}
                {!isLogin && (
                  <div className="auth-input-group">
                    <label className="auth-input-label">
                      {role === 'hotel' ? 'Property Name' : 'Full Name'}
                    </label>
                    <div className="auth-input-wrap">
                      <div className="auth-input-icon">
                        {role === 'hotel' ? <Building size={18} /> : <User size={18} />}
                      </div>
                      <input 
                        type="text"
                        className="auth-input-field"
                        placeholder={role === 'hotel' ? 'e.g. The Grand Palace Resort' : 'Enter your full name'}
                        value={name}
                        onChange={(e) => { setName(e.target.value); setError(''); }}
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Hotel Location & Address (Sign up only) */}
                {!isLogin && role === 'hotel' && (
                  <>
                    <div className="auth-input-group">
                      <label className="auth-input-label">City / Destination</label>
                      <div className="auth-input-wrap">
                        <div className="auth-input-icon"><MapPin size={18} /></div>
                        <input 
                          type="text" 
                          className="auth-input-field" 
                          placeholder="e.g. Goa, India" 
                          value={location} 
                          onChange={(e) => setLocation(e.target.value)} 
                          required 
                        />
                      </div>
                    </div>
                    <div className="auth-input-group">
                      <label className="auth-input-label">Address</label>
                      <input 
                        type="text" 
                        className="auth-input-field" 
                        style={{ paddingLeft: 14 }}
                        placeholder="e.g. 123 Beach Road, Candolim" 
                        value={address} 
                        onChange={(e) => setAddress(e.target.value)} 
                        required 
                      />
                    </div>
                  </>
                )}

                {/* Email Address */}
                <div className="auth-input-group">
                  <label className="auth-input-label">Email Address</label>
                  <div className="auth-input-wrap">
                    <div className="auth-input-icon">
                      <Mail size={18} />
                    </div>
                    <input 
                      type="email"
                      className="auth-input-field"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(''); }}
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="auth-input-group">
                  <label className="auth-input-label">Password</label>
                  <div className="auth-input-wrap">
                    <div className="auth-input-icon">
                      <Lock size={18} />
                    </div>
                    <input 
                      type={showPassword ? 'text' : 'password'}
                      className="auth-input-field"
                      placeholder={isLogin ? 'Enter your password' : 'Create a password'}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(''); }}
                      required
                    />
                    <button 
                      type="button" 
                      className="auth-toggle-pwd"
                      onClick={() => setShowPassword(!showPassword)}
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Forgot Password Link (Sign In only) */}
                {isLogin && role === 'customer' && (
                  <span 
                    className="auth-forgot-link"
                    onClick={() => addToast('Password reset link sent to your email!', 'info')}
                  >
                    Forgot Password?
                  </span>
                )}

                {/* Terms and Conditions Checkbox (Sign Up only) */}
                {!isLogin && role === 'customer' && (
                  <label className="auth-terms-checkbox">
                    <input 
                      type="checkbox" 
                      checked={agreeTerms} 
                      onChange={(e) => setAgreeTerms(e.target.checked)} 
                    />
                    <span>
                      I agree to the <a href="#terms" onClick={(e) => e.preventDefault()}>Terms & Conditions</a> and <a href="#privacy" onClick={(e) => e.preventDefault()}>Privacy Policy</a>
                    </span>
                  </label>
                )}

                {/* Primary Submit Button */}
                <button 
                  type="submit" 
                  className="auth-submit-btn" 
                  disabled={isLoading}
                >
                  {isLoading ? 'Processing...' : isLogin ? 'Sign In' : role === 'hotel' ? 'Next: Add Rooms' : 'Sign Up'}
                </button>
              </>
            )}
          </form>

          {/* Social Logins (Google & Microsoft) for Customer Auth */}
          {role === 'customer' && (
            <>
              <div className="auth-divider">
                <span>OR CONTINUE WITH</span>
              </div>

              <div className="auth-social-grid">
                {/* Google Button */}
                <button 
                  type="button" 
                  className="auth-social-btn" 
                  onClick={() => handleSocialLogin('Google')}
                  disabled={isLoading}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 8.9 5 12 5z"/>
                    <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"/>
                    <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8s.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z"/>
                    <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.5-2.4-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z"/>
                  </svg>
                  <span>Google</span>
                </button>

                {/* Microsoft Button */}
                <button 
                  type="button" 
                  className="auth-social-btn" 
                  onClick={() => handleSocialLogin('Microsoft')}
                  disabled={isLoading}
                >
                  <svg width="18" height="18" viewBox="0 0 21 21">
                    <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
                    <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
                    <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
                    <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
                  </svg>
                  <span>Microsoft</span>
                </button>
              </div>
            </>
          )}

          {/* Footer Switcher (Sign In <-> Sign Up) */}
          {role !== 'admin' && (
            <div className="auth-footer-switch">
              <span>{isLogin ? "Don't have an account?" : "Already have an account?"}</span>
              <button 
                type="button" 
                className="auth-footer-switch-btn"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                  setStep(1);
                }}
              >
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </div>
          )}

          {/* Portal Switcher (Hotel / Traveler / Admin) */}
          <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid #F1F5F9', textAlign: 'center', fontSize: '0.78rem', color: '#94A3B8' }}>
            {role === 'customer' ? (
              <span>Are you a hotel partner? <a href="/hotel_login" onClick={(e) => { e.preventDefault(); navigate('/hotel_login'); }} style={{ color: '#EA580C', fontWeight: 700, textDecoration: 'none' }}>Hotel Partner Login →</a></span>
            ) : (
              <span>Looking to book a stay? <a href="/customer_login" onClick={(e) => { e.preventDefault(); navigate('/customer_login'); }} style={{ color: '#EA580C', fontWeight: 700, textDecoration: 'none' }}>← Traveler Login</a></span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
