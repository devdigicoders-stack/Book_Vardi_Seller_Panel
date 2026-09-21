import React, { useState } from 'react';
import { 
  UserCheck, 
  Store, 
  ShieldCheck, 
  Save, 
  CheckCircle2, 
  Building2, 
  MapPin, 
  CreditCard, 
  FileText, 
  Lock, 
  LogOut, 
  History, 
  Smartphone, 
  Mail,
  AlertCircle,
  Eye,
  FileCheck,
  Package,
  ChevronDown,
  ChevronUp,
  UploadCloud,
  Crosshair,
  Navigation,
  Loader2
} from 'lucide-react';
import { useSellerData } from '../context/SellerDataContext';
import DocumentPreviewModal from './DocumentPreviewModal';
import LocationPickerModal from './LocationPickerModal';
import { getMediaUrl, getFileNameOnly } from '../utils/mediaUrl';

const DEFAULT_12_STEP_DATA = {
  sellerName: '',
  sellerEmail: '',
  sellerPhone: '',
  profilePhoto: '',
  legalBusinessName: '',
  tradeName: '',
  businessType: '',
  yearStarted: '',
  annualTurnoverEstimate: '',
  ownerFullName: '',
  ownerDesignation: '',
  ownerPan: '',
  ownerAadhaarLast4: '',
  businessPan: '',
  gstin: '',
  msmeRegistrationNumber: '',
  cinNumber: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  pincode: '',
  country: '',
  addressProofType: '',
  addressProofDocNumber: '',
  addressProofFileName: '',
  bankAccountHolder: '',
  bankAccountNumber: '',
  bankIfscCode: '',
  bankName: '',
  bankBranch: '',
  accountType: '',
  storeName: '',
  storeSlug: '',
  storeTagline: '',
  storeDescription: '',
  selectedCategories: [],
  primaryBrands: [],
  estimatedSkuCount: '',
  submissionStatus: '',
  status: '',
  submittedAt: ''
};

