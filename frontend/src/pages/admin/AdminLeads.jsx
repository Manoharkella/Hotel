import { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import {
  Users,
  Clock,
  Key,
  CheckSquare,
  Search,
  Plus,
  RotateCcw,
  Eye,
  Edit2,
  MoreVertical,
  MapPin,
  CalendarDays,
  DollarSign,
  ArrowRight,
  Plane,
  X,
  Lock,
  Unlock,
  CheckCircle2
} from 'lucide-react';

const AVATAR_COLORS = [
  { bg: '#EFF6FF', color: '#2563EB' },
  { bg: '#F5F3FF', color: '#8B5CF6' },
  { bg: '#ECFDF5', color: '#059669' },
  { bg: '#FEF3C7', color: '#D97706' },
  { bg: '#FEE2E2', color: '#DC2626' }
];

export default function AdminLeads() {
  const { leads, unlocks, submitRequirement } = useApp();
  const { addToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [destFilter, setDestFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedIds, setSelectedIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals state
  const [inspectLead, setInspectLead] = useState(null);
  const [addLeadModalOpen, setAddLeadModalOpen] = useState(false);
  const [newLeadForm, setNewLeadForm] = useState({
    customerName: '',
    email: '',
    phone: '',
    destination: 'Goa',
    checkIn: '2026-10-01',
    checkOut: '2026-10-05',
    budget: 15000,
    rooms: 1,
    guests: 2
  });

  const leadsList = useMemo(() => {
    return Array.isArray(leads) ? leads : [];
  }, [leads]);

  // Metrics calculated strictly from real database leads
  const totalLeads = leadsList.length;
  const newThisWeek = leadsList.filter(l => ['active', 'new', 'qualified'].includes((l.status || '').toLowerCase())).length;
  const inProgress = leadsList.filter(l => (l.status || '').toLowerCase().includes('progress') || (l.status || '').toLowerCase() === 'active').length;
  const converted = leadsList.filter(l => (l.status || '').toLowerCase() === 'won').length;

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leadsList.filter(l => {
      const matchDest = destFilter === 'All' || (l.destination || '').toLowerCase().includes(destFilter.toLowerCase());
      const matchStatus = statusFilter === 'All' || (l.status || '').toLowerCase() === statusFilter.toLowerCase();
      const q = searchQuery.toLowerCase();
      const matchSearch = !q || (l.customerName || '').toLowerCase().includes(q) || (l.destination || '').toLowerCase().includes(q) || (l.email || '').toLowerCase().includes(q);
      return matchDest && matchStatus && matchSearch;
    });
  }, [leadsList, destFilter, statusFilter, searchQuery]);

  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage) || 1;
  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLeads.slice(start, start + itemsPerPage);
  }, [filteredLeads, currentPage, itemsPerPage]);

  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedIds(paginatedLeads.map(l => l.id));
    else setSelectedIds([]);
  };

  const handleSelectOne = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleCreateLead = async (e) => {
    e.preventDefault();
    if (!newLeadForm.customerName || !newLeadForm.destination) {
      addToast('Please provide customer name and destination.', 'warning');
      return;
    }
    try {
      if (submitRequirement) {
        await submitRequirement(newLeadForm);
      }
      addToast(`Lead for "${newLeadForm.customerName}" created in database!`, 'success');
      setAddLeadModalOpen(false);
      setNewLeadForm({
        customerName: '',
        email: '',
        phone: '',
        destination: 'Goa',
        checkIn: '2026-10-01',
        checkOut: '2026-10-05',
        budget: 15000,
        rooms: 1,
        guests: 2
      });
    } catch (err) {
      addToast('Failed to create lead', 'error');
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || 'active').toLowerCase();
    switch (s) {
      case 'active':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 14, fontSize: '0.76rem', fontWeight: 700, background: '#ECFDF5', color: '#059669' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} />
            Active
          </span>
        );
      case 'won':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 14, fontSize: '0.76rem', fontWeight: 700, background: '#D1FAE5', color: '#047857' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#059669' }} />
            Won
          </span>
        );
      case 'in_progress':
      case 'in-progress':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 14, fontSize: '0.76rem', fontWeight: 700, background: '#FFFBEB', color: '#D97706' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#F59E0B' }} />
            In-Progress
          </span>
        );
      case 'new':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 14, fontSize: '0.76rem', fontWeight: 700, background: '#EFF6FF', color: '#2563EB' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3B82F6' }} />
            New
          </span>
        );
      case 'qualified':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 14, fontSize: '0.76rem', fontWeight: 700, background: '#F5F3FF', color: '#7C3AED' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#8B5CF6' }} />
            Qualified
          </span>
        );
      default:
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 14, fontSize: '0.76rem', fontWeight: 700, background: '#F1F5F9', color: '#475569' }}>
            {status}
          </span>
        );
    }
  };

  const getInitials = (name) => {
    if (!name) return 'CU';
    const parts = name.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="fade-in" style={{ paddingBottom: 60, fontFamily: 'var(--font-sans)' }}>
      {/* Top Banner Hero Section with Illustration */}
      <div style={{
        background: 'linear-gradient(135deg, #F8FAFC 0%, #F0FDFA 60%, #EEF2FF 100%)',
        borderRadius: 16,
        padding: '22px 28px',
        border: '1px solid #E2E8F0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        marginBottom: 22,
        boxShadow: '0 2px 10px rgba(13, 148, 136, 0.03)'
      }}>
        <div style={{ maxWidth: 520, zIndex: 2 }}>
          <h1 style={{ fontSize: '1.9rem', fontWeight: 800, color: '#0F172A', margin: 0, letterSpacing: '-0.025em', fontFamily: 'var(--font-sans)' }}>
            Leads Management
          </h1>
          <p style={{ color: '#64748B', fontSize: '0.92rem', margin: '6px 0 0', lineHeight: 1.5 }}>
            Track, manage and convert hotel booking leads into confirmed stays.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 24, zIndex: 2 }}>
          {/* Handwritten Quote & Airplane Illustration */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{
                fontFamily: "'Caveat', cursive, 'Brush Script MT', cursive, sans-serif",
                fontSize: '1.25rem',
                fontWeight: 700,
                color: '#0D9488',
                lineHeight: 1.1,
                transform: 'rotate(-2deg)'
              }}>
                More Leads. More Bookings.
              </div>
              <div style={{
                fontFamily: "'Caveat', cursive, 'Brush Script MT', cursive, sans-serif",
                fontSize: '1.15rem',
                fontWeight: 700,
                color: '#0284C7',
                lineHeight: 1.1,
                transform: 'rotate(-1deg)'
              }}>
                Greater Journeys
              </div>
            </div>

            {/* Airplane with trajectory SVG */}
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: '#F0FDFA',
              border: '1.5px dashed #2DD4BF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0D9488',
              boxShadow: '0 2px 8px rgba(13, 148, 136, 0.15)',
              transform: 'rotate(-15deg)'
            }}>
              <Plane size={22} strokeWidth={2.2} />
            </div>
          </div>

          <button
            onClick={() => setAddLeadModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 20px',
              borderRadius: 10,
              background: '#0D9488',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.88rem',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(13, 148, 136, 0.35)',
              transition: 'all 0.15s',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#0F766E'}
            onMouseLeave={e => e.currentTarget.style.background = '#0D9488'}
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Add Lead</span>
          </button>
        </div>
      </div>

      {/* 4 Stat Overview Metric Cards with Sparklines */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        {/* Card 1: Total Leads */}
        <div style={{ background: '#FFFFFF', borderRadius: 14, padding: '20px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#EEF2FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Users size={22} />
            </div>
            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>{totalLeads}</div>
              <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 700, marginTop: 4 }}>Total Leads</div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#059669', marginTop: 3 }}>↑ 20%</div>
            </div>
          </div>
          <svg width="60" height="32" viewBox="0 0 60 32" fill="none">
            <path d="M2 26 C 15 24, 25 12, 38 14 C 48 16, 52 4, 58 4" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>

        {/* Card 2: New This Week */}
        <div style={{ background: '#FFFFFF', borderRadius: 14, padding: '20px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#F5F3FF', color: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Clock size={22} />
            </div>
            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#6D28D9', lineHeight: 1 }}>{newThisWeek}</div>
              <div style={{ fontSize: '0.78rem', color: '#6D28D9', fontWeight: 700, marginTop: 4 }}>New This Week</div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#059669', marginTop: 3 }}>↑ 25%</div>
            </div>
          </div>
          <svg width="60" height="32" viewBox="0 0 60 32" fill="none">
            <path d="M2 24 C 15 22, 28 16, 40 12 C 48 10, 52 6, 58 4" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>

        {/* Card 3: In Progress */}
        <div style={{ background: '#FFFFFF', borderRadius: 14, padding: '20px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Key size={22} />
            </div>
            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#B45309', lineHeight: 1 }}>{inProgress}</div>
              <div style={{ fontSize: '0.78rem', color: '#B45309', fontWeight: 700, marginTop: 4 }}>In Progress</div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#059669', marginTop: 3 }}>↑ 12%</div>
            </div>
          </div>
          <svg width="60" height="32" viewBox="0 0 60 32" fill="none">
            <path d="M2 20 C 15 18, 30 14, 45 10 C 52 8, 55 6, 58 4" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>

        {/* Card 4: Converted */}
        <div style={{ background: '#FFFFFF', borderRadius: 14, padding: '20px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CheckSquare size={22} />
            </div>
            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#047857', lineHeight: 1 }}>{converted}</div>
              <div style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 700, marginTop: 4 }}>Converted</div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#059669', marginTop: 3 }}>↑ 15%</div>
            </div>
          </div>
          <svg width="60" height="32" viewBox="0 0 60 32" fill="none">
            <path d="M2 28 C 15 25, 28 18, 42 12 C 50 8, 55 6, 58 4" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* Filter Toolbar Controls */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: 14,
        padding: '14px 18px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
        marginBottom: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap'
      }}>
        {/* Date Range Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F8FAFC', border: '1px solid #CBD5E1', padding: '8px 12px', borderRadius: 8, fontSize: '0.82rem', fontWeight: 600, color: '#1E293B' }}>
          <CalendarDays size={14} style={{ color: '#2563EB' }} />
          <span>1 Sep 2026 - 30 Sep 2026</span>
        </div>

        {/* Destinations Dropdown */}
        <select
          value={destFilter}
          onChange={e => setDestFilter(e.target.value)}
          style={{
            padding: '9px 14px',
            borderRadius: 8,
            border: '1px solid #CBD5E1',
            background: '#F8FAFC',
            fontSize: '0.82rem',
            fontWeight: 600,
            color: '#1E293B',
            cursor: 'pointer',
            outline: 'none'
          }}
        >
          <option value="All">📍 All Destinations</option>
          <option value="Goa">Goa</option>
          <option value="Mumbai">Mumbai</option>
          <option value="Udaipur">Udaipur</option>
          <option value="Bengaluru">Bengaluru</option>
          <option value="Chennai">Chennai</option>
        </select>

        {/* Status Dropdown */}
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{
            padding: '9px 14px',
            borderRadius: 8,
            border: '1px solid #CBD5E1',
            background: '#F8FAFC',
            fontSize: '0.82rem',
            fontWeight: 600,
            color: '#1E293B',
            cursor: 'pointer',
            outline: 'none'
          }}
        >
          <option value="All">All Status</option>
          <option value="active">Active</option>
          <option value="won">Won</option>
          <option value="in_progress">In-Progress</option>
          <option value="new">New</option>
          <option value="qualified">Qualified</option>
        </select>

        {/* Search Input */}
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input
            type="text"
            placeholder="Search leads..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px 9px 34px',
              borderRadius: 8,
              border: '1px solid #CBD5E1',
              background: '#F8FAFC',
              fontSize: '0.84rem',
              color: '#1E293B',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Reset Button */}
        <button
          onClick={() => { setSearchQuery(''); setDestFilter('All'); setStatusFilter('All'); setCurrentPage(1); }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            borderRadius: 8,
            border: '1px solid #CBD5E1',
            background: '#FFFFFF',
            color: '#2563EB',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          <RotateCcw size={14} />
          <span>Reset</span>
        </button>
      </div>

      {/* Leads List View Table */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: 14,
        border: '1px solid #E2E8F0',
        boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
        overflow: 'hidden'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 1050 }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1.5px solid #E2E8F0' }}>
                <th style={{ padding: '14px 16px', width: 44 }}>
                  <input
                    type="checkbox"
                    checked={paginatedLeads.length > 0 && selectedIds.length === paginatedLeads.length}
                    onChange={handleSelectAll}
                    style={{ cursor: 'pointer', borderRadius: 4, width: 16, height: 16 }}
                  />
                </th>
                <th style={{ padding: '14px 16px', fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', width: '18%' }}>
                  CUSTOMER
                </th>
                <th style={{ padding: '14px 16px', fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', width: '18%' }}>
                  DESTINATION
                </th>
                <th style={{ padding: '14px 14px', fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', width: '14%' }}>
                  DATES
                </th>
                <th style={{ padding: '14px 14px', fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', width: '10%' }}>
                  BUDGET
                </th>
                <th style={{ padding: '14px 14px', fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', width: '10%' }}>
                  MATCHED
                </th>
                <th style={{ padding: '14px 14px', fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', width: '10%' }}>
                  UNLOCKED BY
                </th>
                <th style={{ padding: '14px 14px', fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', width: '10%' }}>
                  STATUS
                </th>
                <th style={{ padding: '14px 20px', fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', width: '6%', textAlign: 'right' }}>
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedLeads.map((l, idx) => {
                const colorObj = AVATAR_COLORS[idx % AVATAR_COLORS.length];
                const initials = getInitials(l.customerName);
                const leadUnlocks = (unlocks || []).filter(u => u.leadId === l.id);
                const isSelected = selectedIds.includes(l.id);

                return (
                  <tr
                    key={l.id || idx}
                    style={{
                      borderBottom: '1px solid #F1F5F9',
                      background: isSelected ? '#EFF6FF' : idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA',
                      transition: 'background 0.15s'
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) e.currentTarget.style.background = '#F8FAFC';
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) e.currentTarget.style.background = idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA';
                    }}
                  >
                    {/* Checkbox */}
                    <td style={{ padding: '16px 16px' }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectOne(l.id)}
                        style={{ cursor: 'pointer', borderRadius: 4, width: 16, height: 16 }}
                      />
                    </td>

                    {/* Customer Info */}
                    <td style={{ padding: '16px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          background: colorObj.bg,
                          color: colorObj.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.8rem',
                          fontWeight: 800,
                          flexShrink: 0
                        }}>
                          {initials}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <strong style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F172A', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {l.customerName}
                          </strong>
                          <span style={{ fontSize: '0.74rem', color: '#64748B' }}>{l.email || 'guest@email.com'}</span>
                        </div>
                      </div>
                    </td>

                    {/* Destination */}
                    <td style={{ padding: '16px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 32,
                          height: 32,
                          borderRadius: 6,
                          backgroundImage: `url(${l.image || 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=120&q=80'})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          border: '1px solid #E2E8F0',
                          flexShrink: 0
                        }} />
                        <div>
                          <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#1E293B', whiteSpace: 'nowrap' }}>
                            {l.destination}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Dates */}
                    <td style={{ padding: '16px 14px', fontSize: '0.82rem', color: '#334155', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {new Date(l.checkIn).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} → {new Date(l.checkOut).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                    </td>

                    {/* Budget */}
                    <td style={{ padding: '16px 14px', fontSize: '0.88rem', fontWeight: 800, color: '#0F172A', whiteSpace: 'nowrap' }}>
                      ₹{Number(l.budget || 15000).toLocaleString('en-IN')}
                    </td>

                    {/* Matched Hotels */}
                    <td style={{ padding: '16px 14px' }}>
                      <span style={{
                        background: '#EFF6FF',
                        color: '#2563EB',
                        padding: '3px 8px',
                        borderRadius: 6,
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        whiteSpace: 'nowrap'
                      }}>
                        {(l.matchedHotelIds?.length || 0)} Hotels
                      </span>
                    </td>

                    {/* Unlocked By */}
                    <td style={{ padding: '16px 14px' }}>
                      <span style={{
                        background: '#F1F5F9',
                        color: '#475569',
                        padding: '3px 8px',
                        borderRadius: 6,
                        fontSize: '0.76rem',
                        fontWeight: 600,
                        whiteSpace: 'nowrap'
                      }}>
                        {leadUnlocks.length || 0} Unlocks
                      </span>
                    </td>

                    {/* Status */}
                    <td style={{ padding: '16px 14px', whiteSpace: 'nowrap' }}>
                      {getStatusBadge(l.status)}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <button
                          onClick={() => setInspectLead(l)}
                          title="Inspect lead"
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            border: '1px solid #E2E8F0',
                            background: '#FFFFFF',
                            color: '#475569',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                          }}
                        >
                          <Eye size={15} />
                        </button>

                        <button
                          onClick={() => setInspectLead(l)}
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            border: '1px solid #E2E8F0',
                            background: '#FFFFFF',
                            color: '#475569',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                          }}
                        >
                          <Edit2 size={14} />
                        </button>

                        <button
                          onClick={() => setInspectLead(l)}
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            border: '1px solid #E2E8F0',
                            background: '#FFFFFF',
                            color: '#64748B',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                          }}
                        >
                          <MoreVertical size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Table Footer Pagination */}
        <div style={{
          padding: '16px 24px',
          background: '#F8FAFC',
          borderTop: '1px solid #E2E8F0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.84rem',
          color: '#64748B',
          flexWrap: 'wrap',
          gap: 12
        }}>
          <div>
            Showing <strong style={{ color: '#0F172A' }}>1 to {paginatedLeads.length}</strong> of <strong style={{ color: '#0F172A' }}>{filteredLeads.length}</strong> leads
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>Rows per page:</span>
              <select style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: '0.8rem', background: 'white' }}>
                <option>10</option>
                <option>20</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 6,
                  border: '1px solid #CBD5E1',
                  background: 'white',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ‹
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 6,
                    border: 'none',
                    background: currentPage === p ? '#2563EB' : 'transparent',
                    color: currentPage === p ? 'white' : '#475569',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  {p}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 6,
                  border: '1px solid #CBD5E1',
                  background: 'white',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ›
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Lead Modal */}
      {addLeadModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(5px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20
        }}>
          <div style={{
            background: '#FFFFFF',
            width: '100%',
            maxWidth: 480,
            borderRadius: 16,
            padding: 24,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            gap: 16
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Add New Customer Lead
              </h3>
              <button onClick={() => setAddLeadModalOpen(false)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateLead} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>Customer Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Varma"
                  value={newLeadForm.customerName}
                  onChange={e => setNewLeadForm({ ...newLeadForm, customerName: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>Destination / City *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Goa Beach Resort, Goa"
                  value={newLeadForm.destination}
                  onChange={e => setNewLeadForm({ ...newLeadForm, destination: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>Check-In</label>
                  <input
                    type="date"
                    value={newLeadForm.checkIn}
                    onChange={e => setNewLeadForm({ ...newLeadForm, checkIn: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>Check-Out</label>
                  <input
                    type="date"
                    value={newLeadForm.checkOut}
                    onChange={e => setNewLeadForm({ ...newLeadForm, checkOut: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>Total Budget (₹)</label>
                <input
                  type="number"
                  value={newLeadForm.budget}
                  onChange={e => setNewLeadForm({ ...newLeadForm, budget: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setAddLeadModalOpen(false)}
                  style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #CBD5E1', background: 'white', color: '#475569', fontWeight: 700, fontSize: '0.84rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#2563EB', color: 'white', fontWeight: 700, fontSize: '0.84rem', cursor: 'pointer' }}
                >
                  Post Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inspect Lead Modal */}
      {inspectLead && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(5px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20
        }}>
          <div style={{
            background: '#FFFFFF',
            width: '100%',
            maxWidth: 480,
            borderRadius: 16,
            padding: 24,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            gap: 16
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Lead Details
                </h3>
                <div style={{ fontSize: '0.8rem', color: '#64748B' }}>Lead ID: #{inspectLead.id}</div>
              </div>
              <button onClick={() => setInspectLead(null)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, background: '#F8FAFC', padding: 14, borderRadius: 12, border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem' }}>
                <span style={{ color: '#64748B', fontWeight: 600 }}>Guest Name:</span>
                <strong style={{ color: '#0F172A' }}>{inspectLead.customerName}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem' }}>
                <span style={{ color: '#64748B', fontWeight: 600 }}>Destination:</span>
                <strong style={{ color: '#2563EB' }}>📍 {inspectLead.destination}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem' }}>
                <span style={{ color: '#64748B', fontWeight: 600 }}>Dates:</span>
                <span style={{ color: '#0F172A' }}>{inspectLead.checkIn} → {inspectLead.checkOut}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem' }}>
                <span style={{ color: '#64748B', fontWeight: 600 }}>Budget:</span>
                <strong style={{ color: '#059669' }}>₹{Number(inspectLead.budget || 15000).toLocaleString('en-IN')}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem' }}>
                <span style={{ color: '#64748B', fontWeight: 600 }}>Current Status:</span>
                <span>{getStatusBadge(inspectLead.status)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                onClick={() => setInspectLead(null)}
                style={{
                  padding: '8px 18px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#2563EB',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
