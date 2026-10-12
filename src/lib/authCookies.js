/**
 * Session cookies. Tokens live only in httpOnly cookies set by the Next server;
 * browser JavaScript never sees them. No Next imports, so `proxy.js` can use it.
 */
export const ACCESS_COOKIE = "astro_at";
export const REFRESH_COOKIE = "astro_rt";
export const CHALLENGE_COOKIE = "astro_2fa";
export const PREVIEW_COOKIE = "astro_preview_role";

/** Matches the backend's admin refresh-token lifetime (ADMIN_REFRESH_TOKEN_DAYS, default 1). */
const SESSION_MAX_AGE = Math.round((Number(process.env.ADMIN_SESSION_DAYS) || 1) * 86400);

/**
 * Secure (HTTPS-only) cookies. Browsers silently drop Secure cookies on plain http://, which used to break
 * sign-in on an http production URL ("Sign-in expired" right after entering the 2FA code). So:
 *   COOKIE_SECURE=true|false  → forced
 *   otherwise                 → Secure when the request came over HTTPS (or, if unknown, in production)
 */
export function secureCookies(https) {
  if (process.env.COOKIE_SECURE === "true") return true;
  if (process.env.COOKIE_SECURE === "false") return false;
  if (typeof https === "boolean") return https;
  return process.env.NODE_ENV === "production";
}

/** Was this request made over HTTPS? From the browser's Origin, the proxy's X-Forwarded-Proto or the URL. */
export function requestIsHttps(headers, url) {
  const proto = headers?.get?.("x-forwarded-proto")?.split(",")[0]?.trim();
  if (proto) return proto === "https";
  const origin = headers?.get?.("origin");
  if (origin) return origin.startsWith("https:");
  if (url) return String(url).startsWith("https:");
  return undefined;
}

export const cookieOptions = (maxAge, https) => ({
  httpOnly: true,
  sameSite: "lax",
  secure: secureCookies(https),
  path: "/",
  maxAge,
});

/** Seconds until a JWT expires. Only used to decide when to refresh — the backend verifies the signature. */
export function secondsLeft(jwt) {
  try {
    const payload = JSON.parse(Buffer.from(String(jwt).split(".")[1], "base64url").toString("utf8"));
    return Number(payload.exp) - Date.now() / 1000;
  } catch {
    return -1;
  }
}

/** `store` is `cookies()` in a Server Function / Route Handler, or `response.cookies` in the proxy. */
export function setSessionCookies(store, { accessToken, refreshToken }, https) {
  store.set(ACCESS_COOKIE, accessToken, cookieOptions(Math.max(60, Math.floor(secondsLeft(accessToken))), https));
  if (refreshToken) store.set(REFRESH_COOKIE, refreshToken, cookieOptions(SESSION_MAX_AGE, https));
}

export function clearSessionCookies(store) {
  for (const name of [ACCESS_COOKIE, REFRESH_COOKIE, CHALLENGE_COOKIE, PREVIEW_COOKIE]) store.delete(name);
}
