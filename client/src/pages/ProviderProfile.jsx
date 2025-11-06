import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api";

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
    <div className="max-w-2xl mx-auto space-y-3">
      <h2 className="text-2xl font-bold">Provider Profile</h2>
      <div className="text-gray-700">Rating: <b>{summary.avg}</b> ⭐ ({summary.count})</div>
      <div className="space-y-2">
        {reviews.map(rv => (
          <div key={rv._id} className="border rounded p-2">
            <div className="text-sm">Rating: {rv.rating} ⭐</div>
            <div className="text-xs text-gray-600">{new Date(rv.createdAt).toLocaleString()}</div>
            <div className="mt-1">{rv.comment}</div>
          </div>
        ))}
        {reviews.length === 0 && <div className="text-gray-500 text-sm">No reviews yet.</div>}
      </div>
    </div>
  );
}
