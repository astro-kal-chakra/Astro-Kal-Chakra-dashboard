"use server";

import { api } from "@/lib/api";
import { run, str, bool } from "@/lib/action";

/**
 * Ask astrologers (IDs separated by commas, e.g. "A201, A305") to take free chats: push + in-app notification.
 * With `enable`, "Free chat" is also switched on for them right away.
 * Returns { notified, enabled[], notFound[], skipped[{ id, reason }] }.
 */
export async function requestFreeChat({ astrologers, message, enable, modes } = {}) {
  return run(() =>
    api("/free-chat/astrologers", { method: "POST", body: { astrologers: str(astrologers) ?? "", message: str(message) || undefined, enable: bool(enable), modes: Array.isArray(modes) ? modes : undefined }, withMessage: true })
  );
}

/** Switch one astrologer back to paid sessions. */
export async function turnOffFreeChat(id) {
  return run(() => api(`/free-chat/astrologers/${encodeURIComponent(id)}/off`, { method: "POST" }));
}
