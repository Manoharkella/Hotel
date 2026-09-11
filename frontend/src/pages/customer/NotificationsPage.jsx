import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { 
  Check, 
  FileText, 
  MessageSquare, 
  Settings, 
  Calendar, 
  Users, 
  ChevronRight, 
  Radio, 
  ExternalLink,
  Bell,
  Sparkles,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import ChatModal from '../../components/ChatModal';

export default function NotificationsPage() {
  const { 
    notifications, 
    markNotificationsRead, 
    markSingleNotificationRead, 
    clearNotifications,
    hotels,
    leads,
    quotes
  } = useApp();
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'quotes' | 'messages' | 'system'
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [chatInfo, setChatInfo] = useState(null);

  const customerId = user?.id || 1;

  // Curated demo list if fresh
  const defaultNotifications = useMemo(() => [
    {
      id: 'demo-quote-1',
      userId: customerId,
      role: 'customer',
      type: 'quote',
      theme: 'orange',
      badge: 'NEW QUOTE',
      time: '11:43 AM',
      hotelId: 1,
      hotelName: 'Radisson Blu',
      title: 'New Quote from Radisson Blu',
      offeredRate: 9500,
      dates: '11 Sep – 14 Sep 2026',
      nights: 3,
      guests: 2,
      leadId: 1,
      read: false,
      createdAt: new Date().toISOString()
    },
    {
      id: 'demo-quote-2',
      userId: customerId,
      role: 'customer',
      type: 'quote',
      theme: 'blue',
      badge: 'NEW QUOTE',
      time: '11:43 AM',
      hotelId: 1,
      hotelName: 'Radisson Blu',
      title: 'New Quote from Radisson Blu',
      offeredRate: 9000,
      dates: '11 Sep – 14 Sep 2026',
      nights: 3,
      guests: 2,
      leadId: 1,
      read: false,
      createdAt: new Date(Date.now() - 60000).toISOString()
    },
    {
      id: 'demo-msg-1',
      userId: customerId,
      role: 'customer',
      type: 'message',
      theme: 'green',
      badge: 'NEW MESSAGE',
      time: '8 Sept',
      hotelId: 1,
      hotelName: 'Radisson Blu',
      title: 'New message from Radisson Blu',
      message: 'We would be happy to assist you with your stay. Please let us know your preferred meal plan.',
      leadId: 1,
      read: false,
      createdAt: new Date(Date.now() - 3600000 * 48).toISOString()
    },
    {
      id: 'demo-trip-1',
      userId: customerId,
      role: 'customer',
      type: 'system',
      theme: 'purple',
      badge: 'TRIP UPDATE',
      time: '7 Sept',
      hotelId: 2,
      hotelName: 'Taj Grand Vizag',
      title: 'Your trip request was sent',
      message: 'Your request for Taj Grand Vizag has been sent successfully.',
      leadId: 2,
      read: true,
      createdAt: new Date(Date.now() - 3600000 * 72).toISOString()
    }
  ], [customerId]);

  const allItems = useMemo(() => {
    const userNotifs = notifications.filter(n => n.role === 'customer' || n.userId?.toString() === customerId?.toString());
    if (userNotifs.length === 0) return defaultNotifications;

    return userNotifs.map(n => {
      const hotel = hotels.find(h => h.id?.toString() === n.hotelId?.toString());
      const lead = leads.find(l => l.id?.toString() === n.leadId?.toString());
      const isQuote = n.type === 'quote';
      const isMsg = n.type === 'message';

      return {
        ...n,
        theme: isQuote ? (n.id?.includes('2') ? 'blue' : 'orange') : isMsg ? 'green' : 'purple',
        badge: isQuote ? 'NEW QUOTE' : isMsg ? 'NEW MESSAGE' : 'TRIP UPDATE',
        time: n.time || (n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '11:43 AM'),
        hotelName: n.hotelName || hotel?.name || 'Radisson Blu',
        offeredRate: n.offeredRate || (isQuote ? 9500 : null),
        dates: n.dates || (lead ? `${lead.checkIn || '11 Sep'} – ${lead.checkOut || '14 Sep 2026'}` : '11 Sep – 14 Sep 2026'),
        nights: n.nights || 3,
        guests: n.guests || lead?.guests || 2
      };
    });
  }, [notifications, customerId, defaultNotifications, hotels, leads]);

  // Counts for tabs
  const quotesCount = allItems.filter(n => n.type === 'quote').length;
  const messagesCount = allItems.filter(n => n.type === 'message').length;
  const systemCount = allItems.filter(n => n.type === 'system' || n.type === 'lead').length;

  const filteredItems = useMemo(() => {
    if (activeTab === 'quotes') return allItems.filter(n => n.type === 'quote');
    if (activeTab === 'messages') return allItems.filter(n => n.type === 'message');
    if (activeTab === 'system') return allItems.filter(n => n.type === 'system' || n.type === 'lead');
    return allItems;
  }, [allItems, activeTab]);

  const handleMarkAllRead = () => {
    markNotificationsRead(customerId);
    addToast('All notifications marked as read', 'info');
  };

  const handleOpenChat = (item) => {
    if (markSingleNotificationRead) {
      markSingleNotificationRead(item.id);
    }
    setChatInfo({
      hotelId: item.hotelId || 1,
      hotelName: item.hotelName || 'Radisson Blu',
      leadId: item.leadId || 1,
      dates: item.dates ? `${item.dates}` : '11 Sep – 14 Sep 2026',
      guests: `${item.guests || 2} Guests`,
      sender: 'customer'
    });
  };

  const handleViewQuote = (item) => {
    if (markSingleNotificationRead) {
      markSingleNotificationRead(item.id);
    }
    navigate(`/customer/trips?tab=requests`);
  };

  return (
    <div className="notif-page-container fade-in">
      
      {/* Top Title & Mark all as read */}
      <div className="notif-header-row">
        <div>
          <h1 className="notif-main-title">Notifications</h1>
          <p className="notif-main-subtitle">
            Stay updated with your quotes, messages and more.
          </p>
        </div>

        <button 
          type="button" 
          className="notif-mark-read-btn"
          onClick={handleMarkAllRead}
        >
          <Check size={14} color="#EA580C" />
          <span>Mark all as read</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="notif-filter-tabs">
        <button 
          type="button" 
          className={`notif-filter-tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          <span className="notif-tab-dot" />
          <span>All ({allItems.length})</span>
        </button>

        <button 
          type="button" 
          className={`notif-filter-tab ${activeTab === 'quotes' ? 'active' : ''}`}
          onClick={() => setActiveTab('quotes')}
        >
          <FileText size={13} />
          <span>Quotes ({quotesCount})</span>
        </button>

        <button 
          type="button" 
          className={`notif-filter-tab ${activeTab === 'messages' ? 'active' : ''}`}
          onClick={() => setActiveTab('messages')}
        >
          <MessageSquare size={13} />
          <span>Messages ({messagesCount})</span>
        </button>

        <button 
          type="button" 
          className={`notif-filter-tab ${activeTab === 'system' ? 'active' : ''}`}
          onClick={() => setActiveTab('system')}
        >
          <Settings size={13} />
          <span>System ({systemCount})</span>
        </button>
      </div>

      {/* Notifications Cards List */}
      <div className="notif-cards-list">
        {filteredItems.length === 0 ? (
          <div className="notif-empty-state">
            <Bell size={36} color="#CBD5E1" />
            <h3 style={{ margin: '10px 0 4px', fontSize: '1.05rem', color: '#0F172A', fontWeight: 800 }}>
              No notifications
            </h3>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748B' }}>
              You are all caught up!
            </p>
          </div>
        ) : (
          filteredItems.map((item, idx) => {
            const isUnread = !item.read;

            return (
              <div 
                key={item.id || idx} 
                className={`notif-card theme-${item.theme || 'orange'} ${isUnread ? 'unread' : ''}`}
              >
                
                {/* Left Icon with Unread Red Dot */}
                <div className="notif-avatar-wrapper">
                  {isUnread && <span className="notif-unread-dot" />}
                  <div className={`notif-avatar-circle theme-${item.theme || 'orange'}`}>
                    {item.type === 'quote' && <FileText size={18} />}
                    {item.type === 'message' && <MessageSquare size={18} />}
                    {item.type === 'system' && <Calendar size={18} />}
                  </div>
                </div>

                {/* Right Content */}
                <div className="notif-card-body">
                  
                  {/* Badge & Timestamp Row */}
                  <div className="notif-card-top-row">
                    <span className={`notif-type-badge theme-${item.theme || 'orange'}`}>
                      {item.badge}
                    </span>
                    <div className="notif-card-time-group">
                      <span className="notif-time-text">{item.time}</span>
                      <ChevronRight size={14} color="#94A3B8" />
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="notif-card-title">{item.title}</h3>

                  {/* Body details depending on type */}
                  {item.type === 'quote' && (
                    <div className="notif-quote-details">
                      <div className="notif-rate-text">
                        Offered rate: <strong>₹{Number(item.offeredRate || 9500).toLocaleString()}</strong>
                      </div>
                      <div className="notif-specs-subrow">
                        <span>📅 {item.dates} ({item.nights} nights)</span>
                        <span>👥 {item.guests} Guests</span>
                      </div>
                    </div>
                  )}

                  {(item.type === 'message' || item.type === 'system') && (
                    <p className="notif-desc-text">
                      {item.message}
                    </p>
                  )}

                  {/* Action Buttons Row */}
                  <div className="notif-actions-row">
                    {item.type === 'quote' && (
                      <>
                        <button 
                          type="button" 
                          className={`notif-btn-action primary theme-${item.theme || 'orange'}`}
                          onClick={() => handleOpenChat(item)}
                        >
                          <MessageSquare size={13} />
                          <span>Open Chat</span>
                        </button>

                        <button 
                          type="button" 
                          className="notif-btn-action outline"
                          onClick={() => handleViewQuote(item)}
                        >
                          <span>View Quote</span>
                        </button>
                      </>
                    )}

                    {item.type === 'message' && (
                      <>
                        <button 
                          type="button" 
                          className="notif-btn-action primary theme-green"
                          onClick={() => handleOpenChat(item)}
                        >
                          <MessageSquare size={13} />
                          <span>Open Chat</span>
                        </button>

                        <button 
                          type="button" 
                          className="notif-btn-action outline"
                          onClick={() => handleOpenChat(item)}
                        >
                          <span>View Message</span>
                        </button>
                      </>
                    )}

                    {item.type === 'system' && (
                      <button 
                        type="button" 
                        className="notif-btn-action outline theme-purple"
                        onClick={() => navigate('/customer/trips?tab=requests')}
                      >
                        <ExternalLink size={13} />
                        <span>View Trip</span>
                      </button>
                    )}
                  </div>

                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Bottom Live Real-Time Sync Bar */}
      <div className="notif-sync-bar">
        <div className="notif-sync-left">
          <div className="notif-sync-icon-box">
            <Radio size={14} color="#10B981" />
          </div>
          <div>
            <div className="notif-sync-title">Live real-time sync active</div>
            <div className="notif-sync-sub">You'll get notified instantly</div>
          </div>
        </div>

        <div className="notif-sync-divider" />

        <div className="notif-sync-right">
          <span className="notif-sync-auto-label">Auto-refresh</span>
          <label className="notif-toggle-switch">
            <input 
              type="checkbox" 
              checked={autoRefresh} 
              onChange={e => setAutoRefresh(e.target.checked)} 
            />
            <span className="notif-toggle-slider" />
          </label>
        </div>
      </div>

      {/* Interactive Chat Modal */}
      {chatInfo && (
        <ChatModal
          leadId={chatInfo.leadId}
          hotelId={chatInfo.hotelId}
          hotelName={chatInfo.hotelName}
          dates={chatInfo.dates}
          guests={chatInfo.guests}
          sender="customer"
          onClose={() => setChatInfo(null)}
        />
      )}

    </div>
  );
}
