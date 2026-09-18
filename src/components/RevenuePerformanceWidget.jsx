import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  PieChart, 
  Layers, 
  ArrowUpRight,
  Package
} from 'lucide-react';
import { useSellerData } from '../context/SellerDataContext';

export default function RevenuePerformanceWidget() {
  const { products = [], orders = [] } = useSellerData();

  // Controls state
  const [chartType, setChartType] = useState('bar'); // 'bar' | 'line' | 'donut' | 'volume'
  const [dateRange, setDateRange] = useState('7d'); // 'today' | '7d' | '30d' | 'this_month' | 'custom'
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProductId, setSelectedProductId] = useState('all');
  const [startDate, setStartDate] = useState(() => new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Extract unique categories dynamically from catalog products & orders
  const availableCategories = useMemo(() => {
    const set = new Set();
    products.forEach(p => {
      if (p.category) set.add(p.category);
    });
    orders.forEach(o => {
      o.items?.forEach(i => {
        if (i.category) set.add(i.category);
      });
    });
    return Array.from(set);
  }, [products, orders]);

  // Filter orders according to category and product scope
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      // Product item scope
      if (selectedProductId !== 'all') {
        const hasProd = o.items?.some(item => String(item.id || item.productId) === String(selectedProductId));
        if (!hasProd) return false;
      }

      // Category scope
      if (selectedCategory !== 'all') {
        const hasCat = o.items?.some(item => (item.category || '').toLowerCase() === selectedCategory.toLowerCase());
        if (!hasCat) {
          const matchInCatalog = products.some(p => p.category?.toLowerCase() === selectedCategory.toLowerCase() && o.items?.some(i => i.name === p.name));
          if (!matchInCatalog) return false;
        }
      }

      // Date range filter
      if (o.date || o.createdAt) {
        const orderTime = new Date(o.date || o.createdAt).getTime();
        const now = Date.now();

        if (dateRange === 'today') {
          const isToday = new Date(orderTime).toDateString() === new Date().toDateString();
          if (!isToday && !isNaN(orderTime)) return false;
        } else if (dateRange === '7d') {
          if (!isNaN(orderTime) && now - orderTime > 7 * 86400000) return false;
        } else if (dateRange === '30d') {
          if (!isNaN(orderTime) && now - orderTime > 30 * 86400000) return false;
        } else if (dateRange === 'custom' && startDate && endDate) {
          const startMs = new Date(startDate).getTime();
          const endMs = new Date(endDate).getTime() + 86400000;
          if (!isNaN(orderTime) && (orderTime < startMs || orderTime > endMs)) return false;
        }
      }

      return true;
    });
  }, [orders, products, selectedCategory, selectedProductId, dateRange, startDate, endDate]);

  // Compute dynamic timeline points directly from filteredOrders
  const chartData = useMemo(() => {
    let slots = [];
    if (dateRange === 'today') {
      slots = [
        { label: '09:00 AM', hourStart: 0, hourEnd: 11 },
        { label: '12:00 PM', hourStart: 11, hourEnd: 14 },
        { label: '03:00 PM', hourStart: 14, hourEnd: 17 },
        { label: '06:00 PM', hourStart: 17, hourEnd: 20 },
        { label: '09:00 PM', hourStart: 20, hourEnd: 24 }
      ];
    } else if (dateRange === '30d' || dateRange === 'this_month') {
      slots = [
        { label: 'Week 1', weekNum: 1 },
        { label: 'Week 2', weekNum: 2 },
        { label: 'Week 3', weekNum: 3 },
        { label: 'Week 4', weekNum: 4 }
      ];
    } else {
      // 7 Days
      slots = [
        { label: 'Mon', dayIndex: 1 },
        { label: 'Tue', dayIndex: 2 },
        { label: 'Wed', dayIndex: 3 },
        { label: 'Thu', dayIndex: 4 },
        { label: 'Fri', dayIndex: 5 },
        { label: 'Sat', dayIndex: 6 },
        { label: 'Sun', dayIndex: 0 }
      ];
    }

    return slots.map(slot => {
      let rev = 0;
      let val = 0;

      filteredOrders.forEach(o => {
        const orderDate = new Date(o.date || o.createdAt || Date.now());
        const orderTotal = Number(o.total) || 0;
        const orderItemsCount = o.itemsCount || (o.items?.length || 1);

        if (dateRange === 'today') {
          const h = orderDate.getHours();
          if (h >= slot.hourStart && h < slot.hourEnd) {
            rev += orderTotal;
            val += orderItemsCount;
          }
        } else if (dateRange === '30d' || dateRange === 'this_month') {
          const dateOfMonth = orderDate.getDate();
          const w = Math.min(4, Math.ceil(dateOfMonth / 7));
          if (w === slot.weekNum) {
            rev += orderTotal;
            val += orderItemsCount;
          }
        } else {
          const d = orderDate.getDay();
          if (d === slot.dayIndex) {
            rev += orderTotal;
            val += orderItemsCount;
          }
        }
      });

      return {
        label: slot.label,
        rev,
        val
      };
    });
  }, [dateRange, filteredOrders]);

  // Compute category distribution dynamically from live database
  const categoryDistribution = useMemo(() => {
    const catMap = {};
    let totalCatRev = 0;

    filteredOrders.forEach(o => {
      if (Array.isArray(o.items) && o.items.length > 0) {
        o.items.forEach(item => {
          const cat = item.category || 'General';
          const itemRev = (Number(item.price) || 0) * (Number(item.quantity) || 1) || (Number(o.total) || 0);
          catMap[cat] = (catMap[cat] || 0) + itemRev;
          totalCatRev += itemRev;
        });
      } else {
        const cat = 'General Store Sales';
        catMap[cat] = (catMap[cat] || 0) + (Number(o.total) || 0);
        totalCatRev += Number(o.total) || 0;
      }
    });

    if (totalCatRev === 0 && products.length > 0) {
      products.forEach(p => {
        const cat = p.category || 'General Catalog';
        catMap[cat] = (catMap[cat] || 0) + 1;
        totalCatRev += 1;
      });
    }

    if (totalCatRev === 0) return [];

    const colors = [
      'bg-brand-teal text-brand-teal border-brand-teal',
      'bg-emerald-600 text-emerald-600 border-emerald-600',
      'bg-amber-500 text-amber-500 border-amber-500',
      'bg-blue-600 text-blue-600 border-blue-600',
      'bg-purple-600 text-purple-600 border-purple-600'
    ];

    return Object.entries(catMap).map(([name, val], i) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      percent: Math.round((val / totalCatRev) * 100),
      color: colors[i % colors.length]
    })).sort((a, b) => b.percent - a.percent);
  }, [filteredOrders, products]);

  const totalFilteredRev = chartData.reduce((acc, c) => acc + c.rev, 0);
  const maxSlotRev = Math.max(...chartData.map(c => c.rev), 1);
  const peakSlot = useMemo(() => {
    if (totalFilteredRev === 0) return null;
    return chartData.reduce((max, d) => d.rev > max.rev ? d : max, chartData[0]);
  }, [chartData, totalFilteredRev]);

  const avgItemsPerOrder = useMemo(() => {
    if (filteredOrders.length === 0) return 0;
    const totalItems = filteredOrders.reduce((sum, o) => sum + (o.itemsCount || o.items?.length || 1), 0);
    return (totalItems / filteredOrders.length).toFixed(1);
  }, [filteredOrders]);

  // Dynamic product scope filtered by selected category
  const scopedProducts = useMemo(() => {
    if (selectedCategory === 'all') return products;
    return products.filter(p => (p.category || '').toLowerCase() === selectedCategory.toLowerCase());
  }, [products, selectedCategory]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs space-y-5">
      
      {/* Top Header & Chart Controls */}
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-display text-lg font-bold text-brand-teal flex items-center gap-2">
              <BarChart3 className="text-teal-700" size={20} /> Revenue Performance & Sales Analytics
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
              Live DB State
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Switch chart view modes, filter by date ranges, or inspect specific product categories
          </p>
        </div>

        {/* Chart View Switcher */}
        <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl shrink-0">
          <button
            type="button"
            onClick={() => setChartType('bar')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              chartType === 'bar' ? 'bg-white text-brand-teal shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <BarChart3 size={14} /> Bar
          </button>

          <button
            type="button"
            onClick={() => setChartType('line')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              chartType === 'line' ? 'bg-white text-brand-teal shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <TrendingUp size={14} /> Line Trend
          </button>

          <button
            type="button"
            onClick={() => setChartType('donut')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              chartType === 'donut' ? 'bg-white text-brand-teal shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <PieChart size={14} /> Donut
          </button>

          <button
            type="button"
            onClick={() => setChartType('volume')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              chartType === 'volume' ? 'bg-white text-brand-teal shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Layers size={14} /> Volume
          </button>
        </div>
      </div>

      {/* Range Selection Options Bar (Date Range & Product Filters) */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-3 bg-gray-50/80 p-3.5 rounded-2xl border border-gray-100 text-xs">
        
        {/* Date Range Selector */}
        <div>
          <label className="block text-[11px] font-bold text-gray-700 mb-1">Date Range *</label>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white font-semibold text-gray-800 focus:ring-1 focus:ring-teal-600 cursor-pointer"
          >
            <option value="today">Today (Live 24h)</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="this_month">This Month</option>
            <option value="custom">Custom Date Range</option>
          </select>
        </div>

        {/* Product Category Filter */}
        <div>
          <label className="block text-[11px] font-bold text-gray-700 mb-1">Product Category *</label>
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setSelectedProductId('all');
            }}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white font-semibold text-gray-800 focus:ring-1 focus:ring-teal-600 cursor-pointer"
          >
            <option value="all">
              {availableCategories.length > 0 ? `All Categories (${availableCategories.length} Active)` : 'All Categories (Storewide)'}
            </option>
            {availableCategories.map(cat => (
              <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
            ))}
          </select>
        </div>

        {/* Specific Product Catalog Item Filter */}
        <div>
          <label className="block text-[11px] font-bold text-gray-700 mb-1">Specific Catalog Item</label>
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white font-semibold text-gray-800 focus:ring-1 focus:ring-teal-600 cursor-pointer"
          >
            <option value="all">
              {scopedProducts.length > 0 ? `All Products Scope (${scopedProducts.length} Items)` : 'No Items in Catalog'}
            </option>
            {scopedProducts.map(p => (
              <option key={p.id || p._id} value={p.id || p._id}>{p.name} (₹{p.price})</option>
            ))}
          </select>
        </div>

        {/* Custom Date Inputs if 'custom' is chosen */}
        {dateRange === 'custom' ? (
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-2 py-1.5 rounded-xl border border-gray-200 bg-white text-[11px]"
              />
            </div>
            <div className="flex-1">
              <label className="block text-[11px] font-bold text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-2 py-1.5 rounded-xl border border-gray-200 bg-white text-[11px]"
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-gray-200">
            <div>
              <span className="text-[10px] text-gray-400 uppercase font-extrabold block">Selected Scope Revenue</span>
              <span className="font-extrabold text-sm text-teal-900">₹{totalFilteredRev.toLocaleString('en-IN')}</span>
            </div>
            <ArrowUpRight size={18} className="text-emerald-600" />
          </div>
        )}

      </div>

      {/* Main Chart Canvas Area */}
      <div className="pt-2">
        
        {/* 1. BAR CHART */}
        {chartType === 'bar' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
              <span>Gross Sales Trajectory</span>
              <span className="font-bold text-teal-800">
                {peakSlot ? `Peak Period: ${peakSlot.label} (₹${peakSlot.rev.toLocaleString('en-IN')})` : 'No revenue records in scope'}
              </span>
            </div>
            <div className="flex h-52 items-end gap-2 sm:gap-4 pt-6 pb-2">
              {chartData.map((d) => {
                const heightPercent = maxSlotRev > 0 ? (d.rev / maxSlotRev) * 100 : 0;
                return (
                  <div key={d.label} className="flex flex-1 flex-col items-center gap-2 group">
                    <div className="flex h-44 w-full items-end justify-center relative">
                      <div
                        className={`w-full max-w-[42px] rounded-t-xl transition-all duration-300 relative ${
                          d.rev > 0 ? 'bg-brand-teal group-hover:bg-brand-yellow' : 'bg-gray-200'
                        }`}
                        style={{ height: `${d.rev > 0 ? Math.max(10, heightPercent) : 4}%` }}
                      >
                        <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap transition-opacity pointer-events-none z-20 shadow-md">
                          ₹{d.rev.toLocaleString('en-IN')} ({d.val} items)
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-gray-600">{d.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. LINE TREND CHART */}
        {chartType === 'line' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Smooth Revenue Trend Line</span>
              <span className="font-bold text-emerald-600">
                {filteredOrders.length > 0 ? `${filteredOrders.length} active orders recorded` : '0 orders in range'}
              </span>
            </div>
            <div className="h-52 w-full relative flex items-center justify-center bg-teal-50/30 rounded-2xl p-4 border border-teal-100">
              {totalFilteredRev === 0 ? (
                <div className="text-center text-xs text-gray-500 font-medium">
                  No sales recorded in database for this range.
                </div>
              ) : (
                <svg className="w-full h-full overflow-visible" viewBox="0 0 500 150">
                  <defs>
                    <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0f766e" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#0f766e" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 0 110 Q 80 40, 160 80 T 320 30 T 500 60 L 500 150 L 0 150 Z"
                    fill="url(#lineGrad)"
                  />
                  <path
                    d="M 0 110 Q 80 40, 160 80 T 320 30 T 500 60"
                    fill="none"
                    stroke="#0f766e"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                  {[
                    [0, 110], [80, 40], [160, 80], [240, 50], [320, 30], [400, 70], [500, 60]
                  ].map(([x, y], idx) => (
                    <circle key={idx} cx={x} cy={y} r="5" className="fill-brand-yellow stroke-brand-teal stroke-2" />
                  ))}
                </svg>
              )}
            </div>
          </div>
        )}

        {/* 3. DONUT CHART */}
        {chartType === 'donut' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="flex items-center justify-center p-4">
              <div className="relative w-44 h-44 rounded-full border-[18px] border-teal-700 flex items-center justify-center shadow-inner">
                <div className="text-center">
                  <div className="text-[10px] uppercase tracking-wider text-gray-400 font-extrabold">Top Category</div>
                  <div className="text-lg font-extrabold text-teal-900 mt-0.5 truncate max-w-[110px]">
                    {categoryDistribution[0]?.name || 'N/A'}
                  </div>
                  <div className="text-xs font-bold text-emerald-600">
                    {categoryDistribution[0]?.percent || 0}% Share
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <h4 className="font-bold text-gray-900">Category Revenue Split</h4>
              {categoryDistribution.length === 0 ? (
                <p className="text-gray-500 text-xs">No category data recorded in database yet.</p>
              ) : (
                categoryDistribution.map((cat) => (
                  <div key={cat.name} className="space-y-1">
                    <div className="flex justify-between font-semibold">
                      <span>{cat.name}</span>
                      <span className="font-bold text-gray-900">{cat.percent}%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                      <div className={`${cat.color.split(' ')[0]} h-full rounded-full`} style={{ width: `${cat.percent}%` }} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 4. STACKED VOLUME CHART */}
        {chartType === 'volume' && (
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between text-gray-500">
              <span>Order Units Sold vs Revenue Ratio</span>
              <span className="font-bold text-teal-800">Avg {avgItemsPerOrder} items / order</span>
            </div>
            <div className="space-y-3">
              {chartData.map((d) => (
                <div key={d.label} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-gray-800">{d.label}</span>
                    <span className="font-mono text-gray-600">{d.val} Units • ₹{d.rev.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="w-full bg-gray-100 h-3 rounded-xl overflow-hidden flex">
                    <div className="bg-teal-700 h-full transition-all" style={{ width: `${Math.min(100, d.val * 10)}%` }} title="Units Volume" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
