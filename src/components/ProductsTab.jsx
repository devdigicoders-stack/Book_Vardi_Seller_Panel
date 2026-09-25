import React, { useState, useMemo, useRef } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  UploadCloud, 
  Package, 
  CheckCircle, 
  AlertCircle, 
  X, 
  Image as ImageIcon,
  Tag,
  Layers,
  ChevronDown,
  ArrowUpDown,
  Eye,
  Check,
  Power,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  Info,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { useSellerData } from '../context/SellerDataContext';
import BulkUpdateModal from './BulkUpdateModal';
import ImageUploadDropzone from './ImageUploadDropzone';
import SellerProductFormPage from './SellerProductFormPage';
import { resolveImageUrl, parseSizeVariants } from '../utils/mediaUrl';

const CATEGORIES = [
  { id: 'all', label: 'All Categories' },
  { id: 'uniforms', label: 'Uniforms & Blazers' },
  { id: 'shoes', label: 'Shoes & Socks' },
  { id: 'rain_winter', label: 'Winter & Rain Kits' },
  { id: 'sports', label: 'Sports Wear' },
  { id: 'ncert', label: 'NCERT Books' },
  { id: 'practice_books', label: 'Practice & Olympiad' },
  { id: 'drawing_books', label: 'Drawing & Art' },
  { id: 'stationery', label: 'Pens & Stationery' }
];

