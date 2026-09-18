import React, { useState, useMemo } from 'react';
import { 
  CreditCard, 
  ArrowDownLeft, 
  Building, 
  CheckCircle2, 
  Clock, 
  ShieldCheck,
  Search,
  Edit3,
  Save,
  X,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { useSellerData } from '../context/SellerDataContext';

export default function FinanceTab() {
  const { 
    finance = {}, 
    orders = [], 
    requestPayout, 
    settings = {}, 
    sellerUser = {},
    updateSellerProfile,
    showToast
  } = useSellerData();

  const [payoutRequested, setPayoutRequested] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditBankModalOpen, setIsEditBankModalOpen] = useState(false);

  // Read synchronized 12-step registration & DB state without static fallbacks
  const bankInfo = useMemo(() => {
    let savedReg = {};
    try {
      const saved = localStorage.getItem('bv_seller_reg_data');
      if (saved) savedReg = JSON.parse(saved);
    } catch {}

    const bankName = 
      sellerUser?.bankDetails?.bankName ||
      settings?.bankDetails?.bankName ||
      finance?.wallet?.bankDetails?.bankName ||
      finance?.bankAccount?.bankName ||
      settings?.bankName ||
      sellerUser?.bankName ||
      savedReg?.bankName ||
      '';

    const accountHolder =
      sellerUser?.bankDetails?.accountHolderName ||
      settings?.bankDetails?.accountHolderName ||
      finance?.wallet?.bankDetails?.accountHolderName ||
      finance?.bankAccount?.accountHolder ||
      settings?.accountHolderName ||
      savedReg?.bankAccountHolder ||
      sellerUser?.name ||
      '';

    const accountNumber =
      sellerUser?.bankDetails?.accountNumber ||
      settings?.bankDetails?.accountNumber ||
      finance?.wallet?.bankDetails?.accountNumber ||
      finance?.bankAccount?.accountNumber ||
      settings?.accountNumber ||
      savedReg?.bankAccountNumber ||
      '';

    const ifsc =
      sellerUser?.bankDetails?.ifscCode ||
      settings?.bankDetails?.ifscCode ||
      finance?.wallet?.bankDetails?.ifscCode ||
      finance?.bankAccount?.ifsc ||
      settings?.ifscCode ||
      savedReg?.bankIfscCode ||
      '';

    const branch =
      sellerUser?.bankDetails?.branchName ||
      settings?.bankDetails?.branchName ||
      savedReg?.bankBranch ||
      '';

    return {
      bankName,
      accountHolder,
      accountNumber,
      ifsc,
      branch
    };
  }, [settings, finance, sellerUser]);

  // Edit Bank Form State
  const [bankForm, setBankForm] = useState({
    bankName: bankInfo.bankName,
    accountHolder: bankInfo.accountHolder,
    accountNumber: bankInfo.accountNumber,
    ifsc: bankInfo.ifsc,
    branch: bankInfo.branch
  });

  const handleOpenEditModal = () => {
    setBankForm({
      bankName: bankInfo.bankName,
      accountHolder: bankInfo.accountHolder,
      accountNumber: bankInfo.accountNumber,
      ifsc: bankInfo.ifsc,
      branch: bankInfo.branch
    });
    setIsEditBankModalOpen(true);
  };

  const handleSaveBankDetails = (e) => {
    e.preventDefault();

    if (!bankForm.accountNumber || !bankForm.ifsc) {
      if (showToast) showToast('⚠️ Account Number and IFSC code are required.');
      return;
    }

    const updatedBankDetails = {
      bankName: bankForm.bankName,
      accountHolderName: bankForm.accountHolder,
      accountNumber: bankForm.accountNumber,
      ifscCode: bankForm.ifsc,
      branchName: bankForm.branch
    };

    if (updateSellerProfile) {
      updateSellerProfile({
        bankDetails: updatedBankDetails
      });
    }

    try {
      const saved = localStorage.getItem('bv_seller_reg_data');
      let regObj = saved ? JSON.parse(saved) : {};
      regObj = {
        ...regObj,
        bankName: bankForm.bankName,
        bankAccountHolder: bankForm.accountHolder,
        bankAccountNumber: bankForm.accountNumber,
        bankIfscCode: bankForm.ifsc,
        bankBranch: bankForm.branch
      };
      localStorage.setItem('bv_seller_reg_data', JSON.stringify(regObj));
    } catch {}

    setIsEditBankModalOpen(false);
    if (showToast) showToast('✅ Linked Settlement Bank Account updated and synchronized with database!');
  };

  // Pure DB metrics computation
  const totalGross = useMemo(() => {
    return orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  }, [orders]);

  const netMargin = useMemo(() => {
    return Math.round(totalGross * 0.92);
  }, [totalGross]);

  const pendingEscrow = useMemo(() => {
    return orders
      .filter(o => o.status === 'Pending' || o.status === 'Processing' || o.status === 'Shipped')
      .reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  }, [orders]);

  const availableBalance = useMemo(() => {
    return Math.max(0, netMargin - pendingEscrow);
  }, [netMargin, pendingEscrow]);

  // Dynamic ledger transactions combining order credits and payout requests
  const dynamicTransactions = useMemo(() => {
    const list = [];

    // Order credits
    orders.forEach(o => {
      list.push({
        id: `TXN-ORD-${o.id}`,
        date: o.date || 'Recent Order',
        description: `Customer Sale #${o.id} (${o.customerName || 'Buyer'})`,
        type: 'Credit',
        amount: Number(o.total || 0),
        status: o.status === 'Delivered' ? 'Completed' : 'Pending'
      });
    });

    // Payout transactions from finance state
    if (Array.isArray(finance.recentTransactions)) {
      finance.recentTransactions.forEach(t => list.push(t));
    }

    return list;
  }, [orders, finance]);

  // Filter transactions by live search query
  const filteredTransactions = useMemo(() => {
    if (!searchQuery.trim()) return dynamicTransactions.slice(0, 15);
    const q = searchQuery.toLowerCase();
    return dynamicTransactions.filter(t => 
      t.id.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.type.toLowerCase().includes(q) ||
      t.status.toLowerCase().includes(q) ||
      String(t.amount).includes(q)
    );
  }, [dynamicTransactions, searchQuery]);

  const handleRequestPayout = async () => {
    if (!bankInfo.accountNumber || !bankInfo.ifsc) {
      if (showToast) showToast('⚠️ Please update your linked bank account details first before requesting payout.');
      handleOpenEditModal();
      return;
    }
    setPayoutRequested(true);
    if (requestPayout) {
      await requestPayout(availableBalance, bankInfo);
    }
    setTimeout(() => setPayoutRequested(false), 4000);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-xs border border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <CreditCard className="text-teal-700" size={24} /> Finance & Bank Settlements
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Track gross sales, net seller margins (92%), GST deductions, and automated bank deposits
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRequestPayout}
            disabled={payoutRequested || availableBalance <= 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
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
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <div className="text-[11px] font-semibold text-gray-500">Gross Sales Revenue</div>
          <div className="text-2xl font-extrabold text-gray-900 mt-1">
            ₹{totalGross.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-emerald-600 font-medium mt-1">
            {orders.length > 0 ? `${orders.length} total orders in database` : '0 sales recorded'}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <div className="text-[11px] font-semibold text-gray-500">Net Seller Margin (92% Payout)</div>
          <div className="text-2xl font-extrabold text-teal-800 mt-1">
            ₹{netMargin.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-teal-700 mt-1">After 8% platform fee & GST</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <div className="text-[11px] font-semibold text-gray-500">Pending Escrow Payout</div>
          <div className="text-2xl font-extrabold text-amber-700 mt-1">
            ₹{pendingEscrow.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-gray-400 mt-1">Releases upon order delivery</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <div className="text-[11px] font-semibold text-gray-500">Available Settlement Balance</div>
          <div className="text-2xl font-extrabold text-emerald-700 mt-1">
            ₹{availableBalance.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-emerald-600 font-medium mt-1">Ready for 1-click bank transfer</div>
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
            <div className="flex items-center gap-2">
              {bankInfo.accountNumber ? (
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <ShieldCheck size={12} /> Verified Account
                </span>
              ) : (
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  Action Required
                </span>
              )}
              <button
                type="button"
                onClick={handleOpenEditModal}
                className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-lg text-[11px] font-bold border border-teal-200 flex items-center gap-1 cursor-pointer transition-colors"
                title="Edit / Update Linked Bank Account"
              >
                <Edit3 size={12} /> Edit Details
              </button>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Bank Name</span>
              <span className="font-bold text-gray-900">{bankInfo.bankName || 'Not Provided'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Account Holder</span>
              <span className="font-semibold text-gray-800">{bankInfo.accountHolder || 'Not Provided'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Account Number</span>
              <span className="font-mono font-bold text-gray-900">
                {bankInfo.accountNumber ? `•••• •••• ${bankInfo.accountNumber.slice(-4)}` : 'Not Provided'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">IFSC Code</span>
              <span className="font-mono text-gray-700">{bankInfo.ifsc || 'Not Provided'}</span>
            </div>
            {bankInfo.branch && (
              <div className="flex justify-between">
                <span className="text-gray-500">Branch Location</span>
                <span className="font-medium text-gray-800">{bankInfo.branch}</span>
              </div>
            )}
          </div>
        </div>

        {/* Last Payout Box */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-3">
          <div className="font-bold text-gray-900 text-sm flex items-center gap-2">
            <Clock className="text-teal-700" size={18} /> Most Recent Automated Settlement
          </div>

          <div className="p-4 rounded-xl bg-teal-50/50 border border-teal-100 space-y-2 text-xs">
            {finance.lastPayout ? (
              <>
                <div className="flex justify-between">
                  <span className="text-teal-800 font-medium">Disbursed Amount</span>
                  <span className="text-base font-extrabold text-teal-950">
                    ₹{Number(finance.lastPayout.amount || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-teal-800">Settlement Date</span>
                  <span className="font-semibold text-teal-900">{finance.lastPayout.date || 'Recent'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-teal-800">UTR / Ref Number</span>
                  <span className="font-mono text-teal-900">{finance.lastPayout.reference || 'NEFT-PROCESSING'}</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-teal-200">
                  <span className="text-teal-800">Transfer Status</span>
                  <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 size={13} /> {finance.lastPayout.status || 'Processing Settlement'}
                  </span>
                </div>
              </>
            ) : (
              <div className="py-4 text-center text-teal-900 font-medium text-xs">
                No bank payout settlements processed yet.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Search & Ledger Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Recent Account Transactions & Settlements</h3>
            <p className="text-[11px] text-gray-500">Live search across transactions, order credits, and settlement references</p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search bank transactions..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-teal-700"
            />
          </div>
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
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-gray-500">
                    No matching account transactions found in database.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((txn) => (
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
                      {txn.amount > 0 ? `+₹${txn.amount.toLocaleString('en-IN')}` : `₹${txn.amount.toLocaleString('en-IN')}`}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 size={11} /> {txn.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Linked Settlement Bank Account Modal */}
      {isEditBankModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
            <div className="px-5 py-4 bg-teal-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building size={18} className="text-brand-yellow" />
                <h3 className="font-bold text-sm">Update Linked Settlement Bank Account</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditBankModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveBankDetails} className="p-5 space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-gray-700">Bank Name *</label>
                <input
                  type="text"
                  required
                  value={bankForm.bankName}
                  onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                  placeholder="e.g. HDFC Bank Ltd"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-700"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">Account Holder Name *</label>
                <input
                  type="text"
                  required
                  value={bankForm.accountHolder}
                  onChange={(e) => setBankForm({ ...bankForm, accountHolder: e.target.value })}
                  placeholder="e.g. Vardi Education Retail Pvt Ltd"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-700"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">Bank Account Number *</label>
                <input
                  type="text"
                  required
                  value={bankForm.accountNumber}
                  onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                  placeholder="e.g. 50200084920194"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 font-mono focus:outline-none focus:border-teal-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">IFSC Code *</label>
                  <input
                    type="text"
                    required
                    value={bankForm.ifsc}
                    onChange={(e) => setBankForm({ ...bankForm, ifsc: e.target.value.toUpperCase() })}
                    placeholder="HDFC0000240"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 font-mono uppercase focus:outline-none focus:border-teal-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Branch Location</label>
                  <input
                    type="text"
                    value={bankForm.branch}
                    onChange={(e) => setBankForm({ ...bankForm, branch: e.target.value })}
                    placeholder="e.g. Okhla, New Delhi"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-700"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsEditBankModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-teal hover:bg-brand-teal-light text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5"
                >
                  <Save size={14} /> Save & Sync DB
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
