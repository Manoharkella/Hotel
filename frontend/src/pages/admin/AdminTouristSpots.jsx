import { useState, useEffect, useMemo } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Compass,
  MapPin,
  Search,
  Plus,
  Filter,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Eye,
  Star,
  Clock,
  Ticket,
  ExternalLink,
  Layers,
  Sparkles,
  Building,
  Landmark,
  Trees,
  ShoppingBag,
  Film,
  Smile,
  X,
  Check,
  ToggleLeft,
  ToggleRight,
  Map as MapIcon,
  Table,
  Upload
} from 'lucide-react';

const createAdminSpotPin = (category) => {
  const categoryColors = {
    'Historical': '#8B5CF6',
    'Religious': '#F59E0B',
    'Nature': '#10B981',
    'Beach': '#06B6D4',
    'Shopping': '#EC4899',
    'Entertainment': '#F43F5E',
    'Museum': '#3B82F6',
    'Adventure': '#EF4444',
    'Family / Kids': '#14B8A6'
  };
  const color = categoryColors[category] || '#6366F1';

  return L.divIcon({
    className: 'admin-spot-pin',
    html: `
      <div style="
        background: ${color};
        color: white;
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 10px ${color}66;
        border: 2px solid #FFFFFF;
        cursor: pointer;
      ">
        <div style="transform: rotate(45deg); font-size: 13px; font-weight: 800;">📍</div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32]
  });
};

function LocationPickerEvents({ onSelectCoords }) {
  useMapEvents({
    click(e) {
      onSelectCoords(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

export default function AdminTouristSpots() {
  const { addToast } = useToast();
  
  const [spots, setSpots] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCity, setSelectedCity] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [viewTab, setViewTab] = useState('table'); // 'table' | 'map'

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSpot, setEditingSpot] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Form State
  const initialForm = {
    name: '',
    description: '',
    category: 'Historical',
    latitude: 17.3616,
    longitude: 78.4747,
    address: '',
    city: 'Hyderabad',
    image_url: '',
    rating: 4.5,
    review_count: 100,
    opening_hours: '09:00 AM',
    closing_hours: '06:00 PM',
    entry_fee: 'Free Entry',
    best_time_to_visit: 'Morning / Evening',
    estimated_duration: '1-2 hours',
    is_active: true
  };
  const [formData, setFormData] = useState(initialForm);

  const categories = [
    'Historical',
    'Religious',
    'Nature',
    'Beach',
    'Shopping',
    'Entertainment',
    'Museum',
    'Adventure',
    'Family / Kids'
  ];

  const fetchSpots = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminTouristSpots({
        search,
        category: selectedCategory,
        city: selectedCity,
        status: selectedStatus
      });
      setSpots(res.spots || []);
      setStats(res.stats || {});
    } catch (err) {
      addToast(err.message || 'Failed to load tourist spots', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpots();
  }, [search, selectedCategory, selectedCity, selectedStatus]);

  const handleOpenCreate = () => {
    setEditingSpot(null);
    setFormData(initialForm);
    setModalOpen(true);
  };

  const handleOpenEdit = (spot) => {
    setEditingSpot(spot);
    setFormData({
      name: spot.name || '',
      description: spot.description || '',
      category: spot.category || 'Historical',
      latitude: spot.latitude || 17.3616,
      longitude: spot.longitude || 78.4747,
      address: spot.address || '',
      city: spot.city || '',
      image_url: spot.image_url || '',
      rating: spot.rating || 4.5,
      review_count: spot.review_count || 100,
      opening_hours: spot.opening_hours || '09:00 AM',
      closing_hours: spot.closing_hours || '06:00 PM',
      entry_fee: spot.entry_fee || 'Free Entry',
      best_time_to_visit: spot.best_time_to_visit || 'Morning / Evening',
      estimated_duration: spot.estimated_duration || '1-2 hours',
      is_active: spot.is_active !== false
    });
    setModalOpen(true);
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      addToast('Attraction name is required', 'error');
      return;
    }

    try {
      if (editingSpot) {
        await api.updateTouristSpot(editingSpot.id, formData);
        addToast(`Updated "${formData.name}" successfully!`, 'success');
      } else {
        await api.createTouristSpot(formData);
        addToast(`Added "${formData.name}" successfully!`, 'success');
      }
      setModalOpen(false);
      fetchSpots();
    } catch (err) {
      addToast(err.message || 'Failed to save tourist spot', 'error');
    }
  };

  const handleToggleStatus = async (spot) => {
    try {
      const res = await api.toggleTouristSpotStatus(spot.id);
      addToast(`${spot.name} is now ${res.spot.is_active ? 'Active' : 'Disabled'}`, 'info');
      setSpots(prev => prev.map(s => s.id === spot.id ? { ...s, is_active: res.spot.is_active } : s));
    } catch (err) {
      addToast('Failed to toggle status', 'error');
    }
  };

  const handleDeleteSpot = async (id) => {
    try {
      await api.deleteTouristSpot(id);
      addToast('Tourist spot deleted successfully', 'success');
      setDeleteConfirmId(null);
      fetchSpots();
    } catch (err) {
      addToast('Failed to delete tourist spot', 'error');
    }
  };

  const citiesList = useMemo(() => {
    const list = Array.from(new Set(spots.map(s => s.city).filter(Boolean)));
    return ['All', ...list];
  }, [spots]);

  return (
    <div style={{ padding: '24px 30px 80px', maxWidth: 1400, margin: '0 auto' }}>
      
      {/* 1. Header & Quick Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{
              background: '#2563EB',
              color: 'white',
              padding: '3px 8px',
              borderRadius: 6,
              fontSize: '0.72rem',
              fontWeight: 800,
              textTransform: 'uppercase'
            }}>
              Tourism Hub
            </span>
            <span style={{ fontSize: '0.85rem', color: '#64748B' }}>
              Attractions & Destination Management
            </span>
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
            Tourist Spots Management
          </h1>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          style={{
            background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
            color: 'white',
            border: 'none',
            borderRadius: 10,
            padding: '10px 18px',
            fontWeight: 700,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)'
          }}
        >
          <Plus size={18} />
          <span>Add New Tourist Spot</span>
        </button>
      </div>

      {/* 2. Top Statistics Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16,
        marginBottom: 24
      }}>
        <div style={{ background: '#FFFFFF', padding: '16px 20px', borderRadius: 14, border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Compass size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>Total Tourist Spots</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A' }}>{stats.total_spots || spots.length}</div>
          </div>
        </div>

        <div style={{ background: '#FFFFFF', padding: '16px 20px', borderRadius: 14, border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>Active Spots</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#059669' }}>{stats.active_spots || spots.filter(s => s.is_active).length}</div>
          </div>
        </div>

        <div style={{ background: '#FFFFFF', padding: '16px 20px', borderRadius: 14, border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#F5F3FF', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Layers size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>Categories</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#7C3AED' }}>{stats.total_categories || categories.length}</div>
          </div>
        </div>

        <div style={{ background: '#FFFFFF', padding: '16px 20px', borderRadius: 14, border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Star size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>Top Rated (4.7+ ⭐)</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#D97706' }}>{stats.top_rated_spots || spots.filter(s => s.rating >= 4.7).length}</div>
          </div>
        </div>
      </div>

      {/* 3. Filter Bar & View Toggle */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: 14,
        padding: '16px 20px',
        border: '1px solid #E2E8F0',
        marginBottom: 20,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 14
      }}>
        {/* Left Filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, flex: 1 }}>
          <div style={{ position: 'relative', minWidth: 240, flex: '1 1 240px' }}>
            <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search by name, city, address..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                borderRadius: 8,
                border: '1px solid #CBD5E1',
                fontSize: '0.84rem',
                outline: 'none'
              }}
            />
          </div>

          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: '0.82rem', fontWeight: 600, outline: 'none' }}
          >
            <option value="All">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select
            value={selectedCity}
            onChange={e => setSelectedCity(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: '0.82rem', fontWeight: 600, outline: 'none' }}
          >
            {citiesList.map(c => <option key={c} value={c}>{c === 'All' ? 'All Cities' : c}</option>)}
          </select>

          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: '0.82rem', fontWeight: 600, outline: 'none' }}
          >
            <option value="All">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Disabled Only</option>
          </select>
        </div>

        {/* Right Tab Switcher */}
        <div style={{ display: 'flex', background: '#F1F5F9', padding: 3, borderRadius: 8 }}>
          <button
            type="button"
            onClick={() => setViewTab('table')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 6,
              border: 'none',
              background: viewTab === 'table' ? '#FFFFFF' : 'transparent',
              color: viewTab === 'table' ? '#0F172A' : '#64748B',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            <Table size={14} />
            <span>Table</span>
          </button>
          <button
            type="button"
            onClick={() => setViewTab('map')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 6,
              border: 'none',
              background: viewTab === 'map' ? '#FFFFFF' : 'transparent',
              color: viewTab === 'map' ? '#0F172A' : '#64748B',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            <MapIcon size={14} />
            <span>Map View</span>
          </button>
        </div>
      </div>

      {/* 4. Table View vs Map View */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', background: '#FFFFFF', borderRadius: 14, border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'inline-block', width: 32, height: 32, border: '3px solid #E2E8F0', borderTopColor: '#2563EB', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: 12, color: '#64748B', fontSize: '0.85rem' }}>Loading tourist spots...</p>
        </div>
      ) : viewTab === 'table' ? (
        <div style={{ background: '#FFFFFF', borderRadius: 14, border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: 700 }}>
                <th style={{ padding: '14px 16px' }}>Attraction</th>
                <th style={{ padding: '14px 16px' }}>Category</th>
                <th style={{ padding: '14px 16px' }}>City & Coordinates</th>
                <th style={{ padding: '14px 16px' }}>Rating</th>
                <th style={{ padding: '14px 16px' }}>Timings & Fee</th>
                <th style={{ padding: '14px 16px' }}>Status</th>
                <th style={{ padding: '14px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {spots.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px 20px', color: '#64748B' }}>
                    No tourist spots match the current filters.
                  </td>
                </tr>
              ) : (
                spots.map(spot => (
                  <tr key={spot.id} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s' }}>
                    {/* Attraction Image & Name */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <img
                          src={spot.image_url || 'https://images.unsplash.com/photo-1572445271230-a78b5944a659?w=100'}
                          alt={spot.name}
                          style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover' }}
                        />
                        <div>
                          <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.9rem' }}>
                            {spot.name}
                          </div>
                          <div style={{ color: '#64748B', fontSize: '0.75rem', maxWidth: 240, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {spot.address || spot.city}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        background: '#F1F5F9',
                        color: '#334155',
                        padding: '3px 8px',
                        borderRadius: 6,
                        fontWeight: 700,
                        fontSize: '0.75rem'
                      }}>
                        {spot.category}
                      </span>
                    </td>

                    {/* City & Coordinates */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 700, color: '#0F172A' }}>{spot.city || 'India'}</div>
                      <div style={{ color: '#64748B', fontSize: '0.74rem' }}>
                        {spot.latitude?.toFixed(4)}, {spot.longitude?.toFixed(4)}
                      </div>
                    </td>

                    {/* Rating */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 800, color: '#B45309' }}>
                        <Star size={13} fill="#F59E0B" color="#F59E0B" />
                        <span>{spot.rating}</span>
                        <span style={{ color: '#94A3B8', fontSize: '0.72rem', fontWeight: 500 }}>
                          ({spot.review_count || 100})
                        </span>
                      </div>
                    </td>

                    {/* Timings & Fee */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontSize: '0.78rem', color: '#0F172A', fontWeight: 600 }}>
                        {spot.opening_hours} - {spot.closing_hours}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#059669', fontWeight: 700 }}>
                        {spot.entry_fee}
                      </div>
                    </td>

                    {/* Status Toggle */}
                    <td style={{ padding: '12px 16px' }}>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(spot)}
                        style={{
                          background: spot.is_active ? '#ECFDF5' : '#FEF2F2',
                          color: spot.is_active ? '#065F46' : '#991B1B',
                          border: spot.is_active ? '1px solid #A7F3D0' : '1px solid #FECACA',
                          padding: '3px 9px',
                          borderRadius: 20,
                          fontSize: '0.74rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4
                        }}
                      >
                        {spot.is_active ? <Check size={11} /> : <X size={11} />}
                        <span>{spot.is_active ? 'Active' : 'Disabled'}</span>
                      </button>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 8 }}>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(spot)}
                          title="Edit Spot"
                          style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 6, padding: '6px 8px', cursor: 'pointer', color: '#334155' }}
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(spot.id)}
                          title="Delete Spot"
                          style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 6, padding: '6px 8px', cursor: 'pointer', color: '#DC2626' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* Map View */
        <div style={{ height: 600, borderRadius: 14, overflow: 'hidden', border: '1px solid #E2E8F0', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
          <MapContainer center={[17.3850, 78.4867]} zoom={6} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {spots.map(spot => (
              <Marker
                key={spot.id}
                position={[spot.latitude, spot.longitude]}
                icon={createAdminSpotPin(spot.category)}
              >
                <Popup>
                  <div style={{ padding: 4, maxWidth: 200 }}>
                    <img src={spot.image_url} alt={spot.name} style={{ width: '100%', height: 90, borderRadius: 6, objectFit: 'cover', marginBottom: 6 }} />
                    <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0F172A' }}>{spot.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: 6 }}>{spot.category} • {spot.city}</div>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(spot)}
                      style={{ width: '100%', padding: '5px', background: '#2563EB', color: 'white', border: 'none', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Edit Spot
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      )}

      {/* 5. Create / Edit Spot Modal */}
      {modalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(5px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16
          }}
          onClick={() => setModalOpen(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#FFFFFF',
              borderRadius: 20,
              maxWidth: 680,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px 28px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid #E2E8F0', paddingBottom: 14 }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                {editingSpot ? `Edit: ${editingSpot.name}` : 'Add New Tourist Spot'}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              
              {/* Row 1: Name & Category */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                    Attraction Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Charminar, Gateway of India"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Row 2: City & Address */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                    placeholder="e.g. Hyderabad, Mumbai"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                    Full Address / Locality
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Street, area, landmark"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              {/* Row 3: Latitude & Longitude */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                    Latitude (e.g. 17.3616) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formData.latitude}
                    onChange={e => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                    Longitude (e.g. 78.4747) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formData.longitude}
                    onChange={e => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              {/* Interactive Map Picker helper */}
              <div style={{ height: 160, borderRadius: 10, overflow: 'hidden', border: '1px solid #CBD5E1' }}>
                <MapContainer center={[formData.latitude || 17.3850, formData.longitude || 78.4867]} zoom={11} style={{ height: '100%', width: '100%' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <LocationPickerEvents onSelectCoords={(lat, lng) => setFormData(prev => ({ ...prev, latitude: parseFloat(lat.toFixed(5)), longitude: parseFloat(lng.toFixed(5)) }))} />
                  <Marker position={[formData.latitude, formData.longitude]} icon={createAdminSpotPin(formData.category)} />
                </MapContainer>
              </div>
              <span style={{ fontSize: '0.72rem', color: '#64748B', marginTop: -8 }}>
                💡 Tip: Click anywhere on the map to set coordinates automatically.
              </span>

              {/* Row 4: Image URL */}
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                  Photo Image URL
                </label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                />
              </div>

              {/* Row 5: Description */}
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                  Short Description & Highlights
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Historic significance, architectural style, what makes it special..."
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: '0.85rem', resize: 'vertical' }}
                />
              </div>

              {/* Row 6: Timings & Entry Fee */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                    Opening Hours
                  </label>
                  <input
                    type="text"
                    value={formData.opening_hours}
                    onChange={e => setFormData({ ...formData, opening_hours: e.target.value })}
                    placeholder="09:00 AM"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                    Closing Hours
                  </label>
                  <input
                    type="text"
                    value={formData.closing_hours}
                    onChange={e => setFormData({ ...formData, closing_hours: e.target.value })}
                    placeholder="06:00 PM"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                    Entry Fee
                  </label>
                  <input
                    type="text"
                    value={formData.entry_fee}
                    onChange={e => setFormData({ ...formData, entry_fee: e.target.value })}
                    placeholder="Free / ₹50"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
                  />
                </div>
              </div>

              {/* Row 7: Best Time & Duration */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                    Best Time to Visit
                  </label>
                  <input
                    type="text"
                    value={formData.best_time_to_visit}
                    onChange={e => setFormData({ ...formData, best_time_to_visit: e.target.value })}
                    placeholder="e.g. Sunset / Morning"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                    Estimated Duration
                  </label>
                  <input
                    type="text"
                    value={formData.estimated_duration}
                    onChange={e => setFormData({ ...formData, estimated_duration: e.target.value })}
                    placeholder="e.g. 1 - 2 hours"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
                  />
                </div>
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={{ flex: 1, padding: '11px', background: '#F1F5F9', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ flex: 2, padding: '11px', background: '#2563EB', color: 'white', border: 'none', borderRadius: 8, fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  {editingSpot ? 'Save Changes' : 'Create Attraction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(5px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16
          }}
          onClick={() => setDeleteConfirmId(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#FFFFFF',
              borderRadius: 16,
              maxWidth: 400,
              width: '100%',
              padding: '24px',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>⚠️</div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', margin: '0 0 8px' }}>
              Delete Tourist Spot?
            </h3>
            <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '0 0 20px' }}>
              This action cannot be undone and will permanently remove this spot from all recommendations.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                style={{ flex: 1, padding: '10px', background: '#F1F5F9', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteSpot(deleteConfirmId)}
                style={{ flex: 1, padding: '10px', background: '#DC2626', color: 'white', border: 'none', borderRadius: 8, fontWeight: 800, cursor: 'pointer' }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
