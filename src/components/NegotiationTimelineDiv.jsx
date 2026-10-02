import React, { useState, useMemo } from 'react';
import {
  Clock,
  Sparkles,
  CheckCircle2,
  Building2,
  User,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Package,
  Calendar,
  DollarSign,
  AlertCircle,
  ChevronUp,
  SlidersHorizontal,
  Scale
} from 'lucide-react';

/**
 * Safely extracts non-zero numeric unit price from any item object.
 */
export const getItemUnitPrice = (ip, defaultUnitPrice = 0) => {
  if (!ip) return Number(defaultUnitPrice) || 0;

  const candidates = [
    ip.sellerPrice,
    ip.pricePerUnit,
    ip.sellerPricePerUnit,
    ip.targetUnitPrice,
    ip.unitPrice,
    ip.budgetPerUnit,
    ip.rate,
    ip.price,
    ip.unitRate,
    ip.offeredRate,
    ip.customerBudget
  ];

  for (const c of candidates) {
    const val = Number(c);
    if (!isNaN(val) && val > 0) return val;
  }

  const qty = Number(ip.quantity) || 1;
  const tot = Number(ip.totalPrice ?? ip.targetTotalPrice ?? 0);
  if (!isNaN(tot) && tot > 0 && qty > 0) {
    return Math.round(tot / qty);
  }

  return Number(defaultUnitPrice) || 0;
};

/**
 * Extracts and normalizes all available negotiation versions/rounds for a quotation.
 */
