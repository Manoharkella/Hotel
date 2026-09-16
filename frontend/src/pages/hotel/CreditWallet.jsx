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
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (hotelId) loadWallet(hotelId);
  }, [hotelId, loadWallet]);

  const handlePurchase = async (pkg) => {
    setIsProcessing(true);
    try {
      const success = await purchaseCredits(hotelId, pkg.credits, pkg.name);
      if (success) {
        addToast(`🎉 ${pkg.credits} credits successfully added to your wallet!`, 'success');
        setShowCheckout(null);
      } else {
        addToast('Failed to complete credit purchase', 'error');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const getPackageBadge = (pkgName) => {
    if (pkgName.toLowerCase().includes('starter')) return { icon: '🥉', color: '#64748B', perCredit: '₹20/credit' };
    if (pkgName.toLowerCase().includes('growth')) return { icon: '⭐', color: '#10B981', perCredit: '₹16.6/credit' };
    if (pkgName.toLowerCase().includes('enterprise')) return { icon: '👑', color: '#F59E0B', perCredit: '₹14/credit' };
    return { icon: '🪙', color: '#10B981', perCredit: '' };
  };

  return (
    <div className="fade-in" style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: 40 }}>
      {balance < 20 && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          borderLeft: '4px solid #EF4444',
          borderRadius: 12,
          padding: '14px 20px',
          marginBottom: 24,
          display: 'flex',
          gap: 12,
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '1.3rem', color: '#EF4444' }}>⚠</span>
          <div style={{ flex: 1 }}>
            <strong style={{ color: '#EF4444', display: 'block', fontSize: '0.9rem', marginBottom: 2 }}>
              Low credit balance ({balance} credits)
            </strong>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Top up now to avoid missing out on new customer inquiries and direct booking leads.
            </span>
          </div>
        </div>
      )}

      {/* Top Section: Balance & Quick Info in Side-by-Side Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 24,
        marginBottom: 36
      }}>
        {/* Main Balance Hero Card */}
        <div style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          borderRadius: 20,
          padding: '32px 28px',
          color: 'white',
          boxShadow: '0 12px 30px -8px rgba(15, 23, 42, 0.35)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div style={{
            position: 'absolute',
            top: -20,
            right: -20,
            width: 130,
            height: 130,
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, rgba(16, 185, 129, 0) 70%)',
            borderRadius: '50%',
            pointerEvents: 'none'
          }} />

          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{
                fontSize: '0.78rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#94A3B8',
                fontWeight: 700
              }}>
                Current Available Balance
              </span>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                background: 'rgba(16, 185, 129, 0.2)',
                color: '#34D399',
                padding: '4px 10px',
                borderRadius: 20,
                border: '1px solid rgba(16, 185, 129, 0.3)'
              }}>
                Active Wallet
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
              <div style={{
                fontSize: '3.6rem',
                fontWeight: 800,
                fontFamily: 'var(--font-sans)',
                lineHeight: 1,
                color: '#FBBF24',
                letterSpacing: '-0.02em'
              }}>
                {balance}
              </div>
              <span style={{ fontSize: '1.05rem', color: '#94A3B8', fontWeight: 600 }}>Credits</span>
            </div>
          </div>

          <div style={{
            marginTop: 24,
            paddingTop: 16,
            borderTop: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.82rem',
            color: '#CBD5E1'
          }}>
            <span>⚡ 1 Lead Unlock = 10 Credits</span>
            <span style={{ color: '#38BDF8', fontWeight: 600 }}>
              ≈ {Math.floor(balance / 10)} Leads Ready
            </span>
          </div>
        </div>

        {/* Benefits & Perks Overview Card */}
        <div style={{
          background: 'var(--bg-card)',
          borderRadius: 20,
          padding: '28px',
          border: '1px solid var(--border-light)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: '0 4px 20px -2px rgba(0,0,0,0.04)'
        }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 6, color: 'var(--text-primary)' }}>
              How Hotel Credits Work
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.5 }}>
              Credits are your property's currency on the HotelIQ platform to unlock verified high-intent customer leads.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
            <div style={{
              background: 'var(--bg)',
              padding: '12px 14px',
              borderRadius: 12,
              border: '1px solid var(--border-light)'
            }}>
              <div style={{ fontSize: '1.1rem', marginBottom: 4 }}>🎯</div>
              <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)' }}>Direct Contact</div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>Full phone & email access</div>
            </div>

            <div style={{
              background: 'var(--bg)',
              padding: '12px 14px',
              borderRadius: 12,
              border: '1px solid var(--border-light)'
            }}>
              <div style={{ fontSize: '1.1rem', marginBottom: 4 }}>♾️</div>
              <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)' }}>No Expiry</div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>Credits stay valid forever</div>
            </div>

            <div style={{
              background: 'var(--bg)',
              padding: '12px 14px',
              borderRadius: 12,
              border: '1px solid var(--border-light)'
            }}>
              <div style={{ fontSize: '1.1rem', marginBottom: 4 }}>🚀</div>
              <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)' }}>Instant Recharge</div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>Zero waiting time</div>
            </div>
          </div>
        </div>
      </div>

      {/* Side-by-Side Credit Packages Section */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 4, color: 'var(--text-primary)' }}>
          Purchase Credits
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Select a credit package tailored to your property's booking volume and target audience.
        </p>
      </div>

      {/* Side-by-Side 3-Column Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 24,
        marginBottom: 48,
        alignItems: 'stretch'
      }}>
        {CREDIT_PACKAGES.map(pkg => {
          const badge = getPackageBadge(pkg.name);
          const isPopular = pkg.popular;

          return (
            <div
              key={pkg.id}
              className="card"
              style={{
                position: 'relative',
                borderRadius: 20,
                border: isPopular ? '2px solid #10B981' : '1px solid var(--border-light)',
                boxShadow: isPopular ? '0 12px 30px -4px rgba(16, 185, 129, 0.15)' : '0 4px 16px rgba(0,0,0,0.03)',
                background: isPopular ? 'linear-gradient(180deg, rgba(16, 185, 129, 0.03) 0%, var(--bg-card) 100%)' : 'var(--bg-card)',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.25s ease'
              }}
            >
              {isPopular && (
                <div style={{
                  position: 'absolute',
                  top: -12,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'linear-gradient(135deg, #10B981, #059669)',
                  color: '#FFFFFF',
                  padding: '4px 16px',
                  borderRadius: 20,
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5
                }}>
                  ⭐ MOST POPULAR
                </div>
              )}

              <div className="card-body" style={{
                padding: '36px 28px 28px',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontSize: '1.6rem' }}>{badge.icon}</span>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: badge.color,
                      background: `${badge.color}15`,
                      padding: '4px 10px',
                      borderRadius: 12
                    }}>
                      {badge.perCredit}
                    </span>
                  </div>

                  <h3 style={{
                    marginBottom: 4,
                    fontSize: '1.3rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)'
                  }}>
                    {pkg.name}
                  </h3>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: '16px 0 6px' }}>
                    <span style={{
                      fontSize: '2.4rem',
                      fontWeight: 800,
                      color: isPopular ? '#10B981' : 'var(--text-primary)',
                      lineHeight: 1
                    }}>
                      {pkg.credits}
                    </span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Credits
                    </span>
                  </div>

                  <div style={{
                    fontSize: '1.35rem',
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                    marginBottom: 20,
                    paddingBottom: 20,
                    borderBottom: '1px solid var(--border-light)'
                  }}>
                    ₹{pkg.price.toLocaleString('en-IN')}
                    <span style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-secondary)', marginLeft: 6 }}>
                      one-time
                    </span>
                  </div>

                  {/* Feature list */}
                  <ul style={{ listStyle: 'none', margin: '0 0 28px 0', padding: 0 }}>
                    {pkg.features.map(f => (
                      <li key={f} style={{
                        padding: '7px 0',
                        fontSize: '0.86rem',
                        color: 'var(--text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10
                      }}>
                        <span style={{
                          color: '#10B981',
                          fontSize: '0.95rem',
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 18,
                          height: 18,
                          background: 'rgba(16, 185, 129, 0.12)',
                          borderRadius: '50%'
                        }}>
                          ✓
                        </span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  className={`btn btn-block ${isPopular ? 'btn-primary' : 'btn-outline'}`}
                  style={{
                    padding: '12px 18px',
                    borderRadius: 12,
                    fontWeight: 700,
                    fontSize: '0.92rem',
                    boxShadow: isPopular ? '0 4px 14px rgba(16, 185, 129, 0.3)' : 'none'
                  }}
                  onClick={() => setShowCheckout(pkg)}
                >
                  Select {pkg.name}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Transaction History */}
      <div style={{
        background: 'var(--bg-card)',
        borderRadius: 20,
        border: '1px solid var(--border-light)',
        padding: '28px',
        boxShadow: '0 4px 20px -2px rgba(0,0,0,0.04)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20
        }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: 2, color: 'var(--text-primary)' }}>
              Wallet Transaction History
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
              Track all credit purchases, lead unlocks, and balance updates for this property
            </p>
          </div>
          <span style={{
            fontSize: '0.78rem',
            fontWeight: 700,
            color: 'var(--text-secondary)',
            background: 'var(--bg)',
            padding: '6px 12px',
            borderRadius: 8,
            border: '1px solid var(--border-light)'
          }}>
            Total Records: {hotelTx.length}
          </span>
        </div>

        <div className="table-container" style={{ margin: 0, border: 'none' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-light)', textAlign: 'left' }}>
                <th style={{ padding: '12px 16px', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)' }}>Date</th>
                <th style={{ padding: '12px 16px', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)' }}>Type</th>
                <th style={{ padding: '12px 16px', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)' }}>Details</th>
                <th style={{ padding: '12px 16px', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', textAlign: 'right' }}>Amount</th>
                <th style={{ padding: '12px 16px', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', textAlign: 'right' }}>Balance</th>
              </tr>
            </thead>
            <tbody>
              {hotelTx.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--text-secondary)' }}>
                    <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>📜</div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>No wallet transactions found</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                      Purchased packages and lead unlocks will automatically appear here.
                    </div>
                  </td>
                </tr>
              ) : (
                hotelTx.map((tx, idx) => {
                  const isPositive = tx.amount > 0;
                  const isNegative = tx.amount < 0;

                  return (
                    <tr
                      key={tx.id || idx}
                      style={{
                        borderBottom: '1px solid var(--border-light)',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      <td style={{ padding: '14px 16px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        {tx.date || tx.createdAt
                          ? new Date(tx.date || tx.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                          : 'Recent'}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '4px 10px',
                          borderRadius: 20,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          background: isPositive ? 'rgba(16, 185, 129, 0.12)' : isNegative ? 'rgba(239, 68, 68, 0.12)' : 'rgba(59, 130, 246, 0.12)',
                          color: isPositive ? '#10B981' : isNegative ? '#EF4444' : '#3B82F6'
                        }}>
                          {isPositive ? '+ Purchase' : isNegative ? '− Spent' : '✓ Booking'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '0.88rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                        {tx.package || tx.description || 'Credit Adjustment'}
                      </td>
                      <td style={{
                        padding: '14px 16px',
                        textAlign: 'right',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        color: isPositive ? '#10B981' : isNegative ? '#EF4444' : 'var(--text-secondary)'
                      }}>
                        {tx.amount !== 0 ? `${isPositive ? '+' : ''}${tx.amount}` : '—'}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                        {tx.balanceAfter !== undefined ? tx.balanceAfter : balance}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="modal-overlay" onClick={() => !isProcessing && setShowCheckout(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480, borderRadius: 20, padding: 36 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '1.4rem' }}>{getPackageBadge(showCheckout.name).icon}</span>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  Confirm Purchase
                </h3>
              </div>
              <button
                onClick={() => !isProcessing && setShowCheckout(null)}
                style={{ background: 'transparent', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                ✕
              </button>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: 24 }}>
              You are adding <strong>{showCheckout.credits} credits</strong> to your property wallet.
            </p>

            <div style={{
              background: 'var(--bg)',
              border: '1px solid var(--border-light)',
              borderRadius: 14,
              padding: '18px 20px',
              marginBottom: 24
            }}>
              <div className="flex-between" style={{ marginBottom: 10, fontSize: '0.88rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Selected Tier</span>
                <strong style={{ fontWeight: 700 }}>{showCheckout.name}</strong>
              </div>
              <div className="flex-between" style={{ marginBottom: 10, fontSize: '0.88rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Credits Included</span>
                <strong style={{ fontWeight: 700, color: '#10B981' }}>+{showCheckout.credits} Credits</strong>
              </div>
              <div className="flex-between" style={{ marginBottom: 16, fontSize: '0.88rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Total Payable</span>
                <strong style={{ fontWeight: 800, fontSize: '1.1rem' }}>₹{showCheckout.price.toLocaleString('en-IN')}</strong>
              </div>

              <div className="flex-between" style={{ borderTop: '1px solid var(--border-light)', paddingTop: 14 }}>
                <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  Updated Wallet Balance
                </span>
                <strong style={{ color: '#FBBF24', fontSize: '1.2rem', fontWeight: 800 }}>
                  {balance + showCheckout.credits} Credits
                </strong>
              </div>
            </div>

            <div style={{
              border: '1px solid var(--border-light)',
              borderRadius: 14,
              padding: '16px 18px',
              marginBottom: 24,
              background: 'var(--bg-card)'
            }}>
              <div style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', marginBottom: 12 }}>
                🔒 Demo Payment Simulator
              </div>
              <input
                className="form-input"
                defaultValue="4242 •••• •••• 4242"
                readOnly
                style={{ marginBottom: 10, background: 'var(--bg)', fontSize: '0.85rem' }}
              />
              <div style={{ display: 'flex', gap: 10 }}>
                <input className="form-input" defaultValue="12/28" readOnly style={{ background: 'var(--bg)', fontSize: '0.85rem' }} />
                <input className="form-input" defaultValue="•••" readOnly style={{ background: 'var(--bg)', fontSize: '0.85rem' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                className="btn btn-outline"
                disabled={isProcessing}
                onClick={() => setShowCheckout(null)}
                style={{ borderRadius: 10, padding: '10px 18px' }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                disabled={isProcessing}
                onClick={() => handlePurchase(showCheckout)}
                style={{ borderRadius: 10, padding: '10px 22px', fontWeight: 700 }}
              >
                {isProcessing ? 'Processing...' : `Pay ₹${showCheckout.price.toLocaleString('en-IN')}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
