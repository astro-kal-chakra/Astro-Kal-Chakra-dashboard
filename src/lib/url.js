/**
 * Builds `path?query` from the current params plus a patch. Empty values are
 * dropped; changing any filter resets pagination unless `page` is in the patch.
 */
export function buildHref(path, params = {}, patch = {}) {
  const next = { ...params, ...patch };
  if (!("page" in patch)) delete next.page;
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(next)) {
    if (v === undefined || v === null || v === "" || v === "all") continue;
    qs.set(k, String(v));
  }
  const s = qs.toString();
  return s ? `${path}?${s}` : path;
}

/** Normalises Next's searchParams (string | string[]) to plain strings. */
export function flatParams(sp = {}) {
  return Object.fromEntries(Object.entries(sp).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));
}
