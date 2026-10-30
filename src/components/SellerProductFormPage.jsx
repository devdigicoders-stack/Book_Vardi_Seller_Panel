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
import ImageUploadDropzone, { compressImageFile } from './ImageUploadDropzone';
import { resolveImageUrl, parseSizeVariants, dedupeImages } from '../utils/mediaUrl';
import { fetchSchoolsApi, fetchCategoriesApi } from '../utils/api';
import { CATEGORY_STRUCTURE, normalizeCategory, getSubCategories } from '../constants/categories';
import { getProductStockUnit } from '../utils/stockUnitHelper';

// Universal Category Form Configuration Schema Matrix
export function getCategorySchema(categoryKey) {
  return {
    showMeterCalculation: true,
    showSizeChart: true,
    showGender: true
  };
}

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

export const GRADE_OPTIONS = [
  'Pre-Nursery', 'Nursery', 'LKG', 'UKG',
  'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
  'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
  'Class 11', 'Class 12',
  'Class 1-5', 'Class 6-10', 'Class 11-12', 'All Grades'
];

export const AGE_OPTIONS = [
  '0-2 Years',
  '3-5 Years',
  '6-8 Years',
  '9-12 Years',
  '13-16 Years',
  '16+ Years',
  'All Ages'
];

export const APPAREL_SIZES_ALPHA = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'];
export const APPAREL_SIZES_KIDS = ['18', '20', '22', '24'];
export const APPAREL_SIZES_REGULAR = ['26', '28', '30', '32', '34', '36', '38'];
export const APPAREL_SIZES_PLUS = ['40', '42', '44', '46', '48'];
export const APPAREL_SIZES = [
  ...APPAREL_SIZES_KIDS,
  ...APPAREL_SIZES_REGULAR,
  ...APPAREL_SIZES_PLUS,
  ...APPAREL_SIZES_ALPHA
];
export const KIDS_SHOE_SIZES = [
  '6 Kids', '7 Kids', '8 Kids', '9 Kids', '10 Kids',
  '11 Kids', '12 Kids', '13 Kids'
];

export const SENIOR_SHOE_SIZES = [
  'Size 1', 'Size 2', 'Size 3', 'Size 4', 'Size 5',
  'Size 6', 'Size 7', 'Size 8', 'Size 9', 'Size 10'
];

export const SHOE_SIZES = [...KIDS_SHOE_SIZES, ...SENIOR_SHOE_SIZES];

export function getCategoryUnitType(categoryKey) {
  const cat = (categoryKey || '').toLowerCase();
  if (cat.includes('footwear') || cat.includes('shoe') || cat.includes('sock')) return 'footwear';
  // All clothing (pent, pant, shirt, uniform, blazer, fabrics) and custom categories default to apparel & size variants
  return 'apparel';
}

export function parseBool(val, defaultVal = true) {
  if (val === undefined || val === null) return defaultVal;
  if (typeof val === 'boolean') return val;
  if (typeof val === 'string') {
    const s = val.trim().toLowerCase();
    if (s === 'false' || s === '0') return false;
    if (s === 'true' || s === '1') return true;
  }
  if (typeof val === 'number') return val !== 0;
  return Boolean(val);
}

