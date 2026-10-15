import { MOCK_PROFILE } from '../data/mock';

// Placeholder backend. Replace via VITE_API_BASE_URL when the real API is ready.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://dummy-backend.example.com/api/v1';
const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

const mockReply = (endpoint) => (endpoint === '/me' ? structuredClone(MOCK_PROFILE) : { ok: true });

export async function apiCall(endpoint, method = 'GET', data = null) {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 350));
    return { success: true, data: mockReply(endpoint) };
  }
  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: data ? JSON.stringify(data) : undefined,
    });
    if (!res.ok) throw new Error(`Request failed (${res.status})`);
    return { success: true, data: await res.json() };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
