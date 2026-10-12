"use client";

import { useMemo, useState } from "react";
import { Info } from "lucide-react";
import { ACTIONS, MODULES } from "@/config/permissions";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Field, Input } from "@/components/ui/Input";
import { useToast } from "@/providers/ToastProvider";
import { cn } from "@/lib/utils";
import { setAdminPermissions } from "@/actions/admins";

/** Role permissions + this admin's grants − revokes (any action implies view; no view = no module). */
function effective(role, grant, revoke) {
  const out = {};
  for (const m of MODULES) {
    const set = new Set([...(role[m.key] ?? []), ...(grant[m.key] ?? [])]);
    if (set.size) set.add("view");
    for (const a of revoke[m.key] ?? []) set.delete(a);
    if ((revoke[m.key] ?? []).includes("view")) set.clear();
    const list = ACTIONS.filter((a) => set.has(a));
    if (list.length) out[m.key] = list;
  }
  return out;
}

/**
 * Super Admin only: adjust what one admin can do without changing their role.
 * Cells show where access comes from: the role (grey), added for this person (green) or
 * removed for this person (red). The backend applies it on the admin's next page load.
 */
export function AccessEditor({ admin, rolePermissions = {}, roleName, open, onClose }) {
  const toast = useToast();
  const [grant, setGrant] = useState(() => structuredClone(admin.permissionOverrides?.grant ?? {}));
  const [revoke, setRevoke] = useState(() => structuredClone(admin.permissionOverrides?.revoke ?? {}));
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const eff = useMemo(() => effective(rolePermissions, grant, revoke), [rolePermissions, grant, revoke]);

  // Work out what this admin should have, then store only the differences from the role.
  const toggle = (mod, action) => {
    const current = new Set(eff[mod] ?? []);
    if (current.has(action)) {
      if (action === "view") current.clear(); // no view → nothing else in the module
      else current.delete(action);
    } else {
      current.add(action);
      current.add("view"); // any action needs view
    }
    const role = new Set(rolePermissions[mod] ?? []);
    const added = ACTIONS.filter((a) => current.has(a) && !role.has(a));
    const removed = ACTIONS.filter((a) => !current.has(a) && role.has(a));
    setGrant((g) => ({ ...g, [mod]: added }));
    setRevoke((r) => ({ ...r, [mod]: removed }));
  };

  const reset = () => {
    setGrant({});
    setRevoke({});
  };

  const save = async () => {
    if (reason.trim().length < 3) return toast("Add a reason for the change", { type: "error" });
    setBusy(true);
    const r = await setAdminPermissions(admin.id, grant, revoke, reason);
    setBusy(false);
    if (!r.ok) return toast(r.error.message, { type: "error" });
    toast("Access updated", { description: `${admin.name} · applies on their next page load · logged to audit` });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Access · ${admin.name}`}
      description={`Role: ${roleName}. Tick or untick to give or take away access for this admin only.`}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={reset}>
            Reset to role
          </Button>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={busy} onClick={save}>
            Save access
          </Button>
        </>
      }
    >
      <div className="space-y-4 text-left">
        <div className="flex flex-wrap gap-3 text-xs text-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-3 rounded bg-surface-3 ring-1 ring-border-strong" /> From role
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-3 rounded bg-success-soft ring-1 ring-success" /> Added for this admin
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-3 rounded bg-danger-soft ring-1 ring-danger" /> Removed for this admin
          </span>
        </div>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2 text-xs font-semibold tracking-wide text-muted uppercase">
                <th className="px-3 py-2 text-left">Module</th>
                {ACTIONS.map((a) => (
                  <th key={a} className="px-3 py-2 text-center capitalize">
                    {a}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {MODULES.map((m) => (
                <tr key={m.key}>
                  <th scope="row" className="px-3 py-2 text-left font-medium whitespace-nowrap text-text">
                    {m.label}
                  </th>
                  {ACTIONS.map((a) => {
                    const fromRole = (rolePermissions[m.key] ?? []).includes(a);
                    const on = (eff[m.key] ?? []).includes(a);
                    const added = on && !fromRole;
                    const removed = !on && fromRole;
                    return (
                      <td key={a} className={cn("px-3 py-2 text-center", added && "bg-success-soft", removed && "bg-danger-soft")}>
                        <input
                          type="checkbox"
                          checked={on}
                          onChange={() => toggle(m.key, a)}
                          aria-label={`${m.label}: ${a}`}
                          className={cn("size-4 cursor-pointer", added ? "accent-[var(--success)]" : removed ? "accent-[var(--danger)]" : "accent-primary")}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="flex items-start gap-2 rounded-lg bg-surface-2 px-3 py-2.5 text-xs text-muted">
          <Info className="mt-0.5 size-3.5 shrink-0" />
          Changing their role later keeps these personal changes. Giving access to Settings or Admin management lets them change platform rules — only do that for trusted staff.
        </p>
        <Field label="Reason" htmlFor="acc-reason" help="Saved in the audit log.">
          <Input id="acc-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Covering refunds while Finance is on leave" />
        </Field>
      </div>
    </Modal>
  );
}
