import React, { useState, useEffect } from 'react';
import {
  Store,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  UploadCloud,
  FileText,
  Building2,
  UserCheck,
  CreditCard,
  ShieldCheck,
  MapPin,
  FileCheck,
  Package,
  Layers,
  Sparkles,
  Phone,
  Mail,
  Lock,
  X,
  RefreshCw,
  ExternalLink,
  Eye,
  Download
} from 'lucide-react';
import { useSellerData } from '../context/SellerDataContext';
import DocumentPreviewModal from './DocumentPreviewModal';
import { getMediaUrl, getFileNameOnly } from '../utils/mediaUrl';

export const ONBOARDING_STEPS = [
  { id: 1, title: 'Basic Profile', section: 'Basic Profile', desc: 'Name, mobile, email, photo', icon: UserCheck, verify: 'Email + Mobile OTP' },
  { id: 2, title: 'Business Details', section: 'Business Details', desc: 'Legal name, trade name, year', icon: Building2, verify: 'Admin / System Review' },
  { id: 3, title: 'Owner / Signatory', section: 'Owner / Authorized Person', desc: 'PAN, identity, designation', icon: UserCheck, verify: 'KYC Verification' },
  { id: 4, title: 'Business Documents', section: 'Business Documents', desc: 'PAN, GSTIN, registrations', icon: FileText, verify: 'Document Verification' },
  { id: 5, title: 'Business Address', section: 'Business Address', desc: 'Registered address, city, PIN', icon: MapPin, verify: 'Address Verification' },
  { id: 6, title: 'Address Proof', section: 'Address Proof', desc: 'Electricity bill / rent agreement', icon: FileCheck, verify: 'Manual / System Review' },
  { id: 7, title: 'Bank Details', section: 'Bank Details', desc: 'Account number, IFSC, bank name', icon: CreditCard, verify: 'Bank Verification' },
  { id: 8, title: 'Store Details', section: 'Store Details', desc: 'Store name, logo, description', icon: Store, verify: 'Marketplace Review' },
  { id: 9, title: 'Product Information', section: 'Product Information', desc: 'Categories, brands, samples', icon: Package, verify: 'Catalog Review' },
  { id: 10, title: 'Agreements', section: 'Agreements', desc: 'Seller policy & commission acceptance', icon: FileCheck, verify: 'Seller Acceptance' },
  { id: 11, title: 'Final Verification', section: 'Final Verification', desc: 'Review all submitted information', icon: ShieldCheck, verify: 'Admin Approval' },
  { id: 12, title: 'Verified Seller', section: 'Verified Seller', desc: 'Verification badge activated', icon: CheckCircle2, verify: 'Approved & Active' }
];

export const INITIAL_FORM_STATE = {
  // Step 1: Basic Profile
  sellerName: '',
  sellerEmail: '',
  sellerPhone: '',
  profilePhoto: '',
  emailOtpVerified: false,
  phoneOtpVerified: false,

  // Step 2: Business Details
  legalBusinessName: '',
  tradeName: '',
  businessType: 'Proprietorship',
  yearStarted: '',
  annualTurnoverEstimate: '',

  // Step 3: Owner / Authorized Person
  ownerFullName: '',
  ownerDesignation: 'Proprietor',
  ownerPan: '',
  ownerAadhaarLast4: '',
  kycVerified: false,

  // Step 4: Business Documents
  businessPan: '',
  gstin: '',
  hasGstExemption: false,
  msmeRegistrationNumber: '',
  cinNumber: '',

  // Step 5: Business Address
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  pincode: '',
  country: 'India',

  // Step 6: Address Proof
  addressProofType: 'Electricity Bill',
  addressProofDocNumber: '',
  addressProofFileName: '',

  // Step 7: Bank Details
  bankAccountHolder: '',
  bankAccountNumber: '',
  bankIfscCode: '',
  bankName: '',
  bankBranch: '',
  accountType: 'Savings Account',

  // Step 8: Store Details
  storeName: '',
  storeSlug: '',
  storeTagline: '',
  storeDescription: '',
  storeLogo: '',

  // Step 9: Product Information
  selectedCategories: [],
  primaryBrands: [],
  estimatedSkuCount: '',
  sampleProductTitle: '',

  // Step 10: Agreements
  acceptedTerms: false,
  acceptedCommissionRate: false,
  acceptedReturnPolicy: false,
  authorizedSignatoryConfirmation: false,

  // Metadata
  applicationDate: new Date().toISOString(),
  currentStep: 1,
  highestStepReached: 1,
  submissionStatus: 'draft'
};

function dataURLtoBlob(dataurl, filename = 'file') {
  if (!dataurl || typeof dataurl !== 'string' || !dataurl.startsWith('data:')) return null;
  try {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  } catch {
    return null;
  }
}