export default function ProductsTab() {
  const { isLoadingProducts, products, addProduct, editProduct, toggleProductStatus, deleteProduct, isApproved } = useSellerData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stockFilter, setStockFilter] = useState('all'); // all | in_stock | low_stock | out_of_stock
  const [approvalFilter, setApprovalFilter] = useState('all'); // all | Approved | Pending | Rejected
  const [sortBy, setSortBy] = useState('newest');

  // Page view mode: 'catalog' | 'form'
  const [viewMode, setViewMode] = useState('catalog');

  // Modals state
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingProductId, setDeletingProductId] = useState(null);
  const [selectedProductForDetail, setSelectedProductForDetail] = useState(null);
  const [detailActiveImg, setDetailActiveImg] = useState(0);
  const [previewImageModalUrl, setPreviewImageModalUrl] = useState(null);
  const [previewImageModalTitle, setPreviewImageModalTitle] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const stockInputRef = useRef(null);

  const openAddModal = () => {
    setErrorMsg('');
    setEditingProduct(null);
    setViewMode('form');
  };

  React.useEffect(() => {
    const handleOpen = () => openAddModal();
    window.addEventListener('openAddProductModal', handleOpen);
    window.addEventListener('openAddProductModalInternal', handleOpen);
    return () => {
      window.removeEventListener('openAddProductModal', handleOpen);
      window.removeEventListener('openAddProductModalInternal', handleOpen);
    };
  }, []);

  const openEditModal = (p) => {
    setErrorMsg('');
    setEditingProduct(p);
    setViewMode('form');
  };

  const handleSaveProduct = async (payload) => {
    try {
      if (editingProduct) {
        await editProduct(editingProduct.id || editingProduct._id, payload);
      } else {
        await addProduct(payload);
      }
      setViewMode('catalog');
      setEditingProduct(null);
    } catch (err) {
      console.error('Failed to save product:', err);
      throw err;
    }
  };

  const handleDelete = () => {
    if (deletingProductId) {
      try {
        deleteProduct(deletingProductId);
        setDeletingProductId(null);
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const handleToggleProductStatus = (product) => {
    const qty = Number(product.stockQuantity ?? 0);
    const isActive = product.inStock !== false && qty > 0;

    if (!isActive && qty === 0) {
      openEditModal(product, { forcePositiveStock: true, focusStock: true });
      return;
    }

    toggleProductStatus(product.id);
  };

  // Status Metrics
  const pendingCount = products.filter(p => p.approvalStatus === 'Pending').length;
  const approvedCount = products.filter(p => p.approvalStatus === 'Approved' || !p.approvalStatus).length;
  const rejectedCount = products.filter(p => p.approvalStatus === 'Rejected').length;

  // Filter and Sort
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = 
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;

      const qty = p.stockQuantity ?? (p.inStock ? 50 : 0);
      let matchesStock = true;
      if (stockFilter === 'in_stock') matchesStock = qty > 10;
      if (stockFilter === 'low_stock') matchesStock = qty > 0 && qty <= 10;
      if (stockFilter === 'out_of_stock') matchesStock = qty <= 0;

      const currentApproval = p.approvalStatus || 'Approved';
      const matchesApproval = approvalFilter === 'all' || currentApproval === approvalFilter;

      return matchesSearch && matchesCategory && matchesStock && matchesApproval;
    }).sort((a, b) => {
      if (sortBy === 'price_asc') return (a.price || 0) - (b.price || 0);
      if (sortBy === 'price_desc') return (b.price || 0) - (a.price || 0);
      if (sortBy === 'stock_desc') return (b.stockQuantity ?? b.stock ?? 0) - (a.stockQuantity ?? a.stock ?? 0);
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : (typeof a.id === 'number' ? a.id : 0);
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : (typeof b.id === 'number' ? b.id : 0);
      if (dateA !== dateB) return dateB - dateA;
      return String(b.id || b._id || '').localeCompare(String(a.id || a._id || ''));
    });
  }, [products, searchTerm, selectedCategory, stockFilter, approvalFilter, sortBy]);

  if (viewMode === 'form') {
    return (
      <SellerProductFormPage
        product={editingProduct}
        onSave={handleSaveProduct}
        onBack={() => {
          setViewMode('catalog');
          setEditingProduct(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Top Banner Action Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-xs border border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="text-teal-700" size={24} /> Products Management
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Total {products.length} products listed • {products.filter(p => (p.stockQuantity ?? 50) > 0).length} In Stock
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-teal-600 text-teal-800 hover:bg-teal-50 text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <UploadCloud size={16} /> Bulk Update (Excel/CSV)
          </button>
          <button
            onClick={openAddModal}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <Plus size={16} /> Add Product
          </button>
        </div>
      </div>

      {/* Admin Rejection Alert Callout */}
      {rejectedCount > 0 && (
        <div className="bg-rose-50/90 border border-rose-200/90 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <AlertTriangle size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xs text-rose-950">Action Needed on Rejected Listings</span>
                <span className="px-2 py-0.2 rounded-full text-[10px] font-extrabold bg-rose-600 text-white">
                  {rejectedCount} Rejected
                </span>
              </div>
              <p className="text-[11px] text-rose-800 mt-0.5 max-w-xl">
                The Book Vardi administrator rejected some product listings with specific remarks. Click below to filter and edit your items to address the feedback.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setApprovalFilter('Rejected')}
            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors shrink-0 shadow-xs cursor-pointer"
          >
            View Rejected ({rejectedCount})
          </button>
        </div>
      )}

      {/* Quick Approval Status Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar scrollbar-none">
        <button
          type="button"
          onClick={() => setApprovalFilter('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            approvalFilter === 'all'
              ? 'bg-teal-900 text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          All Products ({products.length})
        </button>

        <button
          type="button"
          onClick={() => setApprovalFilter('Approved')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
            approvalFilter === 'Approved'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <CheckCircle size={13} className="text-emerald-600" />
          <span>Approved ({approvedCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setApprovalFilter('Pending')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
            approvalFilter === 'Pending'
              ? 'bg-amber-600 text-white shadow-xs'
              : pendingCount > 0
                ? 'bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <Clock size={13} className={pendingCount > 0 ? 'text-amber-700 animate-spin-slow' : ''} />
          <span>Under Admin Review ({pendingCount})</span>
          {pendingCount > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setApprovalFilter('Rejected')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
            approvalFilter === 'Rejected'
              ? 'bg-rose-700 text-white shadow-xs'
              : rejectedCount > 0
                ? 'bg-rose-50 text-rose-900 border border-rose-300 hover:bg-rose-100 font-extrabold'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <AlertTriangle size={13} className="text-rose-600" />
          <span>Rejected by Admin ({rejectedCount})</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white p-4 rounded-2xl shadow-xs border border-gray-100">
        
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, SKU or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
          />
        </div>

        {/* Category */}
        <div className="relative">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-teal-600 cursor-pointer"
          >
            {CATEGORIES.map(c => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>

        {/* Stock Filter */}
        <div className="relative">
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-teal-600 cursor-pointer"
          >
            <option value="all">All Stock Statuses</option>
            <option value="in_stock">In Stock (&gt;10)</option>
            <option value="low_stock">Low Stock (1-10)</option>
            <option value="out_of_stock">Out of Stock (0)</option>
          </select>
        </div>

        {/* Sort */}
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-teal-600 cursor-pointer"
          >
            <option value="newest">Sort: Recently Added</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="stock_desc">Highest Stock Quantity</option>
          </select>
        </div>

      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto no-scrollbar scrollbar-none">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-600 uppercase font-semibold tracking-wider border-b border-gray-100">
              <tr>
                <th className="py-3 px-4">Product Info</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Price & MRP</th>
                <th className="py-3 px-3">Stock Units</th>
                <th className="py-3 px-3">Sizes & Gender</th>
                <th className="py-3 px-3">Approval</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoadingProducts ? (
                <tr>
                  <td colSpan="8" className="py-16 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-10 h-10 border-4 border-teal-700 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-xs font-bold text-teal-800">Fetching products directly from database...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-14 text-center text-gray-500">
                    <Package size={44} className="mx-auto text-gray-300 mb-3" />
                    <h4 className="font-extrabold text-base text-gray-900 mb-1">No Products Listed Yet</h4>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
                      Your store database currently has 0 products. Add your school uniforms, textbooks, or stationery to start receiving orders.
                    </p>
                    <button
                      onClick={openAddModal}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-teal hover:bg-brand-teal-light text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer"
                    >
                      <Plus size={16} /> Add First Product
                    </button>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const qty = p.stockQuantity ?? (p.inStock ? 50 : 0);
                  const isLow = qty > 0 && qty <= 10;
                  const isOut = qty <= 0;

                    const isActive = p.inStock !== false && qty > 0;

                    return (
                      <tr 
                        key={p.id} 
                        onClick={() => setSelectedProductForDetail(p)}
                        className="hover:bg-teal-50/40 transition-colors cursor-pointer group"
                      >
                        
                        {/* Product details */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="relative shrink-0">
                              <img
                                src={resolveImageUrl((Array.isArray(p.images) && p.images[0]) || p.image || p.coverImage || (Array.isArray(p.kitItems) && p.kitItems[0]?.image))}
                                alt={p.name}
                                className="w-12 h-12 rounded-xl object-cover border border-gray-100 bg-gray-100 group-hover:ring-2 group-hover:ring-teal-600 transition-all"
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                              <div className="absolute inset-0 bg-black/20 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                                <Eye size={14} />
                              </div>
                            </div>
                            <div className="min-w-0 max-w-xs">
                              <div className="font-bold text-gray-900 truncate group-hover:text-teal-800 transition-colors flex items-center gap-1.5">
                                <span>{p.name}</span>
                              </div>
                              <div className="text-[11px] text-gray-500 truncate">{p.subtitle || p.description || 'Verified product'}</div>
                              <div className="text-[10px] text-teal-700 font-mono mt-0.5">{p.sku || `SKU-${p.id}`}</div>
                              {p.approvalStatus === 'Rejected' && (
                                <div className="mt-1 px-2 py-0.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[10px] flex items-start gap-1 shadow-2xs">
                                  <AlertTriangle size={11} className="shrink-0 text-rose-600 mt-0.5" />
                                  <span className="truncate" title={p.rejectionReason || p.approvalComment}>
                                    <strong>Admin:</strong> {p.rejectionReason || p.approvalComment || 'Listing rejected'}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3.5 px-3">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-medium bg-gray-100 text-gray-700 capitalize">
                            {p.category || 'General'}
                          </span>
                        </td>

                        {/* Price */}
                        <td className="py-3.5 px-3">
                          <div className="font-bold text-gray-900 text-sm">₹{p.price}</div>
                          {p.originalPrice && p.originalPrice > p.price && (
                            <div className="text-[10px] text-gray-400 line-through">₹{p.originalPrice}</div>
                          )}
                          <div className="flex flex-col gap-0.5 mt-0.5">
                            {p.discountBadge && (
                              <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800">
                                {p.discountBadge}
                              </span>
                            )}
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-extrabold border ${
                              p.paymentMethodAllowed === 'Online_Only'
                                ? 'bg-purple-50 text-purple-900 border-purple-200'
                                : p.paymentMethodAllowed === 'COD_Only'
                                ? 'bg-amber-50 text-amber-900 border-amber-200'
                                : 'bg-teal-50 text-teal-900 border-teal-200'
                            }`}>
                              {p.paymentMethodAllowed === 'Online_Only' ? '⚡ Online Only' : p.paymentMethodAllowed === 'COD_Only' ? '💵 COD Only' : '💳 Online & COD'}
                            </span>
                          </div>
                        </td>

                        {/* Stock Units */}
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-gray-800">{qty}</span>
                            <span className="text-[10px] text-gray-500">pcs</span>
                          </div>
                          {isLow && (
                            <span className="text-[10px] font-medium text-amber-700 block">Low stock</span>
                          )}
                          {isOut && (
                            <span className="text-[10px] font-medium text-red-600 block">Out of stock</span>
                          )}
                        </td>

                        {/* Sizes & Gender */}
                        <td className="py-3.5 px-3">
                          <div className="text-[11px] text-gray-700">
                            {Array.isArray(p.sizes) ? p.sizes.slice(0, 3).join(', ') : (p.sizes || 'All')}
                          </div>
                          <div className="text-[10px] text-gray-400 mt-0.5">
                            {p.gender || 'Unisex'}
                          </div>
                        </td>

                        {/* Approval Status */}
                        <td className="py-3.5 px-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          {p.approvalStatus === 'Rejected' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-800 border border-rose-300" title={p.rejectionReason || p.approvalComment}>
                              <AlertTriangle size={11} className="text-rose-600" />
                              <span>Rejected</span>
                            </span>
                          ) : p.approvalStatus === 'Pending' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-900 border border-amber-300 animate-pulse" title="Under inspection in urgent approval queue">
                              <Clock size={11} className="text-amber-600" />
                              <span>Under Review</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-300">
                              <CheckCircle size={11} className="text-emerald-600" />
                              <span>Approved</span>
                            </span>
                          )}
                        </td>

                        {/* Status (Click to Toggle) */}
                        <td className="py-3.5 px-3" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => handleToggleProductStatus(p)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer shadow-2xs border ${
                              isActive 
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100' 
                                : 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100'
                            }`}
                            title={`Click to switch to ${isActive ? 'Inactive' : 'Active'}`}
                          >
                            <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
                            <span>{isActive ? 'Active' : 'Inactive'}</span>
                            <Power size={11} className="opacity-60 hover:opacity-100" />
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setSelectedProductForDetail(p)}
                              className="p-1.5 text-gray-500 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                              title="Quick View Details"
                            >
                              <Eye size={15} />
                            </button>
                            <button
                              onClick={() => openEditModal(p)}
                              className="p-1.5 text-gray-500 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                              title="Edit Product"
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
                        </td>

                      </tr>
                    );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deletingProductId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-base">Delete this product?</h4>
              <p className="text-xs text-gray-500 mt-1">
                This will remove the product from your store inventory and all active school listings.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDeletingProductId(null)}
                className="flex-1 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Comprehensive Detail & Preview Modal (Matches Admin Panel) */}
      {selectedProductForDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gray-50/90 border-b border-gray-200/80 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-2xl ${
                  selectedProductForDetail.approvalStatus === 'Pending' 
                    ? 'bg-amber-100 text-amber-900 ring-2 ring-amber-300' 
                    : selectedProductForDetail.approvalStatus === 'Rejected'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-emerald-100 text-emerald-800'
                }`}>
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-display font-extrabold text-lg text-gray-900">
                      Product Details & Catalog Overview
                    </h3>
                    {selectedProductForDetail.approvalStatus === 'Pending' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-white animate-pulse">
                        <Clock size={11} /> PENDING ADMIN REVIEW
                      </span>
                    )}
                    {selectedProductForDetail.approvalStatus === 'Rejected' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-600 text-white">
                        <AlertTriangle size={11} /> ACTION REQUIRED (REJECTED)
                      </span>
                    )}
                    {selectedProductForDetail.approvalStatus === 'Approved' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-600 text-white">
                        <CheckCircle size={11} /> LIVE ON MARKETPLACE
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 flex items-center gap-2 mt-0.5 flex-wrap">
                    <span>SKU: <strong className="font-mono text-gray-700">{selectedProductForDetail.sku || `SKU-${selectedProductForDetail.id}`}</strong></span>
                    <span>•</span>
                    <span>Category: <strong className="capitalize text-gray-700">{selectedProductForDetail.subCategory ? `${selectedProductForDetail.category} > ${selectedProductForDetail.subCategory}` : (selectedProductForDetail.category || 'Uniforms')}</strong></span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleProductStatus(selectedProductForDetail)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shadow-2xs border ${
                    (selectedProductForDetail.inStock !== false && (selectedProductForDetail.stockQuantity === undefined || selectedProductForDetail.stockQuantity > 0))
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100' 
                      : 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100'
                  }`}
                  title="Click to toggle status"
                >
                  <span className={`w-2 h-2 rounded-full ${(selectedProductForDetail.inStock !== false && (selectedProductForDetail.stockQuantity === undefined || selectedProductForDetail.stockQuantity > 0)) ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
                  <span>{(selectedProductForDetail.inStock !== false && (selectedProductForDetail.stockQuantity === undefined || selectedProductForDetail.stockQuantity > 0)) ? 'Active' : 'Inactive'}</span>
                  <Power size={12} className="opacity-70" />
                </button>

                <button
                  onClick={() => setSelectedProductForDetail(null)}
                  className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Scrollable Body */}
            <div className="overflow-y-auto p-6 space-y-6 text-xs flex-1">
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Left Column: Visual Gallery & Product Info */}
                <div className="lg:col-span-7 space-y-4">
                  
                  {/* Image Preview Box */}
                  {(() => {
                    const extractUrl = (val) => {
                      if (!val) return '';
                      if (typeof val === 'string') return val.trim();
                      if (typeof val === 'object') return (val.url || val.src || val.path || val.data || val.link || '').trim();
                      return '';
                    };
                    const galleryList = [];
                    const primary = extractUrl(selectedProductForDetail.image || selectedProductForDetail.coverImage || selectedProductForDetail.imageUrl || selectedProductForDetail.photo);
                    if (primary) galleryList.push(primary);
                    if (Array.isArray(selectedProductForDetail.images)) {
                      selectedProductForDetail.images.forEach(img => {
                        const u = extractUrl(img);
                        if (u && !galleryList.includes(u)) galleryList.push(u);
                      });
                    }
                    const vars = parseSizeVariants(selectedProductForDetail);
                    vars.forEach(v => {
                      const vImg = extractUrl(v.image);
                      if (vImg && !galleryList.includes(vImg)) galleryList.push(vImg);
                      if (Array.isArray(v.images)) {
                        v.images.forEach(img => {
                          const u = extractUrl(img);
                          if (u && !galleryList.includes(u)) galleryList.push(u);
                        });
                      }
                    });
                    const resolvedGallery = [...new Set(galleryList.map(img => resolveImageUrl(img)).filter(Boolean))];
                    const activeImg = resolvedGallery[detailActiveImg] || resolvedGallery[0] || '';

                    return (
                      <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200/80">
                        <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-white border border-gray-200 flex items-center justify-center">
                          {activeImg ? (
                            <img
                              src={activeImg}
                              alt={selectedProductForDetail.name}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}

                          <div className={`w-full h-full ${activeImg ? 'hidden' : 'flex'} flex-col items-center justify-center bg-gray-100 text-gray-400 gap-2`}>
                            <ImageIcon size={36} />
                            <span className="text-xs font-medium">No Product Image</span>
                          </div>

                          {resolvedGallery.length > 1 && (
                            <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold">
                              Image {detailActiveImg + 1} of {resolvedGallery.length}
                            </div>
                          )}
                          {(selectedProductForDetail.badge || selectedProductForDetail.discountBadge) && (
                            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-amber-400 text-teal-950 text-[10px] font-extrabold tracking-wide shadow-xs">
                              {selectedProductForDetail.badge || selectedProductForDetail.discountBadge}
                            </div>
                          )}
                        </div>

                        {/* Thumbnail Strip */}
                        {resolvedGallery.length > 1 && (
                          <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1 scrollbar-thin">
                            {resolvedGallery.map((img, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setDetailActiveImg(idx)}
                                className={`w-14 h-14 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer bg-white ${
                                  detailActiveImg === idx
                                    ? 'border-teal-700 ring-2 ring-teal-200 scale-105'
                                    : 'border-gray-200 opacity-60 hover:opacity-100'
                                }`}
                              >
                                <img src={img} alt="" className="w-full h-full object-cover" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Product Comprehensive Specifications & Details Card */}
                  <div className="bg-white rounded-2xl p-4 border border-gray-200/80 space-y-4 shadow-2xs">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-display font-extrabold text-base text-gray-900">
                          {selectedProductForDetail.name}
                        </h4>
                        <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                          selectedProductForDetail.isMeterBased || selectedProductForDetail.unit === 'meter'
                            ? 'bg-teal-50 text-teal-800 border-teal-200'
                            : 'bg-blue-50 text-blue-800 border-blue-200'
                        }`}>
                          {selectedProductForDetail.isMeterBased || selectedProductForDetail.unit === 'meter' ? '✂️ Unstitched Fabric (Meters)' : '👔 Ready-To-Wear (Pieces)'}
                        </span>
                      </div>
                      <p className="text-gray-500 text-xs mt-0.5">
                        {selectedProductForDetail.subtitle || 'Authentic school & student merchandise listed on Book Vardi.'}
                      </p>
                    </div>

                    {/* Commercials: Price, MRP, Discount & GST */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-gray-500 block">Selling Price</span>
                        <span className="text-base font-extrabold text-gray-900">₹{selectedProductForDetail.price}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase text-gray-500 block">MRP / List Price</span>
                        <span className="text-base font-bold text-gray-400 line-through">
                          ₹{selectedProductForDetail.originalPrice || selectedProductForDetail.mrp || Math.round(selectedProductForDetail.price * 1.25)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase text-gray-500 block">Discount</span>
                        <span className="text-xs font-extrabold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md inline-block mt-0.5">
                          {selectedProductForDetail.originalPrice && selectedProductForDetail.originalPrice > selectedProductForDetail.price
                            ? Math.round(((selectedProductForDetail.originalPrice - selectedProductForDetail.price) / selectedProductForDetail.originalPrice) * 100)
                            : 0}% OFF
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase text-gray-500 block">GST Tax Rate</span>
                        <span className="text-xs font-extrabold text-purple-800 bg-purple-100/80 px-2 py-0.5 rounded-md inline-block mt-0.5">
                          {selectedProductForDetail.gst ?? selectedProductForDetail.gstPercentage ?? 5}% GST
                        </span>
                      </div>
                    </div>

                    {/* Specs Pill Matrix */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                      <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                        <span className="text-[10px] text-gray-400 block font-bold uppercase">Stock Level</span>
                        <span className="font-extrabold text-gray-800 text-xs">
                          {selectedProductForDetail.stockQuantity ?? selectedProductForDetail.stock ?? 0} units
                        </span>
                      </div>
                      <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                        <span className="text-[10px] text-gray-400 block font-bold uppercase">Category</span>
                        <span className="font-extrabold text-gray-800 text-xs capitalize">
                          {selectedProductForDetail.subCategory ? `${selectedProductForDetail.category} > ${selectedProductForDetail.subCategory}` : (selectedProductForDetail.category || 'N/A')}
                        </span>
                      </div>
                      <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                        <span className="text-[10px] text-gray-400 block font-bold uppercase">Brand</span>
                        <span className="font-extrabold text-gray-800 text-xs">
                          {selectedProductForDetail.brand || 'Unbranded / Generic'}
                        </span>
                      </div>
                      <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                        <span className="text-[10px] text-gray-400 block font-bold uppercase">Material / Fabric</span>
                        <span className="font-extrabold text-gray-800 text-xs">
                          {selectedProductForDetail.material || 'Not specified'}
                        </span>
                      </div>
                      <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                        <span className="text-[10px] text-gray-400 block font-bold uppercase">Target School</span>
                        <span className="font-extrabold text-gray-800 text-xs">
                          {selectedProductForDetail.schoolName || selectedProductForDetail.school || 'General Academic'}
                          {selectedProductForDetail.schoolCode ? ` (${selectedProductForDetail.schoolCode})` : ''}
                        </span>
                      </div>
                      <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                        <span className="text-[10px] text-gray-400 block font-bold uppercase">Grade / Class</span>
                        <span className="font-extrabold text-gray-800 text-xs">
                          {selectedProductForDetail.classGrade || selectedProductForDetail.className || 'All Grades'}
                        </span>
                      </div>
                      <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                        <span className="text-[10px] text-gray-400 block font-bold uppercase">Target Gender & Age</span>
                        <span className="font-extrabold text-gray-800 text-xs">
                          {selectedProductForDetail.gender || 'Unisex'} • {selectedProductForDetail.ageGroup || (Array.isArray(selectedProductForDetail.ages) && selectedProductForDetail.ages.length > 0 ? selectedProductForDetail.ages.join(', ') : 'All Ages')}
                        </span>
                      </div>
                      <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                        <span className="text-[10px] text-gray-400 block font-bold uppercase">Return Policy</span>
                        <span className={`font-extrabold text-xs ${selectedProductForDetail.isReturnable === false ? 'text-rose-600' : 'text-emerald-700'}`}>
                          {selectedProductForDetail.isReturnable === false ? 'Non-Returnable' : `${selectedProductForDetail.returnWindowDays || 7}-Day Easy Returns`}
                        </span>
                      </div>
                      <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                        <span className="text-[10px] text-gray-400 block font-bold uppercase">Payment Methods</span>
                        <span className="font-extrabold text-gray-800 text-xs">
                          {selectedProductForDetail.paymentMethodAllowed || 'Both (Online & COD)'}
                        </span>
                      </div>
                    </div>

                    {/* Fabric / Meter Quantity Pricing Rule Callout */}
                    {(selectedProductForDetail.isMeterBased || selectedProductForDetail.unit === 'meter') && (
                      <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl text-xs text-teal-950 font-medium">
                        ✂️ <strong>Fabric Meter Pricing Rule:</strong> Sold per meter. Min order: <strong>{selectedProductForDetail.minMeter || 0.5}m</strong>, Step: <strong>{selectedProductForDetail.meterStep || 0.5}m</strong>.
                        Formula: <span className="font-mono font-bold text-teal-900">{`{Customer Selected Meters} × ₹${selectedProductForDetail.price}/meter`}</span>.
                      </div>
                    )}

                    {/* Product Scale Variants Matrix & Detail Photos */}
                    {(() => {
                      const detailVariants = parseSizeVariants(selectedProductForDetail);
                      if (!detailVariants || detailVariants.length === 0) return null;
                      return (
                        <div className="space-y-2 pt-2 border-t border-gray-100">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                              <Layers size={14} className="text-teal-700" />
                              <span>Product Variants Matrix & Detail Photos ({detailVariants.length})</span>
                            </span>
                            <span className="text-[10px] font-bold text-gray-500">Click photo to view high-res</span>
                          </div>

                          {/* Variant Preview Image Layout in Row */}
                          <div className="flex items-center gap-3 overflow-x-auto pb-2 pt-1 border-b border-gray-100 scrollbar-thin">
                            {detailVariants.map((v, vIdx) => {
                              const vRawImg = v.image || (Array.isArray(v.images) && v.images[0]) || selectedProductForDetail.image || (Array.isArray(selectedProductForDetail.images) && selectedProductForDetail.images[0]);
                              const vImgUrl = vRawImg ? resolveImageUrl(vRawImg) : '';
                              const vVal = v.measureValue || v.size || `Var #${vIdx + 1}`;

                              return (
                                <div
                                  key={vIdx}
                                  onClick={() => {
                                    if (vImgUrl) {
                                      setPreviewImageModalUrl(vImgUrl);
                                      setPreviewImageModalTitle(`Variant: ${vVal}`);
                                    }
                                  }}
                                  className="flex items-center gap-2.5 p-2 rounded-xl bg-teal-50/60 hover:bg-teal-100/70 border border-teal-200/80 shrink-0 min-w-[175px] cursor-pointer transition-all shadow-2xs"
                                >
                                  <div className="relative w-12 h-12 rounded-lg bg-teal-100 text-teal-950 font-bold text-xs flex items-center justify-center shrink-0 border border-teal-200 overflow-hidden">
                                    {vImgUrl ? (
                                      <img
                                        src={vImgUrl}
                                        alt={vVal}
                                        className="w-full h-full object-cover relative z-10"
                                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                      />
                                    ) : null}
                                    <span className="select-none absolute z-0">{vVal.slice(0, 3)}</span>
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="font-extrabold text-xs text-gray-900 truncate">{vVal}</div>
                                    <div className="text-[11px] font-bold text-teal-800 flex items-center gap-1 mt-0.5">
                                      <span>₹{v.price}</span>
                                      {(v.mrp || v.originalPrice) && (
                                        <span className="text-[9px] text-gray-400 line-through">₹{v.mrp || v.originalPrice}</span>
                                      )}
                                    </div>
                                    <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                                      {v.stockQuantity ?? v.stock ?? 0} in stock
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-gray-50 text-gray-600 font-bold uppercase text-[10px] border-b border-gray-200">
                                <tr>
                                  <th className="px-3 py-2">Variant Value</th>
                                  <th className="px-3 py-2">Variant Photos</th>
                                  <th className="px-3 py-2">Scale</th>
                                  <th className="px-3 py-2">Price (₹)</th>
                                  <th className="px-3 py-2">MRP (₹)</th>
                                  <th className="px-3 py-2">Stock</th>
                                  <th className="px-3 py-2">SKU</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {detailVariants.map((v, vIdx) => {
                                  const vImages = Array.isArray(v.images) && v.images.length > 0
                                    ? v.images
                                    : (v.image ? [v.image] : []);

                                  return (
                                    <tr key={vIdx} className="hover:bg-gray-50">
                                      <td className="px-3 py-2 font-bold text-gray-900">
                                        {v.measureValue || v.size || `Variant #${vIdx + 1}`}
                                      </td>
                                      <td className="px-3 py-2">
                                        {vImages.length > 0 ? (
                                          <div className="flex items-center gap-1.5 flex-wrap">
                                            {vImages.map((img, imgIdx) => {
                                              const fullUrl = resolveImageUrl(img);
                                              return (
                                                <button
                                                  key={imgIdx}
                                                  type="button"
                                                  onClick={() => {
                                                    setPreviewImageModalUrl(fullUrl);
                                                    setPreviewImageModalTitle(`Variant: ${v.measureValue || v.size || `#${vIdx + 1}`} (Photo ${imgIdx + 1})`);
                                                  }}
                                                  className="relative group w-9 h-9 rounded-lg overflow-hidden border border-gray-200 hover:border-teal-600 hover:ring-2 hover:ring-teal-200 transition-all cursor-pointer bg-teal-50 shrink-0 flex items-center justify-center"
                                                  title="Click to view full photo"
                                                >
                                                  <img
                                                    src={fullUrl}
                                                    alt=""
                                                    className="w-full h-full object-cover relative z-10"
                                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                                  />
                                                  <span className="text-[9px] font-bold text-teal-900 absolute z-0 select-none">IMG</span>
                                                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity z-20">
                                                    <Eye size={12} />
                                                  </div>
                                                </button>
                                              );
                                            })}
                                          </div>
                                        ) : (
                                          <span className="text-[10px] text-gray-400 italic">No photos</span>
                                        )}
                                      </td>
                                      <td className="px-3 py-2">
                                        <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-[10px] uppercase font-bold">
                                          {v.measureScale || v.scaleUnit || 'size'}
                                        </span>
                                      </td>
                                      <td className="px-3 py-2 font-extrabold text-gray-900">₹{v.price}</td>
                                      <td className="px-3 py-2 text-gray-400 line-through">₹{v.mrp || Math.round(v.price * 1.25)}</td>
                                      <td className="px-3 py-2 font-bold text-emerald-700">{v.stockQuantity ?? v.stock ?? 0}</td>
                                      <td className="px-3 py-2 font-mono text-[10px] text-gray-500">{v.sku || '-'}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Sizes, Colors & Tags */}
                    <div className="space-y-2 pt-2 border-t border-gray-100">
                      {selectedProductForDetail.sizes && (!selectedProductForDetail.sizeVariants || selectedProductForDetail.sizeVariants.length === 0) && (
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-gray-500 w-24 shrink-0">Sizes / Options:</span>
                          <div className="flex flex-wrap gap-1">
                            {(Array.isArray(selectedProductForDetail.sizes) ? selectedProductForDetail.sizes : String(selectedProductForDetail.sizes).split(',')).map((s, i) => (
                              <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-800 font-bold rounded-md text-[10px]">
                                {String(s).trim()}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedProductForDetail.colors && (
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-gray-500 w-24 shrink-0">Colors:</span>
                          <div className="flex flex-wrap gap-1">
                            {(Array.isArray(selectedProductForDetail.colors) ? selectedProductForDetail.colors : String(selectedProductForDetail.colors).split(',')).map((c, i) => (
                              <span key={i} className="px-2 py-0.5 bg-teal-50 text-teal-800 font-bold rounded-md text-[10px] border border-teal-100">
                                {String(c).trim()}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedProductForDetail.tags && (
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-gray-500 w-24 shrink-0">Tags:</span>
                          <div className="flex flex-wrap gap-1">
                            {(Array.isArray(selectedProductForDetail.tags) ? selectedProductForDetail.tags : String(selectedProductForDetail.tags).split(',')).map((t, i) => (
                              <span key={i} className="px-2 py-0.5 bg-amber-50 text-amber-900 font-bold rounded-md text-[10px] border border-amber-200">
                                #{String(t).trim()}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Apparel Size Chart Table (if available) */}
                    {selectedProductForDetail.sizeChart && Array.isArray(selectedProductForDetail.sizeChart.rows) && selectedProductForDetail.sizeChart.rows.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-gray-100">
                        <span className="text-xs font-extrabold text-indigo-950 uppercase tracking-wider block">
                          📐 Size Measurement Chart (Inches)
                        </span>
                        <div className="overflow-x-auto rounded-xl border border-indigo-100 bg-indigo-50/30">
                          <table className="w-full text-left text-[11px]">
                            <thead className="bg-indigo-100/70 text-indigo-950 font-bold uppercase text-[10px]">
                              <tr>
                                <th className="p-2">Size</th>
                                <th className="p-2">Chest</th>
                                <th className="p-2">Length</th>
                                <th className="p-2">Sleeve</th>
                                <th className="p-2">Waist</th>
                                <th className="p-2">Shoulder</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-indigo-100 bg-white">
                              {selectedProductForDetail.sizeChart.rows.map((row, rIdx) => (
                                <tr key={rIdx}>
                                  <td className="p-2 font-bold text-gray-900">{row.size}</td>
                                  <td className="p-2 text-gray-700">{row.chest || '-'}</td>
                                  <td className="p-2 text-gray-700">{row.length || '-'}</td>
                                  <td className="p-2 text-gray-700">{row.sleeve || '-'}</td>
                                  <td className="p-2 text-gray-700">{row.waist || '-'}</td>
                                  <td className="p-2 text-gray-700">{row.shoulder || '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Description */}
                    {selectedProductForDetail.description && (
                      <div className="pt-2 border-t border-gray-100">
                        <span className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Detailed Description</span>
                        <p className="text-gray-700 text-xs leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100 whitespace-pre-line">
                          {selectedProductForDetail.description}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Status & Marketplace Actions */}
                <div className="lg:col-span-5 space-y-4">
                  
                  {/* Admin Approval & Quality Review Feedback Card */}
                  {selectedProductForDetail.approvalStatus === 'Rejected' ? (
                    <div className="p-4 rounded-2xl border border-rose-300 bg-rose-50/90 text-rose-900 space-y-2.5 shadow-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                          <AlertTriangle size={18} />
                        </div>
                        <div>
                          <h5 className="font-extrabold text-xs text-rose-950">Catalog Listing Rejected by Admin</h5>
                          <p className="text-[10px] text-rose-700">This product is blocked from appearing on the student marketplace until corrected</p>
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-white border border-rose-200 text-xs font-medium text-rose-950 shadow-2xs">
                        <strong className="block text-[10px] uppercase tracking-wider text-rose-800 font-extrabold mb-1">
                          Mandatory Admin Rejection Remark:
                        </strong>
                        <p className="italic">"{selectedProductForDetail.rejectionReason || selectedProductForDetail.approvalComment || 'Quality criteria mismatch. Please update details and images.'}"</p>
                      </div>
                      <p className="text-[11px] text-rose-800 font-semibold">
                        👉 To resolve this: Click <strong>"Edit Full Product"</strong> below, fix the highlighted issues, and save to resubmit into the Urgent Approval Queue.
                      </p>
                    </div>
                  ) : selectedProductForDetail.approvalStatus === 'Pending' ? (
                    <div className="p-3.5 rounded-2xl border border-amber-300 bg-amber-50 text-amber-900 flex items-start gap-3 shadow-xs">
                      <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                        <Clock size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="font-extrabold text-xs text-amber-950">Pending Administrative Review</h5>
                          <span className="px-2 py-0.2 rounded-full text-[9px] font-bold bg-amber-200 text-amber-900 uppercase">In Queue</span>
                        </div>
                        <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                          This item is currently under quality and price inspection in the Book Vardi Urgent Approval Queue. You will be notified once approved.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/70 text-emerald-900 flex items-center justify-between shadow-2xs">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                          <CheckCircle size={15} />
                        </div>
                        <div>
                          <span className="font-extrabold text-xs block text-emerald-950">Marketplace Catalog Verified & Approved</span>
                          <span className="text-[10px] text-emerald-800 block opacity-90">
                            {selectedProductForDetail.approvalComment || 'Complies with Book Vardi educational marketplace quality criteria.'}
                          </span>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                        Live Catalog
                      </span>
                    </div>
                  )}

                  {/* Status Alert Banner */}
                  <div className={`p-3.5 rounded-2xl border flex flex-col gap-3 ${
                    (selectedProductForDetail.inStock !== false && (selectedProductForDetail.stockQuantity === undefined || selectedProductForDetail.stockQuantity > 0))
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' 
                      : 'bg-amber-50/70 border-amber-200 text-amber-900'
                  }`}>
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={18} className={(selectedProductForDetail.inStock !== false && (selectedProductForDetail.stockQuantity === undefined || selectedProductForDetail.stockQuantity > 0)) ? 'text-emerald-700' : 'text-amber-700'} />
                      <div>
                        <div className="font-bold text-xs">
                          {(selectedProductForDetail.inStock !== false && (selectedProductForDetail.stockQuantity === undefined || selectedProductForDetail.stockQuantity > 0))
                            ? 'Product is Active & Visible to Parents'
                            : 'Product is Inactive / Hidden from Customers'}
                        </div>
                        <div className="text-[10px] opacity-80 mt-0.5">
                          Toggle the status switch to show or hide this SKU on the customer store in real time.
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleProductStatus(selectedProductForDetail)}
                      className="w-full px-3 py-2 bg-white text-gray-900 font-bold text-xs rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer shadow-2xs text-center"
                    >
                      Switch to {(selectedProductForDetail.inStock !== false && (selectedProductForDetail.stockQuantity === undefined || selectedProductForDetail.stockQuantity > 0)) ? 'Inactive' : 'Active'}
                    </button>
                  </div>

                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => {
                  const toDelete = selectedProductForDetail.id;
                  setSelectedProductForDetail(null);
                  setDeletingProductId(toDelete);
                }}
                className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-xl font-bold transition-colors cursor-pointer"
              >
                Delete Product
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const toEdit = selectedProductForDetail;
                    setSelectedProductForDetail(null);
                    openEditModal(toEdit);
                  }}
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 size={14} /> Edit Full Product
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Bulk Update Modal */}
      <BulkUpdateModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
      />

      {/* Variant & Detail Photo High-Res Lightbox Modal */}
      {previewImageModalUrl && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-4 shadow-2xl border border-gray-100 flex flex-col space-y-3 max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h4 className="font-extrabold text-sm text-gray-900 flex items-center gap-2">
                <ImageIcon size={18} className="text-teal-700" />
                <span>{previewImageModalTitle || 'Variant Detail Photo'}</span>
              </h4>
              <button
                type="button"
                onClick={() => setPreviewImageModalUrl(null)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <div className="relative aspect-4/3 rounded-2xl overflow-hidden bg-gray-50 border border-gray-200 flex items-center justify-center">
              <img
                src={previewImageModalUrl}
                alt="Enlarged Detail"
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                  if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="w-full h-full hidden flex-col items-center justify-center text-gray-400 gap-2">
                <ImageIcon size={36} />
                <span className="text-xs font-medium">Unable to load photo</span>
              </div>
            </div>
            <div className="flex justify-end pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setPreviewImageModalUrl(null)}
                className="px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-gray-800 cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
