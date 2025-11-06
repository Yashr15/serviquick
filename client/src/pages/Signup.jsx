import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import toast from "react-hot-toast";
import MapPicker from "../components/MapPicker";

export default function Signup() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "requester",
  });

  // provider-only fields
  const [lat, setLat] = useState(28.6139);   // default Delhi
  const [lng, setLng] = useState(77.2090);
  const [categories, setCategories] = useState(["plumber"]); // simple default
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
    <form onSubmit={submit} className="max-w-md mx-auto space-y-4">
      <h2 className="text-2xl font-bold">Create account</h2>

      <input
        className="w-full border p-2 rounded"
        placeholder="Name"
        value={form.name}
        onChange={onChange("name")}
      />

      <input
        className="w-full border p-2 rounded"
        placeholder="Email"
        value={form.email}
        onChange={onChange("email")}
      />

      <input
        className="w-full border p-2 rounded"
        type="password"
        placeholder="Password"
        value={form.password}
        onChange={onChange("password")}
      />

      <select
        className="w-full border p-2 rounded"
        value={form.role}
        onChange={onChange("role")}
      >
        <option value="requester">Requester (post jobs)</option>
        <option value="provider">Provider (offer services)</option>
      </select>

      {form.role === "provider" && (
        <div className="space-y-3 border rounded p-3">
          <div>
            <div className="font-medium mb-1">Service categories</div>
            <div className="flex flex-wrap gap-2">
              {["plumber","electrician","gardener","carpenter"].map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleCategory(c)}
                  className={`px-3 py-1 rounded border ${
                    categories.includes(c) ? "bg-blue-600 text-white border-blue-600" : "bg-white hover:bg-gray-100"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="font-medium mb-2">Set your location</div>
            <MapPicker
              value={{ lat: Number(lat), lng: Number(lng) }}
              onChange={(pos) => { setLat(pos.lat); setLng(pos.lng); }}
            />
          </div>

          <div className="text-xs text-gray-600">
            Sending: lat <b>{lat.toFixed(5)}</b>, lng <b>{lng.toFixed(5)}</b> • {categories.join(", ")}
          </div>
        </div>
      )}

      <button
        className="w-full bg-black text-white p-2 rounded disabled:opacity-60"
        disabled={loading}
      >
        {loading ? "Creating..." : "Sign up"}
      </button>
    </form>
  );
}
