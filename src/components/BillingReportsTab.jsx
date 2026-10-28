import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Calendar,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  Receipt,
  FileText,
  RotateCcw,
  Truck,
  Building,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  ChevronDown,
  Layers,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useSellerData } from '../context/SellerDataContext';
import { SERVER_URL } from '../utils/api';

// Helper to check if an order is Third-Party Courier or Self-Delivery
const isOrderThirdPartyCourier = (o) => {
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
    hasCourier;
  return isExplicitThirdParty || !isExplicitSelf;
};

// GST Rate resolver for individual item
const resolveItemGstRate = (item) => {
  const cat = String(item.category || item.subCategory || '').toLowerCase();
  const name = String(item.name || '').toLowerCase();
  if (cat.includes('book') || cat.includes('ncert') || cat.includes('textbook') || name.includes('book')) {
    return 0; // Textbooks are 0% GST
  }
  if (item.gstPercent !== undefined && !isNaN(Number(item.gstPercent))) return Number(item.gstPercent);
  if (item.gstPercentage !== undefined && !isNaN(Number(item.gstPercentage))) return Number(item.gstPercentage);
  if (item.gstRate !== undefined && !isNaN(Number(item.gstRate))) return Number(item.gstRate);
  if (item.gst !== undefined && !isNaN(Number(item.gst))) return Number(item.gst);
  if (cat.includes('uniform') || cat.includes('shoe') || cat.includes('footwear') || cat.includes('garment')) {
    return 5;
  }
  if (cat.includes('stationery') || cat.includes('bag') || cat.includes('bottle')) {
    return 12;
  }
  return 5; // Default safe slab
};

