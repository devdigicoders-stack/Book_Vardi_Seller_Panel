import React from 'react';
import { 
  TrendingUp, 
  BarChart3, 
  PieChart, 
  Calendar, 
  ArrowUpRight, 
  Users, 
  ShoppingBag, 
  Sparkles 
} from 'lucide-react';
import { useSellerData } from '../context/SellerDataContext';

export default function AnalyticsTab() {
  const { products, orders } = useSellerData();

  const totalSales = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const deliveredCount = orders.filter(o => o.status === 'Delivered').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-xs border border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="text-teal-700" size={24} /> Store Analytics & Insights
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Key metrics, category demand, school order velocity, and sales trends
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200 text-gray-700">
          <Calendar size={14} /> Last 30 Days
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <div className="text-[11px] font-semibold text-gray-500">Order Conversion Rate</div>
          <div className="text-2xl font-extrabold text-gray-900 mt-1">4.82%</div>
          <div className="text-[10px] text-emerald-600 font-medium mt-1">↑ +0.6% vs e-commerce benchmark</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <div className="text-[11px] font-semibold text-gray-500">Average Order Value (AOV)</div>
          <div className="text-2xl font-extrabold text-teal-800 mt-1">₹892</div>
          <div className="text-[10px] text-teal-700 mt-1">Driven by School Uniform bundles</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <div className="text-[11px] font-semibold text-gray-500">Fulfillment Success Rate</div>
          <div className="text-2xl font-extrabold text-emerald-700 mt-1">98.4%</div>
          <div className="text-[10px] text-emerald-600 mt-1">On-time delivery across metro hubs</div>
        </div>
      </div>

      {/* Visual breakdown cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-3">
          <h3 className="font-bold text-gray-900 text-sm">Top Performing Categories</h3>
          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>School Uniforms & Winter Sweaters</span>
                <span className="text-gray-900 font-bold">48% of sales</span>
              </div>
              <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-teal-700 h-full rounded-full" style={{ width: '48%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>NCERT Textbooks & Guides</span>
                <span className="text-gray-900 font-bold">28% of sales</span>
              </div>
              <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-emerald-600 h-full rounded-full" style={{ width: '28%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>Drawing & Art Kits</span>
                <span className="text-gray-900 font-bold">14% of sales</span>
              </div>
              <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: '14%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>Shoes & PT Footwear</span>
                <span className="text-gray-900 font-bold">10% of sales</span>
              </div>
              <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full rounded-full" style={{ width: '10%' }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-3">
          <h3 className="font-bold text-gray-900 text-sm">Top School Demand Hubs</h3>
          <div className="space-y-2.5 text-xs">
            <div className="p-3 bg-gray-50 rounded-xl flex items-center justify-between">
              <div>
                <div className="font-bold text-gray-900">Kendriya Vidyalaya Sangathan (Delhi NCR)</div>
                <div className="text-[11px] text-gray-500">238 Uniforms Sold</div>
              </div>
              <span className="font-extrabold text-teal-800">₹1,84,200</span>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl flex items-center justify-between">
              <div>
                <div className="font-bold text-gray-900">Delhi Public School (R.K. Puram & Sec 45)</div>
                <div className="text-[11px] text-gray-500">142 Sets Sold</div>
              </div>
              <span className="font-extrabold text-teal-800">₹94,600</span>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl flex items-center justify-between">
              <div>
                <div className="font-bold text-gray-900">The Mother’s International School</div>
                <div className="text-[11px] text-gray-500">98 Sets Sold</div>
              </div>
              <span className="font-extrabold text-teal-800">₹68,400</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
