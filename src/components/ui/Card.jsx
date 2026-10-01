import { cn } from "@/lib/utils";

export function Card({ className, children, ...props }) {
  return (
    <div className={cn("rounded-2xl border border-border bg-surface shadow-card", className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ title, description, action, className, children }) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-3.5 sm:px-5", className)}>
      <div className="min-w-0">
        {title && <h2 className="text-sm font-bold text-text">{title}</h2>}
        {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
        {children}
      </div>
      {action && <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div>}
    </div>
  );
}

export function CardBody({ className, children }) {
  return <div className={cn("p-4 sm:p-5", className)}>{children}</div>;
}

/** Label / value list used on every detail page. */
export function DescriptionList({ items, className, cols = 2 }) {
  return (
    <dl className={cn("grid gap-x-6 gap-y-4", cols === 2 ? "sm:grid-cols-2" : cols === 3 ? "sm:grid-cols-3" : "", className)}>
      {items.filter(Boolean).map((it) => (
        <div key={it.label} className="min-w-0">
          <dt className="text-xs font-medium text-muted">{it.label}</dt>
          <dd className="mt-1 text-sm font-medium break-words text-text">{it.value ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}
