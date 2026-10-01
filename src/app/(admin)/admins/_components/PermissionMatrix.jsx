"use client";

import { useState } from "react";
import { Info, Lock, Plus, Save } from "lucide-react";
import { ACTIONS, MODULES } from "@/config/permissions";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Field, Input, Select } from "@/components/ui/Input";
import { useAdmin } from "@/providers/AdminProvider";
import { useToast } from "@/providers/ToastProvider";
import { cn } from "@/lib/utils";

const NEW = "__new";
const empty = () => Object.fromEntries(MODULES.map((m) => [m.key, []]));
const normalise = (perms = {}) => Object.fromEntries(MODULES.map((m) => [m.key, [...(perms[m.key] ?? [])]]));

/**
 * Role permission editor. System roles are read-only; custom roles can be
 * edited. The backend validates and enforces the saved matrix — this only edits it.
 */
export function PermissionMatrix({ roles }) {
  const { can } = useAdmin();
  const toast = useToast();
  const canEdit = can("admins", "edit");

  const [custom, setCustom] = useState([]);
  const [selected, setSelected] = useState(roles[0].key);
  const [perms, setPerms] = useState(() => normalise(roles[0].permissions));
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);

  const all = [...roles, ...custom];
  const role = selected === NEW ? null : all.find((r) => r.key === selected);
  const isNew = selected === NEW;
  const readOnly = !canEdit || role?.system;

  const load = (key) => {
    setSelected(key);
    if (key === NEW) {
      setPerms(empty());
      setName("");
      setDescription("");
      return;
    }
    const r = all.find((x) => x.key === key);
    setPerms(normalise(r?.permissions));
    setName(r?.name ?? "");
    setDescription(r?.description ?? "");
  };

  // Any action implies "view"; removing "view" removes everything.
  const toggle = (mod, action) =>
    setPerms((p) => {
      const has = p[mod].includes(action);
      let next;
      if (action === "view") next = has ? [] : ["view"];
      else next = has ? p[mod].filter((a) => a !== action) : [...new Set([...p[mod], "view", action])];
      return { ...p, [mod]: ACTIONS.filter((a) => next.includes(a)) };
    });

  const granted = Object.values(perms).reduce((s, a) => s + a.length, 0);

  const save = async () => {
    if (isNew && !name.trim()) {
      toast("Give the role a name", { type: "error" });
      return;
    }
    setBusy(true);
    await new Promise((r) => setTimeout(r, 400)); // simulated PUT /roles/:key
    setBusy(false);
    const clean = Object.fromEntries(Object.entries(perms).filter(([, a]) => a.length));
    if (isNew) {
      const key = `custom_${Date.now()}`;
      setCustom((c) => [...c, { key, name: name.trim(), description: description.trim(), system: false, permissions: clean }]);
      setSelected(key);
      toast("Custom role created", { description: `${name.trim()} · ${granted} permissions · logged to audit` });
    } else {
      setCustom((c) => c.map((r) => (r.key === selected ? { ...r, name: name.trim() || r.name, description, permissions: clean } : r)));
      toast("Role updated", { description: `${name.trim() || role.name} · logged to audit` });
    }
  };

  const options = [
    ...all.map((r) => ({ value: r.key, label: `${r.name}${r.system ? " (system)" : ""}` })),
    ...(canEdit ? [{ value: NEW, label: "+ New custom role" }] : []),
  ];

  return (
    <Card>
      <CardHeader
        title="Permission matrix"
        description="What each role can do in every module."
        action={
          canEdit && (
            <Button size="sm" variant="soft" icon={<Plus />} onClick={() => load(NEW)} disabled={isNew}>
              Create custom role
            </Button>
          )
        }
      />
      <CardBody className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-[minmax(0,280px)_minmax(0,1fr)] sm:items-end">
          <Field label="Role" htmlFor="matrix-role">
            <Select id="matrix-role" value={selected} onChange={(e) => load(e.target.value)} options={options} />
          </Field>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
            {role?.system && (
              <Badge>
                <Lock className="size-3" /> System role · view only
              </Badge>
            )}
            {isNew && <Badge tone="primary">New role</Badge>}
            {role && !role.system && <Badge tone="info">Custom</Badge>}
            <span className="tabular-nums">{granted} permissions granted</span>
          </div>
        </div>

        {(isNew || (role && !role.system)) && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Role name" htmlFor="matrix-name">
              <Input id="matrix-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Refund reviewer" disabled={!canEdit} />
            </Field>
            <Field label="Description" htmlFor="matrix-desc">
              <Input id="matrix-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What this role is for" disabled={!canEdit} />
            </Field>
          </div>
        )}

        {selected === "super_admin" && (
          <p className="flex items-start gap-2 rounded-lg bg-primary-soft px-3 py-2.5 text-xs text-primary-ink">
            <Info className="mt-0.5 size-3.5 shrink-0" />
            Super Admin always has full access to every module, including settings, admins and audit logs. It can&apos;t be edited, so there is always someone who can recover access.
          </p>
        )}
        {role?.system && selected !== "super_admin" && (
          <p className="flex items-start gap-2 rounded-lg bg-surface-2 px-3 py-2.5 text-xs text-muted">
            <Lock className="mt-0.5 size-3.5 shrink-0" />
            System roles can&apos;t be changed. To grant a different mix, create a custom role.
          </p>
        )}
      </CardBody>

      {/* Scrolls horizontally inside the card on small screens */}
      <div className="relative overflow-x-auto border-t border-border">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-2 text-xs font-semibold tracking-wide text-muted uppercase">
              <th scope="col" className="sticky left-0 bg-surface-2 px-4 py-2.5 text-left">
                Module
              </th>
              {ACTIONS.map((a) => (
                <th key={a} scope="col" className="px-4 py-2.5 text-center capitalize">
                  {a}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {MODULES.map((m) => (
              <tr key={m.key} className="hover:bg-surface-2">
                <th scope="row" className="sticky left-0 bg-surface px-4 py-2.5 text-left font-medium whitespace-nowrap text-text">
                  {m.label}
                </th>
                {ACTIONS.map((a) => {
                  const checked = perms[m.key]?.includes(a);
                  return (
                    <td key={a} className="px-4 py-2.5 text-center">
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={readOnly}
                        onChange={() => toggle(m.key, a)}
                        aria-label={`${m.label}: ${a}`}
                        className={cn("size-4 accent-primary", readOnly ? "cursor-not-allowed opacity-70" : "cursor-pointer")}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!readOnly && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 sm:px-5">
          <p className="text-xs text-muted">Changes apply to everyone with this role on their next page load.</p>
          <div className="flex gap-2">
            {isNew && (
              <Button size="sm" variant="ghost" onClick={() => load(roles[0].key)}>
                Cancel
              </Button>
            )}
            <Button size="sm" variant="primary" icon={<Save />} loading={busy} onClick={save}>
              {isNew ? "Create role" : "Save role"}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