export default function BillingReportsTab() {
  const { orders = [], sellerUser, settings, finance } = useSellerData();

  // Filter States
  const [datePreset, setDatePreset] = useState('all'); // 'all', 'this_month', 'last_month', 'quarter', 'fy_current', 'custom'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [orderTypeFilter, setOrderTypeFilter] = useState('all'); // 'all', 'self_delivery', 'courier', 'returns', 'exchanges'
  const [searchQuery, setSearchQuery] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  // Store information
  const storeName = settings?.storeName || sellerUser?.storeName || 'Merchant Store';
  const gstin = settings?.gstNumber || sellerUser?.gstNumber || sellerUser?.kyc?.gstin || 'Not Provided';
  const sellerState = settings?.state || sellerUser?.state || 'Uttar Pradesh';

  // Base Order Calculation & Enrichment
  const enrichedOrders = useMemo(() => {
    return orders.map(o => {
      const orderDate = new Date(o.createdAt || o.date || Date.now());
      const orderIdStr = o.orderId || (o._id ? o._id.toString().substring(0, 8).toUpperCase() : 'ORD');
      const invoiceNo = `INV-${orderIdStr}`;
      const creditNoteNo = `CN-${orderIdStr}`;
      const exchangeInvoiceNo = `EXCH-${orderIdStr}`;

      const rawStatus = String(o.status || o.overallStatus || '').toLowerCase().trim();
      const returnReqStatus = String(o.returnRequest?.status || '').toLowerCase().trim();
      const returnType = String(o.returnRequest?.type || o.returnRequest?.requestType || '').toLowerCase();

      const isCancelled = rawStatus === 'cancelled' || Boolean(o.cancelledAt);
      const isReturn = returnType === 'return' || rawStatus.includes('return') || returnReqStatus.includes('return');
      const isExchange = returnType === 'exchange' || rawStatus.includes('exchange') || returnReqStatus.includes('exchange');
      const isRefunded = ['refunded', 'refund_completed', 'refund_processed'].includes(rawStatus) ||
                         ['refunded', 'refund_completed', 'refunded'].includes(returnReqStatus);

      const isThirdParty = isOrderThirdPartyCourier(o);
      const isSelfDelivery = !isThirdParty;

      // Pricing & Financial Breakdown
      const grossAmount = Number(o.total || o.totalAmount || 0);
      const deliveryFee = Number(o.shippingAmount || o.shippingFee || o.shippingCost || o.deliveryCharge || 0);

      // Determine items GST
      let itemsGross = 0;
      let totalTaxableValue = 0;
      let totalGstAmount = 0;

      const itemsList = Array.isArray(o.items) ? o.items : [];
      itemsList.forEach(it => {
        const qty = Number(it.quantity || 1);
        const unitPrice = Number(it.finalPrice || it.price || 0);
        const itTotal = unitPrice * qty;
        itemsGross += itTotal;

        const rate = resolveItemGstRate(it);
        const itTaxable = itTotal / (1 + rate / 100);
        const itTax = itTotal - itTaxable;

        totalTaxableValue += itTaxable;
        totalGstAmount += itTax;
      });

      if (itemsGross === 0 && grossAmount > 0) {
        itemsGross = grossAmount;
        totalTaxableValue = itemsGross / 1.05;
        totalGstAmount = itemsGross - totalTaxableValue;
      }

      // Marketplace deductions
      const commRate = Number(o.commissionRate ?? 10);
      const commAmount = o.settlement?.commissionAmount !== undefined
        ? Number(o.settlement.commissionAmount)
        : Math.round(((grossAmount * commRate) / 100) * 100) / 100;

      const gstOnComm = o.settlement?.gstOnCommissionAmount !== undefined
        ? Number(o.settlement.gstOnCommissionAmount)
        : Math.round(((commAmount * 18) / 100) * 100) / 100;

      // TDS (Sec 194-O) 0.1% on Gross Amount
      const tdsAmount = o.settlement?.tdsAmount !== undefined
        ? Number(o.settlement.tdsAmount)
        : Math.round(((grossAmount * 0.1) / 100) * 100) / 100;

      // GST TCS (Sec 52) 0.5% (Rule 3 COD Self Delivery = 0)
      const rawPayment = String(o.paymentMethod || o.paymentMode || '').toUpperCase();
      const isCod = rawPayment.includes('COD') || rawPayment.includes('CASH');
      const isRule3 = isCod && isSelfDelivery;
      const gstTcsAmount = isRule3
        ? 0
        : (o.settlement?.gstTcsAmount !== undefined
            ? Number(o.settlement.gstTcsAmount)
            : Math.round((((grossAmount / 1.05) * 0.5) / 100) * 100) / 100);

      // Delivery Deduction / Credit
      let deliveryAdjustment = 0; // positive means credit to seller, negative means deduction
      if (isSelfDelivery) {
        // Self delivery: Delivery fee is earned by the seller!
        deliveryAdjustment = deliveryFee;
      } else {
        // Courier delivery: Deducted from seller if seller borne
        const ordThreshold = Number(o.freeDeliveryThreshold ?? 400);
        const isAboveThreshold = grossAmount >= ordThreshold;
        if (!isAboveThreshold && (o.deliveryChargeBorneBy === 'seller' || o.isDeliveryBorneBySeller)) {
          deliveryAdjustment = -Math.round((deliveryFee * 1.18) * 100) / 100;
        }
      }

      // Net Seller Settlement
      const totalDeductions = commAmount + gstOnComm + tdsAmount + gstTcsAmount + (deliveryAdjustment < 0 ? Math.abs(deliveryAdjustment) : 0);
      const netPayout = Math.max(0, Math.round((grossAmount - totalDeductions + (deliveryAdjustment > 0 ? deliveryAdjustment : 0)) * 100) / 100);

      // Customer Location info
      const customerName = o.customer?.name || o.shippingAddress?.name || o.user?.name || 'Customer';
      const customerCity = o.shippingAddress?.city || o.city || 'Local Area';
      const customerState = o.shippingAddress?.state || o.state || sellerState;
      const isInterState = customerState && sellerState && customerState.toLowerCase().trim() !== sellerState.toLowerCase().trim();

      return {
        ...o,
        orderDate,
        orderIdStr,
        invoiceNo,
        creditNoteNo,
        exchangeInvoiceNo,
        isCancelled,
        isReturn,
        isExchange,
        isRefunded,
        isSelfDelivery,
        isThirdParty,
        grossAmount,
        deliveryFee,
        itemsGross,
        totalTaxableValue: Math.round(totalTaxableValue * 100) / 100,
        totalGstAmount: Math.round(totalGstAmount * 100) / 100,
        cgstAmount: isInterState ? 0 : Math.round((totalGstAmount / 2) * 100) / 100,
        sgstAmount: isInterState ? 0 : Math.round((totalGstAmount / 2) * 100) / 100,
        igstAmount: isInterState ? Math.round(totalGstAmount * 100) / 100 : 0,
        isInterState,
        commAmount,
        gstOnComm,
        tdsAmount,
        gstTcsAmount,
        deliveryAdjustment,
        netPayout,
        customerName,
        customerCity,
        customerState
      };
    });
  }, [orders, sellerState]);

  // Apply Date and Type Filters
  const filteredOrders = useMemo(() => {
    const now = new Date();

    return enrichedOrders.filter(o => {
      // 1. Date filter
      const d = o.orderDate;
      if (datePreset === 'this_month') {
        if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return false;
      } else if (datePreset === 'last_month') {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        if (d.getMonth() !== lastMonth.getMonth() || d.getFullYear() !== lastMonth.getFullYear()) return false;
      } else if (datePreset === 'quarter') {
        const currentQuarter = Math.floor(now.getMonth() / 3);
        const orderQuarter = Math.floor(d.getMonth() / 3);
        if (orderQuarter !== currentQuarter || d.getFullYear() !== now.getFullYear()) return false;
      } else if (datePreset === 'fy_current') {
        // Indian Financial Year: April 1 to March 31
        const fyStart = now.getMonth() >= 3 ? new Date(now.getFullYear(), 3, 1) : new Date(now.getFullYear() - 1, 3, 1);
        const fyEnd = new Date(fyStart.getFullYear() + 1, 2, 31, 23, 59, 59);
        if (d < fyStart || d > fyEnd) return false;
      } else if (datePreset === 'custom') {
        if (customStartDate && d < new Date(customStartDate)) return false;
        if (customEndDate && d > new Date(customEndDate + 'T23:59:59')) return false;
      }

      // 2. Order Type filter
      if (orderTypeFilter === 'self_delivery' && !o.isSelfDelivery) return false;
      if (orderTypeFilter === 'courier' && !o.isThirdParty) return false;
      if (orderTypeFilter === 'returns' && !o.isReturn && !o.isCancelled) return false;
      if (orderTypeFilter === 'exchanges' && !o.isExchange) return false;

      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesId = String(o.orderIdStr).toLowerCase().includes(q);
        const matchesInv = String(o.invoiceNo).toLowerCase().includes(q);
        const matchesCust = String(o.customerName).toLowerCase().includes(q);
        const matchesCity = String(o.customerCity).toLowerCase().includes(q);
        if (!matchesId && !matchesInv && !matchesCust && !matchesCity) return false;
      }

      return true;
    });
  }, [enrichedOrders, datePreset, customStartDate, customEndDate, orderTypeFilter, searchQuery]);

  // Aggregate Metrics for Cards
  const metrics = useMemo(() => {
    let totalInvoicedGross = 0;
    let totalCreditNotesGross = 0;
    let totalTaxable = 0;
    let totalGst = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;
    let totalCommission = 0;
    let totalGstOnComm = 0;
    let totalTds = 0;
    let totalTcs = 0;
    let totalSelfDeliveryCredits = 0;
    let totalNetPayout = 0;

    let bookSales0Gst = 0;
    let uniformSales5Gst = 0;
    let otherSales1218Gst = 0;

    filteredOrders.forEach(o => {
      if (o.isCancelled || o.isRefunded) {
        totalCreditNotesGross += o.grossAmount;
      } else {
        totalInvoicedGross += o.grossAmount;
        totalTaxable += o.totalTaxableValue;
        totalGst += o.totalGstAmount;
        totalCgst += o.cgstAmount;
        totalSgst += o.sgstAmount;
        totalIgst += o.igstAmount;

        totalCommission += o.commAmount;
        totalGstOnComm += o.gstOnComm;
        totalTds += o.tdsAmount;
        totalTcs += o.gstTcsAmount;

        if (o.isSelfDelivery && o.deliveryAdjustment > 0) {
          totalSelfDeliveryCredits += o.deliveryAdjustment;
        }

        totalNetPayout += o.netPayout;

        // Slab breakdown
        (o.items || []).forEach(it => {
          const itTotal = (it.finalPrice || it.price || 0) * (it.quantity || 1);
          const rate = resolveItemGstRate(it);
          if (rate === 0) bookSales0Gst += itTotal;
          else if (rate === 5) uniformSales5Gst += itTotal;
          else otherSales1218Gst += itTotal;
        });
      }
    });

    const netTaxableTurnover = Math.max(0, totalInvoicedGross - totalCreditNotesGross);

    return {
      totalInvoicedGross,
      totalCreditNotesGross,
      netTaxableTurnover,
      totalTaxable: Math.round(totalTaxable * 100) / 100,
      totalGst: Math.round(totalGst * 100) / 100,
      totalCgst: Math.round(totalCgst * 100) / 100,
      totalSgst: Math.round(totalSgst * 100) / 100,
      totalIgst: Math.round(totalIgst * 100) / 100,
      totalCommission: Math.round(totalCommission * 100) / 100,
      totalGstOnComm: Math.round(totalGstOnComm * 100) / 100,
      totalTds: Math.round(totalTds * 100) / 100,
      totalTcs: Math.round(totalTcs * 100) / 100,
      totalSelfDeliveryCredits: Math.round(totalSelfDeliveryCredits * 100) / 100,
      totalNetPayout: Math.round(totalNetPayout * 100) / 100,
      bookSales0Gst: Math.round(bookSales0Gst * 100) / 100,
      uniformSales5Gst: Math.round(uniformSales5Gst * 100) / 100,
      otherSales1218Gst: Math.round(otherSales1218Gst * 100) / 100,
      orderCount: filteredOrders.length
    };
  }, [filteredOrders]);

  // Export to Excel (CA & Tax Ready)
  const handleExportExcel = () => {
    setIsExporting(true);
    try {
      const rows = filteredOrders.map((o, idx) => {
        const isReturnOrCancel = o.isCancelled || o.isRefunded;
        return {
          'S.No': idx + 1,
          'Invoice / Doc No': isReturnOrCancel ? o.creditNoteNo : (o.isExchange ? o.exchangeInvoiceNo : o.invoiceNo),
          'Document Type': isReturnOrCancel ? 'Credit Note (Sec 34)' : (o.isExchange ? 'Replacement Tax Invoice (Sec 31)' : 'Tax Invoice (Sec 31)'),
          'Date': o.orderDate.toLocaleDateString('en-IN'),
          'Order ID': o.orderIdStr,
          'Customer Name': o.customerName,
          'Customer City': o.customerCity,
          'Place of Supply (State)': o.customerState,
          'Transaction Type': o.isInterState ? 'Inter-State (IGST)' : 'Intra-State (CGST+SGST)',
          'Delivery Mode': o.isSelfDelivery ? 'Self Delivery (OTP)' : 'Third-Party Courier',
          'Gross Value (₹)': o.grossAmount.toFixed(2),
          'Taxable Value (₹)': o.totalTaxableValue.toFixed(2),
          'CGST (₹)': o.cgstAmount.toFixed(2),
          'SGST (₹)': o.sgstAmount.toFixed(2),
          'IGST (₹)': o.igstAmount.toFixed(2),
          'Total GST (₹)': o.totalGstAmount.toFixed(2),
          'Delivery Credit/Debit (₹)': o.deliveryAdjustment.toFixed(2),
          'Commission Fee (₹)': o.commAmount.toFixed(2),
          'GST on Commission (18%) (₹)': o.gstOnComm.toFixed(2),
          'TDS Sec 194-O (0.1%) (₹)': o.tdsAmount.toFixed(2),
          'GST TCS Sec 52 (₹)': o.gstTcsAmount.toFixed(2),
          'Net Seller Settlement (₹)': o.netPayout.toFixed(2),
          'Status': o.status || 'Delivered'
        };
      });

      // Summary Row
      rows.push({
        'S.No': 'TOTAL',
        'Invoice / Doc No': `${metrics.orderCount} Orders`,
        'Document Type': '',
        'Date': '',
        'Order ID': '',
        'Customer Name': '',
        'Customer City': '',
        'Place of Supply (State)': '',
        'Transaction Type': '',
        'Delivery Mode': '',
        'Gross Value (₹)': metrics.totalInvoicedGross.toFixed(2),
        'Taxable Value (₹)': metrics.totalTaxable.toFixed(2),
        'CGST (₹)': metrics.totalCgst.toFixed(2),
        'SGST (₹)': metrics.totalSgst.toFixed(2),
        'IGST (₹)': metrics.totalIgst.toFixed(2),
        'Total GST (₹)': metrics.totalGst.toFixed(2),
        'Delivery Credit/Debit (₹)': metrics.totalSelfDeliveryCredits.toFixed(2),
        'Commission Fee (₹)': metrics.totalCommission.toFixed(2),
        'GST on Commission (18%) (₹)': metrics.totalGstOnComm.toFixed(2),
        'TDS Sec 194-O (0.1%) (₹)': metrics.totalTds.toFixed(2),
        'GST TCS Sec 52 (₹)': metrics.totalTcs.toFixed(2),
        'Net Seller Settlement (₹)': metrics.totalNetPayout.toFixed(2),
        'Status': ''
      });

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Billing_Register');

      // Add Metadata sheet for CA
      const metaData = [
        { Key: 'Seller Store Name', Value: storeName },
        { Key: 'GSTIN', Value: gstin },
        { Key: 'State of Registration', Value: sellerState },
        { Key: 'Report Generation Date', Value: new Date().toLocaleDateString('en-IN') },
        { Key: 'Total Invoiced Gross Turnover', Value: `Rs. ${metrics.totalInvoicedGross.toFixed(2)}` },
        { Key: 'Total Credit Notes (Returns/Cancels)', Value: `Rs. ${metrics.totalCreditNotesGross.toFixed(2)}` },
        { Key: 'Net Taxable Turnover', Value: `Rs. ${metrics.netTaxableTurnover.toFixed(2)}` },
        { Key: 'Total Output GST Payable', Value: `Rs. ${metrics.totalGst.toFixed(2)}` },
        { Key: 'Total Marketplace TDS (194-O)', Value: `Rs. ${metrics.totalTds.toFixed(2)}` },
        { Key: 'Total Net Payout Received', Value: `Rs. ${metrics.totalNetPayout.toFixed(2)}` }
      ];
      const metaSheet = XLSX.utils.json_to_sheet(metaData);
      XLSX.utils.book_append_sheet(workbook, metaSheet, 'Tax_Summary');

      const dateStr = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(workbook, `BookVardi_Seller_Billing_Report_${dateStr}.xlsx`);
    } catch (err) {
      console.error('Failed to export Excel report:', err);
      alert('Failed to generate Excel file: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  // Download Official PDF Financial Statement
  const handleDownloadPdf = () => {
    const token = localStorage.getItem('bv_seller_token') || localStorage.getItem('seller_token') || localStorage.getItem('token') || '';
    const sellerId = sellerUser?._id || sellerUser?.id || settings?._id || '';
    const phone = sellerUser?.phone || settings?.phone || '';
    const query = new URLSearchParams({
      ...(token ? { token } : {}),
      ...(sellerId ? { sellerId } : {}),
      ...(phone ? { phone } : {})
    }).toString();
    window.open(`${SERVER_URL}/sellers/finance-statement/pdf?${query}`, '_blank');
  };

  // Browser Print Statement
  const handlePrintStatement = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 print:p-0 print:space-y-4">
      {/* 1. Header & Primary Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs print:border-none print:shadow-none print:p-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-50 text-teal-700 border border-teal-200 uppercase tracking-wider print:hidden">
              Accounting & Tax Register
            </span>
            <span className="text-xs text-gray-500 font-medium">
              GSTIN: <strong className="text-gray-800">{gstin}</strong>
            </span>
          </div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
            <FileSpreadsheet className="text-teal-600 print:hidden" size={26} />
            Seller Billing & Tax Reports
          </h2>
          <p className="text-xs text-gray-500 mt-1 max-w-2xl">
            Complete statutory ledger of all customer tax invoices, credit notes, self-delivery logistics earnings, and marketplace tax deductions (TDS Sec 194-O & TCS Sec 52).
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap print:hidden">
          {/* Excel Export Button */}
          <button
            type="button"
            disabled={isExporting || filteredOrders.length === 0}
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
            title="Download full detailed Excel spreadsheet formatted for CA / Tax Filing (.xlsx)"
          >
            <Download size={15} />
            <span>{isExporting ? 'Generating Excel...' : 'Export Excel (.xlsx)'}</span>
          </button>

          {/* PDF Statement Download Button */}
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
            title="Download Official PDF Financial & Settlement Statement"
          >
            <FileText size={15} />
            <span>Export PDF Statement</span>
          </button>

          {/* Print Button */}
          <button
            type="button"
            onClick={handlePrintStatement}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all cursor-pointer border border-gray-300"
            title="Print or Save as PDF via Browser"
          >
            <Printer size={15} />
            <span>Print View</span>
          </button>
        </div>
      </div>

      {/* 2. Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Date Presets */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-xs font-semibold text-gray-600">
            {[
              { id: 'all', label: 'All Time' },
              { id: 'this_month', label: 'This Month' },
              { id: 'last_month', label: 'Last Month' },
              { id: 'quarter', label: 'This Quarter' },
              { id: 'fy_current', label: 'FY 24-25' },
              { id: 'custom', label: 'Custom' }
            ].map(btn => (
              <button
                key={btn.id}
                onClick={() => setDatePreset(btn.id)}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  datePreset === btn.id
                    ? 'bg-white text-gray-900 font-bold shadow-2xs'
                    : 'hover:text-gray-900'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {/* Custom Date Pickers */}
          {datePreset === 'custom' && (
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl text-xs">
              <span className="text-gray-400">From:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={e => setCustomStartDate(e.target.value)}
                className="bg-transparent text-gray-800 font-semibold focus:outline-hidden"
              />
              <span className="text-gray-400">To:</span>
              <input
                type="date"
                value={customEndDate}
                onChange={e => setCustomEndDate(e.target.value)}
                className="bg-transparent text-gray-800 font-semibold focus:outline-hidden"
              />
            </div>
          )}

          {/* Delivery & Type Filter */}
          <select
            value={orderTypeFilter}
            onChange={e => setOrderTypeFilter(e.target.value)}
            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200/70 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 cursor-pointer focus:outline-hidden"
          >
            <option value="all">📦 All Delivery & Order Types</option>
            <option value="self_delivery">🛵 Self Delivery (Direct OTP)</option>
            <option value="courier">🚚 Courier Partner</option>
            <option value="returns">↩️ Returns & Credit Notes</option>
            <option value="exchanges">🔄 Exchanges (Replacement)</option>
          </select>

          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search Invoice No, Order ID, Customer..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-teal-600 transition-colors"
            />
          </div>
        </div>

        {/* Filter stats subtitle */}
        <div className="flex items-center justify-between text-xs text-gray-500 pt-1 border-t border-gray-100">
          <span>Showing <strong>{filteredOrders.length}</strong> matching transaction records</span>
          <span>Store State: <strong className="text-gray-800">{sellerState}</strong></span>
        </div>
      </div>

      {/* 3. Financial KPI Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Metric 1: Total Invoiced Gross */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Gross Invoiced Sales</span>
            <div className="p-1.5 bg-teal-50 text-teal-700 rounded-lg">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="text-xl font-black text-gray-900 tracking-tight">
            ₹{metrics.totalInvoicedGross.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
            <span>Total forward sales value</span>
          </div>
        </div>

        {/* Metric 2: Credit Notes / Returns */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Credit Notes (Returns)</span>
            <div className="p-1.5 bg-rose-50 text-rose-700 rounded-lg">
              <RotateCcw size={16} />
            </div>
          </div>
          <div className="text-xl font-black text-rose-700 tracking-tight">
            -₹{metrics.totalCreditNotesGross.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
            <span>Sec 34 GST Reversals</span>
          </div>
        </div>

        {/* Metric 3: Output GST Collected */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Output GST</span>
            <div className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg">
              <Receipt size={16} />
            </div>
          </div>
          <div className="text-xl font-black text-indigo-900 tracking-tight">
            ₹{metrics.totalGst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
            <span>CGST+SGST: ₹{(metrics.totalCgst + metrics.totalSgst).toFixed(2)} | IGST: ₹{metrics.totalIgst.toFixed(2)}</span>
          </div>
        </div>

        {/* Metric 4: Net Seller Settlement */}
        <div className="bg-gradient-to-br from-emerald-800 to-teal-900 p-4 rounded-2xl text-white shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-emerald-200 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Net Settled Earnings</span>
            <div className="p-1.5 bg-white/10 text-emerald-200 rounded-lg">
              <ShieldCheck size={16} />
            </div>
          </div>
          <div className="text-xl font-black text-white tracking-tight">
            ₹{metrics.totalNetPayout.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-emerald-200/80 mt-1 flex items-center gap-1">
            <span>After all platform fees & TDS</span>
          </div>
        </div>

        {/* Metric 5: Platform Commission */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs">
          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Platform Commission</div>
          <div className="text-lg font-extrabold text-gray-800 mt-1">
            ₹{metrics.totalCommission.toFixed(2)}
          </div>
          <div className="text-[11px] text-gray-400 mt-0.5">+18% GST: ₹{metrics.totalGstOnComm.toFixed(2)}</div>
        </div>

        {/* Metric 6: TDS Sec 194-O (0.1%) */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs">
          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">TDS (Sec 194-O) 0.1%</div>
          <div className="text-lg font-extrabold text-gray-800 mt-1">
            ₹{metrics.totalTds.toFixed(2)}
          </div>
          <div className="text-[11px] text-gray-400 mt-0.5">Deducted on Gross Sales</div>
        </div>

        {/* Metric 7: GST TCS Sec 52 */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs">
          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">GST TCS (Sec 52) 0.5%</div>
          <div className="text-lg font-extrabold text-gray-800 mt-1">
            ₹{metrics.totalTcs.toFixed(2)}
          </div>
          <div className="text-[11px] text-gray-400 mt-0.5">0% on COD Self Delivery</div>
        </div>

        {/* Metric 8: Self-Delivery Logistics Revenue */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs">
          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Self Delivery Earnings</div>
          <div className="text-lg font-extrabold text-teal-700 mt-1">
            +₹{metrics.totalSelfDeliveryCredits.toFixed(2)}
          </div>
          <div className="text-[11px] text-teal-600 mt-0.5">Credited directly to Seller</div>
        </div>
      </div>

      {/* 4. GST Slab Classification Box (GSTR-1 Ready) */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
            <Layers size={16} className="text-teal-600" />
            Tax Classification by Product Category (GSTR-1 Slab Breakdown)
          </h3>
          <span className="text-[11px] text-gray-400">Statutory GST rates applied on catalog</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200/70">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-gray-700">0% GST: Textbooks & NCERT Books</span>
              <span className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded-md text-[10px] font-extrabold">Exempt</span>
            </div>
            <div className="text-base font-extrabold text-gray-900">
              ₹{metrics.bookSales0Gst.toFixed(2)}
            </div>
            <div className="text-[11px] text-gray-400 mt-0.5">Tax Collected: ₹0.00 (Exempt under HSN 4901)</div>
          </div>

          <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-200/60">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-blue-950">5% GST: School Uniforms & Footwear</span>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md text-[10px] font-extrabold">5% Rate</span>
            </div>
            <div className="text-base font-extrabold text-blue-950">
              ₹{metrics.uniformSales5Gst.toFixed(2)}
            </div>
            <div className="text-[11px] text-blue-600 mt-0.5">Estimated Tax: ₹{((metrics.uniformSales5Gst * 5) / 105).toFixed(2)}</div>
          </div>

          <div className="p-3.5 bg-purple-50/50 rounded-xl border border-purple-200/60">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-purple-950">12% / 18% GST: Stationery & Bags</span>
              <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded-md text-[10px] font-extrabold">Standard</span>
            </div>
            <div className="text-base font-extrabold text-purple-950">
              ₹{metrics.otherSales1218Gst.toFixed(2)}
            </div>
            <div className="text-[11px] text-purple-600 mt-0.5">Estimated Tax: ₹{((metrics.otherSales1218Gst * 12) / 112).toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* 5. Detailed Invoiced Billing Register Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-extrabold text-gray-900 tracking-tight">
              Invoiced Billing Register
            </h3>
            <p className="text-xs text-gray-500">
              Complete chronological audit trail with direct invoice, credit note & replacement downloads.
            </p>
          </div>
          <div className="text-xs font-semibold text-gray-500">
            Total Records: <strong className="text-gray-900">{filteredOrders.length}</strong>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3.5">Invoice / Date</th>
                <th className="py-3 px-3">Order & Customer</th>
                <th className="py-3 px-3">Delivery Mode</th>
                <th className="py-3 px-3 text-right">Gross Value</th>
                <th className="py-3 px-3 text-right">Taxable & GST</th>
                <th className="py-3 px-3 text-right">Commission</th>
                <th className="py-3 px-3 text-right">TDS (194-O)</th>
                <th className="py-3 px-3 text-right">Net Payout</th>
                <th className="py-3 px-3.5 text-center">Statutory Documents</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-400">
                    <AlertCircle size={32} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-sm font-semibold">No billing transactions found for selected filters.</p>
                    <p className="text-xs text-gray-400 mt-1">Try changing date preset or order type filter.</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map(o => {
                  const isReturnOrCancel = o.isCancelled || o.isRefunded;
                  return (
                    <tr key={o.orderIdStr} className="hover:bg-gray-50/60 transition-colors">
                      {/* Column 1: Document ID & Date */}
                      <td className="py-3 px-3.5">
                        <div className="font-extrabold text-gray-900 flex items-center gap-1.5">
                          {isReturnOrCancel ? (
                            <span className="text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded text-[10px] font-black border border-rose-200">
                              {o.creditNoteNo}
                            </span>
                          ) : o.isExchange ? (
                            <span className="text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded text-[10px] font-black border border-indigo-200">
                              {o.exchangeInvoiceNo}
                            </span>
                          ) : (
                            <span className="text-gray-800 font-bold">
                              {o.invoiceNo}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-gray-400 mt-0.5">
                          {o.orderDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                      </td>

                      {/* Column 2: Order & Customer */}
                      <td className="py-3 px-3">
                        <div className="font-semibold text-gray-900">
                          #{o.orderIdStr}
                        </div>
                        <div className="text-[11px] text-gray-500">
                          {o.customerName} ({o.customerCity})
                        </div>
                        <div className="text-[10px] text-gray-400">
                          {o.isInterState ? 'Inter-State (IGST)' : 'Intra-State (CGST+SGST)'}
                        </div>
                      </td>

                      {/* Column 3: Delivery Mode */}
                      <td className="py-3 px-3">
                        {o.isSelfDelivery ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-teal-50 text-teal-800 border border-teal-200">
                            🛵 Self Delivery (OTP)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                            🚚 {o.courierName || 'Courier Partner'}
                          </span>
                        )}
                        {o.deliveryAdjustment > 0 && (
                          <div className="text-[10px] text-teal-600 font-bold mt-0.5">
                            +₹{o.deliveryAdjustment.toFixed(2)} Fee Earned
                          </div>
                        )}
                      </td>

                      {/* Column 4: Gross Invoiced Value */}
                      <td className="py-3 px-3 text-right">
                        <div className={`font-extrabold ${isReturnOrCancel ? 'text-rose-700' : 'text-gray-900'}`}>
                          {isReturnOrCancel ? '-' : ''}₹{o.grossAmount.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          {o.items?.length || 1} Item(s)
                        </div>
                      </td>

                      {/* Column 5: Taxable Value & GST */}
                      <td className="py-3 px-3 text-right">
                        <div className="font-semibold text-gray-800">
                          ₹{o.totalTaxableValue.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-indigo-600 font-medium">
                          GST: ₹{o.totalGstAmount.toFixed(2)}
                        </div>
                      </td>

                      {/* Column 6: Marketplace Commission */}
                      <td className="py-3 px-3 text-right">
                        <div className="font-semibold text-gray-800">
                          -₹{o.commAmount.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          +18% GST: ₹{o.gstOnComm.toFixed(2)}
                        </div>
                      </td>

                      {/* Column 7: TDS (194-O) */}
                      <td className="py-3 px-3 text-right">
                        <div className="font-semibold text-gray-800">
                          ₹{o.tdsAmount.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          0.1% Gross
                        </div>
                      </td>

                      {/* Column 8: Net Settlement */}
                      <td className="py-3 px-3 text-right">
                        <div className={`font-black ${isReturnOrCancel ? 'text-gray-400 line-through' : 'text-emerald-700'}`}>
                          ₹{o.netPayout.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          {isReturnOrCancel ? 'Reversed' : 'Settled / Due'}
                        </div>
                      </td>

                      {/* Column 9: Statutory Documents */}
                      <td className="py-3 px-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {/* Forward Tax Invoice */}
                          {!isReturnOrCancel && (
                            <a
                              href={`${SERVER_URL}/orders/${o.id || o._id}/invoice`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] font-bold rounded-lg transition-colors cursor-pointer border border-gray-200"
                              title="Download Statutory Forward Tax Invoice (Sec 31)"
                            >
                              <FileText size={11} className="text-gray-500" />
                              <span>Invoice</span>
                            </a>
                          )}

                          {/* Credit Note (Returns or Exchanges) */}
                          {(isReturnOrCancel || o.isExchange) && (
                            <a
                              href={`${SERVER_URL}/orders/${o.id || o._id}/credit-note`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 text-[10px] font-bold rounded-lg transition-colors cursor-pointer border border-rose-200"
                              title="Download Statutory GST Credit Note (Sec 34)"
                            >
                              <FileText size={11} className="text-rose-600" />
                              <span>Credit Note</span>
                            </a>
                          )}

                          {/* Exchange Tax Invoice (Exchanges) */}
                          {o.isExchange && (
                            <a
                              href={`${SERVER_URL}/orders/${o.id || o._id}/exchange-invoice`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-[10px] font-bold rounded-lg transition-colors cursor-pointer border border-indigo-200"
                              title="Download Exchange Tax Invoice for New Item (Sec 31)"
                            >
                              <FileText size={11} className="text-indigo-600" />
                              <span>Exchange Bill</span>
                            </a>
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
    </div>
  );
}
