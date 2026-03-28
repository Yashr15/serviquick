import { useState } from "react";
import api from "../api";
import toast from "react-hot-toast";
import { MapPin, Hammer, Navigation, Locate, Search, SlidersHorizontal } from "lucide-react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import { useRef } from "react";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import { useMap } from "react-leaflet";
import { useEffect } from "react";
import { JOB_CATEGORIES } from "../constants";
import { capitalize } from "../utils";

// Smoothly fly to [lat,lng] when they change
function RecenterOnUser({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) map.flyTo([lat, lng], Math.max(map.getZoom(), 13), { duration: 0.5 });
  }, [lat, lng]); // eslint-disable-line
  return null;
}

// Fit bounds to user + jobs
function FitBoundsOnJobs({ lat, lng, jobs }) {
  const map = useMap();
  useEffect(() => {
    const pts = [];
    if (lat && lng) pts.push([+lat, +lng]);
    jobs.forEach(j => {
      const c = j?.location?.coordinates;
      if (Array.isArray(c)) pts.push([+c[1], +c[0]]);
    });
    if (pts.length >= 2) {
      const bounds = L.latLngBounds(pts);
      map.fitBounds(bounds, { padding: [30, 30] });
    }
  }, [lat, lng, jobs]); // eslint-disable-line
  return null;
}


const DefaultIcon = L.icon({
  iconUrl,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2;

  return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(2);
}

const STATUS_COLORS = {
  plumber: "bg-blue-100 text-blue-700",
  electrician: "bg-amber-100 text-amber-700",
  gardener: "bg-emerald-100 text-emerald-700",
  carpenter: "bg-orange-100 text-orange-700",
  others: "bg-gray-100 text-gray-700",
};

export default function JobsFeed() {
  const [jobs, setJobs] = useState([]);
  const [cat, setCat] = useState("plumber");
  const [lng, setLng] = useState(77.209);
  const [lat, setLat] = useState(28.6139);
  const [radius, setRadius] = useState(10);
  const [loading, setLoading] = useState(false);

  const [trackLive, setTrackLive] = useState(false);
  const [accuracy, setAccuracy] = useState(null);
  const watchIdRef = useRef(null);

  useEffect(() => {
    if (!trackLive) {
      if (watchIdRef.current && navigator.geolocation.clearWatch) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }
    if (!navigator.geolocation) return;

    const id = navigator.geolocation.watchPosition(
      (p) => {
        setLat(p.coords.latitude);
        setLng(p.coords.longitude);
        setAccuracy(p.coords.accuracy ?? null);
      },
      (err) => console.debug("geo watch error:", err?.message),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
    );
    watchIdRef.current = id;

    return () => {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [trackLive]);

  const load = async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ category: cat, lng, lat, radius });
      const { data } = await api.get(`/api/jobs?${qs.toString()}`);
      setJobs(data.jobs ?? data);
    } catch (e) {
      toast.error(e.response?.data?.error || e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => { setLat(p.coords.latitude); setLng(p.coords.longitude); },
        (err) => console.debug("geo error:", err?.message),
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  }, []);

  const claim = async (id) => {
    try {
      await api.post(`/api/jobs/${id}/claim`, { message: "I can do this", bidAmount: 500 });
      toast.success("Proposal sent!");
    } catch (e) {
      toast.error(e.response?.data?.error || "Failed to claim");
    }
  };

  const recenter = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((p) => {
        setLat(p.coords.latitude);
        setLng(p.coords.longitude);
      });
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nearby Jobs</h1>
        <p className="text-sm text-gray-500 mt-1">Find open jobs in your area and send a proposal.</p>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4">
        <div className="flex items-center gap-2 mb-3 text-sm font-medium text-gray-700">
          <SlidersHorizontal className="w-4 h-4 text-blue-500" /> Filters
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Category */}
          <div className="space-y-1">
            <label className="text-xs text-gray-500 font-medium">Category</label>
            <select
              className="w-full border border-gray-300 rounded-lg py-2 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              value={cat}
              onChange={(e) => setCat(e.target.value)}
            >
              {JOB_CATEGORIES.map(c => (
                <option key={c} value={c}>{capitalize(c)}</option>
              ))}
            </select>
          </div>

          {/* Radius */}
          <div className="space-y-1">
            <label className="text-xs text-gray-500 font-medium">Radius (km)</label>
            <input
              type="number"
              min="1"
              max="100"
              className="w-full border border-gray-300 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
            />
          </div>

          {/* Location coords (compact) */}
          <div className="space-y-1">
            <label className="text-xs text-gray-500 font-medium">Latitude</label>
            <input
              className="w-full border border-gray-300 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-500 font-medium">Longitude</label>
            <input
              className="w-full border border-gray-300 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={load}
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
            <Locate className="w-4 h-4" /> Recenter
          </button>
          <button
            type="button"
            onClick={() => setTrackLive(v => !v)}
            className={`flex items-center gap-1.5 font-medium px-4 py-2 rounded-lg text-sm transition-colors ${
              trackLive
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : "border border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Navigation className="w-4 h-4" />
            {trackLive ? "Tracking…" : "Track me"}
          </button>
        </div>
      </div>

      {/* Map */}
      <div className="h-[320px] w-full rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <MapContainer
          center={[+lat, +lng]}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <RecenterOnUser lat={+lat} lng={+lng} />
          <FitBoundsOnJobs lat={+lat} lng={+lng} jobs={jobs} />
          {accuracy && (
            <Circle
              center={[+lat, +lng]}
              radius={accuracy}
              pathOptions={{ color: "#60a5fa", fillColor: "#93c5fd", fillOpacity: 0.2 }}
            />
          )}
          <Marker position={[+lat, +lng]}>
            <Popup>You are here</Popup>
          </Marker>
          {jobs.map((j) => (
            <Marker
              key={j._id}
              position={[+j.location.coordinates[1], +j.location.coordinates[0]]}
            >
              <Popup>
                <b>{j.title}</b><br />
                {j.category}<br />
                {distanceKm(+lat, +lng, +j.location.coordinates[1], +j.location.coordinates[0])} km away
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Job cards */}
      <div className="space-y-3">
        {jobs.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-500">
            <Hammer className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No jobs found</p>
            <p className="text-sm">Try adjusting your filters or increasing the radius.</p>
          </div>
        )}

        {jobs.map(j => (
          <div key={j._id} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Hammer className="w-4 h-4 text-blue-500 shrink-0" />
                  <span className="font-semibold text-gray-900 truncate">{j.title}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[j.category] ?? "bg-gray-100 text-gray-600"}`}>
                    {j.category}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500 mt-1.5">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span>
                    {distanceKm(
                      Number(lat), Number(lng),
                      Number(j?.location?.coordinates?.[1]),
                      Number(j?.location?.coordinates?.[0])
                    )} km away
                  </span>
                </div>
              </div>
              <button
                onClick={() => claim(j._id)}
                className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                Claim
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
