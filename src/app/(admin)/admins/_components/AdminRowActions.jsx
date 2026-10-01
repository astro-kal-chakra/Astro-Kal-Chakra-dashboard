"use client";

import { useState } from "react";
import { CircleCheck, KeyRound, UserCog, UserX } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Field, Select } from "@/components/ui/Input";
import { ActionButton } from "@/components/common/ActionButton";
import { useAdmin } from "@/providers/AdminProvider";
import { useToast } from "@/providers/ToastProvider";

const REASONS = ["Left the company", "Role change", "Security concern", "Inactive account", "Returned to the team"];

/**
 * Per-row admin actions. Each is hidden without admins:edit; the backend
 * enforces the same check and audit-logs every change.
 */
export function AdminRowActions({ admin, roleOptions }) {
  const { admin: me, can } = useAdmin();
  const toast = useToast();
  const [roleOpen, setRoleOpen] = useState(false);
  const [role, setRole] = useState(admin.role);
  const [current, setCurrent] = useState(admin.role);
  const [status, setStatus] = useState(admin.status);
  const [busy, setBusy] = useState(false);

  if (!can("admins", "edit")) return null;
  const self = me?.id === admin.id;
  const roleLabel = (key) => roleOptions.find((r) => r.value === key)?.label ?? key;

  const saveRole = async () => {
    setBusy(true);
    await new Promise((r) => setTimeout(r, 350)); // simulated PATCH /admins/:id
    setBusy(false);
    setRoleOpen(false);
    toast("Role changed", { description: `${admin.name}: ${roleLabel(current)} → ${roleLabel(role)}` });
    setCurrent(role);
  };

  return (
    <div className="flex justify-end gap-1">
      <Button size="xs" variant="ghost" icon={<UserCog />} onClick={() => setRoleOpen(true)} disabled={self} title={self ? "You can't change your own role" : undefined}>
        Role
      </Button>
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
        successDescription={`${admin.name} must re-enrol on next login`}
      >
        Reset 2FA
      </ActionButton>
      {!self &&
        (status === "active" ? (
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
            onDone={() => setStatus("active")}
          >
            Reactivate
          </ActionButton>
        ))}

      <Modal
        open={roleOpen}
        onClose={() => setRoleOpen(false)}
        title="Change role"
        description={`${admin.name} · currently ${roleLabel(current)}`}
        size="sm"
        footer={
          <>
            <Button onClick={() => setRoleOpen(false)}>Cancel</Button>
            <Button variant="primary" loading={busy} disabled={role === current} onClick={saveRole}>
              Change role
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-left">
          <Field label="New role" htmlFor={`role-${admin.id}`}>
            <Select id={`role-${admin.id}`} value={role} onChange={(e) => setRole(e.target.value)} options={roleOptions} />
          </Field>
          <p className="text-xs whitespace-normal text-muted">Takes effect on their next page load. The change is recorded in the audit log.</p>
        </div>
      </Modal>
    </div>
  );
}
