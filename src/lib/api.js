import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { ACCESS_COOKIE } from "./authCookies";
import { API_BASE, forwardHeaders } from "./backend";

/**
 * Server-side client for the admin API (`/api/v1/admin`). Used by `@/services`
 * (page data) and `@/actions` (mutations). Never import from a "use client" file:
 * it reads the httpOnly session cookie and sends it as a Bearer token.
 */
export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/** Backend 401 code → the notice shown on /login. */
export const SIGNOUT_REASONS = { SESSION_IDLE_TIMEOUT: "idle", SIGNED_IN_ELSEWHERE: "elsewhere" };

/**
 * Validates a value used as a URL path segment (ids, codes, slugs). Blocks
 * "..", "/" and the like so a crafted id can't point a call at another endpoint.
 */
export function seg(value) {
  const s = String(value ?? "");
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(s)) throw new ApiError(400, "BAD_ID", "Invalid id");
  return s;
}

/** `keep`: keys where "all" is a real value (e.g. the astrologers "All" tab), not "no filter". */
function queryString(query = {}, keep = []) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null || v === "" || (v === "all" && !keep.includes(k))) continue;
    p.set(k, String(v));
  }
  const s = p.toString();
  return s ? `?${s}` : "";
}

/** Builds the full URL for an admin API path (used by the CSV export route too). */
export const adminUrl = (path, query, keep) => `${API_BASE}/admin${path}${queryString(query, keep)}`;

export async function authHeaders() {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  return { ...forwardHeaders(await headers()), ...(token ? { authorization: `Bearer ${token}` } : {}) };
}

/**
 * Calls the admin API and returns `data` from the `{ success, message, data }` envelope.
 *
 * - `query`: list params (q, filters, sort, page); empty values and "all" are dropped
 * - `body`: JSON body; `form`: FormData (file uploads)
 * - `nullOn404`: return null instead of throwing (detail pages call notFound())
 * - `withMessage`: return `{ data, message }`
 *
 * A 401 means the session is over (idle timeout, revoked, expired): the admin is sent to /login.
 */
export async function api(path, { method = "GET", query, keep, body, form, nullOn404 = false, withMessage = false } = {}) {
  const h = { accept: "application/json", ...(await authHeaders()) };
  let payload;
  if (form) payload = form;
  else if (body !== undefined) {
    h["content-type"] = "application/json";
    payload = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(adminUrl(path, query, keep), { method, headers: h, body: payload, cache: "no-store" });
  } catch {
    throw new ApiError(503, "API_UNREACHABLE", "Can't reach the server. Check your connection and try again.");
  }

  const json = await res.json().catch(() => null);
  if (res.ok) return withMessage ? { data: json?.data ?? null, message: json?.message } : (json?.data ?? null);

  const err = json?.error ?? {};
  if (res.status === 401) redirect(`/signout?reason=${SIGNOUT_REASONS[err.code] ?? "expired"}`);
  if (res.status === 404 && nullOn404) return null;
  // A 413 without our JSON comes from the web server in front of the API (e.g. Nginx client_max_body_size)
  if (res.status === 413 && !err.message) {
    throw new ApiError(413, "PAYLOAD_TOO_LARGE", "This file is larger than the server accepts. Raise the upload limit on the API server (Nginx client_max_body_size) or use a smaller file.");
  }
  throw new ApiError(res.status, err.code ?? "ERROR", err.message || `Request failed (${res.status})`, err.details);
}
