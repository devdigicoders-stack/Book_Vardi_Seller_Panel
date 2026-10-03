import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  sendPhoneOtpApi,
  verifyPhoneOtpApi,
  submitSellerApplicationApi,
  fetchSellerStatusApi,
  adminApproveTestApi,
  fetchSellerProductsApi,
  createSellerProductApi,
  updateSellerProductApi,
  deleteSellerProductApi,
  fetchSellerKitsApi,
  createSellerKitApi,
  updateSellerKitApi,
  deleteSellerKitApi,
  updateStockApi,
  fetchSellerOrdersApi,
  updateOrderStatusApi,
  updateReturnExchangeStatusApi,
  fetchSchoolOrdersApi,
  createSchoolOrderApi,
  updateSchoolOrderApi,
  updateSchoolOrderStatusApi,
  deleteSchoolOrderApi,
  acceptSchoolOrderApi,
  submitSchoolQuoteApi,
  acceptBuyerCounterDemandApi,
  confirmSellerAcceptanceApi,
  reviseSchoolQuoteApi,
  fetchPromotionsApi,
  createPromotionApi,
  deletePromotionApi,
  togglePromotionStatusApi,
  fetchSellerWalletApi,
  requestPayoutApi,
  fetchSellerReviewsApi,
  approveSellerReviewApi,
  replySellerReviewApi,
  deleteSellerReviewApi,
  fetchSellerProfileApi,
  updateSellerProfileApi,
  fetchSellerSettingsApi,
  updateSellerSettingsApi,
  fetchSellerCustomersApi,
  downloadSellerInvoiceApi
} from '../utils/api';

export const APPROVED_SELLER_ROLES = [
  'Partner Merchant',
  'Store Manager',
  'Catalog Specialist',
  'Logistics Lead'
];

const SellerDataContext = createContext();

export const useSellerData = () => useContext(SellerDataContext) || {};

const parseBool = (val, defaultVal = true) => {
  if (val === undefined || val === null || val === '') return defaultVal;
  if (typeof val === 'boolean') return val;
  if (typeof val === 'string') {
    const s = val.trim().toLowerCase();
    if (s === 'false' || s === '0' || s === 'off' || s === 'no') return false;
    if (s === 'true' || s === '1' || s === 'on' || s === 'yes') return true;
  }
  if (typeof val === 'number') return val !== 0;
  return Boolean(val);
};

// Helper to resolve active seller profile from active user session keys first
// Helper to resolve active seller profile from active user session keys first
export const readActiveSellerProfile = () => {
  try {
    const regDataSaved = localStorage.getItem('bv_seller_reg_data');
    const sellerProfSaved = localStorage.getItem('book_vardi_seller_profile');
    const sellerUserSaved = localStorage.getItem('seller_user_profile');

    const regData = regDataSaved ? JSON.parse(regDataSaved) : {};
    const sellerProf = sellerProfSaved ? JSON.parse(sellerProfSaved) : {};
    const sellerUser = sellerUserSaved ? JSON.parse(sellerUserSaved) : {};

    const pickFirst = (...vals) => {
      for (const v of vals) {
        if (v !== undefined && v !== null && v !== '') {
          return v;
        }
      }
      return '';
    };

    const activeName = pickFirst(
      sellerUser.sellerName,
      sellerUser.ownerFullName,
      sellerUser.name,
      sellerProf.sellerName,
      sellerProf.ownerFullName,
      sellerProf.name,
      regData.sellerName,
      regData.ownerFullName,
      regData.name
    );

    const activeEmail = pickFirst(
      sellerUser.sellerEmail,
      sellerUser.email,
      sellerProf.sellerEmail,
      sellerProf.email,
      regData.sellerEmail,
      regData.email
    );

    const rawPhone = pickFirst(
      sellerUser.sellerPhone,
      sellerUser.phone,
      sellerProf.sellerPhone,
      sellerProf.phone,
      regData.sellerPhone,
      regData.phone
    );
    const activePhone = rawPhone ? (rawPhone.startsWith('+') ? rawPhone : `+91 ${rawPhone.replace(/\D/g, '').slice(-10)}`) : '';

    const merged = {
      ...regData,
      ...sellerProf,
      ...sellerUser
    };

    return {
      ...merged,
      name: activeName,
      email: activeEmail,
      phone: activePhone,
      role: pickFirst(sellerUser.role, merged.role, 'Seller'),
      designation: pickFirst(sellerUser.ownerDesignation, sellerUser.ownerDetails?.ownerDesignation, sellerProf.ownerDesignation, regData.ownerDesignation, regData.designation, 'Proprietor'),
      merchantId: pickFirst(sellerUser.merchantId, sellerProf.merchantId, regData.merchantId, ''),
      pan: pickFirst(sellerUser.ownerPan, sellerUser.businessPan, sellerUser.pan, sellerUser.documents?.panNumber, sellerProf.ownerPan, sellerProf.businessPan, sellerProf.pan, regData.ownerPan, regData.businessPan, regData.pan, ''),
      avatar: pickFirst(sellerUser.profilePhoto, sellerUser.avatar, sellerProf.avatar, sellerProf.profilePhoto, regData.profilePhoto, regData.avatar, ''),
      yearStarted: pickFirst(sellerUser.yearStarted, sellerUser.establishedYear, sellerUser.yearEstablished, sellerProf.yearStarted, sellerProf.establishedYear, regData.yearStarted, regData.establishedYear, ''),
      businessType: pickFirst(sellerUser.businessType, sellerProf.businessType, regData.businessType, 'Proprietorship'),
      annualTurnoverEstimate: pickFirst(sellerUser.annualTurnoverEstimate, sellerProf.annualTurnoverEstimate, regData.annualTurnoverEstimate, ''),
      ownerFullName: pickFirst(sellerUser.ownerFullName, sellerUser.ownerDetails?.ownerFullName, sellerProf.ownerFullName, regData.ownerFullName, activeName),
      ownerDesignation: pickFirst(sellerUser.ownerDesignation, sellerUser.ownerDetails?.ownerDesignation, sellerProf.ownerDesignation, regData.ownerDesignation, 'Proprietor'),
      ownerPan: pickFirst(sellerUser.ownerPan, sellerUser.ownerDetails?.ownerPan, sellerUser.pan, sellerProf.ownerPan, regData.ownerPan, ''),
      businessPan: pickFirst(sellerUser.businessPan, sellerUser.documents?.businessPan, sellerUser.documents?.panNumber, sellerUser.pan, sellerProf.businessPan, regData.businessPan, ''),
      ownerAadhaarLast4: pickFirst(sellerUser.ownerAadhaarLast4, sellerUser.ownerDetails?.ownerAadhaarLast4, (sellerUser?.documents?.aadhaarNumber ? String(sellerUser.documents.aadhaarNumber).slice(-4) : undefined), sellerProf.ownerAadhaarLast4, regData.ownerAadhaarLast4),
      gstin: pickFirst(sellerUser.gstin, sellerUser.gstNumber, sellerProf.gstin, sellerProf.gstNumber, regData.gstin, regData.gstNumber, ''),
      msmeRegistrationNumber: pickFirst(sellerUser.msmeRegistrationNumber, sellerUser.documents?.msmeRegistrationNumber, sellerProf.msmeRegistrationNumber, regData.msmeRegistrationNumber, ''),
      cinNumber: pickFirst(sellerUser.cinNumber, sellerUser.documents?.cinNumber, sellerProf.cinNumber, regData.cinNumber, ''),
      hasGstExemption: Boolean(sellerUser.hasGstExemption || sellerUser.documents?.hasGstExemption || sellerProf.hasGstExemption || regData.hasGstExemption),
      addressLine1: pickFirst(sellerUser.addressLine1, sellerUser.addressDetails?.addressLine1, sellerUser.address, sellerProf.addressLine1, regData.addressLine1, regData.address, ''),
      addressLine2: pickFirst(sellerUser.addressLine2, sellerUser.addressDetails?.addressLine2, sellerUser.colony, sellerProf.addressLine2, regData.addressLine2, regData.colony, ''),
      colony: pickFirst(sellerUser.colony, sellerUser.addressDetails?.addressLine2, sellerProf.colony, regData.colony, ''),
      landmark: pickFirst(sellerUser.landmark, sellerUser.addressDetails?.landmark, sellerProf.landmark, regData.landmark, ''),
      city: pickFirst(sellerUser.city, sellerUser.addressDetails?.city, sellerProf.city, regData.city, ''),
      state: pickFirst(sellerUser.state, sellerUser.addressDetails?.state, sellerProf.state, regData.state, ''),
      pincode: pickFirst(sellerUser.pincode, sellerUser.addressDetails?.pincode, sellerProf.pincode, regData.pincode, ''),
      addressProofType: pickFirst(sellerUser.addressProofType, sellerUser.addressProofDetails?.addressProofType, sellerProf.addressProofType, regData.addressProofType, ''),
      addressProofDocNumber: pickFirst(sellerUser.addressProofDocNumber, sellerUser.addressProofDetails?.addressProofDocNumber, sellerProf.addressProofDocNumber, regData.addressProofDocNumber, ''),
      addressProofFileName: pickFirst(sellerUser.addressProofFileName, sellerProf.addressProofFileName, regData.addressProofFileName, ''),
      bankAccountHolder: pickFirst(sellerUser.bankAccountHolder, sellerUser.bankDetails?.accountHolderName, sellerProf.bankAccountHolder, regData.bankAccountHolder, activeName),
      bankAccountNumber: pickFirst(sellerUser.bankAccountNumber, sellerUser.bankDetails?.accountNumber, sellerProf.bankAccountNumber, regData.bankAccountNumber, ''),
      bankIfscCode: pickFirst(sellerUser.bankIfscCode, sellerUser.bankDetails?.ifscCode, sellerProf.bankIfscCode, regData.bankIfscCode, ''),
      bankName: pickFirst(sellerUser.bankName, sellerUser.bankDetails?.bankName, sellerProf.bankName, regData.bankName, ''),
      bankBranch: pickFirst(sellerUser.bankBranch, sellerUser.bankDetails?.branchName, sellerUser.bankDetails?.bankBranch, sellerProf.bankBranch, regData.bankBranch, ''),
      accountType: pickFirst(sellerUser.accountType, sellerUser.bankDetails?.accountType, sellerProf.accountType, regData.accountType, 'Savings Account'),
      legalBusinessName: pickFirst(sellerUser.legalBusinessName, sellerUser.storeName, sellerProf.legalBusinessName, regData.legalBusinessName, ''),
      tradeName: pickFirst(sellerUser.tradeName, sellerUser.storeName, sellerProf.tradeName, regData.tradeName, ''),
      storeName: pickFirst(sellerUser.storeName, regData.storeName, ''),
      storeTagline: pickFirst(sellerUser.storeTagline, sellerUser.storeDetails?.storeTagline, sellerProf.storeTagline, regData.storeTagline, ''),
      storeDescription: pickFirst(sellerUser.storeDescription, sellerUser.storeDetails?.storeDescription, sellerProf.storeDescription, regData.storeDescription, ''),
      rejectionReason: pickFirst(sellerUser.rejectionReason, sellerProf.rejectionReason, regData.rejectionReason, ''),
      selectedCategories: (sellerUser.selectedCategories && sellerUser.selectedCategories.length > 0) ? sellerUser.selectedCategories : ((sellerProf.selectedCategories && sellerProf.selectedCategories.length > 0) ? sellerProf.selectedCategories : (regData.selectedCategories || [])),
      primaryBrands: (sellerUser.primaryBrands && sellerUser.primaryBrands.length > 0) ? sellerUser.primaryBrands : ((sellerProf.primaryBrands && sellerProf.primaryBrands.length > 0) ? sellerProf.primaryBrands : (regData.primaryBrands || [])),
      estimatedSkuCount: pickFirst(sellerUser.estimatedSkuCount, sellerProf.estimatedSkuCount, regData.estimatedSkuCount, ''),
      commissionPercentage: pickFirst(sellerUser.commissionPercentage, sellerUser.commissionRate, sellerProf.commissionPercentage, sellerProf.commissionRate, regData.commissionPercentage, regData.commissionRate, 5),
      commissionRate: pickFirst(sellerUser.commissionRate, sellerUser.commissionPercentage, sellerProf.commissionRate, sellerProf.commissionPercentage, regData.commissionRate, regData.commissionPercentage, 5),
      lastLogin: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    };
  } catch {
    return {
      name: '',
      email: '',
      phone: '',
      role: '',
      designation: '',
      merchantId: '',
      pan: '',
      avatar: '',
      yearStarted: '',
      lastLogin: ''
    };
  }
};

