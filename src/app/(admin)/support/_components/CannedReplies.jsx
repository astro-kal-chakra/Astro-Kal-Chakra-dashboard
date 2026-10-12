"use client";

import { useServerState } from "@/lib/useServerState";
import { useState } from "react";
import { MessageSquareText, Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/providers/ToastProvider";
import { useAdmin } from "@/providers/AdminProvider";
import { formatNumber } from "@/lib/utils";
import { TICKET_CATEGORIES } from "./constants";
import { createCannedReply, deleteCannedReply, updateCannedReply } from "@/actions/support";

const VARIABLES = ["name", "amount"];

/** Renders a reply body with {{variables}} shown as chips. */
function BodyWithChips({ body }) {
  return (
    <p className="text-sm leading-relaxed text-text-2">
      {body.split(/(\{\{\w+\}\})/g).map((part, i) =>
        /^\{\{\w+\}\}$/.test(part) ? (
          <span key={i} className="mx-0.5 inline-flex items-center rounded-md bg-primary-soft px-1.5 py-px font-mono text-[11px] font-semibold text-primary-ink">
            {part.slice(2, -2)}
          </span>
        ) : (
          part
        )
      )}
    </p>
  );
}

export function CannedReplies({ initial }) {
  const [replies, setReplies] = useServerState(initial);
  const [editing, setEditing] = useState(null); // reply object, or {} for new
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const { can } = useAdmin();
  // UI mirror of support:edit / support:delete — the backend enforces the same.
  const canEdit = can("support", "edit");
  const canDelete = can("support", "delete");

  const save = async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    setBusy(true);
    const r = editing.id ? await updateCannedReply(editing.id, data) : await createCannedReply(data);
    setBusy(false);
    if (!r.ok) return toast(r.error.message, { type: "error" });
    const saved = r.data ?? { id: editing.id, uses: editing.uses ?? 0, ...data };
    setReplies((list) => (editing.id ? list.map((x) => (x.id === editing.id ? { ...x, ...saved } : x)) : [saved, ...list]));
    toast(editing.id ? "Canned reply updated" : "Canned reply created", { description: data.title });
    setEditing(null);
  };

  const remove = async () => {
    setBusy(true);
    const r = await deleteCannedReply(deleting.id);
    setBusy(false);
    if (!r.ok) return toast(r.error.message, { type: "error" });
    setReplies((list) => list.filter((x) => x.id !== deleting.id));
    toast("Canned reply deleted", { description: deleting.title });
    setDeleting(null);
  };

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {replies.length} replies · variables like <span className="font-mono text-xs">{"{{name}}"}</span> are filled in when inserted
        </p>
        {canEdit && (
          <Button variant="primary" size="sm" icon={<Plus />} onClick={() => setEditing({})}>
            New reply
          </Button>
        )}
      </div>

      {replies.length === 0 ? (
        <Card>
          <EmptyState icon={<MessageSquareText />} title="No canned replies" description="Create one to speed up common answers." />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:gap-5 xl:grid-cols-3">
          {replies.map((r) => (
            <Card key={r.id} className="flex flex-col p-4">
              <div className="mb-2 flex items-start justify-between gap-2">
                <h3 className="text-sm font-bold text-text">{r.title}</h3>
                <Badge className="capitalize">{r.category}</Badge>
              </div>
              <div className="flex-1">
                <BodyWithChips body={r.body} />
              </div>
              <div className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-3">
                <span className="text-xs text-muted tabular-nums">Used {formatNumber(r.uses)} times</span>
                <div className="flex gap-1">
                  {canEdit && (
                    <Button size="icon-sm" variant="ghost" aria-label={`Edit ${r.title}`} icon={<Pencil />} onClick={() => setEditing(r)} />
                  )}
                  {canDelete && (
                    <Button size="icon-sm" variant="ghost" aria-label={`Delete ${r.title}`} icon={<Trash2 />} onClick={() => setDeleting(r)} className="hover:text-danger" />
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing?.id ? "Edit canned reply" : "New canned reply"}
        size="lg"
      >
        {editing && (
          <form onSubmit={save} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
              <Field label="Title" htmlFor="cr-title">
                <Input id="cr-title" name="title" required defaultValue={editing.title} placeholder="Refund initiated" />
              </Field>
              <Field label="Category" htmlFor="cr-category">
                <Select id="cr-category" name="category" defaultValue={editing.category ?? "payment"} options={TICKET_CATEGORIES} />
              </Field>
            </div>
            <Field label="Body" htmlFor="cr-body" help={`Available variables: ${VARIABLES.map((v) => `{{${v}}}`).join(", ")}`}>
              <Textarea id="cr-body" name="body" required rows={6} defaultValue={editing.body} placeholder="Hi {{name}}, …" />
            </Field>
            <div className="flex justify-end gap-2 border-t border-border pt-3">
              <Button onClick={() => setEditing(null)}>Cancel</Button>
              <Button type="submit" variant="primary" loading={busy}>
                {editing.id ? "Save changes" : "Create reply"}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Delete canned reply?"
        size="sm"
        footer={
          <>
            <Button onClick={() => setDeleting(null)}>Cancel</Button>
            <Button variant="danger" loading={busy} onClick={remove}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-text-2">
          “{deleting?.title}” will be removed for all agents. Past tickets keep the text that was sent.
        </p>
      </Modal>
    </>
  );
}
