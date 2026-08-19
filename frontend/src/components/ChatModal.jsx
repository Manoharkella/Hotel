import { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function ChatModal({ leadId, hotelId, sender, onClose }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const { addToast } = useToast();

  const wsRef = useRef(null);

  useEffect(() => {
    // Initial fetch to get history
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

    // Setup WebSocket
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const defaultWsUrl = import.meta.env.PROD ? `${wsProtocol}//${window.location.host}` : 'ws://localhost:8080';
    const wsUrl = import.meta.env.VITE_WS_URL || defaultWsUrl;
    const ws = new WebSocket(`${wsUrl}/api/ws/chat/${leadId}/${hotelId}`);
    ws.onmessage = (event) => {
      const newMsg = JSON.parse(event.data);
      setMessages(prev => [...prev, newMsg]);
    };
    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
    };
    wsRef.current = ws;

    return () => {
      ws.close();
    };
  }, [leadId, hotelId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    try {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          sender: sender,
          text: inputText
        }));
        setInputText('');
      } else {
        addToast('Connection lost. Please try again.', 'error');
      }
    } catch (err) {
      addToast('Failed to send message', 'error');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500, height: '80vh', display: 'flex', flexDirection: 'column' }}>
        <div className="flex-between" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 16, marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontFamily: 'var(--font-serif)' }}>Chat</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
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