export const readActiveSellerSettings = () => {
  try {
    const regDataSaved = localStorage.getItem('bv_seller_reg_data');
    const sellerProfSaved = localStorage.getItem('book_vardi_seller_profile');
    const settingsSaved = localStorage.getItem('seller_settings');

    const regData = regDataSaved ? JSON.parse(regDataSaved) : {};
    const sellerProf = sellerProfSaved ? JSON.parse(sellerProfSaved) : {};
    const settings = settingsSaved ? JSON.parse(settingsSaved) : {};

    const merged = {
      ...regData,
      ...sellerProf,
      ...settings
    };

    const activeStoreName = merged.storeName || merged.tradeName || merged.legalBusinessName || merged.businessName || '';
    const activeEmail = merged.sellerEmail || merged.email || '';
    const rawPhone = merged.sellerPhone || merged.phone || '';
    const activePhone = rawPhone ? (rawPhone.startsWith('+') ? rawPhone : `+91 ${rawPhone.replace(/\D/g, '').slice(-10)}`) : '';

    return {
      ...merged,
      storeName: activeStoreName,
      legalName: merged.legalBusinessName || merged.legalName || activeStoreName,
      email: activeEmail,
      phone: activePhone,
      gstin: merged.gstin || merged.gstNumber || '',
      pan: merged.ownerPan || merged.businessPan || merged.pan || '',
      address: merged.registeredAddress || merged.addressLine1 || merged.address || '',
      city: merged.city || '',
      pincode: merged.pincode || '',
      yearStarted: merged.yearStarted || merged.establishedYear || merged.yearEstablished || ''
    };
  } catch {
    return {
      storeName: '',
      legalName: '',
      email: '',
      phone: '',
      gstin: '',
      pan: '',
      address: '',
      city: '',
      pincode: '',
      yearStarted: ''
    };
  }
};

