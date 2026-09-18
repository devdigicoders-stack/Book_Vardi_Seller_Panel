import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Package,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Layers,
  Image as ImageIcon,
  Plus,
  Trash2,
  UploadCloud,
  Check,
  Tag,
  Boxes,
  Eye,
  Info,
  ChevronDown,
  X,
  Sliders,
  ShieldCheck,
  Save,
  RotateCcw
} from 'lucide-react';
import ImageUploadDropzone from './ImageUploadDropzone';

// Sizing Matrix Presets for Schools & Uniforms
const SIZE_PRESETS = [
  {
    id: 'standard',
    label: 'Standard (S - XXL)',
    sizes: ['S', 'M', 'L', 'XL', 'XXL']
  },
  {
    id: 'uniform_waist',
    label: 'Uniform Waist / Chest (26 - 38)',
    sizes: ['26', '28', '30', '32', '34', '36', '38']
  },
  {
    id: 'junior_age',
    label: 'Junior / Age (3Y - 12Y)',
    sizes: ['3-4 Yrs', '5-6 Yrs', '7-8 Yrs', '9-10 Yrs', '11-12 Yrs']
  },
  {
    id: 'shoes',
    label: 'Footwear (UK 3 - 10)',
    sizes: ['UK 3', 'UK 4', 'UK 5', 'UK 6', 'UK 7', 'UK 8', 'UK 9', 'UK 10']
  },
  {
    id: 'single',
    label: 'Free Size',
    sizes: ['Free Size']
  }
];

const CATEGORIES = [
  { id: 'uniforms', label: 'Uniforms & Blazers' },
  { id: 'shoes', label: 'Shoes & Socks' },
  { id: 'rain_winter', label: 'Winter & Rain Kits' },
  { id: 'sports', label: 'Sports Wear' },
  { id: 'ncert', label: 'NCERT Books' },
  { id: 'practice_books', label: 'Practice & Olympiad' },
  { id: 'drawing_books', label: 'Drawing & Art' },
  { id: 'stationery', label: 'Pens & Stationery' }
];

