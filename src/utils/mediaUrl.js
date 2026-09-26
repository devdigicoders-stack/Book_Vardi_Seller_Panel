export const getMediaUrl = (path) => {
  if (!path || typeof path !== 'string') return '';
  if (
    path.startsWith('data:') ||
    path.startsWith('blob:') ||
    path.startsWith('http://') ||
    path.startsWith('https://')
  ) {
    return path;
  }
  const backendBase = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');
  let cleanPath = path;
  if (!cleanPath.startsWith('/') && !cleanPath.startsWith('uploads/')) {
    cleanPath = `/uploads/documents/${cleanPath}`;
  } else if (!cleanPath.startsWith('/')) {
    cleanPath = `/${cleanPath}`;
  }
  return `${backendBase}${cleanPath}`;
};

export const resolveImageUrl = (url) => {
  if (!url) return '';
  if (typeof url === 'object') {
    url = url.url || url.dataUrl || url.src || '';
  }
  if (typeof url !== 'string' || !url.trim()) return '';
  const cleanUrl = url.trim();
  if (cleanUrl.startsWith('data:') || cleanUrl.startsWith('blob:') || cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
    return cleanUrl;
  }
  const backendBase = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');
  const cleanPath = cleanUrl.startsWith('/') ? cleanUrl : `/${cleanUrl}`;
  return `${backendBase}${cleanPath}`;
};

export const parseSizeVariants = (product) => {
  if (!product) return [];
  let raw = product.sizeVariants ?? product.variants ?? product.size_variants ?? product.sizes;
  let parsed = [];

  if (raw) {
    if (typeof raw === 'string') {
      try {
        raw = JSON.parse(raw);
      } catch {
        if (raw.includes(',')) {
          raw = raw.split(',').map(s => s.trim()).filter(Boolean);
        } else if (raw.trim()) {
          raw = [raw.trim()];
        } else {
          raw = [];
        }
      }
    }

    if (Array.isArray(raw)) {
      parsed = raw.map((v, idx) => {
        if (typeof v === 'string') {
          return {
            id: `var_${idx}_${v}`,
            size: v,
            measureScale: 'size',
            measureValue: v,
            price: Number(product?.price || 0),
            mrp: Number(product?.mrp || product?.originalPrice || 0),
            stock: Number(product?.stockQuantity ?? product?.stock ?? 0),
            stockQuantity: Number(product?.stockQuantity ?? product?.stock ?? 0),
            sku: product?.sku ? `${product.sku}-${v}` : `SKU-${idx + 1}`,
            image: product?.image || (Array.isArray(product?.images) ? product.images[0] : '') || '',
            images: Array.isArray(product?.images) && product.images.length > 0 ? product.images : (product?.image ? [product.image] : [])
          };
        }

        if (typeof v === 'object' && v !== null) {
          const rawImage = v.image || v.imageUrl || v.photo || v.url || (Array.isArray(v.images) && v.images[0]) || product?.image || (Array.isArray(product?.images) && product.images[0]) || '';
          let rawImages = Array.isArray(v.images) && v.images.length > 0 ? v.images : (rawImage ? [rawImage] : []);
          if (typeof rawImages === 'string') {
            try { rawImages = JSON.parse(rawImages); } catch { rawImages = [rawImages]; }
          }

          const sizeVal = String(v.size || v.measureValue || v.name || v.label || v.title || `Variant #${idx + 1}`);
          const priceVal = (v.price !== undefined && v.price !== null && !isNaN(Number(v.price)) && Number(v.price) >= 0)
            ? Number(v.price)
            : Number(product?.price || 0);

          const rawMrp = v.mrp ?? v.originalPrice ?? v.regularPrice ?? v.marketPrice;
          const mrpVal = (rawMrp !== undefined && rawMrp !== null && !isNaN(Number(rawMrp)) && Number(rawMrp) >= 0)
            ? Number(rawMrp)
            : (priceVal > 0 ? Math.round(priceVal * 1.25) : Number(product?.mrp || product?.originalPrice || 0));

          const stockVal = v.stock !== undefined ? Number(v.stock) : (v.stockQuantity !== undefined ? Number(v.stockQuantity) : Number(product?.stockQuantity ?? product?.stock ?? 0));

          return {
            ...v,
            id: v.id || v._id || `var_${idx}_${sizeVal}`,
            size: sizeVal,
            measureValue: sizeVal,
            measureScale: v.measureScale || v.scale || v.scaleUnit || 'size',
            price: priceVal,
            mrp: mrpVal,
            originalPrice: mrpVal,
            stock: stockVal,
            stockQuantity: stockVal,
            sku: v.sku || (product?.sku ? `${product.sku}-${sizeVal}` : `SKU-VAR-${idx + 1}`),
            image: rawImage,
            images: rawImages
          };
        }

        return null;
      }).filter(Boolean);
    }
  }

  // Prepend Base Product if product has variants and base price > 0, and base variant is not already present
  if (parsed.length > 0 && Number(product?.price || 0) > 0) {
    const hasBaseVariant = parsed.some(v => v.isBase || String(v.size || '').toLowerCase().includes('base'));
    if (!hasBaseVariant) {
      const baseMrp = Number(product.mrp || product.originalPrice || product.regularPrice || product.price || 0);
      const baseOption = {
        id: `base_option_${product._id || product.id || '0'}`,
        size: 'Base Product',
        measureScale: product.unit || 'unit',
        measureValue: 'Base Product',
        price: Number(product.price || 0),
        mrp: baseMrp > Number(product.price || 0) ? baseMrp : Number(product.price || 0),
        originalPrice: baseMrp > Number(product.price || 0) ? baseMrp : Number(product.price || 0),
        stock: Number(product.stockQuantity ?? product.stock ?? 0),
        stockQuantity: Number(product.stockQuantity ?? product.stock ?? 0),
        sku: product.sku || `SKU-BASE-${String(product._id || product.id || '').slice(-6).toUpperCase()}`,
        image: product.image || product.imageUrl || (Array.isArray(product.images) ? product.images[0] : '') || '',
        images: Array.isArray(product.images) && product.images.length > 0 ? product.images : (product.image ? [product.image] : []),
        isBase: true
      };
      parsed = [baseOption, ...parsed];
    }
  }

  return parsed;
};

export const getFileNameOnly = (pathOrName) => {
  if (!pathOrName || typeof pathOrName !== 'string') return '';
  if (pathOrName.startsWith('data:')) {
    if (pathOrName.startsWith('data:image/jpeg') || pathOrName.startsWith('data:image/jpg')) return 'address_proof_document.jpg';
    if (pathOrName.startsWith('data:image/png')) return 'address_proof_document.png';
    if (pathOrName.startsWith('data:image/webp')) return 'address_proof_document.webp';
    if (pathOrName.startsWith('data:image/')) return 'address_proof_image.png';
    return 'address_proof_document.pdf';
  }
  const clean = pathOrName.split('?')[0].replace(/\\/g, '/');
  const parts = clean.split('/');
  const filename = parts[parts.length - 1];
  return filename || pathOrName;
};
