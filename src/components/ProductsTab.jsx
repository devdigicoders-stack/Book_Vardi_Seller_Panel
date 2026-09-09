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
  Info
} from 'lucide-react';
import { useSellerData } from '../context/SellerDataContext';
import BulkUpdateModal from './BulkUpdateModal';
import ImageUploadDropzone from './ImageUploadDropzone';

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
  const { products, addProduct, editProduct, toggleProductStatus, deleteProduct, isApproved } = useSellerData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stockFilter, setStockFilter] = useState('all'); // all | in_stock | low_stock | out_of_stock
  const [sortBy, setSortBy] = useState('newest');

  // Modals state
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingProductId, setDeletingProductId] = useState(null);
  const [selectedProductForDetail, setSelectedProductForDetail] = useState(null);
  const [detailActiveImg, setDetailActiveImg] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const stockInputRef = useRef(null);

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    name: '',
    subtitle: '',
    category: 'uniforms',
    price: '',
    originalPrice: '',
    discountBadge: 'NEW',
    stockQuantity: 50,
    sizes: 'S, M, L, XL',
    colors: 'Navy Blue, White',
    gender: 'Unisex',
    image: '',
    images: [],
    description: '',
    sku: ''
  });

  const openAddModal = () => {
    setErrorMsg('');
    const defaultImg = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=80';
    setFormData({
      name: '',
      subtitle: '',
      category: 'uniforms',
      price: '',
      originalPrice: '',
      discountBadge: 'NEW',
      stockQuantity: 50,
      sizes: 'S, M, L, XL',
      colors: 'Navy Blue, White',
      gender: 'Unisex',
      image: defaultImg,
      images: [defaultImg],
      description: 'Authentic school product made with premium materials.',
      sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`
    });
    setIsAddModalOpen(true);
  };

  const openEditModal = (p, options = {}) => {
    setErrorMsg('');
    setEditingProduct(p);
    const prodImages = Array.isArray(p.images) && p.images.length > 0 
      ? p.images 
      : (p.image ? [p.image] : []);
    const stockValue = options.forcePositiveStock && Number(p.stockQuantity ?? 0) <= 0 ? 1 : (p.stockQuantity ?? (p.inStock ? 50 : 0));

    setFormData({
      name: p.name || '',
      subtitle: p.subtitle || '',
      category: p.category || 'uniforms',
      price: p.price ?? '',
      originalPrice: p.originalPrice ?? '',
      discountBadge: p.discountBadge || '',
      stockQuantity: stockValue,
      sizes: Array.isArray(p.sizes) ? p.sizes.join(', ') : (p.sizes || 'S, M, L'),
      colors: Array.isArray(p.colors) ? p.colors.join(', ') : (p.colors || 'Navy Blue'),
      gender: p.gender || 'Unisex',
      image: prodImages[0] || p.image || '',
      images: prodImages,
      description: p.description || '',
      sku: p.sku || `SKU-${p.id}`
    });

    if (options.focusStock) {
      setTimeout(() => {
        stockInputRef.current?.focus();
        stockInputRef.current?.select();
      }, 80);
    }
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

      const imagesList = (formData.images && formData.images.length > 0)
        ? formData.images
        : (formData.image ? [formData.image] : []);
      const primaryImg = imagesList[0] || formData.image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=80';

      const payload = {
        ...formData,
        image: primaryImg,
        images: imagesList,
        price: Number(formData.price),
        originalPrice: Number(formData.originalPrice) || Math.round(Number(formData.price) * 1.25),
        stockQuantity: Number(formData.stockQuantity) || 0,
        inStock: Number(formData.stockQuantity) > 0,
        sizes: formData.sizes.split(',').map(s => s.trim()).filter(Boolean),
        colors: formData.colors.split(',').map(c => c.trim()).filter(Boolean)
      };

      if (editingProduct) {
        editProduct(editingProduct.id, payload);
        setEditingProduct(null);
      } else {
        addProduct(payload);
        setIsAddModalOpen(false);
      }
    } catch (err) {
      setErrorMsg(err.message);
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

      return matchesSearch && matchesCategory && matchesStock;
    }).sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      if (sortBy === 'stock_desc') return (b.stockQuantity ?? 50) - (a.stockQuantity ?? 50);
      return b.id - a.id;
    });
  }, [products, searchTerm, selectedCategory, stockFilter, sortBy]);

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
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-600 uppercase font-semibold tracking-wider border-b border-gray-100">
              <tr>
                <th className="py-3 px-4">Product Info</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Price & MRP</th>
                <th className="py-3 px-3">Stock Units</th>
                <th className="py-3 px-3">Sizes & Gender</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-gray-500">
                    <Package size={40} className="mx-auto text-gray-300 mb-2" />
                    No products found matching your search and filter criteria.
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
                                src={p.image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100&auto=format&fit=crop&q=80'}
                                alt={p.name}
                                className="w-12 h-12 rounded-xl object-cover border border-gray-100 bg-gray-100 group-hover:ring-2 group-hover:ring-teal-600 transition-all"
                                onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100&auto=format&fit=crop&q=80'; }}
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
                          {p.discountBadge && (
                            <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800">
                              {p.discountBadge}
                            </span>
                          )}
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

      {/* Add / Edit Product Modal */}
      {(isAddModalOpen || editingProduct) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-bold text-gray-900 text-base">
                {editingProduct ? 'Edit Product Details' : 'Add New Product'}
              </h3>
              <button
                onClick={() => { setIsAddModalOpen(false); setEditingProduct(null); }}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100"
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
                    placeholder="e.g. Navy Blue Winter Blazer"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-teal-600 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Subtitle / Highlights</label>
                  <input
                    type="text"
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    placeholder="e.g. 100% Wool • Class 6-10"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-teal-600 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-teal-600 focus:outline-none"
                  >
                    {CATEGORIES.filter(c => c.id !== 'all').map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-teal-600 focus:outline-none"
                  >
                    <option value="Unisex">Unisex</option>
                    <option value="Boys">Boys</option>
                    <option value="Girls">Girls</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Selling Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="949"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-teal-600 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">MRP / Original Price (₹)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.originalPrice}
                    onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                    placeholder="1299"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-teal-600 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Stock Quantity Units</label>
                  <input
                    ref={stockInputRef}
                    type="number"
                    min="1"
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                    placeholder="50"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-teal-600 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Discount Badge</label>
                  <input
                    type="text"
                    value={formData.discountBadge}
                    onChange={(e) => setFormData({ ...formData, discountBadge: e.target.value })}
                    placeholder="25% OFF or BESTSELLER"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-teal-600 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Available Sizes (Comma-separated)</label>
                  <input
                    type="text"
                    value={formData.sizes}
                    onChange={(e) => setFormData({ ...formData, sizes: e.target.value })}
                    placeholder="S (32), M (34), L (36), XL (38)"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-teal-600 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Available Colors</label>
                  <input
                    type="text"
                    value={formData.colors}
                    onChange={(e) => setFormData({ ...formData, colors: e.target.value })}
                    placeholder="Navy Blue, White, Grey"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-teal-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-gray-700 block text-xs">
                  Product Photos (Drag & Drop Multiple Images) *
                </label>
                <ImageUploadDropzone
                  images={formData.images || []}
                  onChange={(newImgs) => {
                    setFormData({
                      ...formData,
                      images: newImgs,
                      image: newImgs[0] || ''
                    });
                  }}
                  maxImages={8}
                  helperText="Drag & drop product photos here, or browse files"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-gray-700">Product Description</label>
                <textarea
                  rows="2"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed material, school compliance, and wash care instructions..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-teal-600 focus:outline-none"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => { setIsAddModalOpen(false); setEditingProduct(null); }}
                  className="px-4 py-2 font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-xs"
                >
                  {editingProduct ? 'Update Product' : 'Save Product'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

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

      {/* Product Brief Detail Modal */}
      {selectedProductForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gray-50/80 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-teal-100/70 text-teal-800 rounded-xl">
                  <Package size={18} />
                </span>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Product Overview</h3>
                  <p className="text-[11px] text-gray-500 font-mono">
                    {selectedProductForDetail.sku || `SKU-${selectedProductForDetail.id}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Status toggle pill inside modal */}
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
                  className="text-gray-400 hover:text-gray-700 p-1.5 rounded-xl hover:bg-gray-200/60 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              
              {/* Product Hero Top Box */}
              <div className="flex flex-col sm:flex-row gap-4 items-start bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <div className="flex flex-col items-center gap-2 shrink-0">
                  <img
                    src={(Array.isArray(selectedProductForDetail.images) && selectedProductForDetail.images[detailActiveImg]) || selectedProductForDetail.image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&auto=format&fit=crop&q=80'}
                    alt={selectedProductForDetail.name}
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover bg-white border border-gray-200 shrink-0 shadow-xs"
                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&auto=format&fit=crop&q=80'; }}
                  />
                  {Array.isArray(selectedProductForDetail.images) && selectedProductForDetail.images.length > 1 && (
                    <div className="flex gap-1.5 max-w-[120px] overflow-x-auto pb-1">
                      {selectedProductForDetail.images.map((img, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setDetailActiveImg(idx)}
                          className={`w-7 h-7 rounded-lg overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                            detailActiveImg === idx ? 'border-teal-700 scale-105 shadow-2xs' : 'border-gray-200 opacity-60 hover:opacity-100'
                          }`}
                        >
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-teal-800 text-white tracking-wider">
                      {selectedProductForDetail.category || 'Uniforms'}
                    </span>
                    {selectedProductForDetail.discountBadge && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-amber-100 text-amber-900 border border-amber-300">
                        {selectedProductForDetail.discountBadge}
                      </span>
                    )}
                  </div>

                  <h4 className="font-extrabold text-gray-900 text-base leading-snug">
                    {selectedProductForDetail.name}
                  </h4>

                  <p className="text-gray-600 text-xs line-clamp-2">
                    {selectedProductForDetail.subtitle || selectedProductForDetail.description || 'Verified school marketplace product listed with Book Vardi.'}
                  </p>

                  <div className="pt-1 flex items-baseline gap-2">
                    <span className="font-black text-teal-900 text-lg">
                      ₹{selectedProductForDetail.price}
                    </span>
                    {selectedProductForDetail.originalPrice && selectedProductForDetail.originalPrice > selectedProductForDetail.price && (
                      <span className="text-xs text-gray-400 line-through">
                        ₹{selectedProductForDetail.originalPrice}
                      </span>
                    )}
                    {selectedProductForDetail.originalPrice && selectedProductForDetail.originalPrice > selectedProductForDetail.price && (
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                        {Math.round(((selectedProductForDetail.originalPrice - selectedProductForDetail.price) / selectedProductForDetail.originalPrice) * 100)}% off
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="block text-[10px] font-bold uppercase text-gray-400">Stock In Hand</span>
                  <span className="text-sm font-extrabold text-gray-900 flex items-center gap-1 mt-0.5">
                    {selectedProductForDetail.stockQuantity ?? (selectedProductForDetail.inStock ? 50 : 0)} pcs
                  </span>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="block text-[10px] font-bold uppercase text-gray-400">Marketplace Rating</span>
                  <span className="text-sm font-extrabold text-amber-700 flex items-center gap-1 mt-0.5">
                    ★ {selectedProductForDetail.rating || 5.0} ({selectedProductForDetail.reviewsCount || 0})
                  </span>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="block text-[10px] font-bold uppercase text-gray-400">Target Fit</span>
                  <span className="text-sm font-extrabold text-gray-900 capitalize mt-0.5">
                    {selectedProductForDetail.gender || 'Unisex'}
                  </span>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="block text-[10px] font-bold uppercase text-gray-400">Listing Status</span>
                  <span className={`text-sm font-extrabold mt-0.5 ${(selectedProductForDetail.inStock !== false && (selectedProductForDetail.stockQuantity === undefined || selectedProductForDetail.stockQuantity > 0)) ? 'text-emerald-700' : 'text-red-700'}`}>
                    {(selectedProductForDetail.inStock !== false && (selectedProductForDetail.stockQuantity === undefined || selectedProductForDetail.stockQuantity > 0)) ? 'Live / Active' : 'Suspended'}
                  </span>
                </div>
              </div>

              {/* Attributes Section */}
              <div className="space-y-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs">
                <div>
                  <span className="block text-[11px] font-bold text-gray-500 mb-1.5">Available Sizes & Dimensions</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(Array.isArray(selectedProductForDetail.sizes)
                      ? selectedProductForDetail.sizes
                      : (selectedProductForDetail.sizes || 'S, M, L').split(',')
                    ).map((s, idx) => (
                      <span key={idx} className="px-2.5 py-1 bg-gray-100 text-gray-800 font-bold rounded-lg border border-gray-200/60 text-[11px]">
                        {String(s).trim()}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="block text-[11px] font-bold text-gray-500 mb-1.5">Colors & Hues</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(Array.isArray(selectedProductForDetail.colors)
                      ? selectedProductForDetail.colors
                      : (selectedProductForDetail.colors || 'Navy Blue').split(',')
                    ).map((c, idx) => (
                      <span key={idx} className="px-2.5 py-1 bg-teal-50 text-teal-900 font-semibold rounded-lg border border-teal-200/60 text-[11px]">
                        {String(c).trim()}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="block text-[11px] font-bold text-gray-500 mb-1">Full Description & Compliance</span>
                  <p className="text-gray-700 text-[11px] leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100">
                    {selectedProductForDetail.description || 'Pre-shrunk, skin-friendly fabric designed to meet CBSE, ICSE, and state educational board standards for durability and color fastness.'}
                  </p>
                </div>
              </div>

              {/* Status Alert Banner */}
              <div className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
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
                      Toggle the status switch above to show or hide this SKU on the customer store in real time.
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleProductStatus(selectedProductForDetail)}
                  className="px-3 py-1.5 bg-white text-gray-900 font-bold text-[11px] rounded-xl border border-gray-200 hover:bg-gray-50 shrink-0 cursor-pointer shadow-2xs"
                >
                  Switch to {(selectedProductForDetail.inStock !== false && (selectedProductForDetail.stockQuantity === undefined || selectedProductForDetail.stockQuantity > 0)) ? 'Inactive' : 'Active'}
                </button>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between">
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

    </div>
  );
}
