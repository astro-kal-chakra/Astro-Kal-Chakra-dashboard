"use client";

import { useServerState } from "@/lib/useServerState";
import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { StatusBadge, Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { DataTable, Pagination } from "@/components/ui/Table";
import { FilterBar } from "@/components/common/FilterBar";
import { useToast } from "@/providers/ToastProvider";
import { useAdmin } from "@/providers/AdminProvider";
import { formatNumber, timeAgo } from "@/lib/utils";
import { now } from "@/lib/clock";
import { deleteBlog, getBlog, saveBlog } from "@/actions/content";
import { ActionButton } from "@/components/common/ActionButton";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { BlogCoverField } from "./BlogCoverField";

const CATEGORIES = ["Basics", "Transits", "Festivals", "Vastu", "Tarot", "Numerology"];

const STATUS_FILTER = {
  name: "status",
  label: "Status",
  options: [
    { value: "all", label: "All statuses" },
    { value: "published", label: "Published" },
    { value: "review", label: "In review" },
    { value: "draft", label: "Draft" },
  ],
};

/** One server page of articles (search / status / page live in the URL). */
export function BlogManager({ data, params }) {
  const [blogs, setBlogs] = useServerState(data.rows);
  const counts = data.counts ?? {};
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);

  // The list has no article bodies: load the full article before editing.
  const open = async (b) => {
    if (!b.id) return setEditing(b);
    setEditing({ ...b, loading: true });
    const r = await getBlog(b.id);
    if (!r.ok) {
      setEditing(null);
      return toast(r.error.message, { type: "error" });
    }
    setEditing({ ...b, ...r.data, loading: false });
  };
  const toast = useToast();
  const { admin, can } = useAdmin();
  // UI mirror of content:edit / content:approve — the backend enforces the same.
  const canEdit = can("content", "edit");
  const canPublish = can("content", "approve");
  const canDelete = can("content", "delete");

  const save = async (status) => {
    const form = document.getElementById("blog-form");
    if (!form?.reportValidity()) return;
    const d = Object.fromEntries(new FormData(form));
    if (!String(d.body ?? "").replace(/<[^>]+>/g, "").trim() && !/<(img|video|iframe)/i.test(String(d.body ?? ""))) {
      return toast("Write the article first", { type: "error" });
    }
    setBusy(true);
    const r = await saveBlog(editing.id ?? null, d, status);
    setBusy(false);
    if (!r.ok) return toast(r.error.message, { type: "error" });
    const patch = { title: d.title, category: d.category, status, updatedAt: now(), ...r.data };
    if (editing.id) setBlogs((list) => list.map((b) => (b.id === editing.id ? { ...b, ...patch } : b)));
    else setBlogs((list) => [{ author: admin?.name ?? "Content team", views: 0, ...patch }, ...list]);
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
    ...(canEdit || canDelete
      ? [
          {
            key: "edit",
            label: "",
            align: "right",
            render: (b) => (
              <span className="flex justify-end gap-1">
                {canEdit && <Button size="icon-sm" variant="ghost" aria-label={`Edit ${b.title}`} title="Edit" icon={<Pencil />} onClick={() => open(b)} />}
                <ActionButton
                  module="content"
                  action="delete"
                  confirm
                  size="icon-sm"
                  variant="ghost"
                  icon={<Trash2 className="text-danger" />}
                  dialogTitle="Delete this article?"
                  dialogDescription={`"${b.title}" will be removed from the website and the dashboard for good. This can't be undone.`}
                  confirmLabel="Delete article"
                  dialogVariant="danger"
                  success="Article deleted"
                  successDescription={b.title}
                  run={() => deleteBlog(b.id)}
                  onDone={() => setBlogs((list) => list.filter((x) => x.id !== b.id))}
                >
                  <span className="sr-only">{`Delete ${b.title}`}</span>
                </ActionButton>
              </span>
            ),
          },
        ]
      : []),
  ];

  return (
    <>
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 sm:px-4">
          <p className="text-sm text-muted">
            {formatNumber(counts.published ?? 0)} published · {formatNumber((counts.draft ?? 0) + (counts.review ?? 0))} in progress
          </p>
          {canEdit && (
            <Button variant="primary" size="sm" icon={<Plus />} onClick={() => setEditing({})}>
              New article
            </Button>
          )}
        </div>
        <FilterBar searchPlaceholder="Search title, article ID or category" filters={[STATUS_FILTER]} />
        <DataTable columns={columns} rows={blogs} empty={{ title: params.q || params.status ? "No matching articles" : "No articles yet" }} />
        <Pagination {...data} basePath="/content" params={params} />
      </Card>

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing?.id ? "Edit article" : "New article"}
        size="xl"
        footer={
          <>
            <Button onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={() => save("draft")} disabled={busy || editing?.loading}>
              Save draft
            </Button>
            {canPublish ? (
              <Button variant="primary" loading={busy} disabled={editing?.loading} onClick={() => save("published")}>
                Publish
              </Button>
            ) : (
              <Button variant="primary" loading={busy} disabled={editing?.loading} onClick={() => save("review")}>
                Send for review
              </Button>
            )}
          </>
        }
      >
        {editing?.loading && <p className="py-10 text-center text-sm text-muted">Loading article…</p>}
        {editing && !editing.loading && (
          <form id="blog-form" onSubmit={(e) => e.preventDefault()} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-[1fr_200px]">
              <Field label="Title" htmlFor="bl-title">
                <Input id="bl-title" name="title" required maxLength={90} defaultValue={editing.title} placeholder="Mercury retrograde: what to expect" />
              </Field>
              <Field label="Category" htmlFor="bl-cat">
                <Select id="bl-cat" name="category" defaultValue={editing.category ?? CATEGORIES[0]} options={CATEGORIES} />
              </Field>
            </div>
            <BlogCoverField cover={editing.cover} video={editing.video} />
            <Field
              label="Article"
              help="Use the toolbar for headings, text size, lists and colour. Insert images or short videos where the cursor is — they show in the middle of the article on the website, exactly as here."
            >
              <RichTextEditor name="body" defaultValue={editing.body ?? ""} placeholder="Start writing your article…" />
            </Field>
          </form>
        )}
      </Modal>
    </>
  );
}
