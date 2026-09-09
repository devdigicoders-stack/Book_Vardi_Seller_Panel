import React from 'react';
import { SellerDataProvider } from './context/SellerDataContext';
import SellerDashboard from './pages/SellerDashboard';

export default function App() {
  const handleExitToCustomerStore = () => {
    // Navigate back to the customer-facing storefront running on port 5173
    window.location.href = 'http://localhost:5173';
  };

  return (
    <SellerDataProvider approved={true}>
      <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-brand-yellow/30 selection:text-brand-teal">
        <SellerDashboard onNavigate={handleExitToCustomerStore} />
      </div>
    </SellerDataProvider>
  );
}
