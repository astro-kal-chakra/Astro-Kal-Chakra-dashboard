import { Lock } from "lucide-react";
import { checkAccess } from "@/lib/session";
import { getAuditLogs } from "@/services";
import { buildHref, flatParams } from "@/lib/url";
import { MODULES } from "@/config/permissions";
import { formatDateTime, formatNumber } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { DataTable, Pagination } from "@/components/ui/Table";
import { PersonCell } from "@/components/ui/Avatar";
import { FilterBar } from "@/components/common/FilterBar";
import { ExportButton } from "@/components/common/ExportButton";
import { AuditLogModal } from "./_components/AuditLogModal";

export const metadata = { title: "Audit logs" };

const MODULE_LABELS = { ...Object.fromEntries(MODULES.map((m) => [m.key, m.label])), auth: "Sign-in" };
const MODULE_OPTIONS = ["users", "astrologers", "sessions", "chats", "refunds", "payouts", "settings", "marketing", "auth"].map((m) => ({ value: m, label: MODULE_LABELS[m] }));

export default async function AuditLogsPage({ searchParams }) {
  // Read-only page. The backend exposes no update/delete endpoints for audit logs.
  const { denied } = await checkAccess("audit");
  if (denied) return denied;

  const params = flatParams(await searchParams);
  const data = await getAuditLogs(params);
  const { log: openId, ...listParams } = params;
  const openLog = openId ? (data.rows.find((l) => l.id === openId) ?? null) : null;

  const filters = [
    { name: "admin", label: "All admins", options: data.admins.map((a) => ({ value: a.id, label: a.name })) },
    { name: "module", label: "All modules", options: MODULE_OPTIONS },
  ];

  const columns = [
    { key: "createdAt", label: "Time", render: (l) => <span className="tabular-nums">{formatDateTime(l.createdAt)}</span> },
    { key: "adminName", label: "Admin", render: (l) => <PersonCell name={l.adminName} sub={l.adminId} /> },
    {
      key: "action",
      label: "Action",
      render: (l) => (
        <div>
          <p className="font-semibold text-text">{l.label}</p>
          <p className="font-mono text-xs text-muted">{l.action}</p>
        </div>
      ),
    },
    { key: "target", label: "Target", render: (l) => <span className="font-mono text-xs">{l.target}</span> },
    { key: "reason", label: "Reason", hideOnMobile: true, className: "max-w-64 truncate", render: (l) => l.reason ?? <span className="text-muted">—</span> },
    { key: "ip", label: "IP", hideOnMobile: true, render: (l) => <span className="font-mono text-xs">{l.ip}</span> },
  ];

  return (
    <>
      <PageHeader
        title="Audit logs"
        description={`${formatNumber(data.total)} entries match your filters`}
        actions={
          <ExportButton
            module="audit"
            filename="audit-logs.csv"
            rows={data.rows.map((l) => ({
              id: l.id,
              time: new Date(l.createdAt).toISOString(),
              admin: l.adminName,
              adminId: l.adminId,
              action: l.action,
              label: l.label,
              module: l.module,
              target: l.target,
              reason: l.reason ?? "",
              ip: l.ip,
              userAgent: l.userAgent,
            }))}
          />
        }
      />

      <div className="mb-4 flex items-start gap-3 rounded-2xl border border-info/30 bg-info-soft px-4 py-3 lg:mb-5">
        <Lock className="mt-0.5 size-4 shrink-0 text-info" />
        <p className="text-sm text-text-2">
          <span className="font-semibold text-text">Logs are append-only — they can&apos;t be edited or deleted.</span> Every admin action is recorded with the admin, time, IP and reason.
        </p>
      </div>

      <Card>
        <FilterBar searchPlaceholder="Search action, target, admin or IP" filters={filters} dates />
        <DataTable
          columns={columns}
          rows={data.rows}
          basePath="/audit-logs"
          params={listParams}
          rowHref={(l) => buildHref("/audit-logs", listParams, { log: l.id, page: listParams.page })}
          empty={{ title: "No log entries", description: "Try a wider date range or clear the filters." }}
        />
        <Pagination {...data} basePath="/audit-logs" params={listParams} />
      </Card>

      <AuditLogModal log={openLog} moduleLabel={openLog ? MODULE_LABELS[openLog.module] : null} closeHref={buildHref("/audit-logs", listParams, { page: listParams.page })} />
    </>
  );
}
