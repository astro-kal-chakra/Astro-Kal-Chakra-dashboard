import { checkAccess } from "@/lib/session";
import { getMarketing } from "@/services";
import { formatDateTime, formatNumber, formatPercent } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/Table";
import { StatusBadge } from "@/components/ui/Badge";
import { PushComposer } from "../_components/PushComposer";

export const metadata = { title: "Push notifications" };

export default async function PushPage() {
  const { denied } = await checkAccess("marketing");
  if (denied) return denied;

  const { push } = await getMarketing();

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
    { key: "audience", label: "Audience", hideOnMobile: true },
    { key: "sent", label: "Sent", align: "right", render: (c) => (c.sent ? formatNumber(c.sent) : "—") },
    { key: "opened", label: "Opened", align: "right", hideOnMobile: true, render: (c) => (c.sent ? formatNumber(c.opened) : "—") },
    { key: "rate", label: "Open rate", align: "right", render: (c) => (c.sent ? <span className="font-semibold text-text">{formatPercent((c.opened / c.sent) * 100)}</span> : "—") },
    { key: "status", label: "Status", render: (c) => <StatusBadge status={c.status} /> },
    { key: "at", label: "When", hideOnMobile: true, render: (c) => formatDateTime(c.at) },
  ];

  return (
    <>
      <PageHeader title="Push notifications" description="Send or schedule app notifications." />
      <div className="space-y-4 lg:space-y-5">
        <PushComposer />
        <Card>
          <CardHeader title="Campaign history" description={`${push.length} campaigns`} />
          <DataTable columns={columns} rows={push} empty={{ title: "No campaigns yet" }} />
        </Card>
      </div>
    </>
  );
}
