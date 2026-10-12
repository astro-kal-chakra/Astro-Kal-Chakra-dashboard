import { API_BASE } from "./backend";

/**
 * Refresh tokens rotate on every use, and the backend treats a reused token as
 * stolen (it signs the whole session out). A page load fires several requests
 * at once, so refreshes for the same token are shared: the first request does
 * the refresh and the others get its result. Results are kept for a minute so a
 * request that still carries the old cookie gets the new tokens too.
 */
const recent = new Map();
const KEEP_MS = 60_000;

export function refreshSession(refreshToken, headers) {
  let p = recent.get(refreshToken);
  if (!p) {
    p = doRefresh(refreshToken, headers);
    recent.set(refreshToken, p);
    p.finally(() => setTimeout(() => recent.delete(refreshToken), KEEP_MS));
  }
  return p;
}

async function doRefresh(refreshToken, headers) {
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json", ...headers },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    });
    const json = await res.json().catch(() => null);
    if (res.ok && json?.data?.accessToken) return { ok: true, accessToken: json.data.accessToken, refreshToken: json.data.refreshToken };
    // 5xx: the backend is having trouble — keep the session and let the page show the error.
    return { ok: false, retryable: res.status >= 500, code: json?.error?.code };
  } catch {
    return { ok: false, retryable: true, code: "API_UNREACHABLE" };
  }
}
