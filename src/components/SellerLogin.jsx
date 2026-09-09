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
  Building2
} from 'lucide-react';
import { useSellerData, APPROVED_SELLER_ROLES } from '../context/SellerDataContext';

export default function SellerLogin() {
  const { loginSeller } = useSellerData();
  const [email, setEmail] = useState('merchant@bookvardi.in');
  const [password, setPassword] = useState('••••••••');
  const [role, setRole] = useState('Partner Merchant');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!APPROVED_SELLER_ROLES.includes(role)) {
        throw new Error('Access Restricted: Only approved partner merchants & authorized store managers may access this hub.');
      }
      loginSeller({ email, role });
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
      setLoading(false);
    }
  };

  const handleQuickLogin = (selectedRole, customEmail) => {
    setRole(selectedRole);
    setEmail(customEmail);
    loginSeller({ email: customEmail, role: selectedRole });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-950 via-brand-teal to-teal-900 flex items-center justify-center p-4 selection:bg-brand-yellow/30 selection:text-brand-yellow relative overflow-hidden">
      
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
              Secure authentication for verified suppliers, uniform vendors & academic publishers.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2.5 text-xs text-red-700 animate-in fade-in">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Authorization Denied</p>
                <p className="text-[11px] text-red-600 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Authorized Merchant Email
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-brand-yellow outline-hidden transition-all bg-gray-50/50 focus:bg-white"
                  placeholder="merchant@bookvardi.in"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Password / Master Access Token
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-brand-yellow outline-hidden transition-all bg-gray-50/50 focus:bg-white"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Approved Merchant Role
              </label>
              <div className="relative">
                <UserCheck size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-brand-yellow outline-hidden transition-all bg-white cursor-pointer font-medium"
                >
                  {APPROVED_SELLER_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r} (Approved)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-brand-teal hover:bg-brand-teal-light text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <ShieldCheck size={16} className="text-brand-yellow" />
              <span>{loading ? 'Verifying Credentials...' : 'Sign In to Seller Hub'}</span>
              <ArrowRight size={14} />
            </button>
          </form>

          {/* Demo Quick Sign-in Section */}
          <div className="mt-6 pt-5 border-t border-gray-100">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-extrabold uppercase text-gray-400 tracking-wider">
                Quick Demo Sign-In
              </span>
              <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 size={11} /> 100% Pre-Approved
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('Partner Merchant', 'merchant@bookvardi.in')}
                className="p-2 text-left bg-teal-50/70 hover:bg-teal-100/70 border border-teal-100 rounded-xl transition-colors cursor-pointer"
              >
                <span className="font-bold text-[11px] text-teal-950 block">Partner Merchant</span>
                <span className="text-[10px] text-teal-700 truncate block">Primary Store Admin</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('Store Manager', 'manager@bookvardi.in')}
                className="p-2 text-left bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors cursor-pointer"
              >
                <span className="font-bold text-[11px] text-gray-900 block">Store Manager</span>
                <span className="text-[10px] text-gray-500 truncate block">Catalog & Orders Ops</span>
              </button>
            </div>
          </div>

          {/* Links back to Storefront */}
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
    </div>
  );
}
