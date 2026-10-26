import React, { useState, useEffect } from 'react';
import {
  Truck,
  Phone,
  MapPin,
  CheckCircle,
  Clock,
  ShieldCheck,
  RefreshCw,
  Navigation,
  AlertCircle,
  Key,
  Send,
  User,
  Package,
  ArrowLeft,
  DollarSign,
  Building2,
  CreditCard
} from 'lucide-react';
import {
  fetchDeliveryPartnerOrderApi,
  resendDeliveryOtpApi,
  verifyDeliveryOtpApi,
  updateDeliveryLocationApi,
  createSchoolBulkRemainingPaymentOrderApi,
  verifySchoolBulkRemainingPaymentApi,
  loadRazorpayScript
} from '../utils/api';

export const isUnstitchedProduct = (item) => {
  if (!item) return false;
  const candStr = [
    item.category,
    item.subCategory,
    item.name,
    item.title,
    item.unit,
    item.size,
    item.productId?.category,
    item.productId?.subCategory,
    item.productId?.name,
    item.productId?.unit
  ].filter(Boolean).join(' ').toLowerCase();

  return Boolean(
    item.isMeterBased ||
    item.unit === 'meter' ||
    item.unit === 'm' ||
    item.productId?.isMeterBased ||
    item.productId?.unit === 'meter' ||
    item.productId?.unit === 'm' ||
    candStr.includes('unstitched') ||
    candStr.includes('unstiched') ||
    candStr.includes('meter') ||
    candStr.includes('cloth') ||
    candStr.includes('fabric') ||
    (Number(item.quantity || item.qty) % 1 !== 0)
  );
};

export const formatItemQuantity = (item) => {
  const rawQty = Number(item?.quantity ?? item?.qty ?? 1);
  if (isNaN(rawQty)) return '1';
  if (isUnstitchedProduct(item) || rawQty % 1 !== 0) {
    return rawQty.toFixed(2);
  }
  return String(rawQty);
};