export default function SellerRegistrationModal({ isOpen, onClose, isPage = false }) {
  const { 
    submitSellerApplication, 
    approveSellerApplication,
    showToast 
  } = useSellerData();

  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState(() => {
    try {
      const saved = localStorage.getItem('bv_seller_reg_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.sellerName === 'Ritesh Yadav' || parsed?.legalBusinessName === 'Vardi Education Retail Pvt Ltd') {
          localStorage.removeItem('bv_seller_reg_data');
          return INITIAL_FORM_STATE;
        }
        return parsed;
      }
      return INITIAL_FORM_STATE;
    } catch {
      return INITIAL_FORM_STATE;
    }
  });

  const [otpSent, setOtpSent] = useState(false);
  const [mobileOtp, setMobileOtp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewDocModal, setPreviewDocModal] = useState(null);

  // Step 3 PAN & Aadhaar Verification States
  const [isPanVerified, setIsPanVerified] = useState(() => {
    try {
      const saved = localStorage.getItem('bv_seller_reg_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        return Boolean(parsed.isPanVerified);
      }
    } catch {}
    return false;
  });
  const [isAadhaarVerified, setIsAadhaarVerified] = useState(() => {
    try {
      const saved = localStorage.getItem('bv_seller_reg_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        return Boolean(parsed.isAadhaarVerified);
      }
    } catch {}
    return false;
  });
  const [isVerifyingPan, setIsVerifyingPan] = useState(false);
  const [isVerifyingAadhaar, setIsVerifyingAadhaar] = useState(false);
  const [panError, setPanError] = useState('');
  const [aadhaarError, setAadhaarError] = useState('');
  const [isDraggingAddressProof, setIsDraggingAddressProof] = useState(false);
  const [isDraggingProfilePhoto, setIsDraggingProfilePhoto] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('bv_seller_reg_data', JSON.stringify({
        ...formData,
        isPanVerified,
        isAadhaarVerified
      }));
      localStorage.setItem('bv_seller_reg_step', step.toString());
    } catch (e) {
      console.error(e);
    }
  }, [formData, step, isPanVerified, isAadhaarVerified]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      highestStepReached: Math.max(prev.highestStepReached, step)
    }));

    if (field === 'ownerPan') {
      setIsPanVerified(false);
      setPanError('');
    }
    if (field === 'ownerAadhaarLast4') {
      setIsAadhaarVerified(false);
      setAadhaarError('');
    }
  };

  const handleVerifyPan = () => {
    const pan = (formData.ownerPan || '').trim().toUpperCase();
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

    if (!pan) {
      setPanError('Please enter a PAN card number');
      if (showToast) showToast('⚠️ Please enter a 10-digit PAN card number.');
      return;
    }

    if (!panRegex.test(pan)) {
      setPanError('Invalid PAN format. Example: ABCDE1234F');
      if (showToast) showToast('⚠️ Invalid PAN format. Must be 10 characters (e.g. ABCDE1234F).');
      return;
    }

    setPanError('');
    setIsVerifyingPan(true);

    setTimeout(() => {
      setIsVerifyingPan(false);
      setIsPanVerified(true);
      setFormData(prev => ({ ...prev, kycVerified: true }));
      if (showToast) showToast('✅ PAN Card verified successfully with NSDL / Income Tax records!');
    }, 700);
  };

  const handleVerifyAadhaar = () => {
    const aadhaar = (formData.ownerAadhaarLast4 || '').trim();
    const aadhaarRegex = /^(\d{4}|\d{12})$/;

    if (!aadhaar) {
      setAadhaarError('Please enter Aadhaar number (4 or 12 digits)');
      if (showToast) showToast('⚠️ Please enter Aadhaar number (last 4 digits or full 12 digits).');
      return;
    }

    if (!aadhaarRegex.test(aadhaar)) {
      setAadhaarError('Aadhaar must be either 4 digits or 12 digits');
      if (showToast) showToast('⚠️ Invalid Aadhaar number. Must contain 4 or 12 numeric digits.');
      return;
    }

    setAadhaarError('');
    setIsVerifyingAadhaar(true);

    setTimeout(() => {
      setIsVerifyingAadhaar(false);
      setIsAadhaarVerified(true);
      if (showToast) showToast('✅ Aadhaar Card verified successfully via DigiLocker / UIDAI OTP!');
    }, 700);
  };

  const handleSendMobileOtp = () => {
    const phone = (formData.sellerPhone || '').trim();
    if (!phone || phone.length < 8) {
      if (showToast) showToast('⚠️ Please enter a valid mobile number first.');
      return;
    }
    setOtpSent(true);
    setMobileOtp('123456');
    if (showToast) showToast(`📲 [Testing Mode] OTP code 123456 sent to ${phone}`);
  };

  const handleVerifyMobileOtp = () => {
    if (!mobileOtp || mobileOtp.trim().length < 4) {
      if (showToast) showToast('⚠️ Please enter the 6-digit OTP code (use 123456 for testing).');
      return;
    }
    setFormData(prev => ({
      ...prev,
      phoneOtpVerified: true,
      emailOtpVerified: true
    }));
    if (showToast) showToast('✅ Mobile number verified successfully via OTP!');
  };

  const processProfilePhotoFile = (file) => {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      if (showToast) showToast('⚠️ Image file is too large. Please select a photo under 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setFormData(prev => ({
        ...prev,
        profilePhoto: event.target.result
      }));
      if (showToast) showToast('📷 Seller profile photo uploaded successfully!');
    };
    reader.readAsDataURL(file);
  };

  const handleProfilePhotoSelect = (e) => {
    const file = e.target.files && e.target.files[0];
    processProfilePhotoFile(file);
  };

  const handleProfilePhotoDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingProfilePhoto(false);
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    processProfilePhotoFile(file);
  };

  const processAddressProofFile = (file) => {
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      if (showToast) showToast('⚠️ Document file size exceeds 10MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setFormData(prev => ({
        ...prev,
        addressProofFileName: file.name,
        addressProofDoc: event.target.result,
        addressProofFileSize: (file.size / (1024 * 1024)).toFixed(2) + ' MB'
      }));
      if (showToast) showToast(`📄 Address proof document (${file.name}) uploaded successfully!`);
    };
    reader.readAsDataURL(file);
  };

  const handleAddressProofUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    processAddressProofFile(file);
  };

  const handleAddressProofDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingAddressProof(false);
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    processAddressProofFile(file);
  };

  const nextStep = () => {
    if (step === 1) {
      if (!formData.sellerName?.trim()) {
        if (showToast) showToast('⚠️ Please enter your Full Name.');
        return;
      }
      if (!formData.sellerPhone?.trim()) {
        if (showToast) showToast('⚠️ Please enter your Mobile Phone Number.');
        return;
      }
      if (!formData.phoneOtpVerified) {
        if (showToast) showToast('⚠️ Please click "Send Phone OTP" and verify your mobile number (Testing code: 123456).');
        return;
      }
    }

    if (step === 3) {
      if (!formData.ownerPan || !isPanVerified) {
        setPanError(!formData.ownerPan ? 'PAN card number is required' : 'Verification required before moving forward');
        if (showToast) showToast('⚠️ Please click "Verify PAN" and verify your PAN Card to move to the next step.');
        return;
      }
      if (!formData.ownerAadhaarLast4 || !isAadhaarVerified) {
        setAadhaarError(!formData.ownerAadhaarLast4 ? 'Aadhaar number is required' : 'Verification required before moving forward');
        if (showToast) showToast('⚠️ Please click "Verify Aadhaar" and verify your Aadhaar Card to move to the next step.');
        return;
      }
    }

    if (step === 6) {
      if (!formData.addressProofDocNumber?.trim()) {
        if (showToast) showToast('⚠️ Please enter the Document Identifier / Consumer Number.');
        return;
      }
      if (!formData.addressProofFileName) {
        if (showToast) showToast('⚠️ Please upload an Address Proof document file.');
        return;
      }
    }

    if (step < 12) {
      const newStep = step + 1;
      setStep(newStep);
      setFormData(prev => ({ ...prev, highestStepReached: Math.max(prev.highestStepReached, newStep) }));
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);

    if (submitSellerApplication) {
      submitSellerApplication({
        ...formData,
        status: 'pending',
        submissionStatus: 'pending',
        submittedAt: new Date().toLocaleDateString()
      });
    }

    setIsSubmitting(false);
    setStep(11);
    if (showToast) showToast('🎉 Seller Registration Application Submitted! Pending Admin Approval.');
  };

  const handleSimulateApproval = () => {
    if (approveSellerApplication) {
      approveSellerApplication();
    }
    setStep(12);
    if (showToast) showToast('⚡ Merchant verification badge activated! Verified Seller Dashboard unlocked.');
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in ${isPage ? 'relative z-0 bg-transparent p-0' : ''}`}>
      <div className={`bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-gray-100 ${isPage ? 'shadow-none rounded-2xl max-h-none border-0' : ''}`}>
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-brand-teal-dark via-brand-teal to-brand-teal-light text-white flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Store size={20} className="text-brand-yellow" />
            </div>
            <div>
              <h2 className="font-display font-extrabold text-lg text-white tracking-tight">
                BookVardi Verified Seller Registration
              </h2>
              <p className="text-xs text-white/80">
                Step {step} of 12 — {ONBOARDING_STEPS[step - 1]?.title}
              </p>
            </div>
          </div>

          {!isPage && (
            <button
              onClick={onClose}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Step Indicator Header */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-3 shrink-0 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 min-w-max">
            {ONBOARDING_STEPS.map((s) => {
              const isCurrent = s.id === step;
              const isPast = s.id < step || s.id <= formData.highestStepReached;
              return (
                <button
                  key={s.id}
                  onClick={() => {
                    if (s.id <= formData.highestStepReached + 1) {
                      setStep(s.id);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isCurrent
                      ? 'bg-brand-teal text-white shadow-xs scale-105'
                      : isPast
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-gray-100 text-gray-400 opacity-60'
                  }`}
                >
                  <span>{s.id}.</span>
                  <span>{s.title}</span>
                  {isPast && <CheckCircle2 size={11} className="text-emerald-700" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Step Body */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6 text-xs text-gray-700">
          
          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="font-display font-extrabold text-base text-gray-900 flex items-center gap-2">
                  <UserCheck className="text-teal-700" size={18} /> Step 1: Basic Profile & Phone OTP Verification
                </h3>
                <p className="text-gray-500 text-xs mt-0.5">
                  Verify your mobile phone number via testing OTP and upload your custom seller profile image.
                </p>
              </div>

              {/* Avatar Upload */}
              <div 
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingProfilePhoto(true); }}
                onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingProfilePhoto(false); }}
                onDrop={handleProfilePhotoDrop}
                className={`p-4 border rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 transition-all ${
                  isDraggingProfilePhoto 
                    ? 'bg-teal-100 border-teal-400 ring-2 ring-teal-400 scale-[1.01]' 
                    : 'bg-teal-50/70 border-teal-100'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="relative group shrink-0">
                    <img
                      src={formData.profilePhoto || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
                      alt="Seller Avatar"
                      className="w-16 h-16 rounded-full object-cover border-2 border-brand-yellow shadow-xs"
                    />
                    {formData.profilePhoto && (
                      <button
                        type="button"
                        onClick={() => handleChange('profilePhoto', '')}
                        className="absolute -top-1 -right-1 bg-rose-600 text-white rounded-full p-1 shadow-xs hover:bg-rose-700 cursor-pointer"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-teal-950 text-xs sm:text-sm">
                      {isDraggingProfilePhoto ? 'Drop Profile Image Here!' : 'Seller Profile Photo'}
                    </h4>
                    <p className="text-[11px] text-teal-700">
                      Upload or drag & drop profile photo for vendor store bio and receipts.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                  {formData.profilePhoto && (
                    <button
                      type="button"
                      onClick={() => setPreviewDocModal({ title: 'Seller Profile Photo', url: formData.profilePhoto })}
                      className="px-3 py-2 bg-teal-100 hover:bg-teal-200 text-teal-900 rounded-xl font-bold text-xs flex items-center justify-center gap-1 cursor-pointer border border-teal-200"
                    >
                      <Eye size={14} /> Preview
                    </button>
                  )}
                  <label className="w-full sm:w-auto cursor-pointer bg-brand-teal hover:bg-brand-teal-dark text-white px-3.5 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs">
                    <UploadCloud size={14} />
                    <span>{formData.profilePhoto ? 'Change Photo' : 'Upload Image'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePhotoSelect}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Seller Full Name *</label>
                  <input
                    type="text"
                    value={formData.sellerName}
                    onChange={(e) => handleChange('sellerName', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-brand-yellow outline-hidden"
                    placeholder="e.g. Ramesh Kumar"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Official Seller Email ID *</label>
                  <input
                    type="email"
                    value={formData.sellerEmail}
                    onChange={(e) => handleChange('sellerEmail', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-brand-yellow outline-hidden"
                    placeholder="name@business.com"
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="font-bold text-gray-700">Mobile Phone Number (WhatsApp Enabled) *</label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="tel"
                      value={formData.sellerPhone}
                      onChange={(e) => handleChange('sellerPhone', e.target.value)}
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-brand-yellow outline-hidden"
                      placeholder="+91 98765 43210"
                    />
                    <button
                      type="button"
                      onClick={handleSendMobileOtp}
                      className="px-4 py-2.5 bg-teal-50 text-teal-800 rounded-xl font-bold hover:bg-teal-100 text-xs border border-teal-200 shrink-0"
                    >
                      {otpSent ? 'Resend OTP' : 'Send Phone OTP'}
                    </button>
                  </div>
                </div>

                {otpSent && (
                  <div className="space-y-2 md:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <label className="font-bold text-gray-800 text-xs block">
                          Enter 6-Digit Mobile OTP <span className="text-amber-700 font-normal">(Testing Code: 123456)</span>
                        </label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          maxLength={6}
                          value={mobileOtp}
                          onChange={(e) => setMobileOtp(e.target.value)}
                          className="w-32 px-3 py-2 rounded-xl border border-gray-300 text-xs font-mono text-center"
                          placeholder="123456"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyMobileOtp}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs"
                        >
                          Verify OTP
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {formData.phoneOtpVerified && (
                  <div className="md:col-span-2">
                    <span className="inline-flex items-center gap-1.5 text-emerald-800 font-bold bg-emerald-50 px-3.5 py-2.5 rounded-xl border border-emerald-200 text-xs">
                      <CheckCircle2 size={16} className="text-emerald-600" />
                      Phone Number Verified via OTP (Testing Mode)
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: Business Details */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="font-display font-extrabold text-base text-gray-900 flex items-center gap-2">
                  <Building2 className="text-teal-700" size={18} /> Step 2: Legal Business Details
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Legal Registered Business Name *</label>
                  <input
                    type="text"
                    value={formData.legalBusinessName}
                    onChange={(e) => handleChange('legalBusinessName', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-brand-yellow outline-hidden"
                    placeholder="e.g. Apex Stationers & Uniforms Pvt Ltd"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Trade Name / Doing Business As (DBA) *</label>
                  <input
                    type="text"
                    value={formData.tradeName}
                    onChange={(e) => handleChange('tradeName', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-brand-yellow outline-hidden"
                    placeholder="e.g. Apex Book Depot"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Owner */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="font-display font-extrabold text-base text-gray-900 flex items-center gap-2">
                  <UserCheck className="text-teal-700" size={18} /> Step 3: Owner / Signatory KYC
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">PAN Card Number *</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.ownerPan}
                      onChange={(e) => handleChange('ownerPan', e.target.value.toUpperCase())}
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-mono uppercase"
                      placeholder="ABCDE1234F"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyPan}
                      className="px-3.5 py-2.5 bg-brand-teal text-white font-bold rounded-xl text-xs"
                    >
                      {isPanVerified ? 'Verified ✓' : 'Verify PAN'}
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Aadhaar Card Number *</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.ownerAadhaarLast4}
                      onChange={(e) => handleChange('ownerAadhaarLast4', e.target.value)}
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-mono"
                      placeholder="12-digit Aadhaar"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyAadhaar}
                      className="px-3.5 py-2.5 bg-brand-teal text-white font-bold rounded-xl text-xs"
                    >
                      {isAadhaarVerified ? 'Verified ✓' : 'Verify Aadhaar'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Address Proof */}
          {step === 6 && (
            <div className="space-y-4">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="font-display font-extrabold text-base text-gray-900 flex items-center gap-2">
                  <FileCheck className="text-teal-700" size={18} /> Step 6: Premises & Address Proof Document
                </h3>
              </div>
              <div className="space-y-2">
                <label className="font-bold text-gray-700 text-xs block">
                  Document Reference Number *
                </label>
                <input
                  type="text"
                  value={formData.addressProofDocNumber}
                  onChange={(e) => handleChange('addressProofDocNumber', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-mono"
                  placeholder="e.g. ELEC-9872134"
                />

                <label 
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingAddressProof(true); }}
                  onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingAddressProof(false); }}
                  onDrop={handleAddressProofDrop}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer block ${
                    isDraggingAddressProof ? 'border-brand-teal bg-teal-100/90' : 'border-teal-300 bg-teal-50/40'
                  }`}
                >
                  <UploadCloud size={36} className="mx-auto text-teal-700 mb-2" />
                  <p className="font-bold text-gray-800 text-xs sm:text-sm">
                    {formData.addressProofFileName ? `Uploaded: ${getFileNameOnly(formData.addressProofFileName)}` : 'Click or Drag & Drop Address Proof File'}
                  </p>
                  <input
                    type="file"
                    accept=".pdf,image/*,.doc,.docx"
                    onChange={handleAddressProofUpload}
                    className="hidden"
                  />
                </label>

                {formData.addressProofFileName && (
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => setPreviewDocModal({
                        title: `Address Proof (${formData.addressProofType || 'Utility Bill'})`,
                        url: formData.addressProofDoc || formData.addressProofFileName,
                        fileName: getFileNameOnly(formData.addressProofFileName || formData.addressProofDoc)
                      })}
                      className="px-3.5 py-2 bg-teal-100 hover:bg-teal-200 text-teal-900 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer border border-teal-200"
                    >
                      <Eye size={14} /> Preview Address Proof Document
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: Business Documents */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="font-display font-extrabold text-base text-gray-900 flex items-center gap-2">
                  <FileText className="text-teal-700" size={18} /> Step 4: Business Legal & Tax Documents
                </h3>
                <p className="text-gray-500 text-xs mt-0.5">
                  Enter your business legal registrations, PAN, GSTIN, and MSME/Udyam certificates.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Business / Entity PAN Number *</label>
                  <input
                    type="text"
                    value={formData.businessPan}
                    onChange={(e) => handleChange('businessPan', e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-mono uppercase focus:ring-2 focus:ring-brand-yellow outline-hidden"
                    placeholder="AAACB1234C"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">GSTIN Registration Number *</label>
                  <input
                    type="text"
                    value={formData.gstin}
                    onChange={(e) => handleChange('gstin', e.target.value.toUpperCase())}
                    disabled={formData.hasGstExemption}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono uppercase focus:ring-2 focus:ring-brand-yellow outline-hidden ${
                      formData.hasGstExemption ? 'bg-gray-100 border-gray-200 text-gray-400' : 'border-gray-200'
                    }`}
                    placeholder="22AAAAA0000A1Z5"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.hasGstExemption}
                      onChange={(e) => handleChange('hasGstExemption', e.target.checked)}
                      className="w-4 h-4 rounded-md border-gray-300 text-brand-teal focus:ring-brand-yellow"
                    />
                    <span className="font-bold text-gray-700 text-xs">
                      GST Exempted (Turnover below threshold / 100% exempt book categories)
                    </span>
                  </label>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">MSME / Udyam Registration Number (Optional)</label>
                  <input
                    type="text"
                    value={formData.msmeRegistrationNumber}
                    onChange={(e) => handleChange('msmeRegistrationNumber', e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-mono uppercase focus:ring-2 focus:ring-brand-yellow outline-hidden"
                    placeholder="UDYAM-RJ-00-0000000"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">CIN (Corporate Identification Number if Pvt Ltd/LLP)</label>
                  <input
                    type="text"
                    value={formData.cinNumber}
                    onChange={(e) => handleChange('cinNumber', e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-mono uppercase focus:ring-2 focus:ring-brand-yellow outline-hidden"
                    placeholder="U74999RJ2020PTC000000"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Business Address */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="font-display font-extrabold text-base text-gray-900 flex items-center gap-2">
                  <MapPin className="text-teal-700" size={18} /> Step 5: Official Registered Business Address
                </h3>
                <p className="text-gray-500 text-xs mt-0.5">
                  Physical location of your store, warehouse, or registered office.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 md:col-span-2">
                  <label className="font-bold text-gray-700">Address Line 1 (Building, Shop No, Street) *</label>
                  <input
                    type="text"
                    value={formData.addressLine1}
                    onChange={(e) => handleChange('addressLine1', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-brand-yellow outline-hidden"
                    placeholder="Shop #14, Apex Book Plaza, Station Road"
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="font-bold text-gray-700">Address Line 2 (Area, Landmark)</label>
                  <input
                    type="text"
                    value={formData.addressLine2}
                    onChange={(e) => handleChange('addressLine2', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-brand-yellow outline-hidden"
                    placeholder="Near Central Railway Station"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">City / District *</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-brand-yellow outline-hidden"
                    placeholder="Jaipur"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">State *</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => handleChange('state', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-brand-yellow outline-hidden"
                    placeholder="Rajasthan"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Pincode / Postal Code *</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={formData.pincode}
                    onChange={(e) => handleChange('pincode', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-mono focus:ring-2 focus:ring-brand-yellow outline-hidden"
                    placeholder="302001"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Country</label>
                  <input
                    type="text"
                    value={formData.country || 'India'}
                    disabled
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs bg-gray-100 text-gray-500 font-medium"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: Bank Details */}
          {step === 7 && (
            <div className="space-y-4">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="font-display font-extrabold text-base text-gray-900 flex items-center gap-2">
                  <CreditCard className="text-teal-700" size={18} /> Step 7: Linked Settlement Bank Account
                </h3>
                <p className="text-gray-500 text-xs mt-0.5">
                  Direct settlement bank account for automated weekly marketplace payouts.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Account Holder Name *</label>
                  <input
                    type="text"
                    value={formData.bankAccountHolder}
                    onChange={(e) => handleChange('bankAccountHolder', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-brand-yellow outline-hidden"
                    placeholder="Apex Stationers & Uniforms Pvt Ltd"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Bank Account Number *</label>
                  <input
                    type="text"
                    value={formData.bankAccountNumber}
                    onChange={(e) => handleChange('bankAccountNumber', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-mono focus:ring-2 focus:ring-brand-yellow outline-hidden"
                    placeholder="91827364501928"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">IFSC Code *</label>
                  <input
                    type="text"
                    value={formData.bankIfscCode}
                    onChange={(e) => handleChange('bankIfscCode', e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-mono uppercase focus:ring-2 focus:ring-brand-yellow outline-hidden"
                    placeholder="HDFC0001234"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Bank Name</label>
                  <input
                    type="text"
                    value={formData.bankName}
                    onChange={(e) => handleChange('bankName', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-brand-yellow outline-hidden"
                    placeholder="HDFC Bank"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Branch Name</label>
                  <input
                    type="text"
                    value={formData.bankBranch}
                    onChange={(e) => handleChange('bankBranch', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-brand-yellow outline-hidden"
                    placeholder="MI Road Branch, Jaipur"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Account Type</label>
                  <select
                    value={formData.accountType}
                    onChange={(e) => handleChange('accountType', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs bg-white focus:ring-2 focus:ring-brand-yellow outline-hidden"
                  >
                    <option value="Current Account">Current Account (Recommended for Businesses)</option>
                    <option value="Savings Account">Savings Account</option>
                    <option value="OD/CC Account">Overdraft / Cash Credit (OD/CC)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 8: Store Details */}
          {step === 8 && (
            <div className="space-y-4">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="font-display font-extrabold text-base text-gray-900 flex items-center gap-2">
                  <Store className="text-teal-700" size={18} /> Step 8: Marketplace Store Branding & Info
                </h3>
                <p className="text-gray-500 text-xs mt-0.5">
                  Configure your customer-facing seller profile, store handle, and logo.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Store Display Name *</label>
                  <input
                    type="text"
                    value={formData.storeName}
                    onChange={(e) => {
                      const name = e.target.value;
                      handleChange('storeName', name);
                      if (!formData.storeSlug) {
                        handleChange('storeSlug', name.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                      }
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-brand-yellow outline-hidden"
                    placeholder="Apex Book Depot"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Store Handle / Slug *</label>
                  <div className="flex items-center">
                    <span className="px-3 py-2.5 bg-gray-100 border border-r-0 border-gray-200 rounded-l-xl text-gray-500 font-mono text-[11px]">
                      bookvardi.com/store/
                    </span>
                    <input
                      type="text"
                      value={formData.storeSlug}
                      onChange={(e) => handleChange('storeSlug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      className="flex-1 px-3.5 py-2.5 rounded-r-xl border border-gray-200 text-xs font-mono focus:ring-2 focus:ring-brand-yellow outline-hidden"
                      placeholder="apex-book-depot"
                    />
                  </div>
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="font-bold text-gray-700">Store Tagline / Headline</label>
                  <input
                    type="text"
                    value={formData.storeTagline}
                    onChange={(e) => handleChange('storeTagline', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-brand-yellow outline-hidden"
                    placeholder="Authorized Retailer for CBSE, ICSE Textbooks & Premium Stationery"
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="font-bold text-gray-700">Store Description / About</label>
                  <textarea
                    rows={3}
                    value={formData.storeDescription}
                    onChange={(e) => handleChange('storeDescription', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-brand-yellow outline-hidden"
                    placeholder="Serving students and academic institutions for over 15 years with genuine NCERT, competitive exam books, and quality school uniforms..."
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="font-bold text-gray-700">Store Logo URL / Image Link</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.storeLogo}
                      onChange={(e) => handleChange('storeLogo', e.target.value)}
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-brand-yellow outline-hidden"
                      placeholder="https://images.unsplash.com/... or /uploads/..."
                    />
                    {formData.storeLogo && (
                      <button
                        type="button"
                        onClick={() => setPreviewDocModal({ title: 'Store Logo', url: formData.storeLogo })}
                        className="px-3.5 py-2 bg-teal-100 hover:bg-teal-200 text-teal-900 rounded-xl font-bold text-xs flex items-center gap-1 shrink-0 border border-teal-200"
                      >
                        <Eye size={14} /> Preview
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 9: Product Information */}
          {step === 9 && (
            <div className="space-y-4">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="font-display font-extrabold text-base text-gray-900 flex items-center gap-2">
                  <Package className="text-teal-700" size={18} /> Step 9: Product Categories & Inventory Scope
                </h3>
                <p className="text-gray-500 text-xs mt-0.5">
                  Tell us about the merchandise catalog you plan to list on BookVardi.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="font-bold text-gray-700">Primary Product Categories (Select all that apply) *</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      'Academic & School Books',
                      'Higher Education & College',
                      'Competitive Exam Prep',
                      'Stationery & Supplies',
                      'School Uniforms',
                      'Fiction & Non-Fiction',
                      'Children & Story Books',
                      'Art & Craft Supplies'
                    ].map((cat) => {
                      const isSelected = (formData.selectedCategories || []).includes(cat);
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            const current = formData.selectedCategories || [];
                            const updated = isSelected
                              ? current.filter(c => c !== cat)
                              : [...current, cat];
                            handleChange('selectedCategories', updated);
                          }}
                          className={`p-2.5 rounded-xl text-xs font-bold text-left border transition-all flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-teal-50 border-teal-600 text-teal-950 shadow-xs'
                              : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          <span>{cat}</span>
                          {isSelected && <CheckCircle2 size={14} className="text-teal-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1">
                    <label className="font-bold text-gray-700">Primary Brands / Publishers</label>
                    <input
                      type="text"
                      value={Array.isArray(formData.primaryBrands) ? formData.primaryBrands.join(', ') : (formData.primaryBrands || '')}
                      onChange={(e) => handleChange('primaryBrands', e.target.value.split(',').map(s => s.trim()))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-brand-yellow outline-hidden"
                      placeholder="NCERT, Classmate, Oxford, Pearson, Camlin"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-gray-700">Estimated Initial SKU Count</label>
                    <select
                      value={formData.estimatedSkuCount}
                      onChange={(e) => handleChange('estimatedSkuCount', e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs bg-white focus:ring-2 focus:ring-brand-yellow outline-hidden"
                    >
                      <option value="">Select inventory volume...</option>
                      <option value="1-50 SKUs">1 to 50 Items</option>
                      <option value="50-200 SKUs">50 to 200 Items</option>
                      <option value="200-1000 SKUs">200 to 1,000 Items</option>
                      <option value="1000+ SKUs">1,000+ Items (Bulk Catalog)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 10: Agreements */}
          {step === 10 && (
            <div className="space-y-4">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="font-display font-extrabold text-base text-gray-900 flex items-center gap-2">
                  <FileCheck className="text-teal-700" size={18} /> Step 10: Legal Agreements & Policy Acceptances
                </h3>
                <p className="text-gray-500 text-xs mt-0.5">
                  Review and consent to BookVardi seller guidelines, commissions, and SLAs.
                </p>
              </div>

              <div className="space-y-3">
                <label className="p-3.5 rounded-2xl border border-gray-200 bg-gray-50/60 flex items-start gap-3 cursor-pointer hover:bg-gray-50 transition-colors block">
                  <input
                    type="checkbox"
                    checked={formData.acceptedTerms}
                    onChange={(e) => handleChange('acceptedTerms', e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded-md border-gray-300 text-brand-teal focus:ring-brand-yellow"
                  />
                  <div>
                    <h5 className="font-extrabold text-gray-900 text-xs">Marketplace Seller Agreement & Terms of Service *</h5>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      I agree to adhere to BookVardi pricing standards, listing policies, and non-counterfeit guarantees.
                    </p>
                  </div>
                </label>

                <label className="p-3.5 rounded-2xl border border-gray-200 bg-gray-50/60 flex items-start gap-3 cursor-pointer hover:bg-gray-50 transition-colors block">
                  <input
                    type="checkbox"
                    checked={formData.acceptedCommissionRate}
                    onChange={(e) => handleChange('acceptedCommissionRate', e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded-md border-gray-300 text-brand-teal focus:ring-brand-yellow"
                  />
                  <div>
                    <h5 className="font-extrabold text-gray-900 text-xs">Category Commission Schedule & Payout SLA *</h5>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      I accept the platform commission structure (5%-8% standard) and weekly disbursement timeline.
                    </p>
                  </div>
                </label>

                <label className="p-3.5 rounded-2xl border border-gray-200 bg-gray-50/60 flex items-start gap-3 cursor-pointer hover:bg-gray-50 transition-colors block">
                  <input
                    type="checkbox"
                    checked={formData.acceptedReturnPolicy}
                    onChange={(e) => handleChange('acceptedReturnPolicy', e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded-md border-gray-300 text-brand-teal focus:ring-brand-yellow"
                  />
                  <div>
                    <h5 className="font-extrabold text-gray-900 text-xs">7-Day Customer Return & Replacement Guarantee *</h5>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      I agree to accept buyer returns or replacements for damaged, incorrect, or misprinted items.
                    </p>
                  </div>
                </label>

                <label className="p-3.5 rounded-2xl border border-gray-200 bg-gray-50/60 flex items-start gap-3 cursor-pointer hover:bg-gray-50 transition-colors block">
                  <input
                    type="checkbox"
                    checked={formData.authorizedSignatoryConfirmation}
                    onChange={(e) => handleChange('authorizedSignatoryConfirmation', e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded-md border-gray-300 text-brand-teal focus:ring-brand-yellow"
                  />
                  <div>
                    <h5 className="font-extrabold text-gray-900 text-xs">Authorized Signatory Legal Declaration *</h5>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      I confirm I am an authorized representative of this business entity and all submitted data is true and complete.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* STEP 11: Final Verification Audit */}
          {step === 11 && (
            <div className="space-y-4">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="font-display font-extrabold text-base text-gray-900 flex items-center gap-2">
                  <ShieldCheck className="text-teal-700" size={18} /> Step 11: Application Review & Audit Dossier
                </h3>
                <p className="text-gray-500 text-xs mt-0.5">
                  Review your complete seller profile dossier before administrator verification.
                </p>
              </div>

              <div className="bg-teal-50/60 p-4 rounded-2xl border border-teal-100 space-y-3">
                <div className="flex items-center justify-between border-b border-teal-100 pb-2">
                  <span className="font-bold text-teal-900 text-xs">Application Status</span>
                  <span className="px-2.5 py-1 bg-amber-100 text-amber-900 rounded-lg text-[11px] font-black border border-amber-200">
                    PENDING ADMIN APPROVAL
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-gray-500 text-[11px] block">Seller Name:</span>
                    <strong className="text-gray-900">{formData.sellerName || 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 text-[11px] block">Business Name:</span>
                    <strong className="text-gray-900">{formData.legalBusinessName || 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 text-[11px] block">Store Handle:</span>
                    <strong className="text-gray-900">@{formData.storeSlug || 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 text-[11px] block">GSTIN / Tax ID:</span>
                    <strong className="text-gray-900">{formData.hasGstExemption ? 'EXEMPT' : (formData.gstin || 'N/A')}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 text-[11px] block">Bank Account:</span>
                    <strong className="text-gray-900">{formData.bankAccountNumber ? `•••• ${formData.bankAccountNumber.slice(-4)}` : 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 text-[11px] block">Address Proof:</span>
                    <strong className="text-teal-700">{formData.addressProofFileName ? 'Document Attached ✓' : 'Pending'}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 12: Verified Seller */}
          {step === 12 && (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs border border-emerald-200">
                <CheckCircle2 size={36} />
              </div>
              <div>
                <h3 className="font-display font-extrabold text-xl text-gray-900">
                  Verified Marketplace Seller Activated!
                </h3>
                <p className="text-xs text-gray-600 max-w-md mx-auto mt-1">
                  Your seller account, bank details, and compliance documents have been verified. You can now publish listings, process orders, and receive payouts.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200 px-4 py-2 rounded-xl font-mono font-bold text-xs">
                <ShieldCheck size={16} className="text-emerald-600" />
                VERIFIED VENDOR BADGE: ACTIVE
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={prevStep}
            disabled={step === 1}
            className={`px-4 py-2 rounded-xl font-bold text-xs ${step === 1 ? 'opacity-40' : 'hover:bg-gray-200 text-gray-700'}`}
          >
            Previous
          </button>

          <div className="flex items-center gap-2">
            {step < 10 && (
              <button
                type="button"
                onClick={nextStep}
                className="px-5 py-2.5 bg-brand-teal hover:bg-brand-teal-light text-white font-extrabold text-xs rounded-xl flex items-center gap-2"
              >
                <span>Continue</span>
                <ArrowRight size={14} />
              </button>
            )}

            {step === 10 && (
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-brand-yellow hover:bg-brand-yellow-hover text-brand-teal-dark font-black text-xs rounded-xl shadow-md flex items-center gap-2"
              >
                <span>Submit 10-Step Application</span>
                <ArrowRight size={14} />
              </button>
            )}

            {step === 11 && (
              <button
                type="button"
                onClick={handleSimulateApproval}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-2"
              >
                <span>Activate Verification Badge</span>
                <CheckCircle2 size={14} />
              </button>
            )}

            {step === 12 && (
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-brand-teal text-white font-bold text-xs rounded-xl shadow-xs"
              >
                Done
              </button>
            )}
          </div>
        </div>

      </div>

      <DocumentPreviewModal
        isOpen={Boolean(previewDocModal)}
        onClose={() => setPreviewDocModal(null)}
        doc={previewDocModal}
      />
    </div>
  );
}
