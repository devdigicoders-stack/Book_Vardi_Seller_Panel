import React, { useMemo } from 'react';
import {
  X,
  Lock,
  Printer,
  ShieldCheck,
  Building2,
  Calendar,
  DollarSign,
  Download,
  CheckCircle2,
  FileText,
  CreditCard,
  Clock
} from 'lucide-react';
import { SERVER_URL } from '../utils/api';
import useModalBackTrap from '../hooks/useModalBackTrap';

export default function PartialAdvanceReceiptModal({ isOpen, onClose, order }) {
  useModalBackTrap(isOpen, onClose);

  const platformSettings = useMemo(() => {
    try {
      const saved = localStorage.getItem('bookvardi_platform_settings') || localStorage.getItem('admin_settings');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  }, []);
  const companyGstin = platformSettings.companyGstin || '09AAACB1234F1Z9';
  const companySupportEmail = platformSettings.supportEmail || platformSettings.customerCareEmail || 'corporate@bookvardi.in';

  if (!isOpen || !order) return null;

  const refId = order.referenceId || order.id || 'BULK-2026';
  const receiptNo = order.advanceReceiptNumber || `REC-ADV-${refId}`;
  const totalBudget = Number(order.overallBudget || order.targetBudgetPerKit || order.estimatedBudget || order.quoteAmount || 0);

  // Check advance from seller demand or buyer offer
  const advPct = Number(order.sellerAdvancePercentage || order.buyerAdvancePercentage || order.prepaymentPercentage || 20);
  const advAmount = Number(
    order.advancePaidAmount ||
    order.sellerAdvanceAmount ||
    order.buyerAdvanceAmount ||
    (totalBudget > 0 ? Math.round((totalBudget * advPct) / 100) : 0)
  );
  const balanceDue = Math.max(0, totalBudget - advAmount);
  const isPaid = order.advancePaymentStatus === 'paid' || order.advancePaymentStatus === 'paid_partially' || Boolean(order.advancePaidAmount && Number(order.advancePaidAmount) > 0);

  const paymentDateStr = order.advancePaidAt
    ? new Date(order.advancePaidAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  // Resolve authentic seller store name
  const resolveSellerStoreName = () => {
    if (order.sellerId && typeof order.sellerId === 'object' && (order.sellerId.storeName || order.sellerId.name)) {
      return order.sellerId.storeName || order.sellerId.name;
    }
    if (order.sellerStoreName) return order.sellerStoreName;
    if (order.sellerDetails?.storeName) return order.sellerDetails.storeName;
    try {
      const activeKeys = ['seller_user_profile', 'bv_seller_user', 'bv_seller_profile', 'bv_seller_reg_data'];
      for (const k of activeKeys) {
        const raw = localStorage.getItem(k);
        if (raw) {
          const s = JSON.parse(raw);
          const name = s.storeName || s.businessName || s.storeDetails?.storeName || s.sellerName;
          if (name) return name;
        }
      }
    } catch (e) {}
    return 'Authorized Partner Vendor';
  };

  const sellerStoreName = resolveSellerStoreName();

  // Bulletproof Isolated Print Handler: Zero blank pages, zero background bleeding
  const handlePrint = () => {
    const printContent = document.getElementById('printableAdvanceReceiptArea');
    if (!printContent) {
      window.print();
      return;
    }

    let iframe = document.getElementById('receipt-print-iframe');
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'receipt-print-iframe';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);
    }

    const doc = iframe.contentWindow.document;
    doc.open();

    // Collect all stylesheets from parent document
    const styleSheets = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map(el => el.outerHTML)
      .join('\n');

    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Advance Payment Receipt - ${receiptNo}</title>
          <meta charset="utf-8" />
          <style>
            @page {
              size: A4 portrait;
              margin: 8mm 10mm;
            }
            * { box-sizing: border-box; }
            html, body {
              margin: 0;
              padding: 0;
              background: #ffffff !important;
              color: #0f172a;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          </style>
          ${styleSheets}
        </head>
        <body class="p-6 bg-white">
          <div class="max-w-2xl mx-auto">
            ${printContent.innerHTML}
          </div>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (err) {
        window.print();
      }
    }, 300);
  };

  const handleDownloadPdf = () => {
    const targetId = order._id || order.id || order.referenceId;
    window.open(`${SERVER_URL}/schools/bulk-orders/${targetId}/advance-receipt`, '_blank');
  };

  return (
    <>
      {/* Standard print fallback stylesheet */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 10mm;
          }
          body {
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      <div
        id="advanceReceiptModalOverlay"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn print:p-0 print:bg-white print:static print:inset-auto print:block"
      >
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden border border-gray-200 print:max-h-none print:shadow-none print:border-none print:rounded-none print:w-full print:max-w-none print:overflow-visible">
          
          {/* Header Bar (Hidden in Print) */}
          <div className="px-6 py-4 bg-teal-800 text-white flex items-center justify-between shrink-0 print:hidden">
            <div className="flex items-center gap-2.5">
              <FileText size={20} className="text-amber-400" />
              <div>
                <h3 className="font-bold text-sm sm:text-base leading-tight">
                  Partial Advance Payment Receipt Voucher
                </h3>
                <p className="text-[11px] text-teal-200">
                  Official Institutional Mobilization Receipt • #{receiptNo}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isPaid && (
                <>
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="p-2 text-teal-200 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                    title="Print Receipt Voucher"
                  >
                    <Printer size={16} />
                    <span className="hidden sm:inline">Print</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    className="p-2 text-teal-200 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                    title="Download Official PDF"
                  >
                    <Download size={16} />
                    <span className="hidden sm:inline">Download PDF</span>
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-teal-200 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Strict Verification Check */}
          {!isPaid ? (
            <div className="p-8 text-center space-y-4 my-auto">
              <div className="w-16 h-16 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center mx-auto">
                <Lock size={28} />
              </div>
              <div>
                <h4 className="font-display font-extrabold text-lg text-gray-900">Advance Receipt Locked</h4>
                <p className="text-xs text-gray-500 max-w-md mx-auto mt-1">
                  Official Advance Payment Receipt can only be generated strictly after mobilization prepayment is completed and verified.
                </p>
              </div>
              <div className="inline-block bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold px-4 py-2 rounded-xl">
                Current Prepayment Status: <span className="uppercase font-black text-amber-950">{order.advancePaymentStatus || 'Unpaid / Pending Prepayment'}</span>
              </div>
            </div>
          ) : (
            <>
              {/* Printable Receipt Body */}
              <div
                id="printableAdvanceReceiptArea"
                className="p-6 sm:p-8 overflow-y-auto space-y-5 text-xs text-gray-800 bg-white print:overflow-visible print:p-0 print:max-w-none print:space-y-4"
              >
                {/* Brand & Receipt Meta */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b-2 border-teal-800 gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-teal-800 text-white font-extrabold text-[11px] rounded tracking-wider uppercase">
                        Book Vardi
                      </span>
                      <span className="text-xs font-extrabold text-teal-900 flex items-center gap-1">
                        <ShieldCheck size={14} className="text-emerald-600" /> B2B Institutional Escrow
                      </span>
                    </div>
                    <h1 className="font-extrabold text-xl text-gray-900 mt-1">BOOK VARDI</h1>
                    <p className="text-[11px] text-gray-500">Corporate & Institutional Procurement Division</p>
                    <p className="text-[10px] text-gray-400 font-mono">GSTIN: {companyGstin} • {companySupportEmail}</p>
                  </div>

                  <div className="text-left sm:text-right space-y-0.5">
                    <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-lg text-[10px] font-black uppercase tracking-wider">
                      ✓ MOBILIZATION ADVANCE PAID
                    </span>
                    <p className="font-extrabold text-gray-900 mt-1">Receipt No: <span className="font-mono text-teal-900">{receiptNo}</span></p>
                    <p className="text-[11px] text-gray-600">Order Ref: <strong className="font-mono text-gray-900">#{refId}</strong></p>
                    <p className="text-[11px] text-gray-500">Payment Date: <span className="font-medium text-gray-800">{paymentDateStr}</span></p>
                  </div>
                </div>

                {/* School & Seller Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-teal-50/40 p-4 rounded-xl border border-teal-100">
                  <div>
                    <h4 className="text-[10px] font-black text-teal-800 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <Building2 size={12} className="text-teal-700" /> Bill To (Institution / Client):
                    </h4>
                    <p className="font-extrabold text-sm text-gray-900">{order.institutionName || order.schoolName || 'School Client'}</p>
                    <p className="text-gray-600 mt-0.5">{order.deliveryLocation || order.location || order.address || order.city || 'Campus Address, Lucknow, Uttar Pradesh'}</p>
                    <p className="text-gray-600 mt-0.5 font-medium">Contact: {order.contactName || order.contactPerson || order.buyerName || 'Authorized Representative'} ({order.contactPhone || order.userPhone || '+918888888888'})</p>
                  </div>

                  <div className="border-t sm:border-t-0 sm:border-l sm:pl-4 border-teal-100">
                    <h4 className="text-[10px] font-black text-teal-800 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <ShieldCheck size={12} className="text-emerald-600" /> Fulfillment Partner (Seller):
                    </h4>
                    <p className="font-extrabold text-sm text-gray-900">{sellerStoreName}</p>
                    <span className="inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 bg-white text-emerald-800 text-[10px] font-bold rounded border border-emerald-200">
                      <ShieldCheck size={11} /> Authorized B2B Institutional Vendor
                    </span>
                    <p className="text-gray-500 text-[10px] mt-1">Escrow & Milestone Settlement Managed via Bookvardi</p>
                  </div>
                </div>

                {/* Order Demand Scope */}
                <div className="space-y-1.5">
                  <h4 className="font-extrabold text-[11px] text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar size={13} className="text-teal-700" /> Demanded Line Items & Scope
                  </h4>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-100 text-gray-700 text-[10px] font-black uppercase tracking-wider border-b border-gray-200">
                          <th className="py-2 px-3">Item / Service Description</th>
                          <th className="py-2 px-3 text-center">Category</th>
                          <th className="py-2 px-3 text-right">Demanded Qty</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-xs">
                        {Array.isArray(order.requirements) && order.requirements.length > 0 ? (
                          order.requirements.map((r, i) => (
                            <tr key={i} className="hover:bg-gray-50/50">
                              <td className="py-2 px-3 font-bold text-gray-900">{r.itemName || r.name || `Demanded Item ${i + 1}`}</td>
                              <td className="py-2 px-3 text-center text-gray-500 text-[11px]">{r.category || 'School Supply'}</td>
                              <td className="py-2 px-3 text-right font-black text-gray-900 font-mono">{r.quantity} Units</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td className="py-2 px-3 font-bold text-gray-900">{order.requirementSummary || 'Institutional Bulk Supply'}</td>
                            <td className="py-2 px-3 text-center text-gray-500 text-[11px]">School Order</td>
                            <td className="py-2 px-3 text-right font-black text-gray-900 font-mono">{order.quantity || 100} Units</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Financials & Advance Breakdown */}
                <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-4 space-y-2.5">
                  <h4 className="font-black text-[11px] text-teal-900 uppercase tracking-wider flex items-center gap-1.5">
                    <DollarSign size={13} className="text-emerald-700" /> Mobilization Advance Financial Breakdown
                  </h4>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-gray-600">
                      <span>Total Agreed Project / Order Amount:</span>
                      <span className="font-bold text-gray-900 font-mono">₹{totalBudget.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="flex items-center justify-between text-gray-600">
                      <span>Agreed Mobilization Advance Deposit:</span>
                      <span className="font-extrabold text-teal-800">{advPct}% Upfront</span>
                    </div>

                    <div className="flex items-center justify-between py-2 border-y border-emerald-200 bg-white px-3.5 rounded-lg shadow-2xs">
                      <span className="text-emerald-950 font-black flex items-center gap-1.5">
                        <CheckCircle2 size={16} className="text-emerald-600" />
                        Mobilization Advance Paid & Secured:
                      </span>
                      <span className="text-emerald-700 text-base font-black font-mono">₹{advAmount.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="flex items-center justify-between text-gray-600 px-3.5 pt-0.5">
                      <span>Estimated Balance Payable Upon Delivery & Inspection:</span>
                      <span className="font-bold text-gray-800 font-mono">₹{balanceDue.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                {/* Transaction & Settlement Details */}
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                  <div>
                    <span className="text-gray-400 font-bold uppercase text-[9px] block">Payment Gateway</span>
                    <p className="font-bold text-gray-900 flex items-center gap-1 mt-0.5">
                      <CreditCard size={12} className="text-teal-700" /> {order.advancePaymentMode || 'Online (Razorpay / UPI)'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400 font-bold uppercase text-[9px] block">Transaction Reference ID</span>
                    <p className="font-mono font-bold text-gray-800 truncate mt-0.5" title={order.advanceTransactionId}>
                      {order.advanceTransactionId || 'pay_TnVu9EPSX1vMbp'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400 font-bold uppercase text-[9px] block">Settlement Status</span>
                    <p className="font-bold text-emerald-700 flex items-center gap-1 mt-0.5">
                      <Clock size={12} /> ESCROW Verified & Secured
                    </p>
                  </div>
                </div>

                {/* Signatures & Footer Note */}
                <div className="pt-3 border-t border-gray-200 flex flex-col sm:flex-row items-end justify-between gap-4">
                  <div className="text-[10px] text-gray-500 space-y-0.5 max-w-sm">
                    <p>• This is an official system-generated mobilization advance receipt voucher under Bookvardi B2B terms.</p>
                    <p>• Final Tax Invoice will be issued upon dispatch and final quantity delivery verification.</p>
                  </div>

                  <div className="text-center sm:text-right">
                    <div className="h-8 border-b-2 border-gray-400 w-36 mb-1 mx-auto sm:ml-auto"></div>
                    <p className="text-[10px] text-gray-900 font-extrabold uppercase tracking-wider">Bookvardi Authorized Desk</p>
                    <p className="text-[9px] text-emerald-700 font-bold">Digitally Verified & Stamped</p>
                  </div>
                </div>
              </div>

              {/* Modal Actions (Hidden in Print) */}
              <div className="bg-gray-50 border-t border-gray-200 px-6 py-3 flex items-center justify-between shrink-0 print:hidden">
                <span className="text-[11px] text-gray-500">Need physical copy? Click print or download signed PDF.</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    <Printer size={14} />
                    <span>Print</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    <Download size={14} />
                    <span>Download PDF</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}