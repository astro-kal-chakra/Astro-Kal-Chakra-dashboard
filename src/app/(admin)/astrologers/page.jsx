import { Star } from "lucide-react";
import { checkAccess } from "@/lib/session";
import { getAstrologers } from "@/services";
import { getAstrologerFilterOptions } from "@/services/astrologers";
import { flatParams } from "@/lib/url";
import { cn, formatCurrency, formatDate, formatNumber, timeAgo } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { DataTable, Pagination } from "@/components/ui/Table";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { PersonCell } from "@/components/ui/Avatar";
import { TabLinks } from "@/components/ui/Tabs";
import { FilterBar } from "@/components/common/FilterBar";
import { AstroNow, PlatformTag } from "@/components/common/Presence";

export const metadata = { title: "Astrologers" };

const STATUSES = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "training", label: "Training" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "blocked", label: "Blocked" },
];

function Skills({ skills }) {
  return (
    <span className="flex flex-wrap gap-1">
      {(skills ?? []).slice(0, 3).map((s) => (
        <Badge key={s}>{s}</Badge>
      ))}
      {(skills ?? []).length > 3 && <Badge>+{skills.length - 3}</Badge>}
    </span>
  );
}

function KycProgress({ kyc }) {
  const done = kyc.filter((d) => d.status === "verified").length;
  const rejected = kyc.some((d) => d.status === "rejected");
  const pct = Math.round((done / kyc.length) * 100);
  return (
    <span className="flex items-center gap-2">
      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-3" aria-hidden>
        <span className={cn("block h-full rounded-full", done === kyc.length ? "bg-success" : "bg-primary")} style={{ width: `${pct}%` }} />
      </span>
      <span className="text-xs font-semibold text-text tabular-nums">
        {done}/{kyc.length}
      </span>
      {rejected && <Badge tone="danger">Re-upload</Badge>}
    </span>
  );
}

function OnlineStatus({ a }) {
  return <AstroNow a={a} />;
}

/** Last login: when + which platform (app / website). */
const lastLoginCol = {
  key: "lastLoginAt",
  label: "Last login",
  hideOnMobile: true,
  render: (a) =>
    a.lastLoginAt ? (
      <span className="flex flex-col gap-0.5">
        <span className="text-sm text-text">{timeAgo(a.lastLoginAt)}</span>
        <PlatformTag platform={a.lastLoginPlatform} />
      </span>
    ) : (
      <span className="text-muted">—</span>
    ),
};

const rating = (a) => (
  <span className="inline-flex items-center gap-1 font-semibold text-text">
    <Star className="size-3.5 fill-current text-warning" />
    {(a.rating ?? 0).toFixed(1)}
  </span>
);

const nameCol = { key: "name", label: "Astrologer", render: (a) => <PersonCell name={a.name || "Name not set"} sub={[a.id, a.city].filter(Boolean).join(" · ")} /> };

