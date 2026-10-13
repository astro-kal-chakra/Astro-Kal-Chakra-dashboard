import { Lock, ShieldCheck, ShieldOff } from "lucide-react";
import { checkAccess } from "@/lib/session";
import { getAdmins, getRoles } from "@/services";
import { flatParams } from "@/lib/url";
import { formatDateTime, timeAgo } from "@/lib/utils";
import { AdminPresence } from "./_components/AdminPresence";
import { AutoRefresh } from "../sessions/live/_components/AutoRefresh";
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

const LOGOUT_REASONS = {
  signed_out: "Signed out",
  idle_timeout: "30 min inactive",
  signed_in_elsewhere: "Signed in on another device",
  revoked: "Signed out by an admin",
};

export default async function AdminsPage({ searchParams }) {
  // The backend enforces the same "admins" module check on every endpoint.
  const { denied } = await checkAccess("admins");
  if (denied) return denied;

  const sp = flatParams(await searchParams);
  const [admins, { roles }] = await Promise.all([getAdmins(), getRoles()]);
  const tab = sp.tab === "roles" ? "roles" : "admins";

  const roleMap = Object.fromEntries(roles.map((r) => [r.key, r]));
  const roleOptions = roles.map((r) => ({ value: r.key, label: r.name }));
  const tabs = [
    { value: "admins", label: "Admins", count: admins.length },
    { value: "roles", label: "Roles & permissions", count: roles.length },
  ];

  const columns = [
    { key: "name", label: "Admin", render: (a) => <PersonCell name={a.name} sub={a.id} /> },
    { key: "email", label: "Email", hideOnMobile: true },
    {
      key: "role",
      label: "Role",
      render: (a) => (
        <span className="flex flex-wrap items-center gap-1">
          <Badge tone={ROLE_TONES[a.role] ?? "info"}>{roleMap[a.role]?.name ?? a.role}</Badge>
          {a.customAccess && <Badge tone="warning">Custom access</Badge>}
        </span>
      ),
    },
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
      key: "presence",
      label: "Now",
      render: (a) => (a.status === "active" ? <AdminPresence presence={a.presence} lastActiveAt={a.lastActiveAt} /> : <span className="text-muted">—</span>),
    },
    {
      key: "lastLoginAt",
      label: "Last login",
      hideOnMobile: true,
      render: (a) =>
        a.status === "invited" ? (
          <span className="text-muted">Invite sent{a.inviteExpiresAt ? ` · expires ${formatDateTime(a.inviteExpiresAt)}` : ""}</span>
        ) : a.lastLoginAt ? (
          <span className="block">
            <span className="block text-text">{formatDateTime(a.lastLoginAt)}</span>
            <span className="block text-xs text-muted">{timeAgo(a.lastLoginAt)}</span>
          </span>
        ) : (
          <span className="text-muted">Never</span>
        ),
    },
    {
      key: "lastLogoutAt",
      label: "Last logout",
      hideOnMobile: true,
      render: (a) =>
        a.lastLogoutAt ? (
          <span className="block">
            <span className="block text-text">{formatDateTime(a.lastLogoutAt)}</span>
            <span className="block text-xs text-muted">{LOGOUT_REASONS[a.lastLogoutReason] ?? "Signed out"}</span>
          </span>
        ) : (
          <span className="text-muted">—</span>
        ),
    },
    {
      key: "actions",
      label: <span className="sr-only">Actions</span>,
      align: "right",
      render: (a) => (
        <AdminRowActions
          admin={{ id: a.id, name: a.name, email: a.email, role: a.role, status: a.status, twoFactor: a.twoFactor, permissionOverrides: a.permissionOverrides }}
          roleOptions={roleOptions}
          rolePermissions={roleMap[a.role]?.permissions ?? {}}
        />
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Admin management"
        description="Who can sign in to the admin panel, and what they can do."
        actions={
          <>
            {tab === "admins" && <AutoRefresh seconds={30} />}
            <InviteAdminButton roleOptions={roleOptions} />
          </>
        }
      />

      <div className="space-y-4 lg:space-y-5">
        <Card>
          <TabLinks tabs={tabs} active={tab} basePath="/admins" params={sp} className="px-2" />
          {tab === "admins" && <DataTable rows={admins} columns={columns} empty={{ title: "No admins yet" }} />}
          {tab === "roles" && (
            <CardBody className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {roles.map((r) => (
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
                      <span className="font-semibold text-text tabular-nums">{r.members ?? 0}</span> active member{r.members === 1 ? "" : "s"}
                    </span>
                    <span className="tabular-nums">{Object.keys(r.permissions).length} modules</span>
                  </div>
                </div>
              ))}
            </CardBody>
          )}
        </Card>

        {tab === "roles" && <PermissionMatrix roles={roles.map(({ key, name, description, system, permissions, refundLimit }) => ({ key, name, description, system, permissions, refundLimit }))} />}
      </div>
    </>
  );
}
