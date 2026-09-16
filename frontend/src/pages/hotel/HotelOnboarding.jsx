import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import HotelLogo from '../../components/HotelLogo';
import {
  Building2,
  MapPin,
  Sparkles,
  BedDouble,
  Image as ImageIcon,
  ShieldCheck,
  FileCheck2,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  Copy,
  Edit3,
  UploadCloud,
  Eye,
  AlertCircle,
  HelpCircle,
  Clock,
  CreditCard,
  Wifi,
  Car,
  Utensils,
  Coffee,
  Waves,
  Dumbbell,
  Tv,
  AirVent,
  Save,
  Check,
  X,
  Compass,
  ArrowRight,
  FileText
} from 'lucide-react';

const PROPERTY_TYPES = [
  { id: 'Hotel', label: 'Hotel', desc: 'Standard full-service hotel', icon: Building2 },
  { id: 'Resort', label: 'Resort', desc: 'Vacation property with leisure amenities', icon: Waves },
  { id: 'Boutique Hotel', label: 'Boutique Hotel', desc: 'Unique themed & stylish stay', icon: Sparkles },
  { id: 'Villa', label: 'Villa', desc: 'Private luxury residence or cottage', icon: Building2 },
  { id: 'Guest House', label: 'Guest House', desc: 'Cozy bed & breakfast or homestay', icon: BedDouble }
];

const STAR_RATINGS = ['1 Star', '2 Stars', '3 Stars', '4 Stars', '5 Stars', 'Luxury / Heritage'];

const DEFAULT_AMENITIES = [
  'Free Wi-Fi', 'Free Parking', 'Swimming Pool', 'Restaurant', 'Room Service',
  'Fitness Gym', 'Luxury Spa', 'Conference Room', 'Airport Shuttle', 'Laundry Service',
  '24/7 Front Desk', 'Bar & Lounge', 'Complimentary Breakfast', 'CCTV Security',
  'High-Speed Elevator', 'Wheelchair Accessible', 'Beach Access', 'Power Backup',
  'Valet Parking', 'Kids Play Area'
];

const ROOM_AMENITY_OPTIONS = [
  'Free Wi-Fi', 'Air Conditioning', '55" 4K Smart TV', 'Mini Bar', 'Refrigerator',
  'Electronic Safe', 'Private Balcony', '24/7 Room Service', 'Breakfast Included',
  'Work Desk & Chair', 'Hair Dryer', 'Luxury Toiletries', 'Bathtub', 'Rain Shower',
  'Tea/Coffee Maker', 'Iron & Ironing Board', 'Soundproofing', 'City/Sea View'
];

const PHOTO_CATEGORIES = [
  'Hotel Exterior',
  'Reception & Front Desk',
  'Grand Lobby',
  'Restaurant & Dining',
  'Swimming Pool',
  'Spa & Wellness',
  'Facilities & Grounds',
  'Other Views'
];

