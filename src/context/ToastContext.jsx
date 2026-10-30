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
          let containerStyle = 'bg-slate-900 border-l-4 border-l-sky-500 border-slate-700 text-white shadow-2xl';
          let iconBg = 'bg-sky-500/20 text-sky-400';
          let IconComponent = Info;

          if (toast.type === 'success') {
            containerStyle = 'bg-slate-900 border-l-4 border-l-emerald-500 border-slate-700 text-white shadow-2xl';
            iconBg = 'bg-emerald-500/20 text-emerald-400';
            IconComponent = CheckCircle2;
          } else if (toast.type === 'error') {
            containerStyle = 'bg-slate-900 border-l-4 border-l-rose-500 border-slate-700 text-white shadow-2xl';
            iconBg = 'bg-rose-500/20 text-rose-400';
            IconComponent = AlertCircle;
          } else if (toast.type === 'warning') {
            containerStyle = 'bg-slate-900 border-l-4 border-l-amber-500 border-slate-700 text-white shadow-2xl';
            iconBg = 'bg-amber-500/20 text-amber-400';
            IconComponent = AlertTriangle;
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 text-xs sm:text-sm font-medium ${containerStyle}`}
              role="alert"
            >
              <div className={`p-1.5 rounded-lg shrink-0 flex items-center justify-center ${iconBg}`}>
                <IconComponent className="w-5 h-5 shrink-0" />
              </div>
              <div className="flex-1 leading-relaxed whitespace-pre-line text-white font-medium">{toast.message}</div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0"
                aria-label="Close notification"
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
