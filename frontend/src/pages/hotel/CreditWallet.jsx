import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { CREDIT_PACKAGES } from '../../data/mockData';

export default function CreditWallet() {
  const { getWalletBalance, transactions, purchaseCredits, loadWallet } = useApp();
  const { user } = useAuth();
  const { addToast } = useToast();
  const hotelId = (user?.hotelId || user?.id) ? (user.hotelId || user.id).toString() : '1';
  const balance = getWalletBalance(hotelId);
  const hotelTx = transactions.filter(t => t.hotelId === hotelId.toString());
  const [showCheckout, setShowCheckout] = useState(null);

  useEffect(() => {
    if (hotelId) loadWallet(hotelId);
  }, [hotelId, loadWallet]);

  const handlePurchase = async (pkg) => {
    const success = await purchaseCredits(hotelId, pkg.credits, pkg.name);
    if (success) {
      addToast(`${pkg.credits} credits purchased!`, 'success');
      setShowCheckout(null);
    } else {
      addToast('Failed to purchase credits', 'error');
    }
  };

  return (
    <div className="fade-in">
      {balance < 20 && (
        <div style={{ background: 'var(--danger-bg)', borderLeft: '4px solid var(--danger)', padding: '16px 24px', marginBottom: 32, display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ fontSize: '1.2rem', color: 'var(--danger)' }}>⚠</span>
          <div><strong style={{ color: 'var(--danger)', display: 'block', fontSize: '0.9rem', marginBottom: 2 }}>Low credit balance!</strong> <span style={{ fontSize: '0.85rem', color: 'var(--danger)' }}>Top up now to keep unlocking leads and boosting visibility.</span></div>
        </div>
      )}

      {/* Balance Card */}
      <div className="card mb-3" style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-light))', color: 'white', border: 'none', boxShadow: 'var(--shadow-lg)' }}>
        <div className="card-body" style={{ padding: '48px 32px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.85rem', opacity: 0.8, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Current Balance</div>
          <div style={{ fontSize: '4rem', fontWeight: 600, fontFamily: 'var(--font-serif)', lineHeight: 1, color: 'var(--accent)' }}>{balance}</div>
          <div style={{ fontSize: '0.9rem', opacity: 0.8, marginTop: 12, letterSpacing: '0.05em' }}>Credits Available</div>
        </div>
      </div>

      {/* Credit Packages */}
      <div className="flex-between" style={{ marginTop: 48, marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: 4 }}>Purchase Credits</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Choose a package to fuel your market reach</p>
        </div>
      </div>
      
      <div className="grid-3 mb-3" style={{ marginBottom: 48 }}>
        {CREDIT_PACKAGES.map(pkg => (
          <div key={pkg.id} className="card" style={{ position: 'relative', border: pkg.popular ? '2px solid var(--accent)' : undefined }}>
            {pkg.popular && <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: 'var(--accent)', color: 'white', padding: '4px 16px', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.05em' }}>MOST POPULAR</div>}
            <div className="card-body" style={{ textAlign: 'center', padding: '40px 32px' }}>
              <h3 style={{ marginBottom: 4, fontFamily: 'var(--font-serif)', fontSize: '1.4rem' }}>{pkg.name}</h3>
              <div style={{ fontSize: '2.5rem', fontWeight: 400, fontFamily: 'var(--font-serif)', color: 'var(--primary)', margin: '16px 0 8px', lineHeight: 1 }}>
                {pkg.credits}
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 24 }}>credits</div>
              
              <div style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid var(--border-light)' }}>
                ₹{pkg.price.toLocaleString()}
              </div>
              
              <ul style={{ textAlign: 'left', listStyle: 'none', margin: '0 0 32px 0', padding: 0 }}>
                {pkg.features.map(f => (
                  <li key={f} style={{ padding: '6px 0', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: 'var(--accent)', fontSize: '1rem' }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <button className={`btn btn-block ${pkg.popular ? 'btn-primary' : 'btn-outline'}`} onClick={() => setShowCheckout(pkg)}>
                Select Package
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Transaction History */}
      <h2 style={{ fontSize: '1.5rem', marginBottom: 24 }}>Transaction History</h2>
      <div className="table-container">
        <table>
          <thead><tr><th>Date</th><th>Type</th><th>Details</th><th>Amount</th><th>Balance</th></tr></thead>
          <tbody>
            {hotelTx.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No transactions yet</td></tr>
            ) : (
              hotelTx.map(tx => (
                <tr key={tx.id}>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{tx.date || tx.createdAt ? new Date(tx.date || tx.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent'}</td>
                  <td>
                    <span style={{ 
                      fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
                      color: tx.amount > 0 ? 'var(--success)' : tx.amount < 0 ? 'var(--warning)' : 'var(--primary)'
                    }}>
                      {tx.amount > 0 ? '+ Purchase' : tx.amount < 0 ? '− Spent' : '✓ Booking'}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text)' }}>{tx.package || tx.description || 'Transaction'}</td>
                  <td style={{ fontWeight: 600, color: tx.amount > 0 ? 'var(--success)' : tx.amount < 0 ? 'var(--danger)' : 'var(--text-secondary)' }}>
                    {tx.amount !== 0 ? `${tx.amount > 0 ? '+' : ''}${tx.amount}` : '—'}
                  </td>
                  <td style={{ fontWeight: 600, fontSize: '0.95rem' }}>{balance}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="modal-overlay" onClick={() => setShowCheckout(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', marginBottom: 12 }}>Confirm Purchase</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>You're about to purchase <strong>{showCheckout.credits} credits</strong> for your property.</p>
            
            <div style={{ background: 'var(--bg)', border: '1px solid var(--border-light)', padding: 24, marginBottom: 32 }}>
              <div className="flex-between" style={{ marginBottom: 12, fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Selected Package</span>
                <strong style={{ fontWeight: 600 }}>{showCheckout.name}</strong>
              </div>
              <div className="flex-between" style={{ marginBottom: 12, fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Credits Included</span>
                <strong style={{ fontWeight: 600 }}>{showCheckout.credits}</strong>
              </div>
              <div className="flex-between" style={{ marginBottom: 24, fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Total Amount</span>
                <strong style={{ fontWeight: 600 }}>₹{showCheckout.price.toLocaleString()}</strong>
              </div>
              
              <div className="flex-between" style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>New Balance</span>
                <strong style={{ color: 'var(--primary)', fontFamily: 'var(--font-serif)', fontSize: '1.4rem' }}>{balance + showCheckout.credits}</strong>
              </div>
            </div>
            
            <div style={{ border: '1px solid var(--border-light)', padding: 24, marginBottom: 32 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: 16 }}>Secure Payment Method</div>
              <input className="form-input mb-1" placeholder="Card Number (Demo: 4242)" style={{ marginBottom: 12, background: 'var(--bg)' }} />
              <div style={{ display: 'flex', gap: 12 }}>
                <input className="form-input" placeholder="MM/YY" style={{ background: 'var(--bg)' }} />
                <input className="form-input" placeholder="CVC" style={{ background: 'var(--bg)' }} />
              </div>
            </div>
            
            <div className="modal-actions" style={{ marginTop: 0 }}>
              <button className="btn btn-outline" onClick={() => setShowCheckout(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => handlePurchase(showCheckout)}>Pay ₹{showCheckout.price.toLocaleString()}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
