import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Award, 
  ShieldCheck, 
  Bell, 
  Check, 
  Sparkles, 
  LogOut, 
  Gift, 
  Compass, 
  ChevronRight, 
  Heart, 
  Calendar, 
  CreditCard, 
  Lock, 
  Sliders, 
  Bed, 
  CheckCircle2,
  QrCode,
  ArrowRight
} from 'lucide-react';

export default function CustomerProfile() {
  const { user, updateProfile, logout } = useAuth();
  const { wishlist } = useApp();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('personal'); // 'personal' | 'preferences' | 'security'
  const [isClaimed, setIsClaimed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Personal Info Form State
  const [personalForm, setPersonalForm] = useState({
    name: user?.name || 'Arjun Kumar',
    email: user?.email || 'arjun@gmail.com',
    phone: user?.phone || '+91 98765 43210',
    city: user?.city || 'Hyderabad, India',
    emergencyContact: user?.emergencyContact || '+91 98765 00000',
    bio: user?.bio || 'Frequent leisure & business traveler exploring luxury stays.'
  });

  // Travel Preferences Form State
  const [prefForm, setPrefForm] = useState({
    roomType: user?.preferences?.roomType || 'Deluxe',
    bedType: user?.preferences?.bedType || 'King Size Bed',
    purpose: user?.preferences?.purpose || 'Leisure',
    dietary: user?.preferences?.dietary || 'Complimentary Breakfast Included',
    specialRequests: user?.preferences?.specialRequests || 'High floor, quiet room away from elevator.'
  });

  // Security & Notifications Form State
  const [securityForm, setSecurityForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    smsNotifications: true,
    emailAlerts: true,
    bidAlerts: true
  });

  const handleSavePersonal = (e) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      updateProfile({
        name: personalForm.name,
        email: personalForm.email,
        phone: personalForm.phone,
        city: personalForm.city,
        emergencyContact: personalForm.emergencyContact,
        bio: personalForm.bio
      });
      setIsSaving(false);
      addToast('Personal information updated successfully!', 'success');
    }, 400);
  };

  const handleSavePreferences = (e) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      updateProfile({
        preferences: { ...prefForm }
      });
      setIsSaving(false);
      addToast('Travel preferences saved for all future bookings!', 'success');
    }, 400);
  };

  const handleUpdatePassword = (e) => {
    e.preventDefault();
    if (!securityForm.newPassword) {
      addToast('Please enter a new password', 'error');
      return;
    }
    if (securityForm.newPassword !== securityForm.confirmPassword) {
      addToast('New passwords do not match', 'error');
      return;
    }
    addToast('Security credentials updated successfully!', 'success');
    setSecurityForm({ ...securityForm, currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const handleClaimVoucher = () => {
    setIsClaimed(true);
    addToast('🎉 Voucher code "HOSTIQ500" claimed! ₹500 discount automatically ready for your next stay.', 'success');
  };

  const initial = (personalForm.name || user?.name || 'A')[0]?.toUpperCase();
  const loyaltyPoints = user?.loyalty_points || 500;

  return (
    <div className="fade-in" style={{ maxWidth: 1240, margin: '0 auto', padding: '24px 20px 80px' }}>
      
      {/* 1. LUXURY HEADER & PROFILE SHOWCASE BANNER */}
      <div style={{
        background: 'linear-gradient(135deg, #0F0F0F 0%, #1e1e1e 60%, #2a251e 100%)',
        borderRadius: 24,
        padding: '32px 36px',
        color: 'white',
        marginBottom: 28,
        boxShadow: '0 15px 40px rgba(0,0,0,0.12)',
        border: '1px solid rgba(212, 175, 55, 0.25)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative Gold Ambient Glow */}
        <div style={{
          position: 'absolute',
          top: -60,
          right: -60,
          width: 220,
          height: 220,
          background: 'radial-gradient(circle, rgba(212, 175, 55, 0.2) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>
          
          {/* Avatar & User Details */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{
              width: 84,
              height: 84,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #D4AF37 0%, #AA8C2C 100%)',
              color: '#0F0F0F',
              fontSize: '2.2rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(212, 175, 55, 0.35)',
              border: '3px solid rgba(255, 255, 255, 0.2)',
              position: 'relative',
              flexShrink: 0
            }}>
              {initial}
              <div style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: '#10B981',
                border: '3px solid #0F0F0F'
              }} title="Online" />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0, color: 'white', fontFamily: 'var(--font-serif)', fontSize: '1.9rem', letterSpacing: '-0.01em' }}>
                  {personalForm.name}
                </h2>
                <span style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#34D399',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  padding: '3px 10px',
                  borderRadius: 9999,
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4
                }}>
                  <ShieldCheck size={12} /> Verified Traveler
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8, color: 'rgba(255,255,255,0.75)', fontSize: '0.86rem', flexWrap: 'wrap' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Mail size={14} color="#D4AF37" /> {personalForm.email}
                </span>
                <span>•</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Phone size={14} color="#D4AF37" /> {personalForm.phone}
                </span>
                <span>•</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <MapPin size={14} color="#D4AF37" /> {personalForm.city}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Summary Pill Badges */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.07)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: 16,
              padding: '10px 18px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                Loyalty Tier
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#D4AF37', marginTop: 2 }}>
                ⭐ Gold Member
              </div>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.07)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: 16,
              padding: '10px 18px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                Saved Stays
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#F43F5E', marginTop: 2 }}>
                ❤️ {wishlist?.length || 0} Wishlist
              </div>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.07)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: 16,
              padding: '10px 18px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                QR Mobile Pass
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#34D399', marginTop: 2 }}>
                ✓ Active
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 2. DASHBOARD MAIN GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 24, alignItems: 'start' }}>
        
        {/* LEFT COLUMN: DIGITAL MEMBERSHIP PASS & REWARDS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Virtual Metal Membership Card */}
          <div style={{
            background: 'linear-gradient(135deg, #18181b 0%, #09090b 100%)',
            borderRadius: 20,
            padding: '24px',
            color: 'white',
            boxShadow: '0 12px 30px rgba(0,0,0,0.15)',
            border: '1px solid rgba(212, 175, 55, 0.3)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Card Texture Glow */}
            <div style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: 160,
              height: 160,
              background: 'radial-gradient(circle, rgba(212, 175, 55, 0.15) 0%, transparent 70%)',
              pointerEvents: 'none'
            }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 700, letterSpacing: '0.05em', color: 'white' }}>
                Host<span style={{ color: '#D4AF37' }}>IQ</span> <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#D4AF37', border: '1px solid #D4AF37', borderRadius: 6, padding: '1px 6px', marginLeft: 4 }}>ELITE</span>
              </span>
              <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', letterSpacing: '0.1em' }}>
                (( · )) NFC CHECK-IN
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              {/* Chip Icon */}
              <div style={{
                width: 38,
                height: 28,
                background: 'linear-gradient(135deg, #fbbf24 0%, #b45309 100%)',
                borderRadius: 5,
                border: '1px solid #fde68a'
              }} />
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', letterSpacing: '0.15em' }}>
                MEMBER ID: HIQ-8829-2026
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block' }}>
                  Cardholder
                </span>
                <strong style={{ fontSize: '1rem', color: 'white', letterSpacing: '0.05em' }}>
                  {personalForm.name.toUpperCase()}
                </strong>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block' }}>
                  Balance
                </span>
                <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#D4AF37' }}>
                  {loyaltyPoints} PTS
                </span>
              </div>
            </div>
          </div>

          {/* Loyalty Rewards & Voucher Perks Card */}
          <div style={{
            background: 'white',
            borderRadius: 20,
            border: '1px solid var(--border)',
            padding: '24px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Gift size={18} color="var(--accent)" />
                <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>HostIQ Rewards Tier</h4>
              </div>
              <span style={{ background: '#FEF3C7', color: '#92400E', padding: '3px 10px', borderRadius: 9999, fontSize: '0.75rem', fontWeight: 800 }}>
                Gold Tier
              </span>
            </div>

            {/* Progress to Platinum */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                <span>Progress to Platinum Tier</span>
                <strong>{loyaltyPoints} / 1,000 PTS</strong>
              </div>
              <div style={{ width: '100%', height: 7, background: 'var(--bg)', borderRadius: 9999, overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, (loyaltyPoints / 1000) * 100)}%`, height: '100%', background: 'linear-gradient(90deg, #D4AF37, #F59E0B)', borderRadius: 9999 }} />
              </div>
            </div>

            {/* Redeemable Stay Voucher Box */}
            <div style={{
              background: '#FFFBEB',
              border: '1px solid #FDE68A',
              borderRadius: 14,
              padding: '16px',
              marginBottom: 16
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div>
                  <strong style={{ fontSize: '0.92rem', color: '#78350F' }}>₹500 Instant Stay Voucher</strong>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: '#92400E' }}>Redeem 500 Loyalty Points</span>
                </div>
                <div style={{ background: '#D97706', color: 'white', padding: '2px 8px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 800 }}>
                  Active
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                {isClaimed ? (
                  <div style={{
                    width: '100%',
                    background: '#ECFDF5',
                    border: '1px solid #A7F3D0',
                    color: '#065F46',
                    padding: '8px 12px',
                    borderRadius: 10,
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    textAlign: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6
                  }}>
                    <Check size={16} /> Code: <strong>HOSTIQ500</strong> (Ready at checkout)
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleClaimVoucher}
                    className="btn btn-sm btn-block"
                    style={{ background: '#D97706', color: 'white', fontWeight: 700, fontSize: '0.82rem', height: 36 }}
                  >
                    ⚡ Claim ₹500 Voucher
                  </button>
                )}
              </div>
            </div>

            {/* Tier Benefits */}
            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 14 }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: 8, letterSpacing: '0.05em' }}>
                Your Gold Member Privileges:
              </span>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2 size={15} color="#10B981" /> Complimentary Room Upgrades (When Available)
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2 size={15} color="#10B981" /> Express Contactless QR Check-In
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2 size={15} color="#10B981" /> Late Check-Out until 12:00 PM
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2 size={15} color="#10B981" /> Priority Access to Reverse-Bidding Deals
                </li>
              </ul>
            </div>
          </div>

          {/* Quick Navigation Cards */}
          <div style={{
            background: 'white',
            borderRadius: 20,
            border: '1px solid var(--border)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            boxShadow: 'var(--shadow-sm)'
          }}>
            <button
              onClick={() => navigate('/customer/trips')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderRadius: 12,
                border: '1px solid var(--border-light)',
                background: 'var(--bg)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                textAlign: 'left'
              }}
              onMouseOver={e => e.currentTarget.style.borderColor = 'var(--primary)'}
              onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border-light)'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Calendar size={18} color="var(--primary)" />
                <div>
                  <strong style={{ fontSize: '0.88rem', color: 'var(--text)', display: 'block' }}>My Trips & Bookings</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>View confirmed stays & QR passes</span>
                </div>
              </div>
              <ChevronRight size={16} color="var(--text-muted)" />
            </button>

            <button
              onClick={() => navigate('/customer/wishlist')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderRadius: 12,
                border: '1px solid var(--border-light)',
                background: 'var(--bg)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                textAlign: 'left'
              }}
              onMouseOver={e => e.currentTarget.style.borderColor = '#F43F5E'}
              onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border-light)'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Heart size={18} color="#F43F5E" />
                <div>
                  <strong style={{ fontSize: '0.88rem', color: 'var(--text)', display: 'block' }}>Saved Properties</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{wishlist?.length || 0} hotels in your wishlist</span>
                </div>
              </div>
              <ChevronRight size={16} color="var(--text-muted)" />
            </button>

            <button
              onClick={() => {
                logout();
                addToast('Signed out successfully. See you soon!', 'info');
                navigate('/customer_login');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '12px 16px',
                borderRadius: 12,
                border: '1px solid #FEE2E2',
                background: '#FEF2F2',
                color: '#B91C1C',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                marginTop: 4
              }}
            >
              <LogOut size={16} color="#B91C1C" />
              <span>Sign Out of HostIQ</span>
            </button>
          </div>

        </div>

        {/* RIGHT COLUMN: TABBED MANAGEMENT CONSOLE */}
        <div style={{
          background: 'white',
          borderRadius: 24,
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-sm)',
          overflow: 'hidden'
        }}>
          
          {/* Tabs Navigation Header */}
          <div style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-light)',
            background: 'var(--bg)',
            padding: '6px 12px 0',
            gap: 8,
            overflowX: 'auto'
          }}>
            <button
              type="button"
              onClick={() => setActiveTab('personal')}
              style={{
                padding: '12px 20px',
                border: 'none',
                background: activeTab === 'personal' ? 'white' : 'transparent',
                borderTopLeftRadius: 12,
                borderTopRightRadius: 12,
                borderBottom: activeTab === 'personal' ? '2px solid var(--primary)' : '2px solid transparent',
                fontWeight: activeTab === 'personal' ? 800 : 600,
                fontSize: '0.88rem',
                color: activeTab === 'personal' ? 'var(--primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                transition: 'all 0.2s'
              }}
            >
              <User size={16} /> Personal Details
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('preferences')}
              style={{
                padding: '12px 20px',
                border: 'none',
                background: activeTab === 'preferences' ? 'white' : 'transparent',
                borderTopLeftRadius: 12,
                borderTopRightRadius: 12,
                borderBottom: activeTab === 'preferences' ? '2px solid var(--primary)' : '2px solid transparent',
                fontWeight: activeTab === 'preferences' ? 800 : 600,
                fontSize: '0.88rem',
                color: activeTab === 'preferences' ? 'var(--primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                transition: 'all 0.2s'
              }}
            >
              <Bed size={16} /> Stay Preferences
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('security')}
              style={{
                padding: '12px 20px',
                border: 'none',
                background: activeTab === 'security' ? 'white' : 'transparent',
                borderTopLeftRadius: 12,
                borderTopRightRadius: 12,
                borderBottom: activeTab === 'security' ? '2px solid var(--primary)' : '2px solid transparent',
                fontWeight: activeTab === 'security' ? 800 : 600,
                fontSize: '0.88rem',
                color: activeTab === 'security' ? 'var(--primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                transition: 'all 0.2s'
              }}
            >
              <Lock size={16} /> Security & Alerts
            </button>
          </div>

          {/* Tab 1: Personal Details */}
          {activeTab === 'personal' && (
            <div className="fade-in" style={{ padding: '28px 32px' }}>
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontFamily: 'var(--font-serif)', color: 'var(--text)' }}>
                  Personal Information
                </h3>
                <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  Update your contact info used for hotel bookings, SMS check-in passes, and guest verification.
                </p>
              </div>

              <form onSubmit={handleSavePersonal}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 18 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 700 }}>
                      Full Name
                    </label>
                    <input 
                      className="form-input" 
                      value={personalForm.name} 
                      onChange={e => setPersonalForm({ ...personalForm, name: e.target.value })} 
                      required 
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 700 }}>
                      Email Address <span style={{ color: '#10B981', fontSize: '0.75rem' }}>(Verified ✓)</span>
                    </label>
                    <input 
                      className="form-input" 
                      type="email" 
                      value={personalForm.email} 
                      onChange={e => setPersonalForm({ ...personalForm, email: e.target.value })} 
                      required 
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 18 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 700 }}>
                      Primary Mobile Phone
                    </label>
                    <input 
                      className="form-input" 
                      type="tel" 
                      value={personalForm.phone} 
                      onChange={e => setPersonalForm({ ...personalForm, phone: e.target.value })} 
                      required 
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 700 }}>
                      Emergency / Alternate Contact
                    </label>
                    <input 
                      className="form-input" 
                      type="tel" 
                      value={personalForm.emergencyContact} 
                      onChange={e => setPersonalForm({ ...personalForm, emergencyContact: e.target.value })} 
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 18 }}>
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 700 }}>
                    Home City & Country
                  </label>
                  <input 
                    className="form-input" 
                    value={personalForm.city} 
                    onChange={e => setPersonalForm({ ...personalForm, city: e.target.value })} 
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 28 }}>
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 700 }}>
                    About Traveler (Guest Notes)
                  </label>
                  <textarea 
                    className="form-textarea" 
                    rows={3} 
                    value={personalForm.bio} 
                    onChange={e => setPersonalForm({ ...personalForm, bio: e.target.value })} 
                    style={{ fontSize: '0.85rem' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button 
                    className="btn btn-primary" 
                    type="submit" 
                    disabled={isSaving}
                    style={{ minWidth: 180, height: 46 }}
                  >
                    {isSaving ? 'Saving Changes...' : 'Save Profile Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Tab 2: Travel Preferences */}
          {activeTab === 'preferences' && (
            <div className="fade-in" style={{ padding: '28px 32px' }}>
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontFamily: 'var(--font-serif)', color: 'var(--text)' }}>
                  Stay & Travel Preferences
                </h3>
                <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  Customize your default room preferences. Participating hotels will tailor room preparations to match your desires.
                </p>
              </div>

              <form onSubmit={handleSavePreferences}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 18 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 700 }}>
                      Preferred Room Tier
                    </label>
                    <select 
                      className="form-select"
                      value={prefForm.roomType}
                      onChange={e => setPrefForm({ ...prefForm, roomType: e.target.value })}
                    >
                      <option value="Deluxe">Deluxe Room</option>
                      <option value="Executive">Executive Club Suite</option>
                      <option value="Suite">Presidential Suite</option>
                      <option value="Standard">Standard King</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 700 }}>
                      Bed Preference
                    </label>
                    <select 
                      className="form-select"
                      value={prefForm.bedType}
                      onChange={e => setPrefForm({ ...prefForm, bedType: e.target.value })}
                    >
                      <option value="King Size Bed">1 King Size Bed</option>
                      <option value="Twin Beds">2 Twin Beds</option>
                      <option value="Queen Bed">1 Queen Bed</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 18 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 700 }}>
                      Primary Purpose of Visit
                    </label>
                    <select 
                      className="form-select"
                      value={prefForm.purpose}
                      onChange={e => setPrefForm({ ...prefForm, purpose: e.target.value })}
                    >
                      <option value="Leisure">Leisure & Vacation</option>
                      <option value="Business">Business & Corporate</option>
                      <option value="Honeymoon">Romantic / Honeymoon</option>
                      <option value="Family">Family Vacation</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 700 }}>
                      Dining & Breakfast
                    </label>
                    <select 
                      className="form-select"
                      value={prefForm.dietary}
                      onChange={e => setPrefForm({ ...prefForm, dietary: e.target.value })}
                    >
                      <option value="Complimentary Breakfast Included">Complimentary Breakfast Included</option>
                      <option value="Vegetarian Buffet">Pure Vegetarian Buffet</option>
                      <option value="Continental">Continental / European</option>
                      <option value="No Preference">No Specific Preference</option>
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 28 }}>
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 700 }}>
                    Default Room Requests & Amenities
                  </label>
                  <textarea 
                    className="form-textarea" 
                    rows={3} 
                    value={prefForm.specialRequests} 
                    onChange={e => setPrefForm({ ...prefForm, specialRequests: e.target.value })} 
                    placeholder="e.g. High floor, quiet room away from elevator, extra pillows, sea view..."
                    style={{ fontSize: '0.85rem' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button 
                    className="btn btn-primary" 
                    type="submit" 
                    disabled={isSaving}
                    style={{ minWidth: 200, height: 46 }}
                  >
                    {isSaving ? 'Updating...' : 'Save Travel Preferences'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Tab 3: Security & Notification Alerts */}
          {activeTab === 'security' && (
            <div className="fade-in" style={{ padding: '28px 32px' }}>
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontFamily: 'var(--font-serif)', color: 'var(--text)' }}>
                  Security & Notifications
                </h3>
                <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  Manage login credentials and instant communication channels for stay counter-offers and QR passes.
                </p>
              </div>

              {/* Notification Toggles */}
              <div style={{ background: 'var(--bg)', borderRadius: 16, padding: '20px', border: '1px solid var(--border-light)', marginBottom: 28 }}>
                <h4 style={{ margin: '0 0 14px', fontSize: '0.95rem', fontWeight: 700 }}>
                  🔔 Communication Channels
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                    <div>
                      <strong style={{ fontSize: '0.88rem', color: 'var(--text)', display: 'block' }}>SMS Booking & QR Check-In Passes</strong>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Receive your instant check-in pass link directly on mobile</span>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={securityForm.smsNotifications} 
                      onChange={e => setSecurityForm({ ...securityForm, smsNotifications: e.target.checked })} 
                      style={{ width: 18, height: 18, accentColor: 'var(--primary)' }}
                    />
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                    <div>
                      <strong style={{ fontSize: '0.88rem', color: 'var(--text)', display: 'block' }}>Reverse Bidding & Counter-Offer Alerts</strong>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Get notified when partner hotels send custom discount bids</span>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={securityForm.bidAlerts} 
                      onChange={e => setSecurityForm({ ...securityForm, bidAlerts: e.target.checked })} 
                      style={{ width: 18, height: 18, accentColor: 'var(--primary)' }}
                    />
                  </label>
                </div>
              </div>

              {/* Change Password Form */}
              <form onSubmit={handleUpdatePassword}>
                <h4 style={{ margin: '0 0 14px', fontSize: '0.95rem', fontWeight: 700 }}>
                  🔒 Change Password
                </h4>

                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 700 }}>Current Password</label>
                  <input 
                    className="form-input" 
                    type="password" 
                    placeholder="Enter existing password" 
                    value={securityForm.currentPassword}
                    onChange={e => setSecurityForm({ ...securityForm, currentPassword: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 700 }}>New Password</label>
                    <input 
                      className="form-input" 
                      type="password" 
                      placeholder="Minimum 8 characters" 
                      value={securityForm.newPassword}
                      onChange={e => setSecurityForm({ ...securityForm, newPassword: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 700 }}>Confirm New Password</label>
                    <input 
                      className="form-input" 
                      type="password" 
                      placeholder="Re-type new password" 
                      value={securityForm.confirmPassword}
                      onChange={e => setSecurityForm({ ...securityForm, confirmPassword: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button 
                    className="btn btn-primary" 
                    type="submit"
                    style={{ minWidth: 180, height: 46 }}
                  >
                    Update Password
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
