"use client";

import { useState } from "react";
import { ShieldCheck, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Field, Input, Select } from "@/components/ui/Input";
import { useAdmin } from "@/providers/AdminProvider";
import { useToast } from "@/providers/ToastProvider";

/** Invite a new admin. Hidden without admins:edit — the backend enforces the same check. */
export function InviteAdminButton({ roleOptions }) {
  const { can } = useAdmin();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!can("admins", "edit")) return null;

  const submit = async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    setBusy(true);
    await new Promise((r) => setTimeout(r, 400)); // simulated POST /admins/invite
    setBusy(false);
    setOpen(false);
    const role = roleOptions.find((r) => r.value === data.role)?.label;
    toast("Invite sent", { description: `${data.email} · ${role}` });
  };

  return (
    <>
      <Button variant="primary" size="sm" icon={<UserPlus />} onClick={() => setOpen(true)}>
        Invite admin
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Invite admin" description="They get an email link to set a password.">
        <form onSubmit={submit} className="space-y-4">
          <Field label="Full name" htmlFor="inv-name">
            <Input id="inv-name" name="name" required placeholder="Priya Sharma" autoComplete="off" />
          </Field>
          <Field label="Work email" htmlFor="inv-email">
            <Input id="inv-email" name="email" type="email" required placeholder="priya@astroadmin.in" autoComplete="off" />
          </Field>
          <Field label="Role" htmlFor="inv-role" help="Pick the smallest role that covers their work.">
            <Select id="inv-role" name="role" required placeholder="Select a role" options={roleOptions} defaultValue="" />
          </Field>
          <p className="flex items-start gap-2 rounded-lg bg-info-soft px-3 py-2.5 text-xs text-info">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0" />
            Two-factor authentication setup is mandatory on first login. The invite link expires in 48 hours.
          </p>
          <div className="flex justify-end gap-2 pt-1">
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" loading={busy}>
              Send invite
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
