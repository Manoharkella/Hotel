import { useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import NearbyAttractions from '../../components/NearbyAttractions';
import {
  Compass,
  MapPin,
  Building,
  Calendar,
  Sparkles,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';

export default function ExploreNearbyPage() {
  const [searchParams] = useSearchParams();
  const { hotels, bookings } = useApp();
  const { user } = useAuth();

  const queryHotelId = searchParams.get('hotelId');
  const queryCity = searchParams.get('city') || '';

  // Customer bookings
  const userBookings = useMemo(() => {
    if (!user) return [];
    return bookings.filter(b => b.customerId?.toString() === user?.id?.toString() && ['confirmed', 'checked-in'].includes(b.status));
  }, [bookings, user]);

  // Selected Hotel state
  const [selectedHotelId, setSelectedHotelId] = useState(() => {
    if (queryHotelId) return queryHotelId;
    if (userBookings.length > 0) return userBookings[0].hotelId?.toString();
    if (hotels.length > 0) return hotels[0].id?.toString();
    return '1';
  });

  const selectedHotel = useMemo(() => {
    return hotels.find(h => h.id?.toString() === selectedHotelId?.toString()) || hotels[0] || null;
  }, [hotels, selectedHotelId]);

  return (
    <div style={{ maxWidth: 1240, margin: '0 auto', padding: '24px 20px 60px' }}>
      
      {/* Breadcrumb Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.84rem', color: '#64748B', marginBottom: 20 }}>
        <Link to="/customer" style={{ color: '#2563EB', textDecoration: 'none', fontWeight: 600 }}>Home</Link>
        <span>›</span>
        <Link to="/customer/trips" style={{ color: '#2563EB', textDecoration: 'none', fontWeight: 600 }}>My Trips</Link>
        <span>›</span>
        <span style={{ color: '#0F172A', fontWeight: 700 }}>Explore Nearby Tourist Spots</span>
      </div>

      {/* Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
        borderRadius: 20,
        padding: '28px 32px',
        color: '#FFFFFF',
        marginBottom: 28,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.2)'
      }}>
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 650 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(234, 88, 12, 0.2)',
            border: '1px solid rgba(234, 88, 12, 0.4)',
            color: '#FB923C',
            padding: '4px 10px',
            borderRadius: 20,
            fontSize: '0.75rem',
            fontWeight: 800,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            marginBottom: 12
          }}>
            <Compass size={13} />
            <span>Local Sightseeing & Experiences</span>
          </div>
          <h1 style={{ fontSize: '1.9rem', fontWeight: 800, margin: '0 0 10px', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            Discover Attractions Around Your Stay
          </h1>
          <p style={{ color: '#94A3B8', fontSize: '0.95rem', lineHeight: 1.5, margin: 0 }}>
            Browse popular sights, heritage landmarks, nature escapes, beaches, and activities near your booked hotel with real distance calculations, drive times, and directions.
          </p>
        </div>

        {/* Decorative Background Blob */}
        <div style={{
          position: 'absolute',
          top: -40,
          right: -40,
          width: 260,
          height: 260,
          background: 'radial-gradient(circle, rgba(234, 88, 12, 0.25) 0%, rgba(37, 99, 235, 0) 70%)',
          borderRadius: '50%'
        }} />
      </div>

      {/* Hotel Selector Strip */}
      {hotels.length > 1 && (
        <div style={{
          background: '#FFFFFF',
          borderRadius: 14,
          padding: '16px 20px',
          border: '1px solid #E2E8F0',
          marginBottom: 28,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: '#FFF7ED',
              color: '#EA580C',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Building size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
                Currently Selected Hotel
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>
                {selectedHotel?.name || 'Select a Hotel'}
              </div>
            </div>
          </div>

          {/* Hotel Switcher Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#475569' }}>Change Hotel:</span>
            <select
              value={selectedHotelId}
              onChange={e => setSelectedHotelId(e.target.value)}
              style={{
                padding: '9px 14px',
                borderRadius: 8,
                border: '1px solid #CBD5E1',
                fontWeight: 700,
                fontSize: '0.85rem',
                color: '#0F172A',
                background: '#F8FAFC',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {hotels.map(h => (
                <option key={h.id} value={h.id}>
                  {h.name} — {h.city || h.location}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Main Nearby Attractions Module */}
      {selectedHotel && (
        <NearbyAttractions
          hotelId={selectedHotel.id}
          hotelName={selectedHotel.name}
          hotelLatitude={selectedHotel.latitude}
          hotelLongitude={selectedHotel.longitude}
          hotelCity={selectedHotel.city || selectedHotel.location}
          standalone={true}
        />
      )}

    </div>
  );
}
