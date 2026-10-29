import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  AlertCircle,
  HelpCircle,
  Lock,
  Unlock,
  Info,
  FileSpreadsheet
} from 'lucide-react';
import { useSellerData } from '../context/SellerDataContext';
import { SERVER_URL } from '../utils/api';

// Helper to evaluate settlement maturity for an order:
// 1. Non-Return / Non-Exchange Orders: Matures strictly after (Return window + 1) days from delivery (e.g. 7d + 1d = 8d, or 0d + 1d = 1d)
// 2. Exchanged Orders: Matures strictly 1 day after the exchange date (exchangeDate + 1 day)
// Helper to reliably resolve if an order is Third-Party Courier or Direct Self-Delivery
const checkOrderIsThirdParty = (o) => {
  const rawDeliveryMode = String(o.deliveryMode || o.deliveryType || '').toLowerCase();
  const hasCourier = Boolean(o.courierName && o.courierName !== 'N/A' && o.courierName !== '');
  const hasSelfDeliveryDetails = Boolean(
    o.selfDeliveryDetails?.deliveryPartnerToken || 
    o.selfDeliveryDetails?.deliveryPersonName ||
    o.deliveryOtp ||
    (o.items || []).some(it => it.selfDeliveryDetails?.deliveryPartnerToken || it.selfDeliveryDetails?.deliveryPersonName || it.deliveryOtp)
  );
  const isExplicitSelf = rawDeliveryMode.includes('self') || 
                         o.settlementRule === 'COD_SELF_DELIVERY' || 
                         o.settlement?.settlementRule === 'COD_SELF_DELIVERY' ||
                         (o.items || []).some(it => it.settlementRule === 'COD_SELF_DELIVERY') || 
                         Boolean((o.deliveryOtp || hasSelfDeliveryDetails) && !hasCourier);
  const isExplicitThirdParty = o.settlementRule === 'COD_THIRD_PARTY_DELIVERY' ||
                               o.settlementRule === 'ONLINE_THIRD_PARTY_DELIVERY' ||
                               o.settlement?.settlementRule === 'COD_THIRD_PARTY_DELIVERY' ||
                               o.settlement?.settlementRule === 'ONLINE_THIRD_PARTY_DELIVERY' ||
                               (o.items || []).some(it => it.settlementRule === 'COD_THIRD_PARTY_DELIVERY' || it.settlementRule === 'ONLINE_THIRD_PARTY_DELIVERY') ||
                               rawDeliveryMode.includes('third') || 
                               rawDeliveryMode.includes('courier') || 
                               hasCourier ||
                               (o.items || []).some(it => String(it.deliveryType || '').toLowerCase().includes('third') || Boolean(it.thirdPartyDetails?.courierName));
  return isExplicitThirdParty || !isExplicitSelf;
};

export const EXEMPTED_GST_NUMBERS = [
  "09BLMPK2840L2ZN"
];

export function isGstExempted(gst) {
  if (!gst) return false;
  const clean = String(gst).trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  return EXEMPTED_GST_NUMBERS.some(item => clean === item.trim().toUpperCase().replace(/[^A-Z0-9]/g, ""));
}

