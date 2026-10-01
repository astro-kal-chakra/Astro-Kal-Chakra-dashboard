import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * KPI tile with a trend arrow. `change` is a percentage vs the previous
 * period; `invert` flips good/bad (e.g. failed payments going up is bad).
 * With `href` the whole tile links to the filtered list behind the number.
 */
export function StatCard({ label, value, change, invert, hint, icon, href, live, className }) {
  const hasChange = typeof change === "number" && Number.isFinite(change);
  const up = change > 0.05;
  const down = change < -0.05;
  const good = invert ? down : up;
  const bad = invert ? up : down;
  const Trend = up ? ArrowUpRight : down ? ArrowDownRight : Minus;

  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold text-muted">{label}</p>
        {icon && <span className="flex size-8 items-center justify-center rounded-lg bg-primary-soft text-primary-ink [&_svg]:size-4">{icon}</span>}
      </div>
      <div className="mt-2 flex items-center gap-2">
        {live && (
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-success" />
          </span>
        )}
        <p className="text-2xl font-extrabold tracking-tight text-text tabular-nums">{value}</p>
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
        {hasChange && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-semibold",
              good && "bg-success-soft text-success",
              bad && "bg-danger-soft text-danger",
              !good && !bad && "bg-surface-3 text-muted"
            )}
          >
            <Trend className="size-3.5" aria-hidden />
            {Math.abs(change).toFixed(1)}%
            <span className="sr-only">{up ? "increase" : down ? "decrease" : "no change"}</span>
          </span>
        )}
        {hint && <span className="text-muted">{hint}</span>}
      </div>
    </>
  );

  const cls = cn("block rounded-2xl border border-border bg-surface p-4 shadow-card", href && "transition hover:border-border-strong hover:shadow-pop/20", className);
  return href ? (
    <Link href={href} className={cls}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

/** Compact number tile for detail pages. */
export function MiniStat({ label, value, accent, hint }) {
  return (
    <div className={cn("rounded-2xl border border-border p-3.5 shadow-card", accent ? "bg-primary-soft" : "bg-surface")}>
      <p className={cn("text-xs font-semibold", accent ? "text-primary-ink" : "text-muted")}>{label}</p>
      <p className="mt-1 text-lg font-extrabold text-text tabular-nums">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}
