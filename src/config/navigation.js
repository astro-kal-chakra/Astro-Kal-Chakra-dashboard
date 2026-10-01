import {
  LayoutDashboard,
  LineChart,
  Users,
  Sparkles,
  Radio,
  MessagesSquare,
  PhoneCall,
  Wallet,
  Banknote,
  LifeBuoy,
  Megaphone,
  FileText,
  Settings,
  ShieldCheck,
  ScrollText,
} from "lucide-react";

/**
 * Sidebar definition. `module` links each entry to the permission matrix,
 * so the nav automatically adapts to the signed-in admin's role.
 */
export const NAV_SECTIONS = [
  {
    title: "Dashboard",
    items: [
      { label: "Overview", href: "/", icon: LayoutDashboard, module: "overview" },
      { label: "Analytics", href: "/analytics", icon: LineChart, module: "analytics" },
    ],
  },
  {
    title: "Manage",
    items: [
      { label: "Users", href: "/users", icon: Users, module: "users" },
      { label: "Astrologers", href: "/astrologers", icon: Sparkles, module: "astrologers", badgeKey: "pendingApprovals" },
      {
        label: "Sessions",
        icon: Radio,
        module: "sessions",
        children: [
          { label: "Live monitor", href: "/sessions/live" },
          { label: "Session history", href: "/sessions" },
        ],
      },
      {
        label: "Chats",
        icon: MessagesSquare,
        module: "chats",
        badgeKey: "flaggedChats",
        children: [
          { label: "Chat viewer", href: "/chats" },
          { label: "Flagged chats", href: "/chats/flagged" },
          { label: "Chat search", href: "/chats/search" },
        ],
      },
      { label: "Calls", href: "/calls", icon: PhoneCall, module: "calls" },
    ],
  },
  {
    title: "Money",
    items: [
      {
        label: "Payments",
        icon: Wallet,
        module: "payments",
        children: [
          { label: "All payments", href: "/payments" },
          { label: "Refunds", href: "/payments/refunds", module: "refunds" },
          { label: "Wallet ledger", href: "/payments/wallet" },
          { label: "Reconciliation", href: "/payments/reconciliation" },
        ],
      },
      { label: "Payouts", href: "/payouts", icon: Banknote, module: "payouts", badgeKey: "payoutRequests" },
    ],
  },
  {
    title: "Engage",
    items: [
      {
        label: "Support",
        icon: LifeBuoy,
        module: "support",
        badgeKey: "openTickets",
        children: [
          { label: "Ticket inbox", href: "/support" },
          { label: "Canned replies", href: "/support/canned-replies" },
        ],
      },
      {
        label: "Marketing",
        icon: Megaphone,
        module: "marketing",
        children: [
          { label: "Banners", href: "/marketing/banners" },
          { label: "Coupons", href: "/marketing/coupons" },
          { label: "Recharge packs", href: "/marketing/recharge-packs" },
          { label: "Referral rules", href: "/marketing/referrals" },
          { label: "Push notifications", href: "/marketing/push" },
        ],
      },
      { label: "Content", href: "/content", icon: FileText, module: "content" },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Settings", href: "/settings", icon: Settings, module: "settings" },
      { label: "Admins & roles", href: "/admins", icon: ShieldCheck, module: "admins" },
      { label: "Audit logs", href: "/audit-logs", icon: ScrollText, module: "audit" },
    ],
  },
];
