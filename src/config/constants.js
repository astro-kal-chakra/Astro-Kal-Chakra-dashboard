/** Shared option lists used by filters and forms. */
export const PAGE_SIZE = 10;
export const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
export const IDLE_WARNING_MS = 60 * 1000;

export const SESSION_MODES = [
  { value: "chat", label: "Chat" },
  { value: "voice", label: "Voice" },
  { value: "video", label: "Video" },
];

export const DATE_PRESETS = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "this_month", label: "This month" },
  { value: "last_month", label: "Last month" },
  { value: "custom", label: "Custom range" },
];

export const GROUP_BY = [
  { value: "hour", label: "Hour" },
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
];

export const SENSITIVE_REASONS = [
  "User requested via support ticket",
  "Fraud / abuse investigation",
  "Payment dispute",
  "Compliance / legal request",
  "Quality review",
];
