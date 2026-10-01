import { PAGE_SIZE } from "@/config/constants";

/**
 * Generic server-side list query: search → filter → sort → paginate.
 * Mirrors what a real API endpoint would do, so pages only ever receive
 * one page of rows.
 *
 * @param {Array} list
 * @param {object} opts
 * @param {string} [opts.q]                 search text
 * @param {string[]} [opts.searchKeys]      fields to search
 * @param {Record<string, (row) => boolean>} [opts.predicates]  active filters
 * @param {string} [opts.sort]              "field:asc" | "field:desc"
 * @param {number|string} [opts.page]
 * @param {number} [opts.pageSize]
 */
export function queryList(list, { q, searchKeys = [], predicates = [], sort, page = 1, pageSize = PAGE_SIZE } = {}) {
  let rows = list;

  const term = q?.trim().toLowerCase();
  if (term) {
    rows = rows.filter((row) => searchKeys.some((k) => String(row[k] ?? "").toLowerCase().includes(term)));
  }

  for (const p of predicates) if (p) rows = rows.filter(p);

  if (sort) {
    const [field, dir] = sort.split(":");
    const mul = dir === "asc" ? 1 : -1;
    rows = [...rows].sort((a, b) => {
      const x = a[field];
      const y = b[field];
      if (x === y) return 0;
      if (x == null) return 1;
      if (y == null) return -1;
      return (x > y ? 1 : -1) * mul;
    });
  }

  const total = rows.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(1, Number(page) || 1), pageCount);
  const start = (current - 1) * pageSize;

  return { rows: rows.slice(start, start + pageSize), total, page: current, pageSize, pageCount };
}

/** Builds an equality predicate unless the value is empty/"all". */
export const eq = (key, value) => (value && value !== "all" ? (row) => row[key] === value : null);

/** Counts rows per value of `key`, for tab badges. */
export function countBy(list, key) {
  return list.reduce((acc, row) => {
    acc[row[key]] = (acc[row[key]] ?? 0) + 1;
    return acc;
  }, {});
}

/** Simulated network latency to keep loading states honest during development. */
export const delay = (ms = 120) => new Promise((res) => setTimeout(res, ms));
