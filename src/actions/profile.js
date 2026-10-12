"use server";

import { api, seg } from "@/lib/api";
import { run } from "@/lib/action";

/** Signs out every other session (the backend keeps this one). */
export async function changePassword(currentPassword, newPassword) {
  return run(() => api("/me/password", { method: "POST", body: { currentPassword: String(currentPassword ?? ""), newPassword: String(newPassword ?? "") } }));
}

/** Starts reconfiguring 2FA → `{ manualKey, otpauthUrl, qrDataUrl }`. The current authenticator keeps working until verify. */
export async function start2faSetup() {
  return run(() => api("/me/2fa/setup", { method: "POST" }), { refresh: false });
}

/** → `{ recoveryCodes }` (shown once). Old authenticator and recovery codes stop working. */
export async function finish2faSetup(code) {
  return run(() => api("/me/2fa/verify", { method: "POST", body: { code: String(code ?? "").replace(/\D/g, "") } }), { refresh: false });
}

export async function revokeSession(id) {
  return run(() => api(`/me/sessions/${seg(id)}`, { method: "DELETE" }));
}

export async function revokeOtherSessions() {
  return run(() => api("/me/sessions", { method: "DELETE" }));
}
