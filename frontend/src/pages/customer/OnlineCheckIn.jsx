import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';

export default function OnlineCheckIn() {
  const { id } = useParams();
  const { bookings, completeCheckIn } = useApp();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ idDocumentUrl: '', selectedRoom: '', arrivalTime: '14:00', specialRequests: '', accompanyingGuests: '' });

  const booking = bookings.find(b => b.id === id);
  if (!booking) return (
    <div style={{ textAlign: 'center', padding: '100px 0', border: '1px dashed var(--border)', background: 'white' }}>
      <h3 style={{ fontFamily: 'var(--font-sans)', color: 'var(--text-secondary)' }}>Booking not found</h3>
    </div>
  );

  const handleComplete = () => {
    completeCheckIn(booking.id, form);
    addToast('Check-in completed! Your QR pass is ready.', 'success');
    navigate(`/customer/qr/${booking.id}`);
  };

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: 24, paddingBottom: 80 }} className="fade-in">
      <button 
        className="btn btn-outline btn-sm mb-3" 
        onClick={() => navigate(-1)} 
        style={{ border: 'none', padding: 0, color: 'var(--text-muted)' }}
      >
        ← Back to Trips
      </button>
      
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: 8, fontFamily: 'var(--font-serif)', color: 'var(--primary)' }}>Smart Check-In</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', letterSpacing: '0.05em' }}>
          {booking.hotelName} • {new Date(booking.checkIn).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
        </p>
      </div>

      {/* Stepper */}
      <div className="stepper" style={{ marginBottom: 48, display: 'flex', justifyContent: 'space-between', padding: '0 10px' }}>
        {['Verification', 'Select Room', 'Arrival', 'Confirm'].map((label, index) => {
          const s = index + 1;
          const isActive = step === s;
          const isCompleted = step > s;
          return (
            <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, position: 'relative' }}>
              <div 
                style={{ 
                  width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isCompleted ? 'var(--primary)' : isActive ? 'var(--accent)' : 'var(--bg)',
                  color: (isCompleted || isActive) ? 'white' : 'var(--text-muted)',
                  fontWeight: 600, zIndex: 2, border: `2px solid ${isCompleted || isActive ? 'transparent' : 'var(--border)'}`,
                  transition: 'var(--transition)'
                }}
              >
                {isCompleted ? '✓' : s}
              </div>
              <div style={{ marginTop: 12, fontSize: '0.75rem', fontWeight: isActive ? 600 : 500, color: isActive ? 'var(--text)' : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>
                {label}
              </div>
              {s < 4 && (
                <div 
                  style={{ 
                    position: 'absolute', top: 20, left: '50%', width: '100%', height: 2,
                    background: isCompleted ? 'var(--primary)' : 'var(--border)', zIndex: 1,
                    transition: 'var(--transition)'
                  }} 
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="card" style={{ boxShadow: 'var(--shadow-lg)' }}>
        <div className="card-body" style={{ padding: 40 }}>
          {step === 1 && (
            <div className="fade-in">
              <h3 style={{ fontSize: '1.5rem', marginBottom: 8, fontFamily: 'var(--font-serif)' }}>Identity Verification</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 32, fontSize: '0.9rem' }}>Upload a government-issued photo ID for secure verification.</p>
              
              <div 
                style={{ 
                  border: `2px dashed ${form.idDocumentUrl ? 'var(--success)' : 'var(--border)'}`, 
                  borderRadius: 'var(--radius-lg)', padding: '64px 40px', textAlign: 'center', 
                  cursor: 'pointer', transition: 'var(--transition)', 
                  background: form.idDocumentUrl ? 'var(--success-bg)' : 'var(--bg-card)' 
                }}
                onClick={() => setForm({ ...form, idDocumentUrl: '/mock-id.jpg' })}
              >
                {form.idDocumentUrl ? (
                  <>
                    <div style={{ fontSize: '2rem', marginBottom: 16, color: 'var(--success)' }}>✓</div>
                    <p style={{ fontWeight: 600, color: 'var(--success)', fontSize: '1.1rem' }}>ID Successfully Verified</p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 8 }}>Click to re-upload if needed</p>
                  </>
                ) : (
                  <>
                    <div style={{ marginBottom: 16, color: 'var(--text-muted)' }}>
                       <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                    </div>
                    <p style={{ fontWeight: 600, color: 'var(--primary)', fontSize: '1.1rem' }}>Tap to upload ID document</p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 8 }}>Aadhaar, Passport, or Driving License</p>
                  </>
                )}
              </div>
              <button 
                className="btn btn-primary btn-block" 
                style={{ marginTop: 32, padding: '16px', fontSize: '1.1rem', letterSpacing: '0.1em' }} 
                disabled={!form.idDocumentUrl} 
                onClick={() => setStep(2)}
              >
                Continue to Next Step
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="fade-in">
              <h3 style={{ fontSize: '1.5rem', marginBottom: 8, fontFamily: 'var(--font-serif)' }}>Select Your Room</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 32, fontSize: '0.9rem' }}>Choose your preferred {booking.roomType} location from the floor plan.</p>
              
              <div style={{ background: 'var(--bg)', padding: 32, borderRadius: 16, marginBottom: 32, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, width: '100%', maxWidth: 320 }}>
                  <div style={{ gridColumn: '1 / -1', textAlign: 'center', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 2, color: 'var(--text-muted)', marginBottom: 8 }}>Ocean View ↑</div>
                  
                  {[301, 302, 303, 304, 305, 306, 307, 308].map(roomNum => {
                    const isOccupied = [302, 305, 307].includes(roomNum);
                    const isSelected = form.selectedRoom === roomNum.toString();
                    return (
                      <div 
                        key={roomNum}
                        onClick={() => !isOccupied && setForm({ ...form, selectedRoom: roomNum.toString() })}
                        style={{
                          height: 80, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexDirection: 'column', cursor: isOccupied ? 'not-allowed' : 'pointer',
                          background: isOccupied ? 'var(--border)' : isSelected ? 'var(--primary)' : 'white',
                          color: isOccupied ? 'var(--text-muted)' : isSelected ? 'white' : 'var(--text)',
                          border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--border-light)'}`,
                          boxShadow: isSelected ? 'var(--shadow)' : 'none', transition: 'all 0.2s'
                        }}
                      >
                        <span style={{ fontWeight: 600, fontSize: '1.2rem' }}>{roomNum}</span>
                        <span style={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>{isOccupied ? 'Booked' : isSelected ? 'Selected' : 'Available'}</span>
                      </div>
                    )
                  })}
                  
                  <div style={{ gridColumn: '1 / -1', textAlign: 'center', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 2, color: 'var(--text-muted)', marginTop: 8 }}>Garden View ↓</div>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: 16 }}>
                <button className="btn btn-outline" onClick={() => setStep(1)} style={{ padding: '0 32px' }}>Back</button>
                <button className="btn btn-primary" style={{ flex: 1, padding: '16px', fontSize: '1.1rem', letterSpacing: '0.1em' }} disabled={!form.selectedRoom} onClick={() => setStep(3)}>
                  Confirm Room
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="fade-in">
              <h3 style={{ fontSize: '1.5rem', marginBottom: 24, fontFamily: 'var(--font-serif)' }}>Arrival Preferences</h3>
              
              <div className="form-group" style={{ marginBottom: 24 }}>
                <label className="form-label" style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Expected Arrival Time</label>
                <input 
                  className="form-input" 
                  type="time" 
                  value={form.arrivalTime} 
                  onChange={e => setForm({ ...form, arrivalTime: e.target.value })} 
                  style={{ padding: '12px 16px', fontSize: '1.1rem' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 24 }}>
                <label className="form-label" style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Accompanying Guests</label>
                <input 
                  className="form-input" 
                  placeholder="e.g., Priya Sharma, Rahul Jr (Optional)" 
                  value={form.accompanyingGuests} 
                  onChange={e => setForm({ ...form, accompanyingGuests: e.target.value })} 
                  style={{ padding: '12px 16px', fontSize: '1.1rem' }}
                />
              </div>
              
              <div className="form-group" style={{ marginBottom: 32 }}>
                <label className="form-label" style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Special Requests</label>
                <textarea 
                  className="form-textarea" 
                  placeholder="e.g., Extra pillows, late check-out, anniversary setup..." 
                  value={form.specialRequests} 
                  onChange={e => setForm({ ...form, specialRequests: e.target.value })} 
                  style={{ minHeight: 120, padding: 16 }}
                />
              </div>
              
              <div style={{ display: 'flex', gap: 16 }}>
                <button className="btn btn-outline" onClick={() => setStep(2)} style={{ padding: '0 32px' }}>Back</button>
                <button className="btn btn-primary" style={{ flex: 1, padding: '16px', fontSize: '1.1rem', letterSpacing: '0.1em' }} onClick={() => setStep(4)}>
                  Review & Confirm
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="fade-in">
              <h3 style={{ fontSize: '1.5rem', marginBottom: 8, fontFamily: 'var(--font-serif)' }}>Final Confirmation</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: '0.9rem' }}>Please review your check-in details before generating your QR Pass.</p>
              
              <div style={{ background: 'var(--bg)', border: '1px solid var(--border-light)', padding: '24px 32px', marginBottom: 32 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontSize: '0.95rem' }}>
                  <div className="flex-between">
                    <span style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.8rem' }}>Hotel</span>
                    <span style={{ fontWeight: 600, color: 'var(--text)' }}>{booking.hotelName}</span>
                  </div>
                  <div className="flex-between">
                    <span style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.8rem' }}>Room</span>
                    <span style={{ fontWeight: 600, color: 'var(--text)' }}>{booking.roomType}</span>
                  </div>
                  <div className="flex-between">
                    <span style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.8rem' }}>Check-In</span>
                    <span style={{ fontWeight: 600, color: 'var(--text)' }}>{new Date(booking.checkIn).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                  <div className="flex-between">
                    <span style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.8rem' }}>Room Assignment</span>
                    <span style={{ fontWeight: 600, color: 'var(--primary)' }}>Room {form.selectedRoom}</span>
                  </div>
                  <div className="flex-between">
                    <span style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.8rem' }}>Arrival Time</span>
                    <span style={{ fontWeight: 600, color: 'var(--text)' }}>{form.arrivalTime}</span>
                  </div>
                  {form.accompanyingGuests && (
                    <div className="flex-between">
                      <span style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.8rem' }}>Additional Guests</span>
                      <span style={{ fontWeight: 600, color: 'var(--text)', textAlign: 'right', maxWidth: '60%' }}>{form.accompanyingGuests}</span>
                    </div>
                  )}
                  <div className="flex-between" style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 8 }}>
                    <span style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.8rem' }}>ID Verification</span>
                    <span style={{ fontWeight: 600, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: '1rem' }}>✓</span> Verified
                    </span>
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: 16 }}>
                <button className="btn btn-outline" onClick={() => setStep(3)} style={{ padding: '0 32px' }}>Back</button>
                <button 
                  className="btn btn-accent" 
                  style={{ flex: 1, padding: '16px', fontSize: '1.1rem', letterSpacing: '0.1em' }} 
                  onClick={handleComplete}
                >
                  Generate QR Pass
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
