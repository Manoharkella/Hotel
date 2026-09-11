import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { 
  ArrowLeft, 
  MapPin, 
  QrCode, 
  Copy, 
  Check, 
  Calendar, 
  Users, 
  Info, 
  Download,
  X
} from 'lucide-react';

export function TripPassCard({ booking, hotel, onClose, isModal = false }) {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [copied, setCopied] = useState(false);

  if (!booking) return null;

  const hotelName = booking.hotelName || hotel?.name || 'The St. Regis Mumbai';
  const hotelLocation = hotel?.address || hotel?.location || booking.location || 'Lower Parel, Mumbai';
  const checkInDate = booking.checkIn ? new Date(booking.checkIn).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '11 Sep 2026';
  const checkOutDate = booking.checkOut ? new Date(booking.checkOut).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '14 Sep 2026';
  const guestsCount = booking.guests || 2;
  const bookingRef = booking.reference || `BK-${booking.id ? `${booking.id}-12` : '11-12'}-178852355`;
  const qrValue = booking.qrCode || `HOTELIQ-PASS-${bookingRef}-${hotelName}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(bookingRef);
    setCopied(true);
    addToast('Booking reference copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    window.print();
    addToast('Digital Pass downloaded / prepared for printing', 'success');
  };

  return (
    <div className={`trip-pass-wrapper ${isModal ? 'modal-mode' : ''}`}>
      {/* Top Navbar */}
      <div className="trip-pass-top-bar">
        <button 
          type="button" 
          className="trip-pass-back-btn" 
          onClick={onClose || (() => navigate(-1))}
          aria-label="Go Back"
        >
          {isModal ? <X size={20} /> : <ArrowLeft size={20} />}
        </button>
        <h1 className="trip-pass-top-title">My Trip Pass</h1>
        <div style={{ width: 28 }} />
      </div>

      {/* Main Pass Container */}
      <div className="trip-pass-card">
        
        {/* Dark Navy Header */}
        <div className="trip-pass-dark-header">
          <div className="trip-pass-header-info">
            <h2 className="trip-pass-hotel-title">{hotelName}</h2>
            <div className="trip-pass-hotel-location">
              <MapPin size={14} color="#EA580C" />
              <span>{hotelLocation}</span>
            </div>
          </div>
          
          <div className="trip-pass-badge-confirmed">
            CONFIRMED
          </div>
        </div>

        {/* White Pass Body */}
        <div className="trip-pass-white-body">
          
          {/* Digital Boarding Pass Subheader */}
          <div className="trip-pass-subheader">
            <div className="trip-pass-scan-icon-box">
              <QrCode size={22} color="#0F172A" />
            </div>
            <div>
              <h3 className="trip-pass-section-title">Digital Boarding Pass</h3>
              <p className="trip-pass-section-desc">
                Show this QR code at the hotel front desk for a seamless check-in.
              </p>
            </div>
          </div>

          {/* QR Code Container */}
          <div className="trip-pass-qr-container">
            <div className="trip-pass-qr-frame">
              <QRCodeSVG 
                value={qrValue} 
                size={145} 
                level="H"
                fgColor="#0F172A"
                bgColor="#FFFFFF"
              />
            </div>
          </div>

          {/* Booking Reference Box */}
          <div className="trip-pass-ref-box">
            <div className="trip-pass-ref-texts">
              <span className="trip-pass-ref-label">Booking Reference</span>
              <span className="trip-pass-ref-code">{bookingRef}</span>
            </div>
            <button 
              type="button" 
              className="trip-pass-copy-btn" 
              onClick={handleCopy}
              aria-label="Copy booking reference"
              title="Copy Reference"
            >
              {copied ? <Check size={17} color="#16A34A" /> : <Copy size={17} color="#475569" />}
            </button>
          </div>

          {/* 3-Column Specifications Grid */}
          <div className="trip-pass-specs-grid">
            <div className="trip-pass-spec-col">
              <div className="trip-pass-spec-icon-label">
                <Calendar size={14} color="#64748B" />
                <span>Check-in</span>
              </div>
              <div className="trip-pass-spec-val">{checkInDate}</div>
            </div>

            <div className="trip-pass-spec-col">
              <div className="trip-pass-spec-icon-label">
                <Calendar size={14} color="#64748B" />
                <span>Check-out</span>
              </div>
              <div className="trip-pass-spec-val">{checkOutDate}</div>
            </div>

            <div className="trip-pass-spec-col">
              <div className="trip-pass-spec-icon-label">
                <Users size={14} color="#64748B" />
                <span>Guests</span>
              </div>
              <div className="trip-pass-spec-val">{guestsCount}</div>
            </div>
          </div>

          {/* Offline Notice Box */}
          <div className="trip-pass-offline-box">
            <Info size={18} color="#EA580C" className="trip-pass-info-icon" />
            <span className="trip-pass-offline-text">
              Keep this QR code handy, or save it to your gallery for offline access.
            </span>
          </div>

          {/* Download Pass Button */}
          <button 
            type="button" 
            className="trip-pass-download-btn"
            onClick={handleDownload}
          >
            <Download size={18} />
            <span>Download Pass</span>
          </button>

        </div>

      </div>
    </div>
  );
}

export default function QRPass() {
  const { id } = useParams();
  const { bookings, hotels } = useApp();
  const navigate = useNavigate();

  const booking = bookings.find(b => b.id?.toString() === id?.toString()) || {
    id: id || '1',
    hotelId: 1,
    hotelName: 'The St. Regis Mumbai',
    location: 'Lower Parel, Mumbai',
    status: 'confirmed',
    checkIn: '2026-09-11',
    checkOut: '2026-09-14',
    guests: 2,
    roomType: 'Deluxe City View Room',
    reference: 'BK-11-12-178852355',
    qrCode: 'HOTELIQ-PASS-BK-11-12-178852355'
  };

  const hotel = hotels.find(h => h.id?.toString() === booking.hotelId?.toString());

  return (
    <div className="trip-pass-page-view">
      <TripPassCard booking={booking} hotel={hotel} onClose={() => navigate(-1)} />
    </div>
  );
}
