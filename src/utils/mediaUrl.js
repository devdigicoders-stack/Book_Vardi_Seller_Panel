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
  let raw = product.sizeVariants || product.variants || product.size_variants;
  if (!raw) return [];
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (Array.isArray(raw)) {
    return raw.map((v, idx) => {
      if (typeof v === 'string') {
        return {
          size: v,
          measureScale: 'size',
          measureValue: v,
          price: product?.price || 0,
          mrp: product?.mrp || product?.originalPrice || 0,
          stock: product?.stockQuantity || product?.stock || 0,
          image: product?.image || '',
          images: Array.isArray(product?.images) ? product.images : (product?.image ? [product.image] : [])
        };
      }
      const rawImage = v?.image || (Array.isArray(v?.images) && v.images[0]) || product?.image || '';
      const rawImages = Array.isArray(v?.images) && v.images.length > 0 ? v.images : (rawImage ? [rawImage] : []);
      return {
        ...v,
        size: v.size || v.measureValue || v.name || `Variant #${idx + 1}`,
        measureValue: v.measureValue || v.size || v.name || `Variant #${idx + 1}`,
        measureScale: v.measureScale || v.scale || 'size',
        price: v.price !== undefined ? v.price : (product?.price || 0),
        mrp: v.mrp !== undefined ? v.mrp : (v.originalPrice !== undefined ? v.originalPrice : (product?.mrp || product?.originalPrice || 0)),
        stock: v.stock !== undefined ? v.stock : (v.stockQuantity !== undefined ? v.stockQuantity : 0),
        image: rawImage,
        images: rawImages
      };
    });
  }
  return [];
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
