"use client";

import { useState } from "react";
import { Pencil, Plus, Star } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Switch } from "@/components/ui/Switch";
import { useToast } from "@/providers/ToastProvider";
import { useAdmin } from "@/providers/AdminProvider";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";

export function PackManager({ initial }) {
  const [packs, setPacks] = useState(initial);
  const [editing, setEditing] = useState(null);
  const [highlight, setHighlight] = useState(false);
  const toast = useToast();
  const { can } = useAdmin();
  // UI mirror of marketing:edit — the backend enforces the same check.
  const canEdit = can("marketing", "edit");

  const toggleActive = (p, active) => {
    setPacks((list) => list.map((x) => (x.id === p.id ? { ...x, active } : x)));
    toast(active ? "Pack activated" : "Pack hidden", { description: `${formatCurrency(p.amount)} pack ${active ? "is visible in the app" : "is no longer shown"}.` });
  };

  const open = (p) => {
    setEditing(p);
    setHighlight(Boolean(p.highlight));
  };

  const save = (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.currentTarget));
    const patch = { label: d.label, amount: Number(d.amount), bonus: Number(d.bonus), highlight };
    setPacks((list) => {
      // Only one pack can carry the "Popular" highlight.
      const cleared = highlight ? list.map((x) => ({ ...x, highlight: false })) : list;
      return editing.id ? cleared.map((x) => (x.id === editing.id ? { ...x, ...patch } : x)) : [...cleared, { id: `P${Date.now()}`, active: true, sold: 0, ...patch }];
    });
    toast(editing.id ? "Pack updated" : "Pack created", { description: `Pay ${formatCurrency(patch.amount)} · Get ${formatCurrency(patch.amount + patch.bonus)}` });
    setEditing(null);
  };

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-muted">{packs.filter((p) => p.active).length} packs shown in the app</p>
        {canEdit && (
          <Button variant="primary" size="sm" icon={<Plus />} onClick={() => open({})}>
            New pack
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-5 xl:grid-cols-3">
        {packs.map((p) => {
          const bonusPct = p.amount ? Math.round((p.bonus / p.amount) * 100) : 0;
          return (
            <Card key={p.id} className={cn("relative flex flex-col p-4", p.highlight && "border-primary ring-2 ring-primary/20", !p.active && "opacity-70")}>
              {p.highlight && (
                <span className="absolute -top-2.5 left-4 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-bold text-white shadow-soft">
                  <Star className="size-3 fill-current" /> Popular
                </span>
              )}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-muted">{p.label}</p>
                  <p className="mt-1 text-lg font-extrabold text-text tabular-nums">
                    Pay {formatCurrency(p.amount)} <span className="text-muted">·</span> <span className="text-success">Get {formatCurrency(p.amount + p.bonus)}</span>
                  </p>
                </div>
                <Switch checked={p.active} onChange={(v) => toggleActive(p, v)} disabled={!canEdit} label={`Show ${p.label} pack`} />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {p.bonus ? <Badge tone="success">+{bonusPct}% bonus</Badge> : <Badge>No bonus</Badge>}
                {!p.active && <Badge>Hidden</Badge>}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                <span className="text-xs text-muted">
                  <span className="font-semibold text-text tabular-nums">{formatNumber(p.sold)}</span> sold
                </span>
                {canEdit && (
                  <Button size="xs" variant="ghost" icon={<Pencil />} onClick={() => open(p)}>
                    Edit
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title={editing?.id ? "Edit recharge pack" : "New recharge pack"} size="md">
        {editing && (
          <form onSubmit={save} className="space-y-4">
            <Field label="Label" htmlFor="pk-label">
              <Input id="pk-label" name="label" required defaultValue={editing.label} placeholder="Value" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="User pays (₹)" htmlFor="pk-amount">
                <Input id="pk-amount" name="amount" type="number" min="1" required defaultValue={editing.amount} placeholder="100" />
              </Field>
              <Field label="Bonus credit (₹)" htmlFor="pk-bonus">
                <Input id="pk-bonus" name="bonus" type="number" min="0" required defaultValue={editing.bonus ?? 0} />
              </Field>
            </div>
            <label className="flex items-center justify-between gap-3 rounded-lg bg-surface-2 px-3 py-2.5">
              <span>
                <span className="block text-sm font-semibold text-text">Highlight as “Popular”</span>
                <span className="text-xs text-muted">Only one pack can be highlighted.</span>
              </span>
              <Switch checked={highlight} onChange={setHighlight} label="Highlight as popular" />
            </label>
            <div className="flex justify-end gap-2 border-t border-border pt-3">
              <Button onClick={() => setEditing(null)}>Cancel</Button>
              <Button type="submit" variant="primary">
                Save pack
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
