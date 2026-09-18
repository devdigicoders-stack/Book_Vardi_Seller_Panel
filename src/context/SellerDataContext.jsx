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
    const sellerUserSaved = localStorage.getItem('seller_user_profile');
    if (sellerUserSaved) {
      const parsed = JSON.parse(sellerUserSaved);
      if (parsed && (parsed.name || parsed.phone || parsed.email)) {
        return parsed;
      }
    }

    const regDataSaved = localStorage.getItem('bv_seller_reg_data');
    const sellerProfSaved = localStorage.getItem('book_vardi_seller_profile');

    const regData = regDataSaved ? JSON.parse(regDataSaved) : null;
    const sellerProf = sellerProfSaved ? JSON.parse(sellerProfSaved) : null;

    const activeName = regData?.sellerName || regData?.ownerFullName || sellerProf?.name || sellerProf?.sellerName || '';
    const activeEmail = regData?.sellerEmail || sellerProf?.email || sellerProf?.sellerEmail || '';
    const activePhone = regData?.sellerPhone ? `+91 ${regData.sellerPhone.replace(/\D/g, '').slice(-10)}` : (sellerProf?.phone || '');

    return {
      name: activeName,
      email: activeEmail,
      phone: activePhone,
      role: sellerProf?.role || regData?.role || 'Seller',
      designation: regData?.ownerDesignation || sellerProf?.designation || '',
      merchantId: regData?.merchantId || sellerProf?.merchantId || '',
      pan: regData?.ownerPan || regData?.businessPan || sellerProf?.pan || '',
      avatar: regData?.profilePhoto || sellerProf?.avatar || '',
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
      lastLogin: ''
    };
  }
};

export const readActiveSellerSettings = () => {
  try {
    const settingsSaved = localStorage.getItem('seller_settings');
    if (settingsSaved) {
      const parsed = JSON.parse(settingsSaved);
      if (parsed && (parsed.storeName || parsed.email || parsed.phone)) {
        return parsed;
      }
    }

    const regDataSaved = localStorage.getItem('bv_seller_reg_data');
    const sellerProfSaved = localStorage.getItem('book_vardi_seller_profile');

    const regData = regDataSaved ? JSON.parse(regDataSaved) : null;
    const sellerProf = sellerProfSaved ? JSON.parse(sellerProfSaved) : null;

    const activeStoreName = regData?.storeName || regData?.tradeName || regData?.legalBusinessName || sellerProf?.storeName || sellerProf?.businessName || '';
    const activeEmail = regData?.sellerEmail || sellerProf?.email || sellerProf?.sellerEmail || '';
    const activePhone = regData?.sellerPhone ? `+91 ${regData.sellerPhone.replace(/\D/g, '').slice(-10)}` : (sellerProf?.phone || '');

    return {
      storeName: activeStoreName,
      legalName: regData?.legalBusinessName || sellerProf?.legalName || activeStoreName,
      email: activeEmail,
      phone: activePhone,
      gstin: regData?.gstin || sellerProf?.gstin || '',
      pan: regData?.ownerPan || regData?.businessPan || sellerProf?.pan || '',
      address: regData?.registeredAddress || regData?.addressLine1 || sellerProf?.address || '',
      city: regData?.city || sellerProf?.city || '',
      pincode: regData?.pincode || sellerProf?.pincode || ''
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
      pincode: ''
    };
  }
};

export const SellerDataProvider = ({ children, approved = true }) => {
  const isApproved = approved === true;

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

  // Current Seller Profile & Role (Resolves active user credentials)
  const [sellerUser, setSellerUser] = useState(() => readActiveSellerProfile());

  // Seller status state ('approved' | 'pending' | 'in_review' | 'rejected')
  const [sellerStatus, setSellerStatus] = useState(() => {
    try {
      const saved = localStorage.getItem('bv_seller_status');
      if (saved) return saved;
      const regData = localStorage.getItem('bv_seller_reg_data');
      if (regData) {
        const parsed = JSON.parse(regData);
        if (parsed.submissionStatus || parsed.status) return parsed.submissionStatus || parsed.status;
      }
      return 'approved';
    } catch {
      return 'approved';
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

  // Loading state for product fetching directly from backend MongoDB
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

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

        if (statusRes.status === 'fulfilled' && statusRes.value?.status) {
          setSellerStatus(statusRes.value.status);
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
          setOrders(ordersRes.value);
          try {
            localStorage.setItem('bv_seller_orders', JSON.stringify(ordersRes.value));
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
          setSellerUser(prev => {
            const backendPhone = (profileRes.value.phone || profileRes.value.sellerPhone || '').replace(/\D/g, '');
            const prevPhone = (prev.phone || '').replace(/\D/g, '');
            const isMatch = !prevPhone || !backendPhone || prevPhone.slice(-8) === backendPhone.slice(-8) || !prev.name;
            return isMatch ? { ...prev, ...profileRes.value } : prev;
          });
        }

        if (settingsRes.status === 'fulfilled' && settingsRes.value) {
          setSettings(prev => ({ ...prev, ...settingsRes.value }));
        }
      } catch (err) {
        console.debug('Backend offline or empty:', err.message);
      } finally {
        if (isMounted) setIsLoadingProducts(false);
      }
    }

    if (isAuthenticated) {
      loadBackendData();
    } else {
      setIsLoadingProducts(false);
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
          setSellerStatus(apiRes.seller.approvalStatus || apiRes.seller.status || 'approved');
          localStorage.setItem('seller_user_profile', JSON.stringify(u));
          localStorage.setItem('bv_seller_status', apiRes.seller.approvalStatus || 'approved');
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
    const status = isPhoneMatch ? (savedApp?.status || savedApp?.submissionStatus || 'approved') : 'approved';

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
    } catch {}
    setSellerStatus('approved');
    adminApproveTestApi().catch(() => {});
  };

  const checkSellerStatus = useCallback(async () => {
    try {
      const res = await fetchSellerStatusApi();
      if (res && (res.status || res.approvalStatus)) {
        const newStatus = res.approvalStatus || res.status || 'approved';
        setSellerStatus(newStatus);
        localStorage.setItem('bv_seller_status', newStatus);
        return newStatus;
      }
    } catch (e) {
      console.error(e);
    }
    return sellerStatus;
  }, [sellerStatus]);

  const loginSeller = ({ email, role }) => {
    const updated = {
      ...sellerUser,
      email: email || sellerUser.email,
      role: role || 'Seller',
      lastLogin: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    };
    setSellerUser(updated);
    setIsAuthenticated(true);
    setSellerStatus('approved');
    localStorage.setItem('seller_user_profile', JSON.stringify(updated));
    localStorage.setItem('seller_is_authenticated', JSON.stringify(true));
    localStorage.setItem('bv_seller_status', 'approved');
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
      const next = { ...prev, ...updates };
      localStorage.setItem('seller_user_profile', JSON.stringify(next));
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
    setOrders(prev => {
      const updated = prev.map(o => (o.id === id ? { ...o, ...updates } : o));
      return updated;
    });
  };

  const updateOrderStatus = (id, status, details = {}) => {
    checkPermission();
    editOrder(id, { status, ...details });
    updateOrderStatusApi(id, status, details).catch(() => {});
    showToast(`Order #${id} status updated to ${status}`);
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
      const updated = prev.filter(s => s.id !== id);
      return updated;
    });
    deleteSchoolOrderApi(id).catch(() => {});
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
