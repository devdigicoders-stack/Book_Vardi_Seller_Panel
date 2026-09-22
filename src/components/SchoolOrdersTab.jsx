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
  DollarSign
} from 'lucide-react';
import { useSellerData } from '../context/SellerDataContext';

export default function SchoolOrdersTab() {
  const { schoolOrders, addSchoolOrder, acceptSchoolOrder, submitSchoolQuote, deleteSchoolOrder, sellerUser } = useSellerData();

  const [searchTerm, setSearchTerm] = useState('');
  const [channelFilter, setChannelFilter] = useState('All'); // 'All', 'Direct', 'Invited', 'Broadcast'

  // Quotation Submission Modal State
  const [quotationModalOrder, setQuotationModalOrder] = useState(null);
  const [quoteAmount, setQuoteAmount] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [deliveryDays, setDeliveryDays] = useState('7');
  const [quoteNotes, setQuoteNotes] = useState('');

  // Add Custom Requirement Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    schoolName: '',
    contactPerson: '',
    contactPhone: '',
    contactEmail: '',
    requirementSummary: '',
    quantity: 200,
    estimatedBudget: 200000,
    quoteAmount: 190000,
    deadline: '2026-10-15',
    notes: ''
  });

  // Filtered Orders for Seller
  const filteredOrders = useMemo(() => {
    const currentSellerId = sellerUser?.id || sellerUser?._id || '';

    return schoolOrders.filter((req) => {
      // Channel Filter
      let channelMatch = true;
      if (channelFilter === 'Direct') {
        channelMatch = req.assignmentMode === 'direct';
      } else if (channelFilter === 'Invited') {
        channelMatch = req.assignmentMode === 'selected';
      } else if (channelFilter === 'Broadcast') {
        channelMatch = req.assignmentMode === 'broadcast';
      }

      // Search Filter
      const query = searchTerm.toLowerCase();
      const searchMatch = 
        (req.institutionName || req.schoolName || '').toLowerCase().includes(query) ||
        (req.contactName || req.contactPerson || '').toLowerCase().includes(query) ||
        (req.requirementSummary || '').toLowerCase().includes(query) ||
        (req.city || '').toLowerCase().includes(query);

      return channelMatch && searchMatch;
    });
  }, [schoolOrders, channelFilter, searchTerm, sellerUser]);

  // Open Quote Modal
  const handleOpenQuotationModal = (order) => {
    setQuotationModalOrder(order);
    const targetBudget = Number(order.targetBudgetPerKit || order.estimatedBudget || 0);
    const qty = Number(order.totalQuantity || order.quantity || 100);

    setQuoteAmount(targetBudget ? String(targetBudget) : '');
    setUnitPrice(targetBudget && qty ? String(Math.round(targetBudget / qty)) : '');
    setDeliveryDays('7');
    setQuoteNotes('');
  };

  // Submit Quotation Proposal
  const handleSubmitQuotationForm = (e) => {
    e.preventDefault();
    if (!quotationModalOrder || !quoteAmount) return;

    submitSchoolQuote(quotationModalOrder.id || quotationModalOrder._id, {
      quoteAmount: Number(quoteAmount),
      unitPrice: Number(unitPrice) || 0,
      estimatedDeliveryDays: Number(deliveryDays) || 7,
      notes: quoteNotes
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
          <div className="text-2xl font-extrabold text-gray-900 mt-1">{schoolOrders.length}</div>
          <div className="text-[10px] text-teal-700 mt-0.5">Active bulk procurement opportunities</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
          <div className="text-[11px] font-semibold text-gray-500">Direct & Invited Orders</div>
          <div className="text-2xl font-extrabold text-blue-700 mt-1">
            {schoolOrders.filter(s => s.assignmentMode === 'direct' || s.assignmentMode === 'selected').length}
          </div>
          <div className="text-[10px] text-gray-400 mt-0.5">Targeted vendor requisitions</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
          <div className="text-[11px] font-semibold text-gray-500">Accepted / Won RFQs</div>
          <div className="text-2xl font-extrabold text-emerald-700 mt-1">
            {schoolOrders.filter(s => s.status === 'assigned' || s.status === 'quote_accepted' || s.status === 'Accepted').length}
          </div>
          <div className="text-[10px] text-emerald-600 mt-0.5">Assigned to your store</div>
        </div>
      </div>

      {/* Search & Channel Filter Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl shadow-xs border border-gray-100">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search school name, contact person, city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-teal-600"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
          {[
            { id: 'All', label: 'All RFQs', icon: <Building2 size={13} /> },
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
          filteredOrders.map((req) => {
            const hasSellerQuote = Array.isArray(req.quotations) && req.quotations.some(
              q => String(q.sellerId) === String(sellerUser?.id || sellerUser?._id)
            );
            const myQuote = hasSellerQuote ? req.quotations.find(
              q => String(q.sellerId) === String(sellerUser?.id || sellerUser?._id)
            ) : null;

            const isAssignedToMe = req.status === 'assigned' || req.status === 'quote_accepted' || req.status === 'Accepted';

            return (
              <div key={req.id || req._id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs hover:border-teal-200 transition-all space-y-4">
                
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
                      <span className="flex items-center gap-1"><Phone size={13} /> {req.contactName || req.contactPerson} ({req.contactPhone})</span>
                      <span className="flex items-center gap-1"><Mail size={13} /> {req.contactEmail}</span>
                      <span className="flex items-center gap-1 text-teal-700 font-medium"><Calendar size={13} /> Deadline: {req.targetDeliveryDate || req.deadline || 'ASAP'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      isAssignedToMe
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : hasSellerQuote
                        ? 'bg-purple-50 text-purple-800 border-purple-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}>
                      {isAssignedToMe ? 'Order Assigned to You' :
                       hasSellerQuote ? 'Your Quote Submitted' : 'RFQ Open for Quotations'}
                    </span>
                  </div>
                </div>

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
                      Target budget: ₹{Number(req.targetBudgetPerKit || req.estimatedBudget || 0).toLocaleString()}
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

                {/* Seller Quote Banner if already submitted */}
                {myQuote && (
                  <div className="bg-purple-50/80 border border-purple-200 p-3 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-purple-900">Your Submitted Quotation:</span>
                      <span className="font-extrabold text-purple-950 text-sm ml-2">₹{Number(myQuote.quoteAmount).toLocaleString()}</span>
                      <span className="text-gray-500 text-[11px] ml-2">({myQuote.estimatedDeliveryDays} days delivery)</span>
                    </div>

                    <span className="text-[11px] font-bold text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full">
                      Status: {myQuote.status === 'approved' ? 'Accepted by Admin' : 'Under Admin Review'}
                    </span>
                  </div>
                )}

                {/* Actions Footer */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => deleteSchoolOrder(req.id || req._id)}
                    className="text-gray-400 hover:text-red-600 text-xs flex items-center gap-1 transition-colors"
                  >
                    <Trash2 size={13} /> Remove RFQ
                  </button>

                  <div className="flex items-center gap-2">
                    {/* Direct Accept Button */}
                    {!isAssignedToMe && (
                      <button
                        onClick={() => acceptSchoolOrder(req.id || req._id)}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                      >
                        <CheckCircle2 size={14} /> Accept at Target Budget
                      </button>
                    )}

                    {/* Submit / Negotiate Quote Button */}
                    <button
                      onClick={() => handleOpenQuotationModal(req)}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                    >
                      <Send size={14} />
                      <span>{hasSellerQuote ? 'Update Your Quotation' : 'Submit Counter Quotation'}</span>
                    </button>
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

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Contact Person</label>
                  <input
                    type="text"
                    placeholder="Principal / Admin Officer"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Phone</label>
                  <input
                    type="text"
                    placeholder="+91 98..."
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none"
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

    </div>
  );
}
