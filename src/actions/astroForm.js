"use server";

import { api } from "@/lib/api";
import { run } from "@/lib/action";

/** Save the astrologer registration form (fields + option lists). Returns the saved form. */
export async function saveAstroForm({ fields, options, steps } = {}) {
  return run(() => api("/astro-form", { method: "PUT", body: { fields, options, steps }, withMessage: true }));
}
