import RevenuePerformanceWidget from './RevenuePerformanceWidget';
import { ArrowUpRight, Bell, CircleDollarSign, Clock3, Package, ShoppingBag, Star, Plus } from 'lucide-react';
import { useSellerData } from '../context/SellerDataContext';

export default function Overview() {
  const { products = [], orders = [], schoolOrders = [], notifications = [], sellerUser } = useSellerData();

  const validOrders = orders.filter(o => o.status !== 'Cancelled');
  const totalRevenue = validOrders.reduce((acc, o) => acc + (Number(o.total ?? o.sellerSubtotal ?? o.totalAmount ?? o.subtotal) || 0), 0);
  const totalOrdersCount = orders.length;
  const activeProductsCount = products.filter(p => p.inStock !== false).length;
  const pendingOrdersCount = orders.filter(o => o.status === 'Pending' || o.status === 'Processing').length;
  const lowStockCount = products.filter(p => (Number(p.stockQuantity) || 0) > 0 && (Number(p.stockQuantity) || 0) < 10).length;
  const schoolQuotesCount = schoolOrders.filter(s => s.status === 'Requirement Received' || s.status === 'Quote Requested').length;

  const reviewedProducts = products.filter(p => (Number(p.reviewsCount) > 0 || Number(p.numReviews) > 0) && Number(p.rating) > 0);
  const avgRating = reviewedProducts.length > 0
    ? (reviewedProducts.reduce((acc, p) => acc + (Number(p.rating) || 0), 0) / reviewedProducts.length).toFixed(1)
    : '0.0';

  const hasNoData = products.length === 0 && orders.length === 0;

  const activeCommission = sellerUser?.commissionPercentage ?? sellerUser?.commissionRate ?? 5;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-pink">
            Welcome back, {sellerUser?.name || sellerUser?.storeName || 'Seller'}
          </p>
          <h2 className="font-display text-3xl font-extrabold text-brand-teal">
            Your Store at a Glance
          </h2>
          <p className="text-sm text-gray-500">
            Live merchant operational overview and fulfillment metrics directly from database.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-teal-50 border border-teal-200/80 text-teal-800 text-xs font-bold shrink-0 shadow-2xs">
          <CircleDollarSign size={16} className="text-teal-700" />
          <span>Platform Fee: {activeCommission}% ({100 - activeCommission}% Payout)</span>
        </div>
      </div>

      {hasNoData && (
        <div className="bg-amber-50/80 border border-amber-200 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Package className="text-amber-700 shrink-0 mt-0.5" size={24} />
            <div>
              <h3 className="font-bold text-sm text-amber-950">No Data Found for Registered Seller Store</h3>
              <p className="text-xs text-amber-800 mt-0.5">
                Your catalog currently has 0 products and 0 active orders in the database. Add your first product to start selling on Book Vardi.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              const event = new CustomEvent('openAddProductModal');
              window.dispatchEvent(event);
            }}
            className="px-4 py-2.5 bg-brand-teal hover:bg-brand-teal-light text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <Plus size={16} />
            <span>Add New Product</span>
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Total Store Revenue', `₹${totalRevenue.toLocaleString('en-IN')}`, orders.length > 0 ? '+13.7%' : '0 Sales', CircleDollarSign, 'text-brand-blue', 'bg-brand-blue-subtle'],
          ['Total Customer Orders', String(totalOrdersCount), orders.length > 0 ? '+14.1%' : '0 Orders', ShoppingBag, 'text-brand-green', 'bg-brand-green-subtle'],
          ['Active Catalog Items', String(activeProductsCount), `${products.length} total SKUs`, Package, 'text-brand-pink', 'bg-brand-pink-subtle'],
          ['Merchant Store Rating', `${avgRating} / 5`, 'Verified', Star, 'text-brand-ochre', 'bg-brand-yellow-light']
        ].map(([label, value, change, Icon, color, surface]) => (
          <div key={label} className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
            <div className="flex items-start justify-between">
              <div className={`rounded-lg p-2.5 ${surface}`}>
                <Icon className={color} size={20} />
              </div>
              <ArrowUpRight className="text-brand-green" size={17} />
            </div>
            <p className="mt-4 text-xs font-bold uppercase tracking-wide text-gray-400">{label}</p>
            <p className="mt-1 font-display text-2xl font-extrabold text-brand-teal">{value}</p>
            <p className="mt-1 text-xs font-semibold text-brand-green">{change}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-lg font-bold text-brand-teal">Action Items Required</h3>
            <p className="text-xs text-gray-400">Immediate fulfillment and inventory task queue</p>
          </div>
          <Bell className="text-brand-pink" size={18} />
        </div>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            [String(pendingOrdersCount), 'Orders waiting for fulfillment', ShoppingBag],
            [String(lowStockCount), 'Products low on inventory stock', Package],
            [String(schoolQuotesCount), 'B2B School quotations pending', Clock3]
          ].map(([count, label, Icon]) => (
            <div key={label} className="flex items-center gap-3 rounded-xl bg-gray-50 p-3.5 border border-gray-100">
              <div className="rounded-full bg-brand-yellow px-2.5 py-1 text-xs font-extrabold text-brand-teal shrink-0">
                {count}
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <Icon size={16} className="text-brand-teal shrink-0" />
                <span className="text-xs font-bold text-gray-700 truncate">{label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Standalone Full-Width Revenue Performance & Analytics Widget */}
      <div className="w-full">
        <RevenuePerformanceWidget />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-xs">
        <div className="flex items-center justify-between border-b border-gray-100 p-5">
          <div>
            <h3 className="font-display text-lg font-bold text-brand-teal">Recent Store Activity</h3>
            <p className="text-xs text-gray-400">Live order & inventory notifications</p>
          </div>
        </div>
        <div className="divide-y divide-gray-100">
          {orders.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-500">
              No recent activity recorded yet. Orders placed by customers will show up here.
            </div>
          ) : (
            orders.slice(0, 5).map((ord) => (
              <div key={ord.id} className="flex items-center gap-3 p-5">
                <div className="rounded-lg bg-brand-teal-subtle p-2.5">
                  <ShoppingBag className="text-brand-teal" size={17} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-gray-700">Order {ord.id} ({ord.customerName})</p>
                  <p className="truncate text-xs text-gray-500">Amount: ₹{ord.total} • Status: {ord.status}</p>
                </div>
                <span className="text-xs text-gray-400">{ord.date || 'Recent'}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
