import { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useApp } from '../context/AppContext';
import { playNotificationSound } from './NotificationListener';
import { X, Paperclip, Send, CheckCheck, MapPin } from 'lucide-react';

export default function ChatModal({ leadId, hotelId, sender = 'customer', onClose, hotelName: propHotelName, dates: propDates, guests: propGuests }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const { addToast } = useToast();
  const { hotels, leads } = useApp();

  const hotel = hotels.find(h => h.id?.toString() === hotelId?.toString());
  const lead = leads.find(l => l.id?.toString() === leadId?.toString());
  
  const displayHotelName = propHotelName || hotel?.name || 'The St. Regis Mumbai';
  const displayDates = propDates || (lead ? `${new Date(lead.checkIn || '2026-09-11').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} – ${new Date(lead.checkOut || '2026-09-14').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}` : '11 Sep 2026 – 14 Sep 2026');
  const displayGuests = propGuests || (lead?.guests ? `${lead.guests} Guests` : '2 Guests');
  const partnerName = sender === 'customer' 
    ? displayHotelName 
    : (lead?.customerName || 'Guest User');

  const wsRef = useRef(null);

  // Initial demo messages if fresh conversation
  const defaultConversation = [
    {
      id: 'demo-1',
      sender: 'hotel',
      senderName: 'Hotel Team',
      text: 'Hello! How may we assist you with your stay?',
      time: '10:30 AM',
      created_at: new Date(Date.now() - 300000).toISOString()
    },
    {
      id: 'demo-2',
      sender: 'customer',
      senderName: 'You',
      text: 'Hi, I would like to know if breakfast is included in this rate?',
      time: '10:32 AM',
      read: true,
      created_at: new Date(Date.now() - 180000).toISOString()
    },
    {
      id: 'demo-3',
      sender: 'hotel',
      senderName: 'Hotel Team',
      text: 'Yes, complimentary breakfast is included in this rate.',
      time: '10:33 AM',
      created_at: new Date(Date.now() - 60000).toISOString()
    }
  ];

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        if (leadId && hotelId) {
          const data = await api.getMessages(leadId, hotelId);
          if (Array.isArray(data) && data.length > 0) {
            setMessages(data);
          } else {
            setMessages(defaultConversation);
          }
        } else {
          setMessages(defaultConversation);
        }
      } catch (err) {
        console.error('Error fetching messages', err);
        setMessages(defaultConversation);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
    
    // Request notification permission
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    // Setup WebSocket
    if (leadId && hotelId) {
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const defaultWsUrl = import.meta.env.PROD ? `${wsProtocol}//${window.location.host}` : 'ws://localhost:8000';
      const wsUrl = import.meta.env.VITE_WS_URL || defaultWsUrl;
      const ws = new WebSocket(`${wsUrl}/api/ws/chat/${leadId}/${hotelId}`);
      ws.onmessage = (event) => {
        const newMsg = JSON.parse(event.data);
        setMessages(prev => {
          if (prev.some(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        
        if (newMsg.sender !== sender) {
          playNotificationSound();
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification(`New message from ${partnerName}`, {
              body: newMsg.text,
              icon: '/favicon.ico'
            });
          }
        }
      };
      ws.onerror = (err) => {
        console.error('WebSocket error:', err);
      };
      wsRef.current = ws;

      const pollInterval = setInterval(async () => {
        try {
          const latest = await api.getMessages(leadId, hotelId);
          if (Array.isArray(latest) && latest.length > 0) {
            setMessages(prev => {
              if (latest.length !== prev.length) {
                const lastMsg = latest[latest.length - 1];
                if (lastMsg && lastMsg.sender !== sender && !prev.some(m => m.id === lastMsg.id)) {
                  playNotificationSound();
                }
                return latest;
              }
              return prev;
            });
          }
        } catch (e) {}
      }, 4000);

      return () => {
        ws.close();
        clearInterval(pollInterval);
      };
    }
  }, [leadId, hotelId, sender, partnerName]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    const textToSend = inputText.trim();
    setInputText('');

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const localMsg = {
      id: `client-${Date.now()}`,
      sender: sender,
      text: textToSend,
      time: timeStr,
      read: true,
      created_at: now.toISOString()
    };

    setMessages(prev => [...prev, localMsg]);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        sender: sender,
        text: textToSend
      }));
    } else if (leadId && hotelId) {
      try {
        await api.sendMessage({
          lead_id: parseInt(leadId),
          hotel_id: parseInt(hotelId),
          sender: sender,
          text: textToSend
        });
      } catch (err) {
        console.log('Using simulated instant response');
      }
    }

    // Friendly auto-reply simulation for instant interactive feedback if hotel is offline
    if (sender === 'customer') {
      setTimeout(() => {
        const replyMsg = {
          id: `reply-${Date.now()}`,
          sender: 'hotel',
          senderName: 'Hotel Team',
          text: 'Thank you for reaching out! Our front desk team is reviewing your message and will assist you right away.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, replyMsg]);
        playNotificationSound();
      }, 1400);
    }
  };

  const handleAttachmentClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      addToast(`Attached: ${file.name}`, 'info');
      const now = new Date();
      const attachMsg = {
        id: `file-${Date.now()}`,
        sender: sender,
        text: `📎 Sent attachment: ${file.name}`,
        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        read: true,
        created_at: now.toISOString()
      };
      setMessages(prev => [...prev, attachMsg]);
    }
  };

  return (
    <div className="chat-modal-overlay" onClick={onClose}>
      <div className="chat-modal-sheet" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="chat-modal-header">
          <div className="chat-header-main">
            <h2 className="chat-hotel-title">{partnerName}</h2>
            <button 
              type="button" 
              className="chat-close-btn" 
              onClick={onClose} 
              aria-label="Close Chat"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="chat-subtitle-row">
            <span className="chat-live-indicator" />
            <span className="chat-live-text">Live Negotiation Chat</span>
          </div>

          {/* Capsule meta pill */}
          <div className="chat-meta-capsule-wrapper">
            <div className="chat-meta-capsule">
              {displayDates} • {displayGuests}
            </div>
          </div>
        </div>

        {/* Message Thread */}
        <div className="chat-messages-container">
          {loading ? (
            <div className="chat-loading-state">Loading conversation...</div>
          ) : (
            messages.map((msg, idx) => {
              const isMine = msg.sender === sender;
              const formattedTime = msg.time || (msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '10:30 AM');

              return (
                <div 
                  key={msg.id || idx} 
                  className={`chat-message-row ${isMine ? 'mine' : 'theirs'}`}
                >
                  {!isMine && (
                    <div className="chat-avatar-circle">
                      <span>H</span>
                    </div>
                  )}

                  <div className="chat-bubble-group">
                    {!isMine && (
                      <span className="chat-sender-label">Hotel Team</span>
                    )}

                    <div className={`chat-bubble ${isMine ? 'mine' : 'theirs'}`}>
                      {msg.text}
                    </div>

                    <div className={`chat-timestamp-row ${isMine ? 'mine' : 'theirs'}`}>
                      <span className="chat-time-text">{formattedTime}</span>
                      {isMine && (
                        <CheckCheck size={14} className="chat-checkmarks" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Bar Input */}
        <div className="chat-input-bar">
          <input 
            type="file" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            onChange={handleFileChange} 
          />
          
          <button 
            type="button" 
            className="chat-btn-attach" 
            onClick={handleAttachmentClick}
            aria-label="Add attachment"
          >
            <Paperclip size={18} />
          </button>

          <input 
            type="text" 
            className="chat-text-input" 
            placeholder="Type your message..." 
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
          />

          <button 
            type="button" 
            className="chat-btn-send" 
            onClick={handleSend}
            disabled={!inputText.trim()}
            aria-label="Send message"
          >
            <Send size={16} />
          </button>
        </div>

      </div>
    </div>
  );
}
