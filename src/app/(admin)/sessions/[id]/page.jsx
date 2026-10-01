import Link from "next/link";
import { notFound } from "next/navigation";
import { Flag, MessageSquareText, Power, Star } from "lucide-react";
import { checkAccess } from "@/lib/session";
import { can } from "@/config/permissions";
import { getSession } from "@/services";
import { cn, formatCurrency, formatDateTime, formatDuration, timeAgo } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import { MiniStat } from "@/components/ui/StatCard";
import { Card, CardBody, CardHeader, DescriptionList } from "@/components/ui/Card";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ActionButton } from "@/components/common/ActionButton";
import { BillingTable } from "./_components/BillingTable";

export async function generateMetadata({ params }) {
  const { id } = await params;
  return { title: `Session ${id}` };
}

const FORCE_END_REASONS = ["Abuse reported", "Asked to pay outside the app", "Fraud / abuse investigation", "Technical issue · stuck session", "User requested via support ticket"];

export default async function SessionDetailPage({ params }) {
  const { admin, denied } = await checkAccess("sessions");
  if (denied) return denied;

  const { id } = await params;
  const s = await getSession(id);
  if (!s) notFound();

  // Live sessions come from the live feed and have no final status yet.
  const live = !s.status;
  const status = s.status ?? "live";
  const timeline = live ? [...s.timeline.filter((t) => !t.label.startsWith("Session ended")), { label: "In progress", at: null, current: true }] : s.timeline;
  const canOpenChat = can(admin.role, "chats", "view"); // UI mirror; the backend checks again and logs the reason.

  return (
    <>
      <PageHeader
        back={{ href: live ? "/sessions/live" : "/sessions", label: live ? "Live monitor" : "Session history" }}
        title={<span className="font-mono">{s.id}</span>}
        description={`${s.userName} with ${s.astrologerName} · started ${formatDateTime(s.startedAt)}`}
        meta={
          <>
            <StatusBadge status={status} />
            <Badge tone="primary" className="capitalize">
              {s.mode}
            </Badge>
            {s.free && <Badge tone="info">Free session</Badge>}
            {(s.flagged || s.flags.length > 0) && (
              <Badge tone="danger">
                <Flag className="size-3" /> Flagged
              </Badge>
            )}
          </>
        }
        actions={
          <>
            {s.mode === "chat" && canOpenChat && (
              <Button href={`/chats/${s.id}`} size="sm" icon={<MessageSquareText />}>
                Open chat transcript
              </Button>
            )}
            {live && (
              <ActionButton
                module="sessions"
                reason
                reasons={FORCE_END_REASONS}
                variant="danger-soft"
                icon={<Power />}
                dialogTitle="Force end session"
                dialogDescription="Billing stops now and both sides are told the session was ended by support."
                confirmLabel="Force end"
                success="Session ended"
              >
                Force end
              </ActionButton>
            )}
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-5">
        <div className="min-w-0 space-y-4 lg:space-y-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MiniStat label={live ? "Amount so far" : "Amount"} value={s.free ? "Free" : formatCurrency(s.amount)} accent />
            <MiniStat label="Duration" value={s.duration ? formatDuration(s.duration) : "—"} hint={live ? "At last refresh" : undefined} />
            <MiniStat label="Rate" value={`₹${s.ratePerMin}/min`} />
            <MiniStat label="Wait time" value={s.waitTime ? formatDuration(s.waitTime) : "—"} />
          </div>

          <Card>
            <CardHeader title="Per-minute billing" description={`${s.billing.length} billed minutes${s.billing.length >= 60 ? " (first 60 shown)" : ""}`} />
            <BillingTable rows={s.billing} />
          </Card>

          <Card>
            <CardHeader title="Flags" description="Messages caught by the content filter" />
            {s.flags.length ? (
              <ul className="divide-y divide-border">
                {s.flags.map((f) => (
                  <li key={f.id} className="flex items-start gap-3 px-4 py-3 sm:px-5">
                    <Flag className="mt-0.5 size-4 shrink-0 text-danger" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-text">{f.message}</p>
                      <p className="mt-0.5 text-xs text-muted">
                        Sent by {f.sender} · {timeAgo(f.flaggedAt)}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <StatusBadge status={f.severity} />
                      <StatusBadge status={f.status} />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="No flags" description={s.flagged ? "Marked for review by the system, no message flagged." : "Nothing was flagged in this session."} />
            )}
          </Card>
        </div>

        <aside className="min-w-0 space-y-4 lg:space-y-5">
          <Card>
            <CardHeader title="Details" />
            <CardBody>
              <DescriptionList
                cols={1}
                items={[
                  {
                    label: "User",
                    value: (
                      <Link href={`/users/${s.userId}`} className="text-primary hover:underline">
                        {s.userName} · {s.userId}
                      </Link>
                    ),
                  },
                  {
                    label: "Astrologer",
                    value: (
                      <Link href={`/astrologers/${s.astrologerId}`} className="text-primary hover:underline">
                        {s.astrologerName} · {s.astrologerId}
                      </Link>
                    ),
                  },
                  { label: "End reason", value: live ? "Still running" : s.endReason },
                  {
                    label: "Rating",
                    value: s.rating ? (
                      <span className="inline-flex items-center gap-1">
                        {s.rating}
                        <Star className="size-3.5 fill-current text-warning" /> by user
                      </span>
                    ) : (
                      "Not rated"
                    ),
                  },
                  live && { label: "User balance", value: formatCurrency(s.userBalance) },
                  live && { label: "Queue", value: s.queue ? `${s.queue} waiting` : "Empty" },
                ]}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Timeline" />
            <CardBody>
              <ol className="relative space-y-4 border-l border-border pl-5">
                {timeline.map((t, i) => (
                  <li key={i} className="relative">
                    <span
                      className={cn(
                        "absolute top-1 -left-[25px] size-2.5 rounded-full ring-4 ring-surface",
                        t.current ? "animate-pulse bg-success" : i === timeline.length - 1 ? "bg-primary" : "bg-border-strong"
                      )}
                    />
                    <p className="text-sm font-semibold text-text">{t.label}</p>
                    {t.at && <p className="text-xs text-muted">{formatDateTime(t.at)}</p>}
                  </li>
                ))}
              </ol>
            </CardBody>
          </Card>
        </aside>
      </div>
    </>
  );
}
