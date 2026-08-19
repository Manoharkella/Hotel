import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useApp } from '../../context/AppContext';

export default function QRPass() {
  const { id } = useParams();
  const { bookings, hotels } = useApp();
  const navigate = useNavigate();

  const booking = bookings.find(b => b.id === id);
  if (!booking) return (
    <div style={{ textAlign: 'center', padding: '100px 0' }}>
      <h3 style={{ fontFamily: 'var(--font-sans)', color: 'var(--text-secondary)' }}>Booking not found</h3>
    </div>
  );
  
  const hotel = hotels.find(h => h.id === booking.hotelId);

  return (
    <div style={{ maxWidth: 500, margin: '0 auto', padding: 24, minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }} className="fade-in">
      <button 
        className="btn btn-outline btn-sm mb-3" 
        onClick={() => navigate(-1)} 
        style={{ alignSelf: 'flex-start', border: 'none', padding: 0, color: 'var(--text-muted)' }}
      >
        ← Back to Trips
      </button>

      <div className="card" style={{ width: '100%', background: 'var(--primary)', color: 'white', overflow: 'hidden', boxShadow: 'var(--shadow-xl)', borderRadius: 24 }}>
        {/* Pass Header */}
        <div style={{ padding: '32px 32px 24px', borderBottom: '1px dashed rgba(255,255,255,0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', fontWeight: 600, lineHeight: 1.1, marginBottom: 8, color: 'var(--accent)' }}>
                {booking.hotelName}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {hotel?.location || 'India'}
              </div>
            </div>
            <span style={{ 
              background: booking.status === 'checked-in' ? 'var(--success)' : 'var(--accent)', 
              color: booking.status === 'checked-in' ? 'white' : 'var(--primary)', 
              padding: '6px 12px', borderRadius: 4, fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em'
            }}>
              {booking.status === 'checked-in' ? 'Checked In' : 'Confirmed'}
            </span>
          </div>
        </div>

        {/* QR Code Section */}
        <div style={{ background: 'white', padding: '40px 0', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <QRCodeSVG 
            value={booking.qrCode} 
            size={220} 
            level="H"
            fgColor="var(--primary)"
          />
        </div>

        {/* Pass Details */}
        <div style={{ padding: '24px 32px 32px' }}>
          <div style={{ textAlign: 'center', marginBottom: 32, fontFamily: 'monospace', fontSize: '1rem', letterSpacing: 4, opacity: 0.9, color: 'var(--accent)' }}>
            {booking.qrCode}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Check-In</div>
              <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{new Date(booking.checkIn).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Check-Out</div>
              <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{new Date(booking.checkOut).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Room Type</div>
              <div style={{ fontWeight: 500, fontSize: '1rem' }}>{booking.roomType}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Guest Name</div>
              <div style={{ fontWeight: 500, fontSize: '1rem' }}>{booking.customerName}</div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: 32, paddingTop: 24, textAlign: 'center' }}>
            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', margin: 0 }}>Present this code at the reception desk for instant contactless check-in.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
