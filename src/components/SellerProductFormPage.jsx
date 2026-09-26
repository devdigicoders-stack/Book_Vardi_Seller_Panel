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
  RotateCcw,
  CreditCard,
  BookOpen,
  Search,
  Layers3
} from 'lucide-react';
import ImageUploadDropzone from './ImageUploadDropzone';
import { resolveImageUrl, parseSizeVariants } from '../utils/mediaUrl';
import { fetchSchoolsApi, fetchCategoriesApi } from '../utils/api';

// Universal Category Form Configuration Schema Matrix
export const CATEGORY_FORM_SCHEMA = {
  // 1. NCERT & Books
  ncert: {
    showMeterCalculation: false,
    showSizeChart: false,
    showGender: false,
    allowedScales: ['count', 'box', 'custom'],
    allowedPresets: ['book_sets', 'piece_count', 'packaging']
  },
  practice_books: {
    showMeterCalculation: false,
    showSizeChart: false,
    showGender: false,
    allowedScales: ['count', 'box', 'custom'],
    allowedPresets: ['book_sets', 'piece_count', 'packaging']
  },
  drawing_books: {
    showMeterCalculation: false,
    showSizeChart: false,
    showGender: false,
    allowedScales: ['count', 'box', 'custom'],
    allowedPresets: ['book_sets', 'piece_count', 'packaging']
  },

  // 2. Notebooks & Stationery
  notebooks: {
    showMeterCalculation: false,
    showSizeChart: false,
    showGender: false,
    allowedScales: ['count', 'box', 'kg', 'custom'],
    allowedPresets: ['piece_count', 'weight_custom', 'packaging', 'book_sets']
  },
  stationery: {
    showMeterCalculation: false,
    showSizeChart: false,
    showGender: false,
    allowedScales: ['count', 'box', 'custom'],
    allowedPresets: ['piece_count', 'packaging']
  },
  writing: {
    showMeterCalculation: false,
    showSizeChart: false,
    showGender: false,
    allowedScales: ['count', 'box', 'custom'],
    allowedPresets: ['piece_count', 'packaging']
  },
  drawing: {
    showMeterCalculation: false,
    showSizeChart: false,
    showGender: false,
    allowedScales: ['count', 'box', 'custom'],
    allowedPresets: ['piece_count', 'packaging']
  },
  bottles: {
    showMeterCalculation: false,
    showSizeChart: false,
    showGender: false,
    allowedScales: ['count', 'box', 'custom'],
    allowedPresets: ['piece_count', 'packaging']
  },
  bags: {
    showMeterCalculation: false,
    showSizeChart: false,
    showGender: true,
    allowedScales: ['count', 'box', 'custom'],
    allowedPresets: ['piece_count', 'packaging']
  },

  // 3. Shoes & Socks
  shoes: {
    showMeterCalculation: false,
    showSizeChart: false,
    showGender: true,
    allowedScales: ['size', 'count', 'custom'],
    allowedPresets: ['standard', 'piece_count']
  },

  // 4. Uniforms & Clothing
  uniforms: {
    showMeterCalculation: true,
    showSizeChart: true,
    showGender: true,
    allowedScales: ['size', 'meter', 'count', 'custom'],
    allowedPresets: ['standard', 'uniform_waist', 'meters_custom', 'piece_count']
  },
  rain_winter: {
    showMeterCalculation: true,
    showSizeChart: true,
    showGender: true,
    allowedScales: ['size', 'meter', 'count', 'custom'],
    allowedPresets: ['standard', 'uniform_waist', 'meters_custom']
  },
  sports: {
    showMeterCalculation: true,
    showSizeChart: true,
    showGender: true,
    allowedScales: ['size', 'meter', 'count', 'custom'],
    allowedPresets: ['standard', 'uniform_waist', 'meters_custom']
  }
};

export function getCategorySchema(categoryKey) {
  const cat = String(categoryKey || '').toLowerCase().trim();
  return CATEGORY_FORM_SCHEMA[cat] || {
    showMeterCalculation: true,
    showSizeChart: true,
    showGender: true,
    allowedScales: ['size', 'count', 'meter', 'kg', 'box', 'custom'],
    allowedPresets: ['standard', 'uniform_waist', 'weight_custom', 'piece_count', 'meters_custom', 'book_sets', 'packaging']
  };
}

// Sizing & Scale Presets with Base Variant Values (250g, 3pcs, 3metre, 2.5m, etc.)
const SIZE_PRESETS = [
  {
    id: 'standard',
    label: 'Apparel Standard (S - XXL)',
    scale: 'size',
    sizes: ['S', 'M', 'L', 'XL', 'XXL']
  },
  {
    id: 'uniform_waist',
    label: 'Uniform Waist / Chest (26 - 38)',
    scale: 'size',
    sizes: ['26', '28', '30', '32', '34', '36', '38']
  },
  {
    id: 'weight_custom',
    label: 'Weight Units (250g, 500g, 1kg, 2kg)',
    scale: 'kg',
    sizes: ['250g', '500g', '1kg', '2kg', '5kg']
  },
  {
    id: 'piece_count',
    label: 'Piece Count (1pc, 3pcs, 6pcs, 12pcs)',
    scale: 'count',
    sizes: ['1pc', '3pcs', '6pcs', '12pcs']
  },
  {
    id: 'meters_custom',
    label: 'Fabric Length (1m, 1.8m, 2.5m, 3m, 5m)',
    scale: 'meter',
    sizes: ['1m', '1.8m', '2.5m', '3m', '5m']
  },
  {
    id: 'book_sets',
    label: 'Books & Counts (Single / Sets)',
    scale: 'count',
    sizes: ['1 Book', 'Set of 3 Books', 'Set of 5 Books', 'Set of 10 Books']
  },
  {
    id: 'packaging',
    label: 'Boxes & Bulk Packs',
    scale: 'box',
    sizes: ['1 Piece', 'Pack of 10', '1 Box (50 Pcs)', '1 Carton']
  }
];

