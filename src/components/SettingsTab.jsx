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
  FileText,
  AlertTriangle,
  Clock,
  Loader2,
  X
} from 'lucide-react';
import { useSellerData } from '../context/SellerDataContext';

export default function SettingsTab() {
  const { settings, updateSettings, clearAllSellerData, isApproved } = useSellerData();
  const [formData, setFormData] = useState({ ...settings });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionNotice, setSubmissionNotice] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmissionNotice(null);
    try {
      const res = await updateSettings(formData);
      setIsSubmitting(false);
      if (res?.requiresApproval || isApproved) {
        setSubmissionNotice({
          type: 'pending_approval',
          title: 'Badlav Admin Approval Ke Liye Submit Ho Gaye Hain',
          message: 'Aapki profile update request submit ho gayi hai aur approval ke liye Admin Portal par bhej di gayi hai. Admin dwara verify aur approve hone ke baad ye changes live ho jayenge.'
        });
      } else {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (err) {
      setIsSubmitting(false);
      setSubmissionNotice({
        type: 'error',
        title: 'Update Failed',
        message: err.message || 'Settings update karne me samasya aayi.'
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Submission Success / Pending Approval Modal Dialog */}
      {submissionNotice && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100 space-y-4 text-center animate-in zoom-in-95">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 mx-auto flex items-center justify-center shadow-xs">
              <Clock size={28} />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-gray-900">{submissionNotice.title}</h3>
              <p className="text-xs text-gray-600 leading-relaxed">{submissionNotice.message}</p>
            </div>
            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-[11px] text-amber-900 text-left leading-relaxed">
              ℹ️ <strong>Admin Review Policy:</strong> Store Name, GSTIN, Helpline Phone aur Warehouse Address jaise credentials admin verification ke baad hi update hote hain taaki tax compliance aur customer safety bani rahe.
            </div>
            <button
              type="button"
              onClick={() => setSubmissionNotice(null)}
              className="w-full py-2.5 bg-teal-800 hover:bg-teal-900 text-white font-extrabold rounded-xl text-xs cursor-pointer shadow-xs transition-colors"
            >
              Theek Hai, Samajh Gaya (OK)
            </button>
          </div>
        </div>
      )}

      {/* Top Header */}
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

      {/* Prominent Pending Admin Review Alert Banner */}
      {settings?.pendingUpdates && (
        <div className="bg-amber-50 border-2 border-amber-300 p-4 rounded-2xl flex items-start gap-3.5 text-amber-950 shadow-xs animate-in fade-in">
          <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 text-amber-700">
            <Clock size={20} />
          </div>
          <div className="space-y-1 text-xs">
            <div className="font-extrabold text-sm flex items-center gap-2">
              <span>Profile Badlav Admin Approval Ke Liye Pending Hain</span>
              <span className="text-[10px] bg-amber-200 text-amber-900 font-extrabold px-2 py-0.5 rounded-full uppercase">Pending Review</span>
            </div>
            <p className="text-amber-800 leading-relaxed">
              Aapke dwara submit kiye gaye profile aur store details Admin Portal par verification ke liye bhej diye gaye hain. Admin verify karke jaise hi approve karenge, ye badlav turant live store par reflect ho jayenge.
            </p>
            {settings.pendingUpdates?.submittedAt && (
              <div className="text-[11px] text-amber-700 font-mono mt-1">
                Submitted on: {new Date(settings.pendingUpdates.submittedAt).toLocaleString('en-IN')}
              </div>
            )}
          </div>
        </div>
      )}

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

        {/* Danger Zone: Reset / Purge Data */}
        <div className="bg-rose-50 p-6 rounded-2xl border border-rose-200 space-y-3 text-xs">
          <h3 className="font-extrabold text-rose-950 text-sm flex items-center gap-2">
            <FileText className="text-rose-600" size={18} /> Danger Zone: Delete All Seller Panel Data
          </h3>
          <p className="text-rose-800 text-xs">
            Wipe all cached products, customer orders, promotions, reviews, and registered store data from the Seller Panel.
          </p>
          <button
            type="button"
            onClick={() => {
              if (window.confirm('⚠️ Are you sure you want to delete all Seller Panel data? This action cannot be undone.')) {
                clearAllSellerData();
              }
            }}
            className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer"
          >
            Purge & Delete All Seller Data
          </button>
        </div>

        {/* Save Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
          {savedSuccess ? (
            <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5 animate-in fade-in">
              <CheckCircle2 size={16} /> Store settings updated and persisted successfully!
            </span>
          ) : settings?.pendingUpdates ? (
            <span className="text-xs font-semibold text-amber-800 flex items-center gap-1.5">
              <Clock size={15} className="text-amber-600" /> Previous update request is currently under review by Admin.
            </span>
          ) : (
            <span className="text-xs text-gray-500">
              Note: Changes to Store Name, GSTIN, Phone & Address will be submitted to Admin for approval.
            </span>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2.5 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer ml-auto"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Submitting for Review...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>Save & Submit for Approval</span>
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
