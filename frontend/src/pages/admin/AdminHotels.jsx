import { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';

export default function AdminHotels() {
  const { addToast } = useToast();
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approvedHotels, setApprovedHotels] = useState([]);

  useEffect(() => {
    fetchAllHotels();
  }, []);

  const fetchAllHotels = async () => {
    try {
      const data = await api.getAllHotels();
      setHotels(data);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.approveHotel(id);
      setApprovedHotels(prev => [...prev, id]);
      addToast('Hotel approved successfully!', 'success');
      setHotels(prev => prev.map(h => h.id === id ? { ...h, status: 'APPROVED' } : h));
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleSuspend = async (id) => {
    try {
      await api.suspendHotel(id);
      addToast('Hotel has been suspended.', 'info');
      setHotels(prev => prev.map(h => h.id === id ? { ...h, status: 'SUSPENDED' } : h));
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  if (loading) return <div className="fade-in">Loading hotels...</div>;

  return (
    <div className="fade-in">
      <div className="flex-between mb-3">
        <h2>Manage Hotels</h2>
        <span className="badge badge-primary">{hotels.length} total</span>
      </div>
      <div className="table-container">
        <table>
          <thead><tr><th>Hotel</th><th>Location</th><th>Contact</th><th>Actions</th></tr></thead>
          <tbody>
            {hotels.map(h => (
              <tr key={h.id}>
                <td>
                  <div className="flex-gap">
                    {h.photos && h.photos.length > 0 ? (
                      <div style={{ width: 40, height: 40, borderRadius: 8, backgroundImage: `url(${h.photos[0]})`, backgroundSize: 'cover' }} />
                    ) : (
                      <div style={{ width: 40, height: 40, borderRadius: 8, background: '#e2e8f0' }} />
                    )}
                    <strong style={{ color: 'var(--text)' }}>{h.name}</strong>
                  </div>
                </td>
                <td style={{ color: 'var(--text-secondary)' }}>📍 {h.location}</td>
                <td>
                  <span className={`badge ${h.status === 'APPROVED' ? 'badge-success' : h.status === 'SUSPENDED' ? 'badge-danger' : 'badge-warning'}`}>
                    {h.status}
                  </span>
                </td>
                <td style={{ display: 'flex', gap: 6 }}>
                  {h.status !== 'APPROVED' && (
                    <button className="btn btn-outline btn-sm" onClick={() => handleApprove(h.id)}>
                      Approve
                    </button>
                  )}
                  {h.status !== 'SUSPENDED' && (
                    <button className="btn btn-sm" style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca' }} onClick={() => handleSuspend(h.id)}>
                      Suspend
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {hotels.length === 0 && (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>No pending hotels found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
