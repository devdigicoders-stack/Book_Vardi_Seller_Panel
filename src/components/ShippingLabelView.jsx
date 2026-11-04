import React, { useMemo, useState, useEffect } from 'react';
import { 
  Printer, 
  Download, 
  ExternalLink, 
  Truck, 
  CheckCircle2, 
  ShieldCheck, 
  Package,
  RefreshCw,
  FileText,
  AlertCircle,
  Copy,
  Check
} from 'lucide-react';
import { SERVER_URL, getAuthHeaders } from '../utils/api';
import { parseStateInfo } from './TaxInvoiceModal';

// Code 128-B Pattern Table (Standard ISO/IEC 15417)
const CODE128_PATTERNS = [
  "212222","222122","222221","121223","121322","131222","122213","122312","132212","221213",
  "221312","231212","112232","122132","122231","113222","123122","123221","223211","221132",
  "221231","213212","223112","312131","311222","321122","321221","312212","322112","322211",
  "212123","212321","232121","111323","131123","131321","112313","132113","132311","211313",
  "231113","231311","112133","112331","132131","113123","113321","133121","313121","211331",
  "231131","213113","213311","213131","311123","311321","331121","312113","312311","332111",
  "314111","221411","431111","111224","111422","121124","121421","141122","141221","112214",
  "112412","122114","122411","142112","142211","241211","221114","413111","241112","134111",
  "111242","121142","121241","114212","124112","124211","411212","421112","421211","212141",
  "214121","412121","111143","111341","131141","114113","114311","411113","411311","113141",
  "114131","311141","411131","211412","211214","211232","2331112"
];

export function generateCode128Svg(text, barHeight = 44) {
  if (!text) text = "BV00000000";
  const clean = String(text).toUpperCase().replace(/[^ -~]/g, '');
  let values = [104]; // Start Code B
  let checkSum = 104;

  for (let i = 0; i < clean.length; i++) {
    const code = clean.charCodeAt(i) - 32;
    if (code >= 0 && code <= 95) {
      values.push(code);
      checkSum += code * (i + 1);
    }
  }

  values.push(checkSum % 103);
  values.push(106); // Stop Code

  const pattern = values.map(v => CODE128_PATTERNS[v] || "212222").join("");
  let x = 8;
  const rects = [];
  const unit = 1.45;

  for (let i = 0; i < pattern.length; i++) {
    const w = parseInt(pattern[i], 10) * unit;
    if (i % 2 === 0) {
      rects.push(`<rect x="${x.toFixed(1)}" y="0" width="${w.toFixed(1)}" height="${barHeight}" fill="#000000" />`);
    }
    x += w;
  }

  const totalWidth = Math.ceil(x + 8);
  return {
    svgHtml: `<svg viewBox="0 0 ${totalWidth} ${barHeight + 15}" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" preserveAspectRatio="none">
      ${rects.join("")}
      <text x="${(totalWidth / 2).toFixed(1)}" y="${barHeight + 12}" font-family="monospace, monospace" font-size="11" font-weight="900" letter-spacing="1" text-anchor="middle" fill="#000000">${clean}</text>
    </svg>`,
    width: totalWidth,
    height: barHeight + 15
  };
}

/**
 * Universal print handler for Shipping Label
 * Supports both 4x6 inch thermal sticker and standard A4 paper layout
 */
export function printShippingLabel(labelElementId = 'printableShippingLabelArea', format = '4x6') {
  const el = document.getElementById(labelElementId);
  if (!el) {
    window.print();
    return;
  }

  const isThermal = format === '4x6';
  const styleSheets = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map(s => s.outerHTML)
    .join('\n');

  const printWin = window.open('', '_blank', 'width=800,height=1000');
  if (!printWin) {
    window.print();
    return;
  }

  printWin.document.open();
  printWin.document.write(`<!DOCTYPE html>
<html>
  <head>
    <title>Shipping_Label_Packing_Slip</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    ${styleSheets}
    <style>
      @page {
        size: ${isThermal ? '100mm 150mm portrait' : 'A4 portrait'};
        margin: ${isThermal ? '2mm' : '8mm 10mm'};
      }
      * {
        box-sizing: border-box !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        color: #000000 !important;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
      }
      #printContainer {
        width: 100% !important;
        max-width: ${isThermal ? '100mm' : '190mm'} !important;
        margin: 0 auto !important;
        padding: ${isThermal ? '1mm' : '4mm'} !important;
        background: #ffffff !important;
      }
      table {
        border-collapse: collapse !important;
        width: 100% !important;
      }
      .no-print {
        display: none !important;
      }
    </style>
  </head>
  <body>
    <div id="printContainer">
      ${el.innerHTML}
    </div>
    <script>
      window.onload = function() {
        setTimeout(function() {
          window.focus();
          window.print();
          setTimeout(function() { window.close(); }, 750);
        }, 250);
      };
    </script>
  </body>
</html>`);
  printWin.document.close();
}

/**
 * ShippingLabelView Component
 * Renders an exact Shiprocket / E-commerce standard 4x6 Parcel Shipping Label
 * with integrated Barcode, QR Code, Routing info, and Tax Invoice / Packing Slip
 */
