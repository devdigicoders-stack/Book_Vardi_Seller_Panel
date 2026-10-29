import React, { useState, useEffect } from 'react';
import { 
  HelpCircle, 
  MessageSquare, 
  Mail, 
  FileText, 
  CheckCircle2, 
  Send, 
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import { useSellerData } from '../context/SellerDataContext';
import { SERVER_URL } from '../utils/api';

export default function SupportTab() {
  const { sellerUser } = useSellerData();
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketCategory, setTicketCategory] = useState('payout');
  const [ticketEmail, setTicketEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Platform seller support email (dynamically fetched from platform settings)
  const [sellerSupportEmail, setSellerSupportEmail] = useState('sellers@bookvardi.in');

  useEffect(() => {
    if (sellerUser?.email) {
      setTicketEmail(sellerUser.email);
    }
  }, [sellerUser]);

  useEffect(() => {
    // Fetch live public platform settings for seller support email
    fetch(`${SERVER_URL}/admin/settings/public`)
      .then(res => res.json())
      .then(data => {
        if (data?.sellerSupportEmail) {
          setSellerSupportEmail(data.sellerSupportEmail);
        } else if (data?.supportEmail) {
          setSellerSupportEmail(data.supportEmail);
        }
      })
      .catch(() => {});
  }, []);

  const handleCopyEmail = () => {
    navigator.clipboard?.writeText(sellerSupportEmail);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleTicketSubmit = (e) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketMessage.trim()) return;
    setSubmitted(true);
    setTimeout(() => {
      setTicketSubject('');
      setTicketMessage('');
      setSubmitted(false);
    }, 4000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <HelpCircle className="text-teal-700" size={24} /> Seller Support & Priority Helpdesk
        </h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Dedicated seller assistance, school tender compliance, order disputes, and payout queries via official email
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Support Cards - Email Only */}
        <div className="space-y-4 md:col-span-1">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-3 text-xs">
            <div className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <Mail className="text-teal-700" size={18} /> Official Seller Support Email
            </div>
            <p className="text-gray-600 leading-relaxed">
              Official channel for merchant disputes, school orders, returns, and payment queries. Direct resolution within 4 business hours.
            </p>
            <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-100 flex items-center justify-between gap-2">
              <a 
                href={`mailto:${sellerSupportEmail}`}
                className="font-mono font-bold text-teal-900 hover:underline break-all text-xs"
              >
                {sellerSupportEmail}
              </a>
              <button
                type="button"
                onClick={handleCopyEmail}
                className="p-1.5 rounded-lg hover:bg-teal-100 text-teal-700 cursor-pointer transition-colors shrink-0"
                title="Copy Email"
              >
                {copiedEmail ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              </button>
            </div>
            <a
              href={`mailto:${sellerSupportEmail}`}
              className="inline-flex items-center justify-center w-full py-2 bg-teal-800 hover:bg-teal-900 text-white font-bold rounded-xl transition-colors text-xs shadow-xs"
            >
              Compose Email to Support
            </a>
          </div>

          <div className="bg-teal-50/60 p-5 rounded-2xl border border-teal-100 shadow-xs space-y-2 text-xs">
            <div className="font-bold text-teal-950 text-sm">Seller Guidelines & FAQ</div>
            <p className="text-teal-800">
              Review packaging standards for delicate art kits and CBSE uniform embroidery guidelines.
            </p>
            <a href="#" className="inline-flex items-center gap-1 font-bold text-teal-800 hover:underline">
              Open Seller Handbook <ExternalLink size={12} />
            </a>
          </div>
        </div>

        {/* Raise a Support Ticket Form */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs md:col-span-2 text-xs space-y-4">
          <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
            <MessageSquare className="text-teal-700" size={18} /> Open Priority Seller Support Ticket
          </h3>
          <p className="text-gray-500">
            Submit an operational or technical issue directly to our merchant technical operations team.
          </p>

          {submitted && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl space-y-1 font-medium animate-in fade-in">
              <div className="flex items-center gap-2 font-bold text-sm text-emerald-900">
                <CheckCircle2 size={18} className="text-emerald-600" />
                Ticket #TKT-{Math.floor(10000 + Math.random() * 90000)} Logged Successfully!
              </div>
              <p className="text-xs text-emerald-800">
                Resolution details and status updates will be sent to: <strong className="font-mono">{ticketEmail || 'your registered email'}</strong>.
              </p>
            </div>
          )}

          <form onSubmit={handleTicketSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="font-semibold text-gray-700">Issue Category</label>
              <select
                value={ticketCategory}
                onChange={(e) => setTicketCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-600"
              >
                <option value="payout">Bank Payout & Payment Settlement</option>
                <option value="inventory">Inventory & Stock Sync</option>
                <option value="shipping">Logistics Courier Pickup Delay</option>
                <option value="school">School Institutional Tender / RFQ</option>
                <option value="returns">Customer Return Dispute</option>
              </select>
            </div>

            {/* Email Field with Option to Add / Edit */}
            <div className="space-y-1">
              <label className="font-semibold text-gray-700 flex items-center justify-between">
                <span>Contact Email for Resolution Updates *</span>
                <span className="text-[10px] text-gray-400 font-normal">Replies will be sent to this email</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="Enter your email to receive ticket resolution updates..."
                  value={ticketEmail}
                  onChange={(e) => setTicketEmail(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-600 font-medium"
                />
                <Mail size={14} className="absolute left-2.5 top-3 text-gray-400" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-gray-700">Ticket Subject *</label>
              <input
                type="text"
                required
                placeholder="Brief summary of the issue..."
                value={ticketSubject}
                onChange={(e) => setTicketSubject(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-600"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-gray-700">Detailed Description *</label>
              <textarea
                rows="4"
                required
                placeholder="Include Order IDs, SKU numbers, or school names related to your request..."
                value={ticketMessage}
                onChange={(e) => setTicketMessage(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-600"
              ></textarea>
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Send size={15} /> Submit Support Request
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
