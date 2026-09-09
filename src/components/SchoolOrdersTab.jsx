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
  DollarSign
} from 'lucide-react';
import { useSellerData } from '../context/SellerDataContext';

const STATUS_PIPELINE = [
  'Requirement Received',
  'Quotation Sent',
  'Negotiation',
  'Accepted',
  'In Production',
  'Dispatched',
  'Fulfilled'
];

export default function SchoolOrdersTab() {
  const { schoolOrders, addSchoolOrder, editSchoolOrder, deleteSchoolOrder } = useSellerData();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState(null);
  const [quoteInput, setQuoteInput] = useState('');
  const [statusInput, setStatusInput] = useState('');

  // New Institutional Req form
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

  const filteredOrders = useMemo(() => {
    return schoolOrders.filter((req) => {
      const matchesStatus = statusFilter === 'All' || req.status === statusFilter;
      const query = searchTerm.toLowerCase();
      const matchesSearch = 
        req.schoolName?.toLowerCase().includes(query) ||
        req.contactPerson?.toLowerCase().includes(query) ||
        req.requirementSummary?.toLowerCase().includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [schoolOrders, statusFilter, searchTerm]);

  const pipelineValue = useMemo(() => {
    return schoolOrders.reduce((acc, curr) => acc + (Number(curr.quoteAmount) || Number(curr.estimatedBudget) || 0), 0);
  }, [schoolOrders]);

  const handleOpenEditQuote = (req) => {
    setEditingQuote(req);
    setQuoteInput(String(req.quoteAmount || req.estimatedBudget || 0));
    setStatusInput(req.status || 'Quotation Sent');
  };

  const handleSaveQuote = (e) => {
    e.preventDefault();
    if (editingQuote) {
      editSchoolOrder(editingQuote.id, {
        quoteAmount: Number(quoteInput),
        status: statusInput
      });
      setEditingQuote(null);
    }
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
            Manage bulk tenders, uniform requisitions, and price quotations for partner schools
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
        >
          <Plus size={16} /> New Institutional Requirement
        </button>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
          <div className="text-[11px] font-semibold text-gray-500">Active School RFQs</div>
          <div className="text-2xl font-extrabold text-gray-900 mt-1">{schoolOrders.length}</div>
          <div className="text-[10px] text-teal-700 mt-0.5">Schools requiring bulk student supplies</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
          <div className="text-[11px] font-semibold text-gray-500">Pipeline Quotation Value</div>
          <div className="text-2xl font-extrabold text-teal-800 mt-1">₹{pipelineValue.toLocaleString()}</div>
          <div className="text-[10px] text-gray-400 mt-0.5">Estimated cumulative institutional order size</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
          <div className="text-[11px] font-semibold text-gray-500">Accepted & In Production</div>
          <div className="text-2xl font-extrabold text-emerald-700 mt-1">
            {schoolOrders.filter(s => s.status === 'Accepted' || s.status === 'In Production').length}
          </div>
          <div className="text-[10px] text-emerald-600 mt-0.5">Ready for dispatch to campuses</div>
        </div>
      </div>

      {/* Search & Status Filter */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl shadow-xs border border-gray-100">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search school name, contact person..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-teal-600"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
          {['All', 'Requirement Received', 'Quotation Sent', 'Negotiation', 'Accepted', 'In Production'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === st
                  ? 'bg-teal-800 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* School Orders Cards / List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-gray-100 text-gray-500">
            <Building2 size={40} className="mx-auto text-gray-300 mb-2" />
            No school requirements found matching your criteria.
          </div>
        ) : (
          filteredOrders.map((req) => (
            <div key={req.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs hover:border-teal-200 transition-all space-y-4">
              
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-teal-800 font-bold">{req.id}</span>
                    <h3 className="font-bold text-gray-900 text-base">{req.schoolName}</h3>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mt-1">
                    <span className="flex items-center gap-1"><Phone size={13} /> {req.contactPerson} ({req.contactPhone})</span>
                    <span className="flex items-center gap-1"><Mail size={13} /> {req.contactEmail}</span>
                    <span className="flex items-center gap-1 text-teal-700 font-medium"><Calendar size={13} /> Deadline: {req.deadline}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    req.status === 'Accepted'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : req.status === 'Quotation Sent'
                      ? 'bg-blue-50 text-blue-800 border-blue-200'
                      : req.status === 'Negotiation'
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-gray-100 text-gray-700 border-gray-200'
                  }`}>
                    {req.status}
                  </span>
                </div>
              </div>

              {/* Requirement details */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-50/70 p-3.5 rounded-xl text-xs">
                <div className="md:col-span-2">
                  <div className="text-gray-400 font-medium text-[11px]">Requirement Specification</div>
                  <div className="font-semibold text-gray-900 mt-0.5">{req.requirementSummary}</div>
                  {req.notes && <div className="text-[11px] text-gray-500 mt-1 italic">"{req.notes}"</div>}
                </div>

                <div>
                  <div className="text-gray-400 font-medium text-[11px]">Requested Quantity</div>
                  <div className="font-extrabold text-gray-900 text-sm mt-0.5">{req.quantity} Sets / Units</div>
                  <div className="text-[10px] text-gray-500">Target budget: ₹{Number(req.estimatedBudget).toLocaleString()}</div>
                </div>

                <div>
                  <div className="text-gray-400 font-medium text-[11px]">Quoted Proposal Amount</div>
                  <div className="font-extrabold text-teal-800 text-base mt-0.5">
                    ₹{Number(req.quoteAmount || req.estimatedBudget).toLocaleString()}
                  </div>
                  <div className="text-[10px] text-emerald-600 font-medium">GST & Freight Included</div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => deleteSchoolOrder(req.id)}
                  className="text-gray-400 hover:text-red-600 text-xs flex items-center gap-1 transition-colors"
                >
                  <Trash2 size={13} /> Remove RFQ
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEditQuote(req)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold rounded-xl transition-colors"
                  >
                    <Edit3 size={13} /> Update Quotation & Status
                  </button>
                </div>
              </div>

            </div>
          ))
        )}
      </div>

      {/* Edit Quotation Modal */}
      {editingQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 text-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div>
                <h4 className="font-bold text-gray-900 text-base">Update School Quotation</h4>
                <p className="text-[11px] text-gray-500">{editingQuote.schoolName}</p>
              </div>
              <button onClick={() => setEditingQuote(null)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveQuote} className="space-y-3">
              <div className="space-y-1">
                <label className="font-semibold text-gray-700">Proposal Quotation Amount (₹)</label>
                <input
                  type="number"
                  required
                  value={quoteInput}
                  onChange={(e) => setQuoteInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-600 text-sm font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-gray-700">Current Pipeline Status</label>
                <select
                  value={statusInput}
                  onChange={(e) => setStatusInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-600"
                >
                  {STATUS_PIPELINE.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingQuote(null)}
                  className="flex-1 py-2 font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-xs"
                >
                  Save Changes
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
