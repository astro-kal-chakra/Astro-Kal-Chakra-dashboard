import { MessageSquareText } from "lucide-react";
import { checkAccess } from "@/lib/session";
import { getTickets } from "@/services";
import { flatParams } from "@/lib/url";
import { formatNumber, timeAgo } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DataTable, Pagination } from "@/components/ui/Table";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { PersonCell } from "@/components/ui/Avatar";
import { TabLinks } from "@/components/ui/Tabs";
import { FilterBar } from "@/components/common/FilterBar";
import { TICKET_CATEGORIES, TICKET_PRIORITIES as PRIORITIES, TICKET_STATUSES as STATUSES } from "./_components/constants";

export const metadata = { title: "Support tickets" };

export default async function SupportInboxPage({ searchParams }) {
  const { denied } = await checkAccess("support");
  if (denied) return denied;

  const sp = flatParams(await searchParams);
  const status = STATUSES.some((s) => s.value === sp.status) ? sp.status : "open";
  const params = { ...sp, status };
  const data = await getTickets(params);

  const filters = [
    { name: "priority", label: "Any priority", options: PRIORITIES },
    { name: "category", label: "All categories", options: TICKET_CATEGORIES },
    { name: "assignee", label: "Any assignee", options: [{ value: "unassigned", label: "Unassigned" }, ...data.agents.map((a) => ({ value: a, label: a }))] },
  ];

  const columns = [
    {
      key: "subject",
      label: "Ticket",
      className: "max-w-80",
      render: (t) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-text">{t.subject}</p>
          <p className="font-mono text-xs text-muted">{t.id}</p>
        </div>
      ),
    },
    { key: "userName", label: "User", render: (t) => <PersonCell name={t.userName} sub={t.userId} /> },
    { key: "category", label: "Category", hideOnMobile: true, render: (t) => <Badge className="capitalize">{t.category}</Badge> },
    { key: "priority", label: "Priority", render: (t) => <StatusBadge status={t.priority} /> },
    {
      key: "assignee",
      label: "Assignee",
      hideOnMobile: true,
      render: (t) => (t.assignee ? <span className="text-text-2">{t.assignee}</span> : <Badge tone="warning">Unassigned</Badge>),
    },
    { key: "updatedAt", label: "Updated", render: (t) => <span className="text-muted">{timeAgo(t.updatedAt)}</span> },
  ];

  return (
    <>
      <PageHeader
        title="Support tickets"
        description={`${formatNumber(data.total)} ${status} tickets match your filters`}
        actions={
          <Button href="/support/canned-replies" icon={<MessageSquareText />} size="sm">
            Canned replies
          </Button>
        }
      />
      <Card>
        <TabLinks
          tabs={STATUSES.map((s) => ({ ...s, count: data.counts[s.value] ?? 0 }))}
          active={status}
          param="status"
          basePath="/support"
          params={sp}
          className="px-2"
        />
        <FilterBar searchPlaceholder="Search subject, user or ticket ID" filters={filters} />
        <DataTable
          columns={columns}
          rows={data.rows}
          basePath="/support"
          params={sp}
          rowHref={(t) => `/support/${t.id}`}
          empty={{ title: `No ${status} tickets`, description: "Try another tab or clear the filters." }}
        />
        <Pagination {...data} basePath="/support" params={sp} />
      </Card>
    </>
  );
}
