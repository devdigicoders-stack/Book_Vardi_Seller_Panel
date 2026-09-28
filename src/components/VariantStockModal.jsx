import React, { useState, useEffect } from 'react';
import { X, Layers, Save, Plus, Minus, Package } from 'lucide-react';
import { resolveImageUrl, parseSizeVariants } from '../utils/mediaUrl';

export default function VariantStockModal({ product, isOpen, onClose, onSave }) {
  const [variants, setVariants] = useState([]);
  const [simpleStock, setSimpleStock] = useState(0);

  useEffect(() => {
    if (product) {
      const parsed = parseSizeVariants(product);
      if (parsed && parsed.length > 0) {
        setVariants(parsed.map(v => ({
          ...v,
          stockQuantity: Number(v.stockQuantity ?? v.stock ?? 0),
          stock: Number(v.stockQuantity ?? v.stock ?? 0)
        })));
      } else {
        setVariants([]);
        setSimpleStock(Number(product.stockQuantity ?? product.stock ?? 0));
      }
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const hasVariants = variants.length > 0;
  const totalVariantStock = hasVariants
    ? variants.reduce((sum, v) => sum + Math.max(0, Number(v.stockQuantity || 0)), 0)
    : Math.max(0, Number(simpleStock || 0));

  const handleVariantStockChange = (index, newQty) => {
    const qty = Math.max(0, Number(newQty) || 0);
    setVariants(prev => prev.map((v, i) => i === index ? { ...v, stockQuantity: qty, stock: qty } : v));
  };

  const handleIncrement = (index, amount = 1) => {
    setVariants(prev => prev.map((v, i) => {
      if (i === index) {
        const current = Number(v.stockQuantity || 0);
        const next = Math.max(0, current + amount);
        return { ...v, stockQuantity: next, stock: next };
      }
      return v;
    }));
  };

  const handleSave = () => {
    if (hasVariants) {
      onSave(product.id || product._id, variants);
    } else {
      onSave(product.id || product._id, totalVariantStock);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-teal-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-teal-800 text-teal-200 border border-teal-700 shrink-0">
              <Layers size={22} />
            </div>
            <div>
              <h3 className="font-display font-extrabold text-base text-white flex items-center gap-2">
                <span>Manage Variant Inventory Stock</span>
              </h3>
              <p className="text-xs text-teal-200 mt-0.5 truncate max-w-md">
                Product: <strong className="text-white">{product.name}</strong> • SKU: <span className="font-mono text-teal-100">{product.sku || `SKU-${product.id}`}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-teal-200 hover:text-white hover:bg-teal-800 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Total Stock Bar */}
        <div className="bg-teal-50 px-6 py-3 border-b border-teal-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-teal-950 font-bold">
            <Package size={16} className="text-teal-700" />
            <span>Total Product Stock:</span>
            <span className="px-2.5 py-0.5 rounded-full bg-teal-700 text-white font-extrabold text-sm">
              {totalVariantStock} pcs
            </span>
          </div>
          <span className="text-[11px] text-teal-800 font-medium">
            {hasVariants ? `${variants.length} Variants Configured` : 'Single Item (No Size Variants)'}
          </span>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-6 space-y-4 flex-1 text-xs">
          {hasVariants ? (
            <div className="space-y-3">
              <p className="text-xs text-gray-500 font-medium">
                Update individual stock quantities for each variant size/option. Total store inventory will automatically recalculate.
              </p>

              <div className="divide-y divide-gray-100 border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                {variants.map((v, idx) => {
                  const vLabel = v.measureValue || v.size || `Variant #${idx + 1}`;
                  const vScale = v.measureScale || v.scaleUnit || 'size';
                  const vImg = v.image || (Array.isArray(v.images) && v.images[0]) || product.image;
                  const vImgUrl = vImg ? resolveImageUrl(vImg) : '';
                  const qty = Number(v.stockQuantity ?? v.stock ?? 0);

                  return (
                    <div key={idx} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/80 transition-colors">
                      {/* Left: Variant info */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-xl bg-gray-100 border border-gray-200 shrink-0 overflow-hidden flex items-center justify-center font-bold text-xs text-teal-900">
                          {vImgUrl ? (
                            <img src={vImgUrl} alt={vLabel} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                          ) : (
                            <span>{vLabel.slice(0, 3)}</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-gray-900">{vLabel}</span>
                            <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-[10px] font-bold uppercase">
                              {vScale}
                            </span>
                            {qty === 0 && (
                              <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-extrabold">
                                Out of Stock
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-gray-500 flex items-center gap-2 mt-0.5">
                            <span>Price: <strong className="text-gray-900">₹{v.price}</strong></span>
                            {v.sku && <span>• SKU: <strong className="font-mono text-gray-700">{v.sku}</strong></span>}
                          </div>
                        </div>
                      </div>

                      {/* Right: Stock adjustment controls */}
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden bg-white shadow-2xs">
                          <button
                            type="button"
                            onClick={() => handleIncrement(idx, -1)}
                            className="p-2 text-gray-600 hover:text-teal-800 hover:bg-teal-50 transition-colors cursor-pointer"
                            title="Decrease by 1"
                          >
                            <Minus size={14} />
                          </button>
                          <input
                            type="number"
                            min="0"
                            value={qty}
                            onChange={(e) => handleVariantStockChange(idx, e.target.value)}
                            className="w-16 text-center font-extrabold text-xs py-1.5 border-x border-gray-200 focus:outline-none focus:bg-teal-50/50"
                          />
                          <button
                            type="button"
                            onClick={() => handleIncrement(idx, 1)}
                            className="p-2 text-gray-600 hover:text-teal-800 hover:bg-teal-50 transition-colors cursor-pointer"
                            title="Increase by 1"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleIncrement(idx, 10)}
                            className="px-2 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-[10px] rounded-lg border border-teal-200 transition-colors cursor-pointer"
                          >
                            +10
                          </button>
                          <button
                            type="button"
                            onClick={() => handleIncrement(idx, 50)}
                            className="px-2 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-[10px] rounded-lg border border-teal-200 transition-colors cursor-pointer"
                          >
                            +50
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-4 text-center">
              <p className="text-xs text-gray-600 font-medium">
                This product does not have individual size variants. Update single stock level below:
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setSimpleStock(prev => Math.max(0, Number(prev) - 1))}
                  className="p-3 rounded-2xl bg-gray-100 hover:bg-teal-100 text-gray-700 hover:text-teal-900 transition-colors cursor-pointer border border-gray-200"
                >
                  <Minus size={18} />
                </button>
                <input
                  type="number"
                  min="0"
                  value={simpleStock}
                  onChange={(e) => setSimpleStock(Math.max(0, Number(e.target.value) || 0))}
                  className="w-28 text-center text-lg font-extrabold py-2.5 border-2 border-teal-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-200"
                />
                <button
                  type="button"
                  onClick={() => setSimpleStock(prev => Math.max(0, Number(prev) + 1))}
                  className="p-3 rounded-2xl bg-gray-100 hover:bg-teal-100 text-gray-700 hover:text-teal-900 transition-colors cursor-pointer border border-gray-200"
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 text-xs font-extrabold text-white bg-teal-800 hover:bg-teal-900 rounded-xl transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Save size={16} /> Save Stock Changes
          </button>
        </div>

      </div>
    </div>
  );
}
