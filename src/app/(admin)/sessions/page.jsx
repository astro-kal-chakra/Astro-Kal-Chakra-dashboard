import Link from "next/link";
import { Flag, Radio, Star } from "lucide-react";
import { checkAccess } from "@/lib/session";
import { getSessions } from "@/services";
import { flatParams } from "@/lib/url";
import { formatCurrency, formatDateTime, formatDuration, formatNumber } from "@/lib/utils";
import { SESSION_MODES } from "@/config/constants";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DataTable, Pagination } from "@/components/ui/Table";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { FilterBar } from "@/components/common/FilterBar";
import { ExportButton } from "@/components/common/ExportButton";

export const metadata = { title: "Session history" };

const FILTERS = [
  { name: "mode", label: "All modes", options: SESSION_MODES },
  {
    name: "status",
    label: "All statuses",
    options: [
      { value: "completed", label: "Completed" },
      { value: "cancelled", label: "Cancelled" },
      { value: "missed", label: "Missed" },
      { value: "force_ended", label: "Force ended" },
      { value: "refunded", label: "Refunded" },
    ],
  },
];

export default async function SessionsPage({ searchParams }) {
  const { denied } = await checkAccess("sessions");
  if (denied) return denied;

  const params = flatParams(await searchParams);
  const data = await getSessions(params);

  const columns = [
    {
      key: "id",
      label: "Session",
      render: (s) => (
        <span className="inline-flex items-center gap-1.5 font-mono text-xs">
          {s.id}
          {s.flagged && <Flag className="size-3.5 text-danger" aria-label="Flagged" />}
        </span>
      ),
    },
    {
      key: "userName",
      label: "User",
      render: (s) => (
        <Link href={`/users/${s.userId}`} className="font-semibold text-text hover:text-primary">
          {s.userName}
        </Link>
      ),
    },
    {
      key: "astrologerName",
      label: "Astrologer",
      hideOnMobile: true,
      render: (s) => (
        <Link href={`/astrologers/${s.astrologerId}`} className="hover:text-primary">
          {s.astrologerName}
        </Link>
      ),
    },
    { key: "mode", label: "Mode", render: (s) => <span className="capitalize">{s.mode}</span> },
    { key: "duration", label: "Duration", align: "right", sortable: true, render: (s) => (s.duration ? formatDuration(s.duration) : "—") },
    { key: "amount", label: "Amount", align: "right", sortable: true, render: (s) => (s.free ? <Badge tone="info">Free</Badge> : <span className="font-semibold text-text">{formatCurrency(s.amount)}</span>) },
    { key: "status", label: "Status", render: (s) => <StatusBadge status={s.status} /> },
    {
      key: "rating",
      label: "Rating",
      align: "right",
      sortable: true,
      hideOnMobile: true,
      render: (s) =>
        s.rating ? (
          <span className="inline-flex items-center gap-1">
            {s.rating}
            <Star className="size-3.5 fill-current text-warning" />
          </span>
        ) : (
          "—"
        ),
    },
    { key: "endReason", label: "End reason", hideOnMobile: true },
    { key: "startedAt", label: "Started", sortable: true, render: (s) => formatDateTime(s.startedAt) },
  ];

  return (
    <>
      <PageHeader
        title="Session history"
        description={`${formatNumber(data.total)} sessions match your filters`}
        actions={
          <>
            <Button href="/sessions/live" size="sm" icon={<Radio />}>
              Live monitor
            </Button>
            <ExportButton
              module="sessions"
              filename="sessions.csv"
              rows={data.rows.map((s) => ({
                id: s.id,
                user: s.userName,
                userId: s.userId,
                astrologer: s.astrologerName,
                astrologerId: s.astrologerId,
                mode: s.mode,
                status: s.status,
                durationSec: s.duration,
                amount: s.amount,
                free: s.free ? "yes" : "no",
                rating: s.rating ?? "",
                endReason: s.endReason,
                started: formatDateTime(s.startedAt),
              }))}
            />
          </>
        }
      />
      <Card>
        <FilterBar searchPlaceholder="Search session, user or astrologer" filters={FILTERS} dates />
        <DataTable columns={columns} rows={data.rows} basePath="/sessions" params={params} rowHref={(s) => `/sessions/${s.id}`} />
        <Pagination {...data} basePath="/sessions" params={params} />
      </Card>
    </>
  );
}
