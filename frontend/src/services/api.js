import axios from "axios";
import API_BASE_URL from "../config/api";

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
});

// Request interceptor to add the auth token to headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle unauthenticated sessions globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Optional: Handle token expiration globally (e.g., dispatch a logout event or clear localStorage)
      // localStorage.removeItem("token");
      // localStorage.removeItem("userRole");
      // localStorage.removeItem("user");
      // window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
