import { useEffect, useState } from "react";
import api from "../api";
import toast from "react-hot-toast";
import MapPicker from "../components/MapPicker";
import { User, Mail, Phone, MapPin, AlignLeft, CheckSquare, Square, Lock, Save } from "lucide-react";

const CATEGORIES = ["plumber", "electrician", "gardener", "carpenter", "others"];

export default function ProfileSettings() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Profile fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [categories, setCategories] = useState([]);
  const [lat, setLat] = useState(28.6139);
  const [lng, setLng] = useState(77.209);

  // Password fields
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/api/auth/me");
        setProfile(data);
        setName(data.name || "");
        setPhone(data.phone || "");
        setBio(data.bio || "");
        setCategories(data.categories || []);
        if (data.location?.coordinates) {
          setLng(data.location.coordinates[0]);
          setLat(data.location.coordinates[1]);
        }
      } catch {
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggleCategory = (c) =>
    setCategories((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updates = { name, phone, bio };
      if (profile?.role === "provider") {
        updates.categories = categories;
        updates.location = { type: "Point", coordinates: [Number(lng), Number(lat)] };
      }
      const { data } = await api.patch("/api/auth/me", updates);
      setProfile(data);
      toast.success("Profile updated!");
    } catch (e) {
      toast.error(e.response?.data?.error || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setPwLoading(true);
    try {
      await api.post("/api/auth/change-password", {
        currentPassword: currentPw,
        newPassword: newPw,
      });
      toast.success("Password changed!");
      setCurrentPw("");
      setNewPw("");
    } catch (e) {
      toast.error(e.response?.data?.error || "Failed to change password");
    } finally {
      setPwLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="text-gray-400 animate-pulse">Loading profile…</div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Update your personal information and preferences.</p>
      </div>

      {/* Profile form */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-5 flex items-center gap-2">
          <User className="w-4 h-4 text-blue-500" /> Personal information
        </h2>
        <form onSubmit={saveProfile} className="space-y-4">
          {/* Name */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Full name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                className="w-full border border-gray-300 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Email (read-only) */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                className="w-full border border-gray-200 rounded-lg py-2.5 pl-10 pr-4 text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                value={profile?.email || ""}
                readOnly
              />
            </div>
            <p className="text-xs text-gray-400">Email cannot be changed.</p>
          </div>

          {/* Phone */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Phone number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="tel"
                className="w-full border border-gray-300 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
              <AlignLeft className="w-4 h-4 text-blue-500" /> Bio
            </label>
            <textarea
              className="w-full border border-gray-300 rounded-lg py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
              placeholder="Tell people a bit about yourself…"
              rows={3}
              maxLength={500}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
            <p className="text-xs text-gray-400 text-right">{bio.length}/500</p>
          </div>

          {/* Provider extras */}
          {profile?.role === "provider" && (
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
                <div className="text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="inline w-3.5 h-3.5 text-blue-500 mr-1" /> Service location
                </div>
                <MapPicker
                  value={{ lat: Number(lat), lng: Number(lng) }}
                  onChange={(pos) => { setLat(pos.lat); setLng(pos.lng); }}
                />
                <p className="text-xs text-gray-500 mt-1">{Number(lat).toFixed(5)}, {Number(lng).toFixed(5)}</p>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving…" : "Save changes"}
          </button>
        </form>
      </div>

      {/* Change password */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-5 flex items-center gap-2">
          <Lock className="w-4 h-4 text-blue-500" /> Change password
        </h2>
        <form onSubmit={changePassword} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Current password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="password"
                className="w-full border border-gray-300 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                placeholder="••••••••"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">New password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="password"
                className="w-full border border-gray-300 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                placeholder="Min 6 characters"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                minLength={6}
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={pwLoading}
            className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-60"
          >
            {pwLoading ? "Changing…" : "Change password"}
          </button>
        </form>
      </div>

      {/* Account info */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm text-gray-500 space-y-1">
        <p><span className="font-medium text-gray-700">Role:</span> {profile?.role}</p>
        <p><span className="font-medium text-gray-700">Member since:</span> {new Date(profile?.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}</p>
      </div>
    </div>
  );
}
