import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import toast from "react-hot-toast";
import { Star, Send } from "lucide-react";

export default function RateProvider() {
  const { id } = useParams();
  const nav = useNavigate();
  const [rating, setRating] = useState(5);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/api/reviews", { jobId: id, rating, comment });
      toast.success("Thanks for your review!");
      nav("/my-jobs");
    } catch (e) {
      toast.error(e.response?.data?.error || "Failed to submit review");
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-1">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-amber-100 rounded-xl mb-3">
              <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Rate your provider</h2>
            <p className="text-sm text-gray-500">How did it go? Your feedback helps others.</p>
          </div>

          <form onSubmit={submit} className="space-y-5">
            {/* Star picker */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Rating</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    type="button"
                    onMouseEnter={() => setHovered(n)}
                    onMouseLeave={() => setHovered(0)}
                    onClick={() => setRating(n)}
                    className="transition-transform hover:scale-110 focus:outline-none"
                    aria-label={`${n} star${n !== 1 ? "s" : ""}`}
                  >
                    <Star
                      className={`w-9 h-9 transition-colors ${
                        n <= (hovered || rating)
                          ? "text-amber-400 fill-amber-400"
                          : "text-gray-300 fill-gray-100"
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-2 text-sm font-semibold text-gray-700">
                  {rating} / 5
                </span>
              </div>
            </div>

            {/* Comment */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Comment <span className="text-gray-400 font-normal">(optional)</span></label>
              <textarea
                className="w-full border border-gray-300 rounded-lg py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                placeholder="Say something helpful…"
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
            >
              <Send className="w-4 h-4" /> Submit review
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
