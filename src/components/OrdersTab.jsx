import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  CheckCircle, 
  Truck, 
  Clock, 
  XCircle, 
  Eye, 
  Package, 
  Plus, 
  Minus,
  ArrowRight, 
  X, 
  MapPin, 
  Phone, 
  Mail, 
  CreditCard,
  CheckSquare,
  Square,
  FileText,
  Download,
  User,
  ExternalLink,
  MessageSquare,
  Key,
  Check,
  ShieldCheck,
  RefreshCw,
  Loader2,
  Lock
} from 'lucide-react';
import { useSellerData, stripCustomerPhoneFromAddress } from '../context/SellerDataContext';
import TaxInvoiceModal, { parseStateInfo } from './TaxInvoiceModal';
import CreateShipmentModal from './CreateShipmentModal';
import { generateRiderWhatsAppMessage, buildRiderWhatsAppUrl } from '../utils/whatsappRiderHelper';
import { SERVER_URL } from '../utils/api';

// Helper to generate absolute Storefront Website Delivery Partner portal link
export const getDriverWebsiteUrl = (tokenVal) => {
  const origin = (
    import.meta.env.VITE_WEBSITE_URL ||
    import.meta.env.VITE_CLIENT_URL ||
    (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:5173` : 'http://localhost:5173')
  ).replace(/\/+$/, '');
  return `${origin}/#delivery-partner?token=${encodeURIComponent(tokenVal || '')}`;
};

// Helper to generate dynamic tracking ID based on courier name
export const generateDynamicTrackingId = (courierName) => {
  const prefix = String(courierName || 'BLUEDART')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 10) || 'COURIER';
  const randomNum = Math.floor(10000000 + Math.random() * 90000000);
  return `${prefix}-${randomNum}`;
};

const maskPhoneNumber = (phone) => {
  if (!phone || typeof phone !== 'string') return '+91 98XXXXXX00';
  const clean = phone.replace(/\D/g, '');
  if (clean.length >= 10) {
    const last10 = clean.slice(-10);
    return `+91 ${last10.slice(0, 2)}XXXXXX${last10.slice(-2)}`;
  }
  return '+91 98XXXXXX00';
};

export const formatDisplayOrderId = (rawId) => {
  if (!rawId) return '';
  const str = String(rawId).trim().replace(/^#+/, '');
  if (/^[0-9a-fA-F]{24}$/.test(str)) {
    return `#${str.slice(-8).toUpperCase()}`;
  }
  return str;
};

const STATUS_CONFIG = {
  Pending: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', icon: Clock },
  Processing: { bg: 'bg-sky-50', text: 'text-sky-800', border: 'border-sky-200', icon: Clock },
  Confirmed: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200', icon: CheckCircle },
  Packed: { bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-200', icon: Package },
  Shipped: { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200', icon: Truck },
  'Out for Delivery': { bg: 'bg-purple-100', text: 'text-purple-900', border: 'border-purple-300', icon: Truck },
  Delivered: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200', icon: CheckCircle },
  Cancelled: { bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200', icon: XCircle },
  'Return Requested': { bg: 'bg-amber-100', text: 'text-amber-950', border: 'border-amber-300', icon: RefreshCw },
  'Exchange Requested': { bg: 'bg-purple-100', text: 'text-purple-950', border: 'border-purple-300', icon: RefreshCw },
  'Return Approved': { bg: 'bg-teal-50', text: 'text-teal-900', border: 'border-teal-200', icon: CheckCircle },
  'Exchange Approved': { bg: 'bg-teal-50', text: 'text-teal-900', border: 'border-teal-200', icon: CheckCircle },
  'Return Rejected': { bg: 'bg-rose-100', text: 'text-rose-950', border: 'border-rose-300', icon: XCircle },
  'Exchange Rejected': { bg: 'bg-rose-100', text: 'text-rose-950', border: 'border-rose-300', icon: XCircle },
  'Pickup Scheduled': { bg: 'bg-blue-50', text: 'text-blue-900', border: 'border-blue-200', icon: Truck },
  'Product Received': { bg: 'bg-indigo-50', text: 'text-indigo-900', border: 'border-indigo-200', icon: Package },
  Refunded: { bg: 'bg-emerald-100', text: 'text-emerald-950', border: 'border-emerald-300', icon: CheckCircle },
  'Exchange Dispatched': { bg: 'bg-purple-100', text: 'text-purple-950', border: 'border-purple-300', icon: Truck },
  Exchanged: { bg: 'bg-emerald-100', text: 'text-emerald-950', border: 'border-emerald-300', icon: CheckCircle }
};

export default function OrdersTab() {
  const { orders, isLoadingOrders, products = [], updateOrderStatus, updateOrderItemStatus, updateReturnExchangeStatus, resendDeliveryBoyWhatsApp, addOrder, deleteOrder, downloadSellerInvoice, sellerUser } = useSellerData();
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeOrderModal, setActiveOrderModal] = useState(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isShipModalOpen, setIsShipModalOpen] = useState(false);
  const [isCreateShipmentModalOpen, setIsCreateShipmentModalOpen] = useState(false);
  const [shippingOrderId, setShippingOrderId] = useState(null);
  const [trackingNumberInput, setTrackingNumberInput] = useState('');
  const [courierInput, setCourierInput] = useState('Shiprocket');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [shipModalDeliveryMode, setShipModalDeliveryMode] = useState('third_party');
  const [shipModalDriverName, setShipModalDriverName] = useState('');
  const [shipModalDriverPhone, setShipModalDriverPhone] = useState('');
  const [shipModalVehicleNumber, setShipModalVehicleNumber] = useState('');

  // Bulk selection state
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);

  // Modal active order status & fulfillment mode editing
  const [modalStatusInput, setModalStatusInput] = useState('Pending');
  const [modalCourierInput, setModalCourierInput] = useState('Delhivery');
  const [modalTrackingInput, setModalTrackingInput] = useState('');
  const [deliveryModeInput, setDeliveryModeInput] = useState('third_party'); // 'third_party' | 'self_delivery'
  const [modalDriverName, setModalDriverName] = useState('');
  const [modalDriverPhone, setModalDriverPhone] = useState('');
  const [modalVehicleNumber, setModalVehicleNumber] = useState('');
  const [modalSelfDeliveryToken, setModalSelfDeliveryToken] = useState('');

  // Automated WhatsApp dispatch tracking state
  const [isSavingDelivery, setIsSavingDelivery] = useState(false);
  const [isResendingWhatsApp, setIsResendingWhatsApp] = useState(false);
  const [whatsappDispatchResult, setWhatsappDispatchResult] = useState(null);

  const [returnActionState, setReturnActionState] = useState({
    showRejectInput: false,
    rejectionReason: '',
    showPickupInput: false,
    pickupDate: '',
    showRefundInput: false,
    refundTxnId: '',
    showDispatchInput: false,
    exchangeAwb: '',
    exchangeCourier: 'Shiprocket'
  });
  const [isUpdatingReturnStatus, setIsUpdatingReturnStatus] = useState(false);

  const handleReturnExchangeAction = async (orderId, targetStatus, payload = {}) => {
    if (!orderId || isUpdatingReturnStatus) return;
    setIsUpdatingReturnStatus(true);
    try {
      const res = await updateReturnExchangeStatus(orderId, {
        status: targetStatus,
        ...payload
      });
      if (res && (res.order || res.success)) {
        const updated = res.order || {};
        setActiveOrderModal(prev => prev ? {
          ...prev,
          ...updated,
          status: updated.status || targetStatus,
          overallStatus: updated.status || targetStatus,
          returnRequest: updated.returnRequest || {
            ...(prev.returnRequest || {}),
            status: targetStatus,
            ...payload
          }
        } : null);
        setReturnActionState({
          showRejectInput: false,
          rejectionReason: '',
          showPickupInput: false,
          pickupDate: '',
          showRefundInput: false,
          refundTxnId: '',
          showDispatchInput: false,
          exchangeAwb: '',
          exchangeCourier: 'Shiprocket'
        });
      }
    } catch (err) {
      console.error('Failed to handle return/exchange action:', err);
    } finally {
      setIsUpdatingReturnStatus(false);
    }
  };

  const activeModalOrderIdRef = useRef(null);

  // Sync active modal input values when activeOrderModal opens
  useEffect(() => {
    if (!activeOrderModal) {
      activeModalOrderIdRef.current = null;
      return;
    }

    const orderId = activeOrderModal.id || activeOrderModal._id || activeOrderModal.orderId;
    const isNewOrderSelection = activeModalOrderIdRef.current !== orderId;

    if (isNewOrderSelection) {
      activeModalOrderIdRef.current = orderId;
      setModalStatusInput(activeOrderModal.status || 'Pending');
      setModalCourierInput(activeOrderModal.courierName || 'Delhivery');
      setModalTrackingInput(activeOrderModal.trackingNumber || '');
      const isSelf = activeOrderModal.deliveryMode === 'self_delivery' ||
        activeOrderModal.deliveryType === 'self_delivery' ||
        activeOrderModal.deliveryType === 'self' ||
        Boolean(activeOrderModal.selfDeliveryDetails?.deliveryPersonName || activeOrderModal.selfDeliveryDetails?.deliveryPartnerToken);
      const isThird = activeOrderModal.deliveryMode === 'third_party' ||
        activeOrderModal.deliveryType === 'third_party' ||
        Boolean(activeOrderModal.courierName && activeOrderModal.courierName !== 'N/A' && activeOrderModal.courierName !== '');
      setDeliveryModeInput(isSelf ? 'self_delivery' : (isThird ? 'third_party' : 'third_party'));
      setModalDriverName(activeOrderModal.selfDeliveryDetails?.deliveryPersonName || '');
      setModalSelfDeliveryToken(
        activeOrderModal.selfDeliveryDetails?.deliveryPartnerToken ||
        `DLV-${activeOrderModal.orderId || activeOrderModal.id || Math.floor(100000 + Math.random() * 900000)}`
      );
      
      if (activeOrderModal.selfDeliveryDetails?.whatsappStatus) {
        setWhatsappDispatchResult({
          success: true,
          messageId: activeOrderModal.selfDeliveryDetails.whatsappMessageId,
          sentTo: activeOrderModal.selfDeliveryDetails.whatsappSentTo,
          sentAt: activeOrderModal.selfDeliveryDetails.whatsappSentAt
        });
      } else {
        setWhatsappDispatchResult(null);
      }
    }
  }, [activeOrderModal?.id, activeOrderModal?._id, activeOrderModal?.orderId]);

  // Manual order form
  const [manualForm, setManualForm] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    school: '',
    selectedProductId: '',
    itemName: '',
    price: 0,
    quantity: 1,
    size: 'M',
    availableSizes: ['S', 'M', 'L', 'XL'],
    shippingAddress: ''
  });

  const isItemBelongingToCurrentSeller = (item) => {
    if (!item) return false;
    if (!sellerUser || Object.keys(sellerUser).length === 0) return true;

    const candidateIds = [
      sellerUser.id,
      sellerUser._id,
      sellerUser.merchantId,
      sellerUser.sellerId,
      typeof window !== 'undefined' ? localStorage.getItem('bv_seller_id') : '',
      typeof window !== 'undefined' ? localStorage.getItem('bookvardi_seller_id') : '',
      typeof window !== 'undefined' ? localStorage.getItem('user_id') : ''
    ].filter(Boolean).map(String);

    const cleanSellerPhone = String(sellerUser.phone || sellerUser.sellerPhone || '').replace(/\D/g, '').slice(-10);
    const cleanSellerStore = String(sellerUser.storeName || sellerUser.businessName || sellerUser.name || '').trim().toLowerCase();

    const itemSellerId = String(item.sellerId?._id || item.sellerId?.id || item.sellerId || item.sellerDetails?.sellerId || item.sellerDetails?._id || '').trim();
    if (itemSellerId && candidateIds.includes(itemSellerId)) return true;

    const itemPhone = String(item.sellerPhone || item.sellerDetails?.phone || '').replace(/\D/g, '').slice(-10);
    if (cleanSellerPhone && itemPhone && itemPhone === cleanSellerPhone) return true;

    const itemStore = String(item.storeName || item.sellerStoreName || item.sellerName || item.sellerDetails?.storeName || '').trim().toLowerCase();
    if (cleanSellerStore && itemStore && (cleanSellerStore === itemStore || cleanSellerStore.includes(itemStore) || itemStore.includes(cleanSellerStore))) return true;

    const itemProdId = String(item.productId?._id || item.productId || item.id || item._id || '');
    if (itemProdId && Array.isArray(products) && products.some(p => String(p._id || p.id) === itemProdId)) {
      return true;
    }

    if (itemSellerId || itemStore) return false;

    return true;
  };

  const hasActiveReturnRequest = (order) => {
    if (!order) return false;
    const req = order.returnRequest;
    let hasReq = false;
    if (req && typeof req === 'object') {
      const type = req.requestType || req.type;
      const status = String(req.status || '').toLowerCase().trim();
      const invalidStatuses = ['', 'none', 'n/a', 'no_request', 'normal', 'null', 'undefined'];
      
      if (type && !['none', 'n/a', ''].includes(String(type).toLowerCase())) hasReq = true;
      else if (status && !invalidStatuses.includes(status)) hasReq = true;
      else if (req.requestedAt) hasReq = true;
      else if (req.reason && req.reason !== 'N/A' && req.reason.trim() !== '') hasReq = true;
    }
    const s = String(order.status || order.rawStatus || '').toLowerCase();
    const returnStatuses = [
      'return_requested', 'exchange_requested', 'return_approved', 'exchange_approved',
      'return_rejected', 'exchange_rejected', 'pickup_scheduled', 'product_received',
      'refund_initiated', 'refund_processed', 'refund_completed', 'exchanged', 'exchange_dispatched',
      'refund_requested', 'refunded'
    ];
    if (returnStatuses.includes(s)) hasReq = true;

    if (!hasReq) return false;

    // Multi-seller combine order check: Does this return/exchange belong to an item sold by the current seller?
    if (sellerUser && Array.isArray(order.items) && order.items.length > 0) {
      const reqItemId = req?.itemId;
      if (reqItemId) {
        const targetItem = order.items.find(it => String(it._id || it.id || it.productId) === String(reqItemId));
        if (targetItem) {
          return isItemBelongingToCurrentSeller(targetItem);
        }
      }
      const myItems = order.items.filter(isItemBelongingToCurrentSeller);
      if (myItems.length > 0) {
        return myItems.some(it => {
          const itSt = String(it.status || '').toLowerCase();
          return itSt.includes('return') || itSt.includes('exchange') || itSt.includes('refund');
        }) || (myItems.length === order.items.length && hasReq);
      }
    }

    return hasReq;
  };

  const isReturnExchangeOrder = (order) => {
    if (!order) return false;
    return hasActiveReturnRequest(order);
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesStatus = selectedStatus === 'All' 
        ? true 
        : selectedStatus === 'Returns & Exchanges'
        ? isReturnExchangeOrder(order)
        : order.status === selectedStatus;
      const query = (searchQuery || '').trim().toLowerCase();
      const oId = String(order.id || order.orderId || order._id || '');
      const cName = typeof order.customerName === 'object' ? String(order.customerName?.name || '') : String(order.customerName || '');
      const oSchool = String(order.school || '');
      const cPhone = String(order.customerPhone || '');
      const matchesSearch = !query ||
        oId.toLowerCase().includes(query) ||
        cName.toLowerCase().includes(query) ||
        oSchool.toLowerCase().includes(query) ||
        cPhone.toLowerCase().includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [orders, selectedStatus, searchQuery]);

  const handleOpenShipModal = (orderId) => {
    setShippingOrderId(orderId);
    const ord = orders.find(o => String(o.id || o._id) === String(orderId));
    const isSelf = ord?.deliveryMode === 'self_delivery' || ord?.deliveryType === 'self_delivery' || Boolean(ord?.selfDeliveryDetails?.deliveryPartnerToken);
    setShipModalDeliveryMode(isSelf ? 'self_delivery' : 'third_party');
    const assignedCourier = ord?.courierName && ord.courierName !== 'N/A' ? ord.courierName : 'Shiprocket';
    setCourierInput(assignedCourier);
    setTrackingNumberInput(ord?.trackingNumber || generateDynamicTrackingId(assignedCourier));
    setShipModalDriverName(ord?.selfDeliveryDetails?.deliveryPersonName || '');
    setShipModalDriverPhone(ord?.selfDeliveryDetails?.deliveryPersonPhone || '');
    setShipModalVehicleNumber(ord?.selfDeliveryDetails?.vehicleNumber || '');
    setIsShipModalOpen(true);
  };

  const handleConfirmShip = () => {
    if (shippingOrderId) {
      if (shipModalDeliveryMode === 'self_delivery') {
        if (!shipModalDriverName.trim()) {
          alert('⚠️ Please enter Driver / Delivery Person Name.');
          return;
        }
        if (!shipModalDriverPhone.trim()) {
          alert('⚠️ Please enter Driver Phone Number.');
          return;
        }
        if (!shipModalVehicleNumber.trim()) {
          alert('⚠️ Please enter Vehicle Number (e.g. UP32 AB 1234).');
          return;
        }
        const ord = orders.find(o => String(o.id || o._id) === String(shippingOrderId));
        const tokenVal = String(ord?.selfDeliveryDetails?.deliveryPartnerToken || `DLV-${Math.floor(100000 + Math.random() * 900000)}`).trim();
        const trackingLink = getDriverWebsiteUrl(tokenVal);

        updateOrderStatus(shippingOrderId, 'Shipped', {
          deliveryMode: 'self_delivery',
          deliveryType: 'self_delivery',
          courierName: '',
          trackingNumber: tokenVal,
          trackingUrl: trackingLink,
          selfDeliveryDetails: {
            deliveryPersonName: shipModalDriverName.trim(),
            deliveryPersonPhone: shipModalDriverPhone.trim(),
            vehicleNumber: shipModalVehicleNumber.trim(),
            deliveryPartnerToken: tokenVal,
            trackingUrl: trackingLink
          }
        });
      } else {
        const finalAwb = trackingNumberInput.trim() || generateDynamicTrackingId(courierInput || 'Shiprocket');
        updateOrderStatus(shippingOrderId, 'Shipped', {
          deliveryMode: 'third_party',
          deliveryType: 'third_party',
          courierName: courierInput || 'Shiprocket',
          trackingNumber: finalAwb
        });
      }
      setIsShipModalOpen(false);
      setShippingOrderId(null);
    }
  };

  const handleRegenerateFreshDeliveryLink = async () => {
    const fallbackSeed = activeOrderModal?.orderId || activeOrderModal?.id || Math.floor(100000 + Math.random() * 900000);
    const newToken = `DLV-${fallbackSeed}`;
    setModalSelfDeliveryToken(newToken);

    if (activeOrderModal?.id && modalDriverPhone?.trim()) {
      try {
        const trackingLink = getDriverWebsiteUrl(newToken);
        await updateOrderStatus(activeOrderModal.id, modalStatusInput, {
          deliveryMode: 'self_delivery',
          deliveryType: 'self_delivery',
          trackingNumber: newToken,
          trackingUrl: trackingLink,
          selfDeliveryDetails: {
            deliveryPersonName: modalDriverName.trim(),
            deliveryPersonPhone: modalDriverPhone.trim(),
            vehicleNumber: modalVehicleNumber.trim(),
            deliveryPartnerToken: newToken,
            trackingUrl: trackingLink
          }
        });
        alert(`✅ Fresh delivery token (${newToken}) generated and synced!`);
        return;
      } catch (e) {
        console.warn('Auto-save of fresh delivery token skipped:', e);
      }
    }
    alert('🔄 Fresh delivery link token generated! Click "Save Delivery Partner & Tracking Details" to save and share the new link.');
  };

  const generateSelfDeliveryDetails = (order = activeOrderModal) => {
    const tokenVal = String(
      modalSelfDeliveryToken ||
      order?.selfDeliveryDetails?.deliveryPartnerToken ||
      `DLV-${order?.orderId || order?.id || Math.floor(100000 + Math.random() * 900000)}`
    ).trim();
    const trackingLink = getDriverWebsiteUrl(tokenVal);

    return {
      deliveryPersonName: modalDriverName || order?.selfDeliveryDetails?.deliveryPersonName || '',
      deliveryPersonPhone: modalDriverPhone || order?.selfDeliveryDetails?.deliveryPersonPhone || '',
      vehicleNumber: modalVehicleNumber || order?.selfDeliveryDetails?.vehicleNumber || '',
      deliveryPartnerToken: tokenVal,
      trackingUrl: trackingLink
    };
  };

  const handleModalSaveStatus = async () => {
    if (!activeOrderModal) return;
    setIsSavingDelivery(true);
    try {
      let finalAwb = '';
      let tokenVal = '';
      let trackingLink = '';

      // Check existing lock status
      const isExistingSelf = Boolean(
        activeOrderModal.deliveryMode === 'self_delivery' ||
        activeOrderModal.deliveryType === 'self_delivery' ||
        activeOrderModal.selfDeliveryDetails?.deliveryPartnerToken ||
        activeOrderModal.selfDeliveryDetails?.deliveryPersonName
      );
      const isExistingThirdParty = Boolean(
        (activeOrderModal.deliveryMode === 'third_party' || activeOrderModal.courierName || activeOrderModal.trackingNumber) &&
        (activeOrderModal.courierName && activeOrderModal.courierName !== 'N/A' && activeOrderModal.courierName !== '')
      );

      const effectiveDeliveryMode = deliveryModeInput;
      const effectiveCourier = modalCourierInput || 'Shiprocket';

      if (effectiveDeliveryMode === 'self_delivery') {
        if (!modalDriverName.trim()) {
          alert('⚠️ Please enter Driver / Delivery Person Name.');
          setIsSavingDelivery(false);
          return;
        }
        if (!modalDriverPhone.trim()) {
          alert('⚠️ Please enter Driver Phone Number.');
          setIsSavingDelivery(false);
          return;
        }
        if (!modalVehicleNumber.trim()) {
          alert('⚠️ Please enter Vehicle Number (e.g. UP32 AB 1234).');
          setIsSavingDelivery(false);
          return;
        }
        tokenVal = String(
          modalSelfDeliveryToken ||
          activeOrderModal.selfDeliveryDetails?.deliveryPartnerToken ||
          `DLV-${activeOrderModal.orderId || activeOrderModal.id || Math.floor(100000 + Math.random() * 900000)}`
        ).trim();
        trackingLink = getDriverWebsiteUrl(tokenVal);
        finalAwb = tokenVal;
      } else if (effectiveDeliveryMode === 'third_party') {
        if (!effectiveCourier.trim()) {
          alert('⚠️ Please select or enter Courier Partner Name.');
          setIsSavingDelivery(false);
          return;
        }
        finalAwb = modalTrackingInput.trim() || generateDynamicTrackingId(effectiveCourier);
        setModalTrackingInput(finalAwb);
      }

      const sellerPayload = {
        sellerId: sellerUser?.id || sellerUser?._id || activeOrderModal.sellerDetails?.sellerId,
        storeName: sellerUser?.storeName || sellerUser?.tradeName || sellerUser?.name || activeOrderModal.sellerDetails?.storeName || 'Partner Merchant',
        sellerName: sellerUser?.name || sellerUser?.ownerFullName || sellerUser?.storeName || activeOrderModal.sellerDetails?.sellerName || 'Partner Merchant',
        phone: sellerUser?.phone || sellerUser?.sellerPhone || activeOrderModal.sellerDetails?.phone || '',
        email: sellerUser?.email || sellerUser?.sellerEmail || activeOrderModal.sellerDetails?.email || '',
        address: sellerUser?.address || sellerUser?.registeredAddress || activeOrderModal.sellerDetails?.address || '',
        city: sellerUser?.city || activeOrderModal.sellerDetails?.city || ''
      };

      const lowerCourier = effectiveCourier.toLowerCase().trim();
      const carrierUrl = effectiveDeliveryMode === 'third_party' && finalAwb ? (
        lowerCourier.includes('bluedart') ? `https://www.bluedart.com/tracking?awb=${finalAwb}` :
        lowerCourier.includes('delhivery') ? `https://www.delhivery.com/track/package/${finalAwb}` :
        lowerCourier.includes('dtdc') ? `https://www.dtdc.in/tracking/shipment-tracking.asp?awb=${finalAwb}` :
        lowerCourier.includes('ekart') ? `https://ekartlogistics.com/shipmenttrack/${finalAwb}` :
        lowerCourier.includes('fedex') ? `https://www.fedex.com/fedextrack/?trknbr=${finalAwb}` :
        lowerCourier.includes('shadowfax') ? `https://track.shadowfax.in/track?tracking_id=${finalAwb}` :
        lowerCourier.includes('xpressbees') ? `https://www.xpressbees.com/track?shipment_id=${finalAwb}` :
        lowerCourier.includes('indiapost') || lowerCourier.includes('speedpost') ? `https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx?consignmentNo=${finalAwb}` :
        `https://track.shiprocket.in/tracking/${finalAwb}`
      ) : '';

      const details = {
        courierName: effectiveDeliveryMode === 'third_party' ? effectiveCourier : '',
        trackingNumber: finalAwb,
        trackingUrl: effectiveDeliveryMode === 'self_delivery' ? trackingLink : carrierUrl,
        deliveryMode: effectiveDeliveryMode,
        deliveryType: effectiveDeliveryMode,
        sellerDetails: sellerPayload,
        selfDeliveryDetails: effectiveDeliveryMode === 'self_delivery'
          ? {
              deliveryPersonName: modalDriverName.trim(),
              deliveryPersonPhone: modalDriverPhone.trim(),
              vehicleNumber: modalVehicleNumber.trim(),
              deliveryPartnerToken: tokenVal,
              trackingUrl: trackingLink
            }
          : undefined
      };

      // If self-delivery, prepare WhatsApp URL and open tab immediately on click to prevent pop-up blocker
      let waUrl = '';
      if (deliveryModeInput === 'self_delivery' && modalDriverPhone.trim()) {
        const waMsg = generateRiderWhatsAppMessage({
          order: activeOrderModal,
          driverName: modalDriverName.trim(),
          vehicleNumber: modalVehicleNumber.trim(),
          trackingLink
        });
        waUrl = buildRiderWhatsAppUrl({ phone: modalDriverPhone, message: waMsg });
        if (waUrl) {
          try {
            window.open(waUrl, '_blank', 'noopener,noreferrer');
          } catch (e) {
            console.warn('Could not open WhatsApp tab automatically:', e);
          }
        }
      }

      const res = await updateOrderStatus(activeOrderModal.id, modalStatusInput, details);
      const serverSelfDetails = res?.order?.selfDeliveryDetails || details.selfDeliveryDetails || activeOrderModal.selfDeliveryDetails;

      if (res?.whatsappDispatch) {
        setWhatsappDispatchResult(res.whatsappDispatch);
      } else if (serverSelfDetails?.whatsappStatus) {
        setWhatsappDispatchResult({
          success: true,
          messageId: serverSelfDetails.whatsappMessageId,
          sentTo: serverSelfDetails.whatsappSentTo,
          sentAt: serverSelfDetails.whatsappSentAt
        });
      }

      setActiveOrderModal(prev => prev ? {
        ...prev,
        status: modalStatusInput,
        overallStatus: modalStatusInput,
        items: Array.isArray(prev.items) ? prev.items.map(it => ({
          ...it,
          status: (!it.status || ['pending', 'placed', 'unconfirmed'].includes(String(it.status).toLowerCase().trim())) ? modalStatusInput : it.status
        })) : prev.items,
        deliveryMode: deliveryModeInput,
        deliveryType: deliveryModeInput,
        courierName: deliveryModeInput === 'third_party' ? modalCourierInput : '',
        trackingNumber: deliveryModeInput === 'third_party' ? modalTrackingInput.trim() : tokenVal,
        trackingUrl: deliveryModeInput === 'self_delivery' ? trackingLink : carrierUrl,
        sellerDetails: sellerPayload,
        selfDeliveryDetails: deliveryModeInput === 'self_delivery' ? serverSelfDetails : undefined
      } : null);

      if (deliveryModeInput === 'self_delivery') {
        alert(`✅ Order #${activeOrderModal.id} delivery details saved successfully!\n\n📲 WhatsApp has been opened in a new tab to send instructions & tracking link to ${modalDriverPhone}.\nReview and click Send in WhatsApp!`);
      } else {
        alert(`✅ Order #${activeOrderModal.id} status and delivery details saved successfully!`);
      }
    } finally {
      setIsSavingDelivery(false);
    }
  };

  const handleResendDeliveryWhatsApp = async () => {
    if (!activeOrderModal?.id || !modalDriverPhone.trim()) {
      alert('⚠️ No delivery partner phone number found to send WhatsApp message.');
      return;
    }
    const tokenVal = String(modalSelfDeliveryToken || activeOrderModal.selfDeliveryDetails?.deliveryPartnerToken || `DLV-${activeOrderModal.id}`).trim();
    const trackingLink = getDriverWebsiteUrl(tokenVal);

    const waMsg = generateRiderWhatsAppMessage({
      order: activeOrderModal,
      driverName: modalDriverName.trim(),
      vehicleNumber: modalVehicleNumber.trim(),
      trackingLink
    });
    const waUrl = buildRiderWhatsAppUrl({ phone: modalDriverPhone, message: waMsg });
    if (waUrl) {
      window.open(waUrl, '_blank', 'noopener,noreferrer');
    }
    setIsResendingWhatsApp(true);
    try {
      await resendDeliveryBoyWhatsApp(activeOrderModal.id);
    } catch (err) {
      console.warn('Backend resend log:', err);
    } finally {
      setIsResendingWhatsApp(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedOrderIds.length === filteredOrders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(filteredOrders.map(o => o.id));
    }
  };

  const toggleSelectOrder = (id) => {
    setSelectedOrderIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBulkStatusUpdate = (status) => {
    if (selectedOrderIds.length === 0) return;
    selectedOrderIds.forEach(id => {
      updateOrderStatus(id, status);
    });
    setSelectedOrderIds([]);
  };

  const handleProductSelect = (productId) => {
    const selectedProd = products.find(p => String(p.id || p._id) === String(productId));
    if (selectedProd) {
      const sizes = selectedProd.sizes && selectedProd.sizes.length > 0 ? selectedProd.sizes : ['S', 'M', 'L', 'XL'];
      setManualForm(prev => ({
        ...prev,
        selectedProductId: productId,
        itemName: selectedProd.name,
        price: selectedProd.price,
        size: sizes[0] || 'M',
        availableSizes: sizes
      }));
    } else {
      setManualForm(prev => ({
        ...prev,
        selectedProductId: '',
        itemName: '',
        price: 0,
        availableSizes: ['S', 'M', 'L', 'XL']
      }));
    }
  };

  const handleQuantityChange = (delta) => {
    setManualForm(prev => ({
      ...prev,
      quantity: Math.max(1, (Number(prev.quantity) || 1) + delta)
    }));
  };

  const handleCreateManualOrder = (e) => {
    e.preventDefault();
    if (!manualForm.customerName.trim() || !manualForm.price) return;

    addOrder({
      customerName: manualForm.customerName.trim(),
      customerEmail: manualForm.customerEmail || 'counter@store.com',
      customerPhone: manualForm.customerPhone || '+91 98000 00000',
      school: manualForm.school || 'Counter Sale',
      total: Number(manualForm.price) * Number(manualForm.quantity),
      status: 'Pending',
      paymentMethod: 'Cash / Counter',
      paymentStatus: 'Paid',
      shippingAddress: manualForm.shippingAddress || 'Store / Counter Pickup',
      items: [
        {
          id: Date.now(),
          name: manualForm.itemName || 'Store Item',
          price: Number(manualForm.price),
          quantity: Number(manualForm.quantity),
          size: manualForm.size
        }
      ]
    });

    setIsCreateModalOpen(false);
    setManualForm({
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      school: '',
      selectedProductId: '',
      itemName: '',
      price: 0,
      quantity: 1,
      size: 'M',
      availableSizes: ['S', 'M', 'L', 'XL'],
      shippingAddress: ''
    });
  };


  return (
    <div className="space-y-6">
      
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-xs border border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <ShoppingBag className="text-teal-700" size={24} /> Customer Orders
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage student & parent orders, update delivery status, and confirm shipments
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <Plus size={16} /> Create Manual Order
        </button>
      </div>

      {/* KPI Status Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-3">
        {['All', 'Pending', 'Confirmed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Returns & Exchanges', 'Cancelled'].map((st) => {
          const count = st === 'All' 
            ? orders.length 
            : st === 'Returns & Exchanges'
            ? orders.filter(o => isReturnExchangeOrder(o)).length
            : orders.filter(o => o.status === st).length;
          const isSelected = selectedStatus === st;
          return (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                isSelected
                  ? 'bg-teal-800 text-white border-teal-800 shadow-xs'
                  : 'bg-white text-gray-700 border-gray-100 hover:border-gray-200'
              }`}
            >
              <div className="text-[11px] font-medium opacity-80">{st}</div>
              <div className="text-xl font-extrabold mt-1">{count}</div>
            </button>
          );
        })}
      </div>

      {/* Search & Filter */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-100">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by Order ID (e.g. ORD-2026), Customer Name, Phone, or School..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-teal-600"
          />
        </div>
      </div>

      {/* Bulk Status Update Bar */}
      {selectedOrderIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between p-3.5 bg-teal-50 border border-teal-200 rounded-2xl animate-in fade-in duration-150 gap-2">
          <span className="text-xs font-bold text-teal-950">
            {selectedOrderIds.length} order(s) selected
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium text-teal-800 mr-1">Bulk Change Status:</span>
            {['Confirmed', 'Packed', 'Shipped', 'Delivered', 'Cancelled'].map((st) => (
              <button
                key={st}
                onClick={() => handleBulkStatusUpdate(st)}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-teal-300 text-teal-900 hover:bg-teal-700 hover:text-white transition-colors shadow-2xs cursor-pointer"
              >
                Mark {st}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Orders List / Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-600 uppercase font-semibold tracking-wider border-b border-gray-100">
              <tr>
                <th className="py-3 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={filteredOrders.length > 0 && selectedOrderIds.length === filteredOrders.length}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-4">Order ID & Date</th>
                <th className="py-3 px-3">Customer & School</th>
                <th className="py-3 px-3">Items</th>
                <th className="py-3 px-3">Total Amount</th>
                <th className="py-3 px-3">Update Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoadingOrders && orders.length === 0 ? (
                [...Array(6)].map((_, i) => (
                  <tr key={`seller-skel-${i}`} className="animate-pulse border-b border-gray-100">
                    <td className="py-3.5 px-3 text-center"><div className="w-4 h-4 bg-gray-200 rounded mx-auto"></div></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-gray-200 rounded w-20 mb-1"></div><div className="h-3 bg-gray-100 rounded w-16"></div></td>
                    <td className="py-3.5 px-3"><div className="h-4 bg-gray-200 rounded w-28 mb-1"></div><div className="h-3 bg-gray-100 rounded w-20"></div></td>
                    <td className="py-3.5 px-3"><div className="h-4 bg-gray-200 rounded w-24 mb-1"></div><div className="h-3 bg-gray-100 rounded w-16"></div></td>
                    <td className="py-3.5 px-3"><div className="h-4 bg-gray-200 rounded w-16 mb-1"></div><div className="h-3 bg-gray-100 rounded w-12"></div></td>
                    <td className="py-3.5 px-3"><div className="h-7 bg-gray-200 rounded-lg w-28"></div></td>
                    <td className="py-3.5 px-4 text-right"><div className="h-8 bg-gray-200 rounded-lg w-24 ml-auto"></div></td>
                  </tr>
                ))
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-14 text-center text-gray-500">
                    <ShoppingBag size={44} className="mx-auto text-gray-300 mb-3" />
                    <h4 className="font-extrabold text-base text-gray-900 mb-1">No Orders Found</h4>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
                      Customer orders placed on the Book Vardi marketplace will appear here automatically. You can also log manual store sales.
                    </p>
                    <button
                      onClick={() => setIsCreateModalOpen(true)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-teal hover:bg-brand-teal-light text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer"
                    >
                      <Plus size={16} /> Create Manual Store Order
                    </button>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o, idx) => {
                  const conf = STATUS_CONFIG[o.status] || STATUS_CONFIG.Pending;
                  const Icon = conf.icon;
                  const isChecked = selectedOrderIds.includes(o.id);

                  return (
                    <tr key={o.id || o._id || o.orderId || (`ord-${idx}`)} className={`hover:bg-gray-50/70 transition-colors ${isChecked ? 'bg-teal-50/30' : ''}`}>
                      
                      {/* Checkbox */}
                      <td className="py-3.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectOrder(o.id)}
                          className="rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                        />
                      </td>

                      {/* ID & Date */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-gray-900 font-mono">{formatDisplayOrderId(o.orderId || o.id)}</div>
                        <div className="text-[11px] text-gray-500 mt-0.5">{o.date}</div>
                        <div className="flex flex-wrap items-center gap-1 mt-1">
                          <span className="text-[10px] text-gray-500">{o.paymentMethod}</span>
                          {(o.deliveryMode === 'self_delivery' || o.deliveryType === 'self_delivery' || Boolean(o.selfDeliveryDetails?.deliveryPersonName || o.selfDeliveryDetails?.deliveryPartnerToken)) ? (
                            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-teal-100 text-teal-800">
                              🛵 Self-Delivery
                            </span>
                          ) : (o.courierName && o.courierName !== 'N/A' && o.courierName !== '') ? (
                            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                              🚚 {o.courierName}
                            </span>
                          ) : (
                            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                              ⏳ Delivery Pending Choice
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-gray-900">{o.customerName}</div>
                        <div className="text-[11px] text-teal-800 mt-0.5">{o.school}</div>
                        <div className="text-[10px] font-mono text-gray-600 font-bold">{maskPhoneNumber(o.customerPhone)}</div>
                      </td>

                      {/* Items */}
                      <td className="py-3.5 px-3">
                        <div className="font-medium text-gray-800">
                          {o.items?.length > 0 ? o.items[0].name : `${o.itemsCount || 1} item(s)`}
                        </div>
                        {o.items?.length > 1 && (
                          <div className="text-[10px] text-gray-500 mt-0.5">
                            +{o.items.length - 1} other item(s)
                          </div>
                        )}
                      </td>

                      {/* Total */}
                      <td className="py-3.5 px-3">
                        <div className="font-extrabold text-gray-900 text-sm">₹{o.total}</div>
                        {(() => {
                          const isDelivered = String(o.status || '').toLowerCase().includes('delivered') || String(o.overallStatus || '').toLowerCase().includes('delivered');
                          const isPaid = String(o.paymentStatus || '').toLowerCase() === 'paid' || isDelivered;
                          return (
                            <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded ${
                              isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {isPaid ? 'Paid' : (o.paymentStatus || 'Pending')}
                            </span>
                          );
                        })()}
                      </td>

                      {/* Interactive Status Selector */}
                      <td className="py-3.5 px-3">
                        <div className="flex flex-col gap-1">
                          {isReturnExchangeOrder(o) ? (
                            /* Return/Exchange orders: lock the inline dropdown and redirect to detail modal */
                            <div className="flex flex-col gap-1">
                              <div className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${conf.bg} ${conf.text} ${conf.border}`}>
                                {o.status?.replace(/_/g, ' ') || 'Return/Exchange'}
                              </div>
                              <button
                                type="button"
                                onClick={() => setActiveOrderModal(o)}
                                className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg hover:bg-amber-100 cursor-pointer transition-colors text-left"
                                title="Return & Exchange orders must be managed through the order detail panel to ensure proper approval workflow"
                              >
                                🔄 Manage via Details →
                              </button>
                            </div>
                          ) : (
                          <select
                            value={o.status || 'Pending'}
                            onChange={(e) => updateOrderStatus(o.id, e.target.value)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border cursor-pointer focus:outline-none focus:ring-1 focus:ring-teal-500 ${conf.bg} ${conf.text} ${conf.border}`}
                          >
                            <option value="Pending">🕒 Pending</option>
                            <option value="Confirmed">✅ Confirmed</option>
                            <option value="Processing">⚙️ Processing</option>
                            <option value="Packed">📦 Packed</option>
                            <option value="Shipped">🚚 Shipped</option>
                            <option value="Out for Delivery">🛵 Out for Delivery</option>
                            <option value="Delivered">🎉 Delivered</option>
                            <option value="Cancelled">❌ Cancelled</option>
                            {o.status && !['Pending', 'Confirmed', 'Processing', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'].includes(o.status) && (
                              <option value={o.status}>{o.status}</option>
                            )}
                          </select>
                          )}
                          {(o.status === 'Cancelled' || o.cancellationReason) && (
                            <span className="text-[9px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 truncate max-w-[130px]" title={`Cancelled by ${o.cancelledBy || 'Customer'}. Reason: ${o.cancellationReason || 'Customer requested cancellation'}`}>
                              Reason: {o.cancellationReason || 'Cancelled'}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Action buttons */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          
                          <button
                            onClick={() => setActiveOrderModal(o)}
                            className="p-1.5 text-gray-500 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                            title="View Full Order Details & Edit Status"
                          >
                            <Eye size={15} />
                          </button>

                          {o.status === 'Pending' && (
                            <button
                              onClick={() => updateOrderStatus(o.id, 'Confirmed')}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold rounded-lg shadow-xs cursor-pointer"
                            >
                              Confirm
                            </button>
                          )}

                          {o.status === 'Confirmed' && (
                            <button
                              onClick={() => handleOpenShipModal(o.id)}
                              className="px-2.5 py-1 bg-purple-700 hover:bg-purple-800 text-white text-[11px] font-semibold rounded-lg shadow-xs flex items-center gap-1 cursor-pointer"
                            >
                              <Truck size={12} /> Pack & Ship
                            </button>
                          )}

                          {o.status === 'Shipped' && (
                            <button
                              onClick={() => updateOrderStatus(o.id, 'Delivered')}
                              className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-semibold rounded-lg shadow-xs cursor-pointer"
                            >
                              Mark Delivered
                            </button>
                          )}

                          {o.status !== 'Cancelled' && o.status !== 'Delivered' && (
                            <button
                              onClick={() => updateOrderStatus(o.id, 'Cancelled')}
                              className="px-2 py-1 text-gray-400 hover:text-rose-600 text-[11px] rounded-lg hover:bg-rose-50 cursor-pointer"
                              title="Cancel Order"
                            >
                              Cancel
                            </button>
                          )}

                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details & Status Update Modal */}
      {activeOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200 text-xs my-8">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/70">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-gray-900 text-base">Order ID: {formatDisplayOrderId(activeOrderModal.orderId || activeOrderModal.id)}</h3>
                  <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border ${STATUS_CONFIG[activeOrderModal.status]?.bg || 'bg-gray-100'} ${STATUS_CONFIG[activeOrderModal.status]?.text || 'text-gray-800'} ${STATUS_CONFIG[activeOrderModal.status]?.border || 'border-gray-200'}`}>
                    {activeOrderModal.status}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 mt-0.5">Placed on {activeOrderModal.date}</p>
              </div>

              <div className="flex items-center gap-2">
                {(() => {
                  const modalStatus = String(activeOrderModal.status || activeOrderModal.overallStatus || '').toLowerCase().trim();
                  const hasPendingItems = Array.isArray(activeOrderModal.items) && activeOrderModal.items.length > 0 && activeOrderModal.items.some(it => {
                    const itStatus = String(it.status || '').toLowerCase().trim().replace(/[\s-]+/g, '_');
                    return !itStatus || ['pending', 'placed', 'unconfirmed', 'draft'].includes(itStatus);
                  });
                  const isConfirmedOrder = modalStatus && !['pending', 'placed', 'unconfirmed', 'draft', ''].includes(modalStatus) && !hasPendingItems;
                  const isLocked = !isConfirmedOrder;

                  return (
                    <button
                      onClick={() => setIsInvoiceModalOpen(true)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 font-bold rounded-xl transition-colors cursor-pointer text-xs ${
                        isLocked
                          ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200'
                      }`}
                      title={isLocked ? "Invoice locked while order status is pending confirmation" : "View & Print GST Tax Invoice & Packing Slip"}
                    >
                      {isLocked ? <Lock size={14} /> : <FileText size={14} />}
                      <span>{isLocked ? 'Invoice Locked (Pending)' : 'Tax Invoice & Label'}</span>
                    </button>
                  );
                })()}

                {/* Statutory Invoicing: Exchange gets Exchange Tax Invoice ONLY; Returns/Refunds get Credit Note */}
                {(() => {
                  const retType = String(activeOrderModal.returnRequest?.type || activeOrderModal.returnRequest?.requestType || '').toLowerCase();
                  const isOrderExchange = retType === 'exchange' || String(activeOrderModal.status).toLowerCase().includes('exchange');
                  const isReturnOrRefund = !isOrderExchange && (
                    activeOrderModal.paymentStatus?.toLowerCase() === 'refunded' ||
                    activeOrderModal.status?.toLowerCase().includes('refund') ||
                    activeOrderModal.returnRequest?.status?.toLowerCase().includes('refund') ||
                    (activeOrderModal.status === 'product_received' && retType === 'return')
                  );

                  return (
                    <>
                      {isReturnOrRefund && (
                        <a
                          href={`${SERVER_URL}/orders/${activeOrderModal.id || activeOrderModal._id}/credit-note`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 font-bold rounded-xl transition-colors cursor-pointer text-xs bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200"
                          title="Download GST Credit Note under Section 34 of CGST Act"
                        >
                          <FileText size={14} />
                          <span>GST Credit Note</span>
                        </a>
                      )}
                      {isOrderExchange && (
                        <a
                          href={`${SERVER_URL}/orders/${activeOrderModal.id || activeOrderModal._id}/exchange-invoice`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 font-bold rounded-xl transition-colors cursor-pointer text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200"
                          title="Download GST Replacement / Exchange Tax Invoice"
                        >
                          <FileText size={14} />
                          <span>Exchange Tax Invoice</span>
                        </a>
                      )}
                    </>
                  );
                })()}

                <button
                  onClick={() => setActiveOrderModal(null)}
                  className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5 max-h-[78vh] overflow-y-auto">

              {/* Customer Cancellation Alert Card */}
              {(activeOrderModal.status === 'Cancelled' || activeOrderModal.cancellationReason || activeOrderModal.cancelledBy) && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 space-y-2 shadow-xs">
                  <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider text-rose-700">
                    <XCircle size={16} />
                    <span>Order Cancelled by Customer</span>
                  </div>
                  <div className="p-3 bg-white/80 rounded-xl border border-rose-100 text-xs text-rose-900 space-y-1">
                    <p><strong>Cancelled By:</strong> <span className="font-semibold text-gray-900">{activeOrderModal.cancelledBy || activeOrderModal.customerName || 'Customer'}</span></p>
                    <p><strong>Cancellation Reason:</strong> <span className="font-semibold text-gray-900">{activeOrderModal.cancellationReason || 'Cancelled by customer'}</span></p>
                    {activeOrderModal.cancelledAt && (
                      <p className="text-[11px] text-gray-500">
                        <strong>Cancelled On:</strong> {new Date(activeOrderModal.cancelledAt).toLocaleString('en-IN')}
                      </p>
                    )}
                  </div>
                  {activeOrderModal.refundStatus && (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950 text-xs flex items-center gap-2">
                      <CreditCard size={15} className="text-emerald-700 shrink-0" />
                      <div>
                        <strong className="font-black text-emerald-900">Refund Status: </strong>
                        <span className="font-semibold">{activeOrderModal.refundStatus}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Customer Return & Exchange Request Card */}
              {hasActiveReturnRequest(activeOrderModal) && (
                <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-950 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between border-b border-amber-200/80 pb-2">
                    <span className="font-extrabold text-xs uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                      <RefreshCw size={15} className="text-amber-700" />
                      {activeOrderModal.returnRequest?.requestType === 'exchange' || activeOrderModal.returnRequest?.type === 'exchange' || String(activeOrderModal.status).toLowerCase().includes('exchange')
                        ? '🔄 Product Exchange Request'
                        : '📦 Product Return & Refund Request'}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-200 text-amber-950 border border-amber-300">
                      Status: {(activeOrderModal.returnRequest?.status && activeOrderModal.returnRequest.status !== 'no_request') ? activeOrderModal.returnRequest.status.replace(/_/g, ' ') : activeOrderModal.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {Boolean(activeOrderModal.returnRequest?.type === 'exchange' || String(activeOrderModal.status).toLowerCase().includes('exchange')) && (
                      <div className="col-span-1 sm:col-span-2 p-3.5 bg-gradient-to-r from-purple-50 via-indigo-50 to-teal-50 border border-purple-200 rounded-xl space-y-2">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <span className="font-extrabold text-xs uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
                            <span>🔄</span> Exchange Items & Financial Action
                          </span>
                          {activeOrderModal.returnRequest?.priceAdjustmentType === 'extra_payment' && (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase bg-amber-200 text-amber-950 border border-amber-300">
                              💰 Collect Extra: +₹{activeOrderModal.returnRequest.priceDifference}
                            </span>
                          )}
                          {activeOrderModal.returnRequest?.priceAdjustmentType === 'partial_refund' && (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase bg-emerald-200 text-emerald-950 border border-emerald-300">
                              💸 Refund Customer: ₹{Math.abs(activeOrderModal.returnRequest.priceDifference)}
                            </span>
                          )}
                          {activeOrderModal.returnRequest?.priceAdjustmentType === 'none' && (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase bg-blue-200 text-blue-950 border border-blue-300">
                              ⚖️ Equal Value (₹0)
                            </span>
                          )}
                        </div>

                        {(() => {
                          const targetReturnItem = (activeOrderModal.items || []).find(it => 
                            (activeOrderModal.returnRequest?.itemId && String(it._id || it.id || it.productId) === String(activeOrderModal.returnRequest.itemId)) ||
                            (activeOrderModal.returnRequest?.itemName && it.name === activeOrderModal.returnRequest.itemName)
                          ) || activeOrderModal.items?.[0] || {};

                          return (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                              <div className="bg-white p-2.5 rounded-lg border border-purple-100">
                                <span className="text-[10px] font-bold uppercase text-purple-600 block">Original Item to Collect:</span>
                                <strong className="text-gray-900">{activeOrderModal.returnRequest?.itemName || targetReturnItem?.name}</strong>
                                <div className="text-[11px] text-gray-600 mt-0.5 font-mono">
                                  Spec: {targetReturnItem?.size ? `Size ${targetReturnItem.size}` : (activeOrderModal.returnRequest?.isMeterBased ? `${targetReturnItem?.quantity}m` : 'Base Item')} • Price: ₹{activeOrderModal.returnRequest?.originalItemPrice || targetReturnItem?.finalPrice || targetReturnItem?.price || 0}
                                </div>
                              </div>

                              <div className="bg-white p-2.5 rounded-lg border border-purple-100">
                                <span className="text-[10px] font-bold uppercase text-indigo-600 block">Replacement Item to Send:</span>
                                <strong className="text-gray-900">{activeOrderModal.returnRequest?.itemName || targetReturnItem?.name}</strong>
                                <div className="text-[11px] text-indigo-900 font-extrabold mt-0.5 font-mono">
                                  Requested: {activeOrderModal.returnRequest?.exchangeLength ? `${activeOrderModal.returnRequest.exchangeLength} Meter(s)` : (activeOrderModal.returnRequest?.exchangeSize || 'Replacement')} • Price: ₹{activeOrderModal.returnRequest?.replacementItemPrice || activeOrderModal.returnRequest?.originalItemPrice || targetReturnItem?.finalPrice || targetReturnItem?.price || 0}
                                </div>
                              </div>
                            </div>
                          );
                        })()}

                        <div className="text-[11px] rounded-lg p-2 bg-white/80 border border-purple-100 font-semibold text-purple-950">
                          {activeOrderModal.returnRequest?.priceAdjustmentType === 'extra_payment' ? (
                            <span>⚠️ <strong>Delivery Boy Instruction:</strong> Rider must collect <strong>₹{activeOrderModal.returnRequest.priceDifference} in cash or UPI</strong> from the customer before completing exchange delivery.</span>
                          ) : activeOrderModal.returnRequest?.priceAdjustmentType === 'partial_refund' ? (
                            <span>✅ <strong>Delivery Boy Instruction:</strong> Rider collects <strong>₹0</strong>. Partial refund of ₹{Math.abs(activeOrderModal.returnRequest.priceDifference)} is paid directly to customer's account.</span>
                          ) : (
                            <span>✅ <strong>Delivery Boy Instruction:</strong> Rider collects <strong>₹0</strong> (Equal price exchange).</span>
                          )}
                        </div>
                      </div>
                    )}
                    <div className="p-3 bg-white/90 rounded-xl border border-amber-100 space-y-1">
                      <p><strong>Request Type:</strong> <span className="font-bold text-gray-900 capitalize">{activeOrderModal.returnRequest?.requestType || activeOrderModal.returnRequest?.type || (String(activeOrderModal.status).toLowerCase().includes('exchange') ? 'Exchange' : 'Return')}</span></p>
                      {activeOrderModal.returnRequest?.reason && (
                        <p><strong>Reason:</strong> <span className="font-bold text-gray-900">{activeOrderModal.returnRequest.reason}</span></p>
                      )}
                      {activeOrderModal.returnRequest?.comment && (
                        <p><strong>Comments:</strong> <span className="text-gray-800 italic">"{activeOrderModal.returnRequest.comment}"</span></p>
                      )}
                      {(activeOrderModal.returnRequest?.exchangeSize || activeOrderModal.returnRequest?.exchangeLength) && (
                        <p>
                          <strong>
                            {activeOrderModal.returnRequest?.isMeterBased || activeOrderModal.returnRequest?.exchangeLength
                              ? 'Requested Length:'
                              : String(activeOrderModal.returnRequest.exchangeSize || '').toLowerCase().includes('kids')
                              ? 'Requested Shoe Size:'
                              : String(activeOrderModal.returnRequest.exchangeSize || '').toLowerCase().includes('line') || String(activeOrderModal.returnRequest.exchangeSize || '').toLowerCase().includes('pack') || String(activeOrderModal.returnRequest.exchangeSize || '').toLowerCase().includes('class') || String(activeOrderModal.returnRequest.exchangeSize || '').toLowerCase().includes('replacement')
                              ? 'Requested Variant:'
                              : 'Requested Size:'}
                          </strong>{' '}
                          <span className="font-extrabold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                            {activeOrderModal.returnRequest?.exchangeLength
                              ? `${activeOrderModal.returnRequest.exchangeLength} Meter(s)`
                              : activeOrderModal.returnRequest?.exchangeSize}
                          </span>
                          {activeOrderModal.returnRequest?.priceAdjustmentType === 'extra_payment' && (
                            <span className="ml-1 text-[11px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                              +₹{activeOrderModal.returnRequest.priceDifference} Extra
                            </span>
                          )}
                          {activeOrderModal.returnRequest?.priceAdjustmentType === 'partial_refund' && (
                            <span className="ml-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                              ₹{Math.abs(activeOrderModal.returnRequest.priceDifference)} Refund
                            </span>
                          )}
                        </p>
                      )}
                      {activeOrderModal.returnRequest?.exchangeColor && (
                        <p><strong>Requested Color:</strong> <span className="font-bold text-gray-900">{activeOrderModal.returnRequest.exchangeColor}</span></p>
                      )}
                    </div>

                    <div className="p-3 bg-white/90 rounded-xl border border-amber-100 space-y-1">
                      <p className="font-bold text-gray-900 flex items-center gap-1">
                        <CreditCard size={13} className="text-teal-700" /> Refund Account Details:
                      </p>
                      {activeOrderModal.returnRequest?.refundDetails?.upiId || activeOrderModal.refundDetails?.upiId ? (
                        <p><strong>UPI ID:</strong> <span className="font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded">{activeOrderModal.returnRequest?.refundDetails?.upiId || activeOrderModal.refundDetails?.upiId}</span></p>
                      ) : activeOrderModal.returnRequest?.refundDetails?.bankName || activeOrderModal.refundDetails?.bankName ? (
                        <>
                          <p><strong>Bank:</strong> {activeOrderModal.returnRequest?.refundDetails?.bankName || activeOrderModal.refundDetails?.bankName}</p>
                          <p><strong>A/C:</strong> {activeOrderModal.returnRequest?.refundDetails?.accountNumber || activeOrderModal.refundDetails?.accountNumber}</p>
                          <p><strong>IFSC:</strong> {activeOrderModal.returnRequest?.refundDetails?.ifscCode || activeOrderModal.refundDetails?.ifscCode}</p>
                        </>
                      ) : (
                        <p className="text-gray-500 italic">Original Payment Method (UPI/Online Auto-Refund)</p>
                      )}
                      {activeOrderModal.returnRequest?.refundTxnId && (
                        <p className="text-emerald-800 font-bold"><strong>Refund TXN ID:</strong> {activeOrderModal.returnRequest.refundTxnId}</p>
                      )}
                      {activeOrderModal.returnRequest?.rejectionReason && (
                        <p className="text-rose-700 font-bold"><strong>Rejection Reason:</strong> {activeOrderModal.returnRequest.rejectionReason}</p>
                      )}
                    </div>
                  </div>

                  {/* Return / Exchange Action Controls */}
                  <div className="pt-2 border-t border-amber-200/80 space-y-2">
                    <div className="text-[11px] font-bold text-amber-900">Manage Request Workflow:</div>
                    {(() => {
                      const retReq = activeOrderModal.returnRequest || {};
                      const retStatus = String(retReq.status || activeOrderModal.status || '').toLowerCase().trim();
                      const retType = String(retReq.type || retReq.requestType || (retStatus.includes('exchange') ? 'exchange' : 'return')).toLowerCase().trim();
                      const isExchange = retType === 'exchange';
                      const isReturn = retType === 'return';

                      const isRequested = ['requested', 'return_requested', 'exchange_requested'].includes(retStatus);
                      const isApproved = ['approved', 'return_approved', 'exchange_approved'].includes(retStatus);
                      const isPickupScheduled = retStatus === 'pickup_scheduled';
                      const isProductReceived = ['product_received', 'product_return_received'].includes(retStatus);
                      const isExchangeDispatched = retStatus === 'exchange_dispatched';
                      const isCompleted = ['refund_completed', 'refunded', 'exchanged'].includes(retStatus);

                      return (
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            {isRequested && (
                              <>
                                <button
                                  type="button"
                                  disabled={isUpdatingReturnStatus}
                                  onClick={() => handleReturnExchangeAction(activeOrderModal.id, isExchange ? 'exchange_approved' : 'return_approved')}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-extrabold text-[11px] rounded-lg shadow-2xs transition-colors cursor-pointer"
                                >
                                  {isUpdatingReturnStatus ? '⏳ Processing...' : `✓ Approve ${isExchange ? 'Exchange' : 'Return'}`}
                                </button>
                                <button
                                  type="button"
                                  disabled={isUpdatingReturnStatus}
                                  onClick={() => setReturnActionState(prev => ({ ...prev, showRejectInput: !prev.showRejectInput }))}
                                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-extrabold text-[11px] rounded-lg shadow-2xs transition-colors cursor-pointer"
                                >
                                  ✕ Reject Request
                                </button>
                              </>
                            )}

                            {isApproved && (
                              <button
                                type="button"
                                disabled={isUpdatingReturnStatus}
                                onClick={() => setReturnActionState(prev => ({ ...prev, showPickupInput: !prev.showPickupInput }))}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-extrabold text-[11px] rounded-lg shadow-2xs transition-colors cursor-pointer"
                              >
                                📦 Schedule Pickup
                              </button>
                            )}

                            {isPickupScheduled && (
                              <button
                                type="button"
                                disabled={isUpdatingReturnStatus}
                                onClick={() => handleReturnExchangeAction(activeOrderModal.id, 'product_received', { notes: 'Item received back & stock auto-restored' })}
                                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-extrabold text-[11px] rounded-lg shadow-2xs transition-colors cursor-pointer"
                                title="Mark item received & automatically restore inventory stock"
                              >
                                {isUpdatingReturnStatus ? '⏳ Restoring Stock...' : '📥 Mark Product Received (Auto-Restores Stock)'}
                              </button>
                            )}

                            {isProductReceived && isReturn && (
                              <button
                                type="button"
                                disabled={isUpdatingReturnStatus}
                                onClick={() => setReturnActionState(prev => ({ ...prev, showRefundInput: !prev.showRefundInput }))}
                                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-extrabold text-[11px] rounded-lg shadow-2xs transition-colors cursor-pointer"
                              >
                                💳 Process Refund
                              </button>
                            )}

                            {isProductReceived && isExchange && (
                              <button
                                type="button"
                                disabled={isUpdatingReturnStatus}
                                onClick={() => setReturnActionState(prev => ({ ...prev, showDispatchInput: !prev.showDispatchInput }))}
                                className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-extrabold text-[11px] rounded-lg shadow-2xs transition-colors cursor-pointer"
                              >
                                🚀 Dispatch Replacement Unit
                              </button>
                            )}

                            {isExchangeDispatched && (
                              <button
                                type="button"
                                disabled={isUpdatingReturnStatus}
                                onClick={() => handleReturnExchangeAction(activeOrderModal.id, 'exchanged')}
                                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-extrabold text-[11px] rounded-lg shadow-2xs transition-colors cursor-pointer"
                              >
                                {isUpdatingReturnStatus ? '⏳ Completing...' : '✓ Complete Exchange'}
                              </button>
                            )}

                            {isCompleted && (
                              <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-[11px] bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                                <span>✅ Lifecycle Completed</span>
                                {isReturn ? (
                                  <a
                                    href={`${SERVER_URL}/orders/${activeOrderModal.id || activeOrderModal._id}/credit-note`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="underline text-emerald-900 ml-1"
                                  >
                                    View Credit Note
                                  </a>
                                ) : (
                                  <a
                                    href={`${SERVER_URL}/orders/${activeOrderModal.id || activeOrderModal._id}/exchange-invoice`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="underline text-indigo-900 ml-1"
                                  >
                                    View Exchange Invoice
                                  </a>
                                )}
                              </div>
                            )}
                          </div>

                          {returnActionState.showRejectInput && (
                            <div className="p-3 bg-white rounded-xl border border-rose-200 space-y-2">
                              <label className="font-semibold text-rose-900 text-[11px] block">Rejection Reason for Customer:</label>
                              <input
                                type="text"
                                placeholder="e.g. Return policy window expired, or item used / tags missing"
                                value={returnActionState.rejectionReason}
                                onChange={e => setReturnActionState(prev => ({ ...prev, rejectionReason: e.target.value }))}
                                className="w-full px-3 py-1.5 text-xs border border-rose-300 rounded-lg outline-none"
                              />
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleReturnExchangeAction(activeOrderModal.id, isExchange ? 'exchange_rejected' : 'return_rejected', { rejectionReason: returnActionState.rejectionReason || 'Policy criteria not met' })}
                                  className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold rounded-lg cursor-pointer"
                                >
                                  Confirm Rejection
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setReturnActionState(prev => ({ ...prev, showRejectInput: false }))}
                                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}

                          {returnActionState.showPickupInput && (
                            <div className="p-3 bg-white rounded-xl border border-blue-200 space-y-2">
                              <label className="font-semibold text-blue-900 text-[11px] block">Select Pickup Date:</label>
                              <input
                                type="date"
                                value={returnActionState.pickupDate || new Date().toISOString().split('T')[0]}
                                onChange={e => setReturnActionState(prev => ({ ...prev, pickupDate: e.target.value }))}
                                className="w-full px-3 py-1.5 text-xs border border-blue-300 rounded-lg outline-none"
                              />
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleReturnExchangeAction(activeOrderModal.id, 'pickup_scheduled', { pickupScheduledDate: returnActionState.pickupDate || new Date().toISOString().split('T')[0] })}
                                  className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-lg cursor-pointer"
                                >
                                  Confirm Pickup Schedule
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setReturnActionState(prev => ({ ...prev, showPickupInput: false }))}
                                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}

                          {returnActionState.showRefundInput && (
                            <div className="p-3 bg-white rounded-xl border border-emerald-200 space-y-2">
                              <label className="font-semibold text-emerald-900 text-[11px] block">Refund Transaction Reference / ID:</label>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  placeholder="e.g. UPI-REF-99238491823"
                                  value={returnActionState.refundTxnId}
                                  onChange={e => setReturnActionState(prev => ({ ...prev, refundTxnId: e.target.value }))}
                                  className="flex-1 px-3 py-1.5 text-xs border border-emerald-300 rounded-lg outline-none font-mono"
                                />
                                <button
                                  type="button"
                                  onClick={() => setReturnActionState(prev => ({ ...prev, refundTxnId: `UPI-REF-${Date.now().toString().slice(-8)}` }))}
                                  className="px-2 py-1 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-lg text-[10px] font-bold cursor-pointer"
                                >
                                  Generate ID
                                </button>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleReturnExchangeAction(activeOrderModal.id, 'refund_completed', { refundTransactionId: returnActionState.refundTxnId || `REF-${Date.now()}`, refundAmount: activeOrderModal.returnRequest?.refundAmount || activeOrderModal.total })}
                                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg cursor-pointer"
                                >
                                  Complete Refund
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setReturnActionState(prev => ({ ...prev, showRefundInput: false }))}
                                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}

                          {returnActionState.showDispatchInput && (
                            <div className="p-3 bg-white rounded-xl border border-purple-200 space-y-2">
                              <label className="font-semibold text-purple-900 text-[11px] block">Replacement Dispatch Details:</label>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <input
                                  type="text"
                                  placeholder="Courier Name (e.g. Shiprocket / Delhivery)"
                                  value={returnActionState.exchangeCourier}
                                  onChange={e => setReturnActionState(prev => ({ ...prev, exchangeCourier: e.target.value }))}
                                  className="px-3 py-1.5 text-xs border border-purple-300 rounded-lg outline-none"
                                />
                                <div className="flex gap-1.5">
                                  <input
                                    type="text"
                                    placeholder="Replacement AWB"
                                    value={returnActionState.exchangeAwb}
                                    onChange={e => setReturnActionState(prev => ({ ...prev, exchangeAwb: e.target.value }))}
                                    className="flex-1 px-3 py-1.5 text-xs border border-purple-300 rounded-lg outline-none font-mono"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setReturnActionState(prev => ({ ...prev, exchangeAwb: generateDynamicTrackingId(prev.exchangeCourier || 'Shiprocket') }))}
                                    className="px-2 py-1 bg-purple-50 text-purple-800 border border-purple-300 rounded-lg text-[10px] font-bold cursor-pointer"
                                  >
                                    Auto AWB
                                  </button>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleReturnExchangeAction(activeOrderModal.id, 'exchange_dispatched', { exchangeCourierName: returnActionState.exchangeCourier || 'Shiprocket', exchangeAwbNumber: returnActionState.exchangeAwb || generateDynamicTrackingId('Shiprocket') })}
                                  className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-lg cursor-pointer"
                                >
                                  Confirm Dispatch Replacement
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setReturnActionState(prev => ({ ...prev, showDispatchInput: false }))}
                                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Visual Order Progress Stepper */}
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-2">
                <div className="font-bold text-gray-800 text-[11px] uppercase tracking-wider">Fulfillment Timeline</div>
                <div className="grid grid-cols-5 gap-1 text-center font-bold text-[10px]">
                  {['Pending', 'Confirmed', 'Packed', 'Shipped', 'Delivered'].map((step, idx) => {
                    const currentIdx = ['Pending', 'Confirmed', 'Packed', 'Shipped', 'Delivered'].indexOf(activeOrderModal.status);
                    const isPassed = currentIdx >= idx;
                    const isCurrent = currentIdx === idx;
                    return (
                      <div key={step} className="space-y-1">
                        <div className={`h-1.5 rounded-full ${isPassed ? 'bg-teal-600' : 'bg-gray-200'} ${isCurrent ? 'ring-2 ring-teal-400 ring-offset-1' : ''}`} />
                        <div className={isPassed ? 'text-teal-900 font-extrabold' : 'text-gray-400 font-normal'}>{step}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Customer Profile & Shipping Address Card */}
              <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <span className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                    <User size={15} className="text-teal-700" /> Customer Information
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                    {activeOrderModal.school || 'General Student'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="font-extrabold text-gray-900 text-sm">{activeOrderModal.customerName}</div>
                    {activeOrderModal.customerEmail && (
                      <div className="flex items-center gap-1 text-gray-600 text-[11px] mt-1">
                        <Mail size={12} className="text-gray-400 shrink-0" />
                        <span className="truncate">{activeOrderModal.customerEmail}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:items-end gap-1.5">
                    {activeOrderModal.customerPhone && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => alert(`📞 Initiating Controlled Proxy Call to Order #${activeOrderModal.id}.\nCustomer actual phone number is masked for privacy protection.\nConnecting via BookVardi Masked Calling Bridge (+91 8069 000 000)...`)}
                          className="inline-flex items-center gap-1 text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-lg font-bold text-[11px] hover:bg-teal-100 transition-colors cursor-pointer"
                        >
                          <Phone size={12} /> Proxy Call (Masked)
                        </button>
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          <ShieldCheck size={11} /> Masked Privacy
                        </span>
                      </div>
                    )}
                    <div className="text-[11px] font-mono text-gray-700 font-bold">{maskPhoneNumber(activeOrderModal.customerPhone)}</div>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100">
                  <div className="font-semibold text-gray-700 flex items-center gap-1 text-[11px] mb-1">
                    <MapPin size={12} className="text-teal-700 shrink-0" /> Delivery Address:
                  </div>
                  <div className="text-gray-800 leading-relaxed font-medium bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                    {stripCustomerPhoneFromAddress(
                      typeof activeOrderModal.shippingAddress === 'object' && activeOrderModal.shippingAddress !== null
                        ? [
                            activeOrderModal.shippingAddress.name || activeOrderModal.shippingAddress.fullName,
                            activeOrderModal.shippingAddress.addressLine || activeOrderModal.shippingAddress.street || activeOrderModal.shippingAddress.address,
                            activeOrderModal.shippingAddress.colony || activeOrderModal.shippingAddress.landmark,
                            activeOrderModal.shippingAddress.city,
                            activeOrderModal.shippingAddress.state,
                            activeOrderModal.shippingAddress.pincode ? `- ${activeOrderModal.shippingAddress.pincode}` : null
                          ].filter(Boolean).join(', ')
                        : (activeOrderModal.shippingAddress || 'Store / Counter Pickup')
                    )}
                  </div>
                </div>
              </div>

              {/* Order Status & Fulfillment Management Card */}
              {(() => {
                const isSelfDeliveryAssigned = Boolean(
                  activeOrderModal.deliveryMode === 'self_delivery' ||
                  activeOrderModal.deliveryType === 'self_delivery' ||
                  activeOrderModal.selfDeliveryDetails?.deliveryPartnerToken ||
                  activeOrderModal.selfDeliveryDetails?.deliveryPersonName
                );

                const isThirdPartyAssigned = Boolean(
                  (activeOrderModal.deliveryMode === 'third_party' || activeOrderModal.courierName || activeOrderModal.trackingNumber) &&
                  (activeOrderModal.courierName && activeOrderModal.courierName !== 'N/A' && activeOrderModal.courierName !== '')
                );

                const isFinalStatus = ['Delivered', 'Completed'].includes(activeOrderModal.status);
                const currentPartnerDisplay = (activeOrderModal.deliveryMode === 'self_delivery' || activeOrderModal.selfDeliveryDetails?.deliveryPartnerToken)
                  ? 'Self-Delivery (Direct Store Fleet)'
                  : (activeOrderModal.courierName || '3rd-Party Courier');

                return (
                  <div className="p-4 rounded-xl bg-teal-50/50 border border-teal-100 space-y-4">
                    <div className="flex items-center justify-between font-bold text-teal-950">
                      <span className="flex items-center gap-1.5 text-sm">
                        <Truck size={16} className="text-teal-700" /> Fulfillment & Delivery Management
                      </span>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-teal-200 text-teal-900">
                        {activeOrderModal.status}
                      </span>
                    </div>

                    {/* Mode Selector Tabs */}
                    <div className="grid grid-cols-2 gap-2 bg-teal-100/60 p-1 rounded-xl">
                      <button
                        type="button"
                        disabled={isFinalStatus}
                        onClick={() => setDeliveryModeInput('third_party')}
                        className={`py-1.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                          isFinalStatus ? 'cursor-not-allowed opacity-75' : ''
                        } ${
                          deliveryModeInput === 'third_party'
                            ? 'bg-white text-teal-900 shadow-xs ring-1 ring-teal-300'
                            : 'text-teal-800 hover:text-teal-950'
                        }`}
                      >
                        🚚 3rd-Party Courier (Shiprocket / Delhivery)
                      </button>
                      <button
                        type="button"
                        disabled={isFinalStatus}
                        onClick={() => setDeliveryModeInput('self_delivery')}
                        className={`py-1.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                          isFinalStatus ? 'cursor-not-allowed opacity-75' : ''
                        } ${
                          deliveryModeInput === 'self_delivery'
                            ? 'bg-white text-teal-900 shadow-xs ring-1 ring-teal-300'
                            : 'text-teal-800 hover:text-teal-950'
                        }`}
                      >
                        🛵 Direct Self-Delivery (Store Fleet / Rider)
                      </button>
                    </div>

                    <div className="text-[11px] px-2.5 py-1.5 rounded-lg bg-teal-50 border border-teal-200/80 text-teal-900">
                      {deliveryModeInput === 'third_party' ? (
                        <span>📦 <strong>Courier Network Mode:</strong> Customer tracks shipment via Carrier AWB & live link. (No store doorstep OTP required).</span>
                      ) : (
                        <span>🔑 <strong>Direct Store Fleet Mode:</strong> Generates a secure 4-digit Doorstep Handover OTP for customer verification with your rider.</span>
                      )}
                    </div>

                    {/* Mode A: 3rd Party Courier Fields */}
                    {deliveryModeInput === 'third_party' ? (
                      <div className="space-y-3">
                        <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 flex items-center justify-between">
                          <div>
                            <strong className="block text-amber-950 font-bold text-xs">Automated Courier Dispatch (Shiprocket / Delhivery / BlueDart)</strong>
                            <span className="text-[10px] text-amber-800">Auto-calculate freight rate, generate AWB, and print shipping label PDF</span>
                          </div>
                          {(activeOrderModal.trackingNumber || activeOrderModal.shipmentDetails?.awbNumber) && activeOrderModal.deliveryMode === 'third_party' ? (
                            <div className="px-3 py-1.5 bg-emerald-100 text-emerald-900 font-extrabold text-[11px] rounded-lg border border-emerald-300 shrink-0 flex items-center gap-1 shadow-2xs">
                              <CheckCircle size={13} className="text-emerald-700" />
                              <span>Shipment Assigned</span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setIsCreateShipmentModalOpen(true)}
                              className="px-3 py-1.5 bg-teal-800 hover:bg-teal-700 text-white font-extrabold text-[11px] rounded-lg shadow-xs transition-colors cursor-pointer shrink-0"
                            >
                              🚀 Dispatch via Delivery Partner
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3 rounded-xl border border-teal-100">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <label className="font-semibold text-gray-700">Courier Partner</label>
                            </div>
                            <select
                              value={modalCourierInput}
                              onChange={(e) => {
                                const selected = e.target.value;
                                setModalCourierInput(selected);
                                if (!modalTrackingInput.trim()) {
                                  setModalTrackingInput(generateDynamicTrackingId(selected));
                                }
                              }}
                              className="w-full px-3 py-2 rounded-xl border font-medium focus:outline-none bg-white border-gray-200 focus:border-teal-600"
                            >
                              <option value="Shiprocket">Shiprocket (Multi-Courier Aggregator)</option>
                              <option value="Delhivery">Delhivery Express</option>
                              <option value="BlueDart">BlueDart Air</option>
                              <option value="Ekart">Ekart Logistics</option>
                              <option value="DTDC">DTDC Courier</option>
                              <option value="IndiaPost">SpeedPost / India Post</option>
                            </select>
                          </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="font-semibold text-gray-700">Tracking AWB Number</label>
                          <button
                            type="button"
                            onClick={() => setModalTrackingInput(generateDynamicTrackingId(modalCourierInput))}
                            className="text-[10px] text-teal-700 hover:text-teal-900 font-bold underline cursor-pointer"
                          >
                            ⚡ Generate Dynamic AWB
                          </button>
                        </div>
                        <input
                          type="text"
                          value={modalTrackingInput}
                          onChange={(e) => setModalTrackingInput(e.target.value)}
                          placeholder="Not Assigned (Click Generate or type AWB)"
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white font-mono"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Mode B: Self Delivery Fields */
                  <div className="space-y-3 bg-white p-3 rounded-xl border border-teal-100">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <label className="font-semibold text-gray-700">Driver / Delivery Person *</label>
                        <input
                          type="text"
                          value={modalDriverName}
                          onChange={(e) => setModalDriverName(e.target.value)}
                          placeholder="e.g. Ramesh Kumar"
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-semibold text-gray-700">Driver Phone *</label>
                        <input
                          type="text"
                          value={modalDriverPhone}
                          onChange={(e) => setModalDriverPhone(e.target.value)}
                          placeholder="+91 98765 00000"
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-semibold text-gray-700">Vehicle Number *</label>
                        <input
                          type="text"
                          value={modalVehicleNumber}
                          onChange={(e) => setModalVehicleNumber(e.target.value)}
                          placeholder="e.g. DL-01-AB-1234"
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white font-mono"
                        />
                      </div>
                    </div>

                    {/* Delivery Partner Link & Fresh Link Regeneration */}
                    <div className="space-y-2 pt-2 border-t border-teal-100">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-800 text-[11px] flex items-center gap-1">
                          <ExternalLink size={13} className="text-teal-700" /> Rider / Delivery Executive Link (For Driver only):
                        </span>
                        <span className="text-[10px] text-teal-800 font-extrabold bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                          Tracking ID: {modalSelfDeliveryToken || ('DLV-' + activeOrderModal?.id)}
                        </span>
                      </div>
                      {/* Customer Handover OTP Privacy Guard */}
                      <div className="text-[11px] text-teal-900 font-medium bg-teal-50/80 p-2.5 rounded-xl border border-teal-200 flex items-center justify-between shadow-2xs">
                        <div className="flex items-center gap-2">
                          <ShieldCheck size={16} className="text-teal-700 shrink-0" />
                          <div>
                            <div className="font-bold text-teal-950">Customer Handover OTP Protected</div>
                            <div className="text-[10px] text-teal-700">
                              Dispatched directly to buyer's phone. Buyer provides this 4-digit OTP at doorstep.
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white text-teal-800 border border-teal-200 font-mono">
                          Confidential
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          readOnly
                          value={getDriverWebsiteUrl(modalSelfDeliveryToken || ('DLV-' + activeOrderModal?.id))}
                          className="flex-1 px-2.5 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-[11px] font-mono text-gray-700 truncate select-all"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const link = getDriverWebsiteUrl(modalSelfDeliveryToken || ('DLV-' + activeOrderModal?.id));
                            navigator.clipboard.writeText(link);
                            alert('📋 Rider Executive Link copied! (Share with Driver only)');
                          }}
                          className="px-2.5 py-1.5 bg-teal-800 hover:bg-teal-900 text-white font-bold text-[11px] rounded-lg shadow-2xs transition-colors shrink-0 cursor-pointer"
                        >
                          Copy Driver Link
                        </button>
                        <a
                          href={getDriverWebsiteUrl(modalSelfDeliveryToken || ('DLV-' + activeOrderModal?.id))}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg shadow-2xs transition-colors shrink-0 inline-flex items-center gap-1 cursor-pointer"
                        >
                          <ExternalLink size={12} /> Open Driver Link
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            const tId = modalSelfDeliveryToken || ('DLV-' + activeOrderModal?.id);
                            navigator.clipboard.writeText(tId);
                            alert('📋 Buyer Tracking ID copied to clipboard!');
                          }}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-[11px] rounded-lg shadow-2xs transition-colors shrink-0 cursor-pointer"
                        >
                          Copy Buyer Tracking ID
                        </button>
                      </div>

                      {/* Manual WhatsApp Rider Dispatch Action & Status */}
                      {modalDriverPhone && (
                        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl space-y-2 text-xs">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                              <div>
                                <div className="font-extrabold text-emerald-950 flex items-center gap-1.5">
                                  <MessageSquare size={13} className="text-emerald-700" />
                                  <span>WhatsApp Rider Dispatch (Direct Web / App)</span>
                                  <span className="bg-emerald-200/80 text-emerald-900 text-[9px] px-1.5 py-0.2 rounded font-mono font-bold">READY</span>
                                </div>
                                <div className="text-[10px] text-emerald-700 font-mono mt-0.5">
                                  Target Rider: +91 {modalDriverPhone.replace(/\D/g, '').slice(-10)}
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              disabled={isResendingWhatsApp}
                              onClick={handleResendDeliveryWhatsApp}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] rounded-lg shadow-2xs transition-all cursor-pointer flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                            >
                              <MessageSquare size={13} />
                              <span>📲 Open WhatsApp to Send to Rider</span>
                            </button>
                          </div>
                          <div className="text-[10px] text-emerald-800 bg-white/70 p-1.5 rounded border border-emerald-200">
                            💡 <strong>Direct Send:</strong> Clicking <em>"Save Delivery Partner Details"</em> opens WhatsApp in a new tab with pre-filled instructions & tracking link. Simply click <strong>Send</strong> in WhatsApp Web/App!
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleRegenerateFreshDeliveryLink}
                          className="inline-flex items-center gap-1 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-[11px] px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow-2xs"
                          title="Click if link is broken or expired to generate a fresh token link"
                        >
                          <ExternalLink size={13} /> Regenerate Fresh Link
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                {/* Exchange Rider Assignment Note */}
                {Boolean(activeOrderModal.returnRequest?.type === 'exchange' || String(activeOrderModal.status).toLowerCase().includes('exchange')) && (
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-purple-950 text-xs flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base shrink-0">🔄</span>
                      <span>
                        <strong>Exchange Delivery Note:</strong> Rider will be automatically instructed to pick up the old item and deliver the replacement ({activeOrderModal.returnRequest?.exchangeLength ? `${activeOrderModal.returnRequest.exchangeLength}m` : (activeOrderModal.returnRequest?.exchangeSize || 'Requested item')}).
                      </span>
                    </div>
                    <span className="font-mono font-extrabold text-[11px] px-2 py-0.5 rounded-md bg-purple-200 text-purple-950 shrink-0">
                      {activeOrderModal.returnRequest?.priceAdjustmentType === 'extra_payment'
                        ? `Collect +₹${activeOrderModal.returnRequest.priceDifference}`
                        : 'Collect ₹0'}
                    </span>
                  </div>
                )}

                {/* Status Selection & Save */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="font-semibold text-gray-700">Update Status</label>
                    <select
                      value={modalStatusInput}
                      onChange={(e) => setModalStatusInput(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 font-extrabold bg-white focus:outline-none focus:border-teal-600 text-xs"
                    >
                      <option value="Pending">🕒 Pending</option>
                      <option value="Confirmed">✅ Confirmed</option>
                      <option value="Processing">⏳ Processing</option>
                      <option value="Packed">📦 Packed</option>
                      <option value="Shipped">🚚 Shipped</option>
                      <option value="Out for Delivery">🛵 Out for Delivery</option>
                      <option value="Delivered">🎉 Delivered</option>
                      <option value="Cancelled">❌ Cancelled</option>
                      {modalStatusInput && !['Pending', 'Confirmed', 'Processing', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'].includes(modalStatusInput) && (
                        <option value={modalStatusInput}>{modalStatusInput}</option>
                      )}
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      disabled={isSavingDelivery}
                      onClick={handleModalSaveStatus}
                      className="w-full py-2.5 bg-teal-800 hover:bg-teal-900 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer text-xs disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {isSavingDelivery ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          <span>Saving & Dispatching WhatsApp...</span>
                        </>
                      ) : (
                        <span>Save Delivery Partner & Tracking Details</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

              {/* Items List */}
              <div className="space-y-2">
                <div className="font-bold text-gray-700 flex items-center justify-between">
                  <span>Ordered Items ({activeOrderModal.items?.length || 1})</span>
                  <span className="text-[10px] text-gray-500 font-normal">Manage individual product fulfillment</span>
                </div>

                {/* Multi-Vendor Order Notice Banner */}
                {Array.isArray(activeOrderModal.items) && activeOrderModal.items.some(it => !isItemBelongingToCurrentSeller(it)) && (
                  <div className="p-2.5 bg-blue-50/70 border border-blue-200 text-blue-900 rounded-xl text-xs flex items-center gap-2">
                    <Package size={15} className="text-blue-600 shrink-0" />
                    <span><strong>Multi-Vendor Order:</strong> You are managing fulfillment for your store's products. Products from other sellers are strictly read-only.</span>
                  </div>
                )}

                <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
                  {activeOrderModal.items?.map((item, idx) => {
                    const isMyItem = isItemBelongingToCurrentSeller(item);
                    const itemStat = item.status || activeOrderModal.status || 'Pending';
                    const storeNameAttribution = item.storeName || item.sellerStoreName || item.sellerName || item.sellerDetails?.storeName || 'Other Verified Seller';

                    return (
                      <div key={idx} className={`p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${isMyItem ? 'bg-white hover:bg-gray-50/50' : 'bg-gray-50/60'}`}>
                        <div className="flex items-center gap-2.5">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover border border-gray-100 shrink-0" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 font-bold text-xs shrink-0">
                              BV
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-gray-900 text-xs">{item.name}</div>
                            <div className="text-[10px] text-gray-500">
                              Qty: {(() => {
                                const isUnstitched = Boolean(
                                  item.isMeterBased ||
                                  item.unit === 'meter' ||
                                  item.unit === 'm' ||
                                  String(item.category || '').toLowerCase().includes('unstitched') ||
                                  String(item.category || '').toLowerCase().includes('unstiched') ||
                                  String(item.subCategory || '').toLowerCase().includes('unstitched') ||
                                  String(item.subCategory || '').toLowerCase().includes('unstiched') ||
                                  String(item.name || '').toLowerCase().includes('unstitched') ||
                                  String(item.name || '').toLowerCase().includes('unstiched') ||
                                  (Number(item.quantity || 1) % 1 !== 0)
                                );
                                const rawQty = Number(item.quantity || 1);
                                return isUnstitched ? rawQty.toFixed(2) : (rawQty % 1 === 0 ? rawQty : rawQty.toFixed(2));
                              })()} {item.size ? `• Size: ${item.size}` : ''} {item.color ? `• Color: ${item.color}` : ''}
                            </div>
                            {(() => {
                              const itDisc = Number(item.offerDiscount || item.discount || 0) || (Number(item.finalPrice) > 0 && Number(item.price) > Number(item.finalPrice) ? Math.round((Number(item.price) - Number(item.finalPrice)) * Number(item.quantity || 1) * 100) / 100 : 0);
                              if (itDisc <= 0) return null;
                              return (
                                <div className="text-[10px] text-emerald-700 font-bold flex items-center gap-1 mt-0.5">
                                  <span>🏷️ Coupon {item.couponCode ? `(${item.couponCode})` : ''}: -₹{itDisc.toFixed(2)} off</span>
                                </div>
                              );
                            })()}
                            {!isMyItem && (
                              <div className="text-[10px] text-teal-800 font-bold flex items-center gap-1 mt-0.5">
                                <Store size={11} className="text-teal-600" />
                                <span>Sold by: {storeNameAttribution} (Read-Only)</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                              itemStat === 'Delivered' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                              itemStat === 'Shipped' || itemStat === 'Out for Delivery' ? 'bg-purple-50 text-purple-800 border-purple-200' :
                              itemStat === 'Packed' ? 'bg-indigo-50 text-indigo-800 border-indigo-200' :
                              itemStat === 'Confirmed' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                              itemStat === 'Cancelled' ? 'bg-rose-50 text-rose-800 border-rose-200' :
                              'bg-amber-50 text-amber-800 border-amber-200'
                            }`}>
                              {itemStat}
                            </span>
                            {isMyItem ? (
                              <select
                                value={itemStat}
                                onChange={async (e) => {
                                  const newStatus = e.target.value;
                                  const itemIdToUpdate = item._id || item.id || idx;
                                  const res = await updateOrderItemStatus(activeOrderModal.id, itemIdToUpdate, newStatus);
                                  if (res && res.order) {
                                    setActiveOrderModal(res.order);
                                  } else {
                                    setActiveOrderModal(prev => {
                                      if (!prev) return prev;
                                      const nextItems = (prev.items || []).map((it, i) => (i === idx || it._id === item._id || it.id === item.id) ? { ...it, status: newStatus } : it);
                                      const allSame = nextItems.every(it => it.status === newStatus);
                                      return {
                                        ...prev,
                                        items: nextItems,
                                        status: allSame ? newStatus : prev.status,
                                        overallStatus: allSame ? newStatus : prev.overallStatus
                                      };
                                    });
                                  }
                                }}
                                className="text-[11px] font-bold px-2 py-1 rounded-lg border border-gray-300 bg-white hover:border-teal-600 focus:outline-none cursor-pointer"
                                title="Update status for this specific product"
                              >
                                <option value="Pending">🕒 Pending</option>
                                <option value="Confirmed">✅ Confirmed</option>
                                <option value="Processing">⏳ Processing</option>
                                <option value="Packed">📦 Packed</option>
                                <option value="Shipped">🚚 Shipped</option>
                                <option value="Out for Delivery">🛵 Out for Delivery</option>
                                <option value="Delivered">🎉 Delivered</option>
                                <option value="Cancelled">❌ Cancelled</option>
                              </select>
                            ) : (
                              <span className="text-[10px] text-gray-500 font-bold px-1.5 py-0.5 rounded bg-gray-100 border border-gray-200">
                                🔒 Other Seller
                              </span>
                            )}
                          </div>
                          <div className="font-bold text-gray-900 text-xs min-w-[50px] text-right">
                            {(() => {
                              const itDisc = Number(item.offerDiscount || item.discount || 0) || (Number(item.finalPrice) > 0 && Number(item.price) > Number(item.finalPrice) ? Math.round((Number(item.price) - Number(item.finalPrice)) * Number(item.quantity || 1) * 100) / 100 : 0);
                              const grossLine = Math.round((Number(item.price || 0) * Number(item.quantity || 1)) * 100) / 100;
                              if (itDisc > 0) {
                                return (
                                  <div>
                                    <span className="line-through text-gray-400 text-[10px] mr-1">₹{grossLine.toFixed(2)}</span>
                                    <span className="text-emerald-700">₹{Math.max(0, grossLine - itDisc).toFixed(2)}</span>
                                  </div>
                                );
                              }
                              return `₹${grossLine.toFixed(2)}`;
                            })()}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Summary Footer & Complete Itemized Price Breakdown */}
              {(() => {
                const myItems = (activeOrderModal.items || []).filter(isItemBelongingToCurrentSeller);
                const myItemsSubtotal = myItems.reduce((acc, i) => acc + (Number(i.price || 0) * Number(i.quantity || 1)), 0);
                const subtotalVal = Number(activeOrderModal.sellerSubtotal || (myItems.length > 0 ? myItemsSubtotal : null) || activeOrderModal.subtotal || activeOrderModal.total || 0);
                const shipVal = Number(activeOrderModal.shippingFee ?? activeOrderModal.shippingCost ?? 0);
                const couponVal = Number(activeOrderModal.discountAmount ?? activeOrderModal.discount ?? 0);
                const codFeeVal = Number(activeOrderModal.codFee ?? activeOrderModal.codCharges ?? 0);
                const grandVal = Math.max(0, Math.round((subtotalVal + shipVal + codFeeVal - couponVal) * 100) / 100);

                let totalTaxable = 0;
                let totalTax = 0;
                const itemsRawSum = (activeOrderModal.items || []).reduce((acc, it) => acc + (Number(it.price || 0) * Number(it.quantity || 1)), 0);
                const hasPerItemDiscount = (activeOrderModal.items || []).some(
                  it => (it.offerDiscount !== undefined && it.offerDiscount !== null && !isNaN(Number(it.offerDiscount)) && Number(it.offerDiscount) > 0) ||
                        (it.discount !== undefined && it.discount !== null && !isNaN(Number(it.discount)) && Number(it.discount) > 0) ||
                        Boolean(it.couponCode) ||
                        (Number(it.finalPrice) > 0 && Number(it.price) > Number(it.finalPrice))
                );
                const isProductSpecificCouponCalc = Boolean(
                  activeOrderModal.couponDetails?.applicableScope === 'specific_product' ||
                  activeOrderModal.couponDetails?.applicableScope === 'specific_kit' ||
                  activeOrderModal.couponDetails?.specificProductId ||
                  activeOrderModal.couponDetails?.specificKitId ||
                  activeOrderModal.couponDetails?.specificProductName ||
                  activeOrderModal.couponDetails?.specificKitTitle ||
                  (Array.isArray(activeOrderModal.couponDetails?.applicableProducts) && activeOrderModal.couponDetails.applicableProducts.length > 0) ||
                  (Array.isArray(activeOrderModal.couponDetails?.applicableKits) && activeOrderModal.couponDetails.applicableKits.length > 0)
                );
                const eligibleProductIdsCalc = new Set(
                  (activeOrderModal.couponDetails?.applicableProducts || [])
                    .concat(activeOrderModal.couponDetails?.specificProductId ? [activeOrderModal.couponDetails.specificProductId] : [])
                    .concat(activeOrderModal.couponDetails?.applicableKits || [])
                    .concat(activeOrderModal.couponDetails?.specificKitId ? [activeOrderModal.couponDetails.specificKitId] : [])
                    .filter(Boolean)
                    .map(id => String(id).toLowerCase().trim())
                );
                const specProdNameCalc = String(activeOrderModal.couponDetails?.specificProductName || '').toLowerCase().trim();
                const specKitTitleCalc = String(activeOrderModal.couponDetails?.specificKitTitle || '').toLowerCase().trim();

                (activeOrderModal.items || []).forEach(item => {
                  const qty = Number(item.quantity || 1);
                  const unitPrice = Number(item.price || 0);
                  const itemCandidateIds = [item.productId, item.id, item._id, item.customId].filter(Boolean).map(id => String(id).toLowerCase().trim());
                  const isIdMatched = itemCandidateIds.some(id => eligibleProductIdsCalc.has(id));
                  const itemNameLower = String(item.name || '').toLowerCase();
                  const isNameMatched = Boolean(
                    (specProdNameCalc && itemNameLower.includes(specProdNameCalc)) ||
                    (specKitTitleCalc && itemNameLower.includes(specKitTitleCalc))
                  );
                  const isEligible = isProductSpecificCouponCalc ? (isIdMatched || isNameMatched) : true;
                  let itemDiscount = 0;
                  if (hasPerItemDiscount) {
                    itemDiscount = Number(item.offerDiscount || item.discount || 0);
                    if (itemDiscount === 0 && Number(item.finalPrice) > 0 && Number(item.price) > Number(item.finalPrice)) {
                      itemDiscount = Math.round((Number(item.price) - Number(item.finalPrice)) * qty * 100) / 100;
                    }
                  } else if (couponVal > 0 && itemsRawSum > 0 && isEligible) {
                    itemDiscount = Math.round((couponVal * ((unitPrice * qty) / itemsRawSum)) * 100) / 100;
                  }
                  itemDiscount = Math.min(unitPrice * qty, Math.max(0, itemDiscount));
                  const grossPrice = Math.max(0, (unitPrice * qty) - itemDiscount);
                  const gstRate = Number(item.gstPercent ?? item.gstPercentage ?? item.gstRate ?? item.gst ?? 5);
                  if (gstRate > 0) {
                    const taxable = Math.round((grossPrice / (1 + gstRate / 100)) * 100) / 100;
                    const tax = Math.round((grossPrice - taxable) * 100) / 100;
                    totalTaxable += taxable;
                    totalTax += tax;
                  } else {
                    totalTaxable += grossPrice;
                  }
                });

                // Dynamic Product GST Rate for Delivery (Composite Supply under Section 8 of CGST Act: Principal supply rate governs freight/delivery)
                // Delivery charge GST strictly matches the product's GST rate (e.g., 5% product -> 5% delivery, 0% product -> 0% delivery)
                const defaultProductGstRate = (() => {
                  const itemRates = (activeOrderModal.items || []).map(it => {
                    const cat = String(it.category || '').toLowerCase();
                    const isBook = cat.includes('book') || cat.includes('textbook') || String(it.name || '').toLowerCase().includes('book');
                    return Number(it.gstPercent ?? it.gstPercentage ?? it.gstRate ?? it.gst ?? (isBook ? 0 : 5));
                  }).filter(r => !isNaN(r));
                  if (itemRates.length > 0) {
                    return Math.max(...itemRates);
                  }
                  if (activeOrderModal.shippingGstRate !== undefined && activeOrderModal.shippingGstRate !== null && !isNaN(Number(activeOrderModal.shippingGstRate))) {
                    return Number(activeOrderModal.shippingGstRate);
                  }
                  return 5;
                })();

                const shippingGstRate = defaultProductGstRate;
                const shipTaxable = shipVal > 0 ? (shippingGstRate > 0 ? Math.round((shipVal / (1 + shippingGstRate / 100)) * 100) / 100 : shipVal) : 0;
                const shipTax = shipVal > 0 ? Math.round((shipVal - shipTaxable) * 100) / 100 : 0;

                let combinedTaxable = Math.round((totalTaxable + shipTaxable) * 100) / 100;
                let combinedTax = Math.round((totalTax + shipTax) * 100) / 100;

                // Adjust small precision rounding against grand total
                if (grandVal > 0 && Math.abs((combinedTaxable + combinedTax) - grandVal) > 0 && Math.abs((combinedTaxable + combinedTax) - grandVal) <= 0.05) {
                  combinedTaxable = Math.round((grandVal - combinedTax) * 100) / 100;
                }

                const firstSellerObj = activeOrderModal.items?.[0]?.sellerId;
                const sellerStateInfo = parseStateInfo(
                  firstSellerObj,
                  `${activeOrderModal.sellerState || ''} ${activeOrderModal.sellerCity || ''} ${activeOrderModal.sellerAddress || ''} ${activeOrderModal.sellerGst || ''}`
                );
                const customerStateInfo = parseStateInfo(
                  activeOrderModal.shippingAddress,
                  typeof activeOrderModal.shippingAddress === 'string'
                    ? activeOrderModal.shippingAddress
                    : `${activeOrderModal.shippingAddress?.street || ''} ${activeOrderModal.shippingAddress?.city || ''} ${activeOrderModal.shippingAddress?.state || ''} ${activeOrderModal.shippingAddress?.pincode || ''}`
                );

                const isSameState = !sellerStateInfo.key || !customerStateInfo.key || sellerStateInfo.key === customerStateInfo.key;
                const sellerStateStr = sellerStateInfo.name || 'Uttar Pradesh';
                const customerStateStr = customerStateInfo.name || 'Uttar Pradesh';

                const cgst = Math.round((combinedTax / 2) * 100) / 100;
                const sgst = Math.round((combinedTax - cgst) * 100) / 100;

                return (
                  <div className="p-3.5 bg-teal-50/50 rounded-xl border border-teal-100 space-y-2 text-xs">
                    {/* 1. Items Subtotal */}
                    <div className="flex justify-between text-gray-700">
                      <span>Items Subtotal:</span>
                      <span className="font-mono font-bold">₹{subtotalVal.toFixed(2)}</span>
                    </div>

                    {/* 2. Delivery Charges (Added directly to Subtotal before GST calculation) */}
                    <div className="flex justify-between text-gray-700">
                      <span>Delivery Charges:</span>
                      <span className="font-mono font-bold text-teal-800">
                        {shipVal === 0 ? 'FREE Delivery (₹0.00)' : `+₹${shipVal.toFixed(2)}`}
                      </span>
                    </div>

                    {/* 3. Offer / Coupon */}
                    {couponVal > 0 ? (
                      <div className="flex justify-between text-teal-800 font-bold">
                        <span>Offer / Coupon Applied{activeOrderModal.couponCode ? ` (${activeOrderModal.couponCode})` : ''}:</span>
                        <span className="font-mono">-₹{couponVal.toFixed(2)}</span>
                      </div>
                    ) : (
                      <div className="flex justify-between text-gray-400 text-[11px]">
                        <span>Offer / Coupon:</span>
                        <span className="font-mono">Not Applied (₹0.00)</span>
                      </div>
                    )}

                    {/* 4. COD / Convenience Fee */}
                    {codFeeVal > 0 && (
                      <div className="flex justify-between text-gray-700">
                        <span>COD / Convenience Fee:</span>
                        <span className="font-mono font-bold text-teal-800">+₹{codFeeVal.toFixed(2)}</span>
                      </div>
                    )}

                    {/* 5. Base Taxable Amount (Excl. GST) - after adding delivery charges */}
                    <div className="flex justify-between text-gray-600 text-[11px] pt-1.5 border-t border-dashed border-teal-200">
                      <span>Base Taxable Amount (Excl. GST):</span>
                      <span className="font-mono font-semibold">₹{combinedTaxable.toFixed(2)}</span>
                    </div>

                    {/* 6. GST Tax Breakdown */}
                    <div className="flex justify-between text-teal-900 text-[11px] bg-teal-100/60 p-2 rounded-lg border border-teal-200">
                      <div>
                        <span className="font-bold block">GST Tax Breakdown ({isSameState ? 'Intra-State Same State' : 'Inter-State Different State'}):</span>
                        {isSameState ? (
                          <span className="text-[10px] text-teal-800">
                            CGST ({(shippingGstRate / 2).toFixed(1).replace(/\.0$/, '')}%): ₹{cgst.toFixed(2)} • SGST ({(shippingGstRate / 2).toFixed(1).replace(/\.0$/, '')}%): ₹{sgst.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-[10px] text-teal-800">IGST (Integrated 100%): ₹{combinedTax.toFixed(2)} • Supply ({sellerStateStr} ➔ {customerStateStr})</span>
                        )}
                      </div>
                      <span className="font-mono font-bold self-center text-teal-950">₹{combinedTax.toFixed(2)}</span>
                    </div>

                    {/* 7. Total Payable Amount */}
                    <div className="pt-2 border-t border-teal-200 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-teal-950">Total Payable Amount</div>
                        <div className="text-[10px] text-teal-700">{activeOrderModal.paymentMethod} • {((String(activeOrderModal.status || '').toLowerCase().includes('delivered') || String(activeOrderModal.paymentStatus || '').toLowerCase() === 'paid') ? 'Paid' : (activeOrderModal.paymentStatus || 'Pending'))}</div>
                      </div>
                      <div className="text-lg font-extrabold text-teal-900 font-mono">₹{grandVal.toFixed(2)}</div>
                    </div>
                  </div>
                );
              })()}

              {/* Dynamic Seller Settlement Breakdown (Rule 2 / Rules 1, 3 & 4) */}
              {(() => {
                const isCod = String(activeOrderModal.paymentMethod || '').toUpperCase().includes('COD') || String(activeOrderModal.paymentMethod || '').toUpperCase().includes('CASH');
                const rawDeliveryMode = String(activeOrderModal.deliveryMode || activeOrderModal.deliveryType || '').toLowerCase();
                const hasCourier = Boolean(activeOrderModal.courierName && activeOrderModal.courierName !== 'N/A' && activeOrderModal.courierName !== '');
                const hasSelfDeliveryDetails = Boolean(
                  activeOrderModal.selfDeliveryDetails?.deliveryPartnerToken || 
                  activeOrderModal.selfDeliveryDetails?.deliveryPersonName ||
                  activeOrderModal.deliveryOtp ||
                  (activeOrderModal.items || []).some(it => it.selfDeliveryDetails?.deliveryPartnerToken || it.selfDeliveryDetails?.deliveryPersonName || it.deliveryOtp)
                );
                const isExplicitSelf = rawDeliveryMode.includes('self') || 
                                       activeOrderModal.settlementRule === 'COD_SELF_DELIVERY' || 
                                       (activeOrderModal.items || []).some(it => it.settlementRule === 'COD_SELF_DELIVERY') || 
                                       Boolean((activeOrderModal.deliveryOtp || hasSelfDeliveryDetails) && !hasCourier);
                const isExplicitThirdParty = activeOrderModal.settlementRule === 'COD_THIRD_PARTY_DELIVERY' ||
                                             activeOrderModal.settlementRule === 'ONLINE_THIRD_PARTY_DELIVERY' ||
                                             (activeOrderModal.items || []).some(it => it.settlementRule === 'COD_THIRD_PARTY_DELIVERY' || it.settlementRule === 'ONLINE_THIRD_PARTY_DELIVERY') ||
                                             rawDeliveryMode.includes('third') || 
                                             rawDeliveryMode.includes('courier') || 
                                             hasCourier ||
                                             (activeOrderModal.items || []).some(it => String(it.deliveryType || '').toLowerCase().includes('third') || Boolean(it.thirdPartyDetails?.courierName));
                const isThirdParty = isExplicitThirdParty || !isExplicitSelf;
                const isSelf = !isThirdParty;

                let ruleNum = 1;
                let ruleTitleHi = 'नियम 1: ऑनलाइन भुगतान + सेलर डिलीवरी';
                let ruleTitleEn = 'Rule 1: Online Payment + Self Delivery';
                let ruleColor = 'bg-teal-100 text-teal-900 border-teal-300';

                if (!isCod && isThirdParty) {
                  ruleNum = 2;
                  ruleTitleHi = 'नियम 2: ऑनलाइन भुगतान + कूरियर से डिलीवरी';
                  ruleTitleEn = 'Rule 2: Online Payment + Third-Party Delivery';
                  ruleColor = 'bg-amber-100 text-amber-950 border-amber-300';
                } else if (isCod && isSelf) {
                  ruleNum = 3;
                  ruleTitleHi = 'नियम 3: कैश भुगतान + सेलर डिलीवरी';
                  ruleTitleEn = 'Rule 3: COD + Self Delivery';
                  ruleColor = 'bg-rose-100 text-rose-950 border-rose-300';
                } else if (isCod && isThirdParty) {
                  ruleNum = 4;
                  ruleTitleHi = 'नियम 4: कैश भुगतान + कूरियर डिलीवरी (रेमिटेड)';
                  ruleTitleEn = 'Rule 4: COD + Third-Party Courier';
                  ruleColor = 'bg-purple-100 text-purple-950 border-purple-300';
                }

                const isExchangeReq = Boolean(
                  activeOrderModal.returnRequest?.type === 'exchange' ||
                  activeOrderModal.returnRequest?.requestType === 'exchange' ||
                  String(activeOrderModal.overallStatus || activeOrderModal.status || '').toLowerCase().includes('exchange')
                );
                const exchangePriceDiff = Number(activeOrderModal.returnRequest?.priceDifference || 0);
                const exchangePriceAdjType = activeOrderModal.returnRequest?.priceAdjustmentType || (exchangePriceDiff > 0 ? 'extra_payment' : exchangePriceDiff < 0 ? 'partial_refund' : 'none');
                
                // Check if the exchanged item belongs to this seller
                const targetExchangeItem = (activeOrderModal.items || []).find(it => 
                  (activeOrderModal.returnRequest?.itemId && String(it._id || it.id || it.productId) === String(activeOrderModal.returnRequest.itemId)) ||
                  (activeOrderModal.returnRequest?.itemName && it.name === activeOrderModal.returnRequest.itemName)
                );
                const isMyItemExchanged = targetExchangeItem ? isItemBelongingToCurrentSeller(targetExchangeItem) : true;
                const exchangeAdjustmentVal = (isExchangeReq && isMyItemExchanged)
                  ? (exchangePriceAdjType === 'extra_payment' ? Math.abs(exchangePriceDiff) : (exchangePriceAdjType === 'partial_refund' ? -Math.abs(exchangePriceDiff) : 0))
                  : 0;

                const mySellerItems = (activeOrderModal.items || []).filter(isItemBelongingToCurrentSeller);
                const mySellerItemsGross = mySellerItems.reduce((acc, i) => acc + (Number(i.price || 0) * Number(i.quantity || 1)), 0);
                const mySellerDiscounts = mySellerItems.reduce((acc, i) => acc + (Number(i.offerDiscount || i.discount) || (Number(i.finalPrice) > 0 && Number(i.price) > Number(i.finalPrice) ? Math.round((Number(i.price) - Number(i.finalPrice)) * Number(i.quantity || 1) * 100) / 100 : 0)), 0);
                const totalOrderDiscount = Number(activeOrderModal.discountAmount ?? activeOrderModal.discount ?? 0);
                const effectiveSellerDiscount = mySellerDiscounts > 0 ? mySellerDiscounts : (mySellerItems.length === (activeOrderModal.items || []).length ? totalOrderDiscount : 0);
                const rawSellerSubtotal = Number(activeOrderModal.sellerSubtotal || (mySellerItems.length > 0 ? mySellerItemsGross : null) || activeOrderModal.subtotal || activeOrderModal.total || 0);
                const baseGross = Math.max(0, Math.round((rawSellerSubtotal - effectiveSellerDiscount) * 100) / 100);
                const grossSale = Math.max(0, Math.round((baseGross + exchangeAdjustmentVal) * 100) / 100);
                const commRate = Number(activeOrderModal.commissionRate ?? activeOrderModal.sellerCommissionRate ?? mySellerItems[0]?.commissionRate ?? activeOrderModal.items?.[0]?.commissionRate ?? 10);
                
                // 1. Portal Commission
                const portalComm = Math.round(((grossSale * commRate) / 100) * 100) / 100;
                // 2. GST on Commission (18%)
                const gstOnComm = Math.round(((portalComm * 18) / 100) * 100) / 100;
                // 3. TDS (0.1% Sec 194-O)
                const tdsAmt = Math.round(((grossSale * 0.1) / 100) * 100) / 100;

                // 4. GST TCS (0.5% Sec 52): 0% for Rule 3 COD Self or Tax-Free (books)
                const isTaxFreeOrder = (activeOrderModal.items || []).every(it => {
                  const r = Number(it.gstPercent ?? it.gstPercentage ?? it.gstRate ?? it.gst ?? 5);
                  const cat = String(it.category || '').toLowerCase();
                  return r === 0 || cat.includes('book');
                });
                const tcsRate = (ruleNum === 3 || isTaxFreeOrder) ? 0 : 0.5;
                const tcsAmt = (ruleNum === 3 || isTaxFreeOrder) ? 0 : Math.round(((grossSale * tcsRate) / 100) * 100) / 100;

                // 5. Delivery Charges (Rule 2 & Rule 4: Client Norms)
                const orderThreshold = Number(activeOrderModal.freeDeliveryThreshold ?? activeOrderModal.minOrderFreeShipping ?? 401);
                const isAboveThreshold = (grossSale >= orderThreshold || Number(activeOrderModal.total || activeOrderModal.totalAmount || 0) >= orderThreshold || Number(activeOrderModal.subtotal || 0) >= orderThreshold);
                const customerShippingPaid = Number(activeOrderModal.shippingFee ?? activeOrderModal.shippingCost ?? activeOrderModal.shippingAmount ?? 0);
                let delivBorneBy = activeOrderModal.deliveryChargeBorneBy;
                if (!delivBorneBy || customerShippingPaid > 0) {
                  if (isAboveThreshold) delivBorneBy = 'admin';
                  else if (customerShippingPaid > 0) delivBorneBy = 'customer';
                  else if (activeOrderModal.isDeliveryBorneBySeller || activeOrderModal.deliveryBorneBy === 'seller') delivBorneBy = 'seller';
                  else delivBorneBy = isThirdParty ? 'seller' : 'admin';
                }

                let delivFeeAmt = 0;
                let delivGstAmt = 0;
                let totalDelivDed = 0;
                let delivStatusNote = '';

                const itemGstRates = (activeOrderModal.items || []).map(it => {
                  const cat = String(it.category || '').toLowerCase();
                  const isBook = cat.includes('book') || cat.includes('textbook') || String(it.name || '').toLowerCase().includes('book');
                  return Number(it.gstPercent ?? it.gstPercentage ?? it.gstRate ?? it.gst ?? (isBook ? 0 : 5));
                }).filter(r => !isNaN(r));
                const orderProductGstRate = itemGstRates.length > 0 ? Math.max(...itemGstRates) : 5;

                if (isThirdParty && delivBorneBy === 'seller' && !isAboveThreshold) {
                  const rawDeliv = Math.max(0, Number(activeOrderModal.deliveryCharge ?? activeOrderModal.shippingFee ?? activeOrderModal.shippingCost ?? 49));
                  // Delivery charges are GST INCLUSIVE (no extra GST added on top)
                  totalDelivDed = Math.round(rawDeliv * 100) / 100;
                  delivFeeAmt = Math.round((totalDelivDed / (1 + (orderProductGstRate / 100))) * 100) / 100;
                  delivGstAmt = Math.round((totalDelivDed - delivFeeAmt) * 100) / 100;
                  delivStatusNote = `सेलर वहन (कूरियर ₹${totalDelivDed.toFixed(2)} GST सहित / Base: ₹${delivFeeAmt.toFixed(2)} + ${orderProductGstRate}% GST ₹${delivGstAmt.toFixed(2)})`;
                } else if (isAboveThreshold) {
                  delivStatusNote = `₹${orderThreshold}+ ऑर्डर पर एडमिन वहन करता है — सेलर से ₹0 कटौती`;
                } else if (delivBorneBy === 'customer') {
                  delivStatusNote = 'ग्राहक द्वारा वहन — सेलर से ₹0 कटौती';
                } else {
                  delivStatusNote = 'सेलर सेल्फ डिलीवरी — ₹0 कूरियर कटौती';
                }

                const totalDeductions = Math.round((portalComm + gstOnComm + tdsAmt + tcsAmt + totalDelivDed) * 100) / 100;
                
                let finalNet;
                if (ruleNum === 3) {
                  finalNet = -totalDeductions;
                } else {
                  finalNet = Math.max(0, Math.round((grossSale - totalDeductions) * 100) / 100);
                }

                return (
                  <div className="p-3.5 bg-gradient-to-br from-amber-50/80 via-orange-50/30 to-amber-50/80 rounded-xl border border-amber-300 space-y-2 text-xs">
                    {/* Header */}
                    <div className="flex items-center justify-between flex-wrap gap-1.5 pb-2 border-b border-amber-200">
                      <div>
                        <span className="font-extrabold text-amber-950 flex items-center gap-1.5 text-xs sm:text-[13px]">
                          📋 {ruleTitleHi}
                        </span>
                        <span className="text-[10px] text-amber-800 font-medium block">
                          {ruleTitleEn}
                        </span>
                      </div>
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border shadow-2xs ${ruleColor}`}>
                        Rule {ruleNum} Active
                      </span>
                    </div>

                    {/* All Client Rule Points Breakdown */}
                    <div className="space-y-1.5 text-[11px]">
                      <div className="flex justify-between text-gray-800">
                        <span>• Gross Sale (ग्राहक से प्राप्त कुल बिक्री राशि):</span>
                        <span className="font-mono font-bold text-gray-950">₹{grossSale.toFixed(2)}</span>
                      </div>

                      {isExchangeReq && isMyItemExchanged && (
                        <div className="flex justify-between text-purple-900 bg-purple-100/60 p-1.5 rounded border border-purple-200">
                          <span className="flex items-center gap-1">
                            <span>🔄</span> Exchange Adjustment ({activeOrderModal.returnRequest?.itemName || 'Item'}):
                          </span>
                          <span className="font-mono font-bold">
                            {exchangeAdjustmentVal > 0 ? (
                              <span className="text-amber-800">+₹{exchangeAdjustmentVal.toFixed(2)} (अतिरिक्त कैश)</span>
                            ) : exchangeAdjustmentVal < 0 ? (
                              <span className="text-emerald-800">−₹{Math.abs(exchangeAdjustmentVal).toFixed(2)} (आंशिक रिफंड)</span>
                            ) : (
                              <span className="text-blue-800">मूल्य बराबर (₹0 Diff)</span>
                            )}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between text-gray-700">
                        <span>• Portal Commission ({commRate}% पोर्टल कमीशन):</span>
                        <span className="font-mono font-semibold text-amber-900">−₹{portalComm.toFixed(2)}</span>
                      </div>

                      <div className="flex justify-between text-gray-700">
                        <span>• GST on Commission (कमीशन पर 18% GST):</span>
                        <span className="font-mono font-semibold text-indigo-900">−₹{gstOnComm.toFixed(2)}</span>
                      </div>

                      <div className="flex justify-between text-gray-700">
                        <span>• TDS (आयकर Sec 194-O लागू 0.1% TDS):</span>
                        <span className="font-mono font-semibold text-purple-900">−₹{tdsAmt.toFixed(2)}</span>
                      </div>

                      <div className="flex justify-between text-gray-700">
                        <span>• GST TCS (जहाँ कानून अनुसार लागू हो 0.5% TCS):</span>
                        <span className="font-mono font-semibold text-sky-900">−₹{tcsAmt.toFixed(2)}</span>
                      </div>

                      <div className="flex justify-between text-gray-700 pt-1 border-t border-amber-200/70">
                        <div>
                          <span>• Delivery Charges (कूरियर डिलीवरी खर्च):</span>
                          <span className="text-[10px] text-amber-800 block font-medium">({delivStatusNote})</span>
                        </div>
                        <span className="font-mono font-bold text-rose-800 self-center">
                          {totalDelivDed > 0 ? `−₹${totalDelivDed.toFixed(2)}` : '₹0.00'}
                        </span>
                      </div>
                    </div>

                    {/* Formula & Final Settlement */}
                    <div className="pt-2 border-t border-amber-300 flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <div className="font-extrabold text-amber-950 text-xs">
                          {ruleNum === 3 ? '⚠️ पोर्टल को देय कमीशन/टैक्स (Payable to Portal)' : 'Final Seller Settlement (शुद्ध सेलर भुगतान)'}
                        </div>
                        <div className="text-[10px] text-amber-900 mt-0.5">
                          {ruleNum === 3 ? (
                            <span>सेलर के पास कुल कैश: ₹{grossSale.toFixed(2)} • <strong>सेलर की शुद्ध बचत: ₹{(grossSale - totalDeductions).toFixed(2)}</strong></span>
                          ) : (
                            <span>Gross (₹{grossSale.toFixed(2)}) − Deductions (₹{totalDeductions.toFixed(2)})</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-base font-black font-mono ${ruleNum === 3 ? 'text-rose-700' : 'text-emerald-800'}`}>
                          {ruleNum === 3 ? `−₹${Math.abs(finalNet).toFixed(2)}` : `₹${finalNet.toFixed(2)}`}
                        </div>
                        {ruleNum === 3 && (
                          <div className="text-[10px] font-bold text-emerald-800 font-mono">
                            (सेलर शुद्ध बचत: ₹{(grossSale - totalDeductions).toFixed(2)})
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

            </div>
          </div>
        </div>
      )}

      {/* Ship & Dispatch Modal */}
      {isShipModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 text-xs space-y-4">
            <h4 className="font-bold text-gray-900 text-base flex items-center gap-2">
              <Truck className="text-purple-700" size={20} /> Pack & Dispatch Order #{shippingOrderId}
            </h4>

            {/* Mode Selector Tabs */}
            <div className="grid grid-cols-2 gap-2 bg-teal-100/60 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setShipModalDeliveryMode('third_party')}
                className={`py-1.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                  shipModalDeliveryMode === 'third_party'
                    ? 'bg-white text-teal-900 shadow-xs'
                    : 'text-teal-800 hover:text-teal-950'
                }`}
              >
                🚚 3rd-Party (Shiprocket)
              </button>
              <button
                type="button"
                onClick={() => setShipModalDeliveryMode('self_delivery')}
                className={`py-1.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                  shipModalDeliveryMode === 'self_delivery'
                    ? 'bg-white text-teal-900 shadow-xs'
                    : 'text-teal-800 hover:text-teal-950'
                }`}
              >
                🛵 Direct Self-Delivery
              </button>
            </div>

            {shipModalDeliveryMode === 'self_delivery' ? (
              <div className="space-y-3 bg-teal-50/40 p-3 rounded-xl border border-teal-100">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Driver / Rider Name *</label>
                  <input
                    type="text"
                    value={shipModalDriverName}
                    onChange={(e) => setShipModalDriverName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Driver Phone Number *</label>
                  <input
                    type="text"
                    value={shipModalDriverPhone}
                    onChange={(e) => setShipModalDriverPhone(e.target.value)}
                    placeholder="+91 98765 00000"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Vehicle Number *</label>
                  <input
                    type="text"
                    value={shipModalVehicleNumber}
                    onChange={(e) => setShipModalVehicleNumber(e.target.value)}
                    placeholder="e.g. UP32 AB 1234"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Courier Partner</label>
                  <select
                    value={courierInput}
                    onChange={(e) => {
                      const selected = e.target.value;
                      setCourierInput(selected);
                      setTrackingNumberInput(generateDynamicTrackingId(selected));
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none"
                  >
                    <option value="Shiprocket">Shiprocket (Multi-Courier Aggregator)</option>
                    <option value="Delhivery">Delhivery Express</option>
                    <option value="BlueDart">BlueDart Air Premium</option>
                    <option value="Ekart">Ekart Logistics</option>
                    <option value="DTDC">DTDC Courier</option>
                    <option value="IndiaPost">SpeedPost / India Post</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-gray-700">Tracking AWB Number</label>
                    <button
                      type="button"
                      onClick={() => setTrackingNumberInput(generateDynamicTrackingId(courierInput))}
                      className="text-[10px] text-teal-700 hover:text-teal-900 font-bold underline cursor-pointer"
                    >
                      ⚡ Generate Dynamic AWB
                    </button>
                  </div>
                  <input
                    type="text"
                    value={trackingNumberInput}
                    onChange={(e) => setTrackingNumberInput(e.target.value)}
                    placeholder="Not Assigned"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 font-mono bg-white"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsShipModalOpen(false)}
                className="flex-1 py-2 font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmShip}
                className="flex-1 py-2 font-semibold text-white bg-purple-700 hover:bg-purple-800 rounded-xl shadow-xs cursor-pointer"
              >
                Confirm Dispatch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Order Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 text-xs space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h4 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <Plus className="text-teal-700" size={18} /> Create Manual / Counter Order
              </h4>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateManualOrder} className="space-y-3.5">
              {/* Customer Full Name */}
              <div className="space-y-1">
                <label className="font-semibold text-gray-700">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  value={manualForm.customerName}
                  onChange={(e) => setManualForm({ ...manualForm, customerName: e.target.value })}
                  placeholder="e.g. Sumanth Rao"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                />
              </div>

              {/* Customer Phone & School */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Customer Phone</label>
                  <input
                    type="text"
                    value={manualForm.customerPhone}
                    onChange={(e) => setManualForm({ ...manualForm, customerPhone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">School / Inst.</label>
                  <input
                    type="text"
                    value={manualForm.school}
                    onChange={(e) => setManualForm({ ...manualForm, school: e.target.value })}
                    placeholder="e.g. DPS School"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                  />
                </div>
              </div>

              {/* Delivery Address */}
              <div className="space-y-1">
                <label className="font-semibold text-gray-700">Delivery Address</label>
                <input
                  type="text"
                  value={manualForm.shippingAddress}
                  onChange={(e) => setManualForm({ ...manualForm, shippingAddress: e.target.value })}
                  placeholder="House/Room No, Street, Campus Address"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                />
              </div>

              {/* Select Product Dropdown */}
              <div className="space-y-1">
                <label className="font-semibold text-gray-700">Select Product from Catalog *</label>
                <select
                  value={manualForm.selectedProductId}
                  onChange={(e) => handleProductSelect(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white font-medium focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                >
                  <option value="">-- Choose Product (Auto-fills price & size) --</option>
                  {products.map((prod) => (
                    <option key={prod.id || prod._id} value={prod.id || prod._id}>
                      {prod.name} (Fixed ₹{prod.price})
                    </option>
                  ))}
                  <option value="custom">✍️ Custom Product Entry</option>
                </select>
              </div>

              {/* Item Name (shown if custom or for custom editing) */}
              {(!manualForm.selectedProductId || manualForm.selectedProductId === 'custom') && (
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Item Name / Description *</label>
                  <input
                    type="text"
                    required
                    value={manualForm.itemName}
                    onChange={(e) => setManualForm({ ...manualForm, itemName: e.target.value })}
                    placeholder="Item name"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-600"
                  />
                </div>
              )}

              {/* Fixed Price, Quantity Increment/Decrement, Size */}
              <div className="grid grid-cols-3 gap-2.5 items-end">
                {/* Fixed Item Price */}
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Item Price (₹)</label>
                  <input
                    type="number"
                    min="1"
                    readOnly={Boolean(manualForm.selectedProductId && manualForm.selectedProductId !== 'custom')}
                    value={manualForm.price}
                    onChange={(e) => setManualForm({ ...manualForm, price: Number(e.target.value) })}
                    className={`w-full px-3 py-2 rounded-xl border font-bold ${
                      manualForm.selectedProductId && manualForm.selectedProductId !== 'custom'
                        ? 'bg-gray-100 border-gray-200 text-gray-700 cursor-not-allowed'
                        : 'bg-white border-gray-200 focus:outline-none focus:border-teal-600'
                    }`}
                  />
                </div>

                {/* Quantity Controls (Increment / Decrement) */}
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Quantity</label>
                  <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-200">
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(-1)}
                      disabled={manualForm.quantity <= 1}
                      className="w-7 h-7 rounded-lg bg-white hover:bg-gray-200 text-gray-700 font-bold flex items-center justify-center border border-gray-200 shadow-2xs disabled:opacity-40 cursor-pointer"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="flex-1 text-center font-bold text-gray-900 text-xs">
                      {manualForm.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(1)}
                      className="w-7 h-7 rounded-lg bg-teal-800 hover:bg-teal-900 text-white font-bold flex items-center justify-center shadow-2xs cursor-pointer"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>

                {/* Size Selection */}
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Size</label>
                  <select
                    value={manualForm.size}
                    onChange={(e) => setManualForm({ ...manualForm, size: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white font-medium focus:outline-none focus:border-teal-600"
                  >
                    {(manualForm.availableSizes && manualForm.availableSizes.length > 0
                      ? manualForm.availableSizes
                      : ['S', 'M', 'L', 'XL', 'Free Size']
                    ).map((sz) => (
                      <option key={sz} value={sz}>{sz}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Total Summary Badge */}
              <div className="p-3 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-between">
                <span className="font-semibold text-teal-900">Total Order Amount:</span>
                <span className="text-base font-extrabold text-teal-900">
                  ₹{(Number(manualForm.price) || 0) * (Number(manualForm.quantity) || 1)}
                </span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 py-2.5 font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-xs cursor-pointer transition-colors"
                >
                  Create Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GST Tax Invoice & Dispatch Packing Slip Modal */}
      <TaxInvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        order={activeOrderModal}
        sellerUser={sellerUser}
      />

      {/* Automated Delivery Partner AWB & Dispatch Modal */}
      <CreateShipmentModal
        isOpen={isCreateShipmentModalOpen}
        onClose={() => setIsCreateShipmentModalOpen(false)}
        order={activeOrderModal}
        onShipmentCreated={(result) => {
          if (activeOrderModal && result?.awbNumber) {
            updateOrderStatus(activeOrderModal.id || activeOrderModal._id, 'Shipped', {
              trackingNumber: result.awbNumber,
              courierName: result.order?.shipmentDetails?.courierPartnerName || 'Shiprocket Courier'
            });
          }
        }}
      />
    </div>
  );
}
