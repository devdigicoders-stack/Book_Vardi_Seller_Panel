import React from 'react';
import { AlertTriangle, RefreshCw, LayoutDashboard } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Seller Panel Uncaught Error:', error, errorInfo);

    // Automatic seamless recovery for stale browser chunk caches
    const msg = String(error?.message || '');
    if (
      msg.includes('useEffect is not defined') ||
      msg.includes('useMemo is not defined') ||
      msg.includes('ChunkLoadError') ||
      msg.includes('Failed to fetch dynamically imported module')
    ) {
      const lastAutoReload = sessionStorage.getItem('bv_seller_error_reload');
      if (!lastAutoReload || Date.now() - Number(lastAutoReload) > 10000) {
        sessionStorage.setItem('bv_seller_error_reload', String(Date.now()));
        try {
          if ('caches' in window) {
            caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
          }
        } catch (_) {}
        const cleanUrl = window.location.origin + window.location.pathname + '?_bv=' + Date.now() + window.location.hash;
        window.location.replace(cleanUrl);
      }
    }
  }

  handleReload = () => {
    try {
      if ('caches' in window) {
        caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
      }
    } catch (_) {}
    const cleanUrl = window.location.origin + window.location.pathname + '?_bv=' + Date.now() + window.location.hash;
    window.location.replace(cleanUrl);
  };

  handleGoDashboard = () => {
    try {
      if ('caches' in window) {
        caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
      }
    } catch (_) {}
    window.location.replace('/dashboard?_bv=' + Date.now());
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-2xl border border-rose-100 text-center space-y-5">
            <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto border border-rose-200 text-rose-600">
              <AlertTriangle size={32} />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-gray-900">Something went wrong</h2>
              <p className="text-xs text-gray-500">
                The Seller Panel encountered an unexpected display exception. A browser session refresh is required to view this component.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 font-mono text-[11px] text-rose-700 text-left overflow-x-auto max-h-28">
                {this.state.error.message}
              </div>
            )}

            <div className="space-y-2">
              <button
                onClick={this.handleReload}
                className="w-full py-3 px-4 rounded-xl bg-brand-teal hover:bg-brand-teal-light text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw size={16} />
                <span>Reload Seller Hub (Clear Cache)</span>
              </button>

              <button
                onClick={this.handleGoDashboard}
                className="w-full py-2.5 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <LayoutDashboard size={15} />
                <span>Go to Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
