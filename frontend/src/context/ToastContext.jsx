import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const getToastStyle = (type) => {
    switch (type) {
      case 'warning':
        return {
          bg: '#FFFBEB',
          border: '#F59E0B',
          text: '#92400E',
          iconColor: '#D97706',
          icon: AlertTriangle
        };
      case 'error':
        return {
          bg: '#FEF2F2',
          border: '#EF4444',
          text: '#991B1B',
          iconColor: '#DC2626',
          icon: AlertCircle
        };
      case 'info':
        return {
          bg: '#EFF6FF',
          border: '#3B82F6',
          text: '#1E40AF',
          iconColor: '#2563EB',
          icon: Info
        };
      case 'success':
      default:
        return {
          bg: '#ECFDF5',
          border: '#10B981',
          text: '#065F46',
          iconColor: '#059669',
          icon: CheckCircle2
        };
    }
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div 
        style={{
          position: 'fixed',
          top: 24,
          right: 24,
          zIndex: 999999,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          pointerEvents: 'none',
          maxWidth: '92vw',
          width: 420
        }}
      >
        {toasts.map(t => {
          const style = getToastStyle(t.type);
          const IconComponent = style.icon;

          return (
            <div
              key={t.id}
              style={{
                pointerEvents: 'auto',
                background: style.bg,
                border: `2px solid ${style.border}`,
                color: style.text,
                borderRadius: 14,
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                boxShadow: '0 12px 30px -4px rgba(0, 0, 0, 0.18), 0 6px 12px -2px rgba(0, 0, 0, 0.12)',
                fontSize: '0.94rem',
                fontWeight: 700,
                lineHeight: 1.45,
                animation: 'toastSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                backdropFilter: 'blur(8px)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                <IconComponent size={22} color={style.iconColor} style={{ flexShrink: 0 }} />
                <span style={{ color: style.text, fontWeight: 700 }}>{t.message}</span>
              </div>
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: style.text,
                  opacity: 0.7,
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
