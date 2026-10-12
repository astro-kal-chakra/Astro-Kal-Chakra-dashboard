import { refresh as refreshRouter } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { ApiError } from "./api";

/**
 * Wraps a Server Action body. Returns `{ ok: true, data }` or
 * `{ ok: false, error: { message, code, details } }` — never throws to the
 * client (production builds hide thrown messages), except for Next's own
 * redirects (e.g. to /login when the session ended).
 *
 * By default the client router is refreshed so server-rendered pages show the
 * new state. Pass `{ refresh: false }` for read-only actions.
 */
export async function run(fn, { refresh = true } = {}) {
  try {
    const data = await fn();
    if (refresh) refreshRouter();
    return { ok: true, data: data ?? null };
  } catch (err) {
    unstable_rethrow(err);
    if (err instanceof ApiError) return { ok: false, error: { message: err.message, code: err.code, details: err.details ?? null } };
    console.error("[action]", err);
    return { ok: false, error: { message: "Something went wrong. Try again.", code: "ERROR" } };
  }
}

/** Form values arrive as strings; these keep conversions in one place. */
export const num = (v) => (v === undefined || v === null || v === "" ? undefined : Number(v));
export const str = (v) => (v === undefined || v === null ? undefined : String(v).trim());
export const bool = (v) => v === true || v === "true" || v === "on";
