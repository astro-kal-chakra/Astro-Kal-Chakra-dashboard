/**
 * Low-level backend settings shared by the proxy, route handlers, server actions
 * and the service layer. Server-only (reads private env vars); no Next imports,
 * so `proxy.js` can use it too.
 */
export const API_BASE = `${(process.env.API_BASE_URL || "http://localhost:5000").replace(/\/+$/, "")}/api/v1`;

/**
 * How many proxies (this Next server included) sit in front of the browser.
 * The client IP is taken that many entries from the right of X-Forwarded-For,
 * so a browser can't spoof it by sending its own header.
 */
const TRUSTED_HOPS = Math.max(1, Number(process.env.TRUSTED_PROXY_HOPS) || 1);

export function clientIp(h) {
  const parts = String(h.get("x-forwarded-for") ?? "")
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  const ip = parts.length ? parts[Math.max(0, parts.length - TRUSTED_HOPS)] : h.get("x-real-ip") ?? "";
  return ip.replace(/^::ffff:/, "");
}

/** Headers that let the backend log the admin's real IP and device (sessions list, audit log, rate limits). */
export function forwardHeaders(h) {
  const out = {};
  const ip = clientIp(h);
  if (ip) out["x-forwarded-for"] = ip;
  const ua = h.get("user-agent");
  if (ua) out["user-agent"] = ua.slice(0, 400);
  return out;
}

/** POST to /api/v1/auth/*. Returns the parsed envelope plus the HTTP status; never throws on HTTP errors. */
export async function authRequest(path, body, h) {
  try {
    const res = await fetch(`${API_BASE}/auth${path}`, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json", ...forwardHeaders(h) },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const json = await res.json().catch(() => null);
    return { status: res.status, ok: res.ok, data: json?.data ?? null, error: json?.error ?? null, message: json?.message };
  } catch {
    return { status: 503, ok: false, data: null, error: { code: "API_UNREACHABLE", message: "Can't reach the server. Try again in a moment." } };
  }
}