const SAMPLE_PHOTO_PRESETS = [
  { url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1200&auto=format&fit=crop', category: 'Hotel Exterior', isCover: true, name: 'Main Property View' },
  { url: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=1200&auto=format&fit=crop', category: 'Grand Lobby', isCover: false, name: 'Lobby Lounge' },
  { url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=1200&auto=format&fit=crop', category: 'Swimming Pool', isCover: false, name: 'Infinity Pool' },
  { url: 'https://images.unsplash.com/photo-1544077960-604201fe74bc?q=80&w=1200&auto=format&fit=crop', category: 'Restaurant & Dining', isCover: false, name: 'Multi-Cuisine Restaurant' }
];

const SAMPLE_ROOM_IMAGES = [
  'https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=1000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=1000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1591088398332-8a7791972843?q=80&w=1000&auto=format&fit=crop'
];

const POPULAR_CITIES = [
  { name: 'Goa', state: 'Goa', lat: 15.2993, lng: 74.1240 },
  { name: 'Mumbai', state: 'Maharashtra', lat: 19.0760, lng: 72.8777 },
  { name: 'Bengaluru', state: 'Karnataka', lat: 12.9716, lng: 77.5946 },
  { name: 'New Delhi', state: 'Delhi', lat: 28.6139, lng: 77.2090 },
  { name: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lng: 75.7873 },
  { name: 'Udaipur', state: 'Rajasthan', lat: 24.5854, lng: 73.7125 },
  { name: 'Kochi', state: 'Kerala', lat: 9.9312, lng: 76.2673 },
  { name: 'Shimla', state: 'Himachal Pradesh', lat: 31.1048, lng: 77.1734 }
];

export default function HotelOnboarding() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login } = useAuth();
  const { addToast } = useToast();
  const { addNotification } = useApp();

  // Retrieve draft or partner signup data from session/localStorage
  const getInitialPartnerData = () => {
    let savedDraft = {};
    try {
      const raw = localStorage.getItem('hotel_onboarding_draft');
      if (raw) savedDraft = JSON.parse(raw) || {};
    } catch (e) {}

    const sessionUser = user || JSON.parse(sessionStorage.getItem('hotel_partner_signup') || '{}');
    const defaults = {
      manager_name: sessionUser.name || sessionUser.full_name || '',
      manager_phone: sessionUser.phone || '',
      email: sessionUser.email || '',
      password: sessionUser.password || 'secure123',
      name: '',
      description: '',
      property_type: 'Hotel',
      star_rating: '4 Stars',
      total_rooms: 15,
      address: '',
      city: 'Goa',
      state: 'Goa',
      country: 'India',
      pincode: '403516',
      contact_number: sessionUser.phone || '9876543210',
      website: '',
      latitude: 15.2993,
      longitude: 74.1240,
      amenities: ['Free Wi-Fi', 'Free Parking', 'Swimming Pool', 'Restaurant', 'Room Service', '24/7 Front Desk', 'Complimentary Breakfast'],
      rooms: [
        {
          id: 1,
          room_type: 'Deluxe King Room',
          quantity: 10,
          price_per_night: 3500,
          description: 'Spacious air-conditioned room with king-size bed and scenic balcony view.',
          max_guests: 2,
          max_adults: 2,
          max_children: 1,
          bed_type: 'King Bed',
          room_size: '350 sq.ft',
          bathroom_type: 'Private Ensuite',
          breakfast_included: 'Included',
          cancellation_policy: 'Free cancellation up to 24 hours before check-in',
          amenities: ['Free Wi-Fi', 'Air Conditioning', '55" 4K Smart TV', 'Private Balcony', 'Breakfast Included', 'Luxury Toiletries'],
          images: [SAMPLE_ROOM_IMAGES[0], SAMPLE_ROOM_IMAGES[1]]
        },
        {
          id: 2,
          room_type: 'Executive Suite',
          quantity: 5,
          price_per_night: 6500,
          description: 'Luxury suite with separate living area, king bed, jacuzzi bath and ocean view.',
          max_guests: 3,
          max_adults: 2,
          max_children: 2,
          bed_type: 'King Bed',
          room_size: '580 sq.ft',
          bathroom_type: 'Bathtub & Rain Shower',
          breakfast_included: 'Included',
          cancellation_policy: 'Free cancellation up to 24 hours before check-in',
          amenities: ['Free Wi-Fi', 'Air Conditioning', '55" 4K Smart TV', 'Mini Bar', 'Private Balcony', 'Breakfast Included', 'Bathtub'],
          images: [SAMPLE_ROOM_IMAGES[2]]
        }
      ],
      photos: SAMPLE_PHOTO_PRESETS,
      policies: {
        check_in_time: '14:00',
        check_out_time: '11:00',
        cancellation_policy: 'Free cancellation up to 24 hours before check-in',
        child_policy: 'Children under 6 stay free when using existing bedding',
        pet_policy: 'Pets Allowed on Request',
        extra_bed_available: true,
        extra_bed_charge: 1000,
        breakfast_option: 'Included in room rates',
        early_checkin: 'Subject to room availability',
        late_checkout: 'Available until 14:00 on request',
        payment_methods: ['UPI / QR', 'Credit & Debit Cards', 'Net Banking', 'Cash at Property'],
        house_rules: 'Government-issued photo ID required at check-in. Quiet hours from 22:00 to 07:00.'
      },
      documents: [
        { id: 'doc_1', type: 'Business Registration Proof', name: 'trade_license_2026.pdf', status: 'Uploaded', required: true, uploadedAt: '2026-09-16' },
        { id: 'doc_2', type: 'Property / Address Proof', name: 'electricity_bill_property.pdf', status: 'Uploaded', required: true, uploadedAt: '2026-09-16' },
        { id: 'doc_3', type: 'Owner / Authorized ID', name: 'manager_aadhaar_pan.pdf', status: 'Uploaded', required: true, uploadedAt: '2026-09-16' },
        { id: 'doc_4', type: 'GST Certificate (Optional)', name: '', status: 'Pending', required: false, uploadedAt: '' }
      ]
    };

    return {
      ...defaults,
      ...savedDraft,
      rooms: (Array.isArray(savedDraft.rooms) && savedDraft.rooms.length > 0) ? savedDraft.rooms : defaults.rooms,
      photos: (Array.isArray(savedDraft.photos) && savedDraft.photos.length > 0) ? savedDraft.photos : defaults.photos,
      amenities: (Array.isArray(savedDraft.amenities) && savedDraft.amenities.length > 0) ? savedDraft.amenities : defaults.amenities,
      policies: { ...defaults.policies, ...(savedDraft.policies || {}) },
      documents: (Array.isArray(savedDraft.documents) && savedDraft.documents.length > 0) ? savedDraft.documents : defaults.documents
    };
  };

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(getInitialPartnerData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [customAmenityInput, setCustomAmenityInput] = useState('');

  // Room Creator/Editor Modal state
  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [editingRoomIndex, setEditingRoomIndex] = useState(null);
  const [roomFormData, setRoomFormData] = useState({
    room_type: '',
    quantity: 5,
    price_per_night: 3000,
    description: '',
    max_guests: 2,
    max_adults: 2,
    max_children: 1,
    bed_type: 'King Bed',
    room_size: '350 sq.ft',
    bathroom_type: 'Private Ensuite',
    breakfast_included: 'Included',
    cancellation_policy: 'Free cancellation up to 24 hours before check-in',
    amenities: ['Free Wi-Fi', 'Air Conditioning', '55" 4K Smart TV'],
    images: [SAMPLE_ROOM_IMAGES[0]]
  });

  // Photo Uploader state
  const [selectedPhotoCategory, setSelectedPhotoCategory] = useState('Hotel Exterior');
  const [photoUrlInput, setPhotoUrlInput] = useState('');

  // Auto-save form data to localStorage
  useEffect(() => {
    localStorage.setItem('hotel_onboarding_draft', JSON.stringify(formData));
  }, [formData]);

  // Step names & metadata
  const STEPS = [
    { num: 1, title: 'Property Info', short: 'Basic Info', icon: Building2 },
    { num: 2, title: 'Location & Map', short: 'Location', icon: MapPin },
    { num: 3, title: 'Hotel Facilities', short: 'Facilities', icon: Sparkles },
    { num: 4, title: 'Room Inventory', short: 'Rooms', icon: BedDouble },
    { num: 5, title: 'Property Photos', short: 'Photos', icon: ImageIcon },
    { num: 6, title: 'Hotel Policies', short: 'Policies', icon: Clock },
    { num: 7, title: 'Verification Docs', short: 'Documents', icon: ShieldCheck },
    { num: 8, title: 'Review & Submit', short: 'Review', icon: FileCheck2 }
  ];

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateNestedPolicy = (field, value) => {
    setFormData(prev => ({
      ...prev,
      policies: { ...prev.policies, [field]: value }
    }));
  };

  // -------------------------------------------------------------
  // Step 3 Facilities Helpers
  // -------------------------------------------------------------
  const toggleAmenity = (amenity) => {
    const current = formData.amenities || [];
    if (current.includes(amenity)) {
      updateField('amenities', current.filter(a => a !== amenity));
    } else {
      updateField('amenities', [...current, amenity]);
    }
  };

  const handleAddCustomAmenity = (e) => {
    e?.preventDefault();
    const clean = customAmenityInput.trim();
    if (!clean) return;
    if (!(formData.amenities || []).includes(clean)) {
      updateField('amenities', [...(formData.amenities || []), clean]);
      addToast(`Added facility: ${clean}`, 'success');
    }
    setCustomAmenityInput('');
  };

  // -------------------------------------------------------------
  // Step 4 Room Inventory Helpers
  // -------------------------------------------------------------
  const handleOpenAddRoom = () => {
    setEditingRoomIndex(null);
    setRoomFormData({
      room_type: '',
      quantity: 5,
      price_per_night: 3000,
      description: '',
      max_guests: 2,
      max_adults: 2,
      max_children: 1,
      bed_type: 'King Bed',
      room_size: '350 sq.ft',
      bathroom_type: 'Private Ensuite',
      breakfast_included: 'Included',
      cancellation_policy: 'Free cancellation up to 24 hours before check-in',
      amenities: ['Free Wi-Fi', 'Air Conditioning', '55" 4K Smart TV'],
      images: [SAMPLE_ROOM_IMAGES[Math.floor(Math.random() * SAMPLE_ROOM_IMAGES.length)]]
    });
    setRoomModalOpen(true);
  };

  const handleEditRoom = (index) => {
    setEditingRoomIndex(index);
    setRoomFormData({ ...formData.rooms[index] });
    setRoomModalOpen(true);
  };

  const handleDuplicateRoom = (index) => {
    const target = formData.rooms[index];
    const duplicate = {
      ...target,
      id: Date.now(),
      room_type: `${target.room_type} (Copy)`
    };
    updateField('rooms', [...formData.rooms, duplicate]);
    addToast(`Duplicated "${target.room_type}"`, 'info');
  };

  const handleDeleteRoom = (index) => {
    if (formData.rooms.length <= 1) {
      addToast('A hotel must have at least 1 room category.', 'warning');
      return;
    }
    const updated = formData.rooms.filter((_, i) => i !== index);
    updateField('rooms', updated);
    addToast('Room category removed.', 'info');
  };

  const handleSaveRoomModal = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!roomFormData.room_type || !roomFormData.room_type.trim()) {
      addToast('Please enter a room category name.', 'warning');
      return;
    }
    if (!roomFormData.price_per_night || Number(roomFormData.price_per_night) <= 0) {
      addToast('Please enter a valid price per night.', 'warning');
      return;
    }

    const currentRooms = Array.isArray(formData.rooms) ? [...formData.rooms] : [];
    if (editingRoomIndex !== null && currentRooms[editingRoomIndex]) {
      currentRooms[editingRoomIndex] = { 
        ...roomFormData, 
        id: currentRooms[editingRoomIndex].id || Date.now(),
        room_type: roomFormData.room_type.trim(),
        price_per_night: Number(roomFormData.price_per_night),
        quantity: Number(roomFormData.quantity) || 1
      };
      addToast('Room updated successfully!', 'success');
    } else {
      currentRooms.push({ 
        ...roomFormData, 
        id: Date.now(),
        room_type: roomFormData.room_type.trim(),
        price_per_night: Number(roomFormData.price_per_night),
        quantity: Number(roomFormData.quantity) || 1
      });
      addToast('New room category added!', 'success');
    }
    updateField('rooms', currentRooms);
    setEditingRoomIndex(null);
    setRoomModalOpen(false);
  };

  const toggleRoomAmenity = (amenity) => {
    const current = roomFormData.amenities || [];
    if (current.includes(amenity)) {
      setRoomFormData(prev => ({ ...prev, amenities: current.filter(a => a !== amenity) }));
    } else {
      setRoomFormData(prev => ({ ...prev, amenities: [...current, amenity] }));
    }
  };

  // -------------------------------------------------------------
  // Step 5 Photos Helpers
  // -------------------------------------------------------------
  const handleAddPhoto = () => {
    const url = photoUrlInput.trim() || `https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=1200&auto=format&fit=crop`;
    const newPhoto = {
      url,
      category: selectedPhotoCategory,
      isCover: (formData.photos || []).length === 0,
      name: `${selectedPhotoCategory} Photo`
    };
    updateField('photos', [...(formData.photos || []), newPhoto]);
    setPhotoUrlInput('');
    addToast('Photo added to gallery!', 'success');
  };

  const handleDeletePhoto = (index) => {
    const updated = formData.photos.filter((_, i) => i !== index);
    if (updated.length > 0 && !updated.some(p => p.isCover)) {
      updated[0].isCover = true;
    }
    updateField('photos', updated);
    addToast('Photo removed.', 'info');
  };

  const handleSetCoverPhoto = (index) => {
    const updated = formData.photos.map((p, i) => ({
      ...p,
      isCover: i === index
    }));
    updateField('photos', updated);
    addToast('Cover photo updated!', 'success');
  };

  // -------------------------------------------------------------
  // Step 7 Verification Documents Helpers
  // -------------------------------------------------------------
  const handleToggleDocUpload = (docId) => {
    const updated = formData.documents.map(d => {
      if (d.id === docId) {
        const isUploaded = d.status === 'Uploaded';
        return {
          ...d,
          status: isUploaded ? 'Pending' : 'Uploaded',
          name: isUploaded ? '' : `${d.type.toLowerCase().replace(/[^a-z0-9]/g, '_')}_verified.pdf`,
          uploadedAt: isUploaded ? '' : new Date().toISOString().split('T')[0]
        };
      }
      return d;
    });
    updateField('documents', updated);
    addToast('Document status updated.', 'info');
  };

  // -------------------------------------------------------------
  // Step Validation & Navigation
  // -------------------------------------------------------------
  const validateCurrentStep = () => {
    if (currentStep === 1) {
      if (!formData.name?.trim()) {
        addToast('Please enter your Hotel Name.', 'warning');
        return false;
      }
      if (!formData.description?.trim() || formData.description.length < 20) {
        addToast('Please provide a descriptive overview (at least 20 characters).', 'warning');
        return false;
      }
    } else if (currentStep === 2) {
      if (!formData.address?.trim() || !formData.city?.trim() || !formData.pincode?.trim()) {
        addToast('Please fill in complete address, city, and pincode.', 'warning');
        return false;
      }
      if (!formData.contact_number?.trim()) {
        addToast('Please provide a contact phone number.', 'warning');
        return false;
      }
    } else if (currentStep === 3) {
      if (!formData.amenities || formData.amenities.length < 2) {
        addToast('Please select at least 2 hotel facilities.', 'warning');
        return false;
      }
    } else if (currentStep === 4) {
      if (!formData.rooms || formData.rooms.length === 0) {
        addToast('Please add at least 1 room category.', 'warning');
        return false;
      }
    } else if (currentStep === 5) {
      if (!formData.photos || formData.photos.length === 0) {
        addToast('Please upload at least 1 hotel photo.', 'warning');
        return false;
      }
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateCurrentStep()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setCurrentStep(prev => Math.min(prev + 1, 8));
    }
  };

  const handlePrevStep = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // -------------------------------------------------------------
  // Save as Draft & Submit Handlers
  // -------------------------------------------------------------
  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    try {
      localStorage.setItem('hotel_onboarding_draft', JSON.stringify(formData));
      
      // Optionally submit to backend as DRAFT status if hotel email exists
      if (formData.email && formData.name) {
        await api.registerHotel({
          ...formData,
          status: 'DRAFT'
        });
      }
      addToast('Draft saved successfully! You can resume anytime.', 'success');
    } catch (e) {
      addToast('Draft saved to local workspace.', 'info');
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleSubmitForApproval = async () => {
    setIsSubmitting(true);
    try {
      // 1. Submit hotel registration with PENDING status
      const response = await api.registerHotel({
        name: formData.name.trim(),
        location: `${formData.city.trim()}, ${formData.state.trim()}`,
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        country: formData.country || 'India',
        pincode: formData.pincode.trim(),
        contact_number: formData.contact_number.trim(),
        website: formData.website?.trim() || '',
        description: formData.description.trim(),
        property_type: formData.property_type,
        star_rating: formData.star_rating,
        total_rooms: Number(formData.total_rooms) || 10,
        latitude: Number(formData.latitude) || 15.2993,
        longitude: Number(formData.longitude) || 74.1240,
        email: formData.email.trim().toLowerCase(),
        password: formData.password || 'password123',
        manager_name: formData.manager_name || 'Hotel Manager',
        manager_phone: formData.manager_phone || formData.contact_number,
        amenities: formData.amenities,
        policies: formData.policies,
        documents: formData.documents,
        photos: formData.photos,
        rooms: formData.rooms.map(r => ({
          room_type: r.room_type,
          quantity: Number(r.quantity),
          price_per_night: Number(r.price_per_night),
          description: r.description,
          max_guests: Number(r.max_guests),
          max_adults: Number(r.max_adults || 2),
          max_children: Number(r.max_children || 1),
          bed_type: r.bed_type,
          room_size: r.room_size,
          bathroom_type: r.bathroom_type,
          amenities: r.amenities,
          breakfast_included: r.breakfast_included,
          cancellation_policy: r.cancellation_policy,
          images: r.images
        })),
        status: 'PENDING'
      });

      // Clear draft
      localStorage.removeItem('hotel_onboarding_draft');

      // Update auth context
      login(formData.email, formData.password, 'hotel', {
        id: response.id,
        name: response.name,
        email: response.email,
        role: 'hotel',
        hotelId: response.id.toString(),
        status: 'PENDING'
      });

      // Dispatch admin notification
      if (addNotification) {
        addNotification({
          role: 'admin',
          type: 'hotel_registration',
          title: '🏨 New Hotel Registration Pending Approval',
          message: `${formData.name || 'New Property'} (${formData.city || 'India'}) has submitted onboarding with ${formData.rooms?.length || 0} room categories and documents. Review and verify now.`,
          hotelId: response.id,
          hotelName: response.name,
          createdAt: new Date().toISOString(),
          link: '/admin/hotels'
        });
      }

      addToast('Hotel submitted for approval successfully!', 'success');
      setShowSubmitModal(false);
      navigate('/hotel/status', { state: { hotelId: response.id, status: 'PENDING', hotelName: response.name } });
    } catch (err) {
      addToast(err.message || 'Failed to submit onboarding. Please review details.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const progressPercentage = Math.round((currentStep / 8) * 100);

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', paddingBottom: 80, fontFamily: 'var(--font-sans)' }}>
      {/* Top Sticky Header */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
        boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
      }}>
        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {/* Logo & Portal Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <HotelLogo size="default" />
            <div style={{
              background: '#FFF7ED',
              color: '#EA580C',
              padding: '4px 10px',
              borderRadius: 20,
              fontSize: '0.75rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 5
            }}>
              <Building2 size={13} />
              <span>Partner Onboarding</span>
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isSavingDraft}
              style={{
                background: '#F1F5F9',
                border: 'none',
                color: '#475569',
                padding: '8px 14px',
                borderRadius: 8,
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <Save size={15} />
              <span>{isSavingDraft ? 'Saving...' : 'Save Draft'}</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/hotel_login')}
              style={{
                background: 'none',
                border: 'none',
                color: '#94A3B8',
                fontSize: '0.82rem',
                cursor: 'pointer'
              }}
            >
              Exit
            </button>
          </div>
        </div>

        {/* Progress Stepper Bar */}
        <div style={{ background: '#FFFFFF', borderTop: '1px solid #F1F5F9' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '10px 20px 14px' }}>
            {/* Desktop Step Pills */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 4,
              overflowX: 'auto',
              paddingBottom: 4
            }}>
              {STEPS.map(s => {
                const Icon = s.icon;
                const isPassed = s.num < currentStep;
                const isCurrent = s.num === currentStep;

                return (
                  <button
                    key={s.num}
                    type="button"
                    onClick={() => s.num < currentStep && setCurrentStep(s.num)}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '6px 8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      cursor: s.num <= currentStep ? 'pointer' : 'default',
                      opacity: s.num > currentStep ? 0.45 : 1,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <div style={{
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      background: isPassed ? '#16A34A' : isCurrent ? '#EA580C' : '#E2E8F0',
                      color: isPassed || isCurrent ? '#FFF' : '#64748B',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {isPassed ? <Check size={14} /> : s.num}
                    </div>
                    <span style={{
                      fontSize: '0.8rem',
                      fontWeight: isCurrent ? 700 : 500,
                      color: isCurrent ? '#0F172A' : '#64748B'
                    }}>
                      {s.short}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Visual Progress Bar */}
            <div style={{ width: '100%', height: 4, background: '#E2E8F0', borderRadius: 4, marginTop: 6, overflow: 'hidden' }}>
              <div style={{
                width: `${progressPercentage}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #EA580C 0%, #F97316 100%)',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Wizard Container */}
      <main style={{ maxWidth: 860, margin: '28px auto 0', padding: '0 16px' }}>
        <div style={{
          background: '#FFFFFF',
          borderRadius: 16,
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
          overflow: 'hidden'
        }}>
          {/* Step Banner */}
          <div style={{
            padding: '24px 28px',
            borderBottom: '1px solid #F1F5F9',
            background: 'linear-gradient(180deg, #FAFAFA 0%, #FFFFFF 100%)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <span style={{
                background: '#EA580C',
                color: '#FFF',
                fontSize: '0.72rem',
                fontWeight: 800,
                padding: '3px 8px',
                borderRadius: 6
              }}>
                STEP {currentStep} OF 8
              </span>
              <span style={{ fontSize: '0.82rem', color: '#64748B' }}>{progressPercentage}% Completed</span>
            </div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0F172A', margin: '4px 0 2px' }}>
              {STEPS[currentStep - 1].title}
            </h1>
            <p style={{ fontSize: '0.86rem', color: '#64748B', margin: 0 }}>
              {currentStep === 1 && 'Tell travelers about your hotel name, category, and experience.'}
              {currentStep === 2 && 'Set your property address, contact phone, and map location.'}
              {currentStep === 3 && 'Select all hotel amenities and facilities available to your guests.'}
              {currentStep === 4 && 'Add your room types, pricing, capacity, and bed arrangements.'}
              {currentStep === 5 && 'Upload high-resolution property exterior, lobby, and facility photos.'}
              {currentStep === 6 && 'Specify check-in/out hours, cancellation rules, and payment options.'}
              {currentStep === 7 && 'Upload required business registration and property verification proofs.'}
              {currentStep === 8 && 'Review your hotel marketplace listing before submitting for admin approval.'}
            </p>
          </div>

          {/* Wizard Content Body */}
          <div style={{ padding: '28px' }}>
            {/* ========================================================= */}
            {/* STEP 1: BASIC PROPERTY INFORMATION                         */}
            {/* ========================================================= */}
            {currentStep === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Hotel Name */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, color: '#1E293B', marginBottom: 6 }}>
                    Hotel / Property Name <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="e.g. The Grand Palace Resort & Spa"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: 10,
                      border: '1.5px solid #CBD5E1',
                      fontSize: '0.92rem',
                      outline: 'none',
                      background: '#FFF'
                    }}
                  />
                </div>

                {/* Property Type Selection Cards */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, color: '#1E293B', marginBottom: 8 }}>
                    Property Type <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: 10
                  }}>
                    {PROPERTY_TYPES.map(type => {
                      const Icon = type.icon;
                      const isSelected = formData.property_type === type.id;
                      return (
                        <div
                          key={type.id}
                          onClick={() => updateField('property_type', type.id)}
                          style={{
                            border: isSelected ? '2px solid #EA580C' : '1.5px solid #E2E8F0',
                            background: isSelected ? '#FFF7ED' : '#FAFAFA',
                            borderRadius: 12,
                            padding: '14px 12px',
                            cursor: 'pointer',
                            textAlign: 'center',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <Icon size={24} color={isSelected ? '#EA580C' : '#64748B'} style={{ margin: '0 auto 6px' }} />
                          <div style={{ fontSize: '0.88rem', fontWeight: 700, color: isSelected ? '#EA580C' : '#1E293B' }}>
                            {type.label}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: 2 }}>
                            {type.desc}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Star Rating / Category */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, color: '#1E293B', marginBottom: 8 }}>
                    Star Rating / Hotel Category
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {STAR_RATINGS.map(star => {
                      const isSelected = formData.star_rating === star;
                      return (
                        <button
                          key={star}
                          type="button"
                          onClick={() => updateField('star_rating', star)}
                          style={{
                            padding: '8px 14px',
                            borderRadius: 20,
                            border: isSelected ? '1.5px solid #EA580C' : '1px solid #CBD5E1',
                            background: isSelected ? '#EA580C' : '#FFF',
                            color: isSelected ? '#FFF' : '#334155',
                            fontSize: '0.82rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          {star}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Total Rooms & Manager Info */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, color: '#1E293B', marginBottom: 6 }}>
                      Total Property Rooms
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.total_rooms}
                      onChange={(e) => updateField('total_rooms', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '11px 14px',
                        borderRadius: 10,
                        border: '1.5px solid #CBD5E1',
                        fontSize: '0.92rem',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, color: '#1E293B', marginBottom: 6 }}>
                      Primary Manager Name
                    </label>
                    <input
                      type="text"
                      value={formData.manager_name}
                      onChange={(e) => updateField('manager_name', e.target.value)}
                      placeholder="Property General Manager"
                      style={{
                        width: '100%',
                        padding: '11px 14px',
                        borderRadius: 10,
                        border: '1.5px solid #CBD5E1',
                        fontSize: '0.92rem',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                {/* Large Description Area */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <label style={{ fontSize: '0.86rem', fontWeight: 700, color: '#1E293B' }}>
                      Hotel Overview & Description <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <span style={{ fontSize: '0.78rem', color: '#94A3B8' }}>
                      {formData.description?.length || 0} characters
                    </span>
                  </div>
                  <textarea
                    rows={5}
                    value={formData.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    placeholder="Describe what makes your property special: ambiance, proximity to attractions, dining, scenic views, and hospitality..."
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: 10,
                      border: '1.5px solid #CBD5E1',
                      fontSize: '0.9rem',
                      lineHeight: 1.5,
                      outline: 'none',
                      fontFamily: 'inherit',
                      resize: 'vertical'
                    }}
                  />
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* STEP 2: LOCATION & CONTACT DETAILS                         */}
            {/* ========================================================= */}
            {currentStep === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {/* Address */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, color: '#1E293B', marginBottom: 6 }}>
                    Street Address <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => updateField('address', e.target.value)}
                    placeholder="e.g. 124 Beach Boulevard, Candolim"
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      borderRadius: 10,
                      border: '1.5px solid #CBD5E1',
                      fontSize: '0.92rem',
                      outline: 'none'
                    }}
                  />
                </div>

                {/* City, State, Pincode */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#1E293B', marginBottom: 6 }}>
                      City / Destination <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => updateField('city', e.target.value)}
                      placeholder="e.g. Goa"
                      style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #CBD5E1', outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#1E293B', marginBottom: 6 }}>
                      State <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => updateField('state', e.target.value)}
                      placeholder="e.g. Goa"
                      style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #CBD5E1', outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#1E293B', marginBottom: 6 }}>
                      Pincode / Postal Code <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.pincode}
                      onChange={(e) => updateField('pincode', e.target.value)}
                      placeholder="e.g. 403515"
                      style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #CBD5E1', outline: 'none' }}
                    />
                  </div>
                </div>

                {/* Contact Phone, Email, Website */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#1E293B', marginBottom: 6 }}>
                      Hotel Contact Phone <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <input
                      type="tel"
                      value={formData.contact_number}
                      onChange={(e) => updateField('contact_number', e.target.value)}
                      placeholder="e.g. +91 98765 43210"
                      style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #CBD5E1', outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#1E293B', marginBottom: 6 }}>
                      Hotel Official Email <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      placeholder="reservations@hotel.com"
                      style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #CBD5E1', outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#1E293B', marginBottom: 6 }}>
                      Website (Optional)
                    </label>
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => updateField('website', e.target.value)}
                      placeholder="https://www.grandpalaceresort.com"
                      style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #CBD5E1', outline: 'none' }}
                    />
                  </div>
                </div>

                {/* Interactive Map & Coordinates */}
                <div style={{
                  border: '1.5px solid #CBD5E1',
                  borderRadius: 14,
                  padding: 16,
                  background: '#F8FAFC'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div>
                      <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                        Interactive Property Coordinates
                      </h3>
                      <p style={{ fontSize: '0.78rem', color: '#64748B', margin: 0 }}>
                        Lat: {Number(formData.latitude).toFixed(4)}, Lng: {Number(formData.longitude).toFixed(4)}
                      </p>
                    </div>

                    {/* Quick city selector */}
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        type="button"
                        onClick={() => {
                          if (navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition((pos) => {
                              updateField('latitude', pos.coords.latitude);
                              updateField('longitude', pos.coords.longitude);
                              addToast('Set location from current coordinates!', 'success');
                            });
                          }
                        }}
                        style={{
                          background: '#FFF',
                          border: '1px solid #CBD5E1',
                          padding: '6px 12px',
                          borderRadius: 8,
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          color: '#EA580C',
                          cursor: 'pointer'
                        }}
                      >
                        📍 Use Current Location
                      </button>
                    </div>
                  </div>

                  {/* Preset City Buttons */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                    {POPULAR_CITIES.map(c => (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => {
                          updateField('city', c.name);
                          updateField('state', c.state);
                          updateField('latitude', c.lat);
                          updateField('longitude', c.lng);
                          addToast(`Location set to ${c.name}, ${c.state}`, 'info');
                        }}
                        style={{
                          background: formData.city === c.name ? '#0F172A' : '#FFF',
                          color: formData.city === c.name ? '#FFF' : '#334155',
                          border: '1px solid #E2E8F0',
                          padding: '4px 10px',
                          borderRadius: 6,
                          fontSize: '0.75rem',
                          cursor: 'pointer'
                        }}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>

                  {/* Visual Map Pin Graphic Box */}
                  <div style={{
                    height: 140,
                    borderRadius: 10,
                    background: 'url(https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=1000&auto=format&fit=crop) center/cover',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid #CBD5E1'
                  }}>
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(15, 23, 42, 0.45)',
                      borderRadius: 10
                    }} />
                    <div style={{
                      position: 'relative',
                      zIndex: 2,
                      textAlign: 'center',
                      color: '#FFF',
                      background: 'rgba(0,0,0,0.65)',
                      padding: '10px 18px',
                      borderRadius: 10,
                      backdropFilter: 'blur(4px)'
                    }}>
                      <MapPin size={22} color="#EA580C" style={{ margin: '0 auto 4px' }} />
                      <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                        {formData.name || 'Selected Property Location'}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#E2E8F0' }}>
                        {formData.address || 'Address'}, {formData.city} ({formData.pincode})
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* STEP 3: HOTEL FACILITIES & AMENITIES                       */}
            {/* ========================================================= */}
            {currentStep === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Custom Amenity Adder */}
                <form onSubmit={handleAddCustomAmenity} style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    value={customAmenityInput}
                    onChange={(e) => setCustomAmenityInput(e.target.value)}
                    placeholder="Type custom amenity (e.g. Helipad, Electric Vehicle Charger)..."
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: '1.5px solid #CBD5E1',
                      fontSize: '0.88rem',
                      outline: 'none'
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      background: '#EA580C',
                      color: '#FFF',
                      border: 'none',
                      borderRadius: 10,
                      padding: '10px 16px',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    <Plus size={16} /> Add Amenity
                  </button>
                </form>

                {/* Selected Amenities Chips */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1E293B' }}>
                      Selected Facilities ({(formData.amenities || []).length})
                    </label>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, minHeight: 40, padding: 10, background: '#F8FAFC', borderRadius: 10, border: '1px dashed #CBD5E1' }}>
                    {(formData.amenities || []).map(amenity => (
                      <span
                        key={amenity}
                        style={{
                          background: '#FFF',
                          border: '1.5px solid #EA580C',
                          color: '#EA580C',
                          borderRadius: 20,
                          padding: '5px 12px',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6
                        }}
                      >
                        <Check size={13} />
                        {amenity}
                        <X
                          size={13}
                          style={{ cursor: 'pointer', opacity: 0.7 }}
                          onClick={() => toggleAmenity(amenity)}
                        />
                      </span>
                    ))}
                  </div>
                </div>

                {/* Grid of Default Facilities */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, color: '#1E293B', marginBottom: 10 }}>
                    Popular Hotel Facilities (Click to toggle)
                  </label>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: 10
                  }}>
                    {DEFAULT_AMENITIES.map(amenity => {
                      const isSelected = (formData.amenities || []).includes(amenity);
                      return (
                        <div
                          key={amenity}
                          onClick={() => toggleAmenity(amenity)}
                          style={{
                            padding: '12px 14px',
                            borderRadius: 10,
                            border: isSelected ? '2px solid #EA580C' : '1px solid #E2E8F0',
                            background: isSelected ? '#FFF7ED' : '#FFF',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <span style={{ fontSize: '0.84rem', fontWeight: isSelected ? 700 : 500, color: isSelected ? '#EA580C' : '#334155' }}>
                            {amenity}
                          </span>
                          <div style={{
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            border: isSelected ? 'none' : '1.5px solid #CBD5E1',
                            background: isSelected ? '#EA580C' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#FFF'
                          }}>
                            {isSelected && <Check size={12} />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* STEP 4: ROOM INVENTORY & CATEGORIES                        */}
            {/* ========================================================= */}
            {currentStep === 4 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                      Room Categories ({(formData.rooms || []).length})
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: '#64748B', margin: 0 }}>
                      Define pricing, occupancy, bed types, and amenities for each room type.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenAddRoom}
                    style={{
                      background: '#EA580C',
                      color: '#FFF',
                      border: 'none',
                      padding: '9px 16px',
                      borderRadius: 10,
                      fontWeight: 700,
                      fontSize: '0.84rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    <Plus size={16} /> Add Room Category
                  </button>
                </div>

                {/* List of Room Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {(formData.rooms || []).map((room, idx) => (
                    <div
                      key={room.id || idx}
                      style={{
                        border: '1.5px solid #E2E8F0',
                        borderRadius: 14,
                        padding: 16,
                        background: '#FFF',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                              {room.room_type}
                            </h4>
                            <span style={{
                              background: '#F1F5F9',
                              color: '#475569',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: 6
                            }}>
                              {room.quantity} Available
                            </span>
                          </div>
                          <p style={{ fontSize: '0.82rem', color: '#64748B', margin: '4px 0 0' }}>
                            {room.description || 'Comfortable stay with private amenities'}
                          </p>
                        </div>

                        {/* Price Badge */}
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#EA580C' }}>
                            ₹{Number(room.price_per_night).toLocaleString()}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block' }}>/ night</span>
                        </div>
                      </div>

                      {/* Specs Row */}
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 12,
                        fontSize: '0.78rem',
                        color: '#475569',
                        padding: '8px 12px',
                        background: '#F8FAFC',
                        borderRadius: 8
                      }}>
                        <span>🛏️ <strong>{room.bed_type}</strong></span>
                        <span>👥 Up to <strong>{room.max_guests} Guests</strong> ({room.max_adults || 2} Adults, {room.max_children || 1} Children)</span>
                        <span>📐 <strong>{room.room_size}</strong></span>
                        <span>🚿 <strong>{room.bathroom_type}</strong></span>
                      </div>

                      {/* Included Amenities Chips */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {(room.amenities || []).map(a => (
                          <span key={a} style={{ background: '#F1F5F9', color: '#334155', fontSize: '0.72rem', padding: '3px 8px', borderRadius: 4, fontWeight: 500 }}>
                            {a}
                          </span>
                        ))}
                      </div>

                      {/* Action Buttons */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, borderTop: '1px solid #F1F5F9', paddingTop: 10 }}>
                        <button
                          type="button"
                          onClick={() => handleDuplicateRoom(idx)}
                          style={{ background: 'none', border: 'none', color: '#64748B', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                          <Copy size={14} /> Duplicate
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEditRoom(idx)}
                          style={{ background: 'none', border: 'none', color: '#EA580C', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                          <Edit3 size={14} /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteRoom(idx)}
                          style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* STEP 5: HOTEL PHOTOS GALLERY                               */}
            {/* ========================================================= */}
            {currentStep === 5 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Upload Section */}
                <div style={{
                  border: '2px dashed #CBD5E1',
                  borderRadius: 14,
                  padding: 24,
                  background: '#F8FAFC',
                  textAlign: 'center'
                }}>
                  <UploadCloud size={36} color="#EA580C" style={{ margin: '0 auto 8px' }} />
                  <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#0F172A', margin: '0 0 4px' }}>
                    Upload High-Resolution Photos
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '0 0 16px' }}>
                    Recommended: Min 1200x800px, JPG/PNG/WebP, max 5MB per image.
                  </p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 12 }}>
                    <select
                      value={selectedPhotoCategory}
                      onChange={(e) => setSelectedPhotoCategory(e.target.value)}
                      style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: '0.82rem', outline: 'none' }}
                    >
                      {PHOTO_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>

                    <input
                      type="url"
                      value={photoUrlInput}
                      onChange={(e) => setPhotoUrlInput(e.target.value)}
                      placeholder="Paste Image URL or use preset..."
                      style={{ flex: 1, minWidth: 200, padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: '0.82rem', outline: 'none' }}
                    />

                    <button
                      type="button"
                      onClick={handleAddPhoto}
                      style={{
                        background: '#EA580C',
                        color: '#FFF',
                        border: 'none',
                        borderRadius: 8,
                        padding: '8px 16px',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        cursor: 'pointer'
                      }}
                    >
                      + Add Photo
                    </button>
                  </div>
                </div>

                {/* Uploaded Photos Grid */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, color: '#1E293B', marginBottom: 10 }}>
                    Uploaded Gallery ({(formData.photos || []).length} Photos)
                  </label>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: 12
                  }}>
                    {(formData.photos || []).map((photo, idx) => (
                      <div
                        key={idx}
                        style={{
                          borderRadius: 12,
                          overflow: 'hidden',
                          border: photo.isCover ? '2.5px solid #EA580C' : '1px solid #E2E8F0',
                          position: 'relative',
                          background: '#000'
                        }}
                      >
                        <img
                          src={photo.url}
                          alt={photo.name || 'Hotel photo'}
                          style={{ width: '100%', height: 130, objectFit: 'cover', display: 'block' }}
                        />

                        {/* Top Category Tag */}
                        <span style={{
                          position: 'absolute',
                          top: 6,
                          left: 6,
                          background: 'rgba(0,0,0,0.65)',
                          color: '#FFF',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: 4,
                          backdropFilter: 'blur(4px)'
                        }}>
                          {photo.category}
                        </span>

                        {/* Cover Badge */}
                        {photo.isCover && (
                          <span style={{
                            position: 'absolute',
                            bottom: 6,
                            left: 6,
                            background: '#EA580C',
                            color: '#FFF',
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            padding: '2px 6px',
                            borderRadius: 4
                          }}>
                            ★ Primary Cover
                          </span>
                        )}

                        {/* Delete & Set Cover */}
                        <div style={{
                          position: 'absolute',
                          top: 6,
                          right: 6,
                          display: 'flex',
                          gap: 4
                        }}>
                          {!photo.isCover && (
                            <button
                              type="button"
                              onClick={() => handleSetCoverPhoto(idx)}
                              title="Set as cover image"
                              style={{
                                background: 'rgba(0,0,0,0.7)',
                                color: '#FFF',
                                border: 'none',
                                borderRadius: 4,
                                padding: '3px 6px',
                                fontSize: '0.68rem',
                                cursor: 'pointer'
                              }}
                            >
                              Set Cover
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeletePhoto(idx)}
                            style={{
                              background: '#EF4444',
                              color: '#FFF',
                              border: 'none',
                              borderRadius: 4,
                              width: 22,
                              height: 22,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer'
                            }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* STEP 6: HOTEL POLICIES & GUIDELINES                        */}
            {/* ========================================================= */}
            {currentStep === 6 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {/* Check-in / Check-out Times */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#1E293B', marginBottom: 6 }}>
                      Standard Check-in Time
                    </label>
                    <input
                      type="text"
                      value={formData.policies?.check_in_time || '14:00'}
                      onChange={(e) => updateNestedPolicy('check_in_time', e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #CBD5E1', outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#1E293B', marginBottom: 6 }}>
                      Standard Check-out Time
                    </label>
                    <input
                      type="text"
                      value={formData.policies?.check_out_time || '11:00'}
                      onChange={(e) => updateNestedPolicy('check_out_time', e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #CBD5E1', outline: 'none' }}
                    />
                  </div>
                </div>

                {/* Cancellation Policy */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#1E293B', marginBottom: 6 }}>
                    Standard Cancellation Policy
                  </label>
                  <select
                    value={formData.policies?.cancellation_policy}
                    onChange={(e) => updateNestedPolicy('cancellation_policy', e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #CBD5E1', outline: 'none' }}
                  >
                    <option value="Free cancellation up to 24 hours before check-in">Free cancellation up to 24 hours before check-in</option>
                    <option value="Free cancellation up to 48 hours before check-in">Free cancellation up to 48 hours before check-in</option>
                    <option value="Non-refundable / No cancellation refund">Non-refundable / No cancellation refund</option>
                    <option value="Flexible: Full refund up to 7 days before check-in">Flexible: Full refund up to 7 days before check-in</option>
                  </select>
                </div>

                {/* Child & Pet Policies */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#1E293B', marginBottom: 6 }}>
                      Child Policy
                    </label>
                    <input
                      type="text"
                      value={formData.policies?.child_policy}
                      onChange={(e) => updateNestedPolicy('child_policy', e.target.value)}
                      placeholder="e.g. Children under 6 stay free"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #CBD5E1', outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#1E293B', marginBottom: 6 }}>
                      Pet Policy
                    </label>
                    <select
                      value={formData.policies?.pet_policy}
                      onChange={(e) => updateNestedPolicy('pet_policy', e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #CBD5E1', outline: 'none' }}
                    >
                      <option value="Pets Allowed">Pets Allowed</option>
                      <option value="Pets Allowed on Request">Pets Allowed on Request</option>
                      <option value="Pets Not Allowed">Pets Not Allowed</option>
                    </select>
                  </div>
                </div>

                {/* Extra Bed & Breakfast */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#1E293B', marginBottom: 6 }}>
                      Extra Bed Charge (₹ per night)
                    </label>
                    <input
                      type="number"
                      value={formData.policies?.extra_bed_charge || 1000}
                      onChange={(e) => updateNestedPolicy('extra_bed_charge', Number(e.target.value))}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #CBD5E1', outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#1E293B', marginBottom: 6 }}>
                      Breakfast Option
                    </label>
                    <select
                      value={formData.policies?.breakfast_option}
                      onChange={(e) => updateNestedPolicy('breakfast_option', e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #CBD5E1', outline: 'none' }}
                    >
                      <option value="Included in room rates">Included in room rates</option>
                      <option value="Available as add-on at ₹350/person">Available as add-on at ₹350/person</option>
                      <option value="Not provided">Not provided</option>
                    </select>
                  </div>
                </div>

                {/* Additional House Rules */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#1E293B', marginBottom: 6 }}>
                    Additional House Rules & Guest Instructions
                  </label>
                  <textarea
                    rows={3}
                    value={formData.policies?.house_rules}
                    onChange={(e) => updateNestedPolicy('house_rules', e.target.value)}
                    placeholder="e.g. Valid government ID required. Smoking prohibited in indoor suites..."
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #CBD5E1', outline: 'none', fontFamily: 'inherit' }}
                  />
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* STEP 7: VERIFICATION DOCUMENTS                            */}
            {/* ========================================================= */}
            {currentStep === 7 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{
                  background: '#F0FDF4',
                  border: '1px solid #BBF7D0',
                  borderRadius: 12,
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontSize: '0.84rem',
                  color: '#166534'
                }}>
                  <ShieldCheck size={20} style={{ flexShrink: 0 }} />
                  <span>
                    Your documents will be reviewed securely by our administration team before your hotel is published.
                  </span>
                </div>

                {/* Document Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {(formData.documents || []).map(doc => {
                    const isUploaded = doc.status === 'Uploaded';
                    return (
                      <div
                        key={doc.id}
                        style={{
                          border: isUploaded ? '1.5px solid #BBF7D0' : '1.5px solid #CBD5E1',
                          background: isUploaded ? '#F0FDF4' : '#FFF',
                          borderRadius: 12,
                          padding: '14px 16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 12
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <FileText size={18} color={isUploaded ? '#16A34A' : '#64748B'} />
                            <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                              {doc.type}
                            </h4>
                            <span style={{
                              background: doc.required ? '#FEF2F2' : '#F1F5F9',
                              color: doc.required ? '#B91C1C' : '#64748B',
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: 4
                            }}>
                              {doc.required ? 'Required' : 'Optional'}
                            </span>
                          </div>
                          {isUploaded && (
                            <p style={{ fontSize: '0.78rem', color: '#166534', margin: '3px 0 0' }}>
                              ✓ File: <strong>{doc.name}</strong> (Uploaded on {doc.uploadedAt})
                            </p>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleDocUpload(doc.id)}
                          style={{
                            background: isUploaded ? '#DCFCE7' : '#EA580C',
                            color: isUploaded ? '#166534' : '#FFF',
                            border: 'none',
                            padding: '6px 14px',
                            borderRadius: 8,
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          {isUploaded ? 'Replace Document' : 'Upload Document'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* STEP 8: REVIEW & SUBMISSION PREVIEW                        */}
            {/* ========================================================= */}
            {currentStep === 8 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Hotel Overview Review Card */}
                <div style={{ border: '1.5px solid #E2E8F0', borderRadius: 14, padding: 18, background: '#FFF' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#EA580C', textTransform: 'uppercase' }}>
                      Property Overview
                    </span>
                    <button type="button" onClick={() => setCurrentStep(1)} style={{ background: 'none', border: 'none', color: '#EA580C', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>
                      Edit
                    </button>
                  </div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', margin: '0 0 4px' }}>
                    {formData.name}
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: '#64748B', margin: '0 0 10px' }}>
                    {formData.property_type} • {formData.star_rating} • {formData.total_rooms} Rooms Total
                  </p>
                  <p style={{ fontSize: '0.86rem', color: '#334155', lineHeight: 1.5, margin: 0 }}>
                    {formData.description}
                  </p>
                </div>

                {/* Location Review Card */}
                <div style={{ border: '1.5px solid #E2E8F0', borderRadius: 14, padding: 18, background: '#FFF' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#EA580C', textTransform: 'uppercase' }}>
                      Location & Contact
                    </span>
                    <button type="button" onClick={() => setCurrentStep(2)} style={{ background: 'none', border: 'none', color: '#EA580C', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>
                      Edit
                    </button>
                  </div>
                  <p style={{ fontSize: '0.88rem', color: '#0F172A', margin: 0 }}>
                    📍 <strong>{formData.address}</strong>, {formData.city}, {formData.state} - {formData.pincode}
                  </p>
                  <p style={{ fontSize: '0.82rem', color: '#64748B', margin: '4px 0 0' }}>
                    📞 {formData.contact_number} | ✉️ {formData.email} {formData.website && `| 🌐 ${formData.website}`}
                  </p>
                </div>

                {/* Rooms Review Card */}
                <div style={{ border: '1.5px solid #E2E8F0', borderRadius: 14, padding: 18, background: '#FFF' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#EA580C', textTransform: 'uppercase' }}>
                      Room Categories ({(formData.rooms || []).length})
                    </span>
                    <button type="button" onClick={() => setCurrentStep(4)} style={{ background: 'none', border: 'none', color: '#EA580C', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>
                      Edit
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {(formData.rooms || []).map((room, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#F8FAFC', borderRadius: 8 }}>
                        <div>
                          <strong>{room.room_type}</strong> ({room.quantity} rooms) — {room.bed_type}
                        </div>
                        <div style={{ fontWeight: 800, color: '#EA580C' }}>
                          ₹{Number(room.price_per_night).toLocaleString()} / night
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Facilities & Policies Summary */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div style={{ border: '1.5px solid #E2E8F0', borderRadius: 14, padding: 16, background: '#FFF' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#EA580C', textTransform: 'uppercase' }}>
                        Facilities ({(formData.amenities || []).length})
                      </span>
                      <button type="button" onClick={() => setCurrentStep(3)} style={{ background: 'none', border: 'none', color: '#EA580C', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>
                        Edit
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {(formData.amenities || []).map(a => (
                        <span key={a} style={{ background: '#F1F5F9', color: '#334155', fontSize: '0.72rem', padding: '2px 6px', borderRadius: 4 }}>
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div style={{ border: '1.5px solid #E2E8F0', borderRadius: 14, padding: 16, background: '#FFF' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#EA580C', textTransform: 'uppercase' }}>
                        Policies
                      </span>
                      <button type="button" onClick={() => setCurrentStep(6)} style={{ background: 'none', border: 'none', color: '#EA580C', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>
                        Edit
                      </button>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#475569', margin: 0 }}>
                      Check-in: <strong>{formData.policies?.check_in_time}</strong> | Check-out: <strong>{formData.policies?.check_out_time}</strong>
                    </p>
                    <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '4px 0 0' }}>
                      {formData.policies?.cancellation_policy}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Wizard Navigation Footer */}
          <div style={{
            padding: '18px 28px',
            background: '#F8FAFC',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            {/* Back Button */}
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handlePrevStep}
                style={{
                  background: '#FFF',
                  border: '1.5px solid #CBD5E1',
                  color: '#475569',
                  padding: '10px 18px',
                  borderRadius: 10,
                  fontSize: '0.86rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <ChevronLeft size={16} /> Back
              </button>
            ) : (
              <div />
            )}

            {/* Next / Submit Button */}
            {currentStep < 8 ? (
              <button
                type="button"
                onClick={handleNextStep}
                style={{
                  background: '#EA580C',
                  color: '#FFF',
                  border: 'none',
                  padding: '10px 24px',
                  borderRadius: 10,
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: '0 4px 12px rgba(234, 88, 12, 0.25)'
                }}
              >
                Continue <ChevronRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowSubmitModal(true)}
                style={{
                  background: 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)',
                  color: '#FFF',
                  border: 'none',
                  padding: '12px 28px',
                  borderRadius: 10,
                  fontSize: '0.92rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 4px 16px rgba(22, 163, 74, 0.3)'
                }}
              >
                <CheckCircle2 size={18} /> Submit for Approval
              </button>
            )}
          </div>
        </div>
      </main>

      {/* ========================================================= */}
      {/* ROOM CATEGORY BUILDER / EDIT MODAL                         */}
      {/* ========================================================= */}
      {roomModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16
        }}>
          <div style={{
            background: '#FFF',
            borderRadius: 16,
            width: '100%',
            maxWidth: 620,
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: 24,
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                {editingRoomIndex !== null ? 'Edit Room Category' : 'Add Room Category'}
              </h3>
              <button
                type="button"
                onClick={() => setRoomModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveRoomModal} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Room Name */}
              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#1E293B', marginBottom: 5 }}>
                  Room Category Name <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={roomFormData.room_type}
                  onChange={(e) => setRoomFormData(prev => ({ ...prev, room_type: e.target.value }))}
                  placeholder="e.g. Deluxe Ocean View Suite"
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #CBD5E1', outline: 'none' }}
                />
              </div>

              {/* Qty & Price */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#1E293B', marginBottom: 5 }}>
                    Available Units
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={roomFormData.quantity}
                    onChange={(e) => setRoomFormData(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #CBD5E1', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#1E293B', marginBottom: 5 }}>
                    Price Per Night (₹) <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    min="100"
                    value={roomFormData.price_per_night}
                    onChange={(e) => setRoomFormData(prev => ({ ...prev, price_per_night: Number(e.target.value) }))}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #CBD5E1', outline: 'none' }}
                  />
                </div>
              </div>

              {/* Bed Type, Room Size, Bathroom */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#1E293B', marginBottom: 5 }}>
                    Bed Type
                  </label>
                  <select
                    value={roomFormData.bed_type}
                    onChange={(e) => setRoomFormData(prev => ({ ...prev, bed_type: e.target.value }))}
                    style={{ width: '100%', padding: '9px 8px', borderRadius: 8, border: '1.5px solid #CBD5E1', outline: 'none' }}
                  >
                    <option value="King Bed">King Bed</option>
                    <option value="Queen Bed">Queen Bed</option>
                    <option value="Double Bed">Double Bed</option>
                    <option value="Twin Beds">Twin Beds</option>
                    <option value="Single Bed">Single Bed</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#1E293B', marginBottom: 5 }}>
                    Room Size
                  </label>
                  <input
                    type="text"
                    value={roomFormData.room_size}
                    onChange={(e) => setRoomFormData(prev => ({ ...prev, room_size: e.target.value }))}
                    placeholder="350 sq.ft"
                    style={{ width: '100%', padding: '9px 10px', borderRadius: 8, border: '1.5px solid #CBD5E1', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#1E293B', marginBottom: 5 }}>
                    Bathroom Type
                  </label>
                  <input
                    type="text"
                    value={roomFormData.bathroom_type}
                    onChange={(e) => setRoomFormData(prev => ({ ...prev, bathroom_type: e.target.value }))}
                    placeholder="Private Ensuite"
                    style={{ width: '100%', padding: '9px 10px', borderRadius: 8, border: '1.5px solid #CBD5E1', outline: 'none' }}
                  />
                </div>
              </div>

              {/* Room Amenities Checkboxes */}
              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#1E293B', marginBottom: 6 }}>
                  Room Features & Amenities
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 120, overflowY: 'auto', padding: 6, background: '#F8FAFC', borderRadius: 8 }}>
                  {ROOM_AMENITY_OPTIONS.map(a => {
                    const isChecked = (roomFormData.amenities || []).includes(a);
                    return (
                      <button
                        key={a}
                        type="button"
                        onClick={() => toggleRoomAmenity(a)}
                        style={{
                          background: isChecked ? '#EA580C' : '#FFF',
                          color: isChecked ? '#FFF' : '#334155',
                          border: '1px solid #CBD5E1',
                          padding: '4px 8px',
                          borderRadius: 6,
                          fontSize: '0.74rem',
                          cursor: 'pointer'
                        }}
                      >
                        {a}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Description */}
              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#1E293B', marginBottom: 5 }}>
                  Room Description
                </label>
                <textarea
                  rows={2}
                  value={roomFormData.description}
                  onChange={(e) => setRoomFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe balcony views, bed comfort, workspace..."
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #CBD5E1', outline: 'none', fontFamily: 'inherit' }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setRoomModalOpen(false)}
                  style={{ flex: 1, padding: '10px', background: '#F1F5F9', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onClick={handleSaveRoomModal}
                  style={{ flex: 2, padding: '10px', background: '#EA580C', color: '#FFF', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
                >
                  {editingRoomIndex !== null ? 'Update Room Category' : 'Save Room Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUBMIT CONFIRMATION MODAL                                  */}
      {/* ========================================================= */}
      {showSubmitModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(5px)',
          zIndex: 110,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16
        }}>
          <div style={{
            background: '#FFF',
            borderRadius: 18,
            maxWidth: 480,
            width: '100%',
            padding: 28,
            textAlign: 'center',
            boxShadow: '0 25px 60px rgba(0,0,0,0.35)'
          }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: '#FFF7ED',
              color: '#EA580C',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <Building2 size={32} />
            </div>

            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>
              Submit Hotel for Approval?
            </h3>
            <p style={{ fontSize: '0.86rem', color: '#64748B', lineHeight: 1.5, marginBottom: 24 }}>
              Are you sure you want to submit <strong>{formData.name}</strong> for admin review? Our verification team will review your property details and documents.
            </p>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                disabled={isSubmitting}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#F1F5F9',
                  color: '#475569',
                  border: 'none',
                  borderRadius: 10,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={handleSubmitForApproval}
                disabled={isSubmitting}
                style={{
                  flex: 2,
                  padding: '12px',
                  background: '#16A34A',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: 10,
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(22, 163, 74, 0.3)'
                }}
              >
                {isSubmitting ? 'Submitting...' : 'Confirm & Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