export default function SellerProductFormPage({ product, existingProducts = [], onSwitchToKit, onSave, onBack }) {
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
    category: isEdit && product?.category ? normalizeCategory(product.category) : '',
    subCategory: isEdit && product?.subCategory ? product.subCategory : '',
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
    isExchangeable: true,
    isRefundable: true,
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

  // Dynamic Category Form Schema & Unit Type (Apparel, Footwear, Books, General)
  const [selectedUnitType, setSelectedUnitType] = useState(null);
  const categorySchema = getCategorySchema(formData.category);
  const categoryUnitType = selectedUnitType || getCategoryUnitType(formData.category);

  const toggleCategorySizeVariant = (sz, scaleName = 'size') => {
    const target = String(sz).toLowerCase().trim();
    const targetNoPrefix = target.replace(/^size\s+/i, '');
    const existingIndex = sizeVariants.findIndex(v => {
      const s = String(v.size || v.measureValue || '').toLowerCase().trim();
      const sNoPrefix = s.replace(/^size\s+/i, '');
      return s === target || s === targetNoPrefix || sNoPrefix === targetNoPrefix;
    });
    const defaultPrice = formData.price || '499';
    const defaultMrp = formData.originalPrice || Math.round(Number(defaultPrice || 499) * 1.25).toString();
    const defaultStock = formData.stockQuantity || '25';
    const defaultImage = formData.images[0] || formData.image || '';

    if (existingIndex > -1) {
      setSizeVariants(prev => prev.filter((_, i) => i !== existingIndex));
    } else {
      const newV = {
        size: sz,
        measureScale: scaleName,
        measureValue: sz,
        unit: scaleName.toUpperCase(),
        price: defaultPrice,
        mrp: defaultMrp,
        stock: defaultStock,
        stockQuantity: defaultStock,
        image: defaultImage,
        images: defaultImage ? [defaultImage] : [],
        sku: formData.sku ? `${formData.sku}-${sz}` : `SKU-${sz}`
      };
      setSizeVariants(prev => [...prev, newV]);
    }
  };

  // Multi-Select Grade State
  const [selectedGrades, setSelectedGrades] = useState([]);

  // Multi-Select Age State
  const [selectedAges, setSelectedAges] = useState([]);

  // Variants & Measuring Scales
  const [sizeVariants, setSizeVariants] = useState([]);

  // Custom Apparel Sizes (Dynamic custom size pills)
  const [customApparelSizes, setCustomApparelSizes] = useState([]);
  const [newSizePillInput, setNewSizePillInput] = useState('');

  // Quick Custom Size & Unit Add State (Issue 9 & 10)
  const [customSizeInput, setCustomSizeInput] = useState('');
  const [customSizeUnit, setCustomSizeUnit] = useState('Pcs');
  const [customSizePrice, setCustomSizePrice] = useState('');
  const [customSizeStock, setCustomSizeStock] = useState('25');
  const [customSizeImage, setCustomSizeImage] = useState('');

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

  // Compute dynamic categories with fallback to static schema
  const displayCategories = (dbCategories && dbCategories.length > 0)
    ? dbCategories.map(c => ({
      id: c.name,
      name: c.name,
      gstPercentage: c.gstPercentage,
      subCategories: Array.isArray(c.subCategories)
        ? c.subCategories.map(s => typeof s === 'string' ? s : (s.name || '')).filter(Boolean)
        : []
    }))
    : CATEGORY_STRUCTURE;

  const getDynamicSubCategories = (catName) => {
    if (!catName || !catName.trim()) return [];
    const found = displayCategories.find(c => c.name.toLowerCase() === catName.toLowerCase());
    if (found && Array.isArray(found.subCategories) && found.subCategories.length > 0) {
      return found.subCategories;
    }
    return getSubCategories(catName);
  };

  // Initialize form
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (product) {
      const rawProdImages = Array.isArray(product.images) && product.images.length > 0
        ? product.images
        : (product.image ? [product.image] : []);
      const prodImages = dedupeImages(rawProdImages);

      const gradeStr = product.classGrade || product.className || '';
      const initialGrades = typeof gradeStr === 'string'
        ? gradeStr.split(',').map(s => s.trim()).filter(Boolean)
        : (Array.isArray(gradeStr) ? gradeStr : []);
      setSelectedGrades(initialGrades);

      const ageStr = product.ageGroup || product.ages || '';
      const initialAges = Array.isArray(product.ages) && product.ages.length > 0
        ? product.ages
        : (typeof ageStr === 'string'
          ? ageStr.split(',').map(s => s.trim()).filter(Boolean)
          : []);
      setSelectedAges(initialAges);

      const parsedGst = product.gst !== undefined && product.gst !== null
        ? String(product.gst)
        : (product.gstPercentage !== undefined && product.gstPercentage !== null
          ? String(product.gstPercentage)
          : (product.gstPercent !== undefined && product.gstPercent !== null
            ? String(product.gstPercent)
            : (product.gstRate !== undefined && product.gstRate !== null
              ? String(product.gstRate)
              : '5')));

      setFormData({
        name: product.name || product.title || '',
        subtitle: product.subtitle || '',
        price: product.price !== undefined ? String(product.price) : '',
        originalPrice: product.originalPrice || product.mrp ? String(product.originalPrice || product.mrp) : '',
        category: normalizeCategory(product.category),
        subCategory: product.subCategory || (getSubCategories(product.category)[0] || 'Ready to wear'),
        schoolName: product.schoolName || product.school || '',
        schoolCode: product.schoolCode || '',
        classGrade: product.classGrade || product.className || '',
        gender: product.gender || 'Unisex',
        ageGroup: product.ageGroup || '',
        ages: Array.isArray(product.ages) ? product.ages.join(', ') : (product.ages || ''),
        colors: Array.isArray(product.colors) ? product.colors.join(', ') : (product.colors || ''),
        material: product.material || '',
        brand: product.brand || '',
        gst: parsedGst,
        isGstInclusive: parseBool(product.isGstInclusive, true),
        tags: Array.isArray(product.tags) ? product.tags.join(', ') : (product.tags || ''),
        status: product.approvalStatus || product.status || 'Pending',
        discountBadge: product.discountBadge || product.badge || 'NEW',
        stockQuantity: product.stockQuantity !== undefined ? String(product.stockQuantity) : (product.stock !== undefined ? String(product.stock) : '50'),
        paymentMethodAllowed: product.paymentMethodAllowed || 'Both',
        description: product.description || '',
        sku: product.sku || '',
        image: prodImages[0] || product.image || '',
        images: prodImages,
        isMeterBased: parseBool(product.isMeterBased, false),
        minMeter: product.minMeter !== undefined ? String(product.minMeter) : '0.5',
        meterStep: product.meterStep !== undefined ? String(product.meterStep) : '0.5',
        isReturnable: parseBool(product.isReturnable, true),
        isExchangeable: parseBool(product.isExchangeable ?? product.isRefundable ?? product.isReturnable, true),
        isRefundable: parseBool(product.isRefundable ?? product.isExchangeable ?? product.isReturnable, true),
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

      // Load sizeVariants safely via parseSizeVariants (filtering out any legacy/artificial base product)
      const parsedVariants = parseSizeVariants(product).filter(v =>
        !v.isBase &&
        String(v.size || '').trim().toLowerCase() !== 'base product' &&
        String(v.measureValue || '').trim().toLowerCase() !== 'base product'
      );
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

      // Automatically populate customApparelSizes for any non-standard sizes (excluding artificial 'base product')
      const allLoadedSizeNames = (parsedVariants.length > 0
        ? parsedVariants.map(v => v.size || v.measureValue)
        : (Array.isArray(product.sizes) ? product.sizes : [])
      ).filter(s => s && String(s).trim().toLowerCase() !== 'base product');

      const nonStandardSizes = allLoadedSizeNames.filter(s =>
        !APPAREL_SIZES.some(std => std.toLowerCase() === String(s).toLowerCase().trim())
      );
      if (nonStandardSizes.length > 0) {
        setCustomApparelSizes(prev => Array.from(new Set([...prev, ...nonStandardSizes])));
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
        category: '',
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
        isExchangeable: true,
        isRefundable: true,
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
      setSelectedGrades([]);
      setSelectedAges([]);
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

  const handleUnifiedAddCustomSize = () => {
    const val = (customSizeInput || '').trim();
    if (!val) {
      setError('Please enter a size or measurement name (e.g. Size 34, 16, 42, 2.5m, Free Size).');
      return;
    }
    const price = customSizePrice ? Number(customSizePrice) : Number(formData.price || 499);
    const mrp = Math.round(price * 1.25).toString();
    const stock = customSizeStock ? customSizeStock : (formData.stockQuantity || '25');
    const defaultImage = customSizeImage || formData.images[0] || formData.image || '';

    const newVariant = {
      size: val,
      measureScale: customSizeUnit === 'Mtr' ? 'meter' : 'size',
      measureValue: val,
      unit: customSizeUnit,
      price: String(price),
      mrp: String(mrp),
      stock: String(stock),
      stockQuantity: String(stock),
      sku: formData.sku ? `${formData.sku}-${val.replace(/\s+/g, '')}` : `SKU-${val.replace(/\s+/g, '')}`,
      image: defaultImage,
      images: defaultImage ? [defaultImage] : []
    };

    if (!customApparelSizes.some(s => s.toLowerCase() === val.toLowerCase()) &&
      !APPAREL_SIZES.some(s => s.toLowerCase() === val.toLowerCase())) {
      setCustomApparelSizes(prev => [...prev, val]);
    }

    setSizeVariants(prev => {
      const existingIdx = prev.findIndex(v => (v.size || v.measureValue || '').toLowerCase() === val.toLowerCase());
      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx] = newVariant;
        return copy;
      }
      return [...prev, newVariant];
    });

    setCustomSizeInput('');
    setCustomSizeImage('');
    setError('');
  };

  const handleVariantImageFile = async (index, file) => {
    if (!file) return;
    try {
      const dataUrl = await compressImageFile(file, 800, 0.8);
      if (!dataUrl) return;
      setSizeVariants(prev => prev.map((item, i) => {
        if (i === index) {
          return {
            ...item,
            image: dataUrl,
            images: [dataUrl]
          };
        }
        return item;
      }));
    } catch (e) {
      console.warn('Variant image compression error:', e);
    }
  };

  const handleResetVariantImage = (index) => {
    const baseImg = formData.images[0] || formData.image || '';
    setSizeVariants(prev => prev.map((item, i) => {
      if (i === index) {
        return {
          ...item,
          image: baseImg,
          images: baseImg ? [baseImg] : []
        };
      }
      return item;
    }));
  };

  const handleRemoveVariant = (index) => {
    setSizeVariants(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveCustomSizePill = (sizeToRemove) => {
    setCustomApparelSizes(prev => prev.filter(s => s.toLowerCase() !== sizeToRemove.toLowerCase()));
    setSizeVariants(prev => prev.filter(v => String(v.size || v.measureValue || '').toLowerCase() !== sizeToRemove.toLowerCase()));
  };

  const handleAddCustomSizeRow = () => {
    const defaultPrice = formData.price || '499';
    const defaultMrp = formData.originalPrice || Math.round(Number(defaultPrice || 499) * 1.25).toString();
    const defaultStock = formData.stockQuantity || '25';
    const defaultImage = formData.images[0] || formData.image || '';

    const newV = {
      size: '',
      measureScale: customSizeUnit === 'Mtr' ? 'meter' : 'size',
      measureValue: '',
      unit: customSizeUnit || (formData.isMeterBased ? 'Mtr' : 'Pcs'),
      price: defaultPrice,
      mrp: defaultMrp,
      stock: defaultStock,
      stockQuantity: defaultStock,
      image: defaultImage,
      images: defaultImage ? [defaultImage] : [],
      sku: formData.sku ? `${formData.sku}-CUSTOM` : 'SKU-CUSTOM'
    };
    setSizeVariants(prev => [...prev, newV]);
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

      if (!formData.category || !formData.category.trim()) {
        setError('Please select a product Category.');
        setActiveTab('general');
        return;
      }

      if (!formData.subCategory || !formData.subCategory.trim()) {
        setError('Please select a product Sub-Category.');
        setActiveTab('general');
        return;
      }

      if (sizeVariants.length > 0) {
        for (const variant of sizeVariants) {
          if (!variant.price || Number(variant.price) <= 0) {
            setError(`Please specify a valid selling price for variant "${variant.size || variant.measureValue}".`);
            setActiveTab('general');
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
        const cleanVariants = sizeVariants.filter(v =>
          !v.isBase &&
          String(v.size || '').trim().toLowerCase() !== 'base product' &&
          String(v.measureValue || '').trim().toLowerCase() !== 'base product'
        );
        const validPrices = cleanVariants.map(v => Number(v.price)).filter(p => !isNaN(p) && p > 0);
        const minVariantPrice = validPrices.length > 0 ? Math.min(...validPrices) : Number(formData.price);
        const totalVariantStock = cleanVariants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);

        const gstNum = Number(formData.gst);
        const finalGst = !isNaN(gstNum) ? gstNum : 5;

        const primaryImage = formData.images[0] || formData.image || '';
        const rawImages = (formData.images && formData.images.length > 0) ? formData.images : (primaryImage ? [primaryImage] : []);
        const finalImages = dedupeImages(rawImages);

        const formattedClassGrade = selectedGrades.length > 0 ? selectedGrades.join(', ') : (formData.classGrade || '');
        const formattedAgeGroup = selectedAges.length > 0 ? selectedAges.join(', ') : (formData.ageGroup || formData.ages || '');

        const paymentAllowedStr = formData.paymentMethodAllowed || 'Both';
        const paymentAllowedArr = paymentAllowedStr === 'Online_Only'
          ? ['Online']
          : (paymentAllowedStr === 'COD_Only' ? ['COD'] : ['COD', 'Online']);

        const parsedAges = selectedAges.length > 0
          ? selectedAges
          : (typeof formData.ages === 'string'
            ? formData.ages.split(',').map(s => s.trim()).filter(Boolean)
            : (Array.isArray(formData.ages) ? formData.ages : []));

        const parsedColors = typeof formData.colors === 'string'
          ? formData.colors.split(',').map(s => s.trim()).filter(Boolean)
          : (Array.isArray(formData.colors) ? formData.colors : []);

        const parsedTags = typeof formData.tags === 'string'
          ? formData.tags.split(',').map(s => s.trim()).filter(Boolean)
          : (Array.isArray(formData.tags) ? formData.tags : []);

        const payload = {
          ...formData,
          sku: formData.sku?.trim() ? formData.sku.trim().toUpperCase() : `SC-${Math.floor(1000 + Math.random() * 9000)}`,
          bundleType: 'single',
          schoolName: formData.schoolName || '',
          schoolCode: formData.schoolCode || '',
          classGrade: formattedClassGrade,
          ageGroup: formattedAgeGroup,
          ages: parsedAges,
          colors: parsedColors,
          material: formData.material || '',
          brand: formData.brand || '',
          gst: finalGst,
          gstPercentage: finalGst,
          isGstInclusive: parseBool(formData.isGstInclusive, true),
          tags: parsedTags,
          status: (cleanVariants.length > 0 ? totalVariantStock : Number(formData.stockQuantity || 0)) > 0 ? 'available' : 'out-of-stock',
          approvalStatus: 'Pending',
          price: cleanVariants.length > 0 ? minVariantPrice : Number(formData.price),
          originalPrice: Number(formData.originalPrice) || Math.round(minVariantPrice * 1.25),
          mrp: Number(formData.originalPrice) || Math.round(minVariantPrice * 1.25),
          stockQuantity: cleanVariants.length > 0 ? totalVariantStock : Number(formData.stockQuantity || 0),
          stock: cleanVariants.length > 0 ? totalVariantStock : Number(formData.stockQuantity || 0),
          image: finalImages[0] || primaryImage || '',
          images: finalImages,
          paymentMethodAllowed: paymentAllowedStr,
          paymentMethodsAllowed: paymentAllowedArr,
          isMeterBased: parseBool(formData.isMeterBased, false),
          minMeter: Number(formData.minMeter) || 0.5,
          meterStep: Number(formData.meterStep) || 0.5,
          unit: formData.isMeterBased ? 'meter' : (formData.unit || 'piece'),
          isReturnable: parseBool(formData.isReturnable, true),
          isExchangeable: parseBool(formData.isExchangeable ?? formData.isReturnable, true),
          isRefundable: parseBool(formData.isRefundable ?? formData.isExchangeable ?? formData.isReturnable, true),
          returnWindowDays: Number(formData.returnWindowDays) || 7,
          sizeChart: formData.enableSizeChart ? formData.sizeChart : { rows: [] },
          sizes: cleanVariants.map(v => v.size || v.measureValue),
          sizeVariants: cleanVariants.map(v => {
            const isPlaceholder = (img) => !img || (typeof img === 'string' && (img.includes('unsplash.com') || img.includes('placeholder') || img.includes('via.placeholder')));
            const hasCustomImg = v.image && !isPlaceholder(v.image) && v.image !== primaryImage;
            const effectiveImg = hasCustomImg ? v.image : (v.image && !isPlaceholder(v.image) ? v.image : primaryImage);
            const finalVImgs = hasCustomImg
              ? [v.image]
              : (Array.isArray(v.images) && v.images.length > 0 && !v.images.every(isPlaceholder)
                ? Array.from(new Set(v.images.filter(img => !isPlaceholder(img))))
                : (effectiveImg ? [effectiveImg] : []));

            return {
              size: v.size || v.measureValue,
              measureScale: v.measureScale || 'size',
              measureValue: v.measureValue || v.size,
              unit: v.unit || 'Size',
              price: Number(v.price) || minVariantPrice,
              mrp: Number(v.mrp || v.originalPrice) || Math.round(minVariantPrice * 1.25),
              originalPrice: Number(v.originalPrice || v.mrp) || Math.round(minVariantPrice * 1.25),
              stock: Number(v.stock) || 0,
              stockQuantity: Number(v.stockQuantity || v.stock) || 0,
              image: effectiveImg,
              images: finalVImgs,
              sku: v.sku || `${formData.sku || 'SKU'}-${v.size || v.measureValue}`
            };
          }),
          variants: cleanVariants.map(v => {
            const isPlaceholder = (img) => !img || (typeof img === 'string' && (img.includes('unsplash.com') || img.includes('placeholder') || img.includes('via.placeholder')));
            const hasCustomImg = v.image && !isPlaceholder(v.image) && v.image !== primaryImage;
            const effectiveImg = hasCustomImg ? v.image : (v.image && !isPlaceholder(v.image) ? v.image : primaryImage);
            const finalVImgs = hasCustomImg
              ? [v.image]
              : (Array.isArray(v.images) && v.images.length > 0 && !v.images.every(isPlaceholder)
                ? Array.from(new Set(v.images.filter(img => !isPlaceholder(img))))
                : (effectiveImg ? [effectiveImg] : []));

            return {
              size: v.size || v.measureValue,
              measureScale: v.measureScale || 'size',
              measureValue: v.measureValue || v.size,
              unit: v.unit || 'Size',
              price: Number(v.price) || minVariantPrice,
              mrp: Number(v.mrp || v.originalPrice) || Math.round(minVariantPrice * 1.25),
              originalPrice: Number(v.originalPrice || v.mrp) || Math.round(minVariantPrice * 1.25),
              stock: Number(v.stock) || 0,
              stockQuantity: Number(v.stockQuantity || v.stock) || 0,
              image: effectiveImg,
              images: finalVImgs,
              sku: v.sku || `${formData.sku || 'SKU'}-${v.size || v.measureValue}`
            };
          })
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
            className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${entryType === 'single' ? 'bg-brand-teal text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            Standard Product (With Variants)
          </button>
          <button
            type="button"
            onClick={() => {
              if (typeof onSwitchToKit === 'function') {
                onSwitchToKit();
              } else {
                setEntryType('kit');
                setActiveTab('kit');
              }
            }}
            className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${entryType === 'kit' ? 'bg-brand-teal text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
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
            { id: 'payment', label: '2. Allowed Payment Methods', icon: CreditCard }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${isActive ? 'bg-brand-teal text-white shadow-xs' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
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
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${isActive ? 'bg-brand-teal text-white shadow-xs' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
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
                      required
                      value={formData.category}
                      onChange={e => {
                        const selectedCat = e.target.value;
                        const subs = selectedCat ? getDynamicSubCategories(selectedCat) : [];
                        const matchedCat = selectedCat ? displayCategories.find(c => c.name.toLowerCase() === selectedCat.toLowerCase()) : null;
                        setSelectedUnitType(null);
                        setFormData(prev => ({
                          ...prev,
                          category: selectedCat,
                          subCategory: subs[0] || '',
                          gst: (matchedCat && matchedCat.gstPercentage !== undefined) ? String(matchedCat.gstPercentage) : prev.gst
                        }));
                      }}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none cursor-pointer focus:border-teal-500 focus:bg-white"
                    >
                      <option value="">-- Select Category --</option>
                      {displayCategories.map(c => (
                        <option key={c.name} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Sub-Category * {!formData.category && <span className="text-[10px] text-amber-600 font-semibold">(Please select Category first)</span>}
                    </label>
                    <select
                      required
                      disabled={!formData.category}
                      value={formData.subCategory}
                      onChange={e => setFormData({ ...formData, subCategory: e.target.value })}
                      className={`w-full px-3.5 py-2.5 border rounded-xl text-xs font-bold outline-none transition-all ${!formData.category
                          ? 'bg-gray-100/90 text-gray-400 border-gray-200 cursor-not-allowed opacity-75'
                          : 'bg-gray-50 text-gray-800 border-gray-200 cursor-pointer focus:border-teal-500 focus:bg-white'
                        }`}
                      title={!formData.category ? 'Please select a Category first' : 'Select Sub-Category'}
                    >
                      {!formData.category ? (
                        <option value="">-- Please Select Category First --</option>
                      ) : (
                        <>
                          <option value="">-- Select Sub-Category --</option>
                          {getDynamicSubCategories(formData.category).map(sub => (
                            <option key={sub} value={sub}>{sub}</option>
                          ))}
                        </>
                      )}
                    </select>
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

                {/* Price, MRP, Stock, GST Percentage & Auto Discount */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
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
                    <label className="block text-xs font-bold text-gray-700 mb-1">Base Stock ({getProductStockUnit(formData)}) *</label>
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

                {/* School Name & School Code */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                </div>

                {/* Multi-Select Grade / Class Selection */}
                <div className="space-y-2 bg-teal-50/40 p-4 rounded-2xl border border-teal-200/70">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <label className="block text-xs font-extrabold text-teal-950 uppercase tracking-wider">
                        Grade / Class Selection (Select Multiple if Applicable) *
                      </label>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Click pills to select one or multiple grades for this product item.
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setSelectedGrades(['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5'])}
                        className="px-2.5 py-1 bg-white hover:bg-teal-100 text-teal-800 rounded-lg border border-teal-300 text-[11px] cursor-pointer shadow-2xs"
                      >
                        + Primary (1-5)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedGrades(['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'])}
                        className="px-2.5 py-1 bg-white hover:bg-teal-100 text-teal-800 rounded-lg border border-teal-300 text-[11px] cursor-pointer shadow-2xs"
                      >
                        + Secondary (6-10)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedGrades([])}
                        className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg border border-rose-200 text-[11px] cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {GRADE_OPTIONS.map(grade => {
                      const isSelected = selectedGrades.includes(grade);
                      return (
                        <button
                          key={grade}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setSelectedGrades(prev => prev.filter(g => g !== grade));
                            } else {
                              setSelectedGrades(prev => [...prev, grade]);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${isSelected
                              ? 'bg-teal-800 text-white border-teal-900 shadow-2xs font-extrabold'
                              : 'bg-white text-gray-700 border-gray-200 hover:border-teal-400 hover:bg-teal-50/50'
                            }`}
                        >
                          {isSelected && <span className="mr-1">✓</span>}
                          {grade}
                        </button>
                      );
                    })}
                  </div>

                  {selectedGrades.length > 0 ? (
                    <div className="text-[11px] text-teal-950 font-bold bg-white p-2 rounded-xl border border-teal-200 mt-2 flex items-center justify-between">
                      <span>Selected Grades ({selectedGrades.length}): <strong>{selectedGrades.join(', ')}</strong></span>
                    </div>
                  ) : (
                    <div className="text-[11px] text-amber-800 font-semibold bg-amber-50 p-2 rounded-xl border border-amber-200 mt-2">
                      ℹ️ No specific grade selected. Product will be marked as "All Grades / General".
                    </div>
                  )}
                </div>

                {/* Age Group Selection (Multi-Selectable) */}
                <div className="space-y-2 bg-indigo-50/40 p-4 rounded-2xl border border-indigo-200/70">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <label className="block text-xs font-extrabold text-indigo-950 uppercase tracking-wider">
                        Age Group Selection (Select Multiple if Applicable) *
                      </label>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Click pills to select one or multiple target age groups for this product item.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setSelectedAges(['3-5 Years', '6-8 Years'])}
                        className="px-2.5 py-1 bg-white hover:bg-indigo-100 text-indigo-800 rounded-lg border border-indigo-300 text-[11px] cursor-pointer shadow-2xs"
                      >
                        + Junior (3-8 Yrs)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedAges(['9-12 Years', '13-16 Years', '16+ Years'])}
                        className="px-2.5 py-1 bg-white hover:bg-indigo-100 text-indigo-800 rounded-lg border border-indigo-300 text-[11px] cursor-pointer shadow-2xs"
                      >
                        + Senior (9-16+ Yrs)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedAges([])}
                        className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg border border-rose-200 text-[11px] cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {AGE_OPTIONS.map(age => {
                      const isSelected = selectedAges.includes(age);
                      return (
                        <button
                          key={age}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setSelectedAges(prev => prev.filter(a => a !== age));
                            } else {
                              setSelectedAges(prev => [...prev, age]);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${isSelected
                              ? 'bg-indigo-800 text-white border-indigo-900 shadow-2xs font-extrabold'
                              : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-400 hover:bg-indigo-50/50'
                            }`}
                        >
                          {isSelected && <span className="mr-1">✓</span>}
                          {age}
                        </button>
                      );
                    })}
                  </div>

                  {selectedAges.length > 0 ? (
                    <div className="text-[11px] text-indigo-950 font-bold bg-white p-2 rounded-xl border border-indigo-200 mt-2 flex items-center justify-between">
                      <span>Selected Age Groups ({selectedAges.length}): <strong>{selectedAges.join(', ')}</strong></span>
                    </div>
                  ) : (
                    <div className="text-[11px] text-amber-800 font-semibold bg-amber-50 p-2 rounded-xl border border-amber-200 mt-2">
                      ℹ️ No specific age group selected. Product will be marked as "All Ages / General".
                    </div>
                  )}
                </div>

                {/* Gender, Colors & Product Tags */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                    onChange={(imgs) => {
                      const newPrimary = imgs[0] || '';
                      setFormData({ ...formData, images: imgs, image: newPrimary });
                      if (newPrimary) {
                        setSizeVariants(prev => prev.map(v => {
                          const isPlaceholder = !v.image || (typeof v.image === 'string' && (v.image.includes('unsplash.com') || v.image.includes('placeholder')));
                          if (isPlaceholder) {
                            return { ...v, image: newPrimary, images: [newPrimary] };
                          }
                          return v;
                        }));
                      }
                    }}
                    maxImages={8}
                    helperText="Drag & drop primary product photos here"
                  />
                </div>

                {/* CATEGORY-DRIVEN UNIVERSAL UNIT & SIZING SYSTEM */}
                <div className="p-4.5 rounded-2xl bg-teal-50/40 border border-teal-200/80 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <label className="block text-xs font-extrabold text-teal-950 uppercase tracking-wider">
                        Category Selling Unit & Sizing Configuration
                      </label>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Category: <strong className="text-teal-900">{formData.category || 'General'}</strong>
                      </p>
                    </div>
                    <div className="flex items-center flex-wrap gap-1 bg-white p-1 rounded-xl border border-teal-200 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setSelectedUnitType('apparel')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${categoryUnitType === 'apparel'
                            ? 'bg-teal-700 text-white shadow-xs'
                            : 'text-gray-600 hover:text-teal-800 hover:bg-teal-50'
                          }`}
                      >
                        👔 Apparel & Sizes (18-44, S-4XL)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedUnitType('footwear')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${categoryUnitType === 'footwear'
                            ? 'bg-teal-700 text-white shadow-xs'
                            : 'text-gray-600 hover:text-teal-800 hover:bg-teal-50'
                          }`}
                      >
                        👟 Shoe Sizes
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedUnitType('general')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${categoryUnitType === 'general'
                            ? 'bg-teal-700 text-white shadow-xs'
                            : 'text-gray-600 hover:text-teal-800 hover:bg-teal-50'
                          }`}
                      >
                        📦 Single Piece (No Sizes)
                      </button>
                    </div>
                  </div>

                  {/* APPAREL UNIT SYSTEM */}
                  {categoryUnitType === 'apparel' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div
                          onClick={() => setFormData({ ...formData, isMeterBased: false, unit: 'piece' })}
                          className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer ${!formData.isMeterBased
                              ? 'border-brand-teal bg-white shadow-xs font-bold'
                              : 'border-gray-200 bg-white/60'
                            }`}
                        >
                          <div className="flex items-center gap-2 text-xs font-bold text-gray-900">
                            <span>👔 Stitched Item / Ready-To-Wear (Sizes S, M, L, 32...)</span>
                          </div>
                          <p className="text-[11px] text-gray-500 mt-1">
                            Sold in standard apparel sizes (S, M, L, XL, 26, 28, 30, 32, 34, 36, 38) with individual stock.
                          </p>
                        </div>

                        <div
                          onClick={() => setFormData({ ...formData, isMeterBased: true, unit: 'meter' })}
                          className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer ${formData.isMeterBased
                              ? 'border-brand-teal bg-white shadow-xs font-bold'
                              : 'border-gray-200 bg-white/60'
                            }`}
                        >
                          <div className="flex items-center gap-2 text-xs font-bold text-gray-900">
                            <span>✂️ Unstitched Fabric (Sold per Meter)</span>
                          </div>
                          <p className="text-[11px] text-gray-500 mt-1">
                            Customer orders cloth in <strong>Meters (e.g. 2.5m pant cloth)</strong>. Price calculated as <strong>{`{x} meters * ₹/meter`}</strong>.
                          </p>
                        </div>
                      </div>

                      {formData.isMeterBased ? (
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
                        </div>
                      ) : (
                        /* APPAREL SIZE SELECTION PILLS & INLINE TABLE */
                        <div className="space-y-3 pt-2 border-t border-teal-100">

                          {/* PRESETS & ADD CUSTOM SIZES SECTION */}
                          <div className="space-y-2.5">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div>
                                <label className="block text-xs font-extrabold text-teal-950 uppercase tracking-wider">
                                  Apparel Sizes & Custom Size Addition
                                </label>
                                <p className="text-[11px] text-gray-500">
                                  Select from presets or add any custom size (e.g. 16, 40, 42, Free Size) as needed.
                                </p>
                              </div>

                              {/* Presets Toolbar */}
                              <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const defaultPrice = formData.price || '499';
                                    const defaultMrp = formData.originalPrice || Math.round(Number(defaultPrice || 499) * 1.25).toString();
                                    const defaultStock = formData.stockQuantity || '25';
                                    const kidsVariants = APPAREL_SIZES_KIDS.map(sz => {
                                      const existing = sizeVariants.find(v => String(v.size || v.measureValue || '').toLowerCase().trim() === sz.toLowerCase());
                                      return existing || {
                                        size: sz, measureScale: 'size', measureValue: sz, unit: 'SIZE',
                                        price: defaultPrice, mrp: defaultMrp,
                                        stock: defaultStock, stockQuantity: defaultStock
                                      };
                                    });
                                    const nonKids = sizeVariants.filter(v => !APPAREL_SIZES_KIDS.some(k => k.toLowerCase() === String(v.size || v.measureValue || '').toLowerCase().trim()));
                                    setSizeVariants([...nonKids, ...kidsVariants]);
                                  }}
                                  className="px-2 py-1 bg-white hover:bg-teal-100 text-teal-900 rounded-lg border border-teal-300 text-[11px] cursor-pointer"
                                  title="Add Kids waist sizes 18, 20, 22, 24"
                                >
                                  + Kids (18 - 24)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const defaultPrice = formData.price || '499';
                                    const defaultMrp = formData.originalPrice || Math.round(Number(defaultPrice || 499) * 1.25).toString();
                                    const defaultStock = formData.stockQuantity || '25';
                                    const regVariants = APPAREL_SIZES_REGULAR.map(sz => {
                                      const existing = sizeVariants.find(v => String(v.size || v.measureValue || '').toLowerCase().trim() === sz.toLowerCase());
                                      return existing || {
                                        size: sz, measureScale: 'size', measureValue: sz, unit: 'SIZE',
                                        price: defaultPrice, mrp: defaultMrp,
                                        stock: defaultStock, stockQuantity: defaultStock
                                      };
                                    });
                                    const nonReg = sizeVariants.filter(v => !APPAREL_SIZES_REGULAR.some(r => r.toLowerCase() === String(v.size || v.measureValue || '').toLowerCase().trim()));
                                    setSizeVariants([...nonReg, ...regVariants]);
                                  }}
                                  className="px-2 py-1 bg-white hover:bg-teal-100 text-teal-900 rounded-lg border border-teal-300 text-[11px] cursor-pointer"
                                  title="Add Regular waist sizes 26 - 38"
                                >
                                  + Regular (26 - 38)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const defaultPrice = formData.price || '499';
                                    const defaultMrp = formData.originalPrice || Math.round(Number(defaultPrice || 499) * 1.25).toString();
                                    const defaultStock = formData.stockQuantity || '25';
                                    const plusVariants = APPAREL_SIZES_PLUS.map(sz => {
                                      const existing = sizeVariants.find(v => String(v.size || v.measureValue || '').toLowerCase().trim() === sz.toLowerCase());
                                      return existing || {
                                        size: sz, measureScale: 'size', measureValue: sz, unit: 'SIZE',
                                        price: defaultPrice, mrp: defaultMrp,
                                        stock: defaultStock, stockQuantity: defaultStock
                                      };
                                    });
                                    const nonPlus = sizeVariants.filter(v => !APPAREL_SIZES_PLUS.some(p => p.toLowerCase() === String(v.size || v.measureValue || '').toLowerCase().trim()));
                                    setSizeVariants([...nonPlus, ...plusVariants]);
                                  }}
                                  className="px-2 py-1 bg-white hover:bg-teal-100 text-teal-900 rounded-lg border border-teal-300 text-[11px] cursor-pointer"
                                  title="Add Senior / Plus sizes 40 - 48"
                                >
                                  + Plus (40 - 48)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const defaultPrice = formData.price || '499';
                                    const defaultMrp = formData.originalPrice || Math.round(Number(defaultPrice || 499) * 1.25).toString();
                                    const defaultStock = formData.stockQuantity || '25';
                                    const alphaVariants = APPAREL_SIZES_ALPHA.slice(1, 6).map(sz => {
                                      const existing = sizeVariants.find(v => String(v.size || v.measureValue || '').toLowerCase().trim() === sz.toLowerCase());
                                      return existing || {
                                        size: sz, measureScale: 'size', measureValue: sz, unit: 'SIZE',
                                        price: defaultPrice, mrp: defaultMrp,
                                        stock: defaultStock, stockQuantity: defaultStock
                                      };
                                    });
                                    const nonAlpha = sizeVariants.filter(v => !APPAREL_SIZES_ALPHA.slice(1, 6).some(a => a.toLowerCase() === String(v.size || v.measureValue || '').toLowerCase().trim()));
                                    setSizeVariants([...nonAlpha, ...alphaVariants]);
                                  }}
                                  className="px-2 py-1 bg-white hover:bg-teal-100 text-teal-900 rounded-lg border border-teal-300 text-[11px] cursor-pointer"
                                  title="Add Alpha standard sizes S - XXL"
                                >
                                  + Alpha (S - XXL)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setSizeVariants([])}
                                  className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg border border-rose-200 text-[11px] cursor-pointer"
                                >
                                  Clear All
                                </button>
                              </div>
                            </div>

                            {/* UNIFIED CUSTOM SIZE & UNIT ADDER BAR */}
                            <div className="p-3 bg-gradient-to-r from-teal-50/90 to-emerald-50/90 rounded-2xl border border-teal-200 shadow-2xs space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-extrabold text-teal-950 uppercase tracking-wider flex items-center gap-1.5">
                                  <Plus size={14} className="text-teal-700" />
                                  <span>अपनी जरूरत का नया साइज / यूनिट जोड़ें (Add Custom Size & Unit):</span>
                                </span>
                                <span className="text-[10px] text-gray-500 font-medium">Type size name, choose unit, price & stock</span>
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="flex-1 min-w-[150px]">
                                  <input
                                    type="text"
                                    value={customSizeInput}
                                    onChange={e => setCustomSizeInput(e.target.value)}
                                    placeholder="Type size name (e.g. 16, 42, 2.5m, Free Size)..."
                                    className="w-full px-3 py-1.5 bg-white border border-teal-300 rounded-lg text-xs font-bold text-teal-950 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-600 shadow-2xs"
                                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleUnifiedAddCustomSize(); } }}
                                  />
                                </div>
                                <select
                                  value={customSizeUnit}
                                  onChange={e => setCustomSizeUnit(e.target.value)}
                                  className="px-2.5 py-1.5 bg-white border border-teal-300 rounded-lg text-xs font-bold text-teal-900 outline-none cursor-pointer shadow-2xs"
                                >
                                  <option value="Pcs">Pcs (Pieces)</option>
                                  <option value="Mtr">Mtr (Meters)</option>
                                  <option value="Pairs">Pairs (Prs)</option>
                                  <option value="Box">Box</option>
                                  <option value="Set">Set</option>
                                  <option value="Kg">Kg</option>
                                </select>
                                <input
                                  type="number"
                                  value={customSizePrice}
                                  onChange={e => setCustomSizePrice(e.target.value)}
                                  placeholder={`Price (₹${formData.price || 499})`}
                                  className="w-28 px-2.5 py-1.5 bg-white border border-teal-300 rounded-lg text-xs font-bold text-teal-950 focus:outline-none focus:ring-1 focus:ring-teal-600 shadow-2xs"
                                />
                                <input
                                  type="number"
                                  value={customSizeStock}
                                  onChange={e => setCustomSizeStock(e.target.value)}
                                  placeholder="Stock (25)"
                                  className="w-24 px-2.5 py-1.5 bg-white border border-teal-300 rounded-lg text-xs font-bold text-teal-950 focus:outline-none focus:ring-1 focus:ring-teal-600 shadow-2xs"
                                />

                                {/* Optional Size Photo */}
                                <div className="relative">
                                  <input
                                    type="file"
                                    id="custom-size-img-upload"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={async (e) => {
                                      const file = e.target.files && e.target.files[0];
                                      if (file) {
                                        const compressed = await compressImageFile(file, 800, 0.8);
                                        if (compressed) setCustomSizeImage(compressed);
                                        e.target.value = '';
                                      }
                                    }}
                                  />
                                  <label
                                    htmlFor="custom-size-img-upload"
                                    className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all ${customSizeImage
                                        ? 'bg-emerald-100 border-emerald-400 text-emerald-900'
                                        : 'bg-white border-teal-300 text-teal-900 hover:bg-teal-50'
                                      }`}
                                    title="Add photo for this size (Optional)"
                                  >
                                    {customSizeImage ? (
                                      <>
                                        <img src={customSizeImage} alt="preview" className="w-4 h-4 rounded object-cover" />
                                        <span className="text-[11px]">Photo Attached</span>
                                        <span
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setCustomSizeImage('');
                                          }}
                                          className="text-rose-500 hover:text-rose-700 ml-1 text-xs"
                                        >✕</span>
                                      </>
                                    ) : (
                                      <>
                                        <ImageIcon size={13} className="text-teal-700" />
                                        <span className="text-[11px]">+ Photo</span>
                                      </>
                                    )}
                                  </label>
                                </div>

                                <button
                                  type="button"
                                  onClick={handleUnifiedAddCustomSize}
                                  className="px-3.5 py-1.5 bg-teal-800 hover:bg-teal-900 text-white rounded-lg text-xs font-extrabold cursor-pointer flex items-center gap-1 shadow-xs transition-all"
                                >
                                  <Plus size={14} />
                                  <span>+ Add Size</span>
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* SIZE PILLS DISPLAY */}
                          <div className="space-y-2">
                            {/* Number Sizes (Kids, Regular, Plus) */}
                            <div>
                              <div className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider mb-1">
                                Waist / Number Sizes (18 to 48):
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {[...APPAREL_SIZES_KIDS, ...APPAREL_SIZES_REGULAR, ...APPAREL_SIZES_PLUS].map(sz => {
                                  const isSelected = sizeVariants.some(v => String(v.size || v.measureValue).toLowerCase() === sz.toLowerCase());
                                  return (
                                    <button
                                      key={sz}
                                      type="button"
                                      onClick={() => toggleCategorySizeVariant(sz, 'size')}
                                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${isSelected
                                          ? 'bg-teal-800 text-white border-teal-900 shadow-2xs font-extrabold'
                                          : 'bg-white text-gray-700 border-gray-200 hover:border-teal-400 hover:bg-teal-50/50'
                                        }`}
                                    >
                                      {isSelected && <span className="mr-1">✓</span>}
                                      {sz}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Standard Alpha Sizes */}
                            <div>
                              <div className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider mb-1">
                                Alpha Sizes (XS to 4XL):
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {APPAREL_SIZES_ALPHA.map(sz => {
                                  const isSelected = sizeVariants.some(v => String(v.size || v.measureValue).toLowerCase() === sz.toLowerCase());
                                  return (
                                    <button
                                      key={sz}
                                      type="button"
                                      onClick={() => toggleCategorySizeVariant(sz, 'size')}
                                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${isSelected
                                          ? 'bg-teal-800 text-white border-teal-900 shadow-2xs font-extrabold'
                                          : 'bg-white text-gray-700 border-gray-200 hover:border-teal-400 hover:bg-teal-50/50'
                                        }`}
                                    >
                                      {isSelected && <span className="mr-1">✓</span>}
                                      {sz}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Custom Added Sizes */}
                            {customApparelSizes.length > 0 && (
                              <div className="p-2 bg-amber-50/60 rounded-xl border border-amber-200/80">
                                <div className="text-[10px] font-extrabold text-amber-900 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                                  <span>Custom Added Sizes (आपकी अपनी जोड़ी गई साइज):</span>
                                  <span className="text-gray-400 font-normal">Click to toggle, ✕ to remove pill</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {customApparelSizes.map(sz => {
                                    const isSelected = sizeVariants.some(v => String(v.size || v.measureValue).toLowerCase() === sz.toLowerCase());
                                    return (
                                      <span
                                        key={sz}
                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${isSelected
                                            ? 'bg-teal-800 text-white border-teal-900 shadow-2xs font-extrabold'
                                            : 'bg-white text-gray-700 border-gray-200 hover:border-teal-400 hover:bg-teal-50/50'
                                          }`}
                                      >
                                        <button
                                          type="button"
                                          onClick={() => toggleCategorySizeVariant(sz, 'size')}
                                          className="cursor-pointer"
                                        >
                                          {isSelected && <span className="mr-1">✓</span>}
                                          {sz}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemoveCustomSizePill(sz);
                                          }}
                                          className="text-rose-400 hover:text-rose-600 font-bold ml-1 cursor-pointer text-xs"
                                          title="Remove this custom size pill"
                                        >
                                          ✕
                                        </button>
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Inline Size Matrix Table */}
                          {sizeVariants.length > 0 && (
                            <div className="overflow-x-auto rounded-xl border border-teal-200 bg-white mt-2">
                              <table className="w-full text-left text-xs">
                                <thead className="bg-teal-50/80 border-b border-teal-200 text-teal-950 font-bold uppercase text-[10px]">
                                  <tr>
                                    <th className="px-3 py-2.5">Apparel Size (Editable)</th>
                                    <th className="px-3 py-2.5">Photo</th>
                                    <th className="px-3 py-2.5">Unit</th>
                                    <th className="px-3 py-2.5">Price (₹)</th>
                                    <th className="px-3 py-2.5">MRP (₹)</th>
                                    <th className="px-3 py-2.5">Stock</th>
                                    <th className="px-3 py-2.5 text-right">Remove</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-teal-100 font-medium">
                                  {sizeVariants.map((v, idx) => (
                                    <tr key={idx} className="hover:bg-teal-50/30">
                                      <td className="px-3 py-2">
                                        <input
                                          type="text"
                                          value={v.size || v.measureValue || ''}
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            setSizeVariants(prev => prev.map((item, i) => i === idx ? { ...item, size: val, measureValue: val } : item));
                                          }}
                                          className="w-24 px-2 py-1 bg-white border border-gray-200 rounded text-xs font-extrabold text-teal-950 focus:border-teal-500 focus:outline-none"
                                          placeholder="Size e.g. 32"
                                        />
                                      </td>
                                      <td className="px-3 py-2">
                                        <div className="flex items-center gap-2">
                                          <div className="relative group w-9 h-9 rounded-lg overflow-hidden border border-teal-200 bg-teal-50 shrink-0 flex items-center justify-center shadow-2xs">
                                            {v.image ? (
                                              <img
                                                src={resolveImageUrl(v.image)}
                                                alt={v.size || 'Size photo'}
                                                className="w-full h-full object-cover"
                                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                              />
                                            ) : (
                                              <ImageIcon size={16} className="text-teal-400" />
                                            )}
                                            <label
                                              htmlFor={`apparel-img-file-${idx}`}
                                              className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white cursor-pointer transition-opacity text-[8px] font-bold"
                                              title="Upload photo for this size"
                                            >
                                              Upload
                                            </label>
                                          </div>

                                          <input
                                            id={`apparel-img-file-${idx}`}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => {
                                              if (e.target.files && e.target.files[0]) {
                                                handleVariantImageFile(idx, e.target.files[0]);
                                                e.target.value = '';
                                              }
                                            }}
                                          />

                                          <div className="flex flex-col gap-0.5">
                                            <label
                                              htmlFor={`apparel-img-file-${idx}`}
                                              className="px-2 py-0.5 bg-white hover:bg-teal-50 text-teal-900 border border-teal-300 rounded text-[10px] font-bold cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                                              title="Upload photo from device"
                                            >
                                              <UploadCloud size={11} className="text-teal-700" />
                                              <span>{v.image && v.image !== (formData.images[0] || formData.image) ? 'Change' : '+ Photo'}</span>
                                            </label>

                                            {v.image && v.image !== (formData.images[0] || formData.image) ? (
                                              <button
                                                type="button"
                                                onClick={() => handleResetVariantImage(idx)}
                                                className="text-[9px] text-rose-500 hover:text-rose-700 font-semibold cursor-pointer text-left"
                                                title="Reset to main product photo"
                                              >
                                                ✕ Reset
                                              </button>
                                            ) : (
                                              formData.images && formData.images.length > 1 && (
                                                <select
                                                  value={v.image || ''}
                                                  onChange={(e) => {
                                                    const selectedImg = e.target.value;
                                                    if (selectedImg) {
                                                      setSizeVariants(prev => prev.map((item, i) => i === idx ? {
                                                        ...item,
                                                        image: selectedImg,
                                                        images: [selectedImg]
                                                      } : item));
                                                    }
                                                  }}
                                                  className="text-[9px] text-gray-600 border border-gray-200 rounded px-1 py-0.5 bg-white outline-none cursor-pointer max-w-[80px] truncate"
                                                  title="Choose from uploaded product photos"
                                                >
                                                  <option value="">Base photo</option>
                                                  {formData.images.map((img, imgIdx) => (
                                                    <option key={imgIdx} value={img}>Photo #{imgIdx + 1}</option>
                                                  ))}
                                                </select>
                                              )
                                            )}
                                          </div>
                                        </div>
                                      </td>
                                      <td className="px-3 py-2">
                                        <select
                                          value={v.unit || (formData.isMeterBased ? 'Mtr' : 'Pcs')}
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            setSizeVariants(prev => prev.map((item, i) => i === idx ? { ...item, unit: val, measureScale: val === 'Mtr' ? 'meter' : 'size' } : item));
                                          }}
                                          className="px-2 py-1 bg-white border border-teal-200 rounded text-xs font-bold text-teal-900 outline-none cursor-pointer"
                                        >
                                          <option value="Pcs">Pcs</option>
                                          <option value="Mtr">Mtr</option>
                                          <option value="Pairs">Pairs</option>
                                          <option value="Box">Box</option>
                                          <option value="Set">Set</option>
                                          <option value="Kg">Kg</option>
                                        </select>
                                      </td>
                                      <td className="px-3 py-2">
                                        <input
                                          type="number"
                                          value={v.price}
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            setSizeVariants(prev => prev.map((item, i) => i === idx ? { ...item, price: val } : item));
                                          }}
                                          className="w-20 px-2 py-1 bg-white border border-gray-200 rounded text-xs font-bold"
                                          placeholder="Price"
                                        />
                                      </td>
                                      <td className="px-3 py-2">
                                        <input
                                          type="number"
                                          value={v.mrp}
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            setSizeVariants(prev => prev.map((item, i) => i === idx ? { ...item, mrp: val } : item));
                                          }}
                                          className="w-20 px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-600"
                                          placeholder="MRP"
                                        />
                                      </td>
                                      <td className="px-3 py-2">
                                        <div className="flex items-center gap-1">
                                          <input
                                            type="number"
                                            value={v.stock}
                                            onChange={(e) => {
                                              const val = e.target.value;
                                              setSizeVariants(prev => prev.map((item, i) => i === idx ? { ...item, stock: val, stockQuantity: val } : item));
                                            }}
                                            className="w-20 px-2 py-1 bg-white border border-gray-200 rounded text-xs font-bold text-teal-900"
                                            placeholder="Stock"
                                          />
                                          <span className="text-[10px] font-bold text-gray-400">{v.unit || 'Pcs'}</span>
                                        </div>
                                      </td>
                                      <td className="px-3 py-2 text-right">
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveVariant(idx)}
                                          className="text-rose-600 hover:text-rose-800 text-xs font-bold p-1 cursor-pointer"
                                        >
                                          ✕
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>

                              <div className="flex items-center justify-between p-2.5 bg-teal-50/50 border-t border-teal-100">
                                <button
                                  type="button"
                                  onClick={handleAddCustomSizeRow}
                                  className="px-3 py-1.5 bg-white hover:bg-teal-100 text-teal-900 border border-teal-300 rounded-lg text-xs font-bold cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                                >
                                  <Plus size={14} />
                                  + Add Size Row in Table
                                </button>
                                <span className="text-[11px] text-gray-500 font-medium">
                                  You can edit any size name or price/stock directly in this table.
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* FOOTWEAR UNIT SYSTEM */}
                  {categoryUnitType === 'footwear' && (
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <label className="block text-xs font-extrabold text-teal-950 uppercase tracking-wider">
                            Select Indian Shoe Sizes (UK/IND Standard) *
                          </label>
                          <p className="text-[11px] text-gray-500">
                            Click shoe size pills to activate available stock options for footwear.
                          </p>
                        </div>
                        <div className="flex items-center flex-wrap gap-1.5 text-xs font-bold">
                          <button
                            type="button"
                            onClick={() => {
                              const defaultPrice = formData.price || '599';
                              const defaultMrp = formData.originalPrice || Math.round(Number(defaultPrice || 599) * 1.25).toString();
                              const defaultStock = formData.stockQuantity || '20';
                              const defaultImg = formData.images[0] || formData.image || '';
                              const kidsVariants = KIDS_SHOE_SIZES.map(sz => {
                                const target = sz.toLowerCase();
                                const existing = sizeVariants.find(v => String(v.size || v.measureValue || '').toLowerCase().trim() === target);
                                return existing || {
                                  size: sz, measureScale: 'size', measureValue: sz, unit: 'SHOE',
                                  price: defaultPrice, mrp: defaultMrp,
                                  stock: defaultStock, stockQuantity: defaultStock,
                                  image: defaultImg, images: defaultImg ? [defaultImg] : [],
                                  sku: formData.sku ? `${formData.sku}-${sz}` : `SKU-${sz}`
                                };
                              });
                              const nonKids = sizeVariants.filter(v => !KIDS_SHOE_SIZES.some(k => k.toLowerCase() === String(v.size || v.measureValue || '').toLowerCase().trim()));
                              setSizeVariants([...nonKids, ...kidsVariants]);
                            }}
                            className="px-2 py-1 bg-white hover:bg-teal-100 text-teal-900 rounded-lg border border-teal-300 text-[11px] cursor-pointer"
                          >
                            + All Kids (6 - 13 Kids)
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const defaultPrice = formData.price || '599';
                              const defaultMrp = formData.originalPrice || Math.round(Number(defaultPrice || 599) * 1.25).toString();
                              const defaultStock = formData.stockQuantity || '20';
                              const defaultImg = formData.images[0] || formData.image || '';
                              const seniorVariants = SENIOR_SHOE_SIZES.map(sz => {
                                const target = sz.toLowerCase();
                                const targetNoPrefix = target.replace(/^size\s+/i, '');
                                const existing = sizeVariants.find(v => {
                                  const s = String(v.size || v.measureValue || '').toLowerCase().trim();
                                  return s === target || s === targetNoPrefix;
                                });
                                return existing || {
                                  size: sz, measureScale: 'size', measureValue: sz, unit: 'SHOE',
                                  price: defaultPrice, mrp: defaultMrp,
                                  stock: defaultStock, stockQuantity: defaultStock,
                                  image: defaultImg, images: defaultImg ? [defaultImg] : [],
                                  sku: formData.sku ? `${formData.sku}-${sz}` : `SKU-${sz}`
                                };
                              });
                              const nonSenior = sizeVariants.filter(v => !SENIOR_SHOE_SIZES.some(s => {
                                const st = s.toLowerCase();
                                const stNoPrefix = st.replace(/^size\s+/i, '');
                                const vt = String(v.size || v.measureValue || '').toLowerCase().trim();
                                return vt === st || vt === stNoPrefix;
                              }));
                              setSizeVariants([...nonSenior, ...seniorVariants]);
                            }}
                            className="px-2 py-1 bg-white hover:bg-teal-100 text-teal-900 rounded-lg border border-teal-300 text-[11px] cursor-pointer"
                          >
                            + All Senior / Adults (1 - 10)
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const defaultPrice = formData.price || '599';
                              const defaultMrp = formData.originalPrice || Math.round(Number(defaultPrice || 599) * 1.25).toString();
                              const defaultStock = formData.stockQuantity || '20';
                              const defaultImg = formData.images[0] || formData.image || '';
                              setSizeVariants(SHOE_SIZES.map(sz => {
                                const target = sz.toLowerCase();
                                const targetNoPrefix = target.replace(/^size\s+/i, '');
                                const existing = sizeVariants.find(v => {
                                  const s = String(v.size || v.measureValue || '').toLowerCase().trim();
                                  return s === target || s === targetNoPrefix;
                                });
                                return existing || {
                                  size: sz, measureScale: 'size', measureValue: sz, unit: 'SHOE',
                                  price: defaultPrice, mrp: defaultMrp,
                                  stock: defaultStock, stockQuantity: defaultStock,
                                  image: defaultImg, images: defaultImg ? [defaultImg] : [],
                                  sku: formData.sku ? `${formData.sku}-${sz}` : `SKU-${sz}`
                                };
                              }));
                            }}
                            className="px-2 py-1 bg-white hover:bg-teal-100 text-teal-900 rounded-lg border border-teal-300 text-[11px] cursor-pointer"
                          >
                            + All Shoe Sizes
                          </button>
                          <button
                            type="button"
                            onClick={() => setSizeVariants([])}
                            className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg border border-rose-200 text-[11px] cursor-pointer"
                          >
                            Clear
                          </button>
                        </div>
                      </div>

                      {/* Kids Shoe Sizes Group */}
                      <div className="p-3 bg-white/80 rounded-xl border border-teal-100 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-extrabold text-teal-900 uppercase tracking-wider flex items-center gap-1.5">
                            <span>👶 Kids Shoe Sizes (6 - 13 Kids)</span>
                          </span>
                          <span className="text-[10px] text-gray-500 font-medium">Nursery, KG & Primary School</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {KIDS_SHOE_SIZES.map(sz => {
                            const target = sz.toLowerCase();
                            const isSelected = sizeVariants.some(v => String(v.size || v.measureValue || '').toLowerCase().trim() === target);
                            return (
                              <button
                                key={sz}
                                type="button"
                                onClick={() => toggleCategorySizeVariant(sz, 'size')}
                                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${isSelected
                                    ? 'bg-teal-800 text-white border-teal-900 shadow-2xs font-extrabold'
                                    : 'bg-white text-gray-700 border-gray-200 hover:border-teal-400 hover:bg-teal-50/50'
                                  }`}
                              >
                                {isSelected && <span className="mr-1">✓</span>}
                                {sz}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Senior / Adult Shoe Sizes Group */}
                      <div className="p-3 bg-white/80 rounded-xl border border-teal-100 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-extrabold text-teal-900 uppercase tracking-wider flex items-center gap-1.5">
                            <span>👟 Senior / Adult Shoe Sizes (Size 1 - 10)</span>
                          </span>
                          <span className="text-[10px] text-gray-500 font-medium">Middle, Secondary, Senior School & Adults</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {SENIOR_SHOE_SIZES.map(sz => {
                            const target = sz.toLowerCase();
                            const targetNoPrefix = target.replace(/^size\s+/i, '');
                            const isSelected = sizeVariants.some(v => {
                              const s = String(v.size || v.measureValue || '').toLowerCase().trim();
                              return s === target || s === targetNoPrefix;
                            });
                            return (
                              <button
                                key={sz}
                                type="button"
                                onClick={() => toggleCategorySizeVariant(sz, 'size')}
                                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${isSelected
                                    ? 'bg-teal-800 text-white border-teal-900 shadow-2xs font-extrabold'
                                    : 'bg-white text-gray-700 border-gray-200 hover:border-teal-400 hover:bg-teal-50/50'
                                  }`}
                              >
                                {isSelected && <span className="mr-1">✓</span>}
                                {sz}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Inline Shoe Size Matrix Table */}
                      {sizeVariants.length > 0 && (
                        <div className="overflow-x-auto rounded-xl border border-teal-200 bg-white mt-2">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-teal-50/80 border-b border-teal-200 text-teal-950 font-bold uppercase text-[10px]">
                              <tr>
                                <th className="px-3 py-2.5">Shoe Size</th>
                                <th className="px-3 py-2.5">Photo</th>
                                <th className="px-3 py-2.5">Price (₹)</th>
                                <th className="px-3 py-2.5">MRP (₹)</th>
                                <th className="px-3 py-2.5">Stock Pairs</th>
                                <th className="px-3 py-2.5 text-right">Remove</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-teal-100 font-medium">
                              {sizeVariants.map((v, idx) => (
                                <tr key={idx} className="hover:bg-teal-50/30">
                                  <td className="px-3 py-2 font-extrabold text-teal-950">{v.size || v.measureValue}</td>
                                  <td className="px-3 py-2">
                                    <div className="flex items-center gap-2">
                                      <div className="relative group w-9 h-9 rounded-lg overflow-hidden border border-teal-200 bg-teal-50 shrink-0 flex items-center justify-center shadow-2xs">
                                        {v.image ? (
                                          <img
                                            src={resolveImageUrl(v.image)}
                                            alt={v.size || 'Shoe photo'}
                                            className="w-full h-full object-cover"
                                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                          />
                                        ) : (
                                          <ImageIcon size={16} className="text-teal-400" />
                                        )}
                                        <label
                                          htmlFor={`shoe-img-file-${idx}`}
                                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white cursor-pointer transition-opacity text-[8px] font-bold"
                                          title="Upload photo for this shoe size"
                                        >
                                          Upload
                                        </label>
                                      </div>

                                      <input
                                        id={`shoe-img-file-${idx}`}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                          if (e.target.files && e.target.files[0]) {
                                            handleVariantImageFile(idx, e.target.files[0]);
                                            e.target.value = '';
                                          }
                                        }}
                                      />

                                      <div className="flex flex-col gap-0.5">
                                        <label
                                          htmlFor={`shoe-img-file-${idx}`}
                                          className="px-2 py-0.5 bg-white hover:bg-teal-50 text-teal-900 border border-teal-300 rounded text-[10px] font-bold cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                                          title="Upload photo from device"
                                        >
                                          <UploadCloud size={11} className="text-teal-700" />
                                          <span>{v.image && v.image !== (formData.images[0] || formData.image) ? 'Change' : '+ Photo'}</span>
                                        </label>

                                        {v.image && v.image !== (formData.images[0] || formData.image) && (
                                          <button
                                            type="button"
                                            onClick={() => handleResetVariantImage(idx)}
                                            className="text-[9px] text-rose-500 hover:text-rose-700 font-semibold cursor-pointer text-left"
                                            title="Reset to main product photo"
                                          >
                                            ✕ Reset
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-3 py-2">
                                    <input
                                      type="number"
                                      value={v.price}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setSizeVariants(prev => prev.map((item, i) => i === idx ? { ...item, price: val } : item));
                                      }}
                                      className="w-20 px-2 py-1 bg-white border border-gray-200 rounded text-xs font-bold"
                                      placeholder="Price"
                                    />
                                  </td>
                                  <td className="px-3 py-2">
                                    <input
                                      type="number"
                                      value={v.mrp}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setSizeVariants(prev => prev.map((item, i) => i === idx ? { ...item, mrp: val } : item));
                                      }}
                                      className="w-20 px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-600"
                                      placeholder="MRP"
                                    />
                                  </td>
                                  <td className="px-3 py-2">
                                    <input
                                      type="number"
                                      value={v.stock}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setSizeVariants(prev => prev.map((item, i) => i === idx ? { ...item, stock: val, stockQuantity: val } : item));
                                      }}
                                      className="w-20 px-2 py-1 bg-white border border-gray-200 rounded text-xs font-bold text-teal-900"
                                      placeholder="Stock"
                                    />
                                  </td>
                                  <td className="px-3 py-2 text-right">
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveVariant(idx)}
                                      className="text-rose-600 hover:text-rose-800 text-xs font-bold p-1 cursor-pointer"
                                    >
                                      ✕
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

                  {/* BOOKS UNIT SYSTEM */}
                  {categoryUnitType === 'books' && (
                    <div className="p-3 bg-white rounded-xl border border-teal-200 flex items-center justify-between text-xs">
                      <span className="font-extrabold text-teal-950 flex items-center gap-2">
                        <span>📚 Books Unit:</span>
                        <span className="text-teal-800 font-bold">Individual Piece (Pcs)</span>
                      </span>
                      <span className="text-[11px] text-gray-500 font-medium">Base price and stock managed per book copy.</span>
                    </div>
                  )}

                  {/* GENERAL / STATIONERY / BAGS / KITS UNIT SYSTEM */}
                  {categoryUnitType === 'general' && (
                    <div className="p-3 bg-white rounded-xl border border-teal-200 flex items-center justify-between text-xs">
                      <span className="font-extrabold text-teal-950 flex items-center gap-2">
                        <span>📦 Product Unit:</span>
                        <span className="text-teal-800 font-bold">Pieces (Pcs) / Pack / Kit</span>
                      </span>
                      <span className="text-[11px] text-gray-500 font-medium">Standard unit count & inventory tracking.</span>
                    </div>
                  )}
                </div>

                {/* 2. Return & Exchange Policy Window */}
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-200">
                    <label className="flex items-center gap-2.5 cursor-pointer font-bold text-xs text-gray-900 select-none">
                      <input
                        type="checkbox"
                        checked={formData.isReturnable}
                        onChange={e => setFormData({ ...formData, isReturnable: e.target.checked })}
                        className="w-4 h-4 rounded text-brand-teal focus:ring-brand-teal cursor-pointer"
                      />
                      <span>Item is Returnable (Physical Return Supported)</span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer font-bold text-xs text-gray-900 select-none">
                      <input
                        type="checkbox"
                        checked={formData.isExchangeable}
                        onChange={e => setFormData({ ...formData, isExchangeable: e.target.checked, isRefundable: e.target.checked })}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      <span>Item is Exchangeable (Size & Replacement Supported)</span>
                    </label>
                  </div>

                  {(formData.isReturnable || formData.isExchangeable) && (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
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
                        Specify days within which customer can claim return or exchange (e.g. 7-Day Policy).
                      </span>
                    </div>
                  )}

                  {/* Summary Status Badge */}
                  <div className="text-[11px] font-semibold">
                    {formData.isReturnable && formData.isExchangeable ? (
                      <p className="text-emerald-800 bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg">
                        ✅ <strong>Full Return & Size Exchange Policy:</strong> Customers can return or request size replacement for this item within {formData.returnWindowDays || 7} days.
                      </p>
                    ) : formData.isReturnable && !formData.isExchangeable ? (
                      <p className="text-blue-800 bg-blue-50 border border-blue-200 p-2.5 rounded-lg">
                        🔄 <strong>Returnable Only (Non-Exchangeable):</strong> Customers can return for refund, but size replacement/exchange is not supported.
                      </p>
                    ) : !formData.isReturnable && formData.isExchangeable ? (
                      <p className="text-purple-800 bg-purple-50 border border-purple-200 p-2.5 rounded-lg">
                        🔄 <strong>Exchangeable Only (No Return):</strong> Size exchange or replacement allowed without monetary return.
                      </p>
                    ) : (
                      <p className="text-rose-800 bg-rose-50 border border-rose-200 p-2.5 rounded-lg">
                        ⚠️ <strong>Final Sale:</strong> This item is strictly Non-Returnable and Non-Exchangeable on the storefront.
                      </p>
                    )}
                  </div>
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
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${kitMode === 'existing' ? 'border-brand-teal bg-brand-teal/5 font-bold' : 'border-gray-200 bg-white'
                  }`}
              >
                <h4 className="text-xs font-bold text-gray-900">Option A: Bundle Existing Catalog Products</h4>
                <p className="text-[11px] text-gray-500 mt-1">Pick products from catalog & set bundle discount.</p>
              </div>

              <div
                onClick={() => setKitMode('scratch')}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${kitMode === 'scratch' ? 'border-brand-teal bg-brand-teal/5 font-bold' : 'border-gray-200 bg-white'
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
              className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${(entryType === 'single' ? formData.paymentMethodAllowed : kitData.paymentMethodAllowed) === 'Both'
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
              className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${(entryType === 'single' ? formData.paymentMethodAllowed : kitData.paymentMethodAllowed) === 'Online_Only'
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
              className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${(entryType === 'single' ? formData.paymentMethodAllowed : kitData.paymentMethodAllowed) === 'COD_Only'
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


    </div>
  );
}
