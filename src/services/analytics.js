/**
 * Analytics service. The backend reads the pre-computed `daily_stats` table
 * (refreshed every 15 minutes by a worker) and buckets it by hour/day/week/month
 * for the requested range, plus the previous period for comparison. Server-only.
 */
import { api } from "@/lib/api";

export const getAnalytics = ({ preset = "30d", from, to, group, compare } = {}) =>
  api("/analytics", { query: { preset, from: preset === "custom" ? from : undefined, to: preset === "custom" ? to : undefined, group, compare: compare ? 1 : undefined } });
