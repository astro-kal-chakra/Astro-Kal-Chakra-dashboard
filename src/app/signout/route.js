import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { clearSessionCookies } from "@/lib/authCookies";

const REASONS = new Set(["idle", "expired", "elsewhere"]);

/**
 * Clears the local session cookies and goes to /login. Used when the backend
 * rejects the session during a page render (where cookies can't be changed).
 */
export async function GET(request) {
  clearSessionCookies(await cookies());
  const reason = request.nextUrl.searchParams.get("reason");
  // Relative Location: behind Nginx the app sees itself as http://localhost:<port>, so an absolute URL built
  // from request.url sent admins to localhost after being signed out. The browser keeps the real domain.
  const location = REASONS.has(reason) ? `/login?reason=${reason}` : "/login";
  return new NextResponse(null, { status: 307, headers: { Location: location } });
}
