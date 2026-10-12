/**
 * Extra astrologer lookups used by the astrologers pages.
 * Server-only: never import this from a "use client" file.
 */
import { api } from "@/lib/api";

/** `{ skills, languages, badges }` */
export const getAstrologerFilterOptions = () => api("/astrologers/options");
