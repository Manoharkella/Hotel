import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import { 
  ShieldCheck, 
  Mail, 
  Phone, 
  MapPin, 
  ChevronRight, 
  Radio, 
  Crown, 
  Gift, 
  Ticket, 
  CheckCircle2, 
  Calendar, 
  Heart, 
  Settings, 
  Shield, 
  LogOut, 
  X,
  Sparkles,
  Check,
  Bed,
  User,
  Bell,
  Lock
} from 'lucide-react';

export default function CustomerProfile() {
  const { user, updateProfile, logout } = useAuth();
  const { wishlist } = useApp();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [isVoucherClaimed, setIsVoucherClaimed] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // 'edit_profile' | 'preferences' | 'security' | 'privileges'
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const displayName = user?.full_name || user?.name || '';
  const [personalForm, setPersonalForm] = useState({
    name: displayName,
    email: user?.email || '',
    phone: user?.phone || '',
    city: user?.city || ''
  });

  const [prefForm, setPrefForm] = useState({
    roomType: user?.preferences?.roomType || 'Deluxe Room',
    bedType: user?.preferences?.bedType || 'King Size Bed',
    purpose: user?.preferences?.purpose || 'Leisure & Business',
    dietary: user?.preferences?.dietary || 'Complimentary Breakfast Included',
    specialRequests: user?.preferences?.specialRequests || 'High floor, quiet room away from elevator.'
  });

  const [securityForm, setSecurityForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    smsNotifications: true,
    emailAlerts: true
  });

  const handleSavePersonal = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updated = await api.updateUserProfile({
        full_name: personalForm.name,
        phone: personalForm.phone,
        city: personalForm.city
      });
      updateProfile({
        name: updated.full_name || personalForm.name,
        full_name: updated.full_name || personalForm.name,
        phone: updated.phone || personalForm.phone,
        city: updated.city || personalForm.city
      });
      setActiveModal(null);
      addToast('Profile information updated successfully in your account!', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePreferences = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updated = await api.updateUserProfile({
        preferences: prefForm
      });
      updateProfile({
        preferences: updated.preferences || prefForm
      });
      setActiveModal(null);
      addToast('Stay preferences saved to your account!', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to save preferences', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSecurity = async (e) => {
    e.preventDefault();
    if (securityForm.newPassword) {
      if (!securityForm.currentPassword) {
        addToast('Please enter your current password', 'error');
        return;
      }
      if (securityForm.newPassword !== securityForm.confirmPassword) {
        addToast('New passwords do not match', 'error');
        return;
      }
      if (securityForm.newPassword.length < 6) {
        addToast('New password must be at least 6 characters', 'error');
        return;
      }
    }

    setIsSaving(true);
    try {
      if (securityForm.newPassword) {
        await api.changeUserPassword(securityForm.currentPassword, securityForm.newPassword);
      }
      setActiveModal(null);
      setSecurityForm(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
      addToast('Security settings updated successfully!', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to update security settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClaimVoucher = () => {
    if (isVoucherClaimed) {
      addToast('Voucher is already active on your account!', 'info');
      return;
    }
    setIsVoucherClaimed(true);
    addToast('🎉 ₹500 Instant Stay Voucher claimed! Applied to your next stay.', 'success');
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to sign out of HostIQ?')) {
      logout();
      navigate('/login');
      addToast('You have been signed out.', 'info');
    }
  };

  const userName = personalForm.name || user?.name || 'Arjun Kumar';
  const initial = userName[0]?.toUpperCase() || 'A';
  const loyaltyPoints = user?.loyalty_points || 500;

  return (
    <div className="profile-page-wrapper fade-in">
      
      {/* 1. USER PROFILE HEADER CARD */}
      <div 
        className="profile-user-card"
        onClick={() => setActiveModal('edit_profile')}
        role="button"
        tabIndex={0}
      >
        <div className="profile-avatar-wrapper">
          <div className="profile-avatar-circle">
            {initial}
          </div>
          <div className="profile-online-badge" title="Online" />
        </div>

        <div className="profile-user-details">
          <div className="profile-user-name-row">
            <h2 className="profile-user-name">{userName}</h2>
          </div>
          <div>
            <span className="profile-verified-badge">
              <ShieldCheck size={11} />
              <span>Verified Traveler</span>
            </span>
          </div>
          <div className="profile-meta-row" style={{ marginTop: 3 }}>
            <Mail size={12} color="#64748B" />
            <span>{personalForm.email}</span>
          </div>
          <div className="profile-meta-row">
            <Phone size={12} color="#64748B" />
            <span>{personalForm.phone}</span>
          </div>
          <div className="profile-meta-row">
            <MapPin size={12} color="#64748B" />
            <span>{personalForm.city}</span>
          </div>
        </div>

        <ChevronRight size={18} className="profile-chevron-right" />
      </div>

      {/* 2. HOSTIQ ELITE BLACK LOYALTY CARD */}
      <div className="profile-elite-card">
        <div className="profile-elite-top">
          <div className="profile-elite-brand">
            <div className="profile-elite-logo">
              Host<span>IQ</span>
            </div>
            <div className="profile-elite-pill">
              ELITE
            </div>
          </div>
          <div className="profile-nfc-label">
            <Radio size={14} color="#94A3B8" />
            <span>NFC CHECK-IN</span>
          </div>
        </div>

        <div className="profile-elite-bottom">
          <div className="profile-member-info">
            <div className="profile-crown-box">
              <Crown size={18} />
            </div>
            <div className="profile-member-texts">
              <span className="profile-member-label">MEMBER ID</span>
              <span className="profile-member-id">HIQ-88269-43216</span>
            </div>
          </div>

          <div className="profile-balance-group">
            <span className="profile-balance-label">BALANCE</span>
            <span className="profile-balance-pts">{loyaltyPoints} PTS</span>
          </div>
        </div>
      </div>

      {/* 3. HOSTIQ REWARDS TIER CARD */}
      <div className="profile-rewards-tier-card">
        <div className="profile-tier-header">
          <div className="profile-tier-title">
            <Gift size={16} color="#D97706" />
            <span>HostIQ Rewards Tier</span>
          </div>
          <span className="profile-tier-badge">Gold Tier</span>
        </div>

        <div className="profile-progress-labels">
          <span>Progress to Platinum Tier</span>
          <span>{loyaltyPoints} / 1,000 PTS</span>
        </div>

        <div className="profile-progress-bar-track">
          <div 
            className="profile-progress-bar-fill" 
            style={{ width: `${Math.min((loyaltyPoints / 1000) * 100, 100)}%` }} 
          />
        </div>
      </div>

      {/* 4. VOUCHER PROMOTION CARD */}
      <div className="profile-voucher-card">
        <div 
          className="profile-voucher-item-row"
          onClick={handleClaimVoucher}
        >
          <div className="profile-voucher-icon-box">
            <Ticket size={20} />
          </div>
          <div className="profile-voucher-texts">
            <span className="profile-voucher-name">₹500 Instant Stay Voucher</span>
            <span className="profile-voucher-sub">
              {isVoucherClaimed ? '✓ Claimed & active on your account' : 'Redeem 500 Loyalty Points'}
            </span>
          </div>
          <ChevronRight size={18} color="#94A3B8" />
        </div>

        <button 
          type="button" 
          className="profile-voucher-claim-btn"
          onClick={handleClaimVoucher}
          style={{ background: isVoucherClaimed ? '#059669' : '#EA580C' }}
        >
          {isVoucherClaimed ? '✓ Voucher Claimed (HOSTIQ500)' : 'Claim ₹500 Voucher'}
        </button>
      </div>

      {/* 5. GOLD MEMBER PRIVILEGES CARD */}
      <div className="profile-privileges-card">
        <div className="profile-privileges-header">
          <div className="profile-privileges-title">
            <Crown size={15} color="#D97706" />
            <span>Your Gold Member Privileges</span>
          </div>
          <button 
            type="button" 
            className="profile-privileges-view-all"
            onClick={() => setActiveModal('privileges')}
          >
            <span>View All</span>
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="profile-privilege-item">
          <CheckCircle2 size={15} className="profile-privilege-icon" />
          <span>Complimentary Room Upgrades (When Available)</span>
        </div>

        <div className="profile-privilege-item">
          <CheckCircle2 size={15} className="profile-privilege-icon" />
          <span>Express Contactless QR Check-In</span>
        </div>

        <div className="profile-privilege-item">
          <CheckCircle2 size={15} className="profile-privilege-icon" />
          <span>Late Check-Out until 12:00 PM</span>
        </div>

        <div className="profile-privilege-item">
          <CheckCircle2 size={15} className="profile-privilege-icon" />
          <span>Priority Access to Reverse-Bidding Deals</span>
        </div>
      </div>

      {/* 6. ACTION NAVIGATION ROWS */}
      <div className="profile-nav-list">
        
        {/* My Trips & Bookings */}
        <div 
          className="profile-nav-item"
          onClick={() => navigate('/customer/trips')}
        >
          <Calendar size={18} className="profile-nav-icon" />
          <div className="profile-nav-texts">
            <span className="profile-nav-title">My Trips & Bookings</span>
            <span className="profile-nav-desc">View confirmed stays & QR passes</span>
          </div>
          <ChevronRight size={18} color="#94A3B8" />
        </div>

        {/* Saved Properties */}
        <div 
          className="profile-nav-item"
          onClick={() => navigate('/customer/wishlist')}
        >
          <Heart size={18} className="profile-nav-icon" color="#E11D48" />
          <div className="profile-nav-texts">
            <span className="profile-nav-title">Saved Properties</span>
            <span className="profile-nav-desc">{wishlist?.length || 0} hotels in your wishlist</span>
          </div>
          <ChevronRight size={18} color="#94A3B8" />
        </div>

        {/* Stay Preferences */}
        <div 
          className="profile-nav-item"
          onClick={() => setActiveModal('preferences')}
        >
          <Settings size={18} className="profile-nav-icon" />
          <div className="profile-nav-texts">
            <span className="profile-nav-title">Stay Preferences</span>
            <span className="profile-nav-desc">Rooms, amenities, and travel needs</span>
          </div>
          <ChevronRight size={18} color="#94A3B8" />
        </div>

        {/* Security & Alerts */}
        <div 
          className="profile-nav-item"
          onClick={() => setActiveModal('security')}
        >
          <Shield size={18} className="profile-nav-icon" />
          <div className="profile-nav-texts">
            <span className="profile-nav-title">Security & Alerts</span>
            <span className="profile-nav-desc">Manage security, notifications</span>
          </div>
          <ChevronRight size={18} color="#94A3B8" />
        </div>

        {/* Sign Out */}
        <div 
          className="profile-nav-item logout"
          onClick={handleLogout}
        >
          <LogOut size={18} className="profile-nav-icon" />
          <div className="profile-nav-texts">
            <span className="profile-nav-title">Sign Out of HostIQ</span>
          </div>
          <ChevronRight size={18} className="profile-chevron-right" />
        </div>

      </div>

      {/* =========================================================================
          MODALS / BOTTOM SHEETS FOR PROFILE ACTIONS
          ========================================================================= */}

      {/* Edit Profile Modal */}
      {activeModal === 'edit_profile' && (
        <div className="chat-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="room-modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="room-modal-header">
              <h3 className="room-modal-title">Edit Personal Profile</h3>
              <button className="room-modal-close-btn" onClick={() => setActiveModal(null)}>
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSavePersonal} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 600 }}>Full Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={personalForm.name} 
                  onChange={e => setPersonalForm({ ...personalForm, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 600 }}>Email Address</label>
                <input 
                  type="email" 
                  className="form-input" 
                  value={personalForm.email} 
                  onChange={e => setPersonalForm({ ...personalForm, email: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 600 }}>Phone Number</label>
                <input 
                  type="tel" 
                  className="form-input" 
                  value={personalForm.phone} 
                  onChange={e => setPersonalForm({ ...personalForm, phone: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 600 }}>City / Location</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={personalForm.city} 
                  onChange={e => setPersonalForm({ ...personalForm, city: e.target.value })}
                />
              </div>

              <div className="room-modal-actions" style={{ marginTop: 10 }}>
                <button type="button" className="room-modal-btn-cancel" onClick={() => setActiveModal(null)}>
                  Cancel
                </button>
                <button type="submit" className="room-modal-btn-proceed" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stay Preferences Modal */}
      {activeModal === 'preferences' && (
        <div className="chat-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="room-modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="room-modal-header">
              <h3 className="room-modal-title">Stay Preferences</h3>
              <button className="room-modal-close-btn" onClick={() => setActiveModal(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePreferences} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 600 }}>Preferred Room Type</label>
                <select 
                  className="form-input" 
                  value={prefForm.roomType}
                  onChange={e => setPrefForm({ ...prefForm, roomType: e.target.value })}
                >
                  <option value="Deluxe Room">Deluxe Room</option>
                  <option value="Executive Suite">Executive Suite</option>
                  <option value="Presidential Suite">Presidential Suite</option>
                  <option value="Standard Room">Standard Room</option>
                </select>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 600 }}>Bed Preference</label>
                <select 
                  className="form-input" 
                  value={prefForm.bedType}
                  onChange={e => setPrefForm({ ...prefForm, bedType: e.target.value })}
                >
                  <option value="King Size Bed">King Size Bed</option>
                  <option value="Twin Beds">Twin Beds</option>
                  <option value="Queen Bed">Queen Bed</option>
                </select>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 600 }}>Special Requests</label>
                <textarea 
                  className="form-textarea" 
                  value={prefForm.specialRequests}
                  onChange={e => setPrefForm({ ...prefForm, specialRequests: e.target.value })}
                  style={{ minHeight: 70, fontSize: '0.82rem' }}
                />
              </div>

              <div className="room-modal-actions" style={{ marginTop: 10 }}>
                <button type="button" className="room-modal-btn-cancel" onClick={() => setActiveModal(null)}>
                  Cancel
                </button>
                <button type="submit" className="room-modal-btn-proceed" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Security & Alerts Modal */}
      {activeModal === 'security' && (
        <div className="chat-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="room-modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="room-modal-header">
              <h3 className="room-modal-title">Security & Alerts</h3>
              <button className="room-modal-close-btn" onClick={() => setActiveModal(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveSecurity} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#0F172A' }}>SMS Booking Alerts</span>
                <input 
                  type="checkbox" 
                  checked={securityForm.smsNotifications}
                  onChange={e => setSecurityForm({ ...securityForm, smsNotifications: e.target.checked })}
                  style={{ width: 18, height: 18, accentColor: '#EA580C' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#0F172A' }}>Email Deal Updates</span>
                <input 
                  type="checkbox" 
                  checked={securityForm.emailAlerts}
                  onChange={e => setSecurityForm({ ...securityForm, emailAlerts: e.target.checked })}
                  style={{ width: 18, height: 18, accentColor: '#EA580C' }}
                />
              </div>

              <div className="room-modal-actions" style={{ marginTop: 10 }}>
                <button type="button" className="room-modal-btn-cancel" onClick={() => setActiveModal(null)}>
                  Cancel
                </button>
                <button type="submit" className="room-modal-btn-proceed">
                  Save Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Member Privileges Full View Modal */}
      {activeModal === 'privileges' && (
        <div className="chat-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="room-modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="room-modal-header">
              <h3 className="room-modal-title">Gold Tier Privileges</h3>
              <button className="room-modal-close-btn" onClick={() => setActiveModal(null)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 14 }}>
              <div className="profile-privilege-item">
                <CheckCircle2 size={16} className="profile-privilege-icon" />
                <span>Complimentary Room Upgrades (When Available)</span>
              </div>
              <div className="profile-privilege-item">
                <CheckCircle2 size={16} className="profile-privilege-icon" />
                <span>Express Contactless QR Check-In</span>
              </div>
              <div className="profile-privilege-item">
                <CheckCircle2 size={16} className="profile-privilege-icon" />
                <span>Late Check-Out until 12:00 PM</span>
              </div>
              <div className="profile-privilege-item">
                <CheckCircle2 size={16} className="profile-privilege-icon" />
                <span>Priority Access to Reverse-Bidding Deals</span>
              </div>
              <div className="profile-privilege-item">
                <CheckCircle2 size={16} className="profile-privilege-icon" />
                <span>Dedicated 24/7 Concierge Support</span>
              </div>
              <div className="profile-privilege-item">
                <CheckCircle2 size={16} className="profile-privilege-icon" />
                <span>2x Points Multiplier on Luxury Properties</span>
              </div>
            </div>

            <div className="room-modal-actions" style={{ marginTop: 16 }}>
              <button type="button" className="room-modal-btn-proceed" onClick={() => setActiveModal(null)} style={{ width: '100%' }}>
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
