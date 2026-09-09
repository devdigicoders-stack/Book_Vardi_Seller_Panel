import React, { useState } from 'react';
import { 
  Truck, 
  CheckCircle2, 
  ExternalLink, 
  Calculator, 
  MapPin, 
  ShieldCheck,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { useSellerData } from '../context/SellerDataContext';

export default function ShippingTab() {
  const { shippingPartners, toggleShippingPartner } = useSellerData();
  const [calcWeight, setCalcWeight] = useState(1);
  const [destPin, setDestPin] = useState('');
  const [estimatedCost, setEstimatedCost] = useState(null);

  const handleCalculate = (e) => {
    e.preventDefault();
    if (!destPin) return;
    const base = destPin.startsWith('11') || destPin.startsWith('12') ? 45 : 85;
    setEstimatedCost(base * Math.max(1, Math.ceil(calcWeight / 0.5)));
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Truck className="text-teal-700" size={24} /> Logistics & Courier Integrations
        </h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Configure automated shipping manifests, reverse pickup services, and partner rates
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Courier Partners List */}
        <div className="space-y-3">
          <h3 className="font-bold text-gray-900 text-sm">Active Courier Partners</h3>
          <div className="space-y-3">
            {shippingPartners.map((partner) => (
              <div key={partner.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between text-xs">
                <div className="space-y-1">
                  <div className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    {partner.name}
                    {partner.active && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                        Connected
                      </span>
                    )}
                  </div>
                  <div className="text-gray-500">
                    Average Delivery SLA: <strong className="text-gray-800">{partner.avgDays}</strong>
                  </div>
                  <div className="text-teal-800 font-medium">Standard Rate: {partner.rate}</div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleShippingPartner(partner.id)}
                    className="cursor-pointer"
                    title={partner.active ? 'Deactivate' : 'Activate'}
                  >
                    {partner.active ? (
                      <ToggleRight size={32} className="text-teal-700" />
                    ) : (
                      <ToggleLeft size={32} className="text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shipping Rate Calculator */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4 text-xs">
          <div className="flex items-center gap-2 font-bold text-gray-900 text-sm">
            <Calculator className="text-teal-700" size={18} /> Instant Shipping Rate Estimator
          </div>
          <p className="text-gray-500">
            Calculate estimated freight rate for school bulk kits or individual uniform packages.
          </p>

          <form onSubmit={handleCalculate} className="space-y-3">
            <div className="space-y-1">
              <label className="font-semibold text-gray-700">Destination Pincode</label>
              <input
                type="text"
                required
                maxLength="6"
                placeholder="e.g. 110001 (Delhi) or 400001 (Mumbai)"
                value={destPin}
                onChange={(e) => setDestPin(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-600"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-gray-700">Parcel Weight (in kg)</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                value={calcWeight}
                onChange={(e) => setCalcWeight(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-600"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl shadow-xs transition-colors"
            >
              Calculate Estimated Rate
            </button>
          </form>

          {estimatedCost !== null && (
            <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-center space-y-1 animate-in fade-in">
              <div className="text-gray-600">Estimated Courier Shipping Charge</div>
              <div className="text-2xl font-extrabold text-teal-900">₹{estimatedCost}</div>
              <div className="text-[10px] text-teal-700">Includes fuel surcharge & surface door delivery</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
