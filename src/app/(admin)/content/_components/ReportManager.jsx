"use client";

import { useServerState } from "@/lib/useServerState";
import { useState } from "react";
import { FileText, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Switch } from "@/components/ui/Switch";
import { useToast } from "@/providers/ToastProvider";
import { useAdmin } from "@/providers/AdminProvider";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { deleteReport, saveReport, setReportActive } from "@/actions/content";

const ICONS = [
  { value: "scroll", label: "Scroll (kundli)" },
  { value: "heart", label: "Heart (matching / love)" },
  { value: "calendar", label: "Calendar (yearly)" },
  { value: "briefcase", label: "Briefcase (career)" },
];

/** Paid astrology reports shown on the website and apps (Reports page). Prices in rupees. */
export function ReportManager({ initial }) {
  const [reports, setReports] = useServerState(initial);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({});
  const toast = useToast();
  const { can } = useAdmin();
  // UI mirror of content:edit / approve / delete — the backend enforces the same.
  const canEdit = can("content", "edit");
  const canPublish = can("content", "approve");
  const canDelete = can("content", "delete");

  const toggleActive = async (r, active) => {
    setReports((list) => list.map((x) => (x.id === r.id ? { ...x, active } : x)));
    const res = await setReportActive(r.id, active);
    if (!res.ok) {
      setReports((list) => list.map((x) => (x.id === r.id ? { ...x, active: !active } : x)));
      return toast(res.error.message, { type: "error" });
    }
    toast(active ? "Report published" : "Report hidden", { description: active ? `${r.title} is now on the website.` : `${r.title} is no longer shown.` });
  };

  const remove = async (r) => {
    if (!window.confirm(`Delete “${r.title}”? This can't be undone.`)) return;
    const res = await deleteReport(r.id);
    if (!res.ok) return toast(res.error.message, { type: "error" });
    setReports((list) => list.filter((x) => x.id !== r.id));
    toast("Report deleted", { description: r.title });
  };

  const save = async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.currentTarget));
    setBusy(true);
    setErrors({});
    const res = await saveReport(editing.id ?? null, d);
    setBusy(false);
    if (!res.ok) {
      const fieldErrors = Object.fromEntries((res.error.details || []).map((x) => [String(x.field ?? x.path ?? "").split(".")[0], x.message]));
      setErrors(fieldErrors);
      return toast(res.error.message, { type: "error" });
    }
    if (editing.id) setReports((list) => list.map((x) => (x.id === editing.id ? { ...x, ...res.data } : x)));
    else setReports((list) => [...list, res.data]);
    toast(editing.id ? "Report updated" : "Report added", { description: editing.id ? res.data.title : "Saved as hidden. Publish it to show it on the website." });
    setEditing(null);
  };

  const err = (name) => errors[name] && <p className="mt-1 text-xs text-danger">{errors[name]}</p>;

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {reports.filter((r) => r.active).length} of {reports.length} shown on the website · sorted by display order
        </p>
        {canEdit && (
          <Button variant="primary" size="sm" icon={<Plus />} onClick={() => setEditing({})}>
            New report
          </Button>
        )}
      </div>

      {reports.length === 0 ? (
        <Card>
          <EmptyState icon={<FileText />} title="No reports yet" description="Add the first paid report for the website's Reports page." />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {reports.map((r) => (
            <Card key={r.id} className="flex flex-col p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-text">{r.title}</p>
                  <p className="truncate text-xs text-muted">/reports/{r.slug}</p>
                </div>
                {r.active ? <Badge tone="success">Shown</Badge> : <Badge>Hidden</Badge>}
              </div>
              {r.shortDescription && <p className="mt-2 line-clamp-2 text-sm text-text-2">{r.shortDescription}</p>}
              <div className="mt-3 flex flex-wrap items-baseline gap-x-2">
                <span className="text-lg font-bold text-text">{formatCurrency(r.price)}</span>
                {r.originalPrice > r.price && <span className="text-xs text-muted line-through">{formatCurrency(r.originalPrice)}</span>}
              </div>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-muted">
                {r.rating > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <Star className="size-3" /> {r.rating}
                  </span>
                )}
                <span>{r.profilesRequired === 2 ? "Couple" : "One person"}</span>
                <span>{r.includes.length} items</span>
                <span>
                  {formatNumber(r.orders)} order{r.orders === 1 ? "" : "s"}
                </span>
              </p>
              {canEdit && (
                <div className="mt-auto flex flex-wrap items-center gap-3 border-t border-border pt-3">
                  <label className="flex items-center gap-2 text-xs font-semibold text-text-2">
                    <Switch checked={r.active} onChange={(v) => toggleActive(r, v)} disabled={!canPublish} label="Shown on website" />
                    {r.active ? "Shown" : "Hidden"}
                  </label>
                  <Button size="xs" variant="ghost" icon={<Pencil />} onClick={() => (setErrors({}), setEditing(r))}>
                    Edit
                  </Button>
                  {canDelete && r.orders === 0 && (
                    <Button size="xs" variant="ghost" icon={<Trash2 />} onClick={() => remove(r)}>
                      Delete
                    </Button>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title={editing?.id ? "Edit report" : "New report"} size="lg">
        {editing && (
          <form onSubmit={save} className="space-y-4">
            <Field label="Title" htmlFor="rp-title">
              <Input id="rp-title" name="title" required minLength={3} maxLength={120} defaultValue={editing.title} placeholder="Career & Finance Report" />
              {err("title")}
            </Field>
            <Field label="Short description" htmlFor="rp-short" hint="One or two lines on the report card.">
              <Input id="rp-short" name="shortDescription" maxLength={200} defaultValue={editing.shortDescription} />
            </Field>
            <Field label="Full description" htmlFor="rp-desc" hint="Shown under “About this report”.">
              <Textarea id="rp-desc" name="description" rows={4} maxLength={3000} defaultValue={editing.description} />
            </Field>
            <Field label="What's included" htmlFor="rp-inc" hint="One item per line. Add a short explanation after a colon, e.g. “Birth chart: North & South Indian charts”.">
              <Textarea id="rp-inc" name="includes" rows={6} defaultValue={(editing.includes || []).join("\n")} />
              {err("includes")}
            </Field>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Field label="Price (₹)" htmlFor="rp-price">
                <Input id="rp-price" name="price" type="number" min={1} step="1" required defaultValue={editing.price} />
                {err("price")}
              </Field>
              <Field label="Original price (₹)" htmlFor="rp-orig" hint="Struck through. Leave empty for none.">
                <Input id="rp-orig" name="originalPrice" type="number" min={0} step="1" defaultValue={editing.originalPrice ?? ""} />
                {err("originalPrice")}
              </Field>
              <Field label="For" htmlFor="rp-people">
                <Select
                  id="rp-people"
                  name="profilesRequired"
                  defaultValue={String(editing.profilesRequired ?? 1)}
                  options={[
                    { value: "1", label: "One person" },
                    { value: "2", label: "A couple (matching)" },
                  ]}
                />
              </Field>
              <Field label="Icon" htmlFor="rp-icon">
                <Select id="rp-icon" name="icon" defaultValue={editing.icon ?? "scroll"} options={ICONS} />
              </Field>
              <Field label="Pages" htmlFor="rp-pages">
                <Input id="rp-pages" name="pages" type="number" min={1} max={500} defaultValue={editing.pages ?? ""} />
              </Field>
              <Field label="Ready in (hours)" htmlFor="rp-hours">
                <Input id="rp-hours" name="deliveryHours" type="number" min={1} max={720} defaultValue={editing.deliveryHours ?? 48} />
              </Field>
              <Field label="Rating shown" htmlFor="rp-rating" hint="0–5, empty to hide.">
                <Input id="rp-rating" name="rating" type="number" min={0} max={5} step="0.1" defaultValue={editing.rating ?? ""} />
              </Field>
              <Field label="“Sold” count shown" htmlFor="rp-sold">
                <Input id="rp-sold" name="sold" type="number" min={0} defaultValue={editing.sold ?? ""} />
              </Field>
              <Field label="Display order" htmlFor="rp-sort" hint="Lower comes first.">
                <Input id="rp-sort" name="sort" type="number" min={0} max={1000} defaultValue={editing.sort ?? ""} />
              </Field>
            </div>
            <Field label="Web address" htmlFor="rp-slug" hint="Optional. Made from the title when empty, e.g. career-finance-report.">
              <Input id="rp-slug" name="slug" pattern="[a-z0-9-]*" maxLength={80} defaultValue={editing.slug} placeholder="career-finance-report" />
              {err("slug")}
            </Field>
            <div className="flex justify-end gap-2 border-t border-border pt-3">
              <Button onClick={() => setEditing(null)}>Cancel</Button>
              <Button type="submit" variant="primary" loading={busy}>
                Save report
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
