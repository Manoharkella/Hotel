import { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function toDate(str) {
  if (!str) return null;
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}
function dKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

export default function AdminCalendar() {
  const { leads, bookings } = useApp();
  const [cur, setCur] = useState(new Date());
  const [selected, setSelected] = useState(null);
  const [popup, setPopup] = useState(null);

  const year = cur.getFullYear();
  const month = cur.getMonth();
  const todayKey = dKey(new Date());

  const stats = useMemo(() => {
    const m = {};
    leads.forEach(l => {
      const d = toDate(l.created_at || l.createdAt);
      if (!d) return;
      const k = dKey(d);
      if (!m[k]) m[k] = { leads: [], comm: 0, bookings: [] };
      m[k].leads.push(l);
    });
    bookings.forEach(b => {
      const d = toDate(b.created_at || b.createdAt);
      if (!d) return;
      const k = dKey(d);
      if (!m[k]) m[k] = { leads: [], comm: 0, bookings: [] };
      m[k].comm += (b.commission_amount || b.commissionAmount || 0);
      m[k].bookings.push(b);
    });
    return m;
  }, [leads, bookings]);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDays = new Date(year, month, 0).getDate();

  const cells = [];
  for (let i = firstDay - 1; i >= 0; i--) cells.push({ day: prevDays - i, cur: false });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, cur: true, key: dKey(new Date(year, month, d)) });
  const rem = cells.length % 7;
  if (rem) for (let i = 1; i <= 7 - rem; i++) cells.push({ day: i, cur: false });

  const monthly = useMemo(() => {
    let tl = 0, tc = 0, tb = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const s = stats[dKey(new Date(year, month, d))];
      if (s) { tl += s.leads.length; tc += s.comm; tb += s.bookings.length; }
    }
    return { leads: tl, comm: tc, bookings: tb };
  }, [stats, year, month, daysInMonth]);

  const openPopup = (cell) => {
    if (!cell.cur) return;
    const s = stats[cell.key] || { leads: [], comm: 0, bookings: [] };
    setSelected(new Date(year, month, cell.day));
    setPopup(s);
  };

  return (
    <div className="fade-in">
      {/* Summary Row */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { label: 'Leads This Month', value: monthly.leads, icon: '📩', color: '#6366f1' },
          { label: 'Commission Earned', value: `₹${monthly.comm.toLocaleString('en-IN')}`, icon: '💰', color: '#ec4899' },
          { label: 'Bookings', value: monthly.bookings, icon: '📋', color: '#0ea5e9' },
        ].map((c, i) => (
          <div key={i} className="slide-up" style={{
            flex: '1 1 180px', background: 'white', borderRadius: 14,
            padding: '20px 22px', border: '1px solid #f0f0f5',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            display: 'flex', alignItems: 'center', gap: 16,
            animationDelay: `${i * 0.05}s`,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: `${c.color}12`, color: c.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.3rem', flexShrink: 0,
            }}>{c.icon}</div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', lineHeight: 1.1 }}>{c.value}</div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 3 }}>{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Calendar */}
      <div className="slide-up" style={{
        background: 'white', borderRadius: 16, border: '1px solid #f0f0f5',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden',
      }}>
        {/* Nav */}
        <div style={{
          padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderBottom: '1px solid #f0f0f5',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => setCur(new Date(year, month - 1, 1))} style={navBtn}>‹</button>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#1e293b', minWidth: 180, textAlign: 'center' }}>
              {MONTHS[month]} {year}
            </h3>
            <button onClick={() => setCur(new Date(year, month + 1, 1))} style={navBtn}>›</button>
          </div>
          <button onClick={() => setCur(new Date())} style={{
            background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569',
            padding: '6px 16px', borderRadius: 8, cursor: 'pointer',
            fontSize: '0.8rem', fontWeight: 600,
          }}>Today</button>
        </div>

        {/* Day headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid #f0f0f5' }}>
          {DAYS.map(d => (
            <div key={d} style={{
              textAlign: 'center', padding: '10px 0', fontSize: '0.7rem',
              fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>{d}</div>
          ))}
        </div>

        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {cells.map((cell, i) => {
            const s = cell.key ? stats[cell.key] : null;
            const isToday = cell.key === todayKey;
            const isSelected = selected && cell.key === dKey(selected);
            const hasData = s && (s.leads.length > 0 || s.comm > 0);

            return (
              <div key={i} onClick={() => openPopup(cell)} style={{
                minHeight: 84, padding: '6px 8px',
                borderRight: (i + 1) % 7 === 0 ? 'none' : '1px solid #f7f7fa',
                borderBottom: '1px solid #f7f7fa',
                cursor: cell.cur ? 'pointer' : 'default',
                opacity: cell.cur ? 1 : 0.25,
                background: isSelected ? '#f0f4ff' : 'transparent',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { if (cell.cur && !isSelected) e.currentTarget.style.background = '#fafbff'; }}
              onMouseLeave={e => { if (cell.cur && !isSelected) e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{
                  fontSize: '0.82rem', fontWeight: isToday ? 700 : 500,
                  color: isToday ? 'white' : i % 7 === 0 ? '#ef4444' : '#475569',
                  background: isToday ? '#6366f1' : 'none',
                  width: isToday ? 26 : 'auto', height: isToday ? 26 : 'auto',
                  borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 4,
                }}>{cell.day}</div>

                {cell.cur && hasData && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {s.leads.length > 0 && (
                      <div style={{
                        fontSize: '0.62rem', fontWeight: 600, color: '#6366f1',
                        background: '#eef2ff', padding: '2px 6px', borderRadius: 4,
                        display: 'inline-block', width: 'fit-content',
                      }}>
                        {s.leads.length} lead{s.leads.length > 1 ? 's' : ''}
                      </div>
                    )}
                    {s.comm > 0 && (
                      <div style={{
                        fontSize: '0.62rem', fontWeight: 600, color: '#ec4899',
                        background: '#fdf2f8', padding: '2px 6px', borderRadius: 4,
                        display: 'inline-block', width: 'fit-content',
                      }}>
                        ₹{s.comm.toLocaleString('en-IN')}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Popup */}
      {selected && popup && (
        <div onClick={() => { setSelected(null); setPopup(null); }} style={{
          position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 9999,
          animation: 'acFadeIn .15s ease',
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'white', borderRadius: 20, width: '92%', maxWidth: 480,
            maxHeight: '75vh', overflow: 'hidden',
            boxShadow: '0 24px 48px rgba(0,0,0,0.15)',
            animation: 'acSlideUp .25s ease',
          }}>
            {/* Header */}
            <div style={{
              padding: '24px 28px 20px', borderBottom: '1px solid #f0f0f5',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Daily Summary</div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>
                  {selected.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
                </h3>
              </div>
              <button onClick={() => { setSelected(null); setPopup(null); }} style={{
                background: '#f1f5f9', border: 'none', width: 32, height: 32,
                borderRadius: 8, cursor: 'pointer', fontSize: '0.9rem', color: '#64748b',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>✕</button>
            </div>

            <div style={{ padding: '20px 28px 28px', overflowY: 'auto', maxHeight: 'calc(75vh - 90px)' }}>
              {/* Two stat boxes */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>
                <div style={{
                  background: '#f8faff', border: '1px solid #e8ecff', borderRadius: 14, padding: 18, textAlign: 'center',
                }}>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#6366f1', lineHeight: 1 }}>{popup.leads.length}</div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 6 }}>Leads Received</div>
                </div>
                <div style={{
                  background: '#fef7fb', border: '1px solid #fce7f3', borderRadius: 14, padding: 18, textAlign: 'center',
                }}>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#ec4899', lineHeight: 1 }}>₹{popup.comm.toLocaleString('en-IN')}</div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 6 }}>Commission</div>
                </div>
              </div>

              {/* Lead list */}
              {popup.leads.length > 0 && (
                <>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Leads</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                    {popup.leads.map((l, i) => (
                      <div key={l.id || i} style={{
                        background: '#f8fafc', borderRadius: 10, padding: '12px 14px',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#1e293b' }}>📍 {l.destination}</div>
                          <div style={{ fontSize: '0.73rem', color: '#94a3b8', marginTop: 2 }}>
                            {l.guests || 1} guest{(l.guests||1)>1?'s':''} · ₹{(l.budget||0).toLocaleString('en-IN')} budget
                          </div>
                        </div>
                        <span style={{
                          fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase',
                          padding: '3px 8px', borderRadius: 6,
                          background: l.status === 'won' ? '#ecfdf5' : l.status === 'active' ? '#eef2ff' : '#fef2f2',
                          color: l.status === 'won' ? '#059669' : l.status === 'active' ? '#6366f1' : '#ef4444',
                        }}>{l.status || 'active'}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Booking list */}
              {popup.bookings.length > 0 && (
                <>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Commission Breakdown</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {popup.bookings.map((b, i) => {
                      const c = b.commission_amount || b.commissionAmount || 0;
                      return (
                        <div key={b.id || i} style={{
                          background: '#f8fafc', borderRadius: 10, padding: '12px 14px',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        }}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#1e293b' }}>Booking #{b.id}</div>
                            <div style={{ fontSize: '0.73rem', color: '#94a3b8', marginTop: 2 }}>
                              Total ₹{(b.total_price || b.totalPrice || 0).toLocaleString('en-IN')}
                            </div>
                          </div>
                          <span style={{
                            fontWeight: 700, fontSize: '0.95rem',
                            color: c > 0 ? '#ec4899' : '#059669',
                          }}>
                            {c > 0 ? `₹${c.toLocaleString('en-IN')}` : '₹0'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Empty */}
              {popup.leads.length === 0 && popup.bookings.length === 0 && (
                <div style={{ textAlign: 'center', padding: '28px 0', color: '#94a3b8' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: 8, opacity: 0.4 }}>📭</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#64748b' }}>No activity</div>
                  <div style={{ fontSize: '0.8rem', marginTop: 4 }}>No leads or commissions on this day</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes acFadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes acSlideUp { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>
    </div>
  );
}

const navBtn = {
  background: 'none', border: '1px solid #e2e8f0', color: '#475569',
  width: 32, height: 32, borderRadius: 8, cursor: 'pointer',
  fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
};
