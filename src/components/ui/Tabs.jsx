import Link from "next/link";
import { cn, formatNumber } from "@/lib/utils";
import { buildHref } from "@/lib/url";

/**
 * URL-driven tabs (server component). Each tab sets `param` in the query.
 * tabs: [{ value, label, count? }]
 */
export function TabLinks({ tabs, active, param = "tab", basePath, params = {}, className }) {
  return (
    <div className={cn("-mb-px flex gap-1 overflow-x-auto border-b border-border", className)} role="tablist">
      {tabs.map((t) => {
        const isActive = t.value === active;
        return (
          <Link
            key={t.value}
            href={buildHref(basePath, params, { [param]: t.value })}
            role="tab"
            aria-selected={isActive}
            scroll={false}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors",
              isActive ? "border-primary text-primary-ink" : "border-transparent text-muted hover:text-text"
            )}
          >
            {t.label}
            {t.count != null && (
              <span className={cn("rounded-full px-1.5 py-0.5 text-[11px] leading-none", isActive ? "bg-primary-soft text-primary-ink" : "bg-surface-3 text-muted")}>
                {formatNumber(t.count)}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
