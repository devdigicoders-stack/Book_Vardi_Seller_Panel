import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  ArrowLeft,
  Printer, 
  Download,
  ShieldCheck, 
  FileText, 
  CheckCircle2,
  Lock,
  Building,
  Store,
  DollarSign,
  Truck,
  ExternalLink
} from 'lucide-react';
import { useSellerData, readActiveSellerSettings, readActiveSellerProfile, stripCustomerPhoneFromAddress } from '../context/SellerDataContext';
import { SERVER_URL } from '../utils/api';
import { getSellerInvoiceNumber } from '../utils/invoiceHelper';
import useModalBackTrap from '../hooks/useModalBackTrap';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1588072432836-e10032774350?w=150&auto=format&fit=crop&q=80';

export function getProductGstRate(item) {
  const explicitGst = item?.gstPercent ?? item?.gstPercentage ?? item?.gstRate ?? item?.gst ?? item?.taxRate ?? item?.productId?.gstPercent ?? item?.productId?.gstRate ?? item?.productId?.gst ?? item?.productId?.gstPercentage ?? item?.productId?.taxRate;
  if (explicitGst !== undefined && explicitGst !== null && String(explicitGst).trim() !== '' && !isNaN(Number(explicitGst))) {
    return Number(explicitGst);
  }
  const cat = String(item?.category || item?.productId?.category || '').toLowerCase();
  const name = String(item?.name || item?.productName || item?.productId?.name || '').toLowerCase();
  if (cat.includes('book') || name.includes('book') || cat.includes('textbook') || name.includes('textbook')) {
    return 0;
  }
  return 5;
}

export function numberToWords(num) {
  const n = Math.round(Number(num || 0));
  if (isNaN(n) || n === 0) return 'Zero Rupees Only';
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  function inWords(val) {
    if (val === 0) return '';
    if (val < 20) return a[val] + ' ';
    if (val < 100) return b[Math.floor(val / 10)] + (val % 10 !== 0 ? ' ' + a[val % 10] : '') + ' ';
    if (val < 1000) return a[Math.floor(val / 100)] + ' Hundred ' + inWords(val % 100);
    if (val < 100000) return inWords(Math.floor(val / 1000)) + ' Thousand ' + inWords(val % 1000);
    if (val < 10000000) return inWords(Math.floor(val / 100000)) + ' Lakh ' + inWords(val % 100000);
    return inWords(Math.floor(val / 10000000)) + ' Crore ' + inWords(val % 10000000);
  }
  return (inWords(n).trim() + ' Rupees Only').replace(/\s+/g, ' ');
}

export const GST_STATE_CODES = {
  '01': 'jammu_kashmir', '02': 'himachal_pradesh', '03': 'punjab', '04': 'chandigarh',
  '05': 'uttarakhand', '06': 'haryana', '07': 'delhi', '08': 'rajasthan',
  '09': 'uttar_pradesh', '10': 'bihar', '11': 'sikkim', '12': 'arunachal_pradesh',
  '13': 'manipur', '14': 'nagaland', '15': 'mizoram', '16': 'tripura',
  '17': 'meghalaya', '18': 'assam', '19': 'west_bengal', '20': 'jharkhand',
  '21': 'odisha', '22': 'chhattisgarh', '23': 'madhya_pradesh', '24': 'gujarat',
  '27': 'maharashtra', '29': 'karnataka', '30': 'goa', '32': 'kerala',
  '33': 'tamil_nadu', '36': 'telangana', '37': 'andhra_pradesh'
};

export const PINCODE_PREFIX_MAP = [
  { regex: /^(20|21|22|23|24[0-7]|25|26[12]|27|28)/, key: 'uttar_pradesh', name: 'Uttar Pradesh' },
  { regex: /^(24[89]|26[3-9])/, key: 'uttarakhand', name: 'Uttarakhand' },
  { regex: /^11/, key: 'delhi', name: 'Delhi' },
  { regex: /^(12|13)/, key: 'haryana', name: 'Haryana' },
  { regex: /^(14|15|16)/, key: 'punjab', name: 'Punjab' },
  { regex: /^3[0-4]/, key: 'rajasthan', name: 'Rajasthan' },
  { regex: /^3[6-9]/, key: 'gujarat', name: 'Gujarat' },
  { regex: /^4[0-4]/, key: 'maharashtra', name: 'Maharashtra' },
  { regex: /^4[5-9]/, key: 'madhya_pradesh', name: 'Madhya Pradesh' },
  { regex: /^5[0-3]/, key: 'telangana', name: 'Telangana' },
  { regex: /^5[6-9]/, key: 'karnataka', name: 'Karnataka' },
  { regex: /^6[0-4]/, key: 'tamil_nadu', name: 'Tamil Nadu' },
  { regex: /^6[7-9]/, key: 'kerala', name: 'Kerala' },
  { regex: /^7[0-4]/, key: 'west_bengal', name: 'West Bengal' },
  { regex: /^8[0-5]/, key: 'bihar', name: 'Bihar' }
];

export const INDIAN_STATES = [
  {
    key: 'uttar_pradesh',
    name: 'Uttar Pradesh',
    aliases: [
      'uttar pradesh', 'uttarpradesh', 'utter pradesh', 'utterpradesh', 'uttarpardesh', 'uttar pardesh', 'uttar prdesh', 'uttarprdesh', 'u.p.', 'u.p', 'up', 'u p',
      'lucknow', 'kanpur', 'varanasi', 'mirzapur', 'behat', 'saharanpur', 'noida', 'greater noida', 'ghaziabad', 'agra', 'prayagraj', 'allahabad', 'gorakhpur', 'meerut', 'bareilly', 'aligarh', 'moradabad', 'jhansi', 'ayodhya', 'faizabad', 'azamgarh', 'muzaffarnagar', 'mathura', 'firozabad', 'bulandshahr', 'sambhal', 'amroha', 'hardoi', 'fatehpur', 'raebareli', 'sitapur', 'bahraich', 'gonda', 'basti', 'deoria', 'ballia', 'jaunpur', 'ghazipur', 'chandauli', 'bhadohi', 'sonbhadra', 'unnao', 'lakhimpur', 'pilibhit', 'shahjahanpur', 'budaun', 'rampur', 'bijnor', 'shamli', 'baghpat', 'hapur', 'kasganj', 'hathras', 'etah', 'mainpuri', 'etawah', 'auraiya', 'kannauj', 'farrukhabad', 'kanpur dehat', 'jalaun', 'hamirpur', 'mahoba', 'banda', 'chitrakoot', 'kaushambi', 'pratapgarh', 'amethi', 'sultanpur', 'barabanki', 'shravasti', 'balrampur', 'siddharthnagar', 'sant kabir nagar', 'maharajganj', 'kushinagar', 'mau', 'lalitpur'
    ]
  },
  {
    key: 'maharashtra',
    name: 'Maharashtra',
    aliases: [
      'maharashtra', 'maharastra', 'maharashtr', 'maharastr', 'maha rashtra', 'maha rastra', 'maharasthra', 'maharashtra state', 'm.h.', 'mh', 'm h',
      'mumbai', 'bombay', 'pune', 'nagpur', 'thane', 'navi mumbai', 'nashik', 'aurangabad', 'chhatrapati sambhaji nagar', 'solapur', 'kolhapur', 'amravati', 'nanded', 'jalgaon', 'akola', 'latur', 'dhule', 'ahmednagar', 'chandrapur', 'parbhani', 'panvel', 'kalyan', 'dombivli', 'vasai', 'virar', 'mira bhayandar', 'ulhasnagar', 'satara'
    ]
  },
  { key: 'delhi', name: 'Delhi', aliases: ['delhi', 'new delhi', 'nct of delhi', 'nct', 'dl', 'newdelhi', 'd.l.'] },
  { key: 'uttarakhand', name: 'Uttarakhand', aliases: ['uttarakhand', 'uttaranchal', 'dehradun', 'haridwar', 'roorkee', 'rishikesh', 'nainital', 'haldwani', 'uk', 'u.k.'] },
  { key: 'karnataka', name: 'Karnataka', aliases: ['karnataka', 'karnatka', 'karnatak', 'bangalore', 'bengaluru', 'mysore', 'mysuru', 'ka', 'k.a.', 'hubli', 'mangalore', 'mangaluru'] },
  { key: 'tamil_nadu', name: 'Tamil Nadu', aliases: ['tamil nadu', 'tamilnadu', 'tamil nad', 'chennai', 'madras', 'coimbatore', 'madurai', 'tn', 't.n.'] },
  { key: 'haryana', name: 'Haryana', aliases: ['haryana', 'hariyana', 'gurugram', 'gurgaon', 'faridabad', 'panipat', 'ambala', 'hr', 'h.r.'] },
  { key: 'rajasthan', name: 'Rajasthan', aliases: ['rajasthan', 'rajisthan', 'rajashtan', 'jaipur', 'jodhpur', 'udaipur', 'kota', 'bikaner', 'rj', 'r.j.'] },
  { key: 'west_bengal', name: 'West Bengal', aliases: ['west bengal', 'westbengal', 'paschim banga', 'kolkata', 'calcutta', 'howrah', 'siliguri', 'wb', 'w.b.'] },
  { key: 'gujarat', name: 'Gujarat', aliases: ['gujarat', 'gujrat', 'gujarath', 'ahmedabad', 'amdavad', 'surat', 'vadodara', 'baroda', 'rajkot', 'gj', 'g.j.'] },
  { key: 'punjab', name: 'Punjab', aliases: ['punjab', 'panjab', 'ludhiana', 'amritsar', 'jalandhar', 'pb', 'p.b.'] },
  { key: 'madhya_pradesh', name: 'Madhya Pradesh', aliases: ['madhya pradesh', 'madhyapradesh', 'madhya pardesh', 'bhopal', 'indore', 'gwalior', 'jabalpur', 'mp', 'm.p.'] },
  { key: 'bihar', name: 'Bihar', aliases: ['bihar', 'patna', 'gaya', 'bhagalpur', 'muzaffarpur', 'br', 'b.r.'] },
  { key: 'telangana', name: 'Telangana', aliases: ['telangana', 'telengana', 'hyderabad', 'secunderabad', 'warangal', 'tg', 'ts'] },
  { key: 'andhra_pradesh', name: 'Andhra Pradesh', aliases: ['andhra pradesh', 'andhrapradesh', 'visakhapatnam', 'vizag', 'vijayawada', 'guntur', 'ap', 'a.p.'] },
  { key: 'kerala', name: 'Kerala', aliases: ['kerala', 'keralam', 'kochi', 'cochin', 'thiruvananthapuram', 'trivandrum', 'kozhikode', 'kl', 'k.l.'] },
  { key: 'assam', name: 'Assam', aliases: ['assam', 'asom', 'guwahati', 'as'] },
  { key: 'jharkhand', name: 'Jharkhand', aliases: ['jharkhand', 'jharkand', 'ranchi', 'jamshedpur', 'dhanbad', 'jh'] },
  { key: 'odisha', name: 'Odisha', aliases: ['odisha', 'orissa', 'bhubaneswar', 'cuttack', 'od', 'or'] },
  { key: 'chhattisgarh', name: 'Chhattisgarh', aliases: ['chhattisgarh', 'chhatisgarh', 'chattisgarh', 'raipur', 'bilaspur', 'cg'] },
  { key: 'himachal_pradesh', name: 'Himachal Pradesh', aliases: ['himachal pradesh', 'himachal', 'shimla', 'dharamshala', 'hp'] },
  { key: 'jammu_kashmir', name: 'Jammu & Kashmir', aliases: ['jammu & kashmir', 'jammu and kashmir', 'jammu', 'kashmir', 'srinagar', 'jk'] },
  { key: 'goa', name: 'Goa', aliases: ['goa', 'panaji', 'panjim', 'margao', 'ga'] }
];

export function matchStateByText(inputStr) {
  if (!inputStr || typeof inputStr !== 'string') return null;
  const clean = inputStr.trim().toLowerCase();
  if (!clean) return null;

  for (const st of INDIAN_STATES) {
    for (const alias of st.aliases) {
      const regex = new RegExp(`(^|[^a-z0-9])${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z0-9]|$)`, 'i');
      if (regex.test(clean)) {
        return { key: st.key, name: st.name };
      }
    }
  }
  return null;
}

