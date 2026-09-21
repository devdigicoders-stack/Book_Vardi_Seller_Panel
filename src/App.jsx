import React from 'react';
import { SellerDataProvider } from './context/SellerDataContext';
import SellerDashboard from './pages/SellerDashboard';

export default function App() {
  const handleExitToCustomerStore = () => {
    const websiteUrl = import.meta.env.VITE_WEBSITE_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5173' : 'https://book-vardi-website.vercel.app');
    window.location.href = websiteUrl;
  };

  return (
    <SellerDataProvider>
      <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-brand-yellow/30 selection:text-brand-teal">
        <SellerDashboard onNavigate={handleExitToCustomerStore} />
      </div>
    </SellerDataProvider>
  );
}
