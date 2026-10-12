import { checkAccess } from "@/lib/session";
import { getPushCampaigns } from "@/services";
import { flatParams } from "@/lib/url";
import { formatDateTime, formatNumber, formatPercent } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { DataTable, Pagination } from "@/components/ui/Table";
import { FilterBar } from "@/components/common/FilterBar";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { PushComposer } from "../_components/PushComposer";
import { ActionButton } from "@/components/common/ActionButton";
import { cancelPush, sendPushDraft } from "@/actions/marketing";

export const metadata = { title: "Push notifications" };

export default async function PushPage({ searchParams }) {
  const { denied } = await checkAccess("marketing");
  if (denied) return denied;

  const params = flatParams(await searchParams);
  const data = await getPushCampaigns(params);
  const push = data.rows;

  const columns = [
    {
      key: "title",
      label: "Campaign",
      className: "max-w-72",
      render: (c) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-text">{c.title}</p>
          <p className="truncate font-mono text-xs text-muted">{c.deepLink}</p>
        </div>
      ),
    },
    {
      key: "audience",
      label: "Audience",
      hideOnMobile: true,
      render: (c) => (
        <span className="inline-flex items-center gap-1.5">
          <Badge tone={c.recipients === "astrologers" ? "accent" : "neutral"}>{c.recipients === "astrologers" ? "Astrologers" : "Users"}</Badge>
          {c.audience}
        </span>
      ),
    },
    { key: "sent", label: "Sent", align: "right", render: (c) => (c.sent ? formatNumber(c.sent) : "—") },
    { key: "opened", label: "Opened", align: "right", hideOnMobile: true, render: (c) => (c.sent ? formatNumber(c.opened) : "—") },
    { key: "rate", label: "Open rate", align: "right", render: (c) => (c.sent ? <span className="font-semibold text-text">{formatPercent((c.opened / c.sent) * 100)}</span> : "—") },
    { key: "status", label: "Status", render: (c) => <StatusBadge status={c.status} /> },
    { key: "at", label: "When", hideOnMobile: true, render: (c) => formatDateTime(c.at) },
    {
      key: "actions",
      label: "",
      align: "right",
      render: (c) =>
        c.status === "draft" ? (
          <ActionButton module="marketing" size="xs" confirm dialogTitle="Send campaign" dialogDescription={`Send “${c.title}” to ${c.audience} now.`} confirmLabel="Send now" success="Campaign sent" run={sendPushDraft.bind(null, c.id)}>
            Send
          </ActionButton>
        ) : c.status === "scheduled" ? (
          <ActionButton module="marketing" size="xs" variant="ghost" confirm dialogTitle="Cancel campaign" dialogDescription={`“${c.title}” won't be sent.`} confirmLabel="Cancel campaign" dialogVariant="danger" success="Campaign cancelled" run={cancelPush.bind(null, c.id)}>
            Cancel
          </ActionButton>
        ) : null,
    },
  ];

  return (
    <>
      <PageHeader title="Push notifications" description="Send or schedule notifications to app users or astrologers." />
      <div className="space-y-4 lg:space-y-5">
        <PushComposer />
        <Card>
          <CardHeader title="Campaign history" description={`${formatNumber(data.total)} campaigns`} />
          <FilterBar searchPlaceholder="Search title or campaign ID" />
          <DataTable columns={columns} rows={push} empty={{ title: params.q ? "No matching campaigns" : "No campaigns yet" }} />
          <Pagination {...data} basePath="/marketing/push" params={params} />
        </Card>
      </div>
    </>
  );
}
