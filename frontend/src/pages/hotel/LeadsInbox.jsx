import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import ChatModal from '../../components/ChatModal';

import { useNavigate } from 'react-router-dom';

import { useEffect } from 'react';

export default function LeadsInbox() {
  const { leads, unlockLead, isLeadUnlocked, sendQuote, getWalletBalance, loadWallet, loadUnlocks, quotes } = useApp();
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const hotelId = (user?.hotelId || user?.id) ? (user.hotelId || user.id).toString() : '1';
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (user?.hotelId) {
      loadWallet(user.hotelId);
      loadUnlocks(user.hotelId);
    }
  }, [user?.hotelId, loadWallet, loadUnlocks]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [chatLead, setChatLead] = useState(null);
  const [quoteForm, setQuoteForm] = useState({ message: '', price: '' });

  const [hiddenLeads, setHiddenLeads] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(`hiddenLeads_${hotelId}`) || '[]');
    } catch {
      return [];
    }
  });

  const hotelLeads = leads.filter(l => (l.matchedHotelIds || []).some(id => id?.toString() === hotelId?.toString()) && !hiddenLeads.includes(l.id));
  const filtered = filter === 'all' ? hotelLeads : filter === 'locked' ? hotelLeads.filter(l => !isLeadUnlocked(l.id, hotelId)) : hotelLeads.filter(l => isLeadUnlocked(l.id, hotelId));

  const handleHideLead = (leadId) => {
    const updated = [...hiddenLeads, leadId];
    setHiddenLeads(updated);
    localStorage.setItem(`hiddenLeads_${hotelId}`, JSON.stringify(updated));
    addToast('Lead removed from your inbox', 'info');
  };

  const handleUnlock = (lead) => {
    const success = unlockLead(lead.id, hotelId);
    if (success) {
      addToast('Chat & Discussion unlocked for free!', 'success');
      setShowUnlockModal(false);
      setChatLead(lead);
    }
  };

  const handleSendQuote = (lead) => {
    if (!quoteForm.message || !quoteForm.price) { addToast('Please fill quote details', 'error'); return; }
    const hotelName = user?.name || 'Hotel Partner';
    sendQuote(lead.id, hotelId, hotelName, quoteForm.message, Number(quoteForm.price));
    addToast('Quote sent to customer! 10 credits deducted.', 'success');
    setQuoteForm({ message: '', price: '' });
    setSelectedLead(null);
  };

  return (
    <div className="fade-in">
      <div className="flex-between mb-3" style={{ marginBottom: 32 }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: 4 }}>Leads Inbox</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{hotelLeads.length} leads matched to your property</p>
        </div>
        <div className="flex-gap">
          {hiddenLeads.length > 0 && (
            <button 
              className="btn btn-sm btn-outline" 
              onClick={() => {
                setHiddenLeads([]);
                localStorage.removeItem(`hiddenLeads_${hotelId}`);
              }}
              style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
            >
              Restore {hiddenLeads.length} Hidden
            </button>
          )}
          {['all', 'locked', 'unlocked'].map(f => (
            <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter(f)} style={{ textTransform: 'capitalize' }}>
              {f === 'all' ? 'All Leads' : f === 'locked' ? 'Locked' : 'Unlocked'}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', border: '1px dashed var(--border)', background: 'white', borderRadius: 14 }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📥</div>
          <h3 style={{ fontFamily: 'var(--font-sans)', color: 'var(--text)', margin: '0 0 6px', fontSize: '1.2rem' }}>No leads found</h3>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>New customer requests matching your hotel will appear here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filtered.map(lead => {
            const unlocked = isLeadUnlocked(lead.id, hotelId);
            const rawDate = lead.createdAt || lead.created_at;
            const displayDate = rawDate && !isNaN(new Date(rawDate).getTime())
              ? new Date(rawDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
              : 'Today';

            const checkInDate = lead.checkIn ? new Date(lead.checkIn) : null;
            const checkOutDate = lead.checkOut ? new Date(lead.checkOut) : null;
            const checkInStr = checkInDate && !isNaN(checkInDate.getTime()) ? checkInDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Flexible';
            const checkOutStr = checkOutDate && !isNaN(checkOutDate.getTime()) ? checkOutDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Flexible';

            const nights = checkInDate && checkOutDate && !isNaN(checkInDate.getTime()) && !isNaN(checkOutDate.getTime())
              ? Math.max(1, Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)))
              : null;

            const existingQuote = quotes.find(q => q.leadId.toString() === lead.id.toString() && q.hotelId.toString() === hotelId);

            return (
              <div 
                key={lead.id} 
                className="card" 
                style={{ 
                  padding: '16px 20px', 
                  borderRadius: 14, 
                  border: '1px solid var(--border-light)', 
                  borderLeft: `4px solid ${existingQuote ? 'var(--success)' : unlocked ? 'var(--info)' : 'var(--accent)'}`,
                  background: 'white', 
                  boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12
                }}
              >
                {/* Header: Customer / Title + Request ID + Status + Date + Delete */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 8, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', border: '1px solid var(--border)' }}>
                      🛎️
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <strong style={{ fontSize: '1.05rem', color: 'var(--text)' }}>
                          {unlocked && lead.customerName ? lead.customerName : `Guest Request • ${lead.destination || 'Direct'}`}
                        </strong>
                        <span style={{ fontSize: '0.72rem', fontFamily: 'monospace', background: 'var(--bg)', padding: '2px 6px', borderRadius: 4, color: 'var(--text-secondary)' }}>
                          #{lead.id}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        Received {displayDate} • Purpose: <strong style={{ color: 'var(--text)' }}>{lead.purpose || 'Leisure'}</strong>
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {existingQuote ? (
                      <span className="badge badge-success" style={{ padding: '4px 10px', fontSize: '0.75rem', fontWeight: 600 }}>
                        ✓ Quote Sent (₹{existingQuote.price.toLocaleString()})
                      </span>
                    ) : unlocked ? (
                      <span className="badge badge-info" style={{ padding: '4px 10px', fontSize: '0.75rem', fontWeight: 600 }}>
                        🔓 Unlocked
                      </span>
                    ) : (
                      <span style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', padding: '4px 10px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600 }}>
                        🔒 New Lead
                      </span>
                    )}

                    <button 
                      onClick={() => handleHideLead(lead.id)}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1rem', padding: '4px', borderRadius: 6 }}
                      title="Hide Lead"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Compact Details Strip */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, background: 'var(--bg)', padding: '10px 14px', borderRadius: 10, fontSize: '0.84rem', alignItems: 'center' }}>
                  <span>📅 <strong>{checkInStr} → {checkOutStr}</strong> {nights ? <span style={{ color: 'var(--text-muted)' }}>({nights} {nights === 1 ? 'night' : 'nights'})</span> : ''}</span>
                  <span>👥 <strong>{lead.guests} {lead.guests === 1 ? 'Guest' : 'Guests'}</strong></span>
                  <span>🛏️ <strong>{lead.roomType || 'Standard Room'}</strong></span>
                  <span>💰 Target: <strong style={{ color: 'var(--primary)', fontWeight: 700 }}>₹{Number(lead.budget).toLocaleString()}</strong></span>
                </div>

                {/* Preferences / Custom Note (Clean quotation bubble) */}
                {lead.preferences && (
                  <div style={{ padding: '8px 12px', background: '#f8fafc', borderLeft: '3px solid var(--accent)', borderRadius: 6, fontSize: '0.82rem', color: 'var(--text)', fontStyle: 'italic' }}>
                    "{lead.preferences}"
                  </div>
                )}

                {/* Contact Details (if unlocked) */}
                {unlocked && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: '0.82rem', color: 'var(--text-secondary)', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '8px 12px', borderRadius: 8 }}>
                    <span>👤 <strong>{lead.customerName || 'Guest User'}</strong></span>
                    {lead.customerEmail && <span>✉️ {lead.customerEmail}</span>}
                    {lead.customerPhone && <span>📞 {lead.customerPhone}</span>}
                  </div>
                )}

                {/* Bottom Actions Row */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 2 }}>
                  {!unlocked && (
                    <button 
                      className="btn btn-primary btn-sm" 
                      style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                      onClick={() => { setSelectedLead(lead); handleUnlock(lead); }}
                    >
                      💬 Free Chat & Negotiate
                    </button>
                  )}

                  {unlocked && existingQuote && (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      {existingQuote.status === 'countered' && (
                        <span style={{ background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa', padding: '4px 10px', borderRadius: 6, fontSize: '0.8rem', fontWeight: 600 }}>
                          ⚠️ Customer Counter: ₹{existingQuote.price.toLocaleString()}
                        </span>
                      )}
                      <button className="btn btn-outline btn-sm" style={{ padding: '5px 12px', fontSize: '0.8rem' }} onClick={() => setChatLead(lead)}>
                        💬 Open Chat
                      </button>
                      {existingQuote.status === 'countered' && (
                        <button 
                          className="btn btn-success btn-sm" 
                          style={{ background: 'var(--success)', color: 'white', padding: '5px 12px', fontSize: '0.8rem', fontWeight: 600 }}
                          onClick={async () => {
                            try {
                              const hotelName = user?.name || 'Hotel Partner';
                              await sendQuote(lead.id, hotelId, hotelName, 'Counter-offer accepted! Deal confirmed.', existingQuote.price);
                              addToast(`Accepted customer offer of ₹${existingQuote.price.toLocaleString()}! Deal confirmed.`, 'success');
                            } catch (e) {
                              addToast('Failed to accept counter offer', 'error');
                            }
                          }}
                        >
                          ✅ Accept Counter-Offer
                        </button>
                      )}
                    </div>
                  )}

                  {unlocked && !existingQuote && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-outline btn-sm" style={{ padding: '5px 12px', fontSize: '0.8rem' }} onClick={() => setChatLead(lead)}>
                        Chat with Guest
                      </button>
                      <button className="btn btn-primary btn-sm" style={{ padding: '5px 14px', fontSize: '0.8rem' }} onClick={() => setSelectedLead(lead)}>
                        Send Custom Quote
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Unlock Modal */}
      {showUnlockModal && selectedLead && (
        <div className="modal-overlay" onClick={() => setShowUnlockModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 460, width: '92%', borderRadius: 16, padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.18)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--text)' }}>Unlock Lead Contact</h3>
              <button onClick={() => setShowUnlockModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: '0 0 16px' }}>Spend <strong>10 credits</strong> to view traveler contact details and submit quotes.</p>
            
            <div style={{ background: 'var(--bg)', border: '1px solid var(--border-light)', padding: '12px 16px', borderRadius: 10, marginBottom: 16, fontSize: '0.85rem' }}>
              <strong>{selectedLead.destination}</strong> • {selectedLead.guests} Guests • Budget: <strong>₹{Number(selectedLead.budget || 0).toLocaleString()}</strong>
            </div>
            
            <div className="flex-between" style={{ borderTop: '1px solid var(--border-light)', paddingTop: 14, marginBottom: 20 }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Your Available Balance</span>
              <strong style={{ fontSize: '1.1rem', color: 'var(--primary)', fontWeight: 700 }}>{getWalletBalance(hotelId)} Credits</strong>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn btn-outline btn-sm" style={{ padding: '8px 16px' }} onClick={() => setShowUnlockModal(false)}>Cancel</button>
              {getWalletBalance(hotelId) >= 10 ? (
                <button className="btn btn-primary btn-sm" style={{ padding: '8px 18px' }} onClick={() => handleUnlock(selectedLead)}>Unlock (10 Credits)</button>
              ) : (
                <button 
                  className="btn btn-sm" 
                  style={{ background: 'var(--accent)', color: 'white', fontWeight: 600, padding: '8px 16px' }} 
                  onClick={() => handleUnlock(selectedLead)}
                >
                  Unlock via 10% Commission
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quote Modal */}
      {selectedLead && !showUnlockModal && isLeadUnlocked(selectedLead.id, hotelId) && (
        <div className="modal-overlay" onClick={() => setSelectedLead(null)}>
          <div 
            className="modal" 
            onClick={e => e.stopPropagation()} 
            style={{ 
              maxWidth: 500, 
              width: '92%', 
              borderRadius: 16, 
              padding: '22px 24px', 
              boxShadow: '0 20px 40px rgba(0,0,0,0.18)',
              display: 'flex',
              flexDirection: 'column',
              gap: 14
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--text)' }}>
                  Send Custom Offer
                </h3>
                <p style={{ margin: '3px 0 0', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                  For <strong>{selectedLead.customerName || 'Guest User'}</strong> (Lead #{selectedLead.id})
                </p>
              </div>
              <button 
                onClick={() => setSelectedLead(null)} 
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                ✕
              </button>
            </div>

            {/* Quick Trip Details Chip Bar */}
            <div style={{ background: 'var(--bg)', padding: '8px 12px', borderRadius: 8, fontSize: '0.8rem', display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', border: '1px solid var(--border-light)' }}>
              <span>{selectedLead.checkIn ? new Date(selectedLead.checkIn).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''} – {selectedLead.checkOut ? new Date(selectedLead.checkOut).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}</span>
              <span>{selectedLead.roomType || 'Standard'}</span>
              <span>Target: <strong style={{ color: 'var(--primary)' }}>₹{Number(selectedLead.budget || 0).toLocaleString()}</strong></span>
            </div>

            {/* Price Input with Smart Auto-Fill */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text)' }}>
                  Special Offered Rate (₹)
                </label>
                <button 
                  type="button" 
                  onClick={() => {
                    const suggestedRate = Math.round((selectedLead.budget || 8000) * 0.92);
                    const hotelName = user?.name || 'our resort';
                    const perks = selectedLead.purpose === 'Honeymoon' ? 'complimentary sparkling wine, candlelit dinner & room upgrade' : 'complimentary breakfast buffet, high-speed Wi-Fi & late checkout';
                    setQuoteForm({
                      price: suggestedRate.toString(),
                      message: `Greetings from ${hotelName}! We are pleased to offer you this special rate of ₹${suggestedRate.toLocaleString()} including ${perks}. Looking forward to welcoming you!`
                    });
                    addToast('Auto-Fill Offer applied!', 'success');
                  }}
                  style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', borderRadius: 20, padding: '3px 10px', fontSize: '0.74rem', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                >
                  Auto-Fill Suggested Offer
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.95rem' }}>₹</span>
                <input 
                  type="number" 
                  className="form-input" 
                  placeholder="Enter total offer price (e.g. 9500)" 
                  value={quoteForm.price} 
                  onChange={e => setQuoteForm({ ...quoteForm, price: e.target.value })} 
                  style={{ paddingLeft: 28, fontSize: '1rem', fontWeight: 700, color: 'var(--primary)', height: 40 }}
                />
              </div>
            </div>

            {/* Personalized Message Input */}
            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
                Personalized Message & Inclusions
              </label>
              <textarea 
                className="form-textarea" 
                rows={3}
                placeholder="Highlight inclusions (e.g. complimentary breakfast buffet, late checkout, ocean view)..." 
                value={quoteForm.message} 
                onChange={e => setQuoteForm({ ...quoteForm, message: e.target.value })} 
                style={{ resize: 'none', fontSize: '0.84rem', background: 'var(--bg)' }}
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
              <button 
                className="btn btn-outline btn-sm" 
                style={{ padding: '8px 16px', fontSize: '0.84rem' }} 
                onClick={() => setSelectedLead(null)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary btn-sm" 
                style={{ padding: '8px 20px', fontSize: '0.84rem', fontWeight: 600 }} 
                onClick={() => handleSendQuote(selectedLead)}
              >
                Submit Quote ➔
              </button>
            </div>
          </div>
        </div>
      )}

      {chatLead && (
        <ChatModal 
          leadId={chatLead.id} 
          hotelId={hotelId} 
          sender="hotel" 
          onClose={() => setChatLead(null)} 
        />
      )}
    </div>
  );
}
