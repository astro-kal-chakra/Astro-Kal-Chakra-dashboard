"use server";

import { api, seg } from "@/lib/api";
import { num, run, str } from "@/lib/action";

/** Billing stops now; both sides are told the session was ended by support. */
export async function forceEndSession(id, reason) {
  return run(() => api(`/sessions/${seg(id)}/force-end`, { method: "POST", body: { reason } }));
}

/**
 * Opens a chat transcript with a logged reason → `{ access, session, messages }`.
 * Support agents pass the ticket the chat is linked to (`ticketId`); the backend
 * only allows that one session. The grant lasts 15 minutes.
 */
export async function openChat(sessionId, ticketId, reason) {
  return run(
    () => api(`/chats/${seg(sessionId)}/open`, { method: "POST", body: { reason: str(reason), ticketId: ticketId ? seg(ticketId) : undefined } }),
    { refresh: false }
  );
}

/* ---- Flagged-message moderation (chats:edit). Warnings auto-block at the limit set in Settings. ---- */
export async function warnFlag(id) {
  return run(() => api(`/chats/flagged/${seg(id)}/warn`, { method: "POST" }));
}

export async function blockFromFlag(id, reason) {
  return run(() => api(`/chats/flagged/${seg(id)}/block`, { method: "POST", body: { reason } }));
}

export async function commissionFromFlag(id, reason, data = {}) {
  return run(() => api(`/chats/flagged/${seg(id)}/commission`, { method: "POST", body: { commission: num(data.commission), reason } }));
}

export async function dismissFlag(id) {
  return run(() => api(`/chats/flagged/${seg(id)}/dismiss`, { method: "POST", body: {} }));
}
