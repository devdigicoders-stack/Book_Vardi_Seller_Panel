import React, { useState, useMemo } from 'react';
import {
  Boxes,
  Plus,
  Search,
  Filter,
  Edit3,
  Trash2,
  Eye,
  CheckCircle,
  AlertCircle,
  Clock,
  Layers,
  Tag,
  ShieldCheck,
  TrendingDown,
  X,
  Package,
  Power
} from 'lucide-react';
import { useSellerData } from '../context/SellerDataContext';
import SellerKitFormPage from './SellerKitFormPage';
import { resolveImageUrl } from '../utils/mediaUrl';

export default function KitsTab() {
  const {
    kits = [],
    isLoadingKits,
    products = [],
    addKit,
    editKit,
    deleteKit,
    toggleKitStatus,
    showToast
  } = useSellerData();

  // Page view mode: 'catalog' | 'form'
  const [viewMode, setViewMode] = useState('catalog');
  const [editingKit, setEditingKit] = useState(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('all');
  const [approvalFilter, setApprovalFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Preview Modal
  const [selectedKitForDetail, setSelectedKitForDetail] = useState(null);
  const [deletingKitId, setDeletingKitId] = useState(null);

  // Schools list derived from existing kits
  const schoolList = useMemo(() => {
    const set = new Set();
    kits.forEach(k => {
      if (k.schoolName) set.add(k.schoolName.trim());
    });
    return Array.from(set);
  }, [kits]);

  // Filtered Kits
  const filteredKits = useMemo(() => {
    return kits.filter(k => {
      const title = (k.title || k.name || '').toLowerCase();
      const school = (k.schoolName || '').toLowerCase();
      const sku = (k.sku || '').toLowerCase();
      const query = searchTerm.toLowerCase();

      const matchesSearch = !query || title.includes(query) || school.includes(query) || sku.includes(query);
      const matchesSchool = schoolFilter === 'all' || (k.schoolName && k.schoolName.trim() === schoolFilter);
      const kitApproval = k.approvalStatus || (k.isApproved ? 'Approved' : 'Pending');
      const matchesApproval = approvalFilter === 'all' || kitApproval.toLowerCase() === approvalFilter.toLowerCase();
      const matchesStatus = statusFilter === 'all' || (k.status || 'available') === statusFilter;

      return matchesSearch && matchesSchool && matchesApproval && matchesStatus;
    });
  }, [kits, searchTerm, schoolFilter, approvalFilter, statusFilter]);

  // Metrics
  const metrics = useMemo(() => {
    const total = kits.length;
    const active = kits.filter(k => k.status === 'available').length;
    const pending = kits.filter(k => (k.approvalStatus || (k.isApproved ? 'Approved' : 'Pending')).toLowerCase() === 'pending').length;
    const totalValue = kits.reduce((sum, k) => sum + (Number(k.bundlePrice || k.price || 0) * (Number(k.stock || 0))), 0);
    return { total, active, pending, totalValue };
  }, [kits]);

  // Handlers
  const handleOpenAdd = () => {
    setEditingKit(null);
    setViewMode('form');
  };

  const handleOpenEdit = (kitItem) => {
    setEditingKit(kitItem);
    setViewMode('form');
  };

  // Listen for global open events to create kit bundles from any tab
  React.useEffect(() => {
    const handleOpen = () => handleOpenAdd();
    window.addEventListener('openAddKitModal', handleOpen);
    window.addEventListener('openAddKitModalInternal', handleOpen);
    window.addEventListener('openKitsTabAdd', handleOpen);
    return () => {
      window.removeEventListener('openAddKitModal', handleOpen);
      window.removeEventListener('openAddKitModalInternal', handleOpen);
      window.removeEventListener('openKitsTabAdd', handleOpen);
    };
  }, []);

  const handleSaveKit = async (payload) => {
    try {
      if (editingKit) {
        await editKit(editingKit.id || editingKit._id, payload);
      } else {
        await addKit(payload);
      }
      setViewMode('catalog');
      setEditingKit(null);
    } catch (err) {
      throw err;
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingKitId) return;
    try {
      await deleteKit(deletingKitId);
      setDeletingKitId(null);
    } catch (err) {
      console.error(err);
    }
  };

  if (viewMode === 'form') {
    return (
      <SellerKitFormPage
        kit={editingKit}
        existingProducts={products}
        onSave={handleSaveKit}
        onBack={() => {
          setViewMode('catalog');
          setEditingKit(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6 pb-16">
      
      {/* Top Banner & Header */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-teal-50 text-brand-teal">
              <Boxes size={22} />
            </span>
            <div>
              <h1 className="text-xl font-display font-black text-gray-900">
                School Kits & Package Bundles
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Manage bundled uniform sets, book packs, and stationery kits with package discounts.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="px-5 py-2.5 bg-brand-teal hover:bg-brand-teal-light text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus size={16} /> + Create Kit Bundle
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
          <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Total Kits</div>
          <div className="text-2xl font-black text-gray-900 mt-1">{metrics.total}</div>
          <div className="text-[10px] text-gray-400 mt-1">Configured in store</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
          <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Active & Available</div>
          <div className="text-2xl font-black text-emerald-800 mt-1">{metrics.active}</div>
          <div className="text-[10px] text-emerald-600 mt-1">Live for parents to buy</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
          <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Pending Review</div>
          <div className="text-2xl font-black text-amber-800 mt-1">{metrics.pending}</div>
          <div className="text-[10px] text-amber-600 mt-1">Awaiting admin check</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
          <div className="text-[11px] font-bold text-teal-800 uppercase tracking-wider">Total Inventory Value</div>
          <div className="text-2xl font-black text-teal-950 mt-1">₹{metrics.totalValue.toLocaleString('en-IN')}</div>
          <div className="text-[10px] text-teal-700 mt-1">In assembled stock</div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3.5 top-3 text-gray-400" size={15} />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search kits by title, school, or SKU..."
            className="w-full pl-9 pr-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-brand-teal focus:bg-white"
          />
        </div>

        {/* School Filter */}
        <select
          value={schoolFilter}
          onChange={e => setSchoolFilter(e.target.value)}
          className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none cursor-pointer"
        >
          <option value="all">All Schools ({kits.length})</option>
          {schoolList.map(sch => (
            <option key={sch} value={sch}>{sch}</option>
          ))}
        </select>

        {/* Approval Filter */}
        <select
          value={approvalFilter}
          onChange={e => setApprovalFilter(e.target.value)}
          className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none cursor-pointer"
        >
          <option value="all">All Approvals</option>
          <option value="Approved">Approved</option>
          <option value="Pending">Pending Review</option>
          <option value="Rejected">Rejected</option>
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none cursor-pointer"
        >
          <option value="all">All Statuses</option>
          <option value="available">Available</option>
          <option value="inactive">Inactive</option>
          <option value="out-of-stock">Out of Stock</option>
        </select>
      </div>

      {/* Kits Table List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        {isLoadingKits ? (
          <div className="p-12 text-center text-xs text-gray-500 font-bold">
            Loading your kit catalog...
          </div>
        ) : filteredKits.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Boxes size={40} className="mx-auto text-gray-300" />
            <h3 className="font-extrabold text-sm text-gray-800">No Kit Bundles Found</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              {searchTerm || schoolFilter !== 'all' || approvalFilter !== 'all'
                ? 'No kits match your current filters. Try resetting the search filters.'
                : 'Create your first package bundle by combining uniforms, books, or stationery kits with attractive bundle savings.'}
            </p>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="px-4 py-2 bg-brand-teal text-white rounded-xl text-xs font-bold cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus size={14} /> + Create New Kit
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-500 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Kit Package</th>
                  <th className="px-4 py-3.5">School & Grade</th>
                  <th className="px-4 py-3.5">Items Inside</th>
                  <th className="px-4 py-3.5">Bundle Pricing</th>
                  <th className="px-4 py-3.5">Stock</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {filteredKits.map((item) => {
                  const kitImg = item.images?.[0] || item.image || '';
                  const totalMrp = Number(item.totalMrp || item.originalPrice || item.mrp || 0);
                  const bundlePrice = Number(item.bundlePrice || item.price || 0);
                  const savings = Math.max(0, totalMrp - bundlePrice);
                  const discount = totalMrp > 0 ? Math.round((savings / totalMrp) * 100) : 0;
                  const itemsCount = Array.isArray(item.items) ? item.items.length : 0;
                  const isAvailable = item.status === 'available';

                  return (
                    <tr key={item.id || item._id} className="hover:bg-gray-50/60 transition-colors">
                      {/* Kit Column */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-gray-100 shrink-0 border border-gray-200 overflow-hidden flex items-center justify-center">
                            {kitImg ? (
                              <img src={resolveImageUrl(kitImg)} alt={item.title || item.name} className="w-full h-full object-cover" />
                            ) : (
                              <Boxes size={20} className="text-gray-400" />
                            )}
                          </div>
                          <div>
                            <div className="font-extrabold text-gray-900 line-clamp-1">{item.title || item.name}</div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {item.badgeTag && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded font-black bg-teal-50 text-brand-teal uppercase border border-teal-200">
                                  {item.badgeTag}
                                </span>
                              )}
                              {item.sku && (
                                <span className="text-[10px] text-gray-400 font-mono">
                                  {item.sku}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* School & Grade */}
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-gray-900">{item.schoolName || 'Any School'}</div>
                        <div className="text-[11px] text-gray-500 mt-0.5">
                          {item.classGrade || 'All Classes'} • {item.gender || 'Unisex'}
                        </div>
                      </td>

                      {/* Items Inside */}
                      <td className="px-4 py-3.5">
                        <button
                          type="button"
                          onClick={() => setSelectedKitForDetail(item)}
                          className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-[11px] font-bold cursor-pointer inline-flex items-center gap-1"
                        >
                          <Boxes size={12} className="text-brand-teal" />
                          <span>{itemsCount} {itemsCount === 1 ? 'Article' : 'Articles'}</span>
                        </button>
                      </td>

                      {/* Pricing */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-extrabold text-sm text-gray-900">₹{bundlePrice}</span>
                          {totalMrp > bundlePrice && (
                            <span className="text-[11px] text-gray-400 line-through">₹{totalMrp}</span>
                          )}
                        </div>
                        {savings > 0 && (
                          <div className="text-[10px] font-bold text-emerald-700 mt-0.5">
                            Save ₹{savings} ({discount}% OFF)
                          </div>
                        )}
                      </td>

                      {/* Stock */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col gap-1 items-start">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 ${
                            (Number(item.stock || 0)) > 5
                              ? 'bg-emerald-50 text-emerald-700'
                              : (Number(item.stock || 0)) > 0
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-red-50 text-red-700'
                          }`}>
                            {item.inventoryMode === 'fixed' || (Number(item.independentStock || 0) > 0) ? (
                              <>
                                <span>📦 {item.stock || 0}</span>
                                <span className="text-[9px] font-medium text-emerald-600">(Independent)</span>
                              </>
                            ) : (
                              <>
                                <span>⚡ {item.stock || 0}</span>
                                <span className="text-[9px] font-medium text-blue-600">(Auto-Dynamic)</span>
                              </>
                            )}
                          </span>
                        </div>
                      </td>

                      {/* Status & Catalog Approval */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col gap-1 items-start">
                          <button
                            type="button"
                            onClick={() => toggleKitStatus(item.id || item._id)}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase transition-all cursor-pointer flex items-center gap-1 ${
                              isAvailable
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                            title="Click to toggle availability"
                          >
                            <Power size={10} />
                            {isAvailable ? 'Active' : 'Inactive'}
                          </button>

                          {/* Approval Status */}
                          {(() => {
                            const displayApproval = item.approvalStatus || (item.isApproved ? 'Approved' : 'Pending');
                            const isApp = displayApproval.toLowerCase() === 'approved';
                            const isRej = displayApproval.toLowerCase() === 'rejected';
                            return (
                              <span
                                title={isApp ? "Live in public catalog" : "Catalog visibility pending Admin review"}
                                className={`text-[9px] px-2 py-0.5 rounded-full font-extrabold flex items-center gap-1 ${
                                  isApp
                                    ? 'text-teal-800 bg-teal-50 border border-teal-200'
                                    : isRej
                                    ? 'text-red-700 bg-red-50 border border-red-200'
                                    : 'text-amber-800 bg-amber-50 border border-amber-200'
                                }`}
                              >
                                {isApp ? '✓ Catalog Live' : isRej ? '✕ Rejected' : '⏳ Pending Admin Review'}
                              </span>
                            );
                          })()}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right space-x-1 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedKitForDetail(item)}
                          className="p-1.5 text-gray-500 hover:text-brand-teal hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                          title="View Kit Details"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 text-gray-500 hover:text-brand-teal hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                          title="Edit Kit"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingKitId(item.id || item._id)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Kit"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: Kit Detail Breakdown */}
      {selectedKitForDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 max-h-[85vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Boxes className="text-brand-teal" size={18} />
                <h3 className="font-display font-extrabold text-base text-gray-900">
                  Kit Bundle Breakdown
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedKitForDetail(null)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-full cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div>
              <h4 className="font-extrabold text-sm text-gray-900">{selectedKitForDetail.title || selectedKitForDetail.name}</h4>
              <div className="text-xs text-gray-500 mt-0.5">
                {selectedKitForDetail.schoolName} • {selectedKitForDetail.classGrade}
              </div>
            </div>

            {/* Catalog Visibility & Approval Alert */}
            {(() => {
              const displayApproval = selectedKitForDetail.approvalStatus || (selectedKitForDetail.isApproved ? 'Approved' : 'Pending');
              const isApp = displayApproval.toLowerCase() === 'approved';
              const isRej = displayApproval.toLowerCase() === 'rejected';

              return (
                <div className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                  isApp
                    ? 'bg-teal-50 border-teal-200 text-teal-800'
                    : isRej
                    ? 'bg-red-50 border-red-200 text-red-800'
                    : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}>
                  <div>
                    <span className="font-extrabold uppercase tracking-wide text-[10px] block">
                      Catalog Visibility Status
                    </span>
                    <span className="text-[11px]">
                      {isApp
                        ? 'Visible to public shoppers across school stores.'
                        : isRej
                        ? 'Rejected by Administrator. Please review comments and update details.'
                        : 'Pending review by Administrator. Hidden from public catalog until approved.'}
                    </span>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full font-black text-[10px] whitespace-nowrap ${
                    isApp ? 'bg-teal-600 text-white' : isRej ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'
                  }`}>
                    {displayApproval}
                  </span>
                </div>
              );
            })()}

            {/* Bundle Stock Availability Mode */}
            <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase text-gray-500">
                  Bundle Stock Mode
                </span>
                <span className="text-xs font-black text-gray-900">
                  {selectedKitForDetail.stock || 0} Units Available
                </span>
              </div>
              {selectedKitForDetail.inventoryMode === 'fixed' || (Number(selectedKitForDetail.independentStock || 0) > 0) ? (
                <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1.5">
                  <span>📦</span>
                  <span><strong>Independent Stock:</strong> Fixed pool of pre-packed bundles ready in warehouse.</span>
                </p>
              ) : (
                <p className="text-[11px] text-blue-700 font-semibold flex items-center gap-1.5">
                  <span>⚡</span>
                  <span><strong>Auto-Dynamic Stock:</strong> Synchronized automatically with availability of individual articles.</span>
                </p>
              )}
            </div>

            {/* Included Items */}
            <div className="space-y-2">
              <h5 className="text-[11px] font-black uppercase tracking-wider text-gray-400">
                Included Articles ({Array.isArray(selectedKitForDetail.items) ? selectedKitForDetail.items.length : 0})
              </h5>
              <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden bg-gray-50/50">
                {(selectedKitForDetail.items || []).map((it, idx) => (
                  <div key={idx} className="p-2.5 bg-white flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-gray-900">{it.name || it.title}</div>
                      {it.size && <div className="text-[10px] text-brand-teal">Size: {it.size}</div>}
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900">Qty: {it.quantity || 1}</div>
                      <div className="text-[11px] text-gray-500">₹{it.unitPrice || it.price} each</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing Summary */}
            <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-between text-xs">
              <div>
                <span className="text-gray-500">Total Separately:</span>
                <span className="line-through text-gray-400 ml-1 font-bold">₹{selectedKitForDetail.totalMrp}</span>
              </div>
              <div>
                <span className="font-bold text-teal-900">Bundle Price:</span>
                <span className="font-black text-sm text-emerald-800 ml-1">₹{selectedKitForDetail.bundlePrice}</span>
              </div>
            </div>

            {/* Tax Info (Inherited from products) */}
            <div className="text-[10px] text-gray-400 italic text-center">
              GST is applied directly from constituent products (no extra kit-level surcharge).
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedKitForDetail(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold cursor-pointer hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Delete Confirmation */}
      {deletingKitId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-gray-200 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 size={22} />
            </div>
            <div>
              <h3 className="font-bold text-base text-gray-900">Delete Kit Bundle?</h3>
              <p className="text-xs text-gray-500 mt-1">
                Are you sure you want to remove this kit package from your merchant store?
              </p>
            </div>
            <div className="flex items-center gap-2 justify-center pt-2">
              <button
                type="button"
                onClick={() => setDeletingKitId(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs"
              >
                Yes, Delete Kit
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
