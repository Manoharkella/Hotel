import { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useApp } from '../context/AppContext';
import { playNotificationSound } from './NotificationListener';

export default function ChatModal({ leadId, hotelId, sender, onClose }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const { addToast } = useToast();
  const { hotels, leads } = useApp();

  const hotel = hotels.find(h => h.id?.toString() === hotelId?.toString());
  const lead = leads.find(l => l.id?.toString() === leadId?.toString());
  const partnerName = sender === 'customer' 
    ? (hotel?.name || 'Hotel Partner') 
    : (lead?.customerName || 'Guest User');

  const wsRef = useRef(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await api.getMessages(leadId, hotelId);
        setMessages(data);
      } catch (err) {
        console.error('Error fetching messages', err);
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
      
      // Play sound and show notification if received from partner
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

    // Fallback periodic sync every 3s
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
    }, 3000);

    return () => {
      ws.close();
      clearInterval(pollInterval);
    };
  }, [leadId, hotelId, sender, partnerName]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    const textToSend = inputText;
    setInputText('');
    
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        sender: sender,
        text: textToSend
      }));
    } else {
      // Fallback to HTTP POST if WebSocket connection isn't open
      try {
        const sentMsg = await api.sendMessage({
          lead_id: parseInt(leadId),
          hotel_id: parseInt(hotelId),
          sender: sender,
          text: textToSend
        });
        setMessages(prev => [...prev, sentMsg]);
      } catch (err) {
        setInputText(textToSend);
        addToast('Connection lost. Please try again.', 'error');
      }
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500, height: '80vh', display: 'flex', flexDirection: 'column' }}>
        <div className="flex-between" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 12, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 700 }}>
              {sender === 'customer' ? '🏨' : '👤'}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text)' }}>{partnerName}</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: '#16a34a' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} />
                <span>Live Negotiation Chat</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-muted)' }}>✕</button>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
          ) : messages.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', margin: 'auto' }}>No messages yet. Start the conversation!</div>
          ) : (
            messages.map((msg, idx) => {
              const isMine = msg.sender === sender;
              return (
                <div key={idx} style={{ alignSelf: isMine ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                  <div style={{ 
                    background: isMine ? 'var(--primary)' : 'var(--bg)', 
                    color: isMine ? '#fff' : 'var(--text)', 
                    padding: '10px 14px', 
                    borderRadius: '16px',
                    borderBottomRightRadius: isMine ? 0 : '16px',
                    borderBottomLeftRadius: isMine ? '16px' : 0,
                    boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                  }}>
                    {msg.text}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4, textAlign: isMine ? 'right' : 'left' }}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
          <input 
            type="text" 
            className="form-input" 
            placeholder="Type your message..." 
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            style={{ flex: 1 }}
          />
          <button className="btn btn-primary" onClick={handleSend}>Send</button>
        </div>
      </div>
    </div>
  );
}
