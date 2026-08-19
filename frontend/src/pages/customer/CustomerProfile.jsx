import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function CustomerProfile() {
  const { user, updateProfile, logout } = useAuth();
  const { addToast } = useToast();
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '' });

  const handleSave = (e) => {
    e.preventDefault();
    updateProfile(form);
    addToast('Profile updated!', 'success');
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 24 }} className="fade-in">
      <h1 className="mb-3">Profile & Settings</h1>
      <div className="card">
        <div className="card-body" style={{ padding: 32 }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div className="avatar" style={{ width: 80, height: 80, fontSize: '2rem', margin: '0 auto 12px' }}>{user?.name?.[0]?.toUpperCase()}</div>
            <h3>{user?.name}</h3>
            <span className="badge badge-primary">🧳 Traveler</span>
          </div>
          <form onSubmit={handleSave}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-input" type="tel" placeholder="+91 98765 43210" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
            <button className="btn btn-primary btn-block" type="submit">Save Changes</button>
          </form>
        </div>
      </div>
    </div>
  );
}