// 3. Returned / Refunded Orders: Settlement reversed, Credit note auto-recognized under Sec 34
const evaluateOrderMaturity = (order) => {
  const normStatus = String(order.status || order.overallStatus || '').toLowerCase().trim();
  const returnReqStatus = String(order.returnRequest?.status || '').toLowerCase().trim();

  const isDelivered = normStatus.includes('delivered');
  const isExchanged = normStatus === 'exchanged' || returnReqStatus === 'exchanged';
  const isRefunded = ['refunded', 'refund_completed', 'refund_processed'].includes(normStatus) || 
                     ['refunded', 'refund_completed', 'refund_processed'].includes(returnReqStatus);

  // 1. Return & Refund Completed: Settlement reversed, auto credit note
  if (isRefunded) {
    return {
      isDelivered: true,
      isMatured: false,
      isRefunded: true,
      status: 'refunded',
      label: 'Refunded (Settlement Reversed)',
      daysRemaining: null,
      maturityDate: null,
      creditNoteNumber: order.creditNoteNumber || `CN-${order.orderId || order.id || ''}`
    };
  }

  // 2. Exchanged Orders: Settlement unlocks strictly 1 day after exchange date!
  if (isExchanged) {
    const exchangeDateRaw = order.exchangedAt || order.returnRequest?.exchangedAt || order.updatedAt || order.date || order.createdAt;
    const exchangeDate = exchangeDateRaw ? new Date(exchangeDateRaw) : new Date();
    const maturityDate = order.settlementDueDate 
      ? new Date(order.settlementDueDate) 
      : new Date(exchangeDate.getTime() + 1 * 24 * 60 * 60 * 1000);
    const now = Date.now();
    const diffMs = maturityDate.getTime() - now;
    const isMatured = diffMs <= 0 || order.isSettlementMatured === true || order.settlementStatus === 'matured' || order.settlementStatus === 'credited';
    const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    return {
      isDelivered: true,
      isExchanged: true,
      isMatured,
      status: isMatured ? 'matured' : 'in_exchange_buffer',
      label: isMatured ? 'Settled & Available (Exchanged)' : `Exchange Buffer (${daysRemaining || 1}d left)`,
      daysRemaining: isMatured ? 0 : (daysRemaining || 1),
      maturityDate,
      totalWindowDays: 1
    };
  }

  // 3. Active return or exchange in progress (pending resolution): Frozen on hold
  const hasActiveReturnRequest = Boolean(
    order.returnRequest &&
    !['no_request', 'rejected', 'return_rejected', 'exchange_rejected', 'exchanged', 'refunded', 'refund_completed'].includes(returnReqStatus)
  );
  if (hasActiveReturnRequest) {
    return {
      isDelivered: true,
      isMatured: false,
      isOnHold: true,
      status: 'on_hold',
      label: 'On Hold (Return/Exchange)',
      daysRemaining: null,
      maturityDate: null
    };
  }

  // 4. Order In Transit / Not Delivered
  if (!isDelivered) {
    return { isDelivered: false, isMatured: false, daysRemaining: null, maturityDate: null, status: 'pending' };
  }

  // 5. Already matured / credited in DB
  if (order.isSettlementMatured === true || order.settlementStatus === 'matured' || order.settlementStatus === 'credited' || order.settlementStatus === 'paid_out') {
    return { 
      isDelivered: true, 
      isMatured: true, 
      status: 'matured',
      label: 'Settled & Available',
      daysRemaining: 0, 
      maturityDate: order.settlementDueDate ? new Date(order.settlementDueDate) : null 
    };
  }

  // 6. Normal Non-Return / Non-Exchange Orders:
  // Non-returnable & non-exchangeable orders mature in 0 + 1 = 1 day (agale din hi settlement).
  // Returnable orders mature after returnWindowDays + 1 day buffer.
  const isNonReturnable = (
    order.isReturnable === false ||
    String(order.returnPolicy || '').toLowerCase().includes('non_returnable') ||
    String(order.returnPolicy || '').toLowerCase().includes('no_return')
  );
  const isNonExchangeable = (
    order.isExchangeable === false ||
    String(order.returnPolicy || '').toLowerCase().includes('non_exchangeable') ||
    String(order.returnPolicy || '').toLowerCase().includes('no_exchange')
  );

  const returnDays = (isNonReturnable && isNonExchangeable) ? 0 : Number(order.returnWindowDays ?? 7);
  const bufferDays = 1; // + 1 din baad settlement
  const totalWindowDays = returnDays + bufferDays;

  let deliveredDate = null;
  if (order.deliveredAt) deliveredDate = new Date(order.deliveredAt);
  else if (order.updatedAt) deliveredDate = new Date(order.updatedAt);
  else if (order.date) deliveredDate = new Date(order.date);
  else deliveredDate = new Date();

  let maturityDate = order.settlementDueDate 
    ? new Date(order.settlementDueDate) 
    : new Date(deliveredDate.getTime() + totalWindowDays * 24 * 60 * 60 * 1000);

  const now = Date.now();
  const diffMs = maturityDate.getTime() - now;
  const isMatured = diffMs <= 0;
  const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  return {
    isDelivered: true,
    isMatured,
    status: isMatured ? 'matured' : 'in_return_window',
    label: isMatured ? 'Settled & Available' : `In Return Window (${daysRemaining}d left)`,
    daysRemaining: isMatured ? 0 : daysRemaining,
    maturityDate,
    totalWindowDays
  };
};

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

  const navigate = useNavigate();
  const [payoutRequested, setPayoutRequested] = useState(false);
  const [activeRuleTab, setActiveRuleTab] = useState('rule2');
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditBankModalOpen, setIsEditBankModalOpen] = useState(false);

  const [platformThreshold, setPlatformThreshold] = useState(() => {
    try {
      const s = JSON.parse(localStorage.getItem('bookvardi_platform_settings') || localStorage.getItem('admin_settings') || '{}');
      return Number(s?.freeShippingThreshold || s?.minOrderFreeShipping || s?.freeDeliveryThreshold) || 1000;
    } catch {
      return 1000;
    }
  });
  useEffect(() => {
    fetch(`${SERVER_URL}/admin/settings/public`)
      .then(res => res.json())
      .then(data => {
        const val = Number(data.freeShippingThreshold ?? data.minOrderFreeShipping ?? data.freeDeliveryThreshold);
        if (!isNaN(val) && val > 0) {
          setPlatformThreshold(val);
        }
      })
      .catch(() => {});
  }, []);

  const resolvedFreeDeliveryThreshold = useMemo(() => {
    for (const o of orders) {
      const val = Number(o.freeDeliveryThreshold ?? o.minOrderFreeShipping ?? o.freeShippingThreshold);
      if (!isNaN(val) && val > 0 && val !== 401) return val;
    }
    return platformThreshold || 1000;
  }, [orders, platformThreshold]);

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
        bankDetails: updatedBankDetails,
        bankVerificationStatus: 'pending',
        status: 'pending'
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
        bankBranch: bankForm.branch,
        bankVerificationStatus: 'pending',
        status: 'pending'
      };
      localStorage.setItem('bv_seller_reg_data', JSON.stringify(regObj));
      localStorage.setItem('bv_seller_status', 'pending');
    } catch {}

    setIsEditBankModalOpen(false);
    if (showToast) showToast('📋 Bank account details updated! Application submitted for Admin approval before payouts are activated.');
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

      // Rule 2 & 4: Delivery Charges + 18% GST (Third-Party Delivery)
      const isThirdParty = checkOrderIsThirdParty(o);
      const rawPayment = String(o.paymentMethod || o.paymentMode || o.paymentType || '').toUpperCase();
      const isCod = rawPayment.includes('COD') || rawPayment.includes('CASH') || rawPayment.includes('DELIVERY');
      const isRule3 = isCod && !isThirdParty;

      // Rule 3: 0% GST TCS when portal does not collect customer payment
      const gstTcs = isRule3
        ? 0
        : (o.settlement?.gstTcsAmount !== undefined
            ? Number(o.settlement.gstTcsAmount)
            : Math.round((((gross / 1.05) * 0.5) / 100) * 100) / 100);

      const ordTotalVal = Number(o.totalAmount || o.total || gross);
      const orderThreshold = Number(o.freeDeliveryThreshold ?? o.minOrderFreeShipping ?? resolvedFreeDeliveryThreshold);
      const isAbove400 = ordTotalVal >= orderThreshold;

      const custShipping = Number(o.shippingAmount ?? o.shippingFee ?? o.shippingCost ?? 0);
      let deliveryChargeBorneBy = o.deliveryChargeBorneBy;
      if (!deliveryChargeBorneBy || custShipping > 0) {
        if (isAbove400) {
          deliveryChargeBorneBy = 'admin';
        } else if (custShipping > 0) {
          deliveryChargeBorneBy = 'customer';
        } else if (o.isDeliveryBorneBySeller || o.deliveryBorneBy === 'seller') {
          deliveryChargeBorneBy = 'seller';
        } else {
          deliveryChargeBorneBy = isThirdParty ? 'seller' : 'admin';
        }
      }

      let delivDeduction = 0;
      if (isRule3 || deliveryChargeBorneBy === 'customer' || deliveryChargeBorneBy === 'admin' || isAbove400) {
        delivDeduction = 0; // Self-delivery, customer-paid, or admin-borne
      } else if (o.settlement?.totalDeliveryDeduction !== undefined) {
        delivDeduction = Number(o.settlement.totalDeliveryDeduction);
      } else if (o.totalDeliveryDeduction !== undefined) {
        delivDeduction = Number(o.totalDeliveryDeduction);
      } else if (isThirdParty && deliveryChargeBorneBy === 'seller' && !isAbove400) {
        const rawDeliveryFee = Math.max(0, Number(o.deliveryCharge ?? o.shippingAmount ?? o.shippingFee ?? o.shippingCost ?? 49));
        // Delivery charges are GST INCLUSIVE
        delivDeduction = Math.round(rawDeliveryFee * 100) / 100;
      }

      // COD Charges Policy:
      // Self Delivery: COD charge belongs to Seller (₹0 portal deduction)
      // Courier Delivery: COD charge belongs to Portal
      // Exemption: 09BLMPK2840L2ZN is exempt - no COD charge deduction in courier delivery
      const isSellerExemptGst = isGstExempted(sellerUser?.gstNumber || sellerUser?.gstin || o.sellerDetails?.gstNumber) ||
        String(sellerUser?.storeName || sellerUser?.sellerStoreName || o.sellerStoreName || '').toLowerCase().includes('national school dress');
      const rawCodFee = Number(o.codFee ?? o.codCharges ?? o.settlement?.codChargeAmount ?? 0);
      let codDeduction = 0;
      if (isCod && rawCodFee > 0) {
        if (!isThirdParty) {
          codDeduction = 0; // Self delivery: Seller retains COD charge
        } else if (isSellerExemptGst || o.settlement?.isCodExempted) {
          codDeduction = 0; // 09BLMPK2840L2ZN: Exempt from COD charge deduction
        } else if (o.settlement?.codChargeDeduction !== undefined) {
          codDeduction = Number(o.settlement.codChargeDeduction);
        } else {
          codDeduction = rawCodFee;
        }
      }

      const deductions = Math.round((commAmount + gstComm + tds + gstTcs + delivDeduction + codDeduction) * 100) / 100;

      // Rule 3: Cash collected by seller. Seller owes portal (-deductions).
      // Rule 1, 2 & 4: Portal collected cash (online or courier) and pays seller (gross - deductions).
      let finalNet;
      if (o.settlement?.netSettlementAmount !== undefined && (isRule3 ? o.settlement.netSettlementAmount <= 0 : o.settlement.netSettlementAmount >= 0)) {
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

  // Aggregate Specific Metrics for Rules 1, 2, 3, 4
  const ruleMetrics = useMemo(() => {
    const rules = {
      rule1: { gross: 0, comm: 0, gstComm: 0, tds: 0, tcs: 0, deliv: 0, ded: 0, net: 0, count: 0 },
      rule2: { gross: 0, comm: 0, gstComm: 0, tds: 0, tcs: 0, deliv: 0, ded: 0, net: 0, count: 0 },
      rule3: { gross: 0, comm: 0, gstComm: 0, tds: 0, tcs: 0, deliv: 0, ded: 0, net: 0, count: 0 },
      rule4: { gross: 0, comm: 0, gstComm: 0, tds: 0, tcs: 0, deliv: 0, ded: 0, net: 0, count: 0 },
    };

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

      const isThirdParty = checkOrderIsThirdParty(o);
      const rawPayment = String(o.paymentMethod || o.paymentMode || o.paymentType || '').toUpperCase();
      const isCod = rawPayment.includes('COD') || rawPayment.includes('CASH') || rawPayment.includes('DELIVERY');
      const isRule3 = isCod && !isThirdParty;
      const isRule4 = isCod && isThirdParty;
      const ruleKey = isRule3 ? 'rule3' : (isRule4 ? 'rule4' : (isThirdParty ? 'rule2' : 'rule1'));

      const gstTcs = isRule3 ? 0 : (o.settlement?.gstTcsAmount !== undefined ? Number(o.settlement.gstTcsAmount) : Math.round((((gross / 1.05) * 0.5) / 100) * 100) / 100);
      const ordTotalVal = Number(o.totalAmount || o.total || gross);
      const orderThreshold = Number(o.freeDeliveryThreshold ?? o.minOrderFreeShipping ?? resolvedFreeDeliveryThreshold);
      const isAbove400 = ordTotalVal >= orderThreshold;

      let deliveryChargeBorneBy = o.deliveryChargeBorneBy;
      if (!deliveryChargeBorneBy) {
        if (isAbove400) deliveryChargeBorneBy = 'admin';
        else if (o.isDeliveryBorneBySeller || o.deliveryBorneBy === 'seller') deliveryChargeBorneBy = 'seller';
        else if (Number(o.shippingAmount || o.shippingFee || 0) > 0) deliveryChargeBorneBy = 'customer';
        else deliveryChargeBorneBy = isThirdParty ? 'seller' : 'admin';
      }

      let delivDeduction = 0;
      if (!isRule3 && isThirdParty && deliveryChargeBorneBy === 'seller' && !isAbove400) {
        const itemRates = (o.items || []).map(it => {
          const cat = String(it.category || '').toLowerCase();
          const isBook = cat.includes('book') || cat.includes('textbook') || String(it.name || '').toLowerCase().includes('book');
          return Number(it.gstPercent ?? it.gstPercentage ?? it.gstRate ?? it.gst ?? (isBook ? 0 : 5));
        }).filter(r => !isNaN(r));
        const ordProdGstRate = itemRates.length > 0 ? Math.max(...itemRates) : 5;
        const rawDeliveryFee = Math.max(0, Number(o.deliveryCharge ?? o.shippingAmount ?? o.shippingFee ?? 40));
        delivDeduction = Math.round((rawDeliveryFee * (1 + (ordProdGstRate / 100))) * 100) / 100;
      }

      const deductions = Math.round((commAmount + gstComm + tds + gstTcs + delivDeduction) * 100) / 100;
      const finalNet = isRule3 ? Math.round(-deductions * 100) / 100 : Math.max(0, Math.round((gross - deductions) * 100) / 100);

      rules[ruleKey].gross += gross;
      rules[ruleKey].comm += commAmount;
      rules[ruleKey].gstComm += gstComm;
      rules[ruleKey].tds += tds;
      rules[ruleKey].tcs += gstTcs;
      rules[ruleKey].deliv += delivDeduction;
      rules[ruleKey].ded += deductions;
      rules[ruleKey].net += finalNet;
      rules[ruleKey].count += 1;
    });

    Object.keys(rules).forEach(k => {
      rules[k].gross = Math.round(rules[k].gross * 100) / 100;
      rules[k].comm = Math.round(rules[k].comm * 100) / 100;
      rules[k].gstComm = Math.round(rules[k].gstComm * 100) / 100;
      rules[k].tds = Math.round(rules[k].tds * 100) / 100;
      rules[k].tcs = Math.round(rules[k].tcs * 100) / 100;
      rules[k].deliv = Math.round(rules[k].deliv * 100) / 100;
      rules[k].ded = Math.round(rules[k].ded * 100) / 100;
      rules[k].net = Math.round(rules[k].net * 100) / 100;
    });

    return rules;
  }, [orders, commissionRate]);

  const netMargin = settlementSummary.finalSettlement;

  const pendingEscrow = useMemo(() => {
    // If backend provided pendingSettlementBalance directly and it's valid
    if (finance?.wallet?.pendingSettlementBalance !== undefined && Number(finance.wallet.pendingSettlementBalance) >= 0) {
      return Number(finance.wallet.pendingSettlementBalance);
    }
    return orders
      .filter(o => {
        const maturity = evaluateOrderMaturity(o);
        if (maturity.isRefunded) return false;
        // Include non-delivered orders (Pending, Processing, Shipped) or delivered/exchanged orders still in window/buffer
        return !maturity.isDelivered || !maturity.isMatured;
      })
      .reduce((sum, o) => {
        const gross = Number(o.total || o.totalAmount || 0);
        const commRate = Number(o.commissionRate ?? commissionRate ?? 10);
        const commAmount = o.settlement?.commissionAmount !== undefined ? Number(o.settlement.commissionAmount) : Math.round(((gross * commRate) / 100) * 100) / 100;
        const gstComm = o.settlement?.gstOnCommissionAmount !== undefined ? Number(o.settlement.gstOnCommissionAmount) : Math.round(((commAmount * 18) / 100) * 100) / 100;
        const tds = o.settlement?.tdsAmount !== undefined ? Number(o.settlement.tdsAmount) : Math.round(((gross * 0.1) / 100) * 100) / 100;
        const gstTcs = o.settlement?.gstTcsAmount !== undefined ? Number(o.settlement.gstTcsAmount) : Math.round((((gross / 1.05) * 0.5) / 100) * 100) / 100;

        const isThirdParty = checkOrderIsThirdParty(o);
        const ordTotalVal = Number(o.totalAmount || o.total || gross);
        const orderThreshold = Number(o.freeDeliveryThreshold ?? o.minOrderFreeShipping ?? resolvedFreeDeliveryThreshold);
        const isAbove400 = ordTotalVal >= orderThreshold;

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
          const itemRates = (o.items || []).map(it => {
            const cat = String(it.category || '').toLowerCase();
            const isBook = cat.includes('book') || cat.includes('textbook') || String(it.name || '').toLowerCase().includes('book');
            return Number(it.gstPercent ?? it.gstPercentage ?? it.gstRate ?? it.gst ?? (isBook ? 0 : 5));
          }).filter(r => !isNaN(r));
          const ordProdGstRate = itemRates.length > 0 ? Math.max(...itemRates) : 5;
          const rawDeliveryFee = Math.max(0, Number(o.deliveryCharge ?? o.shippingAmount ?? o.shippingFee ?? 40));
          delivDeduction = Math.round((rawDeliveryFee * (1 + (ordProdGstRate / 100))) * 100) / 100;
        }

        const deductions = Math.round((commAmount + gstComm + tds + gstTcs + delivDeduction) * 100) / 100;
        return sum + Math.max(0, Math.round((gross - deductions) * 100) / 100);
      }, 0);
  }, [orders, commissionRate, finance]);

  const availableBalance = useMemo(() => {
    if (finance?.wallet?.walletBalance !== undefined && !isNaN(Number(finance.wallet.walletBalance))) {
      return Math.max(0, Number(finance.wallet.walletBalance));
    }
    return Math.max(0, netMargin - pendingEscrow);
  }, [finance, netMargin, pendingEscrow]);

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

      const isThirdParty = checkOrderIsThirdParty(o);
      const rawPayment = String(o.paymentMethod || o.paymentMode || o.paymentType || '').toUpperCase();
      const isCod = rawPayment.includes('COD') || rawPayment.includes('CASH') || rawPayment.includes('DELIVERY');
      const isRule3 = isCod && !isThirdParty;

      // Rule 3: 0% GST TCS when portal does not collect customer cash
      const gstTcs = isRule3
        ? 0
        : (o.settlement?.gstTcsAmount !== undefined ? Number(o.settlement.gstTcsAmount) : Math.round((((gross / 1.05) * 0.5) / 100) * 100) / 100);

      const ordTotalVal = Number(o.totalAmount || o.total || gross);
      const orderThreshold = Number(o.freeDeliveryThreshold ?? o.minOrderFreeShipping ?? resolvedFreeDeliveryThreshold);
      const isAbove400 = ordTotalVal >= orderThreshold;

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

      const maturity = evaluateOrderMaturity(o);
      let statusLabel = 'Pending Dispatch';
      let statusType = 'pending';
      if (maturity.isRefunded) {
        statusLabel = 'Refunded (Settlement Reversed)';
        statusType = 'refunded';
      } else if (maturity.isDelivered) {
        if (maturity.isMatured) {
          statusLabel = maturity.isExchanged ? 'Settled & Available (Exchanged)' : 'Settled & Available';
          statusType = 'settled';
        } else if (maturity.isOnHold) {
          statusLabel = 'On Hold (Return/Exchange)';
          statusType = 'on_hold';
        } else if (maturity.isExchanged) {
          statusLabel = `In Exchange Buffer (${maturity.daysRemaining}d left)`;
          statusType = 'escrow';
        } else {
          statusLabel = `In Return Window (${maturity.daysRemaining}d left)`;
          statusType = 'escrow';
        }
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
        status: statusLabel,
        statusType,
        daysRemaining: maturity.daysRemaining,
        maturityDate: maturity.maturityDate
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

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => navigate('/reports')}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl border border-gray-200 transition-colors cursor-pointer"
            title="Open Detailed Tax & Invoiced Billing Reports"
          >
            <FileSpreadsheet size={15} className="text-teal-700" />
            <span>Billing & Reports</span>
          </button>

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
            <button
              type="button"
              onClick={() => setActiveRuleTab('rule1')}
              className={`text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full border transition-all cursor-pointer ${
                activeRuleTab === 'rule1' ? 'bg-teal-500 text-white border-teal-300 shadow-xs' : 'bg-teal-800/90 text-teal-200 border-teal-700 hover:bg-teal-700'
              }`}
            >
              1. Online Self
            </button>
            <button
              type="button"
              onClick={() => setActiveRuleTab('rule2')}
              className={`text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full border transition-all cursor-pointer ${
                activeRuleTab === 'rule2' ? 'bg-amber-500 text-amber-950 border-amber-300 shadow-xs font-black ring-2 ring-amber-300' : 'bg-amber-500/20 text-amber-300 border-amber-400/40 hover:bg-amber-500/30'
              }`}
            >
              2. Online Courier
            </button>
            <button
              type="button"
              onClick={() => setActiveRuleTab('rule3')}
              className={`text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full border transition-all cursor-pointer ${
                activeRuleTab === 'rule3' ? 'bg-rose-500 text-white border-rose-300 shadow-xs' : 'bg-rose-500/20 text-rose-300 border-rose-400/40 hover:bg-rose-500/30'
              }`}
            >
              3. COD Self
            </button>
            <button
              type="button"
              onClick={() => setActiveRuleTab('rule4')}
              className={`text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full border transition-all cursor-pointer ${
                activeRuleTab === 'rule4' ? 'bg-purple-500 text-white border-purple-300 shadow-xs' : 'bg-purple-500/20 text-purple-300 border-purple-400/40 hover:bg-purple-500/30'
              }`}
            >
              4. COD Courier
            </button>
            <button
              type="button"
              onClick={() => setActiveRuleTab('all')}
              className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                activeRuleTab === 'all' ? 'bg-white text-gray-900 border-white font-bold' : 'bg-white/10 text-white/80 border-white/20 hover:bg-white/20'
              }`}
            >
              All Rules
            </button>
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
            <div className="text-[9.5px] text-amber-200 font-bold uppercase tracking-wider">Portal Comm ({commissionRate}%)</div>
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

        {/* Client Rule Specification Detailed Card */}
        {activeRuleTab === 'rule2' && (
          <div className="bg-amber-50 text-gray-900 p-4 rounded-xl border border-amber-300 space-y-2 text-xs shadow-xs">
            <div className="flex items-center justify-between border-b border-amber-200 pb-1.5 flex-wrap gap-2">
              <div>
                <span className="font-extrabold text-amber-950 text-xs sm:text-sm flex items-center gap-1.5">
                  ⚡ 2. Online Payment + Third-Party Delivery (ऑनलाइन भुगतान + कूरियर से डिलीवरी)
                </span>
                <span className="text-[10px] text-amber-800 font-medium block">
                  बुक वर्दी आधिकारिक सेलर सेटलमेंट नियम (Book Vardi Official Norms)
                </span>
              </div>
              <span className="text-[10px] bg-amber-200 text-amber-950 font-black px-2.5 py-0.5 rounded-full border border-amber-400">
                Rule 2 Active ({ruleMetrics.rule2.count} Orders)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
              <div className="flex items-start gap-1.5">
                <span className="text-amber-800 font-bold">•</span>
                <span><strong>Gross Sale:</strong> ग्राहक से प्राप्त कुल बिक्री राशि (Total Sales Value)।</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-amber-800 font-bold">•</span>
                <span><strong>Portal Commission:</strong> {commissionRate}% (या निर्धारित दर) — पोर्टल का कमीशन।</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-amber-800 font-bold">•</span>
                <span><strong>GST on Commission:</strong> 18% — कमीशन पर 18% GST।</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-amber-800 font-bold">•</span>
                <span><strong>TDS:</strong> 0.1% — आयकर Sec 194-O लागू TDS की कटौती।</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-amber-800 font-bold">•</span>
                <span><strong>GST TCS:</strong> 0.5% (0.25% CGST + 0.25% SGST / 0.5% IGST) — जहाँ GST कानून अनुसार लागू हो (किताबों पर 0%)।</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-amber-800 font-bold">•</span>
                <span><strong>Delivery Charges (कूरियर डिलीवरी खर्च - GST सहित):</strong> डिलीवरी का खर्च (GST सहित) तभी काटें, जब यह खर्च सेलर के जिम्मे हो।</span>
              </div>
              <div className="flex items-start gap-1.5 md:col-span-2 bg-amber-100 p-2.5 rounded-lg border border-amber-300 text-amber-950 font-medium">
                <span className="font-extrabold text-amber-900 shrink-0">✨ ₹{resolvedFreeDeliveryThreshold} या अधिक के ऑर्डर पर:</span>
                <span>यदि डिलीवरी का खर्च एडमिन उठाता है, तो सेलर से डिलीवरी चार्ज और उसका GST नहीं काटना है (सेलर से ₹0 डिलीवरी कटौती)।</span>
              </div>
              <div className="flex items-start gap-1.5 md:col-span-2">
                <span className="text-amber-800 font-bold">•</span>
                <span><strong>Final Seller Settlement:</strong> सभी लागू कटौतियों के बाद बची शुद्ध राशि सेलर के बैंक खाते में दी जाएगी।</span>
              </div>
            </div>

            <div className="pt-2 border-t border-amber-200 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-amber-950">Rule 2 Formula:</span>
                <span className="bg-white text-emerald-900 font-mono font-bold px-2 py-0.5 rounded border border-emerald-300 text-[11px]">
                  Gross Sale (₹{ruleMetrics.rule2.gross.toLocaleString('en-IN')})
                </span>
                <span>−</span>
                <span className="bg-white text-amber-950 font-mono font-bold px-2 py-0.5 rounded border border-amber-300 text-[11px]">
                  Total Deductions (₹{ruleMetrics.rule2.ded.toLocaleString('en-IN')})
                </span>
                <span>=</span>
                <span className="bg-teal-100 text-teal-950 font-mono font-extrabold px-2.5 py-0.5 rounded border border-teal-400 text-[11px]">
                  Final Settlement (₹{ruleMetrics.rule2.net.toLocaleString('en-IN')})
                </span>
              </div>
              <span className="text-[10px] text-amber-900 italic font-medium">
                *Book Vardi Multi-Vendor Rule 2 Engine
              </span>
            </div>
          </div>
        )}

        {activeRuleTab === 'rule1' && (
          <div className="bg-teal-50 text-gray-900 p-3.5 rounded-xl border border-teal-300 text-xs space-y-1.5">
            <div className="flex items-center justify-between border-b border-teal-200 pb-1">
              <h5 className="font-extrabold text-teal-950">1. Online Payment + Self Delivery (ऑनलाइन भुगतान + सेलर डिलीवरी)</h5>
              <span className="text-[10px] bg-teal-200 text-teal-950 font-bold px-2 py-0.5 rounded-full">Rule 1 ({ruleMetrics.rule1.count} Orders)</span>
            </div>
            <p className="text-[11px]">• Gross − [{commissionRate}% Comm + 18% GST + 0.1% TDS + 0.5% TCS] = Net Settlement। (सेलर स्वयं डिलीवरी करता है, ₹0 कूरियर कटौती)।</p>
          </div>
        )}

        {activeRuleTab === 'rule3' && (
          <div className="bg-rose-50 text-gray-900 p-3.5 rounded-xl border border-rose-300 text-xs space-y-1.5">
            <div className="flex items-center justify-between border-b border-rose-200 pb-1">
              <h5 className="font-extrabold text-rose-950">3. COD + Self Delivery (कैश ऑन डिलीवरी + सेलर डिलीवरी)</h5>
              <span className="text-[10px] bg-rose-200 text-rose-950 font-bold px-2 py-0.5 rounded-full">Rule 3 ({ruleMetrics.rule3.count} Orders)</span>
            </div>
            <p className="text-[11px]">• ग्राहक पूरा पैसा सेलर को कैश देता है। पोर्टल {commissionRate}% Comm + 18% GST + 0.1% TDS (0% TCS) लेगा। सेटलमेंट माइनस (−Deductions) दिखेगा।</p>
            <p className="text-[11px] font-semibold text-rose-950 bg-rose-100/70 p-1.5 rounded-md border border-rose-200">
              💵 <strong>COD Charges:</strong> सेलर डिलीवरी में COD चार्ज <strong>सेलर के पास रहेगा</strong> (सेलर स्वयं कलेक्ट करेगा और रखेगा, पोर्टल से कोई कटौती नहीं होगी)।
            </p>
          </div>
        )}

        {activeRuleTab === 'rule4' && (
          <div className="bg-purple-50 text-gray-900 p-3.5 rounded-xl border border-purple-300 text-xs space-y-1.5">
            <div className="flex items-center justify-between border-b border-purple-200 pb-1">
              <h5 className="font-extrabold text-purple-950">4. COD + Third-Party Delivery (कैश ऑन डिलीवरी + कूरियर से डिलीवरी)</h5>
              <span className="text-[10px] bg-purple-200 text-purple-950 font-bold px-2 py-0.5 rounded-full">Rule 4 ({ruleMetrics.rule4.count} Orders)</span>
            </div>
            <p className="text-[11px]">• कूरियर कैश कलेक्ट कर पोर्टल को देगा। {commissionRate}% Comm + 18% GST + 0.1% TDS + 0.5% TCS कटेगा। ₹{resolvedFreeDeliveryThreshold}+ पर डिलीवरी ₹0, बची राशि सेलर को।</p>
            <p className="text-[11px] font-semibold text-purple-950 bg-purple-100/70 p-1.5 rounded-md border border-purple-200">
              🏢 <strong>COD Charges:</strong> कूरियर डिलीवरी में COD चार्ज <strong>पोर्टल के पास रहेगा</strong>। (<strong>विशेष छूट:</strong> 09BLMPK2840L2ZN को छूट मिलेगी — कूरियर डिलीवरी में भी इससे COD चार्ज नहीं काटे जाएंगे)।
            </p>
          </div>
        )}

        {activeRuleTab === 'all' && (
          <div className="pt-2 border-t border-white/15 text-[11px] space-y-1.5 text-teal-100/90">
            <div className="flex items-start gap-1.5">
              <span className="font-bold text-amber-300 shrink-0">₹{resolvedFreeDeliveryThreshold} या अधिक के ऑर्डर पर:</span>
              <span>यदि डिलीवरी का खर्च एडमिन उठाता है, तो सेलर से डिलीवरी चार्ज और उसका GST नहीं काटना है (₹0 डिलीवरी कटौती)।</span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="font-bold text-sky-300 shrink-0">GST TCS (Sec 52):</span>
              <span>पात्र बिक्री पर कुल 0.5% — एक ही राज्य (Intra-State) में 0.25% CGST + 0.25% SGST, या अंतरराज्यीय (Inter-State) बिक्री पर 0.5% IGST। (Rule 3 COD पर 0% TCS)।</span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="font-bold text-rose-300 shrink-0">COD + सेलर डिलीवरी (Rule 3):</span>
              <span>ग्राहक पूरा पैसा सीधे सेलर को देगा। COD चार्ज सेलर के पास रहेगा। पोर्टल कमीशन + GST + TDS पोर्टल में देय (-) होगा।</span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="font-bold text-purple-300 shrink-0">COD + कूरियर डिलीवरी (Rule 4):</span>
              <span>कूरियर ग्राहक से कैश लेकर पोर्टल को देगा। COD चार्ज पोर्टल के पास रहेगा (GST 09BLMPK2840L2ZN को विशेष छूट — कूरियर में भी COD चार्ज नहीं कटेगा)। ₹{resolvedFreeDeliveryThreshold}+ पर डिलीवरी फ्री, बची राशि सेलर को मिलेगी।</span>
            </div>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white p-4.5 rounded-2xl border border-gray-100 shadow-xs">
          <div className="text-[11px] font-semibold text-gray-500">Gross Sales Revenue</div>
          <div className="text-xl sm:text-2xl font-extrabold text-gray-900 mt-1 font-mono">
            ₹{settlementSummary.grossSales.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-emerald-600 font-medium mt-1">
            {orders.length > 0 ? `${orders.length} total orders in database` : '0 sales recorded'}
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-gray-100 shadow-xs">
          <div className="text-[11px] font-semibold text-gray-500">Total Deductions</div>
          <div className="text-xl sm:text-2xl font-extrabold text-rose-700 mt-1 font-mono">
            ₹{settlementSummary.totalDeductions.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-rose-600 mt-1">Comm + GST + Tax {settlementSummary.deliveryDeductions > 0 ? `+ Deliv` : ''}</div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-gray-100 shadow-xs">
          <div className="text-[11px] font-semibold text-gray-500">Final Net Earnings</div>
          <div className="text-xl sm:text-2xl font-extrabold text-teal-800 mt-1 font-mono">
            ₹{settlementSummary.finalSettlement.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-teal-700 mt-1">Total earned revenue</div>
        </div>

        <div className="bg-amber-50/70 p-4.5 rounded-2xl border border-amber-200/90 shadow-xs">
          <div className="text-[11px] font-bold text-amber-900 flex items-center justify-between">
            <span>In Return Window</span>
            <Lock size={14} className="text-amber-700" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-amber-900 mt-1 font-mono">
            ₹{Math.round(pendingEscrow).toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-amber-800 font-medium mt-1">
            Held during 7d return + 1d grace
          </div>
        </div>

        <div className="bg-emerald-50/70 p-4.5 rounded-2xl border border-emerald-200/90 shadow-xs">
          <div className="text-[11px] font-bold text-emerald-900 flex items-center justify-between">
            <span>Available Balance</span>
            <Unlock size={14} className="text-emerald-700" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-emerald-700 mt-1 font-mono">
            ₹{Math.round(availableBalance).toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-emerald-700 font-bold mt-1">Ready for 1-click bank transfer</div>
        </div>
      </div>

      {/* Return Window & Settlement Protection Info Banner */}
      <div className="bg-linear-to-r from-amber-500/10 via-teal-500/10 to-blue-500/10 border border-amber-200 rounded-2xl p-4 flex items-start gap-3.5 shadow-xs">
        <div className="p-2 bg-amber-500/20 text-amber-800 rounded-xl shrink-0 mt-0.5">
          <ShieldCheck size={20} />
        </div>
        <div className="space-y-1 text-xs">
          <div className="font-extrabold text-gray-900 flex items-center gap-2 flex-wrap">
            <span>सुरक्षित सेलर सेटलमेंट नीति (Return &amp; Exchange Window Policy)</span>
            <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold border border-amber-300">
              7 Days Return + 1 Day Grace Buffer
            </span>
          </div>
          <p className="text-gray-600 leading-relaxed text-[11px]">
            Book Vardi ई-कॉमर्स नीति के अनुसार, डिलीवरी के बाद ग्राहक को <strong>7 दिन का रिटर्न/एक्सचेंज विंडो</strong> मिलता है। सेलर सुरक्षा और सुगम रिफंड प्रक्रिया हेतु, डिलीवरी के बाद <strong>7 दिन + 1 दिन निरीक्षण ग्रेस पीरियड (कुल 8 दिन)</strong> तक ऑर्डर राशि <strong>'In Return Window (Escrow)'</strong> में सुरक्षित रखी जाती है। अवधि समाप्त होते ही राशि अपने आप <strong>'Available Settlement Balance'</strong> में ट्रांसफर हो जाती है जिसे आप तुरंत अपने बैंक खाते में मंगा सकते हैं।
          </p>
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
              {sellerUser?.bankVerificationStatus === 'pending' || sellerUser?.status === 'pending' ? (
                <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  <Clock size={12} /> Pending Admin Approval
                </span>
              ) : bankInfo.accountNumber ? (
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

          {(sellerUser?.bankVerificationStatus === 'pending' || sellerUser?.status === 'pending') && bankInfo.accountNumber && (
            <div className="p-3 bg-amber-50/90 rounded-xl border border-amber-200 text-amber-800 text-xs flex items-center gap-2 mb-3">
              <Clock size={16} className="text-amber-600 shrink-0" />
              <span>Your updated bank account details have been submitted and are <strong>pending Admin verification</strong>. Payouts will resume once approved.</span>
            </div>
          )}

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
                              ≥₹{(txn.freeDeliveryThreshold && txn.freeDeliveryThreshold !== 401 ? txn.freeDeliveryThreshold : resolvedFreeDeliveryThreshold) || 1000} Free Deliv.
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
                      {txn.statusType === 'settled' || txn.status === 'Completed' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                          <CheckCircle2 size={11} /> Settled &amp; Available
                        </span>
                      ) : txn.statusType === 'refunded' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200" title="Statutory Credit Note Auto-Issued (Sec 34)">
                          <AlertCircle size={11} className="text-rose-600" /> {txn.status}
                        </span>
                      ) : txn.statusType === 'on_hold' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-900 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                          <Clock size={11} className="text-amber-600" /> {txn.status}
                        </span>
                      ) : txn.statusType === 'escrow' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200" title={txn.maturityDate ? `Unlocks on ${new Date(txn.maturityDate).toLocaleDateString('en-GB')}` : 'In Return/Exchange Window'}>
                          <Lock size={11} className="text-amber-600" /> {txn.status}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                          <Clock size={11} className="text-blue-500" /> {txn.status || 'Pending'}
                        </span>
                      )}
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
              <div className="p-3 bg-amber-50 border border-amber-200/90 rounded-xl text-amber-900 text-xs flex items-start gap-2">
                <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Admin Verification Required</strong>
                  Changing payout bank details will set your account to <strong>Pending Review</strong> until verified by the platform admin.
                </div>
              </div>

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
