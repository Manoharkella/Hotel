import { useState } from 'react';
import { useToast } from '../../context/ToastContext';

export default function AdminSettings() {
  const { addToast } = useToast();
  const [leadCost, setLeadCost] = useState(10);
  const [platformFee, setPlatformFee] = useState(5);

  const handleSave = () => {
    addToast('Platform economics updated successfully. Changes are now live.', 'success');
  };

  return (
    <div className="fade-in pb-5">
      <div className="flex-between" style={{ marginBottom: 32 }}>
        <h2 style={{ margin: 0, fontFamily: 'var(--font-sans)', fontSize: '1.5rem', fontWeight: 600 }}>Platform Economics & Settings</h2>
        <button className="btn btn-primary" onClick={handleSave} style={{ padding: '10px 24px' }}>Save Changes</button>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-body">
            <h3 style={{ margin: '0 0 24px', fontSize: '1.1rem', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>Lead Generation Pricing</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 24 }}>Control how much hotels pay to unlock customer contact details.</p>
            
            <div className="form-group">
              <label className="form-label">Cost to Unlock a Lead (Credits)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <input type="range" min="5" max="50" step="5" value={leadCost} onChange={e => setLeadCost(Number(e.target.value))} style={{ flex: 1, accentColor: 'var(--primary)' }} />
                <span style={{ fontSize: '1.4rem', fontWeight: 600, color: 'var(--primary)', width: 60, textAlign: 'right' }}>{leadCost}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8 }}>
                <span>5 Credits</span>
                <span>50 Credits</span>
              </div>
            </div>

            <div style={{ padding: 16, background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border-light)' }}>
              <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 4 }}>Revenue Impact</span>
              <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>At the current rate of 120 leads/month, setting the cost to {leadCost} credits generates approximately ₹{(120 * leadCost * 100).toLocaleString()} in revenue per month (assuming 1 Credit = ₹100).</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <h3 style={{ margin: '0 0 24px', fontSize: '1.1rem', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>Commission & Fees</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 24 }}>Set the baseline platform fee applied to successful bookings.</p>
            
            <div className="form-group">
              <label className="form-label">Platform Commission (%)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <input type="range" min="0" max="25" step="1" value={platformFee} onChange={e => setPlatformFee(Number(e.target.value))} style={{ flex: 1, accentColor: 'var(--primary)' }} />
                <span style={{ fontSize: '1.4rem', fontWeight: 600, color: 'var(--primary)', width: 60, textAlign: 'right' }}>{platformFee}%</span>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: 32 }}>
              <label className="form-label">Credit Package Pricing</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ padding: 12, border: '1px solid var(--border)', borderRadius: 4 }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Starter Package</div>
                  <div style={{ fontWeight: 600, marginTop: 4 }}>50 Credits / ₹5,000</div>
                </div>
                <div style={{ padding: 12, border: '1px solid var(--border)', borderRadius: 4 }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Pro Package</div>
                  <div style={{ fontWeight: 600, marginTop: 4 }}>200 Credits / ₹15,000</div>
                </div>
              </div>
              <button className="btn btn-outline btn-sm" style={{ marginTop: 12 }}>Edit Packages</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
