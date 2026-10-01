"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Sparkles, X } from "lucide-react";
import { NAV_SECTIONS } from "@/config/navigation";
import { useAdmin } from "@/providers/AdminProvider";
import { cn } from "@/lib/utils";

/** Longest matching href wins, so /payments/refunds doesn't also light up /payments. */
function useActiveHref() {
  const pathname = usePathname();
  const all = NAV_SECTIONS.flatMap((s) => s.items.flatMap((i) => (i.children ? i.children.map((c) => c.href) : [i.href])));
  return all
    .filter((h) => (h === "/" ? pathname === "/" : pathname === h || pathname.startsWith(`${h}/`)))
    .sort((a, b) => b.length - a.length)[0];
}

export function Sidebar({ counts = {}, open, onClose }) {
  const { can } = useAdmin();
  const active = useActiveHref();

  const sections = NAV_SECTIONS.map((s) => ({
    ...s,
    items: s.items
      .filter((i) => can(i.module))
      .map((i) => (i.children ? { ...i, children: i.children.filter((c) => !c.module || can(c.module)) } : i)),
  })).filter((s) => s.items.length);

  return (
    <>
      {open && <div className="fixed inset-0 z-40 animate-fade-in bg-black/50 lg:hidden" onClick={onClose} />}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-68 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-text",
          "max-lg:transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
          open ? "translate-x-0" : "max-lg:-translate-x-full"
        )}
        aria-label="Main navigation"
      >
        <div className="flex h-16 shrink-0 items-center justify-between gap-2 px-5">
          <Link href="/" className="flex items-center gap-2.5" onClick={onClose}>
            <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#8b74ef] to-[#e0a100] text-white shadow-soft">
              <Sparkles className="size-4" />
            </span>
            <span className="text-[15px] font-extrabold tracking-tight text-sidebar-strong">
              Astro<span className="text-accent">Admin</span>
            </span>
          </Link>
          <button onClick={onClose} className="rounded-lg p-1.5 text-sidebar-muted hover:bg-sidebar-2 hover:text-sidebar-strong lg:hidden" aria-label="Close menu">
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 pt-2 pb-6 [scrollbar-color:var(--sidebar-border)_transparent]">
          {sections.map((section) => (
            <div key={section.title}>
              <p className="mb-1.5 px-3 text-[10.5px] font-bold tracking-[0.12em] text-sidebar-muted uppercase">{section.title}</p>
              <ul className="space-y-0.5">
                {section.items.map((item) => (
                  <NavItem key={item.label} item={item} active={active} count={counts[item.badgeKey]} onNavigate={onClose} />
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}

function NavItem({ item, active, count, onNavigate }) {
  const Icon = item.icon;
  const childActive = item.children?.some((c) => c.href === active);
  const [expanded, setExpanded] = useState(childActive);
  const isOpen = expanded || childActive;

  const rowCls = (on) =>
    cn(
      "group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
      on ? "bg-sidebar-active font-semibold text-sidebar-active-text" : "text-sidebar-text hover:bg-sidebar-2 hover:text-sidebar-strong"
    );
  const badge = count > 0 && (
    <span className="ml-auto rounded-full bg-accent px-1.5 py-0.5 text-[10.5px] leading-none font-bold text-[#1f1300]">{count > 99 ? "99+" : count}</span>
  );

  if (!item.children) {
    const on = item.href === active;
    return (
      <li>
        <Link href={item.href} className={rowCls(on)} aria-current={on ? "page" : undefined} onClick={onNavigate}>
          <Icon className={cn("size-[18px] shrink-0", on ? "text-sidebar-active-text" : "text-sidebar-muted group-hover:text-sidebar-strong")} />
          {item.label}
          {badge}
        </Link>
      </li>
    );
  }

  return (
    <li>
      <button type="button" className={rowCls(false)} aria-expanded={isOpen} onClick={() => setExpanded(!isOpen)}>
        <Icon className={cn("size-[18px] shrink-0", childActive ? "text-sidebar-active-text" : "text-sidebar-muted group-hover:text-sidebar-strong")} />
        <span className={cn(childActive && "font-semibold text-sidebar-strong")}>{item.label}</span>
        {badge || <span className="ml-auto" />}
        <ChevronDown className={cn("size-4 shrink-0 text-sidebar-muted transition-transform", isOpen && "rotate-180")} />
      </button>
      {isOpen && (
        <ul className="mt-0.5 ml-[21px] space-y-0.5 border-l border-sidebar-border pl-3">
          {item.children.map((c) => {
            const on = c.href === active;
            return (
              <li key={c.href}>
                <Link
                  href={c.href}
                  onClick={onNavigate}
                  aria-current={on ? "page" : undefined}
                  className={cn(
                    "block rounded-md px-3 py-1.5 text-[13px] transition-colors",
                    on ? "bg-sidebar-active font-semibold text-sidebar-active-text" : "text-sidebar-muted hover:text-sidebar-strong"
                  )}
                >
                  {c.label}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}
