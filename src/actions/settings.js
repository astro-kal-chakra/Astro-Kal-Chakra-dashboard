"use server";

import { api } from "@/lib/api";
import { run } from "@/lib/action";

const KEYS = [
  "defaultCommission",
  "freeChatEnabled",
  "freeChatMinutes",
  "freeChatModes",
  "minWalletBalance",
  "minRecharge",
  "maxRecharge",
  "minBalanceMinutes",
  "refundAutoApproveLimit",
  "queueMaxLength",
  "queueOfferTimeoutSec",
  "maintenanceMode",
  "maintenanceMessage",
  "androidMinVersion",
  "androidLatestVersion",
  "iosMinVersion",
  "iosLatestVersion",
];
const FEATURES = ["videoCalls", "voiceCalls", "kundliMatching", "liveStreams", "referrals", "giftsInChat"];

/** Sends only the changed keys (the backend audit-logs the before → after diff). Returns the saved settings. */
export async function saveSettings(changes = {}) {
  const body = {};
  for (const k of KEYS) if (k in changes) body[k] = changes[k];
  if (changes.features) {
    const features = {};
    for (const k of FEATURES) if (k in changes.features) features[k] = Boolean(changes.features[k]);
    if (Object.keys(features).length) body.features = features;
  }
  return run(() => api("/settings", { method: "PUT", body }));
}
