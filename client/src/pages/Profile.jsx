import { useEffect, useState } from "react";
import api from "../api";
import toast from "react-hot-toast";
import { User, Phone, MapPin, Tag, Lock, Save, RefreshCw } from "lucide-react";
import MapPicker from "../components/MapPicker";

const CATEGORIES = ["plumber", "electrician", "gardener", "carpenter", "other"];

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [categories, setCategories] = useState([]);
  const [location, setLocation] = useState(null);

  // Password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/auth/me");
      setProfile(data);
      setName(data.name || "");
      setPhone(data.phone || "");
      setCategories(data.categories || []);
      setLocation(data.location || null);
    } catch (e) {
      toast.error(e.response?.data?.error || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const toggleCategory = (cat) => {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const update = { name, phone };
      if (profile?.role === "provider") {
        update.categories = categories;
        if (location) update.location = location;
      }
      const { data } = await api.put("/api/auth/me", update);
      setProfile(data);
      // Update stored name
      localStorage.setItem("name", data.name);
      toast.success("Profile updated");
    } catch (e) {
      toast.error(e.response?.data?.error || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    setChangingPassword(true);
    try {
      await api.put("/api/auth/me/password", { currentPassword, newPassword });
      toast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e) {
      toast.error(e.response?.data?.error || "Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-500">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading profile…
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="rounded-2xl p-5 bg-gradient-to-r from-blue-50 via-indigo-50 to-cyan-50 border">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 text-white rounded-full p-3">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">My Profile</h1>
            <p className="text-sm text-gray-600 mt-0.5 capitalize">
              {profile?.role} · {profile?.email}
            </p>
          </div>
        </div>
      </div>

      {/* Profile form */}
      <form onSubmit={handleSave} className="bg-white border rounded-2xl p-6 space-y-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Account Information</h2>

        {/* Name */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
            <User className="w-4 h-4 text-gray-400" /> Name
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Phone */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
            <Phone className="w-4 h-4 text-gray-400" /> Phone (optional)
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 98765 43210"
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Provider-only fields */}
        {profile?.role === "provider" && (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-gray-400" /> Service Categories
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                      categories.includes(cat)
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-gray-400" /> Your Location
              </label>
              <div className="rounded-xl overflow-hidden border border-gray-200">
                <MapPicker
                  value={
                    location?.coordinates
                      ? { lat: location.coordinates[1], lng: location.coordinates[0] }
                      : { lat: 28.6139, lng: 77.209 }
                  }
                  onChange={({ lat, lng }) =>
                    setLocation({ type: "Point", coordinates: [lng, lat] })
                  }
                />
              </div>
              {location?.coordinates && (
                <p className="text-xs text-gray-500">
                  Lat {location.coordinates[1].toFixed(5)}, Lng {location.coordinates[0].toFixed(5)}
                </p>
              )}
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving…" : "Save changes"}
        </button>
      </form>

      {/* Change password */}
      <form onSubmit={handlePasswordChange} className="bg-white border rounded-2xl p-6 space-y-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Lock className="w-5 h-5 text-gray-500" /> Change Password
        </h2>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Current password</label>
          <input
            type="password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">New password</label>
          <input
            type="password"
            required
            minLength={6}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Confirm new password</label>
          <input
            type="password"
            required
            minLength={6}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={changingPassword}
          className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
        >
          <Lock className="w-4 h-4" />
          {changingPassword ? "Updating…" : "Update password"}
        </button>
      </form>
    </div>
  );
}
