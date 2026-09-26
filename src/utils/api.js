const SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const API_BASE_URL = `${SERVER_URL}/seller`;

// Helper to get auth header dynamically for whichever user is logged in
const getAuthHeaders = () => {
  let token = localStorage.getItem('bv_seller_jwt_token') || localStorage.getItem('book_vardi_auth_token') || localStorage.getItem('token');
  const userProfStr = localStorage.getItem('seller_user_profile') || localStorage.getItem('book_vardi_user_profile') || localStorage.getItem('bv_seller_reg_data') || localStorage.getItem('book_vardi_seller_profile');
  let userPhone = localStorage.getItem('bv_user_phone') || localStorage.getItem('user_phone') || '';
  let sellerId = localStorage.getItem('bv_seller_id') || localStorage.getItem('seller_id') || '';

  if (userProfStr && userProfStr !== 'undefined' && userProfStr !== 'null') {
    try {
      const u = JSON.parse(userProfStr);
      if (!userPhone || userPhone === 'undefined' || userPhone === 'null') userPhone = u.phone || u.sellerPhone || u.mobile || u.registeredMobile || '';
      if (!sellerId || sellerId === 'undefined' || sellerId === 'null') sellerId = u.id || u._id || u.sellerId || '';
    } catch (e) {}
  }

  if (token === 'undefined' || token === 'null' || token === 'Bearer') token = '';
  if (userPhone === 'undefined' || userPhone === 'null' || userPhone === '[object Object]') userPhone = '';
  if (sellerId === 'undefined' || sellerId === 'null' || sellerId === '[object Object]') sellerId = '';

  return {
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(userPhone ? { 'x-user-phone': String(userPhone) } : {}),
    ...(sellerId ? { 'x-seller-id': String(sellerId) } : {})
  };
};

// Central Request Logger Helper Function
const loggedFetch = async (url, options = {}) => {
  const method = options.method || 'GET';
  console.log(`🌐 [FRONTEND API OUTGOING] ${method} ${url}`, options.body ? options.body : '');
  try {
    const res = await fetch(url, options);
    console.log(`📥 [FRONTEND API RESPONSE] ${res.status} ${res.statusText} from ${method} ${url}`);
    return res;
  } catch (err) {
    console.error(`❌ [FRONTEND API NETWORK ERROR] ${method} ${url}:`, err);
    throw err;
  }
};

