const API_BASE_URL = 'http://localhost:5000/api/seller';

// Helper to get auth header
const getAuthHeaders = () => {
  const token = localStorage.getItem('bv_seller_jwt_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// ==========================================
// 1. Seller Auth & Onboarding APIs
// ==========================================
export const sendPhoneOtpApi = async (phone) => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone })
    });
    return await res.json();
  } catch (error) {
    return { success: true, otp: '123456', message: 'Fallback to offline mode: OTP 123456' };
  }
};

export const verifyPhoneOtpApi = async (phone, otp) => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
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
    const res = await fetch(`${API_BASE_URL}/register`, {
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

export const fetchSellerStatusApi = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/status`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Network response error');
    return await res.json();
  } catch (error) {
    return null;
  }
};

export const adminApproveTestApi = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/admin-approve-test`, {
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
    const res = await fetch(`${API_BASE_URL}/products`, {
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
    const res = await fetch(`${API_BASE_URL}/products/categories`, {
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
    const res = await fetch(`${API_BASE_URL}/customers`, {
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
    const res = await fetch(`${API_BASE_URL}/products`, {
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
    const res = await fetch(`${API_BASE_URL}/products/${id}`, {
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
    const res = await fetch(`${API_BASE_URL}/products/${id}`, {
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
    const res = await fetch(`${API_BASE_URL}/inventory/${id}/stock`, {
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
    const res = await fetch(`${API_BASE_URL}/orders`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('API Error');
    return await res.json();
  } catch (error) {
    return null;
  }
};

export const updateOrderStatusApi = async (orderId, status) => {
  try {
    const res = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ status })
    });
    return await res.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const fetchSchoolOrdersApi = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/school-orders`, {
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
    const res = await fetch(`${API_BASE_URL}/school-orders`, {
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
    const res = await fetch(`${API_BASE_URL}/school-orders/${id}`, {
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
    const res = await fetch(`${API_BASE_URL}/school-orders/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
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
    const res = await fetch(`${API_BASE_URL}/promotions`, {
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
    const res = await fetch(`${API_BASE_URL}/promotions`, {
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
    const res = await fetch(`${API_BASE_URL}/promotions/${id}`, {
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
    const res = await fetch(`${API_BASE_URL}/promotions/${id}/status`, {
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
    const res = await fetch(`${API_BASE_URL}/wallet`, {
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
    const res = await fetch(`${API_BASE_URL}/payout-request`, {
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
// 6. Reviews & Ratings APIs
// ==========================================
export const fetchSellerReviewsApi = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/reviews`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('API Error');
    return await res.json();
  } catch (error) {
    return null;
  }
};

export const approveReviewApi = async (id) => {
  try {
    const res = await fetch(`${API_BASE_URL}/reviews/${id}/approve`, {
      method: 'PATCH',
      headers: getAuthHeaders()
    });
    return await res.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const replyToReviewApi = async (id, replyText) => {
  try {
    const res = await fetch(`${API_BASE_URL}/reviews/${id}/reply`, {
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

// ==========================================
// 7. Profile & Settings APIs
// ==========================================
export const fetchSellerProfileApi = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/profile`, {
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
    const res = await fetch(`${API_BASE_URL}/profile`, {
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
    const res = await fetch(`${API_BASE_URL}/settings`, {
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
    const res = await fetch(`${API_BASE_URL}/settings`, {
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
