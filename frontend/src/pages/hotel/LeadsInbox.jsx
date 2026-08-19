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

  const hotelLeads = leads.filter(l => l.matchedHotelIds?.includes(hotelId) && !hiddenLeads.includes(l.id));
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
      addToast('Lead unlocked! Contact details are now visible.', 'success');
      setShowUnlockModal(false);
    } else {
      addToast('Not enough credits! Please top up.', 'error');
    }
  };

  const handleSendQuote = (lead) => {
    if (!quoteForm.message || !quoteForm.price) { addToast('Please fill quote details', 'error'); return; }
    sendQuote(lead.id, hotelId, 'The Grand Oceanview Resort', quoteForm.message, Number(quoteForm.price));
    addToast('Quote sent to customer!', 'success');
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
        <div style={{ textAlign: 'center', padding: '100px 0', border: '1px dashed var(--border)', background: 'white' }}>
          <h3 style={{ fontFamily: 'var(--font-sans)', color: 'var(--text-secondary)' }}>No leads found</h3>
          <p style={{ color: 'var(--text-muted)' }}>New leads matching your criteria will appear here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {filtered.map(lead => {
            const unlocked = isLeadUnlocked(lead.id, hotelId);
            return (
              <div key={lead.id} className="card" style={{ borderLeft: `4px solid ${unlocked ? 'var(--success)' : 'var(--border)'}` }}>
                <div className="card-body" style={{ padding: 32 }}>
                  
                  <div className="flex-between" style={{ marginBottom: 24 }}>
                    <div className="flex-gap">
                      <span style={{ 
                        fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '4px 10px',
                        background: unlocked ? 'var(--success-bg)' : 'var(--bg)', color: unlocked ? 'var(--success)' : 'var(--text-secondary)', border: `1px solid ${unlocked ? 'var(--success)' : 'var(--border)'}`
                      }}>
                        {unlocked ? 'Unlocked' : 'Locked'}
                      </span>
                      <span style={{ 
                        fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '4px 10px',
                        background: lead.status === 'active' ? 'var(--info-bg)' : lead.status === 'won' ? 'var(--success-bg)' : 'var(--bg)',
                        color: lead.status === 'active' ? 'var(--info)' : lead.status === 'won' ? 'var(--success)' : 'var(--text-secondary)', border: '1px solid transparent'
                      }}>
                        {lead.status}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{new Date(lead.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                      <button 
                        onClick={() => handleHideLead(lead.id)}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.2rem', padding: 4 }}
                        title="Delete Lead"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 24, marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid var(--border-light)' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 4 }}>Destination</div>
                      <div style={{ fontWeight: 600, color: 'var(--text)' }}>{lead.destination}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 4 }}>Dates</div>
                      <div style={{ fontWeight: 500, color: 'var(--text)' }}>{new Date(lead.checkIn).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} → {new Date(lead.checkOut).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 4 }}>Guests</div>
                      <div style={{ fontWeight: 600, color: 'var(--text)' }}>{lead.guests} People</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 4 }}>Budget</div>
                      <div style={{ fontWeight: 600, color: 'var(--primary)', fontFamily: 'var(--font-serif)', fontSize: '1.2rem' }}>₹{lead.budget.toLocaleString()} <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-sans)', fontWeight: 400, color: 'var(--text-secondary)' }}>/ night</span></div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 4 }}>Room Type</div>
                      <div style={{ fontWeight: 500, color: 'var(--text)' }}>{lead.roomType}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 4 }}>Purpose</div>
                      <div style={{ fontWeight: 600, color: 'var(--accent)' }}>{lead.purpose || 'Leisure'}</div>
                    </div>
                  </div>

                  {lead.preferences && (
                    <div style={{ background: 'var(--bg)', padding: '16px 20px', borderLeft: '2px solid var(--accent)', marginBottom: 24 }}>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text)', margin: 0, fontStyle: 'italic' }}>"{lead.preferences}"</p>
                    </div>
                  )}

                  {unlocked && (
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: 20, marginBottom: 24 }}>
                      <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--primary)', fontWeight: 600, marginBottom: 8 }}>Contact Details</div>
                      <div style={{ fontSize: '0.95rem', color: 'var(--text)', display: 'flex', gap: 16 }}>
                        <strong>{lead.customerName}</strong>
                        <span style={{ color: 'var(--border)' }}>|</span>
                        <span>{lead.customerEmail}</span>
                        <span style={{ color: 'var(--border)' }}>|</span>
                        <span>{lead.customerPhone}</span>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                    {!unlocked && (
                      <button className="btn btn-outline" onClick={() => { setSelectedLead(lead); setShowUnlockModal(true); }}>
                        Unlock for 10 Credits
                      </button>
                    )}
                    {unlocked && (() => {
                      const existingQuote = quotes.find(q => q.leadId.toString() === lead.id.toString() && q.hotelId.toString() === hotelId);
                      if (existingQuote) {
                        return (
                          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                            <div style={{ background: existingQuote.status === 'countered' ? 'var(--warning-bg)' : 'var(--success-bg)', color: existingQuote.status === 'countered' ? 'var(--warning)' : 'var(--success)', padding: '10px 16px', borderRadius: 4, fontSize: '0.9rem', fontWeight: 600, border: `1px solid ${existingQuote.status === 'countered' ? 'var(--warning)' : 'var(--success)'}` }}>
                              {existingQuote.status === 'countered' ? `⚠️ Customer Counter-Offer: ₹${existingQuote.price.toLocaleString()}` : `✓ Quote Sent: ₹${existingQuote.price.toLocaleString()} (${existingQuote.status})`}
                            </div>
                            <button className="btn btn-outline" onClick={() => setChatLead(lead)}>💬 Chat</button>
                          </div>
                        );
                      }
                      return lead.status === 'active' && (
                        <>
                          <button className="btn btn-outline" onClick={() => setChatLead(lead)}>💬 Chat</button>
                          <button className="btn btn-primary" onClick={() => setSelectedLead(lead)}>
                            Send Custom Quote
                          </button>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Unlock Modal */}
      {showUnlockModal && selectedLead && (
        <div className="modal-overlay" onClick={() => setShowUnlockModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', marginBottom: 12 }}>Unlock Lead</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Spend <strong>10 credits</strong> to view contact details and submit a quote.</p>
            
            <div style={{ background: 'var(--bg)', border: '1px solid var(--border-light)', padding: 16, marginBottom: 24 }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--text)' }}>
                <strong>{selectedLead.destination}</strong> • {selectedLead.guests} Guests • ₹{selectedLead.budget.toLocaleString()} / Night
              </div>
            </div>
            
            <div className="flex-between" style={{ borderTop: '1px solid var(--border-light)', paddingTop: 16, marginBottom: 32 }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Available Balance</span>
              <strong style={{ fontSize: '1.2rem', fontFamily: 'var(--font-serif)', color: 'var(--primary)' }}>{getWalletBalance(hotelId)} Credits</strong>
            </div>
            
            <div className="modal-actions" style={{ marginTop: 0 }}>
              <button className="btn btn-outline" onClick={() => setShowUnlockModal(false)}>Cancel</button>
              {getWalletBalance(hotelId) >= 10 ? (
                <button className="btn btn-primary" onClick={() => handleUnlock(selectedLead)}>Confirm (10 Credits)</button>
              ) : (
                <button className="btn" style={{ background: 'var(--danger)', color: 'white' }} onClick={() => navigate('/hotel/wallet')}>Insufficient Balance - Buy Credits</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quote Modal */}
      {selectedLead && !showUnlockModal && isLeadUnlocked(selectedLead.id, hotelId) && (
        <div className="modal-overlay" onClick={() => setSelectedLead(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', marginBottom: 12 }}>Offer for {selectedLead.customerName}</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>Submit a custom quote for this traveler.</p>
            
            <div className="form-group">
              <label className="form-label">Personalized Message</label>
              <textarea 
                className="form-textarea" 
                placeholder="Highlight why your property is perfect for their stay..." 
                value={quoteForm.message} 
                onChange={e => setQuoteForm({ ...quoteForm, message: e.target.value })} 
                style={{ background: 'var(--bg)', minHeight: 120 }}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Proposed Price per Night (₹)</label>
              <input 
                className="form-input" 
                type="number" 
                placeholder="e.g. 8500" 
                value={quoteForm.price} 
                onChange={e => setQuoteForm({ ...quoteForm, price: e.target.value })} 
                style={{ background: 'var(--bg)', maxWidth: 200 }}
              />
            </div>
            
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setSelectedLead(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => handleSendQuote(selectedLead)}>Submit Quote</button>
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
