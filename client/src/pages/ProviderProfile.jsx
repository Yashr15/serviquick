import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api";
import { Star, User2, MessageSquare } from "lucide-react";

function StarRating({ value, max = 5 }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${
            i < Math.round(value) ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-100"
          }`}
        />
      ))}
    </div>
  );
}

export default function ProviderProfile() {
  const { id } = useParams();
  const [summary, setSummary] = useState({ avg: 0, count: 0 });
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    (async () => {
      const s = await api.get(`/api/reviews/provider/${id}`);
      setSummary(s.data);
      const r = await api.get(`/api/reviews/provider/${id}/list`);
      setReviews(r.data);
    })();
  }, [id]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Profile header */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-cyan-50 border border-blue-100 rounded-2xl p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-sm">
            <User2 className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Provider Profile</h1>
            <div className="flex items-center gap-2 mt-1">
              <StarRating value={summary.avg} />
              <span className="text-sm font-semibold text-gray-800">{Number(summary.avg).toFixed(1)}</span>
              <span className="text-sm text-gray-500">({summary.count} review{summary.count !== 1 ? "s" : ""})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Reviews</h2>
        <div className="space-y-3">
          {reviews.map(rv => (
            <div key={rv._id} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2 flex-1">
                  <StarRating value={rv.rating} />
                  {rv.comment && (
                    <div className="flex items-start gap-2 text-sm text-gray-700">
                      <MessageSquare className="w-4 h-4 mt-0.5 text-gray-400 shrink-0" />
                      <span>{rv.comment}</span>
                    </div>
                  )}
                </div>
                <time className="text-xs text-gray-400 shrink-0">
                  {new Date(rv.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                </time>
              </div>
            </div>
          ))}

          {reviews.length === 0 && (
            <div className="text-center py-10 text-gray-500">
              <Star className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">No reviews yet</p>
              <p className="text-sm">This provider hasn&apos;t received any reviews yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
