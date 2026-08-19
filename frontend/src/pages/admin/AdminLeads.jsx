import { useApp } from '../../context/AppContext';

export default function AdminLeads() {
  const { leads, unlocks } = useApp();

  return (
    <div className="fade-in">
      <div className="flex-between mb-3">
        <h2>Leads Overview</h2>
        <span className="badge badge-info">{leads.length} total leads</span>
      </div>
      <div className="table-container">
        <table>
          <thead><tr><th>Customer</th><th>Destination</th><th>Dates</th><th>Budget</th><th>Matched</th><th>Unlocked By</th><th>Status</th></tr></thead>
          <tbody>
            {leads.map(l => {
              const leadUnlocks = unlocks.filter(u => u.leadId === l.id);
              return (
                <tr key={l.id}>
                  <td><strong>{l.customerName}</strong></td>
                  <td>📍 {l.destination}</td>
                  <td style={{ fontSize: '0.85rem' }}>{new Date(l.checkIn).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} → {new Date(l.checkOut).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                  <td style={{ fontWeight: 600 }}>₹{l.budget.toLocaleString()}</td>
                  <td><span className="badge badge-neutral">{l.matchedHotelIds.length} hotels</span></td>
                  <td><span className="badge badge-locked">{leadUnlocks.length} unlocks</span></td>
                  <td><span className={`badge ${l.status === 'active' ? 'badge-info' : l.status === 'won' ? 'badge-success' : 'badge-neutral'}`}>{l.status}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
