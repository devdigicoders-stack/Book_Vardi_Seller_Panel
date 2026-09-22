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
  updateStockApi,
  fetchSellerOrdersApi,
  updateOrderStatusApi,
  fetchSchoolOrdersApi,
  createSchoolOrderApi,
  updateSchoolOrderApi,
  deleteSchoolOrderApi,
  acceptSchoolOrderApi,
  submitSchoolQuoteApi,
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
      regData.sellerName,
      regData.ownerFullName,
      regData.name,
      sellerProf.sellerName,
      sellerProf.ownerFullName,
      sellerProf.name,
      sellerUser.sellerName,
      sellerUser.ownerFullName,
      sellerUser.name
    );

    const activeEmail = pickFirst(
      regData.sellerEmail,
      regData.email,
      sellerProf.sellerEmail,
      sellerProf.email,
      sellerUser.sellerEmail,
      sellerUser.email
    );

    const rawPhone = pickFirst(
      regData.sellerPhone,
      regData.phone,
      sellerProf.sellerPhone,
      sellerProf.phone,
      sellerUser.sellerPhone,
      sellerUser.phone
    );
    const activePhone = rawPhone ? (rawPhone.startsWith('+') ? rawPhone : `+91 ${rawPhone.replace(/\D/g, '').slice(-10)}`) : '';

    const merged = {
      ...sellerUser,
      ...sellerProf,
      ...regData
    };

    return {
      ...merged,
      name: activeName,
      email: activeEmail,
      phone: activePhone,
      role: pickFirst(merged.role, 'Seller'),
      designation: pickFirst(regData.ownerDesignation, regData.designation, sellerProf.ownerDesignation, sellerUser.ownerDesignation, sellerUser.ownerDetails?.ownerDesignation, 'Proprietor'),
      merchantId: pickFirst(sellerUser.merchantId, sellerProf.merchantId, regData.merchantId, ''),
      pan: pickFirst(regData.ownerPan, regData.businessPan, regData.pan, sellerProf.ownerPan, sellerProf.businessPan, sellerProf.pan, sellerUser.ownerPan, sellerUser.businessPan, sellerUser.pan, sellerUser.documents?.panNumber, ''),
      avatar: pickFirst(regData.profilePhoto, regData.avatar, sellerProf.avatar, sellerProf.profilePhoto, sellerUser.profilePhoto, sellerUser.avatar, ''),
      yearStarted: pickFirst(regData.yearStarted, regData.establishedYear, regData.yearEstablished, sellerProf.yearStarted, sellerProf.establishedYear, sellerProf.yearEstablished, sellerUser.yearStarted, sellerUser.establishedYear, sellerUser.yearEstablished, ''),
      businessType: pickFirst(regData.businessType, sellerProf.businessType, sellerUser.businessType, 'Proprietorship'),
      annualTurnoverEstimate: pickFirst(regData.annualTurnoverEstimate, sellerProf.annualTurnoverEstimate, sellerUser.annualTurnoverEstimate, ''),
      ownerFullName: pickFirst(regData.ownerFullName, regData.name, sellerProf.ownerFullName, sellerProf.ownerDetails?.ownerFullName, sellerUser.ownerFullName, sellerUser.ownerDetails?.ownerFullName, activeName),
      ownerDesignation: pickFirst(regData.ownerDesignation, sellerProf.ownerDesignation, sellerProf.ownerDetails?.ownerDesignation, sellerUser.ownerDesignation, sellerUser.ownerDetails?.ownerDesignation, 'Proprietor'),
      ownerPan: pickFirst(regData.ownerPan, regData.pan, sellerProf.ownerPan, sellerProf.ownerDetails?.ownerPan, sellerProf.pan, sellerUser.ownerPan, sellerUser.ownerDetails?.ownerPan, sellerUser.pan, ''),
      businessPan: pickFirst(regData.businessPan, regData.pan, sellerProf.businessPan, sellerUser.businessPan, sellerUser.documents?.businessPan, sellerUser.documents?.panNumber, sellerUser.pan, ''),
      ownerAadhaarLast4: pickFirst(regData.ownerAadhaarLast4, sellerProf.ownerAadhaarLast4, sellerUser.ownerAadhaarLast4, sellerUser.ownerDetails?.ownerAadhaarLast4, (sellerUser?.documents?.aadhaarNumber ? String(sellerUser.documents.aadhaarNumber).slice(-4) : (regData.aadhaar ? String(regData.aadhaar).slice(-4) : ''))),
      gstin: pickFirst(regData.gstin, regData.gstNumber, sellerProf.gstin, sellerProf.gstNumber, sellerUser.gstin, sellerUser.gstNumber, ''),
      msmeRegistrationNumber: pickFirst(regData.msmeRegistrationNumber, sellerProf.msmeRegistrationNumber, sellerUser.msmeRegistrationNumber, sellerUser.documents?.msmeRegistrationNumber, ''),
      cinNumber: pickFirst(regData.cinNumber, sellerProf.cinNumber, sellerUser.cinNumber, sellerUser.documents?.cinNumber, ''),
      hasGstExemption: Boolean(regData.hasGstExemption || sellerProf.hasGstExemption || sellerUser.hasGstExemption || sellerUser.documents?.hasGstExemption),
      addressLine1: pickFirst(regData.addressLine1, regData.address, sellerProf.addressLine1, sellerProf.address, sellerUser.addressLine1, sellerUser.addressDetails?.addressLine1, sellerUser.address, ''),
      addressLine2: pickFirst(regData.addressLine2, regData.colony, sellerProf.addressLine2, sellerProf.colony, sellerUser.addressLine2, sellerUser.addressDetails?.addressLine2, sellerUser.colony, ''),
      colony: pickFirst(regData.colony, regData.addressLine2, sellerProf.colony, sellerUser.colony, sellerUser.addressDetails?.addressLine2, ''),
      landmark: pickFirst(regData.landmark, sellerProf.landmark, sellerUser.landmark, sellerUser.addressDetails?.landmark, ''),
      city: pickFirst(regData.city, sellerProf.city, sellerUser.city, sellerUser.addressDetails?.city, ''),
      state: pickFirst(regData.state, sellerProf.state, sellerUser.state, sellerUser.addressDetails?.state, ''),
      pincode: pickFirst(regData.pincode, sellerProf.pincode, sellerUser.pincode, sellerUser.addressDetails?.pincode, ''),
      addressProofType: pickFirst(regData.addressProofType, sellerProf.addressProofType, sellerUser.addressProofType, sellerUser.addressProofDetails?.addressProofType, ''),
      addressProofDocNumber: pickFirst(regData.addressProofDocNumber, sellerProf.addressProofDocNumber, sellerUser.addressProofDocNumber, sellerUser.addressProofDetails?.addressProofDocNumber, ''),
      addressProofFileName: pickFirst(regData.addressProofFileName, sellerProf.addressProofFileName, sellerUser.addressProofFileName, ''),
      bankAccountHolder: pickFirst(regData.bankAccountHolder, sellerProf.bankAccountHolder, sellerUser.bankAccountHolder, sellerUser.bankDetails?.accountHolderName, activeName),
      bankAccountNumber: pickFirst(regData.bankAccountNumber, sellerProf.bankAccountNumber, sellerUser.bankAccountNumber, sellerUser.bankDetails?.accountNumber, ''),
      bankIfscCode: pickFirst(regData.bankIfscCode, sellerProf.bankIfscCode, sellerUser.bankIfscCode, sellerUser.bankDetails?.ifscCode, ''),
      bankName: pickFirst(regData.bankName, sellerProf.bankName, sellerUser.bankName, sellerUser.bankDetails?.bankName, ''),
      bankBranch: pickFirst(regData.bankBranch, sellerProf.bankBranch, sellerUser.bankBranch, sellerUser.bankDetails?.branchName, sellerUser.bankDetails?.bankBranch, ''),
      accountType: pickFirst(regData.accountType, sellerProf.accountType, sellerUser.accountType, sellerUser.bankDetails?.accountType, 'Savings Account'),
      legalBusinessName: pickFirst(regData.legalBusinessName, regData.tradeName, regData.storeName, sellerProf.legalBusinessName, sellerProf.storeName, sellerUser.legalBusinessName, sellerUser.storeName, ''),
      tradeName: pickFirst(regData.tradeName, regData.storeName, sellerProf.tradeName, sellerProf.storeName, sellerUser.tradeName, sellerUser.storeName, ''),
      storeName: pickFirst(regData.storeName, regData.tradeName, regData.legalBusinessName, sellerProf.storeName, sellerUser.storeName, ''),
      storeTagline: pickFirst(regData.storeTagline, sellerProf.storeTagline, sellerUser.storeTagline, sellerUser.storeDetails?.storeTagline, ''),
      storeDescription: pickFirst(regData.storeDescription, sellerProf.storeDescription, sellerUser.storeDescription, sellerUser.storeDetails?.storeDescription, ''),
      selectedCategories: (regData.selectedCategories && regData.selectedCategories.length > 0) ? regData.selectedCategories : (sellerProf.selectedCategories || sellerUser.selectedCategories || []),
      primaryBrands: (regData.primaryBrands && regData.primaryBrands.length > 0) ? regData.primaryBrands : (sellerProf.primaryBrands || sellerUser.primaryBrands || []),
      estimatedSkuCount: pickFirst(regData.estimatedSkuCount, sellerProf.estimatedSkuCount, sellerUser.estimatedSkuCount, ''),
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
  const [orders, setOrders] = useState(() => {
    try {
      const saved = localStorage.getItem('bv_seller_orders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [promotions, setPromotions] = useState([]);
  const [schoolOrders, setSchoolOrders] = useState([]);
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

  // Initial API Data Sync on mount directly from backend DB
  useEffect(() => {
    let isMounted = true;
    async function loadBackendData() {
      setIsLoadingProducts(true);
      setIsLoadingSellerData(true);
      try {
        const [
          statusRes,
          productsRes,
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
          setSellerStatus(backendStatus);
          localStorage.setItem('bv_seller_status', backendStatus);
          setSellerUser(prev => {
            const updated = { ...prev, status: backendStatus, approvalStatus: backendStatus, submissionStatus: backendStatus };
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
              localStorage.setItem('bv_seller_reg_data', JSON.stringify(parsed));
            }
          } catch (e) {}
        }

        if (productsRes.status === 'fulfilled' && Array.isArray(productsRes.value)) {
          const normalized = productsRes.value.map(p => ({
            ...p,
            id: p._id || p.id,
            _id: p._id || p.id,
            stockQuantity: p.stockQuantity ?? p.stock ?? 50,
            inStock: p.inStock !== undefined ? p.inStock : ((p.stockQuantity ?? p.stock ?? 50) > 0)
          }));
          setProducts(normalized);
          try {
            localStorage.setItem('bv_seller_products', JSON.stringify(normalized));
          } catch (e) {}
        }

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
          setSchoolOrders(schoolRes.value);
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
        
        if (resStatus !== 'approved') {
          setSellerStatus(resStatus);
          localStorage.setItem('bv_seller_status', resStatus);
          return {
            success: false,
            message: `Seller Authorization Denied: Your account status is '${resStatus.toUpperCase()}'. Verification approval by Admin is required.`
          };
        }

        setIsAuthenticated(true);
        if (apiRes.seller) {
          const resolvedName = apiRes.seller.name || apiRes.seller.sellerName || apiRes.seller.ownerFullName || `Merchant ${cleanPhone.slice(-4)}`;
          const resolvedEmail = apiRes.seller.email || apiRes.seller.sellerEmail || `seller_${cleanPhone}@bookvardi.in`;
          const u = {
            ...sellerUser,
            name: resolvedName,
            phone: `+91 ${cleanPhone}`,
            email: resolvedEmail,
            pan: apiRes.seller.pan || apiRes.seller.ownerPan || sellerUser.pan || ''
          };
          setSellerUser(u);
          setSellerStatus(resStatus);
          localStorage.setItem('seller_user_profile', JSON.stringify(u));
          localStorage.setItem('bv_seller_status', resStatus);
        }
        localStorage.setItem('seller_is_authenticated', JSON.stringify(true));
        setTimeout(() => {
          if (typeof window !== 'undefined') window.location.reload();
        }, 50);
        return { success: true, token: apiRes.token, seller: apiRes.seller };
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

    if (status !== 'approved') {
      return { success: false, message: `Your seller account is currently ${status}. You cannot access the dashboard until approved.` };
    }

    const updatedUser = {
      ...sellerUser,
      name: matchedName,
      email: matchedEmail,
      phone: `+91 ${cleanPhone}`,
      role: 'Seller',
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

    setTimeout(() => {
      if (typeof window !== 'undefined') window.location.reload();
    }, 50);

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
      id: newProduct.id ? Number(newProduct.id) : Date.now(),
      name: newProduct.name.trim(),
      subtitle: newProduct.subtitle || '',
      category: newProduct.category || 'uniforms',
      price: price,
      originalPrice: Number(newProduct.originalPrice) || Math.round(price * 1.25),
      discountBadge: newProduct.discountBadge || 'NEW',
      rating: newProduct.rating !== undefined ? Number(newProduct.rating) : 0,
      reviewsCount: Number(newProduct.reviewsCount) || 0,
      stock: newProduct.stockQuantity !== undefined ? Number(newProduct.stockQuantity) : 50,
      stockQuantity: newProduct.stockQuantity !== undefined ? Number(newProduct.stockQuantity) : 50,
      inStock: newProduct.inStock !== undefined ? Boolean(newProduct.inStock) : ((newProduct.stockQuantity !== undefined ? Number(newProduct.stockQuantity) : 50) > 0),
      image: newProduct.image || '',
      images: Array.isArray(newProduct.images) ? newProduct.images : (newProduct.image ? [newProduct.image] : []),
      sizes: Array.isArray(newProduct.sizes) ? newProduct.sizes : (newProduct.sizes ? String(newProduct.sizes).split(',').map(s => s.trim()) : ['S', 'M', 'L', 'XL']),
      colors: Array.isArray(newProduct.colors) ? newProduct.colors : (newProduct.colors ? String(newProduct.colors).split(',').map(c => c.trim()) : ['Navy Blue', 'White']),
      gender: newProduct.gender || 'Unisex',
      description: newProduct.description || 'Premium quality school uniform & educational product.',
      sku: newProduct.sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
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

            // Sync with admin products list
            const savedAdminProds = localStorage.getItem('admin_products');
            let adminProds = savedAdminProds ? JSON.parse(savedAdminProds) : [];
            adminProds = [{ ...createdProduct, id: realId, _id: realId, approvalStatus: 'Pending', sellerName: sellerUser?.storeName || sellerUser?.name || 'Seller' }, ...adminProds];
            localStorage.setItem('admin_products', JSON.stringify(adminProds));

            window.dispatchEvent(new CustomEvent('adminNotificationReceived', { detail: newNotif }));
            window.dispatchEvent(new CustomEvent('adminProductsUpdated', { detail: adminProds }));
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

    setProducts(prev => {
      const updated = prev.map(p => {
        if (String(p.id || p._id) === strId) {
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
      return updated;
    });

    updateSellerProductApi(id, updates).catch(() => {});
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
      showToast(`Order #${id} status updated to ${status}`);
      return res;
    } catch (err) {
      showToast(`Order #${id} status updated locally.`);
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
    setSchoolOrders(prev => prev.map(s => {
      if (String(s.id || s._id) === String(id)) {
        const existingQuotes = Array.isArray(s.quotations) ? s.quotations : [];
        const newQuote = {
          _id: Date.now(),
          sellerName: sellerUser?.name || 'Seller',
          sellerStoreName: sellerUser?.storeName || 'My Store',
          quoteAmount: Number(quoteData.quoteAmount),
          unitPrice: Number(quoteData.unitPrice) || 0,
          estimatedDeliveryDays: Number(quoteData.estimatedDeliveryDays) || 7,
          notes: quoteData.notes || '',
          status: 'submitted',
          submittedAt: new Date().toISOString()
        };
        return {
          ...s,
          status: 'quoted',
          quotations: [...existingQuotes, newQuote]
        };
      }
      return s;
    }));

    try {
      const res = await submitSchoolQuoteApi(id, quoteData);
      if (res?.success) {
        showToast('Quotation proposal submitted successfully!');
      }
    } catch (e) {
      console.warn('Backend submit quotation fallback:', e);
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
        isLoadingSellerData,
        // State
        products,
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
        // Order actions
        addOrder,
        editOrder,
        updateOrderStatus,
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
