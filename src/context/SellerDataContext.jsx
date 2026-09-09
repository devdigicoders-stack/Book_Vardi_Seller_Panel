import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { 
  ALL_PRODUCTS,
  ORDERS as MOCK_ORDERS,
  PROMOTIONS as MOCK_PROMOTIONS,
  SCHOOL_ORDERS as MOCK_SCHOOL_ORDERS,
  CUSTOMERS as MOCK_CUSTOMERS,
  FINANCE_DATA as MOCK_FINANCE,
  REVIEWS as MOCK_REVIEWS,
  NOTIFICATIONS as MOCK_NOTIFICATIONS,
  SHIPPING_PARTNERS as MOCK_SHIPPING_PARTNERS,
  SELLER_SETTINGS as MOCK_SELLER_SETTINGS,
  USERS
} from '../data/mockData';
import { pushPlatformSync, usePlatformSyncListener } from '../utils/syncBridge';

let pendingUpdates = {};
let saveTimeout = null;

// Helper to write updated mock data back to file (Vite dev server endpoint & build-time script)
export const saveMockData = async (updatedData) => {
  pendingUpdates = { ...pendingUpdates, ...updatedData };
  if (saveTimeout) clearTimeout(saveTimeout);

  saveTimeout = setTimeout(async () => {
    const toSend = { ...pendingUpdates };
    pendingUpdates = {};
    try {
      if (typeof window !== 'undefined') {
        await fetch('/api/save-mock-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(toSend)
        });
      }
    } catch (err) {
      console.debug('Dev save endpoint not reachable, persisting via localStorage:', err.message);
    }
  }, 300);
};

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
        name: 'Ritesh Yadav',
        email: 'merchant@bookvardi.in',
        phone: '+91 98765 43210',
        role: 'Partner Merchant', // Partner Merchant, Store Manager, Catalog Specialist, Logistics Lead
        designation: 'Proprietor & Authorized Signatory',
        merchantId: 'BV-SLR-8941',
        pan: 'ABCDE1234F',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
        lastLogin: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      };
    } catch {
      return {
        name: 'Ritesh Yadav',
        email: 'merchant@bookvardi.in',
        phone: '+91 98765 43210',
        role: 'Partner Merchant',
        designation: 'Proprietor & Authorized Signatory',
        merchantId: 'BV-SLR-8941',
        pan: 'ABCDE1234F',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
        lastLogin: 'Today'
      };
    }
  });

  const loginSeller = ({ email, role }) => {
    const matchedUser = USERS.find((u) => u.email?.toLowerCase() === email?.toLowerCase());
    if (matchedUser) {
      if (!matchedUser.isSeller || matchedUser.sellerStatus !== 'approved') {
        throw new Error(`Access Denied: Account '${matchedUser.name}' is not an approved seller in Book Vardi mockData.`);
      }
      role = matchedUser.sellerRole || matchedUser.role || role;
    } else if (!APPROVED_SELLER_ROLES.includes(role)) {
      throw new Error(`Unauthorized: Role '${role}' is not permitted to access this merchant portal.`);
    }

    const updated = {
      ...sellerUser,
      name: matchedUser?.name || sellerUser.name,
      email: email || sellerUser.email,
      role: role || 'Partner Merchant',
      lastLogin: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    };
    setSellerUser(updated);
    setIsAuthenticated(true);
    localStorage.setItem('seller_user_profile', JSON.stringify(updated));
    localStorage.setItem('seller_is_authenticated', JSON.stringify(true));
  };

  const logoutSeller = () => {
    setIsAuthenticated(false);
    localStorage.setItem('seller_is_authenticated', JSON.stringify(false));
  };

  const updateSellerProfile = (updates) => {
    setSellerUser(prev => {
      const next = { ...prev, ...updates };
      localStorage.setItem('seller_user_profile', JSON.stringify(next));
      return next;
    });
  };

  // 1. Products
  const [products, setProducts] = useState(() => {
    const stored = localStorage.getItem('seller_products');
    return stored ? JSON.parse(stored) : ALL_PRODUCTS;
  });

  // 2. Orders
  const [orders, setOrders] = useState(() => {
    const stored = localStorage.getItem('seller_orders');
    return stored ? JSON.parse(stored) : (MOCK_ORDERS || []);
  });

  // 3. Promotions
  const [promotions, setPromotions] = useState(() => {
    const stored = localStorage.getItem('seller_promotions');
    return stored ? JSON.parse(stored) : (MOCK_PROMOTIONS || []);
  });

  // 4. School Orders
  const [schoolOrders, setSchoolOrders] = useState(() => {
    const stored = localStorage.getItem('seller_school_orders');
    return stored ? JSON.parse(stored) : (MOCK_SCHOOL_ORDERS || []);
  });

  // 5. Customers
  const [customers, setCustomers] = useState(() => {
    const stored = localStorage.getItem('seller_customers');
    return stored ? JSON.parse(stored) : (MOCK_CUSTOMERS || []);
  });

  // 6. Finance
  const [finance, setFinance] = useState(() => {
    const stored = localStorage.getItem('seller_finance');
    return stored ? JSON.parse(stored) : (MOCK_FINANCE || {});
  });

  // 7. Reviews
  const [reviews, setReviews] = useState(() => {
    const stored = localStorage.getItem('seller_reviews');
    return stored ? JSON.parse(stored) : (MOCK_REVIEWS || []);
  });

  // 8. Notifications
  const [notifications, setNotifications] = useState(() => {
    const stored = localStorage.getItem('seller_notifications');
    return stored ? JSON.parse(stored) : (MOCK_NOTIFICATIONS || []);
  });

  // 9. Shipping Partners
  const [shippingPartners, setShippingPartners] = useState(() => {
    const stored = localStorage.getItem('seller_shipping_partners');
    return stored ? JSON.parse(stored) : (MOCK_SHIPPING_PARTNERS || []);
  });

  // 10. Settings
  const [settings, setSettings] = useState(() => {
    const stored = localStorage.getItem('seller_settings');
    return stored ? JSON.parse(stored) : (MOCK_SELLER_SETTINGS || {});
  });

  // Sync to localStorage (client-side persistence without disk writes that trigger reloads)
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

  // Auth Guard Helper
  const checkPermission = useCallback(() => {
    if (!isApproved) {
      throw new Error('Permission denied: You must be an approved seller to perform this action.');
    }
  }, [isApproved]);

  // ==================== PRODUCT CRUD ====================
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
      sku: newProduct.sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`
    };

    setProducts(prev => {
      const updated = [createdProduct, ...prev];
      pushPlatformSync({ products: updated });
      return updated;
    });
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
          return {
            ...p,
            ...updates,
            price: updates.price !== undefined ? Number(updates.price) : p.price,
            originalPrice: updates.originalPrice !== undefined ? Number(updates.originalPrice) : p.originalPrice,
            stockQuantity: updates.stockQuantity !== undefined ? Number(updates.stockQuantity) : (p.stockQuantity ?? 50),
            inStock: updates.inStock !== undefined 
              ? updates.inStock 
              : (updates.stockQuantity !== undefined ? Number(updates.stockQuantity) > 0 : p.inStock)
          };
        }
        return p;
      });
      pushPlatformSync({ products: updated });
      return updated;
    });
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
        return updated;
      }

      const nextStatus = !currentStatus;
      const updated = prev.map(p => Number(p.id) === numericId ? {
        ...p,
        inStock: nextStatus,
        stockQuantity: nextStatus
          ? (Number(p.stockQuantity) > 0 ? Number(p.stockQuantity) : 50)
          : Number(p.stockQuantity) || 0
      } : p);
      pushPlatformSync({ products: updated });
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
  };

  // ==================== ORDER CRUD ====================
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
  };

  const deleteOrder = (id) => {
    checkPermission();
    setOrders(prev => {
      const updated = prev.filter(o => o.id !== id);
      pushPlatformSync({ orders: updated });
      return updated;
    });
  };

  // ==================== PROMOTIONS CRUD ====================
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
      scope: promo.scope || (promo.specificProductId ? 'product' : 'storewide'),
      specificProductId: promo.specificProductId || null,
      specificProductName: promo.specificProductName || null,
      specificProductSku: promo.specificProductSku || null,
      specificProductImage: promo.specificProductImage || null
    };

    setPromotions(prev => {
      const updated = [newPromo, ...prev];
      pushPlatformSync({ promotions: updated });
      return updated;
    });
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
  };

  const togglePromotionStatus = (id) => {
    checkPermission();
    setPromotions(prev => {
      const updated = prev.map(p => (p.id === id ? { ...p, status: p.status === 'active' ? 'expired' : 'active' } : p));
      pushPlatformSync({ promotions: updated });
      return updated;
    });
  };

  // ==================== SCHOOL ORDERS CRUD ====================
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
    return newReq;
  };

  const editSchoolOrder = (id, updates) => {
    checkPermission();
    setSchoolOrders(prev => {
      const updated = prev.map(s => (s.id === id ? { ...s, ...updates } : s));
      pushPlatformSync({ schoolOrders: updated });
      return updated;
    });
  };

  const deleteSchoolOrder = (id) => {
    checkPermission();
    setSchoolOrders(prev => {
      const updated = prev.filter(s => s.id !== id);
      pushPlatformSync({ schoolOrders: updated });
      return updated;
    });
  };

  // ==================== CUSTOMERS CRUD ====================
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

  // ==================== REVIEWS ====================
  const replyToReview = (reviewId, replyText) => {
    checkPermission();
    setReviews(prev => {
      const updated = prev.map(r => (r.id === reviewId ? { ...r, reply: replyText } : r));
      pushPlatformSync({ reviews: updated });
      return updated;
    });
  };

  const deleteReview = (reviewId) => {
    checkPermission();
    setReviews(prev => {
      const updated = prev.filter(r => r.id !== reviewId);
      pushPlatformSync({ reviews: updated });
      return updated;
    });
  };

  // ==================== NOTIFICATIONS ====================
  const markNotificationRead = (id) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, unread: false } : n)));
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // ==================== SETTINGS ====================
  const updateSettings = (updates) => {
    checkPermission();
    setSettings(prev => ({ ...prev, ...updates }));
  };

  // ==================== SHIPPING ====================
  const toggleShippingPartner = (id) => {
    checkPermission();
    setShippingPartners(prev => prev.map(p => (p.id === id ? { ...p, active: !p.active } : p)));
  };

  return (
    <SellerDataContext.Provider
      value={{
        isApproved,
        isAuthenticated,
        sellerUser,
        loginSeller,
        logoutSeller,
        updateSellerProfile,
        // State
        products,
        orders,
        promotions,
        schoolOrders,
        customers,
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
