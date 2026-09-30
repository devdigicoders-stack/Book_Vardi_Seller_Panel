import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Building2,
  UserCheck,
  MapPin,
  Package,
  Calendar,
  DollarSign,
  CheckCircle2,
  FileText,
  Send,
  Users,
  Globe,
  Sparkles,
  Clock,
  Phone,
  Mail,
  ShieldCheck,
  Eye,
  Camera,
  Check,
  Store,
  AlertCircle,
  Truck,
  ExternalLink,
  Lock,
  Printer,
  Percent,
  SlidersHorizontal
} from 'lucide-react';
import TaxInvoiceModal from './TaxInvoiceModal';
import PartialAdvanceReceiptModal from './PartialAdvanceReceiptModal';
import QuotationVersionComparisonModal from './QuotationVersionComparisonModal';
import NegotiationTimelineDiv from './NegotiationTimelineDiv';

export default function BulkOrderPreviewModal({
  order,
  onClose,
  userRole = 'seller', // 'consumer' | 'admin' | 'seller'
  initialTab = 'specs',
  sellers = [], // List of verified sellers for admin distribution
  onDistribute, // (orderId, { assignmentMode, sellerId, invitedSellerIds }) => void
  onApproveQuote, // (orderId, quoteId) => void
  onSubmitQuote, // (orderId, { quoteAmount, unitPrice, itemPrices, volumeDiscountNote, estimatedDeliveryDays, notes }) => void
  onAcceptCounterDemand, // (orderId, quoteId, payload) => void
  onReviseQuote, // (orderId, quoteId, payload) => void
  onAcceptDirect, // (orderId) => void
  sellerUser = null // Current seller info when userRole === 'seller'
}) {
  // Active Lightbox / Image Preview
  const [zoomImage, setZoomImage] = useState(null);

  // Active Specific Demand Item Detail Modal
  const [selectedItemForDetail, setSelectedItemForDetail] = useState(null);
  const [itemSellerPriceInput, setItemSellerPriceInput] = useState('');

  // Active Tab inside modal
  const [modalSubTab, setModalSubTab] = useState(initialTab || 'specs'); // 'specs', 'distribution', 'quotes', 'submit_quote'

  // Version Comparison Modal State
  const [comparingQuote, setComparingQuote] = useState(null);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);

  // Extended Interactive Timeline Div State
  const [expandedTimelineQuoteId, setExpandedTimelineQuoteId] = useState(null);
  const [selectedTimelineVersion, setSelectedTimelineVersion] = useState(null);

  const toggleTimelineForQuote = (qId, ver = null) => {
    if (expandedTimelineQuoteId === qId && (ver === null || ver === selectedTimelineVersion)) {
      setExpandedTimelineQuoteId(null);
      setSelectedTimelineVersion(null);
    } else {
      setExpandedTimelineQuoteId(qId);
      setSelectedTimelineVersion(ver);
    }
  };

  const handleOpenVersionComparison = (q) => {
    setComparingQuote(q);
    setIsComparisonOpen(true);
  };

  // Admin Distribution State
  const [distributeMode, setDistributeMode] = useState(order?.assignmentMode || 'direct');
  const [selectedSingleSeller, setSelectedSingleSeller] = useState(
    order?.sellerId ? (typeof order.sellerId === 'object' ? (order.sellerId._id || order.sellerId.id) : order.sellerId) : ''
  );
  const [selectedMultipleSellers, setSelectedMultipleSellers] = useState(
    (order?.invitedSellerIds || []).map(s => (typeof s === 'object' ? (s._id || s.id) : s))
  );
  const [sellerSearchQuery, setSellerSearchQuery] = useState('');

  // Seller Quotation State & Robust Candidate Matching
  const sellerCandidateIds = useMemo(() => {
    return [
      sellerUser?.id,
      sellerUser?._id,
      sellerUser?.merchantId,
      typeof window !== 'undefined' ? localStorage.getItem('bv_seller_id') : '',
      typeof window !== 'undefined' ? localStorage.getItem('bookvardi_seller_id') : '',
      typeof window !== 'undefined' ? localStorage.getItem('user_id') : ''
    ].filter(Boolean).map(String);
  }, [sellerUser]);

  const currentSellerId = String(sellerUser?.id || sellerUser?._id || sellerCandidateIds[0] || '');
  const cleanSellerPhone = String(sellerUser?.phone || '').replace(/\D/g, '').slice(-10);
  const cleanSellerStore = (sellerUser?.storeName || sellerUser?.name || '').trim().toLowerCase();

  const existingSellerQuote = useMemo(() => {
    if (!Array.isArray(order?.quotations) || order.quotations.length === 0) return null;

    // 1. Check direct candidate ID match
    const matchById = order.quotations.find(q => {
      const qId = String(q.sellerId?._id || q.sellerId?.id || q.sellerId || '');
      return qId && (qId === currentSellerId || sellerCandidateIds.includes(qId));
    });
    if (matchById) return matchById;

    // 2. Check phone match
    if (cleanSellerPhone) {
      const matchByPhone = order.quotations.find(q => {
        const qPhone = String(q.sellerPhone || '').replace(/\D/g, '').slice(-10);
        return qPhone && qPhone === cleanSellerPhone;
      });
      if (matchByPhone) return matchByPhone;
    }

    // 3. Check store name match
    if (cleanSellerStore) {
      const matchByStore = order.quotations.find(q => {
        const qStore = (q.sellerStoreName || q.sellerName || '').trim().toLowerCase();
        return qStore && (qStore === cleanSellerStore || cleanSellerStore.includes(qStore) || qStore.includes(cleanSellerStore));
      });
      if (matchByStore) return matchByStore;
    }

    // 4. In seller panel with sanitized array of length 1: it belongs to this seller!
    if (userRole === 'seller' && order.quotations.length === 1) {
      return order.quotations[0];
    }

    return null;
  }, [order?.quotations, currentSellerId, sellerCandidateIds, cleanSellerPhone, cleanSellerStore, userRole]);

  const isMyQuote = (q) => {
    if (!q) return false;
    const qSellerId = String(q.sellerId?._id || q.sellerId?.id || q.sellerId || '');
    if (qSellerId && (qSellerId === currentSellerId || sellerCandidateIds.includes(qSellerId))) return true;
    const qPhone = String(q.sellerPhone || '').replace(/\D/g, '').slice(-10);
    if (cleanSellerPhone && qPhone && qPhone === cleanSellerPhone) return true;
    const qStore = (q.sellerStoreName || q.sellerName || '').trim().toLowerCase();
    if (cleanSellerStore && qStore && (qStore === cleanSellerStore || cleanSellerStore.includes(qStore) || qStore.includes(cleanSellerStore))) return true;
    if (existingSellerQuote && String(existingSellerQuote._id || existingSellerQuote.id) === String(q._id || q.id)) return true;
    if (userRole === 'seller' && Array.isArray(order?.quotations) && order.quotations.length === 1) return true;
    return false;
  };

  const targetBudgetNum = Number(order?.targetBudgetPerKit || order?.estimatedBudget || 0);
  const totalQtyNum = Number(
    order?.totalQuantity ||
    order?.quantity ||
    (Array.isArray(order?.requirements) ? order.requirements.reduce((s, r) => s + Number(r.quantity || 0), 0) : 100)
  );

  const [quoteAmount, setQuoteAmount] = useState(
    existingSellerQuote ? String(existingSellerQuote.quoteAmount) : (targetBudgetNum ? String(targetBudgetNum) : '')
  );
  const [unitPrice, setUnitPrice] = useState(
    existingSellerQuote
      ? String(existingSellerQuote.unitPrice || 0)
      : (targetBudgetNum && totalQtyNum ? String(Math.round(targetBudgetNum / totalQtyNum)) : '')
  );
  const [deliveryDays, setDeliveryDays] = useState(
    existingSellerQuote ? String(existingSellerQuote.estimatedDeliveryDays || 7) : '7'
  );
  const [quoteNotes, setQuoteNotes] = useState(existingSellerQuote ? (existingSellerQuote.notes || '') : '');
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Advance Payment Counter-Demand State
  const [sellerAdvanceType, setSellerAdvanceType] = useState(
    existingSellerQuote?.sellerAdvanceType || order?.buyerAdvanceType || 'percentage'
  );
  const [sellerAdvancePercentage, setSellerAdvancePercentage] = useState(
    existingSellerQuote?.sellerAdvancePercentage ?? (order?.buyerAdvancePercentage || 30)
  );
  const [sellerAdvanceAmount, setSellerAdvanceAmount] = useState(
    existingSellerQuote?.sellerAdvanceAmount ? String(existingSellerQuote.sellerAdvanceAmount) : (order?.buyerAdvanceAmount ? String(order.buyerAdvanceAmount) : '')
  );
  const [sellerAdvanceTerms, setSellerAdvanceTerms] = useState(
    existingSellerQuote?.sellerAdvanceTerms || (order?.buyerAdvanceNote ? `Agreed to buyer advance: ${order.buyerAdvanceNote}` : '30% advance on sample approval before bulk procurement, 70% upon delivery.')
  );

  // Keep state updated when order changes
  useEffect(() => {
    if (order) {
      if (initialTab) {
        setModalSubTab(initialTab);
      }
      setDistributeMode(order.assignmentMode || 'direct');
      setSelectedSingleSeller(order.sellerId ? (typeof order.sellerId === 'object' ? (order.sellerId._id || order.sellerId.id) : order.sellerId) : '');
      setSelectedMultipleSellers(
        (order.invitedSellerIds || []).map(s => (typeof s === 'object' ? (s._id || s.id) : s))
      );

      if (existingSellerQuote) {
        setSellerAdvanceType(existingSellerQuote.sellerAdvanceType || 'percentage');
        setSellerAdvancePercentage(existingSellerQuote.sellerAdvancePercentage || 30);
        setSellerAdvanceAmount(existingSellerQuote.sellerAdvanceAmount ? String(existingSellerQuote.sellerAdvanceAmount) : '');
        setSellerAdvanceTerms(existingSellerQuote.sellerAdvanceTerms || '');
      } else {
        setSellerAdvanceType(order.buyerAdvanceType || 'percentage');
        setSellerAdvancePercentage(order.buyerAdvancePercentage || 30);
        setSellerAdvanceAmount(order.buyerAdvanceAmount ? String(order.buyerAdvanceAmount) : '');
        setSellerAdvanceTerms(order.buyerAdvanceNote ? `Agreed to buyer advance: ${order.buyerAdvanceNote}` : '30% advance on sample approval before bulk procurement, 70% upon delivery.');
      }
    }
  }, [order, initialTab]);

  // Normalization Helpers
  const refId = order?.referenceId || order?.id || (order?._id ? `SCH-${order._id}` : 'SCH-BULK');
  const instName = order?.institutionName || order?.schoolName || 'School / College';
  const instType = order?.institutionType || 'Educational Institution';
  const schId = order?.schoolId || '';

  const contactName = order?.contactName || order?.contactPerson || 'Purchaser Contact';
  const contactPhone = order?.contactPhone || 'N/A';
  const contactEmail = order?.contactEmail || 'N/A';
  const designation = order?.designation || 'Administrator';

  const address = order?.address || order?.addressLine || 'N/A';
  const city = order?.city || 'Delhi';
  const state = order?.state || 'Delhi';
  const pincode = order?.pincode || '';

  const requirementsList = useMemo(() => {
    if (!order) return [];
    return Array.isArray(order.requirements) && order.requirements.length > 0
      ? order.requirements
      : [
          {
            category: 'Bulk Procurement',
            itemName: order?.requirementSummary || order?.additionalNotes || 'Bulk School Uniform & Stationery',
            quantity: totalQtyNum,
            budgetPerUnit: targetBudgetNum && totalQtyNum ? Math.round(targetBudgetNum / totalQtyNum) : 0,
            sellerPricePerUnit: 0,
            sampleImage: '',
            notes: order?.additionalNotes || ''
          }
        ];
  }, [order, totalQtyNum, targetBudgetNum]);

  // Descriptive Pitch State: Line-by-line product demand pricing and scale notes
  const [pitchItems, setPitchItems] = useState([]);
  const [volumeDiscountNote, setVolumeDiscountNote] = useState(
    existingSellerQuote?.volumeDiscountNote || 'Prices can be decreased if order quantity increases.'
  );

  useEffect(() => {
    if (requirementsList && requirementsList.length > 0) {
      const mapped = requirementsList.map((item, idx) => {
        const existingItemPrice = existingSellerQuote?.itemPrices?.find(
          ip => String(ip.itemId) === String(item._id || item.id || idx) || String(ip.itemName) === String(item.itemName)
        );
        const custBudget = Number(item.budgetPerUnit || item.budgetUnit || 0);
        // STRICT PRIVACY: NEVER autofill another seller's pitch price!
        // Only use existingItemPrice if THIS seller has previously quoted it; otherwise default to customer target budget or 0.
        const currentSellerPrice = existingItemPrice
          ? Number(existingItemPrice.pricePerUnit || 0)
          : (custBudget > 0 ? custBudget : 0);
        const qty = Number(item.quantity || 1);

        return {
          itemId: String(item._id || item.id || idx),
          itemName: item.itemName,
          category: item.category || 'Bulk Procurement',
          quantity: qty,
          customerBudget: custBudget,
          pricePerUnit: currentSellerPrice,
          totalPrice: qty * currentSellerPrice,
          discountTierNote: existingItemPrice?.discountTierNote || ''
        };
      });
      setPitchItems(mapped);
    }
    if (existingSellerQuote?.volumeDiscountNote) {
      setVolumeDiscountNote(existingSellerQuote.volumeDiscountNote);
    }
  }, [requirementsList, existingSellerQuote]);

  // Live calculations for the Seller Pitch
  const calculatedGrandTotal = useMemo(() => {
    return pitchItems.reduce((sum, item) => sum + (Number(item.quantity || 0) * Number(item.pricePerUnit || 0)), 0);
  }, [pitchItems]);

  const totalCustomerTargetBudget = useMemo(() => {
    return requirementsList.reduce((sum, item) => sum + (Number(item.quantity || 0) * Number(item.budgetPerUnit || item.budgetUnit || 0)), 0);
  }, [requirementsList]);

  const calculatedAvgUnitPrice = useMemo(() => {
    return totalQtyNum > 0 ? Math.round(calculatedGrandTotal / totalQtyNum) : 0;
  }, [calculatedGrandTotal, totalQtyNum]);

  const handleItemPriceChange = (index, newPrice) => {
    setPitchItems(prev => {
      const updated = [...prev];
      const item = { ...updated[index] };
      const priceNum = Math.max(0, Number(newPrice) || 0);
      item.pricePerUnit = priceNum;
      item.totalPrice = (Number(item.quantity) || 1) * priceNum;
      updated[index] = item;
      return updated;
    });
  };

  const handleItemDiscountNoteChange = (index, noteText) => {
    setPitchItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], discountTierNote: noteText };
      return updated;
    });
  };

  const winningQuote = Array.isArray(order?.quotations)
    ? order.quotations.find(q => q.status === 'approved' || String(q._id) === String(order?.acceptedQuoteId))
    : null;

  // Logistics tracking gating: strictly visible when Out for Delivery & partner decided
  const normStatus = String(order?.deliveryStatus || order?.status || '').toLowerCase().replace(/_/g, ' ');
  const isOut = normStatus === 'out for delivery' || normStatus === 'delivered';
  const isSelf = String(order?.deliveryMode || '').toLowerCase().includes('self') || Boolean(order?.selfDeliveryDetails?.deliveryPartnerToken || order?.selfDeliveryDetails?.deliveryPersonName);
  const isThirdParty = String(order?.deliveryMode || '').toLowerCase().includes('third') || Boolean(order?.courierName && order?.courierName !== 'N/A');
  const hasPartner = isSelf || isThirdParty || Boolean((order?.courierName && order?.courierName !== 'N/A') || order?.selfDeliveryDetails?.deliveryPersonName);
  const canViewTracking = isOut && hasPartner && Boolean(order?.trackingNumber || order?.selfDeliveryDetails?.deliveryPartnerToken);

  const deliveryPartnerDisplay = isSelf 
    ? (order?.selfDeliveryDetails?.deliveryPersonName ? `Direct Self-Delivery (Rider: ${order.selfDeliveryDetails.deliveryPersonName})` : 'Direct Self-Delivery (Store Fleet)')
    : (order?.courierName || 'N/A');

  const trackingNumberDisplay = order?.trackingNumber || (isSelf ? order?.selfDeliveryDetails?.deliveryPartnerToken : '') || '';
  const trackingLinkDisplay = order?.trackingUrl || order?.selfDeliveryDetails?.trackingUrl || '';

  // Transform bulk order into TaxInvoice-compatible object
  const taxInvoiceOrder = useMemo(() => {
    if (!order) return null;
    const totalQty = Number(order.totalQuantity || order.quantity || (Array.isArray(order.requirements) ? order.requirements.reduce((s, r) => s + Number(r.quantity || 0), 0) : 100));
    const quoteVal = Number(winningQuote?.quoteAmount || order.targetBudgetPerKit || order.estimatedBudget || order.overallBudget || 0);
    const avgPrice = totalQty > 0 ? Math.round(quoteVal / totalQty) : 0;

    const reqItems = Array.isArray(order.requirements) && order.requirements.length > 0
      ? order.requirements.map((r, idx) => ({
          id: r._id || idx + 1,
          name: r.itemName || 'School Supply Item',
          category: r.category || 'School Uniform',
          quantity: Number(r.quantity || 1),
          price: Number(r.sellerPricePerUnit || (winningQuote?.itemPrices?.find(ip => String(ip.itemId || ip.itemName) === String(r._id || r.itemName))?.pricePerUnit) || avgPrice || 100),
          sellerName: winningQuote?.sellerStoreName || winningQuote?.sellerName || 'Verified Institutional Seller',
          sellerStoreName: winningQuote?.sellerStoreName || winningQuote?.sellerName || 'Verified Institutional Seller'
        }))
      : [{
          id: 1,
          name: order.requirementSummary || 'Institutional Bulk Supply Order',
          category: 'School Uniform',
          quantity: totalQty,
          price: avgPrice,
          sellerName: winningQuote?.sellerStoreName || winningQuote?.sellerName || 'Verified Institutional Seller',
          sellerStoreName: winningQuote?.sellerStoreName || winningQuote?.sellerName || 'Verified Institutional Seller'
        }];

    return {
      id: order.referenceId || order.id || order._id || 'BULK-PO',
      orderId: order.referenceId || order.id || order._id || 'BULK-PO',
      date: new Date(order.createdAt || Date.now()).toLocaleDateString('en-GB'),
      customerName: order.institutionName || order.contactName || 'School Administrator',
      customerPhone: userRole === 'admin' ? (order.contactPhone || 'N/A') : 'Protected (Admin Only)',
      address: userRole === 'admin'
        ? `${order.address || ''}, ${order.city || ''}, ${order.state || ''} ${order.pincode ? '- ' + order.pincode : ''}`.trim() || 'Campus Delivery Address'
        : `${order.city || ''}, ${order.state || ''}`.trim() || 'Campus Destination',
      shippingAddress: {
        street: userRole === 'admin' ? (order.address || 'Campus Delivery Address') : 'Campus Destination',
        city: order.city || 'Lucknow',
        state: order.state || 'Uttar Pradesh',
        pincode: userRole === 'admin' ? (order.pincode || '226001') : '******'
      },
      school: order.institutionName || 'Institutional Order',
      paymentMethod: 'School PO / Bank Transfer',
      paymentStatus: 'paid',
      status: order.deliveryStatus || order.status || 'confirmed',
      overallStatus: order.deliveryStatus || order.status || 'confirmed',
      deliveryMode: order.deliveryMode || '',
      courierName: order.courierName || '',
      trackingNumber: order.trackingNumber || '',
      trackingUrl: order.trackingUrl || '',
      selfDeliveryDetails: order.selfDeliveryDetails || null,
      sellerName: winningQuote?.sellerStoreName || winningQuote?.sellerName || 'BookVardi Verified Seller',
      sellerStoreName: winningQuote?.sellerStoreName || winningQuote?.sellerName || 'BookVardi Verified Seller',
      sellerPhone: winningQuote?.sellerPhone || 'Helpline',
      items: reqItems,
      total: quoteVal
    };
  }, [order, winningQuote]);

  // Filtered sellers for Admin Distribution
  const verifiedSellers = useMemo(() => {
    return (sellers || []).filter(s =>
      s.status === 'Verified' || s.status === 'approved' || s.status === 'Active' || !s.status
    );
  }, [sellers]);

  const filteredSellersForModal = useMemo(() => {
    if (!sellerSearchQuery.trim()) return verifiedSellers;
    const q = sellerSearchQuery.toLowerCase();
    return verifiedSellers.filter(s =>
      (s.storeName || s.businessName || '').toLowerCase().includes(q) ||
      (s.ownerName || s.name || '').toLowerCase().includes(q) ||
      (s.city || '').toLowerCase().includes(q)
    );
  }, [verifiedSellers, sellerSearchQuery]);

  const toggleSellerSelect = (sId) => {
    setSelectedMultipleSellers(prev =>
      prev.includes(sId) ? prev.filter(id => id !== sId) : [...prev, sId]
    );
  };

  const handleAdminDistributionSubmit = (e) => {
    e.preventDefault();
    if (!onDistribute) return;

    if (distributeMode === 'direct' && !selectedSingleSeller) {
      alert('Please select a seller for direct assignment.');
      return;
    }
    if (distributeMode === 'selected' && selectedMultipleSellers.length === 0) {
      alert('Please select at least one seller to invite.');
      return;
    }

    onDistribute(order.id || order._id, {
      assignmentMode: distributeMode,
      sellerId: distributeMode === 'direct' ? selectedSingleSeller : null,
      invitedSellerIds: distributeMode === 'selected' ? selectedMultipleSellers : []
    });

    setModalSubTab('specs');
  };

  const handleSellerAdvanceTypeChange = (type) => {
    setSellerAdvanceType(type);
    const finalAmount = calculatedGrandTotal > 0 ? calculatedGrandTotal : Number(quoteAmount) || 0;
    if (type === 'amount') {
      if (finalAmount > 0 && sellerAdvancePercentage) {
        setSellerAdvanceAmount(String(Math.round((finalAmount * Number(sellerAdvancePercentage)) / 100)));
      }
    } else {
      if (finalAmount > 0 && sellerAdvanceAmount) {
        setSellerAdvancePercentage(Math.min(100, Math.max(1, Math.round((Number(sellerAdvanceAmount) / finalAmount) * 100))));
      }
    }
  };

  const handleSellerAdvancePercentageChange = (pct) => {
    const p = Math.max(0, Math.min(100, Number(pct) || 0));
    setSellerAdvancePercentage(p);
    const finalAmount = calculatedGrandTotal > 0 ? calculatedGrandTotal : Number(quoteAmount) || 0;
    if (finalAmount > 0) {
      setSellerAdvanceAmount(String(Math.round((finalAmount * p) / 100)));
    }
  };

  const handleSellerAdvanceAmountChange = (amt) => {
    setSellerAdvanceAmount(amt);
    const finalAmount = calculatedGrandTotal > 0 ? calculatedGrandTotal : Number(quoteAmount) || 0;
    const numAmt = Number(amt) || 0;
    if (finalAmount > 0 && numAmt > 0) {
      const calcPct = Math.min(100, Math.max(1, Math.round((numAmt / finalAmount) * 100)));
      setSellerAdvancePercentage(calcPct);
    }
  };

  const [expandedHistoryQuotes, setExpandedHistoryQuotes] = useState({});
  const toggleHistory = (quoteId) => {
    setExpandedHistoryQuotes(prev => ({
      ...prev,
      [quoteId]: !prev[quoteId]
    }));
  };

  const handleSellerQuoteSubmit = (e) => {
    e.preventDefault();

    const finalAmount = calculatedGrandTotal > 0 ? calculatedGrandTotal : Number(quoteAmount);
    if (!finalAmount || finalAmount <= 0) {
      alert("Please enter a valid price for the demanded items.");
      return;
    }

    const calculatedAdvAmt = sellerAdvanceType === 'percentage'
      ? Math.round((finalAmount * Number(sellerAdvancePercentage || 30)) / 100)
      : (Number(sellerAdvanceAmount) || Math.round((finalAmount * Number(sellerAdvancePercentage || 30)) / 100));

    const payload = {
      quoteAmount: finalAmount,
      unitPrice: calculatedAvgUnitPrice,
      itemPrices: pitchItems,
      volumeDiscountNote: volumeDiscountNote || 'Prices can be decreased if order quantity increases.',
      estimatedDeliveryDays: Number(deliveryDays) || 7,
      notes: quoteNotes,
      sellerAdvanceType,
      sellerAdvancePercentage: Number(sellerAdvancePercentage || 30),
      sellerAdvanceAmount: calculatedAdvAmt,
      sellerAdvanceTerms,
      prepaymentType: sellerAdvanceType,
      prepaymentPercentage: Number(sellerAdvancePercentage || 30),
      prepaymentAmount: calculatedAdvAmt,
      prepaymentTerms: sellerAdvanceTerms
    };

    if (existingSellerQuote && onReviseQuote) {
      onReviseQuote(order.id || order._id, existingSellerQuote._id || existingSellerQuote.id, payload);
    } else if (onSubmitQuote) {
      onSubmitQuote(order.id || order._id, payload);
    }

    setModalSubTab('specs');
  };

  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[92vh] shadow-2xl overflow-hidden flex flex-col border border-gray-200">
        
        {/* Top Header */}
        <div className="bg-linear-to-r from-teal-900 via-teal-800 to-teal-950 text-white p-5 flex items-center justify-between shrink-0 border-b border-teal-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-teal-950 flex items-center justify-center font-bold shadow-md">
              <Building2 size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-black uppercase tracking-wider bg-white/15 px-2.5 py-0.5 rounded border border-white/20">
                  {refId}
                </span>
                <h2 className="text-lg font-extrabold text-white font-display line-clamp-1">{instName}</h2>
              </div>
              <p className="text-xs text-teal-200 mt-0.5 flex items-center gap-2">
                <span>{instType}</span>
                <span>•</span>
                <span>{city}, {state}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${
              order.status === 'quote_accepted'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                : order.status === 'published' || order.status === 'assigned'
                ? 'bg-blue-500/20 text-blue-300 border-blue-400/40'
                : 'bg-amber-500/20 text-amber-300 border-amber-400/40'
            }`}>
              {order.status === 'quote_accepted' ? 'Quote Accepted & Finalized' :
               order.status === 'published' ? 'Marketplace RFQ Published' :
               order.status === 'assigned' ? 'Assigned to Vendor' : 'Pending Distribution'}
            </span>

            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors text-teal-200 hover:text-white cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Action Sub-Navigation Tabs */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-2.5 flex items-center justify-between gap-2 overflow-x-auto text-xs font-bold shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setModalSubTab('specs')}
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                modalSubTab === 'specs'
                  ? 'bg-teal-800 text-white shadow-xs'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <FileText size={14} />
              <span>Full Specifications</span>
            </button>

            {/* Admin Distribution Tab */}
            {userRole === 'admin' && (
              <button
                onClick={() => setModalSubTab('distribution')}
                className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  modalSubTab === 'distribution'
                    ? 'bg-teal-800 text-white shadow-xs'
                    : 'bg-white border border-gray-200 text-teal-800 hover:bg-teal-50'
                }`}
              >
                <Send size={14} />
                <span>Distribute / Channel Mode</span>
              </button>
            )}

            {/* Vendor Quotes / My Quotation Tab */}
            <button
              onClick={() => setModalSubTab('quotes')}
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                modalSubTab === 'quotes'
                  ? 'bg-purple-800 text-white shadow-xs'
                  : 'bg-white border border-gray-200 text-purple-800 hover:bg-purple-50'
              }`}
            >
              <Sparkles size={14} />
              <span>
                {userRole === 'admin'
                  ? `Vendor Quotations (${order.quotations?.length || 0})`
                  : (existingSellerQuote ? 'My Quotation / Pitch' : 'My Pitch Status')}
              </span>
            </button>

            {/* Seller Proposal Form Tab */}
            {userRole === 'seller' && (
              <button
                onClick={() => setModalSubTab('submit_quote')}
                className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  modalSubTab === 'submit_quote'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-50'
                }`}
              >
                <Send size={14} />
                <span>{existingSellerQuote ? 'Pitch Updated Quotation' : 'Pitch Proposal Quotation'}</span>
              </button>
            )}
          </div>

          <span className="text-[11px] text-gray-400 font-mono hidden sm:inline-block">
            Created: {new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-gray-800 flex-1">
          
          {/* Top Sticky Alert if Counter Demand is Received from Buyer */}
          {userRole === 'seller' && existingSellerQuote?.negotiationStage === 'buyer_countered' && existingSellerQuote.latestBuyerCounter && (
            <div className="p-4 bg-gradient-to-r from-amber-500/10 via-orange-500/15 to-amber-500/10 border-2 border-amber-400 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs animate-pulse">
                  <Clock size={19} />
                </div>
                <div>
                  <div className="font-black text-xs text-amber-950 flex items-center gap-2">
                    <span>🔔 Buyer Sent 2nd Version Counter-Demand</span>
                    <span className="bg-amber-500 text-white text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full">Action Required</span>
                  </div>
                  <div className="text-[11px] text-amber-900 mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span>Target Budget: <strong className="font-mono font-extrabold text-amber-950">₹{Number(existingSellerQuote.latestBuyerCounter.targetBudget).toLocaleString()}</strong></span>
                    <span>Quantity: <strong className="font-mono font-extrabold text-amber-950">{existingSellerQuote.latestBuyerCounter.totalQuantity || totalQtyNum} Units</strong></span>
                    {(existingSellerQuote.latestBuyerCounter.unitPrice || existingSellerQuote.latestBuyerCounter.targetBudget) && (
                      <span>Unit Rate: <strong className="font-mono font-extrabold text-amber-950">₹{Number(existingSellerQuote.latestBuyerCounter.unitPrice || Math.round(Number(existingSellerQuote.latestBuyerCounter.targetBudget) / (Number(existingSellerQuote.latestBuyerCounter.totalQuantity) || totalQtyNum || 1))).toLocaleString()} / unit</strong></span>
                    )}
                    {existingSellerQuote.latestBuyerCounter.requestedDeliveryDays && (
                      <span>Lead Time: <strong className="text-amber-950">{existingSellerQuote.latestBuyerCounter.requestedDeliveryDays} Days</strong></span>
                    )}
                    {existingSellerQuote.latestBuyerCounter.proposedAdvancePercentage && (
                      <span>Advance: <strong className="text-amber-950">{existingSellerQuote.latestBuyerCounter.proposedAdvancePercentage}%</strong></span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setModalSubTab('quotes');
                    toggleTimelineForQuote(existingSellerQuote._id || existingSellerQuote.id, existingSellerQuote.currentVersion || 2);
                  }}
                  className="px-3 py-1.5 bg-white hover:bg-amber-50 text-amber-900 border border-amber-300 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-2xs"
                >
                  View Timeline & Versions
                </button>
                <button
                  type="button"
                  onClick={() => setModalSubTab('submit_quote')}
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <Sparkles size={13} />
                  <span>Review & Revise Pitch</span>
                </button>
              </div>
            </div>
          )}
          {modalSubTab === 'specs' && (
            <div className="space-y-6">
              
              {/* Institution & Contact Header Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50/80 p-5 rounded-2xl border border-gray-200">
                <div className="space-y-2">
                  <h3 className="font-extrabold text-xs text-teal-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 size={15} /> School & Institution Information
                  </h3>
                  <div className="text-sm font-bold text-gray-900">{instName}</div>
                  <div className="text-gray-600">Type: <strong className="text-gray-800">{instType}</strong></div>
                  {schId && <div className="text-gray-600">School ID / Affiliation: <strong className="font-mono text-gray-800">{schId}</strong></div>}
                </div>

                <div className="space-y-2 border-t md:border-t-0 md:border-l border-gray-200 pt-3 md:pt-0 md:pl-4">
                  <h3 className="font-extrabold text-xs text-teal-800 uppercase tracking-wider flex items-center gap-1.5">
                    <UserCheck size={15} /> Authorized Administrator Contact
                  </h3>
                  <div className="text-sm font-bold text-gray-900">{contactName}</div>
                  {userRole === 'admin' && (
                    <div className="flex items-center gap-3 text-gray-700">
                      <span className="flex items-center gap-1 font-semibold"><Phone size={13} className="text-gray-400" /> {contactPhone}</span>
                      <span className="flex items-center gap-1"><Mail size={13} className="text-gray-400" /> {contactEmail}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Delivery School Address Card */}
              <div className="bg-purple-50/60 p-4 rounded-2xl border border-purple-200 space-y-1">
                <h3 className="font-extrabold text-xs text-purple-900 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                  <MapPin size={15} /> Campus Delivery Destination
                </h3>
                {userRole === 'admin' ? (
                  <>
                    <div className="font-bold text-gray-900 text-xs">{address}</div>
                    <div className="text-gray-700">
                      {city}, {state} - <strong className="font-mono text-gray-900">{pincode || '226001'}</strong>
                    </div>
                  </>
                ) : (
                  <div className="font-bold text-gray-900 text-xs">
                    {city}, {state}
                  </div>
                )}
              </div>

              {/* Approved Winning Quotation / Status Banners */}
              {(() => {
                const assignedId = order.sellerId ? (typeof order.sellerId === 'object' ? (order.sellerId._id || order.sellerId.id) : order.sellerId) : '';
                const isAcceptedToMe = Boolean(
                  winningQuote && (
                    isMyQuote(winningQuote) ||
                    (currentSellerId && String(winningQuote.sellerId) === String(currentSellerId)) ||
                    sellerCandidateIds.includes(String(winningQuote.sellerId))
                  )
                );
                const isAcceptedOtherSeller = Boolean(
                  (order.status === 'quote_accepted' || winningQuote) &&
                  assignedId &&
                  !sellerCandidateIds.includes(String(assignedId)) &&
                  String(assignedId) !== String(currentSellerId) &&
                  !isAcceptedToMe
                );

                if (isAcceptedToMe && userRole === 'seller') {
                  return (
                    <div className="bg-emerald-600 text-white p-4.5 rounded-2xl shadow-md space-y-3 border border-emerald-500">
                      <div className="font-black text-sm flex items-center gap-2">
                        <Sparkles size={18} className="text-amber-300" /> 🎉 Order Received! Your Quotation Was Accepted by Customer
                      </div>
                      <p className="text-xs text-emerald-100 font-medium">
                        Congratulations! The customer accepted your quotation pitch of <strong>₹{Number(winningQuote.quoteAmount).toLocaleString()}</strong>. Admin and Customer have received your fulfillment commitment.
                      </p>

                      {/* Action Row: View Tax Invoice Button & Tracking Status */}
                      <div className="pt-2 border-t border-emerald-500/80 flex flex-wrap items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => setIsInvoiceOpen(true)}
                          className="px-3.5 py-1.5 bg-white hover:bg-gray-100 text-emerald-950 font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <FileText size={14} />
                          <span>View Official Tax Invoice & PO Certificate</span>
                        </button>

                        {canViewTracking ? (
                          <div className="flex items-center gap-2 bg-emerald-700/80 text-white px-3 py-1.5 rounded-xl border border-emerald-400 text-xs">
                            <Truck size={14} className="text-amber-300" />
                            <span>{isSelf ? '🛵 Self-Delivery' : `🚚 ${order.courierName || 'Courier'}`}:</span>
                            <span className="font-mono font-bold bg-white/20 px-1.5 py-0.5 rounded border border-white/20">{trackingNumberDisplay}</span>
                            {trackingLinkDisplay && (
                              <a
                                href={trackingLinkDisplay}
                                target="_blank"
                                rel="noreferrer"
                                className="text-amber-300 hover:text-white font-bold underline flex items-center gap-0.5 ml-1"
                              >
                                Track <ExternalLink size={11} />
                              </a>
                            )}
                          </div>
                        ) : (
                          <div className="text-[11px] text-emerald-100 bg-emerald-700/50 px-2.5 py-1 rounded-lg border border-emerald-500 flex items-center gap-1.5">
                            <Lock size={12} className="text-emerald-200" />
                            <span>
                              {isOut ? 'Out for Delivery (Delivery partner pending)' : 'Tracking available once Out for Delivery & partner decided'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }

                if (isAcceptedOtherSeller && userRole === 'seller' && existingSellerQuote) {
                  return (
                    <div className="bg-amber-50 border border-amber-300 text-amber-950 p-4.5 rounded-2xl shadow-xs space-y-1.5">
                      <div className="font-extrabold text-xs uppercase tracking-wider text-amber-900 flex items-center gap-2">
                        <AlertCircle size={16} className="text-amber-700" /> Requisition Awarded to Another Vendor
                      </div>
                      <p className="text-xs text-amber-900 font-medium leading-relaxed">
                        The customer has selected and accepted another proposal for this bulk requisition. All vendor proposals remain strictly private. Thank you for submitting your quotation!
                      </p>
                    </div>
                  );
                }

                if (winningQuote && (userRole === 'admin' || isAcceptedToMe)) {
                  return (
                    <div className="bg-emerald-50 border border-emerald-300 p-4 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-emerald-900 flex items-center gap-1.5 text-sm">
                          <CheckCircle2 size={18} className="text-emerald-600" /> Approved & Winning Vendor Quotation
                        </span>
                        <span className="font-extrabold text-lg text-emerald-950 font-mono">
                          ₹{Number(winningQuote.quoteAmount).toLocaleString()}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs bg-white p-3 rounded-xl border border-emerald-200">
                        <div>
                          <span className="text-gray-400">Fulfilled By:</span>
                          <div className="font-bold text-gray-900">{winningQuote.sellerStoreName || winningQuote.sellerName}</div>
                        </div>
                        <div>
                          <span className="text-gray-400">Vendor Phone:</span>
                          <div className="font-bold text-gray-900">{winningQuote.sellerPhone || 'N/A'}</div>
                        </div>
                        <div>
                          <span className="text-gray-400">Delivery Lead Time:</span>
                          <div className="font-bold text-gray-900">{winningQuote.estimatedDeliveryDays || 7} Days</div>
                        </div>
                        {winningQuote.notes && (
                          <div className="col-span-2 sm:col-span-3 text-gray-700 italic border-t border-gray-100 pt-1 mt-1">
                            "{winningQuote.notes}"
                          </div>
                        )}
                      </div>

                      {/* Action Row: View Tax Invoice Button & Tracking Status */}
                      <div className="pt-2 border-t border-emerald-200/80 flex flex-wrap items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => setIsInvoiceOpen(true)}
                          className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <FileText size={14} />
                          <span>View Official Tax Invoice & PO Certificate</span>
                        </button>

                        {canViewTracking ? (
                          <div className="flex items-center gap-2 bg-emerald-100/90 text-emerald-950 px-3 py-1.5 rounded-xl border border-emerald-300 text-xs">
                            <Truck size={14} className="text-emerald-700" />
                            <span>{isSelf ? '🛵 Self-Delivery' : `🚚 ${order.courierName || 'Courier'}`}:</span>
                            <span className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-emerald-200">{trackingNumberDisplay}</span>
                            {trackingLinkDisplay && (
                              <a
                                href={trackingLinkDisplay}
                                target="_blank"
                                rel="noreferrer"
                                className="text-emerald-700 hover:text-emerald-900 font-bold underline flex items-center gap-0.5 ml-1"
                              >
                                Track <ExternalLink size={11} />
                              </a>
                            )}
                          </div>
                        ) : (
                          <div className="text-[11px] text-gray-500 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-200 flex items-center gap-1.5">
                            <Lock size={12} className="text-gray-400" />
                            <span>
                              {isOut ? 'Out for Delivery (Delivery partner pending)' : 'Tracking available once Out for Delivery & partner decided'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }

                return null;
              })()}

              {/* Demanded Line Items Table with Sample Photos & Distinct Seller Price Column */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-xs text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Package size={15} className="text-teal-700" /> Demanded Line Items ({requirementsList.length})
                  </h3>

                  <div className="flex items-center gap-2">
                    {order.overallBudget > 0 && (
                      <span className="font-extrabold text-xs text-emerald-900 bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-300 font-mono">
                        Overall Budget: ₹{Number(order.overallBudget).toLocaleString()}
                      </span>
                    )}
                    <span className="font-extrabold text-xs text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
                      Total Quantity: {totalQtyNum} Units
                    </span>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-teal-800 text-white text-[11px] uppercase tracking-wider font-extrabold">
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3">Category & Title</th>
                        <th className="py-2.5 px-3 text-center">Quantity</th>
                        <th className="py-2.5 px-3 text-center">Sample Photo(s)</th>
                        <th className="py-2.5 px-3 text-right">Customer Budget / Unit</th>
                        <th className="py-2.5 px-3 text-right bg-emerald-700 text-white">
                          {userRole === 'seller' ? 'Your Quoted Price / Unit' : 'Seller Price / Unit'}
                        </th>
                        <th className="py-2.5 px-3 text-center">Detail View</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-xs">
                      {requirementsList.map((item, idx) => {
                        const imagesList = Array.isArray(item.sampleImages) && item.sampleImages.length > 0
                          ? item.sampleImages
                          : (item.sampleImage ? [item.sampleImage] : []);

                        const custBudget = Number(item.budgetPerUnit || item.budgetUnit || 0);
                        const myQuotedPrice = existingSellerQuote?.itemPrices?.find(
                          ip => String(ip.itemId) === String(item._id || item.id || idx) || String(ip.itemName) === String(item.itemName)
                        )?.pricePerUnit;
                        const sellerPrice = userRole === 'admin'
                          ? Number(item.sellerPricePerUnit || item.sellerPrice || 0)
                          : Number(myQuotedPrice || 0);

                        return (
                          <tr
                            key={idx}
                            onClick={() => setSelectedItemForDetail(item)}
                            className={`cursor-pointer transition-colors hover:bg-teal-50/40 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                            title="Click row to view full item specifications & custom details"
                          >
                            <td className="py-3 px-3 font-bold text-gray-500">{idx + 1}</td>
                            <td className="py-3 px-3">
                              <div className="font-bold text-gray-900 flex items-center gap-1.5">
                                {item.itemName}
                                <Eye size={13} className="text-teal-600 opacity-60 hover:opacity-100" />
                              </div>
                              <div className="text-[10px] text-teal-700 font-semibold">{item.category}</div>
                              {item.customizations && (
                                <div className="text-[10px] text-purple-700 font-medium line-clamp-1 mt-0.5">
                                  ✨ {item.customizations}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-3 text-center font-extrabold text-gray-900">{item.quantity} Units</td>
                            <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                              {imagesList.length > 0 ? (
                                <div className="flex items-center justify-center -space-x-2">
                                  {imagesList.slice(0, 3).map((img, iIdx) => (
                                    <div
                                      key={iIdx}
                                      onClick={() => setZoomImage(img)}
                                      className="relative w-9 h-9 rounded-lg overflow-hidden border-2 border-white shadow-2xs cursor-pointer group hover:z-10 hover:scale-110 transition-transform"
                                    >
                                      <img src={img} alt="Sample" className="w-full h-full object-cover" />
                                    </div>
                                  ))}
                                  {imagesList.length > 3 && (
                                    <div
                                      onClick={() => setSelectedItemForDetail(item)}
                                      className="w-7 h-7 rounded-lg bg-teal-800 text-white font-bold text-[10px] flex items-center justify-center border border-white cursor-pointer"
                                    >
                                      +{imagesList.length - 3}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-400 text-[10px]">None</span>
                              )}
                            </td>

                            <td className="py-3 px-3 text-right font-extrabold text-gray-800">
                              {custBudget > 0 ? `₹${custBudget.toLocaleString()}` : 'N/A'}
                            </td>

                            {/* Seller Price Column - Distinct Emerald Highlighted */}
                            <td className="py-3 px-3 text-right font-black bg-emerald-50/70 border-l border-r border-emerald-100 text-emerald-900">
                              {sellerPrice > 0 ? (
                                <span className="px-2 py-1 rounded-md bg-emerald-600 text-white shadow-2xs font-mono">
                                  ₹{sellerPrice.toLocaleString()}
                                </span>
                              ) : (
                                <span className="text-emerald-600/70 text-[11px] font-semibold italic">Not Quoted</span>
                              )}
                            </td>

                            <td className="py-3 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => setSelectedItemForDetail(item)}
                                className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 font-extrabold text-[11px] rounded-lg border border-teal-200 transition-all cursor-pointer"
                              >
                                View Detail
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Customization & Budget Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                <div>
                  <span className="text-gray-400 font-semibold text-[11px] uppercase block">Logo Embroidery / Monogram</span>
                  <div className="font-bold text-gray-900 mt-0.5">
                    {order.logoEmbroideryRequired ? 'Yes (Custom Crest Included)' : 'No (Plain Standard)'}
                  </div>
                </div>

                <div>
                  <span className="text-gray-400 font-semibold text-[11px] uppercase block">Target Required Delivery</span>
                  <div className="font-bold text-gray-900 mt-0.5">
                    {order.targetDeliveryDate || 'Flexible / Urgent'}
                  </div>
                </div>

                <div>
                  <span className="text-gray-400 font-semibold text-[11px] uppercase block">Quotations Expected By</span>
                  <div className="font-bold text-gray-900 mt-0.5 flex flex-col gap-0.5">
                    <span>{order.expectedQuotationDate ? new Date(order.expectedQuotationDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Flexible'}</span>
                    {order.expectedQuotationDate && (() => {
                      const target = new Date(order.expectedQuotationDate);
                      if (isNaN(target.getTime())) return null;
                      const now = new Date();
                      const targetMid = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
                      const nowMid = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
                      const diffDays = Math.round((targetMid - nowMid) / (1000 * 60 * 60 * 24));
                      const isExpired = diffDays < 0;
                      const isUrgent = diffDays >= 0 && diffDays <= 2;
                      const text = diffDays > 1 ? `${diffDays} days left` : diffDays === 1 ? '1 day left' : diffDays === 0 ? 'Ends today' : `Ended (${Math.abs(diffDays)}d ago)`;

                      return (
                        <span className={`w-fit text-[10px] font-black px-2 py-0.5 rounded-full border ${
                          isExpired ? 'bg-red-100 text-red-700 border-red-200' : isUrgent ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        }`}>
                          {text}
                        </span>
                      );
                    })()}
                  </div>
                </div>

                <div>
                  <span className="text-gray-400 font-semibold text-[11px] uppercase block">Overall Calculated Budget</span>
                  <div className="font-extrabold text-emerald-800 text-sm mt-0.5 font-mono">
                    {order.overallBudget > 0 ? `₹${Number(order.overallBudget).toLocaleString()}` : (targetBudgetNum > 0 ? `₹${targetBudgetNum.toLocaleString()}` : 'Not Specified')}
                  </div>
                </div>

                {order.additionalNotes && (
                  <div className="sm:col-span-2 lg:col-span-4 pt-2 border-t border-gray-200">
                    <span className="text-gray-400 font-semibold text-[11px] uppercase block mb-1">Additional Tender Notes</span>
                    <p className="text-gray-800 bg-white p-3 rounded-xl border border-gray-200 leading-relaxed">{order.additionalNotes}</p>
                  </div>
                )}
              </div>

              {/* Mobilization Advance Payment & Financial Guarantee Card */}
              <div className="bg-linear-to-r from-emerald-50 via-teal-50/60 to-cyan-50/40 border border-emerald-200 p-4 sm:p-5 rounded-2xl space-y-3.5 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200/60 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold">
                      <DollarSign size={16} />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xs text-emerald-950 uppercase tracking-wider">
                        Prepayment & Financial Mobilization Terms
                      </h4>
                      <p className="text-[11px] text-emerald-800">
                        Seller quotation specifies upfront advance percentage to mobilize procurement before delivery.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                      order.advancePaymentStatus === 'paid_partially'
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                        : 'bg-amber-100 text-amber-900 border-amber-300'
                    }`}>
                      {order.advancePaymentStatus === 'paid_partially'
                        ? `Paid: ₹${Number(order.advancePaidAmount || 0).toLocaleString()}`
                        : 'Advance Status: Awaiting Payment'}
                    </span>

                    <button
                      type="button"
                      onClick={() => setIsReceiptModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer"
                    >
                      <FileText size={13} />
                      <span>Advance Receipt</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">

                  {/* Seller Counter Demand / Prepayment */}
                  <div className="bg-white/80 p-3 rounded-xl border border-emerald-100 space-y-1">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Seller Prepayment / Advance</span>
                    <div className="font-extrabold text-sm text-emerald-800">
                      {(order.prepaymentPercentage ?? order.sellerAdvancePercentage ?? existingSellerQuote?.prepaymentPercentage ?? existingSellerQuote?.sellerAdvancePercentage) ? `${order.prepaymentPercentage ?? order.sellerAdvancePercentage ?? existingSellerQuote?.prepaymentPercentage ?? existingSellerQuote?.sellerAdvancePercentage}%` : 'Same as Buyer'}
                      {(order.prepaymentAmount || order.sellerAdvanceAmount || existingSellerQuote?.prepaymentAmount || existingSellerQuote?.sellerAdvanceAmount) ? ` (₹${Number(order.prepaymentAmount || order.sellerAdvanceAmount || existingSellerQuote?.prepaymentAmount || existingSellerQuote?.sellerAdvanceAmount).toLocaleString()})` : ''}
                    </div>
                    {(order.prepaymentTerms || order.sellerAdvanceTerms || existingSellerQuote?.prepaymentTerms || existingSellerQuote?.sellerAdvanceTerms) && (
                      <p className="text-[11px] text-emerald-900 font-medium line-clamp-2 mt-0.5">"{order.prepaymentTerms || order.sellerAdvanceTerms || existingSellerQuote?.prepaymentTerms || existingSellerQuote?.sellerAdvanceTerms}"</p>
                    )}
                  </div>

                  {/* Balance on Delivery */}
                  <div className="bg-white/80 p-3 rounded-xl border border-emerald-100 space-y-1">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Est. Balance on Delivery</span>
                    <div className="font-extrabold text-sm text-gray-900">
                      ₹{Math.max(0, (order.overallBudget || targetBudgetNum || 0) - (Number(order.advancePaidAmount || order.sellerAdvanceAmount || order.buyerAdvanceAmount || 0))).toLocaleString()}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5">Payable upon school delivery & gate verification</p>
                  </div>
                </div>
              </div>

              {/* Current Distribution Mode Info Banner */}
              <div className="bg-blue-50/70 border border-blue-200 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider">Distribution Status</span>
                  <div className="font-extrabold text-blue-950 text-sm mt-0.5 flex items-center gap-2">
                    {order.assignmentMode === 'direct' && <><UserCheck size={16} className="text-blue-600" /> Direct Seller Assignment</>}
                    {order.assignmentMode === 'selected' && <><Users size={16} className="text-purple-600" /> Selected Sellers Invitation ({order.invitedSellerIds?.length || 0})</>}
                    {order.assignmentMode === 'broadcast' && <><Globe size={16} className="text-emerald-600" /> Marketplace Global Broadcast</>}
                    {order.assignmentMode === 'admin_direct' && <><ShieldCheck size={16} className="text-teal-700" /> BookVardi Direct Fulfillment</>}
                    {(!order.assignmentMode || order.assignmentMode === 'unassigned') && (
                      <span className="text-amber-800 flex items-center gap-1">
                        <AlertCircle size={15} /> Unassigned (Only Admin can view until distributed)
                      </span>
                    )}
                  </div>
                </div>

                {userRole === 'admin' && (
                  <button
                    onClick={() => setModalSubTab('distribution')}
                    className="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-colors"
                  >
                    Change Distribution Mode
                  </button>
                )}
              </div>

            </div>
          )}

          {/* TAB 2: ADMIN DISTRIBUTION CONTROLS */}
          {modalSubTab === 'distribution' && userRole === 'admin' && (
            <div className="space-y-5 bg-white p-5 rounded-2xl border border-gray-200">
              <div>
                <h3 className="font-extrabold text-base text-gray-900">Select Order Distribution Mode</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Decide how this school bulk order inquiry is routed to sellers across BookVardi marketplace.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 p-1.5 bg-gray-100 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setDistributeMode('direct')}
                  className={`p-3 rounded-xl font-bold text-xs flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    distributeMode === 'direct' ? 'bg-white text-blue-900 shadow-xs border border-blue-200' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <UserCheck size={18} />
                  <span>1. Direct Seller</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDistributeMode('selected')}
                  className={`p-3 rounded-xl font-bold text-xs flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    distributeMode === 'selected' ? 'bg-white text-purple-900 shadow-xs border border-purple-200' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Users size={18} />
                  <span>2. Selected Sellers</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDistributeMode('broadcast')}
                  className={`p-3 rounded-xl font-bold text-xs flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    distributeMode === 'broadcast' ? 'bg-white text-emerald-900 shadow-xs border border-emerald-200' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Globe size={18} />
                  <span>3. Global Broadcast</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDistributeMode('admin_direct')}
                  className={`p-3 rounded-xl font-bold text-xs flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    distributeMode === 'admin_direct' ? 'bg-white text-teal-900 shadow-xs border border-teal-200' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <ShieldCheck size={18} />
                  <span>4. Admin Direct</span>
                </button>
              </div>

              <form onSubmit={handleAdminDistributionSubmit} className="space-y-4 pt-2">
                {distributeMode === 'direct' && (
                  <div className="space-y-2 bg-blue-50/60 p-4 rounded-xl border border-blue-100">
                    <label className="font-bold text-blue-900 block">Choose Approved Specific Seller *</label>
                    <select
                      value={selectedSingleSeller}
                      onChange={(e) => setSelectedSingleSeller(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white font-medium text-xs focus:outline-none focus:border-teal-600"
                      required
                    >
                      <option value="">-- Select Approved Seller --</option>
                      {verifiedSellers.map(s => (
                        <option key={s.id || s._id} value={s.id || s._id}>
                          {s.storeName || s.businessName || s.name} ({s.ownerName || s.name}) - {s.city || 'Delhi'}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {distributeMode === 'selected' && (
                  <div className="space-y-3 bg-purple-50/60 p-4 rounded-xl border border-purple-100">
                    <div className="flex items-center justify-between text-purple-900 font-bold">
                      <span>Select Sellers to Invite for RFQ Quotations:</span>
                      <span className="font-mono bg-purple-100 px-2 py-0.5 rounded text-purple-950">
                        {selectedMultipleSellers.length} Selected
                      </span>
                    </div>

                    <input
                      type="text"
                      placeholder="Search seller by name or city..."
                      value={sellerSearchQuery}
                      onChange={(e) => setSellerSearchQuery(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs focus:outline-none"
                    />

                    <div className="max-h-48 overflow-y-auto space-y-1.5 border border-gray-200 bg-white rounded-xl p-2">
                      {filteredSellersForModal.length === 0 ? (
                        <div className="text-center py-4 text-gray-400">No matching sellers found.</div>
                      ) : (
                        filteredSellersForModal.map(seller => {
                          const sId = seller.id || seller._id;
                          const isChecked = selectedMultipleSellers.includes(sId);
                          return (
                            <label
                              key={sId}
                              onClick={() => toggleSellerSelect(sId)}
                              className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                                isChecked ? 'bg-purple-50 border-purple-300 text-purple-900 font-bold' : 'bg-white border-gray-100 hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <input type="checkbox" checked={isChecked} onChange={() => {}} className="accent-purple-700" />
                                <div>
                                  <div>{seller.storeName || seller.businessName || seller.name}</div>
                                  <div className="text-[10px] text-gray-400">{seller.ownerName} • {seller.city}</div>
                                </div>
                              </div>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {distributeMode === 'broadcast' && (
                  <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 text-emerald-900 text-xs">
                    <strong className="block mb-1">Global Marketplace Broadcast Mode</strong>
                    This RFQ will be visible to all verified sellers in the BookVardi portal. Any partner vendor can submit counter-quotations.
                  </div>
                )}

                {distributeMode === 'admin_direct' && (
                  <div className="bg-teal-50 p-4 rounded-xl border border-teal-200 text-teal-950 text-xs">
                    <strong className="block mb-1">BookVardi Direct HQ Fulfillment</strong>
                    Admin handles order sourcing and supply directly. Order status updated to assigned.
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 bg-teal-800 hover:bg-teal-900 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Save & Broadcast Distribution Settings
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: SUBMITTED VENDOR QUOTATIONS */}
          {modalSubTab === 'quotes' && (() => {
            const visibleQuotations = userRole === 'admin'
              ? (order.quotations || [])
              : (Array.isArray(order.quotations)
                  ? order.quotations.filter(q => isMyQuote(q) || (currentSellerId && String(q.sellerId) === String(currentSellerId)))
                  : []);

            return (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-sm text-purple-950 flex items-center gap-1.5">
                      <Sparkles size={16} className="text-purple-600" />
                      {userRole === 'seller' ? 'My Submitted Proposal Quotation' : 'Submitted Seller Quotations & Counter Proposals'}
                    </h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {userRole === 'seller'
                        ? 'Your confidential quotation and direct buyer negotiation terms. Competing vendor pitches are strictly secret.'
                        : 'Inspect descriptive item-by-item prices, customer budget comparison, and volume discount terms.'}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500 font-bold bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
                    Target Budget: ₹{targetBudgetNum ? targetBudgetNum.toLocaleString() : 'N/A'}
                  </span>
                </div>

                {userRole === 'seller' && (
                  <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-teal-950 text-xs flex items-center gap-2">
                    <ShieldCheck size={16} className="text-teal-700 shrink-0" />
                    <span>
                      <strong>Strict Confidentiality:</strong> Your quotation pitch is private and secret. Competing sellers cannot see your prices or terms. Only you, the institution buyer, and BookVardi Admin can view your pitch.
                    </span>
                  </div>
                )}

                {(!visibleQuotations || visibleQuotations.length === 0) ? (
                  <div className="p-10 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-300 text-gray-400 space-y-2">
                    <Lock size={36} className="mx-auto mb-2 text-teal-600/70" />
                    <div className="font-bold text-gray-800 text-sm">
                      {userRole === 'seller' ? 'No Pitch Submitted by Your Store Yet' : 'No Seller Quotations Submitted Yet'}
                    </div>
                    <p className="text-xs text-gray-500 max-w-md mx-auto">
                      {userRole === 'seller'
                        ? 'All vendor pitches are confidential. Submit your proposal using the pitch quotation form.'
                        : 'Once vendors submit proposals, counter prices, itemized rates, and delivery terms will appear here.'}
                    </p>
                    {userRole === 'seller' && (
                      <button
                        type="button"
                        onClick={() => setModalSubTab('submit_quote')}
                        className="mt-3 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <Send size={13} />
                        <span>Submit Proposal Quotation</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {visibleQuotations.map(quote => {
                    const qId = quote._id || quote.id;
                    const isApproved = quote.status === 'approved' || String(order.acceptedQuoteId) === String(qId);
                    const isCurrentSellerQuote = isMyQuote(quote) || (currentSellerId && String(quote.sellerId) === String(currentSellerId));
                    const hasItemPrices = Array.isArray(quote.itemPrices) && quote.itemPrices.length > 0;

                    return (
                      <div
                        key={qId}
                        className={`p-4 sm:p-5 rounded-2xl border transition-all space-y-3.5 ${
                          isApproved ? 'bg-emerald-50/80 border-emerald-300 shadow-xs' : 'bg-white border-gray-200 hover:border-purple-300'
                        }`}
                      >
                        {/* Header Row: Vendor Info & Total Quote */}
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 pb-2 border-b border-gray-100">
                          <div>
                            <div className="font-extrabold text-sm text-gray-900 flex items-center gap-2">
                              <span>{quote.sellerStoreName || quote.sellerName}</span>
                              {isApproved && (
                                <span className="bg-emerald-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                                  Winning Proposal
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 flex flex-wrap items-center gap-3 mt-0.5">
                              {quote.sellerPhone && <span>Phone: <strong className="text-gray-700">{quote.sellerPhone}</strong></span>}
                              {quote.sellerCity && <span>City: <strong className="text-gray-700">{quote.sellerCity}</strong></span>}
                              <span>Lead Time: <strong className="text-gray-700">{quote.estimatedDeliveryDays || 7} Days</strong></span>
                            </div>

                            {/* Negotiation Version & Stage Pill */}
                            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                              <button
                                type="button"
                                onClick={() => toggleTimelineForQuote(qId, quote.currentVersion || 1)}
                                className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full transition-all cursor-pointer flex items-center gap-1 shadow-2xs ${
                                  expandedTimelineQuoteId === qId
                                    ? 'bg-teal-700 text-white ring-2 ring-teal-500'
                                    : 'bg-slate-100 hover:bg-teal-50 text-slate-800 hover:text-teal-900 border border-slate-300'
                                }`}
                                title="Click to view full negotiation timeline and version history"
                              >
                                <Clock size={11} className={expandedTimelineQuoteId === qId ? 'text-white' : 'text-teal-700'} />
                                <span>Version {quote.currentVersion || 1}</span>
                                <span className="text-[9px] opacity-80">{expandedTimelineQuoteId === qId ? '▲ Hide' : '▼ Timeline'}</span>
                              </button>
                              {quote.negotiationStage === 'buyer_countered' && (
                                <button
                                  type="button"
                                  onClick={() => toggleTimelineForQuote(qId, quote.currentVersion || 2)}
                                  className="bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-[10px] font-black uppercase px-2.5 py-1 rounded-full flex items-center gap-1 cursor-pointer transition-all"
                                  title="Click to view buyer counter-demand timeline"
                                >
                                  <Clock size={10} /> 2nd Version Counter-Demand Sent
                                </button>
                              )}
                              {quote.negotiationStage === 'seller_accepted_counter' && (
                                <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <CheckCircle2 size={10} /> Vendor Accepted Counter-Demand
                                </span>
                              )}
                              {quote.negotiationStage === 'revised_by_seller' && (
                                <span className="bg-purple-100 text-purple-900 border border-purple-300 text-[10px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <Sparkles size={10} /> Revised Quotation Pitch
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="sm:text-right bg-teal-50 sm:bg-transparent p-2 sm:p-0 rounded-xl">
                            <div className="text-[10px] text-gray-400 font-semibold uppercase">Total Pitched Amount</div>
                            <div className="font-extrabold text-lg text-teal-800 font-mono">
                              ₹{Number(quote.quoteAmount).toLocaleString()}
                            </div>
                            <div className="text-[10px] text-teal-700 font-medium">
                              ~₹{quote.unitPrice || (totalQtyNum > 0 ? Math.round(quote.quoteAmount / totalQtyNum) : 0)} / unit avg
                            </div>
                          </div>
                        </div>

                        {/* Active Buyer Counter-Demand Info Card */}
                        {quote.latestBuyerCounter && (Number(quote.latestBuyerCounter.targetBudget) > 0 || quote.latestBuyerCounter.notes) && (
                          <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-3 text-xs space-y-1">
                            <div className="flex items-center justify-between text-[11px] font-extrabold text-purple-900">
                              <span className="flex items-center gap-1.5">
                                <Sparkles size={13} className="text-purple-600" /> Buyer's Counter-Demand Terms
                              </span>
                              {quote.latestBuyerCounter.counteredAt && (
                                <span className="text-[10px] text-purple-600 font-medium">
                                  Received {new Date(quote.latestBuyerCounter.counteredAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px]">
                              {Number(quote.latestBuyerCounter.targetBudget) > 0 && (
                                <div>
                                  <span className="text-gray-400 block text-[10px] font-sans font-medium">Target Budget:</span>
                                  <strong className="text-purple-900 font-extrabold">₹{Number(quote.latestBuyerCounter.targetBudget).toLocaleString()}</strong>
                                </div>
                              )}
                              {(Number(quote.latestBuyerCounter.totalQuantity) > 0 || totalQtyNum > 0) && (
                                <div>
                                  <span className="text-gray-400 block text-[10px] font-sans font-medium">Demanded Quantity:</span>
                                  <strong className="text-purple-900 font-extrabold">{Number(quote.latestBuyerCounter.totalQuantity || totalQtyNum)} Units</strong>
                                </div>
                              )}
                              {(Number(quote.latestBuyerCounter.unitPrice) > 0 || (Number(quote.latestBuyerCounter.targetBudget) > 0 && totalQtyNum > 0)) && (
                                <div>
                                  <span className="text-gray-400 block text-[10px] font-sans font-medium">Demanded Unit Rate:</span>
                                  <strong className="text-purple-900 font-extrabold">
                                    ₹{Number(quote.latestBuyerCounter.unitPrice || Math.round(Number(quote.latestBuyerCounter.targetBudget) / (Number(quote.latestBuyerCounter.totalQuantity) || totalQtyNum || 1))).toLocaleString()} / unit
                                  </strong>
                                </div>
                              )}
                              {Number(quote.latestBuyerCounter.requestedDeliveryDays) > 0 && (
                                <div>
                                  <span className="text-gray-400 block text-[10px] font-sans font-medium">Requested Lead Time:</span>
                                  <strong className="text-purple-900 font-extrabold">{quote.latestBuyerCounter.requestedDeliveryDays} Days</strong>
                                </div>
                              )}
                              {Number(quote.latestBuyerCounter.proposedAdvancePercentage) > 0 && (
                                <div>
                                  <span className="text-gray-400 block text-[10px] font-sans font-medium">Proposed Advance:</span>
                                  <strong className="text-purple-900 font-extrabold">{quote.latestBuyerCounter.proposedAdvancePercentage}% Advance</strong>
                                </div>
                              )}
                            </div>
                            {Array.isArray(quote.latestBuyerCounter.itemDemands) && quote.latestBuyerCounter.itemDemands.length > 0 && (
                              <div className="pt-1.5 border-t border-purple-100">
                                <span className="text-[10px] text-gray-500 font-semibold block mb-1">Buyer Demanded Line Items & Quantities:</span>
                                <div className="flex flex-wrap gap-1.5">
                                  {quote.latestBuyerCounter.itemDemands.map((dm, dmIdx) => (
                                    <span key={dm.itemId || dmIdx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-purple-200 text-[10px] text-purple-900 font-bold">
                                      <span>{dm.itemName}:</span>
                                      <span className="text-purple-700">{dm.quantity} units</span>
                                      {dm.targetUnitPrice > 0 && <span className="text-gray-400">@ ₹{dm.targetUnitPrice}</span>}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {quote.latestBuyerCounter.notes && (
                              <p className="text-[11px] text-purple-950 italic pt-1 border-t border-purple-100">
                                "{quote.latestBuyerCounter.notes}"
                              </p>
                            )}
                          </div>
                        )}

                        {/* Raised Prepayment & Extended Lead Time Warning Chips */}
                        {(() => {
                          const latestRound = Array.isArray(quote.negotiationHistory) && quote.negotiationHistory.length > 0 ? quote.negotiationHistory[quote.negotiationHistory.length - 1] : null;
                          if (!latestRound || (!latestRound.prepaymentRaised && !latestRound.deliveryDaysRaised)) return null;

                          return (
                            <div className="flex flex-wrap items-center gap-2">
                              {latestRound.prepaymentRaised && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-300 text-[11px] font-bold">
                                  ⚠️ Prepayment Raised by Vendor in Version {quote.currentVersion || 1}
                                </span>
                              )}
                              {latestRound.deliveryDaysRaised && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-900 border border-blue-300 text-[11px] font-bold">
                                  ⏳ Delivery Lead Time Extended by Vendor ({quote.estimatedDeliveryDays} Days)
                                </span>
                              )}
                            </div>
                          );
                        })()}

                        {/* Descriptive Item Breakdown Table */}
                        {hasItemPrices ? (
                          <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                            <div className="bg-gray-50 px-3 py-1.5 border-b border-gray-200 flex items-center justify-between text-[11px] font-extrabold text-gray-700">
                              <span className="flex items-center gap-1.5">
                                <Package size={13} className="text-teal-700" /> Itemized Pricing & Scale Breakdown
                              </span>
                              <span className="text-[10px] text-gray-400 font-medium">{quote.itemPrices.length} Items</span>
                            </div>
                            <div className="overflow-x-auto">
                              <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                  <tr className="bg-gray-50/50 text-[10px] uppercase font-bold text-gray-500 border-b border-gray-200">
                                    <th className="py-2 px-3">Product Demand</th>
                                    <th className="py-2 px-2 text-center">Qty</th>
                                    <th className="py-2 px-2 text-right">User Budget/Unit</th>
                                    <th className="py-2 px-2 text-right bg-emerald-50 text-emerald-950">Seller Price/Unit</th>
                                    <th className="py-2 px-3 text-right">Line Total</th>
                                    <th className="py-2 px-3">Scale / Volume Note</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                  {quote.itemPrices.map((item, ipIdx) => {
                                    const custBudget = Number(item.customerBudget || 0);
                                    const sellerPrice = Number(item.pricePerUnit || 0);
                                    const lineTotal = Number(item.totalPrice) || ((Number(item.quantity) || 1) * sellerPrice);

                                    return (
                                      <tr key={ipIdx} className="hover:bg-teal-50/20">
                                        <td className="py-2 px-3">
                                          <div className="font-bold text-gray-900 line-clamp-1">{item.itemName}</div>
                                          <div className="text-[10px] text-gray-400">{item.category}</div>
                                        </td>
                                        <td className="py-2 px-2 text-center font-bold text-gray-700">{item.quantity}</td>
                                        <td className="py-2 px-2 text-right font-medium text-gray-600">
                                          {custBudget > 0 ? `₹${custBudget.toLocaleString()}` : 'N/A'}
                                        </td>
                                        <td className="py-2 px-2 text-right font-black bg-emerald-50/70 text-emerald-900 font-mono">
                                          ₹{sellerPrice.toLocaleString()}
                                        </td>
                                        <td className="py-2 px-3 text-right font-black text-gray-900 font-mono">
                                          ₹{lineTotal.toLocaleString()}
                                        </td>
                                        <td className="py-2 px-3">
                                          {item.discountTierNote ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-bold">
                                              💡 {item.discountTierNote}
                                            </span>
                                          ) : (
                                            <span className="text-gray-400 text-[10px] italic">Standard batch rate</span>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ) : null}

                        {/* Overall Volume Discount Note Banner */}
                        {quote.volumeDiscountNote && (
                          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2 text-xs text-amber-950">
                            <Sparkles size={16} className="text-amber-600 shrink-0 mt-0.5" />
                            <div>
                              <div className="font-extrabold text-[11px] uppercase tracking-wider text-amber-900">
                                Volume Incentive & Scale Discount Note
                              </div>
                              <div className="font-medium mt-0.5 text-amber-950">
                                {quote.volumeDiscountNote}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Notes & Delivery Details */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                          <div>
                            <span className="text-gray-400 font-medium">Est. Delivery Lead Time:</span>
                            <span className="font-bold text-gray-800 ml-1">{quote.estimatedDeliveryDays || 7} Days</span>
                          </div>
                          <div>
                            <span className="text-gray-400 font-medium">Submitted On:</span>
                            <span className="font-bold text-gray-800 ml-1">
                              {new Date(quote.submittedAt || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                          {quote.notes && (
                            <div className="sm:col-span-2 text-gray-700 italic border-t border-gray-200/60 pt-1 mt-0.5">
                              "{quote.notes}"
                            </div>
                          )}
                        </div>

                        {/* Prepayment / Upfront Advance Demanded by Seller */}
                        {(() => {
                          const advPct = Number(quote.prepaymentPercentage ?? quote.sellerAdvancePercentage ?? 0);
                          const advAmt = Number(quote.prepaymentAmount ?? quote.sellerAdvanceAmount ?? 0) || (advPct > 0 ? Math.round((Number(quote.quoteAmount) * advPct) / 100) : 0);
                          const advTerms = quote.prepaymentTerms || quote.sellerAdvanceTerms || '';
                          const remainingBal = Math.max(0, Number(quote.quoteAmount) - advAmt);

                          if (advPct <= 0 && advAmt <= 0 && !advTerms) return null;

                          return (
                            <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                              <div className="space-y-0.5">
                                <span className="text-[10px] font-extrabold text-emerald-900 uppercase tracking-wider flex items-center gap-1">
                                  <DollarSign size={13} className="text-emerald-700" /> Prepayment Required by Seller
                                </span>
                                <div className="text-emerald-950 font-bold">
                                  Upfront Prepayment: <strong className="font-extrabold text-emerald-900 font-mono text-sm">₹{advAmt.toLocaleString()}</strong>
                                  {advPct > 0 ? ` (${advPct}% prepayment)` : ''}
                                </div>
                                {advTerms && (
                                  <p className="text-[11px] text-emerald-800 italic">
                                    Terms: "{advTerms}"
                                  </p>
                                )}
                              </div>

                              <div className="sm:text-right bg-white px-3 py-1.5 rounded-lg border border-emerald-100 shadow-2xs">
                                <span className="text-[10px] text-gray-500 uppercase font-semibold block">Balance on Delivery</span>
                                <span className="font-mono font-bold text-gray-800">₹{remainingBal.toLocaleString()}</span>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Interactive Extended Negotiation Timeline Div */}
                        {expandedTimelineQuoteId === qId ? (
                          <div className="pt-2 animate-in fade-in duration-200">
                            <NegotiationTimelineDiv
                              quotation={quote}
                              order={order}
                              userRole={userRole}
                              initialSelectedVersion={selectedTimelineVersion || quote.currentVersion || 1}
                              onClose={() => toggleTimelineForQuote(qId)}
                              onAcceptCounterDemand={onAcceptCounterDemand ? () => onAcceptCounterDemand(order.id || order._id, quote._id || quote.id) : null}
                              onOpenPitchRevise={() => setModalSubTab('submit_quote')}
                              onOpenComparisonModal={() => handleOpenVersionComparison(quote)}
                            />
                          </div>
                        ) : (
                          <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50/50">
                            <button
                              type="button"
                              onClick={() => toggleTimelineForQuote(qId, quote.currentVersion || 1)}
                              className="w-full px-3.5 py-2 flex items-center justify-between text-xs font-bold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                            >
                              <span className="flex items-center gap-1.5">
                                <Clock size={13} className="text-teal-700" />
                                <span>Negotiation Timeline & Version History</span>
                                {(quote.currentVersion > 1 || (quote.negotiationHistory && quote.negotiationHistory.length > 0)) && (
                                  <span className="text-[10px] bg-teal-100 text-teal-800 font-extrabold px-2 py-0.5 rounded-full">
                                    v{quote.currentVersion || 1} ({quote.negotiationHistory?.length || 1} rounds)
                                  </span>
                                )}
                              </span>
                              <span className="text-[11px] text-teal-700 font-extrabold">
                                View Interactive Timeline ▼
                              </span>
                            </button>
                          </div>
                        )}

                        {/* Footer Status & Actions */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-gray-100">
                          {isApproved ? (
                            <span className="text-xs font-extrabold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full flex items-center gap-1 border border-emerald-200">
                              <CheckCircle2 size={14} /> Approved & Winning Seller Quote
                            </span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-gray-500 font-semibold">
                                Stage: <strong className="text-gray-800 capitalize">{(quote.negotiationStage || quote.status || 'Active').replace(/_/g, ' ')}</strong>
                              </span>
                            </div>
                          )}

                          {userRole === 'admin' && !isApproved && (
                            <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200">
                              Awaiting Buyer Decision / Review Only
                            </span>
                          )}

                          <div className="flex items-center gap-2 ml-auto">
                            {(quote.currentVersion > 1 || (quote.negotiationHistory && quote.negotiationHistory.length > 0)) && (
                              <button
                                type="button"
                                onClick={() => handleOpenVersionComparison(quote)}
                                className="px-3 py-1 bg-white hover:bg-purple-50 text-purple-700 border border-purple-200 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                              >
                                <SlidersHorizontal size={12} />
                                <span>Compare Versions</span>
                              </button>
                            )}

                            {userRole === 'seller' && !isApproved && isCurrentSellerQuote && (
                              <>
                                {quote.negotiationStage === 'buyer_countered' ? (
                                  <button
                                    type="button"
                                    onClick={() => setModalSubTab('submit_quote')}
                                    className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                                  >
                                    <Sparkles size={13} />
                                    <span>Review & Revise Pitch</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setModalSubTab('submit_quote')}
                                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                                  >
                                    Edit Quotation
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            );
          })()}

          {/* TAB 4: SELLER DESCRIPTIVE QUOTATION PITCH BUILDER */}
          {modalSubTab === 'submit_quote' && userRole === 'seller' && (
            <div className="bg-white p-5 rounded-2xl border border-emerald-300 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                <div>
                  <h3 className="font-extrabold text-base text-gray-900 flex items-center gap-2">
                    <Sparkles size={18} className="text-emerald-600" />
                    {existingSellerQuote ? 'Update / Revise Quotation Pitch' : 'Pitch Proposal Quotation'}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Set your offer price/piece on each demanded product, specify volume discount notes, and adjust your upfront advance and delivery timeline.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-gray-400 font-semibold block">Total Requirement</span>
                  <span className="text-sm font-extrabold text-teal-800 font-mono">{totalQtyNum} Units Demanded</span>
                </div>
              </div>

              {/* Amber Alert Banner for Buyer 2nd Version Counter-Demand */}
              {existingSellerQuote?.negotiationStage === 'buyer_countered' && existingSellerQuote.latestBuyerCounter && (
                <div className="p-4 bg-linear-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl space-y-3 shadow-xs animate-in fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/80 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                        <Clock size={18} />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-amber-950">
                          ⚠️ Buyer Sent 2nd Version Counter-Demand (Version {existingSellerQuote.currentVersion || 2})
                        </h4>
                        <p className="text-[11px] text-amber-800">
                          The school/buyer has reviewed your quotation and proposed updated terms below.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {onAcceptCounterDemand && (
                        <button
                          type="button"
                          onClick={() => onAcceptCounterDemand(order.id || order._id, existingSellerQuote._id || existingSellerQuote.id)}
                          className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 font-display"
                        >
                          <CheckCircle2 size={14} />
                          <span>Accept Buyer Demand Directly</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Counter Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs font-mono">
                    {Number(existingSellerQuote.latestBuyerCounter.targetBudget) > 0 && (
                      <div className="bg-white/80 p-2.5 rounded-xl border border-amber-200">
                        <span className="text-[10px] text-amber-800 font-sans font-bold block uppercase">Buyer Target Budget</span>
                        <span className="text-base font-extrabold text-amber-950">
                          ₹{Number(existingSellerQuote.latestBuyerCounter.targetBudget).toLocaleString()}
                        </span>
                        <span className="text-[10px] text-gray-500 font-sans block mt-0.5">
                          Pitch: ₹{Number(existingSellerQuote.quoteAmount).toLocaleString()}
                        </span>
                      </div>
                    )}

                    <div className="bg-white/80 p-2.5 rounded-xl border border-amber-200">
                      <span className="text-[10px] text-amber-800 font-sans font-bold block uppercase">Demanded Quantity</span>
                      <span className="text-base font-extrabold text-amber-950">
                        {existingSellerQuote.latestBuyerCounter.totalQuantity || totalQtyNum} Units
                      </span>
                      <span className="text-[10px] text-gray-500 font-sans block mt-0.5">
                        Order requirement
                      </span>
                    </div>

                    <div className="bg-white/80 p-2.5 rounded-xl border border-amber-200">
                      <span className="text-[10px] text-amber-800 font-sans font-bold block uppercase">Demanded Unit Rate</span>
                      <span className="text-base font-extrabold text-amber-950">
                        ₹{Number(existingSellerQuote.latestBuyerCounter.unitPrice || Math.round(Number(existingSellerQuote.latestBuyerCounter.targetBudget) / (Number(existingSellerQuote.latestBuyerCounter.totalQuantity) || totalQtyNum || 1))).toLocaleString()} / u
                      </span>
                      <span className="text-[10px] text-gray-500 font-sans block mt-0.5">
                        Target average
                      </span>
                    </div>

                    {Number(existingSellerQuote.latestBuyerCounter.requestedDeliveryDays) > 0 && (
                      <div className="bg-white/80 p-2.5 rounded-xl border border-amber-200">
                        <span className="text-[10px] text-amber-800 font-sans font-bold block uppercase">Requested Lead Time</span>
                        <span className="text-base font-extrabold text-amber-950">
                          {existingSellerQuote.latestBuyerCounter.requestedDeliveryDays} Days
                        </span>
                        <span className="text-[10px] text-gray-500 font-sans block mt-0.5">
                          Pitch: {existingSellerQuote.estimatedDeliveryDays || 7} days
                        </span>
                      </div>
                    )}

                    {Number(existingSellerQuote.latestBuyerCounter.proposedAdvancePercentage) > 0 && (
                      <div className="bg-white/80 p-2.5 rounded-xl border border-amber-200">
                        <span className="text-[10px] text-amber-800 font-sans font-bold block uppercase">Proposed Prepayment</span>
                        <span className="text-base font-extrabold text-amber-950">
                          {existingSellerQuote.latestBuyerCounter.proposedAdvancePercentage}% Advance
                        </span>
                        <span className="text-[10px] text-gray-500 font-sans block mt-0.5">
                          ~₹{Math.round((Number(existingSellerQuote.latestBuyerCounter.targetBudget || existingSellerQuote.quoteAmount) * Number(existingSellerQuote.latestBuyerCounter.proposedAdvancePercentage)) / 100).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {Array.isArray(existingSellerQuote.latestBuyerCounter.itemDemands) && existingSellerQuote.latestBuyerCounter.itemDemands.length > 0 && (
                    <div className="p-2.5 bg-white/80 rounded-xl border border-amber-200 space-y-1">
                      <span className="text-[10px] text-amber-900 font-bold block uppercase tracking-wide">
                        Buyer Requested Items & Quantities:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {existingSellerQuote.latestBuyerCounter.itemDemands.map((dm, dmIdx) => (
                          <span key={dm.itemId || dmIdx} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-xs font-bold text-amber-950 font-mono">
                            <span>{dm.itemName}:</span>
                            <span className="text-amber-800">{dm.quantity} pcs</span>
                            {dm.targetUnitPrice > 0 && <span className="text-gray-500 font-normal">@ ₹{dm.targetUnitPrice}</span>}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {existingSellerQuote.latestBuyerCounter.notes && (
                    <div className="p-2.5 bg-white/70 rounded-xl border border-amber-200/60 text-xs text-amber-950 italic">
                      <strong>Buyer Message:</strong> "{existingSellerQuote.latestBuyerCounter.notes}"
                    </div>
                  )}

                  <div className="text-[11px] text-amber-900 font-medium">
                    💡 <strong>Not satisfied with buyer's budget?</strong> Adjust prices below, <strong>raise your prepayment requirement</strong> (e.g. to 40% or 50%), and <strong>raise delivery lead time</strong> (e.g. +5 days) to mitigate procurement risk, then click <strong>"Resend Revised Quotation"</strong>.
                  </div>
                </div>
              )}

              <form onSubmit={handleSellerQuoteSubmit} className="space-y-5">
                
                {/* 1. Demand-by-Demand Interactive Pricing & Scale Note Table */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-xs text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Package size={15} className="text-teal-700" />
                      1. Product Demands & Unit Pricing
                    </h4>
                    <span className="text-[11px] text-gray-500 font-medium">
                      Calculates line totals and grand total in real-time
                    </span>
                  </div>

                  <div className="space-y-3">
                    {pitchItems.map((item, idx) => {
                      const custBudget = Number(item.customerBudget || 0);
                      const unitPriceVal = Number(item.pricePerUnit || 0);
                      const lineTotal = Number(item.totalPrice) || ((Number(item.quantity) || 1) * unitPriceVal);

                      return (
                        <div
                          key={item.itemId || idx}
                          className="p-4 bg-gray-50/70 border border-gray-200 rounded-2xl space-y-3 hover:border-emerald-300 transition-colors"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <div className="font-extrabold text-sm text-gray-900 flex items-center gap-2">
                                <span className="w-5 h-5 rounded-md bg-teal-800 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                                  {idx + 1}
                                </span>
                                <span>{item.itemName}</span>
                              </div>
                              <div className="text-[11px] text-teal-700 font-semibold mt-0.5 ml-7">
                                Category: {item.category} • Demanded Qty: <strong className="text-gray-900 font-bold">{item.quantity} Units</strong>
                              </div>
                            </div>

                            {/* Customer Target Budget Badge */}
                            <div className="flex items-center gap-2 self-start sm:self-auto ml-7 sm:ml-0">
                              <span className="text-[11px] text-gray-500">Customer Budget:</span>
                              <span className="font-bold text-xs text-gray-800 bg-white px-2.5 py-1 rounded-lg border border-gray-200 font-mono">
                                {custBudget > 0 ? `₹${custBudget.toLocaleString()} / unit` : 'Not specified'}
                              </span>
                            </div>
                          </div>

                          {/* Price Input & Line Total Calculation Row */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-gray-200/60">
                            <div className="space-y-1">
                              <label className="text-[11px] font-extrabold text-emerald-900 flex items-center gap-1">
                                <DollarSign size={13} className="text-emerald-600" />
                                Your Offered Price / Piece (₹) *
                              </label>
                              <div className="relative">
                                <span className="absolute left-3 top-2.5 text-gray-400 font-bold text-xs">₹</span>
                                <input
                                  type="number"
                                  min="0"
                                  required
                                  placeholder="e.g. 511"
                                  value={item.pricePerUnit || ''}
                                  onChange={(e) => handleItemPriceChange(idx, e.target.value)}
                                  className="w-full pl-7 pr-3 py-2 rounded-xl border border-emerald-300 bg-white text-xs font-mono font-bold text-gray-900 focus:outline-none focus:border-emerald-600"
                                />
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[11px] font-bold text-gray-500 block">
                                Calculated Line Total ({item.quantity} pcs × ₹{unitPriceVal})
                              </label>
                              <div className="px-3 py-2 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs font-mono font-extrabold text-emerald-950 flex items-center justify-between">
                                <span>Line Total:</span>
                                <span className="text-sm">₹{lineTotal.toLocaleString()}</span>
                              </div>
                            </div>
                          </div>

                          {/* Per-Product Volume Discount / Scale Note Input */}
                          <div className="space-y-1.5 pt-1">
                            <label className="text-[11px] font-semibold text-gray-700 flex items-center gap-1">
                              <span>Scale / Volume Discount Note:</span>
                              <span className="text-gray-400 font-normal">(e.g. Decrease price if order increases)</span>
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Decrease price to ₹480/pc if order increases to 150+ units"
                              value={item.discountTierNote || ''}
                              onChange={(e) => handleItemDiscountNoteChange(idx, e.target.value)}
                              className="w-full px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-xs text-gray-800 focus:outline-none focus:border-teal-600"
                            />

                            {/* Quick Helper Suggestion Chips */}
                            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                              <span className="text-[10px] text-gray-400 font-semibold">Quick Chips:</span>
                              <button
                                type="button"
                                onClick={() => handleItemDiscountNoteChange(idx, 'Decrease price if order increases')}
                                className="px-2 py-0.5 rounded-md bg-white border border-gray-200 hover:border-emerald-400 text-[10px] font-medium text-gray-700 hover:text-emerald-800 transition-colors cursor-pointer"
                              >
                                + Decrease price if order increases
                              </button>
                              <button
                                type="button"
                                onClick={() => handleItemDiscountNoteChange(idx, `5% discount if order increases by 50+ units`)}
                                className="px-2 py-0.5 rounded-md bg-white border border-gray-200 hover:border-emerald-400 text-[10px] font-medium text-gray-700 hover:text-emerald-800 transition-colors cursor-pointer"
                              >
                                + 5% off for +50 units
                              </button>
                              <button
                                type="button"
                                onClick={() => handleItemDiscountNoteChange(idx, `10% discount for orders above 200 units`)}
                                className="px-2 py-0.5 rounded-md bg-white border border-gray-200 hover:border-emerald-400 text-[10px] font-medium text-gray-700 hover:text-emerald-800 transition-colors cursor-pointer"
                              >
                                + 10% off for 200+ units
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Live Calculation Summary Card */}
                <div className="bg-linear-to-r from-emerald-900 to-teal-950 text-white p-5 rounded-2xl shadow-md space-y-3">
                  <div className="flex items-center justify-between border-b border-teal-700/60 pb-2">
                    <span className="font-extrabold text-xs uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                      <Sparkles size={15} /> 2. Seller Total Calculated Summary
                    </span>
                    <span className="text-[11px] text-teal-200 font-mono">
                      {pitchItems.length} Products Included
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-white/10 p-3 rounded-xl backdrop-blur-xs">
                      <span className="text-[10px] text-teal-200 uppercase font-semibold block">Customer Target Budget</span>
                      <div className="text-base font-extrabold text-white font-mono mt-0.5">
                        {totalCustomerTargetBudget > 0 ? `₹${totalCustomerTargetBudget.toLocaleString()}` : 'Not Specified'}
                      </div>
                    </div>

                    <div className="bg-white/15 p-3 rounded-xl backdrop-blur-xs border border-emerald-400/40">
                      <span className="text-[10px] text-emerald-300 uppercase font-bold block">Seller Total Calculated</span>
                      <div className="text-xl font-black text-amber-300 font-mono mt-0.5">
                        ₹{calculatedGrandTotal.toLocaleString()}
                      </div>
                    </div>

                    <div className="bg-white/10 p-3 rounded-xl backdrop-blur-xs">
                      <span className="text-[10px] text-teal-200 uppercase font-semibold block">Average Calculated Rate</span>
                      <div className="text-base font-extrabold text-white font-mono mt-0.5">
                        ₹{calculatedAvgUnitPrice.toLocaleString()} / unit
                      </div>
                    </div>
                  </div>

                  {totalCustomerTargetBudget > 0 && (
                    <div className="text-xs pt-1 flex items-center gap-2">
                      {calculatedGrandTotal <= totalCustomerTargetBudget ? (
                        <span className="text-emerald-300 font-bold flex items-center gap-1">
                          <CheckCircle2 size={14} /> Competitive Pitch: Saves customer ₹{(totalCustomerTargetBudget - calculatedGrandTotal).toLocaleString()} vs Target Budget
                        </span>
                      ) : (
                        <span className="text-amber-200 font-medium">
                          Note: Pitch is ₹{(calculatedGrandTotal - totalCustomerTargetBudget).toLocaleString()} higher than customer target budget.
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* 3. Overall Scale Discount Terms & Lead Time */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="font-extrabold text-xs text-gray-800 flex items-center gap-1.5">
                      <Sparkles size={14} className="text-amber-600" />
                      3. Overall Volume Discount Note & Scale Slabs
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Decrease price if order increases: 5% off for 200+ units, 10% off for 500+ units"
                      value={volumeDiscountNote}
                      onChange={(e) => setVolumeDiscountNote(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-600 text-xs text-gray-800"
                    />

                    {/* Overall Helper Preset Chips */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      <span className="text-[10px] text-gray-400 font-semibold">Preset Suggestions:</span>
                      <button
                        type="button"
                        onClick={() => setVolumeDiscountNote('Prices can be decreased if order quantity increases. Open to volume negotiation.')}
                        className="px-2 py-0.5 rounded-md bg-gray-100 hover:bg-emerald-50 border border-gray-200 text-[10px] font-medium text-gray-700 hover:text-emerald-800 transition-colors cursor-pointer"
                      >
                        Decrease price if order increases
                      </button>
                      <button
                        type="button"
                        onClick={() => setVolumeDiscountNote('Tiered wholesale slabs: 10% additional discount on bulk scaling & repeat orders.')}
                        className="px-2 py-0.5 rounded-md bg-gray-100 hover:bg-emerald-50 border border-gray-200 text-[10px] font-medium text-gray-700 hover:text-emerald-800 transition-colors cursor-pointer"
                      >
                        10% tier on bulk scaling
                      </button>
                      <button
                        type="button"
                        onClick={() => setVolumeDiscountNote('Free institutional embroidery crest and sample kit dispatch included for 500+ units.')}
                        className="px-2 py-0.5 rounded-md bg-gray-100 hover:bg-emerald-50 border border-gray-200 text-[10px] font-medium text-gray-700 hover:text-emerald-800 transition-colors cursor-pointer"
                      >
                        Free crest & sample included
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-xs text-gray-700">Estimated Delivery Lead Time (Days)</label>
                      <input
                        type="number"
                        min="1"
                        max="90"
                        value={deliveryDays}
                        onChange={(e) => setDeliveryDays(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-600 text-xs"
                      />
                      {/* Delivery Days Quick Chips */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[10px] text-gray-400 font-semibold">Quick Lead Days:</span>
                        {[5, 7, 10, 12, 15, 21].map(daysOption => (
                          <button
                            key={daysOption}
                            type="button"
                            onClick={() => setDeliveryDays(String(daysOption))}
                            className={`px-2 py-0.5 rounded-md border text-[10px] font-bold transition-colors cursor-pointer ${
                              Number(deliveryDays) === daysOption
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-gray-100 hover:bg-blue-50 border-gray-200 text-gray-700 hover:text-blue-800'
                            }`}
                          >
                            {daysOption} Days
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-xs text-gray-700">General Terms & Quality Specifications</label>
                      <textarea
                        rows="2"
                        placeholder="Fabric composition, GST invoice terms, sample inspection date..."
                        value={quoteNotes}
                        onChange={(e) => setQuoteNotes(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-600 text-xs"
                      ></textarea>
                    </div>
                  </div>

                  {/* 4. Seller Demand for Upfront Advance Payment */}
                  <div className="bg-linear-to-r from-emerald-50 to-teal-50 border border-emerald-200 p-4 sm:p-5 rounded-2xl space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200/60 pb-2">
                      <div>
                        <h4 className="font-extrabold text-xs text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                          <DollarSign size={15} className="text-emerald-700" />
                          4. Seller Upfront Mobilization Advance Demand
                        </h4>
                        <p className="text-[11px] text-emerald-800">
                          Specify required mobilization advance before commencing bulk manufacturing or fabric procurement.
                        </p>
                      </div>

                      {/* Dual Percentage / Fixed Amount Toggle */}
                      <div className="inline-flex p-1 bg-white border border-emerald-200 rounded-xl shadow-2xs self-start sm:self-auto">
                        <button
                          type="button"
                          onClick={() => handleSellerAdvanceTypeChange('percentage')}
                          className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                            sellerAdvanceType === 'percentage'
                              ? 'bg-emerald-700 text-white shadow-xs'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          <Percent size={13} />
                          <span>Percentage (%)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSellerAdvanceTypeChange('amount')}
                          className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                            sellerAdvanceType === 'amount'
                              ? 'bg-emerald-700 text-white shadow-xs'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          <DollarSign size={13} />
                          <span>Fixed Amount (₹)</span>
                        </button>
                      </div>
                    </div>

                    {/* Buyer Reference Notice */}
                    {order.buyerAdvancePercentage && (
                      <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100 flex items-center justify-between text-xs">
                        <span className="text-gray-600">Buyer's Initial Upfront Offer:</span>
                        <strong className="text-emerald-900">
                          {order.buyerAdvancePercentage}% {order.buyerAdvanceAmount ? `(₹${Number(order.buyerAdvanceAmount).toLocaleString()})` : ''}
                        </strong>
                      </div>
                    )}

                    {/* Input Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {sellerAdvanceType === 'percentage' ? (
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-gray-700">Demanded Advance Percentage (%)</label>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={sellerAdvancePercentage}
                              onChange={(e) => handleSellerAdvancePercentageChange(e.target.value)}
                              placeholder="e.g. 30"
                              className="w-full px-3 py-2 pr-8 rounded-xl border border-emerald-300 bg-white text-xs font-bold text-gray-900 focus:outline-none focus:border-emerald-600"
                            />
                            <span className="absolute right-3 top-2.5 text-gray-400 font-bold text-xs">%</span>
                          </div>
                          {/* Quick Presets */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            {[20, 30, 40, 50, 60].map((pct) => (
                              <button
                                key={pct}
                                type="button"
                                onClick={() => handleSellerAdvancePercentageChange(pct)}
                                className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                                  Number(sellerAdvancePercentage) === pct
                                    ? 'bg-emerald-700 text-white border-emerald-700'
                                    : 'bg-white border-gray-200 text-gray-700 hover:border-emerald-300'
                                }`}
                              >
                                {pct}% {pct >= 40 ? '(Raised)' : ''}
                              </button>
                            ))}
                          </div>
                          <span className="text-[10px] text-emerald-800 font-medium block pt-0.5">
                            💡 Raise advance to 40% or 50% to mitigate fabric procurement risk at lower margins.
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-gray-700">Demanded Advance Fixed Amount (₹)</label>
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 text-gray-400 font-bold text-xs">₹</span>
                            <input
                              type="number"
                              min="0"
                              value={sellerAdvanceAmount}
                              onChange={(e) => handleSellerAdvanceAmountChange(e.target.value)}
                              placeholder="e.g. 50000"
                              className="w-full pl-7 pr-3 py-2 rounded-xl border border-emerald-300 bg-white text-xs font-bold text-gray-900 focus:outline-none focus:border-emerald-600"
                            />
                          </div>
                        </div>
                      )}

                      {/* Calculated Demanded Advance Amount Card */}
                      <div className="bg-white/90 p-3 rounded-xl border border-emerald-200/80 flex flex-col justify-center space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">Demanded Mobilization:</span>
                          <strong className="text-emerald-800 text-sm font-extrabold font-mono">
                            ₹{(sellerAdvanceType === 'percentage'
                              ? Math.round(((calculatedGrandTotal > 0 ? calculatedGrandTotal : Number(quoteAmount) || 0) * Number(sellerAdvancePercentage || 30)) / 100)
                              : (Number(sellerAdvanceAmount) || 0)
                            ).toLocaleString()}
                          </strong>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-gray-500">
                          <span>Balance on Delivery:</span>
                          <span className="font-bold text-gray-800 font-mono">
                            ₹{Math.max(0, (calculatedGrandTotal > 0 ? calculatedGrandTotal : Number(quoteAmount) || 0) - (sellerAdvanceType === 'percentage'
                              ? Math.round(((calculatedGrandTotal > 0 ? calculatedGrandTotal : Number(quoteAmount) || 0) * Number(sellerAdvancePercentage || 30)) / 100)
                              : (Number(sellerAdvanceAmount) || 0)
                            )).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Advance Terms / Mobilization Milestones */}
                    <div className="space-y-1">
                      <label className="font-bold text-[11px] text-gray-700">Seller Advance Terms & Payment Milestones</label>
                      <textarea
                        rows="2"
                        placeholder="e.g. 30% advance on sample kit approval before fabric cutting, 70% balance upon school campus delivery."
                        value={sellerAdvanceTerms}
                        onChange={(e) => setSellerAdvanceTerms(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-teal-600 text-xs"
                      ></textarea>
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex gap-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setModalSubTab('specs')}
                    className="flex-1 py-3 font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl cursor-pointer transition-colors"
                  >
                    Back to Specifications
                  </button>
                  <button
                    type="submit"
                    className="flex-2 py-3 font-black text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2 text-xs font-display transition-all"
                  >
                    <Send size={16} />
                    <span>
                      {existingSellerQuote
                        ? `Resend Revised Quotation (Version ${(existingSellerQuote.currentVersion || 1) + 1}) • ₹${calculatedGrandTotal.toLocaleString()}`
                        : `Pitch Calculated Quotation (₹${calculatedGrandTotal.toLocaleString()})`
                      }
                    </span>
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>

        {/* Modal Bottom Footer Bar */}
        <div className="bg-gray-50 border-t border-gray-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-gray-500 font-medium">
            Order Reference: <span className="font-mono font-bold text-gray-800">{refId}</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* View Partial Advance Receipt Button */}
            <button
              type="button"
              onClick={() => setIsReceiptModalOpen(true)}
              className="flex-1 sm:flex-initial px-3.5 py-2 bg-white border border-emerald-300 hover:bg-emerald-50 text-emerald-800 font-extrabold text-xs rounded-xl shadow-2xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <FileText size={14} className="text-emerald-700" />
              <span>Partial Receipt Voucher</span>
            </button>

            {userRole === 'seller' && onSubmitQuote && order.status !== 'quote_accepted' && (
              <button
                onClick={() => setModalSubTab('submit_quote')}
                className="flex-1 sm:flex-initial px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Send size={15} />
                <span>Pitch Updated Quotation</span>
              </button>
            )}

            {userRole === 'seller' && onAcceptDirect && order.status !== 'quote_accepted' && (
              <button
                onClick={() => {
                  onAcceptDirect(order.id || order._id);
                  onClose();
                }}
                className="flex-1 sm:flex-initial px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1"
              >
                <CheckCircle2 size={14} />
                <span>Accept at Target Budget</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-xs rounded-xl cursor-pointer transition-colors"
            >
              Close Details
            </button>
          </div>
        </div>

      </div>

      {/* SAMPLE IMAGE LIGHTBOX POPUP MODAL */}
      {zoomImage && (
        <div
          onClick={() => setZoomImage(null)}
          className="fixed inset-0 z-60 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in"
        >
          <div className="relative max-w-3xl max-h-[85vh] bg-white rounded-3xl overflow-hidden p-2 shadow-2xl">
            <button
              onClick={() => setZoomImage(null)}
              className="absolute top-4 right-4 bg-black/60 hover:bg-black text-white p-2 rounded-full z-10 cursor-pointer"
            >
              <X size={20} />
            </button>
            <img src={zoomImage} alt="Sample Zoomed" className="w-full h-full object-contain max-h-[80vh] rounded-2xl" />
          </div>
        </div>
      )}

      {/* SPECIFIC DEMAND ITEM DETAIL VIEW MODAL */}
      {selectedItemForDetail && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-gray-200 overflow-hidden flex flex-col my-auto max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="bg-teal-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-teal-950 flex items-center justify-center font-extrabold shadow-sm">
                  <Package size={20} />
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-base text-white">
                    {selectedItemForDetail.itemName || 'Requirement Demand Item'}
                  </h3>
                  <p className="text-xs text-teal-200">
                    Category: <strong className="text-white">{selectedItemForDetail.category}</strong> • Quantity: <strong className="text-white">{selectedItemForDetail.quantity} Units</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedItemForDetail(null)}
                className="p-1.5 text-teal-200 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs text-gray-800">
              
              {/* Image Gallery */}
              {(() => {
                const itemImages = Array.isArray(selectedItemForDetail.sampleImages) && selectedItemForDetail.sampleImages.length > 0
                  ? selectedItemForDetail.sampleImages
                  : (selectedItemForDetail.sampleImage ? [selectedItemForDetail.sampleImage] : []);

                return (
                  <div className="space-y-2">
                    <h4 className="font-extrabold text-xs text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Camera size={14} className="text-teal-700" /> Requirement Photos ({itemImages.length})
                    </h4>

                    {itemImages.length > 0 ? (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-200">
                        {itemImages.map((imgSrc, iIdx) => (
                          <div
                            key={iIdx}
                            onClick={() => setZoomImage(imgSrc)}
                            className="relative aspect-square rounded-xl overflow-hidden border border-gray-300 shadow-2xs group cursor-pointer"
                          >
                            <img src={imgSrc} alt={`Sample ${iIdx + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                              <Eye size={16} />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 bg-gray-50 rounded-xl border border-dashed border-gray-300 text-gray-400 text-center">
                        No sample photos attached for this requirement item.
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Price Comparison Card */}
              <div className="grid grid-cols-2 gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                <div className="p-3 bg-white rounded-xl border border-gray-200 space-y-1">
                  <span className="text-[10px] text-gray-500 font-bold uppercase block">Customer Target Budget / Unit</span>
                  <div className="text-base font-extrabold text-gray-900">
                    ₹{Number(selectedItemForDetail.budgetPerUnit || selectedItemForDetail.budgetUnit || 0).toLocaleString()}
                  </div>
                  <div className="text-[11px] text-gray-500">
                    Total Line Budget: <strong>₹{((Number(selectedItemForDetail.quantity) || 0) * (Number(selectedItemForDetail.budgetPerUnit || selectedItemForDetail.budgetUnit) || 0)).toLocaleString()}</strong>
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1">
                  <span className="text-[10px] text-emerald-800 font-bold uppercase block">
                    {userRole === 'seller' ? 'Your Quoted Price / Unit' : 'Seller Offered Price / Unit'}
                  </span>
                  {(() => {
                    const myItemPrice = userRole === 'admin'
                      ? Number(selectedItemForDetail.sellerPricePerUnit || selectedItemForDetail.sellerPrice || 0)
                      : Number(existingSellerQuote?.itemPrices?.find(
                          ip => String(ip.itemId) === String(selectedItemForDetail._id || selectedItemForDetail.id) || String(ip.itemName) === String(selectedItemForDetail.itemName)
                        )?.pricePerUnit || 0);

                    return (
                      <>
                        <div className="text-base font-black text-emerald-950 font-mono">
                          {myItemPrice > 0 ? `₹${myItemPrice.toLocaleString()}` : 'Not Quoted Yet'}
                        </div>
                        <div className="text-[11px] text-emerald-900">
                          Total Line Price: <strong>₹{((Number(selectedItemForDetail.quantity) || 0) * myItemPrice).toLocaleString()}</strong>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Customizations & Specifications */}
              <div className="space-y-3">
                {selectedItemForDetail.customizations && (
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-purple-950">
                    <strong className="block text-xs font-extrabold uppercase tracking-wider text-purple-900 mb-1">
                      ✨ Customization Specifications
                    </strong>
                    <p className="text-xs leading-relaxed">{selectedItemForDetail.customizations}</p>
                  </div>
                )}

                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 space-y-1">
                  <strong className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1">
                    Extra Notes & Size Distribution
                  </strong>
                  <p className="text-xs leading-relaxed">{selectedItemForDetail.notes || 'No specific notes provided.'}</p>
                </div>
              </div>

              {/* Seller / Admin Item Price Input */}
              {(userRole === 'admin' || userRole === 'seller') && (
                <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl space-y-3">
                  <h4 className="font-extrabold text-xs text-teal-950 uppercase tracking-wider flex items-center gap-1.5">
                    <DollarSign size={15} className="text-teal-700" />
                    Set / Update Seller Offered Price Per Unit (₹)
                  </h4>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 480"
                      value={itemSellerPriceInput}
                      onChange={(e) => setItemSellerPriceInput(e.target.value)}
                      className="flex-1 bg-white border border-teal-300 rounded-xl p-2.5 text-xs font-mono font-bold text-teal-950 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (itemSellerPriceInput) {
                          selectedItemForDetail.sellerPricePerUnit = Number(itemSellerPriceInput);
                          setSelectedItemForDetail({ ...selectedItemForDetail, sellerPricePerUnit: Number(itemSellerPriceInput) });
                        }
                      }}
                      className="px-4 py-2.5 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      Update Price
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-3 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setSelectedItemForDetail(null)}
                className="px-5 py-2 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Close Item Detail
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tax Invoice & Certificate Modal */}
      {isInvoiceOpen && taxInvoiceOrder && (
        <TaxInvoiceModal
          isOpen={isInvoiceOpen}
          onClose={() => setIsInvoiceOpen(false)}
          order={taxInvoiceOrder}
        />
      )}

      {/* Partial Advance Payment Receipt Modal */}
      {isReceiptModalOpen && (
        <PartialAdvanceReceiptModal
          isOpen={isReceiptModalOpen}
          onClose={() => setIsReceiptModalOpen(false)}
          order={order}
        />
      )}

      {/* Quotation Version Comparison Modal */}
      {isComparisonOpen && comparingQuote && (
        <QuotationVersionComparisonModal
          isOpen={isComparisonOpen}
          onClose={() => setIsComparisonOpen(false)}
          quotation={comparingQuote}
          order={order}
        />
      )}

    </div>
  );
}
