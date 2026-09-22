import React, { useState } from 'react';
import { 
  Truck, 
  CheckCircle2, 
  ExternalLink, 
  Calculator, 
  MapPin, 
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  Key,
  Save,
  Loader2
} from 'lucide-react';
import { useSellerData } from '../context/SellerDataContext';
import { checkServiceabilityApi, updateDeliveryConfigApi } from '../utils/api';

export default function ShippingTab() {
  const { shippingPartners, toggleShippingPartner } = useSellerData();
  const [calcWeight, setCalcWeight] = useState(1);
  const [destPin, setDestPin] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);
  const [serviceabilityResult, setServiceabilityResult] = useState(null);

  // API Credentials Form State
  const [shiprocketApiKey, setShiprocketApiKey] = useState('sr_sandbox_token_demo_9821');
  const [delhiveryApiKey, setDelhiveryApiKey] = useState('delh_token_demo_5521');
  const [bluedartApiKey, setBluedartApiKey] = useState('bd_lic_key_demo_1120');
  const [isSavingKeys, setIsSavingKeys] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleCalculate = async (e) => {
    e.preventDefault();
    if (!destPin) return;
    setIsCalculating(true);
    try {
      const res = await checkServiceabilityApi({
        pickupPincode: '226001',
        deliveryPincode: destPin,
        weightKg: Number(calcWeight) || 1
      });
      setServiceabilityResult(res);
    } catch (err) {
      console.error('Calculation error:', err);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleSaveApiKeys = async (e) => {
    e.preventDefault();
    setIsSavingKeys(true);
    setSaveSuccess(false);
    try {
      await updateDeliveryConfigApi({
        partners: [
          { partnerId: 'shiprocket', name: 'Shiprocket Multi-Courier', code: 'SHIPROCKET', active: true, apiKey: shiprocketApiKey },
          { partnerId: 'delhivery', name: 'Delhivery Direct', code: 'DELHIVERY', active: true, apiKey: delhiveryApiKey },
          { partnerId: 'bluedart', name: 'BlueDart Air Priority', code: 'BLUEDART', active: true, apiKey: bluedartApiKey },
          { partnerId: 'local_express', name: 'BookVardi Local Express', code: 'LOCAL_EXPRESS', active: true }
        ]
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      alert('Error saving API keys: ' + err.message);
    } finally {
      setIsSavingKeys(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Truck className="text-teal-700" size={24} /> Logistics & Courier Integrations
        </h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Configure automated shipping manifests, real-time AWB generation, and courier partner API keys
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Courier Partners & API Credentials */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-900 text-sm">Active Courier Partners & API Credentials</h3>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
              Live Sandbox Mode Enabled
            </span>
          </div>

          <form onSubmit={handleSaveApiKeys} className="space-y-3">
            {/* Shiprocket */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  Shiprocket Aggregator
                  <span className="text-[10px] bg-teal-100 text-teal-800 font-bold px-2 py-0.5 rounded-full">
                    Default Auto-AWB
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => toggleShippingPartner('shiprocket')}
                  className="cursor-pointer"
                >
                  <ToggleRight size={28} className="text-teal-700" />
                </button>
              </div>
              <div className="space-y-1 pt-1">
                <label className="text-[11px] font-semibold text-gray-600 flex items-center gap-1">
                  <Key size={12} /> Shiprocket API Token / Credentials Key
                </label>
                <input
                  type="password"
                  value={shiprocketApiKey}
                  onChange={(e) => setShiprocketApiKey(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-600 font-mono text-xs"
                />
              </div>
            </div>

            {/* Delhivery Direct */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  Delhivery Direct Express
                </div>
                <button
                  type="button"
                  onClick={() => toggleShippingPartner('delhivery')}
                  className="cursor-pointer"
                >
                  <ToggleRight size={28} className="text-teal-700" />
                </button>
              </div>
              <div className="space-y-1 pt-1">
                <label className="text-[11px] font-semibold text-gray-600 flex items-center gap-1">
                  <Key size={12} /> Delhivery Client Token / API Key
                </label>
                <input
                  type="password"
                  value={delhiveryApiKey}
                  onChange={(e) => setDelhiveryApiKey(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-600 font-mono text-xs"
                />
              </div>
            </div>

            {/* BlueDart */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  BlueDart Campus Air Priority
                </div>
                <button
                  type="button"
                  onClick={() => toggleShippingPartner('bluedart')}
                  className="cursor-pointer"
                >
                  <ToggleRight size={28} className="text-teal-700" />
                </button>
              </div>
              <div className="space-y-1 pt-1">
                <label className="text-[11px] font-semibold text-gray-600 flex items-center gap-1">
                  <Key size={12} /> BlueDart License Key & Login ID
                </label>
                <input
                  type="password"
                  value={bluedartApiKey}
                  onChange={(e) => setBluedartApiKey(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-600 font-mono text-xs"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              {saveSuccess ? (
                <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 size={15} /> Credentials Saved Successfully!
                </span>
              ) : <span />}

              <button
                type="submit"
                disabled={isSavingKeys}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-teal-800 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSavingKeys ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                <span>Save API Credentials</span>
              </button>
            </div>
          </form>
        </div>

        {/* Real-time Shipping Rate & Serviceability Estimator */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4 text-xs">
          <div className="flex items-center gap-2 font-bold text-gray-900 text-sm">
            <Calculator className="text-teal-700" size={18} /> Real-Time Serviceability & Rate Calculator
          </div>
          <p className="text-gray-500">
            Check real-time freight rates and SLAs for school bulk orders or individual uniform parcels.
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
                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-600 font-bold text-teal-900"
              />
            </div>

            <button
              type="submit"
              disabled={isCalculating}
              className="w-full py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              {isCalculating ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Checking Partner Rates...</span>
                </>
              ) : (
                <span>Check Real-Time Partner Rates</span>
              )}
            </button>
          </form>

          {serviceabilityResult && serviceabilityResult.availablePartners && (
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <h4 className="font-bold text-gray-900 text-xs">Available Courier Rates for Pincode {serviceabilityResult.deliveryPincode}:</h4>
              <div className="space-y-2">
                {serviceabilityResult.availablePartners.map((partner) => (
                  <div key={partner.code} className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <strong className="block text-gray-900">{partner.name}</strong>
                      <span className="text-[10px] text-gray-500">SLA: {partner.estimatedDays}</span>
                    </div>
                    <span className="font-mono font-extrabold text-teal-800 text-sm">₹{partner.estimatedRate}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
