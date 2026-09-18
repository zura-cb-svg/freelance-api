import axios from "axios";

const TOKEN_KEY = "forge_token";

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 20000,
});

// Endpoints that are public per the backend's OpenAPI spec (no `security`
// requirement). A stale/expired token left in localStorage from an earlier
// session must NOT be sent on these - some backends attempt to decode any
// Authorization header present regardless of whether the route needs one,
// and a malformed/expired token there can throw an unhandled exception
// (a raw 500) instead of the request just being treated as unauthenticated.
const PUBLIC_ENDPOINTS = ["/auth/signup", "/auth/login"];

api.interceptors.request.use((config) => {
  const isPublic = PUBLIC_ENDPOINTS.some((path) => config.url?.startsWith(path));
  const token = tokenStorage.get();
  if (token && !isPublic) {
    config.headers.Authorization = `Bearer ${token}`;
  } else if (config.headers?.Authorization) {
    delete config.headers.Authorization;
  }
  return config;
});

// Listeners the AuthContext can subscribe to so a 401 anywhere logs the user out.
const unauthorizedListeners = new Set();
export function onUnauthorized(listener) {
  unauthorizedListeners.add(listener);
  return () => unauthorizedListeners.delete(listener);
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      error.friendlyMessage =
        "Can't reach the server right now. Check your connection and try again.";
    } else {
      const { status, data } = error.response;
      if (status === 401) {
        tokenStorage.clear();
        unauthorizedListeners.forEach((fn) => fn());
        error.friendlyMessage = "Your session has expired. Please log in again.";
      } else if (status === 403) {
        error.friendlyMessage = "You don't have permission to do that.";
      } else if (status === 404) {
        error.friendlyMessage = "We couldn't find what you were looking for.";
      } else if (status === 409) {
        error.friendlyMessage = "That conflicts with existing data. Please refresh and try again.";
      } else if (status === 422) {
        const detail = data?.detail;
        if (Array.isArray(detail) && detail.length > 0) {
          error.friendlyMessage = detail
            .map((d) => d.msg)
            .filter(Boolean)
            .join(" ");
        } else {
          error.friendlyMessage = "Some of the information provided isn't valid.";
        }
      } else if (status === 502 || status === 503 || status === 504) {
        // Render's free tier spins services down when idle; the first
        // request after a period of inactivity often bounces off the proxy
        // with one of these before the app has finished booting.
        error.friendlyMessage = "The server is waking up from idle. Please try again in a few seconds.";
        error.isColdStart = true;
      } else if (status >= 500) {
        const detail = typeof data?.detail === "string" ? data.detail : null;
        error.friendlyMessage = detail
          ? `Server error: ${detail}`
          : "Something went wrong on our end. Please try again shortly.";
        // Keep the raw detail visible in dev tools even when we show a
        // friendlier message, since a 500 always means a real backend bug.
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.error("Server error response:", status, data);
        }
      } else {
        error.friendlyMessage = "Something went wrong. Please try again.";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
