import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "https://serviquick-backend-br68.onrender.com";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000",
  baseURL: BASE_URL,
  withCredentials: true,
  timeout: 15000, // 15 second request timeout
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const t = localStorage.getItem("token");
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

// Automatically handle 401 – clear stale token and redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
// Retry helper for network errors (up to 2 retries with exponential back-off)
const MAX_RETRIES = 2;
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    if (!config) return Promise.reject(error);

    // Only retry on network errors or 5xx server errors (not 4xx client errors)
    const isNetworkError = !error.response;
    const isServerError = error.response?.status >= 500;
    const retryCount = config.__retryCount || 0;

    if ((isNetworkError || isServerError) && retryCount < MAX_RETRIES) {
      config.__retryCount = retryCount + 1;
      // Exponential back-off: 500ms, 1000ms
      const delay = 500 * Math.pow(2, retryCount);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return api(config);
    }

    // Surface a friendly offline message
    if (isNetworkError && !navigator.onLine) {
      return Promise.reject(
        Object.assign(error, { message: "You appear to be offline. Please check your connection." })
      );
    }

    return Promise.reject(error);
  }
);

export default api;
