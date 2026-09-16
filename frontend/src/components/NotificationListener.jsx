import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import ChatModal from './ChatModal';

export function playNotificationSound() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // Play a friendly, crisp two-tone chime (D5 then A5)
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.setValueAtTime(880.00, now + 0.12); // A5

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  } catch (err) {
    // AudioContext blocked before first user gesture, safe to ignore
  }
}

export default function NotificationListener() {
  const { user } = useAuth();
  const { addNotification, openChat, globalChat, closeChat, hotels, leads, quotes } = useApp();
  const { addToast } = useToast();
  const processedMessageIds = useRef(new Set());
  const processedLeadIds = useRef(new Set());
  const processedQuoteIds = useRef(new Set());
  const isInitialized = useRef(false);

  useEffect(() => {
    // Request desktop notification permission on mount
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Monitor Leads & Quotes in real-time
  useEffect(() => {
    if (!user) return;
    const currentUserId = user.role === 'hotel' ? (user.hotelId || user.id).toString() : user.id?.toString();

    // 1. Check for incoming leads (if user is Hotel)
    if (user.role === 'hotel' && Array.isArray(leads)) {
      const hotelLeads = leads.filter(l => l.matchedHotelIds?.includes(currentUserId));
      
      if (!isInitialized.current) {
        hotelLeads.forEach(l => processedLeadIds.current.add(l.id.toString()));
      } else {
        hotelLeads.forEach(lead => {
          const leadKey = lead.id.toString();
          if (!processedLeadIds.current.has(leadKey)) {
            processedLeadIds.current.add(leadKey);
            playNotificationSound();
            addNotification({
              id: `lead-${leadKey}`,
              userId: currentUserId,
              role: 'hotel',
              type: 'lead',
              title: `New Lead: ${lead.customerName || 'Traveler'}`,
              message: `Requested ${lead.roomType} in ${lead.destination} (Budget: ₹${lead.budget})`,
              leadId: lead.id,
              createdAt: new Date().toISOString(),
              read: false
            });
          }
        });
      }
    }

    // 2. Check for incoming quotes (if user is Customer)
    if (user.role === 'customer' && Array.isArray(quotes)) {
      const userQuotes = quotes.filter(q => {
        const lead = leads.find(l => l.id.toString() === q.leadId?.toString());
        return lead && lead.customerId?.toString() === currentUserId;
      });

      if (!isInitialized.current) {
        userQuotes.forEach(q => processedQuoteIds.current.add(q.id.toString()));
      } else {
        userQuotes.forEach(q => {
          const quoteKey = q.id.toString();
          if (!processedQuoteIds.current.has(quoteKey)) {
            processedQuoteIds.current.add(quoteKey);
            playNotificationSound();
            addNotification({
              id: `quote-${quoteKey}`,
              userId: currentUserId,
              role: 'customer',
              type: 'quote',
              title: `New Quote from ${q.hotelName || 'Hotel'}`,
              message: `Offered rate: ₹${Number(q.price).toLocaleString()}`,
              leadId: q.leadId,
              createdAt: new Date().toISOString(),
              read: false
            });
          }
        });
      }
    }
  }, [leads, quotes, user, addNotification]);

  useEffect(() => {
    if (!user) return;

    const currentRole = user.role;
    const currentUserId = user.role === 'hotel' ? (user.hotelId || user.id) : user.id;

    isInitialized.current = false;
    processedMessageIds.current.clear();

    const checkMessages = async () => {
      try {
        const query = user.role === 'hotel' 
          ? { hotelId: currentUserId } 
          : { customerId: currentUserId || 1 };

        const recent = await api.getRecentMessages(query);
        if (!Array.isArray(recent) || recent.length === 0) {
          isInitialized.current = true;
          return;
        }

        if (!isInitialized.current) {
          recent.forEach(m => processedMessageIds.current.add(m.id));
          isInitialized.current = true;
          return;
        }

        for (const msg of recent) {
          if (!processedMessageIds.current.has(msg.id)) {
            processedMessageIds.current.add(msg.id);

            if (msg.sender !== currentRole) {
              let senderLabel = 'Guest';
              if (msg.sender === 'hotel') {
                const h = hotels.find(item => item.id.toString() === msg.hotel_id.toString());
                senderLabel = h?.name || 'Hotel Partner';
              } else if (msg.sender === 'customer') {
                senderLabel = 'Guest (Trip #' + msg.lead_id + ')';
              }

              playNotificationSound();

              addNotification({
                id: `msg-${msg.id}`,
                userId: currentUserId,
                role: currentRole,
                type: 'message',
                title: `New message from ${senderLabel}`,
                message: msg.text,
                leadId: msg.lead_id,
                hotelId: msg.hotel_id,
                sender: msg.sender,
                createdAt: msg.created_at || new Date().toISOString(),
                read: false
              });

              if (addToast) {
                addToast(`💬 ${senderLabel}: "${msg.text}"`, 'info', 6000);
              }

              if ('Notification' in window && Notification.permission === 'granted') {
                try {
                  const n = new Notification(`New message from ${senderLabel}`, {
                    body: msg.text,
                    icon: '/favicon.ico'
                  });
                  n.onclick = () => {
                    window.focus();
                    openChat({ leadId: msg.lead_id, hotelId: msg.hotel_id, sender: currentRole });
                  };
                } catch (e) {}
              }
            }
          }
        }
      } catch (err) {
        console.warn('Error checking recent messages for notifications:', err);
      }
    };

    checkMessages();
    const interval = setInterval(checkMessages, 2500);

    return () => clearInterval(interval);
  }, [user, addNotification, addToast, openChat, hotels]);

  return (
    <>
      {/* Global Chat Modal triggered from any notification or button */}
      {globalChat && (
        <ChatModal 
          leadId={globalChat.leadId} 
          hotelId={globalChat.hotelId} 
          sender={globalChat.sender || (user?.role === 'hotel' ? 'hotel' : 'customer')} 
          onClose={closeChat} 
        />
      )}
    </>
  );
}
