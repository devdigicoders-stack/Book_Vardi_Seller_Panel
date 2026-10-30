import React, { useMemo } from 'react';
import { 
  BarChart3, 
  Calendar, 
  ShoppingBag, 
  Building2,
  PackageCheck
} from 'lucide-react';
import { useSellerData } from '../context/SellerDataContext';
import RevenuePerformanceWidget from './RevenuePerformanceWidget';

export default function AnalyticsTab() {
  const { products = [], orders = [], schoolOrders = [] } = useSellerData();

  // Metrics computation from pure DB state
  const totalSales = useMemo(() => {
    return orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  }, [orders]);

  const aov = useMemo(() => {
    return orders.length > 0 ? Math.round(totalSales / orders.length) : 0;
  }, [orders, totalSales]);

  const fulfilledCount = useMemo(() => {
    return orders.filter(o => o.status === 'Delivered' || o.status === 'Completed' || o.status === 'Shipped').length;
  }, [orders]);

  const fulfillmentRate = useMemo(() => {
    return orders.length > 0 ? ((fulfilledCount / orders.length) * 100).toFixed(1) : '0.0';
  }, [orders, fulfilledCount]);

  const conversionRate = useMemo(() => {
    if (orders.length === 0) return '0.00';
    const totalCatalogSkus = products.length || 1;
    return Math.min(100, (orders.length / (totalCatalogSkus * 3)) * 100).toFixed(2);
  }, [orders, products]);

  // Top Performing Categories computed dynamically
  const categoryStats = useMemo(() => {
    const catMap = {};
    let grandTotal = 0;

    orders.forEach(o => {
      if (Array.isArray(o.items) && o.items.length > 0) {
        o.items.forEach(item => {
          const cat = item.category || 'General Catalog';
          const itemRev = (Number(item.price) || 0) * (Number(item.quantity) || 1) || Number(o.total) || 0;
          catMap[cat] = (catMap[cat] || 0) + itemRev;
          grandTotal += itemRev;
        });
      } else {
        const cat = 'Storewide Orders';
        catMap[cat] = (catMap[cat] || 0) + (Number(o.total) || 0);
        grandTotal += Number(o.total) || 0;
      }
    });

    if (grandTotal === 0 && products.length > 0) {
      products.forEach(p => {
        const cat = p.category || 'Catalog Items';
        catMap[cat] = (catMap[cat] || 0) + 1;
        grandTotal += 1;
      });
    }

    if (grandTotal === 0) return [];

    const colors = ['bg-teal-700', 'bg-emerald-600', 'bg-amber-500', 'bg-blue-600', 'bg-purple-600'];

    return Object.entries(catMap)
      .map(([name, val], idx) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        percent: Math.round((val / grandTotal) * 100),
        color: colors[idx % colors.length]
      }))
      .sort((a, b) => b.percent - a.percent);
  }, [orders, products]);

  // Top School Demand Hubs computed dynamically
  const schoolDemandHubs = useMemo(() => {
    const schoolMap = {};

    orders.forEach(o => {
      const sch = o.school || (o.shippingAddress ? (typeof o.shippingAddress === 'string' ? o.shippingAddress.split(',')[0] : (o.shippingAddress.city || o.shippingAddress.name || null)) : null);
      if (!sch || sch === 'General Public') return;

      if (!schoolMap[sch]) {
        schoolMap[sch] = { name: sch, units: 0, revenue: 0 };
      }
      schoolMap[sch].units += o.itemsCount || (o.items?.length || 1);
      schoolMap[sch].revenue += Number(o.total) || 0;
    });

    schoolOrders.forEach(s => {
      const sch = s.schoolName || s.school || s.institution;
      if (!sch) return;

      if (!schoolMap[sch]) {
        schoolMap[sch] = { name: sch, units: 0, revenue: 0 };
      }
      schoolMap[sch].units += Number(s.quantity || s.units || 1);
      schoolMap[sch].revenue += Number(s.estimatedTotal || s.totalAmount || s.budget || 0);
    });

    return Object.values(schoolMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 4);
  }, [orders, schoolOrders]);

  return (
    <div className="space-y-6">
      
      {/* Analytics Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-xs border border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="text-teal-700" size={24} /> Store Analytics & Insights
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Key metrics, category demand, school order velocity, and sales trends from database
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200 text-gray-700">
          <Calendar size={14} /> Live DB Realtime
        </div>
      </div>

      {/* Top 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <div className="text-[11px] font-semibold text-gray-500 flex items-center justify-between">
            <span>Order Conversion Rate</span>
            <ShoppingBag size={15} className="text-gray-400" />
          </div>
          <div className="text-2xl font-extrabold text-gray-900 mt-1">{conversionRate}%</div>
          <div className="text-[10px] text-emerald-600 font-medium mt-1">
            {orders.length > 0 ? `${orders.length} total orders recorded` : '0 orders recorded in database'}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <div className="text-[11px] font-semibold text-gray-500 flex items-center justify-between">
            <span>Average Order Value (AOV)</span>
            <BarChart3 size={15} className="text-teal-700" />
          </div>
          <div className="text-2xl font-extrabold text-teal-800 mt-1">₹{aov.toLocaleString('en-IN')}</div>
          <div className="text-[10px] text-teal-700 mt-1">
            {orders.length > 0 ? `Calculated from ${orders.length} store sales` : 'No sales history recorded yet'}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <div className="text-[11px] font-semibold text-gray-500 flex items-center justify-between">
            <span>Fulfillment Success Rate</span>
            <PackageCheck size={15} className="text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-700 mt-1">{fulfillmentRate}%</div>
          <div className="text-[10px] text-emerald-600 mt-1">
            {orders.length > 0 ? `${fulfilledCount} of ${orders.length} orders fulfilled` : '0 orders fulfilled'}
          </div>
        </div>
      </div>

      {/* Dynamic Multi-Chart Widget */}
      <RevenuePerformanceWidget />

      {/* Visual Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Category Performance */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-3">
          <h3 className="font-bold text-gray-900 text-sm">Top Performing Categories</h3>
          {categoryStats.length === 0 ? (
            <p className="text-xs text-gray-500 py-4">No product category sales recorded in database yet.</p>
          ) : (
            <div className="space-y-3 text-xs">
              {categoryStats.map((cat) => (
                <div key={cat.name}>
                  <div className="flex justify-between font-semibold mb-1">
                    <span>{cat.name}</span>
                    <span className="text-gray-900 font-bold">{cat.percent}% of sales</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                    <div className={`${cat.color} h-full rounded-full`} style={{ width: `${cat.percent}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top School Demand Hubs */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-900 text-sm">Top School Demand Hubs</h3>
            <Building2 size={16} className="text-teal-700" />
          </div>
          {schoolDemandHubs.length === 0 ? (
            <p className="text-xs text-gray-500 py-4">No institutional school demand records found in database.</p>
          ) : (
            <div className="space-y-2.5 text-xs">
              {schoolDemandHubs.map((hub) => (
                <div key={hub.name} className="p-3 bg-gray-50 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="font-bold text-gray-900">{hub.name}</div>
                    <div className="text-[11px] text-gray-500">{hub.units} Units Sold</div>
                  </div>
                  <span className="font-extrabold text-teal-800">₹{hub.revenue.toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
