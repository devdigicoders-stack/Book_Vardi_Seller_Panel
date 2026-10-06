import React from 'react';
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
  FileText
} from 'lucide-react';
import { SERVER_URL } from '../utils/api';

export default function PartialAdvanceReceiptModal({ isOpen, onClose, order }) {
  if (!isOpen || !order) return null;

  const refId = order.referenceId || order.id || 'BULK-2026';
  const receiptNo = order.advanceReceiptNumber || `REC-ADV-${refId}`;
  const totalBudget = Number(order.overallBudget || order.targetBudgetPerKit || order.estimatedBudget || order.quoteAmount || 0);

  // Check advance from seller demand or buyer offer
  const advType = order.sellerAdvanceType || order.buyerAdvanceType || 'percentage';
  const advPct = Number(order.sellerAdvancePercentage || order.buyerAdvancePercentage || 25);
  const advAmount = Number(
    order.advancePaidAmount ||
    order.sellerAdvanceAmount ||
    order.buyerAdvanceAmount ||
    (totalBudget > 0 ? Math.round((totalBudget * advPct) / 100) : 0)
  );
  const balanceDue = Math.max(0, totalBudget - advAmount);
  const isPaid = order.advancePaymentStatus === 'paid' || order.advancePaymentStatus === 'paid_partially' || Boolean(order.advancePaidAmount && Number(order.advancePaidAmount) > 0);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    const targetId = order._id || order.id || order.referenceId;
    window.open(`${SERVER_URL}/schools/bulk-orders/${targetId}/advance-receipt`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="px-6 py-4 bg-teal-800 text-white flex items-center justify-between shrink-0">
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
            <><button
              type="button"
              onClick={handlePrint}
              className="p-2 text-teal-200 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer"
              title="Print Receipt Voucher"
            >
              <Printer size={18} />
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="p-2 text-teal-200 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer"
              title="Download Signed PDF"
            >
              <Download size={18} />
            </button></>
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
            <div id="printableReceiptArea" className="p-6 sm:p-8 overflow-y-auto space-y-6 text-xs text-gray-800 bg-white">
          {/* Brand & Receipt Meta */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-gray-200 gap-3">
            <div>
              <h1 className="font-extrabold text-2xl text-teal-800">Bookvardi</h1>
              <p className="text-[11px] text-gray-500 font-medium">B2B Institutional Procurement Desk</p>
              <p className="text-[10px] text-gray-400">GSTIN: 09AAACS1429B1Z2 • corporate@bookvardi.in</p>
            </div>

            <div className="text-left sm:text-right space-y-0.5">
              <span className="inline-block px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                {order.advancePaymentStatus === 'paid_partially' ? 'Advance Paid' : 'Advance Agreed / Voucher'}
              </span>
              <p className="font-bold text-gray-800 mt-1">Receipt: <span className="font-mono">{receiptNo}</span></p>
              <p className="text-[11px] text-gray-500">Order Ref: <span className="font-mono font-bold text-gray-700">{refId}</span></p>
              <p className="text-[11px] text-gray-500">Date: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
            </div>
          </div>

          {/* School & Seller Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <div>
              <h4 className="text-[11px] font-bold text-teal-800 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Building2 size={13} /> Bill To (Institution):
              </h4>
              <p className="font-bold text-sm text-gray-900">{order.institutionName || order.schoolName || 'School Client'}</p>
              <p className="text-gray-600 mt-0.5">{order.address || order.city || 'Campus Address'}</p>
              <p className="text-gray-600">Contact: {order.contactName || order.contactPerson || 'Authorized Representative'} ({order.contactPhone || 'N/A'})</p>
            </div>

            <div>
              <h4 className="text-[11px] font-bold text-teal-800 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <ShieldCheck size={13} /> Fulfillment Partner (Seller):
              </h4>
              <p className="font-bold text-sm text-gray-900">
                {order.sellerId?.storeName || order.sellerStoreName || 'Bookvardi Verified Partner Network'}
              </p>
              <p className="text-gray-600 mt-0.5">Authorized B2B Institutional Vendor</p>
              <p className="text-gray-600">Escrow & Mobilization Managed by Bookvardi</p>
            </div>
          </div>

          {/* Order Demand Scope */}
          <div className="space-y-2">
            <h4 className="font-bold text-xs text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar size={13} className="text-teal-700" /> Demanded Scope & Specifications
            </h4>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-gray-700 text-[10px] font-bold uppercase tracking-wider">
                    <th className="py-2 px-3">Item / Service Description</th>
                    <th className="py-2 px-3 text-center">Category</th>
                    <th className="py-2 px-3 text-right">Demanded Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-xs">
                  {Array.isArray(order.requirements) && order.requirements.length > 0 ? (
                    order.requirements.map((r, i) => (
                      <tr key={i}>
                        <td className="py-2 px-3 font-medium text-gray-900">{r.itemName || r.name || `Line item ${i + 1}`}</td>
                        <td className="py-2 px-3 text-center text-gray-500 text-[11px]">{r.category || 'General'}</td>
                        <td className="py-2 px-3 text-right font-bold text-gray-900">{r.quantity} Units</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="py-2 px-3 font-medium text-gray-900">{order.requirementSummary || 'Institutional Bulk Supply'}</td>
                      <td className="py-2 px-3 text-center text-gray-500 text-[11px]">School Order</td>
                      <td className="py-2 px-3 text-right font-bold text-gray-900">{order.quantity || 100} Units</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financials & Advance Breakdown */}
          <div className="bg-teal-50/50 border border-teal-100 rounded-2xl p-4 space-y-3">
            <h4 className="font-bold text-xs text-teal-900 uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign size={14} className="text-teal-700" /> Mobilization Advance Financial Breakdown
            </h4>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-gray-600">
                <span>Total Estimated Project / Order Budget:</span>
                <span className="font-bold text-gray-900">₹{totalBudget.toLocaleString()}</span>
              </div>

              <div className="flex items-center justify-between text-gray-600">
                <span>Advance Percentage Agreed:</span>
                <span className="font-bold text-teal-800">{advPct}%</span>
              </div>

              <div className="flex items-center justify-between py-2 border-y border-teal-200/80 bg-white/70 px-3 rounded-xl font-bold">
                <span className="text-teal-900 flex items-center gap-1">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  Mobilization Advance Amount:
                </span>
                <span className="text-emerald-700 text-sm font-black">₹{advAmount.toLocaleString()}</span>
              </div>

              <div className="flex items-center justify-between text-gray-600 px-3">
                <span>Estimated Balance Due Upon Delivery & Inspection:</span>
                <span className="font-bold text-gray-800">₹{balanceDue.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Terms & Mobilization Conditions */}
          {(order.sellerAdvanceTerms || order.buyerAdvanceNote) && (
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs space-y-1">
              <strong className="text-amber-950 font-bold block">Advance & Mobilization Terms:</strong>
              {order.sellerAdvanceTerms && (
                <p className="text-amber-900">
                  <span className="font-semibold text-amber-950">Seller Stipulation:</span> {order.sellerAdvanceTerms}
                </p>
              )}
              {order.buyerAdvanceNote && (
                <p className="text-amber-900">
                  <span className="font-semibold text-amber-950">Buyer Note:</span> {order.buyerAdvanceNote}
                </p>
              )}
            </div>
          )}

          {/* Signatures & Footer Note */}
          <div className="pt-4 border-t border-gray-200 flex flex-col sm:flex-row items-end justify-between gap-6">
            <div className="text-[10px] text-gray-500 space-y-1 max-w-xs">
              <p>• This is a system-generated advance receipt and legal mobilization record under Bookvardi B2B terms.</p>
              <p>• Goods dispatched will be billed via official GST Tax Invoice upon final order dispatch.</p>
            </div>

            <div className="text-center sm:text-right">
              <div className="h-10 border-b border-gray-400 w-36 mb-1 mx-auto sm:ml-auto"></div>
              <p className="text-[10px] text-gray-600 font-bold uppercase tracking-wider">Bookvardi Authorized Desk</p>
              <p className="text-[9px] text-gray-400">Digitally Verified & Stamped</p>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-3 flex items-center justify-between shrink-0">
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
  );
}