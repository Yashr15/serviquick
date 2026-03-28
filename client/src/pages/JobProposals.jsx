import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import toast from "react-hot-toast";
import { RefreshCw, IndianRupee, MessageSquare, CheckCircle2, Clock, XCircle, FileText } from "lucide-react";

const STATUS_CONFIG = {
  accepted: { label: "Accepted", icon: CheckCircle2, style: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  rejected: { label: "Rejected", icon: XCircle, style: "bg-rose-100 text-rose-800 border-rose-200" },
  pending: { label: "Pending", icon: Clock, style: "bg-amber-100 text-amber-800 border-amber-200" },
};

export default function JobProposals() {
  const { id } = useParams();
  const nav = useNavigate();
  const [props, setProps] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/api/jobs/${id}/proposals`);
      setProps(data);
    } catch (e) {
      toast.error(e.response?.data?.error || "Failed to load proposals");
    } finally {
      setLoading(false);
    }
  };

  const accept = async (proposalId) => {
    try {
      await api.post(`/api/jobs/${id}/accept`, { proposalId });
      toast.success("Proposal accepted. Job assigned.");
      nav("/my-jobs");
    } catch (e) {
      toast.error(e.response?.data?.error || "Failed to accept");
    }
  };

  useEffect(() => { load(); }, [id]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Proposals</h1>
          <p className="text-sm text-gray-500 mt-1">Review and accept a provider for this job.</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      {/* Proposals */}
      <div className="space-y-3">
        {props.map(p => {
          const cfg = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.pending;
          const StatusIcon = cfg.icon;
          return (
            <div key={p._id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  {/* Bid amount */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 text-lg font-bold text-gray-900">
                      <IndianRupee className="w-5 h-5 text-emerald-600" />
                      {p.bidAmount ?? "—"}
                    </div>
                    <span className={`flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full border ${cfg.style}`}>
                      <StatusIcon className="w-3 h-3" /> {cfg.label}
                    </span>
                  </div>

                  {/* Message */}
                  {p.message && (
                    <div className="flex items-start gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                      <MessageSquare className="w-4 h-4 mt-0.5 text-gray-400 shrink-0" />
                      <span>{p.message}</span>
                    </div>
                  )}
                </div>

                {/* Accept CTA */}
                {p.status === "pending" && (
                  <button
                    onClick={() => accept(p._id)}
                    className="flex items-center gap-1.5 shrink-0 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Accept
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {props.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-500">
            <FileText className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No proposals yet</p>
            <p className="text-sm">Providers will submit proposals once they see your job.</p>
          </div>
        )}
      </div>
    </div>
  );
}
