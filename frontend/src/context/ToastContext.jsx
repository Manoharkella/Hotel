import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X, Sparkles } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success', duration = 4500) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type, duration, createdAt: Date.now() }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const getToastConfig = (type) => {
    switch (type) {
      case 'warning':
        return {
          title: 'Attention',
          accentColor: '#F59E0B',
          iconBg: '#FEF3C7',
          iconColor: '#D97706',
          icon: AlertTriangle,
          progressColor: '#F59E0B'
        };
      case 'error':
        return {
          title: 'Action Failed',
          accentColor: '#EF4444',
          iconBg: '#FEE2E2',
          iconColor: '#DC2626',
          icon: AlertCircle,
          progressColor: '#EF4444'
        };
      case 'info':
        return {
          title: 'Notice',
          accentColor: '#3B82F6',
          iconBg: '#DBEAFE',
          iconColor: '#2563EB',
          icon: Info,
          progressColor: '#3B82F6'
        };
      case 'success':
      default:
        return {
          title: 'Success',
          accentColor: '#10B981',
          iconBg: '#D1FAE5',
          iconColor: '#059669',
          icon: CheckCircle2,
          progressColor: '#10B981'
        };
    }
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div 
        style={{
          position: 'fixed',
          top: 20,
          right: 20,
          zIndex: 999999,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          pointerEvents: 'none',
          maxWidth: 'calc(100vw - 32px)',
          width: 400
        }}
      >
        {toasts.map(t => {
          const config = getToastConfig(t.type);
          const IconComponent = config.icon;

          return (
            <div
              key={t.id}
              className="premium-toast-card"
              style={{
                pointerEvents: 'auto',
                background: '#FFFFFF',
                borderRadius: 16,
                padding: '12px 14px 12px 14px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                boxShadow: '0 20px 40px -12px rgba(15, 23, 42, 0.22), 0 0 0 1px rgba(15, 23, 42, 0.08)',
                border: '1px solid #E2E8F0',
                position: 'relative',
                overflow: 'hidden',
                animation: 'toastSlideIn 0.28s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            >
              {/* Left Color Accent Bar */}
              <div 
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: 4,
                  background: config.accentColor
                }} 
              />

              {/* Icon Container with glowing circular background */}
              <div 
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: config.iconBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: 1
                }}
              >
                <IconComponent size={20} color={config.iconColor} strokeWidth={2.2} />
              </div>

              {/* Message Content */}
              <div style={{ flex: 1, minWidth: 0, paddingRight: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.01em' }}>
                    {config.title}
                  </span>
                </div>
                <div style={{ fontSize: '0.84rem', fontWeight: 500, color: '#334155', lineHeight: 1.45, wordBreak: 'break-word' }}>
                  {t.message}
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                aria-label="Close notification"
                style={{
                  background: 'transparent',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  color: '#94A3B8',
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease',
                  flexShrink: 0,
                  marginTop: 2
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = '#0F172A';
                  e.currentTarget.style.background = '#F1F5F9';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = '#94A3B8';
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <X size={15} strokeWidth={2.2} />
              </button>

              {/* Animated Bottom Progress Line */}
              <div 
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 4,
                  right: 0,
                  height: 2.5,
                  background: config.progressColor,
                  opacity: 0.6,
                  animation: `toastProgress ${t.duration || 4500}ms linear forwards`
                }}
              />
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
