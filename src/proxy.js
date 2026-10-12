import { NextResponse } from "next/server";
import { ACCESS_COOKIE, REFRESH_COOKIE, clearSessionCookies, requestIsHttps, secondsLeft, setSessionCookies } from "@/lib/authCookies";
import { forwardHeaders } from "@/lib/backend";
import { refreshSession } from "@/lib/tokenRefresh";

const PUBLIC = ["/login", "/accept-invite"];
/** Refresh a little before the access token expires so a page render never starts with a dying token. */
const REFRESH_BEFORE_SEC = 60;

/**
 * Keeps the admin session alive and sends signed-out visitors to /login.
 * Real authorization still happens on the backend for every API call.
 */
export async function proxy(request) {
  const { pathname } = request.nextUrl;
  const access = request.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;

  if (pathname === "/signout") return NextResponse.next();

  if (PUBLIC.some((p) => pathname.startsWith(p))) {
    if (pathname.startsWith("/login") && refresh && access && secondsLeft(access) > 0) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (!refresh) return toLogin(request);
  if (access && secondsLeft(access) > REFRESH_BEFORE_SEC) return NextResponse.next();

  const result = await refreshSession(refresh, forwardHeaders(request.headers));
  if (!result.ok) {
    if (!result.retryable) return toLogin(request, result.code === "SESSION_IDLE_TIMEOUT" ? "idle" : result.code === "SIGNED_IN_ELSEWHERE" ? "elsewhere" : "expired");
    // Backend down or restarting: keep the session instead of signing the admin out.
    if (access && secondsLeft(access) > 0) return NextResponse.next();
    return unavailable();
  }

  // Pass the new tokens to this render and store them in the browser.
  request.cookies.set(ACCESS_COOKIE, result.accessToken);
  request.cookies.set(REFRESH_COOKIE, result.refreshToken);
  const response = NextResponse.next({ request: { headers: request.headers } });
  setSessionCookies(response.cookies, result, requestIsHttps(request.headers, request.url));
  return response;
}

function toLogin(request, reason) {
  const url = new URL("/login", request.url);
  if (reason) url.searchParams.set("reason", reason);
  const response = NextResponse.redirect(url);
  clearSessionCookies(response.cookies);
  return response;
}

function unavailable() {
  const html = `<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="10"><title>AstroAdmin</title><body style="font:15px system-ui;display:grid;place-items:center;min-height:90vh;color:#555"><p>Can't reach the server right now. Retrying in a few seconds…</p></body>`;
  return new NextResponse(html, { status: 503, headers: { "content-type": "text/html; charset=utf-8", "retry-after": "10" } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)"],
};
