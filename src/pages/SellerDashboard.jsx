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
  LogOut,
  Clock,
  Edit3
} from 'lucide-react';
import { useSellerData } from '../context/SellerDataContext';
import SellerRegistrationModal from '../components/SellerRegistrationModal';

const getMediaUrl = (path) => {
  if (!path || typeof path !== 'string') return '';
  if (path.startsWith('data:') || path.startsWith('blob:') || path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  return `http://localhost:5000${path.startsWith('/') ? '' : '/'}${path}`;
};

export default function SellerDashboardPage({ onNavigate }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { 
    notifications, 
    isApproved, 
    sellerStatus, 
    approveSellerApplication, 
    settings, 
    isAuthenticated, 
    sellerUser, 
    logoutSeller 
  } = useSellerData();

  if (!isAuthenticated) {
    return <SellerLogin />;
  }

  const isSellerApproved = sellerStatus === 'approved';

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
    <div className="relative min-h-screen">
      <div className={`min-h-screen bg-gray-50/50 pb-20 transition-all duration-300 ${!isSellerApproved ? 'filter blur-md opacity-40 pointer-events-none select-none' : ''}`}>
        
        {/* Header Banner */}
        <div className="bg-brand-teal text-white py-4 px-4 border-b border-white/10 relative overflow-hidden sticky top-0 z-40 shadow-sm backdrop-blur-md">
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
                  {isSellerApproved && (
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
                <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center font-bold text-[11px] text-white overflow-hidden shrink-0 border border-white/30">
                  {(() => {
                    let photo = sellerUser?.avatar || sellerUser?.documents?.profilePhoto || sellerUser?.profilePhoto || '';
                    if (!photo) {
                      try {
                        const saved = localStorage.getItem('bv_seller_reg_data');
                        if (saved) {
                          const parsed = JSON.parse(saved);
                          if (parsed?.profilePhoto) photo = parsed.profilePhoto;
                        }
                      } catch {}
                    }
                    return photo ? (
                      <img
                        src={getMediaUrl(photo)}
                        alt="Avatar"
                        className="w-full h-full rounded-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      sellerUser?.name ? sellerUser.name.charAt(0) : 'S'
                    );
                  })()}
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
            <aside className="hidden lg:block w-64 xl:w-72 shrink-0 self-start sticky top-20 z-30">
              <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-3.5 space-y-4 h-[calc(100vh-5.5rem)] max-h-[calc(100vh-5.5rem)] overflow-y-auto hide-scrollbar no-scrollbar scrollbar-none">
                
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

      {/* Blurred Dashboard Overlay Card for Unapproved / Pending / Rejected Sellers */}
      {!isSellerApproved && (
        <div className="fixed inset-0 z-50 backdrop-blur-md bg-slate-900/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-white/20 max-w-xl w-full p-6 sm:p-8 text-center relative overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
            {/* Status Accent Bar */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500" />

            <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4 border border-amber-200/60 shadow-inner">
              <Clock size={32} className="animate-pulse" />
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 mb-3">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
              Application Status: {sellerStatus ? sellerStatus.replace('_', ' ').toUpperCase() : 'PENDING'}
            </span>

            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Seller Account Pending Approval
            </h2>

            <p className="text-slate-600 text-sm mt-2 max-w-md mx-auto leading-relaxed">
              Thank you for registering with Book Vardi! Your merchant application (<span className="font-semibold text-slate-800">{settings?.storeName || sellerUser?.name || 'Partner Store'}</span>) is currently under review by our onboarding team.
            </p>

            <div className="mt-5 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-left text-xs space-y-2">
              <div className="flex justify-between items-center text-slate-600">
                <span>Applicant Name:</span>
                <span className="font-bold text-slate-800">{sellerUser?.name || 'Partner Seller'}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Registered Mobile:</span>
                <span className="font-bold text-slate-800">{sellerUser?.phone || 'Verified'}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Application State:</span>
                <span className="font-bold text-amber-600 uppercase tracking-wide text-[11px] bg-amber-100 px-2 py-0.5 rounded-full">
                  {sellerStatus || 'Pending Review'}
                </span>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2.5">
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
              >
                <Edit3 size={16} /> Edit Application / Update Details
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    if (onNavigate) onNavigate('home');
                    else window.location.href = 'http://localhost:5173';
                  }}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-all cursor-pointer border border-slate-200"
                >
                  <ArrowLeft size={14} /> Back to Storefront
                </button>

                <button
                  onClick={approveSellerApplication}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs border border-amber-300/80 transition-all cursor-pointer"
                  title="Testing shortcut to simulate admin approval"
                >
                  <ShieldCheck size={14} className="text-amber-600" /> Instant Admin Approve (Testing)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Seller 12-Step Onboarding & Application Edit Modal */}
      <SellerRegistrationModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />
    </div>
  );
}
