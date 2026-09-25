import React, { useState, useMemo } from 'react';
import { 
  Tag, 
  Plus, 
  Search, 
  Percent, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  XCircle, 
  X, 
  AlertCircle,
  Package,
  Check,
  Layers,
  Sparkles
} from 'lucide-react';
import { useSellerData } from '../context/SellerDataContext';

export default function PromotionsTab() {
  const { promotions, products, addPromotion, deletePromotion, togglePromotionStatus } = useSellerData();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Product selection state for coupon creation
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [formData, setFormData] = useState({
    code: '',
    title: '',
    scope: 'storewide', // 'storewide' | 'specific_product'
    discountType: 'percentage',
    discountValue: 20,
    minOrderValue: 499,
    maxDiscount: 300,
    validFrom: '2026-09-01',
    validUntil: '2026-10-31',
    usageLimit: 500
  });

  // Filter products by ID or Name when searching for specific product coupon
  const searchableProducts = useMemo(() => {
    if (!productSearchQuery.trim()) return products.slice(0, 8);
    const q = productSearchQuery.trim().toLowerCase();
    return products.filter((p) => {
      const matchId = String(p.id).toLowerCase().includes(q);
      const matchSku = p.sku ? String(p.sku).toLowerCase().includes(q) : false;
      const matchName = p.name ? p.name.toLowerCase().includes(q) : false;
      const matchCategory = p.category ? p.category.toLowerCase().includes(q) : false;
      return matchId || matchSku || matchName || matchCategory;
    });
  }, [products, productSearchQuery]);

  const filteredPromotions = useMemo(() => {
    return promotions.filter((p) => {
      const q = searchTerm.toLowerCase();
      return p.code?.toLowerCase().includes(q) || p.title?.toLowerCase().includes(q);
    });
  }, [promotions, searchTerm]);

  const handleCreate = (e) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      if (!formData.code.trim()) {
        setErrorMsg('Coupon code is required.');
        return;
      }
      if (Number(formData.discountValue) <= 0) {
        setErrorMsg('Discount value must be greater than 0.');
        return;
      }

      if (formData.scope === 'specific_product' && !selectedProduct) {
        setErrorMsg('Please select a specific product for this coupon.');
        return;
      }

      addPromotion({
        ...formData,
        code: formData.code.toUpperCase(),
        discountValue: Number(formData.discountValue),
        minOrderValue: Number(formData.minOrderValue),
        maxDiscount: Number(formData.maxDiscount),
        usageLimit: Number(formData.usageLimit),
        specificProductId: formData.scope === 'specific_product' ? selectedProduct?.id : null,
        specificProductName: formData.scope === 'specific_product' ? selectedProduct?.name : null,
        specificProductSku: formData.scope === 'specific_product' ? selectedProduct?.sku : null,
        specificProductImage: formData.scope === 'specific_product' ? selectedProduct?.image : null
      });

      setIsAddModalOpen(false);
      setSelectedProduct(null);
      setProductSearchQuery('');
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-xs border border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Tag className="text-teal-700" size={24} /> Promotional Discounts & Coupons
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Create coupon campaigns, back-to-school promotional vouchers, and product-specific discount codes
          </p>
        </div>

        <button
          onClick={() => {
            setErrorMsg('');
            setSelectedProduct(null);
            setProductSearchQuery('');
            setFormData({
              code: '',
              title: '',
              scope: 'storewide',
              discountType: 'percentage',
              discountValue: 15,
              minOrderValue: 499,
              maxDiscount: 250,
              validFrom: new Date().toISOString().split('T')[0],
              validUntil: '2026-12-31',
              usageLimit: 500
            });
            setIsAddModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
        >
          <Plus size={16} /> Create New Coupon
        </button>
      </div>

      {/* Coupons Grid */}
      {filteredPromotions.length === 0 ? (
        <div className="p-14 text-center bg-white rounded-2xl border border-gray-100 text-gray-500 col-span-full">
          <Tag size={44} className="mx-auto text-gray-300 mb-3" />
          <h4 className="font-extrabold text-base text-gray-900 mb-1">No Active Coupons or Promotions</h4>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
            Boost customer checkout conversions by offering custom promotional discount codes or storewide coupons.
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-teal hover:bg-brand-teal-light text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer"
          >
            <Plus size={16} /> Create First Coupon Code
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPromotions.map((p) => {
          const isActive = p.status === 'active';
          return (
            <div key={p.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-teal-200 transition-all">
              
              <div>
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {p.status?.toUpperCase()}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => togglePromotionStatus(p.id)}
                      className="text-xs text-teal-700 hover:text-teal-900 font-medium px-2 py-0.5 rounded-md hover:bg-teal-50"
                    >
                      {isActive ? 'Expire' : 'Activate'}
                    </button>
                    <button
                      onClick={() => deletePromotion(p.id)}
                      className="text-gray-400 hover:text-red-600 p-1 rounded-md"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-lg font-black text-teal-900 tracking-wider">
                      {p.code}
                    </span>
                    {p.scope === 'product' || p.specificProductId ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        <Package size={11} /> Specific Product
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                        <Layers size={11} /> Storewide
                      </span>
                    )}
                  </div>
                  <div className="font-semibold text-gray-800 text-xs mt-0.5">{p.title}</div>
                  
                  {/* Linked Product Banner if applicable */}
                  {(p.scope === 'product' || p.specificProductId) && (
                    <div className="mt-2 p-2 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-center gap-2 text-[11px] text-amber-950">
                      {p.specificProductImage && (
                        <img 
                          src={p.specificProductImage} 
                          alt="" 
                          className="w-7 h-7 rounded-lg object-cover bg-white border border-amber-200 shrink-0" 
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-bold truncate text-[11px]">{p.specificProductName || `Product ID: ${p.specificProductId}`}</div>
                        {p.specificProductSku && (
                          <div className="text-[9px] font-mono text-amber-800 opacity-80">{p.specificProductSku}</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-3 bg-gray-50 p-3 rounded-xl text-xs space-y-1 text-gray-600">
                  <div className="flex justify-between">
                    <span>Discount</span>
                    <span className="font-bold text-gray-900">
                      {p.discountType === 'percentage' ? `${p.discountValue}% OFF` : `₹${p.discountValue} FLAT`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Min. Order</span>
                    <span className="font-semibold text-gray-800">₹{p.minOrderValue}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Max. Discount Cap</span>
                    <span className="font-semibold text-gray-800">₹{p.maxDiscount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Validity</span>
                    <span className="text-[11px] text-gray-500">{p.validUntil}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <span>Redemptions: <strong className="text-gray-800">{p.usageCount || 0}</strong> / {p.usageLimit || 500}</span>
                <span className="text-[10px] text-teal-700 font-medium">{Math.round(((p.usageCount || 0) / (p.usageLimit || 500)) * 100)}% Used</span>
              </div>

            </div>
          );
        })}
      </div>
      )}

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 text-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h4 className="font-bold text-gray-900 text-base">Create Discount Coupon</h4>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-1.5">
                <AlertCircle size={15} /> {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-3">
              <div className="space-y-1">
                <label className="font-semibold text-gray-700">Coupon Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. UNIFORM20"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 font-mono uppercase font-bold text-teal-900 focus:outline-none focus:border-teal-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-gray-700">Campaign Title</label>
                <input
                  type="text"
                  placeholder="Back to School Season Offer"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none"
                />
              </div>

              {/* Coupon Scope: Storewide or Specific Product */}
              <div className="space-y-2 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                <label className="font-bold text-gray-800 text-[11px] block">Applicability Scope</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, scope: 'storewide' });
                      setSelectedProduct(null);
                    }}
                    className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer text-xs ${
                      formData.scope === 'storewide'
                        ? 'bg-teal-800 text-white shadow-xs'
                        : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <Layers size={13} />
                    <span>All Products</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, scope: 'specific_product' })}
                    className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer text-xs ${
                      formData.scope === 'specific_product'
                        ? 'bg-amber-500 text-teal-950 shadow-xs'
                        : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <Package size={13} />
                    <span>Specific Product</span>
                  </button>
                </div>

                {/* Specific Product Picker */}
                {formData.scope === 'specific_product' && (
                  <div className="pt-2 space-y-2 animate-in fade-in">
                    <label className="font-semibold text-gray-700 text-[11px] flex items-center justify-between">
                      <span>Select Target Product</span>
                      <span className="text-[10px] text-teal-700 font-normal">Search by ID, SKU, or Name</span>
                    </label>

                    {/* Selected Product Pill */}
                    {selectedProduct ? (
                      <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={selectedProduct.image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100&auto=format&fit=crop&q=80'}
                            alt=""
                            className="w-9 h-9 rounded-lg object-cover border border-emerald-200 shrink-0 bg-white"
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-gray-900 truncate text-xs">{selectedProduct.name}</div>
                            <div className="text-[10px] text-emerald-800 font-mono flex items-center gap-2">
                              <span>ID: {selectedProduct.id}</span>
                              {selectedProduct.sku && <span>• {selectedProduct.sku}</span>}
                              <span>• ₹{selectedProduct.price}</span>
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedProduct(null)}
                          className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-white cursor-pointer"
                          title="Choose a different product"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {/* Search Input */}
                        <div className="relative">
                          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Type product ID (e.g. 1) or product name..."
                            value={productSearchQuery}
                            onChange={(e) => setProductSearchQuery(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white rounded-xl border border-gray-200 focus:outline-none focus:border-teal-600"
                          />
                        </div>

                        {/* Search Results Dropdown List */}
                        <div className="max-h-40 overflow-y-auto rounded-xl border border-gray-200 bg-white divide-y divide-gray-100 shadow-2xs">
                          {searchableProducts.length === 0 ? (
                            <div className="p-3 text-center text-gray-400 text-[11px]">
                              No products found matching "{productSearchQuery}".
                            </div>
                          ) : (
                            searchableProducts.map((prod) => (
                              <div
                                key={prod.id}
                                onClick={() => {
                                  setSelectedProduct(prod);
                                  setProductSearchQuery('');
                                }}
                                className="p-2 flex items-center justify-between gap-2 hover:bg-teal-50/60 cursor-pointer transition-colors"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <img
                                    src={prod.image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100&auto=format&fit=crop&q=80'}
                                    alt=""
                                    className="w-7 h-7 rounded-lg object-cover border border-gray-100 shrink-0 bg-gray-50"
                                  />
                                  <div className="min-w-0">
                                    <div className="font-bold text-gray-900 truncate text-[11px]">{prod.name}</div>
                                    <div className="text-[9px] text-gray-500 font-mono">
                                      ID: {prod.id} {prod.sku && `• ${prod.sku}`} • ₹{prod.price}
                                    </div>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  className="text-[10px] font-bold text-teal-700 px-2 py-0.5 rounded-md bg-teal-50 hover:bg-teal-100 shrink-0"
                                >
                                  Select
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Type</label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat Amount (₹)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Value *</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Min Order (₹)</label>
                  <input
                    type="number"
                    value={formData.minOrderValue}
                    onChange={(e) => setFormData({ ...formData, minOrderValue: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Max Discount (₹)</label>
                  <input
                    type="number"
                    value={formData.maxDiscount}
                    onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-gray-700">Valid Until</label>
                <input
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200"
                />
              </div>

              <div className="flex gap-2 pt-2">
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
                  Create Promo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
