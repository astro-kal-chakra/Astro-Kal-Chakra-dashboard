"use server";

import { api } from "@/lib/api";
import { run } from "@/lib/action";

/** Recomputes the daily numbers for the last `days` days in the background (Analytics / Overview update as each day finishes). */
export async function recalculateAnalytics(days = 90) {
  return run(() => api("/analytics/recalculate", { method: "POST", body: { days: Number(days) || 90 }, withMessage: true }));
}
