import React, { useState, useMemo, useEffect } from 'react';
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
import { useSellerData } from '../context/SellerDataContext';
import TaxInvoiceModal from './TaxInvoiceModal';
import CreateShipmentModal from './CreateShipmentModal';
import { generateRiderWhatsAppMessage, buildRiderWhatsAppUrl } from '../utils/whatsappRiderHelper';
import { SERVER_URL } from '../utils/api';

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
  const { orders, products = [], updateOrderStatus, updateOrderItemStatus, updateReturnExchangeStatus, resendDeliveryBoyWhatsApp, addOrder, deleteOrder, downloadSellerInvoice, sellerUser } = useSellerData();
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeOrderModal, setActiveOrderModal] = useState(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isShipModalOpen, setIsShipModalOpen] = useState(false);
  const [isCreateShipmentModalOpen, setIsCreateShipmentModalOpen] = useState(false);
  const [shippingOrderId, setShippingOrderId] = useState(null);
  const [trackingNumberInput, setTrackingNumberInput] = useState('');
  const [courierInput, setCourierInput] = useState('Delhivery');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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

  // Sync active modal input values when activeOrderModal opens
  useEffect(() => {
    if (activeOrderModal) {
      setModalStatusInput(activeOrderModal.status || 'Pending');
      setModalCourierInput(activeOrderModal.courierName || 'Delhivery');
      setModalTrackingInput(activeOrderModal.trackingNumber || '');
      const isSelf = activeOrderModal.deliveryMode === 'self_delivery' ||
        activeOrderModal.deliveryType === 'self_delivery' ||
        activeOrderModal.deliveryType === 'self' ||
        Boolean(activeOrderModal.selfDeliveryDetails?.deliveryPartnerToken);
      setDeliveryModeInput(isSelf ? 'self_delivery' : (activeOrderModal.deliveryMode || activeOrderModal.deliveryType || 'third_party'));
      setModalDriverName(activeOrderModal.selfDeliveryDetails?.deliveryPersonName || '');
      setModalDriverPhone(activeOrderModal.selfDeliveryDetails?.deliveryPersonPhone || '');
      setModalVehicleNumber(activeOrderModal.selfDeliveryDetails?.vehicleNumber || '');
      setModalSelfDeliveryToken(activeOrderModal.selfDeliveryDetails?.deliveryPartnerToken || `DLV-${Math.floor(100000 + Math.random() * 900000)}`);
      
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
  }, [activeOrderModal]);

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
    if (req && typeof req === 'object') {
      const type = req.requestType || req.type;
      const status = String(req.status || '').toLowerCase().trim();
      const invalidStatuses = ['', 'none', 'n/a', 'no_request', 'normal', 'null', 'undefined', 'requesting', 'requested'];
      
      if (type && !['none', 'n/a', ''].includes(String(type).toLowerCase())) return true;
      if (status && !invalidStatuses.includes(status)) return true;
      if (req.requestedAt) return true;
      if (req.reason && req.reason !== 'N/A' && req.reason.trim() !== '') return true;
    }
    const s = String(order.status || order.rawStatus || '').toLowerCase();
    const returnStatuses = [
      'return_requested', 'exchange_requested', 'return_approved', 'exchange_approved',
      'return_rejected', 'exchange_rejected', 'pickup_scheduled', 'product_received',
      'refund_initiated', 'refund_processed', 'refund_completed', 'exchanged', 'exchange_dispatched',
      'refund_requested', 'refunded'
    ];
    return returnStatuses.includes(s);
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
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        order.id?.toLowerCase().includes(query) ||
        order.customerName?.toLowerCase().includes(query) ||
        order.school?.toLowerCase().includes(query) ||
        order.customerPhone?.toLowerCase().includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [orders, selectedStatus, searchQuery]);

  const handleOpenShipModal = (orderId) => {
    setShippingOrderId(orderId);
    const ord = orders.find(o => String(o.id || o._id) === String(orderId));
    const assignedCourier = ord?.courierName && ord.courierName !== 'N/A' ? ord.courierName : (courierInput || 'Delhivery');
    setCourierInput(assignedCourier);
    setTrackingNumberInput(ord?.trackingNumber || generateDynamicTrackingId(assignedCourier));
    setIsShipModalOpen(true);
  };

  const handleConfirmShip = () => {
    if (shippingOrderId) {
      const finalAwb = trackingNumberInput.trim() || generateDynamicTrackingId(courierInput || 'BlueDart');
      updateOrderStatus(shippingOrderId, 'Shipped', {
        trackingNumber: finalAwb,
        courierName: courierInput
      });
      setIsShipModalOpen(false);
      setShippingOrderId(null);
    }
  };

  const handleRegenerateFreshDeliveryLink = () => {
    const newToken = `DLV-${Math.floor(100000 + Math.random() * 900000)}`;
    setModalSelfDeliveryToken(newToken);
    alert('🔄 Fresh delivery link token generated! Click "Save & Update Order" to save and share the new link.');
  };

  const generateSelfDeliveryDetails = (order = activeOrderModal) => {
    const tokenVal = String(modalSelfDeliveryToken || order?.selfDeliveryDetails?.deliveryPartnerToken || `DLV-${Math.floor(100000 + Math.random() * 900000)}`).trim();
    const trackingLink = `${window.location.protocol}//${window.location.host}/#delivery-partner?token=${encodeURIComponent(tokenVal)}`;

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

      const effectiveDeliveryMode = isExistingSelf ? 'self_delivery' : (isExistingThirdParty ? 'third_party' : deliveryModeInput);
      const effectiveCourier = isExistingThirdParty && activeOrderModal.courierName ? activeOrderModal.courierName : modalCourierInput;

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
        tokenVal = String(modalSelfDeliveryToken || activeOrderModal.selfDeliveryDetails?.deliveryPartnerToken || `DLV-${Math.floor(100000 + Math.random() * 900000)}`).trim();
        const websiteOrigin = import.meta.env.VITE_WEBSITE_URL || import.meta.env.VITE_CLIENT_URL || `${window.location.protocol}//${window.location.hostname}:5173`;
        trackingLink = `${websiteOrigin.replace(/\/+$/, '')}/#delivery-partner?token=${encodeURIComponent(tokenVal)}`;
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
        deliveryMode: deliveryModeInput,
        deliveryType: deliveryModeInput,
        courierName: deliveryModeInput === 'third_party' ? modalCourierInput : '',
        trackingNumber: deliveryModeInput === 'third_party' ? modalTrackingInput.trim() : tokenVal,
        trackingUrl: deliveryModeInput === 'self_delivery' ? trackingLink : carrierUrl,
        sellerDetails: sellerPayload,
        selfDeliveryDetails: serverSelfDetails
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
    const websiteOrigin = import.meta.env.VITE_WEBSITE_URL || import.meta.env.VITE_CLIENT_URL || `${window.location.protocol}//${window.location.hostname}:5173`;
    const tokenVal = String(modalSelfDeliveryToken || activeOrderModal.selfDeliveryDetails?.deliveryPartnerToken || `DLV-${activeOrderModal.id}`).trim();
    const trackingLink = `${websiteOrigin.replace(/\/+$/, '')}/#delivery-partner?token=${encodeURIComponent(tokenVal)}`;

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
              {filteredOrders.length === 0 ? (
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
                          {(o.deliveryMode === 'self_delivery' || o.deliveryType === 'self_delivery' || o.selfDeliveryDetails?.deliveryPartnerToken) ? (
                            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-teal-100 text-teal-800">
                              🛵 Self-Delivery
                            </span>
                          ) : (o.courierName && o.courierName !== 'N/A') ? (
                            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                              🚚 {o.courierName}
                            </span>
                          ) : null}
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
                        <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          o.paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {o.paymentStatus || 'Paid'}
                        </span>
                      </td>

                      {/* Interactive Status Selector */}
                      <td className="py-3.5 px-3">
                        <div className="flex flex-col gap-1">
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
                            <option value="Return Requested">🔄 Return Requested</option>
                            <option value="Exchange Requested">🔄 Exchange Requested</option>
                            <option value="Refunded">💳 Refunded</option>
                            {o.status && !['Pending', 'Confirmed', 'Processing', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Return Requested', 'Exchange Requested', 'Refunded'].includes(o.status) && (
                              <option value={o.status}>{o.status}</option>
                            )}
                          </select>
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
                  const modalStatus = String(activeOrderModal.status || '').toLowerCase().trim();
                  const isPending = modalStatus === 'pending' || modalStatus === 'placed' || modalStatus === 'unconfirmed';
                  const hasPendingItem = Array.isArray(activeOrderModal.items) && activeOrderModal.items.some(it => {
                    const itStatus = String(it.status || '').toLowerCase().trim();
                    return !itStatus || itStatus === 'pending' || itStatus === 'placed' || itStatus === 'unconfirmed';
                  });
                  const isLocked = isPending || hasPendingItem;

                  return (
                    <button
                      onClick={() => setIsInvoiceModalOpen(true)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 font-bold rounded-xl transition-colors cursor-pointer text-xs ${
                        isLocked
                          ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200'
                      }`}
                      title={isLocked ? "Invoice locked while order/product status is pending confirmation" : "View & Print GST Tax Invoice & Packing Slip"}
                    >
                      {isLocked ? <Lock size={14} /> : <FileText size={14} />}
                      <span>{isLocked ? 'Invoice Locked (Pending)' : 'Tax Invoice & Label'}</span>
                    </button>
                  );
                })()}

                {(activeOrderModal.paymentStatus?.toLowerCase() === 'refunded' ||
                  activeOrderModal.status?.toLowerCase().includes('refund') ||
                  activeOrderModal.returnRequest?.status?.toLowerCase().includes('refund') ||
                  activeOrderModal.status === 'product_received') && (
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

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div className="bg-white p-2.5 rounded-lg border border-purple-100">
                            <span className="text-[10px] font-bold uppercase text-purple-600 block">Original Item to Collect:</span>
                            <strong className="text-gray-900">{activeOrderModal.returnRequest?.itemName || activeOrderModal.items?.[0]?.name}</strong>
                            <div className="text-[11px] text-gray-600 mt-0.5 font-mono">
                              Spec: {activeOrderModal.items?.[0]?.size ? `Size ${activeOrderModal.items?.[0]?.size}` : (activeOrderModal.returnRequest?.isMeterBased ? `${activeOrderModal.items?.[0]?.quantity}m` : 'Base Item')} • Price: ₹{activeOrderModal.returnRequest?.originalItemPrice || activeOrderModal.items?.[0]?.price}
                            </div>
                          </div>

                          <div className="bg-white p-2.5 rounded-lg border border-purple-100">
                            <span className="text-[10px] font-bold uppercase text-indigo-600 block">Replacement Item to Send:</span>
                            <strong className="text-gray-900">{activeOrderModal.returnRequest?.itemName || activeOrderModal.items?.[0]?.name}</strong>
                            <div className="text-[11px] text-indigo-900 font-extrabold mt-0.5 font-mono">
                              Requested: {activeOrderModal.returnRequest?.exchangeLength ? `${activeOrderModal.returnRequest.exchangeLength} Meter(s)` : (activeOrderModal.returnRequest?.exchangeSize || 'Replacement')} • Price: ₹{activeOrderModal.returnRequest?.replacementItemPrice || activeOrderModal.returnRequest?.originalItemPrice || activeOrderModal.items?.[0]?.price}
                            </div>
                          </div>
                        </div>

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
                  <div className="pt-2 border-t border-amber-200/80 flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-bold text-amber-900 mr-1">Manage Request:</span>
                    
                    <button
                      type="button"
                      onClick={() => handleReturnExchangeAction(activeOrderModal.id, 'approved', { notes: 'Approved by merchant' })}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] rounded-lg shadow-2xs transition-colors cursor-pointer"
                    >
                      ✓ Approve {activeOrderModal.returnRequest?.type === 'exchange' ? 'Exchange' : 'Return'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const reason = prompt('Enter rejection reason for customer:');
                        if (reason !== null) {
                          handleReturnExchangeAction(activeOrderModal.id, 'rejected', { rejectionReason: reason || 'Criteria not met' });
                        }
                      }}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[11px] rounded-lg shadow-2xs transition-colors cursor-pointer"
                    >
                      ✕ Reject Request
                    </button>

                    <button
                      type="button"
                      onClick={() => handleReturnExchangeAction(activeOrderModal.id, 'pickup_scheduled', { pickupDate: new Date() })}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[11px] rounded-lg shadow-2xs transition-colors cursor-pointer"
                    >
                      📦 Schedule Pickup
                    </button>

                    <button
                      type="button"
                      onClick={() => handleReturnExchangeAction(activeOrderModal.id, 'product_received', { notes: 'Item received back & stock auto-restored' })}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[11px] rounded-lg shadow-2xs transition-colors cursor-pointer"
                      title="Mark item received & automatically restore inventory stock"
                    >
                      📥 Mark Product Received (Auto-Restores Stock)
                    </button>

                    {(activeOrderModal.returnRequest?.type === 'return' || !activeOrderModal.returnRequest?.type) && (
                      <button
                        type="button"
                        onClick={() => {
                          const txnId = prompt('Enter Refund Reference/Transaction ID:');
                          if (txnId !== null) {
                            handleReturnExchangeAction(activeOrderModal.id, 'refund_completed', { refundTxnId: txnId || `REF-${Date.now()}` });
                          }
                        }}
                        className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-[11px] rounded-lg shadow-2xs transition-colors cursor-pointer"
                      >
                        💳 Process Refund
                      </button>
                    )}

                    {activeOrderModal.returnRequest?.type === 'exchange' && (
                      <button
                        type="button"
                        onClick={() => {
                          const awb = prompt('Enter Replacement Courier Tracking AWB:');
                          if (awb !== null) {
                            handleReturnExchangeAction(activeOrderModal.id, 'exchange_dispatched', { exchangeAwb: awb || 'AWB-EXCHANGE', exchangeCourier: 'Delhivery' });
                          }
                        }}
                        className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-[11px] rounded-lg shadow-2xs transition-colors cursor-pointer"
                      >
                        🚀 Dispatch Replacement Unit
                      </button>
                    )}
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
                    {typeof activeOrderModal.shippingAddress === 'object' && activeOrderModal.shippingAddress !== null
                      ? [
                          activeOrderModal.shippingAddress.name || activeOrderModal.shippingAddress.fullName,
                          activeOrderModal.shippingAddress.addressLine || activeOrderModal.shippingAddress.street || activeOrderModal.shippingAddress.address,
                          activeOrderModal.shippingAddress.colony || activeOrderModal.shippingAddress.landmark,
                          activeOrderModal.shippingAddress.city,
                          activeOrderModal.shippingAddress.state,
                          activeOrderModal.shippingAddress.pincode ? `- ${activeOrderModal.shippingAddress.pincode}` : null,
                          activeOrderModal.shippingAddress.phone ? `(Phone: ${activeOrderModal.shippingAddress.phone})` : null
                        ].filter(Boolean).join(', ')
                      : (activeOrderModal.shippingAddress || 'Store / Counter Pickup')}
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

                const isDeliveryPartnerLocked = Boolean(
                  isSelfDeliveryAssigned ||
                  isThirdPartyAssigned ||
                  ['Shipped', 'Out for Delivery', 'Delivered', 'Completed'].includes(activeOrderModal.status)
                );

                const lockedPartnerName = isSelfDeliveryAssigned
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

                    {/* Delivery Partner Permanent Lock Banner */}
                    {isDeliveryPartnerLocked && (
                      <div className="bg-amber-100/90 border border-amber-300 rounded-xl px-3.5 py-2 flex items-center justify-between text-xs text-amber-950 font-bold shadow-2xs">
                        <div className="flex items-center gap-2">
                          <Lock size={15} className="text-amber-800 shrink-0" />
                          <span>Delivery Partner Locked: <strong className="text-amber-950 underline decoration-amber-400">{lockedPartnerName}</strong></span>
                        </div>
                        <span className="text-[10px] uppercase tracking-wider bg-amber-200/90 px-2 py-0.5 rounded text-amber-900 border border-amber-300 font-extrabold">
                          Permanent
                        </span>
                      </div>
                    )}

                    {/* Mode Selector Tabs */}
                    <div className="grid grid-cols-2 gap-2 bg-teal-100/60 p-1 rounded-xl">
                      <button
                        type="button"
                        disabled={isDeliveryPartnerLocked}
                        onClick={() => {
                          if (!isDeliveryPartnerLocked) setDeliveryModeInput('third_party');
                        }}
                        className={`py-1.5 rounded-lg font-bold text-[11px] transition-all ${
                          isDeliveryPartnerLocked ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'
                        } ${
                          deliveryModeInput === 'third_party'
                            ? 'bg-white text-teal-900 shadow-xs'
                            : 'text-teal-800 hover:text-teal-950'
                        }`}
                      >
                        🚚 3rd-Party Courier (Delhivery/BlueDart)
                      </button>
                      <button
                        type="button"
                        disabled={isDeliveryPartnerLocked}
                        onClick={() => {
                          if (!isDeliveryPartnerLocked) setDeliveryModeInput('self_delivery');
                        }}
                        className={`py-1.5 rounded-lg font-bold text-[11px] transition-all ${
                          isDeliveryPartnerLocked ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'
                        } ${
                          deliveryModeInput === 'self_delivery'
                            ? 'bg-white text-teal-900 shadow-xs'
                            : 'text-teal-800 hover:text-teal-950'
                        }`}
                      >
                        🛵 Self-Delivery (Direct / Store)
                      </button>
                    </div>

                    {/* Mode A: 3rd Party Courier Fields */}
                    {deliveryModeInput === 'third_party' ? (
                      <div className="space-y-3">
                        <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 flex items-center justify-between">
                          <div>
                            <strong className="block text-amber-950 font-bold text-xs">Automated Courier Dispatch (Shiprocket / Delhivery / BlueDart)</strong>
                            <span className="text-[10px] text-amber-800">Auto-calculate freight rate, generate AWB, and print shipping label PDF</span>
                          </div>
                          {(isThirdPartyAssigned || activeOrderModal.trackingNumber || activeOrderModal.shipmentDetails?.awbNumber) ? (
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
                              {isThirdPartyAssigned && (
                                <span className="text-[10px] text-amber-800 font-bold flex items-center gap-1">
                                  <Lock size={10} /> Locked
                                </span>
                              )}
                            </div>
                            <select
                              disabled={isThirdPartyAssigned}
                              value={modalCourierInput}
                              onChange={(e) => {
                                if (isThirdPartyAssigned) return;
                                const selected = e.target.value;
                                setModalCourierInput(selected);
                                if (!modalTrackingInput.trim()) {
                                  setModalTrackingInput(generateDynamicTrackingId(selected));
                                }
                              }}
                              className={`w-full px-3 py-2 rounded-xl border font-medium focus:outline-none ${
                                isThirdPartyAssigned
                                  ? 'bg-gray-100 text-gray-700 border-gray-300 cursor-not-allowed'
                                  : 'bg-white border-gray-200 focus:border-teal-600'
                              }`}
                            >
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
                          value={`${window.location.protocol}//${window.location.host}/#delivery-partner?token=${modalSelfDeliveryToken || ('DLV-' + activeOrderModal?.id)}`}
                          className="flex-1 px-2.5 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-[11px] font-mono text-gray-700 truncate select-all"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const link = `${window.location.protocol}//${window.location.host}/#delivery-partner?token=${modalSelfDeliveryToken || ('DLV-' + activeOrderModal?.id)}`;
                            navigator.clipboard.writeText(link);
                            alert('📋 Rider Executive Link copied! (Share with Driver only)');
                          }}
                          className="px-2.5 py-1.5 bg-teal-800 hover:bg-teal-900 text-white font-bold text-[11px] rounded-lg shadow-2xs transition-colors shrink-0 cursor-pointer"
                        >
                          Copy Driver Link
                        </button>
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
                          <div className="font-bold text-gray-900 text-xs min-w-[50px] text-right">₹{(item.price * item.quantity)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Summary Footer & Complete Itemized Price Breakdown */}
              {(() => {
                const subtotalVal = Number(activeOrderModal.sellerSubtotal || activeOrderModal.subtotal || activeOrderModal.items?.reduce((acc, i) => acc + (Number(i.price || 0) * Number(i.quantity || 1)), 0) || activeOrderModal.total || 0);
                const shipVal = Number(activeOrderModal.shippingFee ?? activeOrderModal.shippingCost ?? 0);
                const couponVal = Number(activeOrderModal.discountAmount ?? activeOrderModal.discount ?? 0);
                const codFeeVal = Number(activeOrderModal.codFee ?? activeOrderModal.codCharges ?? 0);
                const grandVal = Number(activeOrderModal.total || activeOrderModal.totalAmount || (subtotalVal + shipVal + codFeeVal - couponVal));

                let totalTaxable = 0;
                let totalTax = 0;
                (activeOrderModal.items || []).forEach(item => {
                  const qty = Number(item.quantity || 1);
                  const unitPrice = Number(item.price || 0);
                  const grossPrice = unitPrice * qty;
                  const gstRate = Number(item.gstPercent ?? item.gstPercentage ?? item.gstRate ?? item.gst ?? 5);
                  if (gstRate > 0) {
                    const taxable = grossPrice / (1 + gstRate / 100);
                    totalTaxable += taxable;
                    totalTax += (grossPrice - taxable);
                  } else {
                    totalTaxable += grossPrice;
                  }
                });

                const parseStateKeyFromText = (text) => {
                  if (!text) return '';
                  const str = String(text).toLowerCase();
                  const states = [
                    { key: 'uttarpradesh', aliases: ['uttar pradesh', 'uttarpradesh', 'up', 'noida', 'lucknow', 'kanpur', 'ghaziabad', 'agra', 'varanasi', 'prayagraj'] },
                    { key: 'delhi', aliases: ['delhi', 'new delhi', 'nct of delhi', 'nct', 'dl'] },
                    { key: 'maharashtra', aliases: ['maharashtra', 'mumbai', 'pune', 'nagpur', 'thane', 'mh'] },
                    { key: 'karnataka', aliases: ['karnataka', 'bangalore', 'bengaluru', 'mysore', 'ka'] },
                    { key: 'tamilnadu', aliases: ['tamil nadu', 'tamilnadu', 'chennai', 'coimbatore', 'tn'] },
                    { key: 'haryana', aliases: ['haryana', 'gurugram', 'gurgaon', 'faridabad', 'hr'] },
                    { key: 'rajasthan', aliases: ['rajasthan', 'jaipur', 'jodhpur', 'udaipur', 'rj'] },
                    { key: 'westbengal', aliases: ['west bengal', 'westbengal', 'kolkata', 'wb'] },
                    { key: 'gujarat', aliases: ['gujarat', 'ahmedabad', 'surat', 'vadodara', 'gj'] },
                    { key: 'punjab', aliases: ['punjab', 'ludhiana', 'amritsar', 'pb'] },
                    { key: 'madhyapradesh', aliases: ['madhya pradesh', 'madhyapradesh', 'bhopal', 'indore', 'mp'] },
                    { key: 'bihar', aliases: ['bihar', 'patna', 'br'] },
                    { key: 'telangana', aliases: ['telangana', 'hyderabad', 'tg', 'ts'] },
                    { key: 'andhrapradesh', aliases: ['andhra pradesh', 'andhrapradesh', 'visakhapatnam', 'ap'] },
                    { key: 'kerala', aliases: ['kerala', 'kochi', 'thiruvananthapuram', 'kl'] },
                    { key: 'uttarakhand', aliases: ['uttarakhand', 'dehradun', 'uk'] }
                  ];

                  for (const st of states) {
                    for (const alias of st.aliases) {
                      if (new RegExp(`\\b${alias}\\b`, 'i').test(str)) {
                        return st.key;
                      }
                    }
                  }
                  return str.trim();
                };

                const getDynamicState = (obj, fallbackText) => {
                  if (obj && typeof obj === 'object') {
                    if (obj.state && String(obj.state).trim()) return parseStateKeyFromText(obj.state);
                    const combined = `${obj.street || ''} ${obj.addressLine || ''} ${obj.city || ''} ${obj.address || ''}`;
                    if (combined.trim()) return parseStateKeyFromText(combined);
                  }
                  return parseStateKeyFromText(fallbackText || '');
                };

                const firstSellerObj = activeOrderModal.items?.[0]?.sellerId;
                const sellerStateKey = getDynamicState(firstSellerObj, `${activeOrderModal.sellerState || ''} ${activeOrderModal.sellerCity || ''} ${activeOrderModal.sellerAddress || ''}`);
                const customerStateKey = getDynamicState(activeOrderModal.shippingAddress, typeof activeOrderModal.shippingAddress === 'string' ? activeOrderModal.shippingAddress : '');

                const isSameState = !sellerStateKey || !customerStateKey || sellerStateKey === customerStateKey;
                const sellerStateStr = (typeof firstSellerObj === 'object' ? firstSellerObj.state || firstSellerObj.city : '') || activeOrderModal.sellerState || sellerStateKey || 'Seller Location';
                const customerStateStr = (typeof activeOrderModal.shippingAddress === 'object' ? activeOrderModal.shippingAddress?.state || activeOrderModal.shippingAddress?.city : '') || customerStateKey || 'Customer Location';

                return (
                  <div className="p-3.5 bg-teal-50/50 rounded-xl border border-teal-100 space-y-2 text-xs">
                    <div className="flex justify-between text-gray-700">
                      <span>Items Subtotal:</span>
                      <span className="font-mono font-bold">₹{subtotalVal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-500 text-[11px]">
                      <span>Base Taxable Amount (Excl. GST):</span>
                      <span className="font-mono">₹{totalTaxable.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-teal-900 text-[11px] bg-teal-100/60 p-2 rounded-lg border border-teal-200">
                      <div>
                        <span className="font-bold block">GST Tax Breakdown ({isSameState ? 'Intra-State Same State' : 'Inter-State Different State'}):</span>
                        {isSameState ? (
                          <span className="text-[10px] text-teal-800">CGST (50%): ₹{(totalTax / 2).toFixed(2)} • SGST (50%): ₹{(totalTax / 2).toFixed(2)}</span>
                        ) : (
                          <span className="text-[10px] text-teal-800">IGST (Integrated 100%): ₹{totalTax.toFixed(2)} • Supply ({sellerStateStr} ➔ {customerStateStr})</span>
                        )}
                      </div>
                      <span className="font-mono font-bold self-center text-teal-950">₹{totalTax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-700">
                      <span>Delivery Charges:</span>
                      <span className="font-mono font-bold text-teal-800">
                        {shipVal === 0 ? 'Not Applied (FREE)' : `₹${shipVal.toFixed(2)}`}
                      </span>
                    </div>
                    {codFeeVal > 0 && (
                      <div className="flex justify-between text-gray-700">
                        <span>COD / Convenience Fee:</span>
                        <span className="font-mono font-bold text-teal-800">₹{codFeeVal.toFixed(2)}</span>
                      </div>
                    )}
                    {couponVal > 0 ? (
                      <div className="flex justify-between text-teal-800 font-bold">
                        <span>Offer / Coupon Applied:</span>
                        <span className="font-mono">-₹{couponVal.toFixed(2)}</span>
                      </div>
                    ) : (
                      <div className="flex justify-between text-gray-400 text-[11px]">
                        <span>Offer / Coupon:</span>
                        <span className="font-mono">Not Applied (₹0.00)</span>
                      </div>
                    )}
                    <div className="pt-2 border-t border-teal-200 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-teal-950">Total Payable Amount</div>
                        <div className="text-[10px] text-teal-700">{activeOrderModal.paymentMethod} • {activeOrderModal.paymentStatus}</div>
                      </div>
                      <div className="text-lg font-extrabold text-teal-900 font-mono">₹{grandVal.toFixed(2)}</div>
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
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-xs space-y-4">
            <h4 className="font-bold text-gray-900 text-base flex items-center gap-2">
              <Truck className="text-purple-700" size={20} /> Pack & Dispatch Order
            </h4>
            {(() => {
              const shipTargetOrder = orders.find(o => String(o.id || o._id) === String(shippingOrderId));
              const isShipTargetCourierLocked = Boolean(shipTargetOrder?.courierName && shipTargetOrder.courierName !== 'N/A');
              return (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="font-semibold text-gray-700">Courier Partner</label>
                      {isShipTargetCourierLocked && (
                        <span className="text-[10px] text-amber-800 font-bold flex items-center gap-1">
                          <Lock size={10} /> Locked: {shipTargetOrder.courierName}
                        </span>
                      )}
                    </div>
                    <select
                      disabled={isShipTargetCourierLocked}
                      value={courierInput}
                      onChange={(e) => {
                        if (isShipTargetCourierLocked) return;
                        const selected = e.target.value;
                        setCourierInput(selected);
                        setTrackingNumberInput(generateDynamicTrackingId(selected));
                      }}
                      className={`w-full px-3 py-2 rounded-xl border focus:outline-none ${
                        isShipTargetCourierLocked
                          ? 'bg-gray-100 text-gray-700 border-gray-300 cursor-not-allowed'
                          : 'border-gray-200'
                      }`}
                    >
                      <option value="Delhivery">Delhivery Express</option>
                      <option value="BlueDart">BlueDart Air Premium</option>
                      <option value="Ekart">Ekart Logistics</option>
                      <option value="DTDC">DTDC Courier</option>
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
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 font-mono"
                />
              </div>
            </div>
          );
        })()}

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
