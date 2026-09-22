import React, { useState, useEffect } from 'react';
import { Truck, X, Package, ShieldCheck, CheckCircle2, Download, ExternalLink, Loader2, Sparkles } from 'lucide-react';
import { checkServiceabilityApi, createShipmentApi } from '../utils/api';

export default function CreateShipmentModal({ isOpen, onClose, order, onShipmentCreated }) {
  if (!isOpen || !order) return null;

  const orderId = order.id || order._id || order.orderId;
  const deliveryPincode = order.shippingAddress?.pincode || order.pincode || '110001';
  const pickupPincode = '226001';

  const [weightKg, setWeightKg] = useState(1.5);
  const [lengthCm, setLengthCm] = useState(25);
  const [widthCm, setWidthCm] = useState(20);
  const [heightCm, setHeightCm] = useState(10);

  const [isCheckingRates, setIsCheckingRates] = useState(false);
  const [availablePartners, setAvailablePartners] = useState([]);
  const [selectedPartnerCode, setSelectedPartnerCode] = useState('SHIPROCKET');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shipmentResult, setShipmentResult] = useState(null);

  // Fetch real-time rate comparison when modal opens or weight changes
  const handleCheckServiceability = async () => {
    setIsCheckingRates(true);
    try {
      const isCod = order.paymentMethod === 'COD' || order.paymentMethod === 'Cash on Delivery';
      const res = await checkServiceabilityApi({
        pickupPincode,
        deliveryPincode,
        weightKg: Number(weightKg) || 1,
        isCod
      });

      if (res?.availablePartners && res.availablePartners.length > 0) {
        setAvailablePartners(res.availablePartners);
        const defaultCode = res.recommendedPartner?.code || res.availablePartners[0]?.code || 'SHIPROCKET';
        setSelectedPartnerCode(defaultCode);
      } else {
        setAvailablePartners([]);
        alert(res?.message || 'No delivery partners available for this pincode.');
      }
    } catch (err) {
      console.error('Serviceability error:', err);
      setAvailablePartners([]);
    } finally {
      setIsCheckingRates(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      handleCheckServiceability();
    }
  }, [isOpen]);

  const handleGenerateAwb = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        orderId,
        courierCode: selectedPartnerCode,
        weightKg: Number(weightKg) || 1,
        dimensions: {
          length: Number(lengthCm) || 20,
          width: Number(widthCm) || 15,
          height: Number(heightCm) || 10
        }
      };

      const res = await createShipmentApi(payload);
      if (res?.success) {
        setShipmentResult(res);
        if (onShipmentCreated) {
          onShipmentCreated(res);
        }
      } else {
        alert(res?.message || 'Failed to generate shipment AWB.');
      }
    } catch (err) {
      alert('Error creating shipment: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Top Control Bar */}
        <div className="bg-teal-950 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold">
              <Truck size={20} />
            </div>
            <div>
              <h3 className="font-display font-extrabold text-sm sm:text-base text-white">
                Dispatch Order #{orderId} via Delivery Partner
              </h3>
              <p className="text-[11px] text-teal-200">Automated AWB Booking & Shipping Label Generator</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-teal-300 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-gray-800">
          
          {/* SUCCESS SCREEN IF AWB GENERATED */}
          {shipmentResult ? (
            <div className="space-y-5 text-center py-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto border-4 border-emerald-200 shadow-2xs animate-bounce">
                <CheckCircle2 size={36} />
              </div>

              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  AWB Generated & Pickup Manifested
                </span>
                <h3 className="font-display text-xl font-extrabold text-gray-900 mt-2">
                  Shipment Booked Successfully!
                </h3>
                <p className="text-xs text-gray-600 mt-1">
                  AWB Number <strong className="font-mono text-teal-800">{shipmentResult.awbNumber}</strong> assigned to order.
                </p>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-left max-w-md mx-auto space-y-2 text-xs">
                <div className="flex justify-between border-b border-gray-200 pb-1.5">
                  <span className="text-gray-500 font-medium">Assigned Courier Partner:</span>
                  <strong className="text-gray-900">{shipmentResult.order?.shipmentDetails?.courierPartnerName || selectedPartnerCode}</strong>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-1.5">
                  <span className="text-gray-500 font-medium">Pickup Token:</span>
                  <strong className="font-mono text-gray-900">{shipmentResult.order?.shipmentDetails?.pickupToken || 'PKP-889123'}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Destination Pincode:</span>
                  <strong className="font-mono text-gray-900">{deliveryPincode}</strong>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href={`data:text/plain;charset=utf-8,BOOKVARDI%20SHIPPING%20LABEL%0AAWB:%20${shipmentResult.awbNumber}%0AOrder:%20${orderId}%0ADestination:%20${deliveryPincode}`}
                  download={`ShippingLabel-${shipmentResult.awbNumber}.txt`}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-teal-800 hover:bg-teal-700 text-white font-extrabold text-xs px-6 py-3 rounded-xl shadow-md transition-all cursor-pointer"
                >
                  <Download size={15} />
                  <span>Download Shipping Label PDF</span>
                </a>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Package Specs Input Grid */}
              <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-200 space-y-3">
                <h4 className="font-extrabold text-xs text-teal-900 uppercase tracking-wider flex items-center gap-1">
                  <Package size={14} /> Package Weight & Dimensions
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Weight (Kg)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={weightKg}
                      onChange={(e) => setWeightKg(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-teal-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Length (cm)
                    </label>
                    <input
                      type="number"
                      value={lengthCm}
                      onChange={(e) => setLengthCm(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Width (cm)
                    </label>
                    <input
                      type="number"
                      value={widthCm}
                      onChange={(e) => setWidthCm(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Height (cm)
                    </label>
                    <input
                      type="number"
                      value={heightCm}
                      onChange={(e) => setHeightCm(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs"
                    />
                  </div>
                </div>

                <div className="pt-1 flex items-center justify-between text-[11px] text-gray-500 border-t border-gray-200/60">
                  <span>Destination Pincode: <strong className="font-mono text-gray-800">{deliveryPincode}</strong></span>
                  <button
                    type="button"
                    onClick={handleCheckServiceability}
                    disabled={isCheckingRates}
                    className="text-teal-700 font-bold hover:underline cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    {isCheckingRates ? <><Loader2 size={12} className="animate-spin" /> Refreshing...</> : 'Refresh Rates'}
                  </button>
                </div>
              </div>

              {/* Serviceability & Partner Selection Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-xs text-gray-900 uppercase tracking-wider flex items-center gap-1">
                    <Truck size={14} className="text-teal-700" /> Select Delivery Partner
                  </h4>

                  {isCheckingRates && (
                    <span className="text-[11px] text-teal-700 font-medium flex items-center gap-1">
                      <Loader2 size={13} className="animate-spin" /> Fetching live rates...
                    </span>
                  )}
                </div>

                <div className="border border-gray-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-teal-950 text-white text-[10px] uppercase tracking-wider font-extrabold">
                        <th className="py-2.5 px-3">Select</th>
                        <th className="py-2.5 px-3">Courier Partner</th>
                        <th className="py-2.5 px-3 text-center">SLA / Days</th>
                        <th className="py-2.5 px-3 text-right">Est. Freight Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-xs">
                      {availablePartners.map((partner) => {
                        const isSelected = selectedPartnerCode === partner.code;
                        return (
                          <tr
                            key={partner.code}
                            onClick={() => setSelectedPartnerCode(partner.code)}
                            className={`cursor-pointer transition-colors ${isSelected ? 'bg-teal-50/80 font-bold' : 'hover:bg-gray-50'}`}
                          >
                            <td className="py-3 px-3 text-center">
                              <input
                                type="radio"
                                name="courierPartner"
                                checked={isSelected}
                                onChange={() => setSelectedPartnerCode(partner.code)}
                                className="accent-teal-700 cursor-pointer"
                              />
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-900">{partner.name}</span>
                                {partner.isDefault && (
                                  <span className="text-[9px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.5 rounded-md">
                                    Recommended
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-3 text-center text-gray-600 font-medium">{partner.estimatedDays}</td>
                            <td className="py-3 px-3 text-right font-mono font-bold text-teal-900">
                              ₹{partner.estimatedRate}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-[11px] text-gray-500 flex items-center gap-1.5">
                  <ShieldCheck size={15} className="text-teal-700 shrink-0" />
                  <span>Pickup request will be sent to merchant warehouse.</span>
                </div>

                <button
                  type="button"
                  onClick={handleGenerateAwb}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 text-teal-950 font-extrabold text-xs px-7 py-3 rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Generating AWB...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={15} />
                      <span>Generate AWB & Dispatch Order</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
