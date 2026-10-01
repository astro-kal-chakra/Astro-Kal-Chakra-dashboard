/**
 * Analytics service. Reads the pre-computed daily stats table (filled by a
 * background job) and buckets it by hour/day/week/month for the requested
 * range, plus the previous period for comparison. Server-only.
 */
import * as db from "@/data/db";
import { resolveRange, defaultGroup, allowedGroups } from "@/lib/dateRange";
import { percentChange } from "@/lib/utils";
import { delay } from "./query";

/** Metrics that are averaged rather than summed when bucketing. */
const AVG = new Set(["activeUsers", "activeAstrologers", "avgWaitSec", "avgRating", "avgResolutionHrs"]);
const METRICS = Object.keys(db.dailyStats[0]).filter((k) => k !== "date" && k !== "ts");

const hourWeights = (() => {
  const total = db.hourlyLoad.reduce((s, h) => s + h.chats, 0);
  return db.hourlyLoad.map((h) => h.chats / total);
})();

const dayFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" });
const monthFmt = new Intl.DateTimeFormat("en-IN", { month: "short", year: "2-digit" });

function bucketKey(ts, group) {
  const d = new Date(ts);
  if (group === "month") return [`${d.getFullYear()}-${d.getMonth()}`, monthFmt.format(d)];
  if (group === "week") {
    const monday = new Date(d);
    monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return [monday.toDateString(), `Wk of ${dayFmt.format(monday)}`];
  }
  return [d.toDateString(), dayFmt.format(d)];
}

function aggregate(days, group) {
  if (group === "hour") {
    // Spread each day's totals across the hourly load curve.
    return hourWeights.map((w, hour) => {
      const row = { label: `${String(hour).padStart(2, "0")}:00` };
      for (const m of METRICS) {
        const sum = days.reduce((s, d) => s + d[m], 0);
        row[m] = AVG.has(m) ? +(sum / Math.max(1, days.length)).toFixed(2) : Math.round(sum * w);
      }
      return row;
    });
  }

  const buckets = new Map();
  for (const d of days) {
    const [key, label] = bucketKey(d.ts, group);
    if (!buckets.has(key)) buckets.set(key, { label, n: 0, ...Object.fromEntries(METRICS.map((m) => [m, 0])) });
    const b = buckets.get(key);
    b.n += 1;
    for (const m of METRICS) b[m] += d[m];
  }
  return [...buckets.values()].map(({ n, ...b }) => {
    for (const m of AVG) b[m] = +(b[m] / n).toFixed(2);
    return b;
  });
}

function totals(days) {
  const t = {};
  for (const m of METRICS) {
    const sum = days.reduce((s, d) => s + d[m], 0);
    t[m] = AVG.has(m) ? sum / Math.max(1, days.length) : sum;
  }
  return t;
}

const inRange = (start, end) => db.dailyStats.filter((d) => d.ts >= start && d.ts <= end);

export async function getAnalytics({ preset = "30d", from, to, group, compare } = {}) {
  await delay();
  const range = resolveRange({ preset, from, to });
  const allowed = allowedGroups(range.days);
  const g = group && allowed[group] ? group : defaultGroup(range.days);

  const curDays = inRange(range.start, range.end);
  const prevDays = inRange(range.prevStart, range.prevEnd);
  const cur = totals(curDays);
  const prev = totals(prevDays);

  const series = aggregate(curDays, g);
  if (compare) {
    const prevSeries = aggregate(prevDays, g);
    series.forEach((row, i) => {
      const p = prevSeries[i];
      if (p) for (const m of METRICS) row[`prev_${m}`] = p[m];
    });
  }

  const change = Object.fromEntries(METRICS.map((m) => [m, percentChange(cur[m], prev[m])]));
  const approved = db.astrologers.filter((a) => a.status === "approved");

  return {
    range: { ...range, group: g, allowed, compare: Boolean(compare) },
    totals: cur,
    previous: prev,
    change,
    series,
    hourly: db.hourlyLoad.map((h) => ({ ...h, label: `${h.hour}:00` })),
    usersByCity: db.usersByCity,
    usersByLanguage: db.usersByLanguage,
    retention: db.retention,
    modeSplit: [
      { name: "Chat", value: cur.chats },
      { name: "Voice", value: cur.voiceCalls },
      { name: "Video", value: cur.videoCalls },
    ],
    topAstrologers: [...approved]
      .sort((a, b) => b.earnings - a.earnings)
      .slice(0, 8)
      .map(({ id, name, sessions, earnings, rating, complaints }) => ({ id, name, sessions, earnings, rating, complaints })),
    topUsers: [...db.users]
      .sort((a, b) => b.totalSpend - a.totalSpend)
      .slice(0, 8)
      .map(({ id, name, city, totalSpend, sessionsCount }) => ({ id, name, city, totalSpend, sessionsCount })),
    topPacks: [...db.rechargePacks].sort((a, b) => b.sold - a.sold),
  };
}
