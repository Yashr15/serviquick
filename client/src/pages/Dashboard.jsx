import { useEffect, useMemo, useState } from "react";
import api from "../api";

export default function Dashboard() {
  const [reqJobs, setReqJobs] = useState([]);      // requester jobs
  const [proProps, setProProps] = useState([]);    // provider proposals
  const [loading, setLoading] = useState(true);

  // Silent fetch helper (ignores 401/403 so mixed roles work)
  const tryGet = async (path) => {
    try {
      const { data } = await api.get(path);
      return data;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [rj, pp] = await Promise.all([
        tryGet("/api/jobs/me/requester"),
        tryGet("/api/jobs/me/provider"),
      ]);
      if (rj) setReqJobs(rj);
      if (pp) setProProps(pp);
      setLoading(false);
    })();
  }, []);

  // Requester stats
  const reqStats = useMemo(() => {
    const all = reqJobs.length;
    const open = reqJobs.filter(j => j.status === "open").length;
    const assigned = reqJobs.filter(j => j.status === "assigned").length;
    const completed = reqJobs.filter(j => j.status === "completed").length;
    const revenue = reqJobs
      .filter(j => j.status === "completed" && j.payment?.amount)
      .reduce((s, j) => s + Number(j.payment.amount || 0), 0);
    return { all, open, assigned, completed, revenue };
  }, [reqJobs]);

  // Provider stats
  const proStats = useMemo(() => {
    const sent = proProps.length;
    const accepted = proProps.filter(p => p.status === "accepted").length;
    const rejected = proProps.filter(p => p.status === "rejected").length;
    const pending = proProps.filter(p => p.status === "pending").length;
    const completed = proProps.filter(p => p.jobId?.status === "completed").length;
    return { sent, accepted, rejected, pending, completed };
  }, [proProps]);

  // Mini bar chart with colors
  const MiniBars = ({ values }) => {
    const max = Math.max(1, ...values.map(v => v.value));
    const w = 260, h = 64, gap = 8;
    const barW = (w - gap * (values.length - 1)) / values.length;

    const palette = [
      "fill-blue-500",
      "fill-emerald-500",
      "fill-amber-500",
      "fill-fuchsia-500",
      "fill-cyan-500",
    ];

    return (
      <svg width={w} height={h}>
        {values.map((v, i) => {
          const bh = Math.round((v.value / max) * (h - 16));
          const x = i * (barW + gap);
          const y = h - bh - 12;
          const color = palette[i % palette.length];
          return (
            <g key={v.label} transform={`translate(${x},0)`}>
              <rect className={`${color}`} x={0} y={y} width={barW} height={bh} rx="6" />
              <text x={barW/2} y={h-2} textAnchor="middle" fontSize="10" className="fill-gray-600">{v.label}</text>
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header strip with gradient */}
      <div className="rounded-2xl p-5 bg-gradient-to-r from-blue-50 via-indigo-50 to-cyan-50 border">
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-600 mt-1">Quick overview of your activity and progress.</p>
      </div>

      {loading && <div className="text-gray-500">Loading…</div>}

      {/* Requester section */}
      {reqJobs.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Requester overview</h2>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Card title="Total jobs" value={reqStats.all} color="from-blue-500 to-blue-600" />
            <Card title="Open" value={reqStats.open} color="from-amber-500 to-amber-600" />
            <Card title="Assigned" value={reqStats.assigned} color="from-indigo-500 to-indigo-600" />
            <Card title="Completed" value={reqStats.completed} color="from-emerald-500 to-emerald-600" />
            <Card title="Paid (₹)" value={reqStats.revenue} color="from-fuchsia-500 to-fuchsia-600" />
          </div>

          <div className="border rounded-xl p-4">
            <MiniBars
              values={[
                { label: "Open", value: reqStats.open },
                { label: "Assign", value: reqStats.assigned },
                { label: "Done", value: reqStats.completed },
              ]}
            />
          </div>

          <div className="space-y-2">
            <h3 className="font-medium">Recent jobs</h3>
            <ul className="space-y-2">
              {reqJobs.slice(0, 5).map((j) => (
                <li key={j._id} className="border rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{j.title}</div>
                    <div className="text-xs text-gray-600">
                      {j.category} •{" "}
                      <span
                        className={`px-2 py-0.5 rounded-full ${
                          j.status === "open"
                            ? "bg-amber-100 text-amber-800"
                            : j.status === "assigned"
                            ? "bg-indigo-100 text-indigo-800"
                            : j.status === "completed"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {j.status}
                      </span>
                    </div>
                  </div>
                  <a
                    href={`/jobs/${j._id}/proposals`}
                    className="text-sm px-3 py-1 rounded bg-black text-white"
                  >
                    View
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Provider section */}
      {proProps.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Provider overview</h2>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Card title="Sent" value={proStats.sent} color="from-blue-500 to-blue-600" />
            <Card title="Accepted" value={proStats.accepted} color="from-emerald-500 to-emerald-600" />
            <Card title="Pending" value={proStats.pending} color="from-amber-500 to-amber-600" />
            <Card title="Rejected" value={proStats.rejected} color="from-rose-500 to-rose-600" />
            <Card title="Completed" value={proStats.completed} color="from-indigo-500 to-indigo-600" />
          </div>

          <div className="border rounded-xl p-4">
            <MiniBars
              values={[
                { label: "Sent", value: proStats.sent },
                { label: "Acc", value: proStats.accepted },
                { label: "Pend", value: proStats.pending },
                { label: "Rej", value: proStats.rejected },
              ]}
            />
          </div>

          <div className="space-y-2">
            <h3 className="font-medium">Recent proposals</h3>
            <ul className="space-y-2">
              {proProps.slice(0, 5).map((p) => (
                <li key={p._id} className="border rounded-xl p-3">
                  <div className="font-semibold">{p.jobId?.title ?? "Job"}</div>
                  <div className="text-xs text-gray-600">
                    Bid: ₹{p.bidAmount ?? "—"} •{" "}
                    <span
                      className={`px-2 py-0.5 rounded-full ${
                        p.status === "accepted"
                          ? "bg-emerald-100 text-emerald-800"
                          : p.status === "rejected"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {!loading && reqJobs.length === 0 && proProps.length === 0 && (
        <div className="text-gray-500">
          No data yet — post a job or send a proposal.
        </div>
      )}
    </div>
  );
}

function Card({ title, value, color }) {
  return (
    <div className="rounded-xl border p-4 bg-white">
      <div className="text-xs text-gray-500">{title}</div>
      <div className="mt-1 text-2xl font-extrabold text-gray-900">{value}</div>
      <div className={`mt-3 h-1.5 w-full rounded-full bg-gradient-to-r ${color}`} />
    </div>
  );
}
