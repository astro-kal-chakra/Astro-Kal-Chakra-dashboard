import { cn } from "@/lib/utils";

const TONES = {
  neutral: "bg-surface-3 text-text-2",
  primary: "bg-primary-soft text-primary-ink",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
  accent: "bg-accent-soft text-warning",
};

export function Badge({ tone = "neutral", dot, className, children }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap", TONES[tone], className)}>
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

/** One place that maps every status string in the app to a tone + label. */
const STATUS = {
  // generic
  active: ["success", "Active"],
  new: ["info", "New"],
  blocked: ["danger", "Blocked"],
  deactivated: ["neutral", "Deactivated"],
  // astrologers
  pending: ["warning", "Pending"],
  approved: ["success", "Approved"],
  rejected: ["danger", "Rejected"],
  verified: ["success", "Verified"],
  // sessions
  completed: ["success", "Completed"],
  cancelled: ["neutral", "Cancelled"],
  missed: ["warning", "Missed"],
  force_ended: ["danger", "Force ended"],
  live: ["success", "Live"],
  // payments
  success: ["success", "Success"],
  failed: ["danger", "Failed"],
  refunded: ["info", "Refunded"],
  requested: ["warning", "Requested"],
  processed: ["success", "Processed"],
  processing: ["info", "Processing"],
  paid: ["success", "Paid"],
  captured: ["success", "Captured"],
  // support
  open: ["warning", "Open"],
  resolved: ["success", "Resolved"],
  closed: ["neutral", "Closed"],
  // moderation
  warned: ["warning", "Warned"],
  dismissed: ["neutral", "Dismissed"],
  commission_reduced: ["info", "Commission reduced"],
  // marketing / content
  scheduled: ["info", "Scheduled"],
  paused: ["neutral", "Paused"],
  ended: ["neutral", "Ended"],
  expired: ["neutral", "Expired"],
  sent: ["success", "Sent"],
  draft: ["neutral", "Draft"],
  deleted: ["neutral", "Deleted"],
  training: ["info", "In training"],
  bypassed: ["neutral", "Bypassed"],
  published: ["success", "Published"],
  review: ["warning", "In review"],
  missing: ["danger", "Missing"],
  // priority / severity / quality
  low: ["neutral", "Low"],
  medium: ["info", "Medium"],
  high: ["warning", "High"],
  urgent: ["danger", "Urgent"],
  good: ["success", "Good"],
  fair: ["warning", "Fair"],
  poor: ["danger", "Poor"],
};

export function StatusBadge({ status, label, className }) {
  const [tone, text] = STATUS[status] ?? ["neutral", status];
  return (
    <Badge tone={tone} dot className={className}>
      {label ?? text}
    </Badge>
  );
}
