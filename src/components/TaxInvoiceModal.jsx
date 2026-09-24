import React from 'react';
import { Printer, Download, X, Building2, MapPin, Phone, Mail, FileText, ShieldCheck } from 'lucide-react';
import { downloadSellerInvoiceApi } from '../utils/api';
import { resolveImageUrl } from '../utils/mediaUrl';

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
      image: order.image || (Array.isArray(order.images) && order.images[0]) || FALLBACK_IMAGE,
      quantity: order.quantity || 1,
      price: order.total || 499,
      category: 'Uniforms & Books',
      hsnCode: '6204'
    }
  ];

  const getTaxRate = (item) => {
    if (item.taxRate !== undefined && item.taxRate !== null) return Number(item.taxRate);
    if (item.gstRate !== undefined && item.gstRate !== null) return Number(item.gstRate);
    if (item.tax !== undefined && item.tax !== null) return Number(item.tax);
    const cat = (item.category || '').toLowerCase();
    const name = (item.name || '').toLowerCase();
    if (cat.includes('ncert') || cat.includes('book') || name.includes('ncert') || name.includes('textbook') || name.includes('book')) {
      return 0; // 0% GST on NCERT Textbooks per Admin Setting
    }
    return 5;
  };

  const calculatedTaxAmount = items.reduce((sum, item) => {
    const itemTotal = Number(item.price || 0) * Number(item.quantity || 1);
    const rate = getTaxRate(item);
    return sum + Math.round((itemTotal * rate) / 100);
  }, 0);

  const subtotal = order.subtotal || items.reduce((acc, i) => acc + (Number(i.price || 0) * Number(i.quantity || 1)), 0);
  const taxAmount = order.taxAmount !== undefined ? Number(order.taxAmount) : calculatedTaxAmount;
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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:rounded-none">
        
        {/* Top Control Bar (Hidden on Print) */}
        <div className="bg-teal-950 text-white px-5 py-3 flex items-center justify-between shrink-0 print:hidden border-b border-teal-900">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold">
              <FileText size={16} />
            </div>
            <div>
              <h3 className="font-display font-bold text-xs sm:text-sm text-white leading-tight">
                Seller GST Tax Invoice & Packing Slip
              </h3>
              <p className="text-[10px] text-teal-200">Order #{order.id} • Seller Copy & Dispatch Label</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-teal-950 font-extrabold text-[11px] px-3 py-1.5 rounded-lg transition-all cursor-pointer shadow-xs"
            >
              <Printer size={14} />
              <span>Print Invoice</span>
            </button>
            <button
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white font-bold text-[11px] px-3 py-1.5 rounded-lg transition-all cursor-pointer border border-white/20"
            >
              <Download size={14} />
              <span className="hidden sm:inline">PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-teal-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Printable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-gray-800 text-[11px] font-sans print:overflow-visible print:p-4">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-teal-600/30 pb-4 gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg bg-teal-800 text-white flex items-center justify-center font-black text-xs">
                  BV
                </div>
                <span className="font-display font-black text-lg text-gray-900 tracking-tight">
                  Book <span className="text-teal-700">Vardi</span> Seller Network
                </span>
              </div>
              <p className="text-[10px] text-gray-600 font-bold">{sellerUser?.storeName || sellerUser?.legalBusinessName || 'Partner Merchant Store'}</p>
              <p className="text-[10px] text-gray-500">{sellerUser?.addressLine1 || sellerUser?.address || 'Merchant Warehouse Address, Commercial Market'}</p>
              <p className="text-[10px] text-gray-500">{sellerUser?.city || 'Lucknow'}, {sellerUser?.state || 'Uttar Pradesh'} - {sellerUser?.pincode || '226001'}</p>
              <p className="text-[10px] text-gray-500">GSTIN: <strong className="font-mono text-gray-800">{sellerUser?.gstin || sellerUser?.gstNumber || '09AAACB9876K1Z2'}</strong></p>
            </div>

            <div className="text-right bg-teal-50/60 p-3 rounded-xl border border-teal-200 min-w-[200px]">
              <span className="inline-block bg-teal-800 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-md mb-1">
                SELLER TAX INVOICE
              </span>
              <p className="text-[11px] font-bold text-gray-900">Invoice No: <span className="font-mono">{invoiceNo}</span></p>
              <p className="text-[11px] text-gray-600">Date: <span className="font-medium">{invoiceDate}</span></p>
              <p className="text-[11px] text-gray-600">Order ID: <span className="font-mono font-bold text-teal-900">#{order.id}</span></p>
            </div>
          </div>

          {/* Customer & Shipping Box */}
          <div className="bg-gray-50/80 p-3 rounded-xl border border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <h4 className="font-extrabold text-[10px] text-teal-900 uppercase tracking-wider mb-1 flex items-center gap-1">
                <MapPin size={12} /> Deliver To (Customer)
              </h4>
              <p className="font-bold text-xs text-gray-900">{shippingAddr.name || order.customerName}</p>
              <p className="text-gray-700 leading-snug mt-0.5">{formattedAddressStr}</p>
              <p className="text-gray-600 mt-0.5">Contact Phone: <strong className="text-gray-900">{shippingAddr.phone || order.customerPhone}</strong></p>
            </div>

            <div>
              <h4 className="font-extrabold text-[10px] text-teal-900 uppercase tracking-wider mb-1 flex items-center gap-1">
                <ShieldCheck size={12} /> Order Payment & Courier
              </h4>
              <p className="text-gray-700">Payment Status: <strong className="text-emerald-700">{paymentStatus}</strong></p>
              <p className="text-gray-700">Payment Mode: <strong className="text-gray-900">{paymentMethod}</strong></p>
              <p className="text-gray-700">Dispatch Courier: <strong className="text-gray-900">{order.courierName || 'BlueDart Express Campus Priority'}</strong></p>
              <p className="text-gray-700">AWB Tracking No: <strong className="font-mono text-gray-900">{order.trackingNumber || 'BD-882193'}</strong></p>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-teal-900 text-white text-[10px] uppercase tracking-wider font-extrabold">
                  <th className="py-2 px-3 w-8">#</th>
                  <th className="py-2 px-3">Item Description & Photo</th>
                  <th className="py-2 px-3 text-center w-12">Qty</th>
                  <th className="py-2 px-3 text-right w-20">Price</th>
                  <th className="py-2 px-3 text-right w-20">GST Tax</th>
                  <th className="py-2 px-3 text-right w-20">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-[11px]">
                {items.map((item, idx) => {
                  const itemImgRaw = item.image || (Array.isArray(item.images) && item.images[0]) || order.image || (Array.isArray(order.images) && order.images[0]);
                  const itemImg = itemImgRaw ? resolveImageUrl(itemImgRaw) : '';
                  const qty = Number(item.quantity || 1);
                  const price = Number(item.price || 0);
                  const rate = getTaxRate(item);
                  const itemTax = Math.round((price * qty * rate) / 100);

                  return (
                    <tr key={item.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                      <td className="py-2.5 px-3 font-bold text-gray-500 text-center">{idx + 1}</td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2.5">
                          {itemImg ? (
                            <img
                              src={itemImg}
                              alt={item.name}
                              className="w-10 h-10 object-cover rounded-lg border border-gray-200 shrink-0 bg-gray-50 shadow-2xs"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg border border-gray-200 shrink-0 bg-gray-100 flex items-center justify-center text-gray-400 text-[9px] font-bold">
                              No Img
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-gray-900 leading-snug">{item.name}</p>
                            {item.category && <p className="text-[10px] text-gray-500">Cat: {item.category}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-gray-900">{qty}</td>
                      <td className="py-2.5 px-3 text-right font-mono">₹{price.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-gray-600">₹{itemTax.toFixed(2)} ({rate}%)</td>
                      <td className="py-2.5 px-3 text-right font-bold text-gray-900 font-mono">₹{((price * qty) + itemTax).toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="flex justify-end pt-1">
            <div className="w-full sm:w-1/2 bg-teal-50/70 p-3.5 rounded-xl border border-teal-200 space-y-1.5 text-[11px]">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal:</span>
                <span className="font-mono">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>GST Tax Total:</span>
                <span className="font-mono">₹{taxAmount.toFixed(2)}</span>
              </div>
              <div className="border-t border-teal-300 pt-1.5 flex justify-between items-center text-xs font-black text-teal-950">
                <span>Total Invoice Value:</span>
                <span className="font-mono text-sm text-teal-900">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