// ==========================================
// 1. Seller Auth & Onboarding APIs
// ==========================================
export const sendPhoneOtpApi = async (phone) => {
  try {
    const res = await loggedFetch(`${API_BASE_URL}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone })
    });
    const data = await res.json();
    if (!res.ok || data.success === false) {
      return {
        success: false,
        message: data.message || `No seller account found with mobile number +91 ${String(phone).replace(/\D/g, '').slice(-10)}. Please register as a new seller first.`
      };
    }
    return data;
  } catch (error) {
    return { success: false, message: error.message || 'Network error sending OTP.' };
  }
};

export const verifyPhoneOtpApi = async (phone, otp) => {
  try {
    const res = await loggedFetch(`${API_BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp })
    });
    const data = await res.json();
    if (data.token) {
      localStorage.setItem('bv_seller_jwt_token', data.token);
    }
    return data;
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const submitSellerApplicationApi = async (formData) => {
  try {
    const token = localStorage.getItem('bv_seller_jwt_token');
    if (token) {
      const updateRes = await loggedFetch(`${API_BASE_URL}/auth/application`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(formData)
      });
      if (updateRes.ok) {
        return await updateRes.json();
      }
    }

    const res = await loggedFetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(formData)
    });
    return await res.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const fetchSellerStatusApi = async (phone) => {
  try {
    const url = phone ? `${API_BASE_URL}/auth/status?phone=${encodeURIComponent(phone)}` : `${API_BASE_URL}/auth/status`;
    const res = await loggedFetch(url, {
      headers: getAuthHeaders()
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    return null;
  }
};

export const adminApproveTestApi = async () => {
  try {
    const res = await loggedFetch(`${API_BASE_URL}/auth/admin-approve-test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      }
    });
    return await res.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// ==========================================
// 2. Catalog (Products & Stock) APIs
// ==========================================
export const fetchSellerProductsApi = async () => {
  try {
    const res = await loggedFetch(`${API_BASE_URL}/products`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('API Error');
    return await res.json();
  } catch (error) {
    return null;
  }
};

export const fetchSellerCategoriesApi = async () => {
  try {
    const res = await loggedFetch(`${API_BASE_URL}/products/categories`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('API Error');
    return await res.json();
  } catch (error) {
    return null;
  }
};

export const fetchSellerCustomersApi = async () => {
  try {
    const res = await loggedFetch(`${API_BASE_URL}/customers`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('API Error');
    return await res.json();
  } catch (error) {
    return null;
  }
};

export const createSellerProductApi = async (productData) => {
  try {
    const res = await loggedFetch(`${API_BASE_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(productData)
    });
    return await res.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const updateSellerProductApi = async (id, updates) => {
  try {
    const res = await loggedFetch(`${API_BASE_URL}/products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(updates)
    });
    return await res.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const deleteSellerProductApi = async (id) => {
  try {
    const res = await loggedFetch(`${API_BASE_URL}/products/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return await res.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const updateStockApi = async (id, stockQuantity) => {
  try {
    const res = await loggedFetch(`${API_BASE_URL}/inventory/${id}/stock`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ stockQuantity })
    });
    return await res.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// ==========================================
// 3. Customer & School Orders APIs
// ==========================================
export const fetchSellerOrdersApi = async () => {
  try {
    const res = await loggedFetch(`${API_BASE_URL}/orders`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('API Error');
    return await res.json();
  } catch (error) {
    return null;
  }
};

export const updateOrderStatusApi = async (orderId, status, details = {}) => {
  try {
    const res = await loggedFetch(`${API_BASE_URL}/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ status, ...details })
    });
    return await res.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const downloadSellerInvoiceApi = async (orderId) => {
  try {
    const res = await loggedFetch(`${API_BASE_URL}/orders/${orderId}/invoice`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to download tax invoice PDF');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Tax_Invoice_${orderId}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
    return { success: true };
  } catch (error) {
    console.error('Download invoice error:', error);
    return { success: false, message: error.message };
  }
};

export const fetchSchoolOrdersApi = async () => {
  try {
    const res = await loggedFetch(`${API_BASE_URL}/school-orders`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('API Error');
    return await res.json();
  } catch (error) {
    return null;
  }
};

export const createSchoolOrderApi = async (data) => {
  try {
    const res = await loggedFetch(`${API_BASE_URL}/school-orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(data)
    });
    return await res.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const updateSchoolOrderApi = async (id, updates) => {
  try {
    const res = await loggedFetch(`${API_BASE_URL}/school-orders/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(updates)
    });
    return await res.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const deleteSchoolOrderApi = async (id) => {
  try {
    const res = await loggedFetch(`${API_BASE_URL}/school-orders/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return await res.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const acceptSchoolOrderApi = async (id) => {
  try {
    const res = await loggedFetch(`${API_BASE_URL}/school-orders/${id}/accept`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return await res.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const submitSchoolQuoteApi = async (id, quoteData) => {
  try {
    const res = await loggedFetch(`${API_BASE_URL}/school-orders/${id}/quote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(quoteData)
    });
    return await res.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};


// ==========================================
// 4. Promotions & Offers APIs
// ==========================================
export const fetchPromotionsApi = async () => {
  try {
    const res = await loggedFetch(`${API_BASE_URL}/promotions`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('API Error');
    return await res.json();
  } catch (error) {
    return null;
  }
};

export const createPromotionApi = async (promoData) => {
  try {
    const res = await loggedFetch(`${API_BASE_URL}/promotions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(promoData)
    });
    return await res.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const deletePromotionApi = async (id) => {
  try {
    const res = await loggedFetch(`${API_BASE_URL}/promotions/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return await res.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const togglePromotionStatusApi = async (id) => {
  try {
    const res = await loggedFetch(`${API_BASE_URL}/promotions/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders()
    });
    return await res.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// ==========================================
// 5. Financials & Wallet Payout APIs
// ==========================================
export const fetchSellerWalletApi = async () => {
  try {
    const res = await loggedFetch(`${API_BASE_URL}/wallet`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('API Error');
    return await res.json();
  } catch (error) {
    return null;
  }
};

export const requestPayoutApi = async (amount, bankDetails) => {
  try {
    const res = await loggedFetch(`${API_BASE_URL}/payout-request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ amount, bankDetails })
    });
    return await res.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};



// ==========================================
// 7. Profile & Settings APIs
// ==========================================
export const fetchSellerProfileApi = async () => {
  try {
    const res = await loggedFetch(`${API_BASE_URL}/profile`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('API Error');
    return await res.json();
  } catch (error) {
    return null;
  }
};

export const updateSellerProfileApi = async (updates) => {
  try {
    const res = await loggedFetch(`${API_BASE_URL}/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(updates)
    });
    return await res.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const fetchSellerSettingsApi = async () => {
  try {
    const res = await loggedFetch(`${API_BASE_URL}/settings`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('API Error');
    return await res.json();
  } catch (error) {
    return null;
  }
};

export const updateSellerSettingsApi = async (updates) => {
  try {
    const res = await loggedFetch(`${API_BASE_URL}/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(updates)
    });
    return await res.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// ==========================================
// Review Management APIs
// ==========================================
export const fetchSellerReviewsApi = async () => {
  try {
    const res = await loggedFetch(`${SERVER_URL}/reviews/seller`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('API Error');
    return await res.json();
  } catch (error) {
    return [];
  }
};

export const approveSellerReviewApi = async (id) => {
  try {
    const res = await loggedFetch(`${SERVER_URL}/reviews/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ status: 'approved' })
    });
    return await res.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const replySellerReviewApi = async (id, replyText) => {
  try {
    const res = await loggedFetch(`${SERVER_URL}/reviews/${id}/reply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ replyText })
    });
    return await res.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const deleteSellerReviewApi = async (id) => {
  try {
    const res = await loggedFetch(`${SERVER_URL}/reviews/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return await res.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// ==========================================
// Logistics & Delivery Partner APIs
// ==========================================
export const fetchDeliveryConfigApi = async () => {
  try {
    const res = await loggedFetch(`${SERVER_URL}/delivery/config`, {
      headers: getAuthHeaders()
    });
    return await res.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const updateDeliveryConfigApi = async (configData) => {
  try {
    const res = await loggedFetch(`${SERVER_URL}/delivery/config`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(configData)
    });
    return await res.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const checkServiceabilityApi = async (payload) => {
  try {
    const res = await loggedFetch(`${SERVER_URL}/delivery/serviceability`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(payload)
    });
    return await res.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const createShipmentApi = async (payload) => {
  try {
    const res = await loggedFetch(`${SERVER_URL}/delivery/create-shipment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(payload)
    });
    return await res.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const trackAwbApi = async (awbNumber) => {
  try {
    const res = await loggedFetch(`${SERVER_URL}/delivery/track/${awbNumber}`, {
      headers: getAuthHeaders()
    });
    return await res.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// ==========================================
// Delivery Partner Portal APIs
// ==========================================
export const fetchDeliveryPartnerOrderApi = async (token) => {
  try {
    const res = await loggedFetch(`${SERVER_URL}/delivery/partner/${token}`);
    return await res.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const resendDeliveryOtpApi = async (token) => {
  try {
    const res = await loggedFetch(`${SERVER_URL}/delivery/partner/${token}/resend-otp`, { method: 'POST' });
    return await res.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const verifyDeliveryOtpApi = async (token, otp) => {
  try {
    const res = await loggedFetch(`${SERVER_URL}/delivery/partner/${token}/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ otp })
    });
    return await res.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const updateDeliveryLocationApi = async (token, lat, lng) => {
  try {
    const res = await loggedFetch(`${SERVER_URL}/delivery/partner/${token}/location`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat, lng })
    });
    return await res.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Fetch list of Admin-added schools
export const fetchSchoolsApi = async () => {
  try {
    const res = await loggedFetch(`${SERVER_URL}/schools`);
    const data = await res.json();
    return data.schools || data || [];
  } catch (error) {
    console.warn('Failed to fetch schools:', error);
    return [];
  }
};

// Fetch categories with GST %
export const fetchCategoriesApi = async () => {
  try {
    const res = await loggedFetch(`${SERVER_URL}/categories`);
    const data = await res.json();
    return Array.isArray(data) ? data : (data.categories || []);
  } catch (error) {
    console.warn('Failed to fetch categories:', error);
    return [];
  }
};


