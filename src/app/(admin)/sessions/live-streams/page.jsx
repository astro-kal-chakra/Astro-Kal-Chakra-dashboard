import Link from "next/link";
import { Eye, Gift, Heart, MessageSquare, Radio, Users } from "lucide-react";
import { checkAccess } from "@/lib/session";
import { getLiveStreams } from "@/services";
import { flatParams } from "@/lib/url";
import { formatCurrency, formatDateTime, formatDuration, formatNumber, timeAgo } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { DataTable, Pagination } from "@/components/ui/Table";
import { MiniStat } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { TabLinks } from "@/components/ui/Tabs";
import { FilterBar } from "@/components/common/FilterBar";
import { AutoRefresh } from "@/components/common/AutoRefresh";
import { EndLive } from "./_components/EndLive";

export const metadata = { title: "Live streams" };

const TABS = [
  { value: "live", label: "Live now" },
  { value: "ended", label: "Ended" },
];
function Stat({ icon, label, value, strong }) {
  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-1 text-[11px] font-medium text-muted [&_svg]:size-3">
        {icon}
        {label}
      </dt>
      <dd className={strong ? "text-lg font-bold text-text" : "text-sm font-bold text-text"}>{value}</dd>
    </div>
  );
}

function LiveCard({ r }) {
  return (
    <li className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-3.5">
      <div className="flex items-start gap-3">
        <Avatar name={r.astrologer.name} size="md" />
        <div className="min-w-0 flex-1">
          <Link href={`/astrologers/${r.astrologer.id}`} className="block truncate font-semibold text-text hover:text-primary">
            {r.astrologer.name}
          </Link>
          <p className="truncate text-sm text-muted">{r.title || "Live"}</p>
        </div>
        <Badge tone="danger" dot>
          LIVE
        </Badge>
      </div>
      <dl className="grid grid-cols-3 gap-x-3 gap-y-2 rounded-lg bg-surface-2 p-2.5">
        <Stat icon={<Eye />} label="Watching now" value={formatNumber(r.viewersNow)} strong />
        <Stat icon={<Users />} label="Joined in total" value={formatNumber(r.totalViewers)} />
        <Stat label="Peak" value={formatNumber(r.peakViewers)} />
        <Stat icon={<MessageSquare />} label="Comments" value={formatNumber(r.comments)} />
        <Stat icon={<Heart />} label="Hearts" value={formatNumber(r.hearts)} />
        <Stat icon={<Gift />} label="Gifts" value={`${formatNumber(r.gifts + r.questions)} · ${formatCurrency(r.amount)}`} />
      </dl>
      <div className="flex items-center justify-between gap-2 text-xs text-muted">
        <span>
          {r.startedAt ? `Live for ${formatDuration(r.durationSec)} · since ${timeAgo(r.startedAt)}` : "Starting"}
          {r.topic ? ` · ${r.topic}` : ""}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <Link href={`/sessions/live-streams/${r.id}`} className="text-sm font-semibold text-primary hover:underline">
          Who is watching →
        </Link>
        <EndLive room={r} />
      </div>
    </li>
  );
}

const ENDED_COLUMNS = [
  {
    key: "astrologer",
    label: "Astrologer",
    render: (r) => (
      <Link href={`/sessions/live-streams/${r.id}`} className="block min-w-0 hover:text-primary">
        <span className="block truncate font-semibold">{r.astrologer.name}</span>
        <span className="block truncate text-xs text-muted">{r.title || "Live"}</span>
      </Link>
    ),
  },
  { key: "endedAt", label: "Ended", render: (r) => (r.endedAt ? formatDateTime(r.endedAt) : "—") },
  { key: "duration", label: "Duration", hideOnMobile: true, render: (r) => formatDuration(r.durationSec) },
  { key: "totalViewers", label: "Joined", align: "right", render: (r) => formatNumber(r.totalViewers) },
  { key: "peakViewers", label: "Peak", align: "right", hideOnMobile: true, render: (r) => formatNumber(r.peakViewers) },
  { key: "comments", label: "Comments", align: "right", hideOnMobile: true, render: (r) => formatNumber(r.comments) },
  { key: "amount", label: "Gifts", align: "right", render: (r) => formatCurrency(r.amount) },
  { key: "endedBy", label: "Ended by", hideOnMobile: true, render: (r) => (r.endedBy === "admin" ? <Badge tone="warning">Admin</Badge> : r.endedBy === "system_restart" ? <Badge>Auto</Badge> : "Astrologer") },
];

export default async function LiveStreamsPage({ searchParams }) {
  const { denied } = await checkAccess("sessions");
  if (denied) return denied;

  const params = flatParams(await searchParams);
  const status = TABS.some((t) => t.value === params.status) ? params.status : "live";
  const data = await getLiveStreams({ status, q: params.q, page: params.page });
  const { rows, summary } = data;

  return (
    <>
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            Live streams
            {summary.liveNow > 0 && (
              <span className="relative flex size-2.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-danger opacity-60" />
                <span className="relative inline-flex size-2.5 rounded-full bg-danger" />
              </span>
            )}
          </span>
        }
        description="Astrologers broadcasting live to users, and how many people are watching"
        actions={status === "live" ? <AutoRefresh seconds={15} /> : null}
      />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:mb-5">
        <MiniStat label="Live now" value={formatNumber(summary.liveNow)} accent />
        <MiniStat label="Watching now" value={formatNumber(summary.watchingNow)} hint="People in all live streams" />
        <MiniStat label="Ended today" value={formatNumber(summary.endedToday)} />
        <MiniStat label="Gifts today" value={formatCurrency(summary.giftsToday)} />
      </div>

      <Card>
        <TabLinks tabs={TABS.map((t) => (t.value === "live" ? { ...t, count: summary.liveNow } : t))} active={status} param="status" basePath="/sessions/live-streams" params={params} className="px-2" />
        <FilterBar searchPlaceholder="Search by title" />
        {!rows.length ? (
          <EmptyState icon={<Radio />} title={status === "live" ? "No one is live right now" : "No live streams yet"} description={status === "live" ? "Live streams show here the moment an astrologer goes live." : "Finished live streams appear here."} />
        ) : status === "live" ? (
          <ul className="grid gap-3 border-t border-border p-3 sm:grid-cols-2 sm:p-4 xl:grid-cols-3">
            {rows.map((r) => (
              <LiveCard key={r.id} r={r} />
            ))}
          </ul>
        ) : (
          <DataTable columns={ENDED_COLUMNS} rows={rows} />
        )}
        <Pagination {...data} basePath="/sessions/live-streams" params={params} />
      </Card>
    </>
  );
}
