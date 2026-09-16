import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function NotificationDropdown({ role = 'hotel', userId, isDark = false, lightNav = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  
  const { 
    notifications, 
    markNotificationsRead, 
    markSingleNotificationRead, 
    clearNotifications, 
    openChat 
  } = useApp();

  // Filter notifications for this role / user
  const userNotifications = notifications.filter(n => {
    if (role === 'admin') {
      return n.role === 'admin' || n.userId?.toString() === userId?.toString();
    } else if (role === 'hotel') {
      return n.userId?.toString() === userId?.toString() || n.role === 'hotel';
    } else {
      return n.role === 'customer' || n.userId?.toString() === userId?.toString();
    }
  });

  const unreadCount = userNotifications.filter(n => !n.read).length;

  // Auto-close on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = () => {
    if (window.innerWidth <= 640 && role === 'customer') {
      navigate('/customer/notifications');
    } else {
      setIsOpen(prev => !prev);
    }
  };

  const handleMarkAllRead = (e) => {
    e.stopPropagation();
    markNotificationsRead(userId, role);
  };

  const handleClearAll = (e) => {
    e.stopPropagation();
    clearNotifications(userId, role);
  };

  const handleItemClick = (n) => {
    if (markSingleNotificationRead) {
      markSingleNotificationRead(n.id);
    }
    if (n.link) {
      navigate(n.link);
      setIsOpen(false);
      return;
    }
    if (n.leadId && n.hotelId && openChat) {
      openChat({ 
        leadId: n.leadId, 
        hotelId: n.hotelId, 
        sender: role === 'hotel' ? 'hotel' : 'customer' 
      });
      setIsOpen(false);
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diffMin = Math.floor((now - d) / 60000);
      if (diffMin < 1) return 'Just now';
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHours = Math.floor(diffMin / 60);
      if (diffHours < 24) {
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  // Color variables depending on theme
  const bgSolid = isDark ? '#181a1f' : '#ffffff';
  const borderCol = isDark ? '#2e333d' : '#e2e8f0';
  const textColor = isDark ? '#f8fafc' : '#0f172a';
  const textMuted = isDark ? '#94a3b8' : '#64748b';
  const itemHover = isDark ? '#22262f' : '#f8fafc';
  const itemUnreadBg = isDark ? '#1e2533' : '#f0f7ff';

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        aria-label="Notifications"
        style={{
          background: isDark ? 'rgba(255,255,255,0.06)' : 'transparent',
          border: `1px solid ${lightNav ? 'rgba(255,255,255,0.4)' : (isDark ? '#333842' : 'var(--border)')}`,
          width: 38,
          height: 38,
          borderRadius: '50%',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: lightNav ? '#ffffff' : (isDark ? '#ffffff' : 'var(--text)'),
          position: 'relative',
          transition: 'all 0.2s ease',
          outline: 'none',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>

        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: -3,
              right: -3,
              background: '#ef4444',
              color: '#ffffff',
              fontSize: '0.68rem',
              fontWeight: 700,
              minWidth: 18,
              height: 18,
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              border: `2px solid ${isDark ? '#111' : '#ffffff'}`,
              boxShadow: '0 2px 5px rgba(239, 68, 68, 0.4)',
              animation: 'pulseBadge 2s infinite'
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 10px)',
            right: 0,
            width: 370,
            maxWidth: 'calc(100vw - 32px)',
            background: bgSolid,
            border: `1px solid ${borderCol}`,
            borderRadius: 16,
            boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.22), 0 0 1px rgba(0, 0, 0, 0.1)',
            zIndex: 99999,
            overflow: 'hidden',
            animation: 'dropdownFadeIn 0.18s ease-out'
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '14px 18px',
              borderBottom: `1px solid ${borderCol}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: isDark ? '#15171b' : '#fafafa'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '1rem' }}>🔔</span>
              <span style={{ fontWeight: 700, fontSize: '0.92rem', color: textColor }}>
                Notifications
              </span>
              {unreadCount > 0 ? (
                <span
                  style={{
                    background: isDark ? 'rgba(59, 130, 246, 0.2)' : '#e0f2fe',
                    color: isDark ? '#93c5fd' : '#0284c7',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: 12
                  }}
                >
                  {unreadCount} new
                </span>
              ) : (
                <span
                  style={{
                    background: isDark ? 'rgba(34, 197, 94, 0.15)' : '#dcfce7',
                    color: isDark ? '#4ade80' : '#16a34a',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    padding: '2px 7px',
                    borderRadius: 12
                  }}
                >
                  Caught up
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: isDark ? '#60a5fa' : '#2563eb',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: '4px 6px',
                    borderRadius: 4
                  }}
                  title="Mark all as read"
                >
                  Mark read
                </button>
              )}
              {userNotifications.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: textMuted,
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    padding: '4px 6px',
                    borderRadius: 4
                  }}
                  title="Clear all notifications"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Notification List */}
          <div style={{ maxHeight: 380, overflowY: 'auto' }}>
            {userNotifications.length === 0 ? (
              <div style={{ padding: '36px 20px', textAlign: 'center' }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    margin: '0 auto 12px',
                    borderRadius: '50%',
                    background: isDark ? '#262a33' : '#f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.4rem',
                    color: textMuted
                  }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                  </svg>
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: textColor, marginBottom: 4 }}>
                  No notifications yet
                </div>
                <div style={{ fontSize: '0.8rem', color: textMuted, maxWidth: 240, margin: '0 auto', lineHeight: 1.4 }}>
                  New messages, booking alerts, and quotation updates will show up here instantly.
                </div>
              </div>
            ) : (
              userNotifications.map(n => {
                const isMsg = n.type === 'message' || !!n.leadId;
                const isHotelReg = n.type === 'hotel_registration';
                const isUnread = !n.read;
                const isClickable = Boolean(n.link || n.leadId);

                return (
                  <div
                    key={n.id}
                    onClick={() => handleItemClick(n)}
                    style={{
                      padding: '13px 16px',
                      borderBottom: `1px solid ${borderCol}`,
                      background: isUnread ? itemUnreadBg : 'transparent',
                      cursor: isClickable ? 'pointer' : 'default',
                      display: 'flex',
                      gap: 12,
                      alignItems: 'flex-start',
                      transition: 'background 0.15s ease',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = isUnread 
                        ? (isDark ? '#263147' : '#e6f0fa') 
                        : itemHover;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = isUnread 
                        ? itemUnreadBg 
                        : 'transparent';
                    }}
                  >
                    {/* Left Icon Badge */}
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        flexShrink: 0,
                        background: isHotelReg
                          ? (isDark ? 'rgba(236, 72, 153, 0.2)' : '#FCE7F3')
                          : isMsg 
                          ? (isDark ? 'rgba(59, 130, 246, 0.2)' : '#e0f2fe') 
                          : (isDark ? 'rgba(212, 175, 55, 0.2)' : '#fef3c7'),
                        color: isHotelReg
                          ? '#DB2777'
                          : isMsg ? '#0284c7' : '#d97706',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1rem',
                        marginTop: 2
                      }}
                    >
                      {isHotelReg ? '🏨' : isMsg ? '💬' : '🔔'}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
                        <span
                          style={{
                            fontWeight: isUnread ? 700 : 600,
                            fontSize: '0.86rem',
                            color: textColor,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: 190
                          }}
                        >
                          {n.title || (isHotelReg ? 'New Hotel Registration' : isMsg ? 'New Message' : 'Notification')}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: textMuted, flexShrink: 0 }}>
                          {formatTime(n.createdAt)}
                        </span>
                      </div>

                      <div
                        style={{
                          fontSize: '0.82rem',
                          color: isDark ? '#cbd5e1' : '#475569',
                          lineHeight: 1.45,
                          marginBottom: (n.leadId || n.link) ? 6 : 0,
                          overflow: 'hidden',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          wordBreak: 'break-word'
                        }}
                      >
                        {n.message}
                      </div>

                      {n.link && (
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: '0.72rem',
                            color: isDark ? '#f472b6' : '#db2777',
                            fontWeight: 700,
                            marginTop: 4
                          }}
                        >
                          <span>Review & Approve</span>
                          <span style={{ fontSize: '0.8rem' }}>→</span>
                        </div>
                      )}

                      {n.leadId && !n.link && (
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: '0.72rem',
                            color: isDark ? '#60a5fa' : '#2563eb',
                            fontWeight: 600
                          }}
                        >
                          <span>Open chat</span>
                          <span style={{ fontSize: '0.8rem' }}>→</span>
                        </div>
                      )}
                    </div>

                    {/* Unread Dot */}
                    {isUnread && (
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: isHotelReg ? '#ec4899' : '#2563eb',
                          marginTop: 6,
                          flexShrink: 0
                        }}
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Status */}
          <div
            style={{
              padding: '9px 16px',
              background: isDark ? '#121417' : '#f8fafc',
              borderTop: `1px solid ${borderCol}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.72rem',
              color: textMuted
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#22c55e',
                  display: 'inline-block',
                  boxShadow: '0 0 6px rgba(34, 197, 94, 0.6)'
                }}
              />
              <span>Live real-time sync active</span>
            </div>
            <span>Auto-refresh</span>
          </div>
        </div>
      )}

      {/* Inline animation keyframes */}
      <style>{`
        @keyframes dropdownFadeIn {
          from {
            opacity: 0;
            transform: translateY(-6px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes pulseBadge {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.12);
          }
        }
      `}</style>
    </div>
  );
}
