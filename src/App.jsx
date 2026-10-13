import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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

function SellerRoutes() {
  const handleExitToCustomerStore = () => {
    const websiteUrl = import.meta.env.VITE_WEBSITE_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5173' : 'https://book-vardi-website.vercel.app');
    window.location.href = websiteUrl;
  };

  return (
    <Routes>
      {/* Public Login Route */}
      <Route path="/login" element={<PublicLoginRoute />} />

      {/* Delivery Partner Portal */}
      <Route path="/delivery-partner" element={<DeliveryPartnerPage onNavigate={handleExitToCustomerStore} />} />

      {/* Redirect root to /dashboard */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Navigate to="/dashboard" replace />
          </ProtectedRoute>
        }
      />

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

      {/* Catch-all unknown routes: Redirect to /dashboard */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
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
