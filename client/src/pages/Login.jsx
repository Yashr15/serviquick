import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import toast from "react-hot-toast";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/api/auth/login", { email, password });
      localStorage.setItem("token", data.token);
      toast.success("Logged in");
      nav("/dashboard");
    } catch (e) {
      toast.error(e.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="max-w-sm mx-auto space-y-3">
      <h2 className="text-2xl font-bold">Login</h2>
      <input className="w-full border p-2 rounded" placeholder="Email"
        value={email} onChange={(e)=>setEmail(e.target.value)} />
      <input className="w-full border p-2 rounded" type="password" placeholder="Password"
        value={password} onChange={(e)=>setPassword(e.target.value)} />
      <button className="w-full bg-black text-white p-2 rounded disabled:opacity-60" disabled={loading}>
        {loading ? "Logging in..." : "Login"}
      </button>
    </form>
  );
}
