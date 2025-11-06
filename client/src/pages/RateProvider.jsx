import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import toast from "react-hot-toast";

export default function RateProvider() {
  const { id } = useParams(); // jobId
  const nav = useNavigate();
  const [rating, setRating] = useState(5);
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
    <form onSubmit={submit} className="max-w-md mx-auto space-y-3">
      <h2 className="text-2xl font-bold">Rate your provider</h2>
      <div>
        <label className="block text-sm mb-1">Rating</label>
        <input
          type="range"
          min="1" max="5"
          value={rating}
          onChange={(e)=>setRating(Number(e.target.value))}
          className="w-full"
        />
        <div className="text-sm">Selected: {rating} ⭐</div>
      </div>
      <textarea
        className="w-full border p-2 rounded"
        placeholder="Say something helpful..."
        value={comment}
        onChange={(e)=>setComment(e.target.value)}
      />
      <button className="bg-black text-white px-4 py-2 rounded">Submit review</button>
    </form>
  );
}
