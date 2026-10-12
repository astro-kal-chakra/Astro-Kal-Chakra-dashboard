"use client";

import { useServerState } from "@/lib/useServerState";
import { useState } from "react";
import { LogOut, Monitor, Smartphone } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/providers/ToastProvider";
import { timeAgo } from "@/lib/utils";
import { revokeOtherSessions, revokeSession } from "@/actions/profile";

/** The admin's own sign-in sessions. The backend revokes the session tokens. */
export function SessionsList({ sessions: initial }) {
  const toast = useToast();
  const [sessions, setSessions] = useServerState(initial);
  const [confirmAll, setConfirmAll] = useState(false);
  const [busy, setBusy] = useState(null);

  const others = sessions.filter((s) => !s.current);

  const signOut = async (s) => {
    setBusy(s.id);
    const r = await revokeSession(s.id);
    setBusy(null);
    if (!r.ok) return toast(r.error.message, { type: "error" });
    setSessions((list) => list.filter((x) => x.id !== s.id));
    toast("Session signed out", { description: `${s.device} · ${s.browser}` });
  };

  const signOutAll = async () => {
    setBusy("all");
    const r = await revokeOtherSessions();
    setBusy(null);
    if (!r.ok) return toast(r.error.message, { type: "error" });
    setConfirmAll(false);
    setSessions((list) => list.filter((x) => x.current));
    toast("Signed out of all other sessions", { description: `${others.length} session${others.length === 1 ? "" : "s"} ended · logged to audit` });
  };

  return (
    <Card>
      <CardHeader
        title="Active sessions"
        description="Places where you're signed in to the admin panel."
        action={
          others.length > 0 && (
            <Button size="sm" variant="danger-soft" icon={<LogOut />} onClick={() => setConfirmAll(true)}>
              <span className="max-sm:hidden">Sign out all other sessions</span>
              <span className="sm:hidden">Sign out others</span>
            </Button>
          )
        }
      />
      <ul className="divide-y divide-border">
        {sessions.map((s) => {
          const Icon = s.type === "mobile" ? Smartphone : Monitor;
          return (
            <li key={s.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-3 text-muted">
                <Icon className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-text">
                  {s.device}
                  {s.current && <Badge tone="success">This device</Badge>}
                </p>
                <p className="text-xs text-muted">
                  {s.browser} · <span className="font-mono">{s.ip}</span> · {s.location}
                </p>
                <p className="text-xs text-muted">{s.current ? "Active now" : `Last active ${timeAgo(s.lastActiveAt)}`}</p>
              </div>
              {!s.current && (
                <Button size="xs" variant="ghost" loading={busy === s.id} onClick={() => signOut(s)}>
                  Sign out
                </Button>
              )}
            </li>
          );
        })}
      </ul>
      {others.length === 0 && <EmptyState className="py-6" title="No other sessions" description="You're only signed in on this device." />}

      <Modal
        open={confirmAll}
        onClose={() => setConfirmAll(false)}
        title="Sign out all other sessions?"
        size="sm"
        footer={
          <>
            <Button onClick={() => setConfirmAll(false)}>Cancel</Button>
            <Button variant="danger" loading={busy === "all"} onClick={signOutAll}>
              Sign out {others.length}
            </Button>
          </>
        }
      >
        <p className="text-sm text-text-2">Every device except this one is signed out right away. You stay signed in here.</p>
      </Modal>
    </Card>
  );
}
