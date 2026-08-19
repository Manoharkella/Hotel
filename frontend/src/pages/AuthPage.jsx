import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function AuthPage() {
  const { addToast } = useToast();
  const [role, setRole] = useState('customer'); // 'customer', 'hotel', 'admin'
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // Hotel specific state
  const [step, setStep] = useState(1);
  const [location, setLocation] = useState('');
  const [address, setAddress] = useState('');
  const [rooms, setRooms] = useState([{ room_type: 'Single', quantity: 10, price_per_night: 2000 }]);
  const [photos, setPhotos] = useState(['https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2000&auto=format&fit=crop']);

  const { login, signup } = useAuth();
  const { addMockHotel } = useApp();
  const navigate = useNavigate();

  const handleAddRoom = () => setRooms([...rooms, { room_type: 'Deluxe', quantity: 5, price_per_night: 4000 }]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!isLogin && role === 'hotel' && step === 1) {
      if (!name || !email || !password || !location || !address) { setError('Please fill all basic details including exact address.'); return; }
      setStep(2);
      return;
    }

    if (!email || !password) { setError('Please provide your credentials.'); return; }
    if (!isLogin && !name && role !== 'admin') { setError('Please enter your name.'); return; }
    
    try {
      let user;
      if (isLogin || role === 'admin') {
        if (role === 'hotel') {
          // Use real backend login for hotel to check approval status
          const hotelData = await api.loginHotel(email, password);
          // Sync with mock auth so context knows about it
          user = login(email, password, role, hotelData.user);
          user.hotelId = hotelData.user.id.toString(); // Override with real DB id
          user.name = hotelData.user.name;
        } else if (role === 'customer') {
          const userData = await api.loginUser(email, password);
          user = login(email, password, role, userData.user);
        } else {
          user = login(email, password, role);
        }
      } else {
        if (role === 'hotel') {
          console.log("Hotel Registration Data:", { name, location, address, email, password, photos, rooms });
          await api.registerHotel({ name, location, address, email, password, photos, rooms });
          addToast('Hotel registered successfully! Waiting for admin approval.', 'success');
          // STOP HERE: Do not log them in automatically. Send them back to login.
          setIsLogin(true);
          setStep(1);
          return; 
        } else {
          // customer
          const newUser = await api.registerUser({ full_name: name, email, password, role });
          user = signup(name, email, password, role, newUser);
        }
      }
      
      if (user.role === 'customer') navigate('/customer');
      else if (user.role === 'hotel') navigate('/hotel');
      else navigate('/admin');
    } catch (err) {
      setError(err.message || 'An error occurred during authentication');
    }
  };

  const quickDemo = async (targetRole) => {
    try {
      let user;
      if (targetRole === 'customer') {
        const userData = await api.loginUser('arjun@gmail.com', 'arjun');
        user = login('arjun@gmail.com', 'arjun', 'customer', userData.user);
      }
      else if (targetRole === 'hotel') {
        const hotelData = await api.loginHotel('HYD1@gmail.com', 'HYD1');
        user = login('HYD1@gmail.com', 'HYD1', 'hotel', hotelData.user);
        user.hotelId = hotelData.user.id.toString();
        user.name = hotelData.user.name;
      }
      else {
        user = login('admin@gmail.com', 'admin', 'admin');
      }
      
      if (user.role === 'customer') navigate('/customer');
      else if (user.role === 'hotel') navigate('/hotel');
      else navigate('/admin');
    } catch (err) {
      setError(err.message || 'Failed quick demo login');
    }
  };

  return (
    <div className="auth-layout fade-in">
      {/* Left Image Section */}
      <div className="auth-image">
        <div style={{ position: 'absolute', bottom: 64, left: 64, color: 'white', zIndex: 1 }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '3rem', marginBottom: 16, color: 'white', textShadow: '0 4px 12px rgba(0,0,0,0.4)' }}>
            Elevate Your Experience.
          </h2>
          <p style={{ maxWidth: 400, opacity: 0.9, fontSize: '1.1rem', lineHeight: 1.6 }}>
            Join a curated collection of premium stays. Connect seamlessly, book effortlessly.
          </p>
        </div>
      </div>

      {/* Right Content Section */}
      <div className="auth-content">
        <div style={{ width: '100%', maxWidth: 420, margin: '0 auto' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48, justifyContent: 'center' }}>
            <span style={{ fontSize: '1.8rem' }}>🏨</span>
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', fontWeight: 500, letterSpacing: '0.02em' }}>
              Hotel<span style={{ fontStyle: 'italic', color: 'var(--accent)' }}>Lead</span>
            </span>
          </div>

          <div style={{ marginBottom: 40, textAlign: 'center' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: 8 }}>
              {role === 'customer' ? 'Welcome Back' : role === 'hotel' ? 'Partner Portal' : 'System Admin'}
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              {isLogin ? 'Sign in to your account to continue.' : 'Create an account to begin your journey.'}
            </p>
          </div>

          {/* Role Selector (Minimalist) */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 32 }}>
            {['customer', 'hotel', 'admin'].map(r => (
              <button
                key={r}
                onClick={() => { setRole(r); setIsLogin(true); setError(''); setStep(1); }}
                style={{
                  flex: 1, padding: '12px 0', border: 'none', background: 'transparent',
                  borderBottom: `2px solid ${role === r ? 'var(--primary)' : 'var(--border)'}`,
                  color: role === r ? 'var(--primary)' : 'var(--text-muted)',
                  fontFamily: 'var(--font-sans)', fontSize: '0.8rem', fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer',
                  transition: 'var(--transition)'
                }}
              >
                {r}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="fade-up">
            {(!isLogin && role === 'hotel' && step === 2) ? (
              <div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: 16 }}>Room Inventory</h3>
                {rooms.map((r, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    <select className="form-input" style={{ flex: 2 }} value={r.room_type} onChange={e => { const newRooms = [...rooms]; newRooms[i].room_type = e.target.value; setRooms(newRooms); }}>
                      <option value="Single">Single</option>
                      <option value="Deluxe">Deluxe</option>
                      <option value="Suite">Suite</option>
                    </select>
                    <input className="form-input" type="number" placeholder="Qty" style={{ flex: 1 }} value={r.quantity} onChange={e => { const newRooms = [...rooms]; newRooms[i].quantity = Number(e.target.value); setRooms(newRooms); }} />
                    <input className="form-input" type="number" placeholder="Price" style={{ flex: 1 }} value={r.price_per_night} onChange={e => { const newRooms = [...rooms]; newRooms[i].price_per_night = Number(e.target.value); setRooms(newRooms); }} />
                  </div>
                ))}
                <button type="button" className="btn btn-outline btn-sm mb-3" onClick={handleAddRoom}>+ Add Room Type</button>

                <h3 style={{ fontSize: '1.2rem', marginBottom: 16, marginTop: 16 }}>Property Photos</h3>
                <div className="form-group">
                  <input className="form-input" placeholder="Photo URL" value={photos[0]} onChange={e => setPhotos([e.target.value])} />
                </div>
                
                <div style={{ display: 'flex', gap: 16, marginTop: 24 }}>
                  <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setStep(1)}>Back</button>
                  <button className="btn btn-primary" type="submit" style={{ flex: 2 }}>Complete Registration</button>
                </div>
              </div>
            ) : (
              <>
                {!isLogin && role !== 'admin' && (
                  <div className="form-group">
                    <label className="form-label">{role === 'hotel' ? 'Hotel Name' : 'Full Name'}</label>
                    <input className="form-input" placeholder={role === 'hotel' ? 'e.g. The Grand Palace' : 'e.g. John Doe'} value={name} onChange={e => setName(e.target.value)} />
                  </div>
                )}
                {!isLogin && role === 'hotel' && (
                  <>
                    <div className="form-group">
                      <label className="form-label">City / Location</label>
                      <input className="form-input" placeholder="e.g. Goa, India" value={location} onChange={e => setLocation(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Exact Street Address</label>
                      <input className="form-input" placeholder="e.g. 123 Beach Road, North Goa" value={address} onChange={e => setAddress(e.target.value)} />
                    </div>
                  </>
                )}
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input className="form-input" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <div className="flex-between" style={{ marginBottom: 8 }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>Password</label>
                    {isLogin && <a href="#" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textDecoration: 'none' }}>Forgot password?</a>}
                  </div>
                  <input className="form-input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
                </div>
                
                {error && <p style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: 16 }}>{error}</p>}
                
                <button className="btn btn-primary btn-block btn-lg" type="submit" style={{ marginTop: 24 }}>
                  {isLogin || role === 'admin' ? 'Sign In' : (role === 'hotel' ? 'Next: Add Rooms' : 'Create Account')}
                </button>
              </>
            )}
          </form>

          {role !== 'admin' && (
            <div style={{ textAlign: 'center', marginTop: 24, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button onClick={() => setIsLogin(!isLogin)} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </div>
          )}

          {/* Quick Demo Links */}
          <div style={{ marginTop: 64, paddingTop: 32, borderTop: '1px solid var(--border-light)', textAlign: 'center' }}>
            <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 16 }}>Quick Demo Access</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button className="btn btn-outline btn-sm" onClick={() => quickDemo('customer')}>Traveler</button>
              <button className="btn btn-outline btn-sm" onClick={() => quickDemo('hotel')}>Manager</button>
              <button className="btn btn-outline btn-sm" onClick={() => quickDemo('admin')}>Admin</button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
