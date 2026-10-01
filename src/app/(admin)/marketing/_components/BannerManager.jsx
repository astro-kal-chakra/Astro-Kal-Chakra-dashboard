"use client";

import { useState } from "react";
import { CalendarDays, ImagePlus, Link2, MousePointerClick, Pause, Pencil, Play, Plus } from "lucide-react";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/providers/ToastProvider";
import { useAdmin } from "@/providers/AdminProvider";
import { cn, formatDate, formatNumber, formatPercent } from "@/lib/utils";
import { BANNER_TONES, DEEP_LINKS, fromDateInput, toDateInput } from "./utils";

const PLACEMENTS = ["Home · top", "Home · middle", "Wallet", "Astrologer list"];

export function BannerManager({ initial }) {
  const [banners, setBanners] = useState(initial);
  const [editing, setEditing] = useState(null);
  const toast = useToast();
  const { can } = useAdmin();
  // UI mirror of marketing:edit — the backend enforces the same check.
  const canEdit = can("marketing", "edit");

  const togglePause = (b) => {
    const status = b.status === "paused" ? "live" : "paused";
    setBanners((list) => list.map((x) => (x.id === b.id ? { ...x, status } : x)));
    toast(status === "paused" ? "Banner paused" : "Banner resumed", { description: b.title });
  };

  const save = (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.currentTarget));
    const patch = { title: d.title, placement: d.placement, target: d.target, startsAt: fromDateInput(d.startsAt), endsAt: fromDateInput(d.endsAt) };
    if (editing.id) {
      setBanners((list) => list.map((x) => (x.id === editing.id ? { ...x, ...patch } : x)));
      toast("Banner updated", { description: d.title });
    } else {
      const tones = Object.keys(BANNER_TONES);
      setBanners((list) => [{ id: `B${Date.now()}`, status: "scheduled", clicks: 0, impressions: 0, tone: tones[list.length % tones.length], ...patch }, ...list]);
      toast("Banner created", { description: "Scheduled for the start date." });
    }
    setEditing(null);
  };

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {banners.filter((b) => b.status === "live").length} live · {banners.length} total
        </p>
        {canEdit && (
          <Button variant="primary" size="sm" icon={<Plus />} onClick={() => setEditing({})}>
            New banner
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:gap-5 xl:grid-cols-3">
        {banners.map((b) => {
          const ctr = b.impressions ? (b.clicks / b.impressions) * 100 : 0;
          return (
            <Card key={b.id} className="flex flex-col overflow-hidden">
              <div className={cn("relative flex h-32 flex-col justify-end bg-linear-to-br p-4 text-white", BANNER_TONES[b.tone] ?? BANNER_TONES.violet, b.status === "ended" && "opacity-60 grayscale")}>
                <span className="absolute top-3 right-3 rounded-full bg-black/25 px-2 py-0.5 text-[11px] font-semibold backdrop-blur-sm">{b.placement}</span>
                <p className="text-lg leading-tight font-extrabold drop-shadow-sm">{b.title}</p>
                <span className="mt-2 inline-flex w-fit rounded-full bg-white/90 px-2.5 py-0.5 text-[11px] font-bold text-black/80">Open now →</span>
              </div>
              <div className="flex flex-1 flex-col gap-3 p-4">
                <div className="flex items-center justify-between gap-2">
                  <StatusBadge status={b.status} />
                  <span className="font-mono text-xs text-muted">{b.id}</span>
                </div>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                  <div className="col-span-2 flex items-center gap-1.5 text-text-2">
                    <CalendarDays className="size-3.5 text-muted" />
                    {formatDate(b.startsAt)} – {formatDate(b.endsAt)}
                  </div>
                  <div className="col-span-2 flex min-w-0 items-center gap-1.5 text-text-2">
                    <Link2 className="size-3.5 shrink-0 text-muted" />
                    <span className="truncate font-mono">{b.target}</span>
                  </div>
                  <div>
                    <dt className="text-muted">Impressions</dt>
                    <dd className="font-semibold text-text tabular-nums">{formatNumber(b.impressions, true)}</dd>
                  </div>
                  <div>
                    <dt className="flex items-center gap-1 text-muted">
                      <MousePointerClick className="size-3" /> CTR
                    </dt>
                    <dd className="font-semibold text-text tabular-nums">
                      {b.impressions ? formatPercent(ctr, 2) : "—"}
                      <span className="ml-1 font-normal text-muted">({formatNumber(b.clicks, true)} clicks)</span>
                    </dd>
                  </div>
                </dl>
                {canEdit && (
                  <div className="mt-auto flex gap-2 border-t border-border pt-3">
                    <Button size="xs" icon={<Pencil />} onClick={() => setEditing(b)}>
                      Edit
                    </Button>
                    {(b.status === "live" || b.status === "paused") && (
                      <Button size="xs" variant={b.status === "paused" ? "soft" : "ghost"} icon={b.status === "paused" ? <Play /> : <Pause />} onClick={() => togglePause(b)}>
                        {b.status === "paused" ? "Resume" : "Pause"}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title={editing?.id ? "Edit banner" : "New banner"} size="lg">
        {editing && (
          <form onSubmit={save} className="space-y-4">
            <Field label="Title" htmlFor="bn-title">
              <Input id="bn-title" name="title" required maxLength={60} defaultValue={editing.title} placeholder="Navratri special — 50% extra" />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Placement" htmlFor="bn-placement">
                <Select id="bn-placement" name="placement" defaultValue={editing.placement ?? PLACEMENTS[0]} options={PLACEMENTS} />
              </Field>
              <Field label="Deep link target" htmlFor="bn-target">
                <Select
                  id="bn-target"
                  name="target"
                  defaultValue={editing.target ?? DEEP_LINKS[0].value}
                  options={DEEP_LINKS.some((l) => l.value === editing.target) || !editing.target ? DEEP_LINKS : [{ value: editing.target, label: editing.target }, ...DEEP_LINKS]}
                />
              </Field>
            </div>
            <Field label="Banner image" help="PNG or JPG, 1080 × 400 px, up to 500 KB.">
              <label className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border-strong bg-surface-2 px-4 py-6 text-center hover:bg-surface-3">
                <ImagePlus className="size-5 text-muted" />
                <span className="text-sm font-semibold text-text-2">Click to upload</span>
                <span className="text-xs text-muted">Upload is simulated in this demo</span>
                <input type="file" name="image" accept="image/png,image/jpeg" className="sr-only" />
              </label>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Starts" htmlFor="bn-start">
                <Input id="bn-start" name="startsAt" type="date" required defaultValue={toDateInput(editing.startsAt)} />
              </Field>
              <Field label="Ends" htmlFor="bn-end">
                <Input id="bn-end" name="endsAt" type="date" required defaultValue={toDateInput(editing.endsAt)} />
              </Field>
            </div>
            <div className="flex justify-end gap-2 border-t border-border pt-3">
              <Button onClick={() => setEditing(null)}>Cancel</Button>
              <Button type="submit" variant="primary">
                {editing.id ? "Save banner" : "Create banner"}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