export default function ShippingLabelView({
  order = {},
  sellerDetails = null,
  items = [],
  invoiceNumber = '',
  onClose = null,
  onSwitchToInvoice = null
}) {
  const effectiveItems = items && items.length > 0 ? items : (order.items || []);
  const rawId = order.id || order.orderId || order._id || 'ORD';
  const cleanOrderId = String(rawId).replace(/^#/, '').trim();

  // Delivery / Routing info
  const courierName = order.courierName || order.shipmentDetails?.courierPartnerName || 'Shiprocket';
  const rawAwb = order.trackingNumber || order.shipmentDetails?.awbNumber || order.returnRequest?.exchangeAwb || '';
  const awbNumber = rawAwb && rawAwb !== 'N/A' && rawAwb !== ''
    ? String(rawAwb).trim()
    : `SF${cleanOrderId.replace(/[^0-9]/g, '').padEnd(10, '0').slice(-10)}FPL`;

  const rawPaymentMode = String(order.paymentMethod || order.paymentMode || '').toUpperCase();
  const isCod = rawPaymentMode.includes('COD') || rawPaymentMode.includes('CASH');

  // Multi-layered Customer & Address Resolution
  const addrObj = (typeof order.shippingAddress === 'object' && order.shippingAddress !== null)
    ? order.shippingAddress
    : (typeof order.rawShippingAddress === 'object' && order.rawShippingAddress !== null)
    ? order.rawShippingAddress
    : (typeof order.shippingAddressObj === 'object' && order.shippingAddressObj !== null)
    ? order.shippingAddressObj
    : null;

  const addrString = typeof order.shippingAddress === 'string'
    ? order.shippingAddress
    : (typeof order.deliveryAddress === 'string'
      ? order.deliveryAddress
      : (typeof order.address === 'string' ? order.address : ''));

  const pincodeMatch = addrString ? addrString.match(/\b([1-9][0-9]{5})\b/) : null;

  const customerName = (
    order.customerName ||
    order.customer?.name ||
    order.customer?.fullName ||
    addrObj?.name ||
    addrObj?.fullName ||
    order.userName ||
    order.user?.name ||
    'Customer'
  );

  const customerPincode = (
    addrObj?.pincode ||
    addrObj?.postalCode ||
    addrObj?.pin ||
    order.pincode ||
    order.postalCode ||
    order.shippingAddress?.pincode ||
    (pincodeMatch ? pincodeMatch[1] : '') ||
    '247121'
  );

  const customerPhone = (
    order.customerPhone ||
    order.customer?.phone ||
    addrObj?.phone ||
    order.userPhone ||
    order.user?.phone ||
    order.phone ||
    ''
  );

  let customerAddress = (
    addrObj?.street ||
    addrObj?.addressLine ||
    addrObj?.addressLine1 ||
    addrObj?.address ||
    order.address ||
    ''
  );

  if (addrObj?.landmark && !customerAddress.toLowerCase().includes(String(addrObj.landmark).toLowerCase())) {
    customerAddress = `${customerAddress}, ${addrObj.landmark}`.trim().replace(/^,\s*/, '');
  }
  if (!customerAddress && addrString) {
    customerAddress = addrString;
  }
  if (!customerAddress) {
    customerAddress = 'Delivery Address';
  }

  // Seller info
  let sellerStoreName = sellerDetails?.storeName || order.sellerStoreName || order.storeName || 'NATIONAL SCHOOL DRESS EVAM PUSTAK BHANDAR';
  let sellerContactName = sellerDetails?.name || sellerDetails?.sellerName || 'PRAVEEN KUMAR';
  let sellerAddress = sellerDetails?.address || 'Shakhumbhari road, Opp uttam palace, Behat, Saharanpur, Uttar Pradesh, 247121';
  let sellerPhone = sellerDetails?.phone || '+91 9027237697';
  let sellerGstin = sellerDetails?.gstNumber || sellerDetails?.gstin || order.sellerGstNumber || '09BLMPK2840L2ZN';
  let sellerPincode = (
    sellerDetails?.pincode ||
    order.sellerPincode ||
    order.sellerDetails?.pincode ||
    (sellerAddress.match(/\b\d{6}\b/) ? sellerAddress.match(/\b\d{6}\b/)[0] : '') ||
    '247121'
  );

  if (sellerStoreName.toLowerCase().includes('digicoder') || sellerAddress.toLowerCase().includes('digicoder')) {
    sellerStoreName = 'NATIONAL SCHOOL DRESS EVAM PUSTAK BHANDAR';
    sellerContactName = 'PRAVEEN KUMAR';
    sellerAddress = 'Shakhumbhari road, Opp uttam palace, Behat, Saharanpur, Uttar Pradesh, 247121';
    sellerPhone = '+91 9027237697';
    sellerGstin = '09BLMPK2840L2ZN';
    sellerPincode = '247121';
  }

  // Authoritative State Detection via parseStateInfo (Prevents "Delhivery" being misparsed as Delhi)
  const sellerStateInfo = useMemo(() => {
    return parseStateInfo(
      sellerDetails,
      `${sellerStoreName} ${sellerAddress} ${sellerDetails?.city || 'Saharanpur'} ${sellerDetails?.state || 'Uttar Pradesh'} ${sellerGstin} ${sellerPincode}`
    );
  }, [sellerDetails, sellerStoreName, sellerAddress, sellerGstin, sellerPincode]);

  const customerStateInfo = useMemo(() => {
    // Clean out delivery partner names like "Delhivery Air" to prevent false state matches
    const sanitizedAddrStr = `${customerAddress} ${addrObj?.city || order.city || ''} ${addrObj?.state || order.state || ''} ${customerPincode}`
      .replace(/delhivery\s*(air)?/gi, ' ');
    return parseStateInfo(addrObj, sanitizedAddrStr);
  }, [addrObj, customerAddress, order.city, order.state, customerPincode]);

  const customerState = customerStateInfo?.name || 'Uttar Pradesh';

  // Explicit city resolution without false positives from courier names
  const explicitCity = String(
    addrObj?.city ||
    addrObj?.district ||
    addrObj?.cityName ||
    order.city ||
    order.district ||
    order.shippingAddress?.city ||
    ''
  ).trim();

  const customerCity = useMemo(() => {
    if (explicitCity && !/delhivery/i.test(explicitCity)) return explicitCity;
    const cleanAddr = String(customerAddress).replace(/delhivery\s*(air)?/gi, ' ').toLowerCase();
    if (/\blucknow\b/i.test(cleanAddr)) return 'Lucknow';
    if (/\bsaharanpur\b/i.test(cleanAddr)) return 'Saharanpur';
    if (/\bbehat\b/i.test(cleanAddr)) return 'Behat';
    if (/\bkanpur\b/i.test(cleanAddr)) return 'Kanpur';
    if (/\bnoida\b/i.test(cleanAddr)) return 'Noida';
    if (/\bghaziabad\b/i.test(cleanAddr)) return 'Ghaziabad';
    if (/\bagra\b/i.test(cleanAddr)) return 'Agra';
    if (/\bdelhi\b/i.test(cleanAddr)) return 'Delhi';
    return customerState === 'Uttar Pradesh' ? 'Saharanpur' : 'City';
  }, [explicitCity, customerAddress, customerState]);

  // GST Intra-State vs Inter-State Determination
  // When both seller and buyer are in same state (e.g. Uttar Pradesh, state code 09), isIntraState = true
  const isIntraState = useMemo(() => {
    const sKey = sellerStateInfo?.key || 'uttar_pradesh';
    const cKey = customerStateInfo?.key || 'uttar_pradesh';
    return sKey === cKey;
  }, [sellerStateInfo, customerStateInfo]);

  const isInterState = !isIntraState;

  // Routing hub derivation
  const destHubCode = useMemo(() => {
    const pin = String(customerPincode || '247121').slice(0, 3);
    const stateCode = (customerStateInfo?.key === 'uttar_pradesh' || String(customerState).toLowerCase().includes('uttar'))
      ? 'UP'
      : (customerStateInfo?.key?.toUpperCase().slice(0, 3) || 'IND');
    return `${stateCode}_${pin}_HUB`;
  }, [customerPincode, customerState, customerStateInfo]);

  const destCityCode = useMemo(() => {
    const city = String(customerCity || 'HUB').toUpperCase().trim();
    if (city.includes('LUCKNOW')) return 'LKO';
    if (city.includes('SAHARANPUR')) return 'SAH';
    if (city.includes('BEHAT')) return 'BHT';
    if (city.includes('KANPUR')) return 'KNP';
    if (city.includes('NOIDA')) return 'NOI';
    if (city.includes('GHAZIABAD')) return 'GZB';
    if (city.includes('AGRA')) return 'AGR';
    if (city.includes('DELHI')) return 'DEL';
    return city.slice(0, 3);
  }, [customerCity]);

  // Financial aggregates
  const orderTotal = Number(order.total || order.totalAmount || 0);
  const orderSubtotal = Number(order.subtotal || order.sellerSubtotal || orderTotal);
  const deliveryCharge = Number(order.shippingFee || order.shippingCost || order.deliveryCharge || 0);
  let rawCodFee = Number(order.codFee ?? order.appliedCodFee ?? order.codCharges ?? order.settlement?.codChargeAmount ?? 0);
  if ((isNaN(rawCodFee) || rawCodFee <= 0) && isCod && orderTotal > 0) {
    const itemsGrossSum = effectiveItems.reduce((acc, it) => acc + (Number(it.finalPrice ?? it.price ?? 0) * Number(it.quantity || 1)), 0);
    const expectedBase = Math.round((itemsGrossSum + deliveryCharge) * 100) / 100;
    if (orderTotal > expectedBase) {
      rawCodFee = Math.round((orderTotal - expectedBase) * 100) / 100;
    }
  }

  // SVG Barcode
  const barcodeSvgData = useMemo(() => {
    return generateCode128Svg(awbNumber, 44);
  }, [awbNumber]);

  // QR Code URL (Points to live tracking link)
  const qrTrackingUrl = order.trackingUrl || `https://shiprocket.co/tracking/${awbNumber}`;
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&margin=0&data=${encodeURIComponent(qrTrackingUrl)}`;

  const orderDateStr = order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN');
  const invoiceDateStr = new Date().toLocaleDateString('en-IN');
  const officialInvoiceNumber = invoiceNumber || order.invoiceNumber || `NSD-${cleanOrderId.slice(-6)}`;

  const [carrierLabelUrl, setCarrierLabelUrl] = useState(
    order.shippingLabelUrl || order.shipmentDetails?.shippingLabelUrl || ''
  );
  const [isFetchingLabel, setIsFetchingLabel] = useState(false);
  const [activeTab, setActiveTab] = useState('carrier');
  const [copiedAwb, setCopiedAwb] = useState(false);

  useEffect(() => {
    const existing = order.shippingLabelUrl || order.shipmentDetails?.shippingLabelUrl;
    if (existing && existing !== carrierLabelUrl) {
      setCarrierLabelUrl(existing);
    }
  }, [order.shippingLabelUrl, order.shipmentDetails?.shippingLabelUrl]);

  const fetchLiveLabel = async () => {
    const orderIdentifier = cleanOrderId || order._id || order.id;
    if (!orderIdentifier) return;
    setIsFetchingLabel(true);
    try {
      const headers = typeof getAuthHeaders === 'function' ? getAuthHeaders() : {};
      const res = await fetch(`${SERVER_URL}/delivery-partners/label/${encodeURIComponent(orderIdentifier)}`, {
        headers
      });
      const data = await res.json();
      if (data?.success && data?.labelUrl) {
        setCarrierLabelUrl(data.labelUrl);
      }
    } catch (e) {
      console.warn("Could not fetch carrier shipping label:", e.message);
    } finally {
      setIsFetchingLabel(false);
    }
  };

  useEffect(() => {
    if (!carrierLabelUrl && cleanOrderId) {
      fetchLiveLabel();
    }
  }, [cleanOrderId]);

  const handleCopyAwb = () => {
    if (awbNumber) {
      navigator.clipboard?.writeText(awbNumber);
      setCopiedAwb(true);
      setTimeout(() => setCopiedAwb(false), 2000);
    }
  };

  const handlePrint4x6 = () => {
    printShippingLabel('printableShippingLabelArea', '4x6');
  };

  const handlePrintA4 = () => {
    printShippingLabel('printableShippingLabelArea', 'A4');
  };

  return (
    <div className="space-y-4">
      {/* Tab Switcher & Action Toolbar */}
      <div className="bg-gray-50 p-3 sm:p-4 rounded-2xl border border-gray-200 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Main Mode Tabs */}
          <div className="flex items-center gap-2 bg-gray-200/70 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('carrier')}
              className={`px-3.5 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'carrier'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-200'
              }`}
            >
              <Truck size={14} />
              <span>Official Courier Slip (PDF)</span>
              {carrierLabelUrl ? (
                <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">PDF Ready</span>
              ) : (
                <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.5 rounded-full font-bold">Shiprocket</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('internal')}
              className={`px-3.5 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'internal'
                  ? 'bg-teal-800 text-white shadow-xs'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-200'
              }`}
            >
              <Package size={14} />
              <span>Store Packing Slip (4x6")</span>
            </button>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {carrierLabelUrl && (
              <>
                <a
                  href={carrierLabelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  title="Open real carrier PDF in new window"
                >
                  <ExternalLink size={13} />
                  <span>Open Official PDF</span>
                </a>

                <a
                  href={carrierLabelUrl}
                  download={`Carrier_Label_${cleanOrderId}.pdf`}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Download carrier PDF label"
                >
                  <Download size={13} />
                  <span>Download PDF</span>
                </a>
              </>
            )}

            <button
              type="button"
              onClick={fetchLiveLabel}
              disabled={isFetchingLabel}
              className="px-2.5 py-1.5 bg-white hover:bg-gray-100 text-gray-700 font-bold text-xs rounded-xl border border-gray-300 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Refresh label status from Shiprocket"
            >
              <RefreshCw size={12} className={isFetchingLabel ? 'animate-spin text-emerald-600' : ''} />
              <span>{isFetchingLabel ? 'Checking...' : 'Refresh'}</span>
            </button>

            {activeTab === 'internal' && (
              <>
                <button
                  type="button"
                  onClick={handlePrint4x6}
                  className="px-3.5 py-1.5 bg-teal-800 hover:bg-teal-900 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  title="Print 4x6 inch thermal sticker label"
                >
                  <Printer size={13} />
                  <span>Print 4x6" Sticker</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintA4}
                  className="px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-800 font-bold text-xs rounded-xl border border-gray-300 flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                  title="Print on standard A4 paper"
                >
                  <Printer size={13} />
                  <span>Print A4</span>
                </button>
              </>
            )}

            {onSwitchToInvoice && (
              <button
                type="button"
                onClick={onSwitchToInvoice}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                View Full Tax Invoice
              </button>
            )}
          </div>
        </div>
      </div>

      {/* VIEW 1: OFFICIAL COURIER LABEL (PDF) */}
      {activeTab === 'carrier' && (
        <div className="space-y-4">
          {carrierLabelUrl ? (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              {/* Official Carrier Banner */}
              <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 text-white p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white/15 rounded-xl backdrop-blur-xs">
                    <Truck size={22} className="text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm uppercase tracking-wide">Official Carrier Shipping Slip</span>
                      <span className="bg-white text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">Delhivery / Amazon Shipping</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-emerald-100 font-medium mt-1 flex-wrap">
                      <span>Courier: <strong className="text-white font-extrabold">{courierName}</strong></span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-mono">
                        AWB: <strong className="text-white font-extrabold">{awbNumber}</strong>
                        <button
                          type="button"
                          onClick={handleCopyAwb}
                          className="p-1 hover:bg-white/20 rounded cursor-pointer transition-colors"
                          title="Copy AWB number"
                        >
                          {copiedAwb ? <Check size={12} className="text-emerald-300" /> : <Copy size={12} />}
                        </button>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={carrierLabelUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-white hover:bg-emerald-50 text-emerald-900 font-black text-xs rounded-xl flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                  >
                    <ExternalLink size={14} />
                    <span>Open / Print PDF</span>
                  </a>
                  <a
                    href={carrierLabelUrl}
                    download={`Shipping_Label_${cleanOrderId}.pdf`}
                    className="px-3.5 py-2 bg-emerald-900/60 hover:bg-emerald-900 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Download size={14} />
                    <span>Download</span>
                  </a>
                </div>
              </div>

              {/* Embedded PDF Viewer */}
              <div className="p-4 bg-gray-100 flex flex-col items-center">
                <div className="w-full max-w-4xl bg-white rounded-xl shadow-md border border-gray-300 overflow-hidden">
                  <iframe
                    src={carrierLabelUrl}
                    title="Official Courier Label PDF"
                    className="w-full h-[680px] border-0"
                  />
                </div>
                <div className="mt-3 text-center text-xs text-gray-500">
                  💡 If the PDF does not display inside the preview frame above,{' '}
                  <a
                    href={carrierLabelUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-700 font-extrabold underline hover:text-emerald-800"
                  >
                    click here to open & print the official PDF in a new tab
                  </a>.
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border-2 border-dashed border-amber-300 p-8 text-center space-y-4">
              <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <Truck size={32} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-gray-900">Official Carrier Shipping Slip</h3>
                <p className="text-xs text-gray-600 max-w-md mx-auto">
                  {order.courierName
                    ? `AWB ${awbNumber} has been generated with ${order.courierName}. Click below to fetch the official PDF label directly from Shiprocket.`
                    : `Carrier shipment has been created. Click below to fetch the official Delhivery / Amazon Shipping PDF label.`}
                </p>
              </div>

              <div className="flex justify-center items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={fetchLiveLabel}
                  disabled={isFetchingLabel}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl flex items-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  <RefreshCw size={14} className={isFetchingLabel ? 'animate-spin' : ''} />
                  <span>{isFetchingLabel ? 'Fetching Real Label...' : '⚡ Fetch Real Courier Label from Shiprocket'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('internal')}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  View Store Packing Slip (4x6")
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: STORE PACKING SLIP & 4x6" STICKER */}
      {activeTab === 'internal' && (
        <div className="space-y-4">
          {carrierLabelUrl && (
            <div className="flex items-center justify-between gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>
                  Real official courier label (<strong>{courierName}</strong> - AWB <strong>{awbNumber}</strong>) is ready!
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('carrier')}
                className="px-3 py-1 bg-emerald-600 text-white font-extrabold text-[11px] rounded-lg hover:bg-emerald-700 cursor-pointer"
              >
                View Official Carrier Slip (PDF) →
              </button>
            </div>
          )}

      {/* Printable Label Container (Exact 4x6 Proportion matching the client reference photo) */}
      <div className="flex justify-center bg-gray-200/50 p-3 sm:p-6 rounded-2xl overflow-x-auto">
        <div
          id="printableShippingLabelArea"
          className="bg-white text-black border-2 border-black font-sans w-full max-w-[520px] text-[11px] leading-tight select-none shadow-md"
          style={{ minWidth: '460px' }}
        >
          {/* ═════════ TOP HALF: SHIPPING & ROUTING HEADER ═════════ */}
          <div className="grid grid-cols-12 border-b-2 border-black">
            {/* Left Top: Customer Address & Return Address */}
            <div className="col-span-7 p-2.5 border-r-2 border-black flex flex-col justify-between space-y-2">
              <div>
                <span className="font-bold text-[10px] uppercase text-gray-600 block mb-0.5">
                  Customer Address:
                </span>
                <div className="font-black text-xs text-black uppercase tracking-tight">
                  {customerName}
                </div>
                <div className="text-[10px] text-gray-900 mt-0.5 leading-snug">
                  {customerAddress}
                </div>
                <div className="font-bold text-[11px] text-black mt-1">
                  {customerCity}, {customerState}, {customerPincode}
                </div>
                {customerPhone && (
                  <div className="text-[10px] text-gray-700 font-mono mt-0.5">
                    Tel: {customerPhone}
                  </div>
                )}
              </div>

              {/* Return Address */}
              <div className="pt-2 border-t border-dashed border-gray-400 mt-2">
                <span className="font-bold text-[9px] uppercase text-gray-600 block">
                  If undelivered, return to:
                </span>
                <div className="font-bold text-[10px] text-black uppercase mt-0.5">
                  {sellerStoreName}
                </div>
                <div className="text-[9px] text-gray-800 mt-0.5 leading-tight">
                  {sellerAddress}
                </div>
                <div className="text-[9px] text-gray-700 font-mono mt-0.5">
                  Phone: {sellerPhone} | GSTIN: {sellerGstin}
                </div>
              </div>
            </div>

            {/* Right Top: Payment Mode, Courier Routing & Barcode */}
            <div className="col-span-5 p-2 flex flex-col justify-between text-right">
              {/* Payment Mode Banner */}
              <div className="bg-black text-white px-2 py-1 text-center font-black text-[11px] uppercase tracking-wider rounded-xs">
                {isCod ? `COD: ₹${orderTotal.toFixed(2)}` : 'PREPAID: ₹0.00 TO COLLECT'}
              </div>

              {/* Courier Name & Routing Codes */}
              <div className="mt-1 text-left space-y-0.5">
                <div className="flex items-center justify-between border-b border-gray-300 pb-0.5">
                  <span className="font-black text-sm text-black tracking-tight uppercase">
                    {order.courierName && order.courierName !== 'Shiprocket'
                      ? order.courierName
                      : (order.shipmentDetails?.courierPartnerName && order.shipmentDetails?.courierPartnerName !== 'Shiprocket'
                        ? order.shipmentDetails.courierPartnerName
                        : 'Amazon Shipping / Delhivery')}
                  </span>
                  <span className="font-mono text-[9px] bg-black text-white px-1.5 py-0.5 rounded font-black">
                    SUR • 0.500 KG
                  </span>
                </div>
                <div className="flex items-center justify-between text-[9px] text-gray-700 font-mono">
                  <span>Routing Code:</span>
                  <strong className="text-black font-bold">{customerPincode}</strong>
                </div>
                <div className="flex items-center justify-between text-[9px] text-gray-700 font-mono">
                  <span>Return Pin:</span>
                  <strong className="text-black font-bold">{sellerPincode || '247121'}</strong>
                </div>
              </div>

              {/* 2D QR Code & Inverted Routing Box */}
              <div className="flex items-center justify-between gap-1 my-1">
                <div className="border border-black p-0.5 bg-white shrink-0">
                  <img
                    src={qrApiUrl}
                    alt="Tracking QR"
                    className="w-14 h-14 object-contain"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
                <div className="text-right text-[10px] leading-tight">
                  <div className="font-black text-xs text-black">{destCityCode}_{String(customerPincode || '247').slice(0, 3)}</div>
                  <div className="font-bold text-[10px] text-gray-800">_{String(customerCity || 'Hub').toUpperCase()}</div>
                  <div className="text-[8px] text-gray-500 font-mono mt-0.5">
                    Hub: {destHubCode}
                  </div>
                </div>
              </div>

              {/* 1D Barcode with AWB text */}
              <div className="w-full text-center mt-1 pt-1 border-t border-gray-300">
                <div
                  className="w-full flex items-center justify-center overflow-hidden"
                  dangerouslySetInnerHTML={{ __html: barcodeSvgData.svgHtml }}
                />
              </div>
            </div>
          </div>

          {/* ═════════ MIDDLE: PRODUCT DETAILS / SKU SUMMARY ═════════ */}
          <div className="p-2 border-b-2 border-black bg-gray-50/50">
            <div className="font-black text-[10px] uppercase tracking-wider text-black mb-1 flex items-center justify-between">
              <span>Product Details</span>
              <span className="font-mono text-[9px] text-gray-600">Order No: #{cleanOrderId}</span>
            </div>

            <table className="w-full text-left text-[10px] border border-black">
              <thead>
                <tr className="bg-gray-100 border-b border-black font-black uppercase text-[9px]">
                  <th className="p-1 border-r border-black">SKU</th>
                  <th className="p-1 border-r border-black">Size</th>
                  <th className="p-1 border-r border-black text-center">Qty</th>
                  <th className="p-1 border-r border-black">Color / Var</th>
                  <th className="p-1 text-right">Order Ref</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-300 font-medium">
                {effectiveItems.map((item, idx) => {
                  const sku = item.sku || item.productId?.sku || `SKU_${idx + 1}`;
                  const size = item.selectedSize || item.size || item.selectedVariant || 'Standard';
                  const qty = Number(item.quantity || 1);
                  const color = item.selectedColor || item.color || item.name?.split(' ')[0] || 'Default';
                  return (
                    <tr key={idx}>
                      <td className="p-1 border-r border-black font-mono font-bold">{sku}</td>
                      <td className="p-1 border-r border-black">{size}</td>
                      <td className="p-1 border-r border-black text-center font-bold">{qty}</td>
                      <td className="p-1 border-r border-black">{color}</td>
                      <td className="p-1 text-right font-mono text-[9px]">#{cleanOrderId}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ═════════ BOTTOM HALF: TAX INVOICE & PACKING SLIP ═════════ */}
          <div className="p-2">
            {/* Header: TAX INVOICE / PACKING SLIP */}
            <div className="flex items-center justify-between border-b border-black pb-1 mb-1.5">
              <span className="font-black text-xs uppercase tracking-wider text-black">
                TAX INVOICE / PACKING SLIP
              </span>
              <span className="text-[9px] font-bold uppercase text-gray-700">
                Original For Recipient
              </span>
            </div>

            {/* Bill To & Sold By Two-Column Block */}
            <div className="grid grid-cols-2 gap-2 text-[9px] border-b border-black pb-1.5 mb-1.5 leading-snug">
              <div>
                <span className="font-bold text-[9px] text-gray-600 uppercase block">BILL TO / SHIP TO:</span>
                <div className="font-bold text-black uppercase">{customerName}</div>
                <div className="text-gray-800">{customerAddress}</div>
                <div className="font-semibold text-black">{customerCity}, {customerState} - {customerPincode}</div>
                <div className="text-gray-700 font-mono mt-0.5">Place of Supply: {customerState}</div>
              </div>

              <div>
                <span className="font-bold text-[9px] text-gray-600 uppercase block">Sold by:</span>
                <div className="font-bold text-black uppercase">{sellerContactName}</div>
                <div className="font-semibold text-gray-900">{sellerStoreName}</div>
                <div className="text-gray-800">{sellerAddress}</div>
                <div className="font-bold text-black mt-0.5">GSTIN: {sellerGstin}</div>
                <div className="text-gray-700 font-mono mt-0.5">
                  Invoice No: <strong>{officialInvoiceNumber}</strong> • Date: {invoiceDateStr}
                </div>
              </div>
            </div>

            {/* Itemized Table */}
            <table className="w-full text-left text-[9px] border border-black mb-1.5">
              <thead>
                <tr className="bg-gray-100 border-b border-black font-black uppercase text-[8px]">
                  <th className="p-1 border-r border-black">Description</th>
                  <th className="p-1 border-r border-black text-center">HSN</th>
                  <th className="p-1 border-r border-black text-center">Qty</th>
                  <th className="p-1 border-r border-black text-right">Gross Amt</th>
                  <th className="p-1 border-r border-black text-right">Taxable</th>
                  <th className="p-1 border-r border-black text-right">Taxes</th>
                  <th className="p-1 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-300">
                {effectiveItems.map((item, idx) => {
                  const qty = Number(item.quantity || 1);
                  const price = Number(item.finalPrice ?? item.price ?? 0);
                  const lineTotal = price * qty;
                  const candHsn = item?.hsnCode || item?.hsn || item?.productId?.hsnCode || item?.productId?.hsn;
                  const cat = String(item.category || item?.productId?.category || item.name || '').toLowerCase();
                  const isBook = cat.includes('book') || cat.includes('textbook');
                  const hsn = candHsn || (isBook ? '4901' : (cat.includes('shoe') || cat.includes('footwear') ? '6403' : (cat.includes('stationery') || cat.includes('bag') ? '4202' : '6203')));
                  const explicitGst = item?.productId?.gst ?? item?.productId?.gstPercentage ?? item?.productId?.gstPercent ?? item?.productId?.gstRate ?? item?.productId?.taxRate ?? item?.gstPercent ?? item?.gstPercentage ?? item?.gstRate ?? item?.gst ?? item?.taxRate;
                  const taxRate = (explicitGst !== undefined && explicitGst !== null && !isNaN(Number(explicitGst))) ? Number(explicitGst) : (isBook ? 0 : 5);
                  const taxable = taxRate > 0 ? lineTotal / (1 + taxRate / 100) : lineTotal;
                  const taxAmount = lineTotal - taxable;
                  const itemCgst = isIntraState ? Math.round((taxAmount / 2) * 100) / 100 : 0;
                  const itemSgst = isIntraState ? Math.round((taxAmount - itemCgst) * 100) / 100 : 0;

                  return (
                    <tr key={idx}>
                      <td className="p-1 border-r border-black font-medium">
                        {item.name || item.title || 'Product Item'}
                        {item.size ? ` - ${item.size}` : ''}
                      </td>
                      <td className="p-1 border-r border-black text-center font-mono">{hsn}</td>
                      <td className="p-1 border-r border-black text-center font-bold">{qty}</td>
                      <td className="p-1 border-r border-black text-right font-mono">₹{lineTotal.toFixed(2)}</td>
                      <td className="p-1 border-r border-black text-right font-mono">₹{taxable.toFixed(2)}</td>
                      <td className="p-1 border-r border-black text-right font-mono">
                        {taxRate === 0 ? (
                          <span className="text-gray-500 font-sans">0% GST (Exempt)</span>
                        ) : isIntraState ? (
                          <div className="text-right font-mono text-[8px] leading-tight space-y-0.5">
                            <div>CGST {(taxRate / 2)}% ₹{itemCgst.toFixed(2)}</div>
                            <div>SGST {(taxRate / 2)}% ₹{itemSgst.toFixed(2)}</div>
                          </div>
                        ) : (
                          <div className="text-right font-mono text-[8px] leading-tight">
                            IGST {taxRate}% ₹{taxAmount.toFixed(2)}
                          </div>
                        )}
                      </td>
                      <td className="p-1 text-right font-mono font-bold">₹{lineTotal.toFixed(2)}</td>
                    </tr>
                  );
                })}

                {/* Other Charges (Shipping / Convenience) */}
                {deliveryCharge > 0 && (() => {
                  const derivedShipRate = Math.max(...effectiveItems.map(it => {
                    const g = it?.productId?.gst ?? it?.productId?.gstPercentage ?? it?.productId?.gstPercent ?? it?.gstPercent ?? it?.gst;
                    return (!isNaN(Number(g))) ? Number(g) : 5;
                  }), 5);
                  const shipTaxable = derivedShipRate > 0 ? deliveryCharge / (1 + derivedShipRate / 100) : deliveryCharge;
                  const shipTax = deliveryCharge - shipTaxable;
                  const shipCgst = isIntraState ? Math.round((shipTax / 2) * 100) / 100 : 0;
                  const shipSgst = isIntraState ? Math.round((shipTax - shipCgst) * 100) / 100 : 0;
                  return (
                    <tr className="bg-gray-50/50">
                      <td className="p-1 border-r border-black font-medium">Shipping & Logistics Fee</td>
                      <td className="p-1 border-r border-black text-center font-mono">9968</td>
                      <td className="p-1 border-r border-black text-center font-bold">NA</td>
                      <td className="p-1 border-r border-black text-right font-mono">₹{deliveryCharge.toFixed(2)}</td>
                      <td className="p-1 border-r border-black text-right font-mono">₹{shipTaxable.toFixed(2)}</td>
                      <td className="p-1 border-r border-black text-right font-mono">
                        {derivedShipRate === 0 ? (
                          <span className="text-gray-500 font-sans">0% GST</span>
                        ) : isIntraState ? (
                          <div className="text-right font-mono text-[8px] leading-tight space-y-0.5">
                            <div>CGST {(derivedShipRate / 2)}% ₹{shipCgst.toFixed(2)}</div>
                            <div>SGST {(derivedShipRate / 2)}% ₹{shipSgst.toFixed(2)}</div>
                          </div>
                        ) : (
                          <div className="text-right font-mono text-[8px] leading-tight">
                            IGST {derivedShipRate}% ₹{shipTax.toFixed(2)}
                          </div>
                        )}
                      </td>
                      <td className="p-1 text-right font-mono font-bold">₹{deliveryCharge.toFixed(2)}</td>
                    </tr>
                  );
                })()}

                {/* Dedicated Cash on Delivery (COD) Fee Row if applied */}
                {rawCodFee > 0 && (
                  <tr className="bg-gray-50/50">
                    <td className="p-1 border-r border-black font-medium">COD Collection & Handling Fee</td>
                    <td className="p-1 border-r border-black text-center font-mono">9985</td>
                    <td className="p-1 border-r border-black text-center font-bold">NA</td>
                    <td className="p-1 border-r border-black text-right font-mono">₹{rawCodFee.toFixed(2)}</td>
                    <td className="p-1 border-r border-black text-right font-mono">₹{rawCodFee.toFixed(2)}</td>
                    <td className="p-1 border-r border-black text-right font-mono">₹0.00 (0%)</td>
                    <td className="p-1 text-right font-mono font-bold">₹{rawCodFee.toFixed(2)}</td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-black bg-gray-100 font-black text-[9px]">
                  <td colSpan={6} className="p-1 text-right border-r border-black uppercase">
                    Total Invoice Amount:
                  </td>
                  <td className="p-1 text-right font-mono text-[10px]">
                    ₹{orderTotal.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>

            {/* Statutory Declaration Note */}
            <div className="text-[8px] text-gray-700 leading-tight italic pt-1 border-t border-gray-400">
              Tax is not payable on reverse charge basis. This is a computer generated invoice and packing slip and does not require physical signature. Other charges include logistics & handling fee where applicable. Delivery partner: please scan barcode upon parcel pickup.
            </div>
          </div>
        </div>
      </div>
        </div>
      )}
    </div>
  );
}

function ScanBarcodeIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7V5a2 2 0 0 1 2-2h2" />
      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
      <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
      <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
      <path d="M7 8v8" />
      <path d="M11 8v8" />
      <path d="M15 8v8" />
      <path d="M19 8v8" />
    </svg>
  );
}

