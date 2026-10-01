import { clsx } from "clsx";
import { now } from "./clock";

export const cn = (...inputs) => clsx(inputs);

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});
const inrCompact = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  notation: "compact",
  maximumFractionDigits: 1,
});
const num = new Intl.NumberFormat("en-IN");
const numCompact = new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 });
const dateFmt = new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" });
const dateTimeFmt = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});
const timeFmt = new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit" });

export const formatCurrency = (v, compact = false) => (compact ? inrCompact : inr).format(v ?? 0);
export const formatNumber = (v, compact = false) => (compact ? numCompact : num).format(v ?? 0);
export const formatDate = (d) => (d ? dateFmt.format(new Date(d)) : "—");
export const formatDateTime = (d) => (d ? dateTimeFmt.format(new Date(d)) : "—");
export const formatTime = (d) => (d ? timeFmt.format(new Date(d)) : "—");
export const formatPercent = (v, digits = 1) => `${(v ?? 0).toFixed(digits)}%`;

export function formatDuration(seconds = 0) {
  const s = Math.max(0, Math.round(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h) return `${h}h ${m}m`;
  if (m) return `${m}m ${String(sec).padStart(2, "0")}s`;
  return `${sec}s`;
}

export function timeAgo(d) {
  const diff = (now() - new Date(d).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

/** +91 98•••••210 */
export function maskPhone(phone = "") {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 6) return "•••••";
  return `+${digits.slice(0, 2)} ${digits.slice(2, 4)}•••••${digits.slice(-3)}`;
}

export const maskText = (v = "") => (v ? "•".repeat(Math.min(10, v.length)) : "—");

export const initials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");

export function percentChange(curr, prev) {
  if (!prev) return 0;
  return ((curr - prev) / prev) * 100;
}

/** Converts rows to CSV and triggers a download (client only). */
export function downloadCSV(filename, rows, columns) {
  const cols = columns ?? Object.keys(rows[0] ?? {}).map((k) => ({ key: k, label: k }));
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [cols.map((c) => esc(c.label)).join(","), ...rows.map((r) => cols.map((c) => esc(r[c.key])).join(","))].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: filename });
  a.click();
  URL.revokeObjectURL(url);
}
