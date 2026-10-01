/**
 * Extra astrologer lookups used by the astrologers pages.
 * Server-only: never import this from a "use client" file.
 */
import { SKILLS, LANGUAGES } from "@/data/seed";
import { delay } from "./query";

export async function getAstrologerFilterOptions() {
  await delay(0);
  return { skills: SKILLS, languages: LANGUAGES };
}
