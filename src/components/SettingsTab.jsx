import React, { useState } from 'react';
import { 
  Settings, 
  Store, 
  Save, 
  CheckCircle2, 
  ShieldCheck, 
  MapPin, 
  Phone, 
  Mail, 
  FileText 
} from 'lucide-react';
import { useSellerData } from '../context/SellerDataContext';

export default function SettingsTab() {
  const { settings, updateSettings, isApproved } = useSellerData();
  const [formData, setFormData] = useState({ ...settings });
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    updateSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-5 rounded-2xl shadow-xs border border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="text-teal-700" size={24} /> Seller Account & Store Settings
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage your legal entity credentials, GST compliance, pickup hubs, and store branding
          </p>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
          <ShieldCheck size={14} /> Approved Verified Seller
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Store & Legal Details */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4 text-xs">
          <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
            <Store className="text-teal-700" size={18} /> Store Identity & Business Registration
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-semibold text-gray-700">Display Store Name *</label>
              <input
                type="text"
                required
                value={formData.storeName || ''}
                onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-600"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-gray-700">Store Tagline / Subtitle</label>
              <input
                type="text"
                value={formData.storeTagline || ''}
                onChange={(e) => setFormData({ ...formData, storeTagline: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-600"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-gray-700">Registered Legal Entity Name</label>
              <input
                type="text"
                value={formData.sellerLegalName || ''}
                onChange={(e) => setFormData({ ...formData, sellerLegalName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-600"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-gray-700">GSTIN Number</label>
              <input
                type="text"
                value={formData.gstin || ''}
                onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 font-mono focus:outline-none focus:border-teal-600"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-gray-700">Official Seller Email</label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-600"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-gray-700">Helpline / Support Phone</label>
              <input
                type="text"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-600"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-gray-700">Central Warehouse / Pickup Address</label>
            <input
              type="text"
              value={formData.warehouseAddress || ''}
              onChange={(e) => setFormData({ ...formData, warehouseAddress: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-600"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-gray-700">Warehouse Logistics In-Charge Contact</label>
            <input
              type="text"
              value={formData.pickupContact || ''}
              onChange={(e) => setFormData({ ...formData, pickupContact: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-600"
            />
          </div>
        </div>

        {/* Operational Preferences */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-3 text-xs">
          <h3 className="font-bold text-gray-900 text-sm">Fulfillment & Notification Preferences</h3>

          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.autoAcceptOrders !== false}
                onChange={(e) => setFormData({ ...formData, autoAcceptOrders: e.target.checked })}
                className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
              />
              <span className="text-gray-700 font-medium">
                Auto-confirm student uniform orders when inventory quantity is healthy
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.emailNotifications !== false}
                onChange={(e) => setFormData({ ...formData, emailNotifications: e.target.checked })}
                className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
              />
              <span className="text-gray-700 font-medium">
                Receive instant email alerts for new school bulk quotation requests
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.smsNotifications !== false}
                onChange={(e) => setFormData({ ...formData, smsNotifications: e.target.checked })}
                className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
              />
              <span className="text-gray-700 font-medium">
                Receive SMS dispatched alerts for delivery driver pickup
              </span>
            </label>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
          {savedSuccess ? (
            <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5 animate-in fade-in">
              <CheckCircle2 size={16} /> Store settings updated and persisted successfully!
            </span>
          ) : (
            <span className="text-xs text-gray-400">All changes will reflect across your official storefront.</span>
          )}

          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Save size={16} /> Save Changes
          </button>
        </div>

      </form>
    </div>
  );
}
