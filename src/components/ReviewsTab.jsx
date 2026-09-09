import React, { useState } from 'react';
import { 
  Star, 
  MessageSquare, 
  Trash2, 
  Send, 
  CheckCircle2, 
  User, 
  Package 
} from 'lucide-react';
import { useSellerData } from '../context/SellerDataContext';

export default function ReviewsTab() {
  const { reviews, replyToReview, deleteReview } = useSellerData();
  const [replyInputs, setReplyInputs] = useState({});
  const [activeReplyId, setActiveReplyId] = useState(null);

  const handleSendReply = (id) => {
    const text = replyInputs[id];
    if (!text || !text.trim()) return;
    replyToReview(id, text.trim());
    setActiveReplyId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-5 rounded-2xl shadow-xs border border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Star className="text-amber-500 fill-amber-500" size={24} /> Customer Ratings & Reviews
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Monitor feedback from parents and students, address queries, and post official store replies
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-gray-100 text-gray-500 text-xs">
            No customer reviews posted yet.
          </div>
        ) : (
          reviews.map((rev) => (
            <div key={rev.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    <span>{rev.customerName}</span>
                    <span className="flex items-center text-amber-500">
                      {[...Array(rev.rating || 5)].map((_, i) => (
                        <Star key={i} size={13} className="fill-amber-400 text-amber-400" />
                      ))}
                    </span>
                  </div>
                  <div className="text-[11px] text-teal-800 font-medium mt-0.5">{rev.productName}</div>
                  <div className="text-[10px] text-gray-400">{rev.date}</div>
                </div>

                <button
                  onClick={() => deleteReview(rev.id)}
                  className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50"
                  title="Remove Review"
                >
                  <Trash2 size={14} />
                </button>
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
                  {activeReplyId === rev.id ? (
                    <div className="space-y-2 pt-1">
                      <textarea
                        rows="2"
                        placeholder="Type official store reply to customer..."
                        value={replyInputs[rev.id] || ''}
                        onChange={(e) => setReplyInputs({ ...replyInputs, [rev.id]: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-600"
                      ></textarea>
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setActiveReplyId(null)}
                          className="px-3 py-1 text-gray-500 font-medium"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSendReply(rev.id)}
                          className="px-3 py-1 bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-lg shadow-xs flex items-center gap-1"
                        >
                          <Send size={12} /> Post Reply
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setActiveReplyId(rev.id)}
                      className="text-teal-700 hover:text-teal-900 font-semibold flex items-center gap-1.5"
                    >
                      <MessageSquare size={13} /> Reply to review
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
