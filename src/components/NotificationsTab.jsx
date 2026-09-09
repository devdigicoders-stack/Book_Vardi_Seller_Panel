import React from 'react';
import { 
  Bell, 
  Check, 
  Trash2, 
  AlertTriangle, 
  DollarSign, 
  Building2, 
  Star 
} from 'lucide-react';
import { useSellerData } from '../context/SellerDataContext';

export default function NotificationsTab() {
  const { notifications, markNotificationRead, markAllNotificationsRead, deleteNotification } = useSellerData();

  const getIcon = (type) => {
    switch (type) {
      case 'school': return <Building2 size={16} className="text-teal-700" />;
      case 'inventory': return <AlertTriangle size={16} className="text-amber-600" />;
      case 'finance': return <DollarSign size={16} className="text-emerald-600" />;
      case 'review': return <Star size={16} className="text-yellow-500 fill-yellow-400" />;
      default: return <Bell size={16} className="text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-5 rounded-2xl shadow-xs border border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="text-teal-700" size={24} /> Store Notifications & Activity Feed
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Real-time stock warnings, new school quotations, and customer order updates
          </p>
        </div>

        {notifications.some(n => n.unread) && (
          <button
            onClick={markAllNotificationsRead}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-teal-50 text-teal-800 hover:bg-teal-100 transition-colors"
          >
            <Check size={14} /> Mark All as Read
          </button>
        )}
      </div>

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-gray-100 text-gray-500 text-xs">
            No active notifications.
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => markNotificationRead(n.id)}
              className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 text-xs cursor-pointer ${
                n.unread
                  ? 'bg-teal-50/40 border-teal-200 shadow-xs'
                  : 'bg-white border-gray-100 opacity-80'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-white border border-gray-100 shadow-xs shrink-0 mt-0.5">
                  {getIcon(n.type)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900 text-sm">{n.title}</span>
                    {n.unread && (
                      <span className="w-2 h-2 rounded-full bg-teal-600"></span>
                    )}
                  </div>
                  <p className="text-gray-600 mt-0.5">{n.message}</p>
                  <span className="text-[10px] text-gray-400 mt-1 block">{n.date}</span>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNotification(n.id);
                }}
                className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-gray-100"
                title="Dismiss"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
