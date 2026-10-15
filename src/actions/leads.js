"use server";

import { api, seg } from "@/lib/api";
import { run } from "@/lib/action";

const STATUSES = ["new", "contacted", "closed"];

/** Website enquiry (contact message / astrologer application): status and the team's note. */
export async function updateLead(id, { status, note } = {}) {
  const body = {};
  if (STATUSES.includes(status)) body.status = status;
  if (note !== undefined) body.note = String(note).slice(0, 1000);
  return run(() => api(`/leads/${seg(id)}`, { method: "PATCH", body }));
}
