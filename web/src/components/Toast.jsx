/* eslint-disable react-refresh/only-export-components */
import React, { useState, useCallback, createContext, useContext } from 'react';
import { AlertCircle, CheckCircle2, X, XCircle } from 'lucide-react';

const ToastContext = createContext(null);

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <span className="toast-icon">
              {t.type === 'success' ? <CheckCircle2 size={18} /> :
               t.type === 'error' ? <XCircle size={18} /> :
               <AlertCircle size={18} />}
            </span>
            <span className="toast-msg">{t.message}</span>
            <button className="toast-close" onClick={() => removeToast(t.id)}><X size={16} /></button>
          </div>
        ))}
      </div>
      <style jsx>{`
        .toast-container {
          position: fixed; bottom: 24px; right: 24px; z-index: 9999;
          display: flex; flex-direction: column; gap: 8px; max-width: 400px;
        }
        .toast {
          display: flex; align-items: center; gap: 12px;
          padding: 14px 18px; border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.12);
          animation: slideIn 0.25s ease-out;
          font-size: 14px; font-weight: 600;
        }
        .toast-success { background: #DCFCE7; color: #166534; border: 1px solid #BBF7D0; }
        .toast-error { background: #FEE2E2; color: #991B1B; border: 1px solid #FECACA; }
        .toast-info { background: #DBEAFE; color: #1E40AF; border: 1px solid #BFDBFE; }
        .toast-icon { display: flex; align-items: center; }
        .toast-msg { flex: 1; }
        .toast-close { background: none; border: none; cursor: pointer; color: inherit; opacity: 0.6; padding: 2px; }
        .toast-close:hover { opacity: 1; }
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </ToastContext.Provider>
  );
}
