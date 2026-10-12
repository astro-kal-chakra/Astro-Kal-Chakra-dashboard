import { now } from "./clock";

const DAY = 86400000;

const startOfDay = (t) => {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};
const endOfDay = (t) => startOfDay(t) + DAY - 1;

const shortFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" });

/**
 * Resolves a preset (or custom from/to ISO dates) into a concrete range plus
 * the equally-long previous range for "compare with previous period".
 * Pure — safe in server and client code.
 */
export function resolveRange({ preset = "30d", from, to } = {}) {
  const today = startOfDay(now());
  let start;
  let end = endOfDay(now());

  switch (preset) {
    case "today":
      start = today;
      break;
    case "yesterday":
      start = today - DAY;
      end = today - 1;
      break;
    case "7d":
      start = today - 6 * DAY;
      break;
    case "this_month": {
      const d = new Date(now());
      start = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
      break;
    }
    case "last_month": {
      const d = new Date(now());
      start = new Date(d.getFullYear(), d.getMonth() - 1, 1).getTime();
      end = new Date(d.getFullYear(), d.getMonth(), 1).getTime() - 1;
      break;
    }
    case "custom":
      if (from && to) {
        start = startOfDay(new Date(from).getTime());
        end = endOfDay(new Date(to).getTime());
        if (start > end) [start, end] = [startOfDay(end), endOfDay(start)];
        break;
      }
    // falls through to 30d when custom is incomplete
    default:
      start = today - 29 * DAY;
  }

  const span = end - start + 1;
  const days = Math.round(span / DAY);
  return {
    preset,
    start,
    end,
    days,
    prevStart: start - span,
    prevEnd: start - 1,
    label: days <= 1 ? shortFmt.format(start) : `${shortFmt.format(start)} – ${shortFmt.format(end)}`,
  };
}

/** Picks a sensible default bucket size for the span. */
export function defaultGroup(days) {
  if (days <= 2) return "hour";
  if (days <= 45) return "day";
  if (days <= 180) return "week";
  return "month";
}

/** Which group options make sense for a span (avoid 2,000-point hour charts). */
export function allowedGroups(days) {
  return {
    hour: days <= 2,
    day: days <= 120,
    week: days >= 7,
    month: days >= 28,
  };
}

export const toISODate = (t) => {
  const d = new Date(t);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
};
