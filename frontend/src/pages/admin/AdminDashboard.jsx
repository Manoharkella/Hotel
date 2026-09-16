import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  Building2,
  CheckCircle2,
  Clock,
  ShieldAlert,
  MapPin,
  TrendingUp,
  ExternalLink,
  CalendarDays,
  ChevronRight,
  MoreVertical,
  Activity,
  UserCheck,
  PlusCircle,
  FileCheck2,
  ArrowUpRight,
  Sparkles
} from 'lucide-react';

export default function AdminDashboard() {
  const { hotels, leads, bookings, transactions } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [timeRange, setTimeRange] = useState('This Month');
  const [currentDateFormatted, setCurrentDateFormatted] = useState('');

  useEffect(() => {
    const now = new Date();
    const formatted = now.toLocaleDateString('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    setCurrentDateFormatted(formatted);
  }, []);

  // Compute metrics from actual state or defaults
  const totalCount = hotels.length || 51;
  const pendingCount = hotels.filter(h => (h.status || '').toUpperCase() === 'PENDING').length;
  const approvedCount = hotels.filter(h => (h.status || '').toUpperCase() === 'APPROVED').length || (totalCount - pendingCount);
  const suspendedCount = hotels.filter(h => (h.status || '').toUpperCase() === 'SUSPENDED').length || 1;
  const rejectedCount = hotels.filter(h => (h.status || '').toUpperCase() === 'REJECTED').length;
  const rejectedOrSuspended = suspendedCount + rejectedCount;

  // Percentages for Donut chart
  const approvedPct = Math.round((approvedCount / (totalCount || 1)) * 100);
  const pendingPct = Math.round((pendingCount / (totalCount || 1)) * 100);
  const rejectedPct = Math.max(0, 100 - approvedPct - pendingPct);

  // City breakdown data
  const cityCounts = hotels.reduce((acc, h) => {
    const city = h.location || h.city || 'Hyderabad';
    acc[city] = (acc[city] || 0) + 1;
    return acc;
  }, {});

  const cityList = [
    { name: 'Hyderabad, Telangana', count: cityCounts['Hyderabad'] || 12, max: 15 },
    { name: 'Bengaluru, Karnataka', count: cityCounts['Bengaluru'] || cityCounts['Bangalore'] || 8, max: 15 },
    { name: 'Mumbai, Maharashtra', count: cityCounts['Mumbai'] || 6, max: 15 },
    { name: 'Chennai, Tamil Nadu', count: cityCounts['Chennai'] || 5, max: 15 },
    { name: 'Delhi, NCR', count: cityCounts['Delhi'] || 4, max: 15 },
  ];

  // Recent hotels list
  const recentHotels = hotels.slice(0, 4);

  // Status badge helper
  const getStatusBadge = (status) => {
    const s = (status || 'APPROVED').toUpperCase();
    if (s === 'APPROVED') {
      return (
        <span style={{
          background: '#ECFDF5',
          color: '#059669',
          padding: '4px 10px',
          borderRadius: 14,
          fontSize: '0.74rem',
          fontWeight: 700,
          display: 'inline-block'
        }}>
          Approved
        </span>
      );
    }
    if (s === 'PENDING') {
      return (
        <span style={{
          background: '#FFFBEB',
          color: '#D97706',
          padding: '4px 10px',
          borderRadius: 14,
          fontSize: '0.74rem',
          fontWeight: 700,
          display: 'inline-block'
        }}>
          Pending
        </span>
      );
    }
    return (
      <span style={{
        background: '#FEF2F2',
        color: '#DC2626',
        padding: '4px 10px',
        borderRadius: 14,
        fontSize: '0.74rem',
        fontWeight: 700,
        display: 'inline-block'
      }}>
        Suspended
      </span>
    );
  };

  return (
    <div className="fade-in" style={{ paddingBottom: 60, fontFamily: 'var(--font-sans)' }}>
      {/* Top Welcome Banner with Illustration */}
      <div style={{
        background: 'linear-gradient(135deg, #F0F7FF 0%, #E0EEFD 60%, #EEF2FF 100%)',
        borderRadius: 16,
        padding: '24px 28px',
        border: '1px solid #DCE7F6',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        marginBottom: 24,
        boxShadow: '0 2px 10px rgba(37, 99, 235, 0.04)'
      }}>
        {/* Left Welcome Copy */}
        <div style={{ maxWidth: 540, zIndex: 2 }}>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0F172A', margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>Welcome back, {user?.name || 'Admin'}!</span>
            <span>👋</span>
          </h1>
          <p style={{ color: '#475569', fontSize: '0.94rem', margin: '6px 0 0', lineHeight: 1.5 }}>
            Here's what's happening with your hotel properties today.
          </p>
        </div>

        {/* Right Date & Resort Graphic */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, zIndex: 2 }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.9)',
            borderRadius: 10,
            padding: '7px 14px',
            fontSize: '0.82rem',
            fontWeight: 700,
            color: '#1E293B',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
          }}>
            <CalendarDays size={15} style={{ color: '#2563EB' }} />
            <span>{currentDateFormatted || 'Tue, 16 Sep 2026'}</span>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontFamily: "'Playfair Display', serif",
              fontStyle: 'italic',
              fontSize: '1.25rem',
              fontWeight: 700,
              color: '#1E3A8A'
            }}>
              Great Stays
            </div>
            <div style={{
              fontFamily: "'Playfair Display', serif",
              fontStyle: 'italic',
              fontSize: '1.15rem',
              fontWeight: 600,
              color: '#3B82F6'
            }}>
              Better Experiences
            </div>
          </div>

          {/* Hotel Building Icon Art */}
          <div style={{
            width: 100,
            height: 76,
            borderRadius: 12,
            background: 'rgba(255, 255, 255, 0.65)',
            backdropFilter: 'blur(4px)',
            border: '1px solid rgba(255, 255, 255, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2.6rem',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.05)'
          }}>
            🏨
          </div>
        </div>
      </div>

      {/* 4 Overview Stat Cards with Sparkline Curves */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 24 }}>
        {/* Card 1: Total Properties */}
        <div 
          onClick={() => navigate('/admin/hotels')}
          style={{
            background: '#FFFFFF',
            borderRadius: 14,
            padding: '20px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <div style={{ width: 46, height: 46, borderRadius: 12, background: '#EEF2FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Building2 size={22} />
            </div>
            <div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>{totalCount}</div>
              <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 700, marginTop: 4 }}>Total Properties</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#059669', background: '#ECFDF5', padding: '1px 6px', borderRadius: 4 }}>
                  ↑ +12%
                </span>
                <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>All registered</span>
              </div>
            </div>
          </div>

          {/* Blue Sparkline SVG */}
          <svg width="70" height="36" viewBox="0 0 70 36" fill="none">
            <path d="M2 30 C 15 28, 25 15, 38 18 C 50 20, 58 6, 68 4" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M2 30 C 15 28, 25 15, 38 18 C 50 20, 58 6, 68 4 L 68 36 L 2 36 Z" fill="url(#blue-grad)" opacity="0.15" />
            <defs>
              <linearGradient id="blue-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#FFFFFF" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Card 2: Pending Approval */}
        <div 
          onClick={() => navigate('/admin/hotels')}
          style={{
            background: '#FFFFFF',
            borderRadius: 14,
            padding: '20px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <div style={{ width: 46, height: 46, borderRadius: 12, background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Clock size={22} />
            </div>
            <div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#B45309', lineHeight: 1 }}>{pendingCount}</div>
              <div style={{ fontSize: '0.8rem', color: '#B45309', fontWeight: 800, marginTop: 4 }}>Pending Approval</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#B45309', background: '#FEF3C7', padding: '1px 6px', borderRadius: 4 }}>
                  → 0%
                </span>
                <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Awaiting check</span>
              </div>
            </div>
          </div>

          {/* Amber Sparkline SVG */}
          <svg width="70" height="36" viewBox="0 0 70 36" fill="none">
            <path d="M2 24 C 18 24, 30 18, 45 22 C 55 24, 60 14, 68 12" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M2 24 C 18 24, 30 18, 45 22 C 55 24, 60 14, 68 12 L 68 36 L 2 36 Z" fill="url(#amber-grad)" opacity="0.15" />
            <defs>
              <linearGradient id="amber-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#FFFFFF" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Card 3: Approved & Live */}
        <div 
          onClick={() => navigate('/admin/hotels')}
          style={{
            background: '#FFFFFF',
            borderRadius: 14,
            padding: '20px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <div style={{ width: 46, height: 46, borderRadius: 12, background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CheckCircle2 size={22} />
            </div>
            <div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#047857', lineHeight: 1 }}>{approvedCount}</div>
              <div style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 700, marginTop: 4 }}>Approved & Live</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#059669', background: '#ECFDF5', padding: '1px 6px', borderRadius: 4 }}>
                  ↑ +5%
                </span>
                <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Live on guest app</span>
              </div>
            </div>
          </div>

          {/* Green Sparkline SVG */}
          <svg width="70" height="36" viewBox="0 0 70 36" fill="none">
            <path d="M2 28 C 15 25, 28 20, 42 16 C 52 12, 60 6, 68 4" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M2 28 C 15 25, 28 20, 42 16 C 52 12, 60 6, 68 4 L 68 36 L 2 36 Z" fill="url(#green-grad)" opacity="0.15" />
            <defs>
              <linearGradient id="green-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#FFFFFF" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Card 4: Rejected / Suspended */}
        <div 
          onClick={() => navigate('/admin/hotels')}
          style={{
            background: '#FFFFFF',
            borderRadius: 14,
            padding: '20px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <div style={{ width: 46, height: 46, borderRadius: 12, background: '#FEF2F2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ShieldAlert size={22} />
            </div>
            <div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#B91C1C', lineHeight: 1 }}>{rejectedOrSuspended}</div>
              <div style={{ fontSize: '0.8rem', color: '#DC2626', fontWeight: 700, marginTop: 4 }}>Rejected / Suspended</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#DC2626', background: '#FEF2F2', padding: '1px 6px', borderRadius: 4 }}>
                  ↓ -50%
                </span>
                <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Needs attention</span>
              </div>
            </div>
          </div>

          {/* Red Sparkline SVG */}
          <svg width="70" height="36" viewBox="0 0 70 36" fill="none">
            <path d="M2 10 C 18 12, 32 25, 48 18 C 58 14, 62 26, 68 28" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M2 10 C 18 12, 32 25, 48 18 C 58 14, 62 26, 68 28 L 68 36 L 2 36 Z" fill="url(#red-grad)" opacity="0.15" />
            <defs>
              <linearGradient id="red-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#EF4444" />
                <stop offset="100%" stopColor="#FFFFFF" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Middle 3 Analytics Widgets Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: 16, marginBottom: 24 }}>
        {/* Widget 1: Property Overview (Donut Chart) */}
        <div style={{ background: '#FFFFFF', borderRadius: 14, padding: '20px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Building2 size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.94rem', fontWeight: 800, color: '#0F172A' }}>Property Overview</div>
                <div style={{ fontSize: '0.74rem', color: '#64748B' }}>Distribution of hotels by status</div>
              </div>
            </div>

            <select
              value={timeRange}
              onChange={e => setTimeRange(e.target.value)}
              style={{
                padding: '4px 8px',
                borderRadius: 6,
                border: '1px solid #CBD5E1',
                background: '#F8FAFC',
                fontSize: '0.76rem',
                fontWeight: 600,
                color: '#334155',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="This Month">This Month</option>
              <option value="Last Month">Last Month</option>
              <option value="All Time">All Time</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            {/* SVG Donut Chart */}
            <div style={{ position: 'relative', width: 120, height: 120, flexShrink: 0 }}>
              <svg width="120" height="120" viewBox="0 0 36 36">
                {/* Background Circle */}
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#F1F5F9"
                  strokeWidth="4.5"
                />
                {/* Green Segment (Approved) */}
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="4.5"
                  strokeDasharray={`${approvedPct}, 100`}
                  strokeLinecap="round"
                />
                {/* Red Segment (Suspended) */}
                {rejectedOrSuspended > 0 && (
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#EF4444"
                    strokeWidth="4.5"
                    strokeDasharray="4, 100"
                    strokeDashoffset={`-${approvedPct}`}
                    strokeLinecap="round"
                  />
                )}
              </svg>
              {/* Donut Center */}
              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center'
              }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>{totalCount}</span>
                <span style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 600 }}>Total</span>
              </div>
            </div>

            {/* Legend Stats */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }} />
                  <span style={{ color: '#475569', fontWeight: 600 }}>Approved & Live</span>
                </div>
                <strong style={{ color: '#0F172A' }}>{approvedCount} ({approvedPct}%)</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B' }} />
                  <span style={{ color: '#475569', fontWeight: 600 }}>Pending Approval</span>
                </div>
                <strong style={{ color: '#0F172A' }}>{pendingCount} ({pendingPct}%)</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444' }} />
                  <span style={{ color: '#475569', fontWeight: 600 }}>Rejected / Suspended</span>
                </div>
                <strong style={{ color: '#0F172A' }}>{rejectedOrSuspended} ({rejectedPct || 2}%)</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Widget 2: Hotels by Location (Bar Progress) */}
        <div style={{ background: '#FFFFFF', borderRadius: 14, padding: '20px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MapPin size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.94rem', fontWeight: 800, color: '#0F172A' }}>Hotels by Location</div>
                <div style={{ fontSize: '0.74rem', color: '#64748B' }}>Top cities with registered properties</div>
              </div>
            </div>

            <select
              style={{
                padding: '4px 8px',
                borderRadius: 6,
                border: '1px solid #CBD5E1',
                background: '#F8FAFC',
                fontSize: '0.76rem',
                fontWeight: 600,
                color: '#334155',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option>Top Cities</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {cityList.map(item => (
              <div key={item.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <span style={{ fontSize: '0.78rem', color: '#334155', fontWeight: 600, width: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.name}
                </span>

                <div style={{ flex: 1, height: 8, background: '#F1F5F9', borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{
                    width: `${Math.min(100, Math.round((item.count / item.max) * 100))}%`,
                    height: '100%',
                    background: '#3B82F6',
                    borderRadius: 10
                  }} />
                </div>

                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0F172A', width: 20, textAlign: 'right' }}>
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Widget 3: Property Locations (Map Preview) */}
        <div style={{ background: '#FFFFFF', borderRadius: 14, padding: '20px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MapPin size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.94rem', fontWeight: 800, color: '#0F172A' }}>Property Locations</div>
                <div style={{ fontSize: '0.74rem', color: '#64748B' }}>Visual view of hotel locations</div>
              </div>
            </div>

            <Link
              to="/admin/map"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 10px',
                borderRadius: 6,
                border: '1px solid #BFDBFE',
                background: '#EFF6FF',
                color: '#2563EB',
                fontSize: '0.74rem',
                fontWeight: 700,
                textDecoration: 'none'
              }}
            >
              <span>View Map</span>
              <ArrowUpRight size={12} />
            </Link>
          </div>

          {/* Interactive Map Graphical Card */}
          <div
            onClick={() => navigate('/admin/map')}
            style={{
              height: 125,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #E0F2FE 0%, #DBEAFE 100%)',
              position: 'relative',
              overflow: 'hidden',
              cursor: 'pointer',
              border: '1px solid #BFDBFE',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {/* Subtle Map Grid lines */}
            <div style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: 'radial-gradient(#93C5FD 1px, transparent 1px)',
              backgroundSize: '14px 14px',
              opacity: 0.5
            }} />

            {/* Glowing Map Point Tooltip */}
            <div style={{
              position: 'absolute',
              top: '42%',
              left: '52%',
              transform: 'translate(-50%, -50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}>
              <div style={{
                background: '#FFFFFF',
                padding: '4px 10px',
                borderRadius: 8,
                fontSize: '0.72rem',
                fontWeight: 800,
                color: '#0F172A',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                border: '1px solid #E2E8F0',
                whiteSpace: 'nowrap',
                marginBottom: 4
              }}>
                📍 Hyderabad (12 Hotels)
              </div>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#EF4444', border: '2px solid white', boxShadow: '0 0 10px rgba(239, 68, 68, 0.8)' }} />
            </div>

            {/* Other Dots */}
            <div style={{ position: 'absolute', top: '30%', left: '35%', width: 8, height: 8, borderRadius: '50%', background: '#EF4444', border: '1.5px solid white' }} />
            <div style={{ position: 'absolute', top: '65%', left: '48%', width: 8, height: 8, borderRadius: '50%', background: '#EF4444', border: '1.5px solid white' }} />
            <div style={{ position: 'absolute', top: '70%', left: '60%', width: 8, height: 8, borderRadius: '50%', background: '#EF4444', border: '1.5px solid white' }} />
            <div style={{ position: 'absolute', top: '38%', left: '72%', width: 8, height: 8, borderRadius: '50%', background: '#EF4444', border: '1.5px solid white' }} />
          </div>
        </div>
      </div>

      {/* Bottom 2-Column Section (Recent Properties + Recent Activities) */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        {/* Left: Recent Properties */}
        <div style={{ background: '#FFFFFF', borderRadius: 14, padding: '20px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Building2 size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.94rem', fontWeight: 800, color: '#0F172A' }}>Recent Properties</div>
                <div style={{ fontSize: '0.74rem', color: '#64748B' }}>Latest registered hotels</div>
              </div>
            </div>

            <Link
              to="/admin/hotels"
              style={{ fontSize: '0.78rem', fontWeight: 700, color: '#2563EB', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 2 }}
            >
              <span>View All</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 500 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '8px 10px', fontSize: '0.72rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Hotel Name</th>
                  <th style={{ padding: '8px 10px', fontSize: '0.72rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Location</th>
                  <th style={{ padding: '8px 10px', fontSize: '0.72rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Manager</th>
                  <th style={{ padding: '8px 10px', fontSize: '0.72rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: '8px 10px', fontSize: '0.72rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Date</th>
                  <th style={{ padding: '8px 6px' }}></th>
                </tr>
              </thead>
              <tbody>
                {recentHotels.map((h, i) => (
                  <tr
                    key={h.id || i}
                    onClick={() => navigate('/admin/hotels')}
                    style={{ borderBottom: '1px solid #F1F5F9', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '12px 10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 36,
                          height: 36,
                          borderRadius: 8,
                          backgroundImage: `url(${h.photos?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200&q=80'})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          border: '1px solid #E2E8F0',
                          flexShrink: 0
                        }} />
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <strong style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0F172A' }}>{h.name}</strong>
                            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#B45309', background: '#FEF3C7', padding: '1px 5px', borderRadius: 4 }}>
                              ★ 5.0
                            </span>
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: 2 }}>
                            {h.property_type || 'Business Hotel'}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '12px 10px', fontSize: '0.8rem', color: '#334155', fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={12} style={{ color: '#EF4444' }} />
                        <span>{h.location || h.city || 'Hyderabad, Telangana'}</span>
                      </div>
                    </td>

                    <td style={{ padding: '12px 10px', fontSize: '0.8rem', color: '#334155' }}>
                      {h.manager_name || 'Manu'}
                    </td>

                    <td style={{ padding: '12px 10px' }}>
                      {getStatusBadge(h.status)}
                    </td>

                    <td style={{ padding: '12px 10px', fontSize: '0.76rem', color: '#64748B' }}>
                      {h.created_at ? new Date(h.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '16 Sep 2026'}
                    </td>

                    <td style={{ padding: '12px 6px', textAlign: 'right' }}>
                      <MoreVertical size={14} style={{ color: '#94A3B8' }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Recent Activities Feed */}
        <div style={{ background: '#FFFFFF', borderRadius: 14, padding: '20px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: '#FDF2F8', color: '#DB2777', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Activity size={18} />
              </div>
              <div style={{ fontSize: '0.94rem', fontWeight: 800, color: '#0F172A' }}>Recent Activities</div>
            </div>

            <Link
              to="/admin/reports"
              style={{ fontSize: '0.78rem', fontWeight: 700, color: '#2563EB', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 2 }}
            >
              <span>View All</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          {/* Activity Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                <Building2 size={14} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A' }}>New hotel registered</div>
                <div style={{ fontSize: '0.74rem', color: '#64748B' }}>The Grand Vista - Goa</div>
                <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: 2 }}>2 hours ago</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                <CheckCircle2 size={14} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A' }}>Hotel approved</div>
                <div style={{ fontSize: '0.74rem', color: '#64748B' }}>Sea Breeze Resort - Chennai</div>
                <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: 2 }}>5 hours ago</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#FEF2F2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                <ShieldAlert size={14} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A' }}>Hotel suspended</div>
                <div style={{ fontSize: '0.74rem', color: '#64748B' }}>Cognitbotz - Hyderabad</div>
                <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: 2 }}>Yesterday</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#F1F5F9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                <UserCheck size={14} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A' }}>Profile updated</div>
                <div style={{ fontSize: '0.74rem', color: '#64748B' }}>Manu - Hyderabad</div>
                <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: 2 }}>1 day ago</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
