import Link from "next/link";
import { MicOff } from "lucide-react";
import { checkAccess } from "@/lib/session";
import { getCalls } from "@/services";
import { flatParams } from "@/lib/url";
import { cn, formatDateTime, formatDuration, formatNumber, formatPercent, formatTime } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { MiniStat } from "@/components/ui/StatCard";
import { DataTable, Pagination } from "@/components/ui/Table";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { FilterBar } from "@/components/common/FilterBar";

export const metadata = { title: "Calls" };

const FILTERS = [
  { name: "mode", label: "Voice and video", options: [{ value: "voice", label: "Voice" }, { value: "video", label: "Video" }] },
  { name: "quality", label: "Any quality", options: [{ value: "good", label: "Good" }, { value: "fair", label: "Fair" }, { value: "poor", label: "Poor" }] },
];

export default async function CallsPage({ searchParams }) {
  const { denied } = await checkAccess("calls");
  if (denied) return denied;

  const params = flatParams(await searchParams);
  const data = await getCalls(params);
  const { summary } = data;

  const columns = [
    { key: "startedAt", label: "Start", sortable: true, render: (c) => formatDateTime(c.startedAt) },
    { key: "endedAt", label: "End", hideOnMobile: true, render: (c) => formatTime(c.endedAt) },
    { key: "duration", label: "Duration", align: "right", sortable: true, render: (c) => formatDuration(c.duration) },
    {
      key: "participants",
      label: "Participants",
      render: (c) => (
        <span className="block">
          <span className="block font-semibold text-text">{c.userName}</span>
          <span className="block text-xs text-muted">
            with {c.astrologerName} · <span className="capitalize">{c.mode}</span>
          </span>
        </span>
      ),
    },
    {
      key: "disconnectReason",
      label: "Disconnect reason",
      render: (c) => <span className={cn(c.disconnectReason !== "Normal hangup" && "font-semibold text-danger")}>{c.disconnectReason}</span>,
    },
    { key: "quality", label: "Quality", render: (c) => <StatusBadge status={c.quality} /> },
    {
      key: "issues",
      label: "Issues",
      hideOnMobile: true,
      render: (c) =>
        c.issues.length ? (
          <span className="flex flex-wrap gap-1">
            {c.issues.map((i) => (
              <Badge key={i} tone="warning">
                {i}
              </Badge>
            ))}
          </span>
        ) : (
          <span className="text-muted">None</span>
        ),
    },
    {
      key: "sessionId",
      label: "Session",
      hideOnMobile: true,
      render: (c) => (
        <Link href={`/sessions/${c.sessionId}`} className="font-mono text-xs text-primary hover:underline">
          {c.sessionId}
        </Link>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Call logs" description={`${formatNumber(data.total)} voice and video calls match your filters`} />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:mb-5">
        <MiniStat label="Total calls" value={formatNumber(summary.total)} accent />
        <MiniStat label="Minutes" value={formatNumber(summary.minutes)} />
        <MiniStat label="Average duration" value={formatDuration(summary.avgDuration)} />
        <MiniStat label="Drop rate" value={formatPercent(summary.dropRate)} hint="Any end except normal hangup" />
      </div>

      <p className="mb-4 flex items-start gap-2 rounded-xl border border-border bg-surface-2 px-3.5 py-2.5 text-sm text-text-2 lg:mb-5">
        <MicOff className="mt-0.5 size-4 shrink-0 text-muted" />
        <span>
          <span className="font-semibold text-text">No call recording</span> — recording is off by default and requires legal approval and user consent.
        </span>
      </p>

      <Card>
        <FilterBar searchPlaceholder="Search call, session, user or astrologer" filters={FILTERS} />
        <DataTable columns={columns} rows={data.rows} basePath="/calls" params={params} empty={{ title: "No calls found" }} />
        <Pagination {...data} basePath="/calls" params={params} />
      </Card>
    </>
  );
}
