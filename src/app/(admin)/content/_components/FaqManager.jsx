"use client";

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

export function FaqManager({ initial }) {
  const [faqs, setFaqs] = useState(initial);
  const [editing, setEditing] = useState(null);
  const toast = useToast();
  const { can } = useAdmin();
  // UI mirror of content:edit / content:approve — the backend enforces the same.
  const canEdit = can("content", "edit");
  const canPublish = can("content", "approve");

  const categories = [...new Set(faqs.map((f) => f.category))];

  const togglePublish = (f, published) => {
    setFaqs((list) => list.map((x) => (x.id === f.id ? { ...x, published } : x)));
    toast(published ? "FAQ published" : "FAQ unpublished", { description: f.question });
  };

  const save = (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.currentTarget));
    const patch = { question: d.question, answer: d.answer, category: d.category.trim() };
    if (editing.id) setFaqs((list) => list.map((x) => (x.id === editing.id ? { ...x, ...patch } : x)));
    else setFaqs((list) => [...list, { id: `FQ${Date.now()}`, published: false, ...patch }]);
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
              <Select id="fq-cat" name="category" defaultValue={editing.category ?? categories[0]} options={categories} />
            </Field>
            <div className="flex justify-end gap-2 border-t border-border pt-3">
              <Button onClick={() => setEditing(null)}>Cancel</Button>
              <Button type="submit" variant="primary">
                Save FAQ
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
