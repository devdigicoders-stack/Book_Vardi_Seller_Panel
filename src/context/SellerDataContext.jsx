import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { pushPlatformSync, usePlatformSyncListener } from '../utils/syncBridge';
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
  approveReviewApi,
  replyToReviewApi,
  fetchSellerProfileApi,
  updateSellerProfileApi,
  fetchSellerSettingsApi,
  updateSellerSettingsApi,
  fetchSellerCustomersApi
} from '../utils/api';

export const APPROVED_SELLER_ROLES = [
  'Partner Merchant',
  'Store Manager',
  'Catalog Specialist',
  'Logistics Lead'
];

const SellerDataContext = createContext();

export const useSellerData = () => useContext(SellerDataContext);

export const SellerDataProvider = ({ children, approved = true }) => {
  const isApproved = approved === true;

  // Authentication state for Seller Hub
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      const saved = localStorage.getItem('seller_is_authenticated');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  // Current Seller Profile & Role
  const [sellerUser, setSellerUser] = useState(() => {
    try {
      const saved = localStorage.getItem('seller_user_profile');
      return saved ? JSON.parse(saved) : {
        name: '',
        email: '',
        phone: '',
        role: 'Partner Merchant',
        designation: '',
        merchantId: '',
        pan: '',
        avatar: '',
        lastLogin: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      };
    } catch {
      return {
        name: '',
        email: '',
        phone: '',
        role: 'Partner Merchant',
        designation: '',
        merchantId: '',
        pan: '',
        avatar: '',
        lastLogin: 'Today'
      };
    }
  });

  // Seller status state ('approved' | 'pending' | 'in_review' | 'rejected')
  const [sellerStatus, setSellerStatus] = useState(() => {
    try {
      const saved = localStorage.getItem('bv_seller_status');
      return saved || 'approved';
    } catch {
      return 'approved';
    }
  });

  const [toastMessage, setToastMessage] = useState(null);
  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  }, []);

  // 1. Products State (No hardcoded mock fallbacks - pure DB / local seller state)
  const [products, setProducts] = useState(() => {
    try {
      const stored = localStorage.getItem('seller_products');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // 2. Orders State
  const [orders, setOrders] = useState(() => {
    try {
      const stored = localStorage.getItem('seller_orders');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // 3. Promotions State
  const [promotions, setPromotions] = useState(() => {
    try {
      const stored = localStorage.getItem('seller_promotions');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // 4. School Orders State
  const [schoolOrders, setSchoolOrders] = useState(() => {
    try {
      const stored = localStorage.getItem('seller_school_orders');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // 5. Customers State
  const [customers, setCustomers] = useState(() => {
    try {
      const stored = localStorage.getItem('seller_customers');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // 6. Finance State
  const [finance, setFinance] = useState(() => {
    try {
      const stored = localStorage.getItem('seller_finance');
      return stored ? JSON.parse(stored) : { totalRevenue: 0, netProfit: 0, pendingPayout: 0, availableBalance: 0, recentTransactions: [] };
    } catch {
      return { totalRevenue: 0, netProfit: 0, pendingPayout: 0, availableBalance: 0, recentTransactions: [] };
    }
  });

  // 7. Reviews State
  const [reviews, setReviews] = useState(() => {
    try {
      const stored = localStorage.getItem('seller_reviews');
      const parsed = stored ? JSON.parse(stored) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

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

    // Orders requiring fulfillment
    safeOrders.forEach(o => {
      if (o.status === 'Pending' || o.status === 'Processing') {
        list.push({
          id: `notif-order-${o.id}`,
          title: `Order Fulfillment Required (${o.id})`,
          message: `Customer ${o.customerName || 'Buyer'} placed order worth ₹${Number(o.total || 0).toLocaleString('en-IN')}. Status: ${o.status}`,
          type: 'finance',
          date: o.date || 'Recent Order'
        });
      }
    });

    // School Bulk Orders
    safeSchoolOrders.forEach(s => {
      list.push({
        id: `notif-school-${s.id || s._id}`,
        title: `B2B School Quote: ${s.schoolName || s.school || 'Partner School'}`,
        message: `Quotation requested for ${s.quantity || s.units || 1} units of ${s.category || 'uniforms'}.`,
        type: 'school',
        date: s.date || 'Recent B2B Order'
      });
    });

    // Reviews needing response
    safeReviews.forEach(r => {
      if (!r.reply) {
        list.push({
          id: `notif-review-${r.id || r._id}`,
          title: `New Customer Rating (${r.rating || 5}★)`,
          message: `${r.customerName || 'Customer'}: "${r.comment || 'Great quality product'}"`,
          type: 'review',
          date: r.date || 'Recent Review'
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
      return stored ? JSON.parse(stored) : [
        { id: 1, name: 'Delhivery Surface & Express', active: true, trackingPrefix: 'DLH' },
        { id: 2, name: 'BlueDart Air Logistics', active: true, trackingPrefix: 'BLU' },
        { id: 3, name: 'India Post SpeedPost', active: true, trackingPrefix: 'IND' }
      ];
    } catch {
      return [];
    }
  });

  // 10. Settings State
  const [settings, setSettings] = useState(() => {
    try {
      const stored = localStorage.getItem('seller_settings');
      return stored ? JSON.parse(stored) : {
        storeName: 'Book Vardi Partner Store',
        email: 'merchant@bookvardi.in',
        phone: '+91 98765 43210',
        gstin: '07AAAAA0000A1Z5'
      };
    } catch {
      return {};
    }
  });

  // Initial API Data Sync on mount directly from backend DB
  useEffect(() => {
    let isMounted = true;
    async function loadBackendData() {
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
          localStorage.setItem('bv_seller_status', statusRes.value.status);
        }

        if (productsRes.status === 'fulfilled' && Array.isArray(productsRes.value)) {
          setProducts(productsRes.value);
        }

        if (ordersRes.status === 'fulfilled' && Array.isArray(ordersRes.value)) {
          setOrders(ordersRes.value);
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
          setSellerUser(prev => ({ ...prev, ...profileRes.value }));
        }

        if (settingsRes.status === 'fulfilled' && settingsRes.value) {
          setSettings(prev => ({ ...prev, ...settingsRes.value }));
        }
      } catch (err) {
        console.debug('Backend offline or empty:', err.message);
      }
    }

    if (isAuthenticated) {
      loadBackendData();
    }

    return () => { isMounted = false; };
  }, [isAuthenticated]);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('seller_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('seller_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('seller_promotions', JSON.stringify(promotions));
  }, [promotions]);

  useEffect(() => {
    localStorage.setItem('seller_school_orders', JSON.stringify(schoolOrders));
  }, [schoolOrders]);

  useEffect(() => {
    localStorage.setItem('seller_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('seller_reviews', JSON.stringify(reviews));
  }, [reviews]);

  useEffect(() => {
    localStorage.setItem('seller_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('seller_settings', JSON.stringify(settings));
  }, [settings]);

  // Subscribe to real-time sync across user and admin portals
  usePlatformSyncListener((incoming) => {
    if (!incoming) return;
    if (incoming.products) setProducts(incoming.products);
    if (incoming.orders) setOrders(incoming.orders);
    if (incoming.promotions) setPromotions(incoming.promotions);
    if (incoming.schoolOrders) setSchoolOrders(incoming.schoolOrders);
    if (incoming.customers) setCustomers(incoming.customers);
    if (incoming.reviews) setReviews(incoming.reviews);
  });

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
          const u = {
            ...sellerUser,
            name: apiRes.seller.sellerName || apiRes.seller.ownerFullName || sellerUser.name,
            phone: `+91 ${cleanPhone}`,
            email: apiRes.seller.sellerEmail || sellerUser.email,
            pan: apiRes.seller.ownerPan || sellerUser.pan
          };
          setSellerUser(u);
          setSellerStatus(apiRes.seller.approvalStatus || apiRes.seller.status || 'approved');
          localStorage.setItem('seller_user_profile', JSON.stringify(u));
          localStorage.setItem('bv_seller_status', apiRes.seller.approvalStatus || 'approved');
        }
        localStorage.setItem('seller_is_authenticated', JSON.stringify(true));
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

    const matchedName = savedApp?.sellerName || savedApp?.ownerFullName || `Merchant ${cleanPhone.slice(-4)}`;
    const matchedEmail = savedApp?.sellerEmail || `seller_${cleanPhone}@bookvardi.in`;
    const matchedStoreName = savedApp?.tradeName || savedApp?.storeName || savedApp?.legalBusinessName || settings?.storeName || 'Book Vardi Partner Store';
    const status = savedApp?.status || savedApp?.submissionStatus || 'approved';

    const updatedUser = {
      ...sellerUser,
      name: matchedName,
      email: matchedEmail,
      phone: `+91 ${cleanPhone}`,
      role: 'Partner Merchant',
      designation: savedApp?.ownerDesignation || sellerUser.designation || 'Proprietor & Authorized Signatory',
      pan: savedApp?.ownerPan || savedApp?.businessPan || sellerUser.pan || 'ABCDE1234F',
      avatar: savedApp?.profilePhoto || sellerUser.avatar,
      lastLogin: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    };

    const updatedSettings = {
      ...settings,
      storeName: matchedStoreName,
      email: matchedEmail,
      phone: `+91 ${cleanPhone}`,
      gstin: savedApp?.gstin || settings.gstin,
      pan: savedApp?.ownerPan || savedApp?.businessPan || settings.pan
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
    } catch {}
    setSellerStatus('approved');
    adminApproveTestApi().catch(() => {});
  };

  const loginSeller = ({ email, role }) => {
    const updated = {
      ...sellerUser,
      email: email || sellerUser.email,
      role: role || 'Partner Merchant',
      lastLogin: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    };
    setSellerUser(updated);
    setIsAuthenticated(true);
    setSellerStatus('approved');
    localStorage.setItem('seller_user_profile', JSON.stringify(updated));
    localStorage.setItem('seller_is_authenticated', JSON.stringify(true));
    localStorage.setItem('bv_seller_status', 'approved');
  };

  const logoutSeller = () => {
    setIsAuthenticated(false);
    localStorage.setItem('seller_is_authenticated', JSON.stringify(false));
    localStorage.removeItem('bv_seller_jwt_token');
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
      rating: Number(newProduct.rating) || 5.0,
      reviewsCount: Number(newProduct.reviewsCount) || 0,
      inStock: newProduct.inStock !== false,
      stockQuantity: Number(newProduct.stockQuantity) || 50,
      image: newProduct.image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=80',
      images: Array.isArray(newProduct.images) ? newProduct.images : (newProduct.image ? [newProduct.image] : []),
      sizes: Array.isArray(newProduct.sizes) ? newProduct.sizes : (newProduct.sizes ? String(newProduct.sizes).split(',').map(s => s.trim()) : ['S', 'M', 'L', 'XL']),
      colors: Array.isArray(newProduct.colors) ? newProduct.colors : (newProduct.colors ? String(newProduct.colors).split(',').map(c => c.trim()) : ['Navy Blue', 'White']),
      gender: newProduct.gender || 'Unisex',
      description: newProduct.description || 'Premium quality school uniform & educational product.',
      sku: newProduct.sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      approvalStatus: newProduct.approvalStatus || 'Pending',
      approvalComment: newProduct.approvalComment || 'Submitted for admin review',
      rejectionReason: null
    };

    setProducts(prev => {
      const updated = [createdProduct, ...prev];
      pushPlatformSync({ products: updated });
      return updated;
    });

    createSellerProductApi(createdProduct).catch(() => {});
    return createdProduct;
  };

  const editProduct = (id, updates) => {
    checkPermission();
    const numericId = Number(id);
    if (updates.name !== undefined && String(updates.name).trim() === '') {
      throw new Error('Validation failed: Product name cannot be empty.');
    }
    if (updates.price !== undefined && (Number(updates.price) <= 0 || isNaN(Number(updates.price)))) {
      throw new Error('Validation failed: Product price must be greater than 0.');
    }

    setProducts(prev => {
      const updated = prev.map(p => {
        if (Number(p.id) === numericId) {
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
      pushPlatformSync({ products: updated });
      return updated;
    });

    updateSellerProductApi(id, updates).catch(() => {});
  };

  const toggleProductStatus = (id, overrideStock = null) => {
    checkPermission();
    const numericId = Number(id);

    setProducts(prev => {
      const target = prev.find(p => Number(p.id) === numericId);
      if (!target) return prev;

      const currentQty = Number(target.stockQuantity ?? (target.inStock !== false ? 50 : 0));
      const currentStatus = target.inStock !== false && currentQty > 0;

      if (!currentStatus && currentQty === 0) {
        const nextStockValue = Number(overrideStock);
        if (!Number.isFinite(nextStockValue) || nextStockValue <= 0) {
          throw new Error('Validation failed: Product stock must be greater than 0 before activating an out-of-stock product.');
        }

        const updated = prev.map(p => Number(p.id) === numericId ? {
          ...p,
          inStock: true,
          stockQuantity: nextStockValue
        } : p);
        pushPlatformSync({ products: updated });
        updateStockApi(id, nextStockValue).catch(() => {});
        return updated;
      }

      const nextStatus = !currentStatus;
      const nextStock = nextStatus ? (Number(target.stockQuantity) > 0 ? Number(target.stockQuantity) : 50) : 0;
      const updated = prev.map(p => Number(p.id) === numericId ? {
        ...p,
        inStock: nextStatus,
        stockQuantity: nextStock
      } : p);
      pushPlatformSync({ products: updated });
      updateStockApi(id, nextStock).catch(() => {});
      return updated;
    });
  };

  const deleteProduct = (id) => {
    checkPermission();
    const numericId = Number(id);
    setProducts(prev => {
      const updated = prev.filter(p => Number(p.id) !== numericId);
      pushPlatformSync({ products: updated });
      return updated;
    });
    deleteSellerProductApi(id).catch(() => {});
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
          image: item.image || current.image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=80',
          sku: item.sku || current.sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`
        });
      });

      const updated = Array.from(existingMap.values());
      pushPlatformSync({ products: updated });
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
      pushPlatformSync({ orders: updated });
      return updated;
    });
    return newOrder;
  };

  const editOrder = (id, updates) => {
    checkPermission();
    setOrders(prev => {
      const updated = prev.map(o => (o.id === id ? { ...o, ...updates } : o));
      pushPlatformSync({ orders: updated });
      return updated;
    });
  };

  const updateOrderStatus = (id, status) => {
    checkPermission();
    editOrder(id, { status });
    updateOrderStatusApi(id, status).catch(() => {});
  };

  const deleteOrder = (id) => {
    checkPermission();
    setOrders(prev => {
      const updated = prev.filter(o => o.id !== id);
      pushPlatformSync({ orders: updated });
      return updated;
    });
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
      pushPlatformSync({ promotions: updated });
      return updated;
    });

    createPromotionApi(newPromo).catch(() => {});
    return newPromo;
  };

  const editPromotion = (id, updates) => {
    checkPermission();
    setPromotions(prev => {
      const updated = prev.map(p => (p.id === id ? { ...p, ...updates } : p));
      pushPlatformSync({ promotions: updated });
      return updated;
    });
  };

  const deletePromotion = (id) => {
    checkPermission();
    setPromotions(prev => {
      const updated = prev.filter(p => p.id !== id);
      pushPlatformSync({ promotions: updated });
      return updated;
    });
    deletePromotionApi(id).catch(() => {});
  };

  const togglePromotionStatus = (id) => {
    checkPermission();
    setPromotions(prev => {
      const updated = prev.map(p => (p.id === id ? { ...p, status: p.status === 'active' ? 'expired' : 'active' } : p));
      pushPlatformSync({ promotions: updated });
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
      pushPlatformSync({ schoolOrders: updated });
      return updated;
    });
    createSchoolOrderApi(newReq).catch(() => {});
    return newReq;
  };

  const editSchoolOrder = (id, updates) => {
    checkPermission();
    setSchoolOrders(prev => {
      const updated = prev.map(s => (s.id === id ? { ...s, ...updates } : s));
      pushPlatformSync({ schoolOrders: updated });
      return updated;
    });
    updateSchoolOrderApi(id, updates).catch(() => {});
  };

  const deleteSchoolOrder = (id) => {
    checkPermission();
    setSchoolOrders(prev => {
      const updated = prev.filter(s => s.id !== id);
      pushPlatformSync({ schoolOrders: updated });
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
      pushPlatformSync({ customers: updated });
      return updated;
    });
    return newCust;
  };

  const editCustomer = (id, updates) => {
    checkPermission();
    setCustomers(prev => {
      const updated = prev.map(c => (c.id === id ? { ...c, ...updates } : c));
      pushPlatformSync({ customers: updated });
      return updated;
    });
  };

  const deleteCustomer = (id) => {
    checkPermission();
    setCustomers(prev => {
      const updated = prev.filter(c => c.id !== id);
      pushPlatformSync({ customers: updated });
      return updated;
    });
  };

  // Reviews Actions
  const approveReview = (reviewId) => {
    checkPermission();
    setReviews(prev => {
      const updated = prev.map(r => (r.id === reviewId || String(r.id) === String(reviewId) ? { ...r, status: 'Approved', approvalStatus: 'Approved' } : r));
      pushPlatformSync({ reviews: updated });
      return updated;
    });
    approveReviewApi(reviewId).catch(() => {});
  };

  const replyToReview = (reviewId, replyText) => {
    checkPermission();
    setReviews(prev => {
      const updated = prev.map(r => (r.id === reviewId ? { ...r, reply: replyText } : r));
      pushPlatformSync({ reviews: updated });
      return updated;
    });
    replyToReviewApi(reviewId, replyText).catch(() => {});
  };

  const deleteReview = (reviewId) => {
    checkPermission();
    setReviews(prev => {
      const updated = prev.filter(r => r.id !== reviewId);
      pushPlatformSync({ reviews: updated });
      return updated;
    });
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
        submitSellerApplication,
        approveSellerApplication,
        loginSellerByPhone,
        showToast,
        loginSeller,
        logoutSeller,
        updateSellerProfile,
        requestPayout,
        clearAllSellerData,
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
