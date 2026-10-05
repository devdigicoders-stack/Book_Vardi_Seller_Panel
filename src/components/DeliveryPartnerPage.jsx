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
  DollarSign
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
        if (ord.overallStatus?.toLowerCase() === 'delivered') {
          setDeliverySuccess(true);
        }
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
                remainingPaymentStatus: 'paid',
                overallStatus: 'Delivered',
                status: 'Delivered'
              } : prev));
              setDeliverySuccess(true);
              alert(`🎉 Remaining balance payment of ₹${(rzpRes.remainingAmountRupees || order.remainingAmount).toLocaleString()} verified successfully! Order completed.`);
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

  const isBulkPaid = Boolean(order?.isBulkOrder) && (order?.paymentStatus === 'paid' || order?.remainingPaymentStatus === 'paid');
  const isOnlinePayment = !order?.isBulkOrder && (
    !String(order?.paymentMethod || '').toUpperCase().includes('COD') &&
    (order?.paymentStatus === 'paid' || order?.paymentStatus === 'Paid' || String(order?.paymentMethod || '').toLowerCase() !== 'cod')
  );
  const isPaymentVerified = order?.isBulkOrder
    ? isBulkPaid
    : (isOnlinePayment || isCashVerifiedByExecutive || order?.paymentStatus === 'paid' || order?.paymentStatus === 'Paid' || deliverySuccess);

  const handleResendOtp = async () => {
    if (!token || resending || verifying || !order) return;
    if (!isPaymentVerified) {
      alert('🔒 Cash payment must be collected & verified by executive before sending OTP.');
      return;
    }
    setResending(true);
    setResendMsg('');
    try {
      const res = await resendDeliveryOtpApi(token, { isCashCollected: isCashVerifiedByExecutive, isPaymentVerified });
      if (res && res.success) {
        setResendMsg(res.message || `📲 OTP resent to customer (${order?.customer?.phone || ''})`);
      } else {
        setResendMsg(res?.message || '📲 OTP could not be resent right now.');
      }
    } catch {
      setResendMsg('📲 OTP dispatch failed. Please try again in a moment.');
    } finally {
      setResending(false);
      setTimeout(() => setResendMsg(''), 4000);
    }
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

    if (verifying || !token) return;

    setVerifying(true);
    setOtpError('');
    try {
      const res = await verifyDeliveryOtpApi(token, fullOtp, { isCashCollected: isCashVerifiedByExecutive, isPaymentVerified });
      if (res && res.success) {
        setDeliverySuccess(true);
        setIsOtpModalOpen(false);
        setOrder((prev) => (prev ? { ...prev, overallStatus: 'Delivered', status: 'Delivered', paymentStatus: 'paid' } : prev));
      } else {
        setOtpError(res?.message || 'Invalid Delivery OTP code. Please ask customer for correct 4-digit PIN.');
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
              <h1 className="font-extrabold text-base leading-tight">BookVardi Delivery Executive</h1>
              <p className="text-[11px] text-teal-200 font-medium">Task #{order?.orderId || token}</p>
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
                <h2 className="text-xl font-extrabold">Delivery Completed! 🎉</h2>
                <p className="text-xs text-emerald-100">
                  Customer OTP verified successfully for Order #{order?.orderId}.
                </p>
              </div>
            ) : (
              <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-teal-50 text-teal-800 border border-teal-100">
                    <Clock size={22} />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-gray-500 tracking-wider">Order Status</span>
                    <div className="font-extrabold text-gray-900 text-base flex items-center gap-1.5">
                      {order?.overallStatus || 'Out for Delivery'}
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-extrabold uppercase text-gray-400">Payment</span>
                  <div className={`text-xs font-extrabold px-2.5 py-1 rounded-lg border ${
                    order?.paymentMethod === 'COD' || order?.paymentStatus === 'pending'
                      ? 'bg-amber-50 text-amber-900 border-amber-200'
                      : 'bg-emerald-50 text-emerald-900 border-emerald-200'
                  }`}>
                    {order?.paymentMethod === 'COD' ? `COD: ₹${order?.totalAmount}` : 'Paid Online'}
                  </div>
                </div>
              </div>
            )}

            {/* Customer Info Card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <span className="font-extrabold text-gray-900 text-sm flex items-center gap-1.5">
                  <User size={16} className="text-teal-700" /> Customer Contact
                </span>
                {order?.customer?.phone && (
                  <a
                    href={`tel:${order.customer.phone}`}
                    className="flex items-center gap-1 bg-teal-700 text-white font-extrabold text-xs px-3 py-1.5 rounded-xl shadow-xs hover:bg-teal-800 transition-colors"
                  >
                    <Phone size={14} /> Call Customer
                  </a>
                )}
              </div>

              <div>
                <div className="text-base font-extrabold text-gray-900">{order?.customer?.name || 'Customer'}</div>
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
                {order?.items?.map((item, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-extrabold text-gray-900">{item.name}</div>
                      <div className="text-gray-500 text-[11px] font-medium">
                        Qty: {item.quantity} {item.size ? `• Size: ${item.size}` : ''}
                      </div>
                    </div>
                    <div className="font-bold text-gray-900">₹{item.price * item.quantity}</div>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-gray-200 space-y-1.5 text-xs text-gray-700 font-medium">
                <div className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-1">
                  Payment & Price Breakdown
                </div>

                <div className="flex justify-between items-center text-gray-600">
                  <span>Items Subtotal:</span>
                  <span className="font-semibold text-gray-900 font-mono">
                    ₹{Number(order?.subtotal || order?.items?.reduce((s, it) => s + (Number(it.price || 0) * Number(it.quantity || 1)), 0) || 0).toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between items-center text-gray-600">
                  <span>Delivery Charge:</span>
                  <span className="font-semibold text-gray-900 font-mono">
                    {(order?.shippingFee !== undefined ? order.shippingFee : (order?.shippingCost !== undefined ? order.shippingCost : 0)) > 0
                      ? `₹${Number(order?.shippingFee !== undefined ? order.shippingFee : order?.shippingCost).toLocaleString()}`
                      : 'FREE Delivery'}
                  </span>
                </div>

                {Boolean(order?.discount || order?.discountAmount) && Number(order?.discount || order?.discountAmount) > 0 && (
                  <div className="flex justify-between items-center text-emerald-700 font-semibold">
                    <span>Coupon / Savings Discount:</span>
                    <span className="font-mono">-₹{Number(order?.discount || order?.discountAmount).toLocaleString()}</span>
                  </div>
                )}

                {Boolean(order?.gst || order?.taxAmount) && Number(order?.gst || order?.taxAmount) > 0 && (
                  <div className="flex justify-between items-center text-gray-600">
                    <span>Estimated GST / Taxes:</span>
                    <span className="font-semibold text-gray-900 font-mono">₹{Number(order?.gst || order?.taxAmount).toLocaleString()}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-gray-100 flex justify-between items-center font-extrabold text-sm text-gray-900">
                  <span>Total Collection Amount:</span>
                  <span className="text-teal-900 font-black text-base font-mono">₹{Number(order?.totalAmount || order?.total || 0).toLocaleString()}</span>
                </div>
              </div>
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
                          ₹{Number(order?.remainingAmount ?? (order?.totalAmount - (order?.advancePaidAmount || 0))).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-[11px] text-teal-100 font-medium">
                        🔒 No cash accepted for School Bulk Delivery. The remaining balance of <strong className="text-amber-300">₹{Number(order?.remainingAmount ?? (order?.totalAmount - (order?.advancePaidAmount || 0))).toLocaleString()}</strong> must be paid online via Razorpay (UPI / Dynamic QR) to unlock OTP verification.
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
                ) : (
                  (String(order?.paymentMethod || '').toUpperCase().includes('COD') || (order?.paymentStatus !== 'paid' && order?.paymentStatus !== 'Paid')) ? (
                    !isCashVerifiedByExecutive ? (
                      <div className="p-4 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-2xl shadow-md space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                            <DollarSign size={18} className="text-amber-200" /> Collect Cash on Delivery (COD)
                          </span>
                          <span className="font-mono text-base font-black bg-white/20 px-2.5 py-0.5 rounded-lg">
                            ₹{order?.totalAmount || 0}
                          </span>
                        </div>
                        <p className="text-[11px] text-amber-100 font-medium">
                          ⚠️ Please collect exactly <strong className="text-white">₹{order?.totalAmount || 0}</strong> cash from customer. Click below to verify cash receipt to activate OTP dispatch & delivery completion.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setIsCashVerifiedByExecutive(true);
                            setResendMsg(`💵 Cash payment of ₹${order?.totalAmount || 0} marked as collected & verified by executive!`);
                            setTimeout(() => setResendMsg(''), 4000);
                          }}
                          className="w-full py-2.5 bg-white hover:bg-amber-50 text-amber-950 font-black text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <CheckCircle size={16} className="text-emerald-600" />
                          <span>Confirm Cash Payment of ₹{order?.totalAmount || 0} Collected</span>
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
                          ₹{order?.totalAmount || 0} Cash Verified
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
                        Paid Online
                      </span>
                    </div>
                  )
                )}

                {/* Security Guarantee Note */}
                <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-teal-900 text-xs font-semibold flex items-start gap-2">
                  <ShieldCheck size={18} className="text-teal-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Doorstep OTP & Payment Security:</span> 4-digit PIN is sent directly to customer's phone. Verifying OTP marks payment as <strong className="text-teal-950 uppercase font-bold">PAID</strong> and order as <strong className="text-teal-950 uppercase font-bold">DELIVERED</strong>.
                  </div>
                </div>

                {/* Resend OTP Button */}
                <button
                  onClick={handleResendOtp}
                  disabled={!isPaymentVerified || resending || !order || verifying}
                  className={`w-full py-3 font-extrabold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all ${
                    isPaymentVerified
                      ? 'bg-white border border-teal-300 text-teal-900 hover:bg-teal-50 cursor-pointer'
                      : 'bg-gray-100 border border-gray-300 text-gray-400 cursor-not-allowed opacity-75'
                  }`}
                >
                  <Send size={15} className={resending ? 'animate-spin' : ''} />
                  <span>
                    {resending
                      ? 'Resending OTP...'
                      : isPaymentVerified
                      ? "📲 Resend OTP to Customer's Phone"
                      : "🔒 Verify Cash Payment First to Send/Resend OTP"}
                  </span>
                </button>

                {/* Main Action Button */}
                <button
                  onClick={() => {
                    if (!isPaymentVerified) {
                      alert('Please collect & verify cash payment before proceeding to OTP verification.');
                      return;
                    }
                    setIsOtpModalOpen(true);
                  }}
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
                      ? 'Complete Delivery & Verify OTP'
                      : '🔒 Verify Payment to Complete Delivery'}
                  </span>
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Complete Delivery OTP Verification Modal */}
      {isOtpModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 bg-teal-50 text-teal-800 rounded-2xl mx-auto flex items-center justify-center mb-2 border border-teal-100">
                <Key size={24} />
              </div>
              <h3 className="text-lg font-black text-gray-900">Enter Customer OTP</h3>
              <p className="text-xs text-gray-500 font-medium">Ask customer for 4-digit PIN sent to their phone</p>
            </div>

            <form onSubmit={handleVerifyOtpSubmit} className="space-y-4">
              <div className="flex justify-center gap-3">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`otp-input-${idx}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                    className="w-12 h-14 text-center text-2xl font-black rounded-xl border-2 border-gray-300 focus:border-teal-700 focus:outline-none bg-gray-50 focus:bg-white transition-colors"
                  />
                ))}
              </div>

              {otpError && (
                <div className="text-center text-xs font-bold text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                  {otpError}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsOtpModalOpen(false)}
                  disabled={verifying}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-extrabold text-xs rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={verifying}
                  className="flex-1 py-3 bg-teal-800 hover:bg-teal-900 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-1 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
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
