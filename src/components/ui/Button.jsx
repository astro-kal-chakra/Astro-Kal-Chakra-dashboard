import Link from "next/link";
import { cn } from "@/lib/utils";

const VARIANTS = {
  primary: "bg-primary text-white hover:bg-primary-hover shadow-soft",
  secondary: "bg-surface text-text border border-border hover:bg-surface-2 hover:border-border-strong shadow-soft",
  ghost: "text-text-2 hover:bg-surface-3 hover:text-text",
  danger: "bg-danger text-white hover:opacity-90 shadow-soft",
  "danger-soft": "bg-danger-soft text-danger hover:brightness-95",
  success: "bg-success text-white hover:opacity-90 shadow-soft",
  soft: "bg-primary-soft text-primary-ink hover:brightness-95",
};

const SIZES = {
  xs: "h-7 px-2 text-xs gap-1 rounded-md [&_svg]:size-3.5",
  sm: "h-8 px-3 text-sm gap-1.5 rounded-lg [&_svg]:size-4",
  md: "h-9 px-3.5 text-sm gap-2 rounded-lg [&_svg]:size-4",
  lg: "h-11 px-5 text-sm gap-2 rounded-xl [&_svg]:size-4",
  icon: "size-9 rounded-lg [&_svg]:size-4 justify-center",
  "icon-sm": "size-8 rounded-lg [&_svg]:size-4 justify-center",
};

/**
 * Server-safe button. Pass `href` to render a Link.
 * `icon` is a React element (e.g. <Plus />) so it works across the
 * server/client boundary.
 */
export function Button({ variant = "secondary", size = "md", href, icon, iconRight, className, children, loading, disabled, ...props }) {
  const classes = cn(
    "inline-flex shrink-0 items-center font-semibold whitespace-nowrap transition-colors select-none",
    "disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0",
    VARIANTS[variant],
    SIZES[size],
    className
  );
  const content = (
    <>
      {loading ? <Spinner /> : icon}
      {children}
      {iconRight}
    </>
  );
  if (href) {
    return (
      <Link href={href} className={classes} {...props}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" className={classes} disabled={disabled || loading} {...props}>
      {content}
    </button>
  );
}

export function Spinner({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn("animate-spin", className)} aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
