import { useState, useEffect } from 'react';
import { api } from '../../services/api';

export default function AdminCredits() {
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState('all');
  
  useEffect(() => {
    const fetchTxs = async () => {
      try {
        const txs = await api.getAllTransactions();
        const mapped = txs.map(tx => ({
          id: tx.id.toString(),
          hotelName: tx.hotel_name,
          amount: tx.amount,
          type: tx.amount > 0 ? 'purchase' : 'spend',
          package: tx.description,
          currentBalance: tx.current_balance,
          createdAt: tx.created_at
        }));
        setTransactions(mapped);
      } catch (err) {
        console.error(err);
      }
    };
    fetchTxs();
  }, []);

  const filtered = filter === 'all' ? transactions : transactions.filter(t => t.type === filter);

  return (
    <div className="fade-in">
      <div className="flex-between mb-3">
        <h2>Credit Transactions</h2>
        <div className="flex-gap">
          {['all', 'purchase', 'spend'].map(f => (
            <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter(f)}>
              {f === 'all' ? 'All' : f === 'purchase' ? '💰 Purchases' : '🔓 Spends'}
            </button>
          ))}
        </div>
      </div>
      <div className="table-container">
        <table>
          <thead><tr><th>Date</th><th>Hotel Name</th><th>Type</th><th>Details</th><th>Amount</th><th>Current Balance</th></tr></thead>
          <tbody>
            {filtered.map(t => (
              <tr key={t.id}>
                <td>{new Date(t.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                <td style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{t.hotelName}</td>
                <td><span className={`badge ${t.type === 'purchase' ? 'badge-success' : 'badge-warning'}`}>{t.type === 'purchase' ? '💰 Purchase' : '🔓 Spend'}</span></td>
                <td style={{ fontSize: '0.85rem' }}>{t.package || (t.relatedLeadId ? `Lead: ${t.relatedLeadId}` : 'Visibility boost')}</td>
                <td style={{ fontWeight: 700, color: t.amount > 0 ? '#10b981' : '#ef4444' }}>{t.amount > 0 ? '+' : ''}{t.amount}</td>
                <td style={{ fontWeight: 600 }}>{t.currentBalance}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
