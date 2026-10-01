"use client";

import { useEffect, useRef, useState } from "react";
import { Clock } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { logout } from "@/actions/auth";
import { IDLE_TIMEOUT_MS, IDLE_WARNING_MS } from "@/config/constants";

const EVENTS = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "visibilitychange"];

/**
 * Signs the admin out after ~30 min idle, with a 60s warning first.
 * The server session must expire on the same schedule; this only mirrors it.
 */
export function IdleTimeout() {
  const [warning, setWarning] = useState(false);
  const [left, setLeft] = useState(IDLE_WARNING_MS / 1000);
  const last = useRef(0);

  useEffect(() => {
    last.current = Date.now();
    const bump = () => {
      if (!document.hidden) last.current = Date.now();
    };
    EVENTS.forEach((e) => window.addEventListener(e, bump, { passive: true }));

    const tick = setInterval(() => {
      const idle = Date.now() - last.current;
      if (idle >= IDLE_TIMEOUT_MS) {
        clearInterval(tick);
        logout();
      } else if (idle >= IDLE_TIMEOUT_MS - IDLE_WARNING_MS) {
        setWarning(true);
        setLeft(Math.ceil((IDLE_TIMEOUT_MS - idle) / 1000));
      } else {
        setWarning(false);
      }
    }, 1000);

    return () => {
      clearInterval(tick);
      EVENTS.forEach((e) => window.removeEventListener(e, bump));
    };
  }, []);

  return (
    <Modal
      open={warning}
      onClose={() => (last.current = Date.now())}
      title="Still there?"
      size="sm"
      footer={
        <>
          <form action={logout}>
            <Button type="submit">Sign out</Button>
          </form>
          <Button variant="primary" onClick={() => (last.current = Date.now())}>
            Stay signed in
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-warning-soft text-warning">
          <Clock className="size-5" />
        </span>
        <p className="text-sm text-text-2">
          For security, you&apos;ll be signed out in <span className="font-bold text-text tabular-nums">{left}s</span> because you&apos;ve been inactive.
        </p>
      </div>
    </Modal>
  );
}
