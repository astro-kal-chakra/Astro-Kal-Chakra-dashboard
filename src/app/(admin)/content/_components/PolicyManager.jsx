"use client";

import { useState } from "react";
import { FileText, Pencil } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/providers/ToastProvider";
import { useAdmin } from "@/providers/AdminProvider";
import { formatDate } from "@/lib/utils";
import { NOW } from "@/lib/clock";

/** "3.2" → "3.3"; major bumps → "4.0". */
const bump = (v, major) => {
  const [a, b] = String(v).split(".").map(Number);
  return major ? `${a + 1}.0` : `${a}.${(b || 0) + 1}`;
};

export function PolicyManager({ initial }) {
  const [policies, setPolicies] = useState(initial);
  const [editing, setEditing] = useState(null);
  const [major, setMajor] = useState(false);
  const toast = useToast();
  const { can } = useAdmin();
  // UI mirror of content:edit / content:approve — the backend enforces the same.
  const canEdit = can("content", "edit");
  const canPublish = can("content", "approve");

  const open = (p) => {
    setMajor(false);
    setEditing(p);
  };

  const publish = (e) => {
    e.preventDefault();
    const version = bump(editing.version, major);
    setPolicies((list) => list.map((p) => (p.id === editing.id ? { ...p, version, updatedAt: NOW } : p)));
    toast(`${editing.title} v${version} published`, { description: major ? "Users will be asked to accept the new version." : "Live on the app and website." });
    setEditing(null);
  };

  return (
    <>
      <Card>
        <ul className="divide-y divide-border">
          {policies.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-3 px-4 py-3.5 sm:px-5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary-ink">
                <FileText className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-text">{p.title}</p>
                <p className="text-xs text-muted">
                  <span className="font-mono">/{p.slug}</span> · v{p.version} · Updated {formatDate(p.updatedAt)}
                </p>
              </div>
              {canEdit && (
                <Button size="xs" icon={<Pencil />} onClick={() => open(p)}>
                  Edit
                </Button>
              )}
            </li>
          ))}
        </ul>
      </Card>

      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title={editing ? `Edit ${editing.title}` : ""} description={editing ? `Current version v${editing.version}` : ""} size="xl">
        {editing && (
          <form onSubmit={publish} className="space-y-4">
            <Field label="Policy text" htmlFor="pl-body" help="Markdown supported. Previous versions stay archived for legal records.">
              <Textarea
                id="pl-body"
                name="body"
                required
                rows={14}
                className="font-mono text-[13px]"
                defaultValue={`# ${editing.title}\n\nVersion ${editing.version} · Last updated ${formatDate(editing.updatedAt)}\n\n## 1. Overview\n\n`}
              />
            </Field>
            <label className="flex items-start gap-2 text-sm text-text-2">
              <input type="checkbox" checked={major} onChange={(e) => setMajor(e.target.checked)} className="mt-0.5 accent-[var(--primary)]" />
              <span>
                <span className="font-semibold text-text">Material change</span> — publish as v{bump(editing.version, true)} and ask users to accept again
              </span>
            </label>
            <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-3">
              <Button onClick={() => setEditing(null)}>Cancel</Button>
              {canPublish && (
                <Button type="submit" variant="primary">
                  Publish v{bump(editing.version, major)}
                </Button>
              )}
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
