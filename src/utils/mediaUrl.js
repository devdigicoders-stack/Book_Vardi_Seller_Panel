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

export const dedupeImages = (imgList) => {
  if (!Array.isArray(imgList)) {
    if (typeof imgList === 'string' && imgList.trim()) return [imgList.trim()];
    return [];
  }
  const seen = new Set();
  const result = [];
  imgList.forEach(img => {
    if (!img) return;
    const raw = typeof img === 'string' ? img.trim() : (img.url || img.src || img.dataUrl || '');
    if (!raw) return;
    const resolved = resolveImageUrl(raw);
    const key = resolved || raw;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(raw);
    }
  });
  return result;
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
          const fallbackProductImg = product?.image || (Array.isArray(product?.images) && product.images[0]) || '';
          const fallbackUrl = fallbackProductImg ? resolveImageUrl(fallbackProductImg) : '';
          const isPlaceholder = (img) => !img || (typeof img === 'string' && img.includes('unsplash.com'));

          let rawImages = Array.isArray(v.images) && v.images.length > 0 ? v.images : (v.image ? [v.image] : []);
          if (typeof rawImages === 'string') {
            try { rawImages = JSON.parse(rawImages); } catch { rawImages = [rawImages]; }
          }
          if (!Array.isArray(rawImages)) rawImages = [rawImages];

          // Deduplicate and filter placeholders
          const seen = new Set();
          let cleanedImages = [];
          rawImages.forEach(img => {
            if (!img || isPlaceholder(img)) return;
            const resolved = resolveImageUrl(img);
            if (resolved && !seen.has(resolved)) {
              seen.add(resolved);
              cleanedImages.push(img);
            }
          });

          // If there are multiple images and one is the base product fallback, keep only custom variant images
          if (cleanedImages.length > 1 && fallbackUrl) {
            const customOnly = cleanedImages.filter(img => resolveImageUrl(img) !== fallbackUrl);
            if (customOnly.length > 0) {
              cleanedImages = customOnly;
            }
          }

          // If no variant image, fallback to base product image
          if (cleanedImages.length === 0 && fallbackProductImg && !isPlaceholder(fallbackProductImg)) {
            cleanedImages = [fallbackProductImg];
          }

          const rawImage = cleanedImages[0] || (v.image && !isPlaceholder(v.image) ? v.image : fallbackProductImg);

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
            images: cleanedImages
          };
        }

        return null;
      }).filter(Boolean);
    }
  }

  // Filter out any artificial / legacy "Base Product" options if other variants exist
  if (parsed.length > 1) {
    const withoutBase = parsed.filter(v => 
      !v.isBase && 
      String(v.size || '').trim().toLowerCase() !== 'base product' && 
      String(v.measureValue || '').trim().toLowerCase() !== 'base product' && 
      !String(v.id || '').startsWith('base_option_')
    );
    if (withoutBase.length > 0) {
      parsed = withoutBase;
    }
  } else if (parsed.length === 1) {
    const single = parsed[0];
    if (single.isBase || 
        String(single.size || '').trim().toLowerCase() === 'base product' || 
        String(single.measureValue || '').trim().toLowerCase() === 'base product' || 
        String(single.id || '').startsWith('base_option_')) {
      parsed = [];
    }
  }

  // Return parsed variants cleanly without prepending an artificial "Base Product" option
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
