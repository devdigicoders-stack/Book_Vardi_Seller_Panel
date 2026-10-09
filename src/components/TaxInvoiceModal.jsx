import React from 'react';
import { 
  X, 
  Printer, 
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
import { useSellerData, readActiveSellerSettings, readActiveSellerProfile } from '../context/SellerDataContext';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1588072432836-e10032774350?w=150&auto=format&fit=crop&q=80';

export function getProductGstRate(item) {
  const explicitGst = item?.gstPercent ?? item?.gstPercentage ?? item?.gstRate ?? item?.gst ?? item?.taxRate ?? item?.productId?.gstPercent ?? item?.productId?.gstRate ?? item?.productId?.gst ?? item?.productId?.gstPercentage ?? item?.productId?.taxRate;
  if (explicitGst !== undefined && explicitGst !== null && String(explicitGst).trim() !== '' && !isNaN(Number(explicitGst))) {
    return Number(explicitGst);
  }
  return 5;
}

export default function TaxInvoiceModal({ isOpen, onClose, order, sellerUser: passedSellerUser }) {
  if (!isOpen || !order) return null;

  let contextSellerUser = null;
  try {
    const dataContext = useSellerData?.();
    contextSellerUser = dataContext?.sellerUser || null;
  } catch (e) {}

  const activeSellerUser = passedSellerUser || contextSellerUser || null;

  const rawStatus = String(order.overallStatus || order.status || '').toLowerCase().trim();
  const normStatus = rawStatus.replace(/[\s-]+/g, '_');

  const isPendingUnconfirmed = !normStatus || ['pending', 'placed', 'unconfirmed', 'created', 'draft'].includes(normStatus);

  const isConfirmedAndOnward = [
    'confirmed',
    'quote_accepted',
    'buyer_accepted',
    'seller_accepted',
    'processing',
    'production',
    'packed',
    'packed_and_sealed',
    'shipped',
    'dispatched',
    'in_transit',
    'out_for_delivery',
    'delivered',
    'completed',
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
  ].includes(normStatus) || (!isPendingUnconfirmed && normStatus.length > 0);

  const hasPendingProduct = isPendingUnconfirmed || (Array.isArray(order.items) && order.items.length > 0 && order.items.some(it => {
    const itStatus = String(it.status || '').toLowerCase().trim().replace(/[\s-]+/g, '_');
    return !itStatus || ['pending', 'placed', 'unconfirmed'].includes(itStatus);
  }));

  const hasConfirmedItem = Array.isArray(order.items) && order.items.some(it => {
    const itStatus = String(it.status || '').toLowerCase().trim().replace(/[\s-]+/g, '_');
    return itStatus && !['pending', 'placed', 'unconfirmed'].includes(itStatus);
  });

  const isPaid = String(order.paymentStatus || '').toLowerCase() === 'paid' ||
    String(order.advancePaymentStatus || '').toLowerCase() === 'paid' ||
    Number(order.advancePaidAmount || 0) > 0;

  const confirmed = !hasPendingProduct && (isConfirmedAndOnward || hasConfirmedItem);

  const shippingAddr = typeof order.shippingAddress === 'object'
    ? order.shippingAddress
    : { street: order.address || order.shippingAddress || 'Customer Delivery Address' };

  const formattedAddressStr = typeof order.shippingAddress === 'string'
    ? order.shippingAddress
    : [
        shippingAddr.street || shippingAddr.addressLine || shippingAddr.address,
        shippingAddr.city,
        shippingAddr.state,
        shippingAddr.pincode ? `- ${shippingAddr.pincode}` : ''
      ].filter(Boolean).join(', ');

  const items = Array.isArray(order.items) && order.items.length > 0 ? order.items : [
    {
      id: 1,
      name: order.itemName || order.product || 'School Supply Item',
      image: order.image || (Array.isArray(order.images) && order.images[0]) || FALLBACK_IMAGE,
      quantity: order.quantity || 1,
      price: order.total || order.amount || 499,
      category: 'School Uniform'
    }
  ];

  let totalTaxableValue = 0;
  let totalTaxAmount = 0;

  const itemBreakdowns = items.map((item) => {
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
    const unitPrice = Number(item.price || 0);
    const grossPrice = unitPrice * qty;
    const rate = getProductGstRate(item);
    const isInclusive = item.isGstInclusive !== false && order.isGstInclusive !== false;

    let taxableVal = grossPrice;
    let taxAmt = 0;

    if (rate > 0) {
      if (isInclusive) {
        taxableVal = Math.round((grossPrice / (1 + rate / 100)) * 100) / 100;
        taxAmt = Math.round((grossPrice - taxableVal) * 100) / 100;
      } else {
        taxableVal = grossPrice;
        taxAmt = Math.round(((grossPrice * rate) / 100) * 100) / 100;
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
      rate,
      taxableVal,
      taxAmt
    };
  });

  const subtotal = order.subtotal || items.reduce((acc, i) => acc + (Number(i.price || 0) * Number(i.quantity || 1)), 0);
  const taxAmount = Math.round(totalTaxAmount * 100) / 100;
  const shippingCost = Number(order.shippingCost ?? order.shippingFee ?? 0);
  const discount = Number(order.discount ?? order.discountAmount ?? 0);
  const grandTotal = Number(order.total || order.totalAmount || (subtotal + shippingCost - discount));

  const isPlaceholderName = (name) => {
    if (!name || typeof name !== 'string') return true;
    const lower = name.trim().toLowerCase();
    return (
      lower === '' ||
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

  const resolveSeller = () => {
    const primaryName = getItemSellerName(items[0]);
    
    let activeSettings = {};
    try {
      activeSettings = typeof readActiveSellerSettings === 'function' ? readActiveSellerSettings() : {};
    } catch (e) {}

    const primaryGst = [
      order.sellerDetails?.gstNumber,
      order.sellerDetails?.gst,
      order.sellerGst,
      order.gstNumber,
      items[0]?.sellerDetails?.gstNumber,
      items[0]?.gstNumber,
      items[0]?.sellerGst,
      activeSellerUser?.gstin,
      activeSellerUser?.gstNumber,
      activeSettings?.gstin
    ].find(g => g && g !== '09AAACB1234F1Z9' && g !== 'Exempt / N/A' && String(g).trim() !== '') || 'Exempt / N/A';

    const primaryCity = [
      order.sellerDetails?.city,
      order.sellerDetails?.address,
      order.sellerCity,
      items[0]?.sellerDetails?.city,
      items[0]?.sellerCity,
      activeSellerUser?.city,
      activeSettings?.city
    ].find(Boolean) || 'Lucknow, Uttar Pradesh';
    
    return {
      storeName: primaryName || 'Partner Store',
      gstNumber: primaryGst,
      city: primaryCity
    };
  };

  const resolvedSeller = resolveSeller();

  // Helper to resolve dynamic seller commission rate
  const getSellerCommissionRate = () => {
    if (order.commissionRate !== undefined && order.commissionRate !== null && !isNaN(Number(order.commissionRate))) {
      return Number(order.commissionRate);
    }
    if (order.sellerCommissionRate !== undefined && order.sellerCommissionRate !== null && !isNaN(Number(order.sellerCommissionRate))) {
      return Number(order.sellerCommissionRate);
    }

    const firstItem = items[0];
    if (firstItem?.commissionRate !== undefined && firstItem.commissionRate !== null && !isNaN(Number(firstItem.commissionRate))) {
      return Number(firstItem.commissionRate);
    }
    if (firstItem?.sellerCommissionRate !== undefined && firstItem.sellerCommissionRate !== null && !isNaN(Number(firstItem.sellerCommissionRate))) {
      return Number(firstItem.sellerCommissionRate);
    }
    if (firstItem?.commissionPercentage !== undefined && firstItem.commissionPercentage !== null && !isNaN(Number(firstItem.commissionPercentage))) {
      return Number(firstItem.commissionPercentage);
    }

    const targetSellerId = String(firstItem?.sellerId || order.sellerId || '');
    const targetSellerName = String(getItemSellerName(firstItem) || '').toLowerCase();

    try {
      const savedSellers = localStorage.getItem('admin_sellers') || localStorage.getItem('bv_sync_sellers') || localStorage.getItem('bv_registered_users');
      if (savedSellers) {
        const sellersList = JSON.parse(savedSellers);
        if (Array.isArray(sellersList)) {
          const matched = sellersList.find(s => {
            const sId = String(s.id || s._id || s.sellerId || '');
            const sName = String(s.storeName || s.sellerName || s.name || s.storeDetails?.storeName || '').toLowerCase();
            return (targetSellerId && sId === targetSellerId) || (targetSellerName && sName && (sName === targetSellerName || targetSellerName.includes(sName)));
          });

          if (matched) {
            const rate = matched.commissionRate ?? matched.commissionPercentage ?? matched.commission;
            if (rate !== undefined && rate !== null && !isNaN(Number(rate))) {
              return Number(rate);
            }
          }
        }
      }
    } catch (e) {}

    try {
      const savedSettings = localStorage.getItem('admin_settings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        if (settings?.commissionRate !== undefined && !isNaN(Number(settings.commissionRate))) {
          return Number(settings.commissionRate);
        }
      }
    } catch (e) {}

    return 5;
  };

  const marketplaceCommissionRate = getSellerCommissionRate();
  const marketplaceCommission = Math.round((grandTotal * (marketplaceCommissionRate / 100)) * 100) / 100;
  const sellerPayout = Math.round((grandTotal - marketplaceCommission) * 100) / 100;

  // Logistics tracking resolution: strictly visible when product is Out for Delivery & partner decided
  const logisticsStatus = String(order.overallStatus || order.status || '').toLowerCase().replace(/_/g, ' ');
  const isOut = logisticsStatus === 'out for delivery' || logisticsStatus === 'delivered';
  const isSelf = String(order.deliveryMode || order.deliveryType || '').toLowerCase().includes('self') || Boolean(order.selfDeliveryDetails?.deliveryPartnerToken || order.selfDeliveryDetails?.deliveryPersonName);
  const isThirdParty = String(order.deliveryMode || order.deliveryType || '').toLowerCase().includes('third') || Boolean(order.courierName || order.thirdPartyDetails?.courierName);
  const hasPartner = isSelf || isThirdParty || Boolean(order.courierName || order.selfDeliveryDetails?.deliveryPersonName);
  const hasTracking = isOut && hasPartner && Boolean(order.trackingNumber || order.selfDeliveryDetails?.deliveryPartnerToken || order.thirdPartyDetails?.trackingNumber);

  const deliveryPartnerDisplay = isSelf 
    ? (order.selfDeliveryDetails?.deliveryPersonName ? `Direct Self-Delivery (Rider: ${order.selfDeliveryDetails.deliveryPersonName})` : 'Direct Self-Delivery (Store Fleet)')
    : (order.courierName || order.thirdPartyDetails?.courierName || '3rd-Party Logistics Carrier');

  const trackingNumberDisplay = order.trackingNumber || (isSelf ? order.selfDeliveryDetails?.deliveryPartnerToken : order.thirdPartyDetails?.trackingNumber) || '';

  const trackingLinkDisplay = order.trackingUrl || order.selfDeliveryDetails?.trackingUrl || order.thirdPartyDetails?.trackingUrl || '';

  const handlePrint = () => {
    if (!confirmed) {
      alert('⚠️ Tax Invoice & Certificate is generated only when an order is confirmed strictly.');
      return;
    }
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:rounded-none">
        
        {/* Top Control Bar */}
        <div className="bg-gray-950 text-white px-5 py-3 flex items-center justify-between shrink-0 print:hidden border-b border-gray-800">
          <div className="flex items-center gap-2.5">
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
              <button
                onClick={handlePrint}
                className="px-3 py-1.5 bg-brand-teal hover:bg-teal-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Printer size={13} /> Print Invoice
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Strict Verification Banner */}
        {!confirmed ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center mx-auto">
              <Lock size={28} />
            </div>
            <div>
              <h4 className="font-display font-extrabold text-lg text-gray-900">Certificate Generation Locked</h4>
              <p className="text-xs text-gray-500 max-w-md mx-auto mt-1">
                Official Tax Invoice and Order Certificate are strictly generated only after order confirmation or payment settlement.
              </p>
            </div>
            <div className="inline-block bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold px-4 py-2 rounded-xl">
              Current Order Status: <span className="uppercase font-black text-amber-950">{order.status || 'Pending Verification'}</span>
            </div>
          </div>
        ) : (

        /* Invoice Sheet Body */
        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto print:overflow-visible print:p-0">
          
          {/* Company & Certificate Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-gray-900 pb-5 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-brand-teal text-white font-black text-xs px-2 py-0.5 rounded tracking-wider uppercase">Book Vardi</span>
                <span className="text-xs font-extrabold text-emerald-700 flex items-center gap-1">
                  <ShieldCheck size={14} /> Official Verified Invoice
                </span>
              </div>
              <h1 className="font-display font-extrabold text-xl text-gray-900 tracking-tight">
                BOOK VARDI PRIVATE LIMITED
              </h1>
              <p className="text-[11px] text-gray-500">Lucknow, Uttar Pradesh - 226001 | GSTIN: 09AAACB1234F1Z9</p>
            </div>

            <div className="sm:text-right border-l-2 sm:border-l-0 sm:border-r-0 border-brand-teal pl-3 sm:pl-0">
              <h2 className="font-display font-black text-lg text-gray-900 uppercase tracking-wider">
                TAX INVOICE
              </h2>
              <p className="text-xs font-bold text-gray-700">Invoice No: <strong className="font-mono text-brand-teal">INV-{order.id}</strong></p>
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
                  <span className="text-[10px] uppercase font-black text-gray-400 block mb-1">Sold By (Merchant / Seller Store)</span>
                  <p className="font-extrabold text-gray-900 text-sm">{primarySellerName}</p>
                  <span className="inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-sm border border-emerald-200">
                    <ShieldCheck size={12} className="shrink-0" /> Verified Seller Partner
                  </span>
                  <p className="text-gray-600 mt-1">Location / City: {primarySellerCity}</p>
                  <p className="text-gray-700 font-mono font-bold mt-0.5">GSTIN: {primarySellerGst}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-black text-gray-400 block mb-1">Billed To (Customer)</span>
                  <p className="font-extrabold text-gray-900 text-sm">{typeof order.customerName === 'object' ? (order.customerName?.name || 'Customer') : (order.customerName || order.customer?.name || 'Customer')}</p>
                  <p className="text-gray-600 mt-0.5">{formattedAddressStr}</p>
                  <p className="text-gray-500 mt-1">Order ID: <strong className="font-mono text-gray-900">#{order.id || order.orderId}</strong> | Payment: <strong>{order.paymentMethod || 'Online UPI'}</strong></p>
                </div>
              </div>
            );
          })()}

          {/* Itemized Table */}
          <div className="border border-gray-200 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-700 border-b border-gray-200 font-extrabold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Item Details</th>
                  <th className="py-2.5 px-3">Sold By (Seller Store)</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  <th className="py-2.5 px-3 text-right">Unit Price</th>
                  <th className="py-2.5 px-3 text-right">Taxable Val</th>
                  <th className="py-2.5 px-3 text-right">GST Rate</th>
                  <th className="py-2.5 px-3 text-right">Total Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {itemBreakdowns.map((item, idx) => {
                  const sellerName = getItemSellerName(item);
                  return (
                    <tr key={idx} className="hover:bg-gray-50/50">
                      <td className="py-2.5 px-3">
                        <p className="font-bold text-gray-900">{item.name}</p>
                        <p className="text-[10px] text-gray-400">{item.category || 'School Supply'}</p>
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
                        <span className="font-extrabold text-brand-teal block">{item.rate}% GST</span>
                        <span className="text-[9px] text-gray-500 font-medium">(₹{item.taxAmt.toFixed(2)})</span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-gray-900 font-mono">₹{item.grossPrice.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Financial Settlement Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="bg-amber-50/80 p-3.5 rounded-xl border border-amber-200 space-y-1.5 text-[11px]">
              <h4 className="font-extrabold text-[10px] text-amber-950 uppercase tracking-wider flex items-center gap-1">
                <DollarSign size={13} /> Seller Settlement & Payout Split
              </h4>
              <div className="flex justify-between text-gray-700">
                <span>Gross Order Total:</span>
                <span className="font-mono font-bold">₹{grandTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-amber-900 font-bold">
                <span>Platform Commission ({marketplaceCommissionRate}%):</span>
                <span className="font-mono">₹{marketplaceCommission.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-emerald-800 font-black border-t border-amber-300 pt-1">
                <span>Net Seller Earnings:</span>
                <span className="font-mono">₹{sellerPayout.toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 space-y-1.5 text-[11px]">
              <div className="flex justify-between text-gray-600">
                <span>Taxable Amount (Base):</span>
                <span className="font-mono">₹{(grandTotal - taxAmount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>GST Tax (Included):</span>
                <span className="font-mono font-bold text-brand-teal">₹{taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery Charges:</span>
                <span className="font-mono text-emerald-700 font-semibold">
                  {Number(order.shippingFee || order.shippingCost || 0) === 0 ? 'Not Applied (FREE)' : `₹${Number(order.shippingFee || order.shippingCost).toFixed(2)}`}
                </span>
              </div>
              {Number(order.discount || order.discountAmount || 0) > 0 ? (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Offer / Coupon Applied:</span>
                  <span className="font-mono">-₹{Number(order.discount || order.discountAmount).toFixed(2)}</span>
                </div>
              ) : (
                <div className="flex justify-between text-gray-400">
                  <span>Offer / Coupon:</span>
                  <span className="font-mono">Not Applied (₹0.00)</span>
                </div>
              )}
              <div className="border-t-2 border-gray-300 pt-1.5 flex justify-between items-center text-xs font-black text-gray-900">
                <div>
                  <span className="block">Grand Total:</span>
                  <span className="text-[10px] text-gray-400 font-normal block">(Inclusive of all taxes & GST)</span>
                </div>
                <span className="font-mono text-sm text-gray-900">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 pt-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-gray-500">
            <div>
              <p className="font-semibold text-gray-700">Book Vardi Seller Fulfillment Desk</p>
              <p className="text-[10px] text-gray-400">Official Partner Merchant Tax Invoice • support@bookvardi.com</p>
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
