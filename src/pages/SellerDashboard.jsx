import React, { useState, lazy, Suspense } from 'react';
import Overview from '../components/Overview';
import SellerLogin from '../components/SellerLogin';

const ProductsTab = lazy(() => import('../components/ProductsTab'));
const OrdersTab = lazy(() => import('../components/OrdersTab'));
const InventoryTab = lazy(() => import('../components/InventoryTab'));
const SchoolOrdersTab = lazy(() => import('../components/SchoolOrdersTab'));
const CustomersTab = lazy(() => import('../components/CustomersTab'));
const FinanceTab = lazy(() => import('../components/FinanceTab'));
const PromotionsTab = lazy(() => import('../components/PromotionsTab'));
const AnalyticsTab = lazy(() => import('../components/AnalyticsTab'));
const ReviewsTab = lazy(() => import('../components/ReviewsTab'));
const ShippingTab = lazy(() => import('../components/ShippingTab'));
const NotificationsTab = lazy(() => import('../components/NotificationsTab'));
const SettingsTab = lazy(() => import('../components/SettingsTab'));
const SupportTab = lazy(() => import('../components/SupportTab'));
const ProfileTab = lazy(() => import('../components/ProfileTab'));
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
  Edit3,
  CheckCircle,
  CheckCircle2,
  RefreshCw,
  LayoutDashboard,
  Loader2,
  XCircle,
  AlertCircle,
  X
} from 'lucide-react';
import { useSellerData } from '../context/SellerDataContext';
import SellerRegistrationModal from '../components/SellerRegistrationModal';
import { SkeletonText, SkeletonAvatar, SkeletonMiniProfile } from '../components/SkeletonLoader';

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
  const [isRefreshingStatus, setIsRefreshingStatus] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isDashboardUnlocked, setIsDashboardUnlocked] = useState(false);

  const { 
    notifications, 
    isApproved, 
    sellerStatus, 
    checkSellerStatus,
    approveSellerApplication, 
    settings, 
    isAuthenticated, 
    sellerUser, 
    logoutSeller,
    showToast,
    toastMessage,
    isLoadingSellerData
  } = useSellerData();

  const handleCheckApprovalStatus = async () => {
    setIsRefreshingStatus(true);
    try {
      if (checkSellerStatus) {
        const latest = await checkSellerStatus();
        if (latest === 'approved') {
          if (showToast) showToast('🎉 Congratulations! Your seller application is APPROVED! Redirecting to login page...');
          setTimeout(() => {
            logoutSeller();
          }, 1500);
        } else {
          if (showToast) showToast(`ℹ️ Application Status: ${latest || 'pending'}. Redirecting to seller login page...`);
          setTimeout(() => {
            logoutSeller();
          }, 2000);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsRefreshingStatus(false);
    }
  };

  React.useEffect(() => {
    const handleAddProductEvent = () => {
      setActiveTab('products');
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('openAddProductModalInternal'));
      }, 100);
    };

    window.addEventListener('openAddProductModal', handleAddProductEvent);
    return () => window.removeEventListener('openAddProductModal', handleAddProductEvent);
  }, []);

  if (!isAuthenticated) {
    return <SellerLogin />;
  }

  const checkEffectiveApprovalStatus = () => {
    if (sellerStatus && sellerStatus !== 'approved') {
      return false;
    }
    if (sellerUser?.status && sellerUser.status !== 'approved') {
      return false;
    }
    try {
      const savedSt = localStorage.getItem('bv_seller_status');
      if (savedSt && savedSt !== 'approved') {
        return false;
      }
    } catch {}

    return isApproved;
  };

  const isSellerApproved = checkEffectiveApprovalStatus();

  // STRICT ACCESS CONTROL: Status approval is strictly required BEFORE loading seller dashboard!
  if (!isSellerApproved) {
    const isRejectedState = sellerStatus === 'rejected' || sellerUser?.status === 'rejected' || sellerUser?.submissionStatus === 'rejected';
    const rejectionReasonText = sellerUser?.rejectionReason || settings?.rejectionReason || sellerUser?.reason || settings?.reason || 'Uploaded KYC documents or business details could not be verified by Admin.';

    return (
      <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-lg w-full p-6 sm:p-7 relative overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
          {/* Top-Right Cross (X) Close Button to switch back to Login Form */}
          <button
            onClick={() => logoutSeller()}
            className="absolute top-4 right-4 z-20 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Close popup & view login form"
          >
            <X size={18} />
          </button>

          {/* Top Gradient Accent Bar */}
          <div className={`absolute top-0 left-0 right-0 h-2 ${isRejectedState ? 'bg-gradient-to-r from-rose-500 via-red-600 to-rose-700' : 'bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500'}`} />

          {/* Header Section: Icon + Title & Status Badge */}
          <div className="flex items-start gap-4 pt-1 mb-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border shadow-inner ${isRejectedState ? 'bg-rose-100 text-rose-700 border-rose-200/60' : 'bg-amber-100 text-amber-700 border-amber-200/60'}`}>
              {isRejectedState ? (
                <XCircle size={28} />
              ) : (
                <Clock size={28} className="animate-pulse" />
              )}
            </div>

            <div className="space-y-1 text-left flex-1 pr-6">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${isRejectedState ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-amber-50 text-amber-800 border-amber-200'}`}>
                  <span className={`w-2 h-2 rounded-full ${isRejectedState ? 'bg-rose-600' : 'bg-amber-500 animate-ping'}`} />
                  {isRejectedState ? 'REJECTED' : (sellerStatus ? sellerStatus.replace('_', ' ').toUpperCase() : 'PENDING APPROVAL')}
                </span>
              </div>
              
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight leading-snug">
                {isRejectedState ? 'Seller Account Application Rejected' : 'Seller Account Pending Approval'}
              </h2>
            </div>
          </div>

          {/* Description Paragraph */}
          <p className="text-slate-600 text-xs text-left leading-relaxed">
            {isRejectedState ? (
              <>
                Your merchant application for <span className="font-bold text-slate-800">{settings?.storeName || sellerUser?.storeName || sellerUser?.name || 'Partner Merchant'}</span> was reviewed and rejected by Admin. Please update your details to resubmit for review.
              </>
            ) : (
              <>
                Thank you for registering with Book Vardi! Your merchant application for <span className="font-bold text-slate-800">{isLoadingSellerData ? 'Partner Merchant' : (settings?.storeName || sellerUser?.storeName || sellerUser?.name || 'Partner Merchant')}</span> is under review. Status approval is strictly required before accessing the dashboard.
              </>
            )}
          </p>

          {/* Admin Rejection Reason Callout */}
          {isRejectedState && (
            <div className="mt-3.5 p-3.5 rounded-2xl border text-left text-xs bg-rose-50/90 border-rose-200/90 space-y-1 text-rose-950 shadow-xs">
              <div className="font-extrabold flex items-center gap-1.5 text-rose-700 text-xs">
                <AlertCircle size={15} />
                <span>Admin Rejection Reason:</span>
              </div>
              <p className="text-slate-800 leading-relaxed font-semibold pl-5 text-xs">
                "{rejectionReasonText}"
              </p>
            </div>
          )}

          {/* Applicant Details Header with Compact Edit Button */}
          <div className="mt-4 flex items-center justify-between mb-1.5 px-0.5">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Applicant Details</span>
            {isRejectedState && (
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[11px] shadow-xs transition-all cursor-pointer"
              >
                <Edit3 size={12} />
                <span>Update / Resubmit Details</span>
              </button>
            )}
          </div>

          {/* Applicant Details Info Card */}
          <div className="p-3.5 rounded-2xl border text-left text-xs space-y-2 bg-slate-50 border-slate-200/80">
            <div className="flex justify-between items-center text-slate-600">
              <span>Applicant Name:</span>
              <span className="font-bold text-slate-800">
                {isLoadingSellerData ? (
                  <SkeletonText width="w-24" height="h-3.5" />
                ) : (
                  sellerUser?.name || sellerUser?.ownerFullName || 'Partner Seller'
                )}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Registered Mobile:</span>
              <span className="font-bold text-slate-800 font-mono">
                {isLoadingSellerData ? (
                  <SkeletonText width="w-28" height="h-3.5" />
                ) : (
                  sellerUser?.phone || 'N/A'
                )}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Application State:</span>
              <span className={`font-bold uppercase tracking-wide text-[10px] px-2 py-0.5 rounded-full border ${isRejectedState ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
                {sellerStatus || (isRejectedState ? 'rejected' : 'pending')}
              </span>
            </div>
          </div>

          {/* 50-50 Split Row for Action Buttons */}
          <div className="mt-5 grid grid-cols-2 gap-3 w-full">
            <button
              onClick={handleCheckApprovalStatus}
              disabled={isRefreshingStatus}
              className={`w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-white font-extrabold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${isRejectedState ? 'bg-slate-800 hover:bg-slate-900' : 'bg-amber-500 hover:bg-amber-600'}`}
            >
              <RefreshCw size={14} className={isRefreshingStatus ? 'animate-spin' : ''} />
              <span className="truncate">{isRefreshingStatus ? 'Checking...' : 'Check Approval Status'}</span>
            </button>

            <button
              onClick={() => {
                if (onNavigate) onNavigate('home');
                else {
                  const websiteUrl = import.meta.env.VITE_WEBSITE_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5173' : 'https://book-vardi-website.vercel.app');
                  window.location.href = websiteUrl;
                }
              }}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-brand-teal hover:bg-brand-teal-light text-white font-extrabold text-xs shadow-sm transition-all cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span className="truncate">Back to Storefront</span>
            </button>
          </div>

        </div>

        <SellerRegistrationModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
        />
      </div>
    );
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
    <div className="relative min-h-screen">
      {/* Top-Center Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 bg-gray-900/95 text-white rounded-2xl shadow-2xl border border-gray-700/60 backdrop-blur-md transition-all duration-300">
          <div className="w-7 h-7 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0 border border-teal-500/30">
            <CheckCircle size={16} />
          </div>
          <div className="text-xs font-bold tracking-wide">
            {toastMessage}
          </div>
        </div>
      )}
      <div className={`min-h-screen bg-gray-50/50 pb-20 transition-all duration-300 ${!isSellerApproved ? 'filter blur-md opacity-40 pointer-events-none select-none' : ''}`}>
        
        {/* Header Banner */}
        <div className="bg-brand-teal text-white py-4 px-4 border-b border-white/10 relative overflow-hidden lg:sticky top-0 z-40 shadow-sm backdrop-blur-md">
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
                  {isLoadingSellerData ? (
                    <SkeletonText width="w-48" height="h-7" className="bg-white/20 my-1" />
                  ) : (
                    settings?.storeName || sellerUser?.storeName || 'Merchant Store'
                  )}
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
                  {isLoadingSellerData ? (
                    <div className="space-y-1">
                      <SkeletonText width="w-20" height="h-3" className="bg-white/20" />
                      <SkeletonText width="w-14" height="h-2.5" className="bg-white/20" />
                    </div>
                  ) : (
                    <>
                      <div className="text-[11px] leading-tight font-bold truncate max-w-[120px]">{sellerUser?.name || 'Seller'}</div>
                      <div className="text-[9px] text-teal-200 leading-tight truncate">{sellerUser?.role || 'Seller'}</div>
                    </>
                  )}
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
            <aside className="hidden lg:block w-64 xl:w-72 shrink-0 self-start sticky top-6 z-30">
              <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-3.5 space-y-4 max-h-[calc(100vh-3rem)] overflow-y-auto hide-scrollbar no-scrollbar scrollbar-none">
                
                {/* Store Mini Profile */}
                {isLoadingSellerData ? (
                  <SkeletonMiniProfile />
                ) : (
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
                        {settings?.storeName || sellerUser?.storeName || 'Merchant Store'}
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
                        {sellerUser?.role || 'Seller'}
                      </span>
                    </div>
                  </div>
                )}

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
                        const websiteUrl = import.meta.env.VITE_WEBSITE_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5173' : 'https://book-vardi-website.vercel.app');
                        window.location.href = websiteUrl;
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
            <main className="flex-1 w-full min-w-0 min-h-[calc(100vh-100px)]">
              <Suspense fallback={
                <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <SkeletonText width="w-48" height="h-6" />
                    <SkeletonText width="w-24" height="h-6" />
                  </div>
                  <SkeletonText width="w-full" height="h-32" />
                  <SkeletonText width="w-3/4" height="h-20" />
                </div>
              }>
                {renderContent()}
              </Suspense>
            </main>

          </div>
        </div>

      </div>



      {/* Seller 12-Step Onboarding & Application Edit Modal */}
      <SellerRegistrationModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />
    </div>
  );
}