export default function DeliveryPartnerPage({ onNavigate }) {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [order, setOrder] = useState(null);
  const [isPayingRemaining, setIsPayingRemaining] = useState(false);
  const [error, setError] = useState(null);

  // OTP Verification Modal & Input State
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '']);
  const [verifying, setVerifying] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [deliverySuccess, setDeliverySuccess] = useState(false);

  // Resend OTP Feedback
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState('');

  // Cash Payment Verification by Executive State
  const [isCashVerifiedByExecutive, setIsCashVerifiedByExecutive] = useState(false);

  // Live GPS Broadcast State
  const [isGpsBroadcasting, setIsGpsBroadcasting] = useState(false);
  const [gpsStatus, setGpsStatus] = useState('');

  // Active OTP Timers (Countdown & Cooldown)
  const [resendCooldown, setResendCooldown] = useState(0);
  const [expirySeconds, setExpirySeconds] = useState(0);

  // Active 1-second countdown timer interval
  useEffect(() => {
    if (resendCooldown <= 0 && expirySeconds <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      setExpirySeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown, expirySeconds]);

  // Sync timers from order timestamps
  useEffect(() => {
    if (!order) return;
    const sentAt = order.selfDeliveryDetails?.otpLastSentAt;
    const expiresAt = order.selfDeliveryDetails?.otpExpiresAt;
    const now = Date.now();

    if (sentAt) {
      const sentMs = new Date(sentAt).getTime();
      const elapsedSec = Math.floor((now - sentMs) / 1000);
      const remainingCooldown = Math.max(0, 60 - elapsedSec);
      setResendCooldown(remainingCooldown);
    }

    if (expiresAt) {
      const remainingExp = Math.max(0, Math.floor((new Date(expiresAt).getTime() - now) / 1000));
      setExpirySeconds(remainingExp);
    } else {
      // Keep OTP active (24-hour validity) while delivery/exchange is active
      setExpirySeconds(86400);
    }
  }, [order]);

  // Resolve token from URL hash or query string
  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      let queryToken = searchParams.get('token') || searchParams.get('orderId');

      if (!queryToken && window.location.hash) {
        const hashStr = window.location.hash.split('?')[1];
        if (hashStr) {
          const hashParams = new URLSearchParams(hashStr);
          queryToken = hashParams.get('token') || hashParams.get('orderId');
        }
      }

      if (queryToken) {
        setToken(queryToken);
      } else {
        setToken('');
      }
    } catch {
      setToken('');
    }
  }, []);

  const loadOrder = async (targetToken) => {
    const activeToken = targetToken || token;
    if (!activeToken) return;

    if (targetToken === token || !targetToken) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    setError(null);
    try {
      const res = await fetchDeliveryPartnerOrderApi(activeToken);
      if (res && res.success && res.order) {
        const ord = res.order;
        setOrder(ord);
        setError(null);
        const statusStr = String(ord.overallStatus || ord.status || '').toLowerCase().trim();
        const retReqType = String(ord.returnRequest?.type || '').toLowerCase().trim();
        const retReqStatus = String(ord.returnRequest?.status || '').toLowerCase().trim();

        const isExchange = Boolean(
          ord.isExchangeTask ||
          retReqType === 'exchange' ||
          statusStr.includes('exchange')
        );
        const isReturn = Boolean(
          ord.isReturnTask ||
          retReqType === 'return' ||
          (!isExchange && Boolean(retReqType || ord.returnRequest?.reason)) ||
          statusStr.includes('return')
        );

        let isCompleted = false;
        if (isExchange) {
          // Exchange handover requires customer OTP verification; only 'exchanged' indicates finished task
          isCompleted = (statusStr === 'exchanged' || retReqStatus === 'exchanged');
        } else if (isReturn) {
          // Return pickup is completed once verified by rider with OTP
          const delStatus = String(ord.deliveryStatus || '').toLowerCase();
          const selfStatus = String(ord.selfDeliveryDetails?.status || '').toLowerCase();
          isCompleted = (
            statusStr === 'returned' ||
            retReqStatus === 'returned' ||
            ((statusStr === 'product_received' || retReqStatus === 'product_received') && (delStatus.includes('returned') || selfStatus.includes('completed') || delStatus.includes('completed')))
          );
        } else {
          // Regular forward delivery
          isCompleted = (statusStr === 'delivered' || statusStr === 'completed');
        }

        setDeliverySuccess(Boolean(isCompleted));
        const isBulkPaid = Boolean(ord.isBulkOrder) && (ord.paymentStatus === 'paid' || ord.remainingPaymentStatus === 'paid');
        const isOnline = !ord.isBulkOrder && (
          !String(ord.paymentMethod || '').toUpperCase().includes('COD') &&
          (ord.paymentStatus === 'paid' || ord.paymentStatus === 'Paid' || String(ord.paymentMethod || '').toLowerCase() !== 'cod')
        );
        if (!ord.isBulkOrder && (isOnline || ord.paymentStatus === 'paid' || ord.paymentStatus === 'Paid')) {
          setIsCashVerifiedByExecutive(true);
        } else {
          setIsCashVerifiedByExecutive(false);
        }
      } else {
        setOrder(null);
        setError(res?.message || 'Delivery task not found or the link is expired.');
        setDeliverySuccess(false);
      }
    } catch (err) {
      setOrder(null);
      setError(err.message || 'Failed to load delivery task');
      setDeliverySuccess(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadOrder(token);
    }
  }, [token]);

  // Live GPS Broadcast effect
  useEffect(() => {
    let intervalId = null;
    if (isGpsBroadcasting && token) {
      const sendLocation = () => {
        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const { latitude, longitude } = pos.coords;
              updateDeliveryLocationApi(token, latitude, longitude)
                .then(() => setGpsStatus(`Updated ${new Date().toLocaleTimeString()}`))
                .catch(() => setGpsStatus('GPS Broadcast Failed'));
            },
            () => setGpsStatus('GPS Access Denied')
          );
        }
      };
      sendLocation();
      intervalId = setInterval(sendLocation, 15000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isGpsBroadcasting, token]);

  const handlePayRemainingBalance = async () => {
    if (!order || isPayingRemaining) return;
    try {
      setIsPayingRemaining(true);
      const isRazorpayReady = await loadRazorpayScript();
      if (!isRazorpayReady || typeof window.Razorpay === 'undefined') {
        alert('Razorpay payment gateway failed to load. Please check your internet connection.');
        setIsPayingRemaining(false);
        return;
      }

      const targetId = order.id || order._id || order.orderId;
      const rzpRes = await createSchoolBulkRemainingPaymentOrderApi(targetId);
      if (!rzpRes?.success && !rzpRes?.razorpayOrderId) {
        alert(rzpRes?.message || 'Failed to initialize online remaining balance payment.');
        setIsPayingRemaining(false);
        return;
      }

      const options = {
        key: rzpRes.key || 'rzp_test_6kz5nGEzi8uXRw',
        amount: rzpRes.amount,
        currency: rzpRes.currency || 'INR',
        name: 'Bookvardi Bulk Procurement',
        description: `Remaining Balance for Order #${rzpRes.referenceId || order.orderId}`,
        order_id: rzpRes.razorpayOrderId,
        prefill: {
          name: rzpRes.customer?.name || order.customer?.name || '',
          contact: rzpRes.customer?.phone || order.customer?.phone || '',
          email: rzpRes.customer?.email || order.customer?.email || ''
        },
        theme: {
          color: '#0f766e'
        },
        handler: async (response) => {
          try {
            const verifyRes = await verifySchoolBulkRemainingPaymentApi(targetId, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              paidAmount: rzpRes.remainingAmountRupees || order.remainingAmount
            });

            if (verifyRes && verifyRes.success) {
              setOrder((prev) => (prev ? {
                ...prev,
                paymentStatus: 'paid',
                remainingPaymentStatus: 'paid'
              } : prev));
              window.dispatchEvent(new CustomEvent('bv_orders_updated'));
              try {
                localStorage.setItem('bv_order_sync_timestamp', Date.now().toString());
              } catch (e) {}
              alert(`🎉 Remaining balance payment of ₹${(rzpRes.remainingAmountRupees || order.remainingAmount).toLocaleString()} verified successfully! Please enter the customer 4-digit OTP to complete delivery.`);
            } else {
              alert(verifyRes?.message || 'Payment received but verification failed. Please contact support.');
            }
          } catch (vErr) {
            console.error('Remaining payment verification error:', vErr);
            alert('Online remaining payment verification error. Please refresh and check status.');
          } finally {
            setIsPayingRemaining(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsPayingRemaining(false);
          }
        }
      };

      const rzpInstance = new window.Razorpay(options);
      rzpInstance.open();
    } catch (err) {
      console.error('Initiate remaining payment error:', err);
      alert('Failed to connect to online payment gateway: ' + err.message);
      setIsPayingRemaining(false);
    }
  };

  const rawMethod = String(order?.paymentMethod || '').trim().toLowerCase();
  const rawStatus = String(order?.paymentStatus || '').trim().toLowerCase();

  const isExchangeOrder = Boolean(
    order?.isExchangeTask ||
    order?.returnRequest?.type === 'exchange' ||
    String(order?.overallStatus || order?.status || '').toLowerCase().includes('exchange')
  );
  const isReturnOrder = Boolean(
    order?.isReturnTask ||
    order?.returnRequest?.type === 'return' ||
    (!isExchangeOrder && Boolean(order?.returnRequest?.type || order?.returnRequest?.reason)) ||
    String(order?.overallStatus || order?.status || '').toLowerCase().includes('return') ||
    String(order?.overallStatus || order?.status || '').toLowerCase().includes('pickup')
  );

  const returnReq = order?.returnRequest || {};
  const exchangeDiff = Number(returnReq.priceDifference || 0);
  const exchangeAdjType = returnReq.priceAdjustmentType || (exchangeDiff > 0 ? 'extra_payment' : exchangeDiff < 0 ? 'partial_refund' : 'none');
  const isExchangeExtraPayment = isExchangeOrder && exchangeAdjType === 'extra_payment' && exchangeDiff > 0;
  const isExchangeRefund = isExchangeOrder && (exchangeAdjType === 'partial_refund' || exchangeDiff < 0);
  const isExchangeEqual = isExchangeOrder && (exchangeAdjType === 'none' || exchangeDiff === 0);

  const isCod = !isExchangeOrder && !isReturnOrder && Boolean(
    order?.isCod ||
    rawMethod.includes('cod') ||
    rawMethod.includes('cash')
  );

  const isBulkPaid = Boolean(order?.isBulkOrder) && (
    rawStatus === 'paid' ||
    rawStatus === 'completed' ||
    String(order?.remainingPaymentStatus || '').toLowerCase() === 'paid'
  );

  const isCashCollected = Boolean(
    isCashVerifiedByExecutive ||
    deliverySuccess ||
    (order?.overallStatus === 'Delivered' && (rawStatus === 'paid' || rawStatus === 'completed'))
  );

  const isOnlinePaid = !order?.isBulkOrder && !isCod && !isExchangeOrder && !isReturnOrder && (
    rawStatus === 'paid' || rawStatus === 'completed'
  );

  const isPaymentVerified = isReturnOrder
    ? true // Reverse pickup requires no payment collection from customer
    : isExchangeOrder
    ? (!isExchangeExtraPayment || isCashVerifiedByExecutive || deliverySuccess)
    : (order?.isBulkOrder ? isBulkPaid : (isOnlinePaid || isCashCollected));

  const totalAmountNum = Number(order?.totalAmount ?? order?.total ?? 0);
  const formattedTotalAmount = totalAmountNum % 1 !== 0 ? totalAmountNum.toFixed(2) : totalAmountNum.toLocaleString('en-IN');
  const customerPhone = String(order?.customer?.phone || order?.shippingAddress?.phone || order?.phone || '').trim();

  const formatTimeRemaining = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}h ${String(mins).padStart(2, '0')}m`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleResendOtp = async () => {
    if (!token || resending || verifying || !order) return;
    if (!isPaymentVerified) {
      alert('🔒 Cash payment must be collected & verified by executive before sending OTP.');
      return;
    }
    setResending(true);
    setResendMsg('');
    setOtpError('');
    try {
      const res = await resendDeliveryOtpApi(token, { isCashCollected: isCashVerifiedByExecutive, isPaymentVerified });
      if (res && res.success) {
        setResendMsg(res.message || `📲 Fresh OTP sent to customer (${order?.customer?.phone || ''})`);
        setResendCooldown(res.cooldownSeconds || 60);
        setExpirySeconds(86400); // 24 hours live validity
        setOrder((prev) => prev ? {
          ...prev,
          selfDeliveryDetails: {
            ...prev.selfDeliveryDetails,
            otpLastSentAt: res.otpLastSentAt || new Date().toISOString(),
            otpExpiresAt: res.otpExpiresAt || new Date(Date.now() + 600000).toISOString()
          }
        } : prev);
        setOtpDigits(['', '', '', '']);
        setTimeout(() => {
          const el = document.getElementById('otp-input-0');
          if (el) el.focus();
        }, 100);
      } else {
        setOtpError(res?.message || '📲 OTP could not be resent right now.');
      }
    } catch {
      setOtpError('📲 OTP dispatch failed. Please check network and try again.');
    } finally {
      setResending(false);
      setTimeout(() => setResendMsg(''), 6000);
    }
  };

  const handleOpenOtpModal = () => {
    if (!isPaymentVerified) {
      alert('Please collect & verify payment before proceeding to OTP verification.');
      return;
    }
    setIsOtpModalOpen(true);
    setOtpError('');
  };

  const handleDigitChange = (index, value) => {
    const clean = value.replace(/\D/g, '').slice(-1);
    const nextDigits = [...otpDigits];
    nextDigits[index] = clean;
    setOtpDigits(nextDigits);
    setOtpError('');

    if (clean && index < 3) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleDigitKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleVerifyOtpSubmit = async (e) => {
    e?.preventDefault();
    const fullOtp = otpDigits.join('');
    if (fullOtp.length < 4) {
      setOtpError('Please enter full 4-digit OTP code.');
      return;
    }

    if (expirySeconds === 0 && order?.selfDeliveryDetails?.otpExpiresAt && new Date(order.selfDeliveryDetails.otpExpiresAt).getTime() < Date.now()) {
      setOtpError('Delivery OTP has expired. Please click "Resend OTP" to get a fresh PIN.');
      return;
    }

    if (verifying || !token) return;

    setVerifying(true);
    setOtpError('');
    try {
      const res = await verifyDeliveryOtpApi(token, fullOtp, { isCashCollected: isCashVerifiedByExecutive, isPaymentVerified });
      if (res && res.success) {
        setIsOtpModalOpen(false);
        setDeliverySuccess(true);
        setOtpError('');
        setOtpDigits(['', '', '', '']);
        const successMsg = isReturnOrder
          ? '📦 Return Pickup OTP verified! Item marked as Product Received & Restocked.'
          : isExchangeOrder
          ? '🔄 Exchange OTP verified! Order marked as Exchanged.'
          : '🎉 Delivery OTP verified successfully! Order marked as Delivered.';
        setResendMsg(res?.message || successMsg);
        const finalStatus = isReturnOrder ? 'product_received' : isExchangeOrder ? 'exchanged' : 'Delivered';
        setOrder((prev) => (prev ? {
          ...prev,
          overallStatus: finalStatus,
          status: finalStatus,
          paymentStatus: isReturnOrder ? prev.paymentStatus : 'paid',
          returnRequest: prev.returnRequest ? { ...prev.returnRequest, status: finalStatus } : null
        } : prev));
        window.dispatchEvent(new CustomEvent('bv_orders_updated'));
        try {
          localStorage.setItem('bv_order_sync_timestamp', Date.now().toString());
        } catch (e) {}
      } else {
        const defaultErr = isReturnOrder
          ? 'Invalid Return Pickup OTP. Please ask customer for correct 4-digit PIN.'
          : isExchangeOrder
          ? 'Invalid Exchange OTP. Please ask customer for correct 4-digit PIN.'
          : 'Invalid Delivery OTP code. Please ask customer for the correct 4-digit PIN.';
        setOtpError(res?.message || defaultErr);
      }
    } catch (err) {
      setOtpError(err.message || 'Verification failed. Please check OTP code.');
    } finally {
      setVerifying(false);
    }
  };

  const formattedAddressStr = order?.shippingAddress
    ? typeof order.shippingAddress === 'object'
      ? [
          order.shippingAddress.name || order.shippingAddress.fullName,
          order.shippingAddress.street || order.shippingAddress.addressLine || order.shippingAddress.address,
          order.shippingAddress.landmark || order.shippingAddress.colony,
          order.shippingAddress.city,
          order.shippingAddress.state,
          order.shippingAddress.pincode
        ].filter(Boolean).join(', ')
      : String(order.shippingAddress)
    : 'Customer Address';

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formattedAddressStr)}`;

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-800 flex items-center justify-center mb-4 shadow-sm border border-amber-200">
          <ShieldCheck size={32} />
        </div>
        <h2 className="text-xl font-black text-slate-900 mb-2">Delivery Executive Portal Restricted</h2>
        <p className="text-xs text-slate-600 max-w-sm mb-6 leading-relaxed">
          This portal is reserved strictly for authorized BookVardi delivery executives and riders.
          <br /><br />
          If you are a customer/buyer, you can view your live order status and checkpoints inside <strong>My Orders</strong> using your Tracking ID.
        </p>
        <button
          onClick={() => {
            if (onNavigate) onNavigate('profile');
            else window.location.hash = '#profile';
          }}
          className="px-5 py-2.5 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
        >
          Return to My Orders
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <RefreshCw size={36} className="text-teal-700 animate-spin mb-3" />
        <p className="text-sm font-bold text-gray-700">Loading Delivery Executive Portal...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-gray-900 pb-20 font-sans">
      {/* Top Header */}
      <header className="bg-gradient-to-r from-teal-900 to-teal-800 text-white p-4 sticky top-0 z-30 shadow-md">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-white/10 rounded-xl">
              <Truck size={22} className="text-amber-300" />
            </div>
            <div>
              <h1 className="font-extrabold text-base leading-tight">
                {isReturnOrder
                  ? 'BookVardi Reverse Pickup Portal'
                  : isExchangeOrder
                  ? 'BookVardi Exchange Portal'
                  : 'BookVardi Delivery Executive'}
              </h1>
              <p className="text-[11px] text-teal-200 font-medium">
                {isReturnOrder ? 'Return Task' : isExchangeOrder ? 'Exchange Task' : 'Delivery Task'} #{order?.orderId || token}
              </p>
            </div>
          </div>
          <button
            onClick={() => loadOrder()}
            disabled={loading || refreshing}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-white disabled:opacity-60 disabled:cursor-not-allowed"
            title="Refresh Order Details"
          >
            {refreshing ? <RefreshCw size={18} className="animate-spin" /> : <RefreshCw size={18} />}
          </button>
        </div>
      </header>

      <div className="max-w-md mx-auto p-4 space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Resend OTP Toast Banner */}
        {resendMsg && (
          <div className="p-3 bg-amber-500 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2 animate-in fade-in duration-200">
            <Send size={16} className="shrink-0 animate-bounce" />
            <span>{resendMsg}</span>
          </div>
        )}

        {!order ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs text-center">
            <Package size={28} className="mx-auto text-gray-400 mb-2" />
            <div className="text-sm font-extrabold text-gray-800">No delivery task found</div>
            <div className="text-xs text-gray-500 mt-1">The task link may not be valid or the order has not been assigned yet.</div>
          </div>
        ) : (
          <>
            {/* Status Card */}
            {deliverySuccess ? (
              <div className="bg-emerald-600 text-white p-5 rounded-2xl shadow-lg text-center space-y-2 animate-in zoom-in-95 duration-200">
                <CheckCircle size={48} className="mx-auto text-amber-300 animate-bounce" />
                <h2 className="text-xl font-extrabold">
                  {isReturnOrder
                    ? 'Return Pickup Completed! 📦'
                    : isExchangeOrder
                    ? 'Exchange Handover Completed! 🔄'
                    : 'Delivery Completed! 🎉'}
                </h2>
                <p className="text-xs text-emerald-100">
                  {isReturnOrder
                    ? `Customer Return OTP verified for Order #${order?.orderId}. Item marked as Product Received and restocked.`
                    : isExchangeOrder
                    ? `Customer Exchange OTP verified for Order #${order?.orderId}. Handover successfully recorded.`
                    : `Customer OTP verified successfully for Order #${order?.orderId}.`}
                </p>
              </div>
            ) : (
              <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-teal-50 text-teal-800 border border-teal-100">
                    <Clock size={22} />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-gray-500 tracking-wider">
                      {isReturnOrder ? 'Pickup Status' : isExchangeOrder ? 'Exchange Status' : 'Order Status'}
                    </span>
                    <div className="font-extrabold text-gray-900 text-base flex items-center gap-1.5">
                      {order?.overallStatus || (isReturnOrder ? 'Out for Pickup' : 'Out for Delivery')}
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-extrabold uppercase text-gray-400">Payment</span>
                  {(() => {
                    if (isReturnOrder) {
                      return (
                        <div className="text-xs font-extrabold px-2.5 py-1 rounded-lg border bg-blue-50 text-blue-900 border-blue-200">
                          📦 Return (Collect ₹0)
                        </div>
                      );
                    }
                    if (isExchangeOrder) {
                      if (isExchangeExtraPayment) {
                        return isCashVerifiedByExecutive || deliverySuccess ? (
                          <div className="text-xs font-extrabold px-2.5 py-1 rounded-lg border bg-emerald-50 text-emerald-900 border-emerald-200">
                            ✅ Extra ₹{exchangeDiff} Collected
                          </div>
                        ) : (
                          <div className="text-xs font-extrabold px-2.5 py-1 rounded-lg border bg-amber-50 text-amber-950 border-amber-300">
                            💵 Collect Extra: ₹{exchangeDiff}
                          </div>
                        );
                      }
                      if (isExchangeRefund) {
                        return (
                          <div className="text-xs font-extrabold px-2.5 py-1 rounded-lg border bg-blue-50 text-blue-900 border-blue-200">
                            💸 Refund Processed (Collect ₹0)
                          </div>
                        );
                      }
                      return (
                        <div className="text-xs font-extrabold px-2.5 py-1 rounded-lg border bg-emerald-50 text-emerald-900 border-emerald-200">
                          ⚖️ Equal Exchange (Collect ₹0)
                        </div>
                      );
                    }
                    if (order?.isBulkOrder) {
                      return (
                        <div className={`text-xs font-extrabold px-2.5 py-1 rounded-lg border ${
                          isBulkPaid ? 'bg-emerald-50 text-emerald-900 border-emerald-200' : 'bg-amber-50 text-amber-900 border-amber-200'
                        }`}>
                          {isBulkPaid ? 'Full Paid Online' : `Remaining: ₹${(order?.remainingAmount ?? (order?.totalAmount - (order?.advancePaidAmount || 0))).toLocaleString('en-IN')}`}
                        </div>
                      );
                    }
                    if (isCod) {
                      if (isCashCollected) {
                        return (
                          <div className="text-xs font-extrabold px-2.5 py-1 rounded-lg border bg-emerald-50 text-emerald-900 border-emerald-200">
                            ✅ Cash Collected: ₹{formattedTotalAmount}
                          </div>
                        );
                      }
                      return (
                        <div className="text-xs font-extrabold px-2.5 py-1 rounded-lg border bg-amber-50 text-amber-950 border-amber-300">
                          💵 COD: ₹{formattedTotalAmount} (Collect Cash)
                        </div>
                      );
                    }
                    if (isOnlinePaid) {
                      return (
                        <div className="text-xs font-extrabold px-2.5 py-1 rounded-lg border bg-emerald-50 text-emerald-900 border-emerald-200">
                          💳 Paid Online (UPI)
                        </div>
                      );
                    }
                    return (
                      <div className="text-xs font-extrabold px-2.5 py-1 rounded-lg border bg-amber-50 text-amber-950 border-amber-300">
                        ⏳ Payment Pending: ₹{formattedTotalAmount}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Reverse Pickup (Product Return Task) Card */}
            {isReturnOrder && (
              <div className="bg-gradient-to-r from-cyan-950 via-teal-900 to-slate-900 text-white rounded-2xl p-4 shadow-lg space-y-3 border border-cyan-400/40 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-white/20 pb-2">
                  <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 text-cyan-300">
                    <span className="text-sm">📦</span> Reverse Pickup (Product Return Task)
                  </span>
                  <span className="text-[10px] font-extrabold bg-cyan-400 text-teal-950 px-2.5 py-0.5 rounded-full font-mono uppercase tracking-wide">
                    Return Pickup
                  </span>
                </div>

                {/* Step 1: Collect Item */}
                <div className="bg-white/10 rounded-xl p-3 border border-white/10 space-y-1">
                  <div className="text-[11px] font-extrabold uppercase text-cyan-300 flex items-center gap-1">
                    <span>📦 1. COLLECT FROM CUSTOMER:</span>
                  </div>
                  <div className="text-xs font-bold text-white">
                    {returnReq.itemName || order?.items?.[0]?.name || 'Purchased Product'}
                  </div>
                  <div className="text-[11px] text-cyan-100">
                    Delivered Specification: <strong className="text-white font-mono">{order?.items?.[0]?.size ? `Size: ${order?.items?.[0]?.size}` : (returnReq.isMeterBased ? `Length: ${order?.items?.[0]?.quantity}m` : 'Delivered piece')}</strong>
                  </div>
                  {returnReq.reason && (
                    <div className="text-[10px] text-cyan-200 italic pt-0.5">
                      Return Reason: "{returnReq.reason}"
                    </div>
                  )}
                  {returnReq.comment && (
                    <div className="text-[10px] text-cyan-200/80 italic">
                      Customer Comment: "{returnReq.comment}"
                    </div>
                  )}
                </div>

                {/* Step 2: Quality Inspection Checklist */}
                <div className="bg-white/10 rounded-xl p-3 border border-white/10 space-y-1">
                  <div className="text-[11px] font-extrabold uppercase text-amber-300 flex items-center gap-1">
                    <span>🔍 2. DOORSTEP QUALITY CHECKLIST:</span>
                  </div>
                  <ul className="text-[11px] text-teal-100 space-y-0.5 list-disc list-inside">
                    <li>Product tags & labels must be intact</li>
                    <li>Item must be unwashed, unused, and undamaged</li>
                    <li>Original packaging included if available</li>
                  </ul>
                </div>

                {/* Step 3: Payment Notice */}
                <div className="rounded-xl p-3 border bg-emerald-500/20 border-emerald-400 text-emerald-100">
                  <div className="text-xs font-black uppercase flex items-center justify-between mb-1">
                    <span>💰 3. Cash / Payment Collection:</span>
                    <span className="text-sm font-mono font-black text-white">
                      COLLECT ₹0
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    ✅ <strong>Do NOT collect any money from customer.</strong> The product refund of ₹{returnReq.refundAmount != null ? returnReq.refundAmount : Math.max(0, Number(order?.totalAmount || 0) - Number(order?.shippingFee || order?.shippingCost || 0))} (excluding delivery charges) is transferred directly to the customer's account after pickup verification.
                  </p>
                </div>
              </div>
            )}

            {/* 2-Way Product Exchange Task Card */}
            {isExchangeOrder && (
              <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-teal-900 text-white rounded-2xl p-4 shadow-lg space-y-3 border border-purple-400/40 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-white/20 pb-2">
                  <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 text-amber-300">
                    <span className="text-sm">🔄</span> 2-Way Product Exchange Task
                  </span>
                  <span className="text-[10px] font-extrabold bg-amber-400 text-purple-950 px-2.5 py-0.5 rounded-full font-mono uppercase tracking-wide">
                    Exchange Delivery
                  </span>
                </div>

                {/* Step 1: Collect Old Item */}
                <div className="bg-white/10 rounded-xl p-3 border border-white/10 space-y-1">
                  <div className="text-[11px] font-extrabold uppercase text-amber-300 flex items-center gap-1">
                    <span>📦 1. COLLECT FROM CUSTOMER (Old Item):</span>
                  </div>
                  <div className="text-xs font-bold text-white">
                    {returnReq.itemName || order?.items?.[0]?.name || 'Original Delivered Item'}
                  </div>
                  <div className="text-[11px] text-purple-200">
                    Purchased Specification: <strong className="text-white font-mono">{order?.items?.[0]?.size ? `Size: ${order?.items?.[0]?.size}` : (returnReq.isMeterBased ? `Length: ${order?.items?.[0]?.quantity}m` : 'Original piece')}</strong>
                  </div>
                  {returnReq.reason && (
                    <div className="text-[10px] text-purple-300 italic pt-0.5">
                      Reason: "{returnReq.reason}"
                    </div>
                  )}
                </div>

                {/* Step 2: Hand Over Replacement Item */}
                <div className="bg-white/10 rounded-xl p-3 border border-white/10 space-y-1">
                  <div className="text-[11px] font-extrabold uppercase text-emerald-300 flex items-center gap-1">
                    <span>🎁 2. HAND OVER TO CUSTOMER (Replacement):</span>
                  </div>
                  <div className="text-xs font-bold text-white">
                    {returnReq.itemName || order?.items?.[0]?.name || 'Replacement Item'}
                  </div>
                  <div className="text-[11px] text-emerald-200">
                    Replacement Specification: <strong className="text-white font-mono">{returnReq.exchangeLength ? `${returnReq.exchangeLength} Meter(s)` : (returnReq.exchangeSize || 'Requested Variant')}</strong>
                  </div>
                </div>

                {/* Step 3: Payment Collection Instructions */}
                <div className={`rounded-xl p-3 border ${
                  isExchangeExtraPayment
                    ? 'bg-amber-500/20 border-amber-400 text-amber-100'
                    : 'bg-emerald-500/20 border-emerald-400 text-emerald-100'
                }`}>
                  <div className="text-xs font-black uppercase flex items-center justify-between mb-1">
                    <span>💰 3. Cash / Payment Collection:</span>
                    <span className="text-sm font-mono font-black text-white">
                      {isExchangeExtraPayment ? `COLLECT ₹${exchangeDiff}` : 'COLLECT ₹0'}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    {isExchangeExtraPayment ? (
                      <>⚠️ The replacement item has a higher value / longer fabric length. <strong>Collect ₹{exchangeDiff} extra cash or UPI</strong> from customer before completing handover and entering OTP.</>
                    ) : isExchangeRefund ? (
                      <>✅ <strong>Do NOT collect any money.</strong> The customer was owed a partial refund of ₹{Math.abs(exchangeDiff)} which is transferred directly to their bank/UPI account.</>
                    ) : (
                      <>✅ <strong>Do NOT collect any money.</strong> Equal value exchange (₹0 difference).</>
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* Customer Info Card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <span className="font-extrabold text-gray-900 text-sm flex items-center gap-1.5">
                  {order?.isBulkOrder ? <Building2 size={16} className="text-teal-700" /> : <User size={16} className="text-teal-700" />}
                  {order?.isBulkOrder ? 'Institution / School Contact' : 'Customer Contact'}
                </span>
                {order?.customer?.phone && (
                  <a
                    href={`tel:${order.customer.phone}`}
                    className="flex items-center gap-1 bg-teal-700 text-white font-extrabold text-xs px-3 py-1.5 rounded-xl shadow-xs hover:bg-teal-800 transition-colors"
                  >
                    <Phone size={14} /> Call Contact
                  </a>
                )}
              </div>

              <div>
                <div className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                  <span>{order?.customer?.name || 'Customer'}</span>
                  {order?.isBulkOrder && (
                    <span className="text-[10px] font-extrabold bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full border border-teal-200">
                      School Bulk Delivery
                    </span>
                  )}
                </div>
                {order?.customer?.designation && (
                  <div className="text-xs text-teal-800 font-semibold">{order.customer.designation}</div>
                )}
                <div className="text-xs text-gray-500 font-mono mt-0.5">{order?.customer?.phone}</div>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-gray-700 flex items-center gap-1">
                    <MapPin size={14} className="text-rose-600" /> Delivery Address:
                  </span>
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-extrabold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Navigation size={12} /> Google Maps
                  </a>
                </div>
                <div className="text-xs text-gray-800 bg-gray-50 p-3 rounded-xl border border-gray-200 font-medium leading-relaxed">
                  {formattedAddressStr}
                </div>
              </div>
            </div>

            {/* Order Items List */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs space-y-3">
              <div className="font-extrabold text-gray-900 text-sm flex items-center gap-1.5 border-b border-gray-100 pb-2">
                <Package size={16} className="text-teal-700" /> Items to Handover ({order?.items?.length || 0})
              </div>

              <div className="divide-y divide-gray-100">
                {order?.items?.map((item, idx) => {
                  const itemQtyFormatted = formatItemQuantity(item);
                  const itemTotal = Number(item.price || 0) * Number(item.quantity || 1);
                  const formattedItemPrice = itemTotal % 1 !== 0 ? itemTotal.toFixed(2) : itemTotal.toLocaleString('en-IN');
                  return (
                    <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-extrabold text-gray-900">{item.name}</div>
                        <div className="text-gray-500 text-[11px] font-medium">
                          Qty: {itemQtyFormatted} {item.size ? `• Size: ${item.size}` : ''} {item.category ? `• ${item.category}` : ''}
                        </div>
                      </div>
                      <div className="font-bold text-gray-900">₹{formattedItemPrice}</div>
                    </div>
                  );
                })}
              </div>

              {order?.isBulkOrder ? (
                <div className="pt-2 border-t border-gray-200 space-y-1 text-xs font-bold">
                  <div className="flex justify-between text-gray-600">
                    <span>Total Agreed Contract:</span>
                    <span>₹{Number(order?.totalAmount || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700">
                    <span>Advance Prepayment (Paid Online):</span>
                    <span>₹{Number(order?.advancePaidAmount || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between font-black text-sm text-gray-900 pt-1 border-t border-gray-100">
                    <span>Remaining Balance Due:</span>
                    <span className={order?.paymentStatus === 'paid' ? "text-emerald-700" : "text-amber-800 font-mono"}>
                      ₹{Number(order?.remainingAmount ?? (order?.totalAmount - (order?.advancePaidAmount || 0))).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="pt-3 border-t border-gray-200 space-y-1.5 text-xs text-gray-700 font-medium">
                  <div className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <CreditCard size={12} className="text-teal-700" />
                    <span>Payment & Price Breakdown</span>
                  </div>

                  <div className="flex justify-between items-center text-gray-600">
                    <span>Items Subtotal:</span>
                    <span className="font-semibold text-gray-900 font-mono">
                      ₹{(() => {
                        const sub = Number(order?.subtotal || order?.items?.reduce((s, it) => s + (Number(it.price || 0) * Number(it.quantity || 1)), 0) || 0);
                        return sub % 1 !== 0 ? sub.toFixed(2) : sub.toLocaleString('en-IN');
                      })()}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-gray-600">
                    <span>Delivery Charge:</span>
                    <span className="font-semibold text-gray-900 font-mono">
                      {(() => {
                        const fee = Number(order?.shippingFee !== undefined ? order.shippingFee : (order?.shippingCost !== undefined ? order.shippingCost : 0));
                        return fee > 0 ? `₹${fee % 1 !== 0 ? fee.toFixed(2) : fee.toLocaleString('en-IN')}` : 'FREE Delivery';
                      })()}
                    </span>
                  </div>

                  {Boolean(order?.discount || order?.discountAmount) && Number(order?.discount || order?.discountAmount) > 0 && (
                    <div className="flex justify-between items-center text-emerald-700 font-semibold">
                      <span>Coupon / Savings Discount:</span>
                      <span className="font-mono">-₹{(() => {
                        const d = Number(order?.discount || order?.discountAmount);
                        return d % 1 !== 0 ? d.toFixed(2) : d.toLocaleString('en-IN');
                      })()}</span>
                    </div>
                  )}

                  {Boolean(order?.gst || order?.taxAmount) && Number(order?.gst || order?.taxAmount) > 0 && (
                    <div className="flex justify-between items-center text-gray-600">
                      <span>Estimated GST / Taxes:</span>
                      <span className="font-semibold text-gray-900 font-mono">₹{(() => {
                        const g = Number(order?.gst || order?.taxAmount);
                        return g % 1 !== 0 ? g.toFixed(2) : g.toLocaleString('en-IN');
                      })()}</span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-gray-100 flex justify-between items-center font-extrabold text-sm text-gray-900">
                    <span>Total Collection Amount:</span>
                    <span className="text-teal-900 font-black text-base font-mono">₹{formattedTotalAmount}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Actions & Resend OTP Box */}
            {!deliverySuccess && (
              <div className="space-y-3">
                {/* Payment Banners */}
                {order?.isBulkOrder ? (
                  !isBulkPaid ? (
                    <div className="p-4 bg-gradient-to-r from-teal-800 to-teal-900 text-white rounded-2xl shadow-md space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                          <DollarSign size={18} className="text-amber-300" /> Remaining Balance Due
                        </span>
                        <span className="font-mono text-base font-black bg-white/20 px-2.5 py-0.5 rounded-lg">
                          ₹{Number(order?.remainingAmount ?? (order?.totalAmount - (order?.advancePaidAmount || 0))).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <p className="text-[11px] text-teal-100 font-medium">
                        🔒 No cash accepted for School Bulk Delivery. The remaining balance of <strong className="text-amber-300">₹{Number(order?.remainingAmount ?? (order?.totalAmount - (order?.advancePaidAmount || 0))).toLocaleString('en-IN')}</strong> must be paid online via Razorpay (UPI / Dynamic QR) to unlock OTP verification.
                      </p>
                      <button
                        type="button"
                        onClick={handlePayRemainingBalance}
                        disabled={isPayingRemaining}
                        className="w-full py-3 bg-amber-400 hover:bg-amber-500 text-teal-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <CreditCard size={16} />
                        <span>{isPayingRemaining ? 'Connecting Razorpay Payment Gateway...' : `Pay Online / Generate UPI QR (Razorpay)`}</span>
                      </button>
                    </div>
                  ) : (
                    <div className="p-3.5 bg-emerald-600 text-white rounded-2xl shadow-md flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-xs font-black flex items-center gap-1.5">
                          <CheckCircle size={18} className="text-amber-300" /> Full Remaining Payment Verified Online
                        </span>
                        <span className="text-[10px] text-emerald-100 block font-medium">
                          Paid via Razorpay / UPI • Ready for OTP verification
                        </span>
                      </div>
                      <span className="font-mono text-xs font-bold bg-white/20 px-2 py-0.5 rounded-md shrink-0">
                        Razorpay Paid
                      </span>
                    </div>
                  )
                ) : isReturnOrder ? (
                  <div className="p-3.5 bg-gradient-to-r from-teal-800 to-cyan-900 text-white rounded-2xl shadow-md flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="text-xs font-black flex items-center gap-1.5">
                        <CheckCircle size={18} className="text-cyan-300" /> Return Pickup: No Cash Collection (₹0)
                      </span>
                      <span className="text-[10px] text-teal-100 block font-medium">
                        Doorstep return pickup • Refund processed directly to customer account • Ready for OTP verification
                      </span>
                    </div>
                    <span className="font-mono text-xs font-bold bg-white/20 px-2 py-0.5 rounded-md shrink-0">
                      Collect ₹0
                    </span>
                  </div>
                ) : isExchangeOrder ? (
                  isExchangeExtraPayment ? (
                    !isCashVerifiedByExecutive ? (
                      <div className="p-4 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-2xl shadow-md space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                            <DollarSign size={18} className="text-amber-200" /> Collect Exchange Price Difference
                          </span>
                          <span className="font-mono text-base font-black bg-white/20 px-2.5 py-0.5 rounded-lg">
                            ₹{exchangeDiff}
                          </span>
                        </div>
                        <p className="text-[11px] text-amber-100 font-medium">
                          ⚠️ The customer is exchanging for a higher value item or longer fabric cut. Please collect exactly <strong className="text-white">₹{exchangeDiff}</strong> in cash or UPI from the customer before completing OTP verification.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setIsCashVerifiedByExecutive(true);
                            setResendMsg(`💵 Extra payment of ₹${exchangeDiff} marked as collected by executive!`);
                            setTimeout(() => setResendMsg(''), 4000);
                          }}
                          className="w-full py-2.5 bg-white hover:bg-amber-50 text-amber-950 font-black text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <CheckCircle size={16} className="text-emerald-600" />
                          <span>Confirm Extra Payment of ₹{exchangeDiff} Collected</span>
                        </button>
                      </div>
                    ) : (
                      <div className="p-3.5 bg-emerald-600 text-white rounded-2xl shadow-md flex items-center justify-between">
                        <div className="space-y-0.5">
                          <span className="text-xs font-black flex items-center gap-1.5">
                            <CheckCircle size={18} className="text-amber-300" /> Extra Payment Collected & Verified
                          </span>
                          <span className="text-[10px] text-emerald-100 block font-medium">
                            ₹{exchangeDiff} verified by executive • Ready for OTP verification
                          </span>
                        </div>
                        <span className="font-mono text-xs font-bold bg-white/20 px-2 py-0.5 rounded-md shrink-0">
                          ₹{exchangeDiff} Paid
                        </span>
                      </div>
                    )
                  ) : (
                    <div className="p-3.5 bg-emerald-600 text-white rounded-2xl shadow-md flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-xs font-black flex items-center gap-1.5">
                          <CheckCircle size={18} className="text-amber-300" /> No Cash Collection Needed (₹0)
                        </span>
                        <span className="text-[10px] text-emerald-100 block font-medium">
                          {isExchangeRefund ? `Refund of ₹${Math.abs(exchangeDiff)} sent directly to customer account` : 'Equal value exchange'} • Ready for OTP verification
                        </span>
                      </div>
                      <span className="font-mono text-xs font-bold bg-white/20 px-2 py-0.5 rounded-md shrink-0">
                        ₹0 to Collect
                      </span>
                    </div>
                  )
                ) : (
                  (isCod || !isOnlinePaid) ? (
                    !isCashCollected ? (
                      <div className="p-4 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-2xl shadow-md space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                            <DollarSign size={18} className="text-amber-200" /> Collect Cash on Delivery (COD)
                          </span>
                          <span className="font-mono text-base font-black bg-white/20 px-2.5 py-0.5 rounded-lg">
                            ₹{formattedTotalAmount}
                          </span>
                        </div>
                        <p className="text-[11px] text-amber-100 font-medium">
                          ⚠️ Please collect exactly <strong className="text-white">₹{formattedTotalAmount}</strong> cash from customer. Click below to verify cash receipt to activate OTP dispatch & delivery completion.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setIsCashVerifiedByExecutive(true);
                            setResendMsg(`💵 Cash payment of ₹${formattedTotalAmount} marked as collected & verified by executive!`);
                            setTimeout(() => setResendMsg(''), 4000);
                          }}
                          className="w-full py-2.5 bg-white hover:bg-amber-50 text-amber-950 font-black text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <CheckCircle size={16} className="text-emerald-600" />
                          <span>Confirm Cash Payment of ₹{formattedTotalAmount} Collected</span>
                        </button>
                      </div>
                    ) : (
                      <div className="p-3.5 bg-emerald-600 text-white rounded-2xl shadow-md flex items-center justify-between">
                        <div className="space-y-0.5">
                          <span className="text-xs font-black flex items-center gap-1.5">
                            <CheckCircle size={18} className="text-amber-300" /> Cash Payment Collected & Verified
                          </span>
                          <span className="text-[10px] text-emerald-100 block font-medium">
                            Verified by Executive • Ready for OTP verification
                          </span>
                        </div>
                        <span className="font-mono text-xs font-bold bg-white/20 px-2 py-0.5 rounded-md shrink-0">
                          ₹{formattedTotalAmount} Cash Verified
                        </span>
                      </div>
                    )
                  ) : (
                    <div className="p-3.5 bg-emerald-600 text-white rounded-2xl shadow-md flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-xs font-black flex items-center gap-1.5">
                          <CheckCircle size={18} className="text-amber-300" /> Online Payment Verified
                        </span>
                        <span className="text-[10px] text-emerald-100 block font-medium">
                          Automatically Verified • Ready for OTP verification
                        </span>
                      </div>
                      <span className="font-mono text-xs font-bold bg-white/20 px-2 py-0.5 rounded-md shrink-0">
                        Paid via UPI / Razorpay
                      </span>
                    </div>
                  )
                )}

                {/* Security Guarantee Note */}
                <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-teal-900 text-xs font-semibold flex items-start gap-2">
                  <ShieldCheck size={18} className="text-teal-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">
                      {isReturnOrder
                        ? 'Doorstep Return OTP Security:'
                        : isExchangeOrder
                        ? 'Doorstep Exchange OTP Security:'
                        : 'Doorstep OTP & Payment Security:'}
                    </span>{' '}
                    4-digit PIN is sent directly to customer's phone.{' '}
                    {isReturnOrder ? (
                      <>Verifying OTP marks item as <strong className="text-teal-950 uppercase font-bold">PRODUCT RECEIVED</strong> and auto-restores inventory stock.</>
                    ) : isExchangeOrder ? (
                      <>Verifying OTP marks task as <strong className="text-teal-950 uppercase font-bold">EXCHANGED</strong> and confirms 2-way item handover.</>
                    ) : (
                      <>Verifying OTP marks payment as <strong className="text-teal-950 uppercase font-bold">PAID</strong> and order as <strong className="text-teal-950 uppercase font-bold">DELIVERED</strong>.</>
                    )}
                  </div>
                </div>

                {/* Resend OTP Button */}
                <button
                  onClick={handleResendOtp}
                  disabled={!isPaymentVerified || resending || !order || verifying || resendCooldown > 0}
                  className={`w-full py-3 font-extrabold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all ${
                    isPaymentVerified && resendCooldown === 0
                      ? 'bg-white border border-teal-300 text-teal-900 hover:bg-teal-50 cursor-pointer'
                      : 'bg-gray-100 border border-gray-300 text-gray-400 cursor-not-allowed opacity-75'
                  }`}
                >
                  <Send size={15} className={resending ? 'animate-spin' : ''} />
                  <span>
                    {resending
                      ? 'Resending OTP...'
                      : resendCooldown > 0
                      ? `⏳ Resend OTP in ${resendCooldown}s`
                      : isPaymentVerified
                      ? (isReturnOrder
                        ? "📲 Resend Return Pickup OTP to Customer"
                        : isExchangeOrder
                        ? "📲 Resend Exchange OTP to Customer"
                        : "📲 Resend OTP to Customer's Phone")
                      : "🔒 Verify Cash Payment First to Send/Resend OTP"}
                  </span>
                </button>

                {/* Main Action Button */}
                <button
                  onClick={handleOpenOtpModal}
                  disabled={!isPaymentVerified || loading || refreshing || verifying || !order}
                  className={`w-full py-4 font-black text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all tracking-wide ${
                    isPaymentVerified
                      ? 'bg-teal-800 enabled:hover:bg-teal-900 text-white cursor-pointer'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-70'
                  }`}
                >
                  <Key size={18} className={isPaymentVerified ? 'text-amber-300' : 'text-gray-400'} />
                  <span>
                    {isPaymentVerified
                      ? (isReturnOrder
                        ? 'Complete Return Pickup & Verify OTP'
                        : isExchangeOrder
                        ? 'Complete Exchange & Verify OTP'
                        : 'Complete Delivery & Verify OTP')
                      : '🔒 Verify Payment to Complete Delivery'}
                  </span>
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Complete Delivery / Return / Exchange OTP Verification Modal */}
      {isOtpModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="text-center space-y-1">
              <div className="w-12 h-12 bg-teal-50 text-teal-800 rounded-2xl mx-auto flex items-center justify-center mb-2 border border-teal-100 shadow-xs">
                <Key size={24} />
              </div>
              <h3 className="text-lg font-black text-gray-900">
                {isReturnOrder
                  ? 'Enter Customer Return Pickup OTP'
                  : isExchangeOrder
                  ? (isExchangeExtraPayment && !isCashVerifiedByExecutive ? `Collect ₹${exchangeDiff} & Enter Exchange OTP` : 'Enter Customer Exchange OTP')
                  : (isCod && !isCashCollected
                    ? `Collect ₹${formattedTotalAmount} Cash & Enter OTP`
                    : 'Enter Customer Delivery OTP')}
              </h3>
              <p className="text-xs text-gray-500 font-medium">
                {isReturnOrder
                  ? 'Ask customer for 4-digit Return PIN sent to their phone upon pickup'
                  : isExchangeOrder
                  ? 'Ask customer for 4-digit Exchange PIN sent to their phone upon handover'
                  : 'Ask customer for 4-digit PIN sent via SMS to their phone'}
              </p>
              {customerPhone && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-[11px] font-bold mt-1">
                  <Phone size={12} className="text-teal-700" />
                  <span>Sent to: +91 {customerPhone.slice(-10)}</span>
                </div>
              )}
            </div>

            {/* Live Expiry Countdown Timer */}
            <div className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-bold transition-colors ${
              expirySeconds > 60
                ? 'bg-teal-50 border-teal-200 text-teal-900'
                : expirySeconds > 0
                ? 'bg-amber-50 border-amber-200 text-amber-900 animate-pulse'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              <div className="flex items-center gap-1.5">
                <Clock size={15} className={expirySeconds > 0 ? (expirySeconds <= 60 ? 'text-amber-600' : 'text-teal-700') : 'text-rose-600'} />
                <span>
                  {expirySeconds > 0 ? 'Live PIN Status:' : 'OTP Status:'}
                </span>
              </div>
              <div className="font-mono text-sm tracking-wider font-extrabold">
                {expirySeconds > 0 ? (
                  <span className="text-teal-800 text-xs font-bold">Active ({formatTimeRemaining(expirySeconds)})</span>
                ) : (
                  <span className="text-rose-600 text-xs font-bold">EXPIRED</span>
                )}
              </div>
            </div>

            {/* OTP Digits Input Form */}
            <form onSubmit={handleVerifyOtpSubmit} className="space-y-4">
              <div className="flex justify-center gap-3">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`otp-input-${idx}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                    className={`w-12 h-14 text-center text-2xl font-black rounded-xl border-2 transition-colors ${
                      otpError
                        ? 'border-rose-400 bg-rose-50/50'
                        : 'border-gray-300 focus:border-teal-700 bg-gray-50 focus:bg-white'
                    } focus:outline-none`}
                  />
                ))}
              </div>

              {/* Feedback Messages */}
              {otpError && (
                <div className="flex items-start gap-1.5 text-center text-xs font-bold text-rose-700 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  <span className="flex-1">{otpError}</span>
                </div>
              )}

              {resendMsg && (
                <div className="flex items-start gap-1.5 text-center text-xs font-bold text-emerald-800 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                  <CheckCircle size={15} className="shrink-0 mt-0.5 text-emerald-600" />
                  <span className="flex-1">{resendMsg}</span>
                </div>
              )}

              {/* In-Modal Resend OTP Button */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resending || verifying || resendCooldown > 0}
                  className={`w-full py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                    resendCooldown > 0
                      ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                      : 'bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 cursor-pointer'
                  }`}
                >
                  <Send size={13} className={resending ? 'animate-spin' : ''} />
                  <span>
                    {resending
                      ? 'Resending fresh OTP SMS...'
                      : resendCooldown > 0
                      ? `Resend OTP in ${resendCooldown}s`
                      : "Didn't receive OTP? Resend Code"}
                  </span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOtpModalOpen(false)}
                  disabled={verifying}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-extrabold text-xs rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={verifying || otpDigits.join('').length < 4}
                  className="flex-1 py-3 bg-teal-800 hover:bg-teal-900 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {verifying ? <RefreshCw size={14} className="animate-spin" /> : <ShieldCheck size={16} />}
                  {verifying ? 'Verifying...' : 'Verify OTP'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
