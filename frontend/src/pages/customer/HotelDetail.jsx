import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import NearbyAttractions from '../../components/NearbyAttractions';
import { 
  Heart, 
  Share2, 
  MapPin, 
  ChevronLeft, 
  ChevronRight, 
  Star, 
  ShieldCheck, 
  Calendar, 
  Users, 
  Bed, 
  Check, 
  Wifi, 
  Car, 
  Waves, 
  Sparkles, 
  Dumbbell, 
  Utensils, 
  Briefcase, 
  Dog, 
  Plane, 
  Train, 
  Building, 
  Coffee, 
  CheckCircle2,
  X,
  CreditCard,
  Zap,
  ArrowRight,
  Lock,
  Maximize2,
  Info,
  Compass
} from 'lucide-react';

export default function HotelDetail() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { hotels, quotes, leads, acceptQuote, counterQuote, submitRequirement, toggleWishlist, isWishlisted } = useApp();
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  // Find Hotel from State
  const hotel = hotels.find(h => h.id.toString() === id?.toString());
  const [hotelReviews, setHotelReviews] = useState([]);

  // Active Gallery Image Index
  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [galleryModalOpen, setGalleryModalOpen] = useState(false);

  // Active Section Tab
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'rooms' | 'amenities' | 'reviews' | 'location' | 'policies'
  const [aboutExpanded, setAboutExpanded] = useState(false);

  // Dates & Guests Filter State
  const defaultCheckIn = searchParams.get('checkIn') || '2026-09-11';
  const defaultCheckOut = searchParams.get('checkOut') || '2026-09-14';

  const [checkIn, setCheckIn] = useState(defaultCheckIn);
  const [checkOut, setCheckOut] = useState(defaultCheckOut);
  const [guests, setGuests] = useState(Number(searchParams.get('guests')) || 2);
  const [roomsCount, setRoomsCount] = useState(Number(searchParams.get('rooms')) || 1);

  // Selected Room & Modal States
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectRoomModal, setSelectRoomModal] = useState({ show: false, room: null });
  const [viewRoomModal, setViewRoomModal] = useState({ show: false, room: null, imgIdx: 0 });
  const [editingModalField, setEditingModalField] = useState(null); // 'dates' | 'guests' | 'rooms' | null

  const formatDateNice = (dStr) => {
    if (!dStr) return '';
    try {
      const d = new Date(dStr);
      if (isNaN(d.getTime())) return dStr;
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dStr;
    }
  };

  // Reviews carousel index
  const [activeReviewIdx, setActiveReviewIdx] = useState(0);

  // Fetch real reviews
  useEffect(() => {
    if (hotel?.id) {
      api.getHotelReviews(hotel.id)
        .then(data => setHotelReviews(Array.isArray(data) ? data : []))
        .catch(() => setHotelReviews([]));
    }
  }, [hotel?.id]);

  // Gallery Photos helper
  const allPhotos = useMemo(() => {
    if (!hotel) return [];
    const list = [];
    if (hotel.photos && Array.isArray(hotel.photos)) {
      list.push(...hotel.photos);
    }
    if (hotel.roomTypes && Array.isArray(hotel.roomTypes)) {
      hotel.roomTypes.forEach(rt => {
        if (rt.images && Array.isArray(rt.images)) {
          rt.images.forEach(img => {
            if (img.url && !list.includes(img.url)) list.push(img.url);
          });
        }
      });
    }
    if (list.length === 0) {
      list.push(
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200',
        'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800',
        'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800',
        'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800'
      );
    }
    return list;
  }, [hotel]);

  // Starting Price Helper
  const startingPrice = useMemo(() => {
    if (!hotel) return 15000;
    if (hotel.roomTypes && hotel.roomTypes[0]?.price) {
      return Math.min(...hotel.roomTypes.map(r => Number(r.price) || 15000));
    }
    if (hotel.rooms && hotel.rooms[0]?.price_per_night) {
      return Math.min(...hotel.rooms.map(r => Number(r.price_per_night) || 15000));
    }
    return Number(hotel.price) || 15000;
  }, [hotel]);

  // Rooms Data with fallback luxury templates
  const availableRooms = useMemo(() => {
    if (hotel?.roomTypes && hotel.roomTypes.length > 0) {
      return hotel.roomTypes;
    }
    // Default luxury rooms if not present
    return [
      {
        id: 1,
        type: 'Deluxe King Room',
        maxGuests: 2,
        bedType: '1 King Bed',
        roomSize: '350 sq.ft',
        price: startingPrice,
        description: 'Elegant and spacious room with city views, modern amenities and a comfortable king-size bed.',
        amenities: ['Free Wi-Fi', 'AC', 'City View', 'Minibar', 'Smart TV', '24/7 Room Service'],
        images: [{ url: allPhotos[1] || allPhotos[0] }]
      },
      {
        id: 2,
        type: 'Grand Deluxe Suite',
        maxGuests: 3,
        bedType: '1 King Bed',
        roomSize: '550 sq.ft',
        price: Math.round(startingPrice * 1.45),
        description: 'Expansive suite with separate living area, marble bathroom with soaking tub, and breathtaking panoramic views.',
        amenities: ['Free Wi-Fi', 'AC', 'Ocean View', 'Jacuzzi', 'Espresso Machine', 'Lounge Access'],
        images: [{ url: allPhotos[2] || allPhotos[0] }]
      },
      {
        id: 3,
        type: 'Presidential Luxury Suite',
        maxGuests: 4,
        bedType: '2 King Beds',
        roomSize: '950 sq.ft',
        price: Math.round(startingPrice * 2.8),
        description: 'The pinnacle of luxury featuring dedicated butler service, private dining room, and custom designer furnishings.',
        amenities: ['Butler Service', 'Private Terrace', 'Jacuzzi', 'Panoramic View', 'Chef On-Demand'],
        images: [{ url: allPhotos[3] || allPhotos[0] }]
      }
    ];
  }, [hotel, startingPrice, allPhotos]);

  // Calculate nights
  const calcNights = () => {
    if (!checkIn || !checkOut) return 3;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  };
  const nights = calcNights();

  // Reference for Rooms section scrolling
  const roomsSectionRef = useRef(null);
  const scrollToRooms = () => {
    if (roomsSectionRef.current) {
      roomsSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveTab('rooms');
    }
  };

  // Mock guest reviews carousel
  const guestReviewsList = useMemo(() => {
    if (hotelReviews.length > 0) {
      return hotelReviews.map(r => ({
        name: r.user_name || r.name || 'Priya Sharma',
        time: 'Verified Stay',
        rating: r.rating || 5,
        text: r.comment || r.text || 'Absolutely amazing experience! The service, rooms and dining were top-notch.'
      }));
    }
    return [
      {
        name: 'Priya Sharma',
        time: '2 weeks ago',
        rating: 5,
        text: 'Absolutely amazing experience! The service, rooms and dining were top-notch. Will definitely come back again.'
      },
      {
        name: 'Rahul Varma',
        time: '1 month ago',
        rating: 5,
        text: 'Best hospitality in the city. The rooftop pool and breakfast spread exceeded all our expectations.'
      },
      {
        name: 'Anita Desai',
        time: '3 weeks ago',
        rating: 5,
        text: 'Impeccable staff and contactless check-in made our family holiday seamless and truly memorable.'
      }
    ];
  }, [hotelReviews]);

  if (!hotel) {
    return (
      <div style={{ textAlign: 'center', padding: '120px 20px', minHeight: '60vh' }}>
        <h2 style={{ fontSize: '1.6rem', color: '#0F172A', marginBottom: 12 }}>Hotel Not Found</h2>
        <p style={{ color: '#64748B', marginBottom: 24 }}>The property you are looking for may not be available.</p>
        <Link to="/customer/find" className="btn btn-accent" style={{ textDecoration: 'none' }}>
          Explore All Hotels
        </Link>
      </div>
    );
  }

  // Handle Room Selection & Lead Submission
  const handleSelectRoomSubmit = async (room) => {
    const baseStayPrice = (room.price || startingPrice) * nights * roomsCount;
    const taxes = Math.round(baseStayPrice * 0.18);
    const totalEst = baseStayPrice + taxes;

    const lead = await submitRequirement({
      customerId: user?.id || 1,
      customerName: user?.name || 'Guest User',
      customerEmail: user?.email || 'guest@hoteliq.com',
      customerPhone: user?.phone || '',
      destination: hotel.location,
      checkIn: checkIn,
      checkOut: checkOut,
      guests: guests,
      roomType: room.type,
      budget: totalEst,
      purpose: 'Leisure',
      preferences: `Selected ${roomsCount}x ${room.type} at ₹${room.price || startingPrice}/night. Total quote request: ₹${totalEst.toLocaleString()}`,
      specific_hotel_id: parseInt(hotel.id)
    });

    setSelectRoomModal({ show: false, room: null });

    if (lead) {
      addToast(`Selected ${room.type} at ${hotel.name}! Your request has been placed.`, 'success');
      navigate('/customer/trips?tab=requests');
    }
  };

  const nextImage = () => {
    setActiveImgIdx((prev) => (prev + 1) % allPhotos.length);
  };
  const prevImage = () => {
    setActiveImgIdx((prev) => (prev - 1 + allPhotos.length) % allPhotos.length);
  };

  return (
    <div className="hotel-detail-page fade-in">
      <div className="hotel-detail-max-wrap">
        
        {/* 1. Breadcrumbs */}
        <nav className="hotel-breadcrumb" aria-label="Breadcrumb">
          <Link to="/customer">Home</Link>
          <span>›</span>
          <Link to="/customer/find">Hotels</Link>
          <span>›</span>
          <Link to={`/customer/find?location=${hotel.location}`}>{hotel.location}</Link>
          <span>›</span>
          <span className="current">{hotel.name}</span>
        </nav>

        {/* 2. Main 2-Column Grid */}
        <div className="hotel-detail-layout-grid">
          
          {/* Left Main Column */}
          <div>
            
            {/* Photo Gallery Split Grid Matching Reference */}
            <div className="hotel-gallery-container">
              {/* Main Large Hero Image */}
              <div className="hotel-gallery-main">
                <img 
                  src={allPhotos[activeImgIdx] || allPhotos[0]} 
                  alt={hotel.name} 
                  loading="eager"
                />
                
                {/* Gold Crown Premium Badge */}
                <div className="hotel-gallery-badge-premium">
                  <span>👑</span>
                  <span>Premium Collection</span>
                </div>

                {/* Left & Right Navigation Arrows */}
                {allPhotos.length > 1 && (
                  <>
                    <button 
                      type="button"
                      className="hotel-gallery-nav-btn prev"
                      onClick={(e) => { e.stopPropagation(); prevImage(); }}
                      aria-label="Previous Photo"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button 
                      type="button"
                      className="hotel-gallery-nav-btn next"
                      onClick={(e) => { e.stopPropagation(); nextImage(); }}
                      aria-label="Next Photo"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </>
                )}

                {/* Counter Pill */}
                <div className="hotel-gallery-counter">
                  {activeImgIdx + 1}/{allPhotos.length}
                </div>
              </div>

              {/* Right Stack of 3 Thumbnails (Desktop) */}
              <div className="hotel-gallery-thumbs">
                <div 
                  className="hotel-gallery-thumb-item" 
                  onClick={() => setActiveImgIdx(1 % allPhotos.length)}
                >
                  <img src={allPhotos[1] || allPhotos[0]} alt="Gallery 2" />
                </div>
                <div 
                  className="hotel-gallery-thumb-item" 
                  onClick={() => setActiveImgIdx(2 % allPhotos.length)}
                >
                  <img src={allPhotos[2] || allPhotos[0]} alt="Gallery 3" />
                </div>
                <div 
                  className="hotel-gallery-thumb-item"
                  onClick={() => setGalleryModalOpen(true)}
                >
                  <img src={allPhotos[3] || allPhotos[0]} alt="Gallery 4" />
                  <div className="hotel-gallery-more-overlay">
                    +{Math.max(1, allPhotos.length - 3)} Photos
                  </div>
                </div>
              </div>
            </div>

            {/* Hotel Title Section */}
            <div className="hotel-title-section">
              <div className="hotel-title-row">
                <h1 className="hotel-main-title">{hotel.name}</h1>
                <span className="hotel-badge-stars">
                  <span>5 ★ Luxury Hotel</span>
                </span>
              </div>

              <div className="hotel-location-text">
                <MapPin size={16} color="#EA580C" />
                <span>{hotel.address || `${hotel.location}, Maharashtra, India`}</span>
              </div>

              {/* Rating & Verified Badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0 12px', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700, fontSize: '0.9rem', color: '#0F172A' }}>
                  <Star size={15} fill="#F59E0B" color="#F59E0B" />
                  <span>{hotel.rating || '4.8'}</span>
                  <span style={{ color: '#64748B', fontWeight: 500, fontSize: '0.82rem' }}>({hotel.reviews_count || '1,230'} reviews)</span>
                </span>
                <span style={{ background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', padding: '2px 8px', borderRadius: 9999, fontSize: '0.72rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <ShieldCheck size={12} /> Verified Hotel
                </span>
              </div>

              <p className="hotel-desc-snippet">
                {hotel.description || 'A world of refined elegance and impeccable service. Experience unmatched luxury, world-class dining, and personalized hospitality tailored to your discerning tastes.'}
              </p>

              {/* Feature Pills Row */}
              <div className="hotel-feature-pills-row">
                <span className="hotel-feature-pill"><Building size={14} color="#0284C7" /> City View</span>
                <span className="hotel-feature-pill"><Sparkles size={14} color="#8B5CF6" /> Luxury Stay</span>
                <span className="hotel-feature-pill"><Utensils size={14} color="#D97706" /> Fine Dining</span>
                <span className="hotel-feature-pill"><Coffee size={14} color="#059669" /> Spa & Wellness</span>
                <span className="hotel-feature-pill"><Waves size={14} color="#2563EB" /> Swimming Pool</span>
              </div>
            </div>

            {/* Navigation Tabs Bar */}
            <div className="hotel-tabs-bar">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'rooms', label: 'Rooms' },
                { id: 'nearby', label: 'Explore Nearby', icon: Compass },
                { id: 'amenities', label: 'Amenities' },
                { id: 'reviews', label: 'Reviews' },
                { id: 'location', label: 'Location' },
                { id: 'policies', label: 'Policies' }
              ].map(tab => (
                <button
                  key={tab.id}
                  className={`hotel-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (tab.id === 'rooms') scrollToRooms();
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  {tab.icon && <tab.icon size={14} />}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Inline Mobile Booking Card Matching Reference Design */}
            <div className="hotel-booking-inline-mobile">
              <div className="hotel-booking-inline-top">
                <div>
                  <div className="hotel-booking-inline-price">
                    ₹{startingPrice.toLocaleString()} <span className="hotel-booking-inline-unit">/ night</span>
                  </div>
                  <div className="hotel-booking-inline-sub">Taxes included</div>
                </div>
                <button 
                  type="button" 
                  className="hotel-booking-inline-btn"
                  onClick={scrollToRooms}
                >
                  Select Rooms →
                </button>
              </div>

              <div className="hotel-booking-inline-dates">
                <span>📅 {checkIn} → {checkOut}</span>
                <span>•</span>
                <span>👥 {guests} Guests</span>
                <span>•</span>
                <span>🛏️ {roomsCount} Room</span>
              </div>

              <div className="hotel-booking-inline-guarantees">
                <span>Free cancellation</span>
                <span>• Pay at hotel</span>
                <span>• Instant confirmation</span>
              </div>
            </div>

            {/* Tab: Overview Content */}
            {activeTab === 'overview' && (
              <div>
                {/* 2-Column Split: About Property & Why Guests Love It */}
                <div className="hotel-overview-cards-grid">
                  {/* About Card */}
                  <div className="hotel-info-card">
                    <h3 className="hotel-info-card-title">About This Property</h3>
                    <p style={{ fontSize: '0.88rem', color: '#475569', lineHeight: 1.6, margin: '0 0 10px' }}>
                      {hotel.name} redefines luxury with its elegant rooms, world-class dining, personalized butler service, and breathtaking views. Perfectly located in the heart of {hotel.location}, it offers an extraordinary stay for business and leisure travelers alike.
                    </p>
                    {aboutExpanded && (
                      <p style={{ fontSize: '0.88rem', color: '#475569', lineHeight: 1.6, margin: '0 0 10px' }}>
                        Guests enjoy high-speed Wi-Fi, 24-hour room service, bespoke concierge arrangements, state-of-the-art wellness centers, and serene infinity pool access with private cabanas.
                      </p>
                    )}
                    <button 
                      type="button" 
                      onClick={() => setAboutExpanded(!aboutExpanded)} 
                      style={{ background: 'none', border: 'none', color: '#EA580C', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', padding: 0 }}
                    >
                      {aboutExpanded ? 'Read Less ∧' : 'Read More ∨'}
                    </button>
                  </div>

                  {/* Why Guests Love It Card */}
                  <div className="hotel-info-card">
                    <h3 className="hotel-info-card-title">Why Guests Love It</h3>
                    <ul className="hotel-why-love-list">
                      <li className="hotel-why-love-item">
                        <CheckCircle2 size={16} color="#059669" />
                        <span>Exceptional service & hospitality</span>
                      </li>
                      <li className="hotel-why-love-item">
                        <CheckCircle2 size={16} color="#059669" />
                        <span>Unrivaled luxury and comfort</span>
                      </li>
                      <li className="hotel-why-love-item">
                        <CheckCircle2 size={16} color="#059669" />
                        <span>Prime central location</span>
                      </li>
                      <li className="hotel-why-love-item">
                        <CheckCircle2 size={16} color="#059669" />
                        <span>Scenic city & skyline views</span>
                      </li>
                      <li className="hotel-why-love-item">
                        <CheckCircle2 size={16} color="#059669" />
                        <span>Award-winning dining options</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Key Amenities 8-Grid */}
                <div className="hotel-amenities-grid-8">
                  <div className="hotel-amenity-card-box">
                    <div className="hotel-amenity-icon-circle"><Wifi size={18} color="#2563EB" /></div>
                    <span className="hotel-amenity-label">Free Wi-Fi</span>
                    <span className="hotel-amenity-sub">High Speed</span>
                  </div>
                  <div className="hotel-amenity-card-box">
                    <div className="hotel-amenity-icon-circle"><Car size={18} color="#059669" /></div>
                    <span className="hotel-amenity-label">Parking Available</span>
                    <span className="hotel-amenity-sub">Free Valet</span>
                  </div>
                  <div className="hotel-amenity-card-box">
                    <div className="hotel-amenity-icon-circle"><Waves size={18} color="#0284C7" /></div>
                    <span className="hotel-amenity-label">Swimming Pool</span>
                    <span className="hotel-amenity-sub">Outdoor & Heated</span>
                  </div>
                  <div className="hotel-amenity-card-box">
                    <div className="hotel-amenity-icon-circle"><Sparkles size={18} color="#8B5CF6" /></div>
                    <span className="hotel-amenity-label">Spa & Wellness</span>
                    <span className="hotel-amenity-sub">Full Service</span>
                  </div>
                  <div className="hotel-amenity-card-box">
                    <div className="hotel-amenity-icon-circle"><Dumbbell size={18} color="#EA580C" /></div>
                    <span className="hotel-amenity-label">Fitness Center</span>
                    <span className="hotel-amenity-sub">24/7 Access</span>
                  </div>
                  <div className="hotel-amenity-card-box">
                    <div className="hotel-amenity-icon-circle"><Utensils size={18} color="#DC2626" /></div>
                    <span className="hotel-amenity-label">Fine Dining</span>
                    <span className="hotel-amenity-sub">Multiple Options</span>
                  </div>
                  <div className="hotel-amenity-card-box">
                    <div className="hotel-amenity-icon-circle"><Briefcase size={18} color="#475569" /></div>
                    <span className="hotel-amenity-label">Business Center</span>
                    <span className="hotel-amenity-sub">Meeting Rooms</span>
                  </div>
                  <div className="hotel-amenity-card-box">
                    <div className="hotel-amenity-icon-circle"><Dog size={18} color="#9333EA" /></div>
                    <span className="hotel-amenity-label">Pet Friendly</span>
                    <span className="hotel-amenity-sub">Amenities Available</span>
                  </div>
                </div>
              </div>
            )}

            {/* Rooms Section (Always rendered for smooth scroll & room inspection) */}
            <div ref={roomsSectionRef} style={{ paddingTop: 10 }}>
              <div className="hotel-rooms-section-header">
                <div>
                  <h2 className="hotel-rooms-section-title">Rooms Available</h2>
                  <p className="hotel-rooms-section-sub">Choose from our curated rooms for your perfect stay</p>
                </div>
                <button 
                  type="button" 
                  onClick={scrollToRooms}
                  style={{ background: 'none', border: 'none', color: '#EA580C', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <span>View All Rooms</span>
                  <ArrowRight size={14} />
                </button>
              </div>

              {/* Rooms List */}
              <div className="hotel-rooms-list">
                {availableRooms.map((room) => {
                  const roomPrice = Number(room.price) || startingPrice;
                  const roomImg = room.images?.[0]?.url || allPhotos[0];

                  return (
                    <div key={room.id || room.type} className="hotel-room-item-card">
                      {/* Room Thumbnail */}
                      <div className="hotel-room-thumb-box">
                        <img src={roomImg} alt={room.type} />
                      </div>

                      {/* Room Info */}
                      <div className="hotel-room-info-box">
                        <div>
                          <h3 className="hotel-room-name">{room.type}</h3>
                          <div className="hotel-room-specs">
                            <span>👥 {room.maxGuests || 2} Guests</span>
                            <span>•</span>
                            <span>🛏️ {room.bedType || '1 King Bed'}</span>
                            <span>•</span>
                            <span>📐 {room.roomSize || '350 sq.ft'}</span>
                          </div>
                          <p style={{ fontSize: '0.82rem', color: '#64748B', lineHeight: 1.4, margin: '0 0 8px' }}>
                            {room.description}
                          </p>
                          <div className="hotel-room-amenities-row">
                            {(room.amenities || ['Free Wi-Fi', 'AC', 'City View', 'Minibar']).slice(0, 4).map(a => (
                              <span key={a} className="hotel-room-amenity-tag">✓ {a}</span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Room Price & Action */}
                      <div className="hotel-room-price-box">
                        <div>
                          <div className="hotel-room-price-val">₹{roomPrice.toLocaleString()}</div>
                          <div className="hotel-room-price-unit">/ night</div>
                        </div>
                        <button 
                          type="button" 
                          className="hotel-room-select-btn"
                          onClick={() => {
                            setSelectedRoom(room);
                            setSelectRoomModal({ show: true, room });
                          }}
                        >
                          Select Room
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Nearby Attractions / Tourist Spots Section */}
            <div id="hotel-nearby-attractions-section" style={{ marginTop: 28, marginBottom: 36 }}>
              <NearbyAttractions
                hotelId={hotel.id}
                hotelName={hotel.name}
                hotelLatitude={hotel.latitude}
                hotelLongitude={hotel.longitude}
                hotelCity={hotel.city || hotel.location}
                showCitySelector={false}
              />
            </div>

          </div>

          {/* Right Sticky Sidebar Cards Column */}
          <div className="hotel-sidebar-sticky">
            
            {/* Card 1: Main Booking & Reservation Widget */}
            <div className="hotel-booking-widget-card">
              {/* Rating + Wishlist + Share Header */}
              <div className="hotel-booking-top-row">
                <div className="hotel-booking-rating-pill">
                  <span className="hotel-booking-rating-score">★ {hotel.rating || '4.8'}</span>
                  <span className="hotel-booking-rating-count">({hotel.reviews_count || '1,230'} reviews)</span>
                  <span className="hotel-booking-badge-verified">Verified Hotel</span>
                </div>

                <div className="hotel-booking-actions">
                  <button 
                    type="button" 
                    className="hotel-booking-icon-btn"
                    onClick={() => {
                      const added = toggleWishlist(hotel.id);
                      if (added) addToast(`Added "${hotel.name}" to wishlist!`, 'success');
                      else addToast(`Removed from wishlist`, 'info');
                    }}
                    title={isWishlisted(hotel.id) ? 'Remove from wishlist' : 'Save to wishlist'}
                  >
                    <Heart 
                      size={17} 
                      color={isWishlisted(hotel.id) ? '#EF4444' : '#64748B'} 
                      fill={isWishlisted(hotel.id) ? '#EF4444' : 'none'} 
                    />
                  </button>
                  <button 
                    type="button" 
                    className="hotel-booking-icon-btn"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      addToast('Hotel link copied to clipboard!', 'success');
                    }}
                    title="Share property"
                  >
                    <Share2 size={16} />
                  </button>
                </div>
              </div>

              {/* Big Price Display */}
              <div className="hotel-booking-price-row">
                <span className="hotel-booking-price-big">₹{startingPrice.toLocaleString()}</span>
                <span className="hotel-booking-price-period"> / night</span>
                <div className="hotel-booking-taxes-sub">Taxes and fees included</div>
              </div>

              {/* 2x2 Date & Guest Selection Box */}
              <div className="hotel-booking-inputs-box">
                {/* Top Row: Check-in / Check-out */}
                <div className="hotel-booking-input-row">
                  <div className="hotel-booking-cell right-border">
                    <span className="hotel-booking-cell-label"><Calendar size={12} color="#64748B" /> Check-in</span>
                    <input 
                      type="date" 
                      className="hotel-booking-cell-val" 
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                    />
                  </div>
                  <div className="hotel-booking-cell">
                    <span className="hotel-booking-cell-label"><Calendar size={12} color="#64748B" /> Check-out</span>
                    <input 
                      type="date" 
                      className="hotel-booking-cell-val" 
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                    />
                  </div>
                </div>

                {/* Bottom Row: Guests / Rooms */}
                <div className="hotel-booking-input-row top-divider">
                  <div className="hotel-booking-cell right-border">
                    <span className="hotel-booking-cell-label"><Users size={12} color="#64748B" /> Guests</span>
                    <select 
                      className="hotel-booking-cell-val"
                      value={guests}
                      onChange={(e) => setGuests(Number(e.target.value))}
                    >
                      {[1, 2, 3, 4, 5, 6].map(n => (
                        <option key={n} value={n}>{n} {n === 1 ? 'Guest' : 'Guests'}</option>
                      ))}
                    </select>
                  </div>
                  <div className="hotel-booking-cell">
                    <span className="hotel-booking-cell-label"><Bed size={12} color="#64748B" /> Rooms</span>
                    <select 
                      className="hotel-booking-cell-val"
                      value={roomsCount}
                      onChange={(e) => setRoomsCount(Number(e.target.value))}
                    >
                      {[1, 2, 3, 4].map(n => (
                        <option key={n} value={n}>{n} {n === 1 ? 'Room' : 'Rooms'}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Big Orange CTA Button */}
              <button 
                type="button" 
                className="hotel-booking-cta-btn"
                onClick={scrollToRooms}
              >
                <span>Browse & Select Rooms</span>
                <ArrowRight size={17} />
              </button>

              {/* Guarantee items */}
              <div className="hotel-booking-guarantees">
                <span className="hotel-booking-guarantee-item">
                  <Check size={13} color="#059669" strokeWidth={3} /> Free cancellation
                </span>
                <span className="hotel-booking-guarantee-item">
                  <CreditCard size={13} color="#64748B" /> Pay at hotel
                </span>
                <span className="hotel-booking-guarantee-item">
                  <Zap size={13} color="#EA580C" /> Instant confirmation
                </span>
              </div>
            </div>

            {/* Card 2: Location Card */}
            <div className="hotel-location-widget-card">
              <div className="hotel-location-header">
                <h3 className="hotel-location-title">Location</h3>
                <Link to={`/customer/find?location=${hotel.location}`} className="hotel-location-map-link">
                  View on Map →
                </Link>
              </div>

              {/* Mini Map Preview */}
              <div className="hotel-mini-map-wrap" onClick={() => navigate(`/customer/find?location=${hotel.location}`)} style={{ cursor: 'pointer' }}>
                <img 
                  src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=500" 
                  alt="Location Map Preview" 
                />
                <MapPin size={26} className="hotel-mini-map-pin" fill="#EF4444" color="#FFFFFF" />
              </div>

              <p className="hotel-location-address-p">{hotel.address || `${hotel.location}, India`}</p>
              <p className="hotel-location-subtext">Close to business districts, shopping and entertainment.</p>

              {/* Proximity Metrics */}
              <div className="hotel-location-distances-list">
                <div className="hotel-location-dist-item">
                  <Plane size={15} color="#0284C7" />
                  <span><strong>20 km</strong> from Airport</span>
                </div>
                <div className="hotel-location-dist-item">
                  <Train size={15} color="#059669" />
                  <span><strong>2 km</strong> from Railway Station</span>
                </div>
                <div className="hotel-location-dist-item">
                  <Building size={15} color="#8B5CF6" />
                  <span><strong>6 km</strong> from City Convention Centre</span>
                </div>
              </div>
            </div>

            {/* Card 3: What Our Guests Say (Review Card) */}
            <div className="hotel-reviews-widget-card">
              <div className="hotel-reviews-header">
                <h3 className="hotel-reviews-title">What Our Guests Say</h3>
                <span className="hotel-reviews-all-link">View All Reviews →</span>
              </div>
              <div className="hotel-reviews-count-sub">⭐ {hotel.rating || '4.8'} ({hotel.reviews_count || '1,230'} reviews)</div>

              <div className="hotel-review-testimonial-box">
                <div className="hotel-reviewer-row">
                  <div className="hotel-reviewer-avatar">
                    {guestReviewsList[activeReviewIdx].name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="hotel-reviewer-name">{guestReviewsList[activeReviewIdx].name}</div>
                    <div className="hotel-reviewer-time">{guestReviewsList[activeReviewIdx].time}</div>
                  </div>
                </div>

                <div className="hotel-reviewer-stars">★★★★★</div>
                <p className="hotel-reviewer-text">
                  "{guestReviewsList[activeReviewIdx].text}"
                </p>

                {/* Carousel Dots */}
                <div className="hotel-review-carousel-dots">
                  {guestReviewsList.map((_, idx) => (
                    <span 
                      key={idx} 
                      className={`hotel-review-dot ${activeReviewIdx === idx ? 'active' : ''}`}
                      onClick={() => setActiveReviewIdx(idx)}
                    />
                  ))}
                </div>
              </div>
            </div>

          </div>

        </div>



        {/* 4. Room Confirmation Modal (Luxury Bottom-Sheet & Centered Modal) */}
        {selectRoomModal.show && selectRoomModal.room && (
          <div className="room-modal-backdrop" onClick={() => setSelectRoomModal({ show: false, room: null })}>
            <div className="room-modal-card" onClick={(e) => e.stopPropagation()}>
              {/* Top Handle Bar for Mobile Bottom-Sheet */}
              <div className="room-modal-drag-handle" />

              {/* Modal Header */}
              <div className="room-modal-header">
                <h3 className="room-modal-title">Confirm Room Selection</h3>
                <button 
                  type="button" 
                  className="room-modal-close-btn"
                  onClick={() => setSelectRoomModal({ show: false, room: null })}
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              {/* 1. Room Summary Card */}
              <div className="room-modal-room-card">
                <img 
                  src={selectRoomModal.room.images?.[0]?.url || allPhotos[0]} 
                  alt={selectRoomModal.room.type} 
                  className="room-modal-room-img"
                />
                <div className="room-modal-room-info">
                  <h4 className="room-modal-room-name">{selectRoomModal.room.type}</h4>
                  <p className="room-modal-room-desc">
                    {selectRoomModal.room.description || 'Spacious room with city view and modern amenities.'}
                  </p>
                  <div className="room-modal-room-specs">
                    <span className="room-modal-spec-pill">
                      <Bed size={12} /> {selectRoomModal.room.bedType || '1 King Bed'}
                    </span>
                    <span className="room-modal-spec-pill">
                      <Maximize2 size={12} /> {selectRoomModal.room.roomSize || '350 sq.ft'}
                    </span>
                  </div>
                  <div className="room-modal-room-tags">
                    <span><Wifi size={11} /> Free Wi-Fi</span>
                    <span>•</span>
                    <span><Sparkles size={11} /> AC</span>
                    <span>•</span>
                    <span><Coffee size={11} /> Minibar</span>
                  </div>
                </div>
              </div>

              {/* 2. Booking Configuration Details Card */}
              <div className="room-modal-details-card">
                {/* Row 1: Dates */}
                <div className="room-modal-detail-row">
                  <div className="room-modal-detail-left">
                    <Calendar size={18} className="room-modal-detail-icon" />
                    <div>
                      <div className="room-modal-detail-label">Dates</div>
                      <div className="room-modal-detail-value">
                        {formatDateNice(checkIn)} - {formatDateNice(checkOut)}
                        <span className="room-modal-detail-sub"> ({nights} {nights === 1 ? 'night' : 'nights'})</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    className="room-modal-edit-btn"
                    onClick={() => setEditingModalField(editingModalField === 'dates' ? null : 'dates')}
                  >
                    <span>Edit</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
                {editingModalField === 'dates' && (
                  <div className="room-modal-inline-edit">
                    <div className="room-modal-edit-inputs">
                      <div>
                        <label>Check-in</label>
                        <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
                      </div>
                      <div>
                        <label>Check-out</label>
                        <input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Row 2: Guests */}
                <div className="room-modal-detail-row divider">
                  <div className="room-modal-detail-left">
                    <Users size={18} className="room-modal-detail-icon" />
                    <div>
                      <div className="room-modal-detail-label">Guests</div>
                      <div className="room-modal-detail-value">
                        {guests} {guests === 1 ? 'Guest' : 'Guests'}
                      </div>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    className="room-modal-edit-btn"
                    onClick={() => setEditingModalField(editingModalField === 'guests' ? null : 'guests')}
                  >
                    <span>Edit</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
                {editingModalField === 'guests' && (
                  <div className="room-modal-inline-edit">
                    <div className="room-modal-stepper">
                      <span>Number of guests:</span>
                      <div className="room-modal-counter-box">
                        <button type="button" onClick={() => setGuests(Math.max(1, guests - 1))}>-</button>
                        <span>{guests}</span>
                        <button type="button" onClick={() => setGuests(Math.min(10, guests + 1))}>+</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Row 3: Rooms */}
                <div className="room-modal-detail-row divider">
                  <div className="room-modal-detail-left">
                    <Bed size={18} className="room-modal-detail-icon" />
                    <div>
                      <div className="room-modal-detail-label">Rooms</div>
                      <div className="room-modal-detail-value">
                        {roomsCount} {roomsCount === 1 ? 'Room' : 'Rooms'}
                      </div>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    className="room-modal-edit-btn"
                    onClick={() => setEditingModalField(editingModalField === 'rooms' ? null : 'rooms')}
                  >
                    <span>Edit</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
                {editingModalField === 'rooms' && (
                  <div className="room-modal-inline-edit">
                    <div className="room-modal-stepper">
                      <span>Number of rooms:</span>
                      <div className="room-modal-counter-box">
                        <button type="button" onClick={() => setRoomsCount(Math.max(1, roomsCount - 1))}>-</button>
                        <span>{roomsCount}</span>
                        <button type="button" onClick={() => setRoomsCount(Math.min(5, roomsCount + 1))}>+</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Total Estimated Quote Banner */}
              <div className="room-modal-quote-banner">
                <div>
                  <div className="room-modal-quote-title">Total Estimated Quote</div>
                  <div className="room-modal-quote-sub">
                    ₹{(selectRoomModal.room.price || startingPrice).toLocaleString()} per night (approx.)
                    <Info size={12} style={{ display: 'inline', marginLeft: 4, verticalAlign: 'middle' }} />
                  </div>
                </div>
                <div className="room-modal-quote-price">
                  ₹{((selectRoomModal.room.price || startingPrice) * nights * roomsCount).toLocaleString()}
                </div>
              </div>

              {/* 4. Action Buttons */}
              <div className="room-modal-actions">
                <button 
                  type="button" 
                  onClick={() => setSelectRoomModal({ show: false, room: null })}
                  className="room-modal-btn-cancel"
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  onClick={() => handleSelectRoomSubmit(selectRoomModal.room)}
                  className="room-modal-btn-proceed"
                >
                  <span>Proceed with Request</span>
                  <ArrowRight size={16} />
                </button>
              </div>

              {/* 5. Security Note */}
              <div className="room-modal-security">
                <Lock size={12} />
                <span>Your details are secure with HotelIQ</span>
              </div>
            </div>
          </div>
        )}

        {/* 5. Full Gallery Lightbox Modal */}
        {galleryModalOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <button 
              type="button" 
              onClick={() => setGalleryModalOpen(false)}
              style={{ position: 'absolute', top: 24, right: 24, background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <X size={24} />
            </button>
            <div style={{ maxWidth: 900, width: '100%', maxHeight: '70vh', borderRadius: 16, overflow: 'hidden', position: 'relative' }}>
              <img src={allPhotos[activeImgIdx]} alt="Full view" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              <button 
                type="button"
                onClick={prevImage}
                style={{ position: 'absolute', top: '50%', left: 16, transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: 40, height: 40, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ChevronLeft size={24} />
              </button>
              <button 
                type="button"
                onClick={nextImage}
                style={{ position: 'absolute', top: '50%', right: 16, transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: 40, height: 40, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ChevronRight size={24} />
              </button>
            </div>
            <div style={{ color: 'white', marginTop: 16, fontSize: '0.9rem' }}>
              Photo {activeImgIdx + 1} of {allPhotos.length}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
