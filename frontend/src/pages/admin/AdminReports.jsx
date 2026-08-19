import { useApp } from '../../context/AppContext';

export default function AdminReports() {
  const { leads, bookings, transactions } = useApp();

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
  const leadsData = [3, 5, 8, 12, 9, 15, 18, leads.length];
  const revenueData = [2000, 4500, 6000, 8500, 7000, 12000, 15000, 18000];
  const maxLeads = Math.max(...leadsData);
  const maxRevenue = Math.max(...revenueData);

  return (
    <div className="fade-in">
      <h2 className="mb-3">Reports & Analytics</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Leads Chart */}
        <div className="card">
          <div className="card-body">
            <h3 className="mb-2">📩 Leads Over Time</h3>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 180, padding: '16px 0' }}>
              {months.map((m, i) => (
                <div key={m} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#0f766e' }}>{leadsData[i]}</span>
                  <div style={{ width: '100%', height: `${(leadsData[i] / maxLeads) * 130}px`, background: `linear-gradient(180deg, #14b8a6, #0f766e)`, borderRadius: '6px 6px 0 0', transition: 'height 0.5s ease', minHeight: 8 }} />
                  <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{m}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="card">
          <div className="card-body">
            <h3 className="mb-2">💰 Credit Revenue (₹)</h3>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 180, padding: '16px 0' }}>
              {months.map((m, i) => (
                <div key={m} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: '0.6rem', fontWeight: 600, color: '#f59e0b' }}>{(revenueData[i] / 1000).toFixed(0)}k</span>
                  <div style={{ width: '100%', height: `${(revenueData[i] / maxRevenue) * 130}px`, background: `linear-gradient(180deg, #fbbf24, #f59e0b)`, borderRadius: '6px 6px 0 0', transition: 'height 0.5s ease', minHeight: 8 }} />
                  <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{m}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Conversion Metrics */}
      <div className="card">
        <div className="card-body">
          <h3 className="mb-2">📈 Key Metrics</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
            {[
              { label: 'Lead → Booking', value: '60%', desc: 'Conversion Rate', color: '#10b981' },
              { label: 'Avg Credits/Unlock', value: '10', desc: 'Cost per Lead', color: '#3b82f6' },
              { label: 'Avg Response Time', value: '2.4h', desc: 'Hotel to Customer', color: '#f59e0b' },
              { label: 'QR Check-In Rate', value: '78%', desc: 'Digital vs Manual', color: '#7c3aed' },
            ].map((m, i) => (
              <div key={i} style={{ textAlign: 'center', padding: 16 }}>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: m.color }}>{m.value}</div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', marginTop: 4 }}>{m.label}</div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{m.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
