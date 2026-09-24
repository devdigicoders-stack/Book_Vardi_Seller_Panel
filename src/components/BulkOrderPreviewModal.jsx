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
  AlertCircle
} from 'lucide-react';

export default function BulkOrderPreviewModal({
  order,
  onClose,
  userRole = 'seller', // 'consumer' | 'admin' | 'seller'
  sellers = [], // List of verified sellers for admin distribution
  onDistribute, // (orderId, { assignmentMode, sellerId, invitedSellerIds }) => void
  onApproveQuote, // (orderId, quoteId) => void
  onSubmitQuote, // (orderId, { quoteAmount, unitPrice, estimatedDeliveryDays, notes }) => void
  onAcceptDirect, // (orderId) => void
  sellerUser = null // Current seller info when userRole === 'seller'
}) {
  if (!order) return null;

  // Active Lightbox / Image Preview
  const [zoomImage, setZoomImage] = useState(null);

  // Active Tab inside modal
  const [modalSubTab, setModalSubTab] = useState('specs'); // 'specs', 'distribution', 'quotes', 'submit_quote'

  // Admin Distribution State
  const [distributeMode, setDistributeMode] = useState(order.assignmentMode || 'direct');
  const [selectedSingleSeller, setSelectedSingleSeller] = useState(
    order.sellerId ? (order.sellerId._id || order.sellerId.id || order.sellerId) : ''
  );
  const [selectedMultipleSellers, setSelectedMultipleSellers] = useState(
    (order.invitedSellerIds || []).map(s => (typeof s === 'object' ? (s._id || s.id) : s))
  );
  const [sellerSearchQuery, setSellerSearchQuery] = useState('');

  // Seller Quotation State
  const currentSellerId = sellerUser?.id || sellerUser?._id || '';
  const existingSellerQuote = Array.isArray(order.quotations)
    ? order.quotations.find(q => String(q.sellerId) === String(currentSellerId))
    : null;

  const targetBudgetNum = Number(order.targetBudgetPerKit || order.estimatedBudget || 0);
  const totalQtyNum = Number(
    order.totalQuantity ||
    order.quantity ||
    (Array.isArray(order.requirements) ? order.requirements.reduce((s, r) => s + Number(r.quantity || 0), 0) : 100)
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

  // Keep state updated when order changes
  useEffect(() => {
    if (order) {
      setDistributeMode(order.assignmentMode || 'direct');
      setSelectedSingleSeller(order.sellerId ? (order.sellerId._id || order.sellerId.id || order.sellerId) : '');
      setSelectedMultipleSellers(
        (order.invitedSellerIds || []).map(s => (typeof s === 'object' ? (s._id || s.id) : s))
      );
    }
  }, [order]);

  // Normalization Helpers
  const refId = order.referenceId || order.id || `SCH-${order._id}`;
  const instName = order.institutionName || order.schoolName || 'School / College';
  const instType = order.institutionType || 'Educational Institution';
  const schId = order.schoolId || '';

  const contactName = order.contactName || order.contactPerson || 'Purchaser Contact';
  const contactPhone = order.contactPhone || 'N/A';
  const contactEmail = order.contactEmail || 'N/A';
  const designation = order.designation || 'Administrator';

  const address = order.address || order.addressLine || 'N/A';
  const city = order.city || 'Delhi';
  const state = order.state || 'Delhi';
  const pincode = order.pincode || '';

  const requirementsList = Array.isArray(order.requirements) && order.requirements.length > 0
    ? order.requirements
    : [
        {
          category: 'Bulk Procurement',
          itemName: order.requirementSummary || order.additionalNotes || 'Bulk School Uniform & Stationery',
          quantity: totalQtyNum,
          sampleImage: '',
          notes: order.additionalNotes || ''
        }
      ];

  const winningQuote = Array.isArray(order.quotations)
    ? order.quotations.find(q => q.status === 'approved' || String(q._id) === String(order.acceptedQuoteId))
    : null;

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

  const handleSellerQuoteSubmit = (e) => {
    e.preventDefault();
    if (!onSubmitQuote || !quoteAmount) return;

    onSubmitQuote(order.id || order._id, {
      quoteAmount: Number(quoteAmount),
      unitPrice: Number(unitPrice) || 0,
      estimatedDeliveryDays: Number(deliveryDays) || 7,
      notes: quoteNotes
    });

    setModalSubTab('specs');
  };

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

            {/* Vendor Quotes Tab */}
            <button
              onClick={() => setModalSubTab('quotes')}
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                modalSubTab === 'quotes'
                  ? 'bg-purple-800 text-white shadow-xs'
                  : 'bg-white border border-gray-200 text-purple-800 hover:bg-purple-50'
              }`}
            >
              <Sparkles size={14} />
              <span>Vendor Quotations ({order.quotations?.length || 0})</span>
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
                <span>{existingSellerQuote ? 'Update Your Quote' : 'Submit Counter Quote'}</span>
              </button>
            )}
          </div>

          <span className="text-[11px] text-gray-400 font-mono hidden sm:inline-block">
            Created: {new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-gray-800 flex-1">
          
          {/* TAB 1: FULL EXPANDED SPECIFICATIONS */}
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
                  <div className="text-sm font-bold text-gray-900">{contactName} ({designation})</div>
                  <div className="flex items-center gap-3 text-gray-700">
                    <span className="flex items-center gap-1 font-semibold"><Phone size={13} className="text-gray-400" /> {contactPhone}</span>
                    <span className="flex items-center gap-1"><Mail size={13} className="text-gray-400" /> {contactEmail}</span>
                  </div>
                </div>
              </div>

              {/* Delivery School Address Card */}
              <div className="bg-purple-50/60 p-4 rounded-2xl border border-purple-200 space-y-1">
                <h3 className="font-extrabold text-xs text-purple-900 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                  <MapPin size={15} /> Campus Delivery Address & Location
                </h3>
                <div className="font-bold text-gray-900 text-xs">{address}</div>
                <div className="text-gray-700">
                  {city}, {state} - <strong className="font-mono text-gray-900">{pincode || '226001'}</strong>
                </div>
              </div>

              {/* Demanded Line Items Table with Sample Photos */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-xs text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Package size={15} className="text-teal-700" /> Demanded Line Items ({requirementsList.length})
                  </h3>

                  <span className="font-extrabold text-xs text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
                    Total Quantity: {totalQtyNum} Units
                  </span>
                </div>

                <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-teal-800 text-white text-[11px] uppercase tracking-wider font-extrabold">
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3">Category & Title</th>
                        <th className="py-2.5 px-3 text-center">Quantity</th>
                        <th className="py-2.5 px-3 text-center">Sample Photo</th>
                        <th className="py-2.5 px-3">Specifications & Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-xs">
                      {requirementsList.map((item, idx) => (
                        <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                          <td className="py-3 px-3 font-bold text-gray-500">{idx + 1}</td>
                          <td className="py-3 px-3">
                            <div className="font-bold text-gray-900">{item.itemName}</div>
                            <div className="text-[10px] text-teal-700 font-semibold">{item.category}</div>
                          </td>
                          <td className="py-3 px-3 text-center font-extrabold text-gray-900">{item.quantity} Units</td>
                          <td className="py-3 px-3 text-center">
                            {item.sampleImage ? (
                              <div
                                onClick={() => setZoomImage(item.sampleImage)}
                                className="relative w-12 h-12 rounded-xl overflow-hidden border border-gray-300 mx-auto cursor-pointer group shadow-2xs"
                                title="Click to expand sample photo"
                              >
                                <img src={item.sampleImage} alt="Sample" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                                  <Eye size={14} />
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-[10px]">None Attached</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-gray-600 text-[11px] max-w-xs">{item.notes || 'Standard specifications'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Customization & Budget Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-200">
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
                  <span className="text-gray-400 font-semibold text-[11px] uppercase block">Target Budget Per Kit</span>
                  <div className="font-extrabold text-teal-800 text-sm mt-0.5">
                    {targetBudgetNum > 0 ? `₹${targetBudgetNum.toLocaleString()}` : 'Not Specified (Open to Quotes)'}
                  </div>
                </div>

                {order.additionalNotes && (
                  <div className="sm:col-span-3 pt-2 border-t border-gray-200">
                    <span className="text-gray-400 font-semibold text-[11px] uppercase block mb-1">Additional Tender Notes</span>
                    <p className="text-gray-800 bg-white p-3 rounded-xl border border-gray-200 leading-relaxed">{order.additionalNotes}</p>
                  </div>
                )}
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

              {/* Approved Winning Quotation Banner if present */}
              {winningQuote && (
                <div className="bg-emerald-50 border border-emerald-300 p-4 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-emerald-900 flex items-center gap-1.5 text-sm">
                      <CheckCircle2 size={18} className="text-emerald-600" /> Approved & Winning Vendor Quotation
                    </span>
                    <span className="font-extrabold text-lg text-emerald-950">
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
                      <div className="col-span-2 sm:col-span-3 text-gray-700 italic border-t border-gray-100 pt-1.5 mt-1">
                        "{winningQuote.notes}"
                      </div>
                    )}
                  </div>
                </div>
              )}

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
          {modalSubTab === 'quotes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-purple-950 flex items-center gap-1.5">
                  <Sparkles size={16} className="text-purple-600" /> Submitted Seller Quotations & Counter Proposals
                </h3>
                <span className="text-xs text-gray-500 font-bold">
                  Target Budget: ₹{targetBudgetNum ? targetBudgetNum.toLocaleString() : 'N/A'}
                </span>
              </div>

              {(!order.quotations || order.quotations.length === 0) ? (
                <div className="p-10 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-300 text-gray-400">
                  <FileText size={36} className="mx-auto mb-2 text-gray-300" />
                  <div className="font-bold text-gray-700 text-sm">No Seller Quotations Submitted Yet</div>
                  <p className="text-xs text-gray-500 mt-1">
                    Once vendors submit proposals, counter prices and delivery terms will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {order.quotations.map(quote => {
                    const qId = quote._id || quote.id;
                    const isApproved = quote.status === 'approved' || String(order.acceptedQuoteId) === String(qId);

                    return (
                      <div
                        key={qId}
                        className={`p-4 rounded-2xl border transition-all space-y-3 ${
                          isApproved ? 'bg-emerald-50/80 border-emerald-300 shadow-xs' : 'bg-white border-gray-200 hover:border-purple-300'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-extrabold text-sm text-gray-900">
                              {quote.sellerStoreName || quote.sellerName}
                            </div>
                            <div className="text-xs text-gray-500 flex items-center gap-3 mt-0.5">
                              <span>Phone: <strong>{quote.sellerPhone}</strong></span>
                              <span>City: <strong>{quote.sellerCity}</strong></span>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="font-extrabold text-base text-teal-800">
                              ₹{Number(quote.quoteAmount).toLocaleString()}
                            </div>
                            <div className="text-[10px] text-gray-400">
                              ₹{quote.unitPrice || Math.round(quote.quoteAmount / totalQtyNum)} / unit
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                          <div>
                            <span className="text-gray-400 font-medium">Est. Delivery:</span>
                            <span className="font-bold text-gray-800 ml-1">{quote.estimatedDeliveryDays || 7} Days</span>
                          </div>
                          <div>
                            <span className="text-gray-400 font-medium">Submitted On:</span>
                            <span className="font-bold text-gray-800 ml-1">
                              {new Date(quote.submittedAt || Date.now()).toLocaleDateString('en-IN')}
                            </span>
                          </div>
                          {quote.notes && (
                            <div className="col-span-2 text-gray-700 italic border-t border-gray-200/60 pt-1 mt-0.5">
                              "{quote.notes}"
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          {isApproved ? (
                            <span className="text-xs font-extrabold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full flex items-center gap-1 border border-emerald-200">
                              <CheckCircle2 size={14} /> Approved & Winning Seller Quote
                            </span>
                          ) : (
                            <span className="text-[11px] text-gray-400">Status: {quote.status}</span>
                          )}

                          {userRole === 'admin' && !isApproved && onApproveQuote && (
                            <button
                              onClick={() => onApproveQuote(order.id || order._id, qId)}
                              className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                            >
                              Approve Quote & Assign
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SELLER SUBMIT / UPDATE QUOTATION FORM */}
          {modalSubTab === 'submit_quote' && userRole === 'seller' && (
            <div className="bg-white p-5 rounded-2xl border border-emerald-200 space-y-4">
              <div>
                <h3 className="font-extrabold text-base text-gray-900">
                  {existingSellerQuote ? 'Update Your Proposal Quotation' : 'Submit Counter Proposal Quotation'}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Input your total contract proposal quote amount, per-unit rate, and delivery lead time for school evaluation.
                </p>
              </div>

              <form onSubmit={handleSellerQuoteSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Total Proposal Quote Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 185000"
                    value={quoteAmount}
                    onChange={(e) => {
                      setQuoteAmount(e.target.value);
                      if (totalQtyNum > 0 && e.target.value) {
                        setUnitPrice(String(Math.round(Number(e.target.value) / totalQtyNum)));
                      }
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-600 text-sm font-bold"
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
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none text-xs"
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
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Proposal & Specification Notes</label>
                  <textarea
                    rows="3"
                    placeholder="Specify fabric details, GST terms, logo embroidery inclusions, or sample dispatch date..."
                    value={quoteNotes}
                    onChange={(e) => setQuoteNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none text-xs"
                  ></textarea>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalSubTab('specs')}
                    className="flex-1 py-2.5 font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl cursor-pointer"
                  >
                    Back to Specifications
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Send size={15} />
                    <span>Submit Quotation</span>
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
            {userRole === 'seller' && onAcceptDirect && order.status !== 'quote_accepted' && (
              <button
                onClick={() => {
                  onAcceptDirect(order.id || order._id);
                  onClose();
                }}
                className="flex-1 sm:flex-initial px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1"
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

    </div>
  );
}