export default function SellerProductFormPage({ product, onSave, onBack }) {
  const isEdit = Boolean(product);

  const [formData, setFormData] = useState({
    name: '',
    subtitle: '',
    price: '',
    originalPrice: '',
    category: 'uniforms',
    subCategory: '',
    schoolName: '',
    gender: 'Unisex',
    discountBadge: 'NEW',
    stockQuantity: '50',
    material: '',
    brand: '',
    paymentMethodAllowed: 'Both',
    description: '',
    sku: '',
    image: '',
    images: []
  });

  const [sizeVariants, setSizeVariants] = useState([]);
  const [customSizeInput, setCustomSizeInput] = useState('');
  const [batchBasePrice, setBatchBasePrice] = useState('');
  const [batchBaseMrp, setBatchBaseMrp] = useState('');
  const [batchBaseStock, setBatchBaseStock] = useState('25');

  // Modal for picking a gallery image for a specific variant
  const [activeVariantForGallery, setActiveVariantForGallery] = useState(null);

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'variants' | 'media'

  const fileInputRef = useRef(null);
  const [uploadingVariantIndex, setUploadingVariantIndex] = useState(null);

  // Initialize form
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (product) {
      const prodImages = Array.isArray(product.images) && product.images.length > 0
        ? product.images
        : (product.image ? [product.image] : []);

      setFormData({
        name: product.name || '',
        subtitle: product.subtitle || '',
        price: product.price !== undefined ? String(product.price) : '',
        originalPrice: product.originalPrice || product.mrp ? String(product.originalPrice || product.mrp) : '',
        category: product.category || 'uniforms',
        subCategory: product.subCategory || '',
        schoolName: product.schoolName || '',
        gender: product.gender || 'Unisex',
        discountBadge: product.discountBadge || product.badge || 'NEW',
        stockQuantity: product.stockQuantity !== undefined ? String(product.stockQuantity) : (product.stock !== undefined ? String(product.stock) : '50'),
        material: product.material || '',
        brand: product.brand || '',
        paymentMethodAllowed: product.paymentMethodAllowed || 'Both',
        description: product.description || '',
        sku: product.sku || '',
        image: prodImages[0] || product.image || '',
        images: prodImages
      });

      // Load sizeVariants if existing
      if (Array.isArray(product.sizeVariants) && product.sizeVariants.length > 0) {
        setSizeVariants(product.sizeVariants.map(v => ({
          size: v.size || '',
          price: v.price !== undefined ? String(v.price) : String(product.price || ''),
          mrp: v.mrp !== undefined ? String(v.mrp) : String(product.originalPrice || product.mrp || ''),
          stock: v.stock !== undefined ? String(v.stock) : '25',
          image: v.image || '',
          sku: v.sku || (product.sku ? `${product.sku}-${v.size}` : '')
        })));
      } else if (Array.isArray(product.sizes) && product.sizes.length > 0) {
        // Migration: convert simple sizes array to sizeVariants with root price/image
        setSizeVariants(product.sizes.map(s => ({
          size: s,
          price: String(product.price || ''),
          mrp: String(product.originalPrice || product.mrp || ''),
          stock: '25',
          image: prodImages[0] || '',
          sku: product.sku ? `${product.sku}-${s}` : ''
        })));
      } else {
        setSizeVariants([]);
      }
    } else {
      setFormData({
        name: '',
        subtitle: '',
        price: '',
        originalPrice: '',
        category: 'uniforms',
        subCategory: '',
        schoolName: '',
        gender: 'Unisex',
        discountBadge: 'NEW',
        stockQuantity: '50',
        material: '',
        brand: '',
        paymentMethodAllowed: 'Both',
        description: 'Premium quality academic product, tailored with durable, breathable fabrics.',
        sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
        image: '',
        images: []
      });
      setSizeVariants([]);
    }
  }, [product]);

  // Handle Preset Selection
  const applySizePreset = (presetSizes) => {
    const defaultPrice = formData.price || '499';
    const defaultMrp = formData.originalPrice || Math.round(Number(defaultPrice || 499) * 1.25).toString();
    const defaultImage = formData.images[0] || formData.image || '';

    const newVariants = presetSizes.map(size => {
      const existing = sizeVariants.find(v => v.size.toLowerCase() === size.toLowerCase());
      if (existing) return existing;
      return {
        size,
        price: defaultPrice,
        mrp: defaultMrp,
        stock: '25',
        image: defaultImage,
        sku: formData.sku ? `${formData.sku}-${size}` : `SKU-${size}`
      };
    });

    setSizeVariants(newVariants);
  };

  // Add a single custom size
  const handleAddCustomSize = (e) => {
    e?.preventDefault();
    const trimmed = customSizeInput.trim();
    if (!trimmed) return;
    if (sizeVariants.some(v => v.size.toLowerCase() === trimmed.toLowerCase())) {
      setError(`Size "${trimmed}" already exists in the variant list.`);
      return;
    }

    const defaultPrice = formData.price || '499';
    const defaultMrp = formData.originalPrice || Math.round(Number(defaultPrice || 499) * 1.25).toString();
    const defaultImage = formData.images[0] || formData.image || '';

    setSizeVariants(prev => [
      ...prev,
      {
        size: trimmed,
        price: defaultPrice,
        mrp: defaultMrp,
        stock: '25',
        image: defaultImage,
        sku: formData.sku ? `${formData.sku}-${trimmed}` : `SKU-${trimmed}`
      }
    ]);
    setCustomSizeInput('');
    setError('');
  };

  // Remove a variant
  const handleRemoveVariant = (index) => {
    setSizeVariants(prev => prev.filter((_, i) => i !== index));
  };

  // Update a single field on a specific variant
  const handleUpdateVariant = (index, field, value) => {
    setSizeVariants(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // Batch Apply to all size variants
  const handleBatchApply = () => {
    if (!batchBasePrice && !batchBaseMrp && !batchBaseStock) {
      setError('Enter at least a price, MRP, or stock quantity to batch update.');
      return;
    }
    setError('');
    setSizeVariants(prev => prev.map(v => ({
      ...v,
      price: batchBasePrice ? batchBasePrice : v.price,
      mrp: batchBaseMrp ? batchBaseMrp : v.mrp,
      stock: batchBaseStock ? batchBaseStock : v.stock
    })));
  };

  // Trigger file upload for a variant image
  const triggerVariantImageUpload = (index) => {
    setUploadingVariantIndex(index);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleVariantFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file || uploadingVariantIndex === null) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      handleUpdateVariant(uploadingVariantIndex, 'image', dataUrl);
      // Also add to gallery if not already present
      setFormData(prev => ({
        ...prev,
        images: prev.images.includes(dataUrl) ? prev.images : [...prev.images, dataUrl]
      }));
      setUploadingVariantIndex(null);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Select a gallery image for a variant
  const handleAssignGalleryImageToVariant = (imageUrl) => {
    if (activeVariantForGallery !== null) {
      handleUpdateVariant(activeVariantForGallery, 'image', imageUrl);
      setActiveVariantForGallery(null);
    }
  };

  // Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Please provide a product title/name.');
      setActiveTab('general');
      return;
    }

    // Automatically compute root price & stock from size variants if variants exist
    let computedPrice = Number(formData.price) || 0;
    let computedMrp = Number(formData.originalPrice) || Math.round(computedPrice * 1.25);
    let computedStock = Number(formData.stockQuantity) || 0;

    if (sizeVariants.length > 0) {
      const variantPrices = sizeVariants.map(v => Number(v.price) || 0).filter(p => p > 0);
      if (variantPrices.length > 0) {
        computedPrice = Math.min(...variantPrices);
      }
      const variantMrps = sizeVariants.map(v => Number(v.mrp) || 0).filter(m => m > 0);
      if (variantMrps.length > 0) {
        computedMrp = Math.max(...variantMrps);
      }
      computedStock = sizeVariants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
    } else {
      if (computedPrice <= 0) {
        setError('Please set a valid selling price greater than 0.');
        setActiveTab('general');
        return;
      }
    }

    const primaryImage = formData.images[0] || formData.image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=80';

    const payload = {
      ...formData,
      price: computedPrice,
      originalPrice: computedMrp,
      mrp: computedMrp,
      stockQuantity: computedStock,
      stock: computedStock,
      image: primaryImage,
      images: formData.images.length > 0 ? formData.images : [primaryImage],
      sizes: sizeVariants.length > 0 ? sizeVariants.map(v => v.size) : ['Free Size'],
      sizeVariants: sizeVariants.map(v => ({
        size: v.size,
        price: Number(v.price) || computedPrice,
        mrp: Number(v.mrp) || computedMrp,
        stock: Number(v.stock) || 0,
        image: v.image || primaryImage,
        sku: v.sku || `${formData.sku}-${v.size}`
      }))
    };

    setSubmitting(true);
    try {
      await onSave(payload);
    } catch (err) {
      setError(err.message || 'Failed to save product. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Preview variant
  const previewVariant = sizeVariants[0];
  const previewPrice = previewVariant?.price ? Number(previewVariant.price) : (Number(formData.price) || 499);
  const previewMrp = previewVariant?.mrp ? Number(previewVariant.mrp) : (Number(formData.originalPrice) || Math.round(previewPrice * 1.25));
  const previewImage = previewVariant?.image || formData.images[0] || formData.image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=80';

  return (
    <div className="space-y-6 pb-20">
      
      {/* Hidden File Input for Variant-specific upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleVariantFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-xs border border-gray-100">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl transition-colors cursor-pointer border border-gray-200"
            title="Back to Catalog"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
              <span>Merchant Catalog</span>
              <span>/</span>
              <span className="text-brand-teal">{isEdit ? 'Edit Product' : 'Add New Product'}</span>
            </div>
            <h1 className="font-display font-extrabold text-2xl text-gray-900 mt-0.5">
              {isEdit ? `Edit: ${formData.name || 'Product'}` : 'Create New School Product'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-teal hover:bg-brand-teal-light text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <>
                <RotateCcw className="animate-spin" size={16} /> Saving to Catalog...
              </>
            ) : (
              <>
                <Save size={16} /> {isEdit ? 'Update Product' : 'Publish Product to Store'}
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="shrink-0 text-rose-600" size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Main Form Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
        {[
          { id: 'general', label: '1. General Info & Pricing', icon: Tag },
          { id: 'variants', label: `2. Sizing & Variants Matrix (${sizeVariants.length})`, icon: Layers },
          { id: 'media', label: `3. Gallery Photos (${formData.images.length})`, icon: ImageIcon }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-brand-teal text-white shadow-xs'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Grid: 2 Column Layout with Live Preview on the right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Form Controls (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">

          {/* TAB 1: GENERAL INFORMATION */}
          {activeTab === 'general' && (
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-5">
              <div>
                <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                  <Tag className="text-brand-teal" size={18} /> General Catalog Information
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Core descriptive parameters shown to students, parents, and schools.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Product Title / Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. DPS Navy Blue Cotton Uniform Shirt"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Subtitle / Short Pitch
                  </label>
                  <input
                    type="text"
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    placeholder="e.g. 100% Breathable Combed Cotton, Pre-shrunk Fabric"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Category <span className="text-rose-600">*</span>
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 outline-none cursor-pointer"
                    >
                      {CATEGORIES.map(c => (
                        <option key={c.id} value={c.id}>{c.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Sub-Category / Item Type
                    </label>
                    <input
                      type="text"
                      value={formData.subCategory}
                      onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
                      placeholder="e.g. Shirts, Blazers, Tracksuits, Notebooks"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Target School Name
                    </label>
                    <input
                      type="text"
                      value={formData.schoolName}
                      onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                      placeholder="e.g. Delhi Public School / All"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Gender Suitability
                    </label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 outline-none cursor-pointer"
                    >
                      <option value="Unisex">Unisex (All Students)</option>
                      <option value="Boy">Boys Only</option>
                      <option value="Girl">Girls Only</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Badge / Tag
                    </label>
                    <input
                      type="text"
                      value={formData.discountBadge}
                      onChange={(e) => setFormData({ ...formData, discountBadge: e.target.value })}
                      placeholder="e.g. NEW, 15% OFF, POPULAR"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Base / Starting Price (₹)
                    </label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="499"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 outline-none"
                    />
                    <span className="text-[10px] text-gray-400 mt-0.5 block">Overridden by size variants if defined</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Base MRP (₹)
                    </label>
                    <input
                      type="number"
                      value={formData.originalPrice}
                      onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                      placeholder="699"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Base Stock (Pieces)
                    </label>
                    <input
                      type="number"
                      value={formData.stockQuantity}
                      onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                      placeholder="50"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Fabric Material & Care
                    </label>
                    <input
                      type="text"
                      value={formData.material}
                      onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                      placeholder="e.g. 100% Super-combed Cotton, Easy Wash"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Master SKU / Product Code
                    </label>
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      placeholder="e.g. SKU-1049"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-medium focus:bg-white focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Detailed Product Description
                  </label>
                  <textarea
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe sizing recommendations, stitching durability, fabric weight, and return policy details..."
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SIZING & VARIANTS MATRIX */}
          {activeTab === 'variants' && (
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-6">
              <div>
                <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                  <Layers className="text-brand-teal" size={18} /> Size Variants & Pricing Matrix
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Configure custom price, MRP, warehouse stock, and distinct preview image for every single size.
                </p>
              </div>

              {/* Quick Presets */}
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-brand-ochre" /> 1-Click Sizing Presets
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {SIZE_PRESETS.map(preset => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => applySizePreset(preset.sizes)}
                      className="px-3 py-1.5 bg-white hover:bg-brand-teal hover:text-white text-gray-700 text-xs font-bold rounded-lg border border-gray-200 shadow-2xs transition-colors cursor-pointer"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Add Custom Size & Batch Update */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Custom Size Form */}
                <form onSubmit={handleAddCustomSize} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={customSizeInput}
                    onChange={(e) => setCustomSizeInput(e.target.value)}
                    placeholder="Enter custom size (e.g. 40, Free Size, 13-14 Yrs)"
                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:border-brand-teal outline-none"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <Plus size={14} /> Add Size
                  </button>
                </form>

                {/* Batch Set Bar */}
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={batchBasePrice}
                    onChange={(e) => setBatchBasePrice(e.target.value)}
                    placeholder="Price ₹"
                    className="w-20 px-2 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-center outline-none"
                  />
                  <input
                    type="number"
                    value={batchBaseMrp}
                    onChange={(e) => setBatchBaseMrp(e.target.value)}
                    placeholder="MRP ₹"
                    className="w-20 px-2 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-center outline-none"
                  />
                  <input
                    type="number"
                    value={batchBaseStock}
                    onChange={(e) => setBatchBaseStock(e.target.value)}
                    placeholder="Stock"
                    className="w-18 px-2 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-center outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleBatchApply}
                    className="px-3 py-2 bg-teal-50 hover:bg-teal-100 text-brand-teal border border-teal-200 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0"
                    title="Apply these values to all sizes below"
                  >
                    <Sliders size={13} /> Fill All
                  </button>
                </div>
              </div>

              {/* Variants Table */}
              {sizeVariants.length === 0 ? (
                <div className="p-8 text-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 space-y-2">
                  <Boxes className="mx-auto text-gray-400" size={32} />
                  <h4 className="text-sm font-bold text-gray-700">No Size Variants Configured</h4>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto">
                    Click one of the 1-click presets above (e.g. Standard S-XXL or Waist 26-38) to generate sizes with individual prices and photos.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 border-b border-gray-200 text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">
                      <tr>
                        <th className="px-3 py-3 w-20">Size</th>
                        <th className="px-3 py-3 w-28">Price (₹)</th>
                        <th className="px-3 py-3 w-28">MRP (₹)</th>
                        <th className="px-3 py-3 w-24">Stock</th>
                        <th className="px-3 py-3">Variant Image</th>
                        <th className="px-3 py-3 w-32">SKU</th>
                        <th className="px-3 py-3 text-right w-12">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {sizeVariants.map((variant, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/80 transition-colors">
                          
                          {/* Size Pill */}
                          <td className="px-3 py-2.5">
                            <span className="px-2.5 py-1 rounded-lg bg-teal-50 border border-teal-200/80 text-brand-teal font-extrabold text-xs block text-center">
                              {variant.size}
                            </span>
                          </td>

                          {/* Price */}
                          <td className="px-3 py-2.5">
                            <div className="relative">
                              <span className="absolute left-2.5 top-2 text-gray-400 text-xs">₹</span>
                              <input
                                type="number"
                                value={variant.price}
                                onChange={(e) => handleUpdateVariant(idx, 'price', e.target.value)}
                                className="w-full pl-6 pr-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-900 focus:bg-white focus:border-brand-teal outline-none"
                              />
                            </div>
                          </td>

                          {/* MRP */}
                          <td className="px-3 py-2.5">
                            <div className="relative">
                              <span className="absolute left-2.5 top-2 text-gray-400 text-xs">₹</span>
                              <input
                                type="number"
                                value={variant.mrp}
                                onChange={(e) => handleUpdateVariant(idx, 'mrp', e.target.value)}
                                className="w-full pl-6 pr-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-500 focus:bg-white focus:border-brand-teal outline-none"
                              />
                            </div>
                          </td>

                          {/* Stock */}
                          <td className="px-3 py-2.5">
                            <input
                              type="number"
                              value={variant.stock}
                              onChange={(e) => handleUpdateVariant(idx, 'stock', e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-900 focus:bg-white focus:border-brand-teal outline-none text-center"
                            />
                          </td>

                          {/* Variant Image */}
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-2">
                              {variant.image ? (
                                <img
                                  src={variant.image}
                                  alt={variant.size}
                                  className="w-8 h-8 rounded-lg object-cover border border-gray-200 shrink-0"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-lg bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center text-gray-400 shrink-0">
                                  <ImageIcon size={14} />
                                </div>
                              )}
                              <button
                                type="button"
                                onClick={() => triggerVariantImageUpload(idx)}
                                className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-[10px] font-bold cursor-pointer transition-colors"
                              >
                                Upload
                              </button>
                              {formData.images.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setActiveVariantForGallery(idx)}
                                  className="px-2 py-1 bg-teal-50 hover:bg-teal-100 text-brand-teal rounded text-[10px] font-bold cursor-pointer transition-colors"
                                >
                                  Pick Gallery
                                </button>
                              )}
                            </div>
                          </td>

                          {/* SKU */}
                          <td className="px-3 py-2.5">
                            <input
                              type="text"
                              value={variant.sku}
                              onChange={(e) => handleUpdateVariant(idx, 'sku', e.target.value)}
                              className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-[11px] font-mono text-gray-700 outline-none"
                            />
                          </td>

                          {/* Delete */}
                          <td className="px-3 py-2.5 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveVariant(idx)}
                              className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title={`Remove Size ${variant.size}`}
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>

                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MEDIA & PRODUCT GALLERY */}
          {activeTab === 'media' && (
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-5">
              <div>
                <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                  <ImageIcon className="text-brand-teal" size={18} /> High-Resolution Product Photos
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Upload catalog photos. The first image will be the primary storefront cover photo.
                </p>
              </div>

              <ImageUploadDropzone
                images={formData.images}
                onChange={(newImages) => {
                  setFormData(prev => ({
                    ...prev,
                    images: newImages,
                    image: newImages[0] || prev.image
                  }));
                }}
                maxImages={8}
                helperText="Drag & drop school uniform photos, swatches, or packaging (JPG, PNG, WebP)"
              />
            </div>
          )}

        </div>

        {/* Right Column: Live Storefront Card Preview (4 Cols) */}
        <div className="lg:col-span-4 sticky top-6 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <Eye size={14} className="text-brand-teal" /> Customer View Preview
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Live Rendering
              </span>
            </div>

            {/* Mock Product Card */}
            <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white shadow-2xs">
              <div className="relative w-full pt-[90%] bg-gray-50 overflow-hidden">
                {formData.discountBadge && (
                  <span className="absolute top-2.5 left-2.5 z-10 text-[9px] font-extrabold tracking-wider px-2 py-0.5 rounded uppercase bg-brand-pink text-white shadow-xs">
                    {formData.discountBadge}
                  </span>
                )}
                <img
                  src={previewImage}
                  alt="Preview"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>

              <div className="p-4 space-y-2">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-brand-teal">
                  {formData.schoolName || 'Uniforms & Accessories'}
                </div>
                <h4 className="font-bold text-gray-900 text-sm leading-snug line-clamp-1">
                  {formData.name || 'Untitled Product'}
                </h4>
                <p className="text-[11px] text-gray-500 line-clamp-1">
                  {formData.subtitle || 'Short description of quality and fit'}
                </p>

                {/* Available Sizes preview */}
                {sizeVariants.length > 0 && (
                  <div className="pt-1">
                    <div className="text-[10px] font-bold text-gray-400 mb-1">Available Sizes:</div>
                    <div className="flex flex-wrap gap-1">
                      {sizeVariants.map((v, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-gray-100 text-gray-700 border border-gray-200"
                        >
                          {v.size}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Price & Savings */}
                <div className="pt-2 border-t border-gray-100 flex items-baseline gap-2">
                  <span className="font-extrabold text-base text-brand-teal">
                    ₹{previewPrice}
                  </span>
                  {previewMrp > previewPrice && (
                    <span className="text-xs text-gray-400 line-through">
                      ₹{previewMrp}
                    </span>
                  )}
                  {previewMrp > previewPrice && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                      Save ₹{previewMrp - previewPrice}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  disabled
                  className="w-full py-2 bg-brand-yellow text-brand-teal-dark font-extrabold text-xs rounded-xl cursor-default flex items-center justify-center gap-1.5"
                >
                  <Eye size={13} /> Select Size & Add to Cart
                </button>
              </div>
            </div>

            {/* Quick Sizing Stats */}
            <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 text-xs space-y-1.5">
              <div className="flex justify-between text-gray-500">
                <span>Configured Sizes:</span>
                <span className="font-bold text-gray-900">{sizeVariants.length} variants</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Total Combined Stock:</span>
                <span className="font-bold text-gray-900">
                  {sizeVariants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0) || Number(formData.stockQuantity) || 0} units
                </span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Category:</span>
                <span className="font-bold text-gray-900">{formData.category}</span>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* MODAL: Pick Gallery Image for Variant */}
      {activeVariantForGallery !== null && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-sm text-gray-900">
                Assign Photo to Size "{sizeVariants[activeVariantForGallery]?.size}"
              </h3>
              <button
                type="button"
                onClick={() => setActiveVariantForGallery(null)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-gray-500">
              Select one of your uploaded gallery images to display when students click this size:
            </p>

            <div className="grid grid-cols-3 gap-2.5 max-h-60 overflow-y-auto p-1">
              {formData.images.map((img, i) => (
                <div
                  key={i}
                  onClick={() => handleAssignGalleryImageToVariant(img)}
                  className="relative aspect-square rounded-xl border-2 border-gray-200 hover:border-brand-teal overflow-hidden cursor-pointer group transition-all"
                >
                  <img src={img} alt={`Gallery ${i}`} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-brand-teal/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs">
                    Choose
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setActiveVariantForGallery(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
