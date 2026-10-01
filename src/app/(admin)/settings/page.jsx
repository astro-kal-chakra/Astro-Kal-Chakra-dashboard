import { checkAccess } from "@/lib/session";
import { getSettings } from "@/services";
import { PageHeader } from "@/components/ui/PageHeader";
import { SettingsForm } from "./_components/SettingsForm";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  // Super Admin only (only that role has the "settings" module). The backend enforces the same check.
  const { denied } = await checkAccess("settings");
  if (denied) return denied;

  const settings = await getSettings();

  return (
    <>
      <PageHeader title="Settings" description="Platform-wide rules. Every change is recorded in the audit log." />
      <SettingsForm initial={settings} />
    </>
  );
}
