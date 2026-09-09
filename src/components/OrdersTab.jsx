import React, { useState, useMemo } from 'react';
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  CheckCircle, 
  Truck, 
  Clock, 
  XCircle, 
  Eye, 
  Package, 
  Plus, 
  ArrowRight, 
  X, 
  MapPin, 
  Phone, 
  Mail, 
  CreditCard 
} from 'lucide-react';
import { useSellerData } from '../context/SellerDataContext';

const STATUS_CONFIG = {
  Pending: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', icon: Clock },
  Confirmed: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200', icon: CheckCircle },
  Packed: { bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-200', icon: Package },
  Shipped: { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200', icon: Truck },
  Delivered: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200', icon: CheckCircle },
  Cancelled: { bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200', icon: XCircle }
};

export default function OrdersTab() {
  const { orders, updateOrderStatus, addOrder, deleteOrder } = useSellerData();
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeOrderModal, setActiveOrderModal] = useState(null);
  const [isShipModalOpen, setIsShipModalOpen] = useState(false);
  const [shippingOrderId, setShippingOrderId] = useState(null);
  const [trackingNumberInput, setTrackingNumberInput] = useState('');
  const [courierInput, setCourierInput] = useState('Delhivery');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Manual order form
  const [manualForm, setManualForm] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    school: '',
    itemName: 'KV Uniform Set (Navy Blue)',
    price: 949,
    quantity: 1,
    size: 'L (38)',
    shippingAddress: ''
  });

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesStatus = selectedStatus === 'All' || order.status === selectedStatus;
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        order.id?.toLowerCase().includes(query) ||
        order.customerName?.toLowerCase().includes(query) ||
        order.school?.toLowerCase().includes(query) ||
        order.customerPhone?.toLowerCase().includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [orders, selectedStatus, searchQuery]);

  const handleOpenShipModal = (orderId) => {
    setShippingOrderId(orderId);
    setTrackingNumberInput(`TRACK-${Math.floor(100000 + Math.random() * 900000)}`);
    setIsShipModalOpen(true);
  };

  const handleConfirmShip = () => {
    if (shippingOrderId) {
      updateOrderStatus(shippingOrderId, 'Shipped');
      setIsShipModalOpen(false);
      setShippingOrderId(null);
    }
  };

  const handleCreateManualOrder = (e) => {
    e.preventDefault();
    if (!manualForm.customerName.trim() || !manualForm.price) return;

    addOrder({
      customerName: manualForm.customerName,
      customerEmail: manualForm.customerEmail || 'buyer@example.com',
      customerPhone: manualForm.customerPhone || '+91 98000 11111',
      school: manualForm.school || 'General Order',
      total: Number(manualForm.price) * Number(manualForm.quantity),
      status: 'Pending',
      paymentMethod: 'Cash on Delivery',
      paymentStatus: 'Pending',
      shippingAddress: manualForm.shippingAddress || 'Store Pickup',
      items: [
        {
          id: Date.now(),
          name: manualForm.itemName,
          price: Number(manualForm.price),
          quantity: Number(manualForm.quantity),
          size: manualForm.size
        }
      ]
    });

    setIsCreateModalOpen(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-xs border border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <ShoppingBag className="text-teal-700" size={24} /> Customer Orders
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage student & parent orders, confirm shipments, and track fulfillment
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
        >
          <Plus size={16} /> Create Manual Order
        </button>
      </div>

      {/* KPI Status Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {['All', 'Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'].map((st) => {
          const count = st === 'All' ? orders.length : orders.filter(o => o.status === st).length;
          const isSelected = selectedStatus === st;
          return (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                isSelected
                  ? 'bg-teal-800 text-white border-teal-800 shadow-xs'
                  : 'bg-white text-gray-700 border-gray-100 hover:border-gray-200'
              }`}
            >
              <div className="text-[11px] font-medium opacity-80">{st} Orders</div>
              <div className="text-xl font-extrabold mt-1">{count}</div>
            </button>
          );
        })}
      </div>

      {/* Search & Filter */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-100">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by Order ID (e.g. ORD-2026), Customer Name, Phone, or School..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-teal-600"
          />
        </div>
      </div>

      {/* Orders List / Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-600 uppercase font-semibold tracking-wider border-b border-gray-100">
              <tr>
                <th className="py-3 px-4">Order ID & Date</th>
                <th className="py-3 px-3">Customer & School</th>
                <th className="py-3 px-3">Items</th>
                <th className="py-3 px-3">Total Amount</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-gray-500">
                    <ShoppingBag size={40} className="mx-auto text-gray-300 mb-2" />
                    No orders found matching the filter.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => {
                  const conf = STATUS_CONFIG[o.status] || STATUS_CONFIG.Pending;
                  const Icon = conf.icon;

                  return (
                    <tr key={o.id} className="hover:bg-gray-50/70 transition-colors">
                      
                      {/* ID & Date */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-gray-900 font-mono">{o.id}</div>
                        <div className="text-[11px] text-gray-500 mt-0.5">{o.date}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">{o.paymentMethod}</div>
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-gray-900">{o.customerName}</div>
                        <div className="text-[11px] text-teal-800 mt-0.5">{o.school}</div>
                        <div className="text-[10px] text-gray-500">{o.customerPhone}</div>
                      </td>

                      {/* Items */}
                      <td className="py-3.5 px-3">
                        <div className="font-medium text-gray-800">
                          {o.items?.length > 0 ? o.items[0].name : `${o.itemsCount || 1} item(s)`}
                        </div>
                        {o.items?.length > 1 && (
                          <div className="text-[10px] text-gray-500 mt-0.5">
                            +{o.items.length - 1} other item(s)
                          </div>
                        )}
                      </td>

                      {/* Total */}
                      <td className="py-3.5 px-3">
                        <div className="font-extrabold text-gray-900 text-sm">₹{o.total}</div>
                        <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          o.paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {o.paymentStatus || 'Paid'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${conf.bg} ${conf.text} ${conf.border}`}>
                          <Icon size={12} /> {o.status}
                        </span>
                      </td>

                      {/* Action buttons */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          
                          <button
                            onClick={() => setActiveOrderModal(o)}
                            className="p-1.5 text-gray-500 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors"
                            title="View Full Order Details"
                          >
                            <Eye size={15} />
                          </button>

                          {o.status === 'Pending' && (
                            <button
                              onClick={() => updateOrderStatus(o.id, 'Confirmed')}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold rounded-lg shadow-xs"
                            >
                              Confirm
                            </button>
                          )}

                          {o.status === 'Confirmed' && (
                            <button
                              onClick={() => handleOpenShipModal(o.id)}
                              className="px-2.5 py-1 bg-purple-700 hover:bg-purple-800 text-white text-[11px] font-semibold rounded-lg shadow-xs flex items-center gap-1"
                            >
                              <Truck size={12} /> Pack & Ship
                            </button>
                          )}

                          {o.status === 'Shipped' && (
                            <button
                              onClick={() => updateOrderStatus(o.id, 'Delivered')}
                              className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-semibold rounded-lg shadow-xs"
                            >
                              Mark Delivered
                            </button>
                          )}

                          {o.status !== 'Cancelled' && o.status !== 'Delivered' && (
                            <button
                              onClick={() => updateOrderStatus(o.id, 'Cancelled')}
                              className="px-2 py-1 text-gray-400 hover:text-rose-600 text-[11px] rounded-lg hover:bg-rose-50"
                              title="Cancel Order"
                            >
                              Cancel
                            </button>
                          )}

                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal */}
      {activeOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200 text-xs">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <div>
                <h3 className="font-bold text-gray-900 text-base">Order Details #{activeOrderModal.id}</h3>
                <p className="text-[11px] text-gray-500">Placed on {activeOrderModal.date}</p>
              </div>
              <button
                onClick={() => setActiveOrderModal(null)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              
              {/* Customer Box */}
              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 space-y-1.5">
                <div className="font-bold text-gray-900 text-sm">{activeOrderModal.customerName}</div>
                <div className="flex items-center gap-1 text-gray-600"><Phone size={13} /> {activeOrderModal.customerPhone}</div>
                <div className="flex items-center gap-1 text-gray-600"><Mail size={13} /> {activeOrderModal.customerEmail}</div>
                <div className="flex items-start gap-1 text-gray-600 pt-1 border-t border-gray-200 mt-1">
                  <MapPin size={13} className="shrink-0 mt-0.5" />
                  <span>{activeOrderModal.shippingAddress}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <div className="font-bold text-gray-700">Ordered Items ({activeOrderModal.items?.length || 1})</div>
                <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
                  {activeOrderModal.items?.map((item, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between gap-3 bg-white">
                      <div className="flex items-center gap-2.5">
                        {item.image && (
                          <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover border border-gray-100" />
                        )}
                        <div>
                          <div className="font-semibold text-gray-900">{item.name}</div>
                          <div className="text-[10px] text-gray-500">Qty: {item.quantity} {item.size ? `• Size: ${item.size}` : ''}</div>
                        </div>
                      </div>
                      <div className="font-bold text-gray-900">₹{(item.price * item.quantity)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="p-3.5 bg-teal-50/50 rounded-xl border border-teal-100 flex items-center justify-between">
                <div>
                  <div className="font-bold text-teal-950">Total Payable</div>
                  <div className="text-[10px] text-teal-700">{activeOrderModal.paymentMethod} • {activeOrderModal.paymentStatus}</div>
                </div>
                <div className="text-lg font-extrabold text-teal-900">₹{activeOrderModal.total}</div>
              </div>

              {activeOrderModal.trackingNumber && (
                <div className="text-center p-2.5 rounded-xl border border-gray-200 font-mono text-[11px] text-gray-600">
                  Tracking No: <span className="font-bold text-gray-900">{activeOrderModal.trackingNumber}</span>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Ship & Dispatch Modal */}
      {isShipModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-xs space-y-4">
            <h4 className="font-bold text-gray-900 text-base flex items-center gap-2">
              <Truck className="text-purple-700" size={20} /> Pack & Dispatch Order
            </h4>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="font-semibold text-gray-700">Courier Partner</label>
                <select
                  value={courierInput}
                  onChange={(e) => setCourierInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none"
                >
                  <option value="Delhivery">Delhivery Express</option>
                  <option value="BlueDart">BlueDart Air Premium</option>
                  <option value="Ekart">Ekart Logistics</option>
                  <option value="DTDC">DTDC Courier</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-gray-700">Tracking AWB Number</label>
                <input
                  type="text"
                  value={trackingNumberInput}
                  onChange={(e) => setTrackingNumberInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 font-mono"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsShipModalOpen(false)}
                className="flex-1 py-2 font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmShip}
                className="flex-1 py-2 font-semibold text-white bg-purple-700 hover:bg-purple-800 rounded-xl shadow-xs"
              >
                Confirm Dispatch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Order Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 text-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h4 className="font-bold text-gray-900 text-base">Create Manual / Counter Order</h4>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateManualOrder} className="space-y-3">
              <div className="space-y-1">
                <label className="font-semibold text-gray-700">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  value={manualForm.customerName}
                  onChange={(e) => setManualForm({ ...manualForm, customerName: e.target.value })}
                  placeholder="e.g. Sumanth Rao"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Phone</label>
                  <input
                    type="text"
                    value={manualForm.customerPhone}
                    onChange={(e) => setManualForm({ ...manualForm, customerPhone: e.target.value })}
                    placeholder="+91 98..."
                    className="w-full px-3 py-2 rounded-xl border border-gray-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">School</label>
                  <input
                    type="text"
                    value={manualForm.school}
                    onChange={(e) => setManualForm({ ...manualForm, school: e.target.value })}
                    placeholder="DPS / KV / Modern School"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-gray-700">Item Description</label>
                <input
                  type="text"
                  value={manualForm.itemName}
                  onChange={(e) => setManualForm({ ...manualForm, itemName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Price (₹)</label>
                  <input
                    type="number"
                    min="1"
                    value={manualForm.price}
                    onChange={(e) => setManualForm({ ...manualForm, price: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Qty</label>
                  <input
                    type="number"
                    min="1"
                    value={manualForm.quantity}
                    onChange={(e) => setManualForm({ ...manualForm, quantity: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Size</label>
                  <input
                    type="text"
                    value={manualForm.size}
                    onChange={(e) => setManualForm({ ...manualForm, size: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-gray-700">Delivery Address</label>
                <input
                  type="text"
                  value={manualForm.shippingAddress}
                  onChange={(e) => setManualForm({ ...manualForm, shippingAddress: e.target.value })}
                  placeholder="Address or Campus Room"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 py-2 font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-xs"
                >
                  Create Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
