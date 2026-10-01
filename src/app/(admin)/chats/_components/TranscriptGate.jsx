"use client";

import { useState } from "react";
import Link from "next/link";
import { Flag, Lock, LockOpen, ScrollText } from "lucide-react";
import { cn, formatDateTime, formatTime } from "@/lib/utils";
import { Card, CardBody, CardHeader, DescriptionList } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ReasonDialog } from "@/components/common/ReasonDialog";
import { useToast } from "@/providers/ToastProvider";

/**
 * Locks the transcript until the admin gives a reason. The reason is
 * audit-logged. In production `messages` would be fetched from the API after
 * the reason POST succeeds (the backend re-checks chats:view); here they are
 * passed in as props because the app is UI-only.
 */
export function TranscriptGate({ summary, messages }) {
  const [open, setOpen] = useState(false);
  const [access, setAccess] = useState(null);
  const toast = useToast();

  const details = (cols) => (
    <DescriptionList
      cols={cols}
      items={[
        { label: "User", value: <Link href={`/users/${summary.userId}`} className="text-primary hover:underline">{summary.userName}</Link> },
        { label: "Astrologer", value: <Link href={`/astrologers/${summary.astrologerId}`} className="text-primary hover:underline">{summary.astrologerName}</Link> },
        { label: "Started", value: summary.started },
        { label: "Duration", value: summary.duration },
        { label: "Amount", value: summary.amount },
        { label: "Messages", value: `${summary.messageCount}${summary.flaggedCount ? ` · ${summary.flaggedCount} flagged` : ""}` },
      ]}
    />
  );

  if (!access) {
    return (
      <Card>
        <CardBody className="flex flex-col items-center px-6 py-10 text-center">
          <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-warning-soft text-warning">
            <Lock className="size-6" />
          </div>
          <h2 className="text-base font-bold text-text">This transcript is private</h2>
          <p className="mt-1 max-w-md text-sm text-muted">Give a reason to open it. Your name, reason and time are saved in the audit log.</p>
          <div className="mt-6 w-full max-w-2xl rounded-2xl border border-border bg-surface-2 p-4 text-left">{details(3)}</div>
          <Button variant="primary" className="mt-6" icon={<LockOpen />} onClick={() => setOpen(true)}>
            Open transcript
          </Button>
        </CardBody>
        <ReasonDialog
          open={open}
          onClose={() => setOpen(false)}
          title="Open chat transcript"
          description={`Session ${summary.id} · ${summary.userName} with ${summary.astrologerName}`}
          confirmLabel="Open transcript"
          onConfirm={(reason) => {
            // Production: POST { sessionId, reason } → then GET the messages.
            setAccess({ reason, at: Date.now() });
            toast("Transcript opened", { description: `Reason: ${reason}` });
          }}
        />
      </Card>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-5">
      <div className="flex items-start gap-2 rounded-2xl border border-border bg-info-soft px-4 py-3 text-sm text-info">
        <ScrollText className="mt-0.5 size-4 shrink-0" />
        <p className="min-w-0 break-words">
          <span className="font-semibold">Access logged:</span> {access.reason} · {formatDateTime(access.at)}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-5">
        <Card className="min-w-0">
          <CardHeader title="Transcript" description="Read-only · user on the left, astrologer on the right" />
          <ol className="space-y-3 p-4 sm:p-5">
            {messages.map((m) => {
              const astro = m.from === "astrologer";
              return (
                <li key={m.id} className={cn("flex", astro ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm sm:max-w-[70%]",
                      astro ? "rounded-br-md bg-primary-soft text-text" : "rounded-bl-md bg-surface-3 text-text",
                      m.flagged && "border-2 border-danger bg-danger-soft"
                    )}
                  >
                    <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                      <span className="font-semibold text-text-2">{astro ? summary.astrologerName : summary.userName}</span>
                      <span>{formatTime(m.at)}</span>
                      {m.flagged && (
                        <Badge tone="danger">
                          <Flag className="size-3" /> Flagged
                        </Badge>
                      )}
                    </div>
                    <p className="break-words">{m.text}</p>
                  </div>
                </li>
              );
            })}
          </ol>
          <p className="border-t border-border px-4 py-3 text-center text-xs text-muted sm:px-5">Admins can&apos;t send messages in a chat.</p>
        </Card>
        <Card className="h-fit min-w-0">
          <CardHeader title="Session" />
          <CardBody>{details(1)}</CardBody>
        </Card>
      </div>
    </div>
  );
}
