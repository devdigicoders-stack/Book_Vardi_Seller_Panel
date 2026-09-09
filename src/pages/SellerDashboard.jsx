import React, { useState } from 'react';
import Overview from '../components/Overview';
import ProductsTab from '../components/ProductsTab';
import OrdersTab from '../components/OrdersTab';
import InventoryTab from '../components/InventoryTab';
import SchoolOrdersTab from '../components/SchoolOrdersTab';
import CustomersTab from '../components/CustomersTab';
import FinanceTab from '../components/FinanceTab';
import PromotionsTab from '../components/PromotionsTab';
import AnalyticsTab from '../components/AnalyticsTab';
import ReviewsTab from '../components/ReviewsTab';
import ShippingTab from '../components/ShippingTab';
import NotificationsTab from '../components/NotificationsTab';
import SettingsTab from '../components/SettingsTab';
import SupportTab from '../components/SupportTab';
import ProfileTab from '../components/ProfileTab';
import SellerLogin from '../components/SellerLogin';
import { 
  Home, 
  Package, 
  ShoppingBag, 
  Box, 
  Building2, 
  Users, 
  CreditCard, 
  Tag, 
  BarChart3, 
  Star, 
  Truck, 
  Bell, 
  Settings, 
  HelpCircle,
  ArrowLeft,
  ShieldCheck,
  ChevronRight,
  UserCheck,
  User,
  LogOut
} from 'lucide-react';
import { useSellerData } from '../context/SellerDataContext';

