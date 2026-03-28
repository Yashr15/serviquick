import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import toast from "react-hot-toast";
import {
  Search,
  MapPin,
  Star,
  User2,
  Locate,
  SlidersHorizontal,
  Wrench,
  Zap,
  Leaf,
  Hammer,
  HelpCircle,
  ExternalLink,
} from "lucide-react";

const CATEGORIES = [
  { value: "", label: "All" },
  { value: "plumber", label: "Plumber", icon: <Wrench className="w-3.5 h-3.5" /> },
  { value: "electrician", label: "Electrician", icon: <Zap className="w-3.5 h-3.5" /> },
  { value: "gardener", label: "Gardener", icon: <Leaf className="w-3.5 h-3.5" /> },
  { value: "carpenter", label: "Carpenter", icon: <Hammer className="w-3.5 h-3.5" /> },
  { value: "others", label: "Others", icon: <HelpCircle className="w-3.5 h-3.5" /> },
];

function StarRating({ value, max = 5, small = false }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          className={`${small ? "w-3 h-3" : "w-4 h-4"} ${
            i < Math.round(value) ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-100"
          }`}
        />
      ))}
    </div>
  );
}

export default function SearchProviders() {
  const [providers, setProviders] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState("");
  const [radius, setRadius] = useState(20);
  const [lat, setLat] = useState(28.6139);
  const [lng, setLng] = useState(77.209);

  const search = async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ lng, lat, radius });
      if (category) qs.set("category", category);
      const { data } = await api.get(`/api/providers?${qs.toString()}`);
      setProviders(data.providers ?? []);
      setTotal(data.total ?? 0);
    } catch (e) {
      toast.error(e.response?.data?.error || "Failed to search providers");
    } finally {
      setLoading(false);
    }
  };

  const recenter = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (p) => { setLat(p.coords.latitude); setLng(p.coords.longitude); },
      (err) => console.debug("geo:", err?.message),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  useEffect(() => {
    recenter();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Find Providers</h1>
        <p className="text-sm text-gray-500 mt-1">
          Browse local service providers by category and distance.
          {total > 0 && ` ${total} provider${total !== 1 ? "s" : ""} found.`}
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <SlidersHorizontal className="w-4 h-4 text-blue-500" /> Filters
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(c => (
            <button
              key={c.value}
              type="button"
              onClick={() => setCategory(c.value)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                category === c.value
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
              }`}
            >
              {c.icon} {c.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {/* Radius */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Radius (km)</label>
            <input
              type="number"
              min="1"
              max="100"
              className="w-full border border-gray-300 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
            />
          </div>
          {/* Lat */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Latitude</label>
            <input
              className="w-full border border-gray-300 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
            />
          </div>
          {/* Lng */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Longitude</label>
            <input
              className="w-full border border-gray-300 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={search}
            disabled={loading}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-60"
          >
            <Search className="w-4 h-4" />
            {loading ? "Searching…" : "Search"}
          </button>
          <button
            type="button"
            onClick={recenter}
            className="flex items-center gap-1.5 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium px-4 py-2 rounded-lg text-sm transition-colors"
          >
            <Locate className="w-4 h-4" /> Use my location
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {providers.map(p => (
          <div
            key={p._id}
            className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-3"
          >
            {/* Avatar + name */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
                {p.avatar ? (
                  <img src={p.avatar} alt={p.name} className="w-12 h-12 rounded-xl object-cover" />
                ) : (
                  <User2 className="w-6 h-6 text-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 truncate">{p.name}</div>
                {p.ratingSummary ? (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <StarRating value={p.ratingSummary.avg} small />
                    <span className="text-xs text-gray-500">
                      {Number(p.ratingSummary.avg).toFixed(1)} ({p.ratingSummary.count})
                    </span>
                  </div>
                ) : (
                  <div className="text-xs text-gray-400">No reviews yet</div>
                )}
              </div>
            </div>

            {/* Categories */}
            {p.categories?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {p.categories.map(c => (
                  <span key={c} className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full capitalize">
                    {c}
                  </span>
                ))}
              </div>
            )}

            {/* Bio */}
            {p.bio && (
              <p className="text-sm text-gray-600 line-clamp-2">{p.bio}</p>
            )}

            {/* Location */}
            {p.location?.coordinates && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <MapPin className="w-3 h-3 shrink-0" />
                Near {Number(p.location.coordinates[1]).toFixed(3)}, {Number(p.location.coordinates[0]).toFixed(3)}
              </div>
            )}

            {/* Action */}
            <Link
              to={`/provider/${p._id}`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-200 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors mt-auto"
            >
              View profile <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        ))}

        {providers.length === 0 && !loading && (
          <div className="col-span-2 text-center py-16 text-gray-500">
            <User2 className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No providers found</p>
            <p className="text-sm">Try increasing the radius or selecting a different category.</p>
          </div>
        )}
      </div>
    </div>
  );
}
