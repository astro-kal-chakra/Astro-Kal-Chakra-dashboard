import Link from "next/link";
import { ArrowRight, Eye, MessageSquare, Phone, Power, Radio, Video } from "lucide-react";
import { checkAccess } from "@/lib/session";
import { getLiveSessions } from "@/services";
import { flatParams } from "@/lib/url";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { SESSION_MODES } from "@/config/constants";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { MiniStat } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterBar } from "@/components/common/FilterBar";
import { ActionButton } from "@/components/common/ActionButton";
import { AutoRefresh } from "./_components/AutoRefresh";
import { LiveAmount, LiveDuration } from "./_components/LiveTicker";

export const metadata = { title: "Live monitor" };

const MODE_ICON = { chat: <MessageSquare />, voice: <Phone />, video: <Video /> };
const MODE_TONE = { chat: "primary", voice: "info", video: "accent" };
const FORCE_END_REASONS = ["Abuse reported", "Asked to pay outside the app", "Fraud / abuse investigation", "Technical issue · stuck session", "User requested via support ticket"];

function ForceEnd({ s }) {
  // Hidden without sessions.edit; the backend enforces the same check.
  return (
    <ActionButton
      module="sessions"
      reason
      reasons={FORCE_END_REASONS}
      variant="danger-soft"
      size="xs"
      icon={<Power />}
      dialogTitle="Force end session"
      dialogDescription={`${s.id} · ${s.userName} with ${s.astrologerName}. Billing stops now and both sides are told the session was ended by support.`}
      confirmLabel="Force end"
      success="Session ended"
    >
      Force end
    </ActionButton>
  );
}

function Metric({ label, children, warn }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-medium text-muted">{label}</dt>
      <dd className={warn ? "text-sm font-bold text-danger" : "text-sm font-bold text-text"}>{children}</dd>
    </div>
  );
}

export default async function LiveMonitorPage({ searchParams }) {
  const { denied } = await checkAccess("sessions");
  if (denied) return denied;

  const params = flatParams(await searchParams);
  const [all, rows] = await Promise.all([getLiveSessions(), getLiveSessions({ mode: params.mode })]);
  const byMode = (m) => all.filter((s) => s.mode === m).length;

  return (
    <>
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            Live monitor
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />
              <span className="relative inline-flex size-2.5 rounded-full bg-success" />
            </span>
          </span>
        }
        description="Sessions running right now across the platform"
        actions={<AutoRefresh seconds={15} />}
      />

      <p className="mb-4 flex items-start gap-2 rounded-xl border border-border bg-info-soft px-3.5 py-2.5 text-sm text-info lg:mb-5">
        <Eye className="mt-0.5 size-4 shrink-0" />
        <span>
          <span className="font-semibold">Read-only · admins cannot join or message.</span> You can watch session status and force-end a session with a reason.
        </span>
      </p>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:mb-5 lg:grid-cols-5">
        <MiniStat label="Live now" value={formatNumber(all.length)} accent />
        <MiniStat label="Chat" value={formatNumber(byMode("chat"))} />
        <MiniStat label="Voice" value={formatNumber(byMode("voice"))} />
        <MiniStat label="Video" value={formatNumber(byMode("video"))} />
        <MiniStat label="Amount so far" value={formatCurrency(all.reduce((s, x) => s + x.amount, 0))} hint="At last refresh" />
      </div>

      <Card>
        <FilterBar search={false} filters={[{ name: "mode", label: "All modes", options: SESSION_MODES }]} />
        {rows.length ? (
          <ul className="grid gap-3 border-t border-border p-3 sm:grid-cols-2 sm:p-4 xl:grid-cols-3">
            {rows.map((s) => {
              const lowBalance = s.userBalance < s.ratePerMin * 3;
              return (
                <li key={s.id} className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/sessions/${s.id}`} className="font-mono text-xs font-semibold text-primary hover:underline">
                      {s.id}
                    </Link>
                    <Badge tone={MODE_TONE[s.mode]} className="capitalize [&_svg]:size-3.5">
                      {MODE_ICON[s.mode]}
                      {s.mode}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Link href={`/users/${s.userId}`} className="min-w-0 truncate font-semibold text-text hover:text-primary">
                      {s.userName}
                    </Link>
                    <ArrowRight className="size-3.5 shrink-0 text-muted" />
                    <Link href={`/astrologers/${s.astrologerId}`} className="min-w-0 truncate font-semibold text-text hover:text-primary">
                      {s.astrologerName}
                    </Link>
                  </div>
                  <dl className="grid grid-cols-2 gap-x-3 gap-y-2 rounded-lg bg-surface-2 p-2.5">
                    <Metric label="Duration">
                      <LiveDuration key={s.duration} duration={s.duration} />
                    </Metric>
                    <Metric label={`Amount · ₹${s.ratePerMin}/min`}>
                      <LiveAmount key={s.duration} duration={s.duration} ratePerMin={s.ratePerMin} />
                    </Metric>
                    <Metric label="User balance" warn={lowBalance}>
                      {formatCurrency(s.userBalance)}
                      {lowBalance && <span className="ml-1 text-[11px] font-semibold">· low</span>}
                    </Metric>
                    <Metric label="Queue">{s.queue ? `${s.queue} waiting` : "Empty"}</Metric>
                  </dl>
                  <div className="flex justify-end">
                    <ForceEnd s={s} />
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState icon={<Radio />} title="No live sessions" description="Nothing is running for this mode right now." />
        )}
      </Card>
    </>
  );
}
