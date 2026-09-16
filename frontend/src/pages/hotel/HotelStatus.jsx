import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import HotelLogo from '../../components/HotelLogo';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileEdit,
  ArrowRight,
  RotateCcw,
  Building2,
  Mail,
  ShieldCheck,
  Headphones
} from 'lucide-react';

export default function HotelStatus() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const [hotelDetails, setHotelDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const hotelId = location.state?.hotelId || user?.hotelId || user?.id;

  useEffect(() => {
    if (hotelId) {
      api.getHotelDetails(hotelId)
        .then(data => setHotelDetails(data))
        .catch(err => {
          console.error(err);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [hotelId]);

  const currentStatus = hotelDetails?.status || location.state?.status || user?.status || 'PENDING';
  const hotelName = hotelDetails?.name || location.state?.hotelName || user?.name || 'Your Property';
  const rejectionReason = hotelDetails?.rejection_reason || user?.rejection_reason || 'Please review your uploaded property documents and room details.';

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', flexDirection: 'column' }}>
      {/* Simple Header */}
      <header style={{
        background: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
        padding: '14px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <HotelLogo size="default" />
        <button
          type="button"
          onClick={() => navigate('/hotel_login')}
          style={{
            background: 'none',
            border: 'none',
            color: '#64748B',
            fontSize: '0.84rem',
            cursor: 'pointer'
          }}
        >
          Sign Out
        </button>
      </header>

      {/* Main Status Container */}
      <main style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px'
      }}>
        <div style={{
          background: '#FFFFFF',
          borderRadius: 20,
          border: '1px solid #E2E8F0',
          maxWidth: 580,
          width: '100%',
          padding: '36px 32px',
          textAlign: 'center',
          boxShadow: '0 10px 40px rgba(0,0,0,0.04)'
        }}>
          {/* ========================================================= */}
          {/* PENDING APPROVAL STATE                                    */}
          {/* ========================================================= */}
          {currentStatus === 'PENDING' && (
            <div>
              <div style={{
                width: 76,
                height: 76,
                borderRadius: '50%',
                background: '#FFF7ED',
                color: '#EA580C',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                boxShadow: '0 8px 24px rgba(234, 88, 12, 0.18)'
              }}>
                <Clock size={40} />
              </div>

              <div style={{
                display: 'inline-block',
                background: '#FFF7ED',
                color: '#EA580C',
                fontSize: '0.78rem',
                fontWeight: 800,
                padding: '4px 12px',
                borderRadius: 20,
                marginBottom: 10
              }}>
                UNDER REVIEW
              </div>

              <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>
                Registration Submitted for Approval
              </h2>

              <p style={{ fontSize: '0.9rem', color: '#64748B', lineHeight: 1.6, marginBottom: 24 }}>
                Thank you for onboarding <strong>{hotelName}</strong> on HostIQ. Our verification team is currently inspecting your property details, room pricing, and verification documents.
              </p>

              <div style={{
                background: '#F8FAFC',
                borderRadius: 12,
                border: '1px solid #E2E8F0',
                padding: '16px',
                textAlign: 'left',
                marginBottom: 24,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                fontSize: '0.82rem',
                color: '#334155'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ShieldCheck size={16} color="#16A34A" />
                  <span>Standard review timeline: <strong>1 to 24 business hours</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Mail size={16} color="#EA580C" />
                  <span>You will receive an email notification once your listing goes live.</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => navigate('/hotel/onboarding')}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#F1F5F9',
                    color: '#334155',
                    border: 'none',
                    borderRadius: 10,
                    fontWeight: 700,
                    fontSize: '0.86rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6
                  }}
                >
                  <FileEdit size={16} /> Edit Listing Details
                </button>

                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#EA580C',
                    color: '#FFF',
                    border: 'none',
                    borderRadius: 10,
                    fontWeight: 700,
                    fontSize: '0.86rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6
                  }}
                >
                  <RotateCcw size={16} /> Check Status
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* REJECTED / CORRECTIONS REQUIRED STATE                     */}
          {/* ========================================================= */}
          {currentStatus === 'REJECTED' && (
            <div>
              <div style={{
                width: 76,
                height: 76,
                borderRadius: '50%',
                background: '#FEF2F2',
                color: '#DC2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                boxShadow: '0 8px 24px rgba(220, 38, 38, 0.18)'
              }}>
                <AlertTriangle size={40} />
              </div>

              <div style={{
                display: 'inline-block',
                background: '#FEF2F2',
                color: '#DC2626',
                fontSize: '0.78rem',
                fontWeight: 800,
                padding: '4px 12px',
                borderRadius: 20,
                marginBottom: 10
              }}>
                CORRECTIONS REQUIRED
              </div>

              <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>
                Submission Requires Attention
              </h2>

              <p style={{ fontSize: '0.9rem', color: '#64748B', lineHeight: 1.5, marginBottom: 18 }}>
                The administration team has requested updates to your hotel onboarding details before publishing.
              </p>

              {/* Rejection Reason Card */}
              <div style={{
                background: '#FFF5F5',
                border: '1.5px solid #FECACA',
                borderRadius: 12,
                padding: 16,
                textAlign: 'left',
                marginBottom: 24
              }}>
                <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#B91C1C', textTransform: 'uppercase' }}>
                  Admin Feedback & Instructions:
                </span>
                <p style={{ fontSize: '0.88rem', color: '#7F1D1D', fontWeight: 600, margin: '6px 0 0', lineHeight: 1.4 }}>
                  "{rejectionReason}"
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate('/hotel/onboarding')}
                style={{
                  width: '100%',
                  padding: '13px',
                  background: '#EA580C',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: 10,
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: '0 4px 14px rgba(234, 88, 12, 0.25)'
                }}
              >
                <FileEdit size={18} /> Edit & Resubmit Application
              </button>
            </div>
          )}

          {/* ========================================================= */}
          {/* APPROVED STATE                                            */}
          {/* ========================================================= */}
          {currentStatus === 'APPROVED' && (
            <div>
              <div style={{
                width: 76,
                height: 76,
                borderRadius: '50%',
                background: '#DCFCE7',
                color: '#16A34A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                boxShadow: '0 8px 24px rgba(22, 163, 74, 0.2)'
              }}>
                <CheckCircle2 size={40} />
              </div>

              <div style={{
                display: 'inline-block',
                background: '#DCFCE7',
                color: '#16A34A',
                fontSize: '0.78rem',
                fontWeight: 800,
                padding: '4px 12px',
                borderRadius: 20,
                marginBottom: 10
              }}>
                APPROVED & LIVE
              </div>

              <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>
                Congratulations! Your Hotel is Live
              </h2>

              <p style={{ fontSize: '0.9rem', color: '#64748B', lineHeight: 1.5, marginBottom: 24 }}>
                <strong>{hotelName}</strong> has been approved. You can now access your partner command center to receive traveler bids, manage room inventory, and process bookings.
              </p>

              <button
                type="button"
                onClick={() => navigate('/hotel')}
                style={{
                  width: '100%',
                  padding: '13px',
                  background: '#16A34A',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: 10,
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: '0 4px 14px rgba(22, 163, 74, 0.3)'
                }}
              >
                Enter Hotel Dashboard <ArrowRight size={18} />
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
