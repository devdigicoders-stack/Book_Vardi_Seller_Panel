import React from 'react';
import { Printer, Download, X, Building2, MapPin, Phone, Mail, FileText, ShieldCheck } from 'lucide-react';
import { downloadSellerInvoiceApi } from '../utils/api';

export default function TaxInvoiceModal({ isOpen, onClose, order, sellerUser }) {
  if (!isOpen || !order) return null;

  const invoiceNo = `INV-SELLER-${order.id || order._id || '2026-0001'}`;
  const invoiceDate = order.date || new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const paymentMethod = order.paymentMethod || 'UPI / Online Payment';
  const paymentStatus = order.paymentStatus || 'Paid';

  const shippingAddr = typeof order.shippingAddress === 'object' && order.shippingAddress !== null
    ? order.shippingAddress
    : {
        name: order.customerName || 'Customer',
        phone: order.customerPhone || '',
        addressLine: typeof order.shippingAddress === 'string' ? order.shippingAddress : 'Delivery Address',
        city: 'Lucknow',
        state: 'Uttar Pradesh',
        pincode: '226001'
      };

  const formattedAddressStr = typeof order.shippingAddress === 'string'
    ? order.shippingAddress
    : [
        shippingAddr.addressLine || shippingAddr.street,
        shippingAddr.colony || shippingAddr.landmark,
        shippingAddr.city,
        shippingAddr.state,
        shippingAddr.pincode ? `- ${shippingAddr.pincode}` : ''
      ].filter(Boolean).join(', ');

  const items = Array.isArray(order.items) && order.items.length > 0 ? order.items : [
    {
      id: 1,
      name: order.itemName || 'School Supply & Uniform Item',
      quantity: order.quantity || 1,
      price: order.total || 499,
      category: 'Uniforms & Books',
      hsnCode: '6204'
    }
  ];

  const subtotal = order.subtotal || items.reduce((acc, i) => acc + (Number(i.price || 0) * Number(i.quantity || 1)), 0);
  const taxAmount = Math.round(subtotal * 0.05);
  const grandTotal = order.total || (subtotal + taxAmount);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (order.id) {
      await downloadSellerInvoiceApi(order.id);
    } else {
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:rounded-none">
        
        {/* Top Control Bar (Hidden on Print) */}
        <div className="bg-teal-950 text-white px-6 py-4 flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold">
              <FileText size={18} />
            </div>
            <div>
              <h3 className="font-display font-extrabold text-sm sm:text-base text-white">
                Seller GST Tax Invoice & Dispatch Packing Slip
              </h3>
              <p className="text-[11px] text-teal-200">Order #{order.id} • Seller Copy & Shipping Label</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-teal-950 font-extrabold text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-xs"
            >
              <Printer size={15} />
              <span>Print Invoice / Label</span>
            </button>
            <button
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer border border-white/20"
            >
              <Download size={15} />
              <span className="hidden sm:inline">Download PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-teal-300 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Body */}
        <div className="p-6 sm:p-10 overflow-y-auto space-y-6 text-gray-800 text-xs font-sans print:overflow-visible print:p-6">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-teal-600/30 pb-6 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl bg-teal-800 text-white flex items-center justify-center font-black text-sm">
                  BV
                </div>
                <span className="font-display font-black text-xl text-gray-900 tracking-tight">
                  Book <span className="text-teal-700">Vardi</span> Seller Network
                </span>
              </div>
              <p className="text-[11px] text-gray-600 font-bold">{sellerUser?.storeName || sellerUser?.legalBusinessName || 'Partner Merchant Store'}</p>
              <p className="text-[11px] text-gray-500">{sellerUser?.addressLine1 || sellerUser?.address || 'Merchant Warehouse Address, Commercial Market'}</p>
              <p className="text-[11px] text-gray-500">{sellerUser?.city || 'Lucknow'}, {sellerUser?.state || 'Uttar Pradesh'} - {sellerUser?.pincode || '226001'}</p>
              <p className="text-[11px] text-gray-500">GSTIN: <strong className="font-mono text-gray-800">{sellerUser?.gstin || sellerUser?.gstNumber || '09AAACB9876K1Z2'}</strong></p>
            </div>

            <div className="text-right bg-teal-50/60 p-4 rounded-2xl border border-teal-200 min-w-[220px]">
              <span className="inline-block bg-teal-800 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md mb-2">
                SELLER TAX INVOICE
              </span>
              <p className="text-xs font-bold text-gray-900">Invoice No: <span className="font-mono">{invoiceNo}</span></p>
              <p className="text-xs text-gray-600">Date: <span className="font-medium">{invoiceDate}</span></p>
              <p className="text-xs text-gray-600">Order ID: <span className="font-mono font-bold text-teal-900">#{order.id}</span></p>
            </div>
          </div>

          {/* Customer & Shipping Box */}
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h4 className="font-extrabold text-xs text-teal-900 uppercase tracking-wider mb-2 flex items-center gap-1">
                <MapPin size={13} /> Deliver To (Customer)
              </h4>
              <p className="font-bold text-sm text-gray-900">{shippingAddr.name || order.customerName}</p>
              <p className="text-gray-700 mt-1 leading-relaxed">{formattedAddressStr}</p>
              <p className="text-gray-600 mt-1">Contact Phone: <strong className="text-gray-900">{shippingAddr.phone || order.customerPhone}</strong></p>
            </div>

            <div>
              <h4 className="font-extrabold text-xs text-teal-900 uppercase tracking-wider mb-2 flex items-center gap-1">
                <ShieldCheck size={13} /> Order Payment & Courier
              </h4>
              <p className="text-gray-700">Payment Status: <strong className="text-emerald-700">{paymentStatus}</strong></p>
              <p className="text-gray-700">Payment Mode: <strong className="text-gray-900">{paymentMethod}</strong></p>
              <p className="text-gray-700">Dispatch Courier: <strong className="text-gray-900">{order.courierName || 'BlueDart Express Campus Priority'}</strong></p>
              <p className="text-gray-700">AWB Tracking No: <strong className="font-mono text-gray-900">{order.trackingNumber || 'BD-882193'}</strong></p>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="border border-gray-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-teal-900 text-white text-[11px] uppercase tracking-wider font-extrabold">
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Item Name & SKU</th>
                  <th className="py-3 px-4 text-center">Qty</th>
                  <th className="py-3 px-4 text-right">Price</th>
                  <th className="py-3 px-4 text-right">Tax (5%)</th>
                  <th className="py-3 px-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-xs">
                {items.map((item, idx) => (
                  <tr key={item.id || idx}>
                    <td className="py-3 px-4 font-bold text-gray-500">{idx + 1}</td>
                    <td className="py-3 px-4 font-bold text-gray-900">{item.name}</td>
                    <td className="py-3 px-4 text-center font-bold text-gray-900">{item.quantity || 1}</td>
                    <td className="py-3 px-4 text-right font-mono">₹{Number(item.price || 0).toFixed(2)}</td>
                    <td className="py-3 px-4 text-right font-mono text-gray-600">₹{(Number(item.price || 0) * 0.05).toFixed(2)}</td>
                    <td className="py-3 px-4 text-right font-bold text-gray-900 font-mono">₹{(Number(item.price || 0) * Number(item.quantity || 1)).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="flex justify-end pt-2">
            <div className="w-full sm:w-1/2 bg-teal-50/70 p-4 rounded-2xl border border-teal-200 space-y-2 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal:</span>
                <span className="font-mono">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>GST (5%):</span>
                <span className="font-mono">₹{taxAmount.toFixed(2)}</span>
              </div>
              <div className="border-t border-teal-300 pt-2 flex justify-between items-center text-sm font-black text-teal-950">
                <span>Total Invoice Value:</span>
                <span className="font-mono text-base text-teal-900">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