const COLUMNS = {
  all: [
    nameCol,
    {
      key: "status",
      label: "Status",
      render: (a) => (a.status === "draft" ? <Badge>Not submitted</Badge> : <StatusBadge status={a.status} />),
    },
    { key: "online", label: "Now", hideOnMobile: true, render: (a) => (a.status === "approved" ? <OnlineStatus a={a} /> : a.status === "training" ? <span className="text-xs text-muted">Day {a.training?.done ?? 0}/{a.training?.total ?? 6}</span> : <span className="text-muted">—</span>) },
    { key: "rating", label: "Rating", sortable: true, render: (a) => (a.rating ? rating(a) : "—") },
    { key: "sessions", label: "Sessions", align: "right", sortable: true, render: (a) => formatNumber(a.sessions) },
    { key: "skills", label: "Skills", hideOnMobile: true, render: (a) => <Skills skills={a.skills ?? []} /> },
    lastLoginCol,
    { key: "appliedAt", label: "Joined", sortable: true, hideOnMobile: true, render: (a) => (a.appliedAt ? formatDate(a.appliedAt) : "—") },
  ],
  pending: [
    nameCol,
    { key: "appliedAt", label: "Applied", sortable: true, render: (a) => timeAgo(a.appliedAt) },
    { key: "experience", label: "Experience", align: "right", render: (a) => `${a.experience} yrs` },
    { key: "skills", label: "Skills", render: (a) => <Skills skills={a.skills} /> },
    { key: "kyc", label: "KYC verified", render: (a) => <KycProgress kyc={a.kyc} /> },
    { key: "languages", label: "Languages", hideOnMobile: true, render: (a) => a.languages.join(", ") },
  ],
  training: [
    nameCol,
    {
      key: "training",
      label: "Training",
      render: (a) => (
        <span className="flex items-center gap-2">
          <span className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-3" aria-hidden>
            <span className="block h-full rounded-full bg-primary" style={{ width: `${Math.round(((a.training?.done ?? 0) / (a.training?.total || 6)) * 100)}%` }} />
          </span>
          <span className="text-xs font-semibold text-text tabular-nums">
            Day {a.training?.done ?? 0}/{a.training?.total ?? 6}
          </span>
        </span>
      ),
    },
    { key: "startedAt", label: "Started", render: (a) => (a.training?.startedAt ? formatDate(a.training.startedAt) : "—") },
    { key: "endsAt", label: "Planned end", hideOnMobile: true, render: (a) => (a.training?.endsAt ? formatDate(a.training.endsAt) : "—") },
    { key: "experience", label: "Experience", align: "right", hideOnMobile: true, render: (a) => `${a.experience} yrs` },
    { key: "skills", label: "Skills", hideOnMobile: true, render: (a) => <Skills skills={a.skills} /> },
  ],
  approved: [
    nameCol,
    { key: "rating", label: "Rating", sortable: true, render: rating },
    { key: "sessions", label: "Sessions", align: "right", sortable: true, render: (a) => formatNumber(a.sessions) },
    { key: "online", label: "Status", render: (a) => <OnlineStatus a={a} /> },
    {
      key: "badges",
      label: "Badges",
      hideOnMobile: true,
      render: (a) =>
        a.badges.length ? (
          <span className="flex flex-wrap gap-1">
            {a.badges.map((b) => (
              <Badge key={b} tone="primary">
                {b}
              </Badge>
            ))}
          </span>
        ) : (
          <span className="text-muted">—</span>
        ),
    },
    { key: "earnings", label: "Earnings", align: "right", hideOnMobile: true, render: (a) => formatCurrency(a.earnings) },
    lastLoginCol,
    { key: "appliedAt", label: "Joined", sortable: true, hideOnMobile: true, render: (a) => formatDate(a.appliedAt) },
  ],
  rejected: [
    nameCol,
    { key: "rejectionReason", label: "Reason" },
    { key: "skills", label: "Skills", hideOnMobile: true, render: (a) => <Skills skills={a.skills} /> },
    { key: "appliedAt", label: "Applied", sortable: true, render: (a) => formatDate(a.appliedAt) },
  ],
  blocked: [
    nameCol,
    { key: "rating", label: "Rating", sortable: true, render: (a) => (a.rating ? rating(a) : "—") },
    { key: "sessions", label: "Sessions", align: "right", sortable: true, render: (a) => formatNumber(a.sessions) },
    { key: "complaints", label: "Complaints", align: "right", hideOnMobile: true, render: (a) => formatNumber(a.complaints) },
    { key: "appliedAt", label: "Joined", sortable: true, render: (a) => formatDate(a.appliedAt) },
  ],
};

export default async function AstrologersPage({ searchParams }) {
  const { denied } = await checkAccess("astrologers");
  if (denied) return denied;

  const params = flatParams(await searchParams);
  const status = STATUSES.some((s) => s.value === params.status) ? params.status : "all";
  const [data, options] = await Promise.all([getAstrologers({ ...params, status }), getAstrologerFilterOptions()]);

  const tabs = STATUSES.map((s) => ({ ...s, count: data.counts[s.value] ?? 0 }));
  const filters = [{ name: "skill", label: "All skills", options: options.skills.map((s) => ({ value: s, label: s })) }];

  return (
    <>
      <PageHeader
        title="Astrologers"
        description={
          status === "pending"
            ? `${formatNumber(data.counts.pending ?? 0)} applications waiting for review`
            : status === "training"
              ? `${formatNumber(data.total)} approved astrologers in their 6-day training · they go online once it is completed or bypassed`
              : status === "all"
              ? `${formatNumber(data.total)} astrologers in total · including sign-ups that haven't submitted yet`
              : `${formatNumber(data.total)} astrologers match your filters`
        }
      />
      <Card>
        <TabLinks tabs={tabs} active={status} param="status" basePath="/astrologers" params={params} className="px-2" />
        <FilterBar searchPlaceholder="Search name, phone, ID or city" filters={filters} />
        <DataTable
          columns={COLUMNS[status]}
          rows={data.rows}
          basePath="/astrologers"
          params={params}
          rowHref={(a) => `/astrologers/${a.id}`}
          empty={{ title: status === "pending" ? "No pending applications" : "No astrologers found" }}
        />
        <Pagination {...data} basePath="/astrologers" params={params} />
      </Card>
    </>
  );
}
