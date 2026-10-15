"use server";

import { api } from "@/lib/api";
import { run } from "@/lib/action";

const SECTIONS = ["astrologers", "payouts", "support", "chats", "payments", "refunds", "leads"];

/** The admin opened a section: its badge clears until something new comes in (refreshes the sidebar counts). */
export async function markSeen(section) {
  if (!SECTIONS.includes(section)) return { ok: false };
  return run(() => api("/overview/seen", { method: "POST", body: { section } }));
}
