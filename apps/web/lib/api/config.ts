/**
 * BhuSetu 3D Centralized API Base URL Configuration
 * Single Source of Truth for Backend URL Resolution
 * 
 * Rules:
 * 1. Production must ALWAYS point to https://bhusetu3d-backend.onrender.com/api/v1
 * 2. Production NEVER falls back to localhost or 127.0.0.1
 * 3. Development uses NEXT_PUBLIC_API_URL or falls back to local backend
 */

export const RENDER_BACKEND_URL = "https://bhusetu3d-backend.onrender.com/api/v1";
export const LOCAL_BACKEND_URL = "http://127.0.0.1:8000/api/v1";

/**
 * Returns the effective API base URL without trailing slashes.
 */
export function getApiBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;

  // Detect production environment via NODE_ENV or browser host
  const isProduction =
    process.env.NODE_ENV === "production" ||
    (typeof window !== "undefined" &&
      (window.location.hostname.includes("vercel.app") ||
        window.location.hostname === "bhusetu3d.com" ||
        window.location.protocol === "https:"));

  // 1. If explicit env variable is set, validate it
  if (envUrl && envUrl.trim() !== "") {
    const trimmed = envUrl.trim().replace(/\/+$/, "");
    // If running in production but env mistakenly contains localhost, force Render backend
    if (isProduction && (trimmed.includes("localhost") || trimmed.includes("127.0.0.1"))) {
      return RENDER_BACKEND_URL;
    }
    return trimmed;
  }

  // 2. Environment-based resolution
  if (isProduction) {
    return RENDER_BACKEND_URL;
  }

  return LOCAL_BACKEND_URL;
}

export const API_BASE = getApiBaseUrl();
export const API_BASE_URL = API_BASE;
export default API_BASE;
