import {useState } from "react";
import api from "../api";
import toast from "react-hot-toast";
import { MapPin, Hammer } from "lucide-react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import { useRef } from "react";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import { useMap } from "react-leaflet";
import { useEffect } from "react";

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
  const R = 6371; // Earth km radius
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2;

  return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(2);
}

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

    // start/stop GPS watching
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
        setAccuracy(p.coords.accuracy ?? null); // meters
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
      setJobs(data);
    } catch (e) {
      toast.error(e.response?.data?.error || "Failed to load");
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
      await api.post(`/api/jobs/${id}/claim`, { message:"I can do this", bidAmount:500 });
      toast.success("Proposal sent!");
    } catch (e) {
      toast.error(e.response?.data?.error || "Failed to claim");
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-3">Nearby Jobs</h2>
      <div className="grid grid-cols-7 gap-2 mb-4">
        <select className="border p-2 rounded" value={cat} onChange={(e)=>setCat(e.target.value)}>
          <option>plumber</option>
          <option>electrician</option>
          <option>gardener</option>
          <option>carpenter</option>
          <option >others</option>
        </select>
        <input className="border p-2 rounded" value={lng} onChange={(e)=>setLng(e.target.value)} />
        <input className="border p-2 rounded" value={lat} onChange={(e)=>setLat(e.target.value)} />
        <input className="border p-2 rounded" value={radius} onChange={(e)=>setRadius(e.target.value)} />
        <button className="bg-black text-white rounded" onClick={load} disabled={loading}>
        {loading ? "Loading..." : "Search"}
        </button>
        {/* live tracking toggle */}
        <button
            type="button"
            className={`rounded px-3 ${trackLive ? "bg-blue-600 text-white" : "bg-gray-200"}`}
            onClick={() => setTrackLive(v => !v)}
            title="Track my movement"
        >
            {trackLive ? "Tracking…" : "Track me"}
        </button>

        {/* ✅ Recenter Button */}
        <button
            type="button"
            className="bg-blue-600 text-white rounded px-3"
            onClick={() => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition((p) => {
                setLat(p.coords.latitude);
                setLng(p.coords.longitude);
                });
            }
            }}
        >
            Recenter
        </button>
      </div>

      <div className="h-[300px] w-full mb-4 border rounded overflow-hidden">
        <MapContainer
            center={[+lat, +lng]}  // only used on first mount
            zoom={13}
            style={{ height: "100%", width: "100%" }}
        >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

            <RecenterOnUser lat={+lat} lng={+lng} />
            <FitBoundsOnJobs lat={+lat} lng={+lng} jobs={jobs} />

            {/* you (marker + accuracy) */}
            {accuracy && (
            <Circle
                center={[+lat, +lng]}
                radius={accuracy}        // meters
                pathOptions={{ color: "#60a5fa", fillColor: "#93c5fd", fillOpacity: 0.2 }}
            />
            )}
            <Marker position={[+lat, +lng]}>
            <Popup>You are here</Popup>
            </Marker>

            {/* jobs */}
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




      <div className="space-y-3">
        {jobs.map(j => (
          <div key={j._id} className="border rounded p-3 hover:shadow-sm transition">
            <div className="flex items-center gap-2">
              <Hammer className="w-4 h-4" />
              <div className="font-semibold">{j.title}</div>
              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{j.category}</span>
            </div>
            <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
              <MapPin className="w-3 h-3" />
              <span>lng {j.location?.coordinates?.[0]}, lat {j.location?.coordinates?.[1]}</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
                {distanceKm(
                    Number(lat), Number(lng),
                    Number(j?.location?.coordinates?.[1]),
                    Number(j?.location?.coordinates?.[0])
                )} km away
            </div>
            <button onClick={()=>claim(j._id)} className="mt-2 px-3 py-1 bg-black text-white rounded">
              Claim
            </button>
          </div>
        ))}
        {jobs.length===0 && <p className="text-gray-500">No jobs found.</p>}
      </div>
    </div>
  );
}
