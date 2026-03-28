import { useEffect, useState } from "react";
import api from "../api";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { BriefcaseBusiness, RefreshCw, CheckCircle2, ChevronRight, Tag, XCircle, PencilLine } from "lucide-react";

const STATUS_STYLE = {
  open: "bg-amber-100 text-amber-800 border-amber-200",
  assigned: "bg-blue-100 text-blue-800 border-blue-200",
  completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
};

export default function MyJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [total, setTotal] = useState(0);

  const load = async () => {
    setLoading(true);
    try {
      const qs = statusFilter ? `?status=${statusFilter}` : "";
      const { data } = await api.get(`/api/jobs/me/requester${qs}`);
      // API now returns { jobs, total, page, pages }
      const list = Array.isArray(data) ? data : data.jobs ?? [];
      setJobs(list);
      setTotal(typeof data.total === "number" ? data.total : list.length);
    } catch (e) {
      toast.error(e.response?.data?.error || "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  const complete = async (job) => {
    try {
      const { data } = await api.post(`/api/jobs/${job._id}/complete`);
      toast.success(`Marked completed. Paid ₹${data.job?.payment?.amount ?? 0}`);
      window.location.href = `/rate/${job._id}`;
    } catch (e) {
      toast.error(e.response?.data?.error || "Failed to complete");
    }
  };

  const cancel = async (job) => {
    if (!window.confirm("Cancel this job? All pending proposals will be rejected.")) return;
    try {
      await api.post(`/api/jobs/${job._id}/cancel`);
      toast.success("Job cancelled");
      load();
    } catch (e) {
      toast.error(e.response?.data?.error || "Failed to cancel");
    }
  };

  useEffect(() => { load(); }, [statusFilter]); // eslint-disable-line

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Jobs</h1>
          <p className="text-sm text-gray-500 mt-1">Jobs you&apos;ve posted as a requester. {total > 0 && `(${total} total)`}</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg py-2 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All statuses</option>
            <option value="open">Open</option>
            <option value="assigned">Assigned</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1.5 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Loading…" : "Refresh"}
          </button>
        </div>
      </div>

      {/* Job list */}
      <div className="space-y-3">
        {jobs.map(j => (
          <div key={j._id} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <BriefcaseBusiness className="w-4 h-4 text-blue-500 shrink-0" />
                  <span className="font-semibold text-gray-900 truncate">{j.title}</span>
                  <span className="flex items-center gap-1 text-xs text-gray-500 border border-gray-200 rounded-full px-2 py-0.5">
                    <Tag className="w-3 h-3" />{j.category}
                  </span>
                </div>

                {j.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">{j.description}</p>
                )}

                {(j.budget?.min > 0 || j.budget?.max > 0) && (
                  <p className="text-xs text-gray-500">
                    Budget: ₹{j.budget.min} – ₹{j.budget.max}
                  </p>
                )}

                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${STATUS_STYLE[j.status] ?? "bg-gray-100 text-gray-700 border-gray-200"}`}>
                    {j.status}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap pt-1">
                  <Link
                    to={`/jobs/${j._id}/proposals`}
                    className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 border border-blue-200 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    View proposals <ChevronRight className="w-3.5 h-3.5" />
                  </Link>

                  {j.status === "open" && (
                    <>
                      <Link
                        to={`/jobs/${j._id}/edit`}
                        className="flex items-center gap-1.5 text-sm font-medium text-gray-700 border border-gray-200 hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <PencilLine className="w-3.5 h-3.5" /> Edit
                      </Link>
                      <button
                        onClick={() => cancel(j)}
                        className="flex items-center gap-1.5 text-sm font-medium text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Cancel
                      </button>
                    </>
                  )}

                  {j.status === "assigned" && (
                    <button
                      onClick={() => complete(j)}
                      className="flex items-center gap-1.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Mark completed & pay
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {jobs.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-500">
            <BriefcaseBusiness className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No jobs yet</p>
            <p className="text-sm">
              <Link to="/post" className="text-blue-600 hover:underline">Post your first job</Link> to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