export function parseStateInfo(sourceObj, fallbackString = '') {
  // 1. FIRST PRIORITY: Explicit declared State Field (Place of Supply authoritative field)
  const explicitState = String(
    sourceObj?.state ||
    sourceObj?.province ||
    sourceObj?.stateName ||
    sourceObj?.shippingAddress?.state ||
    ''
  ).trim();

  if (explicitState) {
    const matched = matchStateByText(explicitState);
    if (matched) return matched;
  }

  // 2. SECOND PRIORITY: Explicit declared City Field
  const explicitCity = String(
    sourceObj?.city ||
    sourceObj?.district ||
    sourceObj?.cityName ||
    sourceObj?.shippingAddress?.city ||
    ''
  ).trim();

  if (explicitCity) {
    const matched = matchStateByText(explicitCity);
    if (matched) return matched;
  }

  // 3. THIRD PRIORITY: Address text scan (Combined address lines, street, landmark)
  let addressText = '';
  if (sourceObj && typeof sourceObj === 'object') {
    addressText = [
      sourceObj.state,
      sourceObj.city,
      sourceObj.addressLine,
      sourceObj.addressLine1,
      sourceObj.street,
      sourceObj.address,
      sourceObj.colony,
      sourceObj.landmark,
      fallbackString
    ].filter(Boolean).join(' ');
  } else if (typeof sourceObj === 'string') {
    addressText = `${sourceObj} ${fallbackString}`;
  } else if (fallbackString) {
    addressText = String(fallbackString);
  }

  if (addressText.trim()) {
    const matched = matchStateByText(addressText);
    if (matched) return matched;
  }

  // 4. FOURTH PRIORITY: GSTIN Prefix (2-digit state code)
  const rawGst = String(
    sourceObj?.gstNumber || sourceObj?.gstin || sourceObj?.gst || ''
  ).trim();
  if (rawGst.length >= 2 && /^\d{2}/.test(rawGst)) {
    const code = rawGst.slice(0, 2);
    if (GST_STATE_CODES[code]) {
      const found = INDIAN_STATES.find(s => s.key === GST_STATE_CODES[code]);
      if (found) return { key: found.key, name: found.name };
    }
  }

  // 5. FIFTH PRIORITY: 6-Digit Pincode (Fallback if State & City text was not provided)
  const explicitPin = String(sourceObj?.pincode || sourceObj?.pin || sourceObj?.postalCode || '').trim();
  const isolatedPinMatch = explicitPin.match(/\b([1-9]\d{5})\b/) || String(addressText || '').match(/\b([1-9]\d{5})\b/);
  const sixPin = isolatedPinMatch ? isolatedPinMatch[1] : (explicitPin.replace(/\D/g, '').length >= 6 ? explicitPin.replace(/\D/g, '').slice(0, 6) : '');
  if (sixPin) {
    for (const p of PINCODE_PREFIX_MAP) {
      if (p.regex.test(sixPin)) {
        return { key: p.key, name: p.name };
      }
    }
  }

  // 6. DEFAULT FALLBACK: Uttar Pradesh
  return { key: 'uttar_pradesh', name: 'Uttar Pradesh' };
}

