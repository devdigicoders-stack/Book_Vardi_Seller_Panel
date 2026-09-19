import React, { useState, useMemo } from 'react';
import { 
  Star, 
  MessageSquare, 
  Trash2, 
  Send, 
  CheckCircle2, 
  Search,
  Filter,
  ArrowUpDown,
  Clock,
  Sparkles,
  ChevronDown,
  X
} from 'lucide-react';
import { useSellerData } from '../context/SellerDataContext';

export default function ReviewsTab() {
  const { reviews, approveReview, replyToReview, deleteReview } = useSellerData();
  const [replyInputs, setReplyInputs] = useState({});
  const [activeReplyId, setActiveReplyId] = useState(null);

  // Filters & Sorting state
  const [selectedStar, setSelectedStar] = useState('all');
  const [sortOption, setSortOption] = useState('newest'); // 'newest' | 'oldest' | 'highest_rating' | 'lowest_rating'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'approved' | 'pending' | 'unreplied'
  const [searchTerm, setSearchTerm] = useState('');

  const handleSendReply = (id) => {
    const text = replyInputs[id];
    if (!text || !text.trim()) return;
    replyToReview(id, text.trim());
    setActiveReplyId(null);
  };

  const filteredAndSortedReviews = useMemo(() => {
    let list = Array.isArray(reviews) ? [...reviews] : Object.values(reviews).flat();

    // 1. Filter by Search Query
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      list = list.filter(r => 
        (r.customerName && r.customerName.toLowerCase().includes(q)) ||
        (r.name && r.name.toLowerCase().includes(q)) ||
        (r.productName && r.productName.toLowerCase().includes(q)) ||
        (r.comment && r.comment.toLowerCase().includes(q))
      );
    }

    // 2. Filter by Star Rating
    if (selectedStar !== 'all') {
      const starNum = Number(selectedStar);
      list = list.filter(r => Number(r.rating) === starNum);
    }

    // 3. Filter by Status
    if (statusFilter === 'approved') {
      list = list.filter(r => r.status === 'Approved' || r.status === 'approved');
    } else if (statusFilter === 'pending') {
      list = list.filter(r => r.status !== 'Approved' && r.status !== 'approved');
    } else if (statusFilter === 'unreplied') {
      list = list.filter(r => !r.reply || String(r.reply).trim() === '');
    }

    // 4. Sort by Time or Star Rating
    list.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.date || 0).getTime();
      const dateB = new Date(b.createdAt || b.date || 0).getTime();
      const ratingA = Number(a.rating || 0);
      const ratingB = Number(b.rating || 0);

      if (sortOption === 'newest') {
        return dateB - dateA;
      }
      if (sortOption === 'oldest') {
        return dateA - dateB;
      }
      if (sortOption === 'highest_rating') {
        return ratingB !== ratingA ? ratingB - ratingA : dateB - dateA;
      }
      if (sortOption === 'lowest_rating') {
        return ratingA !== ratingB ? ratingA - ratingB : dateB - dateA;
      }
      return 0;
    });

    return list;
  }, [reviews, selectedStar, sortOption, statusFilter, searchTerm]);

  // Overall Statistics Summary
  const stats = useMemo(() => {
    const rawList = Array.isArray(reviews) ? reviews : Object.values(reviews).flat();
    const total = rawList.length;
    const avg = total > 0 
      ? (rawList.reduce((acc, r) => acc + Number(r.rating || 5), 0) / total).toFixed(1) 
      : '5.0';
    const pendingCount = rawList.filter(r => r.status !== 'Approved' && r.status !== 'approved').length;
    const unrepliedCount = rawList.filter(r => !r.reply || String(r.reply).trim() === '').length;
    return { total, avg, pendingCount, unrepliedCount };
  }, [reviews]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white p-5 rounded-2xl shadow-xs border border-gray-100 gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Star className="text-amber-500 fill-amber-500" size={24} /> Customer Ratings & Reviews Moderation
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Filter, sort, and moderate customer reviews for your store's products.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="px-3.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex items-center gap-1.5">
            <Star size={14} className="fill-amber-500 text-amber-500" />
            <span>Avg Rating: {stats.avg}★</span>
            <span className="text-amber-600 font-normal">({stats.total} total)</span>
          </div>
          {stats.unrepliedCount > 0 && (
            <div className="px-3.5 py-1.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold">
              {stats.unrepliedCount} Needs Reply
            </div>
          )}
        </div>
      </div>

      {/* Filter and Sort Control Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by buyer or comment..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-teal-600"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Star Rating Filter */}
          <div className="relative">
            <select
              value={selectedStar}
              onChange={(e) => setSelectedStar(e.target.value)}
              className="w-full appearance-none bg-white px-3 py-2 pr-8 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 focus:outline-none focus:border-teal-600 cursor-pointer"
            >
              <option value="all">⭐ All Star Ratings</option>
              <option value="5">⭐⭐⭐⭐⭐ 5 Stars</option>
              <option value="4">⭐⭐⭐⭐ 4 Stars</option>
              <option value="3">⭐⭐⭐ 3 Stars</option>
              <option value="2">⭐⭐ 2 Stars</option>
              <option value="1">⭐ 1 Star</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Time & Rating Sort Order */}
          <div className="relative">
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="w-full appearance-none bg-white px-3 py-2 pr-8 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 focus:outline-none focus:border-teal-600 cursor-pointer"
            >
              <option value="newest">🕒 Time: Newest First (Descending)</option>
              <option value="oldest">⏳ Time: Oldest First (Ascending)</option>
              <option value="highest_rating">⭐ Rating: Highest First (5★ ➔ 1★)</option>
              <option value="lowest_rating">📉 Rating: Lowest First (1★ ➔ 5★)</option>
            </select>
            <ArrowUpDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full appearance-none bg-white px-3 py-2 pr-8 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 focus:outline-none focus:border-teal-600 cursor-pointer"
            >
              <option value="all">📋 All Statuses</option>
              <option value="approved">✅ Approved & Published</option>
              <option value="pending">⏳ Pending Approval</option>
              <option value="unreplied">💬 Needs Store Response</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Quick Star Rating Pill Badges */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-gray-100 text-xs">
          <span className="text-[11px] font-bold text-gray-400 mr-1 flex items-center gap-1">
            <Filter size={12} /> Quick Filter:
          </span>
          {['all', '5', '4', '3', '2', '1'].map((starKey) => {
            const isActive = selectedStar === starKey;
            return (
              <button
                key={starKey}
                onClick={() => setSelectedStar(starKey)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-amber-400 text-teal-950 shadow-2xs font-extrabold'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {starKey === 'all' ? 'All Reviews' : `${starKey}★`}
              </button>
            );
          })}

          {(selectedStar !== 'all' || statusFilter !== 'all' || searchTerm) && (
            <button
              onClick={() => {
                setSelectedStar('all');
                setStatusFilter('all');
                setSearchTerm('');
                setSortOption('newest');
              }}
              className="ml-auto text-[11px] text-teal-700 hover:text-teal-900 font-semibold underline cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredAndSortedReviews.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-gray-100 text-gray-500 text-xs">
            No reviews match the selected filter criteria.
          </div>
        ) : (
          filteredAndSortedReviews.map((rev) => {
            const isApproved = rev.status === 'Approved' || rev.status === 'approved';
            return (
              <div key={rev.id || rev._id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-gray-900 text-sm flex items-center gap-2">
                      <span>{rev.customerName || rev.name || 'Verified Customer'}</span>
                      <span className="flex items-center text-amber-500">
                        {[...Array(Number(rev.rating) || 5)].map((_, i) => (
                          <Star key={i} size={13} className="fill-amber-400 text-amber-400" />
                        ))}
                      </span>
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                        isApproved
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        {isApproved ? 'Approved & Live' : 'Pending Approval'}
                      </span>
                    </div>
                    <div className="text-[11px] text-teal-800 font-medium mt-0.5">{rev.productName || 'Product Review'}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                      <Clock size={11} /> {rev.date || (rev.createdAt ? new Date(rev.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recently')}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isApproved && (
                      <button
                        onClick={() => approveReview(rev.id || rev._id)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
                        title="Approve & Publish to Website"
                      >
                        <CheckCircle2 size={14} /> Approve & Publish
                      </button>
                    )}

                    <button
                      onClick={() => deleteReview(rev.id || rev._id)}
                      className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 cursor-pointer"
                      title="Remove Review"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <p className="text-gray-700 leading-relaxed bg-gray-50/70 p-3 rounded-xl border border-gray-100">
                  "{rev.comment}"
                </p>

                {rev.reply ? (
                  <div className="pl-4 border-l-2 border-teal-600 bg-teal-50/40 p-3 rounded-r-xl text-teal-950">
                    <div className="font-bold text-[11px] text-teal-900 mb-0.5">Official Seller Response</div>
                    <p>{rev.reply}</p>
                  </div>
                ) : (
                  <div>
                    {activeReplyId === (rev.id || rev._id) ? (
                      <div className="space-y-2 pt-1">
                        <textarea
                          rows="2"
                          placeholder="Type official store reply to customer..."
                          value={replyInputs[rev.id || rev._id] || ''}
                          onChange={(e) => setReplyInputs({ ...replyInputs, [rev.id || rev._id]: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-600"
                        ></textarea>
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => setActiveReplyId(null)}
                            className="px-3 py-1 text-gray-500 font-medium cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSendReply(rev.id || rev._id)}
                            className="px-3 py-1 bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-lg shadow-xs flex items-center gap-1 cursor-pointer"
                          >
                            <Send size={12} /> Post Reply
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setActiveReplyId(rev.id || rev._id)}
                        className="text-teal-700 hover:text-teal-900 font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        <MessageSquare size={13} /> Reply to review
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
