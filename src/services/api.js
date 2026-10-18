import { MOCK_PROFILE } from "../data/mock";

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"
).replace(/\/+$/, "");
const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";
const TOKEN_KEY = "skillsense.access-token";
const REQUEST_TIMEOUT_MS = 180_000;

export const getAuthToken = () => localStorage.getItem(TOKEN_KEY);
export const setAuthToken = (token) => {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
};

const mockReply = (endpoint, method, data) => {
  if (endpoint === "/auth/login") return { access_token: "mock-token" };
  if (endpoint === "/auth/register") return { user_id: MOCK_PROFILE.user_id };
  if (endpoint === "/auth/me") {
    return {
      user_id: MOCK_PROFILE.user_id,
      username: MOCK_PROFILE.username,
      email: MOCK_PROFILE.email,
    };
  }
  if (endpoint.endsWith("/dashboard")) return structuredClone(MOCK_PROFILE);
  if (endpoint.endsWith("/profile") && method === "GET") {
    return structuredClone(MOCK_PROFILE);
  }
  if (endpoint.endsWith("/profile") && ["POST", "PUT"].includes(method)) {
    return { status: method === "POST" ? "created" : "updated", user_id: MOCK_PROFILE.user_id };
  }
  if (endpoint.includes("/progress")) {
    return {
      progress: 0.5,
      status: "active",
      completed: false,
    };
  }
  if (endpoint === "/api/webhooks/me" && method === "GET") {
    return { configured: MOCK_PROFILE.webhook_connected };
  }
  if (endpoint === "/api/webhooks/me" && method === "PUT") {
    return { webhook_url: `${API_BASE_URL}/api/webhooks/external/demo-token` };
  }
  if (endpoint === "/api/health-connect/status") {
    return { connected: MOCK_PROFILE.fitness_connected };
  }
  if (endpoint === "/api/health-connect/pairings") {
    return {
      pairing_code: "demo-pairing-code",
      app_link: "aiskillsense://connect?pairing_code=demo-pairing-code",
      expires_at: new Date(Date.now() + 600000).toISOString(),
    };
  }
  return { ok: true, data };
};

export async function apiCall(endpoint, method = "GET", data = null) {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 350));
    return { success: true, data: mockReply(endpoint, method, data) };
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const token = getAuthToken();
    const headers = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      signal: controller.signal,
    });
    if (!res.ok) {
      let message = `Request failed (${res.status})`;
      try {
        const body = await res.json();
        if (typeof body.detail === "string") {
          message = body.detail;
        } else if (Array.isArray(body.detail)) {
          message = body.detail
            .map((item) => item.msg)
            .filter(Boolean)
            .join("; ") || message;
        }
      } catch {
        // Keep the HTTP status as the error when the response is not JSON.
      }
      throw new Error(message);
    }
    if (res.status === 204) return { success: true, data: null };
    return { success: true, data: await res.json() };
  } catch (error) {
    if (error.name === "AbortError") {
      return {
        success: false,
        error: `The backend did not respond within ${REQUEST_TIMEOUT_MS / 1000} seconds. It may be waking up on Render; please retry.`,
      };
    }
    if (error instanceof TypeError) {
      return {
        success: false,
        error: "Could not reach the backend. Check its availability, the API URL, and the frontend origin allowed by backend CORS.",
      };
    }
    return { success: false, error: error.message };
  } finally {
    clearTimeout(timeout);
  }
}
