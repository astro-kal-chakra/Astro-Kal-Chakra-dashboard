"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ROLE_MAP } from "@/config/permissions";
import { findDemoAccount } from "@/config/demoAccounts";

const COOKIE = { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 8 };

/**
 * Demo login against the per-role demo accounts. Swap the body for a call to
 * the auth API (email + password + TOTP code) — it should return a session
 * token with the admin's role.
 */
export async function login(prevState, formData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const code = String(formData.get("code") ?? "").replace(/\s/g, "");

  if (!email || !password) return { error: "Enter your email and password.", step: "credentials" };
  const account = findDemoAccount(email, password);
  if (!account) return { error: "Incorrect email or password.", step: "credentials" };
  if (!/^\d{6}$/.test(code)) return { error: "Enter the 6-digit code from your authenticator app.", step: "2fa" };

  const store = await cookies();
  store.set("admin_session", crypto.randomUUID(), COOKIE);
  store.set("admin_email", account.email, COOKIE);
  store.set("admin_name", account.name, COOKIE);
  store.set("admin_role", account.role, COOKIE);
  redirect("/");
}

export async function logout() {
  const store = await cookies();
  for (const name of ["admin_session", "admin_email", "admin_name", "admin_role"]) store.delete(name);
  redirect("/login");
}

/** Preview helper: view the dashboard as another role. */
export async function switchRole(roleKey) {
  if (!ROLE_MAP[roleKey]) return;
  const store = await cookies();
  store.set("admin_role", roleKey, COOKIE);
}
