"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

/** Re-fetches the server page every `seconds` with router.refresh(). Pauses while the browser tab is hidden. */
export function AutoRefresh({ seconds = 15 }) {
  const router = useRouter();
  const [left, setLeft] = useState(seconds);
  const [pending, startTransition] = useTransition();
  const deadline = useRef(0);

  const refresh = useCallback(() => {
    deadline.current = Date.now() + seconds * 1000;
    setLeft(seconds);
    startTransition(() => router.refresh());
  }, [router, seconds]);

  useEffect(() => {
    deadline.current = Date.now() + seconds * 1000;
    const t = setInterval(() => {
      if (document.hidden) {
        deadline.current += 1000;
        return;
      }
      const remaining = Math.ceil((deadline.current - Date.now()) / 1000);
      if (remaining <= 0) refresh();
      else setLeft(remaining);
    }, 1000);
    return () => clearInterval(t);
  }, [refresh, seconds]);

  return (
    <button
      type="button"
      onClick={refresh}
      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 text-xs font-semibold text-text-2 hover:bg-surface-2"
      title="Refresh now"
    >
      <RefreshCw className={cn("size-3.5", pending && "animate-spin")} />
      <span>
        Auto-refresh every {seconds}s · <span className="tabular-nums">{pending ? "updating…" : `next in ${left}s`}</span>
      </span>
    </button>
  );
}
