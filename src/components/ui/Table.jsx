import Link from "next/link";
import { ArrowDown, ArrowUp, ChevronsUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";
import { buildHref } from "@/lib/url";
import { EmptyState } from "./EmptyState";

/**
 * Server-rendered data table.
 *
 * columns: [{ key, label, render?(row), align?, className?, sortable?, hideOnMobile? }]
 * Sorting / paging are links (`?sort=field:dir&page=n`), so all querying
 * stays on the server.
 */
export function DataTable({ columns, rows, basePath, params = {}, rowHref, empty, className, dense }) {
  if (!rows.length) {
    return <EmptyState icon={empty?.icon} title={empty?.title ?? "Nothing to show"} description={empty?.description ?? "Try changing the filters or search."} />;
  }
  const [sortField, sortDir] = (params.sort ?? "").split(":");

  return (
    <div className={cn("relative overflow-x-auto", className)}>
      <table className="w-full min-w-max text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-surface-2 text-xs font-semibold tracking-wide text-muted uppercase">
            {columns.map((c) => {
              const active = sortField === c.key;
              const nextDir = active && sortDir === "desc" ? "asc" : "desc";
              const SortIcon = active ? (sortDir === "asc" ? ArrowUp : ArrowDown) : ChevronsUpDown;
              return (
                <th
                  key={c.key}
                  scope="col"
                  className={cn("px-4 py-2.5 font-semibold whitespace-nowrap", c.align === "right" && "text-right", c.hideOnMobile && "max-md:hidden")}
                  aria-sort={active ? (sortDir === "asc" ? "ascending" : "descending") : undefined}
                >
                  {c.sortable && basePath ? (
                    <Link
                      href={buildHref(basePath, params, { sort: `${c.key}:${nextDir}` })}
                      className={cn("inline-flex items-center gap-1 hover:text-text", active && "text-text", c.align === "right" && "flex-row-reverse")}
                      scroll={false}
                    >
                      {c.label}
                      <SortIcon className="size-3.5" />
                    </Link>
                  ) : (
                    c.label
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row, i) => {
            const href = rowHref?.(row);
            return (
              <tr key={row.id ?? i} className={cn("transition-colors", href && "group relative cursor-pointer hover:bg-surface-2")}>
                {columns.map((c, ci) => (
                  <td
                    key={c.key}
                    className={cn(
                      "px-4 whitespace-nowrap text-text-2",
                      dense ? "py-2" : "py-3",
                      c.align === "right" && "text-right tabular-nums",
                      c.hideOnMobile && "max-md:hidden",
                      c.className
                    )}
                  >
                    {/* First cell carries a full-row link overlay for keyboard + click */}
                    {href && ci === 0 && <Link href={href} className="absolute inset-0" aria-label={`Open ${row.id ?? "row"}`} />}
                    <div className={cn(href && "[&_a]:relative [&_a]:z-[1] [&_button]:relative [&_button]:z-[1]")}>
                      {c.render ? c.render(row) : (row[c.key] ?? "—")}
                    </div>
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Server-side pagination footer. */
export function Pagination({ page, pageCount, total, pageSize, basePath, params = {} }) {
  if (!total) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const pages = pageWindow(page, pageCount);

  return (
    <nav className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm" aria-label="Pagination">
      <p className="text-xs text-muted">
        Showing <span className="font-semibold text-text-2">{formatNumber(from)}</span>–
        <span className="font-semibold text-text-2">{formatNumber(to)}</span> of{" "}
        <span className="font-semibold text-text-2">{formatNumber(total)}</span>
      </p>
      {pageCount > 1 && (
        <div className="flex items-center gap-1">
          <PageLink disabled={page <= 1} href={buildHref(basePath, params, { page: page - 1 })} label="Previous page">
            <ChevronLeft className="size-4" />
          </PageLink>
          {pages.map((p, i) =>
            p === "…" ? (
              <span key={`e${i}`} className="px-1 text-muted max-sm:hidden">
                …
              </span>
            ) : (
              <PageLink key={p} active={p === page} href={buildHref(basePath, params, { page: p })} className="max-sm:hidden">
                {p}
              </PageLink>
            )
          )}
          <span className="px-2 text-xs text-muted sm:hidden">
            {page} / {pageCount}
          </span>
          <PageLink disabled={page >= pageCount} href={buildHref(basePath, params, { page: page + 1 })} label="Next page">
            <ChevronRight className="size-4" />
          </PageLink>
        </div>
      )}
    </nav>
  );
}

function PageLink({ href, active, disabled, label, className, children }) {
  const cls = cn(
    "inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-semibold",
    active ? "bg-primary text-white" : "text-text-2 hover:bg-surface-3",
    disabled && "pointer-events-none opacity-40",
    className
  );
  if (disabled) return <span className={cls} aria-label={label}>{children}</span>;
  return (
    <Link href={href} className={cls} aria-label={label} aria-current={active ? "page" : undefined} scroll={false}>
      {children}
    </Link>
  );
}

function pageWindow(page, count) {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1);
  const set = new Set([1, count, page - 1, page, page + 1].filter((p) => p >= 1 && p <= count));
  const sorted = [...set].sort((a, b) => a - b);
  const out = [];
  sorted.forEach((p, i) => {
    if (i && p - sorted[i - 1] > 1) out.push("…");
    out.push(p);
  });
  return out;
}
