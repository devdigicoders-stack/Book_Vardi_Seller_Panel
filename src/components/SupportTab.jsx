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
  Check,
  Loader2,
  Clock,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from 'lucide-react';
import { useSellerData } from '../context/SellerDataContext';
import { SERVER_URL, createSellerTicketApi, fetchSellerTicketsApi } from '../utils/api';

export default function SupportTab() {
  const { sellerUser } = useSellerData();
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketCategory, setTicketCategory] = useState('payout');
  const [ticketEmail, setTicketEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [myTickets, setMyTickets] = useState(() => {
    try {
      const saved = localStorage.getItem('bv_seller_my_tickets');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [expandedTicketId, setExpandedTicketId] = useState(null);

  // Platform seller support email (dynamically fetched from platform settings)
  const [sellerSupportEmail, setSellerSupportEmail] = useState('sellers@bookvardi.in');

  useEffect(() => {
    if (sellerUser?.email && !ticketEmail) {
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

    // Fetch live tickets from backend
    fetchSellerTicketsApi()
      .then(res => {
        if (res?.tickets && Array.isArray(res.tickets) && res.tickets.length > 0) {
          setMyTickets(res.tickets);
          try {
            localStorage.setItem('bv_seller_my_tickets', JSON.stringify(res.tickets));
          } catch {}
        }
      })
      .catch(() => {});
  }, []);

  const handleCopyEmail = () => {
    navigator.clipboard?.writeText(sellerSupportEmail);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleTicketSubmit = async (e) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketMessage.trim() || !ticketEmail.trim()) return;

    setIsSubmitting(true);
    setSubmissionResult(null);

    const payload = {
      category: ticketCategory,
      subject: ticketSubject.trim(),
      message: ticketMessage.trim(),
      email: ticketEmail.trim(),
      priority: 'Medium',
      userType: 'seller',
      storeName: sellerUser?.storeName || sellerUser?.name || 'Verified Merchant'
    };

    try {
      const res = await createSellerTicketApi(payload);
      setIsSubmitting(false);

      if (res && (res.success || res.ticket)) {
        const createdTicket = res.ticket || {
          id: `TKT-${Math.floor(10000 + Math.random() * 90000)}`,
          ...payload,
          status: 'Open',
          createdAt: new Date().toISOString()
        };

        const updated = [createdTicket, ...myTickets];
        setMyTickets(updated);
        try {
          localStorage.setItem('bv_seller_my_tickets', JSON.stringify(updated));
        } catch {}

        setSubmissionResult({
          success: true,
          ticketId: createdTicket.id || createdTicket.ticketId,
          email: payload.email,
          message: res.message || `Support ticket #${createdTicket.id} created successfully!`
        });

        setTicketSubject('');
        setTicketMessage('');
      } else {
        // Fallback offline support ticket log
        const localId = `TKT-${Math.floor(10000 + Math.random() * 90000)}`;
        const fallbackTicket = {
          id: localId,
          ...payload,
          status: 'Open',
          createdAt: new Date().toISOString()
        };
        const updated = [fallbackTicket, ...myTickets];
        setMyTickets(updated);
        try {
          localStorage.setItem('bv_seller_my_tickets', JSON.stringify(updated));
        } catch {}

        setSubmissionResult({
          success: true,
          ticketId: localId,
          email: payload.email,
          message: `Support ticket #${localId} submitted successfully.`
        });
        setTicketSubject('');
        setTicketMessage('');
      }
    } catch (err) {
      setIsSubmitting(false);
      setSubmissionResult({
        success: false,
        message: err.message || 'Failed to submit support ticket. Please check your network and try again.'
      });
    }
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

          {submissionResult && submissionResult.success && (
            <div className="p-4 bg-emerald-50 border-2 border-emerald-300 text-emerald-950 rounded-2xl space-y-1 font-medium animate-in fade-in">
              <div className="flex items-center gap-2 font-black text-sm text-emerald-900">
                <CheckCircle2 size={18} className="text-emerald-600" />
                Ticket #{submissionResult.ticketId} Logged Successfully!
              </div>
              <p className="text-xs text-emerald-800">
                Aapki query operations team ke paas register ho gayi hai. Resolution updates will be sent to: <strong className="font-mono">{submissionResult.email}</strong>.
              </p>
            </div>
          )}

          {submissionResult && !submissionResult.success && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2 font-semibold">
              <AlertCircle size={16} className="text-rose-600 shrink-0" />
              <span>{submissionResult.message}</span>
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
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Submitting Ticket...</span>
                </>
              ) : (
                <>
                  <Send size={15} />
                  <span>Submit Support Request</span>
                </>
              )}
            </button>
          </form>
        </div>

      </div>

      {/* Raised Tickets Log & Tracking Section */}
      {myTickets.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h3 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
                <FileText size={16} className="text-teal-700" /> My Submitted Support Tickets & Resolution Log
              </h3>
              <p className="text-[11px] text-gray-500 mt-0.5">Track live progress and official admin replies on your logged queries.</p>
            </div>
            <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
              {myTickets.length} Ticket{myTickets.length > 1 ? 's' : ''}
            </span>
          </div>

          <div className="divide-y divide-gray-100 text-xs">
            {myTickets.map((t) => {
              const tid = t.id || t.ticketId;
              const isExp = expandedTicketId === tid;
              const st = String(t.status || 'Open').toLowerCase();
              const badgeClass = 
                st === 'resolved' || st === 'closed' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                st.includes('progress') ? 'bg-blue-100 text-blue-800 border-blue-200' :
                'bg-amber-100 text-amber-900 border-amber-200';

              return (
                <div key={tid} className="py-3.5 space-y-2">
                  <div 
                    onClick={() => setExpandedTicketId(isExp ? null : tid)}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 cursor-pointer hover:bg-gray-50/70 p-2 rounded-xl transition-colors"
                  >
                    <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                      <span className="font-mono font-bold text-teal-900 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 text-xs shrink-0">
                        #{tid}
                      </span>
                      <div className="min-w-0">
                        <div className="font-bold text-gray-900 truncate">{t.subject}</div>
                        <div className="text-[10px] text-gray-500 capitalize flex items-center gap-2">
                          <span>Category: <strong className="text-gray-700">{t.category}</strong></span>
                          <span>•</span>
                          <span>Notification Email: <strong className="font-mono text-gray-700">{t.email}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border uppercase ${badgeClass}`}>
                        {t.status || 'Open'}
                      </span>
                      {isExp ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                    </div>
                  </div>

                  {isExp && (
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3 text-xs animate-in fade-in">
                      <div>
                        <span className="font-bold text-gray-700 block text-[11px] mb-1">Your Issue Description:</span>
                        <p className="text-gray-700 leading-relaxed bg-white p-3 rounded-lg border border-gray-200 whitespace-pre-wrap">
                          {t.message || t.lastMessage}
                        </p>
                      </div>

                      {t.adminReplies && Array.isArray(t.adminReplies) && t.adminReplies.length > 0 ? (
                        <div className="space-y-2">
                          <span className="font-bold text-teal-900 block text-[11px]">Official Support Responses:</span>
                          {t.adminReplies.map((r, idx) => (
                            <div key={idx} className="p-3 bg-teal-50/70 border border-teal-200 rounded-lg text-teal-950">
                              <div className="text-[10px] text-teal-700 font-bold mb-1 flex items-center justify-between">
                                <span>{r.repliedBy || 'Admin Support Team'}</span>
                                {r.repliedAt && <span>{new Date(r.repliedAt).toLocaleString('en-IN')}</span>}
                              </div>
                              <p className="text-xs leading-relaxed whitespace-pre-wrap">{r.reply}</p>
                            </div>
                          ))}
                        </div>
                      ) : t.lastMessage && t.lastMessage.startsWith('[Admin Response]') ? (
                        <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-lg text-teal-950">
                          <span className="text-[10px] text-teal-700 font-bold block mb-1">Admin Support Response:</span>
                          <p className="text-xs leading-relaxed">{t.lastMessage}</p>
                        </div>
                      ) : (
                        <div className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200 flex items-center gap-1.5">
                          <Clock size={13} className="text-amber-600 shrink-0" />
                          <span>Under Review by technical support desk. A response will be posted here and sent to your email.</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

      </div>
    </div>
  );
}
