"use client";

import { useEffect } from "react";
import { markSeen } from "@/actions/attention";

/**
 * Tells the backend this admin opened `section`, so its sidebar / bell badge clears (it comes back when
 * something new arrives). Renders nothing.
 */
export function MarkSeen({ section }) {
  useEffect(() => {
    markSeen(section).catch(() => {});
  }, [section]);
  return null;
}
