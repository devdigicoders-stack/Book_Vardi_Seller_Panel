import React, { useState, useMemo } from 'react';
import { 
  Box, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  UploadCloud, 
  Download, 
  Plus, 
  Minus, 
  RefreshCw,
  TrendingDown,
  Edit3,
  Trash2,
  Check,
  X,
  AlertCircle,
  Save
} from 'lucide-react';
import { useSellerData } from '../context/SellerDataContext';
import { resolveImageUrl } from '../utils/mediaUrl';
import BulkUpdateModal from './BulkUpdateModal';

export default function InventoryTab() {
  const { products, updateProductStock, editProduct, deleteProduct } = useSellerData();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all | low | out | healthy
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [stockInputs, setStockInputs] = useState({});
  const [feedback, setFeedback] = useState({});

  // Editing & Deleting product state
  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingProductId, setDeletingProductId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    subtitle: '',
    category: 'uniforms',
    price: '',
    originalPrice: '',
    discountBadge: '',
    stockQuantity: 50,
    sizes: 'S, M, L',
    colors: 'Navy Blue',
    gender: 'Unisex',
    image: '',
    description: '',
    sku: ''
  });

  // Summary Metrics
  const metrics = useMemo(() => {
    let totalUnits = 0;
    let lowCount = 0;
    let outCount = 0;

    products.forEach((p) => {
      const qty = p.stockQuantity ?? (p.inStock ? 50 : 0);
      totalUnits += qty;
      if (qty <= 0) outCount++;
      else if (qty <= 15) lowCount++;
    });

    return {
      totalSkus: products.length,
      totalUnits,
      lowCount,
      outCount,
      healthyCount: products.length - lowCount - outCount
    };
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const qty = p.stockQuantity ?? (p.inStock ? 50 : 0);
      const matchesSearch = 
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchTerm.toLowerCase());

      let matchesFilter = true;
      if (filterType === 'low') matchesFilter = qty > 0 && qty <= 15;
      if (filterType === 'out') matchesFilter = qty <= 0;
      if (filterType === 'healthy') matchesFilter = qty > 15;

      return matchesSearch && matchesFilter;
    });
  }, [products, searchTerm, filterType]);

  const handleStockChange = (id, val) => {
    setStockInputs((prev) => ({ ...prev, [id]: val }));
  };

  const handleCancelEditStock = (id) => {
    setStockInputs((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const handleApplyStock = (id) => {
    const rawVal = stockInputs[id];
    if (rawVal === undefined || rawVal === '') return;
    const num = Math.max(0, parseInt(rawVal, 10) || 0);
    updateProductStock(id, num);
    // Clear input after save so buttons return to Edit/Delete
    setStockInputs((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setFeedback((prev) => ({ ...prev, [id]: 'Saved!' }));
    setTimeout(() => {
      setFeedback((prev) => ({ ...prev, [id]: null }));
    }, 1500);
  };

  const handleQuickAdd = (id, currentQty, delta) => {
    const nextVal = Math.max(0, currentQty + delta);
    updateProductStock(id, nextVal);
    setFeedback((prev) => ({ ...prev, [id]: `${delta > 0 ? '+' : ''}${delta}` }));
    setTimeout(() => {
      setFeedback((prev) => ({ ...prev, [id]: null }));
    }, 1200);
  };

  const openEditModal = (p) => {
    setErrorMsg('');
    setEditingProduct(p);
    setFormData({
      name: p.name || '',
      subtitle: p.subtitle || '',
      category: p.category || 'uniforms',
      price: p.price ?? '',
      originalPrice: p.originalPrice ?? '',
      discountBadge: p.discountBadge || '',
      stockQuantity: p.stockQuantity ?? (p.inStock ? 50 : 0),
      sizes: Array.isArray(p.sizes) ? p.sizes.join(', ') : (p.sizes || 'S, M, L'),
      colors: Array.isArray(p.colors) ? p.colors.join(', ') : (p.colors || 'Navy Blue'),
      gender: p.gender || 'Unisex',
      image: p.image || '',
      description: p.description || '',
      sku: p.sku || `SKU-${p.id}`
    });
  };

  const handleSaveProduct = (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      if (!formData.name.trim()) {
        setErrorMsg('Product name is required.');
        return;
      }
      if (!formData.price || Number(formData.price) <= 0) {
        setErrorMsg('Product price must be greater than ₹0.');
        return;
      }

      const payload = {
        ...formData,
        price: Number(formData.price),
        originalPrice: Number(formData.originalPrice) || Math.round(Number(formData.price) * 1.25),
        stockQuantity: Number(formData.stockQuantity) || 0,
        inStock: Number(formData.stockQuantity) > 0,
        sizes: typeof formData.sizes === 'string' ? formData.sizes.split(',').map(s => s.trim()).filter(Boolean) : formData.sizes,
        colors: typeof formData.colors === 'string' ? formData.colors.split(',').map(c => c.trim()).filter(Boolean) : formData.colors
      };

      if (editingProduct) {
        editProduct(editingProduct.id, payload);
        setEditingProduct(null);
      }
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleDeleteProduct = () => {
    if (deletingProductId) {
      try {
        deleteProduct(deletingProductId);
        setDeletingProductId(null);
      } catch (err) {
        alert(err.message);
      }
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-xs border border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Box className="text-teal-700" size={24} /> Inventory & Stock Monitoring
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Real-time SKU quantities, low stock safety alerts, and batch spreadsheet replenishment
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <UploadCloud size={16} /> Bulk Stock Update (Excel)
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
          <div className="text-[11px] font-semibold text-gray-500">Total Live SKUs</div>
          <div className="text-2xl font-extrabold text-gray-900 mt-1">{metrics.totalSkus}</div>
          <div className="text-[10px] text-teal-700 mt-0.5">Across 9 uniform categories</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
          <div className="text-[11px] font-semibold text-gray-500">Total Warehouse Stock</div>
          <div className="text-2xl font-extrabold text-teal-800 mt-1">{metrics.totalUnits.toLocaleString()}</div>
          <div className="text-[10px] text-gray-400 mt-0.5">Units ready for immediate dispatch</div>
        </div>

        <div 
          onClick={() => setFilterType('low')}
          className="bg-amber-50/50 p-4 rounded-2xl border border-amber-200 shadow-xs cursor-pointer hover:bg-amber-100/50 transition-colors"
        >
          <div className="text-[11px] font-semibold text-amber-800 flex items-center gap-1">
            <AlertTriangle size={13} /> Low Stock Alerts
          </div>
          <div className="text-2xl font-extrabold text-amber-900 mt-1">{metrics.lowCount}</div>
          <div className="text-[10px] text-amber-700 mt-0.5">Below 15 units reorder threshold</div>
        </div>

        <div 
          onClick={() => setFilterType('out')}
          className="bg-rose-50/50 p-4 rounded-2xl border border-rose-200 shadow-xs cursor-pointer hover:bg-rose-100/50 transition-colors"
        >
          <div className="text-[11px] font-semibold text-rose-800 flex items-center gap-1">
            <XCircle size={13} /> Out of Stock
          </div>
          <div className="text-2xl font-extrabold text-rose-900 mt-1">{metrics.outCount}</div>
          <div className="text-[10px] text-rose-700 mt-0.5">Require urgent supplier restocking</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl shadow-xs border border-gray-100">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search SKU, Product Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-teal-600"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
          {[
            { id: 'all', label: `All (${products.length})` },
            { id: 'low', label: `Low Stock (${metrics.lowCount})` },
            { id: 'out', label: `Out of Stock (${metrics.outCount})` },
            { id: 'healthy', label: `Healthy (${metrics.healthyCount})` }
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setFilterType(pill.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                filterType === pill.id
                  ? 'bg-teal-800 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-600 uppercase font-semibold tracking-wider border-b border-gray-100">
              <tr>
                <th className="py-3 px-4">Item & SKU</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Current Stock</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Quick Increments</th>
                <th className="py-3 px-4 text-right">Actions & Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-gray-500">
                    <Box size={40} className="mx-auto text-gray-300 mb-2" />
                    No products matched this inventory filter.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const qty = p.stockQuantity ?? (p.inStock ? 50 : 0);
                  const isLow = qty > 0 && qty <= 15;
                  const isOut = qty <= 0;
                  const isEditingThis = stockInputs[p.id] !== undefined && stockInputs[p.id] !== '' && String(stockInputs[p.id]) !== String(qty);

                  return (
                    <tr key={p.id} className="hover:bg-gray-50/70 transition-colors">
                      
                      {/* Item */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={resolveImageUrl((Array.isArray(p.images) && p.images[0]) || p.image || p.coverImage)}
                            alt={p.name}
                            className="w-10 h-10 rounded-xl object-cover border border-gray-100 shrink-0"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                          <div className="max-w-xs">
                            <div className="font-bold text-gray-900 truncate">{p.name}</div>
                            <div className="text-[10px] text-teal-700 font-mono mt-0.5">{p.sku || `SKU-${p.id}`}</div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-3">
                        <span className="capitalize text-gray-600">{p.category || 'uniforms'}</span>
                      </td>

                      {/* Current Stock */}
                      <td className="py-3.5 px-3">
                        <span className="font-extrabold text-gray-900 text-sm">{qty}</span>
                        <span className="text-[10px] text-gray-400 ml-1">units</span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3">
                        {isOut ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                            <XCircle size={11} /> Out of Stock
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            <AlertTriangle size={11} /> Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 size={11} /> Healthy
                          </span>
                        )}
                      </td>

                      {/* Quick Increments */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleQuickAdd(p.id, qty, -5)}
                            disabled={qty <= 0}
                            className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg disabled:opacity-40 cursor-pointer"
                            title="Subtract 5 units"
                          >
                            -5
                          </button>
                          <button
                            onClick={() => handleQuickAdd(p.id, qty, 10)}
                            className="px-2 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold rounded-lg cursor-pointer"
                            title="Add 10 units"
                          >
                            +10
                          </button>
                          <button
                            onClick={() => handleQuickAdd(p.id, qty, 25)}
                            className="px-2 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold rounded-lg cursor-pointer"
                            title="Add 25 units"
                          >
                            +25
                          </button>
                          {feedback[p.id] && (
                            <span className="text-[10px] font-bold text-emerald-600 animate-pulse ml-1">
                              {feedback[p.id]}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions & Set Quantity: Save ONLY IF edited, otherwise Edit & Delete icons */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <input
                            type="number"
                            min="0"
                            placeholder={String(qty)}
                            value={stockInputs[p.id] ?? ''}
                            onChange={(e) => handleStockChange(p.id, e.target.value)}
                            className={`w-16 px-2 py-1 text-xs border rounded-lg focus:outline-none transition-colors ${
                              isEditingThis 
                                ? 'border-teal-600 bg-teal-50/40 text-teal-900 font-bold ring-1 ring-teal-500' 
                                : 'border-gray-200 focus:border-teal-600'
                            }`}
                            title="Type a new number to edit stock"
                          />

                          {isEditingThis ? (
                            /* SHOW SAVE AND CANCEL ONLY IFF EDITED */
                            <div className="flex items-center gap-1 animate-in fade-in zoom-in-95">
                              <button
                                onClick={() => handleApplyStock(p.id)}
                                className="px-2.5 py-1 bg-teal-700 hover:bg-teal-800 text-white text-[11px] font-bold rounded-lg shadow-xs flex items-center gap-1 cursor-pointer transition-colors"
                                title="Save updated stock quantity"
                              >
                                <Save size={12} />
                                <span>Save</span>
                              </button>
                              <button
                                onClick={() => handleCancelEditStock(p.id)}
                                className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
                                title="Cancel stock edit"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            /* OTHERWISE SHOW EDIT AND DELETE ICONS */
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => openEditModal(p)}
                                className="p-1.5 text-gray-500 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                                title="Edit Product Details"
                              >
                                <Edit3 size={15} />
                              </button>
                              <button
                                onClick={() => setDeletingProductId(p.id)}
                                className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete Product"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-bold text-gray-900 text-base">
                Edit Product Inventory & Details
              </h3>
              <button
                onClick={() => setEditingProduct(null)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 overflow-y-auto space-y-4 text-xs">
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle size={15} /> {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-teal-600 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">SKU Code</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-teal-600 focus:outline-none font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Stock Quantity (Units) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-teal-600 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Selling Price (₹) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-teal-600 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Original / MRP Price (₹)</label>
                  <input
                    type="number"
                    value={formData.originalPrice}
                    onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-teal-600 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Discount Badge</label>
                  <input
                    type="text"
                    value={formData.discountBadge}
                    onChange={(e) => setFormData({ ...formData, discountBadge: e.target.value })}
                    placeholder="e.g. 20% OFF or BESTSELLER"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-teal-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 font-semibold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-xs cursor-pointer"
                >
                  Update Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingProductId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-base">Delete this product?</h4>
              <p className="text-xs text-gray-500 mt-1">
                This will remove the product and its stock records from the store and school listings.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDeletingProductId(null)}
                className="flex-1 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProduct}
                className="flex-1 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Update Modal */}
      <BulkUpdateModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
      />

    </div>
  );
}
