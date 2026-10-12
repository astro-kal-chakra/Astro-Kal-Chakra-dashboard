"use server";

import { api, seg } from "@/lib/api";
import { num, run, str } from "@/lib/action";

const ACTIONS = ["view", "edit", "approve", "delete"];

/** → `{ admin, expiresAt, emailSent, inviteUrl? }` (`inviteUrl` only outside production, for when email isn't set up). */
export async function inviteAdmin(d = {}) {
  return run(() => api("/admins/invite", { method: "POST", body: { name: str(d.name), email: str(d.email), role: seg(d.role) }, withMessage: true }));
}

export async function changeAdminRole(id, role) {
  return run(() => api(`/admins/${seg(id)}/role`, { method: "PATCH", body: { role: seg(role) } }));
}

/**
 * Super Admin only: give one admin extra access or take some away, on top of their role.
 * `grant` / `revoke` = { module: [actions] }. Applies on their next page load.
 */
export async function setAdminPermissions(id, grant, revoke, reason) {
  const clean = (p = {}) =>
    Object.fromEntries(
      Object.entries(p)
        .filter(([mod]) => /^[a-z_]{2,30}$/.test(mod))
        .map(([mod, list]) => [mod, (Array.isArray(list) ? list : []).filter((a) => ACTIONS.includes(a))])
        .filter(([, list]) => list.length)
    );
  return run(() => api(`/admins/${seg(id)}/permissions`, { method: "PATCH", body: { grant: clean(grant), revoke: clean(revoke), reason: str(reason) } }));
}

/** Signs the admin out; they enrol 2FA again on the next sign-in. */
export async function resetAdmin2fa(id) {
  return run(() => api(`/admins/${seg(id)}/reset-2fa`, { method: "POST" }));
}

export async function deactivateAdmin(id, reason) {
  return run(() => api(`/admins/${seg(id)}/deactivate`, { method: "POST", body: { reason } }));
}

export async function reactivateAdmin(id, reason) {
  return run(() => api(`/admins/${seg(id)}/reactivate`, { method: "POST", body: { reason } }));
}

/* ---------------- Roles (custom roles only; system roles are fixed) ---------------- */
const cleanPermissions = (perms = {}) =>
  Object.fromEntries(
    Object.entries(perms)
      .filter(([mod]) => /^[a-z_]{2,30}$/.test(mod))
      .map(([mod, list]) => [mod, (Array.isArray(list) ? list : []).filter((a) => ACTIONS.includes(a))])
      .filter(([, list]) => list.length)
  );

const roleBody = (d = {}) => ({
  name: str(d.name),
  description: str(d.description) || "",
  permissions: cleanPermissions(d.permissions),
  refundLimit: d.refundLimit === "" || d.refundLimit == null ? null : num(d.refundLimit),
});

export async function createRole(d) {
  return run(() => api("/roles", { method: "POST", body: roleBody(d) }));
}

export async function updateRole(key, d) {
  return run(() => api(`/roles/${seg(key)}`, { method: "PUT", body: roleBody(d) }));
}

export async function deleteRole(key) {
  return run(() => api(`/roles/${seg(key)}`, { method: "DELETE" }));
}
