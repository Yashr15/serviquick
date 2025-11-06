import { useState } from "react";
import api from "../api";
import toast from "react-hot-toast";
import MapPicker from "../components/MapPicker";

export default function PostJob() {
  const [title, setTitle] = useState("Fix leaking tap");
  const [category, setCategory] = useState("plumber");
  const [description, setDescription] = useState("Kitchen sink");
  const [lng, setLng] = useState(77.209);
  const [lat, setLat] = useState(28.6139);
  const [loading, setLoading] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/api/jobs", {
        title, description, category,
        location: { type:"Point", coordinates:[Number(lng), Number(lat)] }
      });
      toast.success("Job posted!");
    } catch (e) {
      toast.error(e.response?.data?.error || "Failed to post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="max-w-lg mx-auto space-y-3">
      <h2 className="text-2xl font-bold">Post a Job</h2>
      <input className="w-full border p-2 rounded" value={title} onChange={(e)=>setTitle(e.target.value)} />
      <select className="w-full border p-2 rounded" value={category} onChange={(e)=>setCategory(e.target.value)}>
        <option>plumber</option><option>electrician</option><option>gardener</option><option>carpenter</option>
      </select>
      <textarea className="w-full border p-2 rounded" value={description} onChange={(e)=>setDescription(e.target.value)} />
      <MapPicker
        value={{ lat: Number(lat), lng: Number(lng) }}
        onChange={(pos) => {
            setLat(pos.lat);
            setLng(pos.lng);
            }
        }
        />
      <button className="bg-black text-white px-4 py-2 rounded disabled:opacity-60" disabled={loading}>
        {loading ? "Posting..." : "Create"}
      </button>
    </form>
  );
}
