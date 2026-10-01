"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input, Select } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

/**
 * Search + filter controls that write to the URL. The server page reads the
 * params and queries one page of rows, so filtering never happens in the browser.
 *
 * filters: [{ name, label, options: [{value,label}] }]
 * dates:   true to show from/to date inputs (params `from` / `to`)
 */
export function FilterBar({ searchPlaceholder = "Search…", search = true, filters = [], dates, children, className }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const timer = useRef();

  const update = (patch) => {
    const next = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (!v || v === "all") next.delete(k);
      else next.set(k, v);
    }
    next.delete("page");
    const qs = next.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  };

  // Debounced search so we don't hit the API on every keystroke.
  const onSearch = (value) => {
    setQ(value);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => update({ q: value.trim() }), 300);
  };
  useEffect(() => () => clearTimeout(timer.current), []);

  const activeCount = filters.filter((f) => sp.get(f.name)).length + (sp.get("from") ? 1 : 0) + (sp.get("to") ? 1 : 0);

  return (
    <div className={cn("flex flex-wrap items-center gap-2 p-3 sm:px-4", className)}>
      {search && (
        <div className="relative w-full sm:w-72">
          <Input
            icon={pending ? <Spinner /> : <Search />}
            value={q}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label="Search"
            type="search"
          />
        </div>
      )}
      {filters.map((f) => (
        <Select
          key={f.name}
          aria-label={f.label}
          value={sp.get(f.name) ?? ""}
          onChange={(e) => update({ [f.name]: e.target.value })}
          options={[{ value: "", label: f.label }, ...f.options]}
          className="min-w-0 flex-1 sm:w-auto sm:flex-none"
        />
      ))}
      {dates && (
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <Input type="date" aria-label="From date" value={sp.get("from") ?? ""} onChange={(e) => update({ from: e.target.value })} className="min-w-0 flex-1 sm:w-38" />
          <span className="text-xs text-muted">to</span>
          <Input type="date" aria-label="To date" value={sp.get("to") ?? ""} onChange={(e) => update({ to: e.target.value })} className="min-w-0 flex-1 sm:w-38" />
        </div>
      )}
      {children}
      {(activeCount > 0 || sp.get("q")) && (
        <button
          type="button"
          onClick={() => {
            setQ("");
            update(Object.fromEntries([...filters.map((f) => [f.name, ""]), ["q", ""], ["from", ""], ["to", ""]]));
          }}
          className="inline-flex h-9 items-center gap-1 rounded-lg px-2.5 text-xs font-semibold text-muted hover:bg-surface-3 hover:text-text"
        >
          <X className="size-3.5" /> Clear
        </button>
      )}
    </div>
  );
}
