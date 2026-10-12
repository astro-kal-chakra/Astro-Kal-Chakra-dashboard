"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { ROLE_MAP } from "@/config/permissions";
import { authRequest } from "@/lib/backend";
import { api } from "@/lib/api";
import { CHALLENGE_COOKIE, PREVIEW_COOKIE, clearSessionCookies, cookieOptions, requestIsHttps, setSessionCookies } from "@/lib/authCookies";
import { getCurrentAdmin } from "@/lib/session";

/**
 * The backend's sign-in challenge (5 minutes; 15 for a first-time 2FA setup, which includes installing the
 * authenticator and scanning the QR code). It stays in an httpOnly cookie, never in the page.
 */
const CHALLENGE_MAX_AGE = 5 * 60;
const SETUP_CHALLENGE_MAX_AGE = 15 * 60;

const failure = (r) => {
  const e = r.error ?? {};
  if (e.code === "ACCOUNT_LOCKED") return { locked: true, lockedUntil: e.details?.lockedUntil ?? null, error: e.message };
  return { error: e.message || "Sign-in failed. Try again.", code: e.code, attemptsLeft: e.details?.attemptsLeft ?? null };
};

/**
 * Step 1: email + password → `{ step: "2fa" }`, or `{ step: "2fa_setup", setup }` on the
 * first sign-in (and after a 2FA reset) with the QR code and manual key to enrol.
 */
export async function startLogin(formData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password." };

  const h = await headers();
  const r = await authRequest("/admin/login", { email, password }, h);
  if (!r.ok) return failure(r);

  const maxAge = r.data.step === "2fa_setup" ? SETUP_CHALLENGE_MAX_AGE : CHALLENGE_MAX_AGE;
  (await cookies()).set(CHALLENGE_COOKIE, r.data.challengeToken, cookieOptions(maxAge, requestIsHttps(h)));
  return r.data.step === "2fa_setup"
    ? { step: "2fa_setup", setup: { manualKey: r.data.setup?.manualKey, qrDataUrl: r.data.setup?.qrDataUrl } }
    : { step: "2fa" };
}

/**
 * Step 2: the 6-digit code (or a recovery code) → session cookies. After a
 * first-time setup the one-time recovery codes are returned so the page can
 * show them before continuing; otherwise this redirects to the dashboard.
 */
export async function verifyLogin(formData) {
  const code = String(formData.get("code") ?? "").replace(/\s/g, "");
  const store = await cookies();
  const challengeToken = store.get(CHALLENGE_COOKIE)?.value;
  if (!challengeToken) return { restart: true, error: "Sign-in expired. Enter your email and password again." };
  if (!/^\d{6}$/.test(code) && !/^[A-Z0-9]{4}-?[A-Z0-9]{4}$/i.test(code)) return { error: "Enter the 6-digit code from your authenticator app." };

  const h = await headers();
  const r = await authRequest("/admin/login/verify", { challengeToken, code }, h);
  if (!r.ok) {
    if (r.error?.code === "CHALLENGE_EXPIRED" || r.error?.code === "ACCOUNT_LOCKED") store.delete(CHALLENGE_COOKIE);
    if (r.error?.code === "CHALLENGE_EXPIRED") return { restart: true, error: r.error.message };
    return failure(r);
  }

  store.delete(CHALLENGE_COOKIE);
  store.delete(PREVIEW_COOKIE);
  setSessionCookies(store, r.data, requestIsHttps(h));
  if (r.data.recoveryCodes?.length) return { step: "recovery", recoveryCodes: r.data.recoveryCodes };
  redirect("/");
}

/** Ends this session on the backend (so the token can't be reused) and clears the cookies. */
export async function logout() {
  try {
    await api("/me/logout", { method: "POST" });
  } catch {
    // Already signed out on the backend — just clear the cookies.
  }
  clearSessionCookies(await cookies());
  redirect("/login");
}

/**
 * Keeps the backend session alive while the admin is active in the browser (the
 * backend ends sessions after 30 minutes without requests). A 401 here signs out.
 */
export async function keepAlive() {
  await api("/me");
  return true;
}

/** Super Admin only: preview the dashboard as another role. UI only — the backend keeps the real role. */
export async function switchRole(roleKey) {
  const admin = await getCurrentAdmin();
  if (admin.realRole.key !== "super_admin") return;
  const store = await cookies();
  if (!roleKey || roleKey === "super_admin" || !ROLE_MAP[roleKey]) store.delete(PREVIEW_COOKIE);
  else store.set(PREVIEW_COOKIE, roleKey, cookieOptions(8 * 3600, requestIsHttps(await headers())));
}

/** Invite link → set a password. 2FA is set up on the first sign-in. */
export async function acceptInvite(formData) {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!token) return { error: "This invite link is incomplete. Ask for a new invite." };
  const r = await authRequest("/admin/invite/accept", { token, password }, await headers());
  if (!r.ok) return { error: r.error?.message || "Couldn't accept the invite.", code: r.error?.code };
  redirect("/login?invited=1");
}
