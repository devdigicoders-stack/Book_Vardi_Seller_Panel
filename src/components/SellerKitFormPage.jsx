import React, { useState, useEffect, useMemo } from 'react';
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
  Check,
  Tag,
  Boxes,
  Eye,
  Info,
  ChevronDown,
  X,
  Save,
  RotateCcw,
  CreditCard,
  BookOpen,
  Search,
  School,
  Percent,
  TrendingDown,
  DollarSign
} from 'lucide-react';
import ImageUploadDropzone from './ImageUploadDropzone';
import { resolveImageUrl, dedupeImages } from '../utils/mediaUrl';
import { fetchSchoolsApi, fetchCategoriesApi } from '../utils/api';
import { GRADE_OPTIONS } from './SellerProductFormPage';
import SchoolSelectorWithCustom from './SchoolSelectorWithCustom';

const KIT_BADGES = [
  'School Approved',
  'Best Seller',
  'New Arrival',
  'Verified KV',
  'Trending',
  'Special Offer'
];

export default function SellerKitFormPage({
  kit,
  existingProducts = [],
  onSave,
  onBack
}) {
  const isEdit = Boolean(kit);

  // Active form tab
  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'items' | 'media' | 'inventory' | 'payment'

  // General Kit State
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    schoolName: '',
    schoolCode: '',
    gender: 'Unisex',
    badgeTag: 'School Approved',
    category: 'kits',
    subCategory: 'School Uniform Kit',
    description: '',
    sku: '',
    gst: '5',
    isGstInclusive: true,
    bundlePrice: '',
    stock: '',
    independentStock: '',
    inventoryMode: 'dynamic', // 'fixed' (independent) | 'dynamic' (auto-calculated from individual availability)
    lowStockThreshold: '5',
    paymentMethodAllowed: 'Both',
    status: 'pending', // Catalog visibility is pending by default!
    approvalStatus: 'Pending',
    isApproved: false,
    image: '',
    images: []
  });

  // Multi-select Grades
  const [selectedGrades, setSelectedGrades] = useState([]);

  // Bundling Mode: 'catalog' | 'scratch'
  const [bundlingMode, setBundlingMode] = useState('catalog');

  // Bundled Line Items
  const [kitItems, setKitItems] = useState([]);

  // Scratch line item input state
  const [scratchItem, setScratchItem] = useState({
    name: '',
    quantity: 1,
    unitPrice: '',
    size: '',
    color: ''
  });

  // Catalog Picker state
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogCategoryFilter, setCatalogCategoryFilter] = useState('all');

  // Schools and categories from backend
  const [schoolOptions, setSchoolOptions] = useState([]);
  const [dbCategories, setDbCategories] = useState([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Load school options on mount
  useEffect(() => {
    async function loadMetadata() {
      try {
        const [schoolsData, catsData] = await Promise.all([
          fetchSchoolsApi(),
          fetchCategoriesApi()
        ]);
        if (Array.isArray(schoolsData)) setSchoolOptions(schoolsData);
        if (Array.isArray(catsData)) setDbCategories(catsData);
      } catch (err) {
        console.warn('Failed to load schools or categories metadata for kit form:', err);
      }
    }
    loadMetadata();
  }, []);

  // Initialize or populate form on edit
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (kit) {
      const rawImgs = Array.isArray(kit.images) && kit.images.length > 0
        ? kit.images
        : (kit.image ? [kit.image] : []);
      const imgs = dedupeImages(rawImgs);

      const gradeStr = kit.classGrade || kit.className || '';
      const initialGrades = typeof gradeStr === 'string'
        ? gradeStr.split(',').map(s => s.trim()).filter(Boolean)
        : (Array.isArray(gradeStr) ? gradeStr : []);
      setSelectedGrades(initialGrades);

      setFormData({
        title: kit.title || kit.name || '',
        subtitle: kit.subtitle || '',
        schoolName: kit.schoolName || kit.school || '',
        schoolCode: kit.schoolCode || '',
        gender: kit.gender || 'Unisex',
        badgeTag: kit.badgeTag || kit.badge || 'School Approved',
        category: kit.category || 'kits',
        subCategory: kit.subCategory || 'School Uniform Kit',
        description: kit.description || '',
        sku: kit.sku || '',
        gst: kit.gst !== undefined ? String(kit.gst) : '5',
        isGstInclusive: kit.isGstInclusive !== undefined ? Boolean(kit.isGstInclusive) : true,
        bundlePrice: kit.bundlePrice !== undefined ? String(kit.bundlePrice) : (kit.price !== undefined ? String(kit.price) : ''),
        stock: kit.stock !== undefined ? String(kit.stock) : (kit.stockQuantity !== undefined ? String(kit.stockQuantity) : '25'),
        inventoryMode: kit.inventoryMode || 'fixed',
        lowStockThreshold: kit.lowStockThreshold !== undefined ? String(kit.lowStockThreshold) : '5',
        paymentMethodAllowed: kit.paymentMethodAllowed || 'Both',
        status: kit.status || 'available',
        image: imgs[0] || '',
        images: imgs
      });

      if (Array.isArray(kit.items) && kit.items.length > 0) {
        setKitItems(kit.items.map(it => ({
          productId: it.productId?._id || it.productId?.id || it.productId || null,
          name: it.name || it.title || 'Item',
          quantity: Number(it.quantity) || 1,
          unitPrice: Number(it.unitPrice) || Number(it.price) || 0,
          totalPrice: (Number(it.unitPrice) || Number(it.price) || 0) * (Number(it.quantity) || 1),
          originalPrice: Number(it.originalPrice || it.mrp) || Number(it.unitPrice) || 0,
          size: it.size || '',
          color: it.color || '',
          image: it.image || (it.productId?.images?.[0] || it.productId?.image || '')
        })));
      }
    } else {
      // Default new kit state
      setFormData({
        title: '',
        subtitle: '',
        schoolName: '',
        schoolCode: '',
        gender: 'Unisex',
        badgeTag: 'School Approved',
        category: 'kits',
        subCategory: 'School Uniform Kit',
        description: '',
        sku: '',
        gst: '5',
        isGstInclusive: true,
        bundlePrice: '',
        stock: '25',
        inventoryMode: 'fixed',
        lowStockThreshold: '5',
        paymentMethodAllowed: 'Both',
        status: 'available',
        image: '',
        images: []
      });
      setSelectedGrades([]);
      setKitItems([]);
    }
  }, [kit]);

  // Handle grade toggle
  const toggleGrade = (grade) => {
    setSelectedGrades(prev => {
      if (prev.includes(grade)) return prev.filter(g => g !== grade);
      return [...prev, grade];
    });
  };

  // Calculations for Kit
  const calculatedTotalMrp = useMemo(() => {
    return kitItems.reduce((acc, item) => {
      const lineTotal = (Number(item.unitPrice) || 0) * (Number(item.quantity) || 1);
      return acc + lineTotal;
    }, 0);
  }, [kitItems]);

  const effectiveBundlePrice = useMemo(() => {
    const val = Number(formData.bundlePrice);
    if (!isNaN(val) && val > 0) return val;
    return calculatedTotalMrp > 0 ? Math.round(calculatedTotalMrp * 0.85) : 0;
  }, [formData.bundlePrice, calculatedTotalMrp]);

  const savingsAmount = useMemo(() => {
    return Math.max(0, calculatedTotalMrp - effectiveBundlePrice);
  }, [calculatedTotalMrp, effectiveBundlePrice]);

  const discountPercentage = useMemo(() => {
    if (calculatedTotalMrp <= 0) return 0;
    return Math.round((savingsAmount / calculatedTotalMrp) * 100);
  }, [calculatedTotalMrp, savingsAmount]);

  // Dynamic stock calculated automatically from availability of individual constituent products
  const dynamicKitStock = useMemo(() => {
    if (kitItems.length === 0) return 0;
    const stocks = kitItems.map(item => {
      const matchedProd = existingProducts.find(p => String(p.id || p._id) === String(item.productId));
      const availableProdStock = Number(matchedProd?.stock ?? matchedProd?.stockQuantity ?? item.stock ?? 25);
      const qtyRequired = Math.max(1, Number(item.quantity) || 1);
      return Math.floor(availableProdStock / qtyRequired);
    });
    return Math.min(...stocks);
  }, [kitItems, existingProducts]);

  // Derived effective GST from constituent products as previously defined on each product
  const derivedProductGst = useMemo(() => {
    if (kitItems.length === 0) return 5;
    const totalVal = kitItems.reduce((acc, it) => acc + (Number(it.unitPrice) || 0) * (Number(it.quantity) || 1), 0);
    if (totalVal <= 0) return 5;
    const totalGstWeighted = kitItems.reduce((acc, it) => {
      const matchedP = existingProducts.find(p => String(p.id || p._id) === String(it.productId));
      const itemGst = Number(matchedP?.gstPercentage || matchedP?.gst || it.gst || 5);
      return acc + itemGst * ((Number(it.unitPrice) || 0) * (Number(it.quantity) || 1));
    }, 0);
    return Math.round(totalGstWeighted / totalVal);
  }, [kitItems, existingProducts]);

  // Add catalog product into kit
  const handleAddCatalogProduct = (prod, selectedVariant = null) => {
    const unitPrice = selectedVariant
      ? (Number(selectedVariant.price) || Number(prod.price) || 0)
      : (Number(prod.price) || 0);

    const mrp = selectedVariant
      ? (Number(selectedVariant.mrp || selectedVariant.originalPrice) || Number(prod.originalPrice || prod.mrp) || Math.round(unitPrice * 1.25))
      : (Number(prod.originalPrice || prod.mrp) || Math.round(unitPrice * 1.25));

    const itemImg = selectedVariant?.image || prod.images?.[0] || prod.image || '';

    const variantLabel = selectedVariant
      ? (selectedVariant.size || selectedVariant.measureValue || '')
      : '';

    const itemName = variantLabel ? `${prod.name} (${variantLabel})` : prod.name;

    const newItem = {
      productId: prod.id || prod._id,
      name: itemName,
      quantity: 1,
      unitPrice,
      totalPrice: unitPrice,
      originalPrice: mrp,
      size: variantLabel,
      color: prod.colors?.[0] || '',
      image: itemImg
    };

    setKitItems(prev => [...prev, newItem]);
    setError('');

    // If kit has no images yet, inherit first product image
    if (formData.images.length === 0 && itemImg) {
      setFormData(prev => ({
        ...prev,
        image: itemImg,
        images: [itemImg]
      }));
    }
  };

  // Add scratch custom item
  const handleAddScratchItem = (e) => {
    e?.preventDefault();
    if (!scratchItem.name.trim()) {
      setError('Please enter item name (e.g. School Belt, Uniform Tie, Diary).');
      return;
    }
    const unitPrice = Number(scratchItem.unitPrice);
    if (isNaN(unitPrice) || unitPrice <= 0) {
      setError('Please enter a valid price for the item.');
      return;
    }

    const newItem = {
      productId: null,
      name: scratchItem.name.trim(),
      quantity: Math.max(1, Number(scratchItem.quantity) || 1),
      unitPrice,
      totalPrice: unitPrice * (Math.max(1, Number(scratchItem.quantity) || 1)),
      originalPrice: Math.round(unitPrice * 1.2),
      size: scratchItem.size.trim(),
      color: scratchItem.color.trim(),
      image: ''
    };

    setKitItems(prev => [...prev, newItem]);
    setScratchItem({ name: '', quantity: 1, unitPrice: '', size: '', color: '' });
    setError('');
  };

  // Remove item from kit
  const handleRemoveKitItem = (index) => {
    setKitItems(prev => prev.filter((_, i) => i !== index));
  };

  // Adjust item quantity
  const handleUpdateItemQuantity = (index, delta) => {
    setKitItems(prev => prev.map((item, i) => {
      if (i === index) {
        const nextQty = Math.max(1, (Number(item.quantity) || 1) + delta);
        return {
          ...item,
          quantity: nextQty,
          totalPrice: (Number(item.unitPrice) || 0) * nextQty
        };
      }
      return item;
    }));
  };

  // Adjust item price
  const handleUpdateItemPrice = (index, newPrice) => {
    setKitItems(prev => prev.map((item, i) => {
      if (i === index) {
        const price = Math.max(0, Number(newPrice) || 0);
        return {
          ...item,
          unitPrice: price,
          totalPrice: price * (Number(item.quantity) || 1)
        };
      }
      return item;
    }));
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError('');

    if (!formData.title.trim()) {
      setError('Kit Title is required.');
      setActiveTab('general');
      return;
    }
    if (!formData.schoolName.trim()) {
      setError('School Name is required.');
      setActiveTab('general');
      return;
    }
    if (selectedGrades.length === 0) {
      setError('Please select at least one Target Class / Grade.');
      setActiveTab('general');
      return;
    }
    if (kitItems.length === 0) {
      setError('Please add at least one product or item to the Kit Bundle.');
      setActiveTab('items');
      return;
    }

    const finalBundlePrice = Number(formData.bundlePrice) || effectiveBundlePrice;
    if (finalBundlePrice <= 0) {
      setError('Please specify a valid bundle price.');
      setActiveTab('items');
      return;
    }

    setSubmitting(true);

    try {
      const finalImages = dedupeImages(formData.images);
      const paymentAllowedStr = formData.paymentMethodAllowed || 'Both';
      const paymentAllowedArr = paymentAllowedStr === 'Online_Only'
        ? ['Online']
        : (paymentAllowedStr === 'COD_Only' ? ['COD'] : ['COD', 'Online']);

      const gradeValue = selectedGrades.join(', ');

      const rawStock = Number(formData.stock);
      const isIndependent = !isNaN(rawStock) && rawStock > 0;
      const finalStock = isIndependent ? rawStock : dynamicKitStock;
      const finalMode = isIndependent ? 'fixed' : 'dynamic';
      const finalGst = derivedProductGst || 5;

      const payload = {
        title: formData.title.trim(),
        name: formData.title.trim(),
        subtitle: formData.subtitle.trim(),
        schoolName: formData.schoolName.trim(),
        schoolCode: formData.schoolCode.trim(),
        gender: formData.gender,
        classGrade: gradeValue,
        badgeTag: formData.badgeTag,
        badge: formData.badgeTag,
        category: 'kits',
        subCategory: formData.subCategory || 'School Uniform Kit',
        items: kitItems,
        totalMrp: calculatedTotalMrp,
        mrp: calculatedTotalMrp,
        originalPrice: calculatedTotalMrp,
        bundlePrice: finalBundlePrice,
        price: finalBundlePrice,
        savingsAmount,
        discountPercentage,
        stock: finalStock,
        stockQuantity: finalStock,
        independentStock: isIndependent ? rawStock : 0,
        inventoryMode: finalMode,
        lowStockThreshold: Number(formData.lowStockThreshold) || 5,
        sku: formData.sku.trim(),
        gst: finalGst,
        gstPercentage: finalGst,
        isGstInclusive: true, // GST applied as previously on constituent products
        description: formData.description.trim(),
        image: finalImages[0] || '',
        images: finalImages,
        paymentMethodAllowed: paymentAllowedStr,
        status: isEdit ? (formData.status || 'available') : 'available',
        approvalStatus: isEdit ? (formData.approvalStatus || 'Pending') : 'Pending',
        isApproved: isEdit ? Boolean(formData.isApproved) : false
      };

      await onSave(payload);
    } catch (err) {
      setError(err.message || 'Failed to save Kit Bundle.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter existing products for picker
  const filteredCatalogProducts = useMemo(() => {
    return existingProducts.filter(p => {
      const matchesSearch = !catalogSearch || 
        p.name?.toLowerCase().includes(catalogSearch.toLowerCase()) ||
        p.category?.toLowerCase().includes(catalogSearch.toLowerCase());
      const matchesCategory = catalogCategoryFilter === 'all' || p.category === catalogCategoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [existingProducts, catalogSearch, catalogCategoryFilter]);

  return (
    <div className="space-y-6 pb-20">
      
      {/* Top Header & Breadcrumbs matching SellerProductFormPage */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-xs border border-gray-100">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl transition-colors cursor-pointer border border-gray-200"
            title="Back to Catalog / Kits"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
              <span>Merchant Catalog</span>
              <span>/</span>
              <span className="text-brand-teal">{isEdit ? 'Edit Kit Bundle' : 'Create Kit Bundle'}</span>
            </div>
            <h1 className="font-display font-extrabold text-2xl text-gray-900 mt-0.5 flex items-center gap-2">
              <Boxes className="text-brand-teal" size={24} />
              {isEdit ? `Edit: ${formData.title || 'Kit Bundle'}` : 'New Kit / Bundle Package'}
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
                <RotateCcw className="animate-spin" size={16} /> Saving to Store...
              </>
            ) : (
              <>
                <Save size={16} /> {isEdit ? 'Update Kit Bundle' : 'Publish Kit Bundle to Store'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tab Navigation matching Product Form */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-gray-200 pb-2 scrollbar-none">
        {[
          { id: 'general', label: '1. General Info', icon: BookOpen },
          { id: 'items', label: `2. Items & Pricing (${kitItems.length})`, icon: Boxes, badge: kitItems.length },
          { id: 'media', label: `3. Images (${formData.images.length})`, icon: ImageIcon, badge: formData.images.length },
          { id: 'inventory', label: '4. Stock & Logistics', icon: Package },
          { id: 'payment', label: '5. Payment Methods', icon: CreditCard }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setError('');
                setActiveTab(tab.id);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-brand-teal text-white shadow-xs'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200/80'
              }`}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  isActive ? 'bg-white text-brand-teal' : 'bg-brand-teal/10 text-brand-teal'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Grid: Form Left, Sticky Preview Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT COLUMN: Active Tab Forms */}
        <div className="lg:col-span-2 space-y-6">

          {/* TAB 1: GENERAL INFO */}
          {activeTab === 'general' && (
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-6">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                  <BookOpen className="text-brand-teal" size={18} /> Kit Identity & School Information
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Define the primary bundle name, school association, and target age/grade demographics.
                </p>
              </div>

              {/* Title & Subtitle */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Kit Bundle Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Delhi Public School Complete Class 5 Uniform & Books Kit"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-brand-teal focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Kit Subtitle / Tagline
                  </label>
                  <input
                    type="text"
                    value={formData.subtitle}
                    onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
                    placeholder="e.g. All-In-One Uniforms, Notebooks & Official Stationery Pack"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-brand-teal focus:bg-white"
                  />
                </div>
              </div>

              {/* Universal / Open for All Schools Quick Toggle */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-teal-50/70 border border-teal-200 gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-brand-teal text-white flex items-center justify-center shrink-0 shadow-xs">
                    <School size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                      <span>Open for All Schools (Universal Kit)</span>
                      {(formData.schoolName?.toLowerCase().includes('all school') || formData.schoolCode === 'ALL') && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-gray-500">
                      Enable this if this kit bundle is general and applicable for students of any school.
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const isAll = formData.schoolName?.toLowerCase().includes('all school') || formData.schoolCode === 'ALL';
                    if (isAll) {
                      setFormData(prev => ({
                        ...prev,
                        schoolName: '',
                        schoolCode: ''
                      }));
                    } else {
                      setFormData(prev => ({
                        ...prev,
                        schoolName: 'All Schools (Open for All Schools)',
                        schoolCode: 'ALL'
                      }));
                    }
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                    (formData.schoolName?.toLowerCase().includes('all school') || formData.schoolCode === 'ALL')
                      ? 'bg-brand-teal text-white shadow-xs'
                      : 'bg-white text-gray-700 border border-gray-300 hover:border-teal-400 hover:bg-teal-50/50'
                  }`}
                >
                  {(formData.schoolName?.toLowerCase().includes('all school') || formData.schoolCode === 'ALL') ? (
                    <>
                      <Check size={13} />
                      <span>All Schools Enabled</span>
                    </>
                  ) : (
                    <span>Make Open for All Schools</span>
                  )}
                </button>
              </div>

              {/* School Selector with Custom School Option */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <SchoolSelectorWithCustom
                    selectedSchoolName={formData.schoolName}
                    selectedSchoolCode={formData.schoolCode}
                    userRole="seller"
                    required={true}
                    onSelectSchool={(sch) => {
                      setFormData(prev => ({
                        ...prev,
                        schoolName: sch.name,
                        schoolCode: sch.schoolCode || sch.code || prev.schoolCode
                      }));
                    }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    School Code / Affiliation
                  </label>
                  <input
                    type="text"
                    value={formData.schoolCode}
                    onChange={e => setFormData({ ...formData, schoolCode: e.target.value })}
                    placeholder="e.g. SCH-001, ALL, or CBSE Affiliation"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-brand-teal focus:bg-white"
                  />
                </div>
              </div>


              {/* Gender & Badge Tag */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Target Gender
                  </label>
                  <select
                    value={formData.gender}
                    onChange={e => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none cursor-pointer focus:ring-2 focus:ring-brand-teal focus:bg-white"
                  >
                    <option value="Unisex">Unisex (Both Boys & Girls)</option>
                    <option value="Boy">Boys Only</option>
                    <option value="Girl">Girls Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Badge Tag
                  </label>
                  <select
                    value={formData.badgeTag}
                    onChange={e => setFormData({ ...formData, badgeTag: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none cursor-pointer focus:ring-2 focus:ring-brand-teal focus:bg-white"
                  >
                    {KIT_BADGES.map(badge => (
                      <option key={badge} value={badge}>{badge}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Multi-Select Target Grades */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-gray-700">
                    Target Class / Grade *
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedGrades(GRADE_OPTIONS);
                      }}
                      className="text-[11px] font-extrabold text-brand-teal hover:underline cursor-pointer"
                    >
                      Select All Classes
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      type="button"
                      onClick={() => setSelectedGrades([])}
                      className="text-[11px] font-bold text-gray-400 hover:underline cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-gray-50 border border-gray-200">
                  {GRADE_OPTIONS.map(grade => {
                    const isSelected = selectedGrades.includes(grade);
                    return (
                      <button
                        key={grade}
                        type="button"
                        onClick={() => toggleGrade(grade)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-brand-teal text-white shadow-xs'
                            : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                        }`}
                      >
                        {isSelected && <Check size={12} className="inline mr-1 -mt-0.5" />}
                        {grade}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Kit Description & Details
                </label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Provide comprehensive details about the kit, what is included, washing instructions, and school compliance."
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-brand-teal focus:bg-white"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('items')}
                  className="px-5 py-2 bg-brand-teal text-white rounded-xl text-xs font-extrabold cursor-pointer"
                >
                  Next: Add Bundled Items →
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: BUNDLED ITEMS ENGINE */}
          {activeTab === 'items' && (
            <div className="space-y-6">
              
              {/* Mode Selector: Catalog vs Scratch */}
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                    <Boxes className="text-brand-teal" size={18} /> Bundled Items Engine
                  </h3>
                  <div className="p-1 bg-gray-100 rounded-xl inline-flex gap-1 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setBundlingMode('catalog')}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        bundlingMode === 'catalog' ? 'bg-brand-teal text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      From Catalog ({existingProducts.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setBundlingMode('scratch')}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        bundlingMode === 'scratch' ? 'bg-brand-teal text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      + Custom Item
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Select items from your existing product inventory or add custom unlisted articles to assemble this package.
                </p>
              </div>

              {/* Mode A: Pick From Catalog */}
              {bundlingMode === 'catalog' && (
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3.5 top-3 text-gray-400" size={14} />
                      <input
                        type="text"
                        value={catalogSearch}
                        onChange={e => setCatalogSearch(e.target.value)}
                        placeholder="Search products by title, category, or SKU..."
                        className="w-full pl-9 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-brand-teal focus:bg-white"
                      />
                    </div>
                  </div>

                  {/* Catalog Products List */}
                  <div className="max-h-64 overflow-y-auto divide-y divide-gray-100 rounded-xl border border-gray-200 bg-gray-50/50">
                    {filteredCatalogProducts.length === 0 ? (
                      <div className="p-6 text-center text-xs text-gray-500">
                        No matching catalog products found. You can add items via the <strong>"+ Custom Item"</strong> tab.
                      </div>
                    ) : (
                      filteredCatalogProducts.slice(0, 10).map((prod) => {
                        const prodImg = prod.images?.[0] || prod.image || '';
                        const hasVariants = Array.isArray(prod.sizeVariants) && prod.sizeVariants.length > 0;

                        return (
                          <div key={prod.id || prod._id} className="p-3 bg-white hover:bg-teal-50/40 transition-colors flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-lg bg-gray-100 shrink-0 border border-gray-200 overflow-hidden flex items-center justify-center">
                                {prodImg ? (
                                  <img src={resolveImageUrl(prodImg)} alt={prod.name} className="w-full h-full object-cover" />
                                ) : (
                                  <Package size={16} className="text-gray-400" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-xs font-bold text-gray-900 truncate">{prod.name}</h4>
                                <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-0.5">
                                  <span className="font-extrabold text-teal-800">₹{prod.price}</span>
                                  {prod.originalPrice > prod.price && (
                                    <span className="line-through text-gray-400 text-[10px]">₹{prod.originalPrice}</span>
                                  )}
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-gray-100 text-gray-600 capitalize">
                                    {prod.category}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {hasVariants ? (
                                <select
                                  onChange={(e) => {
                                    const vIdx = e.target.value;
                                    if (vIdx !== '') {
                                      handleAddCatalogProduct(prod, prod.sizeVariants[vIdx]);
                                      e.target.value = '';
                                    }
                                  }}
                                  defaultValue=""
                                  className="px-2 py-1 bg-teal-50 text-brand-teal text-[11px] font-bold rounded-lg border border-teal-200 outline-none cursor-pointer"
                                >
                                  <option value="" disabled>+ Add Size...</option>
                                  {prod.sizeVariants.map((v, i) => (
                                    <option key={i} value={i}>
                                      {v.size || v.measureValue} (₹{v.price || prod.price})
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleAddCatalogProduct(prod)}
                                  className="px-3 py-1.5 bg-brand-teal hover:bg-brand-teal-light text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1 shadow-2xs"
                                >
                                  <Plus size={14} /> Add
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* Mode B: Add Custom Scratch Item */}
              {bundlingMode === 'scratch' && (
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
                  <h4 className="text-xs font-extrabold text-gray-800 uppercase tracking-wider">
                    Add Non-Catalog Article
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-gray-600 mb-1">Item Name *</label>
                      <input
                        type="text"
                        value={scratchItem.name}
                        onChange={e => setScratchItem({ ...scratchItem, name: e.target.value })}
                        placeholder="e.g. School ID Card with Lanyard"
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 mb-1">Quantity</label>
                      <input
                        type="number"
                        min="1"
                        value={scratchItem.quantity}
                        onChange={e => setScratchItem({ ...scratchItem, quantity: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 mb-1">Unit Price (₹) *</label>
                      <input
                        type="number"
                        min="0"
                        value={scratchItem.unitPrice}
                        onChange={e => setScratchItem({ ...scratchItem, unitPrice: e.target.value })}
                        placeholder="120"
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleAddScratchItem}
                      className="px-4 py-2 bg-brand-teal text-white rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5"
                    >
                      <Plus size={14} /> Add Line Item to Kit
                    </button>
                  </div>
                </div>
              )}

              {/* Constituent Items Table */}
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <h4 className="text-xs font-extrabold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                    <span>Kit Items Included</span>
                    <span className="px-2 py-0.5 rounded-full bg-teal-50 text-brand-teal text-[11px] font-black">
                      {kitItems.length} {kitItems.length === 1 ? 'item' : 'items'}
                    </span>
                  </h4>
                  <div className="text-xs font-bold text-gray-500">
                    Calculated Total MRP: <strong className="text-gray-900">₹{calculatedTotalMrp}</strong>
                  </div>
                </div>

                {kitItems.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 space-y-2">
                    <Boxes className="mx-auto text-gray-400" size={32} />
                    <h4 className="text-sm font-bold text-gray-700">No Items Added Yet</h4>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto">
                      Use the search bar above to select products from your catalog or click <strong>"+ Custom Item"</strong> to add pieces.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-gray-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase text-[10px]">
                        <tr>
                          <th className="px-3 py-2.5">Item Name</th>
                          <th className="px-3 py-2.5 text-center">Qty</th>
                          <th className="px-3 py-2.5">Unit MRP (₹)</th>
                          <th className="px-3 py-2.5">Line Total (₹)</th>
                          <th className="px-3 py-2.5 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white font-medium">
                        {kitItems.map((item, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-3 py-2.5">
                              <div className="flex items-center gap-2.5">
                                {item.image ? (
                                  <img src={resolveImageUrl(item.image)} alt={item.name} className="w-8 h-8 rounded object-cover border border-gray-200" />
                                ) : (
                                  <div className="w-8 h-8 rounded bg-gray-100 text-gray-400 flex items-center justify-center font-bold text-[10px]">
                                    #{idx + 1}
                                  </div>
                                )}
                                <div>
                                  <div className="font-bold text-gray-900">{item.name}</div>
                                  {item.size && (
                                    <div className="text-[10px] text-brand-teal font-semibold">Size: {item.size}</div>
                                  )}
                                </div>
                              </div>
                            </td>

                            <td className="px-3 py-2.5 text-center">
                              <div className="inline-flex items-center border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateItemQuantity(idx, -1)}
                                  className="px-2 py-1 hover:bg-gray-200 font-bold text-xs cursor-pointer text-gray-700"
                                >
                                  -
                                </button>
                                <span className="px-2 font-bold text-xs text-gray-900">{item.quantity}</span>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateItemQuantity(idx, 1)}
                                  className="px-2 py-1 hover:bg-gray-200 font-bold text-xs cursor-pointer text-gray-700"
                                >
                                  +
                                </button>
                              </div>
                            </td>

                            <td className="px-3 py-2.5">
                              <input
                                type="number"
                                min="0"
                                value={item.unitPrice}
                                onChange={(e) => handleUpdateItemPrice(idx, e.target.value)}
                                className="w-20 px-2 py-1 bg-gray-50 border border-gray-200 rounded text-xs font-bold outline-none"
                              />
                            </td>

                            <td className="px-3 py-2.5 font-extrabold text-gray-900">
                              ₹{(Number(item.unitPrice) || 0) * (Number(item.quantity) || 1)}
                            </td>

                            <td className="px-3 py-2.5 text-right">
                              <button
                                type="button"
                                onClick={() => handleRemoveKitItem(idx)}
                                className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded cursor-pointer"
                                title="Remove item"
                              >
                                <Trash2 size={15} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Merged Pricing & Discounts Section in Step 2 */}
                <div className="pt-4 border-t border-gray-100 space-y-4">
                  <div className="border-b border-gray-100 pb-2">
                    <h4 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                      <DollarSign className="text-brand-teal" size={16} /> Bundle Selling Price & Customer Savings
                    </h4>
                    <p className="text-[11px] text-gray-500">
                      Set the bundled kit price parents pay. Savings are calculated automatically.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Combined Items MRP (Sum of Articles)
                      </label>
                      <div className="px-3.5 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-xs font-extrabold text-gray-700 flex items-center justify-between">
                        <span>₹{calculatedTotalMrp}</span>
                        <span className="text-[10px] text-gray-400 font-normal">Auto-sum from items above</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Bundle Discounted Selling Price (₹) *
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={formData.bundlePrice}
                        onChange={e => setFormData({ ...formData, bundlePrice: e.target.value })}
                        placeholder={calculatedTotalMrp > 0 ? String(Math.round(calculatedTotalMrp * 0.85)) : '1299'}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-emerald-300 rounded-xl text-xs font-extrabold text-emerald-800 outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  {/* Savings & Discount Summary Pill */}
                  <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200/80 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                        <TrendingDown size={16} />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-emerald-950">Customer Direct Savings</h5>
                        <p className="text-[11px] text-emerald-700">Parents save ₹{savingsAmount} compared to buying articles separately.</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-black">
                        {discountPercentage}% DISCOUNT
                      </span>
                    </div>
                  </div>

                  {/* Inherited Product GST (No New GST Applicable Option) */}
                  <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                    <div className="space-y-0.5">
                      <div className="font-extrabold text-gray-800 flex items-center gap-1.5">
                        <Percent size={13} className="text-brand-teal" />
                        <span>GST Applied From Constituent Products</span>
                      </div>
                      <p className="text-[11px] text-gray-500">
                        GST is preserved as previously set on each individual product (e.g. 0% for books, 5% for uniforms, 12% for footwear). No separate kit-level GST option is applied.
                      </p>
                    </div>
                    <div className="shrink-0 bg-white px-3 py-1.5 rounded-lg border border-gray-200 text-right">
                      <span className="text-[10px] text-gray-400 uppercase font-semibold block">Effective Rate</span>
                      <span className="font-mono font-bold text-gray-800">~{derivedProductGst}% GST Included</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('media')}
                  className="px-5 py-2 bg-brand-teal text-white rounded-xl text-xs font-extrabold cursor-pointer"
                >
                  Next: Upload Images →
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: IMAGES & MEDIA */}
          {activeTab === 'media' && (
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-6">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                  <ImageIcon className="text-brand-teal" size={18} /> Kit Visuals & Photos
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Upload high resolution photos of the complete bundled package, flat-lays, and included tags.
                </p>
              </div>

              <ImageUploadDropzone
                images={formData.images}
                onChange={(imgs) => {
                  const deduped = dedupeImages(imgs);
                  setFormData(prev => ({
                    ...prev,
                    images: deduped,
                    image: deduped[0] || ''
                  }));
                }}
                onImagesChange={(imgs) => {
                  const deduped = dedupeImages(imgs);
                  setFormData(prev => ({
                    ...prev,
                    images: deduped,
                    image: deduped[0] || ''
                  }));
                }}
              />

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('inventory')}
                  className="px-5 py-2 bg-brand-teal text-white rounded-xl text-xs font-extrabold cursor-pointer"
                >
                  Next: Stock & Logistics →
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: STOCK & LOGISTICS */}
          {activeTab === 'inventory' && (
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-6">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                  <Package className="text-brand-teal" size={18} /> Kit Stock & Inventory Rules
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Set independent pre-packed bundle stock or let it update automatically from individual product availability.
                </p>
              </div>

              {/* Stock Mode Selection Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      inventoryMode: 'fixed',
                      stock: prev.stock && Number(prev.stock) > 0 ? prev.stock : '25'
                    }));
                  }}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    formData.inventoryMode === 'fixed'
                      ? 'border-brand-teal bg-brand-teal/5'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-gray-900 flex items-center gap-1.5">
                      <Package size={16} className="text-brand-teal" /> Independent Bundle Stock
                    </span>
                    <input
                      type="radio"
                      name="stockMode"
                      checked={formData.inventoryMode === 'fixed'}
                      onChange={() => {
                        setFormData(prev => ({
                          ...prev,
                          inventoryMode: 'fixed',
                          stock: prev.stock && Number(prev.stock) > 0 ? prev.stock : '25'
                        }));
                      }}
                      className="accent-brand-teal"
                    />
                  </div>
                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    Set a fixed, dedicated stock count for pre-boxed / pre-assembled kit packages in your warehouse.
                  </p>
                </div>

                <div
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      inventoryMode: 'dynamic',
                      stock: String(dynamicKitStock)
                    }));
                  }}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    formData.inventoryMode === 'dynamic'
                      ? 'border-brand-teal bg-brand-teal/5'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-gray-900 flex items-center gap-1.5">
                      <Sparkles size={16} className="text-brand-orange" /> Auto-Update (Dynamic)
                    </span>
                    <input
                      type="radio"
                      name="stockMode"
                      checked={formData.inventoryMode === 'dynamic'}
                      onChange={() => {
                        setFormData(prev => ({
                          ...prev,
                          inventoryMode: 'dynamic',
                          stock: String(dynamicKitStock)
                        }));
                      }}
                      className="accent-brand-teal"
                    />
                  </div>
                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    Automatically computes bundle stock from individual constituent items ({dynamicKitStock} kits currently available).
                  </p>
                </div>
              </div>

              {/* Status Alert Banner */}
              {formData.inventoryMode === 'fixed' ? (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold">Independent Stock Active:</span> Kit availability is locked to dedicated pre-packed units ({formData.stock || 0} kits).
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs flex items-center gap-2">
                  <Sparkles size={16} className="text-blue-600 shrink-0" />
                  <div>
                    <span className="font-bold">Auto-Updating Active:</span> Kit stock is dynamically calculated as{' '}
                    <span className="font-black underline">{dynamicKitStock} kits</span> based on constituent warehouse inventory.
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {formData.inventoryMode === 'fixed' ? 'Independent Kit Stock Count *' : 'Available Kit Stock (Auto-Computed)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    readOnly={formData.inventoryMode === 'dynamic'}
                    value={formData.inventoryMode === 'dynamic' ? dynamicKitStock : formData.stock}
                    onChange={e => setFormData({ ...formData, stock: e.target.value })}
                    placeholder={formData.inventoryMode === 'dynamic' ? String(dynamicKitStock) : "25"}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-brand-teal ${
                      formData.inventoryMode === 'dynamic' ? 'bg-gray-100 border border-gray-300 text-gray-700 cursor-not-allowed' : 'bg-gray-50 border border-gray-200 focus:bg-white'
                    }`}
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    {formData.inventoryMode === 'fixed'
                      ? 'Pre-packed bundles ready to ship independently.'
                      : 'Updated automatically as individual item stock changes.'}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Kit SKU Code
                  </label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={e => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="e.g. KIT-DPS-C5-BOY"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-brand-teal focus:bg-white"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Leave blank to auto-generate from school & grade.</p>
                </div>
              </div>

              {/* Component Availability Breakdown Table */}
              <div className="pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-extrabold text-gray-900 flex items-center gap-1.5">
                    <Boxes size={14} className="text-brand-teal" /> Constituent Component Availability
                  </h4>
                  <span className="text-[11px] text-gray-500 font-medium">
                    {kitItems.length} items in bundle
                  </span>
                </div>

                {kitItems.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No items added to kit yet. Add items in Step 2.</p>
                ) : (
                  <div className="border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold text-[11px]">
                        <tr>
                          <th className="px-3 py-2">Item Name</th>
                          <th className="px-3 py-2 text-center">Qty / Kit</th>
                          <th className="px-3 py-2 text-center">Warehouse Stock</th>
                          <th className="px-3 py-2 text-center">Max Kits Possible</th>
                          <th className="px-3 py-2 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {kitItems.map((item, idx) => {
                          const matched = existingProducts.find(p => String(p.id || p._id) === String(item.productId));
                          const available = Number(matched?.stock ?? matched?.stockQuantity ?? item.stock ?? 25);
                          const qtyReq = Math.max(1, Number(item.quantity) || 1);
                          const maxKits = Math.floor(available / qtyReq);
                          const isBottleneck = maxKits === dynamicKitStock;

                          return (
                            <tr key={idx} className={isBottleneck && dynamicKitStock < 10 ? 'bg-amber-50/50' : ''}>
                              <td className="px-3 py-2 font-medium text-gray-900">
                                <div>{item.name || item.title || matched?.name || `Item #${idx + 1}`}</div>
                                {item.variant && <div className="text-[10px] text-gray-400">{item.variant}</div>}
                              </td>
                              <td className="px-3 py-2 text-center font-bold text-gray-700">{qtyReq}</td>
                              <td className="px-3 py-2 text-center font-bold text-gray-700">{available}</td>
                              <td className="px-3 py-2 text-center">
                                <span className={`font-black ${isBottleneck ? 'text-brand-orange' : 'text-gray-900'}`}>
                                  {maxKits} kits
                                </span>
                              </td>
                              <td className="px-3 py-2 text-right">
                                {isBottleneck ? (
                                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-extrabold text-[10px]">
                                    Limiting Factor
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-[10px]">
                                    Sufficient
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Low Stock Alert Threshold
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.lowStockThreshold}
                    onChange={e => setFormData({ ...formData, lowStockThreshold: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-brand-teal focus:bg-white"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Receive warning when kit stock drops below this.</p>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('payment')}
                  className="px-5 py-2 bg-brand-teal text-white rounded-xl text-xs font-extrabold cursor-pointer"
                >
                  Next: Payment Methods →
                </button>
              </div>
            </div>
          )}

          {/* TAB 6: PAYMENT METHODS */}
          {activeTab === 'payment' && (
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-6">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                  <CreditCard className="text-brand-teal" size={18} /> Checkout Payment Method Controls
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Select payment methods allowed for parents ordering this kit.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div
                  onClick={() => setFormData({ ...formData, paymentMethodAllowed: 'Both' })}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    formData.paymentMethodAllowed === 'Both'
                      ? 'border-brand-teal bg-brand-teal/5 font-bold'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <h4 className="text-xs font-bold text-gray-900">💳 Both Methods</h4>
                  <p className="text-[11px] text-gray-500 mt-1">Allows Online Payment & Cash on Delivery (COD).</p>
                </div>

                <div
                  onClick={() => setFormData({ ...formData, paymentMethodAllowed: 'Online_Only' })}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    formData.paymentMethodAllowed === 'Online_Only'
                      ? 'border-amber-500 bg-amber-50/50 font-bold'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <h4 className="text-xs font-bold text-amber-800">⚡ Online Only</h4>
                  <p className="text-[11px] text-amber-700 mt-1"><strong>Disables COD</strong> for this kit bundle.</p>
                </div>

                <div
                  onClick={() => setFormData({ ...formData, paymentMethodAllowed: 'COD_Only' })}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    formData.paymentMethodAllowed === 'COD_Only'
                      ? 'border-blue-500 bg-blue-50/50 font-bold'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <h4 className="text-xs font-bold text-blue-800">💵 Cash on Delivery Only</h4>
                  <p className="text-[11px] text-blue-700 mt-1"><strong>Disables Online</strong> payment at checkout.</p>
                </div>
              </div>

              {/* Status Toggle */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Catalog Visibility</h4>
                  <p className="text-[11px] text-gray-500">Toggle whether this kit is immediately published or kept inactive.</p>
                </div>
                <select
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value })}
                  className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none"
                >
                  <option value="available">Available (Public)</option>
                  <option value="inactive">Inactive (Draft)</option>
                  <option value="out-of-stock">Out of Stock</option>
                </select>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-6 py-2.5 bg-brand-teal text-white rounded-xl text-xs font-extrabold cursor-pointer flex items-center gap-1.5 shadow-md"
                >
                  <Save size={16} /> {isEdit ? 'Save Changes' : 'Publish Kit Bundle'}
                </button>
              </div>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: Sticky Real-time Kit Card Preview */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs sticky top-4 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h4 className="text-xs font-extrabold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                <Eye size={15} className="text-brand-teal" /> Live Customer Store Preview
              </h4>
              <span className="text-[10px] text-brand-teal font-bold px-2 py-0.5 rounded-full bg-brand-teal/10">
                Website Card
              </span>
            </div>

            {/* The Kit Card Preview mirroring KitCard.jsx */}
            <div className="rounded-2xl border border-gray-200 overflow-hidden shadow-xs bg-white">
              {/* Image & Badges */}
              <div className="relative aspect-4/3 bg-gray-100 overflow-hidden">
                {formData.images.length > 0 ? (
                  <img
                    src={resolveImageUrl(formData.images[0])}
                    alt={formData.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 p-4 text-center">
                    <Boxes size={36} className="mb-2 opacity-50" />
                    <span className="text-xs font-medium">Upload photo in Images tab</span>
                  </div>
                )}

                {/* Badge Tag */}
                {formData.badgeTag && (
                  <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-brand-teal text-white text-[10px] font-black tracking-wide uppercase shadow-sm">
                    {formData.badgeTag}
                  </span>
                )}

                {/* Savings Badge */}
                {discountPercentage > 0 && (
                  <span className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-black tracking-wide uppercase shadow-sm">
                    {discountPercentage}% OFF
                  </span>
                )}
              </div>

              {/* Card Body */}
              <div className="p-4 space-y-3">
                {/* School & Grade pill */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-bold">
                    🏫 {formData.schoolName || 'School Name'}
                  </span>
                  {selectedGrades.length > 0 && (
                    <span className="px-2 py-0.5 rounded-md bg-teal-50 text-brand-teal border border-teal-200 text-[10px] font-bold">
                      {selectedGrades.slice(0, 2).join(', ')}{selectedGrades.length > 2 ? ` +${selectedGrades.length - 2}` : ''}
                    </span>
                  )}
                </div>

                <h3 className="font-extrabold text-sm text-gray-900 line-clamp-2">
                  {formData.title || 'DPS Complete Uniform & Books Kit'}
                </h3>

                {/* Included Items Pills */}
                <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 space-y-1.5">
                  <div className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
                    {kitItems.length} Items Included:
                  </div>
                  {kitItems.length === 0 ? (
                    <div className="text-[11px] text-gray-400 italic">No items added yet</div>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {kitItems.slice(0, 4).map((it, idx) => (
                        <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-white border border-gray-200 font-bold text-gray-700">
                          {it.name} (x{it.quantity})
                        </span>
                      ))}
                      {kitItems.length > 4 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-teal/10 text-brand-teal font-black">
                          +{kitItems.length - 4} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Price Breakdown */}
                <div className="pt-2 border-t border-gray-100 flex items-baseline justify-between">
                  <div>
                    <span className="text-lg font-black text-gray-900">₹{effectiveBundlePrice}</span>
                    {calculatedTotalMrp > effectiveBundlePrice && (
                      <span className="text-xs text-gray-400 line-through ml-2">₹{calculatedTotalMrp}</span>
                    )}
                  </div>
                  {savingsAmount > 0 && (
                    <span className="text-xs font-bold text-emerald-700">
                      Save ₹{savingsAmount}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <p className="text-[11px] text-gray-400 text-center leading-relaxed">
              Updates in real-time as you modify title, constituent items, pricing, and images.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
