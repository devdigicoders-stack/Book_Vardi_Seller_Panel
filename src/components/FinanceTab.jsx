import React, { useState } from 'react';
import { 
  CreditCard, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Download, 
  Building, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  FileText,
  ShieldCheck
} from 'lucide-react';
import { useSellerData } from '../context/SellerDataContext';

export default function FinanceTab() {
  const { finance } = useSellerData();
  const [payoutRequested, setPayoutRequested] = useState(false);

  const handleRequestPayout = () => {
    setPayoutRequested(true);
    setTimeout(() => setPayoutRequested(false), 3000);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-xs border border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <CreditCard className="text-teal-700" size={24} /> Finance & Payouts
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Track gross sales, net seller margins, GST deductions, and automated bank deposits
          </p>
        </div>

        <button
          onClick={handleRequestPayout}
          disabled={payoutRequested}
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors disabled:opacity-50"
        >
          {payoutRequested ? (
            <>
              <CheckCircle2 size={16} /> Settlement Requested!
            </>
          ) : (
            <>
              <ArrowDownLeft size={16} /> Request Bank Settlement
            </>
          )}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <div className="text-[11px] font-semibold text-gray-500">Gross Sales Revenue</div>
          <div className="text-2xl font-extrabold text-gray-900 mt-1">
            ₹{Number(finance.totalRevenue || 348500).toLocaleString()}
          </div>
          <div className="text-[10px] text-emerald-600 font-medium mt-1">↑ +18.4% from last month</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <div className="text-[11px] font-semibold text-gray-500">Net Seller Margin (Profit)</div>
          <div className="text-2xl font-extrabold text-teal-800 mt-1">
            ₹{Number(finance.netProfit || 98200).toLocaleString()}
          </div>
          <div className="text-[10px] text-teal-700 mt-1">After 8% marketplace fee</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <div className="text-[11px] font-semibold text-gray-500">Pending Escrow Payout</div>
          <div className="text-2xl font-extrabold text-amber-700 mt-1">
            ₹{Number(finance.pendingPayout || 24500).toLocaleString()}
          </div>
          <div className="text-[10px] text-gray-400 mt-1">Releases upon order delivery</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <div className="text-[11px] font-semibold text-gray-500">Available Settlement Balance</div>
          <div className="text-2xl font-extrabold text-emerald-700 mt-1">
            ₹{Number(finance.availableBalance || 48900).toLocaleString()}
          </div>
          <div className="text-[10px] text-emerald-600 font-medium mt-1">Ready for 1-click withdrawal</div>
        </div>
      </div>

      {/* Bank Account Verification & Settlement Schedule */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Bank Box */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <Building className="text-teal-700" size={18} /> Linked Settlement Bank Account
            </div>
            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <ShieldCheck size={12} /> Verified by NPCI
            </span>
          </div>

          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Bank Name</span>
              <span className="font-bold text-gray-900">{finance.bankAccount?.bankName || 'HDFC Bank Ltd'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Account Holder</span>
              <span className="font-semibold text-gray-800">{finance.bankAccount?.accountHolder || 'Book Vardi Seller Hub'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Account Number</span>
              <span className="font-mono font-bold text-gray-900">•••• •••• •••• {finance.bankAccount?.accountEnding || '9182'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">IFSC Code</span>
              <span className="font-mono text-gray-700">{finance.bankAccount?.ifsc || 'HDFC0001245'}</span>
            </div>
          </div>
        </div>

        {/* Last Payout Box */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-3">
          <div className="font-bold text-gray-900 text-sm flex items-center gap-2">
            <Clock className="text-teal-700" size={18} /> Most Recent Automated Settlement
          </div>

          <div className="p-4 rounded-xl bg-teal-50/50 border border-teal-100 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-teal-800 font-medium">Disbursed Amount</span>
              <span className="text-base font-extrabold text-teal-950">
                ₹{Number(finance.lastPayout?.amount || 48200).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-teal-800">Settlement Date</span>
              <span className="font-semibold text-teal-900">{finance.lastPayout?.date || '31 Aug 2026'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-teal-800">UTR / Ref Number</span>
              <span className="font-mono text-teal-900">{finance.lastPayout?.reference || 'NEFT-HDFC-9921034'}</span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-teal-200">
              <span className="text-teal-800">Transfer Status</span>
              <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                <CheckCircle2 size={13} /> {finance.lastPayout?.status || 'Credited to Bank'}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 text-sm">Recent Account Transactions & Settlements</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-600 uppercase font-semibold tracking-wider border-b border-gray-100">
              <tr>
                <th className="py-3 px-4">Transaction ID</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Description</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Amount</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {finance.recentTransactions?.map((txn) => (
                <tr key={txn.id} className="hover:bg-gray-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-gray-800">{txn.id}</td>
                  <td className="py-3.5 px-3 text-gray-500">{txn.date}</td>
                  <td className="py-3.5 px-3 font-medium text-gray-800">{txn.description}</td>
                  <td className="py-3.5 px-3">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      txn.type === 'Credit' ? 'bg-emerald-100 text-emerald-800' :
                      txn.type === 'Payout' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {txn.type}
                    </span>
                  </td>
                  <td className={`py-3.5 px-3 font-extrabold text-sm ${
                    txn.amount > 0 ? 'text-emerald-700' : 'text-gray-900'
                  }`}>
                    {txn.amount > 0 ? `+₹${txn.amount}` : `₹${txn.amount}`}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 size={11} /> {txn.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
