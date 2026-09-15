import axios from "axios";

// Base URL is environment-driven so the same build can target different
// backend deployments (local, staging, production) without code changes.
const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

// The JWT lives in an HttpOnly cookie set by the backend (see
// backend/app/api/v1/auth.py for the rationale) rather than in JS-readable
// storage, so the client never handles the token directly — it only needs
// to send cookies with every request.
const apiClient = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export default apiClient;
