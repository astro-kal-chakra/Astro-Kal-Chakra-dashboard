"use server";

import { api, seg } from "@/lib/api";
import { num, run, str } from "@/lib/action";
import { formatDate } from "@/lib/utils";

/** Bound in pages as `adjustWallet.bind(null, userId)`; ActionButton passes (reason, formData). */
export async function adjustWallet(id, reason, data = {}) {
  return run(() => api(`/users/${seg(id)}/wallet-adjust`, { method: "POST", body: { type: data.type === "debit" ? "debit" : "credit", amount: num(data.amount), reason } }));
}

export async function blockUser(id, reason) {
  return run(() => api(`/users/${seg(id)}/block`, { method: "POST", body: { reason } }));
}

export async function unblockUser(id, reason) {
  return run(() => api(`/users/${seg(id)}/unblock`, { method: "POST", body: { reason } }));
}

export async function deleteUser(id, reason) {
  return run(() => api(`/users/${seg(id)}/delete`, { method: "POST", body: { reason } }));
}

/** Opens the full profile for editing (shows birth details, so it needs a reason; audit-logged). */
export async function openUserProfile(id, reason) {
  return run(() => api(`/users/${seg(id)}/profile/open`, { method: "POST", body: { reason } }), { refresh: false });
}

/** `changes` = only the fields that changed (see EditUserProfile). */
export async function saveUserProfile(id, changes = {}, reason) {
  return run(() => api(`/users/${seg(id)}/profile`, { method: "PATCH", body: { ...changes, reason } }));
}

/**
 * Reveal a hidden value (audit-logged with the reason). `field` is "phone" or
 * "birth"; for birth, `part` picks date / time / place. Returns the display string.
 */
export async function revealUser(id, field, part, reason) {
  return run(
    async () => {
      const f = field === "birth" ? "birth" : "phone";
      const r = await api(`/users/${seg(id)}/reveal`, { method: "POST", body: { field: f, reason: str(reason) } });
      if (f === "phone") return r.phone;
      const v = r.birth?.[part];
      if (!v) return "Not provided";
      return part === "date" ? formatDate(v) : v;
    },
    { refresh: false }
  );
}
