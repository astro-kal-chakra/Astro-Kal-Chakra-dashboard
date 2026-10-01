"use client";

import { useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { StatusBadge, Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { DataTable } from "@/components/ui/Table";
import { useToast } from "@/providers/ToastProvider";
import { useAdmin } from "@/providers/AdminProvider";
import { formatNumber, timeAgo } from "@/lib/utils";
import { NOW } from "@/lib/clock";

const CATEGORIES = ["Basics", "Transits", "Festivals", "Vastu", "Tarot", "Numerology"];

export function BlogManager({ initial }) {
  const [blogs, setBlogs] = useState(initial);
  const [editing, setEditing] = useState(null);
  const toast = useToast();
  const { admin, can } = useAdmin();
  // UI mirror of content:edit / content:approve — the backend enforces the same.
  const canEdit = can("content", "edit");
  const canPublish = can("content", "approve");

  const save = (status) => {
    const form = document.getElementById("blog-form");
    if (!form.reportValidity()) return;
    const d = Object.fromEntries(new FormData(form));
    const patch = { title: d.title, category: d.category, body: d.body, status, updatedAt: NOW };
    if (editing.id) setBlogs((list) => list.map((b) => (b.id === editing.id ? { ...b, ...patch } : b)));
    else setBlogs((list) => [{ id: `BL${Date.now()}`, author: admin?.name ?? "Content team", views: 0, ...patch }, ...list]);
    toast({ published: "Article published", review: "Sent for review", draft: "Draft saved" }[status], { description: d.title });
    setEditing(null);
  };

  const columns = [
    {
      key: "title",
      label: "Article",
      className: "max-w-96",
      render: (b) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-text">{b.title}</p>
          <p className="text-xs text-muted">{b.author}</p>
        </div>
      ),
    },
    { key: "category", label: "Category", hideOnMobile: true, render: (b) => <Badge>{b.category}</Badge> },
    { key: "status", label: "Status", render: (b) => <StatusBadge status={b.status} /> },
    { key: "views", label: "Views", align: "right", render: (b) => (b.views ? formatNumber(b.views) : "—") },
    { key: "updatedAt", label: "Updated", hideOnMobile: true, render: (b) => timeAgo(b.updatedAt) },
    ...(canEdit
      ? [{ key: "edit", label: "", align: "right", render: (b) => <Button size="icon-sm" variant="ghost" aria-label={`Edit ${b.title}`} icon={<Pencil />} onClick={() => setEditing(b)} /> }]
      : []),
  ];

  return (
    <>
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 sm:px-4">
          <p className="text-sm text-muted">
            {blogs.filter((b) => b.status === "published").length} published · {blogs.filter((b) => b.status !== "published").length} in progress
          </p>
          {canEdit && (
            <Button variant="primary" size="sm" icon={<Plus />} onClick={() => setEditing({})}>
              New article
            </Button>
          )}
        </div>
        <DataTable columns={columns} rows={blogs} empty={{ title: "No articles yet" }} />
      </Card>

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing?.id ? "Edit article" : "New article"}
        size="xl"
        footer={
          <>
            <Button onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={() => save("draft")}>Save draft</Button>
            {canPublish ? (
              <Button variant="primary" onClick={() => save("published")}>
                Publish
              </Button>
            ) : (
              <Button variant="primary" onClick={() => save("review")}>
                Send for review
              </Button>
            )}
          </>
        }
      >
        {editing && (
          <form id="blog-form" onSubmit={(e) => e.preventDefault()} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-[1fr_200px]">
              <Field label="Title" htmlFor="bl-title">
                <Input id="bl-title" name="title" required maxLength={90} defaultValue={editing.title} placeholder="Mercury retrograde: what to expect" />
              </Field>
              <Field label="Category" htmlFor="bl-cat">
                <Select id="bl-cat" name="category" defaultValue={editing.category ?? CATEGORIES[0]} options={CATEGORIES} />
              </Field>
            </div>
            <Field label="Body" htmlFor="bl-body" help="Markdown supported. Keep paragraphs short for mobile readers.">
              <Textarea
                id="bl-body"
                name="body"
                required
                rows={12}
                defaultValue={editing.body ?? (editing.id ? `# ${editing.title}\n\n` : "")}
                placeholder="Start writing…"
                className="font-mono text-[13px]"
              />
            </Field>
          </form>
        )}
      </Modal>
    </>
  );
}
