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

    if (bankForm.confirmAccountNumber && bankForm.accountNumber !== bankForm.confirmAccountNumber) {
      if (showToast) showToast('⚠️ Bank account numbers do not match. Please re-enter to confirm.');
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

  // Dynamic platform commission (Default: 10% as per Rule 1)
  const commissionRate = useMemo(() => {
    const raw = sellerUser?.commissionPercentage ?? sellerUser?.commissionRate ?? finance?.wallet?.commissionPercentage ?? finance?.wallet?.commissionRate ?? finance?.commissionPercentage ?? finance?.commissionRate;
    if (raw !== undefined && raw !== null && !isNaN(Number(raw))) {
      return Number(raw);
    }
    return 10;
  }, [sellerUser, finance]);

  // Rule 1 & Rule 2: Dynamic Seller Settlement Aggregation
  const settlementSummary = useMemo(() => {
    let grossSales = 0;
    let totalPortalCommission = 0;
    let totalGstOnCommission = 0;
    let totalTds = 0;
    let totalGstTcs = 0;
    let totalDeliveryDeductions = 0;
    let totalDeductions = 0;
    let totalFinalSettlement = 0;

    orders.forEach(o => {
      const gross = Number(o.total || o.totalAmount || 0);
      const commRate = Number(o.commissionRate ?? o.settlement?.commissionRate ?? commissionRate ?? 10);
      
      const commAmount = o.settlement?.commissionAmount !== undefined
        ? Number(o.settlement.commissionAmount)
        : Math.round(((gross * commRate) / 100) * 100) / 100;

      const gstComm = o.settlement?.gstOnCommissionAmount !== undefined
        ? Number(o.settlement.gstOnCommissionAmount)
        : Math.round(((commAmount * 18) / 100) * 100) / 100;

      const tds = o.settlement?.tdsAmount !== undefined
        ? Number(o.settlement.tdsAmount)
        : Math.round(((gross * 0.1) / 100) * 100) / 100;

      // Rule 2: Delivery Charges + 18% GST (Third-Party Delivery)
      const rawDeliveryMode = String(o.deliveryMode || o.deliveryType || '').toLowerCase();
      const hasCourier = Boolean(o.courierName && o.courierName !== 'N/A' && o.courierName !== '');
      const isThirdParty = o.isThirdParty === true || 
                           rawDeliveryMode.includes('third') || 
                           rawDeliveryMode.includes('courier') || 
                           (hasCourier && !rawDeliveryMode.includes('self'));

      const rawPayment = String(o.paymentMethod || o.paymentMode || o.paymentType || '').toUpperCase();
      const isCod = rawPayment.includes('COD') || rawPayment.includes('CASH') || rawPayment.includes('DELIVERY');
      const isRule3 = isCod && !isThirdParty;

      // Rule 3: 0% GST TCS when portal does not collect customer payment
      const gstTcs = isRule3
        ? 0
        : (o.settlement?.gstTcsAmount !== undefined
            ? Number(o.settlement.gstTcsAmount)
            : Math.round(((gross * 0.5) / 100) * 100) / 100);

      const ordTotalVal = Number(o.totalAmount || o.total || gross);
      const isAbove400 = ordTotalVal > 400;

      let deliveryChargeBorneBy = o.deliveryChargeBorneBy;
      if (!deliveryChargeBorneBy) {
        if (isAbove400) {
          deliveryChargeBorneBy = 'admin';
        } else if (o.isDeliveryBorneBySeller || o.deliveryBorneBy === 'seller') {
          deliveryChargeBorneBy = 'seller';
        } else if (Number(o.shippingAmount || o.shippingFee || 0) > 0) {
          deliveryChargeBorneBy = 'customer';
        } else {
          deliveryChargeBorneBy = isThirdParty ? 'seller' : 'admin';
        }
      }

      let delivDeduction = 0;
      if (isRule3) {
        delivDeduction = 0; // Self-delivery by seller
      } else if (o.settlement?.totalDeliveryDeduction !== undefined) {
        delivDeduction = Number(o.settlement.totalDeliveryDeduction);
      } else if (o.totalDeliveryDeduction !== undefined) {
        delivDeduction = Number(o.totalDeliveryDeduction);
      } else if (isThirdParty && deliveryChargeBorneBy === 'seller' && !isAbove400) {
        const rawDeliveryFee = Math.max(0, Number(o.deliveryCharge ?? o.shippingAmount ?? o.shippingFee ?? 40));
        delivDeduction = Math.round((rawDeliveryFee * 1.18) * 100) / 100;
      }

      const deductions = Math.round((commAmount + gstComm + tds + gstTcs + delivDeduction) * 100) / 100;

      // Rule 3: Cash collected by seller. Seller owes portal (-deductions).
      // Rule 1 & 2: Portal collected cash online and pays seller (gross - deductions).
      let finalNet;
      if (o.settlement?.netSettlementAmount !== undefined) {
        finalNet = Number(o.settlement.netSettlementAmount);
      } else if (isRule3) {
        finalNet = Math.round(-deductions * 100) / 100;
      } else {
        finalNet = Math.max(0, Math.round((gross - deductions) * 100) / 100);
      }

      grossSales += gross;
      totalPortalCommission += commAmount;
      totalGstOnCommission += gstComm;
      totalTds += tds;
      totalGstTcs += gstTcs;
      totalDeliveryDeductions += delivDeduction;
      totalDeductions += deductions;
      totalFinalSettlement += finalNet;
    });

    return {
      grossSales: Math.round(grossSales * 100) / 100,
      portalCommission: Math.round(totalPortalCommission * 100) / 100,
      gstOnCommission: Math.round(totalGstOnCommission * 100) / 100,
      tds: Math.round(totalTds * 100) / 100,
      gstTcs: Math.round(totalGstTcs * 100) / 100,
      deliveryDeductions: Math.round(totalDeliveryDeductions * 100) / 100,
      totalDeductions: Math.round(totalDeductions * 100) / 100,
      finalSettlement: Math.round(totalFinalSettlement * 100) / 100
    };
  }, [orders, commissionRate]);

  const netMargin = settlementSummary.finalSettlement;

  const pendingEscrow = useMemo(() => {
    return orders
      .filter(o => o.status === 'Pending' || o.status === 'Processing' || o.status === 'Shipped')
      .reduce((sum, o) => {
        const gross = Number(o.total || o.totalAmount || 0);
        const commRate = Number(o.commissionRate ?? commissionRate ?? 10);
        const commAmount = o.settlement?.commissionAmount !== undefined ? Number(o.settlement.commissionAmount) : Math.round(((gross * commRate) / 100) * 100) / 100;
        const gstComm = o.settlement?.gstOnCommissionAmount !== undefined ? Number(o.settlement.gstOnCommissionAmount) : Math.round(((commAmount * 18) / 100) * 100) / 100;
        const tds = o.settlement?.tdsAmount !== undefined ? Number(o.settlement.tdsAmount) : Math.round(((gross * 0.1) / 100) * 100) / 100;
        const gstTcs = o.settlement?.gstTcsAmount !== undefined ? Number(o.settlement.gstTcsAmount) : Math.round(((gross * 0.5) / 100) * 100) / 100;

        const rawDeliveryMode = String(o.deliveryMode || o.deliveryType || '').toLowerCase();
        const hasCourier = Boolean(o.courierName && o.courierName !== 'N/A' && o.courierName !== '');
        const isThirdParty = o.isThirdParty === true || rawDeliveryMode.includes('third') || rawDeliveryMode.includes('courier') || (hasCourier && !rawDeliveryMode.includes('self'));
        const ordTotalVal = Number(o.totalAmount || o.total || gross);
        const isAbove400 = ordTotalVal > 400;

        let deliveryChargeBorneBy = o.deliveryChargeBorneBy;
        if (!deliveryChargeBorneBy) {
          if (isAbove400) deliveryChargeBorneBy = 'admin';
          else if (o.isDeliveryBorneBySeller || o.deliveryBorneBy === 'seller') deliveryChargeBorneBy = 'seller';
          else if (Number(o.shippingAmount || o.shippingFee || 0) > 0) deliveryChargeBorneBy = 'customer';
          else deliveryChargeBorneBy = isThirdParty ? 'seller' : 'admin';
        }

        let delivDeduction = 0;
        if (o.settlement?.totalDeliveryDeduction !== undefined) delivDeduction = Number(o.settlement.totalDeliveryDeduction);
        else if (o.totalDeliveryDeduction !== undefined) delivDeduction = Number(o.totalDeliveryDeduction);
        else if (isThirdParty && deliveryChargeBorneBy === 'seller' && !isAbove400) {
          const rawDeliveryFee = Math.max(0, Number(o.deliveryCharge ?? o.shippingAmount ?? o.shippingFee ?? 40));
          delivDeduction = Math.round((rawDeliveryFee * 1.18) * 100) / 100;
        }

        const deductions = Math.round((commAmount + gstComm + tds + gstTcs + delivDeduction) * 100) / 100;
        return sum + Math.max(0, Math.round((gross - deductions) * 100) / 100);
      }, 0);
  }, [orders, commissionRate]);

  const availableBalance = useMemo(() => {
    return Math.max(0, netMargin - pendingEscrow);
  }, [netMargin, pendingEscrow]);

  // Dynamic ledger transactions combining order credits and payout requests
  const dynamicTransactions = useMemo(() => {
    const list = [];

    // Order credits & COD settlement adjustments
    orders.forEach(o => {
      const gross = Number(o.total || o.totalAmount || 0);
      const commRate = Number(o.commissionRate ?? commissionRate ?? 10);
      const commAmount = o.settlement?.commissionAmount !== undefined ? Number(o.settlement.commissionAmount) : Math.round(((gross * commRate) / 100) * 100) / 100;
      const gstComm = o.settlement?.gstOnCommissionAmount !== undefined ? Number(o.settlement.gstOnCommissionAmount) : Math.round(((commAmount * 18) / 100) * 100) / 100;
      const tds = o.settlement?.tdsAmount !== undefined ? Number(o.settlement.tdsAmount) : Math.round(((gross * 0.1) / 100) * 100) / 100;

      const rawDeliveryMode = String(o.deliveryMode || o.deliveryType || '').toLowerCase();
      const hasCourier = Boolean(o.courierName && o.courierName !== 'N/A' && o.courierName !== '');
      const isThirdParty = o.isThirdParty === true || rawDeliveryMode.includes('third') || rawDeliveryMode.includes('courier') || (hasCourier && !rawDeliveryMode.includes('self'));

      const rawPayment = String(o.paymentMethod || o.paymentMode || o.paymentType || '').toUpperCase();
      const isCod = rawPayment.includes('COD') || rawPayment.includes('CASH') || rawPayment.includes('DELIVERY');
      const isRule3 = isCod && !isThirdParty;

      // Rule 3: 0% GST TCS when portal does not collect customer cash
      const gstTcs = isRule3
        ? 0
        : (o.settlement?.gstTcsAmount !== undefined ? Number(o.settlement.gstTcsAmount) : Math.round(((gross * 0.5) / 100) * 100) / 100);

      const ordTotalVal = Number(o.totalAmount || o.total || gross);
      const isAbove400 = ordTotalVal > 400;

      let deliveryChargeBorneBy = o.deliveryChargeBorneBy;
      if (!deliveryChargeBorneBy) {
        if (isAbove400) deliveryChargeBorneBy = 'admin';
        else if (o.isDeliveryBorneBySeller || o.deliveryBorneBy === 'seller') deliveryChargeBorneBy = 'seller';
        else if (Number(o.shippingAmount || o.shippingFee || 0) > 0) deliveryChargeBorneBy = 'customer';
        else deliveryChargeBorneBy = isThirdParty ? 'seller' : 'admin';
      }

      let delivDeduction = 0;
      if (isRule3) {
        delivDeduction = 0;
      } else if (o.settlement?.totalDeliveryDeduction !== undefined) {
        delivDeduction = Number(o.settlement.totalDeliveryDeduction);
      } else if (o.totalDeliveryDeduction !== undefined) {
        delivDeduction = Number(o.totalDeliveryDeduction);
      } else if (isThirdParty && deliveryChargeBorneBy === 'seller' && !isAbove400) {
        const rawDeliveryFee = Math.max(0, Number(o.deliveryCharge ?? o.shippingAmount ?? o.shippingFee ?? 40));
        delivDeduction = Math.round((rawDeliveryFee * 1.18) * 100) / 100;
      }

      const totalDed = Math.round((commAmount + gstComm + tds + gstTcs + delivDeduction) * 100) / 100;
      const isRule4 = isCod && isThirdParty;
      let finalNet;
      if (o.settlement?.netSettlementAmount !== undefined) {
        finalNet = Number(o.settlement.netSettlementAmount);
      } else if (isRule3) {
        finalNet = Math.round(-totalDed * 100) / 100;
      } else {
        finalNet = Math.max(0, Math.round((gross - totalDed) * 100) / 100);
      }

      list.push({
        id: `TXN-ORD-${o.id}`,
        date: o.date || 'Recent Order',
        description: isRule3 
          ? `COD Sale #${o.id} (Cash collected by seller - Portal fee)`
          : isRule4
          ? `COD Sale #${o.id} (Courier remits cash to portal - Payout credit)`
          : `Customer Sale #${o.id} (${o.customerName || 'Buyer'})`,
        type: isRule3 ? 'Payable (COD)' : (isRule4 ? 'Credit (COD Courier)' : 'Credit'),
        grossAmount: gross,
        amount: finalNet,
        isRule3,
        isRule4,
        deliveryDeduction: delivDeduction,
        deductions: totalDed,
        isThirdParty,
        isAbove400,
        status: o.status === 'Delivered' ? 'Completed' : 'Pending'
      });
    });

    // Payout transactions from finance state
    if (Array.isArray(finance.recentTransactions)) {
      finance.recentTransactions.forEach(t => list.push(t));
    }

    return list;
  }, [orders, finance, commissionRate]);

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
            Book Vardi — Rule 1 (Self Delivery) & Rule 2 (Third-Party Courier Delivery) Transparent Payout Settlements
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

      {/* Book Vardi Official Settlement Rules (Rule 1, Rule 2 & Rule 3) Explainer Card */}
      <div className="bg-gradient-to-r from-teal-900 via-teal-950 to-emerald-950 text-white p-5 rounded-2xl shadow-sm border border-teal-800 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 font-bold text-sm text-teal-100">
            <ShieldCheck size={18} className="text-teal-300" />
            <span>Book Vardi — सेलर सेटलमेंट के नियम</span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] bg-teal-800/90 text-teal-200 px-2.5 py-0.5 rounded-full font-mono font-semibold border border-teal-700">
              1. Online Self
            </span>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full font-mono font-semibold border border-amber-400/40">
              2. Online Courier
            </span>
            <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2.5 py-0.5 rounded-full font-mono font-semibold border border-rose-400/40">
              3. COD Self
            </span>
            <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2.5 py-0.5 rounded-full font-mono font-semibold border border-purple-400/40">
              4. COD Courier
            </span>
          </div>
        </div>
        
        {/* 6 Rule Pillars Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1 text-xs">
          <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-xl border border-white/10">
            <div className="text-[9.5px] text-teal-200 font-bold uppercase tracking-wider">Gross Sale</div>
            <div className="text-sm font-extrabold text-white mt-0.5 font-mono">₹{settlementSummary.grossSales.toLocaleString('en-IN')}</div>
            <div className="text-[9.5px] text-teal-200 mt-0.5 leading-tight">कुल बिक्री राशि</div>
          </div>

          <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-xl border border-white/10">
            <div className="text-[9.5px] text-amber-200 font-bold uppercase tracking-wider">Portal Comm (10%)</div>
            <div className="text-sm font-extrabold text-amber-300 mt-0.5 font-mono">−₹{settlementSummary.portalCommission.toLocaleString('en-IN')}</div>
            <div className="text-[9.5px] text-amber-200 mt-0.5 leading-tight">पोर्टल का कमीशन</div>
          </div>

          <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-xl border border-white/10">
            <div className="text-[9.5px] text-indigo-200 font-bold uppercase tracking-wider">GST on Comm (18%)</div>
            <div className="text-sm font-extrabold text-indigo-300 mt-0.5 font-mono">−₹{settlementSummary.gstOnCommission.toLocaleString('en-IN')}</div>
            <div className="text-[9.5px] text-indigo-200 mt-0.5 leading-tight">कमीशन पर 18% GST</div>
          </div>

          <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-xl border border-white/10">
            <div className="text-[9.5px] text-sky-200 font-bold uppercase tracking-wider">TDS (0.1%) & TCS</div>
            <div className="text-sm font-extrabold text-sky-300 mt-0.5 font-mono">−₹{(settlementSummary.tds + settlementSummary.gstTcs).toFixed(2)}</div>
            <div className="text-[9.5px] text-sky-200 mt-0.5 leading-tight">TDS 0.1% | 0% TCS (Rule 3)</div>
          </div>

          <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-xl border border-white/10">
            <div className="text-[9.5px] text-rose-200 font-bold uppercase tracking-wider">Deliv. Ded. (Rule 2)</div>
            <div className="text-sm font-extrabold text-rose-300 mt-0.5 font-mono">−₹{(settlementSummary.deliveryDeductions || 0).toLocaleString('en-IN')}</div>
            <div className="text-[9.5px] text-rose-200 mt-0.5 leading-tight">कूरियर + 18% GST</div>
          </div>

          <div className="bg-emerald-500/20 backdrop-blur-xs p-2.5 rounded-xl border border-emerald-400/30 col-span-2 sm:col-span-1">
            <div className="text-[9.5px] text-emerald-300 font-bold uppercase tracking-wider">Final Settlement</div>
            <div className="text-sm font-black text-emerald-200 mt-0.5 font-mono">₹{settlementSummary.finalSettlement.toLocaleString('en-IN')}</div>
            <div className="text-[9.5px] text-emerald-300 mt-0.5 leading-tight">शुद्ध देय राशि</div>
          </div>
        </div>

        {/* Bilingual Settlement Guidelines */}
        <div className="pt-2 border-t border-white/15 text-[11px] space-y-1.5 text-teal-100/90">
          <div className="flex items-start gap-1.5">
            <span className="font-bold text-amber-300 shrink-0">₹400 से अधिक के ऑर्डर पर:</span>
            <span>यदि डिलीवरी का खर्च एडमिन उठाता है, तो सेलर से डिलीवरी चार्ज और उसका GST नहीं काटना है (₹0 डिलीवरी कटौती)।</span>
          </div>
          <div className="flex items-start gap-1.5">
            <span className="font-bold text-sky-300 shrink-0">GST TCS (Sec 52):</span>
            <span>पात्र बिक्री पर कुल 0.5% — एक ही राज्य (Intra-State) में 0.25% CGST + 0.25% SGST, या अंतरराज्यीय (Inter-State) बिक्री पर 0.5% IGST। (Rule 3 COD पर 0% TCS)।</span>
          </div>
          <div className="flex items-start gap-1.5">
            <span className="font-bold text-rose-300 shrink-0">COD + सेलर डिलीवरी (Rule 3):</span>
            <span>ग्राहक पूरा पैसा सीधे सेलर को देगा। 10% कमीशन + 18% GST + 0.1% TDS (0% TCS) पोर्टल में देय (-) होगा और सेलर का सेटलमेंट माइनस (-) में दिखेगा।</span>
          </div>
          <div className="flex items-start gap-1.5">
            <span className="font-bold text-purple-300 shrink-0">COD + कूरियर डिलीवरी (Rule 4):</span>
            <span>कूरियर ग्राहक से कैश लेकर पोर्टल को देगा। पोर्टल 10% कमीशन + 18% GST + 0.1% TDS + 0.5% TCS काटेगा। ₹400+ पर डिलीवरी फ्री, बची राशि सेलर को मिलेगी।</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <div className="text-[11px] font-semibold text-gray-500">Gross Sales Revenue</div>
          <div className="text-2xl font-extrabold text-gray-900 mt-1 font-mono">
            ₹{settlementSummary.grossSales.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-emerald-600 font-medium mt-1">
            {orders.length > 0 ? `${orders.length} total orders in database` : '0 sales recorded'}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <div className="text-[11px] font-semibold text-gray-500">Total Deductions (Comm + GST + Tax + Delivery)</div>
          <div className="text-2xl font-extrabold text-rose-700 mt-1 font-mono">
            ₹{settlementSummary.totalDeductions.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-rose-600 mt-1">10% Cut + 18% GST + 0.1% TDS + 0.5% TCS {settlementSummary.deliveryDeductions > 0 ? `+ ₹${settlementSummary.deliveryDeductions} Deliv.` : ''}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <div className="text-[11px] font-semibold text-gray-500">Final Seller Settlement</div>
          <div className="text-2xl font-extrabold text-teal-800 mt-1 font-mono">
            ₹{settlementSummary.finalSettlement.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-teal-700 mt-1">Net payable margin to seller account</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <div className="text-[11px] font-semibold text-gray-500">Available Settlement Balance</div>
          <div className="text-2xl font-extrabold text-emerald-700 mt-1 font-mono">
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
                    <td className="py-3.5 px-3">
                      <div className="font-medium text-gray-800">{txn.description}</div>
                      {txn.type === 'Credit' && (
                        <div className="text-[10px] text-gray-400 flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className={txn.isThirdParty ? 'text-amber-800 font-semibold' : 'text-teal-800 font-semibold'}>
                            {txn.isThirdParty ? 'Rule 2 (Courier)' : 'Rule 1 (Self)'}
                          </span>
                          {txn.isThirdParty && txn.isAbove400 && (
                            <span className="text-teal-800 font-semibold bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200">
                              &gt;₹400 Free Deliv.
                            </span>
                          )}
                          {txn.deliveryDeduction > 0 && (
                            <span className="text-rose-700 font-medium bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                              Deliv Ded: -₹{txn.deliveryDeduction}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        txn.type === 'Credit' ? 'bg-emerald-100 text-emerald-800' :
                        txn.type === 'Payable (COD)' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                        txn.type === 'Payout' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {txn.type}
                      </span>
                    </td>
                    <td className={`py-3.5 px-3 font-extrabold text-sm ${
                      txn.amount > 0 ? 'text-emerald-700' : (txn.amount < 0 ? 'text-rose-700' : 'text-gray-900')
                    }`}>
                      <div>{txn.amount > 0 ? `+₹${txn.amount.toLocaleString('en-IN')}` : (txn.amount < 0 ? `-₹${Math.abs(txn.amount).toLocaleString('en-IN')}` : `₹${txn.amount.toLocaleString('en-IN')}`)}</div>
                      {txn.grossAmount !== undefined && (
                        <div className="text-[10px] text-gray-400 font-normal">
                          {txn.isRule3 ? `Cash collected by seller (Portal fee: -₹${txn.deductions})` : `Gross ₹${txn.grossAmount} (Ded: -₹${txn.deductions})`}
                        </div>
                      )}
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
                  type="password"
                  required
                  value={bankForm.accountNumber}
                  onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                  placeholder="e.g. 50200084920194"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 font-mono focus:outline-none focus:border-teal-700"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">Confirm Bank Account Number *</label>
                <input
                  type="text"
                  required
                  value={bankForm.confirmAccountNumber || ''}
                  onChange={(e) => setBankForm({ ...bankForm, confirmAccountNumber: e.target.value })}
                  placeholder="Re-enter Bank Account Number to Confirm"
                  className={`w-full px-3 py-2 rounded-xl border font-mono focus:outline-none focus:border-teal-700 ${
                    bankForm.confirmAccountNumber && bankForm.confirmAccountNumber !== bankForm.accountNumber
                      ? 'border-red-500 bg-red-50/50'
                      : 'border-gray-200'
                  }`}
                />
                {bankForm.confirmAccountNumber && bankForm.confirmAccountNumber !== bankForm.accountNumber && (
                  <p className="text-[11px] font-bold text-red-600 mt-1">⚠️ Bank account numbers do not match!</p>
                )}
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
