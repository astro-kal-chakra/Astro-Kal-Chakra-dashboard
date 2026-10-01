import { Clock } from "lucide-react";
import { getCurrentAdmin } from "@/lib/session";
import { getMySecurity } from "@/services/profile";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader, DescriptionList } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { PasswordForm } from "./_components/PasswordForm";
import { TwoFactorCard } from "./_components/TwoFactorCard";
import { SessionsList } from "./_components/SessionsList";

export const metadata = { title: "My profile" };

// No module check: every signed-in admin can manage their own account.
// The backend scopes these endpoints to the current admin only.
export default async function ProfilePage() {
  const [admin, security] = await Promise.all([getCurrentAdmin(), getMySecurity()]);

  return (
    <>
      <PageHeader title="My profile" description="Your account, password, two-factor authentication and sign-ins." />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-5">
        <div className="min-w-0 space-y-4 lg:space-y-5">
          <Card>
            <CardHeader title="Account" description="Ask a Super Admin to change your name, email or role." />
            <CardBody className="space-y-5">
              <div className="flex items-center gap-3">
                <Avatar name={admin.name} size="lg" />
                <div className="min-w-0">
                  <p className="truncate text-base font-bold text-text">{admin.name}</p>
                  <p className="truncate text-sm text-muted">{admin.email}</p>
                </div>
              </div>
              <DescriptionList
                items={[
                  { label: "Role", value: <Badge tone="primary">{admin.role.name}</Badge> },
                  { label: "Admin ID", value: <span className="font-mono text-xs">{admin.id}</span> },
                  { label: "Password last changed", value: formatDate(security.passwordChangedAt) },
                  { label: "Role access", value: <span className="text-sm font-normal text-text-2">{admin.role.description}</span> },
                ]}
              />
            </CardBody>
          </Card>

          <PasswordForm />
        </div>

        <div className="min-w-0 space-y-4 lg:space-y-5">
          <TwoFactorCard email={admin.email} twoFactor={security.twoFactor} />
          <SessionsList sessions={security.sessions} />
          <p className="flex items-start gap-2 rounded-2xl bg-surface-2 px-4 py-3 text-sm text-text-2">
            <Clock className="mt-0.5 size-4 shrink-0 text-muted" />
            You&apos;ll be signed out automatically after 30 minutes of inactivity.
          </p>
        </div>
      </div>
    </>
  );
}
