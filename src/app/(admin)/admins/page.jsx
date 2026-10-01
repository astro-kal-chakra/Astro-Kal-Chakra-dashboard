import { Lock, ShieldCheck, ShieldOff } from "lucide-react";
import { checkAccess } from "@/lib/session";
import { getAdmins } from "@/services";
import { flatParams } from "@/lib/url";
import { ROLES, ROLE_MAP } from "@/config/permissions";
import { formatDate, timeAgo } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/Table";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { PersonCell } from "@/components/ui/Avatar";
import { TabLinks } from "@/components/ui/Tabs";
import { InviteAdminButton } from "./_components/InviteAdminButton";
import { AdminRowActions } from "./_components/AdminRowActions";
import { PermissionMatrix } from "./_components/PermissionMatrix";

export const metadata = { title: "Admin management" };

const ROLE_TONES = {
  super_admin: "primary",
  ops_admin: "info",
  support_agent: "neutral",
  finance: "success",
  moderator: "warning",
  marketing: "accent",
};

export default async function AdminsPage({ searchParams }) {
  // The backend enforces the same "admins" module check on every endpoint.
  const { denied } = await checkAccess("admins");
  if (denied) return denied;

  const sp = flatParams(await searchParams);
  const admins = await getAdmins();
  const tab = sp.tab === "roles" ? "roles" : "admins";

  const memberCounts = Object.fromEntries(ROLES.map((r) => [r.key, admins.filter((a) => a.role === r.key && a.status === "active").length]));
  const roleOptions = ROLES.map((r) => ({ value: r.key, label: r.name }));
  const tabs = [
    { value: "admins", label: "Admins", count: admins.length },
    { value: "roles", label: "Roles & permissions", count: ROLES.length },
  ];

  const columns = [
    { key: "name", label: "Admin", render: (a) => <PersonCell name={a.name} sub={a.id} /> },
    { key: "email", label: "Email", hideOnMobile: true },
    { key: "role", label: "Role", render: (a) => <Badge tone={ROLE_TONES[a.role]}>{ROLE_MAP[a.role]?.name ?? a.role}</Badge> },
    {
      key: "twoFactor",
      label: "2FA",
      render: (a) =>
        a.twoFactor ? (
          <Badge tone="success">
            <ShieldCheck className="size-3.5" /> 2FA on
          </Badge>
        ) : (
          <Badge tone="danger">
            <ShieldOff className="size-3.5" /> 2FA off
          </Badge>
        ),
    },
    { key: "status", label: "Status", render: (a) => <StatusBadge status={a.status} /> },
    {
      key: "lastLoginAt",
      label: "Last login",
      hideOnMobile: true,
      render: (a) => <span title={formatDate(a.lastLoginAt)}>{timeAgo(a.lastLoginAt)}</span>,
    },
    {
      key: "actions",
      label: <span className="sr-only">Actions</span>,
      align: "right",
      render: (a) => <AdminRowActions admin={{ id: a.id, name: a.name, role: a.role, status: a.status, twoFactor: a.twoFactor }} roleOptions={roleOptions} />,
    },
  ];

  return (
    <>
      <PageHeader
        title="Admin management"
        description="Who can sign in to the admin panel, and what they can do."
        actions={<InviteAdminButton roleOptions={roleOptions} />}
      />

      <div className="space-y-4 lg:space-y-5">
        <Card>
          <TabLinks tabs={tabs} active={tab} basePath="/admins" params={sp} className="px-2" />
          {tab === "admins" && <DataTable rows={admins} columns={columns} empty={{ title: "No admins yet" }} />}
          {tab === "roles" && (
            <CardBody className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {ROLES.map((r) => (
                <div key={r.key} className="flex flex-col rounded-xl border border-border p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold text-text">{r.name}</p>
                    {r.system && (
                      <Badge>
                        <Lock className="size-3" /> System
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 flex-1 text-sm text-muted">{r.description}</p>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted">
                    <span>
                      <span className="font-semibold text-text tabular-nums">{memberCounts[r.key]}</span> active member{memberCounts[r.key] === 1 ? "" : "s"}
                    </span>
                    <span className="tabular-nums">{Object.keys(r.permissions).length} modules</span>
                  </div>
                </div>
              ))}
            </CardBody>
          )}
        </Card>

        {tab === "roles" && <PermissionMatrix roles={ROLES.map(({ key, name, description, system, permissions }) => ({ key, name, description, system, permissions }))} />}
      </div>
    </>
  );
}
