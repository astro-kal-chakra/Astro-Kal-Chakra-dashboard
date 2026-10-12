"use server";

import { ApiError, api, seg } from "@/lib/api";
import { bool, num, run, str } from "@/lib/action";

const BADGES = ["Verified", "Top Rated", "Celebrity", "Rising Star"];
const MODES = ["chat", "voice", "video"];

/** Approval starts the 6-day training, unless `skipTraining` (needs a reason) for experienced astrologers. */
export async function approveAstrologer(id, { skipTraining = false, reason } = {}) {
  return run(() =>
    api(`/astrologers/${seg(id)}/approve`, { method: "POST", body: { skipTraining: Boolean(skipTraining), reason: str(reason) || undefined }, withMessage: true })
  );
}

/* ---------------- Training (after approval) ---------------- */
export async function setTrainingDay(id, day, done, note) {
  return run(() => api(`/astrologers/${seg(id)}/training/days/${seg(String(day))}`, { method: "PATCH", body: { done: Boolean(done), note: str(note) || undefined } }));
}

export async function completeTraining(id, reason) {
  return run(() => api(`/astrologers/${seg(id)}/training/complete`, { method: "POST", body: { reason: str(reason) || undefined } }));
}

export async function bypassTraining(id, reason) {
  return run(() => api(`/astrologers/${seg(id)}/training/bypass`, { method: "POST", body: { reason } }));
}

/* ---------------- Profile editing (everything the astrologer can change in the app) ---------------- */
/** Opening shows unmasked details, so it needs a reason (audit-logged). */
export async function openAstrologerProfile(id, reason) {
  return run(() => api(`/astrologers/${seg(id)}/profile/open`, { method: "POST", body: { reason } }), { refresh: false });
}

/** `changes` = only the fields that changed (see EditAstrologerProfile). */
export async function saveAstrologerProfile(id, changes = {}, reason) {
  return run(() => api(`/astrologers/${seg(id)}/profile`, { method: "PATCH", body: { ...changes, reason } }));
}

export async function rejectAstrologer(id, reason) {
  return run(() => api(`/astrologers/${seg(id)}/reject`, { method: "POST", body: { reason } }));
}

/** Form fields: one checkbox per document (`doc-<docId>`) and an optional `note`. */
export async function requestDocuments(id, reason, data = {}) {
  const docs = Object.keys(data)
    .filter((k) => k.startsWith("doc-") && bool(data[k]))
    .map((k) => k.slice(4));
  return run(async () => {
    if (!docs.length) throw new ApiError(400, "NO_DOCS", "Select at least one document.");
    return api(`/astrologers/${seg(id)}/request-docs`, { method: "POST", body: { docs, note: str(data.note) || undefined, reason } });
  });
}

export async function reopenAstrologer(id) {
  return run(() => api(`/astrologers/${seg(id)}/reopen`, { method: "POST" }));
}

export async function blockAstrologer(id, reason) {
  return run(() => api(`/astrologers/${seg(id)}/block`, { method: "POST", body: { reason } }));
}

export async function unblockAstrologer(id, reason) {
  return run(() => api(`/astrologers/${seg(id)}/unblock`, { method: "POST", body: { reason } }));
}

/**
 * Settings tab. `values` = { commission, priceLimits: { chat: { min, max }, … }, badges, forceOffline: { on, reason }, queuePaused }.
 * Only known keys are sent; the backend validates the limits again.
 */
export async function saveAstrologerSettings(id, values = {}) {
  const priceLimits = {};
  for (const m of MODES) {
    const l = values.priceLimits?.[m];
    if (l && num(l.min) !== undefined && num(l.max) !== undefined) priceLimits[m] = { min: num(l.min), max: num(l.max) };
  }
  const body = {
    commission: num(values.commission),
    priceLimits,
    badges: (values.badges ?? []).filter((b) => BADGES.includes(b)),
    forceOffline: { on: Boolean(values.forceOffline?.on), reason: str(values.forceOffline?.reason) || undefined },
    queuePaused: Boolean(values.queuePaused),
  };
  return run(() => api(`/astrologers/${seg(id)}/settings`, { method: "PATCH", body }));
}

/** `field`: "phone" | "bank_account". Returns the clear value (audit-logged). */
export async function revealAstrologer(id, field, reason) {
  return run(
    async () => {
      const f = field === "bank_account" ? "bank_account" : "phone";
      const r = await api(`/astrologers/${seg(id)}/reveal`, { method: "POST", body: { field: f, reason: str(reason) } });
      return f === "phone" ? r.phone : r.bankAccount || "Not on file";
    },
    { refresh: false }
  );
}

/** Short-lived signed link (5 min) to view a KYC document: `{ url, expiresIn }`. */
export async function getKycLink(id, docId) {
  return run(() => api(`/astrologers/${seg(id)}/kyc/${seg(docId)}/link`), { refresh: false });
}

export async function verifyKycDoc(id, docId) {
  return run(() => api(`/astrologers/${seg(id)}/kyc/${seg(docId)}/verify`, { method: "POST", body: {} }));
}

export async function rejectKycDoc(id, docId, reason) {
  return run(() => api(`/astrologers/${seg(id)}/kyc/${seg(docId)}/reject`, { method: "POST", body: { reason } }));
}

/** Hidden reviews disappear from the app; the rating still counts. */
export async function setReviewHidden(reviewId, hidden) {
  return run(() => api(`/reviews/${seg(reviewId)}`, { method: "PATCH", body: { hidden: Boolean(hidden) } }));
}
