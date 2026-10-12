"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Re-fetches the server page every `seconds` while the tab is visible (live sessions / queues). */
export function AutoRefresh({ seconds = 15 }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, seconds * 1000);
    return () => clearInterval(id);
  }, [router, seconds]);
  return null;
}