export const SellerDataProvider = ({ children }) => {
  // Current Seller Profile & Role (Resolves active user credentials)
  const [sellerUser, setSellerUser] = useState(() => readActiveSellerProfile());

  // Seller status state ('approved' | 'pending' | 'in_review' | 'rejected')
  const [sellerStatus, setSellerStatus] = useState(() => {
    try {
      const regData = localStorage.getItem('bv_seller_reg_data');
      if (regData) {
        const parsed = JSON.parse(regData);
        if (parsed.submissionStatus || parsed.status) return parsed.submissionStatus || parsed.status;
      }
      const saved = localStorage.getItem('bv_seller_status');
      if (saved) return saved;
      const userProf = localStorage.getItem('seller_user_profile');
      if (userProf) {
        const parsedProf = JSON.parse(userProf);
        if (parsedProf.status || parsedProf.approvalStatus) return parsedProf.status || parsedProf.approvalStatus;
      }
      return 'pending';
    } catch {
      return 'pending';
    }
  });

  const isApproved = sellerStatus === 'approved';

  // Authentication state for Seller Hub (persisted in localStorage so seller stays logged in on page refresh)
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      const saved = localStorage.getItem('seller_is_authenticated');
      const token = localStorage.getItem('bv_seller_jwt_token') || localStorage.getItem('book_vardi_auth_token');
      const userProfStr = localStorage.getItem('seller_user_profile') || localStorage.getItem('bv_seller_reg_data');

      if (saved === 'true' && (token || userProfStr)) {
        return true;
      }
      if (saved === 'false') {
        return false;
      }
      return Boolean(token || userProfStr);
    } catch {
      return false;
    }
  });

  const [toastMessage, setToastMessage] = useState(null);
  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  }, []);

  // Clean up any old mock/abc registration data from localStorage if present
  useEffect(() => {
    try {
      const keysToCheck = ['bv_seller_reg_data', 'book_vardi_seller_profile', 'seller_user_profile'];
      keysToCheck.forEach(key => {
        const item = localStorage.getItem(key);
        if (item) {
          const lower = item.toLowerCase();
          if (lower.includes('"abc"') || lower.includes('abc books') || lower.includes('seller_abc') || lower.includes('merchant abc')) {
            localStorage.removeItem(key);
          }
        }
      });
    } catch {}
  }, []);

  // Loading state for product & seller profile fetching directly from backend MongoDB
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isLoadingSellerData, setIsLoadingSellerData] = useState(true);

  // Domain Entity States (Directly backed by MongoDB)
  const [products, setProducts] = useState(() => {
    try {
      const saved = localStorage.getItem('bv_seller_products');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [kits, setKits] = useState(() => {
    try {
      const saved = localStorage.getItem('bv_seller_kits');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isLoadingKits, setIsLoadingKits] = useState(false);
  const [orders, setOrders] = useState(() => {
    try {
      const saved = localStorage.getItem('bv_seller_orders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [promotions, setPromotions] = useState([]);
  const [schoolOrders, setSchoolOrders] = useState(() => {
    try {
      const savedSync = localStorage.getItem('bv_sync_school_orders');
      if (savedSync) return JSON.parse(savedSync);
      const savedAdmin = localStorage.getItem('admin_school_orders');
      if (savedAdmin) return JSON.parse(savedAdmin);
      const savedCust = localStorage.getItem('bv_customer_bulk_orders');
      if (savedCust) return JSON.parse(savedCust);
      return [];
    } catch {
      return [];
    }
  });
  const [customers, setCustomers] = useState([]);
  const [finance, setFinance] = useState({ totalRevenue: 0, netProfit: 0, pendingPayout: 0, availableBalance: 0, recentTransactions: [] });
  const [reviews, setReviews] = useState([]);

  // 8. Notifications State (Dynamic Real-time DB Alerts)
  const [readIds, setReadIds] = useState(() => {
    try {
      const stored = localStorage.getItem('seller_read_notif_ids');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  const [dismissedIds, setDismissedIds] = useState(() => {
    try {
      const stored = localStorage.getItem('seller_dismissed_notif_ids');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Dynamic notifications computed from live database entities
  const notifications = useMemo(() => {
    const list = [];
    const safeProducts = Array.isArray(products) ? products : [];
    const safeOrders = Array.isArray(orders) ? orders : [];
    const safeSchoolOrders = Array.isArray(schoolOrders) ? schoolOrders : [];
    const safeReviews = Array.isArray(reviews) ? reviews : [];

    // Low stock & Out of stock alerts
    safeProducts.forEach(p => {
      const qty = Number(p.stockQuantity ?? p.stock ?? 0);
      if (qty === 0 || p.inStock === false) {
        list.push({
          id: `notif-outstock-${p.id || p._id}`,
          title: `Out of Stock: ${p.name}`,
          message: `Product has 0 remaining units in inventory. Item is hidden from buyers.`,
          type: 'inventory',
          date: 'Urgent Alert'
        });
      } else if (qty > 0 && qty <= 10) {
        list.push({
          id: `notif-lowstock-${p.id || p._id}`,
          title: `Low Stock Warning: ${p.name}`,
          message: `Only ${qty} units remaining in stock. Restock soon to prevent losing sales.`,
          type: 'inventory',
          date: 'Live Stock Warning'
        });
      }
    });

    const formatNotifTime = (rawDate, createdAt) => {
      const source = createdAt || rawDate;
      if (!source) return 'N/A';
      if (source === 'Urgent Alert' || source === 'Live Stock Warning') return source;
      try {
        const d = new Date(source);
        if (!isNaN(d.getTime())) {
          return d.toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          });
        }
      } catch (e) {}
      return String(rawDate || 'N/A');
    };

    // Orders requiring fulfillment
    safeOrders.forEach(o => {
      if (o.status === 'Pending' || o.status === 'Processing') {
        list.push({
          id: `notif-order-${o.id}`,
          title: `Order Fulfillment Required (${o.id})`,
          message: `Customer ${o.customerName || 'N/A'} placed order worth ₹${Number(o.total || 0).toLocaleString('en-IN')}. Status: ${o.status}`,
          type: 'finance',
          date: formatNotifTime(o.date, o.createdAt)
        });
      }
    });

    // School Bulk Orders
    safeSchoolOrders.forEach(s => {
      list.push({
        id: `notif-school-${s.id || s._id}`,
        title: `B2B School Quote: ${s.schoolName || s.school || 'N/A'}`,
        message: `Quotation requested for ${s.quantity || s.units || 1} units of ${s.category || 'N/A'}.`,
        type: 'school',
        date: formatNotifTime(s.date, s.createdAt)
      });
    });

    // Seller product IDs set for verifying review notification ownership
    const sellerProductIdSet = new Set(
      safeProducts.flatMap(p => [
        p.id ? String(p.id) : null,
        p._id ? String(p._id) : null
      ]).filter(Boolean)
    );

    // Reviews needing response
    safeReviews.forEach(r => {
      const isSellerProduct =
        (r.productId && sellerProductIdSet.has(String(r.productId))) ||
        (r.sellerId && sellerUser?.id && String(r.sellerId) === String(sellerUser.id)) ||
        (!r.productId && sellerProductIdSet.size === 0);

      if (!r.reply && isSellerProduct) {
        list.push({
          id: `notif-review-${r.id || r._id}`,
          title: `New Customer Rating (${r.rating || 5}★)`,
          message: `${r.customerName || 'N/A'}: "${r.comment || 'N/A'}"`,
          type: 'review',
          date: formatNotifTime(r.date, r.createdAt)
        });
      }
    });

    return list
      .filter(n => !dismissedIds.has(n.id))
      .map(n => ({
        ...n,
        unread: !readIds.has(n.id)
      }));
  }, [products, orders, schoolOrders, reviews, readIds, dismissedIds]);

  // 9. Shipping Partners State
  const [shippingPartners, setShippingPartners] = useState(() => {
    try {
      const stored = localStorage.getItem('seller_shipping_partners');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // 10. Settings State (Resolves active store settings)
  const [settings, setSettings] = useState(() => readActiveSellerSettings());

  // Listen to active user changes / tab focus / status updates to keep seller user in sync
  useEffect(() => {
    const handleActiveUserChange = () => {
      const activeUser = readActiveSellerProfile();
      const activeSettings = readActiveSellerSettings();
      setSellerUser(activeUser);
      setSettings(activeSettings);
      try {
        localStorage.setItem('seller_user_profile', JSON.stringify(activeUser));
        localStorage.setItem('seller_settings', JSON.stringify(activeSettings));
      } catch (e) {}
    };

    handleActiveUserChange();
    window.addEventListener('storage', handleActiveUserChange);
    window.addEventListener('focus', handleActiveUserChange);
    window.addEventListener('bv_seller_status_updated', handleActiveUserChange);

    return () => {
      window.removeEventListener('storage', handleActiveUserChange);
      window.removeEventListener('focus', handleActiveUserChange);
      window.removeEventListener('bv_seller_status_updated', handleActiveUserChange);
    };
  }, []);

  const normalizeOrderList = (ordersList) => {
    if (!Array.isArray(ordersList)) return [];
    return ordersList.map(o => ({
      ...o,
      id: String(o.id || o._id || o.orderId || ''),
      _id: o._id || o.id,
      orderId: o.orderId || o.id || o._id,
      shippingAddress: typeof o.shippingAddress === 'object' && o.shippingAddress !== null
        ? [
            o.shippingAddress.name || o.shippingAddress.fullName,
            o.shippingAddress.addressLine || o.shippingAddress.street || o.shippingAddress.address,
            o.shippingAddress.colony || o.shippingAddress.landmark,
            o.shippingAddress.city,
            o.shippingAddress.state,
            o.shippingAddress.pincode ? `- ${o.shippingAddress.pincode}` : null,
            o.shippingAddress.phone ? `(Phone: ${o.shippingAddress.phone})` : null
          ].filter(Boolean).join(', ')
        : (o.shippingAddress || 'Store / Counter Pickup')
    }));
  };

  // Real-time synchronization of orders for seller panel
  useEffect(() => {
    const handleOrderSync = () => {
      if (!isAuthenticated) return;
      fetchSellerOrdersApi().then(ordersList => {
        if (Array.isArray(ordersList)) {
          const normalizedOrders = normalizeOrderList(ordersList);
          setOrders(normalizedOrders);
          try {
            localStorage.setItem('bv_seller_orders', JSON.stringify(normalizedOrders));
          } catch (e) {}
        }
      }).catch(() => {});
    };

    handleOrderSync();

    window.addEventListener('bv_orders_updated', handleOrderSync);
    window.addEventListener('focus', handleOrderSync);
    const storageHandler = (e) => {
      if (e.key === 'bv_order_sync_timestamp' || e.key === 'admin_orders' || e.key === 'bv_seller_orders') {
        handleOrderSync();
      }
    };
    window.addEventListener('storage', storageHandler);

    const pollInterval = setInterval(handleOrderSync, 5000);

    return () => {
      window.removeEventListener('bv_orders_updated', handleOrderSync);
      window.removeEventListener('focus', handleOrderSync);
      window.removeEventListener('storage', storageHandler);
      clearInterval(pollInterval);
    };
  }, [isAuthenticated]);

  // Initial API Data Sync on mount directly from backend DB
  useEffect(() => {
    let isMounted = true;
    if (!isAuthenticated) {
      setIsLoadingProducts(false);
      setIsLoadingSellerData(false);
      return;
    }
    async function loadBackendData() {
      setIsLoadingProducts(true);
      setIsLoadingSellerData(true);
      try {
        setIsLoadingKits(true);
        const [
          statusRes,
          productsRes,
          kitsRes,
          ordersRes,
          schoolRes,
          promosRes,
          walletRes,
          reviewsRes,
          profileRes,
          settingsRes,
          customersRes
        ] = await Promise.allSettled([
          fetchSellerStatusApi(),
          fetchSellerProductsApi(),
          fetchSellerKitsApi(),
          fetchSellerOrdersApi(),
          fetchSchoolOrdersApi(),
          fetchPromotionsApi(),
          fetchSellerWalletApi(),
          fetchSellerReviewsApi(),
          fetchSellerProfileApi(),
          fetchSellerSettingsApi(),
          fetchSellerCustomersApi()
        ]);

        if (!isMounted) return;

        if (statusRes.status === 'fulfilled' && (statusRes.value?.status || statusRes.value?.approvalStatus || statusRes.value?.sellerStatus)) {
          const backendStatus = statusRes.value.status || statusRes.value.approvalStatus || statusRes.value.sellerStatus;
          const backendReason = statusRes.value.rejectionReason || statusRes.value.reason || statusRes.value.message || '';
          setSellerStatus(backendStatus);
          localStorage.setItem('bv_seller_status', backendStatus);
          setSellerUser(prev => {
            const updated = { 
              ...prev, 
              status: backendStatus, 
              approvalStatus: backendStatus, 
              submissionStatus: backendStatus,
              rejectionReason: backendReason || prev?.rejectionReason || ''
            };
            try { localStorage.setItem('seller_user_profile', JSON.stringify(updated)); } catch (e) {}
            return updated;
          });
          try {
            const regData = localStorage.getItem('bv_seller_reg_data');
            if (regData) {
              const parsed = JSON.parse(regData);
              parsed.status = backendStatus;
              parsed.submissionStatus = backendStatus;
              parsed.approvalStatus = backendStatus;
              if (backendReason) parsed.rejectionReason = backendReason;
              localStorage.setItem('bv_seller_reg_data', JSON.stringify(parsed));
            }
          } catch (e) {}
        }

        if (productsRes.status === 'fulfilled' && Array.isArray(productsRes.value)) {
          const normalized = productsRes.value.map(p => {
            const idStr = String(p._id || p.id || '');
            let cleanSku = p.sku;
            if (!cleanSku || !String(cleanSku).trim() || String(cleanSku).includes('6ab') || String(cleanSku).length > 20) {
              const numericSuffix = idStr.length >= 6 ? (parseInt(idStr.slice(-6), 16) % 9000 + 1000) : Math.floor(1000 + Math.random() * 9000);
              cleanSku = `SC-${numericSuffix}`;
            } else {
              cleanSku = String(cleanSku).trim().toUpperCase();
            }
            return {
              ...p,
              id: p._id || p.id,
              _id: p._id || p.id,
              sku: cleanSku,
              displayId: cleanSku,
              stockQuantity: p.stockQuantity ?? p.stock ?? 50,
              inStock: p.inStock !== undefined ? p.inStock : ((p.stockQuantity ?? p.stock ?? 50) > 0)
            };
          });
          setProducts(normalized);
          try {
            localStorage.setItem('bv_seller_products', JSON.stringify(normalized));
          } catch (e) {}
        }

        if (kitsRes.status === 'fulfilled' && Array.isArray(kitsRes.value)) {
          const normalizedKits = kitsRes.value.map(k => {
            const idStr = String(k._id || k.id || '');
            let cleanSku = k.sku || k.kitCode;
            if (!cleanSku || !String(cleanSku).trim() || String(cleanSku).includes('6ab') || String(cleanSku).length > 20) {
              const numericSuffix = idStr.length >= 6 ? (parseInt(idStr.slice(-6), 16) % 9000 + 1000) : Math.floor(1000 + Math.random() * 9000);
              cleanSku = `KIT-${numericSuffix}`;
            } else {
              cleanSku = String(cleanSku).trim().toUpperCase();
            }
            return {
              ...k,
              id: k._id || k.id,
              _id: k._id || k.id,
              sku: cleanSku,
              displayId: cleanSku,
              stockQuantity: k.stockQuantity ?? k.stock ?? 25,
              inStock: (k.stockQuantity ?? k.stock ?? 25) > 0
            };
          });
          setKits(normalizedKits);
          try {
            localStorage.setItem('bv_seller_kits', JSON.stringify(normalizedKits));
          } catch (e) {}
        }
        setIsLoadingKits(false);

        if (ordersRes.status === 'fulfilled' && Array.isArray(ordersRes.value)) {
          const normalizedOrders = ordersRes.value.map(o => ({
            ...o,
            id: o._id || o.id,
            shippingAddress: typeof o.shippingAddress === 'object' && o.shippingAddress !== null
              ? [
                  o.shippingAddress.name || o.shippingAddress.fullName,
                  o.shippingAddress.addressLine || o.shippingAddress.street || o.shippingAddress.address,
                  o.shippingAddress.colony || o.shippingAddress.landmark,
                  o.shippingAddress.city,
                  o.shippingAddress.state,
                  o.shippingAddress.pincode ? `- ${o.shippingAddress.pincode}` : null,
                  o.shippingAddress.phone ? `(Phone: ${o.shippingAddress.phone})` : null
                ].filter(Boolean).join(', ')
              : (o.shippingAddress || 'Store / Counter Pickup')
          }));
          setOrders(normalizedOrders);
          try {
            localStorage.setItem('bv_seller_orders', JSON.stringify(normalizedOrders));
          } catch (e) {}
        }

        if (customersRes.status === 'fulfilled' && Array.isArray(customersRes.value)) {
          setCustomers(customersRes.value);
        }

        if (schoolRes.status === 'fulfilled' && Array.isArray(schoolRes.value)) {
          const apiList = schoolRes.value;
          let localList = [];
          try {
            const raw = localStorage.getItem('bv_sync_school_orders') || localStorage.getItem('admin_school_orders') || localStorage.getItem('bv_customer_bulk_orders');
            if (raw) localList = JSON.parse(raw);
          } catch {}
          const merged = [...apiList];
          if (Array.isArray(localList)) {
            localList.forEach(l => {
              const idx = merged.findIndex(m => String(m.id || m._id || m.referenceId) === String(l.id || l._id || l.referenceId));
              if (idx === -1) {
                merged.push(l);
              } else {
                const serverOrder = merged[idx];
                merged[idx] = {
                  ...l,
                  ...serverOrder,
                  status: serverOrder.status || l.status,
                  deliveryDetails: { ...l.deliveryDetails, ...serverOrder.deliveryDetails },
                  quotations: (Array.isArray(serverOrder.quotations) && serverOrder.quotations.length > 0)
                    ? serverOrder.quotations
                    : (l.quotations || []),
                  latestBuyerCounter: serverOrder.latestBuyerCounter || l.latestBuyerCounter,
                  negotiationStage: serverOrder.negotiationStage || l.negotiationStage,
                  currentVersion: serverOrder.currentVersion || l.currentVersion
                };
              }
            });
          }
          setSchoolOrders(merged);
          try { localStorage.setItem('bv_sync_school_orders', JSON.stringify(merged)); } catch {}
        }

        if (promosRes.status === 'fulfilled' && Array.isArray(promosRes.value)) {
          setPromotions(promosRes.value);
        }

        if (walletRes.status === 'fulfilled' && walletRes.value) {
          setFinance(walletRes.value);
        }

        if (reviewsRes.status === 'fulfilled' && Array.isArray(reviewsRes.value)) {
          setReviews(reviewsRes.value);
        }

        if (profileRes.status === 'fulfilled' && profileRes.value) {
          const val = profileRes.value;
          if (val.status || val.approvalStatus) {
            const pStatus = val.status || val.approvalStatus;
            setSellerStatus(pStatus);
            localStorage.setItem('bv_seller_status', pStatus);
          }
          const normalizedProfile = {
            status: val.status || val.approvalStatus,
            approvalStatus: val.status || val.approvalStatus,
            submissionStatus: val.status || val.approvalStatus,
            name: val.name || val.sellerName || val.ownerFullName || val.ownerDetails?.ownerFullName,
            email: val.email || val.sellerEmail,
            phone: val.phone || val.sellerPhone,
            storeName: val.storeName || val.tradeName || val.legalBusinessName,
            legalBusinessName: val.legalBusinessName || val.storeName,
            tradeName: val.tradeName || val.storeName,
            yearStarted: val.yearStarted || val.establishedYear || val.yearEstablished,
            businessType: val.businessType,
            annualTurnoverEstimate: val.annualTurnoverEstimate,
            ownerFullName: val.ownerDetails?.ownerFullName || val.ownerFullName || val.name,
            ownerDesignation: val.ownerDetails?.ownerDesignation || val.ownerDesignation || val.designation,
            ownerPan: val.ownerDetails?.ownerPan || val.documents?.panNumber || val.pan,
            businessPan: val.businessPan || val.documents?.businessPan || val.documents?.panNumber || val.pan,
            ownerAadhaarLast4: val.ownerDetails?.ownerAadhaarLast4 || (val.documents?.aadhaarNumber ? String(val.documents.aadhaarNumber).slice(-4) : undefined),
            gstin: val.gstNumber || val.gstin,
            hasGstExemption: val.hasGstExemption || val.documents?.hasGstExemption,
            msmeRegistrationNumber: val.msmeRegistrationNumber || val.documents?.msmeRegistrationNumber,
            cinNumber: val.cinNumber || val.documents?.cinNumber,
            addressLine1: val.addressDetails?.addressLine1 || val.addressLine1 || val.address,
            addressLine2: val.addressDetails?.addressLine2 || val.addressLine2 || val.colony,
            colony: val.addressDetails?.addressLine2 || val.colony,
            landmark: val.addressDetails?.landmark || val.landmark,
            city: val.city || val.addressDetails?.city,
            state: val.state || val.addressDetails?.state,
            pincode: val.pincode || val.addressDetails?.pincode,
            addressProofType: val.addressProofDetails?.addressProofType || val.addressProofType,
            addressProofDocNumber: val.addressProofDetails?.addressProofDocNumber || val.addressProofDocNumber,
            bankAccountHolder: val.bankDetails?.accountHolderName || val.bankAccountHolder || val.name,
            bankAccountNumber: val.bankDetails?.accountNumber || val.bankAccountNumber,
            bankIfscCode: val.bankDetails?.ifscCode || val.bankIfscCode,
            bankName: val.bankDetails?.bankName || val.bankName,
            bankBranch: val.bankDetails?.branchName || val.bankDetails?.bankBranch || val.bankBranch,
            accountType: val.bankDetails?.accountType || val.accountType,
            storeTagline: val.storeDetails?.storeTagline || val.storeTagline,
            storeDescription: val.storeDescription || val.storeDetails?.storeDescription,
            avatar: val.avatar || val.profilePhoto,
            documents: val.documents || {}
          };

          // Remove undefined or blank entries so existing local registration properties are preserved
          Object.keys(normalizedProfile).forEach(k => (normalizedProfile[k] === undefined || normalizedProfile[k] === null || normalizedProfile[k] === '') && delete normalizedProfile[k]);

          setSellerUser(prev => {
            const activeProf = readActiveSellerProfile();
            const updated = { ...activeProf, ...prev, ...normalizedProfile };
            try {
              localStorage.setItem('seller_user_profile', JSON.stringify(updated));
              const savedReg = localStorage.getItem('bv_seller_reg_data');
              const regObj = savedReg ? JSON.parse(savedReg) : {};
              localStorage.setItem('bv_seller_reg_data', JSON.stringify({ ...regObj, ...normalizedProfile }));
            } catch (e) {}
            return updated;
          });
        }

        if (settingsRes.status === 'fulfilled' && settingsRes.value) {
          setSettings(prev => ({ ...prev, ...settingsRes.value }));
        }
      } catch (err) {
        console.debug('Backend offline or empty:', err.message);
      } finally {
        if (isMounted) {
          setIsLoadingProducts(false);
          setIsLoadingSellerData(false);
        }
      }
    }

    if (isAuthenticated) {
      loadBackendData();
    } else {
      setIsLoadingProducts(false);
      setIsLoadingSellerData(false);
    }

    return () => { isMounted = false; };
  }, [isAuthenticated]);

  // Real-time synchronization of school orders across browser tabs/panels
  useEffect(() => {
    const handleSyncSchoolOrders = () => {
      try {
        const raw = localStorage.getItem('bv_sync_school_orders') || localStorage.getItem('admin_school_orders') || localStorage.getItem('bv_customer_bulk_orders');
        if (raw) {
          const list = JSON.parse(raw);
          if (Array.isArray(list) && list.length > 0) {
            setSchoolOrders(prev => {
              const merged = [...prev];
              list.forEach(item => {
                const idx = merged.findIndex(m => String(m.id || m._id || m.referenceId) === String(item.id || item._id || item.referenceId));
                if (idx === -1) {
                  merged.push(item);
                } else {
                  const current = merged[idx];
                  const hasRicherQuotations = Array.isArray(current.quotations) && current.quotations.some(q => (q.currentVersion || 1) >= (item.quotations?.[0]?.currentVersion || 1));
                  merged[idx] = {
                    ...item,
                    ...current,
                    quotations: hasRicherQuotations ? current.quotations : (item.quotations || current.quotations || []),
                    latestBuyerCounter: current.latestBuyerCounter || item.latestBuyerCounter,
                    negotiationStage: current.negotiationStage || item.negotiationStage,
                    currentVersion: current.currentVersion || item.currentVersion
                  };
                }
              });
              return merged;
            });
          }
        }
      } catch (err) {}
    };

    window.addEventListener('storage', handleSyncSchoolOrders);
    window.addEventListener('bv_school_orders_updated', handleSyncSchoolOrders);

    return () => {
      window.removeEventListener('storage', handleSyncSchoolOrders);
      window.removeEventListener('bv_school_orders_updated', handleSyncSchoolOrders);
    };
  }, []);

  const checkPermission = useCallback(() => {
    if (!isApproved) {
      throw new Error('Permission denied: You must be an approved seller to perform this action.');
    }
  }, [isApproved]);

  // Auth Methods
  const loginSellerByPhone = async (phoneInput, otpInput = '123456') => {
    const cleanPhone = (phoneInput || '').replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 8) {
      return { success: false, message: 'Please enter a valid mobile phone number.' };
    }

    try {
      const apiRes = await verifyPhoneOtpApi(cleanPhone, otpInput);
      if (apiRes && apiRes.token) {
        let resStatus = apiRes.sellerStatus || apiRes.status || apiRes.approvalStatus || apiRes.seller?.status || apiRes.seller?.approvalStatus || 'pending';

        setIsAuthenticated(true);
        setSellerStatus(resStatus);
        localStorage.setItem('bv_seller_status', resStatus);

        const sellerData = apiRes.seller || {};
        const resolvedName = sellerData.name || sellerData.sellerName || sellerData.ownerFullName || `Merchant ${cleanPhone.slice(-4)}`;
        const resolvedEmail = sellerData.email || sellerData.sellerEmail || `seller_${cleanPhone}@bookvardi.in`;
        const resolvedStoreName = sellerData.storeName || sellerData.tradeName || sellerData.legalBusinessName || `${resolvedName}'s Vardi Store`;

        const u = {
          ...sellerUser,
          ...sellerData,
          name: resolvedName,
          storeName: resolvedStoreName,
          phone: `+91 ${cleanPhone}`,
          email: resolvedEmail,
          status: resStatus,
          approvalStatus: resStatus,
          pan: sellerData.pan || sellerData.ownerPan || sellerUser.pan || ''
        };
        setSellerUser(u);
        localStorage.setItem('seller_user_profile', JSON.stringify(u));
        localStorage.setItem('seller_is_authenticated', JSON.stringify(true));

        return { success: true, token: apiRes.token, seller: u, status: resStatus };
      }
    } catch (e) {
      console.debug('Phone OTP API call failed, falling back to local auth:', e.message);
    }

    let savedApp = null;
    try {
      const saved = localStorage.getItem('bv_seller_reg_data');
      if (saved) savedApp = JSON.parse(saved);
    } catch {}

    const savedPhoneClean = (savedApp?.sellerPhone || savedApp?.phone || '').replace(/\D/g, '');
    const isPhoneMatch = savedApp && savedPhoneClean && savedPhoneClean.slice(-8) === cleanPhone.slice(-8);

    if (savedApp && !isPhoneMatch) {
      try {
        localStorage.removeItem('bv_seller_reg_data');
        localStorage.removeItem('book_vardi_seller_profile');
      } catch {}
    }

    const matchedName = isPhoneMatch ? (savedApp?.sellerName || savedApp?.ownerFullName || `Merchant ${cleanPhone.slice(-4)}`) : `Merchant ${cleanPhone.slice(-4)}`;
    const matchedEmail = isPhoneMatch ? (savedApp?.sellerEmail || `seller_${cleanPhone}@bookvardi.in`) : `seller_${cleanPhone}@bookvardi.in`;
    const matchedStoreName = isPhoneMatch ? (savedApp?.tradeName || savedApp?.storeName || savedApp?.legalBusinessName || `${matchedName}'s Vardi Store`) : `${matchedName}'s Vardi Store`;
    const status = isPhoneMatch ? (savedApp?.status || savedApp?.submissionStatus || 'pending') : (localStorage.getItem('bv_seller_status') || 'pending');

    const updatedUser = {
      ...sellerUser,
      name: matchedName,
      email: matchedEmail,
      phone: `+91 ${cleanPhone}`,
      role: 'Seller',
      status: status,
      approvalStatus: status,
      designation: isPhoneMatch ? (savedApp?.ownerDesignation || sellerUser.designation || '') : '',
      pan: isPhoneMatch ? (savedApp?.ownerPan || savedApp?.businessPan || sellerUser.pan || '') : '',
      avatar: isPhoneMatch ? (savedApp?.profilePhoto || sellerUser.avatar) : '',
      lastLogin: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    };

    const updatedSettings = {
      ...settings,
      storeName: matchedStoreName,
      email: matchedEmail,
      phone: `+91 ${cleanPhone}`,
      gstin: isPhoneMatch ? (savedApp?.gstin || settings.gstin) : '',
      pan: isPhoneMatch ? (savedApp?.ownerPan || savedApp?.businessPan || settings.pan) : ''
    };

    setSellerUser(updatedUser);
    setSettings(updatedSettings);
    setSellerStatus(status);
    setIsAuthenticated(true);
    localStorage.setItem('seller_user_profile', JSON.stringify(updatedUser));
    localStorage.setItem('seller_settings', JSON.stringify(updatedSettings));
    localStorage.setItem('seller_is_authenticated', JSON.stringify(true));
    localStorage.setItem('bv_seller_status', status);

    return { success: true, seller: updatedUser, status };
  };

  const submitSellerApplication = async (appData) => {
    try {
      localStorage.setItem('bv_seller_reg_data', JSON.stringify(appData));
      localStorage.setItem('bv_seller_status', 'pending');
    } catch {}

    const matchedName = appData.sellerName || appData.ownerFullName || sellerUser.name;
    const matchedPhone = appData.sellerPhone ? `+91 ${appData.sellerPhone.replace(/\D/g, '')}` : sellerUser.phone;
    const matchedEmail = appData.sellerEmail || sellerUser.email;
    const matchedStoreName = appData.tradeName || appData.storeName || appData.legalBusinessName || settings.storeName;

    const updatedUser = {
      ...sellerUser,
      name: matchedName,
      email: matchedEmail,
      phone: matchedPhone,
      avatar: appData.profilePhoto || sellerUser.avatar,
      pan: appData.ownerPan || appData.businessPan || sellerUser.pan,
      designation: appData.ownerDesignation || sellerUser.designation,
      merchantId: appData.merchantId || sellerUser.merchantId || `BV-SLR-${Math.floor(1000 + Math.random() * 9000)}`
    };

    const updatedSettings = {
      ...settings,
      storeName: matchedStoreName,
      legalName: appData.legalBusinessName || settings.legalName,
      email: matchedEmail,
      phone: matchedPhone,
      gstin: appData.gstin || settings.gstin,
      pan: appData.ownerPan || appData.businessPan || settings.pan,
      address: appData.registeredAddress || settings.address,
      city: appData.city || settings.city,
      pincode: appData.pincode || settings.pincode
    };

    setSellerUser(updatedUser);
    setSettings(updatedSettings);
    setSellerStatus('pending');
    setIsAuthenticated(true);
    localStorage.setItem('seller_user_profile', JSON.stringify(updatedUser));
    localStorage.setItem('seller_settings', JSON.stringify(updatedSettings));
    localStorage.setItem('seller_is_authenticated', JSON.stringify(true));

    submitSellerApplicationApi(appData).catch(() => {});
  };

  const approveSellerApplication = async () => {
    try {
      localStorage.setItem('bv_seller_status', 'approved');
      const saved = localStorage.getItem('bv_seller_reg_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        parsed.status = 'approved';
        parsed.submissionStatus = 'approved';
        localStorage.setItem('bv_seller_reg_data', JSON.stringify(parsed));
      }
      setSellerUser(prev => {
        const next = { ...prev, status: 'approved', approvalStatus: 'approved', submissionStatus: 'approved' };
        try { localStorage.setItem('seller_user_profile', JSON.stringify(next)); } catch (e) {}
        return next;
      });
    } catch {}
    setSellerStatus('approved');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('bv_seller_status_updated', { detail: { status: 'approved' } }));
    }
    adminApproveTestApi().catch(() => {});
  };

  const checkSellerStatus = useCallback(async () => {
    try {
      const res = await fetchSellerStatusApi(sellerUser?.phone);
      if (res && (res.status || res.approvalStatus || res.sellerStatus)) {
        const newStatus = res.approvalStatus || res.status || res.sellerStatus || sellerStatus;
        setSellerStatus(newStatus);
        localStorage.setItem('bv_seller_status', newStatus);

        setSellerUser(prev => {
          const updated = { ...prev, status: newStatus, approvalStatus: newStatus, submissionStatus: newStatus };
          try { localStorage.setItem('seller_user_profile', JSON.stringify(updated)); } catch (e) {}
          return updated;
        });

        try {
          const regData = localStorage.getItem('bv_seller_reg_data');
          if (regData) {
            const parsed = JSON.parse(regData);
            parsed.status = newStatus;
            parsed.submissionStatus = newStatus;
            parsed.approvalStatus = newStatus;
            localStorage.setItem('bv_seller_reg_data', JSON.stringify(parsed));
          }
        } catch (e) {}

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('bv_seller_status_updated', { detail: { status: newStatus } }));
        }
        return newStatus;
      }
    } catch (e) {
      console.error(e);
    }
    return sellerStatus;
  }, [sellerStatus, sellerUser?.phone]);

  const loginSeller = ({ email, role }) => {
    let currentStatus = 'pending';
    try {
      const savedReg = localStorage.getItem('bv_seller_reg_data');
      if (savedReg) {
        const parsed = JSON.parse(savedReg);
        if (parsed.status || parsed.submissionStatus) currentStatus = parsed.status || parsed.submissionStatus;
      } else {
        currentStatus = localStorage.getItem('bv_seller_status') || 'pending';
      }
    } catch {}

    const updated = {
      ...sellerUser,
      email: email || sellerUser.email,
      role: role || 'Seller',
      lastLogin: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    };
    setSellerUser(updated);
    setIsAuthenticated(true);
    setSellerStatus(currentStatus);
    localStorage.setItem('seller_user_profile', JSON.stringify(updated));
    localStorage.setItem('seller_is_authenticated', JSON.stringify(true));
    localStorage.setItem('bv_seller_status', currentStatus);
    setTimeout(() => {
      if (typeof window !== 'undefined') window.location.reload();
    }, 50);
  };

  const logoutSeller = () => {
    setIsAuthenticated(false);
    try {
      localStorage.setItem('seller_is_authenticated', JSON.stringify(false));
      localStorage.removeItem('seller_user_profile');
      localStorage.removeItem('seller_settings');
      localStorage.removeItem('bv_seller_reg_data');
      localStorage.removeItem('book_vardi_seller_profile');
      localStorage.removeItem('bv_seller_status');
      localStorage.removeItem('bv_seller_jwt_token');
      localStorage.removeItem('seller_read_notif_ids');
      localStorage.removeItem('seller_dismissed_notif_ids');
    } catch {}
    setTimeout(() => {
      if (typeof window !== 'undefined') window.location.reload();
    }, 50);
  };

  const updateSellerProfile = (updates) => {
    setSellerUser(prev => {
      const activeProf = readActiveSellerProfile();
      const next = { ...activeProf, ...prev, ...updates };
      try {
        localStorage.setItem('seller_user_profile', JSON.stringify(next));
        const savedReg = localStorage.getItem('bv_seller_reg_data');
        const regObj = savedReg ? JSON.parse(savedReg) : {};
        localStorage.setItem('bv_seller_reg_data', JSON.stringify({ ...regObj, ...updates }));
      } catch (e) {}
      return next;
    });
    updateSellerProfileApi(updates).catch(() => {});
  };

  // Product Actions
  const addProduct = (newProduct) => {
    checkPermission();
    if (!newProduct.name || String(newProduct.name).trim() === '') {
      throw new Error('Validation failed: Product name is required.');
    }
    const price = Number(newProduct.price);
    if (isNaN(price) || price <= 0) {
      throw new Error('Validation failed: Product price must be greater than 0.');
    }

    const createdProduct = {
      ...newProduct,
      id: newProduct.id ? Number(newProduct.id) : Date.now(),
      name: (newProduct.name || newProduct.title || '').trim(),
      subtitle: newProduct.subtitle || '',
      category: newProduct.category || 'uniforms',
      subCategory: newProduct.subCategory || '',
      schoolName: newProduct.schoolName || '',
      schoolCode: newProduct.schoolCode || '',
      classGrade: newProduct.classGrade || '',
      price: price,
      originalPrice: Number(newProduct.originalPrice) || Math.round(price * 1.25),
      mrp: Number(newProduct.mrp || newProduct.originalPrice) || Math.round(price * 1.25),
      discountBadge: newProduct.discountBadge || 'NEW',
      rating: newProduct.rating !== undefined ? Number(newProduct.rating) : 0,
      reviewsCount: Number(newProduct.reviewsCount) || 0,
      stock: newProduct.stockQuantity !== undefined ? Number(newProduct.stockQuantity) : (newProduct.stock !== undefined ? Number(newProduct.stock) : 50),
      stockQuantity: newProduct.stockQuantity !== undefined ? Number(newProduct.stockQuantity) : (newProduct.stock !== undefined ? Number(newProduct.stock) : 50),
      inStock: newProduct.inStock !== undefined ? Boolean(newProduct.inStock) : ((newProduct.stockQuantity ?? newProduct.stock ?? 50) > 0),
      image: newProduct.image || (Array.isArray(newProduct.images) ? newProduct.images[0] : '') || '',
      images: Array.isArray(newProduct.images) ? newProduct.images : (newProduct.image ? [newProduct.image] : []),
      sizes: Array.isArray(newProduct.sizes) ? newProduct.sizes : [],
      sizeVariants: Array.isArray(newProduct.sizeVariants) ? newProduct.sizeVariants : [],
      colors: Array.isArray(newProduct.colors) ? newProduct.colors : [],
      gender: newProduct.gender || 'Unisex',
      description: newProduct.description || '',
      sku: newProduct.sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      gst: newProduct.gst !== undefined ? Number(newProduct.gst) : 5,
      gstPercentage: newProduct.gstPercentage !== undefined ? Number(newProduct.gstPercentage) : (newProduct.gst !== undefined ? Number(newProduct.gst) : 5),
      isGstInclusive: parseBool(newProduct.isGstInclusive, true),
      isReturnable: newProduct.isReturnable !== undefined ? Boolean(newProduct.isReturnable) : true,
      isExchangeable: newProduct.isExchangeable !== undefined ? Boolean(newProduct.isExchangeable) : true,
      returnWindowDays: Number(newProduct.returnWindowDays) || 7,
      isMeterBased: Boolean(newProduct.isMeterBased),
      minMeter: Number(newProduct.minMeter) || 0.5,
      meterStep: Number(newProduct.meterStep) || 0.5,
      paymentMethodAllowed: newProduct.paymentMethodAllowed || 'Both',
      paymentMethodsAllowed: newProduct.paymentMethodsAllowed || (newProduct.paymentMethodAllowed === 'COD_Only' ? ['COD'] : newProduct.paymentMethodAllowed === 'Online_Only' ? ['Online'] : ['COD', 'Online']),
      approvalStatus: newProduct.approvalStatus || 'Pending',
      approvalComment: newProduct.approvalComment || 'Submitted for admin review',
      rejectionReason: null
    };

    setProducts(prev => [createdProduct, ...prev]);
    showToast(`Product "${createdProduct.name}" submitted for Admin Approval!`);

    createSellerProductApi(createdProduct)
      .then(res => {
        if (res && res.product && (res.product._id || res.product.id)) {
          const realId = res.product._id || res.product.id;
          setProducts(prev => {
            const updated = prev.map(p => (p.id === createdProduct.id || p.name === createdProduct.name) ? { ...p, ...res.product, id: realId, _id: realId } : p);
            return updated;
          });

          // Trigger Admin Notification & Storage Sync for product approval
          try {
            const savedNotifs = localStorage.getItem('admin_notifications');
            let notifList = savedNotifs ? JSON.parse(savedNotifs) : [];
            const newNotif = {
              id: Date.now(),
              title: "New Product Submitted for Approval",
              message: `Seller "${sellerUser?.storeName || sellerUser?.name || 'Partner Merchant'}" submitted product "${createdProduct.name}" for review.`,
              type: "product_approval",
              productId: realId,
              time: "Just now",
              unread: true
            };
            notifList = [newNotif, ...notifList];
            localStorage.setItem('admin_notifications', JSON.stringify(notifList));

            // Sync with admin and website products list
            const savedAdminProds = localStorage.getItem('admin_products') || localStorage.getItem('bv_sync_products');
            let adminProds = savedAdminProds ? JSON.parse(savedAdminProds) : [];
            adminProds = [{ ...createdProduct, id: realId, _id: realId, approvalStatus: 'Pending', sellerName: sellerUser?.storeName || sellerUser?.name || 'Seller' }, ...adminProds];
            localStorage.setItem('admin_products', JSON.stringify(adminProds));
            localStorage.setItem('bv_sync_products', JSON.stringify(adminProds));

            window.dispatchEvent(new CustomEvent('adminNotificationReceived', { detail: newNotif }));
            window.dispatchEvent(new CustomEvent('adminProductsUpdated', { detail: adminProds }));
            window.dispatchEvent(new CustomEvent('bv_products_updated', { detail: adminProds }));
          } catch (e) {
            console.warn('Admin notification sync error:', e);
          }
        }
      })
      .catch(err => {
        console.error('Failed to create product on server:', err);
      });
    return createdProduct;
  };

  const editProduct = (id, updates) => {
    checkPermission();
    const strId = String(id);
    if (updates.name !== undefined && String(updates.name).trim() === '') {
      throw new Error('Validation failed: Product name cannot be empty.');
    }
    if (updates.price !== undefined && (Number(updates.price) <= 0 || isNaN(Number(updates.price)))) {
      throw new Error('Validation failed: Product price must be greater than 0.');
    }

    const isMatch = (p) => String(p.id) === strId || String(p._id) === strId || p.id == id || p._id == id;

    setProducts(prev => {
      const updated = prev.map(p => {
        if (isMatch(p)) {
          const isPreviouslyRejected = p.approvalStatus === 'Rejected';
          const nextApprovalStatus = isPreviouslyRejected 
            ? 'Pending' 
            : (updates.approvalStatus !== undefined ? updates.approvalStatus : (p.approvalStatus || 'Approved'));
          const nextApprovalComment = isPreviouslyRejected 
            ? 'Resubmitted with modifications for admin review' 
            : (updates.approvalComment !== undefined ? updates.approvalComment : (p.approvalComment || ''));

          return {
            ...p,
            ...updates,
            price: updates.price !== undefined ? Number(updates.price) : p.price,
            originalPrice: updates.originalPrice !== undefined ? Number(updates.originalPrice) : p.originalPrice,
            stockQuantity: updates.stockQuantity !== undefined ? Number(updates.stockQuantity) : (p.stockQuantity ?? 50),
            isGstInclusive: updates.isGstInclusive !== undefined 
              ? parseBool(updates.isGstInclusive, p.isGstInclusive ?? true) 
              : (p.isGstInclusive ?? true),
            inStock: updates.inStock !== undefined 
              ? updates.inStock 
              : (updates.stockQuantity !== undefined ? Number(updates.stockQuantity) > 0 : p.inStock),
            approvalStatus: nextApprovalStatus,
            approvalComment: nextApprovalComment,
            rejectionReason: isPreviouslyRejected ? null : (updates.rejectionReason !== undefined ? updates.rejectionReason : p.rejectionReason)
          };
        }
        return p;
      });

      try {
        localStorage.setItem('bv_seller_products', JSON.stringify(updated));
        localStorage.setItem('admin_products', JSON.stringify(updated));
        localStorage.setItem('bv_sync_products', JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('bv_products_updated', { detail: updated }));
      } catch (e) {}

      return updated;
    });

    updateSellerProductApi(id, updates)
      .then(res => {
        if (res && (res.product || res._id || res.id)) {
          const serverProduct = res.product || res;
          const realId = serverProduct._id || serverProduct.id || id;
          setProducts(prev => {
            const updated = prev.map(p => isMatch(p) ? { ...p, ...serverProduct, id: realId, _id: realId } : p);
            try {
              localStorage.setItem('bv_seller_products', JSON.stringify(updated));
              localStorage.setItem('admin_products', JSON.stringify(updated));
              localStorage.setItem('bv_sync_products', JSON.stringify(updated));
            } catch (e) {}
            return updated;
          });
        }
      })
      .catch(err => {
        console.error('Failed to sync product update with server backend:', err);
      });

    showToast('Product updated successfully!');
  };

  const toggleProductStatus = (id, overrideStock = null) => {
    checkPermission();
    const strId = String(id);
    const target = products.find(p => String(p.id || p._id) === strId);
    if (!target) return;

    const currentQty = Number(target.stockQuantity ?? target.stock ?? 0);
    const isCurrentlyActive = Boolean(target.inStock) && currentQty > 0;

    if (!isCurrentlyActive && currentQty === 0) {
      if (overrideStock === null || overrideStock === undefined || Number(overrideStock) <= 0) {
        throw new Error('Validation failed: Product stock must be a positive stock count before activating an out-of-stock product.');
      }
    }

    const nextStock = overrideStock !== null && overrideStock !== undefined
      ? Number(overrideStock)
      : (isCurrentlyActive ? 0 : (currentQty > 0 ? currentQty : 50));
    const nextStatus = nextStock > 0;

    setProducts(prev => {
      const updated = prev.map(p => String(p.id || p._id) === strId ? {
        ...p,
        inStock: nextStatus,
        stockQuantity: nextStock
      } : p);
      return updated;
    });
    updateStockApi(id, nextStock).catch(() => {});
    showToast(nextStatus ? 'Product activated' : 'Product deactivated');
  };

  const deleteProduct = (id) => {
    checkPermission();
    const strId = String(id);
    setProducts(prev => {
      const updated = prev.filter(p => String(p.id || p._id) !== strId);
      return updated;
    });
    deleteSellerProductApi(id).catch(() => {});
    showToast('Product deleted successfully!');
  };

  // ==========================================
  // Kit / Bundle Actions
  // ==========================================
  const addKit = async (newKit) => {
    checkPermission();
    if (!newKit.title && !newKit.name) {
      throw new Error('Validation failed: Kit Bundle Title is required.');
    }
    if (!newKit.schoolName) {
      throw new Error('Validation failed: School Name is required.');
    }
    if (!Array.isArray(newKit.items) || newKit.items.length === 0) {
      throw new Error('Validation failed: Kit must contain at least one item.');
    }

    const tempId = newKit.id || newKit._id || Date.now();
    const createdKit = {
      ...newKit,
      id: tempId,
      _id: tempId,
      title: (newKit.title || newKit.name).trim(),
      name: (newKit.title || newKit.name).trim(),
      category: 'kits',
      approvalStatus: newKit.approvalStatus || 'Pending',
      status: newKit.status || 'available'
    };

    setKits(prev => {
      const updated = [createdKit, ...prev];
      try { localStorage.setItem('bv_seller_kits', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });
    showToast(`Kit Bundle "${createdKit.title}" submitted for Admin Approval!`);

    try {
      const res = await createSellerKitApi(createdKit);
      if (res && res.kit && (res.kit._id || res.kit.id)) {
        const realId = res.kit._id || res.kit.id;
        setKits(prev => {
          const updated = prev.map(k => (k.id === tempId || k.title === createdKit.title) ? { ...k, ...res.kit, id: realId, _id: realId } : k);
          try { localStorage.setItem('bv_seller_kits', JSON.stringify(updated)); } catch (e) {}
          return updated;
        });
        return res.kit;
      }
    } catch (err) {
      console.error('Failed to create kit on server:', err);
    }
    return createdKit;
  };

  const editKit = async (id, updates) => {
    checkPermission();
    const strId = String(id);
    setKits(prev => {
      const updated = prev.map(k => {
        if (String(k.id || k._id) === strId) {
          return {
            ...k,
            ...updates,
            title: (updates.title || updates.name || k.title).trim(),
            name: (updates.title || updates.name || k.title).trim()
          };
        }
        return k;
      });
      try { localStorage.setItem('bv_seller_kits', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });

    showToast('Kit Bundle updated successfully!');
    try {
      await updateSellerKitApi(id, updates);
    } catch (err) {
      console.error('Failed to update kit on server:', err);
    }
  };

  const deleteKit = async (id) => {
    checkPermission();
    const strId = String(id);
    setKits(prev => {
      const updated = prev.filter(k => String(k.id || k._id) !== strId);
      try { localStorage.setItem('bv_seller_kits', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });
    showToast('Kit Bundle deleted successfully!');
    try {
      await deleteSellerKitApi(id);
    } catch (err) {
      console.error('Failed to delete kit on server:', err);
    }
  };

  const toggleKitStatus = async (id) => {
    checkPermission();
    const strId = String(id);
    let nextStatus = 'available';
    setKits(prev => {
      const updated = prev.map(k => {
        if (String(k.id || k._id) === strId) {
          nextStatus = k.status === 'available' ? 'inactive' : 'available';
          return { ...k, status: nextStatus };
        }
        return k;
      });
      try { localStorage.setItem('bv_seller_kits', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });
    try {
      await updateSellerKitApi(id, { status: nextStatus });
    } catch (err) {}
  };

  const refreshKits = async () => {
    setIsLoadingKits(true);
    try {
      const res = await fetchSellerKitsApi();
      if (Array.isArray(res)) {
        const normalized = res.map(k => ({ ...k, id: k._id || k.id, _id: k._id || k.id }));
        setKits(normalized);
        try { localStorage.setItem('bv_seller_kits', JSON.stringify(normalized)); } catch (e) {}
      }
    } finally {
      setIsLoadingKits(false);
    }
  };

  const bulkAddOrUpdateProducts = (productList) => {
    checkPermission();
    if (!Array.isArray(productList) || productList.length === 0) {
      throw new Error('No valid products to import.');
    }

    setProducts(prev => {
      const existingMap = new Map(prev.map(p => [String(p.id), p]));

      productList.forEach(item => {
        if (!item.name || Number(item.price) <= 0) return;
        const id = item.id ? String(item.id) : String(Date.now() + Math.floor(Math.random() * 10000));
        const current = existingMap.get(id) || {};
        
        existingMap.set(id, {
          ...current,
          id: isNaN(Number(id)) ? id : Number(id),
          name: item.name,
          category: item.category || current.category || 'uniforms',
          price: Number(item.price),
          originalPrice: Number(item.originalPrice) || (current.originalPrice ?? Math.round(Number(item.price) * 1.25)),
          stockQuantity: Number(item.stockQuantity) || (current.stockQuantity ?? 50),
          inStock: (Number(item.stockQuantity) || (current.stockQuantity ?? 50)) > 0,
          sizes: Array.isArray(item.sizes) ? item.sizes : (item.sizes ? String(item.sizes).split(',').map(s => s.trim()) : (current.sizes || ['M', 'L'])),
          colors: Array.isArray(item.colors) ? item.colors : (item.colors ? String(item.colors).split(',').map(c => c.trim()) : (current.colors || ['Blue'])),
          gender: item.gender || current.gender || 'Unisex',
          image: item.image || current.image || '',
          sku: item.sku || current.sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`
        });
      });

      const updated = Array.from(existingMap.values());
      return updated;
    });
  };

  const updateProductStock = (id, newQuantity) => {
    checkPermission();
    const qty = Math.max(0, Number(newQuantity) || 0);
    editProduct(id, { stockQuantity: qty, inStock: qty > 0 });
    updateStockApi(id, qty).catch(() => {});
  };

  const updateVariantStock = (id, updatedSizeVariants) => {
    checkPermission();
    const strId = String(id);

    if (Array.isArray(updatedSizeVariants)) {
      const totalVariantStock = updatedSizeVariants.reduce((sum, v) => sum + Math.max(0, Number(v.stockQuantity ?? v.stock ?? 0)), 0);

      setProducts(prev => {
        const updated = prev.map(p => {
          if (String(p.id) === strId || String(p._id) === strId || p.id == id || p._id == id) {
            return {
              ...p,
              sizeVariants: updatedSizeVariants,
              stockQuantity: totalVariantStock,
              stock: totalVariantStock,
              inStock: totalVariantStock > 0
            };
          }
          return p;
        });

        try {
          localStorage.setItem('bv_seller_products', JSON.stringify(updated));
          localStorage.setItem('admin_products', JSON.stringify(updated));
          localStorage.setItem('bv_sync_products', JSON.stringify(updated));
          window.dispatchEvent(new CustomEvent('bv_products_updated', { detail: updated }));
        } catch (e) {}

        return updated;
      });

      updateSellerProductApi(id, {
        sizeVariants: updatedSizeVariants,
        stockQuantity: totalVariantStock,
        stock: totalVariantStock,
        inStock: totalVariantStock > 0
      }).catch(err => {
        console.error('Failed to update variant stock on server backend:', err);
      });

      showToast('Variant stock updated successfully!');
    } else {
      updateProductStock(id, updatedSizeVariants);
    }
  };

  // Order Actions
  const addOrder = (order) => {
    checkPermission();
    const newOrder = {
      id: order.id || `ORD-2026-${Math.floor(100 + Math.random() * 900)}`,
      customerName: order.customerName || 'New Customer',
      customerEmail: order.customerEmail || 'customer@example.com',
      customerPhone: order.customerPhone || '+91 98000 00000',
      school: order.school || 'General Public',
      date: order.date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      total: Number(order.total) || 0,
      itemsCount: order.items?.length || 1,
      status: order.status || 'Pending',
      paymentMethod: order.paymentMethod || 'UPI',
      paymentStatus: order.paymentStatus || 'Paid',
      shippingAddress: order.shippingAddress || 'Customer Address',
      trackingNumber: order.trackingNumber || `TRACK-${Math.floor(100000 + Math.random() * 900000)}`,
      items: order.items || []
    };
    setOrders(prev => {
      const updated = [newOrder, ...prev];
      return updated;
    });
    return newOrder;
  };

  const editOrder = (id, updates) => {
    checkPermission();
    const strId = String(id);
    setOrders(prev => {
      const updated = prev.map(o => (String(o.id || o._id) === strId ? { ...o, ...updates } : o));
      return updated;
    });
  };

  const updateOrderStatus = async (id, status, details = {}) => {
    checkPermission();
    editOrder(id, { status, ...details });
    try {
      const res = await updateOrderStatusApi(id, status, details);
      if (res && res.order) {
        editOrder(id, { ...res.order, status: res.order.status || status });
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('bv_orders_updated', { detail: { orderId: id, status, ...details } }));
        localStorage.setItem('bv_order_sync_timestamp', Date.now().toString());
      }
      showToast(`Order #${id} status updated to ${status}`);
      return res;
    } catch (err) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('bv_orders_updated', { detail: { orderId: id, status, ...details } }));
        localStorage.setItem('bv_order_sync_timestamp', Date.now().toString());
      }
      showToast(`Order #${id} status updated locally.`);
      return null;
    }
  };

  const updateReturnExchangeStatus = async (id, payload) => {
    checkPermission();
    try {
      const res = await updateReturnExchangeStatusApi(id, payload);
      if (res && res.order) {
        editOrder(id, {
          ...res.order,
          status: res.order.status || payload.status,
          returnRequest: res.order.returnRequest
        });
      }
      showToast(`Return/Exchange request updated successfully!`);
      fetchSellerOrdersApi().then(orderList => {
        if (Array.isArray(orderList)) setOrders(normalizeOrderList(orderList));
      }).catch(() => {});
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('bv_order_sync_timestamp', Date.now().toString());
          window.dispatchEvent(new CustomEvent('bv_orders_updated', { detail: { orderId: id, ...payload } }));
        } catch (e) {}
      }
      return res;
    } catch (err) {
      showToast(`Failed to update Return/Exchange status.`);
      return null;
    }
  };

  const deleteOrder = (id) => {
    checkPermission();
    setOrders(prev => {
      const updated = prev.filter(o => o.id !== id);
      return updated;
    });
  };

  const downloadSellerInvoice = async (id) => {
    checkPermission();
    const res = await downloadSellerInvoiceApi(id);
    if (res?.success) {
      showToast(`Tax invoice PDF downloaded for Order #${id}`);
    } else {
      showToast(res?.message || 'Failed to download tax invoice PDF');
    }
  };

  // Promotions Actions
  const addPromotion = (promo) => {
    checkPermission();
    if (!promo.code || String(promo.code).trim() === '') {
      throw new Error('Validation failed: Promotion code is required.');
    }
    const discountVal = Number(promo.discountValue);
    if (isNaN(discountVal) || discountVal <= 0) {
      throw new Error('Validation failed: Discount value must be greater than 0.');
    }

    const newPromo = {
      id: Date.now(),
      code: promo.code.trim().toUpperCase(),
      title: promo.title || promo.code.trim().toUpperCase(),
      discountType: promo.discountType || 'percentage',
      discountValue: discountVal,
      minOrderValue: Number(promo.minOrderValue) || 499,
      maxDiscount: Number(promo.maxDiscount) || 300,
      validFrom: promo.validFrom || new Date().toISOString().split('T')[0],
      validUntil: promo.validUntil || '2026-12-31',
      usageLimit: Number(promo.usageLimit) || 500,
      usageCount: 0,
      status: promo.status || 'active',
      scope: promo.scope || (promo.specificProductId ? 'product' : 'storewide')
    };

    setPromotions(prev => {
      const updated = [newPromo, ...prev];
      return updated;
    });

    createPromotionApi(newPromo).catch(() => {});
    return newPromo;
  };

  const editPromotion = (id, updates) => {
    checkPermission();
    setPromotions(prev => {
      const updated = prev.map(p => (p.id === id ? { ...p, ...updates } : p));
      return updated;
    });
  };

  const deletePromotion = (id) => {
    checkPermission();
    setPromotions(prev => {
      const updated = prev.filter(p => p.id !== id);
      return updated;
    });
    deletePromotionApi(id).catch(() => {});
  };

  const togglePromotionStatus = (id) => {
    checkPermission();
    setPromotions(prev => {
      const updated = prev.map(p => (p.id === id ? { ...p, status: p.status === 'active' ? 'expired' : 'active' } : p));
      return updated;
    });
    togglePromotionStatusApi(id).catch(() => {});
  };

  // School Orders Actions
  const addSchoolOrder = (req) => {
    checkPermission();
    const newReq = {
      id: req.id || `SCH-REQ-${Math.floor(100 + Math.random() * 900)}`,
      schoolName: req.schoolName || 'New School Institute',
      contactPerson: req.contactPerson || 'School Authority',
      contactPhone: req.contactPhone || '+91 98000 00000',
      contactEmail: req.contactEmail || 'school@institute.edu.in',
      requirementSummary: req.requirementSummary || 'Uniform / Book requirement',
      quantity: Number(req.quantity) || 100,
      estimatedBudget: Number(req.estimatedBudget) || 100000,
      quoteAmount: Number(req.quoteAmount) || Number(req.estimatedBudget) || 95000,
      deadline: req.deadline || '2026-10-15',
      status: req.status || 'Requirement Received',
      notes: req.notes || ''
    };
    setSchoolOrders(prev => {
      const updated = [newReq, ...prev];
      return updated;
    });
    createSchoolOrderApi(newReq).catch(() => {});
    return newReq;
  };

  const editSchoolOrder = (id, updates) => {
    checkPermission();
    setSchoolOrders(prev => {
      const updated = prev.map(s => (s.id === id ? { ...s, ...updates } : s));
      return updated;
    });
    updateSchoolOrderApi(id, updates).catch(() => {});
  };

  const deleteSchoolOrder = (id) => {
    checkPermission();
    setSchoolOrders(prev => {
      const updated = prev.filter(s => String(s.id) !== String(id) && String(s._id) !== String(id));
      return updated;
    });
    deleteSchoolOrderApi(id).catch(() => {});
  };

  const acceptSchoolOrder = async (id) => {
    checkPermission();
    setSchoolOrders(prev => prev.map(s => {
      if (String(s.id || s._id) === String(id)) {
        return { ...s, status: 'assigned' };
      }
      return s;
    }));

    try {
      const res = await acceptSchoolOrderApi(id);
      if (res?.success) {
        showToast('You have accepted this school bulk order!');
      }
    } catch (e) {
      console.warn('Backend accept school order fallback:', e);
    }
  };

  const submitSchoolQuote = async (id, quoteData) => {
    checkPermission();
    const currentSellerId = sellerUser?.id || sellerUser?._id || '';

    setSchoolOrders(prev => {
      const updatedList = prev.map(s => {
        if (String(s.id || s._id) === String(id) || String(s.referenceId) === String(id)) {
          const existingQuotes = Array.isArray(s.quotations) ? s.quotations : [];
          const newQuote = {
            _id: Date.now(),
            sellerId: currentSellerId,
            sellerName: sellerUser?.name || 'Seller',
            sellerStoreName: sellerUser?.storeName || 'My Store',
            sellerPhone: sellerUser?.phone || '',
            sellerCity: sellerUser?.city || '',
            quoteAmount: Number(quoteData.quoteAmount),
            unitPrice: Number(quoteData.unitPrice) || 0,
            itemPrices: quoteData.itemPrices || [],
            volumeDiscountNote: quoteData.volumeDiscountNote || '',
            estimatedDeliveryDays: Number(quoteData.estimatedDeliveryDays) || 7,
            notes: quoteData.notes || '',
            sellerAdvanceType: quoteData.prepaymentType || quoteData.sellerAdvanceType || 'percentage',
            sellerAdvancePercentage: Number(quoteData.prepaymentPercentage ?? quoteData.sellerAdvancePercentage ?? 0),
            sellerAdvanceAmount: Number(quoteData.prepaymentAmount ?? quoteData.sellerAdvanceAmount ?? 0),
            sellerAdvanceTerms: quoteData.prepaymentTerms || quoteData.sellerAdvanceTerms || '',
            prepaymentType: quoteData.prepaymentType || quoteData.sellerAdvanceType || 'percentage',
            prepaymentPercentage: Number(quoteData.prepaymentPercentage ?? quoteData.sellerAdvancePercentage ?? 0),
            prepaymentAmount: Number(quoteData.prepaymentAmount ?? quoteData.sellerAdvanceAmount ?? 0),
            prepaymentTerms: quoteData.prepaymentTerms || quoteData.sellerAdvanceTerms || '',
            status: 'submitted',
            submittedAt: new Date().toISOString()
          };
          return {
            ...s,
            status: 'quoted',
            sellerAdvanceType: quoteData.prepaymentType || quoteData.sellerAdvanceType || 'percentage',
            sellerAdvancePercentage: Number(quoteData.prepaymentPercentage ?? quoteData.sellerAdvancePercentage ?? 0),
            sellerAdvanceAmount: Number(quoteData.prepaymentAmount ?? quoteData.sellerAdvanceAmount ?? 0),
            sellerAdvanceTerms: quoteData.prepaymentTerms || quoteData.sellerAdvanceTerms || '',
            prepaymentType: quoteData.prepaymentType || quoteData.sellerAdvanceType || 'percentage',
            prepaymentPercentage: Number(quoteData.prepaymentPercentage ?? quoteData.sellerAdvancePercentage ?? 0),
            prepaymentAmount: Number(quoteData.prepaymentAmount ?? quoteData.sellerAdvanceAmount ?? 0),
            prepaymentTerms: quoteData.prepaymentTerms || quoteData.sellerAdvanceTerms || '',
            quotations: [...existingQuotes, newQuote]
          };
        }
        return s;
      });

      try {
        localStorage.setItem('bv_sync_school_orders', JSON.stringify(updatedList));
        ['bv_customer_bulk_orders', 'admin_school_orders'].forEach(k => {
          try {
            const list = JSON.parse(localStorage.getItem(k) || '[]');
            const idx = list.findIndex(o => String(o.id || o._id) === String(id) || (o.referenceId && String(o.referenceId) === String(id)));
            if (idx !== -1) {
              const prevQuotes = Array.isArray(list[idx].quotations) ? list[idx].quotations : [];
              const matchedOrder = updatedList.find(u => String(u.id || u._id) === String(id) || String(u.referenceId) === String(id));
              if (matchedOrder) {
                list[idx] = { ...list[idx], status: 'quoted', quotations: matchedOrder.quotations };
                localStorage.setItem(k, JSON.stringify(list));
              }
            }
          } catch (e) {}
        });
        window.dispatchEvent(new CustomEvent('bv_school_orders_updated'));
        window.dispatchEvent(new Event('storage'));
      } catch (e) {}

      return updatedList;
    });

    try {
      const res = await submitSchoolQuoteApi(id, {
        ...quoteData,
        sellerId: currentSellerId,
        sellerName: sellerUser?.name || 'Seller',
        sellerStoreName: sellerUser?.storeName || 'My Store',
        sellerPhone: sellerUser?.phone || '',
        sellerCity: sellerUser?.city || ''
      });
      if (res?.success) {
        showToast('Quotation proposal submitted successfully!');
      }
    } catch (e) {
      console.warn('Backend submit quotation fallback:', e);
    }
  };

  const acceptBuyerCounterDemand = async (orderId, quoteId, payload = {}) => {
    checkPermission();
    try {
      const res = await acceptBuyerCounterDemandApi(orderId, quoteId, payload);
      if (res?.success) {
        showToast('Buyer counter-demand accepted successfully!');
        if (res.order) {
          setSchoolOrders(prev => prev.map(o => String(o.id || o._id) === String(orderId) ? res.order : o));
          // Sync localStorage
          ['bv_sync_school_orders', 'bv_customer_bulk_orders', 'admin_school_orders'].forEach(k => {
            try {
              const list = JSON.parse(localStorage.getItem(k) || '[]');
              const idx = list.findIndex(o => String(o.id || o._id) === String(orderId) || (o.referenceId && String(o.referenceId) === String(orderId)));
              if (idx !== -1) {
                list[idx] = res.order;
                localStorage.setItem(k, JSON.stringify(list));
              }
            } catch (e) {}
          });
          window.dispatchEvent(new CustomEvent('bv_school_orders_updated'));
          window.dispatchEvent(new Event('storage'));
        }
        return { success: true, order: res.order };
      } else {
        showToast(res?.message || 'Failed to accept counter-demand');
        return { success: false, message: res?.message };
      }
    } catch (e) {
      showToast(e.message || 'Error accepting counter-demand');
      return { success: false, message: e.message };
    }
  };

  const confirmSellerAcceptance = async (orderId) => {
    checkPermission();
    try {
      const res = await confirmSellerAcceptanceApi(orderId);
      if (res?.success) {
        showToast(res.message || 'Acceptance confirmed and prepayment requested!');
        if (res.order) {
          setSchoolOrders(prev => prev.map(o => String(o.id || o._id) === String(orderId) ? res.order : o));
          ['bv_sync_school_orders', 'bv_customer_bulk_orders', 'admin_school_orders'].forEach(k => {
            try {
              const list = JSON.parse(localStorage.getItem(k) || '[]');
              const idx = list.findIndex(o => String(o.id || o._id) === String(orderId) || (o.referenceId && String(o.referenceId) === String(orderId)));
              if (idx !== -1) {
                list[idx] = res.order;
                localStorage.setItem(k, JSON.stringify(list));
              }
            } catch (e) {}
          });
          window.dispatchEvent(new CustomEvent('bv_school_orders_updated'));
          window.dispatchEvent(new Event('storage'));
        }
        return { success: true, order: res.order };
      } else {
        showToast(res?.message || 'Failed to confirm acceptance');
        return { success: false, message: res?.message };
      }
    } catch (e) {
      showToast(e.message || 'Error confirming acceptance');
      return { success: false, message: e.message };
    }
  };

  const reviseSchoolQuote = async (orderId, quoteId, quoteData) => {
    checkPermission();
    try {
      const res = await reviseSchoolQuoteApi(orderId, quoteId, quoteData);
      if (res?.success) {
        showToast(res.message || 'Revised quotation submitted successfully!');
        if (res.order) {
          setSchoolOrders(prev => prev.map(o => String(o.id || o._id) === String(orderId) ? res.order : o));
          // Sync localStorage
          ['bv_sync_school_orders', 'bv_customer_bulk_orders', 'admin_school_orders'].forEach(k => {
            try {
              const list = JSON.parse(localStorage.getItem(k) || '[]');
              const idx = list.findIndex(o => String(o.id || o._id) === String(orderId) || (o.referenceId && String(o.referenceId) === String(orderId)));
              if (idx !== -1) {
                list[idx] = res.order;
                localStorage.setItem(k, JSON.stringify(list));
              }
            } catch (e) {}
          });
          window.dispatchEvent(new CustomEvent('bv_school_orders_updated'));
          window.dispatchEvent(new Event('storage'));
        }
        return { success: true, order: res.order };
      } else {
        showToast(res?.message || 'Failed to revise quotation');
        return { success: false, message: res?.message };
      }
    } catch (e) {
      showToast(e.message || 'Error revising quotation');
      return { success: false, message: e.message };
    }
  };

  const updateSchoolOrderStatus = async (id, { status, deliveryDetails = {} }) => {
    checkPermission();
    const currentSellerId = String(sellerUser?.id || sellerUser?._id || '');

    setSchoolOrders(prev => {
      const updatedList = prev.map(s => {
        if (String(s.id || s._id) === String(id) || String(s.referenceId) === String(id)) {
          const existingDetails = s.deliveryDetails || {};
          const isOutForDelivery = status === 'out for delivery' || status === 'out_for_delivery';
          const isReceived = status === 'received' || status === 'delivered';

          const mergedDetails = {
            ...existingDetails,
            ...deliveryDetails,
            deliveryBoyName: deliveryDetails.deliveryBoyName || existingDetails.deliveryBoyName || '',
            deliveryBoyPhone: deliveryDetails.deliveryBoyPhone || existingDetails.deliveryBoyPhone || '',
            vehicleNumber: deliveryDetails.vehicleNumber || existingDetails.vehicleNumber || '',
            trackingId: deliveryDetails.trackingId || existingDetails.trackingId || `BV-SLF-${s.referenceId || id}`,
            trackingUrl: deliveryDetails.trackingUrl || existingDetails.trackingUrl || `/#delivery-partner?token=BV-SLF-${s.referenceId || id}`,
            deliveryPartnerToken: deliveryDetails.deliveryPartnerToken || existingDetails.deliveryPartnerToken || `BV-SLF-${s.referenceId || id}`,
            dispatchedAt: isOutForDelivery ? (existingDetails.dispatchedAt || new Date().toISOString()) : existingDetails.dispatchedAt,
            deliveredAt: isReceived ? new Date().toISOString() : existingDetails.deliveredAt,
            deliveryMode: 'self_delivery'
          };

          return {
            ...s,
            status,
            deliveryMode: 'self_delivery',
            deliveryDetails: mergedDetails,
            sellerId: s.sellerId || currentSellerId
          };
        }
        return s;
      });

      try {
        localStorage.setItem('bv_sync_school_orders', JSON.stringify(updatedList));
        localStorage.setItem('admin_school_orders', JSON.stringify(updatedList));

        const custRaw = localStorage.getItem('bv_customer_bulk_orders');
        if (custRaw) {
          const custOrders = JSON.parse(custRaw);
          const updatedCust = custOrders.map(c => {
            if (String(c.id || c._id || c.referenceId) === String(id)) {
              const matched = updatedList.find(u => String(u.id || u._id || u.referenceId) === String(id));
              return matched ? { ...c, ...matched } : c;
            }
            return c;
          });
          localStorage.setItem('bv_customer_bulk_orders', JSON.stringify(updatedCust));
        }
      } catch (e) {}

      window.dispatchEvent(new CustomEvent('bv_school_orders_updated', {
        detail: { orderId: id, status, deliveryDetails }
      }));
      window.dispatchEvent(new Event('storage'));

      return updatedList;
    });

    try {
      const res = await updateSchoolOrderStatusApi(id, status, deliveryDetails);
      if (res?.success) {
        showToast(`School bulk order status updated to ${status.replace(/_/g, ' ')}!`);
      } else {
        await updateSchoolOrderApi(id, { status, deliveryMode: 'self_delivery', deliveryDetails });
        showToast(`School bulk order status updated to ${status.replace(/_/g, ' ')}!`);
      }
    } catch (e) {
      console.warn('Backend update bulk order status fallback:', e);
    }
  };


  // Customers Actions
  const addCustomer = (customer) => {
    checkPermission();
    const newCust = {
      id: customer.id || `CUST-${Date.now()}`,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      schoolAffiliation: customer.schoolAffiliation || 'General',
      studentName: customer.studentName || '',
      totalOrders: Number(customer.totalOrders) || 1,
      totalSpend: Number(customer.totalSpend) || 0,
      lastOrderDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: 'Active'
    };
    setCustomers(prev => {
      const updated = [newCust, ...prev];
      return updated;
    });
    return newCust;
  };

  const editCustomer = (id, updates) => {
    checkPermission();
    setCustomers(prev => {
      const updated = prev.map(c => (c.id === id ? { ...c, ...updates } : c));
      return updated;
    });
  };

  const deleteCustomer = (id) => {
    checkPermission();
    setCustomers(prev => {
      const updated = prev.filter(c => c.id !== id);
      return updated;
    });
  };

  // Reviews Actions
  const approveReview = (reviewId) => {
    checkPermission();
    setReviews(prev => {
      const updated = prev.map(r => (r.id === reviewId || String(r.id) === String(reviewId) || r._id === reviewId ? { ...r, status: 'Approved', approvalStatus: 'Approved' } : r));
      return updated;
    });
    approveSellerReviewApi(reviewId).catch(() => {});
  };

  const replyToReview = (reviewId, replyText) => {
    checkPermission();
    setReviews(prev => {
      const updated = prev.map(r => (r.id === reviewId || r._id === reviewId ? { ...r, reply: replyText } : r));
      return updated;
    });
    replySellerReviewApi(reviewId, replyText).catch(() => {});
  };

  const deleteReview = (reviewId) => {
    checkPermission();
    setReviews(prev => {
      const updated = prev.filter(r => r.id !== reviewId && r._id !== reviewId);
      return updated;
    });
    deleteSellerReviewApi(reviewId).catch(() => {});
  };

  // Notifications Actions
  const markNotificationRead = (id) => {
    setReadIds(prev => {
      const next = new Set(prev);
      next.add(id);
      try {
        localStorage.setItem('seller_read_notif_ids', JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  };

  const markAllNotificationsRead = () => {
    const allIds = new Set(notifications.map(n => n.id));
    setReadIds(allIds);
    try {
      localStorage.setItem('seller_read_notif_ids', JSON.stringify(Array.from(allIds)));
    } catch {}
  };

  const deleteNotification = (id) => {
    setDismissedIds(prev => {
      const next = new Set(prev);
      next.add(id);
      try {
        localStorage.setItem('seller_dismissed_notif_ids', JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  };

  // Settings Actions
  const updateSettings = (updates) => {
    checkPermission();
    setSettings(prev => ({ ...prev, ...updates }));
    updateSellerSettingsApi(updates).catch(() => {});
  };

  // Shipping Actions
  const toggleShippingPartner = (id) => {
    checkPermission();
    setShippingPartners(prev => prev.map(p => (p.id === id ? { ...p, active: !p.active } : p)));
  };

  const clearAllSellerData = () => {
    try {
      localStorage.removeItem('seller_products');
      localStorage.removeItem('seller_orders');
      localStorage.removeItem('seller_promotions');
      localStorage.removeItem('seller_school_orders');
      localStorage.removeItem('seller_customers');
      localStorage.removeItem('seller_finance');
      localStorage.removeItem('seller_reviews');
      localStorage.removeItem('seller_notifications');
      localStorage.removeItem('bv_seller_reg_data');
      localStorage.removeItem('bv_seller_status');
    } catch {}

    setProducts([]);
    setOrders([]);
    setPromotions([]);
    setSchoolOrders([]);
    setCustomers([]);
    setReviews([]);
    setNotifications([]);
    setFinance({ totalRevenue: 0, netProfit: 0, pendingPayout: 0, availableBalance: 0, recentTransactions: [] });
    showToast('🗑️ All Seller Panel local & state data deleted successfully!');
  };

  // Wallet Payout Action
  const requestPayout = async (amount, bankDetails) => {
    checkPermission();
    const newTxn = {
      id: `TXN-${Math.floor(10000 + Math.random() * 90000)}`,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      description: 'Automated Bank Settlement Request',
      type: 'Payout',
      amount: -Math.abs(Number(amount)),
      status: 'Processing'
    };

    setFinance(prev => {
      const currentTxns = Array.isArray(prev.recentTransactions) ? prev.recentTransactions : [];
      const next = {
        ...prev,
        lastPayout: {
          amount: Number(amount),
          date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          reference: `NEFT-BV-${Math.floor(100000 + Math.random() * 900000)}`,
          status: 'Processing Settlement'
        },
        recentTransactions: [newTxn, ...currentTxns]
      };
      try {
        localStorage.setItem('seller_finance', JSON.stringify(next));
      } catch {}
      return next;
    });

    try {
      const res = await requestPayoutApi(amount, bankDetails);
      if (res && (res.success || res.payout)) {
        showToast(`✅ Payout request for ₹${amount.toLocaleString('en-IN')} submitted successfully!`);
        return res;
      }
    } catch {}

    showToast(`✅ Payout request for ₹${amount.toLocaleString('en-IN')} logged for bank transfer.`);
    return { success: true };
  };

  // Dynamic active customers computed from state or live MongoDB orders
  const activeCustomers = useMemo(() => {
    if (Array.isArray(customers) && customers.length > 0) return customers;

    const map = new Map();
    orders.forEach(o => {
      const name = o.customerName || (typeof o.customer === 'string' ? o.customer : o.customer?.name) || 'Parent / Customer';
      const email = o.customerEmail || o.customer?.email || '';
      const phone = o.customerPhone || o.customer?.phone || '';
      const school = o.school || o.schoolName || 'General Public';
      const student = o.studentName || '';

      const key = (phone || email || name).toLowerCase().trim();
      if (!key) return;

      const orderTotal = Number(o.total || 0);

      if (!map.has(key)) {
        map.set(key, {
          id: `CUST-${Math.floor(1000 + Math.random() * 9000)}`,
          name,
          email,
          phone,
          schoolAffiliation: school,
          studentName: student,
          totalOrders: 1,
          totalSpend: orderTotal,
          status: orderTotal >= 5000 ? 'VIP' : 'Active'
        });
      } else {
        const existing = map.get(key);
        existing.totalOrders += 1;
        existing.totalSpend += orderTotal;
        if (existing.totalSpend >= 5000) existing.status = 'VIP';
      }
    });

    return Array.from(map.values());
  }, [customers, orders]);

  return (
    <SellerDataContext.Provider
      value={{
        isApproved,
        isAuthenticated,
        sellerUser,
        sellerStatus,
        setSellerStatus,
        checkSellerStatus,
        submitSellerApplication,
        approveSellerApplication,
        loginSellerByPhone,
        showToast,
        toastMessage,
        loginSeller,
        logoutSeller,
        updateSellerProfile,
        requestPayout,
        clearAllSellerData,
        // Loading state
        isLoadingProducts,
        isLoadingKits,
        isLoadingSellerData,
        // State
        products,
        kits,
        orders,
        promotions,
        schoolOrders,
        customers: activeCustomers,
        finance,
        reviews,
        notifications,
        shippingPartners,
        settings,
        // Product actions
        addProduct,
        editProduct,
        toggleProductStatus,
        deleteProduct,
        bulkAddOrUpdateProducts,
        updateProductStock,
        updateVariantStock,
        // Kit actions
        addKit,
        editKit,
        deleteKit,
        toggleKitStatus,
        refreshKits,
        // Order actions
        addOrder,
        editOrder,
        updateOrderStatus,
        updateReturnExchangeStatus,
        deleteOrder,
        downloadSellerInvoice,
        // Promo actions
        addPromotion,
        editPromotion,
        deletePromotion,
        togglePromotionStatus,
        // School Order actions
        addSchoolOrder,
        editSchoolOrder,
        deleteSchoolOrder,
        acceptSchoolOrder,
        submitSchoolQuote,
        acceptBuyerCounterDemand,
        confirmSellerAcceptance,
        reviseSchoolQuote,
        updateSchoolOrderStatus,
        // Customer actions
        addCustomer,
        editCustomer,
        deleteCustomer,
        // Review actions
        approveReview,
        replyToReview,
        deleteReview,
        // Notification actions
        markNotificationRead,
        markAllNotificationsRead,
        deleteNotification,
        // Settings & Shipping
        updateSettings,
        toggleShippingPartner
      }}
    >
      {children}
    </SellerDataContext.Provider>
  );
};
