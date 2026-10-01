import { Flag, Search } from "lucide-react";
import { checkAccess } from "@/lib/session";
import { can } from "@/config/permissions";
import { getChatSessions } from "@/services";
import { flatParams } from "@/lib/url";
import { formatCurrency, formatDateTime, formatDuration, formatNumber } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DataTable, Pagination } from "@/components/ui/Table";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { PersonCell } from "@/components/ui/Avatar";
import { FilterBar } from "@/components/common/FilterBar";

export const metadata = { title: "Chats" };

export default async function ChatsPage({ searchParams }) {
  const { admin, denied } = await checkAccess("chats");
  if (denied) return denied;

  const params = flatParams(await searchParams);
  const data = await getChatSessions(params);

  const columns = [
    { key: "id", label: "Session", render: (s) => <span className="font-mono text-xs">{s.id}</span> },
    { key: "userName", label: "User", render: (s) => <PersonCell name={s.userName} sub={s.userId} /> },
    { key: "astrologerName", label: "Astrologer", hideOnMobile: true },
    { key: "duration", label: "Duration", align: "right", render: (s) => formatDuration(s.duration) },
    { key: "amount", label: "Amount", align: "right", hideOnMobile: true, render: (s) => (s.free ? <Badge tone="info">Free</Badge> : formatCurrency(s.amount)) },
    { key: "status", label: "Status", hideOnMobile: true, render: (s) => <StatusBadge status={s.status} /> },
    {
      key: "flagged",
      label: "Flags",
      render: (s) =>
        s.flagged ? (
          <Badge tone="danger">
            <Flag className="size-3" /> Flagged
          </Badge>
        ) : (
          <span className="text-muted">—</span>
        ),
    },
    { key: "startedAt", label: "Started", render: (s) => formatDateTime(s.startedAt) },
  ];

  return (
    <>
      <PageHeader
        title="Chats"
        description={`${formatNumber(data.total)} chat sessions · transcripts open only with a logged reason`}
        actions={
          <>
            <Button size="sm" href="/chats/flagged" icon={<Flag />}>
              Flagged
            </Button>
            {/* Backend enforces the same chats:delete check on keyword search. */}
            {can(admin.role, "chats", "delete") && (
              <Button size="sm" href="/chats/search" icon={<Search />}>
                Keyword search
              </Button>
            )}
          </>
        }
      />
      <Card>
        <FilterBar searchPlaceholder="Search session ID, user or astrologer" />
        <DataTable columns={columns} rows={data.rows} basePath="/chats" params={params} rowHref={(s) => `/chats/${s.id}`} empty={{ title: "No chat sessions found" }} />
        <Pagination {...data} basePath="/chats" params={params} />
      </Card>
    </>
  );
}
