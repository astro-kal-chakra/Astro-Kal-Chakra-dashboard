/**
 * Permission model: every page belongs to a module; every module supports
 * a subset of actions. Roles grant actions per module.
 * The backend must enforce the same matrix — the UI only mirrors it.
 */
export const ACTIONS = ["view", "edit", "approve", "delete"];

export const MODULES = [
  { key: "overview", label: "Overview" },
  { key: "analytics", label: "Analytics" },
  { key: "users", label: "Users" },
  { key: "astrologers", label: "Astrologers" },
  { key: "sessions", label: "Sessions" },
  { key: "chats", label: "Chats" },
  { key: "calls", label: "Calls" },
  { key: "payments", label: "Payments & wallet" },
  { key: "refunds", label: "Refunds" },
  { key: "payouts", label: "Payouts" },
  { key: "support", label: "Support" },
  { key: "marketing", label: "Marketing" },
  { key: "content", label: "Content" },
  { key: "settings", label: "Settings" },
  { key: "admins", label: "Admin management" },
  { key: "audit", label: "Audit logs" },
];

const all = ["view", "edit", "approve", "delete"];
const fullAccess = Object.fromEntries(MODULES.map((m) => [m.key, all]));

export const ROLES = [
  {
    key: "super_admin",
    name: "Super Admin",
    description: "Full access including settings, admin users, roles and audit logs.",
    system: true,
    permissions: fullAccess,
  },
  {
    key: "ops_admin",
    name: "Ops Admin",
    description: "Approvals, users, astrologers, sessions and refunds up to a limit.",
    system: true,
    refundLimit: 1000,
    permissions: {
      overview: ["view"],
      analytics: ["view"],
      users: ["view", "edit"],
      astrologers: ["view", "edit", "approve"],
      sessions: ["view", "edit"],
      calls: ["view"],
      payments: ["view"],
      refunds: ["view", "edit", "approve"],
      support: ["view"],
    },
  },
  {
    key: "support_agent",
    name: "Support Agent",
    description: "Tickets, limited user and session view, chats only through a ticket.",
    system: true,
    permissions: {
      overview: ["view"],
      users: ["view"],
      sessions: ["view"],
      support: ["view", "edit"],
      refunds: ["view", "edit"],
    },
  },
  {
    key: "finance",
    name: "Finance",
    description: "Payments, wallet ledger, refunds, payouts and finance reports.",
    system: true,
    permissions: {
      overview: ["view"],
      analytics: ["view"],
      payments: ["view", "edit"],
      refunds: ["view", "edit", "approve"],
      payouts: ["view", "edit", "approve"],
    },
  },
  {
    key: "moderator",
    name: "Moderator",
    description: "Flagged chats, chat review, review moderation, block or warn.",
    system: true,
    permissions: {
      overview: ["view"],
      users: ["view", "edit"],
      astrologers: ["view", "edit"],
      sessions: ["view"],
      chats: ["view", "edit", "delete"],
    },
  },
  {
    key: "marketing",
    name: "Marketing / Content",
    description: "Banners, coupons, push notifications, horoscope, blogs and FAQs.",
    system: true,
    permissions: {
      overview: ["view"],
      analytics: ["view"],
      marketing: ["view", "edit", "approve", "delete"],
      content: ["view", "edit", "approve", "delete"],
    },
  },
];

export const ROLE_MAP = Object.fromEntries(ROLES.map((r) => [r.key, r]));

export function can(role, module, action = "view") {
  return Boolean(role?.permissions?.[module]?.includes(action));
}
