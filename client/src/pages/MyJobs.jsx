import { useEffect, useState } from "react";
import api from "../api";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { BriefcaseBusiness, RefreshCw, CheckCircle2, ChevronRight, Tag } from "lucide-react";

const STATUS_STYLE = {
  open: "bg-amber-100 text-amber-800 border-amber-200",
  assigned: "bg-blue-100 text-blue-800 border-blue-200",
  completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

export default function MyJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/jobs/me/requester");
      setJobs(data);
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

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Jobs</h1>
          <p className="text-sm text-gray-500 mt-1">Jobs you&apos;ve posted as a requester.</p>
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