export const extractAllQuotationVersions = (quote, order) => {
  if (!quote) return [];

  const versions = [];
  const history = Array.isArray(quote.negotiationHistory) ? [...quote.negotiationHistory] : [];

  if (history.length > 0) {
    history.forEach((h, idx) => {
      const roundNum = Number(h.round) || (idx + 1);
      const verNum = Number(h.version) || roundNum;
      const isBuyer = h.senderRole === 'buyer';

      const items = Array.isArray(h.itemPrices) && h.itemPrices.length > 0
        ? h.itemPrices.map(ip => {
            const qty = Number(ip.quantity) || 1;
            const price = getItemUnitPrice(ip, h.unitPrice || quote.unitPrice);
            const tot = Number(ip.totalPrice ?? ip.targetTotalPrice ?? 0) || (qty * price);
            return {
              itemId: String(ip.itemId || ip._id || ''),
              itemName: ip.itemName || 'Demanded Product',
              quantity: qty,
              sellerPrice: price,
              totalPrice: tot,
              discountTierNote: ip.discountTierNote || ip.notes || ''
            };
          })
        : (Array.isArray(quote.itemPrices) && quote.itemPrices.length > 0 ? quote.itemPrices.map(ip => {
            const qty = Number(ip.quantity) || 1;
            const price = getItemUnitPrice(ip, h.unitPrice || quote.unitPrice);
            const tot = Number(ip.totalPrice ?? 0) || (qty * price);
            return {
              itemId: String(ip.itemId || ip._id || ''),
              itemName: ip.itemName || 'Demanded Product',
              quantity: qty,
              sellerPrice: price,
              totalPrice: tot,
              discountTierNote: ip.discountTierNote || ''
            };
          }) : (Array.isArray(order?.requirements) ? order.requirements.map(r => {
            const qty = Number(r.quantity) || 1;
            const price = getItemUnitPrice(r, h.unitPrice || quote.unitPrice);
            const tot = qty * price;
            return {
              itemId: String(r._id || r.itemId || ''),
              itemName: r.itemName || 'Demanded Product',
              quantity: qty,
              sellerPrice: price,
              totalPrice: tot,
              discountTierNote: ''
            };
          }) : []));

      const totalQty = items.reduce((sum, item) => sum + item.quantity, 0) || Number(order?.totalQuantity) || 1;
      const amt = Number(h.quoteAmount ?? 0);
      const unitP = Number(h.unitPrice ?? 0) || (totalQty > 0 ? Math.round(amt / totalQty) : 0);

      versions.push({
        id: `round-${roundNum}-v${verNum}`,
        round: roundNum,
        version: verNum,
        label: `Round ${roundNum} (v${verNum}) • ${isBuyer ? 'Buyer Counter-Demand' : (roundNum === 1 ? 'Initial Vendor Pitch' : 'Revised Vendor Pitch')}`,
        shortLabel: `Round ${roundNum} (v${verNum})`,
        senderRole: isBuyer ? 'buyer' : 'seller',
        senderName: h.senderName || (isBuyer ? (order?.institutionName || 'School / Buyer') : (quote.sellerStoreName || quote.sellerName || 'Vendor')),
        quoteAmount: amt,
        unitPrice: unitP,
        estimatedDeliveryDays: Number(h.estimatedDeliveryDays ?? quote.estimatedDeliveryDays ?? 7),
        prepaymentPercentage: Number(h.prepaymentPercentage ?? 0),
        prepaymentAmount: Number(h.prepaymentAmount ?? 0) || Math.round((amt * Number(h.prepaymentPercentage ?? 0)) / 100),
        prepaymentRaised: !!h.prepaymentRaised,
        deliveryDaysRaised: !!h.deliveryDaysRaised,
        totalQuantity: totalQty,
        itemPrices: items,
        notes: h.notes || '',
        createdAt: h.createdAt || quote.submittedAt || Date.now()
      });
    });
  } else {
    // Initial round 1 from base quote fields
    const baseItems = Array.isArray(quote.itemPrices) && quote.itemPrices.length > 0
      ? quote.itemPrices.map(ip => {
          const qty = Number(ip.quantity) || 1;
          const price = getItemUnitPrice(ip, quote.unitPrice);
          const tot = Number(ip.totalPrice ?? 0) || (qty * price);
          return {
            itemId: String(ip.itemId || ip._id || ''),
            itemName: ip.itemName || 'Demanded Product',
            quantity: qty,
            sellerPrice: price,
            totalPrice: tot,
            discountTierNote: ip.discountTierNote || ''
          };
        })
      : (Array.isArray(order?.requirements) ? order.requirements.map(r => {
          const qty = Number(r.quantity) || 1;
          const price = getItemUnitPrice(r, quote.unitPrice);
          const tot = qty * price;
          return {
            itemId: String(r._id || r.itemId || ''),
            itemName: r.itemName || 'Demanded Product',
            quantity: qty,
            sellerPrice: price,
            totalPrice: tot,
            discountTierNote: ''
          };
        }) : []);
    const baseTotalQty = baseItems.reduce((sum, item) => sum + item.quantity, 0) || Number(order?.totalQuantity) || 1;
    const baseAmt = Number(quote.quoteAmount ?? 0);
    const baseUnitP = Number(quote.unitPrice ?? 0) || (baseTotalQty > 0 ? Math.round(baseAmt / baseTotalQty) : 0);

    versions.push({
      id: 'round-1-v1',
      round: 1,
      version: 1,
      label: 'Round 1 (v1) • Initial Vendor Pitch',
      shortLabel: 'Round 1 (v1)',
      senderRole: 'seller',
      senderName: quote.sellerStoreName || quote.sellerName || 'Vendor',
      quoteAmount: baseAmt,
      unitPrice: baseUnitP,
      estimatedDeliveryDays: Number(quote.estimatedDeliveryDays ?? 7),
      prepaymentPercentage: Number(quote.prepaymentPercentage ?? quote.sellerAdvancePercentage ?? 0),
      prepaymentAmount: Number(quote.prepaymentAmount ?? quote.sellerAdvanceAmount ?? 0) || Math.round((baseAmt * Number(quote.prepaymentPercentage ?? quote.sellerAdvancePercentage ?? 0)) / 100),
      prepaymentRaised: false,
      deliveryDaysRaised: false,
      totalQuantity: baseTotalQty,
      itemPrices: baseItems,
      notes: quote.notes || '',
      createdAt: quote.submittedAt || quote.createdAt || Date.now()
    });
  }

  // Synthesize buyer counter round if missing from history but present in latestBuyerCounter
  const hasBuyerRound = versions.some(v => v.senderRole === 'buyer' && v.version >= 2);
  if (!hasBuyerRound && quote.latestBuyerCounter && (Number(quote.latestBuyerCounter.targetBudget) > 0 || quote.latestBuyerCounter.notes)) {
    const counter = quote.latestBuyerCounter;
    const counterQtyTemp = Number(counter.totalQuantity || order?.totalQuantity) || 1;
    const counterAmt = Number(counter.targetBudget || 0);
    const counterUnitP = Number(counter.unitPrice) || (counterQtyTemp > 0 ? Math.round(counterAmt / counterQtyTemp) : 0);

    const counterItems = Array.isArray(counter.itemDemands) && counter.itemDemands.length > 0
      ? counter.itemDemands.map(idm => {
          const qty = Number(idm.quantity) || 1;
          const price = getItemUnitPrice(idm, counterUnitP || quote.unitPrice);
          const tot = Number(idm.targetTotalPrice || 0) || (qty * price);
          return {
            itemId: String(idm.itemId || ''),
            itemName: idm.itemName || 'Demanded Product',
            quantity: qty,
            sellerPrice: price,
            totalPrice: tot,
            discountTierNote: idm.notes || ''
          };
        })
      : (Array.isArray(order?.requirements) ? order.requirements.map(r => {
          const qty = Number(r.quantity) || 1;
          const price = getItemUnitPrice(r, counterUnitP || quote.unitPrice);
          const tot = qty * price;
          return {
            itemId: String(r._id || r.itemId || ''),
            itemName: r.itemName || 'Demanded Product',
            quantity: qty,
            sellerPrice: price,
            totalPrice: tot,
            discountTierNote: ''
          };
        }) : []);

    const counterQty = counterItems.reduce((sum, item) => sum + item.quantity, 0) || counterQtyTemp;
    const nextVer = (quote.currentVersion && quote.currentVersion > 1) ? quote.currentVersion : (versions.length + 1);

    versions.push({
      id: `round-${versions.length + 1}-v${nextVer}`,
      round: versions.length + 1,
      version: nextVer,
      label: `Round ${versions.length + 1} (v${nextVer}) • Buyer Counter-Demand`,
      shortLabel: `Round ${versions.length + 1} (v${nextVer})`,
      senderRole: 'buyer',
      senderName: order?.institutionName || 'School / Buyer',
      quoteAmount: counterAmt,
      unitPrice: counterUnitP,
      estimatedDeliveryDays: Number(counter.requestedDeliveryDays || 7),
      prepaymentPercentage: Number(counter.proposedAdvancePercentage || 0),
      prepaymentAmount: Number(counter.proposedAdvanceAmount || 0) || Math.round((counterAmt * Number(counter.proposedAdvancePercentage || 0)) / 100),
      prepaymentRaised: false,
      deliveryDaysRaised: false,
      totalQuantity: counterQty,
      itemPrices: counterItems,
      notes: counter.notes || '',
      createdAt: counter.counteredAt || Date.now()
    });
  }

  return versions;
};

