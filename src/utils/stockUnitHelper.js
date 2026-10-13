/**
 * Dynamic Product Stock Unit Helper
 * Formats and provides appropriate inventory stock units according to product nature:
 * - Unstitched cloth/fabric: 'Meters' / 'Mtr' (e.g. 329 Meters)
 * - Shoes / Footwear / Socks: 'Pairs' (e.g. 25 Pairs)
 * - Books / Notebooks: 'Books' / 'Sets' (e.g. 100 Books)
 * - Kits / Bundles: 'Sets' (e.g. 20 Sets)
 * - Boxes / Stationery Packs: 'Boxes' / 'Packs'
 * - Ready-to-wear / Uniforms: 'Pieces' / 'Pcs'
 */

export function getProductStockUnit(product = {}, variant = null, options = { short: false }) {
  if (!product && !variant) return options.short ? 'Pcs' : 'Pieces';

  // 1. If variant explicitly specifies a known unit or measureScale
  const vScale = variant?.measureScale || variant?.unit;
  if (vScale) {
    const s = String(vScale).toLowerCase().trim();
    if (s.includes('meter') || s === 'mtr' || s === 'm') return options.short ? 'Mtr' : 'Meters';
    if (s.includes('pair') || s === 'shoe') return 'Pairs';
    if (s.includes('box')) return 'Boxes';
    if (s.includes('pack') || s === 'packet') return 'Packs';
    if (s.includes('set')) return 'Sets';
    if (s.includes('kg') || s === 'kilogram') return 'Kg';
    if (s.includes('gram') || s === 'gm') return 'Grams';
    if (s.includes('book') || s === 'count') return 'Books';
  }

  // 2. Check if product is meter-based (Unstitched fabric/cloth)
  const isMeterBased = Boolean(
    product.isMeterBased === true ||
    product.isMeterBased === 'true' ||
    product.unit === 'meter' ||
    product.measureScale === 'meter' ||
    String(product.unit || '').toLowerCase().includes('meter')
  );
  if (isMeterBased) {
    return options.short ? 'Mtr' : 'Meters';
  }

  const cat = String(product.category || product.categoryName || '').toLowerCase().trim();
  const subCat = String(product.subCategory || '').toLowerCase().trim();
  const name = String(product.name || product.title || '').toLowerCase().trim();

  // 3. Unstitched cloth/fabric
  if (
    cat.includes('fabric') ||
    subCat.includes('unstitched') ||
    subCat.includes('fabric') ||
    name.includes('unstitched') ||
    name.includes('cloth material')
  ) {
    return options.short ? 'Mtr' : 'Meters';
  }

  // 4. Shoes / Footwear / Socks
  if (
    cat.includes('footwear') ||
    cat.includes('shoe') ||
    cat.includes('sock') ||
    subCat.includes('footwear') ||
    subCat.includes('shoe') ||
    subCat.includes('sock') ||
    name.includes('shoe') ||
    name.includes('boot') ||
    name.includes('sneaker') ||
    name.includes('sandal') ||
    name.includes('sock')
  ) {
    return 'Pairs';
  }

  // 5. Books, Notebooks, NCERT, Stationery
  if (
    cat.includes('book') ||
    cat.includes('ncert') ||
    cat.includes('notebook') ||
    cat.includes('practice') ||
    cat.includes('drawing')
  ) {
    if (subCat.includes('set') || subCat.includes('bundle') || name.includes('set') || name.includes('bundle') || product.bundleType === 'kit') {
      return 'Sets';
    }
    return 'Books';
  }

  // 6. Bundles / Kits
  if (product.bundleType === 'kit' || cat.includes('kit') || name.includes('kit') || name.includes('combo')) {
    return 'Sets';
  }

  // 7. Stationery packs / boxes
  if (cat.includes('stationery') || cat.includes('stationary')) {
    if (name.includes('box') || subCat.includes('box')) return 'Boxes';
    if (name.includes('pack') || subCat.includes('pack') || name.includes('packet')) return 'Packs';
    return options.short ? 'Pcs' : 'Pieces';
  }

  // 8. General Clothes / Uniforms / Ready to wear (Shirts, Trousers, Skirts, Blazers)
  if (
    cat.includes('uniform') ||
    cat.includes('apparel') ||
    cat.includes('shirt') ||
    cat.includes('pant') ||
    cat.includes('trouser') ||
    cat.includes('skirt') ||
    cat.includes('blazer') ||
    cat.includes('coat') ||
    cat.includes('sweater') ||
    cat.includes('rain') ||
    cat.includes('winter') ||
    cat.includes('sport')
  ) {
    return options.short ? 'Pcs' : 'Pieces';
  }

  if (product.unit && typeof product.unit === 'string' && product.unit.trim()) {
    const u = product.unit.trim();
    return u.charAt(0).toUpperCase() + u.slice(1);
  }

  return options.short ? 'Pcs' : 'Pieces';
}

export function formatStockQty(quantity, product = {}, variant = null, options = { short: false }) {
  const qty = Number(quantity);
  const safeQty = isNaN(qty) ? 0 : qty;
  const unit = getProductStockUnit(product, variant, options);
  return `${safeQty} ${unit}`;
}
