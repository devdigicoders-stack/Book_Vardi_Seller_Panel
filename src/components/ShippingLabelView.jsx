import React, { useMemo } from 'react';
import { 
  Printer, 
  Download, 
  ExternalLink, 
  QrCode, 
  Barcode as BarcodeIcon, 
  Truck, 
  CheckCircle2, 
  ShieldCheck, 
  Package,
  Layers
} from 'lucide-react';
import { SERVER_URL } from '../utils/api';

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

  // Customer info
  const customerName = order.customer?.name || order.shippingAddress?.name || order.user?.name || 'Customer';
  const customerAddress = order.shippingAddress?.street || order.shippingAddress?.addressLine1 || order.shippingAddress?.address || order.address || 'Delivery Address';
  const customerCity = order.shippingAddress?.city || order.city || 'Delhi';
  const customerState = order.shippingAddress?.state || order.state || 'Delhi';
  const customerPincode = order.shippingAddress?.pincode || order.shippingAddress?.postalCode || order.pincode || '110093';
  const customerPhone = order.shippingAddress?.phone || order.customer?.phone || order.user?.phone || order.phone || '';

  // Seller info
  const sellerStoreName = sellerDetails?.storeName || order.sellerStoreName || order.storeName || 'NATIONAL SCHOOL DRESS EVAM PUSTAK BHANDAR';
  const sellerContactName = sellerDetails?.name || sellerDetails?.sellerName || 'PRAVEEN KUMAR';
  const sellerAddress = sellerDetails?.address || 'Shakhumbhari road, Opp uttam palace, Behat, Saharanpur, Uttar Pradesh, 247121';
  const sellerPhone = sellerDetails?.phone || '+91 9027237697';
  const sellerGstin = sellerDetails?.gstNumber || sellerDetails?.gstin || order.sellerGstNumber || '09BLMPK2840L2ZN';

  // Routing hub derivation
  const destHubCode = useMemo(() => {
    const pin = String(customerPincode).slice(0, 3);
    const stateAbbr = String(customerState).toUpperCase().slice(0, 3);
    return `${stateAbbr}_${pin}_HUB`;
  }, [customerPincode, customerState]);

  // Financial aggregates
  const orderTotal = Number(order.total || order.totalAmount || 0);
  const orderSubtotal = Number(order.subtotal || order.sellerSubtotal || orderTotal);
  const deliveryCharge = Number(order.shippingFee || order.shippingCost || order.deliveryCharge || 0);

  // SVG Barcode
  const barcodeSvgData = useMemo(() => {
    return generateCode128Svg(awbNumber, 44);
  }, [awbNumber]);

  // QR Code URL (Points to live tracking link)
  const qrTrackingUrl = order.trackingUrl || `https://shiprocket.co/tracking/${awbNumber}`;
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&margin=0&data=${encodeURIComponent(qrTrackingUrl)}`;

  // Inter-State determination for Tax Breakdown
  const isInterState = useMemo(() => {
    const s1 = String(customerState).toLowerCase().trim();
    const s2 = String(sellerDetails?.state || 'uttar pradesh').toLowerCase().trim();
    return s1 && s2 && s1 !== s2 && !s1.includes('uttar') && !s1.includes('up');
  }, [customerState, sellerDetails?.state]);

  const orderDateStr = order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN');
  const invoiceDateStr = new Date().toLocaleDateString('en-IN');
  const officialInvoiceNumber = invoiceNumber || order.invoiceNumber || `NSD-${cleanOrderId.slice(-6)}`;

  const handlePrint4x6 = () => {
    printShippingLabel('printableShippingLabelArea', '4x6');
  };

  const handlePrintA4 = () => {
    printShippingLabel('printableShippingLabelArea', 'A4');
  };

  return (
    <div className="space-y-4">
      {/* Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 bg-gray-50 p-3 rounded-2xl border border-gray-200">
        <div className="flex items-center gap-2">
          <span className="p-1.5 bg-amber-100 text-amber-900 rounded-lg">
            <ScanBarcodeIcon size={16} />
          </span>
          <div>
            <span className="font-extrabold text-xs text-gray-900 block leading-tight">
              E-Commerce Shipping Label & Packing Slip
            </span>
            <span className="text-[10px] text-gray-500">
              Standard 4x6" Parcel Sticker • Barcode & QR Ready for Courier Partner Scan
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {order.shipmentDetails?.shippingLabelUrl && (
            <a
              href={order.shipmentDetails.shippingLabelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-300 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-2xs cursor-pointer"
              title="Download official Shiprocket carrier PDF"
            >
              <ExternalLink size={13} />
              <span>Shiprocket Label URL</span>
            </a>
          )}

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
                  <span className="font-black text-sm text-black tracking-tight">{courierName}</span>
                  <span className="font-mono text-[9px] text-gray-500 font-bold">{destHubCode}</span>
                </div>
                <div className="flex items-center justify-between text-[9px] text-gray-700 font-mono">
                  <span>Routing Code:</span>
                  <strong className="text-black font-bold">{customerPincode}</strong>
                </div>
                <div className="flex items-center justify-between text-[9px] text-gray-700 font-mono">
                  <span>Return Pin:</span>
                  <strong className="text-black font-bold">247121</strong>
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
                  <div className="font-black text-xs text-black">N10_DEL</div>
                  <div className="font-bold text-[10px] text-gray-800">_Mand</div>
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
                  const cat = String(item.category || item.name || '').toLowerCase();
                  const isBook = cat.includes('book') || cat.includes('textbook');
                  const hsn = isBook ? '4901' : '6203';
                  const taxRate = isBook ? 0 : 5;
                  const taxable = lineTotal / (1 + taxRate / 100);
                  const taxAmount = lineTotal - taxable;

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
                        {isInterState ? `IGST 5% ₹${taxAmount.toFixed(2)}` : `GST 5% ₹${taxAmount.toFixed(2)}`}
                      </td>
                      <td className="p-1 text-right font-mono font-bold">₹{lineTotal.toFixed(2)}</td>
                    </tr>
                  );
                })}

                {/* Other Charges (Shipping / Convenience) */}
                {deliveryCharge > 0 && (
                  <tr className="bg-gray-50/50">
                    <td className="p-1 border-r border-black font-medium">Shipping & Logistics Fee</td>
                    <td className="p-1 border-r border-black text-center font-mono">9968</td>
                    <td className="p-1 border-r border-black text-center font-bold">NA</td>
                    <td className="p-1 border-r border-black text-right font-mono">₹{deliveryCharge.toFixed(2)}</td>
                    <td className="p-1 border-r border-black text-right font-mono">₹{(deliveryCharge / 1.05).toFixed(2)}</td>
                    <td className="p-1 border-r border-black text-right font-mono">₹{(deliveryCharge - (deliveryCharge / 1.05)).toFixed(2)}</td>
                    <td className="p-1 text-right font-mono font-bold">₹{deliveryCharge.toFixed(2)}</td>
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
