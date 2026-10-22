export const SELLER_TAB_ROUTE_MAP = {
  dashboard: '/dashboard',
  analytics: '/analytics',
  notifications: '/notifications',
  products: '/products',
  kits: '/kits',
  inventory: '/inventory',
  promotions: '/promotions',
  orders: '/orders',
  'school-orders': '/school-orders',
  customers: '/customers',
  profile: '/profile',
  finance: '/finance',
  shipping: '/shipping',
  reviews: '/reviews',
  settings: '/settings',
  support: '/support'
};

export const SELLER_ROUTE_TAB_MAP = {
  '/': 'dashboard',
  '/dashboard': 'dashboard',
  '/analytics': 'analytics',
  '/notifications': 'notifications',
  '/products': 'products',
  '/kits': 'kits',
  '/inventory': 'inventory',
  '/promotions': 'promotions',
  '/orders': 'orders',
  '/school-orders': 'school-orders',
  '/schoolorders': 'school-orders',
  '/customers': 'customers',
  '/profile': 'profile',
  '/finance': 'finance',
  '/shipping': 'shipping',
  '/reviews': 'reviews',
  '/settings': 'settings',
  '/support': 'support'
};

export const SELLER_ROUTE_PATHS = [
  'dashboard',
  'analytics',
  'notifications',
  'products',
  'kits',
  'inventory',
  'promotions',
  'orders',
  'school-orders',
  'customers',
  'profile',
  'finance',
  'shipping',
  'reviews',
  'settings',
  'support'
];

export const getTabFromPath = (pathname) => {
  if (!pathname) return 'dashboard';
  const clean = pathname.toLowerCase().replace(/\/+$/, '') || '/';
  return SELLER_ROUTE_TAB_MAP[clean] || 'dashboard';
};

export const getPathFromTab = (tabId) => {
  return SELLER_TAB_ROUTE_MAP[tabId] || `/${tabId}`;
};
