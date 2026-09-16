import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import {
  Building2,
  MapPin,
  Mail,
  Phone,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  Search,
  Filter,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  BedDouble,
  Sparkles,
  Plus,
  Download,
  SlidersHorizontal,
  RotateCcw,
  MoreVertical,
  Check,
  X,
  Clock,
  Layers,
  CalendarDays,
  Hotel
} from 'lucide-react';

export default function AdminHotels() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { addNotification, refreshData } = useApp();

  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatusTab, setSelectedStatusTab] = useState('ALL');
  const [selectedHotelIds, setSelectedHotelIds] = useState([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Active popover menu state
  const [actionMenuHotelId, setActionMenuHotelId] = useState(null);

  // Modal inspection state
  const [inspectModalHotel, setInspectModalHotel] = useState(null);

  // Reject modal state
  const [rejectModalHotel, setRejectModalHotel] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Add Hotel Modal State
  const [addHotelModalOpen, setAddHotelModalOpen] = useState(false);
  const [newHotelForm, setNewHotelForm] = useState({
    name: '',
    city: 'Hyderabad',
    property_type: 'Business Hotel',
    star_rating: '5.0',
    manager_name: '',
    email: '',
    contact_number: '',
    total_rooms: 15,
    base_price: 3500
  });

  // Current live formatted date
  const [currentDateTime, setCurrentDateTime] = useState('');

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const datePart = now.toLocaleDateString('en-US', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
      const timePart = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      setCurrentDateTime(`${datePart} | ${timePart}`);
    };
    updateDateTime();
    const interval = setInterval(updateDateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchAllHotels();
  }, []);

  // Close actions dropdown on click outside
  useEffect(() => {
    const handleClickOutside = () => setActionMenuHotelId(null);
    if (actionMenuHotelId) {
      window.addEventListener('click', handleClickOutside);
    }
    return () => window.removeEventListener('click', handleClickOutside);
  }, [actionMenuHotelId]);

  const fetchAllHotels = async () => {
    setLoading(true);
    try {
      const data = await api.getAllHotels();
      setHotels(Array.isArray(data) ? data : []);
    } catch (err) {
      addToast(err.message || 'Failed to fetch hotels', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (hotel) => {
    setIsProcessing(true);
    try {
      await api.approveHotel(hotel.id);
      addToast(`"${hotel.name}" has been approved and is now LIVE!`, 'success');
      
      // Update local hotel state
      setHotels(prev => prev.map(h => h.id === hotel.id ? { ...h, status: 'APPROVED' } : h));
      
      // Send notification to hotel partner
      if (addNotification) {
        addNotification({
          role: 'hotel',
          userId: hotel.id,
          type: 'hotel_status',
          title: '🎉 Hotel Registration Approved!',
          message: `Congratulations! Your property "${hotel.name}" has been verified and approved by HotelIQ Admin. Your hotel is now LIVE for guest bookings and direct bidding.`,
          createdAt: new Date().toISOString(),
          link: '/hotel'
        });
      }

      if (inspectModalHotel && inspectModalHotel.id === hotel.id) {
        setInspectModalHotel(prev => ({ ...prev, status: 'APPROVED' }));
      }
      if (refreshData) refreshData();
    } catch (err) {
      addToast(err.message || 'Failed to approve hotel', 'error');
    } finally {
      setIsProcessing(false);
      setActionMenuHotelId(null);
    }
  };

  const handleOpenRejectModal = (hotel) => {
    setRejectModalHotel(hotel);
    setRejectionReason('');
    setActionMenuHotelId(null);
  };

  const handleConfirmReject = async () => {
    if (!rejectModalHotel) return;
    if (!rejectionReason.trim()) {
      addToast('Please provide a reason for rejection.', 'warning');
      return;
    }

    setIsProcessing(true);
    try {
      await api.rejectHotel(rejectModalHotel.id, rejectionReason.trim());
      addToast(`"${rejectModalHotel.name}" registration rejected.`, 'info');

      // Update local state
      setHotels(prev => prev.map(h => h.id === rejectModalHotel.id ? { ...h, status: 'REJECTED', rejectionReason: rejectionReason.trim() } : h));

      // Send notification to hotel partner
      if (addNotification) {
        addNotification({
          role: 'hotel',
          userId: rejectModalHotel.id,
          type: 'hotel_status',
          title: '⚠️ Registration Needs Modification',
          message: `Your property registration for "${rejectModalHotel.name}" was rejected by Admin. Reason: ${rejectionReason.trim()}`,
          createdAt: new Date().toISOString(),
          link: '/hotel/status'
        });
      }

      if (inspectModalHotel && inspectModalHotel.id === rejectModalHotel.id) {
        setInspectModalHotel(prev => ({ ...prev, status: 'REJECTED' }));
      }

      setRejectModalHotel(null);
      setRejectionReason('');
      if (refreshData) refreshData();
    } catch (err) {
      addToast(err.message || 'Failed to reject hotel', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSuspend = async (hotel) => {
    setIsProcessing(true);
    try {
      await api.suspendHotel(hotel.id);
      addToast(`"${hotel.name}" has been suspended.`, 'info');
      setHotels(prev => prev.map(h => h.id === hotel.id ? { ...h, status: 'SUSPENDED' } : h));
      if (inspectModalHotel && inspectModalHotel.id === hotel.id) {
        setInspectModalHotel(prev => ({ ...prev, status: 'SUSPENDED' }));
      }
      if (refreshData) refreshData();
    } catch (err) {
      addToast(err.message || 'Failed to suspend hotel', 'error');
    } finally {
      setIsProcessing(false);
      setActionMenuHotelId(null);
    }
  };

  const handleQuickAddHotel = async (e) => {
    e.preventDefault();
    if (!newHotelForm.name || !newHotelForm.email) {
      addToast('Please provide at least a hotel name and email.', 'warning');
      return;
    }
    setIsProcessing(true);
    try {
      const payload = {
        name: newHotelForm.name,
        city: newHotelForm.city,
        location: newHotelForm.city,
        property_type: newHotelForm.property_type,
        star_rating: newHotelForm.star_rating,
        manager_name: newHotelForm.manager_name || 'Authorized Manager',
        email: newHotelForm.email,
        contact_number: newHotelForm.contact_number || '9876543210',
        total_rooms: Number(newHotelForm.total_rooms) || 15,
        price_per_night: Number(newHotelForm.base_price) || 3500,
        status: 'APPROVED',
        rooms: [
          {
            id: 1,
            room_type: 'Deluxe Executive Room',
            quantity: Number(newHotelForm.total_rooms) || 15,
            price_per_night: Number(newHotelForm.base_price) || 3500,
            bed_type: 'King Bed',
            max_guests: 2,
            breakfast_included: true
          }
        ]
      };

      const res = await api.registerHotel(payload);
      addToast(`Hotel "${res.name || newHotelForm.name}" registered and activated successfully!`, 'success');
      setAddHotelModalOpen(false);
      setNewHotelForm({
        name: '',
        city: 'Hyderabad',
        property_type: 'Business Hotel',
        star_rating: '5.0',
        manager_name: '',
        email: '',
        contact_number: '',
        total_rooms: 15,
        base_price: 3500
      });
      fetchAllHotels();
    } catch (err) {
      addToast(err.message || 'Failed to register new hotel', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Metrics
  const totalCount = hotels.length;
  const pendingCount = hotels.filter(h => (h.status || '').toUpperCase() === 'PENDING').length;
  const approvedCount = hotels.filter(h => (h.status || '').toUpperCase() === 'APPROVED').length;
  const rejectedCount = hotels.filter(h => (h.status || '').toUpperCase() === 'REJECTED').length;
  const suspendedCount = hotels.filter(h => (h.status || '').toUpperCase() === 'SUSPENDED').length;

  // City list
  const cityList = Array.from(new Set(hotels.map(h => h.location || h.city || 'Other').filter(Boolean))).sort();

  // Filtered hotels
  const filteredHotels = useMemo(() => {
    return hotels.filter(h => {
      const status = (h.status || 'PENDING').toUpperCase();
      if (selectedStatusTab !== 'ALL' && status !== selectedStatusTab) {
        return false;
      }

      const loc = h.location || h.city || 'Other';
      if (selectedCity !== 'All' && loc.toLowerCase() !== selectedCity.toLowerCase()) {
        return false;
      }

      if (selectedCategory !== 'All') {
        const type = (h.property_type || '').toLowerCase();
        if (!type.includes(selectedCategory.toLowerCase())) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (h.name || '').toLowerCase().includes(q);
        const matchLoc = (h.location || h.city || h.address || '').toLowerCase().includes(q);
        const matchEmail = (h.email || '').toLowerCase().includes(q);
        const matchManager = (h.manager_name || '').toLowerCase().includes(q);
        if (!matchName && !matchLoc && !matchEmail && !matchManager) return false;
      }

      return true;
    });
  }, [hotels, selectedStatusTab, selectedCity, selectedCategory, searchQuery]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredHotels.length / itemsPerPage) || 1;
  const paginatedHotels = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredHotels.slice(start, start + itemsPerPage);
  }, [filteredHotels, currentPage, itemsPerPage]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedHotelIds(paginatedHotels.map(h => h.id));
    } else {
      setSelectedHotelIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedHotelIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleClearFilters = () => {
    setSelectedStatusTab('ALL');
    setSelectedCity('All');
    setSelectedCategory('All');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const getStatusBadge = (status) => {
    const s = (status || 'PENDING').toUpperCase();
    switch (s) {
      case 'APPROVED':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 12px',
            borderRadius: 20,
            fontSize: '0.78rem',
            fontWeight: 700,
            background: '#ECFDF5',
            color: '#059669',
            border: '1px solid #A7F3D0',
            whiteSpace: 'nowrap'
          }}>
            <CheckCircle2 size={13} />
            Approved & Live
          </span>
        );
      case 'PENDING':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 12px',
            borderRadius: 20,
            fontSize: '0.78rem',
            fontWeight: 800,
            background: '#FFFBEB',
            color: '#D97706',
            border: '1px solid #FDE68A',
            whiteSpace: 'nowrap',
            boxShadow: '0 0 8px rgba(245, 158, 11, 0.15)'
          }}>
            <Clock size={13} />
            Pending Approval
          </span>
        );
      case 'REJECTED':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 12px',
            borderRadius: 20,
            fontSize: '0.78rem',
            fontWeight: 700,
            background: '#FEF2F2',
            color: '#DC2626',
            border: '1px solid #FECACA',
            whiteSpace: 'nowrap'
          }}>
            <XCircle size={13} />
            Rejected
          </span>
        );
      case 'SUSPENDED':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 12px',
            borderRadius: 20,
            fontSize: '0.78rem',
            fontWeight: 700,
            background: '#FEF2F2',
            color: '#DC2626',
            border: '1px solid #FECACA',
            whiteSpace: 'nowrap'
          }}>
            <ShieldAlert size={13} />
            Suspended
          </span>
        );
      default:
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 12px',
            borderRadius: 20,
            fontSize: '0.78rem',
            fontWeight: 700,
            background: '#F1F5F9',
            color: '#475569',
            whiteSpace: 'nowrap'
          }}>
            {status}
          </span>
        );
    }
  };

  const parseRating = (r) => {
    if (!r) return '5.0';
    const num = parseFloat(r);
    return isNaN(num) ? '5.0' : num.toFixed(1);
  };

  return (
    <div className="fade-in" style={{ paddingBottom: 80, fontFamily: 'var(--font-sans)' }}>
      {/* Breadcrumb & Top Bar Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: 600 }}>
          <Link to="/admin" style={{ textDecoration: 'none', color: '#64748B' }}>Dashboard</Link>
          <span style={{ margin: '0 6px' }}>›</span>
          <span style={{ color: '#2563EB', fontWeight: 700 }}>Hotels</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: '0.82rem', color: '#475569', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            <CalendarDays size={15} style={{ color: '#2563EB' }} />
            <span>{currentDateTime}</span>
          </div>

          <button
            onClick={() => setAddHotelModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '9px 18px',
              borderRadius: 10,
              background: '#2563EB',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.86rem',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
              transition: 'all 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#1D4ED8'}
            onMouseLeave={e => e.currentTarget.style.background = '#2563EB'}
          >
            <Plus size={16} />
            <span>Add New Hotel</span>
          </button>
        </div>
      </div>

      {/* Hero Header with Illustrated Banner */}
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
        {/* Left Title */}
        <div style={{ maxWidth: 540, zIndex: 2 }}>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>
            Hotel Property Management
          </h1>
          <p style={{ color: '#475569', fontSize: '0.92rem', margin: '6px 0 0', lineHeight: 1.5 }}>
            Manage hotel partners, review submissions, inspect rooms and documents, and track live status.
          </p>
        </div>

        {/* Right Illustration & Script Text */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, zIndex: 2 }}>
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

          {/* Hotel Building Art Graphic */}
          <div style={{
            width: 110,
            height: 80,
            borderRadius: 12,
            background: 'rgba(255, 255, 255, 0.65)',
            backdropFilter: 'blur(4px)',
            border: '1px solid rgba(255, 255, 255, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2.8rem',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.05)'
          }}>
            🏨
          </div>
        </div>
      </div>

      {/* 4 Stat Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        {/* Total Properties */}
        <div 
          onClick={() => setSelectedStatusTab('ALL')}
          style={{
            background: '#FFFFFF',
            border: `1.5px solid ${selectedStatusTab === 'ALL' ? '#3B82F6' : '#E2E8F0'}`,
            borderRadius: 14,
            padding: '18px 20px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: selectedStatusTab === 'ALL' ? '0 4px 14px rgba(59, 130, 246, 0.12)' : '0 2px 6px rgba(0,0,0,0.02)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 16
          }}
        >
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: '#EEF2FF',
            color: '#4F46E5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Building2 size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 700 }}>
              Total Properties
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <span style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>
                {totalCount}
              </span>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#059669', background: '#ECFDF5', padding: '2px 6px', borderRadius: 6 }}>
                ↑ +12%
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 6 }}>
              All registered hotel partners
            </div>
          </div>
        </div>

        {/* Pending Approval */}
        <div 
          onClick={() => setSelectedStatusTab('PENDING')}
          style={{
            background: '#FFFFFF',
            border: `1.5px solid ${selectedStatusTab === 'PENDING' ? '#F59E0B' : '#E2E8F0'}`,
            borderRadius: 14,
            padding: '18px 20px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: selectedStatusTab === 'PENDING' ? '0 4px 14px rgba(245, 158, 11, 0.15)' : '0 2px 6px rgba(0,0,0,0.02)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 16
          }}
        >
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: '#FEF3C7',
            color: '#D97706',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Clock size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#B45309', fontWeight: 800 }}>
              Pending Approval
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <span style={{ fontSize: '1.85rem', fontWeight: 800, color: '#B45309', lineHeight: 1 }}>
                {pendingCount}
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#B45309', marginTop: 6 }}>
              {pendingCount === 1 ? '1 property awaiting verification' : `${pendingCount} properties awaiting verification`}
            </div>
          </div>
        </div>

        {/* Approved & Live */}
        <div 
          onClick={() => setSelectedStatusTab('APPROVED')}
          style={{
            background: '#FFFFFF',
            border: `1.5px solid ${selectedStatusTab === 'APPROVED' ? '#10B981' : '#E2E8F0'}`,
            borderRadius: 14,
            padding: '18px 20px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: selectedStatusTab === 'APPROVED' ? '0 4px 14px rgba(16, 185, 129, 0.15)' : '0 2px 6px rgba(0,0,0,0.02)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 16
          }}
        >
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: '#ECFDF5',
            color: '#059669',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 700 }}>
              Approved & Live
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <span style={{ fontSize: '1.85rem', fontWeight: 800, color: '#047857', lineHeight: 1 }}>
                {approvedCount}
              </span>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#059669', background: '#ECFDF5', padding: '2px 6px', borderRadius: 6 }}>
                ↑ +5%
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: 6 }}>
              Active on guest platform
            </div>
          </div>
        </div>

        {/* Rejected / Suspended */}
        <div 
          onClick={() => setSelectedStatusTab('SUSPENDED')}
          style={{
            background: '#FFFFFF',
            border: `1.5px solid ${selectedStatusTab === 'SUSPENDED' || selectedStatusTab === 'REJECTED' ? '#EF4444' : '#E2E8F0'}`,
            borderRadius: 14,
            padding: '18px 20px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: (selectedStatusTab === 'SUSPENDED' || selectedStatusTab === 'REJECTED') ? '0 4px 14px rgba(239, 68, 68, 0.15)' : '0 2px 6px rgba(0,0,0,0.02)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 16
          }}
        >
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: '#FEF2F2',
            color: '#DC2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <ShieldAlert size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#DC2626', fontWeight: 700 }}>
              Rejected / Suspended
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <span style={{ fontSize: '1.85rem', fontWeight: 800, color: '#B91C1C', lineHeight: 1 }}>
                {rejectedCount + suspendedCount}
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#DC2626', marginTop: 6 }}>
              {rejectedCount} Rejected · {suspendedCount} Suspended
            </div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar Controls */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: 14,
        padding: '16px 20px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
        marginBottom: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 14
      }}>
        {/* Row 1: Status Filter Tabs & Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          {/* Status Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {[
              { id: 'ALL', label: 'All Hotels', count: totalCount },
              { id: 'PENDING', label: 'Pending Approval', count: pendingCount },
              { id: 'APPROVED', label: 'Approved', count: approvedCount },
              { id: 'REJECTED', label: 'Rejected', count: rejectedCount },
              { id: 'SUSPENDED', label: 'Suspended', count: suspendedCount },
            ].map(tab => {
              const isActive = selectedStatusTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setSelectedStatusTab(tab.id); setCurrentPage(1); }}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 10,
                    border: 'none',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    transition: 'all 0.15s',
                    background: isActive ? '#2563EB' : '#F1F5F9',
                    color: isActive ? '#FFFFFF' : '#475569',
                    boxShadow: isActive ? '0 2px 8px rgba(37, 99, 235, 0.25)' : 'none'
                  }}
                >
                  <span>{tab.label}</span>
                  <span style={{
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    padding: '2px 7px',
                    borderRadius: 8,
                    background: isActive ? 'rgba(255,255,255,0.25)' : '#E2E8F0',
                    color: isActive ? '#FFFFFF' : '#334155'
                  }}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Export & Quick Filter Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => {
                const jsonStr = JSON.stringify(filteredHotels, null, 2);
                const blob = new Blob([jsonStr], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `hoteliq_properties_${Date.now()}.json`;
                a.click();
                addToast('Properties exported successfully!', 'success');
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 8,
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#334155',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Download size={14} />
              <span>Export</span>
            </button>

            <button
              onClick={handleClearFilters}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 8,
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#334155',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <SlidersHorizontal size={14} />
              <span>Filter</span>
            </button>
          </div>
        </div>

        {/* Row 2: Location Dropdown, Search Input, Category Filter, and Reset */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {/* City Dropdown */}
          <div style={{ position: 'relative' }}>
            <select
              value={selectedCity}
              onChange={e => { setSelectedCity(e.target.value); setCurrentPage(1); }}
              style={{
                padding: '9px 16px',
                borderRadius: 10,
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                fontSize: '0.84rem',
                fontWeight: 600,
                color: '#1E293B',
                cursor: 'pointer',
                outline: 'none',
                minWidth: 200
              }}
            >
              <option value="All">📍 All Cities ({hotels.length})</option>
              {cityList.map(city => (
                <option key={city} value={city}>
                  📍 {city} ({hotels.filter(h => (h.location || h.city) === city).length})
                </option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
            <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Search by hotel name, manager, email..."
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              style={{
                width: '100%',
                padding: '9px 14px 9px 38px',
                borderRadius: 10,
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                fontSize: '0.84rem',
                color: '#1E293B',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94A3B8'
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Categories Dropdown */}
          <div style={{ position: 'relative' }}>
            <select
              value={selectedCategory}
              onChange={e => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
              style={{
                padding: '9px 16px',
                borderRadius: 10,
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                fontSize: '0.84rem',
                fontWeight: 600,
                color: '#1E293B',
                cursor: 'pointer',
                outline: 'none',
                minWidth: 160
              }}
            >
              <option value="All">🗂 All Categories</option>
              <option value="Business">Business Hotel</option>
              <option value="Resort">Resort</option>
              <option value="Boutique">Boutique Hotel</option>
              <option value="Villa">Villa</option>
              <option value="Guest House">Guest House</option>
            </select>
          </div>

          {/* Clear Filters Button */}
          <button
            onClick={handleClearFilters}
            style={{
              background: 'none',
              border: 'none',
              color: '#2563EB',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 8px'
            }}
          >
            <RotateCcw size={14} />
            <span>Clear Filters</span>
          </button>
        </div>
      </div>

      {/* Main Table View */}
      {loading ? (
        <div style={{ background: '#FFFFFF', borderRadius: 14, padding: 80, textAlign: 'center', border: '1px solid #E2E8F0' }}>
          <RefreshCw size={32} className="animate-spin" style={{ color: '#2563EB', margin: '0 auto 16px' }} />
          <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '1rem' }}>Loading hotel directory...</div>
          <div style={{ fontSize: '0.85rem', color: '#64748B', marginTop: 4 }}>Fetching live property entries and verification statuses</div>
        </div>
      ) : filteredHotels.length === 0 ? (
        <div style={{ background: '#FFFFFF', borderRadius: 14, padding: '70px 20px', textAlign: 'center', border: '1px dashed #CBD5E1' }}>
          <Building2 size={40} style={{ color: '#94A3B8', margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>No hotels match your filter</h3>
          <p style={{ color: '#64748B', fontSize: '0.88rem', margin: '8px 0 0' }}>
            Try selecting a different status tab, changing the city filter, or clearing the search query.
          </p>
          <button
            onClick={handleClearFilters}
            style={{
              marginTop: 18,
              padding: '9px 22px',
              borderRadius: 8,
              background: '#2563EB',
              color: '#FFFFFF',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        /* LIST VIEW TABLE */
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
                      onChange={handleSelectAll}
                      checked={paginatedHotels.length > 0 && selectedHotelIds.length === paginatedHotels.length}
                      style={{ cursor: 'pointer', borderRadius: 4, width: 16, height: 16 }}
                    />
                  </th>
                  <th style={{ padding: '14px 16px', fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', width: '28%' }}>
                    HOTEL PROPERTY
                  </th>
                  <th style={{ padding: '14px 16px', fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', width: '18%' }}>
                    LOCATION & TYPE
                  </th>
                  <th style={{ padding: '14px 16px', fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', width: '18%' }}>
                    MANAGER / CONTACT
                  </th>
                  <th style={{ padding: '14px 16px', fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', width: '14%' }}>
                    ROOM INVENTORY
                  </th>
                  <th style={{ padding: '14px 16px', fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', width: '12%' }}>
                    STATUS
                  </th>
                  <th style={{ padding: '14px 20px', fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', width: '10%', textAlign: 'right' }}>
                    ACTIONS
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedHotels.map((h, idx) => {
                  const status = (h.status || 'PENDING').toUpperCase();
                  const isPending = status === 'PENDING';
                  const isSuspended = status === 'SUSPENDED';
                  const roomsCount = Array.isArray(h.rooms) ? h.rooms.length : 0;
                  const thumb = (h.photos && h.photos[0]) || (h.rooms && h.rooms[0]?.images?.[0]?.url) || (h.rooms && typeof h.rooms[0]?.images?.[0] === 'string' ? h.rooms[0]?.images?.[0] : '') || '';
                  const ratingVal = parseRating(h.star_rating);
                  const locationText = h.location || h.city || 'India';
                  const typeText = h.property_type || 'Hotel';
                  const subtitle = h.state ? `${typeText} · ${h.state}` : `${typeText} · ${locationText}`;
                  const isSelected = selectedHotelIds.includes(h.id);

                  return (
                    <tr
                      key={h.id || idx}
                      style={{
                        borderBottom: '1px solid #F1F5F9',
                        background: isSelected ? '#EFF6FF' : isPending ? '#FFFCF2' : idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={e => {
                        if (!isSelected) e.currentTarget.style.background = isPending ? '#FFF7DE' : '#F8FAFC';
                      }}
                      onMouseLeave={e => {
                        if (!isSelected) e.currentTarget.style.background = isPending ? '#FFFCF2' : idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA';
                      }}
                    >
                      {/* Checkbox */}
                      <td style={{ padding: '16px 16px' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectOne(h.id)}
                          style={{ cursor: 'pointer', borderRadius: 4, width: 16, height: 16 }}
                        />
                      </td>

                      {/* Property Thumbnail & Info */}
                      <td style={{ padding: '16px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          {thumb ? (
                            <div style={{
                              width: 58,
                              height: 58,
                              borderRadius: 10,
                              backgroundImage: `url(${thumb})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              border: '1px solid #E2E8F0',
                              flexShrink: 0,
                              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                            }} />
                          ) : (
                            <div style={{
                              width: 58,
                              height: 58,
                              borderRadius: 10,
                              background: '#F1F5F9',
                              border: '1px solid #E2E8F0',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#64748B',
                              flexShrink: 0
                            }}>
                              <Building2 size={24} />
                            </div>
                          )}

                          <div style={{ minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <strong style={{ fontSize: '0.96rem', fontWeight: 800, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200 }} title={h.name}>
                                {h.name || 'Unnamed Property'}
                              </strong>
                              <span style={{
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                color: '#B45309',
                                background: '#FEF3C7',
                                padding: '2px 6px',
                                borderRadius: 4,
                                whiteSpace: 'nowrap',
                                flexShrink: 0
                              }}>
                                ★ {ratingVal}
                              </span>
                            </div>
                            
                            <div style={{ fontSize: '0.76rem', color: '#64748B', marginTop: 3 }}>
                              ID: #{h.id} · Recent
                            </div>

                            {/* Property Tag */}
                            <div style={{ marginTop: 4 }}>
                              <span style={{
                                background: '#EEF2FF',
                                color: '#4F46E5',
                                border: '1px solid #E0E7FF',
                                padding: '2px 8px',
                                borderRadius: 6,
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                display: 'inline-block'
                              }}>
                                {h.property_type || 'Business Hotel'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Location & Type */}
                      <td style={{ padding: '16px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontWeight: 700, color: '#0F172A', fontSize: '0.88rem', whiteSpace: 'nowrap' }}>
                          <MapPin size={14} style={{ color: '#EF4444', flexShrink: 0 }} />
                          <span>{locationText}</span>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: 3, whiteSpace: 'nowrap' }}>
                          {subtitle}
                        </div>
                      </td>

                      {/* Manager / Contact */}
                      <td style={{ padding: '16px 16px' }}>
                        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap' }}>
                          {h.manager_name || h.contact_person || 'Authorized Manager'}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: 3, display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
                          <Mail size={13} style={{ color: '#64748B', flexShrink: 0 }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 170 }}>{h.email || 'N/A'}</span>
                        </div>
                        {h.contact_number && (
                          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 2, display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
                            <Phone size={12} style={{ color: '#64748B', flexShrink: 0 }} />
                            <span>{h.contact_number}</span>
                          </div>
                        )}
                      </td>

                      {/* Room Inventory */}
                      <td style={{ padding: '16px 16px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#EFF6FF', color: '#1D4ED8', padding: '4px 10px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                          <BedDouble size={14} style={{ color: '#3B82F6' }} />
                          <span>{roomsCount || 2} Categories</span>
                        </div>
                        <div style={{ fontSize: '0.76rem', color: '#64748B', marginTop: 4, whiteSpace: 'nowrap' }}>
                          {h.total_rooms ? `${h.total_rooms} total rooms` : '15 total rooms'}
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '16px 16px' }}>
                        {getStatusBadge(status)}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, position: 'relative', whiteSpace: 'nowrap' }}>
                          {/* Inspect Button */}
                          <button
                            onClick={() => setInspectModalHotel(h)}
                            title="Inspect details"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                              padding: '6px 12px',
                              borderRadius: 8,
                              border: '1px solid #CBD5E1',
                              background: '#FFFFFF',
                              color: '#1E293B',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              transition: 'all 0.15s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = '#F1F5F9'}
                            onMouseLeave={e => e.currentTarget.style.background = '#FFFFFF'}
                          >
                            <Eye size={14} style={{ color: '#3B82F6' }} />
                            <span>Inspect</span>
                          </button>

                          {/* Quick Approve or Suspend Button */}
                          {status !== 'APPROVED' ? (
                            <button
                              onClick={() => handleApprove(h)}
                              disabled={isProcessing}
                              title="Approve Hotel"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                                padding: '6px 14px',
                                borderRadius: 8,
                                border: 'none',
                                background: '#10B981',
                                color: '#FFFFFF',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                                boxShadow: '0 2px 4px rgba(16, 185, 129, 0.25)'
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = '#059669'}
                              onMouseLeave={e => e.currentTarget.style.background = '#10B981'}
                            >
                              <Check size={14} />
                              <span>Approve</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleSuspend(h)}
                              disabled={isProcessing}
                              title="Suspend Hotel"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                                padding: '6px 12px',
                                borderRadius: 8,
                                border: '1px solid #E2E8F0',
                                background: '#FFFFFF',
                                color: '#64748B',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                              onMouseEnter={e => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.color = '#DC2626'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.color = '#64748B'; }}
                            >
                              <ShieldAlert size={14} />
                              <span>Suspend</span>
                            </button>
                          )}

                          {/* More Options Popover */}
                          <div style={{ position: 'relative' }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActionMenuHotelId(actionMenuHotelId === h.id ? null : h.id);
                              }}
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
                              <MoreVertical size={16} />
                            </button>

                            {actionMenuHotelId === h.id && (
                              <div style={{
                                position: 'absolute',
                                right: 0,
                                top: '100%',
                                marginTop: 6,
                                width: 160,
                                background: '#FFFFFF',
                                borderRadius: 10,
                                border: '1px solid #E2E8F0',
                                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                                zIndex: 100,
                                padding: 6,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 2
                              }}>
                                <button
                                  onClick={() => { setInspectModalHotel(h); setActionMenuHotelId(null); }}
                                  style={{
                                    padding: '8px 10px',
                                    borderRadius: 6,
                                    border: 'none',
                                    background: 'none',
                                    color: '#1E293B',
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8
                                  }}
                                  onMouseEnter={e => e.currentTarget.style.background = '#F1F5F9'}
                                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                >
                                  <Eye size={14} /> Inspect Details
                                </button>
                                {status !== 'APPROVED' && (
                                  <button
                                    onClick={() => handleApprove(h)}
                                    style={{
                                      padding: '8px 10px',
                                      borderRadius: 6,
                                      border: 'none',
                                      background: 'none',
                                      color: '#059669',
                                      fontSize: '0.8rem',
                                      fontWeight: 600,
                                      cursor: 'pointer',
                                      textAlign: 'left',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 8
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#ECFDF5'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                  >
                                    <Check size={14} /> Approve Property
                                  </button>
                                )}
                                {status === 'PENDING' && (
                                  <button
                                    onClick={() => handleOpenRejectModal(h)}
                                    style={{
                                      padding: '8px 10px',
                                      borderRadius: 6,
                                      border: 'none',
                                      background: 'none',
                                      color: '#DC2626',
                                      fontSize: '0.8rem',
                                      fontWeight: 600,
                                      cursor: 'pointer',
                                      textAlign: 'left',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 8
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#FEF2F2'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                  >
                                    <XCircle size={14} /> Reject with Reason
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Pagination Footer */}
          <div style={{
            padding: '16px 24px',
            background: '#F8FAFC',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.86rem',
            color: '#64748B',
            flexWrap: 'wrap',
            gap: 12
          }}>
            <div>
              Showing <strong style={{ color: '#0F172A' }}>{paginatedHotels.length}</strong> of <strong style={{ color: '#0F172A' }}>{filteredHotels.length}</strong> registered properties
            </div>

            {/* Pagination Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  color: currentPage === 1 ? '#CBD5E1' : '#1E293B',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700
                }}
              >
                ‹
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 5).map(pageNum => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 8,
                    border: 'none',
                    background: currentPage === pageNum ? '#2563EB' : '#FFFFFF',
                    color: currentPage === pageNum ? '#FFFFFF' : '#1E293B',
                    border: currentPage === pageNum ? 'none' : '1px solid #CBD5E1',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '0.84rem'
                  }}
                >
                  {pageNum}
                </button>
              ))}

              {totalPages > 5 && (
                <>
                  <span style={{ padding: '0 4px', color: '#94A3B8' }}>...</span>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 8,
                      border: currentPage === totalPages ? 'none' : '1px solid #CBD5E1',
                      background: currentPage === totalPages ? '#2563EB' : '#FFFFFF',
                      color: currentPage === totalPages ? '#FFFFFF' : '#1E293B',
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: '0.84rem'
                    }}
                  >
                    {totalPages}
                  </button>
                </>
              )}

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  color: currentPage === totalPages ? '#CBD5E1' : '#1E293B',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700
                }}
              >
                ›
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 1. ADD NEW HOTEL MODAL */}
      {/* ========================================================= */}
      {addHotelModalOpen && (
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
            maxWidth: 580,
            borderRadius: 18,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
            padding: 28,
            display: 'flex',
            flexDirection: 'column',
            gap: 18
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Building2 size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                    Add New Hotel Property
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                    Quickly add and activate a verified partner hotel
                  </div>
                </div>
              </div>
              <button
                onClick={() => setAddHotelModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleQuickAddHotel} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                  Hotel Property Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. The Grand Palace"
                  value={newHotelForm.name}
                  onChange={e => setNewHotelForm({ ...newHotelForm, name: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: '0.86rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                    City / Location *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hyderabad"
                    value={newHotelForm.city}
                    onChange={e => setNewHotelForm({ ...newHotelForm, city: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: '0.86rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                    Property Type
                  </label>
                  <select
                    value={newHotelForm.property_type}
                    onChange={e => setNewHotelForm({ ...newHotelForm, property_type: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: '0.86rem', boxSizing: 'border-box' }}
                  >
                    <option value="Business Hotel">Business Hotel</option>
                    <option value="Resort">Luxury Resort</option>
                    <option value="Boutique Hotel">Boutique Hotel</option>
                    <option value="Villa">Villa</option>
                    <option value="Guest House">Guest House</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                    Manager Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Rajesh Sharma"
                    value={newHotelForm.manager_name}
                    onChange={e => setNewHotelForm({ ...newHotelForm, manager_name: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: '0.86rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                    Manager Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. manager@hotel.com"
                    value={newHotelForm.email}
                    onChange={e => setNewHotelForm({ ...newHotelForm, email: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: '0.86rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                    Total Rooms
                  </label>
                  <input
                    type="number"
                    value={newHotelForm.total_rooms}
                    onChange={e => setNewHotelForm({ ...newHotelForm, total_rooms: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: '0.86rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                    Starting Price / Night (₹)
                  </label>
                  <input
                    type="number"
                    value={newHotelForm.base_price}
                    onChange={e => setNewHotelForm({ ...newHotelForm, base_price: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: '0.86rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setAddHotelModalOpen(false)}
                  style={{
                    padding: '9px 18px',
                    borderRadius: 8,
                    border: '1px solid #CBD5E1',
                    background: 'white',
                    color: '#475569',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  style={{
                    padding: '9px 22px',
                    borderRadius: 8,
                    border: 'none',
                    background: '#2563EB',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: isProcessing ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isProcessing ? 'Saving...' : 'Add & Activate Hotel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. PROPERTY INSPECTION MODAL */}
      {/* ========================================================= */}
      {inspectModalHotel && (
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
            maxWidth: 880,
            maxHeight: '90vh',
            borderRadius: 18,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#F8FAFC'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: '#2563EB',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(37, 99, 235, 0.3)'
                }}>
                  <Building2 size={22} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
                      {inspectModalHotel.name}
                    </h2>
                    {getStatusBadge(inspectModalHotel.status)}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#64748B', marginTop: 3 }}>
                    Property ID #{inspectModalHotel.id} · {inspectModalHotel.location || inspectModalHotel.city} · {inspectModalHotel.property_type || 'Hotel'}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setInspectModalHotel(null)}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  color: '#64748B',
                  cursor: 'pointer',
                  padding: 8,
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#0F172A'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.color = '#64748B'; }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Basic Details Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                <div style={{ background: '#F8FAFC', padding: 14, borderRadius: 12, border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Property Type</div>
                  <div style={{ fontSize: '0.94rem', fontWeight: 800, color: '#0F172A', marginTop: 4 }}>{inspectModalHotel.property_type || 'Standard Hotel'}</div>
                </div>
                <div style={{ background: '#F8FAFC', padding: 14, borderRadius: 12, border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Star Rating</div>
                  <div style={{ fontSize: '0.94rem', fontWeight: 800, color: '#D97706', marginTop: 4 }}>★ {inspectModalHotel.star_rating || '5.0'}</div>
                </div>
                <div style={{ background: '#F8FAFC', padding: 14, borderRadius: 12, border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Manager Contact</div>
                  <div style={{ fontSize: '0.94rem', fontWeight: 800, color: '#0F172A', marginTop: 4 }}>{inspectModalHotel.manager_name || 'N/A'}</div>
                  <div style={{ fontSize: '0.76rem', color: '#64748B', marginTop: 2 }}>{inspectModalHotel.email} · {inspectModalHotel.contact_number || 'N/A'}</div>
                </div>
                <div style={{ background: '#F8FAFC', padding: 14, borderRadius: 12, border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Full Address</div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0F172A', marginTop: 4 }}>
                    {inspectModalHotel.address || 'Standard Location'}, {inspectModalHotel.location || inspectModalHotel.city} - {inspectModalHotel.pincode || 'India'}
                  </div>
                </div>
              </div>

              {/* Description */}
              {inspectModalHotel.description && (
                <div>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>Property Description</h4>
                  <p style={{ fontSize: '0.88rem', color: '#475569', lineHeight: 1.6, background: '#F8FAFC', padding: 16, borderRadius: 12, border: '1px solid #E2E8F0', margin: 0 }}>
                    {inspectModalHotel.description}
                  </p>
                </div>
              )}

              {/* Photos Gallery */}
              {inspectModalHotel.photos && inspectModalHotel.photos.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>
                    Property Photos ({inspectModalHotel.photos.length})
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
                    {inspectModalHotel.photos.map((photo, i) => (
                      <img
                        key={i}
                        src={photo}
                        alt="Property preview"
                        style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 10, border: '1px solid #E2E8F0' }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Facilities / Amenities */}
              {Array.isArray(inspectModalHotel.amenities) && inspectModalHotel.amenities.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>
                    Hotel Facilities & Amenities ({inspectModalHotel.amenities.length})
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {inspectModalHotel.amenities.map((amenity, i) => (
                      <span
                        key={i}
                        style={{
                          background: '#EFF6FF',
                          color: '#1D4ED8',
                          padding: '5px 12px',
                          borderRadius: 8,
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          border: '1px solid #BFDBFE'
                        }}
                      >
                        ✓ {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Room Categories */}
              <div>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>
                  Room Inventory & Nightly Pricing ({Array.isArray(inspectModalHotel.rooms) ? inspectModalHotel.rooms.length : 0})
                </h4>
                {Array.isArray(inspectModalHotel.rooms) && inspectModalHotel.rooms.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {inspectModalHotel.rooms.map((r, i) => (
                      <div
                        key={r.id || i}
                        style={{
                          background: '#FFFFFF',
                          border: '1px solid #E2E8F0',
                          borderRadius: 12,
                          padding: '14px 18px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: 12
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0F172A' }}>
                            {r.room_type || r.type || 'Deluxe King Room'}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: 3 }}>
                            {r.bed_type || 'King Bed'} · Max {r.max_guests || 2} Guests · {r.quantity || 5} Rooms Available
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 800, fontSize: '1.15rem', color: '#0F172A' }}>
                            ₹{Number(r.price_per_night || r.price || 3500).toLocaleString('en-IN')}<span style={{ fontSize: '0.78rem', fontWeight: 500, color: '#64748B' }}>/night</span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 700, marginTop: 2 }}>
                            {r.breakfast_included ? '✓ Breakfast Included' : 'Room Only'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.85rem', color: '#64748B', fontStyle: 'italic', padding: 14, background: '#F8FAFC', borderRadius: 10 }}>
                    Standard rooms configured in catalog.
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#F8FAFC'
            }}>
              <button
                onClick={() => setInspectModalHotel(null)}
                style={{
                  padding: '10px 20px',
                  borderRadius: 8,
                  border: '1px solid #CBD5E1',
                  background: 'white',
                  color: '#475569',
                  fontWeight: 700,
                  fontSize: '0.86rem',
                  cursor: 'pointer'
                }}
              >
                Close Inspection
              </button>

              <div style={{ display: 'flex', gap: 10 }}>
                {inspectModalHotel.status !== 'REJECTED' && (
                  <button
                    onClick={() => handleOpenRejectModal(inspectModalHotel)}
                    disabled={isProcessing}
                    style={{
                      padding: '10px 20px',
                      borderRadius: 8,
                      border: '1px solid #FECACA',
                      background: '#FEF2F2',
                      color: '#DC2626',
                      fontWeight: 800,
                      fontSize: '0.86rem',
                      cursor: 'pointer'
                    }}
                  >
                    Reject Registration
                  </button>
                )}

                {inspectModalHotel.status !== 'APPROVED' && (
                  <button
                    onClick={() => handleApprove(inspectModalHotel)}
                    disabled={isProcessing}
                    style={{
                      padding: '10px 24px',
                      borderRadius: 8,
                      border: 'none',
                      background: '#10B981',
                      color: '#FFFFFF',
                      fontWeight: 800,
                      fontSize: '0.86rem',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(16, 185, 129, 0.35)'
                    }}
                  >
                    Approve & Go Live
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. REJECT HOTEL MODAL (With Reason Input) */}
      {/* ========================================================= */}
      {rejectModalHotel && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(5px)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20
        }}>
          <div style={{
            background: '#FFFFFF',
            width: '100%',
            maxWidth: 500,
            borderRadius: 16,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 16
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <XCircle size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Reject Hotel Registration
                </h3>
                <div style={{ fontSize: '0.82rem', color: '#64748B', marginTop: 2 }}>
                  {rejectModalHotel.name} (ID: #{rejectModalHotel.id})
                </div>
              </div>
            </div>

            <p style={{ fontSize: '0.88rem', color: '#475569', margin: 0, lineHeight: 1.5 }}>
              Specify why this partner registration is being rejected. The hotel manager will receive this feedback to correct their documents or room details.
            </p>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#334155', marginBottom: 6 }}>
                Reason for Rejection:
              </label>
              <textarea
                rows={4}
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                placeholder="e.g. Uploaded trade license document is expired. Please re-upload a valid license and clear photos of deluxe rooms."
                style={{
                  width: '100%',
                  padding: 12,
                  borderRadius: 10,
                  border: '1.5px solid #CBD5E1',
                  fontSize: '0.86rem',
                  fontFamily: 'inherit',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
              <button
                onClick={() => setRejectModalHotel(null)}
                style={{
                  padding: '9px 18px',
                  borderRadius: 8,
                  border: '1px solid #CBD5E1',
                  background: 'white',
                  color: '#475569',
                  fontWeight: 700,
                  fontSize: '0.86rem',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={isProcessing || !rejectionReason.trim()}
                style={{
                  padding: '9px 20px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#DC2626',
                  color: 'white',
                  fontWeight: 800,
                  fontSize: '0.86rem',
                  cursor: (isProcessing || !rejectionReason.trim()) ? 'not-allowed' : 'pointer',
                  opacity: (isProcessing || !rejectionReason.trim()) ? 0.6 : 1
                }}
              >
                {isProcessing ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
