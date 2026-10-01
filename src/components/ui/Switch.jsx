"use client";

import { cn } from "@/lib/utils";

/** Controlled or uncontrolled toggle. Pass `name` to include it in a form. */
export function Switch({ checked, onChange, disabled, label, name, id, className }) {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50",
        checked ? "bg-primary" : "bg-border-strong",
        className
      )}
    >
      {name && <input type="hidden" name={name} value={checked ? "on" : "off"} />}
      <span className={cn("inline-block size-5 rounded-full bg-white shadow transition-transform", checked ? "translate-x-5.5" : "translate-x-0.5")} />
    </button>
  );
}
