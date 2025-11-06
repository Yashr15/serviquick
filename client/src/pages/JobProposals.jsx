import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import toast from "react-hot-toast";

export default function JobProposals() {
  const { id } = useParams(); // jobId
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
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-2xl font-bold">Proposals</h2>
        <button className="px-3 py-1 rounded bg-gray-200" onClick={load} disabled={loading}>
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      <div className="space-y-3">
        {props.map(p => (
          <div key={p._id} className="border rounded p-3">
            <div className="font-semibold">Bid: ₹{p.bidAmount ?? "—"}</div>
            <div className="text-sm text-gray-600">Message: {p.message || "—"}</div>
            <div className="text-xs mt-1">
              Status: <span className={`px-2 py-0.5 rounded ${
                p.status === "accepted" ? "bg-green-100" :
                p.status === "rejected" ? "bg-red-100" : "bg-yellow-100"
              }`}>{p.status}</span>
            </div>
            {p.status === "pending" && (
              <button
                onClick={() => accept(p._id)}
                className="mt-2 px-3 py-1 bg-blue-600 text-white rounded"
              >
                Accept this proposal
              </button>
            )}
          </div>
        ))}
        {props.length === 0 && <p className="text-gray-500">No proposals yet.</p>}
      </div>
    </div>
  );
}