export default function SellerDashboardPage({ onNavigate }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { notifications, isApproved, settings, isAuthenticated, sellerUser, logoutSeller } = useSellerData();

  if (!isAuthenticated) {
    return <SellerLogin />;
  }

  const unreadCount = notifications.filter(n => n.unread).length;

  const tabSections = [
    {
      title: 'Store Overview',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: <Home size={17} /> },
        { id: 'analytics', label: 'Analytics & Insights', icon: <BarChart3 size={17} /> },
        { 
          id: 'notifications', 
          label: 'Notifications', 
          icon: <Bell size={17} />,
          badge: unreadCount > 0 ? unreadCount : null 
        }
      ]
    },
    {
      title: 'Catalog & Stock',
      items: [
        { id: 'products', label: 'Products', icon: <Package size={17} /> },
        { id: 'inventory', label: 'Inventory & Stock', icon: <Box size={17} /> },
        { id: 'promotions', label: 'Promotions & Coupons', icon: <Tag size={17} /> }
      ]
    },
    {
      title: 'Sales & Schools',
      items: [
        { id: 'orders', label: 'Customer Orders', icon: <ShoppingBag size={17} /> },
        { id: 'school-orders', label: 'School Bulk Orders', icon: <Building2 size={17} /> },
        { id: 'customers', label: 'Customers & Parents', icon: <Users size={17} /> }
      ]
    },
    {
      title: 'Store Operations',
      items: [
        { id: 'profile', label: 'Seller Profile', icon: <UserCheck size={17} /> },
        { id: 'finance', label: 'Finance & Payouts', icon: <CreditCard size={17} /> },
        { id: 'shipping', label: 'Shipping & Logistics', icon: <Truck size={17} /> },
        { id: 'reviews', label: 'Customer Reviews', icon: <Star size={17} /> },
        { id: 'settings', label: 'Account Settings', icon: <Settings size={17} /> },
        { id: 'support', label: 'Helpdesk & Support', icon: <HelpCircle size={17} /> }
      ]
    }
  ];

  const allTabs = tabSections.flatMap(section => section.items);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Overview />;
      case 'profile':
        return <ProfileTab />;
      case 'products':
        return <ProductsTab />;
      case 'orders':
        return <OrdersTab />;
      case 'inventory':
        return <InventoryTab />;
      case 'school-orders':
        return <SchoolOrdersTab />;
      case 'customers':
        return <CustomersTab />;
      case 'finance':
        return <FinanceTab />;
      case 'promotions':
        return <PromotionsTab />;
      case 'analytics':
        return <AnalyticsTab />;
      case 'reviews':
        return <ReviewsTab />;
      case 'shipping':
        return <ShippingTab />;
      case 'notifications':
        return <NotificationsTab />;
      case 'settings':
        return <SettingsTab />;
      case 'support':
        return <SupportTab />;
      default:
        return <Overview />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      
      {/* Header Banner */}
      <div className="bg-brand-teal text-white py-6 px-4 border-b border-white/10 relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-brand-yellow/10 blur-3xl pointer-events-none" />
        <div className="container mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <img
              src="/logo.png"
              alt="Book Vardi"
              className="h-12 w-auto object-contain bg-white p-1 rounded-xl shadow-xs"
            />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-brand-yellow text-brand-teal tracking-wider uppercase">
                  Merchant Portal
                </span>
                {isApproved && (
                  <span className="text-[11px] text-teal-200 font-medium flex items-center gap-1">
                    <ShieldCheck size={13} /> Verified Partner Seller
                  </span>
                )}
              </div>
              <h1 className="font-display text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                {settings?.storeName || 'Book Vardi Seller Hub'}
              </h1>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all text-xs font-semibold cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-brand-yellow text-brand-teal border-brand-yellow font-bold shadow-xs'
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
              }`}
              title="View & Edit Seller Profile"
            >
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center font-bold text-[11px] text-white">
                {sellerUser?.name ? sellerUser.name.charAt(0) : 'S'}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-[11px] leading-tight font-bold truncate max-w-[120px]">{sellerUser?.name || 'Seller'}</div>
                <div className="text-[9px] text-teal-200 leading-tight truncate">{sellerUser?.role || 'Partner Merchant'}</div>
              </div>
            </button>

            <button
              onClick={logoutSeller}
              title="Sign Out / Lock Portal"
              className="p-2 rounded-xl bg-white/10 hover:bg-red-500/80 text-white transition-colors cursor-pointer border border-white/15"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Horizontal Navigation Strip (Sticky on small screens) */}
      <div className="lg:hidden bg-white sticky top-0 z-30 shadow-xs border-b border-gray-200">
        <div className="px-4 overflow-x-auto no-scrollbar">
          <nav className="flex space-x-1 py-2.5">
            {allTabs.map((tab) => {
              const isCurrent = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-teal-800 text-white shadow-xs'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      isCurrent ? 'bg-amber-400 text-teal-950' : 'bg-red-500 text-white'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Layout: Sticky Sidebar on Desktop + Content */}
      <div className="container mx-auto px-4 mt-6">
        <div className="flex flex-col lg:flex-row items-start gap-6">
          
          {/* Sticky Left Sidebar (Desktop) */}
          <aside className="hidden lg:block w-64 xl:w-72 shrink-0 self-start sticky top-6">
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-3.5 space-y-4 max-h-[calc(100vh-4rem)] overflow-y-auto no-scrollbar">
              
              {/* Store Mini Profile */}
              <div 
                onClick={() => setActiveTab('profile')}
                className={`p-3 rounded-xl border transition-all cursor-pointer group ${
                  activeTab === 'profile'
                    ? 'bg-brand-teal text-white border-brand-teal shadow-xs'
                    : 'bg-teal-50/60 hover:bg-teal-100/60 border-teal-100/80 text-teal-950'
                }`}
                title="Click to manage Seller Profile"
              >
                <div className="flex items-center justify-between">
                  <div className={`font-bold text-xs truncate ${activeTab === 'profile' ? 'text-white' : 'text-teal-950'}`}>
                    {settings?.storeName || 'Book Vardi Seller Hub'}
                  </div>
                  <UserCheck size={13} className={activeTab === 'profile' ? 'text-brand-yellow' : 'text-teal-600'} />
                </div>
                <div className={`text-[10px] flex items-center gap-1 mt-0.5 ${activeTab === 'profile' ? 'text-teal-200' : 'text-teal-700'}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Store Online & Live
                </div>
                <div className={`mt-2 pt-1.5 border-t flex items-center justify-between text-[10px] ${
                  activeTab === 'profile' ? 'border-white/20 text-teal-100' : 'border-teal-200/50 text-teal-900'
                }`}>
                  <span className="truncate max-w-[120px] font-semibold">{sellerUser?.name || 'Seller'}</span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-extrabold ${
                    activeTab === 'profile' ? 'bg-white/20 text-white' : 'bg-teal-200/60 text-teal-950'
                  }`}>
                    {sellerUser?.role || 'Partner'}
                  </span>
                </div>
              </div>

              {/* Navigation Sections */}
              {tabSections.map((section, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-1">
                    {section.title}
                  </div>
                  {section.items.map((tab) => {
                    const isCurrent = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          isCurrent
                            ? 'bg-teal-800 text-white shadow-xs'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        <span className="flex items-center gap-2.5">
                          {tab.icon}
                          <span>{tab.label}</span>
                        </span>
                        {tab.badge ? (
                          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                            isCurrent ? 'bg-amber-400 text-teal-950' : 'bg-red-500 text-white'
                          }`}>
                            {tab.badge}
                          </span>
                        ) : (
                          <ChevronRight size={13} className={isCurrent ? 'opacity-100' : 'opacity-20'} />
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}

              {/* Bottom Action: Exit to Customer Store */}
              <div className="pt-3 mt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    if (onNavigate) {
                      onNavigate('home');
                    } else {
                      window.location.href = 'http://localhost:5173';
                    }
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-teal-900 bg-teal-50 hover:bg-brand-yellow hover:text-brand-teal-dark border border-teal-200/80 transition-all duration-200 cursor-pointer shadow-2xs group"
                  title="Return to the customer shopping storefront"
                >
                  <span className="flex items-center gap-2.5">
                    <ShoppingBag size={16} className="text-teal-700 group-hover:text-brand-teal-dark transition-colors" />
                    <span>Exit to Customer Store</span>
                  </span>
                  <ArrowLeft size={14} className="opacity-70 group-hover:opacity-100 group-hover:-translate-x-0.5 transition-transform" />
                </button>
              </div>

            </div>
          </aside>

          {/* Main Dashboard Workspace Content */}
          <main className="flex-1 w-full min-w-0">
            {renderContent()}
          </main>

        </div>
      </div>

    </div>
  );
}
