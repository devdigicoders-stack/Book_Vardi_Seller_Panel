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
  ExternalLink,
  Percent,
  Landmark,
  Scale,
  Store
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useSellerData } from '../context/SellerDataContext';
import { SERVER_URL } from '../utils/api';
import { getSellerInvoiceNumber } from '../utils/invoiceHelper';

// Helper to check if an order is Third-Party Courier or Direct Self-Delivery
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
  return 5;
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Universal print helper for clean, official A4 landscape statutory PDF/print
 * Without website headers, sidebars or buttons.
 */
export const printStatutoryReport = ({
  reportTitle,
  reportTypeBadge,
  periodLabel,
  scopeLabel,
  sellerStoreDetails,
  summaryCards = [],
  tableHeaders = [],
  tableRows = [],
  totalRow = null
}) => {
  let iframe = document.getElementById('statutory-report-print-iframe-seller');
  if (iframe) iframe.remove();

  iframe = document.createElement('iframe');
  iframe.id = 'statutory-report-print-iframe-seller';
  iframe.style.position = 'fixed';
  iframe.style.left = '-9999px';
  iframe.style.top = '0';
  iframe.style.width = '1250px';
  iframe.style.height = '1400px';
  iframe.style.border = '0';
  iframe.style.opacity = '1';
  iframe.style.zIndex = '9999';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();

  let platformSettings = {};
  try {
    const saved = localStorage.getItem('bookvardi_platform_settings') || localStorage.getItem('platform_settings');
    if (saved) platformSettings = JSON.parse(saved);
  } catch {}

  const companyName = platformSettings.companyName || 'BOOK VARDI';
  const companyAddress = platformSettings.companyAddress || 'Lucknow, Uttar Pradesh - 226001';
  const companyGstin = platformSettings.companyGstin || '09AAACB1234F1Z9';
  const supportEmail = platformSettings.supportEmail || 'support@bookvardi.in';

  const storeName = sellerStoreDetails?.storeName || 'Merchant Store';
  const storeGstin = sellerStoreDetails?.gstin || 'Not Provided';
  const storeCity = sellerStoreDetails?.city || 'Local Area';

  const summaryHtml = summaryCards.map(c => `
    <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 12px; min-width: 130px; flex: 1;">
      <div style="font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">${c.label}</div>
      <div style="font-size: 15px; font-weight: 800; color: #0f172a; margin-top: 3px;">${c.value}</div>
      ${c.sub ? `<div style="font-size: 8.5px; color: #64748b; margin-top: 2px;">${c.sub}</div>` : ''}
    </div>
  `).join('');

  const headersHtml = tableHeaders.map(h => `
    <th style="padding: 7px 8px; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #0f4c45; background: #0f4c45; color: #ffffff; text-align: ${h.align || 'left'}; white-space: nowrap;">
      ${h.label}
    </th>
  `).join('');

  const rowsHtml = tableRows.map((r, idx) => {
    const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
    const cellsHtml = r.map((cell, cIdx) => {
      const align = tableHeaders[cIdx]?.align || 'left';
      return `<td style="padding: 6px 8px; font-size: 9.5px; color: #1e293b; border-bottom: 1px solid #e2e8f0; text-align: ${align}; ${align === 'right' ? 'font-family: monospace; font-size: 10px; font-weight: 600;' : ''}">${cell}</td>`;
    }).join('');
    return `<tr style="background: ${bg};">${cellsHtml}</tr>`;
  }).join('');

  let totalRowHtml = '';
  if (totalRow) {
    const cellsHtml = totalRow.map((cell, cIdx) => {
      const align = tableHeaders[cIdx]?.align || 'left';
      return `<td style="padding: 8px 8px; font-size: 10px; font-weight: 800; color: #0f4c45; border-top: 2px solid #0f4c45; border-bottom: 2px solid #0f4c45; background: #f0fdfa; text-align: ${align}; ${align === 'right' ? 'font-family: monospace;' : ''}">${cell}</td>`;
    }).join('');
    totalRowHtml = `<tfoot><tr>${cellsHtml}</tr></tfoot>`;
  }

  doc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${reportTitle} - ${periodLabel}</title>
        <meta charset="utf-8" />
        <style>
          @page {
            size: A4 landscape;
            margin: 8mm 8mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 8px;
            color: #0f172a;
            background: #ffffff;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
        </style>
      </head>
      <body>
        <!-- Header -->
        <div style="border-bottom: 2px solid #0f4c45; padding-bottom: 10px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <div style="font-size: 18px; font-weight: 900; color: #0f4c45; letter-spacing: -0.5px;">${storeName}</div>
            <div style="font-size: 9.5px; color: #475569; font-weight: 600; margin-top: 1px;">
              Merchant Store Register • Facilitated via ${companyName} Marketplace
            </div>
            <div style="font-size: 8.5px; color: #64748b; margin-top: 2px; line-height: 1.3;">
              Store Location: ${storeCity} | <strong>Seller GSTIN:</strong> ${storeGstin} | <strong>Marketplace GSTIN:</strong> ${companyGstin}
            </div>
          </div>
          <div style="text-align: right;">
            <span style="display: inline-block; background: #0f4c45; color: #ffffff; font-size: 8.5px; font-weight: 800; padding: 2.5px 8px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.5px;">
              ${reportTypeBadge || 'SELLER TAX REPORT'}
            </span>
            <div style="font-size: 15px; font-weight: 800; color: #0f172a; margin-top: 3px;">${reportTitle}</div>
            <div style="font-size: 8.5px; color: #64748b; margin-top: 2px;">Generated: ${new Date().toLocaleString('en-IN')}</div>
          </div>
        </div>

        <!-- Meta strip -->
        <div style="background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 6px; padding: 6px 10px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; font-size: 9.5px;">
          <div><strong>Report Period:</strong> <span style="color: #0f4c45; font-weight: 700;">${periodLabel}</span></div>
          <div><strong>Seller Store:</strong> <span style="color: #0f4c45; font-weight: 700;">${storeName}</span></div>
          <div><strong>Total Transactions:</strong> <span style="font-weight: 700;">${tableRows.length} Record(s)</span></div>
        </div>

        <!-- Summary Cards -->
        ${summaryCards.length > 0 ? `
          <div style="display: flex; gap: 8px; margin-bottom: 10px; flex-wrap: wrap;">
            ${summaryHtml}
          </div>
        ` : ''}

        <!-- Table -->
        <table>
          <thead>
            <tr>${headersHtml}</tr>
          </thead>
          <tbody>
            ${rowsHtml || `<tr><td colspan="${tableHeaders.length}" style="text-align: center; padding: 24px; color: #94a3b8; font-size: 11px;">No transactions recorded for the selected period.</td></tr>`}
          </tbody>
          ${totalRowHtml}
        </table>

        <!-- Footer / Certification -->
        <div style="margin-top: 16px; border-top: 1px solid #cbd5e1; padding-top: 8px; display: flex; justify-content: space-between; align-items: flex-end; font-size: 8.5px; color: #64748b;">
          <div>
            <div>* Computer-generated statutory seller ledger compiled from orders processed through Book Vardi Platform.</div>
            <div>* Prepared in compliance with Section 31, Section 34 & Section 52 of CGST Act 2017 and Section 194-O Income Tax Act 1961.</div>
          </div>
          <div style="text-align: right;">
            <div style="font-weight: 800; color: #0f4c45;">${storeName}</div>
            <div style="margin-top: 12px; font-weight: 600;">Authorized Signatory / Tax File Record</div>
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.focus();
              window.print();
            }, 300);
          };
        </script>
      </body>
    </html>
  `);

  doc.close();
};

export default function BillingReportsTab() {
  const { orders = [], sellerUser, settings, finance } = useSellerData();

  // 1. Report Category Selector
  // 'tax_invoice' | 'credit_note' | 'commission' | 'tds' | 'tcs' | 'master'
  const [reportType, setReportType] = useState('master');

  // 2. Frequency Mode: 'day' | 'month' | 'year' | 'custom' | 'all'
  const [freqMode, setFreqMode] = useState('month');

  // Sub-frequency states
  const now = new Date();
  const todayYMD = now.toISOString().slice(0, 10);
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  const yesterdayYMD = yesterday.toISOString().slice(0, 10);

  const [dayPreset, setDayPreset] = useState('today'); // 'today' | 'yesterday' | 'custom_day'
  const [selectedDay, setSelectedDay] = useState(todayYMD);

  const [monthPreset, setMonthPreset] = useState('this_month'); // 'this_month' | 'last_month' | 'select_month'
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedMonthYear, setSelectedMonthYear] = useState(now.getFullYear());

  const [yearPreset, setYearPreset] = useState('fy_26_27'); // 'fy_26_27' | 'fy_25_26' | 'fy_24_25' | 'cy_2026' | 'cy_2025'

  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // 3. Other Filters
  const [orderTypeFilter, setOrderTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  // Store information
  const storeName = settings?.storeName || sellerUser?.storeName || 'Merchant Store';
  const gstin = settings?.gstNumber || sellerUser?.gstNumber || sellerUser?.kyc?.gstin || 'Not Provided';
  const sellerCity = settings?.city || sellerUser?.city || 'Local Area';
  const sellerState = settings?.state || sellerUser?.state || 'Uttar Pradesh';

  // Base Order Calculation & Enrichment
  const enrichedOrders = useMemo(() => {
    return orders.map(o => {
      const orderDate = new Date(o.createdAt || o.date || Date.now());
      const orderIdStr = o.orderId || (o._id ? o._id.toString().substring(0, 8).toUpperCase() : 'ORD');
      const invoiceNo = getSellerInvoiceNumber(o, sellerUser || settings, orders);
      const creditNoteNo = `CN-${invoiceNo}`;
      const exchangeInvoiceNo = `EXCH-${invoiceNo}`;

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

      // Statutory Exemption check (09BLMPK2840L2ZN / National School Dress / Digicoders / 0% Commission)
      const candidateGstList = [
        sellerUser?.gstNumber,
        sellerUser?.gstin,
        o.sellerGstNumber,
        o.sellerGstin,
        o.gstNumber,
        o.sellerDetails?.gstNumber,
        o.sellerDetails?.gstin,
        ...(o.items || []).map(it => it.sellerDetails?.gstNumber || it.sellerId?.gstNumber || it.sellerGstNumber || it.sellerGstin)
      ].filter(Boolean).map(g => String(g).trim().toUpperCase().replace(/[^A-Z0-9]/g, ''));

      const cleanStoreLower = String(sellerUser?.storeName || o.sellerStoreName || o.storeName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const candidatePhones = [
        sellerUser?.phone,
        o.sellerPhone,
        o.sellerDetails?.phone
      ].filter(Boolean).map(p => String(p).replace(/\D/g, ''));

      const isExemptedSeller =
        candidateGstList.some(g => g.includes('09BLMPK2840L2ZN')) ||
        cleanStoreLower.includes('nationalschooldress') ||
        cleanStoreLower.includes('pustakbhandar') ||
        cleanStoreLower.includes('digicoders') ||
        candidatePhones.some(p => p.includes('9027237697')) ||
        Number(sellerUser?.commissionRate ?? sellerUser?.commissionPercentage) === 0 ||
        Number(o.commissionRate) === 0;

      // Marketplace deductions (Strictly 0% if exempted)
      const commRate = isExemptedSeller ? 0 : Number(o.commissionRate ?? settings?.commissionRate ?? sellerUser?.commissionRate ?? 10);
      const commAmount = isExemptedSeller
        ? 0
        : (o.settlement?.commissionAmount !== undefined
            ? Number(o.settlement.commissionAmount)
            : Math.round(((grossAmount * commRate) / 100) * 100) / 100);

      const gstOnComm = isExemptedSeller
        ? 0
        : (o.settlement?.gstOnCommissionAmount !== undefined
            ? Number(o.settlement.gstOnCommissionAmount)
            : Math.round(((commAmount * 18) / 100) * 100) / 100);

      // TDS (Sec 194-O) 0.1% on Gross Amount (Strictly 0% if exempted)
      const tdsAmount = isExemptedSeller
        ? 0
        : (o.settlement?.tdsAmount !== undefined
            ? Number(o.settlement.tdsAmount)
            : Math.round(((grossAmount * 0.1) / 100) * 100) / 100);

      // GST TCS (Sec 52) 0.5% (Rule 3 COD Self Delivery = 0, Strictly 0% if exempted)
      const rawPayment = String(o.paymentMethod || o.paymentMode || '').toUpperCase();
      const isCod = rawPayment.includes('COD') || rawPayment.includes('CASH');
      const isRule3 = isCod && isSelfDelivery;
      const gstTcsAmount = (isRule3 || isExemptedSeller)
        ? 0
        : (o.settlement?.gstTcsAmount !== undefined
            ? Number(o.settlement.gstTcsAmount)
            : Math.round((((grossAmount / 1.05) * 0.5) / 100) * 100) / 100);

      // Delivery adjustment
      let deliveryAdjustment = 0;
      if (isSelfDelivery) {
        deliveryAdjustment = deliveryFee;
      } else {
        const ordThreshold = Number(o.freeDeliveryThreshold ?? 400);
        const isAboveThreshold = grossAmount >= ordThreshold;
        if (!isAboveThreshold && (o.deliveryChargeBorneBy === 'seller' || o.isDeliveryBorneBySeller)) {
          deliveryAdjustment = -Math.round((deliveryFee * 1.18) * 100) / 100;
        }
      }

      const totalDeductions = commAmount + gstOnComm + tdsAmount + gstTcsAmount + (deliveryAdjustment < 0 ? Math.abs(deliveryAdjustment) : 0);
      const netPayout = Math.max(0, Math.round((grossAmount - totalDeductions + (deliveryAdjustment > 0 ? deliveryAdjustment : 0)) * 100) / 100);

      const customerName = o.customer?.name || o.shippingAddress?.name || o.user?.name || 'Customer';
      const customerCity = o.shippingAddress?.city || o.city || 'Local Area';
      const customerState = o.shippingAddress?.state || o.state || 'Uttar Pradesh';
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
        isExemptedSeller,
        grossAmount,
        deliveryFee,
        itemsGross,
        totalTaxableValue: Math.round(totalTaxableValue * 100) / 100,
        totalGstAmount: Math.round(totalGstAmount * 100) / 100,
        cgstAmount: isInterState ? 0 : Math.round((totalGstAmount / 2) * 100) / 100,
        sgstAmount: isInterState ? 0 : Math.round((totalGstAmount / 2) * 100) / 100,
        igstAmount: isInterState ? Math.round(totalGstAmount * 100) / 100 : 0,
        isInterState,
        commRate,
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
  }, [orders, sellerUser, settings, sellerState]);

  // Compute Active Period Date Range & Label
  const periodDetails = useMemo(() => {
    let startDate = null;
    let endDate = null;
    let label = 'All Time';

    if (freqMode === 'day') {
      let targetYMD = selectedDay;
      if (dayPreset === 'today') {
        targetYMD = todayYMD;
        label = `Day: Today (${now.toLocaleDateString('en-IN')})`;
      } else if (dayPreset === 'yesterday') {
        targetYMD = yesterdayYMD;
        label = `Day: Yesterday (${yesterday.toLocaleDateString('en-IN')})`;
      } else {
        label = `Day: ${new Date(selectedDay).toLocaleDateString('en-IN')}`;
      }
      startDate = new Date(`${targetYMD}T00:00:00`);
      endDate = new Date(`${targetYMD}T23:59:59`);
    } else if (freqMode === 'month') {
      let m = selectedMonth;
      let y = selectedMonthYear;
      if (monthPreset === 'this_month') {
        m = now.getMonth();
        y = now.getFullYear();
        label = `Month: ${MONTH_NAMES[m]} ${y} (Current)`;
      } else if (monthPreset === 'last_month') {
        const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        m = lm.getMonth();
        y = lm.getFullYear();
        label = `Month: ${MONTH_NAMES[m]} ${y} (Previous)`;
      } else {
        label = `Month: ${MONTH_NAMES[m]} ${y}`;
      }
      startDate = new Date(y, m, 1, 0, 0, 0);
      endDate = new Date(y, m + 1, 0, 23, 59, 59);
    } else if (freqMode === 'year') {
      if (yearPreset === 'fy_26_27') {
        startDate = new Date(2026, 3, 1, 0, 0, 0);
        endDate = new Date(2027, 2, 31, 23, 59, 59);
        label = 'Financial Year 2026-27';
      } else if (yearPreset === 'fy_25_26') {
        startDate = new Date(2025, 3, 1, 0, 0, 0);
        endDate = new Date(2026, 2, 31, 23, 59, 59);
        label = 'Financial Year 2025-26';
      } else if (yearPreset === 'fy_24_25') {
        startDate = new Date(2024, 3, 1, 0, 0, 0);
        endDate = new Date(2025, 2, 31, 23, 59, 59);
        label = 'Financial Year 2024-25';
      } else if (yearPreset === 'cy_2026') {
        startDate = new Date(2026, 0, 1, 0, 0, 0);
        endDate = new Date(2026, 11, 31, 23, 59, 59);
        label = 'Calendar Year 2026';
      } else if (yearPreset === 'cy_2025') {
        startDate = new Date(2025, 0, 1, 0, 0, 0);
        endDate = new Date(2025, 11, 31, 23, 59, 59);
        label = 'Calendar Year 2025';
      }
    } else if (freqMode === 'custom') {
      if (customStartDate) startDate = new Date(`${customStartDate}T00:00:00`);
      if (customEndDate) endDate = new Date(`${customEndDate}T23:59:59`);
      label = `Date Range: ${customStartDate || 'Start'} to ${customEndDate || 'End'}`;
    } else {
      label = 'All Time (Full Ledger)';
    }

    return { startDate, endDate, label };
  }, [freqMode, dayPreset, selectedDay, monthPreset, selectedMonth, selectedMonthYear, yearPreset, customStartDate, customEndDate, todayYMD, yesterdayYMD]);

  // Filter Orders based on Report Type, Date, Order Type, and Search
  const filteredOrders = useMemo(() => {
    return enrichedOrders.filter(o => {
      // 1. Report Type filter
      if (reportType === 'tax_invoice') {
        if (o.isCancelled || o.isRefunded) return false;
      } else if (reportType === 'credit_note') {
        if (!o.isCancelled && !o.isRefunded && !o.isReturn) return false;
      }

      // 2. Date range filter
      const d = o.orderDate;
      if (periodDetails.startDate && d < periodDetails.startDate) return false;
      if (periodDetails.endDate && d > periodDetails.endDate) return false;

      // 3. Order Type filter
      if (orderTypeFilter === 'self_delivery' && !o.isSelfDelivery) return false;
      if (orderTypeFilter === 'courier' && !o.isThirdParty) return false;
      if (orderTypeFilter === 'returns' && !o.isReturn && !o.isCancelled) return false;
      if (orderTypeFilter === 'exchanges' && !o.isExchange) return false;

      // 4. Search query
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
  }, [enrichedOrders, reportType, periodDetails, orderTypeFilter, searchQuery]);

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

  // Report Title and Badges config
  const reportConfig = useMemo(() => {
    switch (reportType) {
      case 'tax_invoice':
        return {
          title: 'Store Tax Invoice Register (Section 31)',
          badge: 'STORE SALES REGISTER',
          filename: 'Tax_Invoice_Report'
        };
      case 'credit_note':
        return {
          title: 'Store Credit Note Register (Section 34)',
          badge: 'RETURNS & REVERSALS',
          filename: 'Credit_Note_Report'
        };
      case 'commission':
        return {
          title: 'Marketplace Commission Deductions Statement',
          badge: 'COMMISSION STATEMENT',
          filename: 'Commission_Report'
        };
      case 'tds':
        return {
          title: 'TDS Deduction Register (Section 194-O @ 0.1%)',
          badge: 'INCOME TAX TDS REGISTER',
          filename: 'TDS_Report'
        };
      case 'tcs':
        return {
          title: 'GST TCS Collected Register (Section 52)',
          badge: 'GST TCS REGISTER',
          filename: 'GST_TCS_Report'
        };
      case 'master':
      default:
        return {
          title: 'Store Master Billing & Tax Settlement Register',
          badge: 'MASTER BILLING REGISTER',
          filename: 'Billing_Settlement_Report'
        };
    }
  }, [reportType]);

  // Build Report Table Headers & Data based on active Report Type
  const { tableHeaders, getRowCells, getExcelRow, totalRowPrint } = useMemo(() => {
    if (reportType === 'tax_invoice') {
      const headers = [
        { label: 'S.No', align: 'left' },
        { label: 'Invoice No', align: 'left' },
        { label: 'Date', align: 'left' },
        { label: 'Order ID', align: 'left' },
        { label: 'Customer', align: 'left' },
        { label: 'Place of Supply', align: 'left' },
        { label: 'Delivery Mode', align: 'left' },
        { label: 'Taxable Value', align: 'right' },
        { label: 'CGST', align: 'right' },
        { label: 'SGST', align: 'right' },
        { label: 'IGST', align: 'right' },
        { label: 'Total GST', align: 'right' },
        { label: 'Invoice Total', align: 'right' }
      ];

      const getCells = (o, idx) => [
        idx + 1,
        o.invoiceNo,
        o.orderDate.toLocaleDateString('en-IN'),
        `#${o.orderIdStr}`,
        o.customerName,
        o.customerState,
        o.isSelfDelivery ? 'Self Delivery' : 'Courier',
        `₹${o.totalTaxableValue.toFixed(2)}`,
        `₹${o.cgstAmount.toFixed(2)}`,
        `₹${o.sgstAmount.toFixed(2)}`,
        `₹${o.igstAmount.toFixed(2)}`,
        `₹${o.totalGstAmount.toFixed(2)}`,
        `₹${o.grossAmount.toFixed(2)}`
      ];

      const getXlsx = (o, idx) => ({
        'S.No': idx + 1,
        'Invoice No': o.invoiceNo,
        'Invoice Date': o.orderDate.toLocaleDateString('en-IN'),
        'Order ID': o.orderIdStr,
        'Customer Name': o.customerName,
        'Place of Supply': o.customerState,
        'Delivery Mode': o.isSelfDelivery ? 'Self Delivery (OTP)' : 'Courier',
        'Taxable Value (₹)': o.totalTaxableValue.toFixed(2),
        'CGST (₹)': o.cgstAmount.toFixed(2),
        'SGST (₹)': o.sgstAmount.toFixed(2),
        'IGST (₹)': o.igstAmount.toFixed(2),
        'Total GST (₹)': o.totalGstAmount.toFixed(2),
        'Invoice Total (₹)': o.grossAmount.toFixed(2)
      });

      const totalRow = [
        'TOTAL',
        `${metrics.orderCount} Invoices`,
        '',
        '',
        '',
        '',
        '',
        `₹${metrics.totalTaxable.toFixed(2)}`,
        `₹${metrics.totalCgst.toFixed(2)}`,
        `₹${metrics.totalSgst.toFixed(2)}`,
        `₹${metrics.totalIgst.toFixed(2)}`,
        `₹${metrics.totalGst.toFixed(2)}`,
        `₹${metrics.totalInvoicedGross.toFixed(2)}`
      ];

      return { tableHeaders: headers, getRowCells: getCells, getExcelRow: getXlsx, totalRowPrint: totalRow };
    }

    if (reportType === 'credit_note') {
      const headers = [
        { label: 'S.No', align: 'left' },
        { label: 'Credit Note No', align: 'left' },
        { label: 'Date', align: 'left' },
        { label: 'Original Inv Ref', align: 'left' },
        { label: 'Order ID', align: 'left' },
        { label: 'Customer', align: 'left' },
        { label: 'Taxable Reversal', align: 'right' },
        { label: 'GST Reversal', align: 'right' },
        { label: 'Net Refund', align: 'right' }
      ];

      const getCells = (o, idx) => [
        idx + 1,
        o.creditNoteNo,
        o.orderDate.toLocaleDateString('en-IN'),
        o.invoiceNo,
        `#${o.orderIdStr}`,
        o.customerName,
        `₹${o.totalTaxableValue.toFixed(2)}`,
        `₹${o.totalGstAmount.toFixed(2)}`,
        `₹${o.grossAmount.toFixed(2)}`
      ];

      const getXlsx = (o, idx) => ({
        'S.No': idx + 1,
        'Credit Note No': o.creditNoteNo,
        'CN Date': o.orderDate.toLocaleDateString('en-IN'),
        'Original Invoice Ref': o.invoiceNo,
        'Order ID': o.orderIdStr,
        'Customer Name': o.customerName,
        'Taxable Reversal (₹)': o.totalTaxableValue.toFixed(2),
        'GST Reversal (₹)': o.totalGstAmount.toFixed(2),
        'Net Refund (₹)': o.grossAmount.toFixed(2)
      });

      const totalRow = [
        'TOTAL',
        `${metrics.orderCount} Credit Notes`,
        '',
        '',
        '',
        '',
        `₹${metrics.totalTaxable.toFixed(2)}`,
        `₹${metrics.totalGst.toFixed(2)}`,
        `₹${metrics.totalCreditNotesGross.toFixed(2)}`
      ];

      return { tableHeaders: headers, getRowCells: getCells, getExcelRow: getXlsx, totalRowPrint: totalRow };
    }

    if (reportType === 'commission') {
      const headers = [
        { label: 'S.No', align: 'left' },
        { label: 'Order ID', align: 'left' },
        { label: 'Invoice No', align: 'left' },
        { label: 'Date', align: 'left' },
        { label: 'Order Value', align: 'right' },
        { label: 'Rate (%)', align: 'right' },
        { label: 'Base Commission', align: 'right' },
        { label: 'GST (18%)', align: 'right' },
        { label: 'Total Commission', align: 'right' },
        { label: 'Net Payout', align: 'right' }
      ];

      const getCells = (o, idx) => [
        idx + 1,
        `#${o.orderIdStr}`,
        o.invoiceNo,
        o.orderDate.toLocaleDateString('en-IN'),
        `₹${o.grossAmount.toFixed(2)}`,
        o.isExemptedSeller ? '0% (Exempt)' : `${o.commRate}%`,
        o.isExemptedSeller ? '₹0.00 (Exempt)' : `₹${o.commAmount.toFixed(2)}`,
        o.isExemptedSeller ? '₹0.00 (Exempt)' : `₹${o.gstOnComm.toFixed(2)}`,
        o.isExemptedSeller ? '₹0.00 (Exempt)' : `₹${(o.commAmount + o.gstOnComm).toFixed(2)}`,
        `₹${o.netPayout.toFixed(2)}`
      ];

      const getXlsx = (o, idx) => ({
        'S.No': idx + 1,
        'Order ID': o.orderIdStr,
        'Invoice No': o.invoiceNo,
        'Date': o.orderDate.toLocaleDateString('en-IN'),
        'Order Gross Value (₹)': o.grossAmount.toFixed(2),
        'Commission Rate (%)': o.isExemptedSeller ? '0% (Exempt)' : `${o.commRate}%`,
        'Base Commission (₹)': o.isExemptedSeller ? '0.00 (Exempt)' : o.commAmount.toFixed(2),
        'GST on Commission @ 18% (₹)': o.isExemptedSeller ? '0.00 (Exempt)' : o.gstOnComm.toFixed(2),
        'Total Commission Billed (₹)': o.isExemptedSeller ? '0.00 (Exempt)' : (o.commAmount + o.gstOnComm).toFixed(2),
        'Net Settlement (₹)': o.netPayout.toFixed(2)
      });

      const totalRow = [
        'TOTAL',
        `${metrics.orderCount} Orders`,
        '',
        '',
        `₹${metrics.totalInvoicedGross.toFixed(2)}`,
        '',
        `₹${metrics.totalCommission.toFixed(2)}`,
        `₹${metrics.totalGstOnComm.toFixed(2)}`,
        `₹${(metrics.totalCommission + metrics.totalGstOnComm).toFixed(2)}`,
        `₹${metrics.totalNetPayout.toFixed(2)}`
      ];

      return { tableHeaders: headers, getRowCells: getCells, getExcelRow: getXlsx, totalRowPrint: totalRow };
    }

    if (reportType === 'tds') {
      const headers = [
        { label: 'S.No', align: 'left' },
        { label: 'Order ID', align: 'left' },
        { label: 'Date', align: 'left' },
        { label: 'Customer State', align: 'left' },
        { label: 'Gross Sales', align: 'right' },
        { label: 'TDS Section', align: 'center' },
        { label: 'TDS Rate', align: 'right' },
        { label: 'TDS Deducted', align: 'right' },
        { label: 'Net Disbursed', align: 'right' }
      ];

      const getCells = (o, idx) => [
        idx + 1,
        `#${o.orderIdStr}`,
        o.orderDate.toLocaleDateString('en-IN'),
        o.customerState,
        `₹${o.grossAmount.toFixed(2)}`,
        '194-O',
        o.isExemptedSeller ? '0.00% (Exempt)' : '0.10%',
        o.isExemptedSeller ? '₹0.00 (Exempt)' : `₹${o.tdsAmount.toFixed(2)}`,
        `₹${o.netPayout.toFixed(2)}`
      ];

      const getXlsx = (o, idx) => ({
        'S.No': idx + 1,
        'Order ID': o.orderIdStr,
        'Date': o.orderDate.toLocaleDateString('en-IN'),
        'Customer State': o.customerState,
        'Gross Sales Amount (₹)': o.grossAmount.toFixed(2),
        'TDS Section': '194-O',
        'TDS Rate (%)': o.isExemptedSeller ? '0.00% (Exempt)' : '0.10%',
        'TDS Amount Deducted (₹)': o.isExemptedSeller ? '0.00' : o.tdsAmount.toFixed(2),
        'Net Disbursed (₹)': o.netPayout.toFixed(2),
        'Status': o.isExemptedSeller ? 'Exempted (09BLMPK2840L2ZN / Zero TDS)' : 'Deducted by Marketplace'
      });

      const totalRow = [
        'TOTAL',
        `${metrics.orderCount} Orders`,
        '',
        '',
        `₹${metrics.totalInvoicedGross.toFixed(2)}`,
        '194-O',
        '0.10%',
        `₹${metrics.totalTds.toFixed(2)}`,
        `₹${metrics.totalNetPayout.toFixed(2)}`
      ];

      return { tableHeaders: headers, getRowCells: getCells, getExcelRow: getXlsx, totalRowPrint: totalRow };
    }

    if (reportType === 'tcs') {
      const headers = [
        { label: 'S.No', align: 'left' },
        { label: 'Order ID', align: 'left' },
        { label: 'Date', align: 'left' },
        { label: 'Delivery Mode', align: 'left' },
        { label: 'Taxable Supply', align: 'right' },
        { label: 'CGST TCS (0.5%)', align: 'right' },
        { label: 'SGST TCS (0.5%)', align: 'right' },
        { label: 'IGST TCS (1%)', align: 'right' },
        { label: 'Total GST TCS', align: 'right' }
      ];

      const getCells = (o, idx) => [
        idx + 1,
        `#${o.orderIdStr}`,
        o.orderDate.toLocaleDateString('en-IN'),
        o.isSelfDelivery ? 'Self Delivery' : 'Courier',
        `₹${o.totalTaxableValue.toFixed(2)}`,
        o.isExemptedSeller ? '₹0.00 (Exempt)' : `₹${o.isInterState ? '0.00' : (o.gstTcsAmount / 2).toFixed(2)}`,
        o.isExemptedSeller ? '₹0.00 (Exempt)' : `₹${o.isInterState ? '0.00' : (o.gstTcsAmount / 2).toFixed(2)}`,
        o.isExemptedSeller ? '₹0.00 (Exempt)' : `₹${o.isInterState ? o.gstTcsAmount.toFixed(2) : '0.00'}`,
        o.isExemptedSeller ? '₹0.00 (Exempt)' : `₹${o.gstTcsAmount.toFixed(2)}`
      ];

      const getXlsx = (o, idx) => ({
        'S.No': idx + 1,
        'Order ID': o.orderIdStr,
        'Date': o.orderDate.toLocaleDateString('en-IN'),
        'Delivery Mode': o.isSelfDelivery ? 'Self Delivery (OTP)' : 'Third-Party Courier',
        'Net Taxable Supply (₹)': o.totalTaxableValue.toFixed(2),
        'CGST TCS @ 0.5% (₹)': o.isExemptedSeller ? '0.00 (Exempt)' : (o.isInterState ? '0.00' : (o.gstTcsAmount / 2).toFixed(2)),
        'SGST TCS @ 0.5% (₹)': o.isExemptedSeller ? '0.00 (Exempt)' : (o.isInterState ? '0.00' : (o.gstTcsAmount / 2).toFixed(2)),
        'IGST TCS @ 1.0% (₹)': o.isExemptedSeller ? '0.00 (Exempt)' : (o.isInterState ? o.gstTcsAmount.toFixed(2) : '0.00'),
        'Total GST TCS (₹)': o.isExemptedSeller ? '0.00 (Exempt)' : o.gstTcsAmount.toFixed(2)
      });

      const totalRow = [
        'TOTAL',
        `${metrics.orderCount} Orders`,
        '',
        '',
        `₹${metrics.totalTaxable.toFixed(2)}`,
        `₹${(metrics.totalTcs / 2).toFixed(2)}`,
        `₹${(metrics.totalTcs / 2).toFixed(2)}`,
        '₹0.00',
        `₹${metrics.totalTcs.toFixed(2)}`
      ];

      return { tableHeaders: headers, getRowCells: getCells, getExcelRow: getXlsx, totalRowPrint: totalRow };
    }

    // Default: Master Register
    const headers = [
      { label: 'S.No', align: 'left' },
      { label: 'Invoice / Doc No', align: 'left' },
      { label: 'Date', align: 'left' },
      { label: 'Order ID', align: 'left' },
      { label: 'Customer', align: 'left' },
      { label: 'Gross Value', align: 'right' },
      { label: 'Taxable Value', align: 'right' },
      { label: 'Total GST', align: 'right' },
      { label: 'Commission', align: 'right' },
      { label: 'TDS (194-O)', align: 'right' },
      { label: 'GST TCS', align: 'right' },
      { label: 'Net Settlement', align: 'right' }
    ];

    const getCells = (o, idx) => {
      const isReturnOrCancel = o.isCancelled || o.isRefunded;
      return [
        idx + 1,
        isReturnOrCancel ? o.creditNoteNo : (o.isExchange ? o.exchangeInvoiceNo : o.invoiceNo),
        o.orderDate.toLocaleDateString('en-IN'),
        `#${o.orderIdStr}`,
        o.customerName,
        `${isReturnOrCancel ? '-' : ''}₹${o.grossAmount.toFixed(2)}`,
        `₹${o.totalTaxableValue.toFixed(2)}`,
        `₹${o.totalGstAmount.toFixed(2)}`,
        o.isExemptedSeller ? '₹0.00 (Exempt)' : `₹${o.commAmount.toFixed(2)}`,
        o.isExemptedSeller ? '₹0.00 (Exempt)' : `₹${o.tdsAmount.toFixed(2)}`,
        o.isExemptedSeller ? '₹0.00 (Exempt)' : `₹${o.gstTcsAmount.toFixed(2)}`,
        `₹${o.netPayout.toFixed(2)}`
      ];
    };

    const getXlsx = (o, idx) => {
      const isReturnOrCancel = o.isCancelled || o.isRefunded;
      return {
        'S.No': idx + 1,
        'Invoice / Doc No': isReturnOrCancel ? o.creditNoteNo : (o.isExchange ? o.exchangeInvoiceNo : o.invoiceNo),
        'Document Type': isReturnOrCancel ? 'Credit Note (Sec 34)' : (o.isExchange ? 'Replacement Tax Invoice' : 'Tax Invoice (Sec 31)'),
        'Date': o.orderDate.toLocaleDateString('en-IN'),
        'Order ID': o.orderIdStr,
        'Customer Name': o.customerName,
        'Gross Value (₹)': o.grossAmount.toFixed(2),
        'Taxable Value (₹)': o.totalTaxableValue.toFixed(2),
        'CGST (₹)': o.cgstAmount.toFixed(2),
        'SGST (₹)': o.sgstAmount.toFixed(2),
        'IGST (₹)': o.igstAmount.toFixed(2),
        'Total GST (₹)': o.totalGstAmount.toFixed(2),
        'Commission Fee (₹)': o.commAmount.toFixed(2),
        'GST on Commission (18%) (₹)': o.gstOnComm.toFixed(2),
        'TDS Sec 194-O (₹)': o.tdsAmount.toFixed(2),
        'GST TCS Sec 52 (₹)': o.gstTcsAmount.toFixed(2),
        'Net Settlement (₹)': o.netPayout.toFixed(2)
      };
    };

    const totalRow = [
      'TOTAL',
      `${metrics.orderCount} Orders`,
      '',
      '',
      '',
      `₹${metrics.totalInvoicedGross.toFixed(2)}`,
      `₹${metrics.totalTaxable.toFixed(2)}`,
      `₹${metrics.totalGst.toFixed(2)}`,
      `₹${metrics.totalCommission.toFixed(2)}`,
      `₹${metrics.totalTds.toFixed(2)}`,
      `₹${metrics.totalTcs.toFixed(2)}`,
      `₹${metrics.totalNetPayout.toFixed(2)}`
    ];

    return { tableHeaders: headers, getRowCells: getCells, getExcelRow: getXlsx, totalRowPrint: totalRow };
  }, [reportType, metrics]);

  // Export to Excel using XLSX
  const handleExportExcel = () => {
    setIsExporting(true);
    try {
      const rows = filteredOrders.map((o, idx) => getExcelRow(o, idx));

      // Append Summary Total Row
      if (rows.length > 0) {
        const totalEntry = { 'S.No': 'TOTAL' };
        Object.keys(rows[0]).forEach(k => {
          if (k !== 'S.No') totalEntry[k] = '';
        });
        if (reportType === 'tax_invoice') {
          totalEntry['Invoice No'] = `${metrics.orderCount} Invoices`;
          totalEntry['Taxable Value (₹)'] = metrics.totalTaxable.toFixed(2);
          totalEntry['CGST (₹)'] = metrics.totalCgst.toFixed(2);
          totalEntry['SGST (₹)'] = metrics.totalSgst.toFixed(2);
          totalEntry['IGST (₹)'] = metrics.totalIgst.toFixed(2);
          totalEntry['Total GST (₹)'] = metrics.totalGst.toFixed(2);
          totalEntry['Invoice Total (₹)'] = metrics.totalInvoicedGross.toFixed(2);
        } else if (reportType === 'credit_note') {
          totalEntry['Credit Note No'] = `${metrics.orderCount} Returns`;
          totalEntry['Taxable Reversal (₹)'] = metrics.totalTaxable.toFixed(2);
          totalEntry['GST Reversal (₹)'] = metrics.totalGst.toFixed(2);
          totalEntry['Net Refund (₹)'] = metrics.totalCreditNotesGross.toFixed(2);
        } else if (reportType === 'commission') {
          totalEntry['Order ID'] = `${metrics.orderCount} Orders`;
          totalEntry['Order Gross Value (₹)'] = metrics.totalInvoicedGross.toFixed(2);
          totalEntry['Base Commission (₹)'] = metrics.totalCommission.toFixed(2);
          totalEntry['GST on Commission @ 18% (₹)'] = metrics.totalGstOnComm.toFixed(2);
          totalEntry['Total Commission Billed (₹)'] = (metrics.totalCommission + metrics.totalGstOnComm).toFixed(2);
          totalEntry['Net Settlement (₹)'] = metrics.totalNetPayout.toFixed(2);
        } else if (reportType === 'tds') {
          totalEntry['Order ID'] = `${metrics.orderCount} Orders`;
          totalEntry['Gross Sales Amount (₹)'] = metrics.totalInvoicedGross.toFixed(2);
          totalEntry['TDS Amount Deducted (₹)'] = metrics.totalTds.toFixed(2);
          totalEntry['Net Disbursed (₹)'] = metrics.totalNetPayout.toFixed(2);
        } else if (reportType === 'tcs') {
          totalEntry['Order ID'] = `${metrics.orderCount} Orders`;
          totalEntry['Net Taxable Supply (₹)'] = metrics.totalTaxable.toFixed(2);
          totalEntry['Total GST TCS (₹)'] = metrics.totalTcs.toFixed(2);
        } else {
          totalEntry['Invoice / Doc No'] = `${metrics.orderCount} Records`;
          totalEntry['Gross Value (₹)'] = metrics.totalInvoicedGross.toFixed(2);
          totalEntry['Taxable Value (₹)'] = metrics.totalTaxable.toFixed(2);
          totalEntry['Total GST (₹)'] = metrics.totalGst.toFixed(2);
          totalEntry['Commission Fee (₹)'] = metrics.totalCommission.toFixed(2);
          totalEntry['TDS Sec 194-O (₹)'] = metrics.totalTds.toFixed(2);
          totalEntry['GST TCS Sec 52 (₹)'] = metrics.totalTcs.toFixed(2);
          totalEntry['Net Settlement (₹)'] = metrics.totalNetPayout.toFixed(2);
        }
        rows.push(totalEntry);
      }

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, reportConfig.filename.slice(0, 31));

      // Metadata Sheet
      const metaData = [
        { Key: 'Store Name', Value: storeName },
        { Key: 'GSTIN', Value: gstin },
        { Key: 'Report Type', Value: reportConfig.title },
        { Key: 'Period', Value: periodDetails.label },
        { Key: 'Generated On', Value: new Date().toLocaleDateString('en-IN') },
        { Key: 'Total Invoiced Gross Turnover', Value: `Rs. ${metrics.totalInvoicedGross.toFixed(2)}` },
        { Key: 'Total Net Payout', Value: `Rs. ${metrics.totalNetPayout.toFixed(2)}` }
      ];
      const metaSheet = XLSX.utils.json_to_sheet(metaData);
      XLSX.utils.book_append_sheet(workbook, metaSheet, 'Report_Summary');

      const dateStr = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(workbook, `BookVardi_${reportConfig.filename}_${dateStr}.xlsx`);
    } catch (err) {
      console.error('Failed to export Excel report:', err);
      alert('Failed to generate Excel file: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  // Dedicated Clean PDF / Print Report Generator
  const handlePrintCleanReport = () => {
    const summaryCards = [];
    if (reportType === 'tax_invoice') {
      summaryCards.push(
        { label: 'Total Invoiced Gross', value: `₹${metrics.totalInvoicedGross.toFixed(2)}`, sub: `${metrics.orderCount} Invoices Issued` },
        { label: 'Total Taxable Turnover', value: `₹${metrics.totalTaxable.toFixed(2)}`, sub: 'Net Taxable Supplies' },
        { label: 'Output GST Collected', value: `₹${metrics.totalGst.toFixed(2)}`, sub: `CGST: ₹${metrics.totalCgst.toFixed(2)} | SGST: ₹${metrics.totalSgst.toFixed(2)}` }
      );
    } else if (reportType === 'credit_note') {
      summaryCards.push(
        { label: 'Credit Notes Value', value: `₹${metrics.totalCreditNotesGross.toFixed(2)}`, sub: `${metrics.orderCount} Returns & Cancellations` },
        { label: 'Taxable Reversal', value: `₹${metrics.totalTaxable.toFixed(2)}`, sub: 'Sales Return Base' },
        { label: 'GST Reversal', value: `₹${metrics.totalGst.toFixed(2)}`, sub: 'Sec 34 GST Input Adjustment' }
      );
    } else if (reportType === 'commission') {
      summaryCards.push(
        { label: 'Total Order Value (GMV)', value: `₹${metrics.totalInvoicedGross.toFixed(2)}`, sub: `${metrics.orderCount} Orders` },
        { label: 'Marketplace Commission', value: `₹${metrics.totalCommission.toFixed(2)}`, sub: 'Base Platform Cut' },
        { label: 'GST on Commission (18%)', value: `₹${metrics.totalGstOnComm.toFixed(2)}`, sub: 'Output Tax on Fee' },
        { label: 'Total Commission Billed', value: `₹${(metrics.totalCommission + metrics.totalGstOnComm).toFixed(2)}`, sub: 'Deducted from Seller' }
      );
    } else if (reportType === 'tds') {
      summaryCards.push(
        { label: 'Total Gross Sales', value: `₹${metrics.totalInvoicedGross.toFixed(2)}`, sub: 'Gross Turnover of Store' },
        { label: 'Statutory TDS Rate', value: '0.10%', sub: 'Sec 194-O Income Tax Act' },
        { label: 'Total TDS Deducted', value: `₹${metrics.totalTds.toFixed(2)}`, sub: 'Deposited under PAN/GSTIN' },
        { label: 'Net Disbursed to Store', value: `₹${metrics.totalNetPayout.toFixed(2)}`, sub: 'After Statutory Deductions' }
      );
    } else if (reportType === 'tcs') {
      summaryCards.push(
        { label: 'Net Taxable Supplies', value: `₹${metrics.totalTaxable.toFixed(2)}`, sub: 'Sec 52 Taxable Base' },
        { label: 'Total GST TCS Collected', value: `₹${metrics.totalTcs.toFixed(2)}`, sub: '0.5% CGST + 0.5% SGST / 1% IGST' }
      );
    } else {
      summaryCards.push(
        { label: 'Gross Invoiced GMV', value: `₹${metrics.totalInvoicedGross.toFixed(2)}`, sub: `${metrics.orderCount} Orders` },
        { label: 'Net Taxable Turnover', value: `₹${metrics.totalTaxable.toFixed(2)}`, sub: 'Taxable Supplies' },
        { label: 'Total Output GST', value: `₹${metrics.totalGst.toFixed(2)}`, sub: `CGST+SGST: ₹${(metrics.totalCgst + metrics.totalSgst).toFixed(2)}` },
        { label: 'Platform Commission', value: `₹${metrics.totalCommission.toFixed(2)}`, sub: `+18% GST: ₹${metrics.totalGstOnComm.toFixed(2)}` },
        { label: 'TDS (194-O) 0.1%', value: `₹${metrics.totalTds.toFixed(2)}`, sub: 'Income Tax Deduction' },
        { label: 'Net Seller Settlement', value: `₹${metrics.totalNetPayout.toFixed(2)}`, sub: 'Disbursed / Due' }
      );
    }

    const printRows = filteredOrders.map((o, idx) => getRowCells(o, idx));

    printStatutoryReport({
      reportTitle: reportConfig.title,
      reportTypeBadge: reportConfig.badge,
      periodLabel: periodDetails.label,
      scopeLabel: `${storeName} (${sellerCity})`,
      sellerStoreDetails: { storeName, gstin, city: sellerCity },
      summaryCards,
      tableHeaders,
      tableRows: printRows,
      totalRow: totalRowPrint
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 print:p-0 print:space-y-4">
      {/* 1. Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs print:hidden">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-50 text-teal-700 border border-teal-200 uppercase tracking-wider">
              Accounting & Tax Register
            </span>
            <span className="text-xs text-gray-500 font-medium">
              Store GSTIN: <strong className="text-gray-800">{gstin}</strong>
            </span>
          </div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
            <FileSpreadsheet className="text-teal-600" size={26} />
            {storeName} - Billing & Tax Reports
          </h2>
          <p className="text-xs text-gray-500 mt-1 max-w-2xl">
            Statutory ledger of customer tax invoices, credit notes, commissions, TDS (Sec 194-O), and net settlements.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Export Excel Button */}
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

          {/* Clean Dedicated PDF Statement Download Button */}
          <button
            type="button"
            disabled={filteredOrders.length === 0}
            onClick={handlePrintCleanReport}
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-700 hover:bg-rose-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
            title="Export clean, official statutory PDF report (A4 landscape without website UI)"
          >
            <FileText size={15} />
            <span>Export Clean PDF</span>
          </button>

          {/* Print Button */}
          <button
            type="button"
            disabled={filteredOrders.length === 0}
            onClick={handlePrintCleanReport}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all cursor-pointer border border-gray-300"
            title="Print or Save as PDF"
          >
            <Printer size={15} />
            <span>Print View</span>
          </button>
        </div>
      </div>

      {/* 2. REPORT TYPE SELECTOR (Tabs / Pills) */}
      <div className="bg-white p-3 rounded-2xl border border-gray-200/80 shadow-xs print:hidden">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          <span className="text-[10px] font-extrabold uppercase text-gray-400 px-2 tracking-wider shrink-0">Report:</span>
          {[
            { id: 'master', label: '📊 Master Billing Register', badge: 'All-in-One' },
            { id: 'tax_invoice', label: '📄 Tax Invoice Report', badge: 'Sec 31' },
            { id: 'credit_note', label: '↩️ Credit Note Report', badge: 'Sec 34' },
            { id: 'commission', label: '💼 Commission Statement', badge: 'Platform Fee' },
            { id: 'tds', label: '🏛️ TDS Report', badge: 'Sec 194-O (0.1%)' },
            { id: 'tcs', label: '⚖️ GST TCS Report', badge: 'Sec 52 (0.5%)' }
          ].map(tab => {
            const active = reportType === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setReportType(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer shrink-0 border ${
                  active
                    ? 'bg-brand-teal text-white border-brand-teal shadow-xs'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-black uppercase ${active ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'}`}>
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. PERIOD / FREQUENCY CONTROLS BAR */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs space-y-3.5 print:hidden">
        {/* Row 1: Frequency Modes */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl text-xs font-bold text-gray-600">
            {[
              { id: 'day', label: '📅 Day-Wise' },
              { id: 'month', label: '🗓️ Month-Wise' },
              { id: 'year', label: '📈 Year-Wise / FY' },
              { id: 'custom', label: '⏱️ Custom Range' },
              { id: 'all', label: '🌐 All Time' }
            ].map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFreqMode(f.id)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer text-xs font-extrabold ${
                  freqMode === f.id
                    ? 'bg-white text-brand-teal shadow-2xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="text-xs font-semibold text-gray-500">
            Active Filter: <strong className="text-brand-teal font-extrabold">{periodDetails.label}</strong>
          </div>
        </div>

        {/* Row 2: Sub-controls based on Frequency */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* DAY-WISE SUB-CONTROLS */}
          {freqMode === 'day' && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => { setDayPreset('today'); setSelectedDay(todayYMD); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                    dayPreset === 'today' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => { setDayPreset('yesterday'); setSelectedDay(yesterdayYMD); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                    dayPreset === 'yesterday' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Yesterday
                </button>
                <button
                  type="button"
                  onClick={() => setDayPreset('custom_day')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                    dayPreset === 'custom_day' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Pick Date
                </button>
              </div>

              {dayPreset === 'custom_day' && (
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl text-xs">
                  <span className="text-gray-500 font-bold">Select Date:</span>
                  <input
                    type="date"
                    value={selectedDay}
                    onChange={e => setSelectedDay(e.target.value)}
                    className="bg-transparent text-gray-900 font-bold focus:outline-hidden cursor-pointer"
                  />
                </div>
              )}
            </div>
          )}

          {/* MONTH-WISE SUB-CONTROLS */}
          {freqMode === 'month' && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setMonthPreset('this_month')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                    monthPreset === 'this_month' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  This Month ({MONTH_NAMES[now.getMonth()].slice(0, 3)})
                </button>
                <button
                  type="button"
                  onClick={() => setMonthPreset('last_month')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                    monthPreset === 'last_month' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Last Month
                </button>
                <button
                  type="button"
                  onClick={() => setMonthPreset('select_month')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                    monthPreset === 'select_month' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Select Month & Year
                </button>
              </div>

              {monthPreset === 'select_month' && (
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl text-xs">
                  <select
                    value={selectedMonth}
                    onChange={e => setSelectedMonth(Number(e.target.value))}
                    className="bg-transparent font-bold text-gray-900 cursor-pointer focus:outline-hidden"
                  >
                    {MONTH_NAMES.map((mName, idx) => (
                      <option key={mName} value={idx}>{mName}</option>
                    ))}
                  </select>
                  <select
                    value={selectedMonthYear}
                    onChange={e => setSelectedMonthYear(Number(e.target.value))}
                    className="bg-transparent font-bold text-gray-900 cursor-pointer focus:outline-hidden"
                  >
                    <option value={2027}>2027</option>
                    <option value={2026}>2026</option>
                    <option value={2025}>2025</option>
                    <option value={2024}>2024</option>
                  </select>
                </div>
              )}
            </div>
          )}

          {/* YEAR-WISE SUB-CONTROLS */}
          {freqMode === 'year' && (
            <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl text-xs font-semibold">
              {[
                { id: 'fy_26_27', label: 'FY 2026-27' },
                { id: 'fy_25_26', label: 'FY 2025-26' },
                { id: 'fy_24_25', label: 'FY 2024-25' },
                { id: 'cy_2026', label: 'CY 2026' },
                { id: 'cy_2025', label: 'CY 2025' }
              ].map(y => (
                <button
                  key={y.id}
                  type="button"
                  onClick={() => setYearPreset(y.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                    yearPreset === y.id ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {y.label}
                </button>
              ))}
            </div>
          )}

          {/* CUSTOM RANGE SUB-CONTROLS */}
          {freqMode === 'custom' && (
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl text-xs">
              <span className="text-gray-500 font-bold">From:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={e => setCustomStartDate(e.target.value)}
                className="bg-transparent text-gray-800 font-semibold focus:outline-hidden cursor-pointer"
              />
              <span className="text-gray-500 font-bold">To:</span>
              <input
                type="date"
                value={customEndDate}
                onChange={e => setCustomEndDate(e.target.value)}
                className="bg-transparent text-gray-800 font-semibold focus:outline-hidden cursor-pointer"
              />
            </div>
          )}

          {/* Order Type Filter */}
          <select
            value={orderTypeFilter}
            onChange={e => setOrderTypeFilter(e.target.value)}
            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200/70 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 cursor-pointer focus:outline-hidden ml-auto"
          >
            <option value="all">📦 All Delivery Types</option>
            <option value="self_delivery">🛵 Self Delivery (OTP)</option>
            <option value="courier">🚚 Courier Partner</option>
            <option value="returns">↩️ Returns / Credit Notes</option>
            <option value="exchanges">🔄 Exchanges</option>
          </select>

          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search Invoice, Order ID, Customer..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-teal-600 transition-colors"
            />
          </div>
        </div>

        {/* Filter status strip */}
        <div className="flex items-center justify-between text-xs text-gray-500 pt-1 border-t border-gray-100">
          <span>Showing <strong>{filteredOrders.length}</strong> matching transaction records</span>
          <span>Merchant Store: <strong className="text-teal-800">{storeName}</strong></span>
        </div>
      </div>

      {/* 4. FINANCIAL KPI METRICS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 print:hidden">
        {/* Metric 1 */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {reportType === 'credit_note' ? 'Total Return Value' : 'Gross Store Sales'}
            </span>
            <div className="p-1.5 bg-teal-50 text-teal-700 rounded-lg">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="text-xl font-black text-gray-900 tracking-tight">
            ₹{(reportType === 'credit_note' ? metrics.totalCreditNotesGross : metrics.totalInvoicedGross).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-gray-400 mt-1">
            {metrics.orderCount} transaction records in scope
          </div>
        </div>

        {/* Metric 2: Taxable Turnover */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Net Taxable Supplies</span>
            <div className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg">
              <Receipt size={16} />
            </div>
          </div>
          <div className="text-xl font-black text-indigo-950 tracking-tight">
            ₹{metrics.totalTaxable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-gray-400 mt-1">
            Excludes 0% GST exempt textbooks
          </div>
        </div>

        {/* Metric 3: GST Breakdown */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {reportType === 'credit_note' ? 'GST Reversed' : 'Total Output GST'}
            </span>
            <div className="p-1.5 bg-purple-50 text-purple-700 rounded-lg">
              <Scale size={16} />
            </div>
          </div>
          <div className="text-xl font-black text-purple-950 tracking-tight">
            ₹{metrics.totalGst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-gray-400 mt-1">
            CGST+SGST: ₹{(metrics.totalCgst + metrics.totalSgst).toFixed(2)} | IGST: ₹{metrics.totalIgst.toFixed(2)}
          </div>
        </div>

        {/* Metric 4 */}
        {reportType === 'commission' ? (
          <div className="bg-gradient-to-br from-teal-800 to-emerald-900 p-4 rounded-2xl text-white shadow-xs">
            <div className="flex items-center justify-between text-teal-200 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Total Commission Billed</span>
              <div className="p-1.5 bg-white/10 text-teal-200 rounded-lg">
                <Percent size={16} />
              </div>
            </div>
            <div className="text-xl font-black text-white tracking-tight">
              ₹{(metrics.totalCommission + metrics.totalGstOnComm).toFixed(2)}
            </div>
            <div className="text-[11px] text-teal-200/80 mt-1">
              Base: ₹{metrics.totalCommission.toFixed(2)} + 18% GST: ₹{metrics.totalGstOnComm.toFixed(2)}
            </div>
          </div>
        ) : reportType === 'tds' ? (
          <div className="bg-gradient-to-br from-amber-700 to-amber-900 p-4 rounded-2xl text-white shadow-xs">
            <div className="flex items-center justify-between text-amber-200 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">TDS Deducted (0.1%)</span>
              <div className="p-1.5 bg-white/10 text-amber-200 rounded-lg">
                <Landmark size={16} />
              </div>
            </div>
            <div className="text-xl font-black text-white tracking-tight">
              ₹{metrics.totalTds.toFixed(2)}
            </div>
            <div className="text-[11px] text-amber-200/80 mt-1">
              Sec 194-O Income Tax Deduction
            </div>
          </div>
        ) : reportType === 'tcs' ? (
          <div className="bg-gradient-to-br from-indigo-800 to-blue-900 p-4 rounded-2xl text-white shadow-xs">
            <div className="flex items-center justify-between text-indigo-200 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">GST TCS Collected (0.5%)</span>
              <div className="p-1.5 bg-white/10 text-indigo-200 rounded-lg">
                <ShieldCheck size={16} />
              </div>
            </div>
            <div className="text-xl font-black text-white tracking-tight">
              ₹{metrics.totalTcs.toFixed(2)}
            </div>
            <div className="text-[11px] text-indigo-200/80 mt-1">
              Sec 52 E-Commerce GST TCS
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-emerald-800 to-teal-900 p-4 rounded-2xl text-white shadow-xs">
            <div className="flex items-center justify-between text-emerald-200 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Net Settlement Earnings</span>
              <div className="p-1.5 bg-white/10 text-emerald-200 rounded-lg">
                <ShieldCheck size={16} />
              </div>
            </div>
            <div className="text-xl font-black text-white tracking-tight">
              ₹{metrics.totalNetPayout.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-emerald-200/80 mt-1">
              Payable / Settled to Seller
            </div>
          </div>
        )}
      </div>

      {/* 5. DETAILED DATA TABLE */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
              <span>{reportConfig.title}</span>
              <span className="text-xs font-normal text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                {periodDetails.label}
              </span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Filtered for {storeName}. Total records: {filteredOrders.length}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrintCleanReport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl transition-colors cursor-pointer border border-gray-300"
            >
              <Printer size={13} />
              <span>Print This Report</span>
            </button>
            <button
              type="button"
              disabled={isExporting || filteredOrders.length === 0}
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
            >
              <Download size={13} />
              <span>Export Excel</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider text-[10px]">
                {tableHeaders.map((th, i) => (
                  <th key={i} className={`py-3 px-3 ${th.align === 'right' ? 'text-right' : th.align === 'center' ? 'text-center' : 'text-left'}`}>
                    {th.label}
                  </th>
                ))}
                <th className="py-3 px-3 text-center">Docs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={tableHeaders.length + 1} className="py-12 text-center text-gray-400">
                    <AlertCircle size={32} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-sm font-semibold">No transactions found for the selected report filters.</p>
                    <p className="text-xs text-gray-400 mt-1">Try switching to "Month-Wise", "Day-Wise", or selecting "All Time".</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o, idx) => {
                  const cells = getRowCells(o, idx);
                  const isReturnOrCancel = o.isCancelled || o.isRefunded;
                  return (
                    <tr key={o.orderIdStr || idx} className="hover:bg-gray-50/70 transition-colors">
                      {cells.map((val, cIdx) => {
                        const align = tableHeaders[cIdx]?.align || 'left';
                        return (
                          <td
                            key={cIdx}
                            className={`py-3 px-3 text-gray-800 ${
                              align === 'right'
                                ? 'text-right font-mono font-semibold'
                                : align === 'center'
                                  ? 'text-center'
                                  : 'text-left'
                            }`}
                          >
                            {val}
                          </td>
                        );
                      })}
                      {/* Document Actions Column */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {!isReturnOrCancel && (
                            <a
                              href={`${SERVER_URL}/orders/${o.id || o._id}/invoice`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] font-bold rounded-lg transition-colors border border-gray-200"
                              title="Download Invoice PDF"
                            >
                              PDF
                            </a>
                          )}
                          {(isReturnOrCancel || o.isExchange) && (
                            <a
                              href={`${SERVER_URL}/orders/${o.id || o._id}/credit-note`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 text-[10px] font-bold rounded-lg transition-colors border border-rose-200"
                              title="Download Credit Note PDF"
                            >
                              CN
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {/* TOTAL FOOTER ROW */}
            {filteredOrders.length > 0 && totalRowPrint && (
              <tfoot>
                <tr className="bg-teal-50/80 border-t-2 border-b-2 border-brand-teal text-brand-teal font-extrabold text-[11px]">
                  {totalRowPrint.map((tot, idx) => {
                    const align = tableHeaders[idx]?.align || 'left';
                    return (
                      <td
                        key={idx}
                        className={`py-3 px-3 ${
                          align === 'right'
                            ? 'text-right font-mono font-black'
                            : align === 'center'
                              ? 'text-center'
                              : 'text-left'
                        }`}
                      >
                        {tot}
                      </td>
                    );
                  })}
                  <td className="py-3 px-3 text-center">-</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
