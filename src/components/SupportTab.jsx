import React, { useState } from 'react';
import { 
  HelpCircle, 
  MessageSquare, 
  Phone, 
  Mail, 
  FileText, 
  CheckCircle2, 
  Send, 
  ExternalLink 
} from 'lucide-react';

export default function SupportTab() {
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketCategory, setTicketCategory] = useState('payout');
  const [submitted, setSubmitted] = useState(false);

  const handleTicketSubmit = (e) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketMessage.trim()) return;
    setSubmitted(true);
    setTimeout(() => {
      setTicketSubject('');
      setTicketMessage('');
      setSubmitted(false);
    }, 3000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <HelpCircle className="text-teal-700" size={24} /> Seller Support & Priority Helpdesk
        </h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Dedicated seller assistance, school tender compliance, order disputes, and payout queries
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Support Cards */}
        <div className="space-y-4 md:col-span-1">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-2 text-xs">
            <div className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <Phone className="text-teal-700" size={16} /> Dedicated Partner Manager
            </div>
            <p className="text-gray-600">Sumit Anand (North India Operations)</p>
            <div className="font-semibold text-teal-800">+91 98110 54321</div>
            <div className="text-[11px] text-gray-400">Available Mon-Sat • 9:00 AM - 7:00 PM</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-2 text-xs">
            <div className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <Mail className="text-teal-700" size={16} /> Seller Escalation Email
            </div>
            <p className="text-gray-600">Direct query resolution within 4 business hours</p>
            <div className="font-semibold text-teal-800">sellers@bookvardi.in</div>
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
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 font-bold animate-in fade-in">
              <CheckCircle2 size={18} className="text-emerald-600" />
              Ticket #TKT-{Math.floor(10000 + Math.random() * 90000)} logged! Our support team will contact you shortly.
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
              className="px-6 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2"
            >
              <Send size={15} /> Submit Support Request
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
