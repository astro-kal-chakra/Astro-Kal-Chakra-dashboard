/** Ranked lists for the analytics "Top lists" and "Support & quality" views. Server-only. */
import { api } from "@/lib/api";

export const getTopAstrologers = ({ by = "earnings", limit = 10 } = {}) => api("/analytics/top-astrologers", { query: { by, limit } });

export const getQualityByAstrologer = ({ limit = 8 } = {}) => api("/analytics/quality", { query: { limit } });
