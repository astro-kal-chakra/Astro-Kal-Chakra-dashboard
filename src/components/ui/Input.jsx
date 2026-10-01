import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const base =
  "w-full rounded-lg border border-border bg-surface text-sm text-text placeholder:text-muted shadow-soft transition-colors " +
  "hover:border-border-strong focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary/15 disabled:opacity-60";

export function Input({ className, icon, ...props }) {
  if (icon) {
    return (
      <div className={cn("relative", className)}>
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted [&_svg]:size-4">{icon}</span>
        <input className={cn(base, "h-9 pr-3 pl-9")} {...props} />
      </div>
    );
  }
  return <input className={cn(base, "h-9 px-3", className)} {...props} />;
}

export function Textarea({ className, ...props }) {
  return <textarea className={cn(base, "min-h-24 px-3 py-2", className)} {...props} />;
}

/** Native select (accessible, works on phones). `options`: [{value,label}] or strings. */
export function Select({ className, options = [], placeholder, ...props }) {
  return (
    <div className={cn("relative", className)}>
      <select className={cn(base, "h-9 appearance-none pr-8 pl-3")} {...props}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => {
          const opt = typeof o === "string" ? { value: o, label: o } : o;
          return (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          );
        })}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-muted" />
    </div>
  );
}

export function Label({ htmlFor, children, hint, className }) {
  return (
    <label htmlFor={htmlFor} className={cn("mb-1.5 flex items-baseline justify-between gap-2 text-xs font-semibold text-text-2", className)}>
      <span>{children}</span>
      {hint && <span className="font-normal text-muted">{hint}</span>}
    </label>
  );
}

export function Field({ label, htmlFor, hint, help, className, children }) {
  return (
    <div className={className}>
      {label && (
        <Label htmlFor={htmlFor} hint={hint}>
          {label}
        </Label>
      )}
      {children}
      {help && <p className="mt-1.5 text-xs text-muted">{help}</p>}
    </div>
  );
}
