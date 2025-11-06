import { useEffect, useState } from "react";
import api from "../api";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

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
        // go to rate page
        window.location.href = `/rate/${job._id}`;
    } catch (e) {
        toast.error(e.response?.data?.error || "Failed to complete");
    }
    };


  useEffect(() => { load(); }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-2xl font-bold">My Jobs</h2>
        <button className="px-3 py-1 rounded bg-gray-200" onClick={load} disabled={loading}>
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      <div className="space-y-3">
        {jobs.map(j => (
            <div key={j._id} className="border rounded p-3">
            <div className="flex items-center gap-2">
                <div className="font-semibold">{j.title}</div>
                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{j.category}</span>
                <span className={`text-xs px-2 py-0.5 rounded
                ${j.status === "open" ? "bg-yellow-100" :
                    j.status === "assigned" ? "bg-blue-100" :
                    j.status === "completed" ? "bg-green-100" : "bg-gray-100"}`}>
                {j.status}
                </span>
            </div>

            <div className="mt-2">
                <Link to={`/jobs/${j._id}/proposals`} className="px-3 py-1 bg-black text-white rounded">
                View proposals
                </Link>

                {j.status === "assigned" && (
                <button
                    onClick={() => complete(j)}
                    className="mt-2 ml-2 px-3 py-1 bg-green-600 text-white rounded text-sm"
                >
                    Mark completed & pay
                </button>
                )}
            </div>
            </div>
        ))}

        {jobs.length === 0 && <p className="text-gray-500">No jobs yet. Post one!</p>}
      </div>
    </div>
  );
}
