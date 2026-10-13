"use client";

import { useState } from "react";
import {
  CircleCheck,
  KeyRound,
  Send,
  ShieldPlus,
  UserCog,
  UserX,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Field, Select } from "@/components/ui/Input";
import { ActionButton } from "@/components/common/ActionButton";
import { useAdmin } from "@/providers/AdminProvider";
import { useToast } from "@/providers/ToastProvider";
import {
  changeAdminRole,
  deactivateAdmin,
  inviteAdmin,
  reactivateAdmin,
  resetAdmin2fa,
} from "@/actions/admins";
import { InviteLinkDialog } from "./InviteLinkDialog";
import { AccessEditor } from "./AccessEditor";

const REASONS = [
  "Left the company",
  "Role change",
  "Security concern",
  "Inactive account",
  "Returned to the team",
];

/**
 * Per-row admin actions. Each is hidden without admins:edit; the backend
 * enforces the same check and audit-logs every change.
 */
export function AdminRowActions({ admin, roleOptions, rolePermissions }) {
  const { admin: me, can } = useAdmin();
  const toast = useToast();
  const [roleOpen, setRoleOpen] = useState(false);
  const [role, setRole] = useState(admin.role);
  const [current, setCurrent] = useState(admin.role);
  const [status, setStatus] = useState(admin.status);
  const [busy, setBusy] = useState(false);
  const [accessOpen, setAccessOpen] = useState(false);
  const [link, setLink] = useState(null);

  if (!can("admins", "edit")) return null;
  const self = me?.id === admin.id;
  // Only a Super Admin (by real role, not a preview) can give or take away personal access.
  const canAccess =
    me?.realRole?.key === "super_admin" &&
    !self &&
    current !== "super_admin" &&
    status !== "invited";
  const roleLabel = (key) =>
    roleOptions.find((r) => r.value === key)?.label ?? key;

  const saveRole = async () => {
    setBusy(true);
    const r = await changeAdminRole(admin.id, role);
    setBusy(false);
    if (!r.ok) return toast(r.error.message, { type: "error" });
    setRoleOpen(false);
    toast("Role changed", {
      description: `${admin.name}: ${roleLabel(current)} → ${roleLabel(role)}`,
    });
    setCurrent(role);
  };

  // Pending invite: a fresh link (the old one stops working), emailed if email is set up, else shown to share
  const resendInvite = async () => {
    setBusy(true);
    const r = await inviteAdmin({
      name: admin.name || admin.email?.split("@")[0],
      email: admin.email,
      role: current,
    });
    setBusy(false);
    if (!r.ok) return toast(r.error.message, { type: "error" });
    const { emailSent, inviteUrl, expiresAt } = r.data?.data ?? {};
    if (inviteUrl)
      setLink({
        url: inviteUrl,
        email: admin.email,
        name: admin.name,
        role: roleLabel(current),
        expiresAt,
        emailSent,
      });
    else
      toast(emailSent ? "Invite sent again" : "Invite renewed", {
        description: admin.email,
      });
  };

  return (
    <div className="flex justify-end gap-1">
      <Button
        size="xs"
        variant="ghost"
        icon={<UserCog />}
        onClick={() => setRoleOpen(true)}
        disabled={self}
        title={self ? "You can't change your own role" : undefined}
      >
        Role
      </Button>
      {canAccess && (
        <Button
          size="xs"
          variant="ghost"
          icon={<ShieldPlus />}
          onClick={() => setAccessOpen(true)}
        >
          Access
        </Button>
      )}
      {status === "invited" && (
        <Button
          size="xs"
          variant="ghost"
          icon={<Send />}
          loading={busy}
          onClick={resendInvite}
        >
          Resend invite
        </Button>
      )}
      <InviteLinkDialog invite={link} onClose={() => setLink(null)} />
      {status !== "invited" && (
        <ActionButton
          module="admins"
          confirm
          size="xs"
          variant="ghost"
          icon={<KeyRound />}
          dialogTitle="Reset 2FA"
          dialogDescription={`${admin.name} is signed out and must set up two-factor authentication again on next login.`}
          confirmLabel="Reset 2FA"
          dialogVariant="danger"
          success="2FA reset"
          run={() => resetAdmin2fa(admin.id)}
          successDescription={`${admin.name} must re-enrol on next login`}
        >
          Reset 2FA
        </ActionButton>
      )}
      {!self &&
        (status === "invited" ? null : status === "active" ? (
          <ActionButton
            module="admins"
            reason
            reasons={REASONS}
            size="xs"
            variant="danger-soft"
            icon={<UserX />}
            dialogTitle={`Deactivate ${admin.name}`}
            dialogDescription="They are signed out of all sessions and can't sign in until reactivated."
            confirmLabel="Deactivate"
            success="Admin deactivated"
            run={(why) => deactivateAdmin(admin.id, why)}
            onDone={() => setStatus("deactivated")}
          >
            Deactivate
          </ActionButton>
        ) : (
          <ActionButton
            module="admins"
            reason
            reasons={REASONS}
            size="xs"
            variant="soft"
            icon={<CircleCheck />}
            dialogTitle={`Reactivate ${admin.name}`}
            dialogDescription="They can sign in again with their existing role. 2FA setup is required."
            confirmLabel="Reactivate"
            success="Admin reactivated"
            run={(why) => reactivateAdmin(admin.id, why)}
            onDone={() => setStatus("active")}
          >
            Reactivate
          </ActionButton>
        ))}

      {accessOpen && (
        <AccessEditor
          admin={admin}
          rolePermissions={rolePermissions}
          roleName={roleLabel(current)}
          open
          onClose={() => setAccessOpen(false)}
        />
      )}
      <Modal
        open={roleOpen}
        onClose={() => setRoleOpen(false)}
        title="Change role"
        description={`${admin.name} · currently ${roleLabel(current)}`}
        size="sm"
        footer={
          <>
            <Button onClick={() => setRoleOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              loading={busy}
              disabled={role === current}
              onClick={saveRole}
            >
              Change role
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-left">
          <Field label="New role" htmlFor={`role-${admin.id}`}>
            <Select
              id={`role-${admin.id}`}
              value={role}
              onChange={(e) => setRole(e.target.value)}
              options={roleOptions}
            />
          </Field>
          <p className="text-xs whitespace-normal text-muted">
            Takes effect on their next page load. The change is recorded in the
            audit log.
          </p>
        </div>
      </Modal>
    </div>
  );
}
