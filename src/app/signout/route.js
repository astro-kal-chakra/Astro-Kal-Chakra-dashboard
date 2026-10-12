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
  const url = new URL("/login", request.url);
  if (REASONS.has(reason)) url.searchParams.set("reason", reason);
  return NextResponse.redirect(url);
}
