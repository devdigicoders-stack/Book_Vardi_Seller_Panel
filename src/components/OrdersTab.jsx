import React, { useState, useMemo, useEffect } from 'react';
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
  Minus,
  ArrowRight, 
  X, 
  MapPin, 
  Phone, 
  Mail, 
  CreditCard,
  CheckSquare,
  Square,
  FileText,
  Download,
  User,
  ExternalLink,
  MessageSquare,
  Key,
  Check,
  ShieldCheck
} from 'lucide-react';
import { useSellerData } from '../context/SellerDataContext';
import TaxInvoiceModal from './TaxInvoiceModal';

const STATUS_CONFIG = {
  Pending: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', icon: Clock },
  Confirmed: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200', icon: CheckCircle },
  Packed: { bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-200', icon: Package },
  Shipped: { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200', icon: Truck },
  Delivered: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200', icon: CheckCircle },
  Cancelled: { bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200', icon: XCircle }
};

export default function OrdersTab() {
  const { orders, products = [], updateOrderStatus, addOrder, deleteOrder, downloadSellerInvoice, sellerUser } = useSellerData();
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeOrderModal, setActiveOrderModal] = useState(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isShipModalOpen, setIsShipModalOpen] = useState(false);
  const [shippingOrderId, setShippingOrderId] = useState(null);
  const [trackingNumberInput, setTrackingNumberInput] = useState('');
  const [courierInput, setCourierInput] = useState('Delhivery');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Bulk selection state
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);

  // Modal active order status & fulfillment mode editing
  const [modalStatusInput, setModalStatusInput] = useState('Pending');
  const [modalCourierInput, setModalCourierInput] = useState('Delhivery');
  const [modalTrackingInput, setModalTrackingInput] = useState('');
  const [deliveryModeInput, setDeliveryModeInput] = useState('third_party'); // 'third_party' | 'self_delivery'
  const [modalDriverName, setModalDriverName] = useState('');
  const [modalDriverPhone, setModalDriverPhone] = useState('');
  const [modalVehicleNumber, setModalVehicleNumber] = useState('');
  const [modalDeliveryOtp, setModalDeliveryOtp] = useState('4829');

  // Sync active modal input values when activeOrderModal opens
  useEffect(() => {
    if (activeOrderModal) {
      setModalStatusInput(activeOrderModal.status || 'Pending');
      setModalCourierInput(activeOrderModal.courierName || 'Delhivery');
      setModalTrackingInput(activeOrderModal.trackingNumber || '');
      setDeliveryModeInput(activeOrderModal.deliveryType || 'third_party');
      setModalDriverName(activeOrderModal.selfDeliveryDetails?.deliveryPersonName || '');
      setModalDriverPhone(activeOrderModal.selfDeliveryDetails?.deliveryPersonPhone || '');
      setModalVehicleNumber(activeOrderModal.selfDeliveryDetails?.vehicleNumber || '');
      setModalDeliveryOtp(activeOrderModal.selfDeliveryDetails?.deliveryOtp || '4829');
    }
  }, [activeOrderModal]);

  // Manual order form
  const [manualForm, setManualForm] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    school: '',
    selectedProductId: '',
    itemName: '',
    price: 0,
    quantity: 1,
    size: 'M',
    availableSizes: [],
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
      updateOrderStatus(shippingOrderId, 'Shipped', {
        trackingNumber: trackingNumberInput,
        courierName: courierInput
      });
      setIsShipModalOpen(false);
      setShippingOrderId(null);
    }
  };

  const handleModalSaveStatus = () => {
    if (activeOrderModal) {
      const details = {
        courierName: modalCourierInput,
        trackingNumber: modalTrackingInput,
        deliveryType: deliveryModeInput,
        selfDeliveryDetails: {
          deliveryPersonName: modalDriverName,
          deliveryPersonPhone: modalDriverPhone,
          vehicleNumber: modalVehicleNumber,
          deliveryOtp: modalDeliveryOtp
        }
      };
      updateOrderStatus(activeOrderModal.id, modalStatusInput, details);
      setActiveOrderModal(prev => prev ? {
        ...prev,
        status: modalStatusInput,
        courierName: modalCourierInput,
        trackingNumber: modalTrackingInput,
        deliveryType: deliveryModeInput,
        selfDeliveryDetails: details.selfDeliveryDetails
      } : null);
    }
  };

  const toggleSelectAll = () => {
    if (selectedOrderIds.length === filteredOrders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(filteredOrders.map(o => o.id));
    }
  };

  const toggleSelectOrder = (id) => {
    setSelectedOrderIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBulkStatusUpdate = (status) => {
    if (selectedOrderIds.length === 0) return;
    selectedOrderIds.forEach(id => {
      updateOrderStatus(id, status);
    });
    setSelectedOrderIds([]);
  };

  const handleProductSelect = (productId) => {
    const selectedProd = products.find(p => String(p.id || p._id) === String(productId));
    if (selectedProd) {
      const sizes = selectedProd.sizes && selectedProd.sizes.length > 0 ? selectedProd.sizes : ['S', 'M', 'L', 'XL'];
      setManualForm(prev => ({
        ...prev,
        selectedProductId: productId,
        itemName: selectedProd.name,
        price: selectedProd.price,
        size: sizes[0] || 'M',
        availableSizes: sizes
      }));
    } else {
      setManualForm(prev => ({
        ...prev,
        selectedProductId: '',
        itemName: '',
        price: 0,
        availableSizes: ['S', 'M', 'L', 'XL']
      }));
    }
  };

  const handleQuantityChange = (delta) => {
    setManualForm(prev => ({
      ...prev,
      quantity: Math.max(1, (Number(prev.quantity) || 1) + delta)
    }));
  };

  const handleCreateManualOrder = (e) => {
    e.preventDefault();
    if (!manualForm.customerName.trim() || !manualForm.price) return;

    addOrder({
      customerName: manualForm.customerName.trim(),
      customerEmail: manualForm.customerEmail || 'counter@store.com',
      customerPhone: manualForm.customerPhone || '+91 98000 00000',
      school: manualForm.school || 'Counter Sale',
      total: Number(manualForm.price) * Number(manualForm.quantity),
      status: 'Pending',
      paymentMethod: 'Cash / Counter',
      paymentStatus: 'Paid',
      shippingAddress: manualForm.shippingAddress || 'Store / Counter Pickup',
      items: [
        {
          id: Date.now(),
          name: manualForm.itemName || 'Store Item',
          price: Number(manualForm.price),
          quantity: Number(manualForm.quantity),
          size: manualForm.size
        }
      ]
    });

    setIsCreateModalOpen(false);
    setManualForm({
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      school: '',
      selectedProductId: '',
      itemName: '',
      price: 0,
      quantity: 1,
      size: 'M',
      availableSizes: ['S', 'M', 'L', 'XL'],
      shippingAddress: ''
    });
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
            Manage student & parent orders, update delivery status, and confirm shipments
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
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

      {/* Bulk Status Update Bar */}
      {selectedOrderIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between p-3.5 bg-teal-50 border border-teal-200 rounded-2xl animate-in fade-in duration-150 gap-2">
          <span className="text-xs font-bold text-teal-950">
            {selectedOrderIds.length} order(s) selected
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium text-teal-800 mr-1">Bulk Change Status:</span>
            {['Confirmed', 'Packed', 'Shipped', 'Delivered', 'Cancelled'].map((st) => (
              <button
                key={st}
                onClick={() => handleBulkStatusUpdate(st)}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-teal-300 text-teal-900 hover:bg-teal-700 hover:text-white transition-colors shadow-2xs cursor-pointer"
              >
                Mark {st}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Orders List / Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-600 uppercase font-semibold tracking-wider border-b border-gray-100">
              <tr>
                <th className="py-3 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={filteredOrders.length > 0 && selectedOrderIds.length === filteredOrders.length}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-4">Order ID & Date</th>
                <th className="py-3 px-3">Customer & School</th>
                <th className="py-3 px-3">Items</th>
                <th className="py-3 px-3">Total Amount</th>
                <th className="py-3 px-3">Update Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-14 text-center text-gray-500">
                    <ShoppingBag size={44} className="mx-auto text-gray-300 mb-3" />
                    <h4 className="font-extrabold text-base text-gray-900 mb-1">No Orders Found</h4>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
                      Customer orders placed on the Book Vardi marketplace will appear here automatically. You can also log manual store sales.
                    </p>
                    <button
                      onClick={() => setIsCreateModalOpen(true)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-teal hover:bg-brand-teal-light text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer"
                    >
                      <Plus size={16} /> Create Manual Store Order
                    </button>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => {
                  const conf = STATUS_CONFIG[o.status] || STATUS_CONFIG.Pending;
                  const Icon = conf.icon;
                  const isChecked = selectedOrderIds.includes(o.id);

                  return (
                    <tr key={o.id} className={`hover:bg-gray-50/70 transition-colors ${isChecked ? 'bg-teal-50/30' : ''}`}>
                      
                      {/* Checkbox */}
                      <td className="py-3.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectOrder(o.id)}
                          className="rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                        />
                      </td>

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

                      {/* Interactive Status Selector */}
                      <td className="py-3.5 px-3">
                        <div className="flex flex-col gap-1">
                          <select
                            value={o.status || 'Pending'}
                            onChange={(e) => updateOrderStatus(o.id, e.target.value)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border cursor-pointer focus:outline-none focus:ring-1 focus:ring-teal-500 ${conf.bg} ${conf.text} ${conf.border}`}
                          >
                            <option value="Pending">🕒 Pending</option>
                            <option value="Confirmed">✅ Confirmed</option>
                            <option value="Packed">📦 Packed</option>
                            <option value="Shipped">🚚 Shipped</option>
                            <option value="Delivered">🎉 Delivered</option>
                            <option value="Cancelled">❌ Cancelled</option>
                          </select>
                        </div>
                      </td>

                      {/* Action buttons */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          
                          <button
                            onClick={() => setActiveOrderModal(o)}
                            className="p-1.5 text-gray-500 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                            title="View Full Order Details & Edit Status"
                          >
                            <Eye size={15} />
                          </button>

                          {o.status === 'Pending' && (
                            <button
                              onClick={() => updateOrderStatus(o.id, 'Confirmed')}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold rounded-lg shadow-xs cursor-pointer"
                            >
                              Confirm
                            </button>
                          )}

                          {o.status === 'Confirmed' && (
                            <button
                              onClick={() => handleOpenShipModal(o.id)}
                              className="px-2.5 py-1 bg-purple-700 hover:bg-purple-800 text-white text-[11px] font-semibold rounded-lg shadow-xs flex items-center gap-1 cursor-pointer"
                            >
                              <Truck size={12} /> Pack & Ship
                            </button>
                          )}

                          {o.status === 'Shipped' && (
                            <button
                              onClick={() => updateOrderStatus(o.id, 'Delivered')}
                              className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-semibold rounded-lg shadow-xs cursor-pointer"
                            >
                              Mark Delivered
                            </button>
                          )}

                          {o.status !== 'Cancelled' && o.status !== 'Delivered' && (
                            <button
                              onClick={() => updateOrderStatus(o.id, 'Cancelled')}
                              className="px-2 py-1 text-gray-400 hover:text-rose-600 text-[11px] rounded-lg hover:bg-rose-50 cursor-pointer"
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

      {/* Order Details & Status Update Modal */}
      {activeOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200 text-xs my-8">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/70">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-gray-900 text-base">Order Details #{activeOrderModal.id}</h3>
                  <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border ${STATUS_CONFIG[activeOrderModal.status]?.bg || 'bg-gray-100'} ${STATUS_CONFIG[activeOrderModal.status]?.text || 'text-gray-800'} ${STATUS_CONFIG[activeOrderModal.status]?.border || 'border-gray-200'}`}>
                    {activeOrderModal.status}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 mt-0.5">Placed on {activeOrderModal.date}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsInvoiceModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 font-bold rounded-xl transition-colors cursor-pointer text-xs"
                  title="View & Print GST Tax Invoice & Packing Slip"
                >
                  <FileText size={14} /> Tax Invoice & Label
                </button>

                <button
                  onClick={() => setActiveOrderModal(null)}
                  className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5 max-h-[78vh] overflow-y-auto">

              {/* Visual Order Progress Stepper */}
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-2">
                <div className="font-bold text-gray-800 text-[11px] uppercase tracking-wider">Fulfillment Timeline</div>
                <div className="grid grid-cols-5 gap-1 text-center font-bold text-[10px]">
                  {['Pending', 'Confirmed', 'Packed', 'Shipped', 'Delivered'].map((step, idx) => {
                    const currentIdx = ['Pending', 'Confirmed', 'Packed', 'Shipped', 'Delivered'].indexOf(activeOrderModal.status);
                    const isPassed = currentIdx >= idx;
                    const isCurrent = currentIdx === idx;
                    return (
                      <div key={step} className="space-y-1">
                        <div className={`h-1.5 rounded-full ${isPassed ? 'bg-teal-600' : 'bg-gray-200'} ${isCurrent ? 'ring-2 ring-teal-400 ring-offset-1' : ''}`} />
                        <div className={isPassed ? 'text-teal-900 font-extrabold' : 'text-gray-400 font-normal'}>{step}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Customer Profile & Shipping Address Card */}
              <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <span className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                    <User size={15} className="text-teal-700" /> Customer Information
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                    {activeOrderModal.school || 'General Student'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="font-extrabold text-gray-900 text-sm">{activeOrderModal.customerName}</div>
                    {activeOrderModal.customerEmail && (
                      <div className="flex items-center gap-1 text-gray-600 text-[11px] mt-1">
                        <Mail size={12} className="text-gray-400 shrink-0" />
                        <span className="truncate">{activeOrderModal.customerEmail}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:items-end gap-1.5">
                    {activeOrderModal.customerPhone && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <a
                          href={`tel:${activeOrderModal.customerPhone}`}
                          className="inline-flex items-center gap-1 text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-lg font-bold text-[11px] hover:bg-teal-100 transition-colors"
                        >
                          <Phone size={12} /> Call
                        </a>
                        <a
                          href={`https://wa.me/91${activeOrderModal.customerPhone.replace(/\D/g, '').slice(-10)}?text=Hello%20${encodeURIComponent(activeOrderModal.customerName)},%20regarding%20your%20Book%20Vardi%20Order%20%23${activeOrderModal.id}...`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg font-bold text-[11px] hover:bg-emerald-100 transition-colors"
                        >
                          <MessageSquare size={12} /> WhatsApp
                        </a>
                      </div>
                    )}
                    <div className="text-[11px] font-mono text-gray-500">{activeOrderModal.customerPhone}</div>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100">
                  <div className="font-semibold text-gray-700 flex items-center gap-1 text-[11px] mb-1">
                    <MapPin size={12} className="text-teal-700 shrink-0" /> Delivery Address:
                  </div>
                  <div className="text-gray-800 leading-relaxed font-medium bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                    {typeof activeOrderModal.shippingAddress === 'object' && activeOrderModal.shippingAddress !== null
                      ? [
                          activeOrderModal.shippingAddress.name || activeOrderModal.shippingAddress.fullName,
                          activeOrderModal.shippingAddress.addressLine || activeOrderModal.shippingAddress.street || activeOrderModal.shippingAddress.address,
                          activeOrderModal.shippingAddress.colony || activeOrderModal.shippingAddress.landmark,
                          activeOrderModal.shippingAddress.city,
                          activeOrderModal.shippingAddress.state,
                          activeOrderModal.shippingAddress.pincode ? `- ${activeOrderModal.shippingAddress.pincode}` : null,
                          activeOrderModal.shippingAddress.phone ? `(Phone: ${activeOrderModal.shippingAddress.phone})` : null
                        ].filter(Boolean).join(', ')
                      : (activeOrderModal.shippingAddress || 'Store / Counter Pickup')}
                  </div>
                </div>
              </div>

              {/* Order Status & Fulfillment Management Card */}
              <div className="p-4 rounded-xl bg-teal-50/50 border border-teal-100 space-y-4">
                <div className="flex items-center justify-between font-bold text-teal-950">
                  <span className="flex items-center gap-1.5 text-sm">
                    <Truck size={16} className="text-teal-700" /> Fulfillment & Delivery Management
                  </span>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-teal-200 text-teal-900">
                    {activeOrderModal.status}
                  </span>
                </div>

                {/* Mode Selector Tabs */}
                <div className="grid grid-cols-2 gap-2 bg-teal-100/60 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setDeliveryModeInput('third_party')}
                    className={`py-1.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                      deliveryModeInput === 'third_party'
                        ? 'bg-white text-teal-900 shadow-xs'
                        : 'text-teal-800 hover:text-teal-950'
                    }`}
                  >
                    🚚 3rd-Party Courier (Delhivery/BlueDart)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryModeInput('self_delivery')}
                    className={`py-1.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                      deliveryModeInput === 'self_delivery'
                        ? 'bg-white text-teal-900 shadow-xs'
                        : 'text-teal-800 hover:text-teal-950'
                    }`}
                  >
                    🛵 Self-Delivery (Direct / Store)
                  </button>
                </div>

                {/* Mode A: 3rd Party Courier Fields */}
                {deliveryModeInput === 'third_party' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3 rounded-xl border border-teal-100">
                    <div className="space-y-1">
                      <label className="font-semibold text-gray-700">Courier Partner</label>
                      <select
                        value={modalCourierInput}
                        onChange={(e) => setModalCourierInput(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white font-medium focus:outline-none focus:border-teal-600"
                      >
                        <option value="Delhivery">Delhivery Express</option>
                        <option value="BlueDart">BlueDart Air</option>
                        <option value="Ekart">Ekart Logistics</option>
                        <option value="DTDC">DTDC Courier</option>
                        <option value="IndiaPost">SpeedPost / India Post</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-gray-700">Tracking AWB Number</label>
                      <input
                        type="text"
                        value={modalTrackingInput}
                        onChange={(e) => setModalTrackingInput(e.target.value)}
                        placeholder="e.g. DLH-98765432"
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white font-mono"
                      />
                    </div>
                  </div>
                ) : (
                  /* Mode B: Self Delivery Fields */
                  <div className="space-y-3 bg-white p-3 rounded-xl border border-teal-100">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <label className="font-semibold text-gray-700">Driver / Delivery Person</label>
                        <input
                          type="text"
                          value={modalDriverName}
                          onChange={(e) => setModalDriverName(e.target.value)}
                          placeholder="e.g. Ramesh Kumar"
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-semibold text-gray-700">Driver Phone</label>
                        <input
                          type="text"
                          value={modalDriverPhone}
                          onChange={(e) => setModalDriverPhone(e.target.value)}
                          placeholder="+91 98765 00000"
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-semibold text-gray-700">Vehicle Number</label>
                        <input
                          type="text"
                          value={modalVehicleNumber}
                          onChange={(e) => setModalVehicleNumber(e.target.value)}
                          placeholder="e.g. DL-01-AB-1234"
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white font-mono"
                        />
                      </div>
                    </div>

                    {/* Delivery OTP Info */}
                    <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Key size={16} className="text-amber-700" />
                        <div>
                          <div className="font-bold text-amber-900">Customer Delivery OTP</div>
                          <div className="text-[10px] text-amber-700">Customer presents code upon package handover</div>
                        </div>
                      </div>
                      <div className="px-3 py-1 bg-amber-200 text-amber-950 font-mono font-extrabold text-sm rounded-lg tracking-widest border border-amber-300">
                        {modalDeliveryOtp}
                      </div>
                    </div>
                  </div>
                )}

                {/* Status Selection & Save */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="font-semibold text-gray-700">Update Status</label>
                    <select
                      value={modalStatusInput}
                      onChange={(e) => setModalStatusInput(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 font-extrabold bg-white focus:outline-none focus:border-teal-600 text-xs"
                    >
                      <option value="Pending">🕒 Pending</option>
                      <option value="Confirmed">✅ Confirmed</option>
                      <option value="Packed">📦 Packed</option>
                      <option value="Shipped">🚚 Shipped / Out for Delivery</option>
                      <option value="Delivered">🎉 Delivered</option>
                      <option value="Cancelled">❌ Cancelled</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleModalSaveStatus}
                      className="w-full py-2 bg-teal-800 hover:bg-teal-900 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer text-xs"
                    >
                      Save & Update Order
                    </button>
                  </div>
                </div>

              </div>

              {/* Items List */}
              <div className="space-y-2">
                <div className="font-bold text-gray-700">Ordered Items ({activeOrderModal.items?.length || 1})</div>
                <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
                  {activeOrderModal.items?.map((item, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between gap-3 bg-white">
                      <div className="flex items-center gap-2.5">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover border border-gray-100" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 font-bold text-xs">
                            BV
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-gray-900">{item.name}</div>
                          <div className="text-[10px] text-gray-500">
                            Qty: {item.quantity} {item.size ? `• Size: ${item.size}` : ''} {item.color ? `• Color: ${item.color}` : ''}
                          </div>
                        </div>
                      </div>
                      <div className="font-bold text-gray-900">₹{(item.price * item.quantity)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary Footer */}
              <div className="p-3.5 bg-teal-50/50 rounded-xl border border-teal-100 flex items-center justify-between">
                <div>
                  <div className="font-bold text-teal-950">Total Payable Amount</div>
                  <div className="text-[10px] text-teal-700">{activeOrderModal.paymentMethod} • {activeOrderModal.paymentStatus}</div>
                </div>
                <div className="text-lg font-extrabold text-teal-900">₹{activeOrderModal.total}</div>
              </div>

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
                className="flex-1 py-2 font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmShip}
                className="flex-1 py-2 font-semibold text-white bg-purple-700 hover:bg-purple-800 rounded-xl shadow-xs cursor-pointer"
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 text-xs space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h4 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <Plus className="text-teal-700" size={18} /> Create Manual / Counter Order
              </h4>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateManualOrder} className="space-y-3.5">
              {/* Customer Full Name */}
              <div className="space-y-1">
                <label className="font-semibold text-gray-700">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  value={manualForm.customerName}
                  onChange={(e) => setManualForm({ ...manualForm, customerName: e.target.value })}
                  placeholder="e.g. Sumanth Rao"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                />
              </div>

              {/* Customer Phone & School */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Customer Phone</label>
                  <input
                    type="text"
                    value={manualForm.customerPhone}
                    onChange={(e) => setManualForm({ ...manualForm, customerPhone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">School / Inst.</label>
                  <input
                    type="text"
                    value={manualForm.school}
                    onChange={(e) => setManualForm({ ...manualForm, school: e.target.value })}
                    placeholder="e.g. DPS School"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                  />
                </div>
              </div>

              {/* Delivery Address */}
              <div className="space-y-1">
                <label className="font-semibold text-gray-700">Delivery Address</label>
                <input
                  type="text"
                  value={manualForm.shippingAddress}
                  onChange={(e) => setManualForm({ ...manualForm, shippingAddress: e.target.value })}
                  placeholder="House/Room No, Street, Campus Address"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                />
              </div>

              {/* Select Product Dropdown */}
              <div className="space-y-1">
                <label className="font-semibold text-gray-700">Select Product from Catalog *</label>
                <select
                  value={manualForm.selectedProductId}
                  onChange={(e) => handleProductSelect(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white font-medium focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                >
                  <option value="">-- Choose Product (Auto-fills price & size) --</option>
                  {products.map((prod) => (
                    <option key={prod.id || prod._id} value={prod.id || prod._id}>
                      {prod.name} (Fixed ₹{prod.price})
                    </option>
                  ))}
                  <option value="custom">✍️ Custom Product Entry</option>
                </select>
              </div>

              {/* Item Name (shown if custom or for custom editing) */}
              {(!manualForm.selectedProductId || manualForm.selectedProductId === 'custom') && (
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Item Name / Description *</label>
                  <input
                    type="text"
                    required
                    value={manualForm.itemName}
                    onChange={(e) => setManualForm({ ...manualForm, itemName: e.target.value })}
                    placeholder="Item name"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-600"
                  />
                </div>
              )}

              {/* Fixed Price, Quantity Increment/Decrement, Size */}
              <div className="grid grid-cols-3 gap-2.5 items-end">
                {/* Fixed Item Price */}
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Item Price (₹)</label>
                  <input
                    type="number"
                    min="1"
                    readOnly={Boolean(manualForm.selectedProductId && manualForm.selectedProductId !== 'custom')}
                    value={manualForm.price}
                    onChange={(e) => setManualForm({ ...manualForm, price: Number(e.target.value) })}
                    className={`w-full px-3 py-2 rounded-xl border font-bold ${
                      manualForm.selectedProductId && manualForm.selectedProductId !== 'custom'
                        ? 'bg-gray-100 border-gray-200 text-gray-700 cursor-not-allowed'
                        : 'bg-white border-gray-200 focus:outline-none focus:border-teal-600'
                    }`}
                  />
                </div>

                {/* Quantity Controls (Increment / Decrement) */}
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Quantity</label>
                  <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-200">
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(-1)}
                      disabled={manualForm.quantity <= 1}
                      className="w-7 h-7 rounded-lg bg-white hover:bg-gray-200 text-gray-700 font-bold flex items-center justify-center border border-gray-200 shadow-2xs disabled:opacity-40 cursor-pointer"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="flex-1 text-center font-bold text-gray-900 text-xs">
                      {manualForm.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(1)}
                      className="w-7 h-7 rounded-lg bg-teal-800 hover:bg-teal-900 text-white font-bold flex items-center justify-center shadow-2xs cursor-pointer"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>

                {/* Size Selection */}
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Size</label>
                  <select
                    value={manualForm.size}
                    onChange={(e) => setManualForm({ ...manualForm, size: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white font-medium focus:outline-none focus:border-teal-600"
                  >
                    {(manualForm.availableSizes && manualForm.availableSizes.length > 0
                      ? manualForm.availableSizes
                      : ['S', 'M', 'L', 'XL', 'Free Size']
                    ).map((sz) => (
                      <option key={sz} value={sz}>{sz}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Total Summary Badge */}
              <div className="p-3 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-between">
                <span className="font-semibold text-teal-900">Total Order Amount:</span>
                <span className="text-base font-extrabold text-teal-900">
                  ₹{(Number(manualForm.price) || 0) * (Number(manualForm.quantity) || 1)}
                </span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 py-2.5 font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-xs cursor-pointer transition-colors"
                >
                  Create Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GST Tax Invoice & Dispatch Packing Slip Modal */}
      <TaxInvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        order={activeOrderModal}
        sellerUser={sellerUser}
      />
    </div>
  );
}
