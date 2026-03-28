import { useState } from "react";
import api from "../api";
import toast from "react-hot-toast";
import MapPicker from "../components/MapPicker";
import { PlusCircle, Tag, AlignLeft, MapPin, DollarSign } from "lucide-react";

const CATEGORIES = ["plumber", "electrician", "gardener", "carpenter", "others"];

export default function PostJob() {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("plumber");
  const [description, setDescription] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [lng, setLng] = useState(77.209);
  const [lat, setLat] = useState(28.6139);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/api/jobs", {
        title,
        description,
        category,
        location: { type: "Point", coordinates: [Number(lng), Number(lat)] },
        budget: {
          min: budgetMin ? Number(budgetMin) : 0,
          max: budgetMax ? Number(budgetMax) : 0,
          currency: "INR",
        },
      });
      toast.success("Job posted!");
      setTitle("");
      setDescription("");
      setBudgetMin("");
      setBudgetMax("");
    } catch (e) {
      toast.error(e.response?.data?.error || "Failed to post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Post a Job</h1>
        <p className="text-sm text-gray-500 mt-1">Describe what you need and where — nearby providers will see it.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
        <form onSubmit={submit} className="space-y-5">
          {/* Title */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
              <PlusCircle className="w-4 h-4 text-blue-500" /> Job title
            </label>
            <input
              className="w-full border border-gray-300 rounded-lg py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="e.g. Fix leaking kitchen tap"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Category */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-blue-500" /> Category
            </label>
            <select
              className="w-full border border-gray-300 rounded-lg py-2.5 px-4 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
              <AlignLeft className="w-4 h-4 text-blue-500" /> Description
            </label>
            <textarea
              className="w-full border border-gray-300 rounded-lg py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
              placeholder="Describe the job in detail…"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Budget */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-blue-500" /> Budget range (₹, optional)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                min="0"
                className="w-full border border-gray-300 rounded-lg py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="Min e.g. 200"
                value={budgetMin}
                onChange={(e) => setBudgetMin(e.target.value)}
              />
              <input
                type="number"
                min="0"
                className="w-full border border-gray-300 rounded-lg py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="Max e.g. 1500"
                value={budgetMax}
                onChange={(e) => setBudgetMax(e.target.value)}
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-blue-500" /> Job location
            </label>
            <MapPicker
              value={{ lat: Number(lat), lng: Number(lng) }}
              onChange={(pos) => { setLat(pos.lat); setLng(pos.lng); }}
            />
            <p className="text-xs text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3" /> {Number(lat).toFixed(5)}, {Number(lng).toFixed(5)}</p>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? "Posting…" : "Post Job"}
          </button>
        </form>
      </div>
    </div>
  );
}