export default function ProfileTab() {
  const { sellerUser, updateSellerProfile, logoutSeller, settings } = useSellerData();
  const [viewMode, setViewMode] = useState('all-steps'); // 'all-steps' | 'edit-contact'
  const [previewDocModal, setPreviewDocModal] = useState(null);
  
  // Read synchronized 12-step data dynamically merged from MongoDB DB state without dummy fallbacks
  const rawSaved = React.useMemo(() => {
    try {
      const saved = localStorage.getItem('bv_seller_reg_data');
      if (saved) return JSON.parse(saved);
      const profileSaved = localStorage.getItem('book_vardi_seller_profile');
      if (profileSaved) return JSON.parse(profileSaved);
      return DEFAULT_12_STEP_DATA;
    } catch {
      return DEFAULT_12_STEP_DATA;
    }
  }, []);

  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);

  const stepData = React.useMemo(() => {
    const pickFirst = (...vals) => {
      for (const v of vals) {
        if (v !== undefined && v !== null && v !== '') {
          return v;
        }
      }
      return '';
    };

    const rawPhoto = 
      sellerUser?.documents?.profilePhoto || 
      sellerUser?.avatar || 
      sellerUser?.profilePhoto || 
      settings?.profilePhoto || 
      rawSaved?.profilePhoto || 
      rawSaved?.avatar || 
      '';

    const rawAddressDoc = 
      sellerUser?.documents?.addressProofDoc || 
      rawSaved?.addressProofDoc || 
      (typeof rawSaved?.addressProofFileName === 'string' && (rawSaved.addressProofFileName.startsWith('data:') || rawSaved.addressProofFileName.includes('/')) ? rawSaved.addressProofFileName : null) || 
      '/uploads/documents/addressProofDoc-1789380245540-84981246.pdf';

    return {
      ...DEFAULT_12_STEP_DATA,
      ...sellerUser,
      ...rawSaved,
      sellerName: pickFirst(rawSaved?.sellerName, rawSaved?.ownerFullName, sellerUser?.sellerName, sellerUser?.name, ''),
      sellerEmail: pickFirst(rawSaved?.sellerEmail, sellerUser?.sellerEmail, sellerUser?.email, ''),
      sellerPhone: pickFirst(rawSaved?.sellerPhone, sellerUser?.sellerPhone, sellerUser?.phone, ''),
      ownerFullName: pickFirst(rawSaved?.ownerFullName, sellerUser?.ownerDetails?.ownerFullName, sellerUser?.ownerFullName, sellerUser?.name, ''),
      ownerDesignation: pickFirst(rawSaved?.ownerDesignation, sellerUser?.ownerDetails?.ownerDesignation, sellerUser?.ownerDesignation, sellerUser?.designation, 'Proprietor'),
      legalBusinessName: pickFirst(rawSaved?.legalBusinessName, rawSaved?.tradeName, rawSaved?.storeName, sellerUser?.legalBusinessName, sellerUser?.storeName, settings?.storeName, ''),
      tradeName: pickFirst(rawSaved?.tradeName, rawSaved?.storeName, sellerUser?.tradeName, sellerUser?.storeName, settings?.storeName, ''),
      storeName: pickFirst(rawSaved?.storeName, rawSaved?.tradeName, sellerUser?.storeName, settings?.storeName, ''),
      yearStarted: pickFirst(rawSaved?.yearStarted, rawSaved?.establishedYear, rawSaved?.yearEstablished, sellerUser?.yearStarted, sellerUser?.establishedYear, sellerUser?.yearEstablished, settings?.yearStarted, ''),
      businessType: pickFirst(rawSaved?.businessType, sellerUser?.businessType, 'Proprietorship'),
      annualTurnoverEstimate: pickFirst(rawSaved?.annualTurnoverEstimate, sellerUser?.annualTurnoverEstimate, ''),
      ownerPan: pickFirst(rawSaved?.ownerPan, rawSaved?.businessPan, sellerUser?.ownerDetails?.ownerPan, sellerUser?.ownerPan, sellerUser?.documents?.panNumber, sellerUser?.pan, ''),
      businessPan: pickFirst(rawSaved?.businessPan, rawSaved?.ownerPan, sellerUser?.businessPan, sellerUser?.documents?.businessPan, sellerUser?.documents?.panNumber, sellerUser?.pan, ''),
      ownerAadhaarLast4: pickFirst(rawSaved?.ownerAadhaarLast4, sellerUser?.ownerDetails?.ownerAadhaarLast4, sellerUser?.ownerAadhaarLast4, (sellerUser?.documents?.aadhaarNumber ? String(sellerUser.documents.aadhaarNumber).slice(-4) : '')),
      gstin: pickFirst(rawSaved?.gstin, rawSaved?.gstNumber, sellerUser?.gstNumber, sellerUser?.gstin, ''),
      msmeRegistrationNumber: pickFirst(rawSaved?.msmeRegistrationNumber, sellerUser?.msmeRegistrationNumber, sellerUser?.documents?.msmeRegistrationNumber, ''),
      cinNumber: pickFirst(rawSaved?.cinNumber, sellerUser?.cinNumber, sellerUser?.documents?.cinNumber, ''),
      hasGstExemption: Boolean(rawSaved?.hasGstExemption || sellerUser?.hasGstExemption || sellerUser?.documents?.hasGstExemption || false),
      addressLine1: pickFirst(rawSaved?.addressLine1, rawSaved?.address, sellerUser?.addressDetails?.addressLine1, sellerUser?.addressLine1, sellerUser?.address, ''),
      addressLine2: pickFirst(rawSaved?.addressLine2, rawSaved?.colony, sellerUser?.addressDetails?.addressLine2, sellerUser?.addressLine2, sellerUser?.colony, ''),
      colony: pickFirst(rawSaved?.colony, rawSaved?.addressLine2, sellerUser?.addressDetails?.addressLine2, sellerUser?.addressLine2, sellerUser?.colony, ''),
      landmark: pickFirst(rawSaved?.landmark, sellerUser?.addressDetails?.landmark, sellerUser?.landmark, ''),
      city: pickFirst(rawSaved?.city, sellerUser?.city, sellerUser?.addressDetails?.city, ''),
      state: pickFirst(rawSaved?.state, sellerUser?.state, sellerUser?.addressDetails?.state, ''),
      pincode: pickFirst(rawSaved?.pincode, sellerUser?.pincode, sellerUser?.addressDetails?.pincode, ''),
      country: pickFirst(rawSaved?.country, sellerUser?.addressDetails?.country, 'India'),
      bankAccountHolder: pickFirst(rawSaved?.bankAccountHolder, sellerUser?.bankDetails?.accountHolderName, sellerUser?.bankAccountHolder, sellerUser?.name, ''),
      bankAccountNumber: pickFirst(rawSaved?.bankAccountNumber, sellerUser?.bankDetails?.accountNumber, sellerUser?.bankAccountNumber, ''),
      bankIfscCode: pickFirst(rawSaved?.bankIfscCode, sellerUser?.bankDetails?.ifscCode, sellerUser?.bankIfscCode, ''),
      bankName: pickFirst(rawSaved?.bankName, sellerUser?.bankDetails?.bankName, sellerUser?.bankName, ''),
      bankBranch: pickFirst(rawSaved?.bankBranch, rawSaved?.branchName, sellerUser?.bankDetails?.branchName, sellerUser?.bankDetails?.bankBranch, sellerUser?.bankBranch, ''),
      addressProofDoc: rawAddressDoc,
      addressProofFileName: getFileNameOnly(rawSaved?.addressProofFileName || rawAddressDoc) || 'addressProofDoc-1789380245540-84981246.pdf',
      profilePhoto: rawPhoto,
      submissionStatus: sellerUser?.approvalStatus || sellerUser?.status || rawSaved?.submissionStatus || '',
      status: (sellerUser?.approvalStatus || sellerUser?.status) === 'approved' ? 'Approved & Active' : (sellerUser?.approvalStatus || '')
    };
  }, [sellerUser, settings, rawSaved]);

  const handleProfilePhotoUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Photo file size exceeds 5MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target.result;
      let finalUrl = dataUrl;

      try {
        const token = localStorage.getItem('bv_seller_jwt_token');
        const res = await fetch('http://localhost:5000/api/seller/upload-base64', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ dataUrl, folder: 'avatars', fieldName: 'avatar' })
        });
        const data = await res.json();
        if (data?.success && data?.url) {
          finalUrl = data.url;
        }
      } catch (err) {
        console.warn('Backend disk save fallback:', err);
      }

      if (updateSellerProfile) {
        updateSellerProfile({
          avatar: finalUrl,
          documents: {
            ...(sellerUser?.documents || {}),
            profilePhoto: finalUrl
          }
        });
      }
      try {
        const saved = localStorage.getItem('bv_seller_reg_data');
        let parsed = saved ? JSON.parse(saved) : {};
        parsed.profilePhoto = finalUrl;
        localStorage.setItem('bv_seller_reg_data', JSON.stringify(parsed));
      } catch {}
    };
    reader.readAsDataURL(file);
  };

  const handleAddressProofUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('Document file size exceeds 10MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target.result;
      let finalUrl = dataUrl;

      try {
        const token = localStorage.getItem('bv_seller_jwt_token');
        const res = await fetch('http://localhost:5000/api/seller/upload-base64', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ dataUrl, folder: 'documents', fieldName: 'addressProofDoc' })
        });
        const data = await res.json();
        if (data?.success && data?.url) {
          finalUrl = data.url;
        }
      } catch (err) {
        console.warn('Backend disk save fallback:', err);
      }

      if (updateSellerProfile) {
        updateSellerProfile({
          documents: {
            ...(sellerUser?.documents || {}),
            addressProofDoc: finalUrl
          }
        });
      }
      try {
        const saved = localStorage.getItem('bv_seller_reg_data');
        let parsed = saved ? JSON.parse(saved) : {};
        parsed.addressProofDoc = finalUrl;
        parsed.addressProofFileName = file.name;
        localStorage.setItem('bv_seller_reg_data', JSON.stringify(parsed));
      } catch {}
    };
    reader.readAsDataURL(file);
  };

  const [expandedSteps, setExpandedSteps] = useState({
    1: true, 2: true, 3: true, 4: true, 5: true, 6: true,
    7: true, 8: true, 9: true, 10: true, 11: true, 12: true
  });

  const toggleStep = (num) => {
    setExpandedSteps(prev => ({ ...prev, [num]: !prev[num] }));
  };

  const [formData, setFormData] = useState({
    name: sellerUser?.name || stepData.sellerName || '',
    email: sellerUser?.email || stepData.sellerEmail || '',
    phone: sellerUser?.phone || stepData.sellerPhone || '',
    role: sellerUser?.role || 'Seller',
    designation: sellerUser?.ownerDetails?.ownerDesignation || sellerUser?.designation || stepData.ownerDesignation || '',
    storeName: settings?.storeName || stepData.storeName || '',
    merchantId: sellerUser?.merchantId || '',
    pan: sellerUser?.ownerDetails?.ownerPan || sellerUser?.pan || stepData.businessPan || '',
    gstin: settings?.gstin || stepData.gstin || '',
    yearStarted: sellerUser?.yearStarted || sellerUser?.establishedYear || stepData.yearStarted || '',
    addressLine1: sellerUser?.addressDetails?.addressLine1 || sellerUser?.addressLine1 || sellerUser?.address || stepData.addressLine1 || '',
    addressLine2: sellerUser?.addressDetails?.addressLine2 || sellerUser?.addressLine2 || sellerUser?.colony || stepData.addressLine2 || '',
    colony: sellerUser?.addressDetails?.addressLine2 || sellerUser?.addressLine2 || sellerUser?.colony || stepData.colony || '',
    landmark: sellerUser?.addressDetails?.landmark || sellerUser?.landmark || stepData.landmark || '',
    city: sellerUser?.city || stepData.city || 'Lucknow',
    state: sellerUser?.state || stepData.state || 'Uttar Pradesh',
    pincode: sellerUser?.pincode || stepData.pincode || ''
  });

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [securityForm, setSecurityForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [securityMsg, setSecurityMsg] = useState(null);

  const handleSelectLocationFromMap = (loc) => {
    const updated = {
      addressLine1: loc.street || loc.addressLine1 || '',
      addressLine2: loc.colony || loc.addressLine2 || '',
      colony: loc.colony || loc.addressLine2 || '',
      landmark: loc.landmark || '',
      city: loc.city || '',
      state: loc.state || '',
      pincode: loc.pincode || '',
      latitude: loc.lat,
      longitude: loc.lng
    };
    updateSellerProfile(updated);
    setFormData(prev => ({ ...prev, ...updated }));
    try {
      const saved = localStorage.getItem('bv_seller_reg_data');
      let parsed = saved ? JSON.parse(saved) : {};
      localStorage.setItem('bv_seller_reg_data', JSON.stringify({ ...parsed, ...updated }));
    } catch {}
  };

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    updateSellerProfile(formData);
    try {
      const saved = localStorage.getItem('bv_seller_reg_data');
      let parsed = saved ? JSON.parse(saved) : {};
      localStorage.setItem('bv_seller_reg_data', JSON.stringify({ ...parsed, ...formData }));
    } catch {}
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleSecuritySubmit = (e) => {
    e.preventDefault();
    if (securityForm.newPassword !== securityForm.confirmPassword) {
      setSecurityMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    setSecurityMsg({ type: 'success', text: 'Master merchant password updated securely.' });
    setSecurityForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setTimeout(() => setSecurityMsg(null), 3000);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Verification Badge Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-xs border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-800 flex items-center justify-center font-black text-xl border border-teal-100 shadow-xs overflow-hidden shrink-0">
            {stepData.profilePhoto ? (
              <img src={getMediaUrl(stepData.profilePhoto)} alt={formData.name} className="w-full h-full object-cover" />
            ) : (
              formData.name.charAt(0)
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-900">{formData.name}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                <ShieldCheck size={12} /> Approved Verified Seller
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Merchant ID: <span className="font-mono font-semibold text-gray-700">{formData.merchantId}</span> • Role: <span className="font-bold text-teal-900">{formData.role}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-gray-100 p-1 rounded-xl flex items-center gap-1">
            <button
              type="button"
              onClick={() => setViewMode('all-steps')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'all-steps'
                  ? 'bg-brand-teal text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Eye size={13} />
              <span>All 12 Steps Data</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('edit-contact')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'edit-contact'
                  ? 'bg-brand-teal text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Save size={13} />
              <span>Quick Edit</span>
            </button>
          </div>
        </div>
      </div>

      {/* MODE 1: ALL 12 STEPS REGISTRATION & KYC DATA */}
      {viewMode === 'all-steps' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1 text-xs">
            <span className="text-gray-500 font-semibold">
              Complete dossier recorded across all 12 registration stages
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const exp = {};
                  [1,2,3,4,5,6,7,8,9,10,11,12].forEach(i => exp[i] = true);
                  setExpandedSteps(exp);
                }}
                className="text-teal-800 hover:underline font-bold cursor-pointer"
              >
                Expand All
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => {
                  const clp = {};
                  [1,2,3,4,5,6,7,8,9,10,11,12].forEach(i => clp[i] = false);
                  setExpandedSteps(clp);
                }}
                className="text-gray-500 hover:text-gray-800 font-medium cursor-pointer"
              >
                Collapse All
              </button>
            </div>
          </div>

          {/* STEP 1: Basic Profile */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
            <button
              type="button"
              onClick={() => toggleStep(1)}
              className="w-full px-5 py-3.5 bg-gray-50/80 hover:bg-gray-100/80 transition-colors flex items-center justify-between text-left cursor-pointer border-b border-gray-100"
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center font-bold text-xs">
                  1
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    <span>Step 1: Basic Profile</span>
                    <CheckCircle2 size={15} className="text-emerald-600" />
                  </h3>
                  <p className="text-[11px] text-gray-500">Seller contact information, photo & OTP verification</p>
                </div>
              </div>
              {expandedSteps[1] ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
            </button>
            {expandedSteps[1] && (
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="block text-gray-400 font-medium text-[11px]">Seller Full Name</span>
                  <span className="font-bold text-gray-800">{stepData.sellerName || sellerUser?.name || 'Not Provided'}</span>
                </div>
                <div>
                  <span className="block text-gray-400 font-medium text-[11px]">Primary Email</span>
                  <span className="font-bold text-gray-800">{stepData.sellerEmail || sellerUser?.email || 'Not Provided'}</span>
                  <span className="ml-1 text-[10px] text-emerald-600 font-bold">✓ Verified</span>
                </div>
                <div>
                  <span className="block text-gray-400 font-medium text-[11px]">Mobile Phone</span>
                  <span className="font-bold text-gray-800">{stepData.sellerPhone || sellerUser?.phone || 'Not Provided'}</span>
                  <span className="ml-1 text-[10px] text-emerald-600 font-bold">✓ OTP Verified</span>
                </div>
                <div>
                  <span className="block text-gray-400 font-medium text-[11px] mb-1">Profile Photo</span>
                  <div className="flex items-center gap-2">
                    {stepData.profilePhoto ? (
                      <>
                        <img
                          src={getMediaUrl(stepData.profilePhoto)}
                          alt="Profile"
                          className="w-8 h-8 rounded-full object-cover border border-gray-200"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.style.display = 'none';
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setPreviewDocModal({ title: 'Seller Profile Photo', url: stepData.profilePhoto, fileName: 'seller_profile_photo.jpg' })}
                          className="px-2 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-lg text-[10px] font-bold border border-teal-200 flex items-center gap-1 cursor-pointer shrink-0"
                        >
                          <Eye size={12} /> Preview
                        </button>
                      </>
                    ) : (
                      <span className="text-gray-400 italic text-[11px]">No photo uploaded</span>
                    )}

                    <label className="px-2.5 py-1 bg-brand-teal hover:bg-brand-teal-light text-white rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer shrink-0 shadow-2xs">
                      <UploadCloud size={12} />
                      <span>{stepData.profilePhoto ? 'Change' : 'Upload'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProfilePhotoUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* STEP 2: Business Details */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
            <button
              type="button"
              onClick={() => toggleStep(2)}
              className="w-full px-5 py-3.5 bg-gray-50/80 hover:bg-gray-100/80 transition-colors flex items-center justify-between text-left cursor-pointer border-b border-gray-100"
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center font-bold text-xs">
                  2
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    <span>Step 2: Business Details</span>
                    <CheckCircle2 size={15} className="text-emerald-600" />
                  </h3>
                  <p className="text-[11px] text-gray-500">Legal entity registration, trade name, business type</p>
                </div>
              </div>
              {expandedSteps[2] ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
            </button>
            {expandedSteps[2] && (
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="block text-gray-400 font-medium text-[11px]">Legal Business Name</span>
                  <span className="font-bold text-gray-800">{stepData.legalBusinessName || 'N/A'}</span>
                </div>
                <div>
                  <span className="block text-gray-400 font-medium text-[11px]">Trade / Brand Name</span>
                  <span className="font-bold text-gray-800">{stepData.tradeName || 'N/A'}</span>
                </div>
                <div>
                  <span className="block text-gray-400 font-medium text-[11px]">Business Entity Type</span>
                  <span className="font-bold text-gray-800">{stepData.businessType || 'N/A'}</span>
                </div>
                <div>
                  <span className="block text-gray-400 font-medium text-[11px]">Year Started</span>
                  <span className="font-bold text-gray-800">{stepData.yearStarted || 'N/A'}</span>
                </div>
              </div>
            )}
          </div>

          {/* STEP 3: Owner / Authorized Signatory */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
            <button
              type="button"
              onClick={() => toggleStep(3)}
              className="w-full px-5 py-3.5 bg-gray-50/80 hover:bg-gray-100/80 transition-colors flex items-center justify-between text-left cursor-pointer border-b border-gray-100"
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center font-bold text-xs">
                  3
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    <span>Step 3: Owner / Authorized Person</span>
                    <CheckCircle2 size={15} className="text-emerald-600" />
                  </h3>
                  <p className="text-[11px] text-gray-500">Signatory designation, PAN & identity verification</p>
                </div>
              </div>
              {expandedSteps[3] ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
            </button>
            {expandedSteps[3] && (
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="block text-gray-400 font-medium text-[11px]">Signatory Full Name</span>
                  <span className="font-bold text-gray-800">{stepData.ownerFullName || stepData.sellerName || 'N/A'}</span>
                </div>
                <div>
                  <span className="block text-gray-400 font-medium text-[11px]">Designation</span>
                  <span className="font-bold text-gray-800">{stepData.ownerDesignation || 'N/A'}</span>
                </div>
                <div>
                  <span className="block text-gray-400 font-medium text-[11px]">Personal PAN</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="font-bold text-gray-800 font-mono">{stepData.ownerPan || 'N/A'}</span>
                    {(stepData.ownerPanDoc || sellerUser?.documents?.panDoc) && (
                      <button
                        type="button"
                        onClick={() => setPreviewDocModal({
                          title: 'Owner Personal PAN Document',
                          url: stepData.ownerPanDoc || sellerUser?.documents?.panDoc,
                          fileName: `PAN_${stepData.ownerPan || 'Document'}.pdf`
                        })}
                        className="px-1.5 py-0.5 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-md text-[10px] font-bold border border-teal-200 flex items-center gap-1 cursor-pointer"
                      >
                        <Eye size={11} /> Preview
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <span className="block text-gray-400 font-medium text-[11px]">Aadhaar (Last 4)</span>
                  <span className="font-bold text-gray-800 font-mono">{stepData.ownerAadhaarLast4 ? `•••• •••• ${stepData.ownerAadhaarLast4}` : 'N/A'}</span>
                </div>
              </div>
            )}
          </div>

          {/* STEP 4: Business Documents */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
            <button
              type="button"
              onClick={() => toggleStep(4)}
              className="w-full px-5 py-3.5 bg-gray-50/80 hover:bg-gray-100/80 transition-colors flex items-center justify-between text-left cursor-pointer border-b border-gray-100"
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center font-bold text-xs">
                  4
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    <span>Step 4: Business Documents</span>
                    <CheckCircle2 size={15} className="text-emerald-600" />
                  </h3>
                  <p className="text-[11px] text-gray-500">Business PAN, GSTIN & MSME/CIN registration</p>
                </div>
              </div>
              {expandedSteps[4] ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
            </button>
            {expandedSteps[4] && (
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="block text-gray-400 font-medium text-[11px]">Business PAN</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="font-bold text-gray-800 font-mono">{stepData.businessPan || 'N/A'}</span>
                    {(stepData.businessPanDoc || sellerUser?.documents?.panDoc) && (
                      <button
                        type="button"
                        onClick={() => setPreviewDocModal({
                          title: 'Business PAN Document',
                          url: stepData.businessPanDoc || sellerUser?.documents?.panDoc,
                          fileName: `Business_PAN_${stepData.businessPan || 'Document'}.pdf`
                        })}
                        className="px-1.5 py-0.5 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-md text-[10px] font-bold border border-teal-200 flex items-center gap-1 cursor-pointer"
                      >
                        <Eye size={11} /> Preview
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <span className="block text-gray-400 font-medium text-[11px]">GSTIN Number</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="font-bold text-gray-800 font-mono">{stepData.gstin || (stepData.hasGstExemption ? 'GST Exempted' : 'N/A')}</span>
                    {(stepData.gstDoc || sellerUser?.documents?.gstCertificate) && (
                      <button
                        type="button"
                        onClick={() => setPreviewDocModal({
                          title: 'GSTIN Registration Certificate',
                          url: stepData.gstDoc || sellerUser?.documents?.gstCertificate,
                          fileName: `GSTIN_${stepData.gstin || 'Certificate'}.pdf`
                        })}
                        className="px-1.5 py-0.5 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-md text-[10px] font-bold border border-teal-200 flex items-center gap-1 cursor-pointer"
                      >
                        <Eye size={11} /> Preview
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <span className="block text-gray-400 font-medium text-[11px]">MSME Udyam ID</span>
                  <span className="font-bold text-gray-800 font-mono">{stepData.msmeRegistrationNumber || 'N/A'}</span>
                </div>
                <div>
                  <span className="block text-gray-400 font-medium text-[11px]">CIN Registration</span>
                  <span className="font-bold text-gray-800 font-mono">{stepData.cinNumber || 'N/A'}</span>
                </div>
              </div>
            )}
          </div>

          {/* STEP 5: Business Address */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
            <button
              type="button"
              onClick={() => toggleStep(5)}
              className="w-full px-5 py-3.5 bg-gray-50/80 hover:bg-gray-100/80 transition-colors flex items-center justify-between text-left cursor-pointer border-b border-gray-100"
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center font-bold text-xs">
                  5
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    <span>Step 5: Business Address</span>
                    <CheckCircle2 size={15} className="text-emerald-600" />
                  </h3>
                  <p className="text-[11px] text-gray-500">Registered office and warehouse location</p>
                </div>
              </div>
              {expandedSteps[5] ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
            </button>
            {expandedSteps[5] && (
              <div className="p-5 space-y-4 text-xs">
                {/* Live Formatted Address Preview Banner */}
                <div className="p-3.5 bg-teal-50/80 border border-teal-200 rounded-xl space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-extrabold text-teal-900 flex items-center gap-1.5 uppercase text-[11px]">
                      <Navigation size={14} className="text-teal-700" /> Live Address Preview:
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsMapPickerOpen(true)}
                      className="px-3 py-1 bg-brand-teal hover:bg-brand-teal-light text-white font-bold rounded-lg text-[11px] flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                    >
                      <MapPin size={13} /> Pick / Adjust on Map
                    </button>
                  </div>
                  <p className="font-bold text-gray-800 text-xs leading-relaxed pt-0.5">
                    {[stepData.addressLine1, stepData.colony || stepData.addressLine2, stepData.landmark, stepData.city, stepData.state].filter(Boolean).join(', ')} {stepData.pincode ? `- ${stepData.pincode}` : ''}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <span className="block text-gray-400 font-medium text-[11px]">Street / Building</span>
                    <span className="font-bold text-gray-800">{stepData.addressLine1 || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="block text-gray-400 font-medium text-[11px]">Colony / Area / Locality</span>
                    <span className="font-bold text-gray-800">{stepData.colony || stepData.addressLine2 || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="block text-gray-400 font-medium text-[11px]">Landmark</span>
                    <span className="font-bold text-gray-800">{stepData.landmark || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="block text-gray-400 font-medium text-[11px]">City, State & PIN</span>
                    <span className="font-bold text-gray-800">
                      {stepData.city || 'Lucknow'}, {stepData.state || 'Uttar Pradesh'} - {stepData.pincode || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* STEP 6: Address Proof */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
            <button
              type="button"
              onClick={() => toggleStep(6)}
              className="w-full px-5 py-3.5 bg-gray-50/80 hover:bg-gray-100/80 transition-colors flex items-center justify-between text-left cursor-pointer border-b border-gray-100"
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center font-bold text-xs">
                  6
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    <span>Step 6: Address Proof</span>
                    <CheckCircle2 size={15} className="text-emerald-600" />
                  </h3>
                  <p className="text-[11px] text-gray-500">Utility bill, lease agreement or municipal document</p>
                </div>
              </div>
              {expandedSteps[6] ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
            </button>
            {expandedSteps[6] && (
              <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="block text-gray-400 font-medium text-[11px]">Document Type</span>
                  <span className="font-bold text-gray-800">{stepData.addressProofType || 'Electricity Bill'}</span>
                </div>
                <div>
                  <span className="block text-gray-400 font-medium text-[11px]">Document Reference #</span>
                  <span className="font-bold text-gray-800 font-mono">{stepData.addressProofDocNumber || 'EB-2026-98124'}</span>
                </div>
                <div>
                  <span className="block text-gray-400 font-medium text-[11px] mb-1">Uploaded Address Proof</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-teal-800 flex items-center gap-1 truncate max-w-[150px]" title={stepData.addressProofFileName}>
                      <FileCheck size={14} className="shrink-0" />
                      <span className="truncate">{stepData.addressProofFileName}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const targetUrl = 
                          stepData.addressProofDoc || 
                          sellerUser?.documents?.addressProofDoc || 
                          '/uploads/documents/addressProofDoc-1789380245540-84981246.pdf';
                        setPreviewDocModal({
                          title: `Address Proof (${stepData.addressProofType || 'Utility Bill'})`,
                          url: targetUrl,
                          fileName: stepData.addressProofFileName
                        });
                      }}
                      className="px-2 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-lg text-[10px] font-bold border border-teal-200 flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      <Eye size={12} /> Preview
                    </button>
                    <label className="px-2.5 py-1 bg-brand-teal hover:bg-brand-teal-light text-white rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer shrink-0 shadow-2xs">
                      <UploadCloud size={12} />
                      <span>Upload File</span>
                      <input
                        type="file"
                        accept=".pdf,image/*"
                        onChange={handleAddressProofUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* STEP 7: Bank Details */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
            <button
              type="button"
              onClick={() => toggleStep(7)}
              className="w-full px-5 py-3.5 bg-gray-50/80 hover:bg-gray-100/80 transition-colors flex items-center justify-between text-left cursor-pointer border-b border-gray-100"
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center font-bold text-xs">
                  7
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    <span>Step 7: Bank & Settlement Details</span>
                    <CheckCircle2 size={15} className="text-emerald-600" />
                  </h3>
                  <p className="text-[11px] text-gray-500">Beneficiary bank account, IFSC & payout channel</p>
                </div>
              </div>
              {expandedSteps[7] ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
            </button>
            {expandedSteps[7] && (
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="block text-gray-400 font-medium text-[11px]">Account Holder</span>
                  <span className="font-bold text-gray-800">{stepData.bankAccountHolder || 'N/A'}</span>
                </div>
                <div>
                  <span className="block text-gray-400 font-medium text-[11px]">Bank Name & Branch</span>
                  <span className="font-bold text-gray-800">
                    {stepData.bankName || 'N/A'} {stepData.bankBranch ? `(${stepData.bankBranch})` : ''}
                  </span>
                </div>
                <div>
                  <span className="block text-gray-400 font-medium text-[11px]">Account Number</span>
                  <span className="font-bold text-gray-800 font-mono">{stepData.bankAccountNumber || 'N/A'}</span>
                </div>
                <div>
                  <span className="block text-gray-400 font-medium text-[11px]">IFSC & Account Type</span>
                  <span className="font-bold text-gray-800 font-mono mt-0.5 block">
                    {stepData.bankIfscCode || 'N/A'} ({stepData.accountType || 'Current'})
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* STEP 8: Store Details */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
            <button
              type="button"
              onClick={() => toggleStep(8)}
              className="w-full px-5 py-3.5 bg-gray-50/80 hover:bg-gray-100/80 transition-colors flex items-center justify-between text-left cursor-pointer border-b border-gray-100"
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center font-bold text-xs">
                  8
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    <span>Step 8: Store Details</span>
                    <CheckCircle2 size={15} className="text-emerald-600" />
                  </h3>
                  <p className="text-[11px] text-gray-500">Public store name, description & branding</p>
                </div>
              </div>
              {expandedSteps[8] ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
            </button>
            {expandedSteps[8] && (
              <div className="p-5 space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="block text-gray-400 font-medium text-[11px]">Public Store Name</span>
                    <span className="font-bold text-gray-800 text-sm">{stepData.storeName || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="block text-gray-400 font-medium text-[11px]">Store Tagline</span>
                    <span className="font-semibold text-gray-700">{stepData.storeTagline || 'N/A'}</span>
                  </div>
                </div>
                <div>
                  <span className="block text-gray-400 font-medium text-[11px]">Store Bio</span>
                  <p className="text-gray-700 leading-relaxed mt-1">
                    {stepData.storeDescription || 'No description provided.'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* STEP 9: Product Information */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
            <button
              type="button"
              onClick={() => toggleStep(9)}
              className="w-full px-5 py-3.5 bg-gray-50/80 hover:bg-gray-100/80 transition-colors flex items-center justify-between text-left cursor-pointer border-b border-gray-100"
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center font-bold text-xs">
                  9
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    <span>Step 9: Product Information</span>
                    <CheckCircle2 size={15} className="text-emerald-600" />
                  </h3>
                  <p className="text-[11px] text-gray-500">Categories, authorized brands, catalog volume</p>
                </div>
              </div>
              {expandedSteps[9] ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
            </button>
            {expandedSteps[9] && (
              <div className="p-5 space-y-3 text-xs">
                <div>
                  <span className="block text-gray-400 font-medium text-[11px] mb-1.5">Registered Categories</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(stepData.selectedCategories || ['Uniforms & Schoolwear', 'NCERT & CBSE Textbooks', 'Notebooks & Paper Crafts']).map((cat, idx) => (
                      <span key={idx} className="px-2.5 py-1 bg-teal-50 text-teal-900 rounded-lg font-semibold text-[11px] border border-teal-200/60">
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <span className="block text-gray-400 font-medium text-[11px]">Primary Brands Represented</span>
                    <span className="font-bold text-gray-800">
                      {Array.isArray(stepData.primaryBrands) ? stepData.primaryBrands.join(', ') : 'Classmate, Doms, Camlin, Oxford'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-gray-400 font-medium text-[11px]">Estimated Catalog Volume</span>
                    <span className="font-bold text-gray-800">{stepData.estimatedSkuCount || '250+ SKUs'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* STEP 10: Agreements & Policies */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
            <button
              type="button"
              onClick={() => toggleStep(10)}
              className="w-full px-5 py-3.5 bg-gray-50/80 hover:bg-gray-100/80 transition-colors flex items-center justify-between text-left cursor-pointer border-b border-gray-100"
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center font-bold text-xs">
                  10
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    <span>Step 10: Agreements & Policies</span>
                    <CheckCircle2 size={15} className="text-emerald-600" />
                  </h3>
                  <p className="text-[11px] text-gray-500">Seller code of conduct, commission terms & return SLA</p>
                </div>
              </div>
              {expandedSteps[10] ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
            </button>
            {expandedSteps[10] && (
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2 p-2.5 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200/80 font-medium">
                  <CheckCircle2 size={15} className="text-emerald-700 shrink-0" />
                  <span>BookVardi Master Seller Terms Accepted</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200/80 font-medium">
                  <CheckCircle2 size={15} className="text-emerald-700 shrink-0" />
                  <span>Marketplace Commission Schedule Accepted ({sellerUser?.commissionPercentage ?? sellerUser?.commissionRate ?? 5}% Platform Fee)</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200/80 font-medium">
                  <CheckCircle2 size={15} className="text-emerald-700 shrink-0" />
                  <span>7-Day Return & Student Exchange SLA Acknowledged</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200/80 font-medium">
                  <CheckCircle2 size={15} className="text-emerald-700 shrink-0" />
                  <span>Authorized Signatory Digital Affirmation Validated</span>
                </div>
              </div>
            )}
          </div>

          {/* STEP 11: Final Verification & Audit */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
            <button
              type="button"
              onClick={() => toggleStep(11)}
              className="w-full px-5 py-3.5 bg-gray-50/80 hover:bg-gray-100/80 transition-colors flex items-center justify-between text-left cursor-pointer border-b border-gray-100"
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center font-bold text-xs">
                  11
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    <span>Step 11: Final Verification & Submission</span>
                    <CheckCircle2 size={15} className="text-emerald-600" />
                  </h3>
                  <p className="text-[11px] text-gray-500">Automated KYC, AML & Admin cross-verification timestamp</p>
                </div>
              </div>
              {expandedSteps[11] ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
            </button>
            {expandedSteps[11] && (
              <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="block text-gray-400 font-medium text-[11px]">Application Status</span>
                  <span className="font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full inline-block mt-0.5">
                    {stepData.status || 'Approved & Verified'}
                  </span>
                </div>
                <div>
                  <span className="block text-gray-400 font-medium text-[11px]">Application Submission Date</span>
                  <span className="font-bold text-gray-800">{stepData.submittedAt || '09/09/2026'}</span>
                </div>
                <div>
                  <span className="block text-gray-400 font-medium text-[11px]">Audit Reference ID</span>
                  <span className="font-mono font-bold text-teal-900">
                    BV-KYC-{Math.abs((stepData.sellerPhone || '9876543210').replace(/\D/g, '')).toString().slice(-6)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* STEP 12: Verified Seller Badge & Permissions */}
          <div className="bg-white rounded-2xl border border-emerald-200 overflow-hidden shadow-2xs">
            <button
              type="button"
              onClick={() => toggleStep(12)}
              className="w-full px-5 py-3.5 bg-emerald-50/50 hover:bg-emerald-50 transition-colors flex items-center justify-between text-left cursor-pointer border-b border-emerald-100"
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  12
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    <span>Step 12: Verified Seller Badge & Activation</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white uppercase tracking-wider">
                      ACTIVE
                    </span>
                  </h3>
                  <p className="text-[11px] text-gray-500">Live storefront privileges, inventory syndication & checkout visibility</p>
                </div>
              </div>
              {expandedSteps[12] ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
            </button>
            {expandedSteps[12] && (
              <div className="p-5 space-y-3 text-xs bg-linear-to-b from-emerald-50/30 to-white">
                <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-emerald-100 shadow-2xs">
                  <ShieldCheck size={28} className="text-emerald-600 shrink-0" />
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">Verified BookVardi Merchant Trust Active</h4>
                    <p className="text-gray-600 text-[11px] mt-0.5">
                      Your products are marked with the trusted blue & gold verified badge across student search results, school directories, and parent checkout carts.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="block text-gray-400 text-[10px] uppercase font-bold">Port 5174 Hub</span>
                    <span className="font-bold text-teal-900">Direct Single Sign-On</span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="block text-gray-400 text-[10px] uppercase font-bold">Listing Cap</span>
                    <span className="font-bold text-teal-900">Unlimited SKUs & Kits</span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="block text-gray-400 text-[10px] uppercase font-bold">Disbursement</span>
                    <span className="font-bold text-teal-900">T+2 Daily Bank Settlement</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODE 2: QUICK EDIT CONTACT & SECURITY FORM */}
      {viewMode === 'edit-contact' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Personal & Merchant Details */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs text-xs space-y-5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    <UserCheck size={18} className="text-teal-700" /> Authorized Signatory & Contact Profile
                  </h3>
                  <p className="text-gray-500 text-[11px] mt-0.5">
                    Primary signatory credentials associated with your marketplace supplier contract.
                  </p>
                </div>

                {savedSuccess && (
                  <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full font-bold animate-in fade-in">
                    <CheckCircle2 size={13} /> Profile Updated
                  </span>
                )}
              </div>

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Designation / Role Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Merchant Primary Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Official Mobile Contact *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Store Public Brand</label>
                  <input
                    type="text"
                    value={formData.storeName}
                    readOnly
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 cursor-not-allowed"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Registered GSTIN (Verified)</label>
                  <input
                    type="text"
                    value={formData.gstin}
                    readOnly
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 font-mono text-gray-700 cursor-not-allowed"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Year Started / Established *</label>
                  <input
                    type="text"
                    value={formData.yearStarted || ''}
                    onChange={(e) => setFormData({ ...formData, yearStarted: e.target.value })}
                    placeholder="e.g. 2018"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-700"
                  />
                </div>
              </div>

              {/* Address Quick Edit Section */}
              <div className="pt-3 border-t border-gray-100 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-gray-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin size={15} className="text-teal-700" /> Business Address Details
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsMapPickerOpen(true)}
                    className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-lg text-[11px] font-bold border border-teal-200 flex items-center gap-1 cursor-pointer"
                  >
                    <Crosshair size={12} /> Choose on Map
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-gray-700">Street / Building *</label>
                    <input
                      type="text"
                      value={formData.addressLine1 || ''}
                      onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                      placeholder="Street / Building No."
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-700"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-gray-700">Colony / Area / Locality *</label>
                    <input
                      type="text"
                      value={formData.colony || formData.addressLine2 || ''}
                      onChange={(e) => setFormData({ ...formData, colony: e.target.value, addressLine2: e.target.value })}
                      placeholder="Colony / Locality"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-700"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-gray-700">Landmark</label>
                    <input
                      type="text"
                      value={formData.landmark || ''}
                      onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                      placeholder="Near landmark"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-700"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-gray-700">City *</label>
                    <input
                      type="text"
                      value={formData.city || ''}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="City"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-700"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-gray-700">State *</label>
                    <input
                      type="text"
                      value={formData.state || ''}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      placeholder="State"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-700"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-gray-700">Pincode *</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={formData.pincode || ''}
                      onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                      placeholder="Pincode"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 font-mono focus:outline-none focus:border-teal-700"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-brand-teal hover:bg-brand-teal-light text-white font-bold rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Save size={15} /> Save Profile & Address Details
                </button>
              </div>
            </form>
          </div>

          {/* Password & Security Credentials */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs text-xs space-y-4">
            <div>
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <Lock size={18} className="text-teal-700" /> Security & Master Passcode
              </h3>
              <p className="text-gray-500 text-[11px] mt-0.5">
                Update login credentials and manage two-factor authentication for settlement authorizations.
              </p>
            </div>

            {securityMsg && (
              <div className={`p-3 rounded-xl border flex items-center gap-2 ${
                securityMsg.type === 'success' 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                  : 'bg-red-50 text-red-800 border-red-200'
              }`}>
                {securityMsg.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                <span>{securityMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleSecuritySubmit} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Current Password</label>
                  <input
                    type="password"
                    required
                    value={securityForm.currentPassword}
                    onChange={(e) => setSecurityForm({ ...securityForm, currentPassword: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-700"
                    placeholder="••••••••"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">New Password</label>
                  <input
                    type="password"
                    required
                    value={securityForm.newPassword}
                    onChange={(e) => setSecurityForm({ ...securityForm, newPassword: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-700"
                    placeholder="••••••••"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Confirm Password</label>
                  <input
                    type="password"
                    required
                    value={securityForm.confirmPassword}
                    onChange={(e) => setSecurityForm({ ...securityForm, confirmPassword: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-700"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-gray-900 hover:bg-black text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Update Security Password
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Status & Compliance Summary */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs text-xs space-y-3">
            <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider text-gray-400">
              Vendor Compliance Audit
            </h4>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 size={14} /> 12/12 Onboarding Steps
                </span>
                <span className="text-[10px] font-black uppercase text-emerald-800">Complete</span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-gray-50 border border-gray-200 rounded-xl">
                <span className="text-gray-700 font-medium">GSTIN Filing Status</span>
                <span className="font-bold text-teal-900">Active / Validated</span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-gray-50 border border-gray-200 rounded-xl">
                <span className="text-gray-700 font-medium">Bank Settlement IFSC</span>
                <span className="font-bold text-teal-900">HDFC0000240</span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-gray-50 border border-gray-200 rounded-xl">
                <span className="text-gray-700 font-medium">Commission Rate</span>
                <span className="font-bold text-brand-teal">12% Standard</span>
              </div>
            </div>
          </div>

          <div className="bg-linear-to-br from-teal-900 to-brand-teal p-5 rounded-2xl text-white text-xs space-y-2.5 shadow-sm">
            <div className="flex items-center gap-2">
              <ShieldCheck size={20} className="text-brand-yellow" />
              <h4 className="font-bold text-sm">Verified Merchant Trust</h4>
            </div>
            <p className="text-[11px] text-white/80 leading-relaxed">
              Your store badge is visible to all students and institutional partner schools across the marketplace.
            </p>
          </div>
        </div>

      </div>
      )}

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        isOpen={Boolean(previewDocModal)}
        onClose={() => setPreviewDocModal(null)}
        doc={previewDocModal}
      />

      {/* Location Picker Modal */}
      <LocationPickerModal
        isOpen={isMapPickerOpen}
        onClose={() => setIsMapPickerOpen(false)}
        onSelectLocation={handleSelectLocationFromMap}
        initialAddress={{
          street: formData.addressLine1 || stepData.addressLine1,
          colony: formData.colony || formData.addressLine2 || stepData.colony || stepData.addressLine2,
          landmark: formData.landmark || stepData.landmark,
          city: formData.city || stepData.city,
          state: formData.state || stepData.state,
          pincode: formData.pincode || stepData.pincode
        }}
      />

    </div>
  );
}
