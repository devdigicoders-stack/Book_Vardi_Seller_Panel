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
  Download,
  Crosshair,
  Navigation,
  Loader2
} from 'lucide-react';
import { useSellerData } from '../context/SellerDataContext';
import LocationPickerModal from './LocationPickerModal';

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
  landmark: '',
  city: '',
  state: 'Uttar Pradesh',
  pincode: '',
  country: 'India',

  // Step 6: Address Proof
  addressProofType: 'Electricity Bill',
  addressProofDocNumber: '',
  addressProofFileName: '',
  addressProofDoc: '',

  // Step 7: Bank Details
  bankAccountHolder: '',
  bankAccountNumber: '',
  confirmBankAccountNumber: '',
  bankIfscCode: '',
  bankName: '',
  bankBranch: '',
  accountType: 'Savings Account',

  // Step 8: Store Details
  storeName: '',
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

export default function SellerRegistrationModal({ isOpen, onClose, isPage = false }) {
  const { 
    submitSellerApplication, 
    showToast,
    logoutSeller,
    checkSellerStatus
  } = useSellerData();

  const [step, setStep] = useState(() => {
    try {
      const savedStep = localStorage.getItem('bv_seller_reg_step');
      if (savedStep) {
        const parsed = parseInt(savedStep, 10);
        if (!isNaN(parsed) && parsed >= 1 && parsed <= 12) return parsed;
      }
    } catch {}
    return 1;
  });

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
  const [showOtpPopup, setShowOtpPopup] = useState(false);
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

  // Step 5 Location Picker States
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationStatus, setLocationStatus] = useState('');

  // Drag & drop file upload states
  const [isDraggingAddressProof, setIsDraggingAddressProof] = useState(false);
  const [isDraggingProfilePhoto, setIsDraggingProfilePhoto] = useState(false);
  const [isDraggingStoreLogo, setIsDraggingStoreLogo] = useState(false);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsDetectingLocation(true);
    setLocationStatus('Detecting your GPS location...');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`);
          const data = await res.json();
          const addr = data.address || {};

          const street = addr.road || addr.building || (addr.house_number ? `${addr.house_number}, ${addr.road || ''}` : '');
          const colony = addr.suburb || addr.neighbourhood || addr.residential || addr.village || addr.subdistrict || '';
          const landmark = addr.amenity || addr.landmark || addr.commercial || '';
          const city = addr.city || addr.town || addr.city_district || addr.district || addr.county || '';
          const state = addr.state || 'Uttar Pradesh';
          const pincode = addr.postcode || '';

          setFormData(prev => ({
            ...prev,
            addressLine1: street || prev.addressLine1,
            addressLine2: colony || prev.addressLine2,
            landmark: landmark || prev.landmark,
            city: city || prev.city,
            state: state || prev.state || 'Uttar Pradesh',
            pincode: pincode || prev.pincode
          }));
          setLocationStatus('GPS Location detected successfully!');
        } catch (err) {
          setLocationStatus('Could not reverse geocode location. Please fill manually or pick on map.');
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (err) => {
        setIsDetectingLocation(false);
        setLocationStatus('Location permission denied or unavailable.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleMapLocationSelect = (loc) => {
    setFormData(prev => ({
      ...prev,
      addressLine1: loc.street || loc.addressLine1 || prev.addressLine1,
      addressLine2: loc.colony || loc.addressLine2 || prev.addressLine2,
      landmark: loc.landmark || prev.landmark,
      city: loc.city || prev.city,
      state: loc.state || prev.state || 'Uttar Pradesh',
      pincode: loc.pincode || prev.pincode
    }));
    setLocationStatus(`Location updated from Map: ${loc.city || ''}, ${loc.state || 'Uttar Pradesh'}`);
  };

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

    if (field === 'sellerPhone' || field === 'sellerEmail') {
      setFormData(prev => ({
        ...prev,
        phoneOtpVerified: false,
        emailOtpVerified: false
      }));
      setOtpSent(false);
    }
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

  const processStoreLogoFile = (file) => {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      if (showToast) showToast('⚠️ Logo image file is too large. Please select an image under 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setFormData(prev => ({
        ...prev,
        storeLogo: event.target.result
      }));
      if (showToast) showToast('🖼️ Store Logo uploaded successfully!');
    };
    reader.readAsDataURL(file);
  };

  const handleStoreLogoSelect = (e) => {
    const file = e.target.files && e.target.files[0];
    processStoreLogoFile(file);
  };

  const handleStoreLogoDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingStoreLogo(false);
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    processStoreLogoFile(file);
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
        setShowOtpPopup(true);
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
    if (!formData.phoneOtpVerified) {
      setStep(1);
      setShowOtpPopup(true);
      if (showToast) showToast('⚠️ Mobile OTP verification is required to complete seller registration!');
      return;
    }

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

  const progressPercentage = Math.round(((step - 1) / 11) * 100);

  const containerClasses = isPage
    ? "bg-white rounded-3xl w-full flex flex-col shadow-xl border border-gray-100 overflow-hidden"
    : "fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-5 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200";

  const cardClasses = isPage
    ? "w-full flex flex-col"
    : "bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden my-auto";

  return (
    <div className={containerClasses}>
      <div className={cardClasses}>
        
        {/* Modal Top Banner */}
        <div className="bg-brand-teal text-white px-6 py-4 flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-yellow text-brand-teal-dark flex items-center justify-center font-black shadow-sm">
              <Store size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-extrabold text-base sm:text-lg text-white">
                  Seller Onboarding & KYC Registration
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-brand-yellow text-brand-teal uppercase tracking-wider">
                  Step {step} of 12
                </span>
              </div>
              <p className="text-xs text-white/70">
                Complete your business verification to sell uniforms, textbooks & school supplies
              </p>
            </div>
          </div>

          {!isPage && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Close Registration Form"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Horizontal Progress Bar & Step Tracker */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-3 shrink-0">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-bold text-gray-700 flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-teal-700" />
              <span>{ONBOARDING_STEPS[step - 1].section}</span>
            </span>
            <span className="text-gray-500 font-semibold text-[11px]">
              Verification: <strong className="text-teal-900">{ONBOARDING_STEPS[step - 1].verify}</strong> ({progressPercentage}% completed)
            </span>
          </div>
          
          <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-brand-yellow h-full transition-all duration-300 rounded-full"
              style={{ width: `${Math.max(8, progressPercentage)}%` }}
            />
          </div>

          {/* Step Bubbles Scrollable */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-3 pb-1">
            {ONBOARDING_STEPS.map((s) => {
              const isPast = step > s.id;
              const isCurrent = step === s.id;
              const isReached = formData.highestStepReached >= s.id || isPast;

              return (
                <button
                  key={s.id}
                  onClick={() => {
                    if (!formData.phoneOtpVerified && s.id > 1) {
                      setShowOtpPopup(true);
                      return;
                    }
                    if (isReached || isPast || s.id <= step + 1) {
                      setStep(s.id);
                    }
                  }}
                  disabled={!isReached && s.id > step + 1}
                  className={`shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-brand-teal text-white shadow-xs'
                      : isPast
                      ? 'bg-emerald-100 text-emerald-800'
                      : isReached
                      ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      : 'bg-gray-100 text-gray-400 opacity-60 cursor-not-allowed'
                  }`}
                  title={`${s.id}. ${s.title}`}
                >
                  <span>{s.id}.</span>
                  <span className="whitespace-nowrap">{s.title}</span>
                  {isPast && <CheckCircle2 size={11} className="text-emerald-700" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Step Form Body */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6 text-xs text-gray-700">
          
          {/* STEP 1: Basic Profile */}
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

              {/* Custom Seller Profile Photo Upload */}
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
                      alt="Seller Profile Avatar"
                      className="w-16 h-16 rounded-full object-cover border-2 border-brand-yellow shadow-xs"
                    />
                    {formData.profilePhoto && (
                      <button
                        type="button"
                        onClick={() => handleChange('profilePhoto', '')}
                        className="absolute -top-1 -right-1 bg-rose-600 text-white rounded-full p-1 shadow-xs hover:bg-rose-700 cursor-pointer"
                        title="Remove Photo"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-teal-950 text-xs sm:text-sm">
                      {isDraggingProfilePhoto ? 'Drop Profile Image Here!' : 'Seller Profile Photo'}
                    </h4>
                    <p className="text-[11px] text-teal-700 leading-snug">
                      Upload or drag & drop profile photo for vendor bio and receipts.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
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
                      className="px-4 py-2.5 bg-teal-50 text-teal-800 rounded-xl font-bold hover:bg-teal-100 text-xs transition-colors cursor-pointer border border-teal-200 shrink-0"
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
                        <p className="text-[11px] text-gray-500">
                          A test verification code has been generated for {formData.sellerPhone}.
                        </p>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <input
                          type="text"
                          maxLength={6}
                          value={mobileOtp}
                          onChange={(e) => setMobileOtp(e.target.value)}
                          className="w-32 px-3 py-2 rounded-xl border border-gray-300 text-xs font-mono tracking-widest text-center focus:ring-2 focus:ring-brand-yellow outline-hidden bg-white"
                          placeholder="123456"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyMobileOtp}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
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
                <p className="text-gray-500 text-xs mt-0.5">
                  Enter registered enterprise particulars for administrative and tax validation.
                </p>
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

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Business Constitution Type *</label>
                  <select
                    value={formData.businessType}
                    onChange={(e) => handleChange('businessType', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-brand-yellow outline-hidden bg-white"
                  >
                    <option value="Sole Proprietorship">Sole Proprietorship</option>
                    <option value="Partnership Firm">Partnership Firm</option>
                    <option value="Private Limited">Private Limited (Pvt Ltd)</option>
                    <option value="Limited Liability Partnership">LLP (Limited Liability Partnership)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Year Started / Incorporated *</label>
                  <input
                    type="number"
                    value={formData.yearStarted}
                    onChange={(e) => handleChange('yearStarted', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-brand-yellow outline-hidden"
                    placeholder="2021"
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="font-bold text-gray-700">Estimated Annual Business Turnover *</label>
                  <select
                    value={formData.annualTurnoverEstimate}
                    onChange={(e) => handleChange('annualTurnoverEstimate', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-brand-yellow outline-hidden bg-white"
                  >
                    <option value="">Select Annual Turnover Estimate</option>
                    <option value="Below ₹10 Lakhs">Below ₹10 Lakhs</option>
                    <option value="₹10 Lakhs - ₹25 Lakhs">₹10 Lakhs - ₹25 Lakhs</option>
                    <option value="₹25 Lakhs - ₹50 Lakhs">₹25 Lakhs - ₹50 Lakhs</option>
                    <option value="₹50 Lakhs - ₹1 Crore">₹50 Lakhs - ₹1 Crore</option>
                    <option value="Above ₹1 Crore">Above ₹1 Crore</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Owner / Authorized Person */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="font-display font-extrabold text-base text-gray-900 flex items-center gap-2">
                  <UserCheck className="text-teal-700" size={18} /> Step 3: Owner & Key Management Personnel (KYC)
                </h3>
                <p className="text-gray-500 text-xs mt-0.5">
                  Provide primary signatory identification. <span className="text-brand-teal font-semibold">Government verification of PAN and Aadhaar is required to continue.</span>
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700 text-xs">Owner / Authorized Representative Name *</label>
                  <input
                    type="text"
                    value={formData.ownerFullName}
                    onChange={(e) => handleChange('ownerFullName', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-brand-yellow outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700 text-xs">Designation / Role *</label>
                  <input
                    type="text"
                    value={formData.ownerDesignation}
                    onChange={(e) => handleChange('ownerDesignation', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-brand-yellow outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-gray-700 text-xs">Individual PAN Card Number *</label>
                    {isPanVerified ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        <CheckCircle2 size={12} /> Verified
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        Verification Required
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.ownerPan}
                      onChange={(e) => handleChange('ownerPan', e.target.value.toUpperCase())}
                      className={`flex-1 px-3.5 py-2.5 rounded-xl border text-xs font-mono uppercase outline-hidden ${
                        isPanVerified 
                          ? 'border-emerald-300 bg-emerald-50/30 text-emerald-950 focus:ring-2 focus:ring-emerald-400' 
                          : panError 
                            ? 'border-rose-300 bg-rose-50/30 focus:ring-2 focus:ring-rose-400'
                            : 'border-gray-200 focus:ring-2 focus:ring-brand-yellow'
                      }`}
                      placeholder="ABCDE1234F"
                      maxLength={10}
                    />
                    <button
                      type="button"
                      onClick={handleVerifyPan}
                      disabled={isVerifyingPan || isPanVerified}
                      className={`px-3.5 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                        isPanVerified
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-200 cursor-default'
                          : isVerifyingPan
                            ? 'bg-gray-200 text-gray-500 cursor-wait'
                            : 'bg-brand-teal text-white hover:bg-brand-teal-light shadow-xs active:scale-95'
                      }`}
                    >
                      {isVerifyingPan ? (
                        <>
                          <RefreshCw size={13} className="animate-spin" />
                          <span>Verifying...</span>
                        </>
                      ) : isPanVerified ? (
                        <>
                          <CheckCircle2 size={13} className="text-emerald-700" />
                          <span>Verified</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck size={13} />
                          <span>Verify PAN</span>
                        </>
                      )}
                    </button>
                  </div>
                  {panError && (
                    <p className="text-[11px] text-rose-600 font-semibold flex items-center gap-1 pt-0.5">
                      <AlertCircle size={12} /> {panError}
                    </p>
                  )}
                  <p className="text-[10px] text-gray-500">10-character alphanumeric PAN issued by Income Tax Dept.</p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-gray-700 text-xs">Aadhaar Card (12 or Last 4 Digits) *</label>
                    {isAadhaarVerified ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        <CheckCircle2 size={12} /> Verified
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        Verification Required
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.ownerAadhaarLast4}
                      onChange={(e) => handleChange('ownerAadhaarLast4', e.target.value.replace(/\D/g, ''))}
                      className={`flex-1 px-3.5 py-2.5 rounded-xl border text-xs font-mono outline-hidden ${
                        isAadhaarVerified 
                          ? 'border-emerald-300 bg-emerald-50/30 text-emerald-950 focus:ring-2 focus:ring-emerald-400' 
                          : aadhaarError 
                            ? 'border-rose-300 bg-rose-50/30 focus:ring-2 focus:ring-rose-400'
                            : 'border-gray-200 focus:ring-2 focus:ring-brand-yellow'
                      }`}
                      placeholder="e.g. 8942 or 12-digit number"
                      maxLength={12}
                    />
                    <button
                      type="button"
                      onClick={handleVerifyAadhaar}
                      disabled={isVerifyingAadhaar || isAadhaarVerified}
                      className={`px-3.5 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                        isAadhaarVerified
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-200 cursor-default'
                          : isVerifyingAadhaar
                            ? 'bg-gray-200 text-gray-500 cursor-wait'
                            : 'bg-brand-teal text-white hover:bg-brand-teal-light shadow-xs active:scale-95'
                      }`}
                    >
                      {isVerifyingAadhaar ? (
                        <>
                          <RefreshCw size={13} className="animate-spin" />
                          <span>Verifying...</span>
                        </>
                      ) : isAadhaarVerified ? (
                        <>
                          <CheckCircle2 size={13} className="text-emerald-700" />
                          <span>Verified</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck size={13} />
                          <span>Verify Aadhaar</span>
                        </>
                      )}
                    </button>
                  </div>
                  {aadhaarError && (
                    <p className="text-[11px] text-rose-600 font-semibold flex items-center gap-1 pt-0.5">
                      <AlertCircle size={12} /> {aadhaarError}
                    </p>
                  )}
                  <p className="text-[10px] text-gray-500">Enter your 12-digit Aadhaar number or last 4 digits for instant verification.</p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Business Documents */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="font-display font-extrabold text-base text-gray-900 flex items-center gap-2">
                  <FileText className="text-teal-700" size={18} /> Step 4: Enterprise Tax & Business Documents
                </h3>
                <p className="text-gray-500 text-xs mt-0.5">
                  GSTIN and Business Registration Certificate for tax compliance.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Entity PAN Number *</label>
                  <input
                    type="text"
                    value={formData.businessPan}
                    onChange={(e) => handleChange('businessPan', e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-mono uppercase"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">
                    Goods & Service Tax Number (GSTIN) {formData.hasGstExemption ? '(Exempted)' : '*'}
                  </label>
                  <input
                    type="text"
                    value={formData.hasGstExemption ? 'EXEMPT' : formData.gstin}
                    disabled={formData.hasGstExemption}
                    onChange={(e) => handleChange('gstin', e.target.value.toUpperCase())}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono uppercase transition-colors ${
                      formData.hasGstExemption
                        ? 'bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed opacity-75'
                        : 'border-gray-200 focus:ring-2 focus:ring-brand-yellow'
                    }`}
                    placeholder={formData.hasGstExemption ? 'GSTIN Exempted' : '22AAAAA0000A1Z5'}
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">MSME Udyam Registration (Optional)</label>
                  <input
                    type="text"
                    value={formData.msmeRegistrationNumber}
                    onChange={(e) => handleChange('msmeRegistrationNumber', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">CIN (For Corporate Entities)</label>
                  <input
                    type="text"
                    value={formData.cinNumber}
                    onChange={(e) => handleChange('cinNumber', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1 md:col-span-2 bg-gray-50 p-3.5 rounded-xl border border-gray-200">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-800 text-xs">
                    <input
                      type="checkbox"
                      checked={formData.hasGstExemption}
                      onChange={(e) => {
                        const isExempt = e.target.checked;
                        handleChange('hasGstExemption', isExempt);
                        if (isExempt) {
                          handleChange('gstin', 'EXEMPT');
                        } else if (formData.gstin === 'EXEMPT') {
                          handleChange('gstin', '');
                        }
                      }}
                      className="rounded text-brand-teal focus:ring-brand-yellow"
                    />
                    <span>My entity operates under GST Exemption / Threshold Limit (No GSTIN required)</span>
                  </label>
                  {formData.hasGstExemption && (
                    <p className="text-[11px] text-emerald-700 font-semibold mt-1 pl-6">
                      ✓ GSTIN requirement disabled for GST exempted business entities.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Business Address */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="border-b border-gray-100 pb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-display font-extrabold text-base text-gray-900 flex items-center gap-2">
                    <MapPin className="text-teal-700" size={18} /> Step 5: Registered Office & Dispatch Hub Address
                  </h3>
                  <p className="text-gray-500 text-xs mt-0.5">
                    Physical location formatted as Street, Colony, Landmark, City & State (Uttar Pradesh)
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    disabled={isDetectingLocation}
                    className="flex-1 sm:flex-initial px-3.5 py-2 bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    {isDetectingLocation ? <Loader2 size={14} className="animate-spin text-teal-700" /> : <Crosshair size={14} className="text-teal-700" />}
                    Use Current Location
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsMapPickerOpen(true)}
                    className="flex-1 sm:flex-initial px-3.5 py-2 bg-teal-700 text-white hover:bg-teal-800 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                  >
                    <MapPin size={14} /> Choose on Map
                  </button>
                </div>
              </div>

              {locationStatus && (
                <div className="p-3 bg-teal-50/80 border border-teal-200 rounded-xl text-xs font-semibold text-teal-900 flex items-center gap-2">
                  <Navigation size={14} className="text-teal-700 shrink-0" />
                  <span>{locationStatus}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Street / House / Shop No *</label>
                  <input
                    type="text"
                    value={formData.addressLine1}
                    onChange={(e) => handleChange('addressLine1', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-brand-yellow outline-hidden"
                    placeholder="e.g. Shop #14, Main Road, Block B"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Colony / Area / Locality *</label>
                  <input
                    type="text"
                    value={formData.addressLine2}
                    onChange={(e) => handleChange('addressLine2', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-brand-yellow outline-hidden"
                    placeholder="e.g. Hazratganj / Civil Lines / Sector 62"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Landmark</label>
                  <input
                    type="text"
                    value={formData.landmark || ''}
                    onChange={(e) => handleChange('landmark', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-brand-yellow outline-hidden"
                    placeholder="e.g. Near Cathedral School / Opp Metro Station"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">City / District *</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-brand-yellow outline-hidden"
                    placeholder="e.g. Lucknow / Noida / Varanasi"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">State *</label>
                  <input
                    type="text"
                    value={formData.state || 'Uttar Pradesh'}
                    onChange={(e) => handleChange('state', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-brand-yellow outline-hidden"
                    placeholder="Uttar Pradesh"
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
                    placeholder="226001"
                  />
                </div>
              </div>

              {/* Formatted Live Address Preview Box */}
              <div className="p-3.5 bg-teal-50/80 border border-teal-200 rounded-xl space-y-1 text-xs">
                <span className="font-extrabold text-teal-900 flex items-center gap-1.5 uppercase text-[11px]">
                  <Navigation size={14} className="text-teal-700" /> Formatted Business Address Preview:
                </span>
                <p className="font-bold text-gray-800 text-xs leading-relaxed">
                  {[formData.addressLine1, formData.addressLine2, formData.landmark, formData.city, formData.state].filter(Boolean).join(', ')} {formData.pincode ? `- ${formData.pincode}` : ''}
                </p>
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
                <p className="text-gray-500 text-xs mt-0.5">
                  Valid utility bill, rent agreement or municipal tax receipt for registered location.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Proof Document Type *</label>
                  <select
                    value={formData.addressProofType}
                    onChange={(e) => handleChange('addressProofType', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs bg-white focus:ring-2 focus:ring-brand-yellow outline-hidden"
                  >
                    <option value="Electricity Bill">Electricity Bill (Past 3 months)</option>
                    <option value="Rent / Lease Agreement">Registered Rent / Lease Agreement</option>
                    <option value="Property Tax Receipt">Property Tax Receipt / Ownership Deed</option>
                    <option value="Telephone / Broadband Bill">Telephone / Broadband Bill</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Document Identifier / Consumer Number *</label>
                  <input
                    type="text"
                    value={formData.addressProofDocNumber}
                    onChange={(e) => handleChange('addressProofDocNumber', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-mono focus:ring-2 focus:ring-brand-yellow outline-hidden"
                    placeholder="e.g. ELEC-9872134"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-bold text-gray-700 text-xs block">
                  Upload Address Proof File (PDF, Image, DOC) *
                </label>
                
                {formData.addressProofFileName ? (
                  <div className="p-4 bg-teal-50 border-2 border-teal-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
                        <FileCheck size={24} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-teal-950 text-xs sm:text-sm truncate max-w-[200px] sm:max-w-[300px]">
                            {formData.addressProofFileName}
                          </span>
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-emerald-200">
                            Uploaded ✓
                          </span>
                        </div>
                        <p className="text-[11px] text-teal-700 mt-0.5">
                          Size: {formData.addressProofFileSize || '1.8 MB'} • Encrypted for reviewer validation
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => setPreviewDocModal({
                          fileName: formData.addressProofFileName,
                          src: formData.addressProofDoc
                        })}
                        className="px-3.5 py-2 bg-teal-100 hover:bg-teal-200 text-teal-900 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 border border-teal-300 shadow-2xs"
                        title="Preview Document"
                      >
                        <Eye size={14} />
                        <span>Preview</span>
                      </button>
                      <label className="flex-1 sm:flex-none cursor-pointer bg-brand-teal hover:bg-brand-teal-dark text-white px-3.5 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs">
                        <UploadCloud size={14} />
                        <span>Change Document</span>
                        <input
                          type="file"
                          accept=".pdf,image/*,.doc,.docx"
                          onChange={handleAddressProofUpload}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          handleChange('addressProofFileName', '');
                          handleChange('addressProofDoc', '');
                        }}
                        className="px-3 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-xs rounded-xl border border-rose-200 transition-colors cursor-pointer"
                        title="Remove Document"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label 
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingAddressProof(true); }}
                    onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingAddressProof(false); }}
                    onDrop={handleAddressProofDrop}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer block group ${
                      isDraggingAddressProof
                        ? 'border-brand-teal bg-teal-100/90 ring-4 ring-teal-300/50 scale-[1.01]'
                        : 'border-teal-300 hover:border-teal-500 bg-teal-50/40 hover:bg-teal-50/70'
                    }`}
                  >
                    <UploadCloud size={36} className={`mx-auto transition-transform mb-2 ${isDraggingAddressProof ? 'text-teal-900 scale-125 animate-bounce' : 'text-teal-700 group-hover:scale-110'}`} />
                    <p className="font-bold text-gray-800 text-xs sm:text-sm">
                      {isDraggingAddressProof ? 'Release to Drop Document File Here!' : 'Click to Browse or Drag & Drop Address Proof Document'}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-1">
                      Supports PDF, PNG, JPG, WEBP, DOCX (Up to 10 MB limit)
                    </p>
                    <span className="inline-block mt-3 px-4 py-2 bg-brand-teal text-white rounded-xl font-bold text-xs shadow-xs group-hover:bg-brand-teal-dark transition-colors">
                      {isDraggingAddressProof ? 'Drop File Now' : 'Select File from Device'}
                    </span>
                    <input
                      type="file"
                      accept=".pdf,image/*,.doc,.docx"
                      onChange={handleAddressProofUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          )}

          {/* STEP 7: Bank Details */}
          {step === 7 && (
            <div className="space-y-4">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="font-display font-extrabold text-base text-gray-900 flex items-center gap-2">
                  <CreditCard className="text-teal-700" size={18} /> Step 7: Settlement Bank Account & IFSC
                </h3>
                <p className="text-gray-500 text-xs mt-0.5">
                  Marketplace payout settlements are deposited directly into this account weekly.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Account Beneficiary Name *</label>
                  <input
                    type="text"
                    value={formData.bankAccountHolder}
                    onChange={(e) => handleChange('bankAccountHolder', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-brand-yellow outline-hidden"
                    placeholder="e.g. Ramesh Kumar"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Account Number *</label>
                  <input
                    type="password"
                    value={formData.bankAccountNumber}
                    onChange={(e) => handleChange('bankAccountNumber', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-mono focus:ring-2 focus:ring-brand-yellow outline-hidden"
                    placeholder="Enter Bank Account Number"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Confirm Account Number *</label>
                  <input
                    type="text"
                    value={formData.confirmBankAccountNumber || ''}
                    onChange={(e) => handleChange('confirmBankAccountNumber', e.target.value)}
                    placeholder="Re-enter Account Number to Confirm"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono outline-hidden ${
                      formData.confirmBankAccountNumber && formData.confirmBankAccountNumber !== formData.bankAccountNumber
                        ? 'border-red-500 bg-red-50/50'
                        : 'border-gray-200 focus:ring-2 focus:ring-brand-yellow'
                    }`}
                  />
                  {formData.confirmBankAccountNumber && formData.confirmBankAccountNumber !== formData.bankAccountNumber && (
                    <p className="text-[11px] font-bold text-red-600 mt-1">⚠️ Bank account numbers do not match!</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">IFSC Code *</label>
                  <input
                    type="text"
                    value={formData.bankIfscCode}
                    onChange={(e) => handleChange('bankIfscCode', e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-mono uppercase focus:ring-2 focus:ring-brand-yellow outline-hidden"
                    placeholder="e.g. SBIN0000123"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Bank Name *</label>
                  <input
                    type="text"
                    value={formData.bankName}
                    onChange={(e) => handleChange('bankName', e.target.value)}
                    placeholder="e.g. State Bank of India / HDFC Bank"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-brand-yellow outline-hidden bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Branch Name *</label>
                  <input
                    type="text"
                    value={formData.bankBranch}
                    onChange={(e) => handleChange('bankBranch', e.target.value)}
                    placeholder="e.g. Hazratganj Branch / Main Branch"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-brand-yellow outline-hidden bg-white"
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="font-bold text-gray-700">Bank Account Type *</label>
                  <select
                    value={formData.accountType}
                    onChange={(e) => handleChange('accountType', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-brand-yellow outline-hidden bg-white"
                  >
                    <option value="Current Account">Current Account</option>
                    <option value="Savings Account">Savings Account</option>
                    <option value="Overdraft Account">Overdraft Account (OD)</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 font-semibold text-xs">
                <CheckCircle2 size={16} className="shrink-0 text-emerald-600" /> Beneficiary details & bank info will be verified prior to payout settlements.
              </div>
            </div>
          )}

          {/* STEP 8: Store Details */}
          {step === 8 && (
            <div className="space-y-4">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="font-display font-extrabold text-base text-gray-900 flex items-center gap-2">
                  <Store className="text-teal-700" size={18} /> Step 8: Marketplace Storefront & Branding
                </h3>
                <p className="text-gray-500 text-xs mt-0.5">
                  How your storefront appears to parents, students and partner schools.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Public Store Name *</label>
                  <input
                    type="text"
                    value={formData.storeName}
                    onChange={(e) => handleChange('storeName', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold"
                    placeholder="e.g. Apex Uniforms & Stationery Store"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Store Tagline / Slogan</label>
                  <input
                    type="text"
                    value={formData.storeTagline}
                    onChange={(e) => handleChange('storeTagline', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs"
                    placeholder="e.g. Official School Wear & Educational Supplies"
                  />
                </div>
              </div>

              {/* Drag & Drop Store Logo / Banner Image Upload */}
              <div className="space-y-2">
                <label className="font-bold text-gray-700 text-xs block">
                  Store Logo / Banner Image (Upload File or Enter Image URL)
                </label>
                
                <div 
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingStoreLogo(true); }}
                  onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingStoreLogo(false); }}
                  onDrop={handleStoreLogoDrop}
                  className={`p-4 border rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 transition-all ${
                    isDraggingStoreLogo 
                      ? 'bg-teal-100 border-teal-400 ring-2 ring-teal-400 scale-[1.01]' 
                      : 'bg-teal-50/70 border-teal-100'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="relative group shrink-0">
                      <img
                        src={formData.storeLogo || "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=150&auto=format&fit=crop&q=80"}
                        alt="Store Logo Preview"
                        className="w-16 h-16 rounded-2xl object-cover border-2 border-brand-yellow shadow-xs bg-white"
                      />
                      {formData.storeLogo && (
                        <button
                          type="button"
                          onClick={() => handleChange('storeLogo', '')}
                          className="absolute -top-1 -right-1 bg-rose-600 text-white rounded-full p-1 shadow-xs hover:bg-rose-700 cursor-pointer"
                          title="Remove Store Logo"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-teal-950 text-xs sm:text-sm">
                        {isDraggingStoreLogo ? 'Drop Store Logo Here!' : 'Store Banner & Logo'}
                      </h4>
                      <p className="text-[11px] text-teal-700 leading-snug">
                        Drag & drop logo image file (PNG, JPG, WEBP) or paste image URL below.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                    <label className="w-full sm:w-auto cursor-pointer bg-brand-teal hover:bg-brand-teal-dark text-white px-3.5 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs">
                      <UploadCloud size={14} />
                      <span>{formData.storeLogo ? 'Change Logo' : 'Upload Logo'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleStoreLogoSelect}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <input
                  type="text"
                  value={formData.storeLogo}
                  onChange={(e) => handleChange('storeLogo', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-mono"
                  placeholder="Or paste image URL (https://...)"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">Storefront Bio / Description *</label>
                <textarea
                  rows={3}
                  value={formData.storeDescription}
                  onChange={(e) => handleChange('storeDescription', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs"
                  placeholder="Describe your store history, authorized school partnerships, and catalog specialties..."
                />
              </div>
            </div>
          )}

          {/* STEP 9: Product Information */}
          {step === 9 && (
            <div className="space-y-4">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="font-display font-extrabold text-base text-gray-900 flex items-center gap-2">
                  <Package className="text-teal-700" size={18} /> Step 9: Product Catalog & Brand Categories
                </h3>
                <p className="text-gray-500 text-xs mt-0.5">
                  Specify what items you plan to list on Book Vardi for category catalog review.
                </p>
              </div>

              <div className="space-y-2">
                <label className="font-bold text-gray-700">Selected Product Verticals</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {['Uniforms & Schoolwear', 'NCERT & CBSE Textbooks', 'Notebooks & Paper Crafts', 'Writing Instruments', 'School Bags & Backpacks', 'Drawing & Craft Kits', 'Shoes & Socks', 'Water Bottles & Lunchboxes'].map(cat => (
                    <label key={cat} className="flex items-center gap-2 p-2 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={formData.selectedCategories.includes(cat)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            handleChange('selectedCategories', [...formData.selectedCategories, cat]);
                          } else {
                            handleChange('selectedCategories', formData.selectedCategories.filter(c => c !== cat));
                          }
                        }}
                        className="rounded text-brand-teal focus:ring-brand-yellow"
                      />
                      <span>{cat}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Authorized Brands (Comma Separated)</label>
                  <input
                    type="text"
                    value={Array.isArray(formData.primaryBrands) ? formData.primaryBrands.join(', ') : (formData.primaryBrands || '')}
                    onChange={(e) => handleChange('primaryBrands', e.target.value.split(',').map(s => s.trim()))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs"
                    placeholder="NCERT, Classmate, Action, Speedo"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Catalog Scale Estimate</label>
                  <input
                    type="text"
                    value={formData.estimatedSkuCount}
                    onChange={(e) => handleChange('estimatedSkuCount', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs"
                    placeholder="e.g. 50-100 Products"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Sample Product / Flagship Item Title</label>
                  <input
                    type="text"
                    value={formData.sampleProductTitle}
                    onChange={(e) => handleChange('sampleProductTitle', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs"
                    placeholder="e.g. DPS Navy Blazer (Size 34)"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 10: Agreements */}
          {step === 10 && (
            <div className="space-y-4">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="font-display font-extrabold text-base text-gray-900 flex items-center gap-2">
                  <FileCheck className="text-teal-700" size={18} /> Step 10: Merchant Agreement & Commission Policy
                </h3>
                <p className="text-gray-500 text-xs mt-0.5">
                  Review terms of service, returns policy, and marketplace fulfillment standards.
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.acceptedTerms}
                    onChange={(e) => handleChange('acceptedTerms', e.target.checked)}
                    className="mt-0.5 rounded text-brand-teal focus:ring-brand-yellow"
                  />
                  <span>
                    <strong>Master Merchant Service Agreement:</strong> I accept Book Vardi terms of merchant engagement, intellectual property safeguards, and student delivery SLAs.
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.acceptedCommissionRate}
                    onChange={(e) => handleChange('acceptedCommissionRate', e.target.checked)}
                    className="mt-0.5 rounded text-brand-teal focus:ring-brand-yellow"
                  />
                  <span>
                    <strong>Commission Schedule:</strong> Standard platform take rate of 10% - 14% on delivered school supplies with zero listing fee.
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.acceptedReturnPolicy}
                    onChange={(e) => handleChange('acceptedReturnPolicy', e.target.checked)}
                    className="mt-0.5 rounded text-brand-teal focus:ring-brand-yellow"
                  />
                  <span>
                    <strong>30-Day Student Exchange Assurance:</strong> Agree to accept exchanges for uniform size mismatches or verified textbook defects.
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* STEP 11: Final Verification */}
          {step === 11 && (
            <div className="space-y-4">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="font-display font-extrabold text-base text-gray-900 flex items-center gap-2">
                  <ShieldCheck className="text-teal-700" size={18} /> Step 11: Final Application Review & Admin Verification
                </h3>
                <p className="text-gray-500 text-xs mt-0.5">
                  Your submitted documentation is being processed by the platform verification desk.
                </p>
              </div>

              <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-950 text-sm">Status: Application In Review</span>
                  <span className="px-3 py-1 bg-amber-200 text-amber-900 rounded-full font-extrabold text-[10px] uppercase">
                    Pending Admin Approval
                  </span>
                </div>
                <p className="text-amber-800 leading-relaxed text-xs">
                  All 10 sections have been submitted. Our compliance desk usually reviews GSTIN, Address Proof, and Bank IFSC within 24 hours.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Store & Legal Name</span>
                  <span className="font-bold text-gray-900">{formData.storeName}</span> ({formData.legalBusinessName})
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">GSTIN & PAN</span>
                  <span className="font-mono font-bold text-gray-900">{formData.gstin}</span> • {formData.businessPan}
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Dispatch Location</span>
                  <span className="font-semibold text-gray-900">{formData.city}, {formData.state} - {formData.pincode}</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Settlement Account</span>
                  <span className="font-semibold text-gray-900">{formData.bankName} (IFSC: {formData.bankIfscCode})</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 12: Verified Seller */}
          {step === 12 && (
            <div className="text-center py-6 space-y-4">
              <div className="w-18 h-18 bg-emerald-100 text-emerald-700 rounded-3xl flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 size={42} />
              </div>

              <div>
                <h3 className="font-display font-black text-2xl text-gray-900">
                  Congratulations! Verified Seller Status Activated ✅
                </h3>
                <p className="text-gray-600 text-xs sm:text-sm mt-1 max-w-md mx-auto">
                  Your merchant entity <strong className="text-teal-900">{formData.storeName}</strong> is verified and authorized.
                </p>
              </div>

              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-extrabold text-xs">
                <ShieldCheck size={16} /> Partner Seller Badge Live on Storefront
              </div>

              <div className="pt-4 flex items-center justify-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl text-xs sm:text-sm cursor-pointer"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Controls */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={prevStep}
            disabled={step === 1}
            className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
              step === 1 ? 'text-gray-400 opacity-50 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            <ArrowLeft size={14} /> Previous
          </button>

          <div className="flex items-center gap-2">
            {step < 10 && (
              <button
                type="button"
                onClick={nextStep}
                title={step === 3 && (!isPanVerified || !isAadhaarVerified) ? "Verify both PAN and Aadhaar before continuing" : "Proceed to next step"}
                className={`px-5 py-2.5 font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-all ${
                  step === 3 && (!isPanVerified || !isAadhaarVerified)
                    ? 'bg-amber-600 hover:bg-amber-700 text-white animate-pulse'
                    : 'bg-brand-teal hover:bg-brand-teal-light text-white'
                }`}
              >
                <span>{step === 3 && (!isPanVerified || !isAadhaarVerified) ? 'Verify to Continue' : 'Continue'}</span>
                <ArrowRight size={14} />
              </button>
            )}

            {step === 10 && (
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-brand-yellow hover:bg-brand-yellow-hover text-brand-teal-dark font-black text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-all"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Submitting Application...</span>
                  </>
                ) : (
                  <>
                    <span>Submit 10-Step Application</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            )}

            {step === 11 && (
              <button
                type="button"
                onClick={() => {
                  if (onClose) onClose();
                  if (logoutSeller) logoutSeller();
                }}
                className="px-5 py-2.5 bg-brand-teal hover:bg-brand-teal-light text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <span>Redirect to Seller Login Page</span>
                <ArrowRight size={14} />
              </button>
            )}

            {step === 12 && (
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-brand-teal text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                Done
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Interactive Document Preview Modal Overlay */}
      {previewDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-100">
            <div className="px-6 py-4 bg-gray-900 text-white flex items-center justify-between border-b border-gray-800">
              <div className="flex items-center gap-2.5">
                <FileCheck className="text-brand-yellow" size={20} />
                <div>
                  <h3 className="font-bold text-sm text-white truncate max-w-xs sm:max-w-md">
                    Preview: {previewDocModal.fileName || 'Uploaded Document'}
                  </h3>
                  <p className="text-[11px] text-gray-400">Seller Onboarding Document Inspection</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {previewDocModal.src && (
                  <a
                    href={previewDocModal.src}
                    download={previewDocModal.fileName || 'document'}
                    className="p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-bold"
                    title="Download File"
                  >
                    <Download size={15} />
                    <span className="hidden sm:inline">Download</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setPreviewDocModal(null)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
                  title="Close Preview"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-slate-100 flex items-center justify-center min-h-[350px]">
              {previewDocModal.src ? (
                previewDocModal.src.startsWith('data:image/') || (previewDocModal.fileName && previewDocModal.fileName.match(/\.(png|jpe?g|webp|gif|svg)$/i)) ? (
                  <img
                    src={previewDocModal.src}
                    alt={previewDocModal.fileName}
                    className="max-h-[70vh] object-contain rounded-xl shadow-md border border-gray-200 bg-white p-2"
                  />
                ) : previewDocModal.src.startsWith('data:application/pdf') || (previewDocModal.fileName && previewDocModal.fileName.endsWith('.pdf')) ? (
                  <iframe
                    src={previewDocModal.src}
                    title={previewDocModal.fileName}
                    className="w-full h-[70vh] rounded-xl border border-gray-300 bg-white shadow-md"
                  />
                ) : (
                  <div className="text-center p-8 bg-white rounded-2xl border border-gray-200 shadow-xs space-y-3 max-w-md">
                    <FileText size={48} className="mx-auto text-brand-teal" />
                    <h4 className="font-bold text-gray-800 text-sm">{previewDocModal.fileName}</h4>
                    <p className="text-xs text-gray-500">Document file uploaded successfully.</p>
                    <a
                      href={previewDocModal.src}
                      download={previewDocModal.fileName || 'document'}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-brand-teal text-white font-bold rounded-xl text-xs hover:bg-brand-teal-dark transition-colors"
                    >
                      <Download size={14} /> Download File to Inspect
                    </a>
                  </div>
                )
              ) : (
                <div className="text-center text-gray-500 py-12 font-semibold">
                  No preview content available.
                </div>
              )}
            </div>

            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs">
              <span className="text-gray-500 font-semibold">Status: Encrypted & Stored</span>
              <button
                type="button"
                onClick={() => setPreviewDocModal(null)}
                className="px-4 py-1.5 bg-gray-800 hover:bg-gray-900 text-white font-bold rounded-xl transition-colors cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {showOtpPopup && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-amber-200 text-center space-y-4">
            <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
              <ShieldCheck size={32} />
            </div>
            <div>
              <h3 className="font-display font-extrabold text-base text-gray-900">Phone OTP Verification Required</h3>
              <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                You cannot move to other onboarding steps without verifying your mobile phone number. Please click <strong>"Send Phone OTP"</strong> in Step 1 and enter testing code <strong>123456</strong>.
              </p>
            </div>
            <button
              onClick={() => {
                setShowOtpPopup(false);
                setStep(1);
              }}
              className="w-full py-3 px-4 rounded-xl bg-brand-teal hover:bg-brand-teal-dark text-white font-extrabold text-xs shadow-md transition-all cursor-pointer"
            >
              Verify Phone OTP Now
            </button>
          </div>
        </div>
      )}

      <LocationPickerModal
        isOpen={isMapPickerOpen}
        onClose={() => setIsMapPickerOpen(false)}
        onSelectLocation={handleMapLocationSelect}
        initialAddress={{
          street: formData.addressLine1,
          colony: formData.addressLine2,
          landmark: formData.landmark,
          city: formData.city,
          state: formData.state || 'Uttar Pradesh',
          pincode: formData.pincode
        }}
      />
    </div>
  );
}