export default function TaxInvoiceModal({ isOpen, onClose, order, sellerUser: passedSellerUser }) {
  if (!isOpen || !order) return null;

  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedSellerKey, setSelectedSellerKey] = useState(null);

  const [platformSettings, setPlatformSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('bookvardi_platform_settings') || localStorage.getItem('admin_settings') || localStorage.getItem('platform_settings');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    let isMounted = true;
    fetch(`${SERVER_URL}/admin/settings/public`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (isMounted && data) {
          setPlatformSettings(prev => ({ ...prev, ...data }));
          try {
            localStorage.setItem('bookvardi_platform_settings', JSON.stringify(data));
          } catch {}
        }
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, []);


  let contextSellerUser = null;
  let contextOrders = [];
  try {
    const dataContext = useSellerData?.();
    contextSellerUser = dataContext?.sellerUser || null;
    contextOrders = dataContext?.orders || [];
  } catch (e) {}

  // Intercept browser back button safely so user never gets kicked out of the portal
  useModalBackTrap(isOpen, onClose);

  const activeSellerUser = passedSellerUser || contextSellerUser || null;

  const isPlaceholderName = (name) => {
    if (!name || typeof name !== 'string') return true;
    const lower = name.trim().toLowerCase();
    return (
      lower === '' ||
      lower.includes(',') || // Multi-seller composite string is NOT a single seller
      lower === 'bookvardi verified seller' ||
      lower === 'bookvardi verified seller hub' ||
      lower === 'bookvardimerchant' ||
      lower === 'bookvardi merchant' ||
      lower === 'book vardi partner merchant' ||
      lower === 'book vardi partner store' ||
      lower === 'verified seller' ||
      lower === 'other verified seller' ||
      lower === 'partner merchant' ||
      lower === 'unknown seller' ||
      lower === 'new merchant' ||
      lower === 'merchant store' ||
      lower === 'direct marketplace' ||
      lower === 'seller' ||
      lower === 'merchant' ||
      lower === 'partner' ||
      lower === 'n/a' ||
      lower === 'null' ||
      lower === 'undefined'
    );
  };

  const getActiveSellerStoreName = () => {
    let settings = {};
    let profile = {};
    try {
      settings = typeof readActiveSellerSettings === 'function' ? readActiveSellerSettings() : {};
      profile = typeof readActiveSellerProfile === 'function' ? readActiveSellerProfile() : {};
    } catch (e) {}

    let localUserProfile = null;
    let localSettings = null;
    let localSellerProfile = null;
    let localRegData = null;
    try {
      localUserProfile = JSON.parse(localStorage.getItem('seller_user_profile') || 'null');
      localSettings = JSON.parse(localStorage.getItem('seller_settings') || 'null');
      localSellerProfile = JSON.parse(localStorage.getItem('book_vardi_seller_profile') || 'null');
      localRegData = JSON.parse(localStorage.getItem('bv_seller_reg_data') || 'null');
    } catch (e) {}

    const candidates = [
      activeSellerUser?.storeName,
      activeSellerUser?.tradeName,
      activeSellerUser?.businessName,
      activeSellerUser?.legalBusinessName,
      activeSellerUser?.storeDetails?.storeName,
      settings?.storeName,
      settings?.tradeName,
      settings?.legalName,
      profile?.storeName,
      profile?.tradeName,
      profile?.legalBusinessName,
      localSettings?.storeName,
      localSettings?.tradeName,
      localUserProfile?.storeName,
      localUserProfile?.tradeName,
      localSellerProfile?.storeName,
      localSellerProfile?.tradeName,
      localRegData?.tradeName,
      localRegData?.storeName,
      localRegData?.legalBusinessName,
      activeSellerUser?.name ? `${activeSellerUser.name}'s Store` : null,
      localUserProfile?.name ? `${localUserProfile.name}'s Store` : null
    ];

    for (const c of candidates) {
      if (c && !isPlaceholderName(c)) return c;
    }
    return '';
  };

  const getItemSellerName = (item) => {
    // 1. Direct populated seller on item
    if (item?.sellerId && typeof item.sellerId === 'object') {
      const name = item.sellerId.storeName || item.sellerId.tradeName || item.sellerId.businessName || item.sellerId.legalBusinessName || item.sellerId.storeDetails?.storeName || item.sellerId.name || item.sellerId.sellerName || item.sellerId.legalName;
      if (name && !isPlaceholderName(name)) return name;
    }

    // 2. Direct seller attributes on item
    const candidateItemNames = [
      item?.sellerStoreName,
      item?.storeName,
      item?.sellerDetails?.storeName,
      item?.sellerDetails?.tradeName,
      item?.sellerDetails?.businessName,
      item?.sellerDetails?.legalBusinessName,
      item?.sellerDetails?.sellerName,
      item?.tradeName,
      item?.businessName,
      item?.legalBusinessName,
      item?.sellerName,
      typeof item?.seller === 'string' ? item.seller : (item?.seller?.storeName || item?.seller?.tradeName || item?.seller?.businessName || item?.seller?.name)
    ];

    for (const c of candidateItemNames) {
      if (c && !isPlaceholderName(c)) return c;
    }

    // 3. Populated productId object on item
    if (item?.productId && typeof item.productId === 'object') {
      const pName = item.productId.sellerStoreName || item.productId.storeName || item.productId.tradeName || item.productId.legalBusinessName || item.productId.sellerName || item.productId.vendor || (item.productId.sellerId && typeof item.productId.sellerId === 'object' ? (item.productId.sellerId.storeName || item.productId.sellerId.name) : null);
      if (pName && !isPlaceholderName(pName)) return pName;
    }

    // 4. Product catalog lookup by ID or title
    const prodIdStr = String(item?.productId || item?.id || item?._id || '');
    const cleanItemName = String(item?.name || item?.productName || item?.itemName || '').replace(/\s*\([^)]*\)/g, '').trim().toLowerCase();

    const catalogKeys = ['bv_seller_products', 'admin_products', 'bv_sync_products'];
    for (const catKey of catalogKeys) {
      try {
        const catalogSaved = localStorage.getItem(catKey);
        if (catalogSaved) {
          const catalog = JSON.parse(catalogSaved);
          if (Array.isArray(catalog)) {
            const matchedProd = catalog.find(p => {
              const pId = String(p.id || p._id || p.productId || '');
              const pName = String(p.name || '').replace(/\s*\([^)]*\)/g, '').trim().toLowerCase();
              return (prodIdStr && pId === prodIdStr) || (cleanItemName && pName && (pName === cleanItemName || cleanItemName.includes(pName) || pName.includes(cleanItemName)));
            });
            if (matchedProd) {
              const pSeller = matchedProd.sellerStoreName || matchedProd.storeName || matchedProd.tradeName || matchedProd.businessName || matchedProd.legalBusinessName || matchedProd.sellerName || matchedProd.vendor || (typeof matchedProd.seller === 'string' ? matchedProd.seller : (matchedProd.seller?.storeName || matchedProd.seller?.name)) || matchedProd.sellerDetails?.storeName;
              if (pSeller && !isPlaceholderName(pSeller)) return pSeller;
            }
          }
        }
      } catch (e) {}
    }

    // 5. Seller directory lookup by seller ID or phone
    const sellerIdStr = String(item?.sellerId || order?.sellerId || '');
    if (sellerIdStr && sellerIdStr !== '[object Object]') {
      const sellerKeys = ['admin_sellers', 'bv_sync_sellers', 'bv_registered_users'];
      for (const selKey of sellerKeys) {
        try {
          const sellersSaved = localStorage.getItem(selKey);
          if (sellersSaved) {
            const sellersList = JSON.parse(sellersSaved);
            if (Array.isArray(sellersList)) {
              const matchedSeller = sellersList.find(s => {
                const sId = String(s.id || s._id || s.sellerId || s.phone || '');
                return sId === sellerIdStr || (sellerIdStr.length >= 8 && sId.endsWith(sellerIdStr.slice(-10)));
              });
              if (matchedSeller) {
                const sName = matchedSeller.storeName || matchedSeller.tradeName || matchedSeller.businessName || matchedSeller.legalBusinessName || matchedSeller.storeDetails?.storeName || matchedSeller.sellerName || matchedSeller.name || matchedSeller.legalName || matchedSeller.ownerFullName;
                if (sName && !isPlaceholderName(sName)) return sName;
              }
            }
          }
        } catch (e) {}
      }
    }

    // 6. Order level candidates
    const candidateOrderNames = [
      order?.sellerStoreName,
      order?.storeName,
      order?.sellerDetails?.storeName,
      order?.sellerDetails?.tradeName,
      order?.sellerDetails?.businessName,
      order?.sellerDetails?.legalBusinessName,
      order?.sellerDetails?.sellerName,
      order?.sellerId && typeof order.sellerId === 'object' ? (order.sellerId.storeName || order.sellerId.tradeName || order.sellerId.businessName || order.sellerId.name || order.sellerId.sellerName) : null,
      order?.sellerName,
      typeof order?.seller === 'string' ? order.seller : (order?.seller?.storeName || order?.seller?.name)
    ];

    for (const c of candidateOrderNames) {
      if (c && !isPlaceholderName(c)) return c;
    }

    // 7. Active logged-in seller store name
    const activeStore = getActiveSellerStoreName();
    if (activeStore) return activeStore;

    return 'Partner Store';
  };

  const getItemSellerInfo = (item) => {
    const rawId = item?.sellerId && typeof item.sellerId === 'object'
      ? (item.sellerId._id || item.sellerId.id || '')
      : (item?.sellerId || item?.sellerDetails?.sellerId || '');
    const sellerId = String(rawId && rawId !== '[object Object]' ? rawId : '').trim();
    const storeName = getItemSellerName(item);
    const key = sellerId || storeName.trim().toLowerCase();
    return { key, sellerId, storeName };
  };

  const allOrderItems = Array.isArray(order.items) && order.items.length > 0
    ? order.items
    : (Array.isArray(order.requirements) && order.requirements.length > 0
        ? order.requirements.map((req, rIdx) => ({
            id: req._id || rIdx + 1,
            name: req.itemName || req.name || 'School Demand Item',
            image: (req.sampleImages && req.sampleImages[0]) || order.image || FALLBACK_IMAGE,
            quantity: Number(req.quantity) || 1,
            price: Number(req.sellerPricePerUnit || req.sellerPrice || req.budgetPerUnit || req.unitPrice || (order.targetBudgetPerKit && req.quantity ? Math.round(Number(order.targetBudgetPerKit) / Number(req.quantity)) : 0) || 480),
            category: req.category || 'School Supply'
          }))
        : [
            {
              id: 1,
              name: order.itemName || order.product || (order.requirements && order.requirements[0]?.itemName) || 'School Supply Item',
              image: order.image || (Array.isArray(order.images) && order.images[0]) || FALLBACK_IMAGE,
              quantity: order.quantity || order.totalQuantity || 1,
              price: order.total || order.amount || 499,
              category: 'School Uniform'
            }
          ]
    );

  // Group items by seller for combined / multi-seller orders
  const sellerGroups = useMemo(() => {
    const map = new Map();

    allOrderItems.forEach((item, index) => {
      const { key, sellerId, storeName } = getItemSellerInfo(item);
      const itStatus = String(item.status || order.status || order.overallStatus || '').toLowerCase().trim().replace(/[\s-]+/g, '_');
      const isConfirmed = ![
        'pending', 'placed', 'unconfirmed', 'draft', ''
      ].includes(itStatus);

      if (!map.has(key)) {
        map.set(key, {
          key,
          sellerId,
          storeName,
          items: [],
          hasConfirmedItems: false,
          hasPendingItems: false,
          sellerDetails: item.sellerDetails || (typeof item.sellerId === 'object' ? item.sellerId : null),
          itemIndices: []
        });
      }

      const grp = map.get(key);
      grp.items.push(item);
      grp.itemIndices.push(index);
      if (isConfirmed) {
        grp.hasConfirmedItems = true;
      } else {
        grp.hasPendingItems = true;
      }
      if (!grp.sellerDetails && (item.sellerDetails || (typeof item.sellerId === 'object' ? item.sellerId : null))) {
        grp.sellerDetails = item.sellerDetails || item.sellerId;
      }
      if (isPlaceholderName(grp.storeName) && !isPlaceholderName(storeName)) {
        grp.storeName = storeName;
      }
    });

    return Array.from(map.values());
  }, [order, allOrderItems]);

  // In Seller Panel, auto-match logged-in seller, otherwise select confirmed seller
  const activeSellerGroup = useMemo(() => {
    if (sellerGroups.length === 0) return null;

    if (selectedSellerKey) {
      const found = sellerGroups.find(g => g.key === selectedSellerKey);
      if (found) return found;
    }

    const myIds = new Set();
    const myNames = new Set();
    if (activeSellerUser) {
      if (activeSellerUser._id) myIds.add(String(activeSellerUser._id).toLowerCase());
      if (activeSellerUser.id) myIds.add(String(activeSellerUser.id).toLowerCase());
      if (activeSellerUser.sellerId) myIds.add(String(activeSellerUser.sellerId).toLowerCase());
      if (activeSellerUser.storeName) myNames.add(activeSellerUser.storeName.trim().toLowerCase());
      if (activeSellerUser.tradeName) myNames.add(activeSellerUser.tradeName.trim().toLowerCase());
      if (activeSellerUser.businessName) myNames.add(activeSellerUser.businessName.trim().toLowerCase());
    }

    if (myIds.size > 0 || myNames.size > 0) {
      const myGrp = sellerGroups.find(g => {
        const gid = String(g.sellerId || '').toLowerCase();
        const gname = String(g.storeName || '').trim().toLowerCase();
        if (gid && myIds.has(gid)) return true;
        if (gname && myNames.has(gname)) return true;
        return false;
      });
      if (myGrp) return myGrp;
    }

    const confirmedGrp = sellerGroups.find(g => g.hasConfirmedItems);
    return confirmedGrp || sellerGroups[0];
  }, [sellerGroups, selectedSellerKey, activeSellerUser]);

  useEffect(() => {
    if (activeSellerGroup && (!selectedSellerKey || !sellerGroups.some(g => g.key === selectedSellerKey))) {
      setSelectedSellerKey(activeSellerGroup.key);
    }
  }, [activeSellerGroup, sellerGroups]);

  const items = activeSellerGroup ? activeSellerGroup.items : allOrderItems;

  const activeSellerStatusRaw = (
    items.find(i => {
      const s = String(i.status || '').toLowerCase().trim();
      return s && !['pending', 'placed', 'unconfirmed', 'draft', ''].includes(s);
    })?.status ||
    items[0]?.status ||
    order.overallStatus ||
    order.status ||
    'Confirmed'
  );
  const activeSellerStatusLabel = String(activeSellerStatusRaw)
    .replace(/_/g, ' ')
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');

  const rawStatus = String(order.overallStatus || order.status || '').toLowerCase().trim();
  const normStatus = rawStatus.replace(/[\s-]+/g, '_');
  const isCancelled = normStatus === 'cancelled' || normStatus === 'canceled' || Boolean(order.isCancelled) || Boolean(order.cancelledAt);

  const isBulkOrder = Boolean(
    order.isBulkOrder ||
    order.isSchoolOrder ||
    Array.isArray(order.requirements) ||
    order.bulkOrderId ||
    order.schoolName ||
    String(order.id || order._id || '').startsWith('BULK-')
  );

  const isPendingUnconfirmed = !isBulkOrder && (!normStatus || ['pending', 'placed', 'unconfirmed', 'created', 'draft'].includes(normStatus));

  const isConfirmedAndOnward = [
    'assigned',
    'accepted',
    'confirmed',
    'quote_accepted',
    'buyer_accepted',
    'seller_accepted',
    'seller_accepted_counter',
    'processing',
    'production',
    'in_production',
    'packed',
    'packed_and_sealed',
    'shipped',
    'dispatched',
    'in_transit',
    'out_for_delivery',
    'delivered',
    'completed',
    'fulfilled',
    'delivered_to_customer',
    'order_delivered',
    'return_requested',
    'returned',
    'exchange_requested',
    'exchanged',
    'return_approved',
    'exchange_approved',
    'refund_requested',
    'refunded',
    'cancelled',
    'canceled'
  ].includes(normStatus) || (isBulkOrder && normStatus.length > 0) || (!isPendingUnconfirmed && normStatus.length > 0);

  const isSellerConfirmed = isBulkOrder
    ? (isConfirmedAndOnward || (normStatus && !isPendingUnconfirmed))
    : (isCancelled || (activeSellerGroup ? (activeSellerGroup.hasConfirmedItems && !activeSellerGroup.hasPendingItems) : (!items.some(it => ['pending', 'placed', 'unconfirmed', 'draft'].includes(String(it.status || '').toLowerCase().trim().replace(/[\s-]+/g, '_'))) && isConfirmedAndOnward)));

  const confirmed = isSellerConfirmed;

  const shippingAddr = typeof order.shippingAddress === 'object' && order.shippingAddress !== null
    ? order.shippingAddress
    : { street: order.address || order.shippingAddress || order.deliveryLocation || order.location || 'Institutional Delivery Address' };

  const rawAddressStr = typeof order.shippingAddress === 'string'
    ? order.shippingAddress
    : [
        shippingAddr.street || shippingAddr.addressLine || shippingAddr.address,
        shippingAddr.city,
        shippingAddr.state,
        shippingAddr.pincode ? `- ${shippingAddr.pincode}` : ''
      ].filter(Boolean).join(', ') || order.deliveryLocation || order.location || 'Lucknow, Uttar Pradesh';

  const formattedAddressStr = stripCustomerPhoneFromAddress(rawAddressStr);

  const allOrderItemsSum = allOrderItems.reduce((acc, it) => acc + (Number(it.originalPrice ?? it.price ?? it.finalPrice ?? 0) * Number(it.quantity || 1)), 0);
  const itemsSum = items.reduce((acc, it) => acc + (Number(it.originalPrice ?? it.price ?? it.finalPrice ?? 0) * Number(it.quantity || 1)), 0);

  const orderShippingCost = Number(order.shippingCost ?? order.shippingFee ?? 0);
  const orderDiscount = Number(order.discount ?? order.discountAmount ?? order.couponDiscount ?? 0);
  const orderPointsDiscount = Number(order.pointsDiscount || 0);
  const orderTotalDiscounts = orderDiscount + orderPointsDiscount;

  const allOrderItemsList = order.items || [];
  const anyOrderItemsHaveDiscount = allOrderItemsList.some(
    (it) => (it.offerDiscount !== undefined && it.offerDiscount !== null && !isNaN(Number(it.offerDiscount)) && Number(it.offerDiscount) > 0) ||
            (it.discount !== undefined && it.discount !== null && !isNaN(Number(it.discount)) && Number(it.discount) > 0) ||
            Boolean(it.couponCode) ||
            (Number(it.finalPrice) > 0 && Number(it.price) > Number(it.finalPrice))
  );
  const currentItemsHaveDiscount = items.some(
    (it) => (it.offerDiscount !== undefined && it.offerDiscount !== null && !isNaN(Number(it.offerDiscount)) && Number(it.offerDiscount) > 0) ||
            (it.discount !== undefined && it.discount !== null && !isNaN(Number(it.discount)) && Number(it.discount) > 0) ||
            Boolean(it.couponCode) ||
            (Number(it.finalPrice) > 0 && Number(it.price) > Number(it.finalPrice))
  );

  const isProductSpecificCoupon = Boolean(
    order.couponDetails?.applicableScope === 'specific_product' ||
    order.couponDetails?.applicableScope === 'specific_kit' ||
    order.couponDetails?.specificProductId ||
    order.couponDetails?.specificKitId ||
    order.couponDetails?.specificProductName ||
    order.couponDetails?.specificKitTitle ||
    (Array.isArray(order.couponDetails?.applicableProducts) && order.couponDetails.applicableProducts.length > 0) ||
    (Array.isArray(order.couponDetails?.applicableKits) && order.couponDetails.applicableKits.length > 0)
  );

  const eligibleProductIds = new Set(
    (order.couponDetails?.applicableProducts || [])
      .concat(order.couponDetails?.specificProductId ? [order.couponDetails.specificProductId] : [])
      .concat(order.couponDetails?.applicableKits || [])
      .concat(order.couponDetails?.specificKitId ? [order.couponDetails.specificKitId] : [])
      .filter(Boolean)
      .map(id => String(id).toLowerCase().trim())
  );
  const specProdName = String(order.couponDetails?.specificProductName || '').toLowerCase().trim();
  const specKitTitle = String(order.couponDetails?.specificKitTitle || '').toLowerCase().trim();

  const isItemEligibleForCoupon = (it) => {
    if (!isProductSpecificCoupon) return true;
    const itCandIds = [it.productId, it.id, it._id, it.customId].filter(Boolean).map(id => String(id).toLowerCase().trim());
    const isIdMatch = itCandIds.some(id => eligibleProductIds.has(id));
    const itNameLower = String(it.name || '').toLowerCase();
    const isNameMatch = Boolean((specProdName && itNameLower.includes(specProdName)) || (specKitTitle && itNameLower.includes(specKitTitle)));
    return isIdMatch || isNameMatch;
  };

  const currentSellerHasEligibleProducts = items.some(isItemEligibleForCoupon);

  const sellerShare = allOrderItemsSum > 0 ? (itemsSum / allOrderItemsSum) : 1;
  const shippingCost = sellerGroups.length > 1
    ? (orderShippingCost > 0 ? Math.round(orderShippingCost * sellerShare * 100) / 100 : 0)
    : orderShippingCost;

  const sellerItemsDiscountSum = items.reduce(
    (sum, it) => sum + (Number(it.offerDiscount || it.discount) || (Number(it.finalPrice) > 0 && Number(it.price) > Number(it.finalPrice) ? Math.round((Number(it.price) - Number(it.finalPrice)) * Number(it.quantity || 1) * 100) / 100 : 0)),
    0
  );

  const totalDiscounts = (anyOrderItemsHaveDiscount || currentItemsHaveDiscount)
    ? sellerItemsDiscountSum
    : (!currentSellerHasEligibleProducts
        ? 0
        : (sellerGroups.length > 1
            ? (orderTotalDiscounts > 0 ? Math.round(orderTotalDiscounts * sellerShare * 100) / 100 : 0)
            : orderTotalDiscounts));

  const rawSubtotal = Number(order.subtotal || 0);
  const isItemPriceAlreadyDiscounted = !currentItemsHaveDiscount && rawSubtotal > 0 && totalDiscounts > 0 && Math.abs((itemsSum + totalDiscounts) - rawSubtotal) < 1;

  const subtotal = itemsSum;
  const rawCodFee = Number(order.codFee ?? order.appliedCodFee ?? order.codCharges ?? order.settlement?.codChargeAmount ?? 0);
  const isCodOrder = String(order.paymentMethod || '').toUpperCase().includes('COD') || 
                     String(order.paymentMethod || '').toUpperCase().includes('CASH') || 
                     rawCodFee > 0;
  const effectiveCodFeeInTotal = (isCodOrder && rawCodFee > 0) ? rawCodFee : 0;
  const grandTotal = Math.max(0, Math.round((subtotal + shippingCost - totalDiscounts + effectiveCodFeeInTotal) * 100) / 100);
  const discountRatio = (!currentItemsHaveDiscount && subtotal > 0 && totalDiscounts > 0)
    ? Math.min(1, totalDiscounts / subtotal)
    : 0;

  let totalTaxableValue = 0;
  let totalTaxAmount = 0;
  let runningProratedDiscount = 0;

  const itemBreakdowns = items.map((item, idx) => {
    const isUnstitched = Boolean(
      item.isMeterBased ||
      item.unit === 'meter' ||
      item.unit === 'm' ||
      item.productId?.isMeterBased ||
      item.productId?.unit === 'meter' ||
      item.productId?.unit === 'm' ||
      String(item.category || '').toLowerCase().includes('unstitched') ||
      String(item.category || '').toLowerCase().includes('unstiched') ||
      String(item.subCategory || '').toLowerCase().includes('unstitched') ||
      String(item.subCategory || '').toLowerCase().includes('unstiched') ||
      String(item.name || '').toLowerCase().includes('unstitched') ||
      String(item.name || '').toLowerCase().includes('unstiched') ||
      String(item.productName || '').toLowerCase().includes('unstitched') ||
      String(item.productName || '').toLowerCase().includes('unstiched') ||
      (Number(item.quantity || 1) % 1 !== 0)
    );
    const rawQty = Number(item.quantity || 1);
    const displayQty = isUnstitched ? rawQty.toFixed(2) : (rawQty % 1 === 0 ? rawQty : rawQty.toFixed(2));
    const qty = rawQty;

    let unitPrice = Number(item.originalPrice ?? item.price ?? item.finalPrice ?? 0);
    if (isItemPriceAlreadyDiscounted && totalDiscounts > 0 && subtotal > 0) {
      const proportion = (unitPrice * qty) / itemsSum;
      const allocDiscount = totalDiscounts * proportion;
      unitPrice = qty > 0 ? Math.round(((unitPrice * qty + allocDiscount) / qty) * 100) / 100 : unitPrice;
    }

    const grossPrice = Math.round((unitPrice * qty) * 100) / 100;
    const rate = getProductGstRate(item);
    const isInclusive = item.isGstInclusive !== false && order.isGstInclusive !== false;

    let itemDiscount = 0;
    if (currentItemsHaveDiscount) {
      itemDiscount = Number(item.offerDiscount || item.discount || 0);
      if (itemDiscount === 0 && Number(item.finalPrice) > 0 && Number(item.price) > Number(item.finalPrice)) {
        itemDiscount = Math.round((Number(item.price) - Number(item.finalPrice)) * qty * 100) / 100;
      }
    } else if (discountRatio > 0 && isItemEligibleForCoupon(item)) {
      const isLast = idx === items.length - 1;
      itemDiscount = isLast
        ? Math.max(0, Math.round((totalDiscounts - runningProratedDiscount) * 100) / 100)
        : Math.min(grossPrice, Math.round((grossPrice * discountRatio) * 100) / 100);
      runningProratedDiscount += itemDiscount;
    }
    itemDiscount = Math.min(grossPrice, Math.max(0, itemDiscount));
    const netItemPayable = Math.max(0, Math.round((grossPrice - itemDiscount) * 100) / 100);

    let taxableVal = netItemPayable;
    let taxAmt = 0;

    if (rate > 0) {
      if (isInclusive) {
        taxableVal = Math.round((netItemPayable / (1 + rate / 100)) * 100) / 100;
        taxAmt = Math.round((netItemPayable - taxableVal) * 100) / 100;
      } else {
        taxableVal = netItemPayable;
        taxAmt = Math.round(((netItemPayable * rate) / 100) * 100) / 100;
      }
    }

    totalTaxableValue += taxableVal;
    totalTaxAmount += taxAmt;

    return {
      ...item,
      qty: displayQty,
      rawQty,
      unitPrice,
      grossPrice,
      itemDiscount,
      netItemPayable,
      rate,
      taxableVal,
      taxAmt
    };
  });

  // Dynamic Product GST Rate for Delivery (Composite Supply under Section 8 of CGST Act: Principal supply rate governs freight/delivery)
  // Delivery charge GST strictly matches the product's GST rate (e.g., 5% product -> 5% delivery, 0% product -> 0% delivery)
  const defaultProductGstRate = (() => {
    const itemRates = itemBreakdowns.map(it => Number(it.rate)).filter(r => !isNaN(r));
    if (itemRates.length > 0) {
      return Math.max(...itemRates);
    }
    if (order.shippingGstRate !== undefined && order.shippingGstRate !== null && !isNaN(Number(order.shippingGstRate))) {
      return Number(order.shippingGstRate);
    }
    return 5;
  })();

  const shippingGstRate = defaultProductGstRate;

  // Include shipping GST into total taxable value & total tax amount for unified grand total breakdown
  let shippingTaxable = 0;
  let shippingTax = 0;
  if (shippingCost > 0) {
    if (shippingGstRate > 0) {
      shippingTaxable = Math.round((shippingCost / (1 + shippingGstRate / 100)) * 100) / 100;
      shippingTax = Math.round((shippingCost - shippingTaxable) * 100) / 100;
    } else {
      shippingTaxable = shippingCost;
      shippingTax = 0;
    }
    totalTaxableValue += shippingTaxable;
    totalTaxAmount += shippingTax;
  }

  if (effectiveCodFeeInTotal > 0) {
    totalTaxableValue += effectiveCodFeeInTotal;
  }

  totalTaxableValue = Math.round(totalTaxableValue * 100) / 100;
  totalTaxAmount = Math.round(totalTaxAmount * 100) / 100;
  if (Math.abs((totalTaxableValue + totalTaxAmount) - grandTotal) > 0 && Math.abs((totalTaxableValue + totalTaxAmount) - grandTotal) <= 0.05) {
    totalTaxableValue = Math.round((grandTotal - totalTaxAmount) * 100) / 100;
  }

  const taxAmount = totalTaxAmount;
  const taxableValue = totalTaxableValue;

  const resolveSeller = () => {
    const primaryName = (activeSellerGroup && !isPlaceholderName(activeSellerGroup.storeName))
      ? activeSellerGroup.storeName
      : getItemSellerName(items[0]);
    
    let activeSettings = {};
    try {
      activeSettings = typeof readActiveSellerSettings === 'function' ? readActiveSellerSettings() : {};
    } catch (e) {}

    // Lookup GSTIN mapping for known stores or item details
    const cleanLowerName = String(primaryName).toLowerCase().trim();
    let mappedGst = null;
    let mappedCity = null;
    let mappedState = null;
    if (cleanLowerName.includes('national school') || cleanLowerName.includes('pustak bhandar')) {
      mappedGst = '09BLMPK2840L2ZN';
      mappedCity = 'Behat';
    } else if (cleanLowerName.includes('national cloth')) {
      mappedGst = '09APOPN2691D1ZK';
      mappedCity = 'Behat';
      mappedState = 'Uttar Pradesh';
    } else if (cleanLowerName.includes('shyam')) {
      mappedGst = 'RGCWRCGRGCRGCC';
      mappedCity = 'LUCKNOW';
      mappedState = 'Uttar Pradesh';
    }

    const primaryGst = mappedGst || [
      activeSellerGroup?.sellerDetails?.gstNumber,
      activeSellerGroup?.sellerDetails?.gstin,
      activeSellerGroup?.sellerDetails?.gst,
      items[0]?.sellerDetails?.gstNumber,
      items[0]?.gstNumber,
      items[0]?.sellerGst,
      activeSellerUser?.gstin,
      activeSellerUser?.gstNumber,
      activeSettings?.gstin,
      order.sellerDetails?.gstNumber,
      order.sellerDetails?.gst,
      order.sellerGst,
      order.gstNumber
    ].find(g => g && g !== '09AAACB1234F1Z9' && g !== 'Exempt / N/A' && String(g).trim() !== '') || 'Exempt / N/A';

    const primaryCity = mappedCity || [
      activeSellerGroup?.sellerDetails?.city,
      items[0]?.sellerDetails?.city,
      items[0]?.sellerCity,
      activeSellerUser?.city,
      activeSettings?.city,
      order.sellerDetails?.city,
      order.sellerCity
    ].find(Boolean) || 'Lucknow, Uttar Pradesh';

    const primaryState = mappedState || [
      activeSellerGroup?.sellerDetails?.state,
      items[0]?.sellerDetails?.state,
      items[0]?.sellerState,
      activeSellerUser?.state,
      activeSettings?.state,
      order.sellerDetails?.state,
      order.sellerState
    ].find(Boolean) || 'Uttar Pradesh';
    
    return {
      storeName: primaryName || 'Partner Store',
      gstNumber: primaryGst,
      city: primaryCity,
      state: primaryState
    };
  };

  const resolvedSeller = resolveSeller();

  const resolvedInvoiceNumber = useMemo(() => {
    return getSellerInvoiceNumber(order, resolvedSeller, contextOrders);
  }, [order, resolvedSeller, contextOrders]);

  // Dynamic Intra-State vs Inter-State detection
  const sellerStateInfo = parseStateInfo(resolvedSeller, `${resolvedSeller.city} ${resolvedSeller.state}`);
  const customerStateInfo = parseStateInfo(shippingAddr, `${formattedAddressStr} ${shippingAddr?.state || ''}`);
  const isIntraState = !sellerStateInfo.key || !customerStateInfo.key || (sellerStateInfo.key === customerStateInfo.key);

  // Dynamic CGST + SGST vs IGST Split on total order tax
  const cgstAmount = isIntraState ? Math.round((taxAmount / 2) * 100) / 100 : 0;
  const sgstAmount = isIntraState ? Math.round((taxAmount - cgstAmount) * 100) / 100 : 0;
  const igstAmount = !isIntraState ? taxAmount : 0;

  // Shipping tax split
  const shippingCgst = shippingTax > 0 && isIntraState ? Math.round((shippingTax / 2) * 100) / 100 : 0;
  const shippingSgst = shippingTax > 0 && isIntraState ? Math.round((shippingTax - shippingCgst) * 100) / 100 : 0;
  const shippingIgst = shippingTax > 0 && !isIntraState ? shippingTax : 0;

  // Helper to resolve dynamic seller commission rate
  const getSellerCommissionRate = () => {
    const firstItem = items[0] || {};
    const targetSellerId = String(
      firstItem?.sellerId?._id ||
      firstItem?.sellerId ||
      firstItem?.sellerDetails?.sellerId ||
      order.sellerId?._id ||
      order.sellerId ||
      order.sellerDetails?.sellerId ||
      ''
    ).trim();

    const targetSellerName = String(
      getItemSellerName(firstItem) ||
      resolvedSeller?.storeName ||
      order.sellerStoreName ||
      order.storeName ||
      order.sellerName ||
      firstItem.sellerStoreName ||
      firstItem.storeName ||
      firstItem.sellerName ||
      ''
    ).toLowerCase().trim();

    const cleanTargetName = targetSellerName.replace(/[^a-z0-9]/g, '');

    const matchSeller = (s) => {
      if (!s) return false;
      const sId = String(s.id || s._id || s.sellerId || s.userId || '').trim();
      const sName = String(
        s.storeName ||
        s.sellerName ||
        s.name ||
        s.tradeName ||
        s.businessName ||
        s.legalBusinessName ||
        s.storeDetails?.storeName ||
        ''
      ).toLowerCase().trim();
      const cleanStoreName = sName.replace(/[^a-z0-9]/g, '');

      if (targetSellerId && sId && (sId === targetSellerId || (targetSellerId.length >= 8 && sId.endsWith(targetSellerId.slice(-10))) || (sId.length >= 8 && targetSellerId.endsWith(sId.slice(-10))))) {
        return true;
      }

      if (cleanTargetName && cleanStoreName) {
        if (cleanTargetName === cleanStoreName || cleanTargetName.includes(cleanStoreName) || cleanStoreName.includes(cleanTargetName)) {
          return true;
        }
      }

      return false;
    };

    // 1. FIRST PRIORITY: Active seller profile in Seller Panel
    try {
      const activeSellerKeys = ['seller_user_profile', 'bv_seller_user', 'bv_seller_profile', 'bv_seller_reg_data'];
      for (const k of activeSellerKeys) {
        const raw = localStorage.getItem(k);
        if (raw) {
          const s = JSON.parse(raw);
          if (matchSeller(s) || !cleanTargetName) {
            const rate = s.commissionRate ?? s.commissionPercentage;
            if (rate !== undefined && rate !== null && !isNaN(Number(rate))) {
              return Number(rate);
            }
          }
        }
      }
    } catch (e) {}

    // 2. Admin / Synced Sellers Registry
    try {
      const storageKeys = ['admin_sellers', 'bv_sync_sellers', 'bv_registered_users'];
      for (const k of storageKeys) {
        const raw = localStorage.getItem(k);
        if (raw) {
          const sellersList = JSON.parse(raw);
          if (Array.isArray(sellersList)) {
            const matched = sellersList.find(matchSeller);
            if (matched) {
              const rate = matched.commissionRate ?? matched.commissionPercentage ?? matched.commission;
              if (rate !== undefined && rate !== null && !isNaN(Number(rate))) {
                return Number(rate);
              }
            }
          }
        }
      }
    } catch (e) {}

    // 3. Embedded seller details on order
    const embeddedCandidates = [
      order.sellerDetails?.commissionRate,
      order.sellerDetails?.commissionPercentage,
      firstItem?.sellerDetails?.commissionRate,
      firstItem?.sellerDetails?.commissionPercentage,
      firstItem?.sellerId?.commissionRate,
      firstItem?.sellerId?.commissionPercentage
    ];
    for (const ec of embeddedCandidates) {
      if (ec !== undefined && ec !== null && !isNaN(Number(ec))) {
        return Number(ec);
      }
    }

    // 4. Order-level or Item-level saved commission
    if (order.commissionRate !== undefined && order.commissionRate !== null && !isNaN(Number(order.commissionRate))) {
      return Number(order.commissionRate);
    }
    if (order.sellerCommissionRate !== undefined && order.sellerCommissionRate !== null && !isNaN(Number(order.sellerCommissionRate))) {
      return Number(order.sellerCommissionRate);
    }
    if (order.commissionPercentage !== undefined && order.commissionPercentage !== null && !isNaN(Number(order.commissionPercentage))) {
      return Number(order.commissionPercentage);
    }
    if (firstItem?.commissionRate !== undefined && firstItem.commissionRate !== null && !isNaN(Number(firstItem.commissionRate))) {
      return Number(firstItem.commissionRate);
    }
    if (firstItem?.sellerCommissionRate !== undefined && firstItem.sellerCommissionRate !== null && !isNaN(Number(firstItem.sellerCommissionRate))) {
      return Number(firstItem.sellerCommissionRate);
    }
    if (firstItem?.commissionPercentage !== undefined && firstItem.commissionPercentage !== null && !isNaN(Number(firstItem.commissionPercentage))) {
      return Number(firstItem.commissionPercentage);
    }

    // 5. Platform Global Settings
    try {
      const savedSettings = localStorage.getItem('admin_settings') || localStorage.getItem('platform_settings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        const setRate = settings?.defaultCommissionRate ?? settings?.commissionRate;
        if (setRate !== undefined && !isNaN(Number(setRate))) {
          return Number(setRate);
        }
      }
    } catch (e) {}

    return 5;
  };

  const rawPayment = String(order.paymentMethod || '').toUpperCase();
  const isCod = rawPayment.includes('COD') ||
                rawPayment.includes('CASH') ||
                rawPayment.includes('DELIVERY');

  const rawMode = String(order.deliveryMode || order.deliveryType || '').toLowerCase();
  const courierPartnerName = String(order.courierName || order.carrier || order.thirdPartyDetails?.courierName || items.find(it => it.thirdPartyDetails?.courierName)?.thirdPartyDetails?.courierName || '').trim();
  const hasValidCourier = Boolean(courierPartnerName && courierPartnerName !== 'N/A' && courierPartnerName !== 'null');
  const hasSelfDeliveryDetails = Boolean(
    order.selfDeliveryDetails?.deliveryPartnerToken || 
    order.selfDeliveryDetails?.deliveryPersonName ||
    order.deliveryOtp ||
    items.some(it => it.selfDeliveryDetails?.deliveryPartnerToken || it.selfDeliveryDetails?.deliveryPersonName || it.deliveryOtp)
  );

  const isExplicitSelf = rawMode.includes('self') || 
                         order.settlementRule === 'COD_SELF_DELIVERY' || 
                         items.some(it => it.settlementRule === 'COD_SELF_DELIVERY') || 
                         Boolean((order.deliveryOtp || hasSelfDeliveryDetails) && !hasValidCourier);

  const isExplicitThirdParty = order.settlementRule === 'COD_THIRD_PARTY_DELIVERY' ||
                               order.settlementRule === 'ONLINE_THIRD_PARTY_DELIVERY' ||
                               items.some(it => it.settlementRule === 'COD_THIRD_PARTY_DELIVERY' || it.settlementRule === 'ONLINE_THIRD_PARTY_DELIVERY') ||
                               rawMode.includes('third') || 
                               rawMode.includes('courier') || 
                               hasValidCourier ||
                               items.some(it => String(it.deliveryType || '').toLowerCase().includes('third') || Boolean(it.thirdPartyDetails?.courierName));

  // Dynamic Third-Party vs Self-Delivery Resolution
  const isThirdParty = isExplicitThirdParty || !isExplicitSelf;
  const isSelf = !isThirdParty;

  // Active Status & Reversal Detection
  const orderOverallStatus = String(order.overallStatus || order.status || '').toLowerCase().trim();
  const returnStatus = String(order.returnRequest?.status || '').toLowerCase().trim();
  const isOrderCancelled = orderOverallStatus.includes('cancel') || Boolean(order.cancelledAt);
  const isOrderRefunded = orderOverallStatus.includes('refund') || returnStatus.includes('refund') || order.settlementStatus === 'refunded';
  const isSettlementReversed = isOrderCancelled || isOrderRefunded;

  // Active Rule Detection across 4 core scenarios
  const isRule4CodCourier = isCod && isThirdParty;
  const isRule3CodSelf = isCod && !isThirdParty;
  const isRule2OnlineCourier = !isCod && isThirdParty;
  const isRule1OnlineSelf = !isCod && !isThirdParty;

  // Dynamic Exemption for specific GSTIN (e.g. 09BLMPK2840L2ZN / National School Dress)
  const candidateGstList = [
    resolvedSeller?.gstNumber,
    resolvedSeller?.gstin,
    order.sellerDetails?.gstNumber,
    order.sellerDetails?.gstin,
    order.sellerGstNumber,
    activeSellerGroup?.gstNumber,
    activeSellerGroup?.sellerDetails?.gstNumber,
    ...(items || []).map(it => it.sellerDetails?.gstNumber || it.sellerId?.gstNumber || it.sellerGstNumber)
  ].filter(Boolean).map(g => String(g).trim().toUpperCase().replace(/[^A-Z0-9]/g, ''));

  const candidateStoreNames = [
    resolvedSeller?.storeName,
    activeSellerGroup?.storeName,
    order.sellerStoreName,
    order.storeName,
    order.sellerDetails?.storeName,
    order.sellerDetails?.name,
    ...(items || []).map(it => it.sellerStoreName || it.storeName || it.sellerDetails?.storeName)
  ].filter(Boolean).map(s => String(s).toLowerCase().replace(/[^a-z0-9]/g, ''));

  const candidatePhoneList = [
    resolvedSeller?.phone,
    order.sellerPhone,
    order.sellerDetails?.phone,
    ...(items || []).map(it => it.sellerPhone || it.sellerDetails?.phone)
  ].filter(Boolean).map(p => String(p).replace(/\D/g, ''));

  const isExemptedSeller = candidateGstList.some(g => g.includes('09BLMPK2840L2ZN')) ||
    candidateStoreNames.some(s => s.includes('nationalschooldress') || s.includes('pustakbhandar') || s.includes('nationalschool') || s.includes('national')) ||
    candidatePhoneList.some(p => p.includes('9027237697')) ||
    String(resolvedSeller?.storeName || '').toLowerCase().includes('national') ||
    String(order.sellerStoreName || order.storeName || '').toLowerCase().includes('national') ||
    (items || []).some(it => String(it.sellerStoreName || it.storeName || '').toLowerCase().includes('national'));

  // Dynamic Marketplace Commission Rate (Resolved per seller schedule)
  const marketplaceCommissionRate = isExemptedSeller ? 0 : getSellerCommissionRate();

  const settlementGross = Math.max(0, Math.round((subtotal - totalDiscounts) * 100) / 100);

  const marketplaceCommission = (isSettlementReversed || isExemptedSeller) ? 0 : Math.round((settlementGross * (marketplaceCommissionRate / 100)) * 100) / 100;
  const gstOnCommission = (isSettlementReversed || isExemptedSeller) ? 0 : Math.round((marketplaceCommission * 0.18) * 100) / 100;
  const tdsAmount = (isSettlementReversed || isExemptedSeller) ? 0 : Math.round((settlementGross * 0.001) * 100) / 100;

  // Statutory Tax:
  // Rule 3 (COD Self): GST TCS is 0% when portal does not collect customer payment
  // Rule 1, 2, 4: GST TCS is 0.5% (Sec 52 of CGST Act - strictly on Taxable Value)
  // For 0% GST / Books / Exempted GST: TCS = 0
  const isTaxFreeOrder = (items || []).every(it => {
    const r = Number(it.rate ?? it.gstPercent ?? it.gstPercentage ?? it.gstRate ?? it.gst ?? 5);
    const cat = String(it.category || '').toLowerCase();
    return r === 0 || cat.includes('book');
  });
  const itemsTaxableSum = (itemBreakdowns || []).reduce((sum, it) => sum + (Number(it.taxableVal) || 0), 0);
  const settlementTaxable = itemsTaxableSum > 0 ? itemsTaxableSum : settlementGross;
  const tcsRate = (isSettlementReversed || isExemptedSeller || isRule3CodSelf || isTaxFreeOrder) ? 0 : 0.5;
  const gstTcsAmount = (isSettlementReversed || isExemptedSeller || isRule3CodSelf || isTaxFreeOrder) ? 0 : Math.round(((settlementTaxable * tcsRate) / 100) * 100) / 100;

  // Delivery Charges + 18% GST (Rule 2 & Rule 4: Third-Party Delivery)
  const dynamicGlobalThreshold = Number(
    platformSettings?.freeShippingThreshold ?? 
    platformSettings?.minOrderFreeShipping ?? 
    platformSettings?.freeDeliveryThreshold ?? 
    (() => {
      try {
        const saved = JSON.parse(localStorage.getItem('bookvardi_platform_settings') || localStorage.getItem('admin_settings') || localStorage.getItem('platform_settings') || '{}');
        return saved?.freeShippingThreshold ?? saved?.minOrderFreeShipping ?? saved?.freeDeliveryThreshold;
      } catch (e) { return null; }
    })() ?? 
    1000
  );
  const rawOrderThreshold = Number(order.freeDeliveryThreshold ?? order.minOrderFreeShipping ?? order.freeShippingThreshold);
  const orderThreshold = (!isNaN(rawOrderThreshold) && rawOrderThreshold > 0 && rawOrderThreshold !== 401)
    ? rawOrderThreshold
    : dynamicGlobalThreshold;
  const isAboveThreshold = (settlementGross >= orderThreshold || grandTotal >= orderThreshold || Number(order.total || order.totalAmount || 0) >= orderThreshold || Number(order.subtotal || 0) >= orderThreshold);
  const isAbove400 = isAboveThreshold;
  const customerShippingPaid = Number(shippingCost || order.shippingFee || order.shippingCost || order.shippingAmount || 0);
  let delivBorneBy = order.deliveryChargeBorneBy;
  if (!delivBorneBy || customerShippingPaid > 0) {
    if (isAboveThreshold) delivBorneBy = 'admin';
    else if (customerShippingPaid > 0) delivBorneBy = 'customer';
    else if (order.isDeliveryBorneBySeller || order.deliveryBorneBy === 'seller') delivBorneBy = 'seller';
    else delivBorneBy = isThirdParty ? 'seller' : 'admin';
  }

  let deliveryChargeAmount = 0;
  let gstOnDeliveryAmount = 0;
  let totalDeliveryDeduction = 0;

  if (!isSettlementReversed && !isExemptedSeller && isThirdParty && delivBorneBy === 'seller' && !isAbove400) {
    const rawDeliveryFee = Number(order.deliveryCharge ?? order.shippingAmount ?? order.shippingCost ?? order.shippingFee ?? 49);
    // Delivery charges are GST INCLUSIVE (no extra GST added on top)
    totalDeliveryDeduction = Math.round(rawDeliveryFee * 100) / 100;
    deliveryChargeAmount = Math.round((totalDeliveryDeduction / (1 + shippingGstRate / 100)) * 100) / 100;
    gstOnDeliveryAmount = Math.round((totalDeliveryDeduction - deliveryChargeAmount) * 100) / 100;
  }

  // COD Charges & Allocation Policy
  const isCodExempted = Boolean(isExemptedSeller);
  let codChargeRetainedBy = isCod ? (isSelf ? 'seller' : 'portal') : 'none';
  let codChargeDeduction = 0;
  if (isCod && rawCodFee > 0) {
    if (isSelf) {
      codChargeRetainedBy = 'seller';
      codChargeDeduction = 0; // Seller retains full COD cash
    } else {
      codChargeRetainedBy = 'portal';
      codChargeDeduction = isCodExempted ? 0 : rawCodFee; // 09BLMPK2840L2ZN is exempt
    }
  }

  const statutoryDeductions = (isSettlementReversed || isExemptedSeller) ? 0 : Math.round((marketplaceCommission + gstOnCommission + tdsAmount + gstTcsAmount) * 100) / 100;
  const totalDeductions = (isSettlementReversed || isExemptedSeller) ? 0 : Math.round((statutoryDeductions + totalDeliveryDeduction + codChargeDeduction) * 100) / 100;

  // In Self Delivery, customer pays delivery fee directly to seller, retained 100% by seller
  const selfDeliveryFee = isSelf ? customerShippingPaid : 0;
  const sellerCashCollected = isRule3CodSelf ? Math.round((settlementGross + selfDeliveryFee) * 100) / 100 : settlementGross;
  const netSellerRetention = isExemptedSeller
    ? sellerCashCollected
    : Math.max(0, Math.round((sellerCashCollected - totalDeductions) * 100) / 100);

  // Final Settlement:
  const sellerSettlement = isSettlementReversed
    ? 0
    : (isExemptedSeller
      ? (isRule3CodSelf ? sellerCashCollected : settlementGross)
      : (isRule3CodSelf
        ? -totalDeductions
        : Math.max(0, Math.round((settlementGross - totalDeductions) * 100) / 100)));

  const sellerPayout = sellerSettlement;

  // Logistics tracking resolution: strictly visible when product is Out for Delivery & partner decided
  const logisticsStatus = String(order.overallStatus || order.status || '').toLowerCase().replace(/_/g, ' ');
  const isOut = logisticsStatus === 'out for delivery' || logisticsStatus === 'delivered';
  const hasPartner = isSelf || isThirdParty || Boolean(order.courierName || order.selfDeliveryDetails?.deliveryPersonName);
  const hasTracking = isOut && hasPartner && Boolean(order.trackingNumber || order.selfDeliveryDetails?.deliveryPartnerToken || order.thirdPartyDetails?.trackingNumber);

  const deliveryPartnerDisplay = isThirdParty
    ? (order.courierName || order.thirdPartyDetails?.courierName || '3rd-Party Logistics Carrier')
    : (order.selfDeliveryDetails?.deliveryPersonName ? `Direct Self-Delivery (Rider: ${order.selfDeliveryDetails.deliveryPersonName})` : 'Direct Self-Delivery (Store Fleet)');

  const trackingNumberDisplay = isThirdParty
    ? (order.trackingNumber || order.thirdPartyDetails?.trackingNumber || '')
    : (order.selfDeliveryDetails?.deliveryPartnerToken || order.trackingNumber || '');

  const trackingLinkDisplay = isThirdParty
    ? (order.trackingUrl || order.thirdPartyDetails?.trackingUrl || '')
    : (order.selfDeliveryDetails?.trackingUrl || order.trackingUrl || '');


  const companyName = platformSettings.companyName || 'BOOK VARDI';
  const companyAddress = platformSettings.companyAddress || 'Lucknow, Uttar Pradesh - 226001';
  const companyGstin = platformSettings.companyGstin || '09AAACB1234F1Z9';
  const companySupportEmail = platformSettings.customerCareEmail || platformSettings.supportEmail || 'support@bookvardi.in';

  const handleDownloadPDF = async () => {
    if (!confirmed) {
      alert('⚠️ Tax Invoice & Certificate is generated only when an order is confirmed strictly.');
      return;
    }
    try {
      setIsDownloading(true);
      const token = localStorage.getItem('bv_seller_jwt_token') || localStorage.getItem('token');
      const rawId = order.id || order.orderId || order._id || '';
      const orderIdentifier = String(rawId).replace(/^#/, '').trim();
      const sellerParam = activeSellerGroup?.sellerId || activeSellerGroup?.storeName || activeSellerUser?._id || activeSellerUser?.storeName || '';
      const queryStr = sellerParam ? `?sellerId=${encodeURIComponent(sellerParam)}&view=seller` : '?view=seller';
      const res = await fetch(`${SERVER_URL}/orders/${orderIdentifier}/invoice${queryStr}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const sellerSlug = (resolvedSeller?.storeName || 'Seller').replace(/[^a-zA-Z0-9_-]/g, '_');
        link.download = `Invoice_${orderIdentifier}_${sellerSlug}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => window.URL.revokeObjectURL(url), 1000);
        return;
      }
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.message || `Server returned status ${res.status}`);
    } catch (err) {
      console.error('Invoice PDF download error:', err);
      alert(`Could not download invoice PDF: ${err.message || 'Please try again later'}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    if (!confirmed) {
      alert('⚠️ Tax Invoice & Certificate is generated only when an order is confirmed strictly.');
      return;
    }

    const printContent = document.getElementById('printableTaxInvoiceArea');
    if (!printContent) {
      window.print();
      return;
    }

    const rawId = order.id || order.orderId || order._id || 'ORDER';
    const cleanId = resolvedInvoiceNumber || String(rawId).replace(/^#/, '').trim();
    const docTitle = `Tax_Invoice_${cleanId}`;

    const styleSheets = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map(el => el.outerHTML)
      .join('\n');

    // Open an isolated, clean print window containing ONLY the invoice
    const printWin = window.open('', '_blank', 'width=900,height=1100');
    if (printWin) {
      printWin.document.open();
      printWin.document.write(`<!DOCTYPE html>
<html>
  <head>
    <title>${docTitle}</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    ${styleSheets}
    <style>
      @page {
        size: A4 portrait;
        margin: 6mm 8mm;
      }
      * {
        box-sizing: border-box !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        color: #0f172a !important;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
      }
      #printableTaxInvoiceArea {
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 auto !important;
        padding: 4mm 6mm !important;
        background: #ffffff !important;
        display: block !important;
      }
      table {
        width: 100% !important;
        border-collapse: collapse !important;
      }
      .print\\:hidden, .no-print {
        display: none !important;
      }
    </style>
  </head>
  <body class="bg-white">
    <div id="printableTaxInvoiceArea">
      ${printContent.innerHTML}
    </div>
    <script>
      window.onload = function() {
        setTimeout(function() {
          window.focus();
          window.print();
          setTimeout(function() { window.close(); }, 750);
        }, 300);
      };
    </script>
  </body>
</html>`);
      printWin.document.close();
    } else {
      // Fallback: If popups blocked, native in-page window.print() uses @media print rules
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-transparent print:static print:inset-auto print:overflow-visible print:block">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:h-auto print:w-full print:shadow-none print:border-none print:rounded-none print:overflow-visible">
        
        {/* Top Control Bar */}
        <div className="bg-gray-950 text-white px-5 py-3 flex items-center justify-between shrink-0 print:hidden border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs border border-gray-700 shrink-0"
              title="Return to Orders"
            >
              <ArrowLeft size={14} />
              <span>Back to Orders</span>
            </button>
            <div className="w-8 h-8 rounded-lg bg-emerald-500 text-gray-950 flex items-center justify-center font-bold">
              <FileText size={16} />
            </div>
            <div>
              <h3 className="font-display font-bold text-xs sm:text-sm text-white leading-tight">
                Seller Tax Invoice & Order Certificate
              </h3>
              <p className="text-[10px] text-gray-400">Order ID: #{order.id || order._id}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {confirmed && (
              <>
                <button
                  onClick={handleDownloadPDF}
                  disabled={isDownloading}
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-gray-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                  title="Download Official GST Tax Invoice PDF"
                >
                  <Download size={13} className={isDownloading ? 'animate-bounce' : ''} />
                  {isDownloading ? 'Downloading...' : 'Download PDF'}
                </button>
                <button
                  onClick={handlePrint}
                  className="px-3 py-1.5 bg-brand-teal hover:bg-teal-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer size={13} /> Print Invoice
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Multi-Seller Tabs for Combined Orders */}
        {sellerGroups.length > 1 && (
          <div className="bg-gray-900 border-b border-gray-800 px-5 py-2.5 flex items-center justify-between gap-3 overflow-x-auto print:hidden">
            <div className="flex items-center gap-1.5 text-xs text-gray-400 shrink-0 font-medium">
              <Store size={14} className="text-teal-400" />
              <span>Seller Invoices:</span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto">
              {sellerGroups.map((grp) => {
                const isSelected = activeSellerGroup?.key === grp.key;
                return (
                  <button
                    key={grp.key}
                    type="button"
                    onClick={() => setSelectedSellerKey(grp.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                      isSelected
                        ? 'bg-brand-teal text-white shadow-xs'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    <span>{grp.storeName}</span>
                    {(() => {
                      const grpStatusRaw = (
                        grp.items.find(i => {
                          const s = String(i.status || '').toLowerCase().trim();
                          return s && !['pending', 'placed', 'unconfirmed', 'draft', ''].includes(s);
                        })?.status ||
                        grp.items[0]?.status ||
                        (grp.hasConfirmedItems ? 'Confirmed' : 'Pending')
                      );
                      const grpStatusLabel = grpStatusRaw
                        ? String(grpStatusRaw).replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
                        : (grp.hasConfirmedItems ? 'Confirmed' : 'Pending');

                      return grp.hasConfirmedItems ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          {grpStatusLabel} ({grp.items.length})
                        </span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-0.5">
                          <Lock size={9} /> Pending ({grp.items.length})
                        </span>
                      );
                    })()}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Strict Verification Banner */}
        {!confirmed ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <Lock size={28} />
            </div>
            <div>
              <h4 className="font-display font-extrabold text-lg text-gray-900">
                Tax Invoice Locked for {activeSellerGroup?.storeName || 'Seller Store'}
              </h4>
              <p className="text-xs text-gray-600 max-w-md mx-auto mt-1 leading-relaxed">
                Official Tax Invoice will be generated automatically once the items for {activeSellerGroup?.storeName || 'this seller'} are confirmed.
              </p>
            </div>
            <div className="inline-flex flex-col items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold px-5 py-2.5 rounded-xl shadow-2xs">
              <div>
                Seller Item Status: <span className="uppercase font-black text-amber-950">{activeSellerGroup?.items?.[0]?.status || order.overallStatus || order.status || 'Pending Confirmation'}</span>
              </div>
              {sellerGroups.length > 1 && (
                <p className="text-[11px] text-teal-700 font-semibold mt-1">
                  💡 In this combined order, switch to confirmed seller tabs above to view available invoices.
                </p>
              )}
            </div>
          </div>
        ) : (

        /* Invoice Sheet Body */
        <div id="printableTaxInvoiceArea" className="p-6 sm:p-8 space-y-6 overflow-y-auto print:overflow-visible print:p-0">
          
          {/* Company & Certificate Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-gray-900 pb-5 gap-4">
            <div className="flex items-start gap-3.5">
              <img
                src="/logo.png"
                alt="Book Vardi"
                className="h-14 sm:h-16 w-auto max-w-[120px] object-contain shrink-0"
              />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-brand-teal text-white font-black text-xs px-2 py-0.5 rounded tracking-wider uppercase">Book Vardi</span>
                  <span className="text-xs font-extrabold text-emerald-700 flex items-center gap-1">
                    <ShieldCheck size={14} /> Official Verified Invoice
                  </span>
                </div>
                <h1 className="font-display font-extrabold text-xl text-gray-900 tracking-tight uppercase">
                  {companyName}
                </h1>
                <p className="text-[11px] text-gray-500">{companyAddress} | GSTIN: {companyGstin}</p>
              </div>
            </div>

            <div className="sm:text-right border-l-2 sm:border-l-0 sm:border-r-0 border-brand-teal pl-3 sm:pl-0">
              <h2 className="font-display font-black text-lg text-gray-900 uppercase tracking-wider">
                TAX INVOICE
              </h2>
              <p className="text-xs font-bold text-gray-700">Invoice No: <strong className="font-mono text-brand-teal">{resolvedInvoiceNumber}</strong></p>
              <p className="text-[11px] text-gray-500">Invoice Date: {order.date || new Date().toLocaleDateString('en-GB')}</p>
            </div>
          </div>

          {/* Seller & Customer Information */}
          {(() => {
            const primarySellerName = resolvedSeller.storeName;
            const primarySellerGst = resolvedSeller.gstNumber;
            const primarySellerCity = resolvedSeller.city;
            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div>
                  <span className="text-[10px] uppercase font-black text-gray-400 block mb-1">
                    {isCancelled ? 'Issued By (Merchant / Seller Store)' : 'Sold By (Merchant / Seller Store)'}
                  </span>
                  <p className="font-extrabold text-gray-900 text-sm">{primarySellerName}</p>
                  <span className="inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-sm border border-emerald-200">
                    <ShieldCheck size={12} className="shrink-0" /> Verified Seller Partner
                  </span>
                  <p className="text-gray-600 mt-1">Location / City: {primarySellerCity}</p>
                  <p className="text-gray-700 font-mono font-bold mt-0.5">GSTIN: {primarySellerGst}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-black text-gray-400 block mb-1">
                    {isCancelled ? 'Issued To (Customer / Institution)' : 'Billed To (Customer / Institution)'}
                  </span>
                  <p className="font-extrabold text-gray-900 text-sm">{stripCustomerPhoneFromAddress(order.schoolName || (typeof order.customerName === 'object' ? (order.customerName?.name || 'Customer') : (order.customerName || order.customer?.name || order.contactPerson || 'School Representative')))}</p>
                  <p className="text-gray-600 mt-0.5">{stripCustomerPhoneFromAddress(order.deliveryLocation || order.location || formattedAddressStr)}</p>
                  <p className="text-gray-500 mt-1 flex items-center gap-2 flex-wrap">
                    <span>Order ID: <strong className="font-mono text-gray-900">#{order.id || order.orderId || order._id}</strong></span>
                    <span>•</span>
                    <span>Payment: <strong>{order.paymentMethod || 'Institutional Procurement / Advance ESCROW'}</strong></span>
                    <span>•</span>
                    <span>Status: <strong className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded text-[10px]">{activeSellerStatusLabel}</strong></span>
                  </p>
                </div>
              </div>
            );
          })()}

          {/* Itemized Table */}
          <div className="border border-gray-200 rounded-xl overflow-x-auto text-xs">
            <table className="w-full text-left border-collapse min-w-[660px]">
              <thead>
                <tr className="bg-gray-100 text-gray-700 border-b border-gray-200 font-extrabold uppercase text-[10px]">
                  <th className="py-2.5 px-3 min-w-[140px]">Item Details</th>
                  <th className="py-2.5 px-3 min-w-[110px]">Sold By (Seller Store)</th>
                  <th className="py-2.5 px-2 text-center w-10">Qty</th>
                  <th className="py-2.5 px-2.5 text-right w-20">Unit Price</th>
                  <th className="py-2.5 px-2.5 text-right w-22">Taxable Val</th>
                  <th className="py-2.5 px-3 text-right min-w-[130px]">Taxes</th>
                  <th className="py-2.5 px-3 text-right w-24 pr-3.5">Total Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {itemBreakdowns.map((item, idx) => {
                  const sellerName = getItemSellerName(item);
                  const itemCgst = item.rate > 0 && isIntraState ? Math.round((item.taxAmt / 2) * 100) / 100 : 0;
                  const itemSgst = item.rate > 0 && isIntraState ? Math.round((item.taxAmt - itemCgst) * 100) / 100 : 0;
                  const itemIgst = item.rate > 0 && !isIntraState ? item.taxAmt : 0;
                  const displayTotal = item.itemDiscount > 0 ? item.netItemPayable : item.grossPrice;

                  return (
                    <tr key={idx} className="hover:bg-gray-50/50">
                      <td className="py-2.5 px-3">
                        <p className="font-bold text-gray-900">{item.name}</p>
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-400 flex-wrap">
                          <span>{item.category || 'School Supply'}</span>
                          {item.status && (
                            <>
                              <span>•</span>
                              <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded text-[10px]">
                                {String(item.status).replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')}
                              </span>
                            </>
                          )}
                        </div>
                        {item.itemDiscount > 0 && (
                          <div className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                            <span>🏷️ Offer / Coupon: -₹{item.itemDiscount.toFixed(2)} off</span>
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded text-[11px] border border-gray-200 block truncate max-w-[140px]" title={sellerName}>
                          {sellerName}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold">{item.qty}</td>
                      <td className="py-2.5 px-3 text-right font-mono">₹{item.unitPrice.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-gray-600">₹{item.taxableVal.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-right">
                        {item.rate > 0 ? (
                          isIntraState ? (
                            <div className="space-y-1 text-right font-mono text-[10px]">
                              <div className="flex justify-end items-center gap-2 whitespace-nowrap">
                                <span className="text-gray-500 font-sans">SGST @{(item.rate / 2)}%:</span>
                                <span className="font-semibold text-gray-800 min-w-[48px] text-right">₹{itemSgst.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-end items-center gap-2 whitespace-nowrap">
                                <span className="text-gray-500 font-sans">CGST @{(item.rate / 2)}%:</span>
                                <span className="font-semibold text-gray-800 min-w-[48px] text-right">₹{itemCgst.toFixed(2)}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex justify-end items-center gap-2 text-right font-mono text-[10px] whitespace-nowrap">
                              <span className="text-gray-500 font-sans">IGST @{item.rate}%:</span>
                              <span className="font-semibold text-gray-800 min-w-[48px] text-right">₹{itemIgst.toFixed(2)}</span>
                            </div>
                          )
                        ) : (
                          <div className="text-right whitespace-nowrap">
                            <span className="text-gray-500 font-semibold text-[10px] block">0% GST</span>
                            <span className="text-[9px] text-gray-400 block font-mono">₹0.00 (Exempt)</span>
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-gray-900 font-mono whitespace-nowrap pr-3.5">
                        {item.itemDiscount > 0 && (
                          <span className="text-gray-400 line-through text-[10px] block font-normal">₹{item.grossPrice.toFixed(2)}</span>
                        )}
                        <span className={item.itemDiscount > 0 ? "text-emerald-700 font-bold" : "text-gray-900"}>₹{displayTotal.toFixed(2)}</span>
                        {item.itemDiscount > 0 && (
                          <span className="block text-[9px] text-emerald-600 font-semibold font-sans">(-₹{item.itemDiscount.toFixed(2)} off)</span>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {/* Dedicated Delivery Charges Line Item */}
                {shippingCost > 0 ? (
                  <tr className="hover:bg-gray-50/50 bg-teal-50/15">
                    <td className="py-2.5 px-3">
                      <p className="font-bold text-gray-900">Delivery &amp; Shipping Charges</p>
                      <p className="text-[10px] text-gray-400">Logistics &amp; Freight Services (SAC 9968)</p>
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-gray-400">—</td>
                    <td className="py-2.5 px-3 text-center font-bold text-gray-400">NA</td>
                    <td className="py-2.5 px-3 text-right font-mono text-gray-700">₹{shippingCost.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-gray-600">₹{shippingTaxable.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right">
                      {shippingGstRate > 0 && shippingTax > 0 ? (
                        isIntraState ? (
                          <div className="space-y-1 text-right font-mono text-[10px]">
                            <div className="flex justify-end items-center gap-2 whitespace-nowrap">
                              <span className="text-gray-500 font-sans">SGST @{(shippingGstRate / 2)}%:</span>
                              <span className="font-semibold text-gray-800 min-w-[48px] text-right">₹{shippingSgst.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-end items-center gap-2 whitespace-nowrap">
                              <span className="text-gray-500 font-sans">CGST @{(shippingGstRate / 2)}%:</span>
                              <span className="font-semibold text-gray-800 min-w-[48px] text-right">₹{shippingCgst.toFixed(2)}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-end items-center gap-2 text-right font-mono text-[10px] whitespace-nowrap">
                            <span className="text-gray-500 font-sans">IGST @{shippingGstRate}%:</span>
                            <span className="font-semibold text-gray-800 min-w-[48px] text-right">₹{shippingIgst.toFixed(2)}</span>
                          </div>
                        )
                      ) : (
                        <div className="text-right whitespace-nowrap">
                          <span className="text-gray-500 font-semibold text-[10px] block">0% GST</span>
                          <span className="text-[9px] text-gray-400 block font-mono">₹0.00 (Exempt)</span>
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-gray-900 font-mono whitespace-nowrap pr-3.5">₹{shippingCost.toFixed(2)}</td>
                  </tr>
                ) : (
                  <tr className="hover:bg-emerald-50/40 bg-emerald-50/20">
                    <td className="py-2.5 px-3">
                      <p className="font-bold text-emerald-950 flex items-center gap-1.5">
                        <span>🚚</span> Delivery &amp; Shipping Charges
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-300">
                          FREE Delivery
                        </span>
                      </p>
                      <p className="text-[10px] text-emerald-700">Order Policy (Admin Absorbed / Free Shipping Promotion)</p>
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-gray-400">—</td>
                    <td className="py-2.5 px-3 text-center font-bold text-gray-400">NA</td>
                    <td className="py-2.5 px-3 text-right font-mono text-gray-400 line-through">₹49.00</td>
                    <td className="py-2.5 px-3 text-right font-mono text-gray-600">₹0.00</td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <span className="text-emerald-700 font-semibold text-[10px] block">0% GST</span>
                      <span className="text-[9px] text-gray-400 block font-mono">₹0.00 (Exempt)</span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-700 font-mono whitespace-nowrap pr-3.5">
                      FREE (₹0.00)
                    </td>
                  </tr>
                )}

                {/* Dedicated Cash on Delivery (COD) Charges Line Item */}
                {isCod && (
                  rawCodFee > 0 ? (
                    <tr className="hover:bg-amber-50/40 bg-amber-50/20">
                      <td className="py-2.5 px-3">
                        <p className="font-bold text-gray-900 flex items-center gap-1.5 flex-wrap">
                          <span>💵</span> Cash on Delivery (COD) Charges
                          {isRule3CodSelf ? (
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                              Retained by Seller (₹0 Portal Deduction)
                            </span>
                          ) : isExemptedSeller ? (
                            <span className="bg-teal-100 text-teal-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-teal-300">
                              09BLMPK2840L2ZN Exempt (Not Deducted)
                            </span>
                          ) : (
                            <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-purple-300">
                              Retained by Portal
                            </span>
                          )}
                        </p>
                        <p className="text-[10px] text-gray-500">Doorstep Cash Handling &amp; Collection (SAC 998544)</p>
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-gray-400">—</td>
                      <td className="py-2.5 px-3 text-center font-bold text-gray-700">1</td>
                      <td className="py-2.5 px-3 text-right font-mono text-gray-700">₹{rawCodFee.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-gray-600">₹{rawCodFee.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <span className="text-gray-500 font-semibold text-[10px] block">0% GST</span>
                        <span className="text-[9px] text-gray-400 block font-mono">₹0.00 (Exempt)</span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-gray-900 font-mono whitespace-nowrap pr-3.5">
                        ₹{rawCodFee.toFixed(2)}
                      </td>
                    </tr>
                  ) : (
                    <tr className="hover:bg-amber-50/30 bg-amber-50/15">
                      <td className="py-2.5 px-3">
                        <p className="font-bold text-amber-950 flex items-center gap-1.5 flex-wrap">
                          <span>💵</span> Cash on Delivery (COD) Charges
                          <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-300">
                            FREE COD (₹0 Fee)
                          </span>
                          {isRule3CodSelf ? (
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                              Self Delivery (Cash with Seller)
                            </span>
                          ) : isExemptedSeller ? (
                            <span className="bg-teal-100 text-teal-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-teal-300">
                              09BLMPK2840L2ZN Exempted
                            </span>
                          ) : null}
                        </p>
                        <p className="text-[10px] text-amber-700">Doorstep Cash Collection Promotion (Admin Absorbed / Free COD Promotion)</p>
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-gray-400">—</td>
                      <td className="py-2.5 px-3 text-center font-bold text-gray-400">NA</td>
                      <td className="py-2.5 px-3 text-right font-mono text-gray-400 line-through">₹40.00</td>
                      <td className="py-2.5 px-3 text-right font-mono text-gray-600">₹0.00</td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <span className="text-amber-800 font-semibold text-[10px] block">0% GST</span>
                        <span className="text-[9px] text-gray-400 block font-mono">₹0.00 (Exempt)</span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-700 font-mono whitespace-nowrap pr-3.5">
                        FREE (₹0.00)
                      </td>
                    </tr>
                  )
                )}
              </tbody>
              <tfoot className="bg-gray-100/95 font-bold border-t-2 border-gray-300">
                <tr>
                  <td colSpan={4} className="py-2.5 px-3 text-right font-black uppercase text-[10px] text-gray-700 tracking-wider">
                    Total / Order Payable:
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-gray-900 text-xs">
                    ₹{taxableValue.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono">
                    {taxAmount > 0 ? (
                      isIntraState ? (
                        <div className="space-y-1 text-right text-[10px]">
                          <div className="flex justify-end items-center gap-2 whitespace-nowrap">
                            <span className="text-gray-500 font-sans">SGST:</span>
                            <span className="font-bold text-brand-teal min-w-[48px] text-right">₹{sgstAmount.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-end items-center gap-2 whitespace-nowrap">
                            <span className="text-gray-500 font-sans">CGST:</span>
                            <span className="font-bold text-brand-teal min-w-[48px] text-right">₹{cgstAmount.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-end items-center gap-2 font-black text-brand-teal border-t border-gray-300 pt-0.5 whitespace-nowrap">
                            <span className="text-gray-400 font-normal font-sans text-[9px]">Total Tax:</span>
                            <span className="min-w-[48px] text-right">₹{taxAmount.toFixed(2)}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1 text-right text-[10px]">
                          <div className="flex justify-end items-center gap-2 whitespace-nowrap">
                            <span className="text-gray-500 font-sans">IGST:</span>
                            <span className="font-bold text-brand-teal min-w-[48px] text-right">₹{igstAmount.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-end items-center gap-2 font-black text-brand-teal border-t border-gray-300 pt-0.5 whitespace-nowrap">
                            <span className="text-gray-400 font-normal font-sans text-[9px]">Total Tax:</span>
                            <span className="min-w-[48px] text-right">₹{taxAmount.toFixed(2)}</span>
                          </div>
                        </div>
                      )
                    ) : (
                      <span className="text-gray-500 text-[11px]">₹0.00</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-base font-black text-gray-900 whitespace-nowrap pr-3.5">
                    ₹{grandTotal.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Financial Settlement & Statutory Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="bg-amber-50/80 p-3.5 rounded-xl border border-amber-200 space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-[10px] text-amber-950 uppercase tracking-wider flex items-center gap-1">
                  <DollarSign size={13} /> Seller Settlement &amp; Payout Split
                </h4>
                {isSettlementReversed ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300 shadow-xs flex items-center gap-1">
                    GST Sec 34: Settlement &amp; Taxes Reversed (₹0.00)
                  </span>
                ) : isRule3CodSelf ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300 shadow-xs flex items-center gap-1">
                    Rule 3: COD + Self Delivery (Cash)
                  </span>
                ) : isRule4CodCourier ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-purple-100 text-purple-800 border border-purple-300 shadow-xs flex items-center gap-1">
                    Rule 4: COD + 3rd-Party Delivery
                  </span>
                ) : isRule2OnlineCourier ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-300">
                    Rule 2: Online + 3rd-Party Delivery
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-300">
                    Rule 1: Online + Self Delivery
                  </span>
                )}
              </div>

              <div className="flex justify-between text-gray-700">
                <div>
                  <span>{isSettlementReversed ? 'Original Gross Sale:' : (isRule3CodSelf ? 'Cash Collected by Seller:' : (isRule4CodCourier ? 'Cash via Courier Remittance:' : 'Gross Sale (Net Product Sale):'))}</span>
                  {isRule3CodSelf && selfDeliveryFee > 0 && (
                    <span className="text-[10px] text-gray-500 block font-normal">
                      (आइटम: ₹{settlementGross.toFixed(2)} + सेल्फ डिलीवरी शुल्क: ₹{selfDeliveryFee.toFixed(2)})
                    </span>
                  )}
                </div>
                <span className="font-mono font-bold self-center">₹{(isRule3CodSelf ? sellerCashCollected : settlementGross).toFixed(2)}{isSettlementReversed ? ' (Reversed)' : ''}</span>
              </div>
              <div className="flex justify-between text-amber-900 font-medium">
                <span>Commission ({marketplaceCommissionRate}%):</span>
                <span className="font-mono">{isSettlementReversed ? '₹0.00 (Waived)' : `-₹${marketplaceCommission.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between text-indigo-900 font-medium">
                <span>GST on Commission (18%):</span>
                <span className="font-mono">{isSettlementReversed ? '₹0.00 (Waived)' : `-₹${gstOnCommission.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between text-purple-900 font-medium">
                <span>TDS 0.1% (Sec 194-O):</span>
                <span className="font-mono">
                  {isSettlementReversed ? '₹0.00 (Reversed)' : (isExemptedSeller ? '₹0.00 (09BLMPK2840L2ZN Exempt)' : (tdsAmount > 0 ? `-₹${tdsAmount.toFixed(2)}` : '₹0.00'))}
                </span>
              </div>
              <div className="flex justify-between text-sky-900 font-medium">
                <span>
                  GST TCS (Sec 52):
                  {isSettlementReversed ? (
                    <span className="text-[9px] text-rose-700 font-bold ml-1">₹0.00 (Sec 34 Reversal)</span>
                  ) : isExemptedSeller ? (
                    <span className="text-[9px] text-emerald-700 font-bold ml-1">0% (09BLMPK2840L2ZN Exempt)</span>
                  ) : isRule3CodSelf ? (
                    <span className="text-[9px] text-gray-500 font-normal ml-1">0% (Exempt on COD Self)</span>
                  ) : isTaxFreeOrder ? (
                    <span className="text-[9px] text-emerald-700 font-bold ml-1">₹0.00 (0% GST / Books Tax-Free)</span>
                  ) : (
                    <span className="text-[9px] text-sky-700 font-normal ml-1">0.5% (on Taxable ₹{settlementTaxable.toFixed(2)})</span>
                  )}
                </span>
                <span className="font-mono">{isSettlementReversed ? '₹0.00 (Reversed)' : (isExemptedSeller ? '₹0.00' : (gstTcsAmount > 0 ? `-₹${gstTcsAmount.toFixed(2)}` : '₹0.00'))}</span>
              </div>

              {/* Delivery charge deduction for Rule 2 & Rule 4, or Self Delivery retention for Rule 1 & Rule 3 */}
              {isThirdParty ? (
                <div className="flex justify-between text-rose-900 font-medium">
                  <span>Delivery Charges (Policy):</span>
                  {isSettlementReversed ? (
                    <span className="font-mono text-teal-700 font-bold">₹0.00 (Waived)</span>
                  ) : totalDeliveryDeduction > 0 ? (
                    <span className="font-mono text-rose-700">-₹{totalDeliveryDeduction.toFixed(2)} (कूरियर ₹${totalDeliveryDeduction.toFixed(2)} GST सहित / Base: ₹{deliveryChargeAmount.toFixed(2)} + ₹{gstOnDeliveryAmount.toFixed(2)} GST {shippingGstRate}%)</span>
                  ) : delivBorneBy === 'customer' ? (
                    <span className="font-mono text-teal-700 font-bold">₹0.00 (ग्राहक द्वारा वहन / Paid by Customer)</span>
                  ) : (
                    <span className="font-mono text-teal-700 font-bold">FREE (Admin Absorbs ≥₹{orderThreshold})</span>
                  )}
                </div>
              ) : (isSelf && customerShippingPaid > 0 && (
                <div className="flex justify-between text-teal-800 font-medium">
                  <span>Delivery Charges (Policy):</span>
                  <span className="font-mono text-teal-700 font-bold">+₹{customerShippingPaid.toFixed(2)} (सेलर के पास / Self Delivery)</span>
                </div>
              ))}

              {/* COD Charges Allocation & Policy */}
              {isCod && (
                <div className="flex justify-between font-medium">
                  <span className="text-amber-950 font-bold">COD Handling (Policy):</span>
                  {isSettlementReversed ? (
                    <span className="font-mono text-rose-700 font-bold">₹0.00 (Reversed)</span>
                  ) : isRule3CodSelf ? (
                    <span className="font-mono text-emerald-700 font-bold">
                      {rawCodFee > 0 ? `+₹${rawCodFee.toFixed(2)} (Retained by Seller)` : '₹0.00 (Self Delivery / Seller Handled)'}
                    </span>
                  ) : isExemptedSeller ? (
                    <span className="font-mono text-teal-700 font-bold">
                      ₹0.00 (09BLMPK2840L2ZN Chhoot / Exempted)
                    </span>
                  ) : isRule4CodCourier ? (
                    <span className="font-mono text-purple-700 font-bold">
                      {rawCodFee > 0 ? `-₹${rawCodFee.toFixed(2)} (Retained by Portal)` : '₹0.00 (Admin Absorbed)'}
                    </span>
                  ) : (
                    <span className="font-mono text-gray-500">₹0.00</span>
                  )}
                </div>
              )}

              {isSettlementReversed ? (
                <div className="flex justify-between text-rose-700 font-black border-t border-rose-300 pt-1">
                  <div>
                    <span>Pending Seller Settlement:</span>
                    <span className="text-[9px] text-rose-600 block font-normal">Reversed under GST Section 34 Credit Note</span>
                  </div>
                  <span className="font-mono text-sm font-black text-rose-800">₹0.00 (Reversed)</span>
                </div>
              ) : isRule3CodSelf ? (
                <div className="space-y-1.5 border-t border-amber-300 pt-1.5">
                  <div className="flex justify-between text-rose-700 font-extrabold text-xs">
                    <div>
                      <span>⚠️ Portal Commission/Taxes (Payable to Portal):</span>
                      <span className="text-[9px] text-amber-900 block font-normal">Customer paid ₹{sellerCashCollected.toFixed(2)} cash directly to seller</span>
                    </div>
                    <span className="font-mono text-xs font-black text-rose-700">
                      {isExemptedSeller ? '₹0.00 (09BLMPK2840L2ZN Exempt)' : (totalDeductions > 0 ? `-₹${totalDeductions.toFixed(2)}` : '₹0.00')}
                    </span>
                  </div>
                  <div className="flex justify-between text-emerald-800 font-black text-xs bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                    <span>सेलर शुद्ध बचत (Net Seller Retention):</span>
                    <span className="font-mono text-emerald-800 font-black">₹{netSellerRetention.toFixed(2)}</span>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between text-emerald-800 font-black border-t border-amber-300 pt-1">
                  <span>Net Payable to Seller:</span>
                  <span className="font-mono">₹{sellerSettlement.toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Place of Supply & Statutory Metadata (Replaces redundant Price & Tax Breakdown card) */}
            <div className="bg-gray-50/90 p-3.5 rounded-xl border border-gray-200 space-y-2.5 text-[11px] flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200 pb-2 gap-1.5">
                  <span className="font-extrabold text-[10px] text-gray-700 uppercase tracking-wider flex items-center gap-1 shrink-0">
                    <ShieldCheck size={13} className="text-emerald-700" /> Place of Supply &amp; Tax Meta
                  </span>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border w-fit shrink-0 ${
                    isIntraState 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  }`}>
                    {isIntraState ? `Intra-State (${customerStateInfo.name})` : `Inter-State (${sellerStateInfo.name} ➔ ${customerStateInfo.name})`}
                  </span>
                </div>

                <div className="space-y-1.5 text-gray-600">
                  <div className="flex justify-between items-center">
                    <span>Order / Fulfillment Status:</span>
                    <strong className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px]">{activeSellerStatusLabel}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Payment Mode:</span>
                    <strong className="text-gray-900 font-sans">{order.paymentMethod || 'Cash on Delivery (COD)'} ({order.paymentStatus || 'Pending'})</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Tax on Reverse Charge (RCM):</span>
                    <strong className="text-gray-900 font-sans">No (Exempt B2C Supply)</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>GST Supply Nature:</span>
                    <strong className="text-gray-900 font-sans">{shippingGstRate > 0 ? `Composite Supply (${shippingGstRate}% GST)` : 'Exempt Supply (0% GST)'}</strong>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-2.5 border border-gray-200 mt-2">
                  <span className="text-[10px] uppercase font-black text-gray-400 block tracking-wider">
                    Gross Order Amount in Words
                  </span>
                  <p className="font-bold text-gray-900 text-xs italic mt-0.5">
                    {numberToWords(grandTotal)}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-200 text-[10px] text-gray-400 leading-relaxed italic">
                • Computer-generated partner merchant invoice under Section 31 of CGST Act, 2017. Does not require physical signature.
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 pt-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-gray-500">
            <div>
              <p className="font-semibold text-gray-700">Book Vardi Seller Fulfillment Desk</p>
              <p className="text-[10px] text-gray-400">Official Partner Merchant Tax Invoice • {companySupportEmail}</p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Authorized Signatory</span>
              <span className="font-bold text-gray-900 text-xs block">{resolvedSeller.storeName}</span>
              <span className="text-[10px] font-mono text-gray-500 block">GSTIN: {resolvedSeller.gstNumber || 'Exempt / N/A'}</span>
            </div>
          </div>

        </div>
        )}
      </div>
    </div>
  );
}
