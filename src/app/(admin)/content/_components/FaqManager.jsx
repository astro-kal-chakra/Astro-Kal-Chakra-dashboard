"use client";

import { useServerState } from "@/lib/useServerState";
import { useState } from "react";
import { ChevronDown, Pencil, Plus } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Switch } from "@/components/ui/Switch";
import { useToast } from "@/providers/ToastProvider";
import { useAdmin } from "@/providers/AdminProvider";
import { saveFaq, setFaqPublished } from "@/actions/content";

/** Standard FAQ categories (website groups: consultations, payments, refunds, privacy, account, general). */
const FAQ_CATEGORIES = ["Consultations", "Payments & Wallet", "Refunds", "Privacy & Safety", "Account", "General"];

export function FaqManager({ initial }) {
  const [faqs, setFaqs] = useServerState(initial);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const { can } = useAdmin();
  // UI mirror of content:edit / content:approve — the backend enforces the same.
  const canEdit = can("content", "edit");
  const canPublish = can("content", "approve");

  // Cards on this page: only categories that have questions. The form offers the standard ones
  // (they match the website's FAQ groups and the app's help screen) plus any custom ones already used.
  const categories = [...new Set(faqs.map((f) => f.category))];
  const formCategories = [...new Set([...FAQ_CATEGORIES, ...categories])];

  const togglePublish = async (f, published) => {
    setFaqs((list) => list.map((x) => (x.id === f.id ? { ...x, published } : x)));
    const r = await setFaqPublished(f.id, published);
    if (!r.ok) {
      setFaqs((list) => list.map((x) => (x.id === f.id ? { ...x, published: !published } : x)));
      return toast(r.error.message, { type: "error" });
    }
    toast(published ? "FAQ published" : "FAQ unpublished", { description: f.question });
  };

  const save = async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.currentTarget));
    const patch = { question: d.question, answer: d.answer, category: d.category.trim() };
    setBusy(true);
    const r = await saveFaq(editing.id ?? null, patch);
    setBusy(false);
    if (!r.ok) return toast(r.error.message, { type: "error" });
    if (editing.id) setFaqs((list) => list.map((x) => (x.id === editing.id ? { ...x, ...patch, ...r.data } : x)));
    else setFaqs((list) => [...list, { published: false, ...patch, ...r.data }]);
    toast(editing.id ? "FAQ updated" : "FAQ added", { description: editing.id ? patch.question : "Saved as unpublished." });
    setEditing(null);
  };

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {faqs.filter((f) => f.published).length} of {faqs.length} published
        </p>
        {canEdit && (
          <Button variant="primary" size="sm" icon={<Plus />} onClick={() => setEditing({})}>
            New FAQ
          </Button>
        )}
      </div>

      <div className="space-y-4 lg:space-y-5">
        {categories.map((cat) => (
          <Card key={cat}>
            <CardHeader title={cat} description={`${faqs.filter((f) => f.category === cat).length} questions`} />
            <ul className="divide-y divide-border">
              {faqs
                .filter((f) => f.category === cat)
                .map((f) => (
                  <li key={f.id}>
                    <details className="group">
                      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 hover:bg-surface-2 sm:px-5 [&::-webkit-details-marker]:hidden">
                        <ChevronDown className="size-4 shrink-0 text-muted transition-transform group-open:rotate-180" />
                        <span className="min-w-0 flex-1 text-sm font-semibold text-text">{f.question}</span>
                        {!f.published && <Badge>Hidden</Badge>}
                      </summary>
                      <div className="px-4 pb-4 pl-11 sm:px-5 sm:pl-12">
                        <p className="text-sm text-text-2">{f.answer}</p>
                        {canEdit && (
                          <div className="mt-3 flex flex-wrap items-center gap-3">
                            <label className="flex items-center gap-2 text-xs font-semibold text-text-2">
                              <Switch checked={f.published} onChange={(v) => togglePublish(f, v)} disabled={!canPublish} label="Published" />
                              {f.published ? "Published" : "Unpublished"}
                            </label>
                            <Button size="xs" variant="ghost" icon={<Pencil />} onClick={() => setEditing(f)}>
                              Edit
                            </Button>
                          </div>
                        )}
                      </div>
                    </details>
                  </li>
                ))}
            </ul>
          </Card>
        ))}
      </div>

      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title={editing?.id ? "Edit FAQ" : "New FAQ"} size="lg">
        {editing && (
          <form onSubmit={save} className="space-y-4">
            <Field label="Question" htmlFor="fq-q">
              <Input id="fq-q" name="question" required defaultValue={editing.question} placeholder="How do I recharge my wallet?" />
            </Field>
            <Field label="Answer" htmlFor="fq-a">
              <Textarea id="fq-a" name="answer" required rows={5} defaultValue={editing.answer} />
            </Field>
            <Field label="Category" htmlFor="fq-cat">
              <Select id="fq-cat" name="category" defaultValue={editing.category ?? "General"} options={formCategories} />
            </Field>
            <div className="flex justify-end gap-2 border-t border-border pt-3">
              <Button onClick={() => setEditing(null)}>Cancel</Button>
              <Button type="submit" variant="primary" loading={busy}>
                Save FAQ
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
