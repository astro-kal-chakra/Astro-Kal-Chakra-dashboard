import { AuthShell } from "../login/AuthShell";
import { AcceptInviteForm } from "./AcceptInviteForm";

export const metadata = { title: "Accept invite" };

/** Opened from the invite email: `/accept-invite?token=…` (valid 48 hours). */
export default async function AcceptInvitePage({ searchParams }) {
  const { token } = await searchParams;
  return (
    <AuthShell>
      <AcceptInviteForm token={typeof token === "string" ? token : ""} />
    </AuthShell>
  );
}
