import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function AdminUsers() {
  const { addToast } = useToast();
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await api.getAllUsers();
      setUsers(data);
    } catch (err) {
      addToast('Failed to load customers', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filtered = users.filter(u => 
    u.role === 'customer' && 
    ((u.full_name && u.full_name.toLowerCase().includes(search.toLowerCase())) || 
     (u.email && u.email.toLowerCase().includes(search.toLowerCase())))
  );

  return (
    <div className="fade-in">
      <div className="flex-between mb-3">
        <h2>Customer Management</h2>
        <input className="form-input" style={{ maxWidth: 300 }} placeholder="🔍 Search customers..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center' }}>Loading customers...</div>
      ) : (
        <div className="table-container">
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id}>
                  <td>
                    <div className="flex-gap">
                      <div className="avatar" style={{ width: 32, height: 32, fontSize: '0.75rem', background: 'var(--primary)', color: 'white' }}>
                        {(u.full_name || '?')[0].toUpperCase()}
                      </div>
                      <strong style={{ color: 'var(--text)' }}>{u.full_name}</strong>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                  <td><span className="badge badge-info">{u.role}</span></td>
                  <td>
                    <span className={`badge ${u.status === 'ACTIVE' ? 'badge-success' : 'badge-warning'}`}>
                      {u.status}
                    </span>
                  </td>
                  <td><button className="btn btn-outline btn-sm" onClick={() => addToast('User suspended (demo)', 'info')}>Suspend</button></td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                    No customers found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
