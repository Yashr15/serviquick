import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://serviquick-backend-br68.onrender.com",
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const t = localStorage.getItem("token");
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

export default api;
