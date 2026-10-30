/**
 * Invoice Numbering and Series Generation Utility
 * Generates sequential seller-specific invoice numbers (e.g. NSD01, NSD02, SS01, SS02)
 */

export const getSellerInvoicePrefix = (sellerOrStoreName) => {
  const name = (
    (typeof sellerOrStoreName === 'string' ? sellerOrStoreName : '') ||
    sellerOrStoreName?.storeName ||
    sellerOrStoreName?.sellerStoreName ||
    sellerOrStoreName?.businessName ||
    sellerOrStoreName?.sellerName ||
    sellerOrStoreName?.name ||
    ''
  ).trim();

  if (!name) return 'INV';

  const upper = name.toUpperCase();

  // Known Seller Exact Brand Matches
  if (upper.includes('NATIONAL SCHOOL DRESS') || upper.includes('NATIONAL SCHOOL')) {
    return 'NSD';
  }

  // Filter out filler words in Hindi/English business names
  const noiseWords = new Set([
    'AND', 'EVAM', 'THE', 'PVT', 'LTD', 'LIMITED', 'PRIVATE',
    'ENTERPRISE', 'ENTERPRISES', 'STORE', 'STORES', 'BHANDAR',
    'PUSTAK', 'BOOK', 'BOOKS', 'SHOP', 'COMPANY', 'CO'
  ]);

  const words = upper
    .replace(/[^A-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 0 && !noiseWords.has(w));

  const candidateWords = words.length > 0 
    ? words 
    : upper.replace(/[^A-Z0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length > 0);

  if (candidateWords.length >= 3) {
    return (candidateWords[0][0] + candidateWords[1][0] + candidateWords[2][0]).toUpperCase();
  } else if (candidateWords.length === 2) {
    return (candidateWords[0][0] + candidateWords[1][0]).toUpperCase();
  } else if (candidateWords.length === 1) {
    const single = candidateWords[0];
    return single.length >= 3 ? single.slice(0, 3) : single.padEnd(2, 'S');
  }

  return 'INV';
};

export const formatSellerInvoiceNumber = (prefix, seqNumber) => {
  const cleanPrefix = (prefix || 'INV').toUpperCase().trim();
  const num = Math.max(1, Number(seqNumber) || 1);
  return `${cleanPrefix}${String(num).padStart(2, '0')}`;
};

export const formatSellerCreditNoteNumber = (prefix, seqNumber) => {
  const cleanPrefix = (prefix || 'INV').toUpperCase().trim();
  const num = Math.max(1, Number(seqNumber) || 1);
  return `${cleanPrefix}CN${String(num).padStart(2, '0')}`;
};

export const getSellerCreditNoteNumber = (order, seller = null, allOrders = []) => {
  if (!order) return 'INVCN01';
  if (order.sellerCreditNoteNo && /^[A-Z0-9]{2,}CN\d+$/i.test(order.sellerCreditNoteNo)) {
    return order.sellerCreditNoteNo;
  }
  if (order.creditNoteNumber && /^[A-Z0-9]{2,}CN\d+$/i.test(order.creditNoteNumber)) {
    return order.creditNoteNumber;
  }
  const sellerCand = seller || order.sellerDetails || order.items?.[0]?.sellerDetails || order;
  const storeName = sellerCand?.storeName || sellerCand?.sellerStoreName || sellerCand?.businessName || sellerCand?.name || order.sellerStoreName || order.storeName || '';
  const prefix = getSellerInvoicePrefix(storeName);
  const seq = order.sellerCreditNoteSequence || order.sellerSequence || 1;
  return formatSellerCreditNoteNumber(prefix, seq);
};

/**
 * Resolves the sequential invoice number for a given order
 */
export const getSellerInvoiceNumber = (order, seller = null, allOrders = []) => {
  if (!order) return 'INV01';

  // 1. If order has a custom pre-computed seller invoice number that is not INV-<orderId>
  const existingInv = order.invoiceNumber || order.sellerInvoiceNo;
  if (existingInv && typeof existingInv === 'string' && !existingInv.startsWith('INV-')) {
    return existingInv;
  }

  // 2. Resolve prefix from seller or order
  const sellerCand = seller || order.sellerDetails || order.items?.[0]?.sellerDetails || order;
  const storeName = sellerCand?.storeName || sellerCand?.sellerStoreName || sellerCand?.businessName || sellerCand?.name || order.sellerStoreName || order.storeName || '';
  const prefix = getSellerInvoicePrefix(storeName);

  // 3. If explicit sellerSequence is attached
  if (order.sellerSequence && Number(order.sellerSequence) > 0) {
    return formatSellerInvoiceNumber(prefix, order.sellerSequence);
  }

  // 4. Calculate chronological sequence from allOrders list if provided
  if (Array.isArray(allOrders) && allOrders.length > 0) {
    // Filter orders belonging to the same seller if multi-seller array
    const targetOrderId = String(order.id || order.orderId || order._id || '');
    
    // Sort all orders chronologically (oldest first)
    const sorted = [...allOrders].sort((a, b) => {
      const timeA = new Date(a.createdAt || a.date || 0).getTime() || 0;
      const timeB = new Date(b.createdAt || b.date || 0).getTime() || 0;
      if (timeA !== timeB) return timeA - timeB;
      return String(a._id || a.id || '').localeCompare(String(b._id || b.id || ''));
    });

    const index = sorted.findIndex((o) => String(o.id || o.orderId || o._id || '') === targetOrderId);
    if (index >= 0) {
      return formatSellerInvoiceNumber(prefix, index + 1);
    }
  }

  return formatSellerInvoiceNumber(prefix, 1);
};

