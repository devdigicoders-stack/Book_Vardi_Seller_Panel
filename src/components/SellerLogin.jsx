import React, { useState } from 'react';
import { 
  Store, 
  Lock, 
  Mail, 
  UserCheck, 
  AlertCircle, 
  ArrowRight, 
  Sparkles,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Phone,
  X
} from 'lucide-react';
import { useSellerData } from '../context/SellerDataContext';
import SellerRegistrationModal from './SellerRegistrationModal';

export default function SellerLogin() {
  const { loginSellerByPhone } = useSellerData();
  const [phone, setPhone] = useState('9876543210');
  const [otpSent, setOtpSent] = useState(false);
  const [mobileOtp, setMobileOtp] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Top-center rectangular error toast notification state
  const [topCenterError, setTopCenterError] = useState(null);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  const handleSendOtp = (e) => {
    e.preventDefault();
    setTopCenterError(null);

    const result = loginSellerByPhone(phone);
    if (!result.success) {
      setTopCenterError(result.message);
      return;
    }

    setOtpSent(true);
    setMobileOtp('123456');
  };

  const handleVerifyOtpAndLogin = (e) => {
    e.preventDefault();
    if (!mobileOtp || mobileOtp.trim() !== '123456') {
      setTopCenterError('Invalid OTP code. Please enter testing code 123456.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      loginSellerByPhone(phone);
      setLoading(false);
    }, 400);
  };

  const handleQuickLogin = (customPhone) => {
    setPhone(customPhone);
    const result = loginSellerByPhone(customPhone);
    if (!result.success) {
      setTopCenterError(result.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-950 via-brand-teal to-teal-900 flex items-center justify-center p-4 selection:bg-brand-yellow/30 selection:text-brand-yellow relative overflow-hidden">
      
      {/* Top Center Rectangular Error Toast Notification Card */}
      {topCenterError && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 max-w-lg w-full px-4 animate-in fade-in slide-in-from-top-4">
          <div className="bg-rose-950 text-white p-4 rounded-2xl shadow-2xl border-2 border-rose-500 flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <AlertCircle size={22} className="text-rose-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-extrabold text-sm text-rose-200">Seller Authorization Denied</h4>
                <p className="text-xs text-rose-300 mt-0.5 leading-snug">{topCenterError}</p>
              </div>
            </div>
            <button 
              onClick={() => setTopCenterError(null)} 
              className="text-rose-400 hover:text-white p-1 cursor-pointer transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Ambient glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-yellow/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-brand-pink/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full relative z-10">
        
        {/* Card */}
        <div className="bg-white rounded-3xl p-8 shadow-2xl border border-white/20 backdrop-blur-md">
          
          {/* Header */}
          <div className="text-center space-y-2 mb-6">
            <div className="flex justify-center">
              <img
                src="/logo.png"
                alt="Book Vardi"
                className="h-16 w-auto object-contain bg-white p-1.5 rounded-2xl shadow-md border border-gray-100"
              />
            </div>
            
            <div className="pt-2">
              <h1 className="font-display text-2xl font-black tracking-tight text-gray-900">
                BOOK<span className="text-brand-yellow">VARDI</span>
              </h1>
              <span className="inline-block px-3 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-50 text-teal-800 border border-teal-200 uppercase tracking-widest mt-1">
                Merchant & Seller Portal
              </span>
            </div>
            
            <p className="text-xs text-gray-500 max-w-xs mx-auto">
              Login via registered mobile phone number to manage store catalog, orders & payouts.
            </p>
          </div>

          {/* Form */}
          {!otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Registered Seller Mobile Phone Number *
                </label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (topCenterError) setTopCenterError(null);
                    }}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-brand-yellow outline-hidden transition-all bg-gray-50/50 focus:bg-white font-mono"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-3 px-4 rounded-xl bg-brand-teal hover:bg-brand-teal-light text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShieldCheck size={16} className="text-brand-yellow" />
                <span>Send Login Phone OTP</span>
                <ArrowRight size={14} />
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtpAndLogin} className="space-y-4">
              <div className="bg-teal-50 p-4 rounded-2xl border border-teal-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-teal-950 text-xs">Enter Mobile OTP</span>
                  <span className="text-[10px] text-amber-700 font-extrabold bg-amber-100 px-2 py-0.5 rounded-md">
                    Testing Code: 123456
                  </span>
                </div>
                <p className="text-[11px] text-teal-700">
                  Verification OTP dispatched to <strong>+91 {phone}</strong>
                </p>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={mobileOtp}
                  onChange={(e) => setMobileOtp(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-teal-200 text-center font-mono tracking-widest text-sm focus:ring-2 focus:ring-brand-yellow outline-hidden bg-white"
                  placeholder="123456"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setOtpSent(false)}
                  className="w-1/3 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs cursor-pointer"
                >
                  Change Phone
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-2/3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? 'Verifying...' : 'Verify OTP & Sign In'}
                  <CheckCircle2 size={16} />
                </button>
              </div>
            </form>
          )}

          {/* Registration Section */}
          <div className="mt-6 pt-5 border-t border-gray-100 text-center space-y-3">
            <p className="text-xs text-gray-600 font-medium">
              Don't have an authorized seller account yet?
            </p>
            <button
              type="button"
              onClick={() => setIsRegisterOpen(true)}
              className="w-full py-2.5 px-4 rounded-xl bg-brand-yellow hover:bg-brand-yellow-hover text-brand-teal-dark font-black text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer border border-brand-yellow"
            >
              <Store size={15} />
              <span>Register New Seller Store (12-Step KYC)</span>
            </button>
          </div>

          {/* Link back to Storefront */}
          <div className="mt-5 text-center">
            <a
              href="http://localhost:5173"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-800 hover:text-teal-950 transition-colors"
            >
              <span>Back to Customer Storefront</span>
              <ExternalLink size={12} />
            </a>
          </div>

        </div>

      </div>

      {/* 12-Step Seller Registration Modal */}
      <SellerRegistrationModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
      />
    </div>
  );
}
