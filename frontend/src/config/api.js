// Centralized API configuration
const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// Normalize base URL:
// - Trim trailing slashes
// - Remove trailing `/api` if present, so callers can safely append `/api/...`
const API_BASE_URL = rawBaseUrl.replace(/\/+$/, "").replace(/\/api$/i, "");

export default API_BASE_URL;
