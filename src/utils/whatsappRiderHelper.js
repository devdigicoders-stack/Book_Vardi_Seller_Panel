/**
 * Helper to generate pre-filled WhatsApp message and deep-link URL
 * for store delivery partners / riders.
 */

export const sanitizeWhatsAppPhone = (phone) => {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';
  return digits.slice(-10);
};

export const generateRiderWhatsAppMessage = ({
  order,
  driverName,
  vehicleNumber,
  trackingLink
}) => {
  const orderId = order.orderId || order.id || (order._id ? String(order._id).slice(-8).toUpperCase() : 'ORDER');

  const customerName = order.customerName || order.customer?.name || order.shippingAddress?.fullName || order.shippingAddress?.name || 'Customer';
  const customerPhone = order.customerPhone || order.customer?.phone || order.shippingAddress?.phone || 'N/A';

  let addressStr = 'Customer Delivery Address';
  if (typeof order.shippingAddress === 'string' && order.shippingAddress.trim()) {
    addressStr = order.shippingAddress.trim();
  } else if (order.shippingAddress && typeof order.shippingAddress === 'object') {
    const parts = [
      order.shippingAddress.name || order.shippingAddress.fullName,
      order.shippingAddress.addressLine || order.shippingAddress.street || order.shippingAddress.address,
      order.shippingAddress.colony || order.shippingAddress.landmark,
      order.shippingAddress.city,
      order.shippingAddress.state,
      order.shippingAddress.pincode ? `- ${order.shippingAddress.pincode}` : null,
      order.shippingAddress.phone ? `(Ph: ${order.shippingAddress.phone})` : null
    ].filter(Boolean);
    addressStr = parts.length > 0 ? parts.join(', ') : 'Customer Address';
  }

  const isExchange = Boolean(
    order.returnRequest?.type === 'exchange' ||
    order.returnRequest?.requestType === 'exchange' ||
    String(order.overallStatus || order.status || '').toLowerCase().includes('exchange')
  );

  const returnReq = order.returnRequest || {};
  const priceDiff = Number(returnReq.priceDifference || 0);
  const adjType = returnReq.priceAdjustmentType || (priceDiff > 0 ? 'extra_payment' : priceDiff < 0 ? 'partial_refund' : 'none');
  const isExtraPayment = isExchange && adjType === 'extra_payment' && priceDiff > 0;

  const totalAmount = order.total || order.totalAmount || order.payableAmount || 0;
  let paymentMode = String(order.paymentMethod || 'Online').toUpperCase().includes('COD')
    ? `Cash on Delivery (Collect ₹${totalAmount})`
    : 'Prepaid Online (No Cash Collection)';

  let exchangeSection = '';
  if (isExchange) {
    const oldItemName = returnReq.itemName || (order.items && order.items[0]?.name) || 'Delivered Product';
    const oldSpec = (order.items && order.items[0]?.size)
      ? `Size: ${order.items[0]?.size}`
      : (returnReq.isMeterBased && order.items && order.items[0]?.quantity)
      ? `Length: ${order.items[0]?.quantity}m`
      : 'Original Piece';

    const newSpec = returnReq.exchangeLength
      ? `${returnReq.exchangeLength} Meter(s)`
      : (returnReq.exchangeSize || returnReq.targetSize || 'Requested Variant');

    if (isExtraPayment) {
      paymentMode = `EXCHANGE EXTRA CHARGE: Collect ₹${priceDiff} Cash / UPI from Customer`;
    } else if (adjType === 'partial_refund') {
      paymentMode = `EQUAL / REFUND EXCHANGE: Collect ₹0 (₹${Math.abs(priceDiff)} refund processed to customer account)`;
    } else {
      paymentMode = `EQUAL VALUE EXCHANGE: Collect ₹0 (No Payment Needed)`;
    }

    exchangeSection =
`\n🔄 *EXCHANGE TASK INSTRUCTIONS:*
1. TAKE BACK FROM CUSTOMER: ${oldItemName} (${oldSpec})
2. HAND OVER TO CUSTOMER: ${oldItemName} (${newSpec})
3. PAYMENT INSTRUCTION: ${paymentMode}
`;
  }

  const itemsSummary = Array.isArray(order.items) && order.items.length > 0
    ? order.items.map(it => `• ${it.name || 'Product'} (Qty: ${it.quantity || 1}${it.size ? `, Size: ${it.size}` : ''})`).join('\n')
    : `• ${order.itemsCount || 1} package items`;

  return (
`🚚 *BookVardi ${isExchange ? 'Exchange ' : ''}Delivery Assignment*
Order ID: #${orderId}
Rider: ${driverName || 'Partner Rider'} (${vehicleNumber || 'Store Fleet'})
${isExchange ? '⚠️ TASK TYPE: 2-WAY PRODUCT EXCHANGE\n' : ''}
📍 *Customer Delivery Address:*
Name: ${customerName}
Contact: ${customerPhone}
Address: ${addressStr}
${exchangeSection}
🛒 *Package Items:*
${itemsSummary}
Payment: ${paymentMode}

🔗 *Live Delivery Partner Portal & Navigation Link:*
${trackingLink}

_Please tap the link to view customer address, location navigation, verify items, and enter customer OTP upon delivery._`
  );
};

export const buildRiderWhatsAppUrl = ({ phone, message }) => {
  const clean = sanitizeWhatsAppPhone(phone);
  if (!clean || clean.length !== 10) return '';
  return `https://wa.me/91${clean}?text=${encodeURIComponent(message)}`;
};
