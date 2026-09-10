import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function HotelProperty() {
  const { user } = useAuth();
  const { hotels, updateHotelProperty, createHotelRoom, updateHotelRoom, deleteHotelRoom } = useApp();
  const { addToast } = useToast();
  
  const hotelId = (user?.hotelId || user?.id) ? (user.hotelId || user.id).toString() : '1';
  const hotel = hotels.find(h => h.id === hotelId);

  // Active sub-tab
  const [activeTab, setActiveTab] = useState('rooms'); // 'rooms' | 'profile' | 'photos' | 'policies'

  // Hotel Profile Form State
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [address, setAddress] = useState('');
  const [category, setCategory] = useState('Luxury');
  const [photos, setPhotos] = useState([]);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [showAddPhoto, setShowAddPhoto] = useState(false);
  const [isSavingProperty, setIsSavingProperty] = useState(false);

  // Room Modal State
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null); // null = new room, object = editing existing
  const [roomFormData, setRoomFormData] = useState({
    room_type: '',
    price_per_night: 3500,
    quantity: 5,
    max_guests: 2,
    bed_type: 'King Bed',
    room_size: '350 sq.ft',
    breakfast_included: 'Included',
    cancellation_policy: 'Free cancellation up to 24 hours before check-in',
    description: '',
    amenities: ['Free Wi-Fi', 'AC', 'TV'],
    images: []
  });
  const [newRoomImageUrl, setNewRoomImageUrl] = useState('');
  const [isSavingRoom, setIsSavingRoom] = useState(false);
  const [deletingRoomId, setDeletingRoomId] = useState(null);

  // Sync state when hotel loads or updates
  useEffect(() => {
    if (hotel) {
      setName(hotel.name || '');
      setLocation(hotel.location || '');
      setAddress(hotel.address || '');
      setCategory(hotel.category || 'Luxury');
      setPhotos(hotel.photos || []);
    }
  }, [hotel]);

  if (!hotel) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <h3 style={{ fontFamily: 'var(--font-sans)', color: 'var(--text)' }}>No property linked to this account</h3>
        <p style={{ color: 'var(--text-secondary)' }}>Please ensure you are logged in as a registered hotel manager.</p>
      </div>
    );
  }

  // Common preset photos for quick addition
  const PHOTO_PRESETS = [
    { label: 'Hotel Exterior', url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1000&q=80' },
    { label: 'Grand Lobby', url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1000&q=80' },
    { label: 'Infinity Pool', url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1000&q=80' },
    { label: 'Rooftop Dining', url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1000&q=80' },
    { label: 'Spa & Wellness', url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1000&q=80' },
    { label: 'Deluxe Suite', url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1000&q=80' }
  ];

  const COMMON_ROOM_AMENITIES = [
    'Free Wi-Fi', 'AC', 'Breakfast Included', 'Smart TV', 'Mini Bar',
    'Bathtub', 'Balcony View', 'Work Desk', 'Coffee Maker', 'In-room Safe',
    'Room Service', 'Sea View', 'Mountain View', 'King Bed', 'Soundproof'
  ];

  const ROOM_TYPE_PRESETS = [
    'Deluxe King Room', 'Executive Suite', 'Super Deluxe Room',
    'Presidential Suite', 'Premium Garden Villa', 'Standard Double Room',
    'Family Penthouse', 'Club Ocean View Suite'
  ];

  // --- Handlers: Hotel Profile ---
  const handleSaveProperty = async () => {
    if (!name.trim()) {
      addToast('Hotel name cannot be empty', 'error');
      return;
    }
    setIsSavingProperty(true);
    try {
      const success = await updateHotelProperty(hotel.id, {
        name,
        location,
        address,
        photos
      });
      if (success) {
        addToast('Property details saved successfully!', 'success');
      } else {
        addToast('Failed to save property changes', 'error');
      }
    } catch (err) {
      addToast(err.message || 'Error saving changes', 'error');
    } finally {
      setIsSavingProperty(false);
    }
  };

  const handleAddPhoto = (urlToAdd) => {
    const url = (urlToAdd || newPhotoUrl).trim();
    if (!url) return;
    if (photos.includes(url)) {
      addToast('This image is already in your gallery', 'info');
      return;
    }
    setPhotos(prev => [...prev, url]);
    setNewPhotoUrl('');
    setShowAddPhoto(false);
    addToast('Photo added to gallery. Click "Save Changes" to apply.', 'info');
  };

  const handleRemovePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSetPrimaryPhoto = (index) => {
    if (index === 0) return;
    setPhotos(prev => {
      const copy = [...prev];
      const selected = copy.splice(index, 1)[0];
      return [selected, ...copy];
    });
    addToast('Set as primary cover photo. Click "Save Changes" to persist.', 'info');
  };

  // --- Handlers: Room Management ---
  const handleOpenAddRoomModal = () => {
    setEditingRoom(null);
    setRoomFormData({
      room_type: '',
      price_per_night: 3500,
      quantity: 5,
      max_guests: 2,
      bed_type: 'King Bed',
      room_size: '350 sq.ft',
      breakfast_included: 'Included',
      cancellation_policy: 'Free cancellation up to 24 hours before check-in',
      description: 'Luxuriously appointed room featuring modern decor, plush bedding, and upscale guest amenities.',
      amenities: ['Free Wi-Fi', 'AC', 'Smart TV', 'In-room Safe'],
      images: [
        'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1000&q=80'
      ]
    });
    setNewRoomImageUrl('');
    setIsRoomModalOpen(true);
  };

  const handleOpenEditRoomModal = (room) => {
    setEditingRoom(room);
    
    // Normalize room images (might be string URLs or object {url, label})
    const rawImages = room.images || [];
    const normalizedImages = rawImages.map(img => (typeof img === 'string' ? img : img.url || ''));

    setRoomFormData({
      room_type: room.type || room.room_type || '',
      price_per_night: room.price || room.price_per_night || 3000,
      quantity: room.quantity || 5,
      max_guests: room.maxGuests || room.max_guests || 2,
      bed_type: room.bedType || room.bed_type || 'King Bed',
      room_size: room.roomSize || room.room_size || '350 sq.ft',
      breakfast_included: room.breakfast || room.breakfast_included || 'Included',
      cancellation_policy: room.cancellationPolicy || room.cancellation_policy || 'Free cancellation up to 24 hours before check-in',
      description: room.description || '',
      amenities: room.amenities || ['Free Wi-Fi', 'AC'],
      images: normalizedImages.length > 0 ? normalizedImages : ['https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1000&q=80']
    });
    setNewRoomImageUrl('');
    setIsRoomModalOpen(true);
  };

  const handleToggleRoomAmenity = (amenity) => {
    setRoomFormData(prev => {
      const exists = prev.amenities.includes(amenity);
      return {
        ...prev,
        amenities: exists 
          ? prev.amenities.filter(a => a !== amenity)
          : [...prev.amenities, amenity]
      };
    });
  };

  const handleAddRoomImage = (url) => {
    const targetUrl = (url || newRoomImageUrl).trim();
    if (!targetUrl) return;
    setRoomFormData(prev => ({
      ...prev,
      images: [...prev.images, targetUrl]
    }));
    setNewRoomImageUrl('');
  };

  const handleRemoveRoomImage = (index) => {
    setRoomFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSaveRoom = async (e) => {
    e?.preventDefault();
    if (!roomFormData.room_type.trim()) {
      addToast('Please enter a room category name', 'error');
      return;
    }
    if (!roomFormData.price_per_night || roomFormData.price_per_night <= 0) {
      addToast('Please enter a valid room price', 'error');
      return;
    }

    setIsSavingRoom(true);
    try {
      const payload = {
        room_type: roomFormData.room_type.trim(),
        price_per_night: parseInt(roomFormData.price_per_night),
        quantity: parseInt(roomFormData.quantity) || 1,
        max_guests: parseInt(roomFormData.max_guests) || 2,
        bed_type: roomFormData.bed_type,
        room_size: roomFormData.room_size,
        breakfast_included: roomFormData.breakfast_included,
        cancellation_policy: roomFormData.cancellation_policy,
        description: roomFormData.description,
        amenities: roomFormData.amenities,
        images: roomFormData.images
      };

      if (editingRoom && editingRoom.id && !editingRoom.id.toString().startsWith('room-')) {
        // Edit existing room in DB
        const success = await updateHotelRoom(editingRoom.id, payload);
        if (success) {
          addToast(`"${payload.room_type}" updated successfully!`, 'success');
          setIsRoomModalOpen(false);
        } else {
          addToast('Failed to update room details', 'error');
        }
      } else {
        // Create new room in DB
        const success = await createHotelRoom(hotel.id, payload);
        if (success) {
          addToast(`"${payload.room_type}" added to your property!`, 'success');
          setIsRoomModalOpen(false);
        } else {
          addToast('Failed to create new room', 'error');
        }
      }
    } catch (err) {
      addToast(err.message || 'Error saving room', 'error');
    } finally {
      setIsSavingRoom(false);
    }
  };

  const handleDeleteRoom = async (roomId, roomTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${roomTitle}"? This cannot be undone.`)) {
      return;
    }
    setDeletingRoomId(roomId);
    try {
      if (roomId && !roomId.toString().startsWith('room-')) {
        const success = await deleteHotelRoom(roomId);
        if (success) {
          addToast(`Room category "${roomTitle}" deleted`, 'success');
        } else {
          addToast('Failed to delete room', 'error');
        }
      } else {
        addToast('Default preset room removed from preview', 'info');
      }
    } catch (err) {
      addToast(err.message || 'Error deleting room', 'error');
    } finally {
      setDeletingRoomId(null);
    }
  };

  const roomsList = hotel.rooms || hotel.roomTypes || [];
  const totalUnits = roomsList.reduce((sum, r) => sum + (r.quantity || 5), 0);
  const minPrice = roomsList.length > 0 ? Math.min(...roomsList.map(r => r.price || r.price_per_night || 3000)) : 0;
  const maxPrice = roomsList.length > 0 ? Math.max(...roomsList.map(r => r.price || r.price_per_night || 3000)) : 0;

  return (
    <div className="fade-in" style={{ paddingBottom: 60 }}>
      {/* Top Banner Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
        color: '#FFFFFF',
        borderRadius: 16,
        padding: '28px 32px',
        marginBottom: 28,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 20,
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <span style={{
              background: '#10B981',
              color: '#FFFFFF',
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: 20,
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              ● {hotel.status || 'Active Listing'}
            </span>
            <span style={{ color: '#94A3B8', fontSize: '0.85rem' }}>Hotel ID: #{hotel.id}</span>
          </div>
          <h1 style={{ margin: '0 0 6px', fontSize: '1.8rem', fontWeight: 700, fontFamily: 'var(--font-sans)', color: '#FFFFFF' }}>
            {name || hotel.name}
          </h1>
          <p style={{ margin: 0, color: '#CBD5E1', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 6 }}>
            📍 {location || hotel.location} • {address || 'Address configured'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button 
            className="btn" 
            onClick={handleSaveProperty}
            disabled={isSavingProperty}
            style={{ 
              background: 'var(--primary, #6366F1)', 
              color: 'white', 
              fontWeight: 600, 
              padding: '12px 24px', 
              borderRadius: 8,
              border: 'none',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.35)',
              cursor: 'pointer'
            }}
          >
            {isSavingProperty ? 'Saving to Database...' : '💾 Save Property Details'}
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div style={{
        display: 'flex',
        gap: 8,
        borderBottom: '1px solid var(--border)',
        marginBottom: 28,
        paddingBottom: 2
      }}>
        <button
          onClick={() => setActiveTab('rooms')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'rooms' ? '3px solid var(--primary, #6366F1)' : '3px solid transparent',
            color: activeTab === 'rooms' ? 'var(--primary, #6366F1)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'rooms' ? 700 : 500,
            fontSize: '1rem',
            padding: '10px 18px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            transition: 'all 0.2s'
          }}
        >
          🛏️ Room Categories & Inventory ({roomsList.length})
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'profile' ? '3px solid var(--primary, #6366F1)' : '3px solid transparent',
            color: activeTab === 'profile' ? 'var(--primary, #6366F1)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'profile' ? 700 : 500,
            fontSize: '1rem',
            padding: '10px 18px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            transition: 'all 0.2s'
          }}
        >
          🏨 Basic Info & Location
        </button>

        <button
          onClick={() => setActiveTab('photos')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'photos' ? '3px solid var(--primary, #6366F1)' : '3px solid transparent',
            color: activeTab === 'photos' ? 'var(--primary, #6366F1)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'photos' ? 700 : 500,
            fontSize: '1rem',
            padding: '10px 18px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            transition: 'all 0.2s'
          }}
        >
          📸 Property Photos ({photos.length})
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ROOM CATEGORIES & INVENTORY                                         */}
      {/* ========================================================================= */}
      {activeTab === 'rooms' && (
        <div>
          {/* Quick Metrics Bar */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16,
            marginBottom: 24
          }}>
            <div className="card" style={{ padding: 18, borderRadius: 12 }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Room Categories</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text)', marginTop: 4 }}>{roomsList.length} Types</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Configured for bookings</div>
            </div>

            <div className="card" style={{ padding: 18, borderRadius: 12 }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Total Units Inventory</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#10B981', marginTop: 4 }}>{totalUnits} Rooms</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Live capacity</div>
            </div>

            <div className="card" style={{ padding: 18, borderRadius: 12 }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Nightly Rate Range</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--primary, #6366F1)', marginTop: 4 }}>
                ₹{minPrice.toLocaleString()} - ₹{maxPrice.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Per night pricing</div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center' }}>
              <button 
                onClick={handleOpenAddRoomModal}
                className="btn"
                style={{
                  width: '100%',
                  height: '100%',
                  minHeight: 64,
                  background: 'linear-gradient(135deg, var(--primary, #6366F1) 0%, #4F46E5 100%)',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  borderRadius: 12,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)'
                }}
              >
                <span style={{ fontSize: '1.3rem' }}>+</span> Add New Room Category
              </button>
            </div>
          </div>

          {/* Room Cards Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {roomsList.map((room, idx) => {
              const rTitle = room.type || room.room_type || `Room Type ${idx + 1}`;
              const rPrice = room.price || room.price_per_night || 3000;
              const rQty = room.quantity || 5;
              const rMaxGuests = room.maxGuests || room.max_guests || 2;
              const rBed = room.bedType || room.bed_type || 'King Bed';
              const rSize = room.roomSize || room.room_size || '350 sq.ft';
              const rBreakfast = room.breakfast || room.breakfast_included || 'Included';
              const rAmenities = room.amenities || [];
              const rawImgs = room.images || [];
              const firstImg = typeof rawImgs[0] === 'string' ? rawImgs[0] : rawImgs[0]?.url || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80';

              return (
                <div 
                  key={room.id || idx} 
                  className="card"
                  style={{
                    borderRadius: 14,
                    overflow: 'hidden',
                    border: '1px solid var(--border)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    display: 'flex',
                    flexDirection: 'row',
                    flexWrap: 'wrap'
                  }}
                >
                  {/* Room Image Preview */}
                  <div style={{
                    width: 260,
                    minHeight: 200,
                    position: 'relative',
                    background: '#0F172A',
                    flexShrink: 0
                  }}>
                    <img 
                      src={firstImg} 
                      alt={rTitle}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                    <div style={{
                      position: 'absolute',
                      top: 10,
                      left: 10,
                      background: 'rgba(0,0,0,0.65)',
                      color: 'white',
                      backdropFilter: 'blur(4px)',
                      padding: '4px 10px',
                      borderRadius: 20,
                      fontSize: '0.75rem',
                      fontWeight: 600
                    }}>
                      📷 {rawImgs.length || 1} {rawImgs.length === 1 ? 'Photo' : 'Photos'}
                    </div>

                    <div style={{
                      position: 'absolute',
                      bottom: 10,
                      left: 10,
                      background: '#10B981',
                      color: 'white',
                      padding: '3px 8px',
                      borderRadius: 4,
                      fontSize: '0.75rem',
                      fontWeight: 700
                    }}>
                      {rQty} Units in Inventory
                    </div>
                  </div>

                  {/* Room Details Info */}
                  <div style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 280 }}>
                    <div>
                      <div className="flex-between" style={{ alignItems: 'flex-start', marginBottom: 8 }}>
                        <div>
                          <h3 style={{ margin: '0 0 4px', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text)' }}>
                            {rTitle}
                          </h3>
                          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            {room.description || 'Modern accommodation featuring premium bedding and dedicated guest service.'}
                          </p>
                        </div>
                        <div style={{ textAlign: 'right', marginLeft: 16 }}>
                          <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary, #6366F1)' }}>
                            ₹{rPrice.toLocaleString()}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>per night / room</span>
                        </div>
                      </div>

                      {/* Badges / Specs */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '14px 0' }}>
                        <span style={{ padding: '4px 10px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)' }}>
                          👤 Max Guests: {rMaxGuests}
                        </span>
                        <span style={{ padding: '4px 10px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)' }}>
                          🛏️ {rBed}
                        </span>
                        <span style={{ padding: '4px 10px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)' }}>
                          📐 {rSize}
                        </span>
                        <span style={{ padding: '4px 10px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#059669', borderRadius: 6, fontSize: '0.8rem', fontWeight: 600 }}>
                          🍳 {rBreakfast}
                        </span>
                      </div>

                      {/* Amenities Pills */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                        {rAmenities.slice(0, 6).map((a, i) => (
                          <span key={i} style={{ fontSize: '0.75rem', padding: '2px 8px', background: 'var(--card-bg, #FFFFFF)', border: '1px solid var(--border-light, #E2E8F0)', borderRadius: 12, color: 'var(--text-secondary)' }}>
                            ✓ {a}
                          </span>
                        ))}
                        {rAmenities.length > 6 && (
                          <span style={{ fontSize: '0.75rem', padding: '2px 8px', color: 'var(--text-muted)' }}>
                            +{rAmenities.length - 6} more
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, borderTop: '1px solid var(--border-light)', paddingTop: 14 }}>
                      <button 
                        className="btn btn-outline btn-sm"
                        onClick={() => handleOpenEditRoomModal(room)}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, padding: '8px 16px' }}
                      >
                        ✏️ Edit Room Details & Rates
                      </button>
                      
                      <button 
                        className="btn btn-sm"
                        onClick={() => handleDeleteRoom(room.id, rTitle)}
                        disabled={deletingRoomId === room.id}
                        style={{ 
                          background: 'rgba(239, 68, 68, 0.1)', 
                          color: '#EF4444', 
                          border: '1px solid rgba(239, 68, 68, 0.2)',
                          fontWeight: 600,
                          padding: '8px 14px'
                        }}
                      >
                        {deletingRoomId === room.id ? 'Deleting...' : '🗑️ Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: BASIC INFO & LOCATION                                               */}
      {/* ========================================================================= */}
      {activeTab === 'profile' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div className="card">
            <div className="card-body">
              <h3 style={{ margin: '0 0 20px', fontSize: '1.2rem', fontWeight: 700, color: 'var(--text)' }}>
                Property Identification
              </h3>

              <div className="form-group" style={{ marginBottom: 18 }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Hotel / Resort Name</label>
                <input 
                  type="text"
                  className="form-input" 
                  value={name} 
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. The Grand Palace & Spa"
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>This name appears on customer search cards and lead offers.</span>
              </div>

              <div className="form-group" style={{ marginBottom: 18 }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Destination City / Region</label>
                <input 
                  type="text"
                  className="form-input" 
                  value={location} 
                  onChange={e => setLocation(e.target.value)}
                  placeholder="e.g. Goa, Jaipur, Mumbai, Hyderabad"
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Used by the AI matching engine to connect customer travel requests.</span>
              </div>

              <div className="form-group" style={{ marginBottom: 18 }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Complete Street Address</label>
                <textarea 
                  className="form-input" 
                  rows={3}
                  value={address} 
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Road name, landmark, district, PIN code"
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Hotel Category / Star Class</label>
                <select 
                  className="form-select" 
                  value={category} 
                  onChange={e => setCategory(e.target.value)}
                >
                  <option value="Luxury">Luxury 5-Star Hotel / Resort</option>
                  <option value="Premium">Premium 4-Star Boutique Hotel</option>
                  <option value="Heritage">Heritage Palace / Havelis</option>
                  <option value="Business">Business Executive Hotel</option>
                  <option value="Resort">Beach / Hill Station Resort</option>
                  <option value="Budget">Comfort / Budget Inn</option>
                </select>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div className="card">
              <div className="card-body">
                <h3 style={{ margin: '0 0 16px', fontSize: '1.2rem', fontWeight: 700, color: 'var(--text)' }}>
                  Core Property Amenities
                </h3>
                <p style={{ margin: '0 0 16px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Highlight amenities available across the whole property:
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {[
                    'Free High-Speed Wi-Fi', 'Swimming Pool', 'Spa & Wellness Center',
                    '24/7 Room Service', 'Valet Parking', 'Fitness Center / Gym',
                    'Fine Dining Restaurant', 'Airport Shuttle', 'Bar & Lounge',
                    'Business Center', 'Pet Friendly', 'Electric Vehicle Charging'
                  ].map(amenity => (
                    <div 
                      key={amenity}
                      style={{
                        padding: '8px 14px',
                        background: 'var(--bg)',
                        border: '1px solid var(--border)',
                        borderRadius: 8,
                        fontSize: '0.85rem',
                        fontWeight: 500,
                        color: 'var(--text)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <span style={{ color: '#10B981', fontWeight: 'bold' }}>✓</span> {amenity}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="card" style={{ background: 'rgba(99, 102, 241, 0.04)', borderColor: 'rgba(99, 102, 241, 0.2)' }}>
              <div className="card-body">
                <h4 style={{ margin: '0 0 8px', color: 'var(--primary, #6366F1)' }}>💡 Manager Tip</h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Keeping your destination city accurate guarantees your property receives real-time lead alerts whenever travelers request quotes matching your room prices.
                </p>
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={handleSaveProperty}
                  disabled={isSavingProperty}
                  style={{ marginTop: 16 }}
                >
                  {isSavingProperty ? 'Saving...' : 'Save All Details'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: PROPERTY PHOTO GALLERY                                              */}
      {/* ========================================================================= */}
      {activeTab === 'photos' && (
        <div>
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-body">
              <div className="flex-between" style={{ marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--text)' }}>
                    Property Image Gallery
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    High-definition photos dramatically improve quote acceptances and customer direct bookings.
                  </p>
                </div>
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={() => setShowAddPhoto(!showAddPhoto)}
                >
                  {showAddPhoto ? '✕ Close Form' : '+ Add Image URL'}
                </button>
              </div>

              {/* Add Photo Form */}
              {showAddPhoto && (
                <div style={{
                  padding: 20,
                  background: 'var(--bg)',
                  borderRadius: 12,
                  border: '1px solid var(--border)',
                  marginBottom: 24
                }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>Paste Image URL (HTTPS)</label>
                  <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                    <input 
                      type="text"
                      className="form-input"
                      placeholder="https://images.unsplash.com/photo-..."
                      value={newPhotoUrl}
                      onChange={e => setNewPhotoUrl(e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <button 
                      className="btn btn-primary"
                      onClick={() => handleAddPhoto()}
                    >
                      Add Photo
                    </button>
                  </div>

                  {/* Preset quick buttons */}
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>
                      Or choose from sample presets:
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {PHOTO_PRESETS.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={() => handleAddPhoto(preset.url)}
                          style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                        >
                          + {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Photos Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: 18
              }}>
                {photos.map((url, index) => (
                  <div 
                    key={index}
                    style={{
                      position: 'relative',
                      height: 180,
                      borderRadius: 12,
                      overflow: 'hidden',
                      border: index === 0 ? '3px solid var(--primary, #6366F1)' : '1px solid var(--border)',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.06)'
                    }}
                  >
                    <img 
                      src={url} 
                      alt={`Property ${index}`} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />

                    {index === 0 && (
                      <div style={{
                        position: 'absolute',
                        top: 8,
                        left: 8,
                        background: 'var(--primary, #6366F1)',
                        color: 'white',
                        padding: '3px 8px',
                        borderRadius: 4,
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        textTransform: 'uppercase'
                      }}>
                        ★ Cover Photo
                      </div>
                    )}

                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      padding: '8px 10px',
                      background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      {index !== 0 ? (
                        <button 
                          onClick={() => handleSetPrimaryPhoto(index)}
                          style={{
                            background: 'rgba(255,255,255,0.2)',
                            color: 'white',
                            border: 'none',
                            padding: '3px 8px',
                            borderRadius: 4,
                            fontSize: '0.7rem',
                            cursor: 'pointer'
                          }}
                        >
                          Set Cover
                        </button>
                      ) : <span />}

                      <button 
                        onClick={() => handleRemovePhoto(index)}
                        title="Delete photo"
                        style={{
                          background: 'rgba(239, 68, 68, 0.9)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: 26,
                          height: 26,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 'bold'
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT ROOM CATEGORY                                            */}
      {/* ========================================================================= */}
      {isRoomModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 20
        }}>
          <div style={{
            background: 'var(--card-bg, #FFFFFF)',
            color: 'var(--text, #1E293B)',
            width: '100%',
            maxWidth: 750,
            maxHeight: '90vh',
            overflowY: 'auto',
            borderRadius: 16,
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            padding: 28
          }}>
            {/* Modal Header */}
            <div className="flex-between" style={{ marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700 }}>
                  {editingRoom ? '✏️ Edit Room Category' : '➕ Add New Room Category'}
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Configure room pricing, capacity, inventory, and photo assets.
                </p>
              </div>
              <button 
                onClick={() => setIsRoomModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRoom}>
              {/* Room Name & Preset Suggestions */}
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Room Category Name *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={roomFormData.room_type}
                  onChange={e => setRoomFormData(prev => ({ ...prev, room_type: e.target.value }))}
                  placeholder="e.g. Deluxe Ocean View Suite"
                  required
                />
                {/* Preset Suggestions */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Quick Presets:</span>
                  {ROOM_TYPE_PRESETS.slice(0, 4).map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setRoomFormData(prev => ({ ...prev, room_type: preset }))}
                      style={{
                        background: 'var(--bg)',
                        border: '1px solid var(--border)',
                        borderRadius: 4,
                        fontSize: '0.7rem',
                        padding: '2px 8px',
                        cursor: 'pointer',
                        color: 'var(--text)'
                      }}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price & Quantity Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Base Price Per Night (₹) *</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={roomFormData.price_per_night}
                    onChange={e => setRoomFormData(prev => ({ ...prev, price_per_night: e.target.value }))}
                    placeholder="3500"
                    min="1"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Available Room Inventory (Count) *</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={roomFormData.quantity}
                    onChange={e => setRoomFormData(prev => ({ ...prev, quantity: e.target.value }))}
                    placeholder="5"
                    min="1"
                    required
                  />
                </div>
              </div>

              {/* Capacity & Specs Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 16 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Max Guests</label>
                  <select 
                    className="form-select"
                    value={roomFormData.max_guests}
                    onChange={e => setRoomFormData(prev => ({ ...prev, max_guests: e.target.value }))}
                  >
                    <option value={1}>1 Guest</option>
                    <option value={2}>2 Guests</option>
                    <option value={3}>3 Guests</option>
                    <option value={4}>4 Guests</option>
                    <option value={6}>6+ Family</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Bed Type</label>
                  <input 
                    type="text"
                    className="form-input"
                    value={roomFormData.bed_type}
                    onChange={e => setRoomFormData(prev => ({ ...prev, bed_type: e.target.value }))}
                    placeholder="King Bed / Twin Beds"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Room Size</label>
                  <input 
                    type="text"
                    className="form-input"
                    value={roomFormData.room_size}
                    onChange={e => setRoomFormData(prev => ({ ...prev, room_size: e.target.value }))}
                    placeholder="350 sq.ft"
                  />
                </div>
              </div>

              {/* Breakfast & Cancellation */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Breakfast Included</label>
                  <select 
                    className="form-select"
                    value={roomFormData.breakfast_included}
                    onChange={e => setRoomFormData(prev => ({ ...prev, breakfast_included: e.target.value }))}
                  >
                    <option value="Included">Breakfast Included (Free)</option>
                    <option value="Buffet Breakfast Included">Buffet Breakfast Included</option>
                    <option value="Available at extra charge">Available for purchase</option>
                    <option value="Room Only">Room Only (No Breakfast)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Cancellation Policy</label>
                  <input 
                    type="text" 
                    className="form-input"
                    value={roomFormData.cancellation_policy}
                    onChange={e => setRoomFormData(prev => ({ ...prev, cancellation_policy: e.target.value }))}
                    placeholder="Free cancellation up to 24 hours before check-in"
                  />
                </div>
              </div>

              {/* Room Description */}
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Room Highlights & Description</label>
                <textarea 
                  className="form-input"
                  rows={2}
                  value={roomFormData.description}
                  onChange={e => setRoomFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe view, ambiance, bedding, bathroom features..."
                />
              </div>

              {/* Room Amenities Multi-Select */}
              <div className="form-group" style={{ marginBottom: 18 }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Room Amenities (Click to toggle)</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, maxHeight: 120, overflowY: 'auto', padding: 8, background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  {COMMON_ROOM_AMENITIES.map(amenity => {
                    const isSelected = roomFormData.amenities.includes(amenity);
                    return (
                      <button
                        key={amenity}
                        type="button"
                        onClick={() => handleToggleRoomAmenity(amenity)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: 20,
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          border: isSelected ? '1px solid var(--primary, #6366F1)' : '1px solid var(--border)',
                          background: isSelected ? 'var(--primary, #6366F1)' : 'var(--card-bg, #FFFFFF)',
                          color: isSelected ? '#FFFFFF' : 'var(--text)',
                          cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                      >
                        {isSelected ? '✓ ' : '+ '} {amenity}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Room Images */}
              <div className="form-group" style={{ marginBottom: 24 }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Room Photos (URLs)</label>
                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  <input 
                    type="text"
                    className="form-input"
                    placeholder="Paste room image URL (https://...)"
                    value={newRoomImageUrl}
                    onChange={e => setNewRoomImageUrl(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button 
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => handleAddRoomImage()}
                  >
                    Add Image
                  </button>
                </div>

                {/* Thumbnails list */}
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {roomFormData.images.map((imgUrl, i) => (
                    <div key={i} style={{ position: 'relative', width: 90, height: 60, borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border)' }}>
                      <img src={imgUrl} alt={`Room ${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button 
                        type="button"
                        onClick={() => handleRemoveRoomImage(i)}
                        style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(239, 68, 68, 0.9)', color: 'white', border: 'none', borderRadius: '50%', width: 18, height: 18, fontSize: '0.65rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, borderTop: '1px solid var(--border)', paddingTop: 18 }}>
                <button 
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setIsRoomModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSavingRoom}
                  style={{ minWidth: 140 }}
                >
                  {isSavingRoom ? 'Saving...' : (editingRoom ? 'Save Room Changes' : 'Create Room Category')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
