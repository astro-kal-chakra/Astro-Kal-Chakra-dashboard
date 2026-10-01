"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarRange, GitCompareArrows } from "lucide-react";
import { DATE_PRESETS, GROUP_BY } from "@/config/constants";
import { Input, Select } from "@/components/ui/Input";
import { Button, Spinner } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

/**
 * Date controls shared by every analytics view: preset or custom range,
 * group-by bucket, and compare-with-previous-period. State lives in the URL.
 *
 * `range` is the server-resolved range ({ preset, label, group, allowed, compare }).
 */
export function DateRangeFilter({ range, showGroup = true, className }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [pending, start] = useTransition();
  const [from, setFrom] = useState(sp.get("from") ?? "");
  const [to, setTo] = useState(sp.get("to") ?? "");
  const preset = sp.get("preset") ?? range.preset;

  const update = (patch) => {
    const next = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) (v ? next.set(k, v) : next.delete(k));
    start(() => router.replace(`${pathname}?${next}`, { scroll: false }));
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <div className="flex items-center gap-2">
        {pending ? <Spinner className="size-4 text-primary" /> : <CalendarRange className="size-4 text-muted max-sm:hidden" />}
        <Select
          aria-label="Date range"
          value={preset}
          onChange={(e) => {
            const v = e.target.value;
            if (v === "custom") update({ preset: "custom" });
            else update({ preset: v, from: "", to: "", group: "" });
          }}
          options={DATE_PRESETS}
          className="w-40"
        />
      </div>

      {preset === "custom" && (
        <form
          className="flex w-full items-center gap-2 sm:w-auto"
          onSubmit={(e) => {
            e.preventDefault();
            if (from && to) update({ preset: "custom", from, to, group: "" });
          }}
        >
          <Input type="date" aria-label="From" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} className="min-w-0 flex-1 sm:w-38" />
          <span className="text-xs text-muted">to</span>
          <Input type="date" aria-label="To" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} className="min-w-0 flex-1 sm:w-38" />
          <Button type="submit" size="md" variant="soft" disabled={!from || !to}>
            Apply
          </Button>
        </form>
      )}

      {showGroup && (
        <div className="inline-flex rounded-lg border border-border bg-surface p-0.5 shadow-soft" role="group" aria-label="Group by">
          {GROUP_BY.map((g) => {
            const enabled = range.allowed?.[g.value];
            const active = range.group === g.value;
            return (
              <button
                key={g.value}
                type="button"
                disabled={!enabled}
                aria-pressed={active}
                onClick={() => update({ group: g.value })}
                className={cn(
                  "h-8 rounded-md px-2.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-35",
                  active ? "bg-primary text-white" : "text-text-2 hover:bg-surface-3"
                )}
                title={enabled ? undefined : "Not available for this range"}
              >
                {g.label}
              </button>
            );
          })}
        </div>
      )}

      <button
        type="button"
        aria-pressed={range.compare}
        onClick={() => update({ compare: range.compare ? "" : "1" })}
        className={cn(
          "inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold shadow-soft transition-colors",
          range.compare ? "border-primary bg-primary-soft text-primary-ink" : "border-border bg-surface text-text-2 hover:bg-surface-2"
        )}
      >
        <GitCompareArrows className="size-4" />
        Compare to previous
      </button>

      <span className="text-xs font-medium text-muted">{range.label}</span>
    </div>
  );
}
