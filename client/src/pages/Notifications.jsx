import { useEffect, useState, useCallback } from "react";
import api from "../api";
import toast from "react-hot-toast";
import { Bell, BellOff, CheckCheck, RefreshCw, Briefcase, Star, ThumbsUp, ThumbsDown } from "lucide-react";

const TYPE_CONFIG = {
  proposal_received: {
    icon: <Briefcase className="w-4 h-4 text-blue-500" />,
    bg: "bg-blue-50",
  },
  proposal_accepted: {
    icon: <ThumbsUp className="w-4 h-4 text-emerald-500" />,
    bg: "bg-emerald-50",
  },
  proposal_rejected: {
    icon: <ThumbsDown className="w-4 h-4 text-rose-500" />,
    bg: "bg-rose-50",
  },
  job_completed: {
    icon: <CheckCheck className="w-4 h-4 text-indigo-500" />,
    bg: "bg-indigo-50",
  },
  review_received: {
    icon: <Star className="w-4 h-4 text-amber-500" />,
    bg: "bg-amber-50",
  },
};

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const LIMIT = 20;

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/api/notifications?page=${p}&limit=${LIMIT}`);
      if (p === 1) {
        setNotifications(data.notifications);
      } else {
        setNotifications((prev) => [...prev, ...data.notifications]);
      }
      setUnreadCount(data.unreadCount);
      setTotal(data.total);
      setPage(p);
    } catch (e) {
      toast.error(e.response?.data?.error || e.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(1); }, [load]);

  const markRead = async (id) => {
    try {
      await api.patch(`/api/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // silent fail
    }
  };

  const markAllRead = async () => {
    setMarkingAll(true);
    try {
      await api.patch("/api/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      toast.success("All notifications marked as read");
    } catch (e) {
      toast.error(e.response?.data?.error || "Failed to mark all as read");
    } finally {
      setMarkingAll(false);
    }
  };

  const hasMore = notifications.length < total;

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bell className="w-7 h-7 text-gray-800" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Notifications</h1>
            <p className="text-sm text-gray-500">
              {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              disabled={markingAll}
              className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-200 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60"
            >
              <CheckCheck className="w-4 h-4" />
              {markingAll ? "Marking…" : "Mark all read"}
            </button>
          )}
          <button
            onClick={() => load(1)}
            disabled={loading}
            className="flex items-center gap-1.5 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium px-3 py-1.5 rounded-lg text-sm transition-colors disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="space-y-2">
        {notifications.map((n) => {
          const cfg = TYPE_CONFIG[n.type] || { icon: <Bell className="w-4 h-4 text-gray-400" />, bg: "bg-gray-50" };
          return (
            <div
              key={n._id}
              onClick={() => !n.read && markRead(n._id)}
              className={`flex items-start gap-3 p-4 rounded-2xl border transition-all cursor-pointer ${
                n.read
                  ? "bg-white border-gray-200 opacity-70"
                  : `${cfg.bg} border-blue-100 shadow-sm hover:shadow-md`
              }`}
            >
              <div className={`mt-0.5 p-2 rounded-full ${cfg.bg} border border-white shadow-sm shrink-0`}>
                {cfg.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${n.read ? "text-gray-600" : "text-gray-900 font-medium"}`}>
                  {n.message}
                </p>
                <p className="text-xs text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
              </div>
              {!n.read && (
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
              )}
            </div>
          );
        })}

        {notifications.length === 0 && !loading && (
          <div className="text-center py-16 text-gray-500">
            <BellOff className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No notifications yet</p>
            <p className="text-sm mt-1">Activity on your jobs and proposals will appear here.</p>
          </div>
        )}
      </div>

      {/* Load more */}
      {hasMore && (
        <div className="text-center">
          <button
            onClick={() => load(page + 1)}
            disabled={loading}
            className="border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium px-5 py-2 rounded-xl text-sm transition-colors disabled:opacity-60"
          >
            {loading ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}
