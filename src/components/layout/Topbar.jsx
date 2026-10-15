"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, ChevronDown, LogOut, Menu, Moon, Search, ShieldCheck, Sun, UserCog } from "lucide-react";
import { useTheme } from "@/providers/ThemeProvider";
import { useAdmin } from "@/providers/AdminProvider";
import { ROLES } from "@/config/permissions";
import { logout, switchRole } from "@/actions/auth";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";

export function Topbar({ onMenu, counts = {} }) {
  const { theme, toggle } = useTheme();
  const router = useRouter();
  const [q, setQ] = useState("");
  const { can } = useAdmin();

  const alerts = [
    { label: "New astrologer applications", count: counts.pendingApprovals, href: "/astrologers?status=pending", module: "astrologers" },
    { label: "Payout requests", count: counts.payoutRequests, href: "/payouts", module: "payouts" },
    { label: "Tickets waiting for a reply", count: counts.openTickets, href: "/support?status=open", module: "support" },
    { label: "New website enquiries", count: counts.newLeads, href: "/enquiries", module: "support" },
    { label: "Flagged chats", count: counts.flaggedChats, href: "/chats/flagged", module: "chats" },
    { label: "Failed payments (7d)", count: counts.failedPayments, href: "/payments?status=failed", module: "payments" },
  ].filter((a) => a.count && can(a.module));
  const total = alerts.reduce((s, a) => s + a.count, 0);

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b border-border bg-surface/85 px-3 backdrop-blur-md sm:gap-3 sm:px-6">
      <button onClick={onMenu} className="rounded-lg p-2 text-text-2 hover:bg-surface-3 lg:hidden" aria-label="Open menu">
        <Menu className="size-5" />
      </button>

      <form
        className="relative max-w-md flex-1 max-sm:hidden"
        onSubmit={(e) => {
          e.preventDefault();
          if (q.trim()) router.push(`/users?q=${encodeURIComponent(q.trim())}`);
        }}
      >
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search users by name, phone or ID…"
          className="h-9 w-full rounded-lg border border-transparent bg-surface-3 pr-3 pl-9 text-sm text-text placeholder:text-muted focus:border-primary focus:bg-surface focus:outline-none"
          aria-label="Search users"
        />
      </form>

      <div className="ml-auto flex items-center gap-1 sm:gap-1.5">
        <button onClick={toggle} className="rounded-lg p-2 text-text-2 hover:bg-surface-3" aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>
          {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
        </button>

        <Dropdown
          trigger={
            <span className="relative block rounded-lg p-2 text-text-2 hover:bg-surface-3">
              <Bell className="size-5" />
              {total > 0 && <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-danger ring-2 ring-surface" />}
            </span>
          }
          label="Notifications"
          width="w-72"
        >
          {(close) => (
            <>
              <p className="px-3 pt-2 pb-1.5 text-xs font-bold text-muted uppercase">Needs attention</p>
              {alerts.length ? (
                alerts.map((a) => (
                  <Link key={a.href} href={a.href} onClick={close} className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm text-text-2 hover:bg-surface-3">
                    {a.label}
                    <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-bold text-primary-ink">{a.count}</span>
                  </Link>
                ))
              ) : (
                <p className="px-3 py-4 text-sm text-muted">All caught up 🎉</p>
              )}
            </>
          )}
        </Dropdown>

        <ProfileMenu />
      </div>
    </header>
  );
}

function ProfileMenu() {
  const { admin } = useAdmin();
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <Dropdown
      label="Account"
      width="w-72"
      trigger={
        <span className="flex items-center gap-2 rounded-lg py-1 pr-1.5 pl-1 hover:bg-surface-3 sm:pr-2">
          <Avatar name={admin.name} size="sm" />
          <span className="text-left max-md:hidden">
            <span className="block text-sm leading-tight font-semibold text-text">{admin.name}</span>
            <span className="block text-[11px] leading-tight text-muted">{admin.role.name}</span>
          </span>
          <ChevronDown className="size-4 text-muted max-md:hidden" />
        </span>
      }
    >
      {(close) => (
        <>
          <div className="border-b border-border px-3 pt-2 pb-3">
            <p className="text-sm font-semibold text-text">{admin.name}</p>
            <p className="text-xs text-muted">{admin.email}</p>
          </div>
          <div className="py-1">
            <Link href="/profile" onClick={close} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-text-2 hover:bg-surface-3">
              <UserCog className="size-4" /> Profile & security
            </Link>
          </div>
          {admin.realRole?.key === "super_admin" && (
          <div className="border-t border-border py-1">
            <p className="flex items-center gap-1.5 px-3 pt-2 pb-1 text-[11px] font-bold text-muted uppercase">
              <ShieldCheck className="size-3.5" /> Preview as role
            </p>
            <p className="px-3 pb-1 text-[11px] text-muted">Changes what you see, not what you can do.</p>
            {ROLES.map((r) => (
              <button
                key={r.key}
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    await switchRole(r.key);
                    router.refresh();
                    close();
                  })
                }
                className={cn(
                  "flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-left text-sm hover:bg-surface-3",
                  r.key === admin.role.key ? "font-semibold text-primary-ink" : "text-text-2"
                )}
              >
                {r.name}
                {r.key === admin.role.key && <span className="size-1.5 rounded-full bg-primary" />}
              </button>
            ))}
          </div>
          )}
          <div className="border-t border-border pt-1">
            <form action={logout}>
              <button className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-danger hover:bg-danger-soft">
                <LogOut className="size-4" /> Sign out
              </button>
            </form>
          </div>
        </>
      )}
    </Dropdown>
  );
}

/** Minimal accessible dropdown: closes on outside click and Esc. */
export function Dropdown({ trigger, label, children, width = "w-56", align = "right" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => !ref.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen(!open)} aria-haspopup="menu" aria-expanded={open} aria-label={label}>
        {trigger}
      </button>
      {open && (
        <div
          role="menu"
          className={cn(
            "absolute top-full z-50 mt-2 max-w-[calc(100vw-1.5rem)] animate-pop-in rounded-xl border border-border bg-surface p-1 shadow-pop",
            align === "right" ? "right-0" : "left-0",
            width
          )}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}
