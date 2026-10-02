import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      showToast: (msg) => console.log('Toast:', msg),
      success: (msg) => console.log('Toast Success:', msg),
      error: (msg) => console.log('Toast Error:', msg),
      warning: (msg) => console.log('Toast Warning:', msg),
      info: (msg) => console.log('Toast Info:', msg),
    };
  }
  return context;
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    if (!message) return;
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev.slice(-4), { id, message, type }]); // Keep max 5

    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, [removeToast]);

  const success = useCallback((msg, duration) => showToast(msg, 'success', duration), [showToast]);
  const error = useCallback((msg, duration) => showToast(msg, 'error', duration), [showToast]);
  const warning = useCallback((msg, duration) => showToast(msg, 'warning', duration), [showToast]);
  const info = useCallback((msg, duration) => showToast(msg, 'info', duration), [showToast]);

  // Intercept window.alert as global fallback
  useEffect(() => {
    const originalAlert = window.alert;
    window.alert = (msg) => {
      const msgStr = String(msg || '');
      let type = 'info';
      if (msgStr.includes('Error') || msgStr.includes('failed') || msgStr.includes('Invalid') || msgStr.includes('exceeds')) {
        type = 'error';
      } else if (msgStr.includes('Please') || msgStr.includes('Required') || msgStr.includes('Warning')) {
        type = 'warning';
      } else if (msgStr.includes('Success') || msgStr.includes('saved') || msgStr.includes('copied') || msgStr.includes('!')) {
        type = 'success';
      }
      showToast(msgStr, type);
    };
    return () => {
      window.alert = originalAlert;
    };
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
      {children}
      {/* Toast Render Container */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 max-w-sm sm:max-w-md w-full px-4 pointer-events-none">
        {toasts.map((toast) => {
          let bgStyle = 'bg-slate-900 border-slate-700 text-slate-100';
          let IconComponent = Info;
          let iconColor = 'text-sky-400';

          if (toast.type === 'success') {
            bgStyle = 'bg-emerald-950/90 border-emerald-700/60 text-emerald-100';
            IconComponent = CheckCircle2;
            iconColor = 'text-emerald-400';
          } else if (toast.type === 'error') {
            bgStyle = 'bg-rose-950/90 border-rose-700/60 text-rose-100';
            IconComponent = AlertCircle;
            iconColor = 'text-rose-400';
          } else if (toast.type === 'warning') {
            bgStyle = 'bg-amber-950/90 border-amber-700/60 text-amber-100';
            IconComponent = AlertTriangle;
            iconColor = 'text-amber-400';
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-xl backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 text-xs sm:text-sm font-medium ${bgStyle}`}
              role="alert"
            >
              <IconComponent className={`w-5 h-5 shrink-0 mt-0.5 ${iconColor}`} />
              <div className="flex-1 leading-relaxed whitespace-pre-line">{toast.message}</div>
              <button
                onClick={() => removeToast(toast.id)}
                className="opacity-70 hover:opacity-100 p-0.5 rounded-md hover:bg-white/10 transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
