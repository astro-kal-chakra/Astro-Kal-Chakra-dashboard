"use server";

import { api, seg } from "@/lib/api";
import { num, run, str } from "@/lib/action";

const STATUSES = ["open", "pending", "resolved", "closed"];
const PRIORITIES = ["urgent", "high", "medium", "low"];
const CATEGORIES = ["payment", "session", "astrologer", "account", "technical"];

/** One field at a time from the ticket sidebar: `{ status }`, `{ priority }` or `{ assignee }` (admin code, "" = unassigned). */
export async function updateTicket(id, patch = {}) {
  const body = {};
  if (STATUSES.includes(patch.status)) body.status = patch.status;
  if (PRIORITIES.includes(patch.priority)) body.priority = patch.priority;
  if (patch.assignee !== undefined) body.assignee = patch.assignee ? seg(patch.assignee) : null;
  return run(() => api(`/tickets/${seg(id)}`, { method: "PATCH", body }));
}

/** `mode`: "reply" (user sees it in the app and by email) or "note" (support team only). Returns the new message. */
export async function replyToTicket(id, { text, mode, cannedReplyId } = {}) {
  return run(
    () =>
      api(`/tickets/${seg(id)}/reply`, {
        method: "POST",
        body: { text: str(text), mode: mode === "note" ? "note" : "reply", cannedReplyId: cannedReplyId ? seg(cannedReplyId) : undefined },
      }),
    { refresh: false }
  );
}

export async function requestTicketRefund(id, reason, data = {}) {
  return run(() => api(`/tickets/${seg(id)}/refunds`, { method: "POST", body: { amount: num(data.amount), reason }, withMessage: true }));
}

/* ---------------- Canned replies ---------------- */
const cannedBody = (d = {}) => ({ title: str(d.title), category: CATEGORIES.includes(d.category) ? d.category : "technical", body: str(d.body) });

export async function createCannedReply(data) {
  return run(() => api("/canned-replies", { method: "POST", body: cannedBody(data) }));
}

export async function updateCannedReply(id, data) {
  return run(() => api(`/canned-replies/${seg(id)}`, { method: "PATCH", body: cannedBody(data) }));
}

export async function deleteCannedReply(id) {
  return run(() => api(`/canned-replies/${seg(id)}`, { method: "DELETE" }));
}
