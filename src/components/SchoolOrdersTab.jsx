import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Search, 
  Plus, 
  Clock, 
  CheckCircle2, 
  FileText, 
  Phone, 
  Mail, 
  Calendar, 
  X, 
  Edit3, 
  Trash2,
  Send,
  UserCheck,
  Globe,
  Users,
  ShieldCheck,
  Sparkles,
  DollarSign,
  Eye,
  Percent,
  Truck,
  Package,
  Check,
  Lock,
  AlertCircle,
  ExternalLink,
  Copy,
  MessageSquare,
  Download
} from 'lucide-react';
import { useSellerData } from '../context/SellerDataContext';
import { SERVER_URL } from '../utils/api';
import BulkOrderPreviewModal from './BulkOrderPreviewModal';
import PartialAdvanceReceiptModal from './PartialAdvanceReceiptModal';

export default function SchoolOrdersTab() {
  const {
    schoolOrders,
    addSchoolOrder,
    acceptSchoolOrder,
    submitSchoolQuote,
    acceptBuyerCounterDemand,
    confirmSellerAcceptance,
    reviseSchoolQuote,
    updateSchoolOrderStatus,
    deleteSchoolOrder,
    sellerUser
  } = useSellerData();

  const [searchTerm, setSearchTerm] = useState('');
  const [channelFilter, setChannelFilter] = useState('All'); // 'All', 'Accepted', 'Direct', 'Invited', 'Broadcast'

  // Preview Expanded Detail Modal State
  const [previewOrder, setPreviewOrder] = useState(null);
  const [initialPreviewTab, setInitialPreviewTab] = useState('specs');
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState(null);

  // Self-Delivery Dispatch Modal State (Only Self Delivery allowed for bulk orders)
  const [dispatchModalOrder, setDispatchModalOrder] = useState(null);
  const [dispatchStatus, setDispatchStatus] = useState('out for delivery');
  const [riderName, setRiderName] = useState('');
  const [riderPhone, setRiderPhone] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');

  // Quotation Submission Modal State
  const [quotationModalOrder, setQuotationModalOrder] = useState(null);
  const [quoteAmount, setQuoteAmount] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [deliveryDays, setDeliveryDays] = useState('7');
  const [quoteNotes, setQuoteNotes] = useState('');
  const [prepaymentType, setPrepaymentType] = useState('percentage'); // 'percentage' | 'amount'
  const [prepaymentPercentage, setPrepaymentPercentage] = useState(25);
  const [prepaymentAmount, setPrepaymentAmount] = useState('');
  const [prepaymentTerms, setPrepaymentTerms] = useState('');

  // Add Custom Requirement Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    schoolName: '',
    contactPerson: '',
    designation: 'Partner Merchant / Seller',
    contactPhone: '',
    contactEmail: '',
    requirementSummary: '',
    quantity: 200,
    estimatedBudget: 200000,
    quoteAmount: 190000,
    deadline: '2026-10-15',
    notes: ''
  });

  // Filtered Orders for Seller (ONLY SHOW ORDERS DISTRIBUTED / ACCESSIBLE TO THIS SELLER)
  const filteredOrders = useMemo(() => {
    const sellerCandidateIds = [
      sellerUser?.id,
      sellerUser?._id,
      sellerUser?.merchantId,
      typeof window !== 'undefined' ? localStorage.getItem('bv_seller_id') : '',
      typeof window !== 'undefined' ? localStorage.getItem('bookvardi_seller_id') : '',
      typeof window !== 'undefined' ? localStorage.getItem('user_id') : ''
    ].filter(Boolean).map(String);

    const currentSellerId = String(sellerUser?.id || sellerUser?._id || sellerCandidateIds[0] || '');
    const cleanSellerPhone = String(sellerUser?.phone || '').replace(/\D/g, '').slice(-10);
    const cleanSellerStore = (sellerUser?.storeName || sellerUser?.name || '').trim().toLowerCase();

    const safeSchoolOrders = Array.isArray(schoolOrders) ? schoolOrders : [];
    return safeSchoolOrders.filter((req) => {
      const assignedSellerId = req.sellerId ? String(typeof req.sellerId === 'object' ? (req.sellerId._id || req.sellerId.id) : req.sellerId) : '';
      const isAssignedToMe = Boolean(assignedSellerId && (assignedSellerId === currentSellerId || sellerCandidateIds.includes(assignedSellerId)));
      const isAssignedToAnother = Boolean(assignedSellerId && !isAssignedToMe);

      const isInvitedToMe = Array.isArray(req.invitedSellerIds) && req.invitedSellerIds.some(
        s => {
          const sId = String(typeof s === 'object' ? (s._id || s.id) : s);
          return sId === currentSellerId || sellerCandidateIds.includes(sId);
        }
      );

      const hasMySellerQuote = Array.isArray(req.quotations) && req.quotations.some(
        q => {
          const qSellerId = String(q.sellerId?._id || q.sellerId?.id || q.sellerId || '');
          if (qSellerId && (qSellerId === currentSellerId || sellerCandidateIds.includes(qSellerId))) return true;
          if (cleanSellerPhone && String(q.sellerPhone || '').replace(/\D/g, '').slice(-10) === cleanSellerPhone) return true;
          if (cleanSellerStore && (q.sellerStoreName || q.sellerName || '').trim().toLowerCase() === cleanSellerStore) return true;
          return false;
        }
      );

      const isWinningSeller = Boolean(req.acceptedQuoteId && req.quotations?.some(
        q => String(q._id || q.id) === String(req.acceptedQuoteId) && (
          (currentSellerId && String(q.sellerId?._id || q.sellerId?.id || q.sellerId) === currentSellerId) ||
          sellerCandidateIds.includes(String(q.sellerId?._id || q.sellerId?.id || q.sellerId || '')) ||
          (cleanSellerPhone && String(q.sellerPhone || '').replace(/\D/g, '').slice(-10) === cleanSellerPhone) ||
          (cleanSellerStore && (q.sellerStoreName || q.sellerName || '').trim().toLowerCase() === cleanSellerStore)
        )
      ));

      const isBroadcast = req.assignmentMode === 'broadcast' || req.isGlobalRfq || req.isGlobal || req.isPublic || !req.assignmentMode || req.assignmentMode === 'unassigned' || req.assignmentMode === 'open';
      const isPrepaymentPaid = req.advancePaymentStatus === 'paid' || req.advancePaymentStatus === 'paid_partially';

      // Access Rules:
      // A. If an order is explicitly a private direct order assigned to another seller (not broadcast, not invited, not quoted) -> hide
      const isPrivateDirectToOther = req.assignmentMode === 'direct' && !isBroadcast && isAssignedToAnother && !isInvitedToMe && !hasMySellerQuote;
      if (isPrivateDirectToOther) {
        return false;
      }

      // B. Seller CAN see order IF:
      // - Prepayment is not paid yet (all marketplace bulk RFQs remain open for competitive acceptance and pitches until prepayment is verified!)
      // - It is a broadcast / open marketplace RFQ (visible to all sellers, even if one seller accepted it!)
      // - Assigned to me OR won by me
      // - Invited to me
      // - I quoted on it
      const hasAccess = !isPrepaymentPaid || isBroadcast || isAssignedToMe || isWinningSeller || isInvitedToMe || hasMySellerQuote;
      if (!hasAccess) return false;

      // Channel Filter
      let channelMatch = true;
      if (channelFilter === 'Accepted') {
        const isAcceptedOrder = ['quote_accepted', 'accepted', 'seller_accepted_counter', 'packed', 'out for delivery', 'out_for_delivery', 'received', 'delivered', 'completed', 'fulfilled'].includes(req.status) || req.acceptanceMode === 'target_budget' || req.acceptedAtTargetBudget;
        channelMatch = isAssignedToMe || isWinningSeller || isAcceptedOrder;
      } else if (channelFilter === 'Direct') {
        channelMatch = req.assignmentMode === 'direct';
      } else if (channelFilter === 'Invited') {
        channelMatch = req.assignmentMode === 'selected' || isInvitedToMe;
      } else if (channelFilter === 'Broadcast') {
        channelMatch = req.assignmentMode === 'broadcast' || isBroadcast;
      }

      // Search Filter
      const query = searchTerm.toLowerCase();
      const searchMatch = 
        (req.institutionName || req.schoolName || '').toLowerCase().includes(query) ||
        (req.contactName || req.contactPerson || '').toLowerCase().includes(query) ||
        (req.requirementSummary || '').toLowerCase().includes(query) ||
        (req.referenceId || '').toLowerCase().includes(query) ||
        (req.city || '').toLowerCase().includes(query);

      return channelMatch && searchMatch;
    });
  }, [schoolOrders, channelFilter, searchTerm, sellerUser]);

  // Open Quote Modal
  const handleOpenQuotationModal = (order) => {
    setQuotationModalOrder(order);
    const targetBudget = Number(order.targetBudgetPerKit || order.estimatedBudget || 0);
    const qty = Number(order.totalQuantity || order.quantity || 100);

    const existingQuote = Array.isArray(order.quotations)
      ? order.quotations.find(q => String(q.sellerId) === String(sellerUser?.id || sellerUser?._id))
      : null;

    setQuoteAmount(existingQuote ? String(existingQuote.quoteAmount) : (targetBudget ? String(targetBudget) : ''));
    setUnitPrice(existingQuote ? String(existingQuote.unitPrice || 0) : (targetBudget && qty ? String(Math.round(targetBudget / qty)) : ''));
    setDeliveryDays(existingQuote ? String(existingQuote.estimatedDeliveryDays || 7) : '7');
    setQuoteNotes(existingQuote ? String(existingQuote.notes || '') : '');
    setPrepaymentType(existingQuote?.prepaymentType || existingQuote?.sellerAdvanceType || 'percentage');
    setPrepaymentPercentage(Number(existingQuote?.prepaymentPercentage ?? existingQuote?.sellerAdvancePercentage ?? 25));
    setPrepaymentAmount(existingQuote?.prepaymentAmount || existingQuote?.sellerAdvanceAmount ? String(existingQuote.prepaymentAmount || existingQuote.sellerAdvanceAmount) : '');
    setPrepaymentTerms(existingQuote?.prepaymentTerms || existingQuote?.sellerAdvanceTerms || '');
  };

  // Submit Quotation Proposal
  const handleSubmitQuotationForm = (e) => {
    e.preventDefault();
    if (!quotationModalOrder || !quoteAmount) return;

    const finalAmount = Number(quoteAmount);
    const advAmt = prepaymentType === 'percentage'
      ? Math.round((finalAmount * Number(prepaymentPercentage || 0)) / 100)
      : (Number(prepaymentAmount) || Math.round((finalAmount * Number(prepaymentPercentage || 0)) / 100));

    submitSchoolQuote(quotationModalOrder.id || quotationModalOrder._id, {
      quoteAmount: finalAmount,
      unitPrice: Number(unitPrice) || 0,
      estimatedDeliveryDays: Number(deliveryDays) || 7,
      notes: quoteNotes,
      prepaymentType,
      prepaymentPercentage: Number(prepaymentPercentage) || 0,
      prepaymentAmount: advAmt,
      prepaymentTerms,
      sellerAdvanceType: prepaymentType,
      sellerAdvancePercentage: Number(prepaymentPercentage) || 0,
      sellerAdvanceAmount: advAmt,
      sellerAdvanceTerms: prepaymentTerms
    });

    setQuotationModalOrder(null);
  };

  const handleCreateRequirement = (e) => {
    e.preventDefault();
    if (!formData.schoolName.trim()) return;

    addSchoolOrder({
      ...formData,
      quantity: Number(formData.quantity),
      estimatedBudget: Number(formData.estimatedBudget),
      quoteAmount: Number(formData.quoteAmount)
    });

    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-xs border border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="text-teal-700" size={24} /> Institutional & School Bulk Orders
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Review school bulk RFQs assigned directly, invited by Admin, or broadcast marketplace tenders. Submit counter quotations or accept orders.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <Plus size={16} /> Add Custom School Inquiry
        </button>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
          <div className="text-[11px] font-semibold text-gray-500">Available School RFQs</div>
          <div className="text-2xl font-extrabold text-gray-900 mt-1">{(schoolOrders || []).length}</div>
          <div className="text-[10px] text-teal-700 mt-0.5">Active bulk procurement opportunities</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
          <div className="text-[11px] font-semibold text-gray-500">Direct & Invited Orders</div>
          <div className="text-2xl font-extrabold text-blue-700 mt-1">
            {(schoolOrders || []).filter(s => s.assignmentMode === 'direct' || s.assignmentMode === 'selected').length}
          </div>
          <div className="text-[10px] text-gray-400 mt-0.5">Targeted vendor requisitions</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
          <div className="text-[11px] font-semibold text-gray-500">Accepted / Won RFQs</div>
          <div className="text-2xl font-extrabold text-emerald-700 mt-1">
            {(schoolOrders || []).filter(s => ['assigned', 'quote_accepted', 'accepted', 'packed', 'out for delivery', 'out_for_delivery', 'received', 'delivered'].includes(s.status)).length}
          </div>
          <div className="text-[10px] text-emerald-600 mt-0.5">Assigned & active fulfillment</div>
        </div>
      </div>

      {/* Search & Channel Filter Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl shadow-xs border border-gray-100">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search school name, contact person, city, ref ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-teal-600"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
          {[
            { id: 'All', label: 'All RFQs', icon: <Building2 size={13} /> },
            { id: 'Accepted', label: 'Accepted Orders', icon: <CheckCircle2 size={13} /> },
            { id: 'Direct', label: 'Directly Assigned', icon: <UserCheck size={13} /> },
            { id: 'Invited', label: 'Invited Sellers', icon: <Users size={13} /> },
            { id: 'Broadcast', label: 'Global Broadcast', icon: <Globe size={13} /> }
          ].map((ch) => (
            <button
              key={ch.id}
              onClick={() => setChannelFilter(ch.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                channelFilter === ch.id
                  ? 'bg-teal-800 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {ch.icon}
              <span>{ch.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* School Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="p-14 text-center bg-white rounded-2xl border border-gray-100 text-gray-500">
            <Building2 size={44} className="mx-auto text-gray-300 mb-3" />
            <h4 className="font-extrabold text-base text-gray-900 mb-1">No School B2B Orders Found</h4>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
              Institutional bulk requisitions from schools will be listed here. You can also log custom school inquiries.
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer"
            >
              <Plus size={16} /> Add School Requisition
            </button>
          </div>
        ) : (
          filteredOrders.map(req => {
            const sellerCandidateIds = [
              sellerUser?.id,
              sellerUser?._id,
              sellerUser?.merchantId,
              typeof window !== 'undefined' ? localStorage.getItem('bv_seller_id') : '',
              typeof window !== 'undefined' ? localStorage.getItem('bookvardi_seller_id') : '',
              typeof window !== 'undefined' ? localStorage.getItem('user_id') : ''
            ].filter(Boolean).map(String);

            const cleanSellerPhone = String(sellerUser?.phone || '').replace(/\D/g, '').slice(-10);
            const cleanSellerStore = (sellerUser?.storeName || sellerUser?.name || '').trim().toLowerCase();

            const isMyQuote = (q) => {
              if (!q) return false;
              const qSellerId = String(q.sellerId?._id || q.sellerId?.id || q.sellerId || '');
              if (qSellerId && sellerCandidateIds.includes(qSellerId)) return true;
              const qPhone = String(q.sellerPhone || '').replace(/\D/g, '').slice(-10);
              if (cleanSellerPhone && qPhone && qPhone === cleanSellerPhone) return true;
              const qStore = (q.sellerStoreName || q.sellerName || '').trim().toLowerCase();
              if (cleanSellerStore && qStore && (qStore === cleanSellerStore || cleanSellerStore.includes(qStore) || qStore.includes(cleanSellerStore))) return true;
              if (Array.isArray(req.quotations) && req.quotations.length === 1) return true;
              return false;
            };

            const myQuote = Array.isArray(req.quotations) ? req.quotations.find(isMyQuote) || null : null;
            const hasSellerQuote = Boolean(myQuote);

            const assignedSellerId = req.sellerId ? (typeof req.sellerId === 'object' ? (req.sellerId._id || req.sellerId.id) : req.sellerId) : '';

            const isWinningSeller = Boolean(req.acceptedQuoteId && myQuote && (
              String(myQuote._id || myQuote.id) === String(req.acceptedQuoteId)
            ));

            const isBroadcast = req.assignmentMode === 'broadcast' || req.isGlobalRfq || req.isGlobal || req.isPublic || !req.assignmentMode || req.assignmentMode === 'unassigned' || req.assignmentMode === 'open';
            const isAcceptedStatus = ['quote_accepted', 'accepted', 'packed', 'out for delivery', 'out_for_delivery', 'received', 'delivered', 'completed', 'fulfilled'].includes(req.status);
            const isAssignedToMe = (assignedSellerId && sellerCandidateIds.includes(String(assignedSellerId))) || isWinningSeller;
            const isTargetBudgetAccepted = req.acceptanceMode === 'target_budget' || req.acceptedAtTargetBudget;

            const isPacked = req.status === 'packed';
            const isOutForDelivery = req.status === 'out for delivery' || req.status === 'out_for_delivery';
            const isCompleted = req.status === 'completed' || req.status === 'fulfilled' || req.remainingPaymentStatus === 'paid';
            const isReceived = req.status === 'received' || req.status === 'delivered' || isCompleted;

            const advRequired = Number(req.sellerAdvanceAmount || myQuote?.prepaymentAmount || req.prepaymentAmount || 0) > 0 || Number(req.sellerAdvancePercentage || myQuote?.prepaymentPercentage || req.prepaymentPercentage || 0) > 0 || req.advancePaymentStatus === 'pending';
            const isPrepaymentPaid = req.advancePaymentStatus === 'paid' || req.advancePaymentStatus === 'paid_partially';
            const isPrepaymentPending = advRequired && !isPrepaymentPaid;

            // An order is locked to another seller ONLY if prepayment is confirmed, or if it was a private direct order assigned to someone else
            const isLockedToOther = !isAssignedToMe && (isPrepaymentPaid || (req.assignmentMode === 'direct' && !isBroadcast && Boolean(assignedSellerId)));
            const isAcceptedOther = !isAssignedToMe && Boolean(assignedSellerId);

            const budgetVal = req.acceptedPrice || req.overallBudget || req.targetBudgetPerKit || req.estimatedBudget || myQuote?.quoteAmount || 0;

            let cardColorClass = 'bg-white border-gray-100 hover:border-teal-200 shadow-xs';
            if (isLockedToOther) {
              cardColorClass = 'bg-gray-100/90 border-gray-200 text-gray-500 opacity-75 shadow-none';
            } else if (isCompleted || isReceived) {
              cardColorClass = 'bg-gray-50/80 border-gray-200 hover:border-gray-300 shadow-xs';
            } else if ((isTargetBudgetAccepted || isAssignedToMe) && !isPrepaymentPending) {
              cardColorClass = 'bg-blue-50/70 border-blue-200 hover:border-blue-300 ring-1 ring-blue-100 shadow-xs';
            } else if (isPrepaymentPending || req.status === 'seller_accepted_counter' || req.status === 'buyer_countered' || myQuote?.negotiationStage === 'buyer_countered') {
              cardColorClass = 'bg-amber-50/70 border-amber-200/90 hover:border-amber-300 ring-1 ring-amber-100 shadow-xs';
            }

            return (
              <div key={req.id || req._id} className={`${cardColorClass} p-5 rounded-2xl border transition-all space-y-4`}>
                
                {/* Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        {req.referenceId || req.id}
                      </span>
                      <h3 className="font-bold text-gray-900 text-base">{req.institutionName || req.schoolName}</h3>
                      
                      {/* Distribution Tag */}
                      {req.assignmentMode === 'direct' && (
                        <span className="bg-blue-50 text-blue-800 font-bold text-[10px] px-2 py-0.5 rounded flex items-center gap-1 border border-blue-200">
                          <UserCheck size={11} /> Directly Assigned
                        </span>
                      )}
                      {req.assignmentMode === 'selected' && (
                        <span className="bg-purple-50 text-purple-800 font-bold text-[10px] px-2 py-0.5 rounded flex items-center gap-1 border border-purple-200">
                          <Users size={11} /> Selected Vendor Invitation
                        </span>
                      )}
                      {req.assignmentMode === 'broadcast' && (
                        <span className="bg-emerald-50 text-emerald-800 font-bold text-[10px] px-2 py-0.5 rounded flex items-center gap-1 border border-emerald-200">
                          <Globe size={11} /> Global RFQ
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mt-1">
                      <span className="flex items-center gap-1 font-semibold text-gray-700">
                        <UserCheck size={13} className="text-teal-700" /> Buyer: {req.contactName || req.contactPerson || 'School Representative'}
                      </span>
                      <span className="flex items-center gap-1 text-teal-700 font-medium"><Calendar size={13} /> Delivery: {req.targetDeliveryDate || req.deadline || 'ASAP'}</span>
                      {req.expectedQuotationDate && (() => {
                        const target = new Date(req.expectedQuotationDate);
                        if (isNaN(target.getTime())) return null;
                        const now = new Date();
                        const targetMid = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
                        const nowMid = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
                        const diffDays = Math.round((targetMid - nowMid) / (1000 * 60 * 60 * 24));
                        const isExpired = diffDays < 0;
                        const isUrgent = diffDays >= 0 && diffDays <= 2;
                        const text = diffDays > 1 ? `${diffDays} days left` : diffDays === 1 ? '1 day left' : diffDays === 0 ? 'Deadline today' : `Expired (${Math.abs(diffDays)}d ago)`;

                        return (
                          <span className={`flex items-center gap-1 font-bold px-2 py-0.5 rounded-md text-[11px] border ${
                            isExpired
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : isUrgent
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : 'bg-blue-50 text-blue-800 border-blue-200'
                          }`}>
                            <Clock size={12} /> Quote By: {target.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} ({text})
                          </span>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      isLockedToOther
                        ? 'bg-gray-200 text-gray-700 border-gray-300'
                        : isCompleted
                        ? 'bg-emerald-100 text-emerald-950 border-emerald-400 font-black'
                        : isReceived
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                        : isOutForDelivery
                        ? 'bg-amber-100 text-amber-950 border-amber-300'
                        : isPacked
                        ? 'bg-cyan-50 text-cyan-900 border-cyan-200'
                        : (isAssignedToMe && isTargetBudgetAccepted)
                        ? 'bg-blue-100 text-blue-950 border-blue-300 font-black flex items-center gap-1.5'
                        : (isAssignedToMe && isPrepaymentPending)
                        ? 'bg-amber-100 text-amber-950 border-amber-300 font-extrabold'
                        : isAssignedToMe
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : (!isAssignedToMe && assignedSellerId && !isPrepaymentPaid)
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : hasSellerQuote
                        ? 'bg-purple-50 text-purple-800 border-purple-200'
                        : 'bg-teal-50 text-teal-800 border-teal-200'
                    }`}>
                      {isLockedToOther ? '🔒 Awarded to Another Vendor (Prepayment Confirmed)' :
                       isCompleted ? '🎉 Order Completed & Paid (UPI)' :
                       isReceived ? '✅ Consignment Delivered & Received' :
                       isOutForDelivery ? '🚚 Out for Delivery (Store Fleet)' :
                       isPacked ? '📦 Consignment Packed & Ready' :
                       (isAssignedToMe && isTargetBudgetAccepted) ? `🎯 Accepted at Target Budget (${budgetVal > 0 ? `₹${Number(budgetVal).toLocaleString()}` : 'Agreed'})` :
                       (isAssignedToMe && isPrepaymentPending) ? '⏳ Pitch Selected • Prepayment Pending' :
                       isAssignedToMe ? '🎉 Order Accepted & Prepayment Confirmed!' :
                       (!isAssignedToMe && assignedSellerId && !isPrepaymentPaid) ? '⚡ Pending Prepayment Confirmation (Open for Pitches & Acceptance)' :
                       hasSellerQuote ? 'Your Pitch Submitted' : 'RFQ Open for Quotations'}
                    </span>
                  </div>
                </div>

                {/* Status Stepper for Accepted / Processing Orders */}
                {isAssignedToMe && isAcceptedStatus && (
                  <div className="bg-teal-50/60 border border-teal-200/80 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-extrabold text-teal-950 flex items-center gap-1.5">
                        <Truck size={15} className="text-teal-700" />
                        <span>Order Processing Stepper (Store Self-Delivery Only)</span>
                      </div>
                      <span className="text-[10px] font-extrabold text-teal-900 bg-white px-2.5 py-0.5 rounded-full border border-teal-200 shadow-2xs uppercase tracking-wider">
                        Status: {req.status?.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-2 pt-1">
                      {[
                        { step: 1, key: 'accepted', label: '1. Accepted', done: true },
                        { step: 2, key: 'packed', label: '2. Packed', done: ['packed', 'out for delivery', 'out_for_delivery', 'received', 'delivered'].includes(req.status) },
                        { step: 3, key: 'out for delivery', label: '3. Out for Delivery', done: ['out for delivery', 'out_for_delivery', 'received', 'delivered'].includes(req.status) },
                        { step: 4, key: 'received', label: '4. Received', done: ['received', 'delivered'].includes(req.status) }
                      ].map((st) => (
                        <div key={st.step} className="flex flex-col items-center text-center">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shadow-2xs ${
                            st.done ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-500'
                          }`}>
                            {st.done ? '✓' : st.step}
                          </div>
                          <span className={`text-[10px] mt-1 font-bold ${st.done ? 'text-teal-950' : 'text-gray-400'}`}>
                            {st.label}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Self-Delivery Rider Card & Tracking Verification Link */}
                    {(isOutForDelivery || isReceived || isCompleted) && req.deliveryDetails && (
                      <div className="bg-white border border-teal-200 rounded-xl p-3.5 space-y-2 text-xs mt-2 shadow-2xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-0.5">
                            <div className="font-extrabold text-gray-900 flex items-center gap-1.5">
                              <Truck size={14} className="text-teal-700" />
                              <span>Rider: {req.deliveryDetails.deliveryBoyName || 'Store Fleet Rider'}</span>
                              {req.deliveryDetails.deliveryBoyPhone && (
                                <a
                                  href={`tel:${req.deliveryDetails.deliveryBoyPhone}`}
                                  className="text-teal-700 hover:underline font-bold inline-flex items-center gap-0.5 ml-1"
                                >
                                  <Phone size={11} /> {req.deliveryDetails.deliveryBoyPhone}
                                </a>
                              )}
                            </div>
                            <div className="text-[11px] text-gray-500">
                              Vehicle: <strong>{req.deliveryDetails.vehicleNumber || 'Store Van/Fleet'}</strong> • Mode: <strong className="text-teal-800">Store Self-Delivery Fleet</strong>
                            </div>
                            {req.deliveryDetails.notes && (
                              <div className="text-[10px] text-gray-400 italic">"{req.deliveryDetails.notes}"</div>
                            )}
                          </div>

                          <div className="text-right shrink-0">
                            <div className="font-mono font-bold text-[11px] text-teal-900 bg-teal-50 px-2.5 py-0.5 rounded border border-teal-200">
                              Token: {req.deliveryDetails.trackingId || req.deliveryDetails.deliveryPartnerToken || `BV-SLF-${req.referenceId}`}
                            </div>
                            {req.deliveryDetails.dispatchedAt && (
                              <div className="text-[10px] text-gray-400 mt-0.5">
                                Dispatched: {new Date(req.deliveryDetails.dispatchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Live Delivery Tracker Verification Link */}
                        {(() => {
                          const tokenVal = req.deliveryDetails.trackingId || req.deliveryDetails.deliveryPartnerToken || `BV-SLF-${req.referenceId}`;
                          const trackerUrl = `${window.location.origin.replace(':5174', ':5173')}/#delivery-partner?token=${tokenVal}`;
                          return (
                            <div className="pt-2 border-t border-teal-100 flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 flex-1 min-w-[240px]">
                                <span className="text-[10px] font-bold text-teal-900 uppercase tracking-wider shrink-0 flex items-center gap-1">
                                  <ExternalLink size={12} className="text-teal-700" /> Tracker Link:
                                </span>
                                <input
                                  type="text"
                                  readOnly
                                  value={trackerUrl}
                                  className="flex-1 px-2 py-1 bg-gray-50 border border-gray-200 rounded text-[11px] font-mono text-gray-700 select-all truncate"
                                />
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(trackerUrl);
                                    alert('📋 Live Delivery Tracker Link copied to clipboard!');
                                  }}
                                  className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-300 rounded font-bold text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                                >
                                  <Copy size={11} /> Copy Link
                                </button>
                                <a
                                  href={trackerUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-2.5 py-1 bg-teal-800 hover:bg-teal-900 text-white rounded font-bold text-[11px] transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                                >
                                  <ExternalLink size={11} /> Open Tracker
                                </a>
                                {req.deliveryDetails.deliveryBoyPhone && (
                                  <a
                                    href={`https://wa.me/91${req.deliveryDetails.deliveryBoyPhone.replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(`Hello ${req.deliveryDetails.deliveryBoyName || 'Delivery Partner'}, here is your BookVardi live tracking & verification link for Bulk Order #${req.referenceId}:\n${trackerUrl}`)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[11px] transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                                  >
                                    <MessageSquare size={11} /> WhatsApp
                                  </a>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {/* Financial & Settlement Breakdown for Accepted / Dispatched / Fulfilled orders */}
                    {myQuote && (
                      <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs mt-2">
                        <div>
                          <span className="text-[10px] font-bold uppercase text-gray-500 block">Total Quotation Value</span>
                          <span className="text-sm font-black text-gray-900">₹{Number(myQuote.quoteAmount || req.overallBudget || 0).toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase text-emerald-800 block">Advance Prepayment (Paid)</span>
                          <span className="text-sm font-black text-emerald-900 flex items-center gap-1">
                            <CheckCircle2 size={13} className="text-emerald-700" />
                            ₹{Number(req.advancePaidAmount || myQuote.prepaymentAmount || 0).toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase text-teal-800 block">Remaining Balance</span>
                          {(() => {
                            const tot = Number(myQuote.quoteAmount || req.overallBudget || 0);
                            const adv = Number(req.advancePaidAmount || myQuote.prepaymentAmount || 0);
                            const rem = Math.max(0, tot - adv);
                            const isPaid = req.remainingPaymentStatus === 'paid' || req.status === 'completed';
                            return (
                              <div className="flex items-center gap-1.5">
                                <span className={`text-sm font-black ${isPaid ? 'text-emerald-900 line-through' : 'text-amber-900'}`}>
                                  ₹{rem.toLocaleString()}
                                </span>
                                {isPaid ? (
                                  <span className="px-2 py-0.5 bg-emerald-200 text-emerald-900 font-extrabold text-[10px] rounded-full uppercase">
                                    Paid Online (UPI)
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 bg-amber-200 text-amber-950 font-extrabold text-[10px] rounded-full uppercase">
                                    Due on Delivery
                                  </span>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Requirement details */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-50/70 p-3.5 rounded-xl text-xs">
                  <div className="md:col-span-2">
                    <div className="text-gray-400 font-medium text-[11px]">Requirement Specification</div>
                    <div className="font-semibold text-gray-900 mt-0.5">
                      {req.requirementSummary || req.additionalNotes || 'Bulk student uniform & stationery procurement'}
                    </div>
                    {req.additionalNotes && <div className="text-[11px] text-gray-500 mt-1 italic">"{req.additionalNotes}"</div>}
                  </div>

                  <div>
                    <div className="text-gray-400 font-medium text-[11px]">Requested Quantity</div>
                    <div className="font-extrabold text-gray-900 text-sm mt-0.5">
                      {req.totalQuantity || req.quantity || 100} Units
                    </div>
                    <div className="text-[10px] text-gray-500">
                      Target budget: {(req.targetBudgetPerKit || req.estimatedBudget) && Number(req.targetBudgetPerKit || req.estimatedBudget) > 0 ? `₹${Number(req.targetBudgetPerKit || req.estimatedBudget).toLocaleString()}` : 'Open to Quotes'}
                    </div>
                  </div>

                  <div>
                    <div className="text-gray-400 font-medium text-[11px]">Target Delivery & Location</div>
                    <div className="font-bold text-gray-800 text-xs mt-0.5">
                      {req.city ? `${req.city}, ${req.state}` : 'Pan India'}
                    </div>
                    <div className="text-[10px] text-teal-700 font-medium">Logo Embroidery Included</div>
                  </div>
                </div>

                {/* Active Buyer Counter-Demand Alert Card on Order Card */}
                {myQuote && (myQuote.negotiationStage === 'buyer_countered' || (myQuote.latestBuyerCounter && (Number(myQuote.latestBuyerCounter.targetBudget) > 0 || myQuote.latestBuyerCounter.notes))) && (
                  <div className="p-4 bg-linear-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl space-y-2.5 shadow-xs animate-in fade-in">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/80 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                          ⚠️
                        </span>
                        <div>
                          <h4 className="font-extrabold text-xs text-amber-950 flex items-center gap-1.5">
                            <span>Buyer Sent 2nd Version Counter-Demand (v{myQuote.currentVersion || 2})</span>
                            <span className="bg-amber-200 text-amber-900 text-[10px] font-black uppercase px-2 py-0.5 rounded-full">Action Needed</span>
                          </h4>
                          <p className="text-[11px] text-amber-800">
                            The school reviewed your pitch and submitted updated counter terms:
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewOrder(req);
                            setInitialPreviewTab('quotes');
                          }}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Clock size={13} />
                          <span>Review Timeline & Demands</span>
                        </button>
                        {acceptBuyerCounterDemand && (
                          <button
                            type="button"
                            onClick={() => acceptBuyerCounterDemand(req.id || req._id, myQuote._id || myQuote.id)}
                            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <CheckCircle2 size={13} />
                            <span>Accept Demand</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Counter Metrics Grid: Demanded Budget, Quantity, Unit Rate */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                      <div className="bg-white/90 p-2 rounded-xl border border-amber-200">
                        <span className="text-[10px] text-amber-800 font-sans font-bold block uppercase">Counter Budget</span>
                        <span className="text-sm font-extrabold text-amber-950 font-mono">
                          ₹{Number(myQuote.latestBuyerCounter?.targetBudget || 0).toLocaleString()}
                        </span>
                        <span className="text-[10px] text-gray-400 font-sans block mt-0.5">
                          Pitch: ₹{Number(myQuote.quoteAmount).toLocaleString()}
                        </span>
                      </div>
                      <div className="bg-white/90 p-2 rounded-xl border border-amber-200">
                        <span className="text-[10px] text-amber-800 font-sans font-bold block uppercase">Demanded Quantity</span>
                        <span className="text-sm font-extrabold text-amber-950 font-mono">
                          {myQuote.latestBuyerCounter?.totalQuantity || req.totalQuantity || req.quantity || 100} Units
                        </span>
                        <span className="text-[10px] text-gray-400 font-sans block mt-0.5">
                          Updated Order Scale
                        </span>
                      </div>
                      <div className="bg-white/90 p-2 rounded-xl border border-amber-200">
                        <span className="text-[10px] text-amber-800 font-sans font-bold block uppercase">Target Unit Price</span>
                        <span className="text-sm font-extrabold text-amber-950 font-mono">
                          ₹{myQuote.latestBuyerCounter?.unitPrice || (myQuote.latestBuyerCounter?.targetBudget && (myQuote.latestBuyerCounter?.totalQuantity || req.totalQuantity) ? Math.round(Number(myQuote.latestBuyerCounter.targetBudget) / Number(myQuote.latestBuyerCounter.totalQuantity || req.totalQuantity)) : 0)} / unit
                        </span>
                        <span className="text-[10px] text-gray-400 font-sans block mt-0.5">
                          Offered: ₹{myQuote.unitPrice || 0}/u
                        </span>
                      </div>
                      <div className="bg-white/90 p-2 rounded-xl border border-amber-200">
                        <span className="text-[10px] text-amber-800 font-sans font-bold block uppercase">Lead & Prepayment</span>
                        <span className="text-xs font-extrabold text-amber-950 block">
                          {myQuote.latestBuyerCounter?.requestedDeliveryDays ? `${myQuote.latestBuyerCounter.requestedDeliveryDays} Days Lead` : 'Standard Lead'}
                        </span>
                        <span className="text-[11px] font-bold text-teal-800 block mt-0.5">
                          {myQuote.latestBuyerCounter?.proposedAdvancePercentage ? `${myQuote.latestBuyerCounter.proposedAdvancePercentage}% Advance` : 'Agreed Prepayment'}
                        </span>
                      </div>
                    </div>

                    {myQuote.latestBuyerCounter?.notes && (
                      <div className="text-xs text-amber-950 italic bg-white/70 p-2 rounded-lg border border-amber-200/60">
                        <strong>Buyer Note:</strong> "{myQuote.latestBuyerCounter.notes}"
                      </div>
                    )}
                  </div>
                )}

                {/* Seller Quote Banner if already submitted */}
                {myQuote && (
                  <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                    isAssignedToMe
                      ? (isPrepaymentPending ? 'bg-amber-50/90 border-amber-300 text-amber-950 font-bold' : 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold')
                      : isAcceptedOther
                      ? 'bg-amber-50 border-amber-200 text-amber-900'
                      : 'bg-purple-50/80 border-purple-200'
                  }`}>
                    <div>
                      <span className="font-bold">Your Proposal Pitch:</span>
                      <span className="font-extrabold text-sm ml-2">₹{Number(myQuote.quoteAmount).toLocaleString()}</span>
                      <span className="text-gray-500 text-[11px] ml-2">({myQuote.estimatedDeliveryDays} days delivery)</span>
                    </div>

                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                      isAssignedToMe
                        ? (isPrepaymentPending ? 'bg-amber-200 text-amber-950 border border-amber-400 font-extrabold' : 'bg-emerald-600 text-white font-extrabold')
                        : isAcceptedOther
                        ? 'bg-amber-200 text-amber-900'
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      {isAssignedToMe
                        ? (isPrepaymentPending ? '⏳ Pitch Selected • Prepayment Pending' : '🎉 Customer Accepted & Prepayment Confirmed!')
                        : isAcceptedOther
                        ? 'Customer Accepted Other Seller'
                        : 'Pitch Under Review'}
                    </span>
                  </div>
                )}

                {/* Two-Way Acceptance Confirmation Banner for Seller */}
                {(() => {
                  const isAdvancedOrder = isPrepaymentPaid || isCompleted || req.remainingPaymentStatus === 'paid' || [
                    'prepayment_pending',
                    'advance_paid',
                    'in_production',
                    'processing',
                    'dispatched',
                    'out_for_delivery',
                    'remaining_pending',
                    'remaining_paid',
                    'completed',
                    'delivered'
                  ].includes(String(req.status || '').toLowerCase());

                  if (!isAdvancedOrder && (req.status === 'buyer_accepted' || myQuote?.status === 'buyer_accepted')) {
                    return (
                      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-2 border-emerald-400 p-3 rounded-xl flex flex-wrap items-center justify-between gap-2.5 shadow-2xs">
                        <div className="flex items-center gap-2">
                          <Sparkles size={18} className="text-emerald-700 shrink-0" />
                          <div>
                            <span className="font-extrabold text-emerald-950 text-xs block">
                              🎉 Buyer accepted your quotation! Confirm acceptance to request prepayment.
                            </span>
                            <span className="text-emerald-800 text-[11px]">
                              Prepayment Amount: <strong>₹{Number(req.sellerAdvanceAmount || myQuote?.prepaymentAmount || Math.round((Number(myQuote?.quoteAmount || req.overallBudget || 0) * (myQuote?.prepaymentPercentage || req.sellerAdvancePercentage || 20)) / 100)).toLocaleString()} ({myQuote?.prepaymentPercentage || req.sellerAdvancePercentage || 20}%)</strong>
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => confirmSellerAcceptance(req.id || req._id)}
                          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <CheckCircle2 size={15} />
                          <span>Confirm Acceptance & Request Prepayment</span>
                        </button>
                      </div>
                    );
                  }

                  if (!isAdvancedOrder && (req.status === 'seller_accepted_counter' || myQuote?.status === 'seller_accepted')) {
                    return (
                      <div className="bg-amber-50 border border-amber-300 p-2.5 rounded-xl flex items-center justify-between gap-2 text-xs text-amber-950 font-bold">
                        <span className="flex items-center gap-1.5">
                          <Clock size={15} className="text-amber-600 shrink-0" />
                          <span>You accepted buyer's deal. Awaiting buyer confirmation & online prepayment.</span>
                        </span>
                        <span className="bg-amber-200 text-amber-900 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                          Awaiting Buyer Confirmation
                        </span>
                      </div>
                    );
                  }

                  return null;
                })()}

                {isPrepaymentPending ? (
                  <div className="bg-amber-50 border-2 border-amber-300 p-2.5 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs shadow-2xs">
                    <div className="flex items-center gap-2">
                      <AlertCircle size={15} className="text-amber-700 shrink-0" />
                      <div>
                        <span className="font-extrabold text-amber-950 block">
                          ⏳ Awaiting Buyer's Online Prepayment: ₹{Number(req.sellerAdvanceAmount || myQuote?.prepaymentAmount || 0).toLocaleString()} ({req.sellerAdvancePercentage || myQuote?.prepaymentPercentage || 0}%)
                        </span>
                        <span className="text-amber-800 text-[11px]">
                          The buyer has been prompted to pay online. Order fulfillment & packing controls will unlock once payment is verified.
                        </span>
                      </div>
                    </div>
                    <span className="bg-amber-200 text-amber-900 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                      Prepayment Pending
                    </span>
                  </div>
                ) : isPrepaymentPaid ? (
                  <div className="bg-emerald-50/70 border border-emerald-200/80 p-2.5 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <DollarSign size={14} className="text-emerald-700 shrink-0" />
                      <div>
                        <span className="font-extrabold text-emerald-950 block">
                          {isPrepaymentPaid ? (
                            <span className="text-emerald-800">✅ Online Prepayment Confirmed: ₹{Number(req.advancePaidAmount || req.sellerAdvanceAmount || myQuote?.prepaymentAmount || 0).toLocaleString()}</span>
                          ) : req.buyerAdvancePercentage ? (
                            <span>Buyer Offered Advance: <strong className="text-emerald-900">{req.buyerAdvancePercentage}%</strong>{req.buyerAdvanceAmount ? ` (₹${Number(req.buyerAdvanceAmount).toLocaleString()})` : ''}</span>
                          ) : (
                            <span>Advance Terms Specified</span>
                          )}
                        </span>
                        {isPrepaymentPaid && req.advanceTransactionId && (
                          <span className="text-emerald-800 font-mono text-[10px]">
                            Razorpay TXN: <strong>{req.advanceTransactionId}</strong>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => window.open(`${SERVER_URL}/schools/bulk-orders/${req._id || req.id || req.referenceId}/advance-receipt`, '_blank')}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-emerald-300 hover:bg-emerald-50 text-emerald-900 font-extrabold text-[11px] rounded-lg shadow-2xs transition-colors cursor-pointer"
                        title="Download Official Tax Invoice & Mobilization Advance Receipt"
                      >
                        <Download size={12} className="text-emerald-700" />
                        <span>Prepayment Invoice</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedReceiptOrder(req)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-emerald-300 hover:bg-emerald-100/60 text-emerald-900 font-extrabold text-[11px] rounded-lg shadow-2xs transition-colors cursor-pointer"
                      >
                        <FileText size={12} className="text-emerald-700" />
                        <span>Receipt View</span>
                      </button>
                    </div>
                  </div>
                ) : null}

                {/* Actions Footer with Order Processing Workflow */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => deleteSchoolOrder(req.id || req._id)}
                    className="text-gray-400 hover:text-red-600 text-xs flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Trash2 size={13} /> Remove RFQ
                  </button>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => {
                        setPreviewOrder(req);
                        setInitialPreviewTab('specs');
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-bold rounded-xl transition-colors cursor-pointer border border-purple-200"
                    >
                      <Eye size={14} />
                      <span>View Expanded Details</span>
                    </button>

                    {/* Order Processing Buttons for Seller on Accepted Orders */}
                    {isAssignedToMe && (
                      <>
                        {/* 1. If Accepted -> Advance to Packed (Gated behind prepayment) */}
                        {(!req.status || req.status === 'quote_accepted' || req.status === 'accepted' || req.status === 'assigned') && (
                          isPrepaymentPending ? (
                            <button
                              type="button"
                              disabled
                              title={`Online prepayment of ₹${Number(req.sellerAdvanceAmount || myQuote?.prepaymentAmount || 0).toLocaleString()} must be completed by buyer before packing`}
                              className="flex items-center gap-1.5 px-4 py-2 bg-gray-200 text-gray-500 text-xs font-bold rounded-xl cursor-not-allowed opacity-80"
                            >
                              <Lock size={14} />
                              <span>Prepayment Pending (₹{Number(req.sellerAdvanceAmount || myQuote?.prepaymentAmount || 0).toLocaleString()})</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => updateSchoolOrderStatus(req.id || req._id, { status: 'packed' })}
                              className="flex items-center gap-1.5 px-4 py-2 bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer font-display"
                            >
                              <Package size={14} />
                              <span>Mark as Packed</span>
                            </button>
                          )
                        )}

                        {/* 2. If Packed -> Open Self-Delivery Dispatch Modal */}
                        {isPacked && (
                          <button
                            onClick={() => {
                              setDispatchModalOrder(req);
                              setDispatchStatus(req.status || req.deliveryStatus || 'out for delivery');
                              setRiderName(req.deliveryDetails?.deliveryBoyName || '');
                              setRiderPhone(req.deliveryDetails?.deliveryBoyPhone || '');
                              setVehicleNumber(req.deliveryDetails?.vehicleNumber || '');
                              setDeliveryNotes(req.deliveryDetails?.notes || '');
                            }}
                            className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer font-display"
                          >
                            <Truck size={14} />
                            <span>Dispatch (Self Delivery)</span>
                          </button>
                        )}

                        {/* 3. If Out for Delivery -> Update Logistics */}
                        {isOutForDelivery && (
                          <button
                            type="button"
                            onClick={() => {
                              setDispatchModalOrder(req);
                              setDispatchStatus(req.status || req.deliveryStatus || 'out for delivery');
                              setRiderName(req.deliveryDetails?.deliveryBoyName || '');
                              setRiderPhone(req.deliveryDetails?.deliveryBoyPhone || '');
                              setVehicleNumber(req.deliveryDetails?.vehicleNumber || '');
                              setDeliveryNotes(req.deliveryDetails?.notes || '');
                            }}
                            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold rounded-xl border border-amber-300 shadow-2xs transition-colors cursor-pointer"
                          >
                            <Truck size={14} className="text-amber-700" />
                            <span>Update Logistics & Tracking</span>
                          </button>
                        )}

                        {/* 4. If Received or Completed */}
                        {(isReceived || isCompleted) && (
                          <span className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-100 text-emerald-900 text-xs font-black rounded-xl border border-emerald-300">
                            <CheckCircle2 size={14} className="text-emerald-700" />
                            <span>{isCompleted ? 'Fulfilled & Completed (Paid)' : 'Fulfilled & Received'}</span>
                          </span>
                        )}
                      </>
                    )}

                    {/* Unassigned order action buttons or locked indicator */}
                    {isLockedToOther ? (
                      <button
                        type="button"
                        disabled
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-200 text-gray-500 text-xs font-bold rounded-xl cursor-not-allowed opacity-80"
                      >
                        <Lock size={14} />
                        <span>Consignment Awarded & Locked</span>
                      </button>
                    ) : !isAssignedToMe ? (
                      <>
                        <button
                          onClick={() => acceptSchoolOrder(req.id || req._id)}
                          className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                        >
                          <CheckCircle2 size={14} /> Accept at Target Budget
                        </button>

                        <button
                          onClick={() => {
                            setPreviewOrder(req);
                            setInitialPreviewTab('submit_quote');
                          }}
                          className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-extrabold rounded-xl transition-colors cursor-pointer border border-emerald-300 shadow-2xs"
                        >
                          <Send size={14} />
                          <span>{hasSellerQuote ? 'Update Quotation Pitch' : 'Pitch Updated Quotation'}</span>
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* ========================================== */}
      {/* SELLER QUOTATION SUBMISSION MODAL */}
      {/* ========================================== */}
      {quotationModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 text-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div>
                <h4 className="font-bold text-gray-900 text-base">Submit School Quotation & Negotiation</h4>
                <p className="text-[11px] text-teal-800 font-bold mt-0.5">
                  {quotationModalOrder.institutionName || quotationModalOrder.schoolName}
                </p>
                {quotationModalOrder.expectedQuotationDate && (() => {
                  const target = new Date(quotationModalOrder.expectedQuotationDate);
                  if (isNaN(target.getTime())) return null;
                  const now = new Date();
                  const targetMid = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
                  const nowMid = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
                  const diffDays = Math.round((targetMid - nowMid) / (1000 * 60 * 60 * 24));
                  const isExpired = diffDays < 0;
                  const isUrgent = diffDays >= 0 && diffDays <= 2;
                  const text = diffDays > 1 ? `${diffDays} days remaining` : diffDays === 1 ? '1 day left (Ends tomorrow)' : diffDays === 0 ? 'Deadline today' : `Deadline passed (${Math.abs(diffDays)}d ago)`;

                  return (
                    <div className="mt-1 flex items-center gap-1.5 text-[11px] font-bold text-blue-800 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                      <Clock size={12} className={isExpired ? 'text-red-500' : isUrgent ? 'text-amber-600' : 'text-blue-600'} />
                      <span>Quote Deadline: {target.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} • {text}</span>
                    </div>
                  );
                })()}
              </div>
              <button onClick={() => setQuotationModalOrder(null)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitQuotationForm} className="space-y-3">
              <div className="space-y-1">
                <label className="font-semibold text-gray-700">Total Proposal Quote Amount (₹) *</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 185000"
                  value={quoteAmount}
                  onChange={(e) => {
                    setQuoteAmount(e.target.value);
                    const qty = Number(quotationModalOrder.totalQuantity || quotationModalOrder.quantity || 100);
                    if (qty > 0 && e.target.value) {
                      setUnitPrice(String(Math.round(Number(e.target.value) / qty)));
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-600 text-sm font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Unit Rate / Item (₹)</label>
                  <input
                    type="number"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                    placeholder="e.g. 1850"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Estimated Delivery Days</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={deliveryDays}
                    onChange={(e) => setDeliveryDays(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none"
                  />
                </div>
              </div>

              {/* Prepayment / Advance Payment Required by Seller */}
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-950 text-xs">
                    <DollarSign size={14} className="text-emerald-700" />
                    <span>Prepayment / Advance Required</span>
                  </div>

                  <div className="inline-flex p-0.5 bg-white border border-emerald-200 rounded-lg text-[10px]">
                    <button
                      type="button"
                      onClick={() => setPrepaymentType('percentage')}
                      className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                        prepaymentType === 'percentage'
                          ? 'bg-teal-700 text-white shadow-xs'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      % Percent
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrepaymentType('amount')}
                      className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                        prepaymentType === 'amount'
                          ? 'bg-teal-700 text-white shadow-xs'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      ₹ Amount
                    </button>
                  </div>
                </div>

                {prepaymentType === 'percentage' ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={prepaymentPercentage}
                          onChange={(e) => setPrepaymentPercentage(e.target.value)}
                          placeholder="e.g. 25"
                          className="w-full px-3 py-1.5 pr-7 bg-white rounded-lg border border-emerald-300 text-xs font-bold text-emerald-950 focus:outline-none focus:border-teal-700"
                        />
                        <span className="absolute right-2.5 top-1.5 text-gray-400 font-bold text-xs">%</span>
                      </div>
                      <div className="flex gap-1">
                        {[15, 25, 30, 50].map((pct) => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => setPrepaymentPercentage(pct)}
                            className={`px-2 py-1 rounded text-[10px] font-bold border cursor-pointer ${
                              Number(prepaymentPercentage) === pct
                                ? 'bg-emerald-700 text-white border-emerald-700'
                                : 'bg-white text-gray-700 border-emerald-200 hover:bg-emerald-100/50'
                            }`}
                          >
                            {pct}%
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <span className="absolute left-2.5 top-1.5 text-gray-400 font-bold text-xs">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={prepaymentAmount}
                      onChange={(e) => setPrepaymentAmount(e.target.value)}
                      placeholder="e.g. 50000"
                      className="w-full pl-6 pr-3 py-1.5 bg-white rounded-lg border border-emerald-300 text-xs font-bold text-emerald-950 focus:outline-none focus:border-teal-700"
                    />
                  </div>
                )}

                {/* Live Prepayment vs Balance Breakdown */}
                {(() => {
                  const total = Number(quoteAmount) || 0;
                  const advAmt = prepaymentType === 'percentage'
                    ? Math.round((total * Number(prepaymentPercentage || 0)) / 100)
                    : (Number(prepaymentAmount) || 0);
                  const balAmt = Math.max(0, total - advAmt);

                  return (
                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-emerald-200/60 text-emerald-950">
                      <div>
                        Prepayment: <strong className="font-mono text-emerald-800">₹{advAmt.toLocaleString()}</strong>
                      </div>
                      <div>
                        Balance on Delivery: <strong className="font-mono text-gray-800">₹{balAmt.toLocaleString()}</strong>
                      </div>
                    </div>
                  );
                })()}

                <input
                  type="text"
                  placeholder="Prepayment Terms (e.g. 25% advance on sample approval, balance on delivery)"
                  value={prepaymentTerms}
                  onChange={(e) => setPrepaymentTerms(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-emerald-200 text-[11px] focus:outline-none focus:border-teal-700 text-gray-800"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-gray-700">Counter Proposal / Fabric Specs Notes</label>
                <textarea
                  rows="3"
                  placeholder="Specify fabric details, GST inclusion, custom buttons, logo embroidery, or sample dispatch terms..."
                  value={quoteNotes}
                  onChange={(e) => setQuoteNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none"
                ></textarea>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setQuotationModalOrder(null)}
                  className="flex-1 py-2 font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Send size={14} />
                  <span>Submit Quotation</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Requirement Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 text-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h4 className="font-bold text-gray-900 text-base">New School Bulk Requirement</h4>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateRequirement} className="space-y-3 max-h-[75vh] overflow-y-auto">
              <div className="space-y-1">
                <label className="font-semibold text-gray-700">School / Institutional Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Modern High School, Vasant Vihar"
                  value={formData.schoolName}
                  onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Contact Person</label>
                  <input
                    type="text"
                    placeholder="Principal / Admin Officer"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Designation / Role</label>
                  <select
                    value={formData.designation || 'Partner Merchant / Seller'}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none text-xs"
                  >
                    <option value="Partner Merchant / Seller">Partner Merchant / Seller / Distributor</option>
                    <option value="Principal / Director">Principal / Director</option>
                    <option value="Procurement Lead">Procurement Lead / Store Manager</option>
                    <option value="Administrator">Administrator / Vice Principal</option>
                    <option value="Teacher / Committee Lead">Teacher / Uniform Committee Lead</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Phone</label>
                  <input
                    type="text"
                    placeholder="+91 98..."
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-gray-700">Requirement Summary</label>
                <textarea
                  rows="2"
                  placeholder="e.g. 500 sets Class 8 blazers and NCERT bulk book bundles..."
                  value={formData.requirementSummary}
                  onChange={(e) => setFormData({ ...formData, requirementSummary: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none"
                ></textarea>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Quantity</label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Budget (₹)</label>
                  <input
                    type="number"
                    value={formData.estimatedBudget}
                    onChange={(e) => setFormData({ ...formData, estimatedBudget: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Quote (₹)</label>
                  <input
                    type="number"
                    value={formData.quoteAmount}
                    onChange={(e) => setFormData({ ...formData, quoteAmount: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2 font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-xs"
                >
                  Create Requirement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Self-Delivery Dispatch Modal (Only self-delivery allowed for bulk orders) */}
      {dispatchModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 text-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-800">
                  <Truck size={20} />
                </div>
                <div>
                  <h4 className="font-extrabold text-gray-900 text-base">
                    Dispatch Order (Self-Delivery Store Fleet)
                  </h4>
                  <p className="text-[11px] text-teal-800 font-bold mt-0.5">
                    {dispatchModalOrder.institutionName || dispatchModalOrder.schoolName} ({dispatchModalOrder.referenceId})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDispatchModalOrder(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Exclusive Self Delivery Notice */}
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-amber-950">
              <ShieldCheck size={18} className="text-amber-700 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                <strong className="block text-amber-900 font-extrabold mb-0.5">
                  Exclusive Store Self-Delivery
                </strong>
                Bulk institutional orders are delivered directly by your store fleet/rider. Third-party courier delivery is disabled for B2B consignments.
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!riderName.trim() || !riderPhone.trim()) return;

                const token = `BV-SLF-${dispatchModalOrder.referenceId || dispatchModalOrder.id}`;
                updateSchoolOrderStatus(dispatchModalOrder.id || dispatchModalOrder._id, {
                  status: dispatchStatus || 'out for delivery',
                  deliveryStatus: dispatchStatus || 'out for delivery',
                  deliveryDetails: {
                    deliveryBoyName: riderName.trim(),
                    deliveryBoyPhone: riderPhone.trim(),
                    vehicleNumber: vehicleNumber.trim() || 'Store Fleet',
                    deliveryPartnerToken: token,
                    trackingId: token,
                    trackingUrl: `/#delivery-partner?token=${token}`,
                    notes: deliveryNotes.trim()
                  }
                });

                setDispatchModalOrder(null);
                setRiderName('');
                setRiderPhone('');
                setVehicleNumber('');
                setDeliveryNotes('');
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">
                    Delivery / Order Status *
                  </label>
                  <select
                    value={dispatchStatus}
                    onChange={(e) => setDispatchStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-300 text-gray-800 font-bold focus:outline-none focus:border-teal-600 text-xs"
                  >
                    <option value="quote_accepted">Quote Accepted / In Preparation</option>
                    <option value="in_production">In Production / Processing</option>
                    <option value="out for delivery">Out for Delivery</option>
                    <option value="delivered">Delivered & Completed</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">
                    Delivery Partner Mode
                  </label>
                  <input
                    type="text"
                    disabled
                    value="Self Delivery (Store Fleet / Rider)"
                    className="w-full px-3 py-2 rounded-xl bg-gray-100 border border-gray-200 text-gray-700 font-bold cursor-not-allowed text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">
                    Vehicle / Reg. Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. DL 01 AB 1234 / Store Van"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-600 font-medium text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">
                    Special Dispatch Notes / Gate Instructions
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Deliver to Admin Block Gate 2..."
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">
                    Delivery Personnel / Rider Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={riderName}
                    onChange={(e) => setRiderName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-600 font-semibold text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">
                    Rider Mobile Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9876543210"
                    value={riderPhone}
                    onChange={(e) => setRiderPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-600 font-semibold text-xs"
                  />
                </div>
              </div>

              {/* Generated Delivery Tracker Verification Link Preview */}
              {(() => {
                const modalToken = `BV-SLF-${dispatchModalOrder.referenceId || dispatchModalOrder.id}`;
                const modalTrackerUrl = `${window.location.origin.replace(':5174', ':5173')}/#delivery-partner?token=${modalToken}`;
                return (
                  <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold text-teal-950 uppercase tracking-wider flex items-center gap-1">
                        <ExternalLink size={13} className="text-teal-700" /> Delivery Tracker Verification Link:
                      </span>
                      <span className="font-mono text-[10px] font-bold bg-white text-teal-900 px-2 py-0.5 rounded border border-teal-200">
                        {modalToken}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        readOnly
                        value={modalTrackerUrl}
                        className="flex-1 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-mono text-gray-700 truncate select-all"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(modalTrackerUrl);
                          alert('📋 Delivery Tracker Verification Link copied to clipboard!');
                        }}
                        className="px-3 py-1.5 bg-white hover:bg-teal-100 text-teal-900 border border-teal-300 font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-2xs shrink-0"
                      >
                        <Copy size={12} /> Copy Link
                      </button>
                      <a
                        href={modalTrackerUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-2xs shrink-0"
                      >
                        <ExternalLink size={12} /> Preview
                      </a>
                    </div>
                    {riderPhone.trim() && (
                      <div className="pt-1">
                        <a
                          href={`https://wa.me/91${riderPhone.replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(`Hello ${riderName || 'Delivery Partner'}, here is your BookVardi live tracking & verification link for Bulk Order #${dispatchModalOrder.referenceId}:\n${modalTrackerUrl}`)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-700 hover:underline"
                        >
                          <MessageSquare size={12} /> Share Link directly via WhatsApp to Rider ({riderPhone})
                        </a>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDispatchModalOrder(null)}
                  className="px-4 py-2.5 font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl cursor-pointer text-xs"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!riderName.trim() || !riderPhone.trim()) {
                      alert('Please provide rider name and contact phone.');
                      return;
                    }
                    const token = `BV-SLF-${dispatchModalOrder.referenceId || dispatchModalOrder.id}`;
                    updateSchoolOrderStatus(dispatchModalOrder.id || dispatchModalOrder._id, {
                      status: dispatchStatus || 'out for delivery',
                      deliveryStatus: dispatchStatus || 'out for delivery',
                      deliveryDetails: {
                        deliveryBoyName: riderName.trim(),
                        deliveryBoyPhone: riderPhone.trim(),
                        vehicleNumber: vehicleNumber.trim() || 'Store Fleet',
                        deliveryPartnerToken: token,
                        trackingId: token,
                        trackingUrl: `/#delivery-partner?token=${token}`,
                        notes: deliveryNotes.trim()
                      }
                    });
                    setDispatchModalOrder(null);
                    setRiderName('');
                    setRiderPhone('');
                    setVehicleNumber('');
                    setDeliveryNotes('');
                  }}
                  className="flex-1 py-2.5 font-bold text-teal-900 bg-teal-100 hover:bg-teal-200 border border-teal-300 rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1.5 text-xs"
                >
                  <Check size={14} />
                  <span>Save Logistics & Update Tracking</span>
                </button>

                {dispatchModalOrder.status !== 'out for delivery' && (
                  <button
                    type="submit"
                    className="flex-1 py-2.5 font-bold text-white bg-teal-800 hover:bg-teal-900 rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1.5 text-xs"
                  >
                    <Truck size={14} />
                    <span>Confirm Dispatch & Out for Delivery</span>
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Expanded Bulk Order Details Preview Modal */}
      {previewOrder && (
        <BulkOrderPreviewModal
          order={previewOrder}
          onClose={() => setPreviewOrder(null)}
          userRole="seller"
          sellerUser={sellerUser}
          initialTab={initialPreviewTab}
          onSubmitQuote={(orderId, payload) => {
            submitSchoolQuote(orderId, payload);
            setPreviewOrder(null);
          }}
          onAcceptCounterDemand={(orderId, quoteId, payload) => {
            if (acceptBuyerCounterDemand) acceptBuyerCounterDemand(orderId, quoteId, payload);
            setPreviewOrder(null);
          }}
          onReviseQuote={(orderId, quoteId, payload) => {
            if (reviseSchoolQuote) reviseSchoolQuote(orderId, quoteId, payload);
            setPreviewOrder(null);
          }}
          onAcceptDirect={(orderId) => {
            acceptSchoolOrder(orderId);
            setPreviewOrder(null);
          }}
          onUpdateLogistics={(orderId, payload) => {
            updateSchoolOrderStatus(orderId, payload);
          }}
        />
      )}

      {/* Partial Advance Payment Receipt Modal */}
      {selectedReceiptOrder && (
        <PartialAdvanceReceiptModal
          isOpen={Boolean(selectedReceiptOrder)}
          onClose={() => setSelectedReceiptOrder(null)}
          order={selectedReceiptOrder}
        />
      )}

    </div>
  );
}
