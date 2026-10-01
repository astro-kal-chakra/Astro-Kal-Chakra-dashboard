"use client";

import { useEffect, useState } from "react";
import { formatCurrency, formatDuration } from "@/lib/utils";

/** Seconds elapsed since this component mounted, ticking every second. */
function useElapsed() {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(t);
  }, []);
  return elapsed;
}

/**
 * Live duration. `duration` is the server's value at render time (startedAt → now),
 * so the first paint matches the server and then counts up locally.
 */
export function LiveDuration({ duration }) {
  const elapsed = useElapsed();
  return <span className="tabular-nums">{formatDuration(duration + elapsed)}</span>;
}

/** Amount so far, estimated per minute started at `ratePerMin`. */
export function LiveAmount({ duration, ratePerMin }) {
  const elapsed = useElapsed();
  return <span className="tabular-nums">{formatCurrency(Math.round(((duration + elapsed) / 60) * ratePerMin))}</span>;
}