const MEASURE_SCALES = [
  { id: 'size', label: 'Clothes & Shoes (Size: S, M, XL, 32)', defaultUnit: 'Size', placeholder: 'e.g. S, M, L, XL, 32, UK 8' },
  { id: 'count', label: 'Pieces & Count (3pcs, 6pcs, Set of 5)', defaultUnit: 'Pcs', placeholder: 'e.g. 1pc, 3pcs, 6pcs, Pack of 10' },
  { id: 'meter', label: 'Fabric & Materials (2.5m, 3m, 3metre)', defaultUnit: 'Meter', placeholder: 'e.g. 1m, 1.8m, 2.5m, 3m, 3metre' },
  { id: 'kg', label: 'Weight & Mass (250g, 500g, 1kg)', defaultUnit: 'Kg', placeholder: 'e.g. 250g, 500g, 1kg, 2kg, 5kg' },
  { id: 'box', label: 'Packaging (Box / Carton / Pieces)', defaultUnit: 'Box', placeholder: 'e.g. 1 Box (50 Pcs), 1 Carton, 1 Piece' },
  { id: 'custom', label: 'Custom Base Variant (250g, 3pcs, 3metre)', defaultUnit: 'Unit', placeholder: 'e.g. 250g, 3pcs, 3metre, 2.5m' }
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

export default function SellerProductFormPage({ product, existingProducts = [], onSave, onBack }) {
  const isEdit = Boolean(product);

  // Entry Type: 'single' (Standard product) or 'kit' (Kit / Bundle)
  const [entryType, setEntryType] = useState(() => {
    if (product?.category === 'kits' || product?.bundleType === 'kit' || (Array.isArray(product?.items) && product.items.length > 0)) {
      return 'kit';
    }
    return 'single';
  });

  // Kit Mode: 'existing' (bundle catalog products) or 'scratch' (create kit from scratch)
  const [kitMode, setKitMode] = useState('existing');

  // Single Product Form Data
  const [formData, setFormData] = useState({
    name: '',
    subtitle: '',
    price: '',
    originalPrice: '',
    category: 'uniforms',
    subCategory: '',
    schoolName: '',
    schoolCode: '',
    classGrade: '',
    gender: 'Unisex',
    ageGroup: '',
    ages: '',
    colors: '',
    material: '',
    brand: '',
    gst: '5',
    isGstInclusive: true,
    tags: '',
    status: 'Pending',
    discountBadge: '',
    stockQuantity: '',
    paymentMethodAllowed: 'Both',
    description: '',
    sku: '',
    image: '',
    images: [],
    isMeterBased: false,
    minMeter: '0.5',
    meterStep: '0.5',
    isReturnable: true,
    returnWindowDays: '7',
    enableSizeChart: false,
    sizeChart: {
      chestInches: '',
      lengthInches: '',
      sleeveInches: '',
      waistInches: '',
      shoulderInches: '',
      sizeGuideText: '',
      rows: []
    }
  });

  // Dynamic Category Form Schema (Hides meter calculations/kg/size-charts for NCERT books & non-apparel)
  const categorySchema = getCategorySchema(formData.category);

  // Variants & Measuring Scales
  const [sizeVariants, setSizeVariants] = useState([]);

  // Modal for Adding / Editing a Variant
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [editingVariantIndex, setEditingVariantIndex] = useState(null);
  const [variantForm, setVariantForm] = useState({
    size: '',
    measureScale: 'size',
    measureValue: '',
    unit: 'Size',
    price: '',
    mrp: '',
    stock: '',
    sku: '',
    image: '',
    images: []
  });

  // Kit / Bundle Specific State
  const [kitData, setKitData] = useState({
    title: '',
    schoolName: '',
    classGrade: '',
    gender: 'Unisex',
    badgeTag: '',
    bundlePrice: '',
    totalMrp: '',
    stock: '',
    description: '',
    paymentMethodAllowed: 'Both',
    images: []
  });
  const [selectedKitProducts, setSelectedKitProducts] = useState([]);
  const [scratchKitItems, setScratchKitItems] = useState([
    { name: '', quantity: 1, unitPrice: '' }
  ]);
  const [catalogSearch, setCatalogSearch] = useState('');

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'variants' | 'kit' | 'payment'

  const [schoolOptions, setSchoolOptions] = useState([]);
  const [dbCategories, setDbCategories] = useState([]);

  // Fetch Admin-added schools and Categories with GST
  useEffect(() => {
    async function loadMetadata() {
      const [schoolsData, catsData] = await Promise.all([
        fetchSchoolsApi(),
        fetchCategoriesApi()
      ]);
      if (Array.isArray(schoolsData)) setSchoolOptions(schoolsData);
      if (Array.isArray(catsData)) setDbCategories(catsData);
    }
    loadMetadata();
  }, []);

  // Initialize form
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (product) {
      const prodImages = Array.isArray(product.images) && product.images.length > 0
        ? product.images
        : (product.image ? [product.image] : []);

      setFormData({
        name: product.name || product.title || '',
        subtitle: product.subtitle || '',
        price: product.price !== undefined ? String(product.price) : '',
        originalPrice: product.originalPrice || product.mrp ? String(product.originalPrice || product.mrp) : '',
        category: product.category || 'uniforms',
        subCategory: product.subCategory || '',
        schoolName: product.schoolName || product.school || '',
        schoolCode: product.schoolCode || '',
        classGrade: product.classGrade || product.className || '',
        gender: product.gender || 'Unisex',
        ageGroup: product.ageGroup || '',
        ages: Array.isArray(product.ages) ? product.ages.join(', ') : (product.ages || ''),
        colors: Array.isArray(product.colors) ? product.colors.join(', ') : (product.colors || ''),
        material: product.material || '',
        brand: product.brand || '',
        gst: product.gst !== undefined ? String(product.gst) : (product.gstPercentage !== undefined ? String(product.gstPercentage) : '5'),
        isGstInclusive: product.isGstInclusive !== undefined ? Boolean(product.isGstInclusive) : true,
        tags: Array.isArray(product.tags) ? product.tags.join(', ') : (product.tags || ''),
        status: product.approvalStatus || product.status || 'Pending',
        discountBadge: product.discountBadge || product.badge || 'NEW',
        stockQuantity: product.stockQuantity !== undefined ? String(product.stockQuantity) : (product.stock !== undefined ? String(product.stock) : '50'),
        paymentMethodAllowed: product.paymentMethodAllowed || 'Both',
        description: product.description || '',
        sku: product.sku || '',
        image: prodImages[0] || product.image || '',
        images: prodImages,
        isMeterBased: Boolean(product.isMeterBased),
        minMeter: product.minMeter !== undefined ? String(product.minMeter) : '0.5',
        meterStep: product.meterStep !== undefined ? String(product.meterStep) : '0.5',
        isReturnable: product.isReturnable !== undefined ? Boolean(product.isReturnable) : true,
        returnWindowDays: product.returnWindowDays !== undefined ? String(product.returnWindowDays) : '7',
        enableSizeChart: Boolean(product.sizeChart && product.sizeChart.rows && product.sizeChart.rows.length > 0),
        sizeChart: (product.sizeChart && product.sizeChart.rows && product.sizeChart.rows.length > 0) ? product.sizeChart : {
          chestInches: '',
          lengthInches: '',
          sleeveInches: '',
          waistInches: '',
          shoulderInches: '',
          sizeGuideText: '',
          rows: [
            { size: 'S', chest: '36', length: '26', sleeve: '8', waist: '30', shoulder: '16' },
            { size: 'M', chest: '38', length: '27', sleeve: '8.5', waist: '32', shoulder: '17' },
            { size: 'L', chest: '40', length: '28', sleeve: '9', waist: '34', shoulder: '18' },
            { size: 'XL', chest: '42', length: '29', sleeve: '9.5', waist: '36', shoulder: '19' },
            { size: 'XXL', chest: '44', length: '30', sleeve: '10', waist: '38', shoulder: '20' }
          ]
        }
      });

      // Load sizeVariants safely via parseSizeVariants
      const parsedVariants = parseSizeVariants(product);
      if (parsedVariants.length > 0) {
        setSizeVariants(parsedVariants.map(v => ({
          size: v.size || v.measureValue || '',
          measureScale: v.measureScale || 'size',
          measureValue: v.measureValue || v.size || '',
          unit: v.unit || 'Size',
          price: v.price !== undefined ? String(v.price) : String(product.price || ''),
          mrp: v.mrp !== undefined ? String(v.mrp) : String(product.originalPrice || product.mrp || ''),
          stock: v.stock !== undefined ? String(v.stock) : '25',
          image: v.image || '',
          images: Array.isArray(v.images) ? v.images : (v.image ? [v.image] : []),
          sku: v.sku || (product.sku ? `${product.sku}-${v.size || v.measureValue}` : '')
        })));
      } else if (Array.isArray(product.sizes) && product.sizes.length > 0) {
        setSizeVariants(product.sizes.map(s => ({
          size: s,
          measureScale: 'size',
          measureValue: s,
          unit: 'Size',
          price: String(product.price || ''),
          mrp: String(product.originalPrice || product.mrp || ''),
          stock: '25',
          image: prodImages[0] || '',
          images: prodImages[0] ? [prodImages[0]] : [],
          sku: product.sku ? `${product.sku}-${s}` : ''
        })));
      } else {
        setSizeVariants([]);
      }

      // Initialize Kit if editing a kit
      if (product.category === 'kits' || product.bundleType === 'kit' || Array.isArray(product.items)) {
        setKitData({
          title: product.title || product.name || '',
          schoolName: product.schoolName || '',
          classGrade: product.classGrade || 'Class 1-5',
          gender: product.gender || 'Unisex',
          badgeTag: product.badgeTag || 'School Approved',
          bundlePrice: product.bundlePrice !== undefined ? String(product.bundlePrice) : String(product.price || ''),
          totalMrp: product.totalMrp !== undefined ? String(product.totalMrp) : String(product.originalPrice || product.mrp || ''),
          stock: product.stock !== undefined ? String(product.stock) : '20',
          description: product.description || '',
          paymentMethodAllowed: product.paymentMethodAllowed || 'Both',
          images: prodImages
        });
        if (Array.isArray(product.items)) {
          setSelectedKitProducts(product.items.map(item => ({
            productId: item.productId || item.id,
            name: item.name,
            unitPrice: item.unitPrice || item.price || 0,
            quantity: item.quantity || 1,
            image: item.image || ''
          })));
        }
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
        schoolCode: '',
        classGrade: '',
        gender: 'Unisex',
        ageGroup: '',
        ages: '',
        colors: '',
        material: '',
        brand: '',
        gst: '5',
        tags: '',
        status: 'Pending',
        discountBadge: '',
        stockQuantity: '',
        paymentMethodAllowed: 'Both',
        description: '',
        sku: '',
        image: '',
        images: [],
        isMeterBased: false,
        minMeter: '0.5',
        meterStep: '0.5',
        isReturnable: true,
        returnWindowDays: '7',
        enableSizeChart: false,
        sizeChart: {
          chestInches: '',
          lengthInches: '',
          sleeveInches: '',
          waistInches: '',
          shoulderInches: '',
          sizeGuideText: '',
          rows: []
        }
      });
      setSizeVariants([]);
      setKitData({
        title: '',
        schoolName: '',
        classGrade: '',
        gender: 'Unisex',
        badgeTag: '',
        bundlePrice: '',
        totalMrp: '',
        stock: '',
        description: '',
        paymentMethodAllowed: 'Both',
        images: []
      });
    }
  }, [product]);

  // Variant Modal Handlers
  const openAddVariantModal = () => {
    const defaultPrice = formData.price || '';
    const defaultMrp = formData.originalPrice || '';
    setEditingVariantIndex(null);
    setVariantForm({
      size: '',
      measureScale: 'size',
      measureValue: '',
      unit: 'Size',
      price: defaultPrice,
      mrp: defaultMrp,
      stock: formData.stockQuantity || '',
      sku: '',
      image: formData.images[0] || '',
      images: formData.images.length > 0 ? [formData.images[0]] : []
    });
    setIsVariantModalOpen(true);
  };

  const openEditVariantModal = (index) => {
    const v = sizeVariants[index];
    setEditingVariantIndex(index);
    setVariantForm({
      size: v.size || v.measureValue || '',
      measureScale: v.measureScale || 'size',
      measureValue: v.measureValue || v.size || '',
      unit: v.unit || 'Size',
      price: v.price !== undefined ? String(v.price) : '',
      mrp: v.mrp !== undefined ? String(v.mrp) : '',
      stock: v.stock !== undefined ? String(v.stock) : '25',
      sku: v.sku || '',
      image: v.image || '',
      images: Array.isArray(v.images) ? v.images : (v.image ? [v.image] : [])
    });
    setIsVariantModalOpen(true);
  };

  const handleSaveVariantModal = (e) => {
    e?.preventDefault();
    const val = (variantForm.measureValue || variantForm.size).trim();
    if (!val) {
      setError('Please enter a variant value (e.g., Size, Count, Meter, or Weight value).');
      return;
    }
    if (!variantForm.price || Number(variantForm.price) <= 0) {
      setError('Please enter a valid selling price for this variant.');
      return;
    }

    const newVariant = {
      size: val,
      measureScale: variantForm.measureScale,
      measureValue: val,
      unit: variantForm.unit,
      price: variantForm.price,
      mrp: variantForm.mrp || Math.round(Number(variantForm.price) * 1.25).toString(),
      stock: variantForm.stock || '25',
      sku: variantForm.sku || `SKU-${val}`,
      image: variantForm.images[0] || variantForm.image || '',
      images: variantForm.images
    };

    if (editingVariantIndex !== null) {
      setSizeVariants(prev => {
        const copy = [...prev];
        copy[editingVariantIndex] = newVariant;
        return copy;
      });
    } else {
      setSizeVariants(prev => [...prev, newVariant]);
    }

    setIsVariantModalOpen(false);
    setError('');
  };

  const handleRemoveVariant = (index) => {
    setSizeVariants(prev => prev.filter((_, i) => i !== index));
  };

  const applySizePreset = (preset) => {
    const defaultPrice = formData.price || '499';
    const defaultMrp = formData.originalPrice || Math.round(Number(defaultPrice || 499) * 1.25).toString();
    const defaultImage = formData.images[0] || formData.image || '';

    const newVariants = preset.sizes.map(sz => {
      const existing = sizeVariants.find(v => (v.size || v.measureValue || '').toLowerCase() === sz.toLowerCase());
      if (existing) return existing;
      return {
        size: sz,
        measureScale: preset.scale,
        measureValue: sz,
        unit: preset.scale.toUpperCase(),
        price: defaultPrice,
        mrp: defaultMrp,
        stock: '25',
        image: defaultImage,
        images: defaultImage ? [defaultImage] : [],
        sku: formData.sku ? `${formData.sku}-${sz}` : `SKU-${sz}`
      };
    });

    setSizeVariants(newVariants);
  };

  // Kit Helpers
  const handleAddProductToKit = (p) => {
    if (selectedKitProducts.some(item => String(item.productId) === String(p.id || p._id))) return;
    const newItem = {
      productId: p.id || p._id,
      name: p.name || p.title,
      unitPrice: Number(p.price) || 0,
      quantity: 1,
      image: p.image || ''
    };
    setSelectedKitProducts(prev => [...prev, newItem]);
  };

  const handleRemoveProductFromKit = (productId) => {
    setSelectedKitProducts(prev => prev.filter(item => String(item.productId) !== String(productId)));
  };

  const handleUpdateKitProductQty = (productId, qty) => {
    const numQty = Math.max(1, Number(qty) || 1);
    setSelectedKitProducts(prev => prev.map(item => {
      if (String(item.productId) === String(productId)) {
        return { ...item, quantity: numQty };
      }
      return item;
    }));
  };

  const calculatedKitMrp = selectedKitProducts.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);

  // Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (entryType === 'single') {
      if (!formData.name.trim()) {
        setError('Please provide a product title/name.');
        setActiveTab('general');
        return;
      }

      if (sizeVariants.length > 0) {
        for (const variant of sizeVariants) {
          if (!variant.price || Number(variant.price) <= 0) {
            setError(`Please specify a valid selling price for variant "${variant.size || variant.measureValue}".`);
            setActiveTab('variants');
            return;
          }
        }
      } else {
        if (!formData.price || Number(formData.price) <= 0) {
          setError('Please set a valid base selling price.');
          setActiveTab('general');
          return;
        }
      }

      setSubmitting(true);
      try {
        const validPrices = sizeVariants.map(v => Number(v.price)).filter(p => !isNaN(p) && p > 0);
        const minVariantPrice = validPrices.length > 0 ? Math.min(...validPrices) : Number(formData.price);
        const totalVariantStock = sizeVariants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);

        const primaryImage = formData.images[0] || formData.image || '';

        const paymentAllowedStr = formData.paymentMethodAllowed || 'Both';
        const paymentAllowedArr = paymentAllowedStr === 'Online_Only' 
          ? ['Online'] 
          : (paymentAllowedStr === 'COD_Only' ? ['COD'] : ['COD', 'Online']);

        const parsedAges = typeof formData.ages === 'string'
          ? formData.ages.split(',').map(s => s.trim()).filter(Boolean)
          : (Array.isArray(formData.ages) ? formData.ages : []);

        const parsedColors = typeof formData.colors === 'string'
          ? formData.colors.split(',').map(s => s.trim()).filter(Boolean)
          : (Array.isArray(formData.colors) ? formData.colors : []);

        const parsedTags = typeof formData.tags === 'string'
          ? formData.tags.split(',').map(s => s.trim()).filter(Boolean)
          : (Array.isArray(formData.tags) ? formData.tags : []);

        const payload = {
          ...formData,
          bundleType: 'single',
          schoolName: formData.schoolName || '',
          schoolCode: formData.schoolCode || '',
          classGrade: formData.classGrade || '',
          ageGroup: formData.ageGroup || '',
          ages: parsedAges,
          colors: parsedColors,
          material: formData.material || '',
          brand: formData.brand || '',
          gst: Number(formData.gst) || 5,
          gstPercentage: Number(formData.gst) || 5,
          isGstInclusive: Boolean(formData.isGstInclusive),
          tags: parsedTags,
          status: (sizeVariants.length > 0 ? totalVariantStock : Number(formData.stockQuantity || 0)) > 0 ? 'available' : 'out-of-stock',
          approvalStatus: 'Pending',
          price: sizeVariants.length > 0 ? minVariantPrice : Number(formData.price),
          originalPrice: Number(formData.originalPrice) || Math.round(minVariantPrice * 1.25),
          mrp: Number(formData.originalPrice) || Math.round(minVariantPrice * 1.25),
          stockQuantity: sizeVariants.length > 0 ? totalVariantStock : Number(formData.stockQuantity || 0),
          stock: sizeVariants.length > 0 ? totalVariantStock : Number(formData.stockQuantity || 0),
          image: primaryImage,
          images: formData.images.length > 0 ? formData.images : [primaryImage],
          paymentMethodAllowed: paymentAllowedStr,
          paymentMethodsAllowed: paymentAllowedArr,
          isMeterBased: Boolean(formData.isMeterBased),
          minMeter: Number(formData.minMeter) || 0.5,
          meterStep: Number(formData.meterStep) || 0.5,
          unit: formData.isMeterBased ? 'meter' : (formData.unit || 'piece'),
          isReturnable: Boolean(formData.isReturnable),
          returnWindowDays: Number(formData.returnWindowDays) || 7,
          sizeChart: formData.enableSizeChart ? formData.sizeChart : { rows: [] },
          sizes: sizeVariants.map(v => v.size || v.measureValue),
          sizeVariants: sizeVariants.map(v => ({
            size: v.size || v.measureValue,
            measureScale: v.measureScale || 'size',
            measureValue: v.measureValue || v.size,
            unit: v.unit || 'Size',
            price: Number(v.price) || minVariantPrice,
            mrp: Number(v.mrp || v.originalPrice) || Math.round(minVariantPrice * 1.25),
            originalPrice: Number(v.originalPrice || v.mrp) || Math.round(minVariantPrice * 1.25),
            stock: Number(v.stock) || 0,
            stockQuantity: Number(v.stockQuantity || v.stock) || 0,
            image: v.image || primaryImage,
            images: Array.isArray(v.images) && v.images.length > 0 ? v.images : [v.image || primaryImage],
            sku: v.sku || `${formData.sku || 'SKU'}-${v.size || v.measureValue}`
          })),
          variants: sizeVariants.map(v => ({
            size: v.size || v.measureValue,
            measureScale: v.measureScale || 'size',
            measureValue: v.measureValue || v.size,
            unit: v.unit || 'Size',
            price: Number(v.price) || minVariantPrice,
            mrp: Number(v.mrp || v.originalPrice) || Math.round(minVariantPrice * 1.25),
            originalPrice: Number(v.originalPrice || v.mrp) || Math.round(minVariantPrice * 1.25),
            stock: Number(v.stock) || 0,
            stockQuantity: Number(v.stockQuantity || v.stock) || 0,
            image: v.image || primaryImage,
            images: Array.isArray(v.images) && v.images.length > 0 ? v.images : [v.image || primaryImage],
            sku: v.sku || `${formData.sku || 'SKU'}-${v.size || v.measureValue}`
          }))
        };

        await onSave(payload);
      } catch (err) {
        setError(err.message || 'Failed to save product to merchant catalog.');
      } finally {
        setSubmitting(false);
      }

    } else {
      // Kit Submission
      if (!kitData.title.trim()) {
        setError('Please provide a title for the Kit Bundle.');
        setActiveTab('kit');
        return;
      }

      let finalKitItems = [];
      let finalTotalMrp = 0;

      if (kitMode === 'existing') {
        if (selectedKitProducts.length === 0) {
          setError('Please add at least one catalog product to the Kit Bundle.');
          setActiveTab('kit');
          return;
        }
        finalKitItems = selectedKitProducts.map(item => ({
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.unitPrice * item.quantity
        }));
        finalTotalMrp = calculatedKitMrp;
      } else {
        const validScratchItems = scratchKitItems.filter(i => i.name.trim() !== '');
        if (validScratchItems.length === 0) {
          setError('Please add at least one line item to the kit.');
          setActiveTab('kit');
          return;
        }
        finalKitItems = validScratchItems.map(item => ({
          name: item.name,
          quantity: Number(item.quantity) || 1,
          unitPrice: Number(item.unitPrice) || 0,
          totalPrice: (Number(item.unitPrice) || 0) * (Number(item.quantity) || 1)
        }));
        finalTotalMrp = finalKitItems.reduce((sum, i) => sum + i.totalPrice, 0);
      }

      const finalBundlePrice = Number(kitData.bundlePrice) || Math.round(finalTotalMrp * 0.85);

      setSubmitting(true);
      try {
        const finalImages = (kitData.images && kitData.images.length > 0)
          ? kitData.images
          : (formData.images && formData.images.length > 0 ? formData.images : (formData.image ? [formData.image] : []));

        const paymentAllowedStr = kitData.paymentMethodAllowed || 'Both';
        const paymentAllowedArr = paymentAllowedStr === 'Online_Only' 
          ? ['Online'] 
          : (paymentAllowedStr === 'COD_Only' ? ['COD'] : ['COD', 'Online']);

        const payload = {
          name: kitData.title,
          title: kitData.title,
          category: 'kits',
          bundleType: 'kit',
          schoolName: kitData.schoolName,
          classGrade: kitData.classGrade,
          gender: kitData.gender,
          badgeTag: kitData.badgeTag,
          badge: kitData.badgeTag,
          items: finalKitItems,
          totalMrp: finalTotalMrp,
          bundlePrice: finalBundlePrice,
          price: finalBundlePrice,
          originalPrice: finalTotalMrp,
          mrp: finalTotalMrp,
          stock: Number(kitData.stock) || 20,
          stockQuantity: Number(kitData.stock) || 20,
          description: kitData.description,
          image: finalImages[0],
          images: finalImages,
          paymentMethodAllowed: paymentAllowedStr,
          paymentMethodsAllowed: paymentAllowedArr
        };

        await onSave(payload);
      } catch (err) {
        setError(err.message || 'Failed to save Kit Bundle.');
      } finally {
        setSubmitting(false);
      }
    }
  };

  return (
    <div className="space-y-6 pb-20">
      
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
              <span className="text-brand-teal">{isEdit ? 'Edit Item' : 'Add New Entry'}</span>
            </div>
            <h1 className="font-display font-extrabold text-2xl text-gray-900 mt-0.5">
              {isEdit ? `Edit: ${formData.name || kitData.title || 'Product'}` : 'Create Catalog Entry'}
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
                <Save size={16} /> {isEdit ? 'Update Entry' : 'Publish Entry to Store'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* ENTRY TYPE TOGGLE: Single Product vs Kit / Bundle */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-3">
        <span className="text-xs font-extrabold text-gray-700 uppercase">Entry Type:</span>
        <div className="p-1 bg-gray-100 rounded-xl inline-flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              setEntryType('single');
              setActiveTab('general');
            }}
            className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
              entryType === 'single' ? 'bg-brand-teal text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Standard Product (With Variants)
          </button>
          <button
            type="button"
            onClick={() => {
              setEntryType('kit');
              setActiveTab('kit');
            }}
            className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
              entryType === 'kit' ? 'bg-brand-teal text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Kit / Bundle Package (Multi-Item)
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
        {entryType === 'single' ? (
          [
            { id: 'general', label: '1. General Details & Base Photos', icon: Tag },
            { id: 'variants', label: `2. Scale Variants Matrix (${sizeVariants.length})`, icon: Layers },
            { id: 'payment', label: '3. Allowed Payment Methods', icon: CreditCard }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive ? 'bg-brand-teal text-white shadow-xs' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
              </button>
            );
          })
        ) : (
          [
            { id: 'kit', label: '1. Kit Bundle Configuration', icon: Layers3 },
            { id: 'payment', label: '2. Allowed Payment Methods', icon: CreditCard }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive ? 'bg-brand-teal text-white shadow-xs' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
              </button>
            );
          })
        )}
      </div>

      {/* SINGLE PRODUCT ENTRY */}
      {entryType === 'single' && (
        <div className="space-y-6">
          {activeTab === 'general' && (
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-5">
              <h3 className="text-base font-extrabold text-gray-900 border-b border-gray-100 pb-3">
                General Product Information
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Product Title / Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. DPS Navy Blue Cotton Uniform Shirt"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Category *</label>
                    <select
                      value={formData.category}
                      onChange={e => {
                        const selectedCat = e.target.value;
                        const catObj = dbCategories.find(c => c.name?.toLowerCase() === selectedCat.toLowerCase() || c.slug === selectedCat);
                        setFormData({
                          ...formData,
                          category: selectedCat,
                          gst: catObj && catObj.gstPercentage !== undefined ? String(catObj.gstPercentage) : formData.gst
                        });
                      }}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none cursor-pointer"
                    >
                      <option value="uniforms">Uniforms & Blazers</option>
                      <option value="shoes">Shoes & Socks</option>
                      <option value="stationery">Pens & Stationery</option>
                      <option value="ncert">NCERT Books</option>
                      <option value="practice_books">Practice & Olympiad Books</option>
                      <option value="sports">Sports Wear</option>
                      <option value="rain_winter">Winter & Rain Kits</option>
                      {dbCategories.map(c => (
                        <option key={c._id || c.name} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Sub-Category</label>
                    <input
                      type="text"
                      value={formData.subCategory}
                      onChange={e => setFormData({ ...formData, subCategory: e.target.value })}
                      placeholder="e.g. Shirts, Notebook Sets, Jackets"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none"
                    />
                  </div>
                </div>

                {/* Subtitle */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Product Subtitle / Short Summary</label>
                  <input
                    type="text"
                    value={formData.subtitle}
                    onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
                    placeholder="e.g. Premium 100% Cotton School Uniform Shirt for Daily Wear"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none"
                  />
                </div>

                {/* Price, MRP, Stock, GST Percentage, GST Included Toggle & Auto Discount */}
                <div className="grid grid-cols-1 sm:grid-cols-6 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Base Price (₹) *</label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={e => setFormData({ ...formData, price: e.target.value })}
                      placeholder="499"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Base MRP (₹)</label>
                    <input
                      type="number"
                      value={formData.originalPrice}
                      onChange={e => setFormData({ ...formData, originalPrice: e.target.value })}
                      placeholder="699"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Base Stock (Qty) *</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.stockQuantity}
                      onChange={e => setFormData({ ...formData, stockQuantity: e.target.value, stock: e.target.value })}
                      placeholder="50"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">GST Rate (%) *</label>
                    <select
                      value={formData.gst}
                      onChange={e => setFormData({ ...formData, gst: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none cursor-pointer"
                    >
                      <option value="0">0%</option>
                      <option value="5">5%</option>
                      <option value="12">12%</option>
                      <option value="18">18%</option>
                      <option value="28">28%</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">GST Included in Price?</label>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, isGstInclusive: !prev.isGstInclusive }))}
                      className={`w-full px-3 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs ${
                        formData.isGstInclusive
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                          : 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100'
                      }`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full ${formData.isGstInclusive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                      <span>{formData.isGstInclusive ? 'GST Included' : 'GST Extra (+ Tax)'}</span>
                    </button>
                  </div>
                  <div className="flex flex-col justify-center">
                    <label className="block text-xs font-bold text-gray-700 mb-1">Calculated Discount</label>
                    {(() => {
                      const p = Number(formData.price) || 0;
                      const m = Number(formData.originalPrice) || 0;
                      const disc = (m > 0 && p > 0 && m >= p) ? Math.round(((m - p) / m) * 100) : 0;
                      return (
                        <div className="px-3 py-2 bg-emerald-50 border border-emerald-200 text-emerald-800 font-extrabold text-xs rounded-xl flex items-center justify-between">
                          <span>Discount:</span>
                          <span className="bg-emerald-600 text-white px-2 py-0.5 rounded-md text-[11px] font-black">{disc}% OFF</span>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Brand & Material */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Brand Name</label>
                    <input
                      type="text"
                      value={formData.brand}
                      onChange={e => setFormData({ ...formData, brand: e.target.value })}
                      placeholder="e.g. SchoolKart, Sharma Uniforms, Camlin"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Material / Fabric</label>
                    <input
                      type="text"
                      value={formData.material}
                      onChange={e => setFormData({ ...formData, material: e.target.value })}
                      placeholder="e.g. 100% Premium Cotton, Oxford Weave"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none"
                    />
                  </div>
                </div>

                {/* School Name (Admin Dropdown), School Code, Grade / Class */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Target School Name *</label>
                    <select
                      value={formData.schoolName}
                      onChange={e => {
                        const selSch = schoolOptions.find(s => s.name === e.target.value);
                        setFormData({
                          ...formData,
                          schoolName: e.target.value,
                          schoolCode: selSch ? (selSch.code || selSch.shortName || '') : formData.schoolCode
                        });
                      }}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none cursor-pointer"
                    >
                      <option value="">-- All Schools / General --</option>
                      {schoolOptions.map(sch => (
                        <option key={sch._id || sch.name} value={sch.name}>{sch.name} ({sch.city || 'Partner School'})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">School Abbreviation Code</label>
                    <input
                      type="text"
                      value={formData.schoolCode}
                      onChange={e => setFormData({ ...formData, schoolCode: e.target.value })}
                      placeholder="e.g. DPS, KV, STX"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none uppercase font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Grade / Class *</label>
                    <select
                      value={formData.classGrade}
                      onChange={e => setFormData({ ...formData, classGrade: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none cursor-pointer"
                    >
                      <option value="">-- All Grades / General --</option>
                      <option value="Nursery">Nursery</option>
                      <option value="LKG">LKG</option>
                      <option value="UKG">UKG</option>
                      <option value="Class 1">Class 1</option>
                      <option value="Class 2">Class 2</option>
                      <option value="Class 3">Class 3</option>
                      <option value="Class 4">Class 4</option>
                      <option value="Class 5">Class 5</option>
                      <option value="Class 6">Class 6</option>
                      <option value="Class 7">Class 7</option>
                      <option value="Class 8">Class 8</option>
                      <option value="Class 9">Class 9</option>
                      <option value="Class 10">Class 10</option>
                      <option value="Class 11">Class 11</option>
                      <option value="Class 12">Class 12</option>
                      <option value="Class 1-5">Class 1 to 5</option>
                      <option value="Class 6-10">Class 6 to 10</option>
                      <option value="Class 11-12">Class 11 to 12</option>
                    </select>
                  </div>
                </div>

                {/* Age Group, Colors, Tags & Gender */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  {categorySchema.showGender && (
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Target Gender *</label>
                      <select
                        value={formData.gender || 'Unisex'}
                        onChange={e => setFormData({ ...formData, gender: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 text-gray-900 font-bold rounded-xl text-xs outline-none cursor-pointer"
                      >
                        <option value="Unisex">👫 Unisex (All Students)</option>
                        <option value="Boys">👦 Boys</option>
                        <option value="Girls">👧 Girls</option>
                        <option value="All">All Students</option>
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Age Group *</label>
                    <select
                      value={formData.ageGroup || formData.ages}
                      onChange={e => setFormData({ ...formData, ageGroup: e.target.value, ages: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none cursor-pointer"
                    >
                      <option value="">-- Select Age Group --</option>
                      <option value="3-5 Years">3-5 Years</option>
                      <option value="6-8 Years">6-8 Years</option>
                      <option value="9-12 Years">9-12 Years</option>
                      <option value="13-16 Years">13-16 Years</option>
                      <option value="16+ Years">16+ Years</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Available Colors</label>
                    <input
                      type="text"
                      value={formData.colors}
                      onChange={e => setFormData({ ...formData, colors: e.target.value })}
                      placeholder="e.g. White, Navy Blue, Red"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Product Tags</label>
                    <input
                      type="text"
                      value={formData.tags}
                      onChange={e => setFormData({ ...formData, tags: e.target.value })}
                      placeholder="e.g. Best Seller, Pure Cotton"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none"
                    />
                  </div>
                </div>

                {/* Base Image Dropzone */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Base Product Cover & Gallery Photos</label>
                  <ImageUploadDropzone
                    images={formData.images}
                    onChange={(imgs) => setFormData({ ...formData, images: imgs, image: imgs[0] || '' })}
                    maxImages={8}
                    helperText="Drag & drop primary product photos here"
                  />
                </div>

                {/* 1. Apparel Selling Unit Type: Ready-To-Wear (Pieces) vs Unstitched Cloth (Meters) (Only shown for Clothing/Fabric) */}
                {categorySchema.showMeterCalculation && (
                  <div className="p-4 rounded-xl bg-teal-50/50 border border-teal-200/80 space-y-3">
                    <label className="block text-xs font-bold text-teal-950 uppercase tracking-wider">
                      Apparel Selling Unit & Pricing Calculation
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div
                        onClick={() => setFormData({ ...formData, isMeterBased: false, unit: 'piece' })}
                        className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                          !formData.isMeterBased
                            ? 'border-brand-teal bg-white shadow-xs font-bold'
                            : 'border-gray-200 bg-white/60'
                        }`}
                      >
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-900">
                          <span>👔 Ready-To-Wear / Stitched Item</span>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-1">
                          Sold in <strong>Pieces (pcs)</strong> or standard sizes (S, M, L, XL, 32, 34). Base price is calculated per piece.
                        </p>
                      </div>

                      <div
                        onClick={() => setFormData({ ...formData, isMeterBased: true, unit: 'meter' })}
                        className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                          formData.isMeterBased
                            ? 'border-brand-teal bg-white shadow-xs font-bold'
                            : 'border-gray-200 bg-white/60'
                        }`}
                      >
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-900">
                          <span>✂️ Unstitched Fabric / Not Ready-To-Wear</span>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-1">
                          Customer orders cloth in <strong>Meters (e.g. 2.5m pant cloth)</strong>. Price calculated as <strong>{`{x} meters * 1-meter price`}</strong>.
                        </p>
                      </div>
                    </div>

                    {formData.isMeterBased && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-teal-100">
                        <div>
                          <label className="block text-[11px] font-bold text-gray-700 mb-1">Minimum Meter Quantity (e.g. 0.5m or 1m)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={formData.minMeter}
                            onChange={e => setFormData({ ...formData, minMeter: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium"
                            placeholder="0.5"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-gray-700 mb-1">Meter Increment Step (e.g. 0.5m)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={formData.meterStep}
                            onChange={e => setFormData({ ...formData, meterStep: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium"
                            placeholder="0.5"
                          />
                        </div>
                        <div className="sm:col-span-2 text-[11px] font-bold text-teal-900 bg-teal-100/80 p-2.5 rounded-lg border border-teal-200">
                          💡 Price Calculation Formula: Customer Price = {`{x} Meters`} × 1-Meter Base Price. (Example: 2.5m Pant Cloth × ₹200/meter = ₹500 Total Price).
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. Return & Exchange Policy Window */}
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-gray-900">
                      <input
                        type="checkbox"
                        checked={formData.isReturnable}
                        onChange={e => setFormData({ ...formData, isReturnable: e.target.checked })}
                        className="w-4 h-4 rounded text-brand-teal focus:ring-brand-teal cursor-pointer"
                      />
                      <span>Product is Returnable / Exchangeable</span>
                    </label>
                  </div>
                  {formData.isReturnable ? (
                    <div className="pt-2 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">Return / Exchange Window (Days) *</label>
                        <input
                          type="number"
                          value={formData.returnWindowDays}
                          onChange={e => setFormData({ ...formData, returnWindowDays: e.target.value })}
                          className="w-48 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold"
                          placeholder="7"
                        />
                      </div>
                      <span className="text-[11px] text-gray-500">
                        Specify return/exchange days for customer notice (e.g. 7-Day Easy Returns, 10-Day Exchange Policy).
                      </span>
                    </div>
                  ) : (
                    <p className="text-[11px] text-amber-800 font-semibold bg-amber-50 p-2 rounded-lg border border-amber-200">
                      ⚠️ This product will be explicitly marked as "Non-Returnable" on storefront.
                    </p>
                  )}
                </div>

                {/* 3. Apparel Size Chart Editor (Only shown for Clothing & Uniforms) */}
                {categorySchema.showSizeChart && (
                  <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-gray-900">
                        <input
                          type="checkbox"
                          checked={formData.enableSizeChart}
                          onChange={e => setFormData({ ...formData, enableSizeChart: e.target.checked })}
                          className="w-4 h-4 rounded text-brand-teal focus:ring-brand-teal cursor-pointer"
                        />
                        <span>Include Size Chart / Measurement Guide (Clothing & Uniforms)</span>
                      </label>
                    </div>

                    {formData.enableSizeChart && (
                    <div className="space-y-3 pt-3 border-t border-indigo-100">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-indigo-950">Size Chart Matrix (Inches)</span>
                        <button
                          type="button"
                          onClick={() => {
                            const rows = formData.sizeChart?.rows || [];
                            setFormData({
                              ...formData,
                              sizeChart: {
                                ...formData.sizeChart,
                                rows: [...rows, { size: '', chest: '', length: '', sleeve: '', waist: '', shoulder: '' }]
                              }
                            });
                          }}
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold cursor-pointer inline-flex items-center gap-1"
                        >
                          + Add Size Row
                        </button>
                      </div>

                      <div className="overflow-x-auto rounded-lg border border-indigo-200 bg-white">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-indigo-100/70 text-indigo-950 font-bold uppercase text-[10px]">
                            <tr>
                              <th className="p-2">Size</th>
                              <th className="p-2">Chest (in)</th>
                              <th className="p-2">Length (in)</th>
                              <th className="p-2">Sleeve (in)</th>
                              <th className="p-2">Waist (in)</th>
                              <th className="p-2">Shoulder (in)</th>
                              <th className="p-2 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-indigo-100">
                            {(formData.sizeChart?.rows || []).map((row, idx) => (
                              <tr key={idx}>
                                <td className="p-1.5">
                                  <input
                                    type="text"
                                    value={row.size}
                                    onChange={e => {
                                      const rows = [...(formData.sizeChart?.rows || [])];
                                      rows[idx].size = e.target.value;
                                      setFormData({ ...formData, sizeChart: { ...formData.sizeChart, rows } });
                                    }}
                                    placeholder="e.g. S"
                                    className="w-16 px-2 py-1 border border-gray-200 rounded font-bold text-xs"
                                  />
                                </td>
                                <td className="p-1.5">
                                  <input
                                    type="text"
                                    value={row.chest}
                                    onChange={e => {
                                      const rows = [...(formData.sizeChart?.rows || [])];
                                      rows[idx].chest = e.target.value;
                                      setFormData({ ...formData, sizeChart: { ...formData.sizeChart, rows } });
                                    }}
                                    placeholder='36"'
                                    className="w-16 px-2 py-1 border border-gray-200 rounded text-xs"
                                  />
                                </td>
                                <td className="p-1.5">
                                  <input
                                    type="text"
                                    value={row.length}
                                    onChange={e => {
                                      const rows = [...(formData.sizeChart?.rows || [])];
                                      rows[idx].length = e.target.value;
                                      setFormData({ ...formData, sizeChart: { ...formData.sizeChart, rows } });
                                    }}
                                    placeholder='26"'
                                    className="w-16 px-2 py-1 border border-gray-200 rounded text-xs"
                                  />
                                </td>
                                <td className="p-1.5">
                                  <input
                                    type="text"
                                    value={row.sleeve}
                                    onChange={e => {
                                      const rows = [...(formData.sizeChart?.rows || [])];
                                      rows[idx].sleeve = e.target.value;
                                      setFormData({ ...formData, sizeChart: { ...formData.sizeChart, rows } });
                                    }}
                                    placeholder='8"'
                                    className="w-16 px-2 py-1 border border-gray-200 rounded text-xs"
                                  />
                                </td>
                                <td className="p-1.5">
                                  <input
                                    type="text"
                                    value={row.waist}
                                    onChange={e => {
                                      const rows = [...(formData.sizeChart?.rows || [])];
                                      rows[idx].waist = e.target.value;
                                      setFormData({ ...formData, sizeChart: { ...formData.sizeChart, rows } });
                                    }}
                                    placeholder='30"'
                                    className="w-16 px-2 py-1 border border-gray-200 rounded text-xs"
                                  />
                                </td>
                                <td className="p-1.5">
                                  <input
                                    type="text"
                                    value={row.shoulder}
                                    onChange={e => {
                                      const rows = [...(formData.sizeChart?.rows || [])];
                                      rows[idx].shoulder = e.target.value;
                                      setFormData({ ...formData, sizeChart: { ...formData.sizeChart, rows } });
                                    }}
                                    placeholder='16"'
                                    className="w-16 px-2 py-1 border border-gray-200 rounded text-xs"
                                  />
                                </td>
                                <td className="p-1.5 text-right">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const rows = (formData.sizeChart?.rows || []).filter((_, i) => i !== idx);
                                      setFormData({ ...formData, sizeChart: { ...formData.sizeChart, rows } });
                                    }}
                                    className="text-red-600 hover:text-red-800 text-xs font-bold p-1 cursor-pointer"
                                  >
                                    ✕
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: VARIANTS WITH "+ ADD VARIANT" MODAL */}
          {activeTab === 'variants' && (
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                    <Layers className="text-brand-teal" size={18} /> Size & Measuring Scale Variants
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Configure custom price, MRP, stock, and individual photos for every variant (Size, Count, Meter, Kg, Box).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openAddVariantModal}
                  className="px-4 py-2 bg-brand-teal hover:bg-brand-teal-light text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Plus size={16} /> + Add Variant
                </button>
              </div>

              {/* 1-Click Presets */}
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200/80 space-y-2">
                <span className="text-xs font-extrabold uppercase text-gray-700">1-Click Presets</span>
                <div className="flex flex-wrap gap-2">
                  {SIZE_PRESETS.filter(p => categorySchema.allowedPresets.includes(p.id)).map(preset => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => applySizePreset(preset)}
                      className="px-3 py-1.5 bg-white hover:bg-brand-teal hover:text-white text-gray-700 text-xs font-bold rounded-lg border border-gray-200 transition-colors cursor-pointer"
                    >
                      + {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Variants Table */}
              {sizeVariants.length === 0 ? (
                <div className="p-8 text-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 space-y-2">
                  <Boxes className="mx-auto text-gray-400" size={32} />
                  <h4 className="text-sm font-bold text-gray-700">No Variants Configured</h4>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto">
                    Click the <strong>"+ Add Variant"</strong> button above to open the variant form and add custom size, count, or weight options.
                  </p>
                  <button
                    type="button"
                    onClick={openAddVariantModal}
                    className="px-4 py-2 bg-brand-teal text-white rounded-xl text-xs font-bold cursor-pointer inline-flex items-center gap-1"
                  >
                    <Plus size={14} /> Add Variant
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Variant Preview Image Layout in Row */}
                  <div className="flex items-center gap-3 overflow-x-auto pb-2 pt-1 scrollbar-thin">
                    {sizeVariants.map((v, vIdx) => {
                      const vImgUrl = v.image ? resolveImageUrl(v.image) : '';
                      const vVal = v.size || v.measureValue || `Variant #${vIdx + 1}`;

                      return (
                        <div
                          key={vIdx}
                          onClick={() => openEditVariantModal(vIdx)}
                          className="flex items-center gap-2.5 p-2 rounded-xl bg-teal-50/70 hover:bg-teal-100/80 border border-teal-200/80 shrink-0 min-w-[175px] cursor-pointer transition-all shadow-2xs"
                          title="Click to edit this variant"
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
                              {v.mrp && Number(v.mrp) > Number(v.price) && (
                                <span className="text-[9px] text-gray-400 line-through">₹{v.mrp}</span>
                              )}
                            </div>
                            <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                              {v.stock || 0} pcs in stock
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="px-3 py-3">Variant Value</th>
                        <th className="px-3 py-3">Scale</th>
                        <th className="px-3 py-3">Price (₹)</th>
                        <th className="px-3 py-3">MRP (₹)</th>
                        <th className="px-3 py-3">Stock</th>
                        <th className="px-3 py-3">Variant Image</th>
                        <th className="px-3 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white font-medium">
                      {sizeVariants.map((v, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-3 py-2.5 font-bold text-gray-900">{v.size || v.measureValue}</td>
                          <td className="px-3 py-2.5">
                            <span className="px-2 py-0.5 rounded bg-teal-50 text-brand-teal text-[10px] uppercase font-bold border border-teal-200">
                              {v.measureScale || 'size'}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 font-extrabold text-gray-900">₹{v.price}</td>
                          <td className="px-3 py-2.5 text-gray-500 line-through">₹{v.mrp}</td>
                          <td className="px-3 py-2.5">
                            <input
                              type="number"
                              min="0"
                              value={v.stock !== undefined ? v.stock : (v.stockQuantity !== undefined ? v.stockQuantity : '')}
                              onChange={(e) => {
                                const newStock = e.target.value;
                                setSizeVariants(prev => prev.map((item, i) => i === idx ? { ...item, stock: newStock, stockQuantity: newStock } : item));
                              }}
                              className="w-20 px-2 py-1 bg-teal-50 border border-teal-300 rounded-lg text-xs font-bold text-teal-900 text-center outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                              title="Edit variant stock quantity"
                            />
                          </td>
                          <td className="px-3 py-2.5">
                            {v.image ? (
                              <img src={resolveImageUrl(v.image)} alt={v.size} className="w-9 h-9 rounded object-cover border border-gray-200" />
                            ) : (
                              <span className="text-[10px] text-gray-400 italic">No image</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-right space-x-2">
                            <button
                              type="button"
                              onClick={() => openEditVariantModal(idx)}
                              className="text-xs font-bold text-brand-teal hover:underline cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveVariant(idx)}
                              className="text-xs font-bold text-red-600 hover:underline cursor-pointer"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            </div>
          )}
        </div>
      )}

      {/* KIT / BUNDLE ENTRY FORM */}
      {entryType === 'kit' && activeTab === 'kit' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <h3 className="text-base font-extrabold text-gray-900 border-b border-gray-100 pb-3">
              Kit Creation Mode
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                onClick={() => setKitMode('existing')}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                  kitMode === 'existing' ? 'border-brand-teal bg-brand-teal/5 font-bold' : 'border-gray-200 bg-white'
                }`}
              >
                <h4 className="text-xs font-bold text-gray-900">Option A: Bundle Existing Catalog Products</h4>
                <p className="text-[11px] text-gray-500 mt-1">Pick products from catalog & set bundle discount.</p>
              </div>

              <div
                onClick={() => setKitMode('scratch')}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                  kitMode === 'scratch' ? 'border-brand-teal bg-brand-teal/5 font-bold' : 'border-gray-200 bg-white'
                }`}
              >
                <h4 className="text-xs font-bold text-gray-900">Option B: Create Kit from Scratch</h4>
                <p className="text-[11px] text-gray-500 mt-1">Manually type kit line items without product variants.</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <h3 className="text-base font-extrabold text-gray-900 border-b border-gray-100 pb-3">
              Kit Details & Bundle Pricing
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Kit Title *</label>
                <input
                  type="text"
                  required
                  value={kitData.title}
                  onChange={e => setKitData({ ...kitData, title: e.target.value })}
                  placeholder="e.g. DPS Complete Uniform Kit"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">School Name *</label>
                <input
                  type="text"
                  required
                  value={kitData.schoolName}
                  onChange={e => setKitData({ ...kitData, schoolName: e.target.value })}
                  placeholder="e.g. Delhi Public School"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Bundle Price (₹) *</label>
                <input
                  type="number"
                  required
                  value={kitData.bundlePrice}
                  onChange={e => setKitData({ ...kitData, bundlePrice: e.target.value })}
                  placeholder="1299"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-emerald-800 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Stock Quantity</label>
                <input
                  type="number"
                  value={kitData.stock}
                  onChange={e => setKitData({ ...kitData, stock: e.target.value })}
                  placeholder="20"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none"
                />
              </div>
            </div>

            {/* Catalog Picker Search */}
            {kitMode === 'existing' && (
              <div className="pt-3 border-t border-gray-100 space-y-3">
                <label className="block text-xs font-bold text-gray-700">Search Products to Add to Kit</label>
                <input
                  type="text"
                  value={catalogSearch}
                  onChange={e => setCatalogSearch(e.target.value)}
                  placeholder="Filter existing products..."
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none"
                />
                <div className="max-h-40 overflow-y-auto divide-y divide-gray-100 border border-gray-200 rounded-xl bg-white">
                  {existingProducts
                    .filter(p => p.name?.toLowerCase().includes(catalogSearch.toLowerCase()))
                    .slice(0, 8)
                    .map((p, idx) => (
                      <div key={idx} className="p-2 flex items-center justify-between text-xs">
                        <span>{p.name} (₹{p.price})</span>
                        <button
                          type="button"
                          onClick={() => handleAddProductToKit(p)}
                          className="px-2.5 py-1 bg-brand-teal text-white rounded font-bold text-[10px]"
                        >
                          + Add
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: ALLOWED PAYMENT METHODS */}
      {activeTab === 'payment' && (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-5">
          <div className="border-b border-gray-100 pb-3">
            <h3 className="text-base font-extrabold text-gray-900">
              Allowed Checkout Payment Methods
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Select allowed payment methods. Disallowed methods will be disabled on the frontend during checkout.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div
              onClick={() => {
                if (entryType === 'single') setFormData({ ...formData, paymentMethodAllowed: 'Both' });
                else setKitData({ ...kitData, paymentMethodAllowed: 'Both' });
              }}
              className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                (entryType === 'single' ? formData.paymentMethodAllowed : kitData.paymentMethodAllowed) === 'Both'
                  ? 'border-brand-teal bg-brand-teal/5 font-bold'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <h4 className="text-xs font-bold text-gray-900">💳 Both Methods</h4>
              <p className="text-[11px] text-gray-500 mt-1">Allows Online Payment & Cash on Delivery (COD).</p>
            </div>

            <div
              onClick={() => {
                if (entryType === 'single') setFormData({ ...formData, paymentMethodAllowed: 'Online_Only' });
                else setKitData({ ...kitData, paymentMethodAllowed: 'Online_Only' });
              }}
              className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                (entryType === 'single' ? formData.paymentMethodAllowed : kitData.paymentMethodAllowed) === 'Online_Only'
                  ? 'border-amber-500 bg-amber-50/50 font-bold'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <h4 className="text-xs font-bold text-amber-800">⚡ Online / Prepaid Only</h4>
              <p className="text-[11px] text-amber-700 mt-1"><strong>Disables COD</strong> on frontend checkout.</p>
            </div>

            <div
              onClick={() => {
                if (entryType === 'single') setFormData({ ...formData, paymentMethodAllowed: 'COD_Only' });
                else setKitData({ ...kitData, paymentMethodAllowed: 'COD_Only' });
              }}
              className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                (entryType === 'single' ? formData.paymentMethodAllowed : kitData.paymentMethodAllowed) === 'COD_Only'
                  ? 'border-blue-500 bg-blue-50/50 font-bold'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <h4 className="text-xs font-bold text-blue-800">💵 Cash on Delivery Only</h4>
              <p className="text-[11px] text-blue-700 mt-1"><strong>Disables Online</strong> payment on frontend checkout.</p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: + Add / Edit Variant Dialog */}
      {isVariantModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="font-display font-bold text-base text-gray-900">
                {editingVariantIndex !== null ? 'Edit Variant' : 'Add New Variant'}
              </h3>
              <button
                type="button"
                onClick={() => setIsVariantModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveVariantModal} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Measuring Scale Category *</label>
                <select
                  value={variantForm.measureScale}
                  onChange={e => {
                    const sc = MEASURE_SCALES.find(s => s.id === e.target.value);
                    setVariantForm({ ...variantForm, measureScale: e.target.value, unit: sc?.defaultUnit || 'Size' });
                  }}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs font-medium outline-none"
                >
                  {MEASURE_SCALES.filter(sc => categorySchema.allowedScales.includes(sc.id)).map(sc => (
                    <option key={sc.id} value={sc.id}>{sc.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Base Variant Value *</label>
                <input
                  type="text"
                  required
                  value={variantForm.measureValue}
                  onChange={e => setVariantForm({ ...variantForm, measureValue: e.target.value, size: e.target.value })}
                  placeholder={MEASURE_SCALES.find(s => s.id === variantForm.measureScale)?.placeholder || 'e.g. 250g, 3pcs, 3metre, 2.5m'}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs font-medium outline-none"
                />
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[10px] text-gray-500 font-bold mr-1">Quick Base Values:</span>
                  {['250g', '500g', '1kg', '1pc', '3pcs', '6pcs', '1.8m', '2.5m', '3metre'].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setVariantForm({ ...variantForm, measureValue: val, size: val })}
                      className="px-2 py-0.5 rounded-md bg-gray-100 hover:bg-brand-teal hover:text-white text-gray-700 text-[10px] font-bold transition-colors cursor-pointer border border-gray-200"
                    >
                      + {val}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={variantForm.price}
                    onChange={e => setVariantForm({ ...variantForm, price: e.target.value })}
                    placeholder="499"
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">MRP (₹)</label>
                  <input
                    type="number"
                    min="1"
                    value={variantForm.mrp}
                    onChange={e => setVariantForm({ ...variantForm, mrp: e.target.value })}
                    placeholder="699"
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Stock (Units) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={variantForm.stock}
                    onChange={e => setVariantForm({ ...variantForm, stock: e.target.value, stockQuantity: e.target.value })}
                    placeholder="25"
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Variant SKU</label>
                  <input
                    type="text"
                    value={variantForm.sku}
                    onChange={e => setVariantForm({ ...variantForm, sku: e.target.value })}
                    placeholder="SKU-VAR"
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs font-mono font-medium outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Variant Specific Photo</label>
                <ImageUploadDropzone
                  images={variantForm.images}
                  onChange={(imgs) => setVariantForm({ ...variantForm, images: imgs, image: imgs[0] || '' })}
                  maxImages={4}
                  helperText="Upload photo for this variant"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsVariantModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-teal text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Save Variant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
