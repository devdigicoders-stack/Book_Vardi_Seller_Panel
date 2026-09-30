import React, { useState, useMemo } from 'react';
import {
  X,
  SlidersHorizontal,
  ArrowLeftRight,
  TrendingDown,
  TrendingUp,
  Clock,
  DollarSign,
  Package,
  Sparkles,
  Building2,
  CheckCircle2,
  FileText,
  Calendar,
  Scale
} from 'lucide-react';

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
        ? h.itemPrices.map(ip => ({
            itemId: String(ip.itemId || ip._id || ''),
            itemName: ip.itemName || 'Demanded Product',
            quantity: Number(ip.quantity) || 1,
            sellerPrice: Number(ip.sellerPrice ?? ip.pricePerUnit ?? ip.targetUnitPrice ?? 0),
            totalPrice: Number(ip.totalPrice ?? ip.targetTotalPrice ?? 0) || ((Number(ip.quantity) || 1) * Number(ip.sellerPrice ?? ip.pricePerUnit ?? ip.targetUnitPrice ?? 0)),
            discountTierNote: ip.discountTierNote || ip.notes || ''
          }))
        : (Array.isArray(quote.itemPrices) ? quote.itemPrices.map(ip => ({
            itemId: String(ip.itemId || ip._id || ''),
            itemName: ip.itemName || 'Demanded Product',
            quantity: Number(ip.quantity) || 1,
            sellerPrice: Number(ip.pricePerUnit ?? ip.sellerPrice ?? 0),
            totalPrice: Number(ip.totalPrice ?? 0) || ((Number(ip.quantity) || 1) * Number(ip.pricePerUnit ?? 0)),
            discountTierNote: ip.discountTierNote || ''
          })) : []);

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
      ? quote.itemPrices.map(ip => ({
          itemId: String(ip.itemId || ip._id || ''),
          itemName: ip.itemName || 'Demanded Product',
          quantity: Number(ip.quantity) || 1,
          sellerPrice: Number(ip.pricePerUnit ?? ip.sellerPrice ?? 0),
          totalPrice: Number(ip.totalPrice ?? 0) || ((Number(ip.quantity) || 1) * Number(ip.pricePerUnit ?? 0)),
          discountTierNote: ip.discountTierNote || ''
        }))
      : [];
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
    const counterItems = Array.isArray(counter.itemDemands) && counter.itemDemands.length > 0
      ? counter.itemDemands.map(idm => ({
          itemId: String(idm.itemId || ''),
          itemName: idm.itemName || 'Demanded Product',
          quantity: Number(idm.quantity) || 1,
          sellerPrice: Number(idm.targetUnitPrice || 0),
          totalPrice: Number(idm.targetTotalPrice || 0) || (Number(idm.quantity || 1) * Number(idm.targetUnitPrice || 0)),
          discountTierNote: idm.notes || ''
        }))
      : (Array.isArray(order?.requirements) ? order.requirements.map(r => ({
          itemId: String(r._id || r.itemId || ''),
          itemName: r.itemName,
          quantity: Number(r.quantity) || 1,
          sellerPrice: Number(r.estimatedPrice || 0),
          totalPrice: (Number(r.quantity) || 1) * Number(r.estimatedPrice || 0),
          discountTierNote: ''
        })) : []);

    const counterQty = counterItems.reduce((sum, item) => sum + item.quantity, 0) || Number(order?.totalQuantity) || 1;
    const counterAmt = Number(counter.targetBudget || 0);
    const counterUnitP = counterQty > 0 ? Math.round(counterAmt / counterQty) : 0;
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

