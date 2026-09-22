import React, { useState, useEffect } from 'react';
import { SellerDataProvider } from './context/SellerDataContext';
import SellerDashboard from './pages/SellerDashboard';
import DeliveryPartnerPage from './components/DeliveryPartnerPage';

export default function App() {
  const [isDeliveryPartnerRoute, setIsDeliveryPartnerRoute] = useState(() => {
    try {
      const hash = window.location.hash.toLowerCase();
      const path = window.location.pathname.toLowerCase();
      const search = window.location.search.toLowerCase();
      return hash.includes('delivery-partner') || path.includes('delivery-partner') || search.includes('token=dlv-');
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const checkRoute = () => {
      const hash = window.location.hash.toLowerCase();
      const path = window.location.pathname.toLowerCase();
      const search = window.location.search.toLowerCase();
      setIsDeliveryPartnerRoute(hash.includes('delivery-partner') || path.includes('delivery-partner') || search.includes('token=dlv-'));
    };

    window.addEventListener('popstate', checkRoute);
    window.addEventListener('hashchange', checkRoute);
    return () => {
      window.removeEventListener('popstate', checkRoute);
      window.removeEventListener('hashchange', checkRoute);
    };
  }, []);

  const handleExitToCustomerStore = () => {
    const websiteUrl = import.meta.env.VITE_WEBSITE_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5173' : 'https://book-vardi-website.vercel.app');
    window.location.href = websiteUrl;
  };

  return (
    <SellerDataProvider>
      <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-brand-yellow/30 selection:text-brand-teal">
        {isDeliveryPartnerRoute ? (
          <DeliveryPartnerPage onNavigate={handleExitToCustomerStore} />
        ) : (
          <SellerDashboard onNavigate={handleExitToCustomerStore} />
        )}
      </div>
    </SellerDataProvider>
  );
}