/**
 * Interactive Negotiation Timeline & Extended Version Detail Div
 * Visible to User (Buyer), Admin, and Seller.
 * Clicking version pills extends and switches between version details.
 */
export default function NegotiationTimelineDiv({
  quotation,
  order,
  userRole = 'admin', // 'seller' | 'admin' | 'consumer'
  initialSelectedVersion = null,
  onClose = null,
  onAcceptCounterDemand = null,
  onOpenPitchRevise = null,
  onOpenCounterDemand = null,
  onApproveQuote = null,
  onOpenComparisonModal = null
}) {
  if (!quotation) return null;

  // Extract all historical and synthesized rounds
  const allVersions = useMemo(() => {
    return extractAllQuotationVersions(quotation, order);
  }, [quotation, order]);

  // Active selected version in the timeline stepper
  const [selectedVerNum, setSelectedVerNum] = useState(() => {
    if (initialSelectedVersion) return Number(initialSelectedVersion);
    if (allVersions.length > 0) {
      return allVersions[allVersions.length - 1].version;
    }
    return quotation.currentVersion || 1;
  });

  // Find active version record
  const activeVersion = useMemo(() => {
    return allVersions.find(v => v.version === selectedVerNum) || allVersions[allVersions.length - 1] || null;
  }, [allVersions, selectedVerNum]);

  // Compute price delta vs immediately preceding version
  const priceDelta = useMemo(() => {
    if (!activeVersion) return null;
    const currentIdx = allVersions.findIndex(v => v.version === activeVersion.version);
    if (currentIdx <= 0) return null;
    const prevVersion = allVersions[currentIdx - 1];
    const diff = Number(activeVersion.quoteAmount) - Number(prevVersion.quoteAmount);
    const diffPct = prevVersion.quoteAmount > 0 ? ((diff / prevVersion.quoteAmount) * 100).toFixed(1) : 0;
    return { diff, diffPct, prevVersion };
  }, [allVersions, activeVersion]);

  const isLatestVersion = activeVersion && allVersions.length > 0 && activeVersion.version === allVersions[allVersions.length - 1].version;
  const isBuyerSender = activeVersion?.senderRole === 'buyer';

  return (
    <div className="bg-slate-50 border-2 border-teal-600/40 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm animate-in fade-in duration-200">
      {/* 1. Header with Title & Collapse */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-teal-700 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
            <Clock size={16} />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-gray-900 flex items-center gap-2">
              <span>Negotiation Version Timeline</span>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-300">
                {allVersions.length} {allVersions.length === 1 ? 'Round' : 'Rounds Recorded'}
              </span>
            </h4>
            <p className="text-[11px] text-gray-500">
              Interactive timeline tracking every pitch, counter-demand, and price/quantity revision. Click any version below to inspect.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          {onOpenComparisonModal && allVersions.length >= 2 && (
            <button
              type="button"
              onClick={() => onOpenComparisonModal(quotation)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-teal-300 hover:bg-teal-50 text-teal-900 font-extrabold text-xs rounded-xl shadow-2xs transition-colors cursor-pointer"
            >
              <Scale size={13} className="text-teal-700" />
              <span>Compare Versions</span>
            </button>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              title="Collapse timeline view"
            >
              <ChevronUp size={14} />
              <span>Hide Timeline</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Interactive Version Stepper Nodes */}
      <div className="space-y-1.5">
        <div className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">
          Timeline Stepper (Click to inspect version):
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {allVersions.map((ver, idx) => {
            const isSelected = ver.version === selectedVerNum;
            const isBuyer = ver.senderRole === 'buyer';
            const isLatest = idx === allVersions.length - 1;

            return (
              <React.Fragment key={ver.id || idx}>
                <button
                  type="button"
                  onClick={() => setSelectedVerNum(ver.version)}
                  className={`shrink-0 px-3.5 py-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-0.5 shadow-2xs ${
                    isSelected
                      ? (isBuyer
                          ? 'bg-purple-600 text-white border-purple-700 ring-2 ring-purple-300 ring-offset-1'
                          : 'bg-teal-800 text-white border-teal-900 ring-2 ring-teal-300 ring-offset-1')
                      : (isBuyer
                          ? 'bg-purple-50 hover:bg-purple-100 text-purple-950 border-purple-200'
                          : 'bg-white hover:bg-teal-50 text-gray-800 border-gray-200')
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-[10px] font-black uppercase">
                    <span>v{ver.version}</span>
                    <span>•</span>
                    <span>{isBuyer ? 'Buyer Counter' : (idx === 0 ? 'Initial Pitch' : 'Revised Pitch')}</span>
                    {isLatest && (
                      <span className={`text-[8px] font-black px-1.5 py-0.2 rounded-full uppercase ml-1 ${
                        isSelected ? 'bg-white text-gray-900' : 'bg-amber-200 text-amber-900'
                      }`}>
                        Latest
                      </span>
                    )}
                  </div>
                  <div className={`font-mono font-extrabold text-xs ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                    ₹{Number(ver.quoteAmount).toLocaleString()}
                  </div>
                  <div className={`text-[9px] ${isSelected ? 'text-teal-100' : 'text-gray-500'}`}>
                    {ver.totalQuantity} units • ~₹{ver.unitPrice}/u
                  </div>
                </button>

                {idx < allVersions.length - 1 && (
                  <ArrowRight size={14} className="text-gray-300 shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* 3. Detailed Version Inspection Card */}
      {activeVersion && (
        <div className={`p-4 sm:p-5 rounded-2xl border-2 space-y-4 bg-white ${
          isBuyerSender ? 'border-purple-300 shadow-sm' : 'border-teal-300 shadow-sm'
        }`}>
          {/* Active Version Top Badge & Actor */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-black uppercase px-2.5 py-1 rounded-full ${
                  isBuyerSender ? 'bg-purple-600 text-white' : 'bg-teal-700 text-white'
                }`}>
                  Version {activeVersion.version} (Round {activeVersion.round})
                </span>
                <span className={`text-xs font-extrabold flex items-center gap-1 ${
                  isBuyerSender ? 'text-purple-900' : 'text-teal-900'
                }`}>
                  {isBuyerSender ? <Building2 size={13} /> : <User size={13} />}
                  <span>{isBuyerSender ? `School / Buyer (${activeVersion.senderName})` : `Vendor Pitch (${activeVersion.senderName})`}</span>
                </span>
              </div>
              <div className="text-[11px] text-gray-400 mt-1 flex items-center gap-2">
                <Calendar size={12} />
                <span>Recorded on {new Date(activeVersion.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>

            {/* Price Delta Pill vs Previous Round */}
            {priceDelta && (
              <div className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 ${
                priceDelta.diff < 0
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                  : priceDelta.diff > 0
                  ? 'bg-amber-50 text-amber-900 border-amber-300'
                  : 'bg-gray-50 text-gray-700 border-gray-200'
              }`}>
                {priceDelta.diff < 0 ? (
                  <>
                    <TrendingDown size={14} className="text-emerald-600" />
                    <span>-₹{Math.abs(priceDelta.diff).toLocaleString()} ({Math.abs(priceDelta.diffPct)}% reduction vs v{priceDelta.prevVersion.version})</span>
                  </>
                ) : priceDelta.diff > 0 ? (
                  <>
                    <TrendingUp size={14} className="text-amber-600" />
                    <span>+₹{priceDelta.diff.toLocaleString()} (+{priceDelta.diffPct}% vs v{priceDelta.prevVersion.version})</span>
                  </>
                ) : (
                  <span>Price Unchanged vs v{priceDelta.prevVersion.version}</span>
                )}
              </div>
            )}
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[10px] text-gray-400 uppercase font-bold block">Total Amount / Budget</span>
              <span className="text-base font-extrabold text-gray-900 font-mono">
                ₹{Number(activeVersion.quoteAmount).toLocaleString()}
              </span>
              <span className="text-[10px] text-gray-500 block mt-0.5">
                {isBuyerSender ? 'Demanded Budget' : 'Offered Price'}
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[10px] text-gray-400 uppercase font-bold block">Order Quantity</span>
              <span className="text-base font-extrabold text-gray-900 font-mono">
                {activeVersion.totalQuantity} Units
              </span>
              <span className="text-[10px] text-gray-500 block mt-0.5">
                Total Line Items Sum
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[10px] text-gray-400 uppercase font-bold block">Unit Rate / Item</span>
              <span className="text-base font-extrabold text-teal-800 font-mono">
                ₹{activeVersion.unitPrice} / unit
              </span>
              <span className="text-[10px] text-gray-500 block mt-0.5">
                Average across items
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[10px] text-gray-400 uppercase font-bold block">Delivery & Advance</span>
              <div className="text-xs font-extrabold text-gray-900 mt-0.5">
                {activeVersion.estimatedDeliveryDays} Days Lead
                {activeVersion.deliveryDaysRaised && <span className="text-[10px] text-blue-600 block">⏳ Extended</span>}
              </div>
              <div className="text-[11px] font-bold text-teal-900 mt-0.5">
                {activeVersion.prepaymentPercentage}% Advance (₹{Number(activeVersion.prepaymentAmount).toLocaleString()})
                {activeVersion.prepaymentRaised && <span className="text-[10px] text-amber-600 block">⚠️ Raised</span>}
              </div>
            </div>
          </div>

          {/* Notes Callout */}
          {activeVersion.notes && (
            <div className={`p-3 rounded-xl border text-xs italic ${
              isBuyerSender ? 'bg-purple-50/70 border-purple-200 text-purple-950' : 'bg-teal-50/70 border-teal-200 text-teal-950'
            }`}>
              <strong>{isBuyerSender ? "Buyer's Note:" : "Vendor Pitch Rationale:"}</strong> "{activeVersion.notes}"
            </div>
          )}

          {/* Item Demands & Breakdown Table */}
          {Array.isArray(activeVersion.itemPrices) && activeVersion.itemPrices.length > 0 && (
            <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-2xs">
              <div className="bg-gray-50 px-3 py-1.5 border-b border-gray-200 flex items-center justify-between text-[11px] font-extrabold text-gray-700">
                <span className="flex items-center gap-1.5">
                  <Package size={13} className="text-teal-700" />
                  Line Items & Quantities in Version {activeVersion.version}
                </span>
                <span className="text-[10px] text-gray-400 font-medium">{activeVersion.itemPrices.length} Items</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-50/60 text-[10px] uppercase font-bold text-gray-500 border-b border-gray-200">
                      <th className="py-2 px-3">Product Name</th>
                      <th className="py-2 px-2 text-center">Demanded Qty</th>
                      <th className="py-2 px-3 text-right">
                        {isBuyerSender ? 'Target Rate / Unit' : 'Offered Rate / Unit'}
                      </th>
                      <th className="py-2 px-3 text-right">Subtotal</th>
                      <th className="py-2 px-3">Notes / Specs</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-mono text-[11px]">
                    {activeVersion.itemPrices.map((item, idx) => {
                      const qty = Number(item.quantity || 1);
                      const rate = getItemUnitPrice(item, activeVersion.unitPrice);
                      const total = Number(item.totalPrice) || (qty * rate);

                      return (
                        <tr key={item.itemId || idx} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-sans font-bold text-gray-900">{item.itemName}</td>
                          <td className="py-2 px-2 text-center font-bold text-gray-800">{qty}</td>
                          <td className="py-2 px-3 text-right font-extrabold text-teal-800">
                            {rate > 0 ? `₹${rate.toLocaleString()}` : '—'}
                          </td>
                          <td className="py-2 px-3 text-right font-black text-gray-900">
                            {total > 0 ? `₹${total.toLocaleString()}` : '—'}
                          </td>
                          <td className="py-2 px-3 font-sans text-[10px] text-gray-500 italic">{item.discountTierNote || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. Role-Aware Quick Actions Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100">
            <div className="text-[11px] text-gray-500">
              Viewing <strong>Version {activeVersion.version} of {allVersions.length}</strong>
              {isLatestVersion ? ' (Latest Negotiation Stage)' : ' (Previous Historical Round)'}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Seller Actions */}
              {userRole === 'seller' && (
                <>
                  {quotation.negotiationStage === 'buyer_countered' && onAcceptCounterDemand && (
                    <button
                      type="button"
                      onClick={() => onAcceptCounterDemand(order?.id || order?._id, quotation._id || quotation.id)}
                      className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <CheckCircle2 size={14} />
                      <span>Accept Buyer Counter (₹{Number(quotation.latestBuyerCounter?.targetBudget || activeVersion.quoteAmount).toLocaleString()})</span>
                    </button>
                  )}

                  {onOpenPitchRevise && (
                    <button
                      type="button"
                      onClick={() => onOpenPitchRevise(quotation)}
                      className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Sparkles size={14} />
                      <span>Revise Quotation Pitch</span>
                    </button>
                  )}
                </>
              )}

              {/* Buyer Actions */}
              {userRole === 'consumer' && quotation.status !== 'approved' && (
                <>
                  {onOpenCounterDemand && (
                    <button
                      type="button"
                      onClick={() => onOpenCounterDemand(quotation)}
                      className="px-3.5 py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-extrabold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Clock size={14} />
                      <span>Send Counter-Demand</span>
                    </button>
                  )}

                  {onApproveQuote && (
                    <button
                      type="button"
                      onClick={() => onApproveQuote(order?.id || order?._id, quotation._id || quotation.id)}
                      className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <CheckCircle2 size={14} />
                      <span>Approve Winning Proposal</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