export default function QuotationVersionComparisonModal({
  isOpen,
  onClose,
  quote,
  order,
  userRole = 'seller',
  onAcceptCounterDemand,
  onOpenRevisePitch,
  onAcceptQuote
}) {
  if (!isOpen || !quote) return null;

  const allVersions = useMemo(() => extractAllQuotationVersions(quote, order), [quote, order]);

  // Default Version A to round 1 (or penultimate), Version B to latest round
  const [versionAIndex, setVersionAIndex] = useState(0);
  const [versionBIndex, setVersionBIndex] = useState(() => (allVersions.length > 1 ? allVersions.length - 1 : 0));

  // Swap Version A and Version B
  const handleSwap = () => {
    setVersionAIndex(versionBIndex);
    setVersionBIndex(versionAIndex);
  };

  const verA = allVersions[versionAIndex] || allVersions[0];
  const verB = allVersions[versionBIndex] || allVersions[allVersions.length - 1];

  // Deltas Calculations (Version B vs Version A)
  const amountDiff = (verB?.quoteAmount || 0) - (verA?.quoteAmount || 0);
  const amountPct = verA?.quoteAmount > 0 ? ((amountDiff / verA.quoteAmount) * 100).toFixed(1) : 0;

  const unitPriceDiff = (verB?.unitPrice || 0) - (verA?.unitPrice || 0);
  const unitPricePct = verA?.unitPrice > 0 ? ((unitPriceDiff / verA.unitPrice) * 100).toFixed(1) : 0;

  const totalQtyDiff = (verB?.totalQuantity || 0) - (verA?.totalQuantity || 0);
  const totalQtyPct = verA?.totalQuantity > 0 ? ((totalQtyDiff / verA.totalQuantity) * 100).toFixed(1) : 0;

  const leadDaysDiff = (verB?.estimatedDeliveryDays || 0) - (verA?.estimatedDeliveryDays || 0);

  const advPctDiff = (verB?.prepaymentPercentage || 0) - (verA?.prepaymentPercentage || 0);
  const advAmtDiff = (verB?.prepaymentAmount || 0) - (verA?.prepaymentAmount || 0);

  // Unified items map for side-by-side breakdown
  const unifiedItems = useMemo(() => {
    const map = new Map();

    (verA?.itemPrices || []).forEach(item => {
      const key = item.itemId || item.itemName;
      map.set(key, {
        key,
        itemName: item.itemName,
        itemA: item,
        itemB: null
      });
    });

    (verB?.itemPrices || []).forEach(item => {
      const key = item.itemId || item.itemName;
      if (map.has(key)) {
        map.get(key).itemB = item;
      } else {
        let foundByName = false;
        for (const [, val] of map.entries()) {
          if (val.itemName && item.itemName && val.itemName.trim().toLowerCase() === item.itemName.trim().toLowerCase()) {
            val.itemB = item;
            foundByName = true;
            break;
          }
        }
        if (!foundByName) {
          map.set(key, {
            key,
            itemName: item.itemName,
            itemA: null,
            itemB: item
          });
        }
      }
    });

    return Array.from(map.values());
  }, [verA, verB]);

  const sellerStore = quote.sellerStoreName || quote.sellerName || 'Quoting Vendor';
  const orderRef = order?.referenceId || `ORD-${order?.id || order?._id || ''}`;
  const schoolName = order?.institutionName || order?.schoolName || 'Partner School';

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[94vh] shadow-2xl overflow-hidden flex flex-col border border-gray-200">
        
        {/* Top Header */}
        <div className="bg-linear-to-r from-teal-900 via-teal-800 to-teal-950 text-white p-4 sm:p-5 flex items-center justify-between shrink-0 border-b border-teal-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-teal-950 flex items-center justify-center font-bold shadow-md shrink-0">
              <SlidersHorizontal size={20} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-black uppercase tracking-wider bg-white/15 px-2.5 py-0.5 rounded border border-white/20">
                  {orderRef}
                </span>
                <h2 className="text-base sm:text-lg font-extrabold text-white font-display">
                  Negotiation Version Comparison
                </h2>
              </div>
              <p className="text-xs text-teal-200 mt-0.5 flex flex-wrap items-center gap-2">
                <span>Vendor: <strong className="text-amber-300">{sellerStore}</strong></span>
                <span>•</span>
                <span>School: <strong className="text-white">{schoolName}</strong></span>
                <span>•</span>
                <span>Total Versions Logged: <strong className="text-white">{allVersions.length}</strong></span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title="Close Comparison"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-gray-50/50">
          
          {/* VERSION SELECTORS BAR */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wider">
              <span>Select Negotiation Versions to Compare</span>
              {allVersions.length >= 2 && (
                <div className="hidden sm:flex items-center gap-1.5">
                  <span className="text-gray-400">Quick Compare:</span>
                  <button
                    type="button"
                    onClick={() => { setVersionAIndex(0); setVersionBIndex(1); }}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-colors cursor-pointer ${
                      versionAIndex === 0 && versionBIndex === 1
                        ? 'bg-teal-700 text-white border-teal-800'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300'
                    }`}
                  >
                    v1 vs v2
                  </button>
                  {allVersions.length >= 3 && (
                    <>
                      <button
                        type="button"
                        onClick={() => { setVersionAIndex(0); setVersionBIndex(allVersions.length - 1); }}
                        className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-colors cursor-pointer ${
                          versionAIndex === 0 && versionBIndex === allVersions.length - 1
                            ? 'bg-teal-700 text-white border-teal-800'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300'
                        }`}
                      >
                        v1 vs v{allVersions[allVersions.length - 1].version}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setVersionAIndex(1); setVersionBIndex(allVersions.length - 1); }}
                        className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-colors cursor-pointer ${
                          versionAIndex === 1 && versionBIndex === allVersions.length - 1
                            ? 'bg-teal-700 text-white border-teal-800'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300'
                        }`}
                      >
                        v2 vs v{allVersions[allVersions.length - 1].version}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-center gap-3">
              {/* Left Selector: Version A */}
              <div>
                <label className="block text-[11px] font-extrabold text-teal-900 mb-1">
                  Baseline (Version A)
                </label>
                <select
                  value={versionAIndex}
                  onChange={(e) => setVersionAIndex(Number(e.target.value))}
                  className="w-full text-xs font-bold text-gray-800 bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 focus:outline-teal-600 focus:bg-white transition-all cursor-pointer"
                >
                  {allVersions.map((v, idx) => (
                    <option key={v.id || idx} value={idx}>
                      {v.label} — ₹{v.quoteAmount.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Middle Swap Button */}
              <div className="flex justify-center sm:pt-4">
                <button
                  type="button"
                  onClick={handleSwap}
                  className="p-2 sm:px-3 sm:py-2 bg-gray-100 hover:bg-teal-50 text-gray-700 hover:text-teal-800 border border-gray-300 hover:border-teal-300 rounded-xl transition-all shadow-2xs flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                  title="Swap Versions Left ⇄ Right"
                >
                  <ArrowLeftRight size={14} className="text-teal-700" />
                  <span className="hidden sm:inline">Swap</span>
                </button>
              </div>

              {/* Right Selector: Version B */}
              <div>
                <label className="block text-[11px] font-extrabold text-purple-900 mb-1">
                  Target / Comparison (Version B)
                </label>
                <select
                  value={versionBIndex}
                  onChange={(e) => setVersionBIndex(Number(e.target.value))}
                  className="w-full text-xs font-bold text-gray-800 bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 focus:outline-purple-600 focus:bg-white transition-all cursor-pointer"
                >
                  {allVersions.map((v, idx) => (
                    <option key={v.id || idx} value={idx}>
                      {v.label} — ₹{v.quoteAmount.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ATTRIBUTION & ROUND SUMMARY STRIP */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Version A Info Card */}
            <div className={`p-3.5 rounded-2xl border text-xs space-y-1.5 ${
              verA.senderRole === 'buyer' ? 'bg-purple-50/70 border-purple-200' : 'bg-teal-50/70 border-teal-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                  verA.senderRole === 'buyer' ? 'bg-purple-700 text-white' : 'bg-teal-800 text-white'
                }`}>
                  Version A • {verA.senderRole === 'buyer' ? 'Buyer Counter-Demand' : 'Vendor Pitch'}
                </span>
                <span className="text-[11px] text-gray-500 font-medium">
                  {new Date(verA.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="flex items-center justify-between font-mono">
                <span className="text-gray-600 font-medium">{verA.senderName}</span>
                <span className="text-base font-extrabold text-gray-900">₹{verA.quoteAmount.toLocaleString()}</span>
              </div>
            </div>

            {/* Version B Info Card */}
            <div className={`p-3.5 rounded-2xl border text-xs space-y-1.5 ${
              verB.senderRole === 'buyer' ? 'bg-purple-50/70 border-purple-200' : 'bg-teal-50/70 border-teal-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                  verB.senderRole === 'buyer' ? 'bg-purple-700 text-white' : 'bg-teal-800 text-white'
                }`}>
                  Version B • {verB.senderRole === 'buyer' ? 'Buyer Counter-Demand' : 'Vendor Pitch'}
                </span>
                <span className="text-[11px] text-gray-500 font-medium">
                  {new Date(verB.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="flex items-center justify-between font-mono">
                <span className="text-gray-600 font-medium">{verB.senderName}</span>
                <span className="text-base font-extrabold text-gray-900">₹{verB.quoteAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* DELTA SUMMARY KPI CARDS (5 KEY METRICS) */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Metric 1: Total Budget */}
            <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-2xs space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-gray-400 block tracking-wider">
                Total Budget
              </span>
              <div className="flex items-baseline justify-between gap-1 font-mono">
                <span className="text-xs text-gray-500">₹{verA.quoteAmount.toLocaleString()}</span>
                <span className="text-xs font-bold text-gray-400">➔</span>
                <span className="text-sm font-black text-gray-900">₹{verB.quoteAmount.toLocaleString()}</span>
              </div>
              <div className="pt-1">
                {amountDiff < 0 ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    <TrendingDown size={12} /> -₹{Math.abs(amountDiff).toLocaleString()} ({Math.abs(amountPct)}%)
                  </span>
                ) : amountDiff > 0 ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                    <TrendingUp size={12} /> +₹{amountDiff.toLocaleString()} (+{amountPct}%)
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                    No Change
                  </span>
                )}
              </div>
            </div>

            {/* Metric 2: Unit Price Avg */}
            <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-2xs space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-gray-400 block tracking-wider">
                Avg Unit Price
              </span>
              <div className="flex items-baseline justify-between gap-1 font-mono">
                <span className="text-xs text-gray-500">₹{verA.unitPrice}</span>
                <span className="text-xs font-bold text-gray-400">➔</span>
                <span className="text-sm font-black text-gray-900">₹{verB.unitPrice}</span>
              </div>
              <div className="pt-1">
                {unitPriceDiff < 0 ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    <TrendingDown size={12} /> -₹{Math.abs(unitPriceDiff)}/unit
                  </span>
                ) : unitPriceDiff > 0 ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    <TrendingUp size={12} /> +₹{unitPriceDiff}/unit
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                    Same Unit Price
                  </span>
                )}
              </div>
            </div>

            {/* Metric 3: Order Quantity Scale */}
            <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-2xs space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-gray-400 block tracking-wider">
                Order Scale / Qty
              </span>
              <div className="flex items-baseline justify-between gap-1 font-mono">
                <span className="text-xs text-gray-500">{verA.totalQuantity}</span>
                <span className="text-xs font-bold text-gray-400">➔</span>
                <span className="text-sm font-black text-gray-900">{verB.totalQuantity}</span>
              </div>
              <div className="pt-1">
                {totalQtyDiff > 0 ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300">
                    📈 +{totalQtyDiff} Units (+{totalQtyPct}%)
                  </span>
                ) : totalQtyDiff < 0 ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    📉 {totalQtyDiff} Units
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                    Same ({verB.totalQuantity} Units)
                  </span>
                )}
              </div>
            </div>

            {/* Metric 4: Lead Time */}
            <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-2xs space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-gray-400 block tracking-wider">
                Est. Lead Time
              </span>
              <div className="flex items-baseline justify-between gap-1 font-mono">
                <span className="text-xs text-gray-500">{verA.estimatedDeliveryDays}d</span>
                <span className="text-xs font-bold text-gray-400">➔</span>
                <span className="text-sm font-black text-gray-900">{verB.estimatedDeliveryDays}d</span>
              </div>
              <div className="pt-1">
                {leadDaysDiff < 0 ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    ⚡ {Math.abs(leadDaysDiff)} Days Faster
                  </span>
                ) : leadDaysDiff > 0 ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                    ⏳ +{leadDaysDiff} Days Extended
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                    Same ({verB.estimatedDeliveryDays} Days)
                  </span>
                )}
              </div>
            </div>

            {/* Metric 5: Prepayment Required */}
            <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-2xs space-y-1 col-span-2 lg:col-span-1">
              <span className="text-[10px] font-extrabold uppercase text-gray-400 block tracking-wider">
                Prepayment Demanded
              </span>
              <div className="flex items-baseline justify-between gap-1 font-mono">
                <span className="text-xs text-gray-500">{verA.prepaymentPercentage}%</span>
                <span className="text-xs font-bold text-gray-400">➔</span>
                <span className="text-sm font-black text-gray-900">{verB.prepaymentPercentage}%</span>
              </div>
              <div className="pt-1">
                {advPctDiff < 0 ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    {advPctDiff}% Adv (-₹{Math.abs(advAmtDiff).toLocaleString()})
                  </span>
                ) : advPctDiff > 0 ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    ⚠️ +{advPctDiff}% Adv (+₹{advAmtDiff.toLocaleString()})
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                    Same ({verB.prepaymentPercentage}%)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ITEM-BY-ITEM DETAILED COMPARISON TABLE */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
            <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center justify-between">
              <span className="text-xs font-extrabold text-gray-800 flex items-center gap-1.5">
                <Package size={14} className="text-teal-700" />
                Line-Item Pricing & Scale Variance
              </span>
              <span className="text-[11px] text-gray-500 font-semibold font-mono">
                {unifiedItems.length} Products Demanded
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50/80 text-[10px] uppercase font-bold text-gray-500 border-b border-gray-200">
                    <th className="py-2.5 px-3">Item Specification</th>
                    <th className="py-2.5 px-2 text-center bg-teal-50/40 text-teal-950">Ver A Qty</th>
                    <th className="py-2.5 px-2 text-right bg-teal-50/40 text-teal-950">Ver A Price</th>
                    <th className="py-2.5 px-2 text-right bg-teal-50/40 text-teal-950">Ver A Total</th>
                    <th className="py-2.5 px-2 text-center bg-purple-50/40 text-purple-950 border-l border-gray-200">Ver B Qty</th>
                    <th className="py-2.5 px-2 text-right bg-purple-50/40 text-purple-950">Ver B Price</th>
                    <th className="py-2.5 px-2 text-right bg-purple-50/40 text-purple-950">Ver B Total</th>
                    <th className="py-2.5 px-3 text-right border-l border-gray-200">Variance / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {unifiedItems.map((uItem, idx) => {
                    const iA = uItem.itemA;
                    const iB = uItem.itemB;

                    const qtyA = iA?.quantity || 0;
                    const priceA = iA?.sellerPrice || 0;
                    const totalA = iA?.totalPrice || (qtyA * priceA);

                    const qtyB = iB?.quantity || 0;
                    const priceB = iB?.sellerPrice || 0;
                    const totalB = iB?.totalPrice || (qtyB * priceB);

                    const itemQtyDiff = qtyB - qtyA;
                    const itemPriceDiff = priceB - priceA;
                    const itemTotalDiff = totalB - totalA;

                    return (
                      <tr key={uItem.key || idx} className="hover:bg-gray-50/50">
                        <td className="py-2.5 px-3 font-semibold text-gray-900">
                          <div>{uItem.itemName}</div>
                          {(iA?.discountTierNote || iB?.discountTierNote) && (
                            <div className="text-[10px] text-gray-400 mt-0.5 line-clamp-1 italic">
                              {iB?.discountTierNote || iA?.discountTierNote}
                            </div>
                          )}
                        </td>

                        {/* Version A Columns */}
                        <td className="py-2.5 px-2 text-center font-mono font-medium text-gray-700 bg-teal-50/20">
                          {qtyA > 0 ? qtyA : '-'}
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono font-medium text-gray-700 bg-teal-50/20">
                          {priceA > 0 ? `₹${priceA.toLocaleString()}` : '-'}
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono font-bold text-gray-900 bg-teal-50/20">
                          {totalA > 0 ? `₹${totalA.toLocaleString()}` : '-'}
                        </td>

                        {/* Version B Columns */}
                        <td className={`py-2.5 px-2 text-center font-mono font-bold border-l border-gray-200 ${
                          itemQtyDiff > 0 ? 'bg-emerald-50 text-emerald-900' : 'bg-purple-50/20 text-gray-800'
                        }`}>
                          {qtyB > 0 ? qtyB : '-'}
                          {itemQtyDiff > 0 && <span className="block text-[9px] text-emerald-700 font-extrabold">+{itemQtyDiff}</span>}
                        </td>
                        <td className={`py-2.5 px-2 text-right font-mono font-bold ${
                          itemPriceDiff < 0 ? 'text-emerald-700 bg-emerald-50/40' : itemPriceDiff > 0 ? 'text-blue-700 bg-blue-50/40' : 'text-gray-800 bg-purple-50/20'
                        }`}>
                          {priceB > 0 ? `₹${priceB.toLocaleString()}` : '-'}
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono font-black text-gray-900 bg-purple-50/20">
                          {totalB > 0 ? `₹${totalB.toLocaleString()}` : '-'}
                        </td>

                        {/* Variance Column */}
                        <td className="py-2.5 px-3 text-right font-mono border-l border-gray-200">
                          {itemTotalDiff < 0 ? (
                            <span className="text-emerald-700 font-bold block text-[11px]">
                              -₹{Math.abs(itemTotalDiff).toLocaleString()}
                            </span>
                          ) : itemTotalDiff > 0 ? (
                            <span className="text-blue-700 font-bold block text-[11px]">
                              +₹{itemTotalDiff.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-[11px]">₹0</span>
                          )}
                          {itemPriceDiff !== 0 && (
                            <span className="text-[10px] text-gray-400 block">
                              ({itemPriceDiff > 0 ? '+' : ''}₹{itemPriceDiff}/u)
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* SIDE-BY-SIDE TERMS & WRITTEN NOTES COMPARISON */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-2xs space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-teal-800 flex items-center gap-1">
                <FileText size={12} /> Version A Terms & Rationale ({verA.shortLabel})
              </span>
              <p className="text-xs text-gray-700 italic bg-gray-50 p-2.5 rounded-xl border border-gray-100 min-h-[50px]">
                {verA.notes ? `"${verA.notes}"` : 'No written notes entered for this round.'}
              </p>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-2xs space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-purple-800 flex items-center gap-1">
                <FileText size={12} /> Version B Terms & Rationale ({verB.shortLabel})
              </span>
              <p className="text-xs text-gray-700 italic bg-gray-50 p-2.5 rounded-xl border border-gray-100 min-h-[50px]">
                {verB.notes ? `"${verB.notes}"` : 'No written notes entered for this round.'}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="bg-white px-4 sm:px-6 py-3.5 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-gray-500 font-medium">
            Comparing <strong className="text-teal-900">{verA.shortLabel}</strong> with <strong className="text-purple-900">{verB.shortLabel}</strong>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Quick Actions depending on user role and comparison target */}
            {userRole === 'seller' && onAcceptCounterDemand && verB.senderRole === 'buyer' && (
              <button
                type="button"
                onClick={onAcceptCounterDemand}
                className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 size={14} />
                <span>Accept Buyer Counter (v{verB.version})</span>
              </button>
            )}

            {userRole === 'seller' && onOpenRevisePitch && (
              <button
                type="button"
                onClick={onOpenRevisePitch}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles size={14} />
                <span>Revise Pitch (v{(quote.currentVersion || 1) + 1})</span>
              </button>
            )}

            {userRole === 'consumer' && onAcceptQuote && (
              <button
                type="button"
                onClick={onAcceptQuote}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 size={14} />
                <span>Accept Winning Quote</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Close Comparison
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
