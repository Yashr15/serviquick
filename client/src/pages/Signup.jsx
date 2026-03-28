import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";
import toast from "react-hot-toast";
import MapPicker from "../components/MapPicker";
import { UserPlus, Mail, Lock, User, CheckSquare, Square, MapPin } from "lucide-react";

const CATEGORIES = ["plumber", "electrician", "gardener", "carpenter"];

export default function Signup() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "requester",
  });

  const [lat, setLat] = useState(28.6139);
  const [lng, setLng] = useState(77.2090);
  const [categories, setCategories] = useState(["plumber"]);
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const onChange = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const toggleCategory = (c) => {
    setCategories(prev =>
      prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]
    );
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form };

      if (form.role === "provider") {
        payload.categories = categories;
        payload.location = { type: "Point", coordinates: [Number(lng), Number(lat)] };
      }

      const { data } = await api.post("/api/auth/signup", payload);
      localStorage.setItem("token", data.token);
      if (data.user?.name) localStorage.setItem("name", data.user.name);
      toast.success("Account created!");
      nav("/dashboard");
    } catch (e) {
      toast.error(e.response?.data?.error || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-8">
      <div className="w-full max-w-md">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-1">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-xl mb-3">
              <UserPlus className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Create account</h2>
            <p className="text-sm text-gray-500">Join ServiQuick today</p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {/* Name */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Full name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  className="w-full border border-gray-300 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="Jane Smith"
                  value={form.name}
                  onChange={onChange("name")}
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  className="w-full border border-gray-300 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={onChange("email")}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  className="w-full border border-gray-300 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={onChange("password")}
                  required
                />
              </div>
            </div>

            {/* Role */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">I want to…</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "requester", label: "Post Jobs", desc: "I need services" },
                  { value: "provider", label: "Offer Services", desc: "I provide services" },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, role: opt.value }))}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      form.role === opt.value
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="text-sm font-semibold text-gray-800">{opt.label}</div>
                    <div className="text-xs text-gray-500">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Provider extras */}
            {form.role === "provider" && (
              <div className="space-y-4 border border-blue-100 rounded-xl bg-blue-50/40 p-4">
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">Service categories</div>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map(c => {
                      const selected = categories.includes(c);
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => toggleCategory(c)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                            selected
                              ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                              : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
                          }`}
                        >
                          {selected ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                          {c.charAt(0).toUpperCase() + c.slice(1)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">Set your service location</div>
                  <MapPicker
                    value={{ lat: Number(lat), lng: Number(lng) }}
                    onChange={(pos) => { setLat(pos.lat); setLng(pos.lng); }}
                  />
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {lat.toFixed(5)}, {lng.toFixed(5)} — {categories.join(", ")}
                  </p>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-600 font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
