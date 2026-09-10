import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enIN } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import HotelRoomCalendar from './HotelRoomCalendar';

const locales = {
  'en-IN': enIN,
}
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

export default function HotelBookings() {
  const { bookings, checkins, checkOutBooking } = useApp();
  const { user } = useAuth();
  const hotelId = (user?.hotelId || user?.id || '11').toString();
  const [tab, setTab] = useState('all');
  const [viewMode, setViewMode] = useState('list');

  const hotelBookings = bookings.filter(b => 
    b.hotelId?.toString() === hotelId ||
    (hotelId === '11' && (b.hotelName?.toLowerCase().includes('radisson') || b.hotelId?.toString() === '11'))
  ).filter(b => b.customerName !== 'Arjun Verma' && b.customerName !== 'Priya Sharma');
  const filtered = tab === 'all' ? hotelBookings : hotelBookings.filter(b => b.status === tab);

  const sc = { 
    confirmed: { label: 'Confirmed', cls: 'badge-success' }, 
    'checked-in': { label: 'Checked In', cls: 'badge-primary' }, 
    'checked-out': { label: 'Checked Out', cls: 'badge-neutral' }, 
    cancelled: { label: 'Cancelled', cls: 'badge-danger' } 
  };

  return (
    <div className="fade-in">
      <div className="flex-between" style={{ marginBottom: 32 }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: 4 }}>Booking Management</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Overview of all guest arrivals and stays</p>
        </div>
        
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ display: 'flex', background: 'var(--bg)', padding: 4, borderRadius: 8, marginRight: 16 }}>
            <button className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setViewMode('list')} style={{ border: 'none', boxShadow: 'none' }}>List</button>
            <button className={`btn btn-sm ${viewMode === 'calendar' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setViewMode('calendar')} style={{ border: 'none', boxShadow: 'none' }}>Calendar</button>
          </div>
          {['all', 'confirmed', 'checked-in', 'checked-out'].map(t => (
            <button 
              key={t} 
              className={`btn btn-sm ${tab === t ? 'btn-primary' : 'btn-outline'}`} 
              onClick={() => setTab(t)}
              style={{ padding: '8px 16px', textTransform: 'capitalize' }}
            >
              {t === 'all' ? 'All Bookings' : sc[t]?.label || t} 
              <span style={{ 
                background: tab === t ? 'rgba(255,255,255,0.2)' : 'var(--bg)', 
                color: tab === t ? 'white' : 'var(--text)', 
                padding: '2px 8px', borderRadius: 12, marginLeft: 8, fontSize: '0.7rem' 
              }}>
                {t === 'all' ? hotelBookings.length : hotelBookings.filter(b => b.status === t).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <HotelRoomCalendar />
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '100px 0', border: '1px dashed var(--border)', background: 'white', borderRadius: 16 }}>
          <h3 style={{ fontFamily: 'var(--font-sans)', color: 'var(--text-secondary)' }}>No bookings found</h3>
          <p style={{ color: 'var(--text-muted)' }}>Reservations matching this status will appear here.</p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Guest Name</th>
                <th>Room Type</th>
                <th>Check-In</th>
                <th>Check-Out</th>
                <th>Total Value</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(b => {
                const ci = checkins.find(c => c.bookingId === b.id);
                return (
                  <tr key={b.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text)' }}>{b.customerName}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{b.roomType}</td>
                    <td style={{ color: 'var(--text)' }}>
                      {new Date(b.checkIn).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      {ci?.arrivalTime && <div style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 600, marginTop: 4 }}>ETA: {ci.arrivalTime}</div>}
                    </td>
                    <td style={{ color: 'var(--text)' }}>{new Date(b.checkOut).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '1.05rem' }}>₹{b.totalPrice?.toLocaleString()}</div>
                      {b.commissionAmount > 0 ? (
                        <div style={{ fontSize: '0.74rem', color: '#c2410c', fontWeight: 600 }}>
                          Payout: ₹{b.payoutAmount?.toLocaleString()} (10% fee: -₹{b.commissionAmount?.toLocaleString()})
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.74rem', color: '#16a34a', fontWeight: 600 }}>
                          Payout: ₹{b.payoutAmount?.toLocaleString()} (0% Commission)
                        </div>
                      )}
                    </td>
                    <td>
                      <span style={{ 
                        fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '4px 10px',
                        background: b.status === 'confirmed' ? 'var(--success-bg)' : b.status === 'checked-in' ? 'var(--info-bg)' : 'var(--bg)',
                        color: b.status === 'confirmed' ? 'var(--success)' : b.status === 'checked-in' ? 'var(--primary)' : 'var(--text-secondary)',
                        border: `1px solid ${b.status === 'confirmed' ? 'var(--success)' : b.status === 'checked-in' ? 'var(--primary)' : 'var(--border)'}`
                      }}>
                        {sc[b.status]?.label || b.status}
                      </span>
                    </td>
                    <td>
                      {b.status === 'checked-in' && (
                        <button className="btn btn-outline btn-sm" onClick={() => checkOutBooking(b.id)}>
                          Process Check-Out
                        </button>
                      )}
                      {b.status === 'confirmed' && (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Awaiting Arrival</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
