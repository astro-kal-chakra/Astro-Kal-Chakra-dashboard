import { NextResponse } from "next/server";

/**
 * Optimistic auth check: unauthenticated visitors go to /login.
 * Real authorization still happens server-side in every page/API.
 */
export function proxy(request) {
  const hasSession = request.cookies.has("admin_session");
  const isLogin = request.nextUrl.pathname.startsWith("/login");

  if (!hasSession && !isLogin) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (hasSession && isLogin) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|webp|ico)$).*)"],
};
