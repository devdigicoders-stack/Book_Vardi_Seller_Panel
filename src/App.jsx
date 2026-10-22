import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { SellerDataProvider, useSellerData } from './context/SellerDataContext';
import SellerDashboard from './pages/SellerDashboard';
import SellerLogin from './components/SellerLogin';
import DeliveryPartnerPage from './components/DeliveryPartnerPage';
import { SELLER_ROUTE_PATHS } from './constants/routes';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useSellerData();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function PublicLoginRoute() {
  const { isAuthenticated } = useSellerData();
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  return <SellerLogin />;
}

// Special handler for root path to ensure rider links with hash (/#delivery-partner)
// do NOT get redirected to the seller dashboard
function RootRoute() {
  const hash = (typeof window !== 'undefined' ? window.location.hash : '') || '';
  if (hash.includes('delivery-partner')) {
    const query = hash.includes('?') ? '?' + hash.split('?')[1] : '';
    return <Navigate to={`/delivery-partner${query}`} replace />;
  }
  return (
    <ProtectedRoute>
      <Navigate to="/dashboard" replace />
    </ProtectedRoute>
  );
}

// Fallback for unknown routes to also capture /#delivery-partner
function CatchAllRoute() {
  const hash = (typeof window !== 'undefined' ? window.location.hash : '') || '';
  if (hash.includes('delivery-partner')) {
    const query = hash.includes('?') ? '?' + hash.split('?')[1] : '';
    return <Navigate to={`/delivery-partner${query}`} replace />;
  }
  return <Navigate to="/dashboard" replace />;
}

function SellerRoutes() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleExitToCustomerStore = () => {
    const websiteUrl = import.meta.env.VITE_WEBSITE_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5173' : 'https://book-vardi-website.vercel.app');
    window.location.href = websiteUrl;
  };

  // Immediate listener for hash change or on-load hash check (e.g. if driver opens /#delivery-partner?token=...)
  React.useEffect(() => {
    const checkHashForDelivery = () => {
      const hash = window.location.hash || '';
      if (hash.includes('delivery-partner')) {
        const query = hash.includes('?') ? '?' + hash.split('?')[1] : '';
        navigate(`/delivery-partner${query}`, { replace: true });
      }
    };
    checkHashForDelivery();
    window.addEventListener('hashchange', checkHashForDelivery);
    return () => window.removeEventListener('hashchange', checkHashForDelivery);
  }, [navigate]);

  return (
    <Routes>
      {/* Public Login Route */}
      <Route path="/login" element={<PublicLoginRoute />} />

      {/* Delivery Partner Portal - Public for Delivery Executives */}
      <Route path="/delivery-partner" element={<DeliveryPartnerPage onNavigate={handleExitToCustomerStore} />} />

      {/* Root Route: checks for delivery-partner hash before dashboard */}
      <Route path="/" element={<RootRoute />} />

      {/* Alias for camelCase schoolOrders */}
      <Route
        path="/schoolOrders"
        element={
          <ProtectedRoute>
            <Navigate to="/school-orders" replace />
          </ProtectedRoute>
        }
      />

      {/* Protected Seller Dashboard Routes */}
      {SELLER_ROUTE_PATHS.map((path) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <ProtectedRoute>
              <SellerDashboard onNavigate={handleExitToCustomerStore} />
            </ProtectedRoute>
          }
        />
      ))}

      {/* Catch-all unknown routes: Checks for delivery-partner before redirecting to /dashboard */}
      <Route path="*" element={<CatchAllRoute />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <SellerDataProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-brand-yellow/30 selection:text-brand-teal">
            <SellerRoutes />
          </div>
        </BrowserRouter>
      </SellerDataProvider>
    </ToastProvider>
  );
}
