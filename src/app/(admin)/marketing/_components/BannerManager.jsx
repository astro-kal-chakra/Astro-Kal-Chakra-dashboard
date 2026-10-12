"use client";

import { useServerState } from "@/lib/useServerState";
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
import { BANNER_TONES, DEEP_LINKS, toDateInput } from "./utils";
import { pauseBanner, resumeBanner, saveBanner } from "@/actions/marketing";

const PLACEMENTS = ["Home · top", "Home · middle", "Wallet", "Astrologer list"];

export function BannerManager({ initial }) {
  const [banners, setBanners] = useServerState(initial);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(null);
  const [fileName, setFileName] = useState("");
  const edit = (b) => {
    setFileName("");
    setEditing(b);
  };
  const toast = useToast();
  const { can } = useAdmin();
  // UI mirror of marketing:edit — the backend enforces the same check.
  const canEdit = can("marketing", "edit");

  const togglePause = async (b) => {
    const pausing = b.status !== "paused";
    setBusy(b.id);
    const r = pausing ? await pauseBanner(b.id) : await resumeBanner(b.id);
    setBusy(null);
    if (!r.ok) return toast(r.error.message, { type: "error" });
    setBanners((list) => list.map((x) => (x.id === b.id ? { ...x, status: pausing ? "paused" : "live" } : x)));
    toast(pausing ? "Banner paused" : "Banner resumed", { description: b.title });
  };

  const save = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (fd.get("endsAt") < fd.get("startsAt")) return toast("The end date is before the start date", { type: "error" });
    if (!editing.id) {
      const tones = Object.keys(BANNER_TONES);
      fd.set("tone", tones[banners.length % tones.length]);
    }
    setBusy("form");
    const r = await saveBanner(editing.id ?? null, fd);
    setBusy(null);
    if (!r.ok) return toast(r.error.message, { type: "error" });
    toast(editing.id ? "Banner updated" : "Banner created", { description: editing.id ? fd.get("title") : "Scheduled for the start date." });
    setEditing(null);
  };

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {banners.filter((b) => b.status === "live").length} live · {banners.length} total
        </p>
        {canEdit && (
          <Button variant="primary" size="sm" icon={<Plus />} onClick={() => edit({})}>
            New banner
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:gap-5 xl:grid-cols-3">
        {banners.map((b) => {
          const ctr = b.impressions ? (b.clicks / b.impressions) * 100 : 0;
          return (
            <Card key={b.id} className="flex flex-col overflow-hidden">
              <div className={cn("relative flex h-32 flex-col justify-end bg-linear-to-br p-4 text-white", BANNER_TONES[b.tone] ?? BANNER_TONES.violet, b.status === "ended" && "opacity-60 grayscale")}
                style={b.image ? { backgroundImage: `linear-gradient(to right, rgb(0 0 0 / 0.72), rgb(0 0 0 / 0.25)), url(${JSON.stringify(b.image)})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
              >
                <span className="absolute top-3 right-3 rounded-full bg-black/25 px-2 py-0.5 text-[11px] font-semibold backdrop-blur-sm">{b.placement}</span>
                {b.eyebrow && <p className="text-[10px] font-bold tracking-wide uppercase opacity-90">● {b.eyebrow}</p>}
                <p className="text-lg leading-tight font-extrabold drop-shadow-sm">{b.title}</p>
                {b.subtitle && <p className="line-clamp-1 text-xs opacity-90">{b.subtitle}</p>}
                <span className="mt-2 inline-flex w-fit rounded-full bg-white/90 px-2.5 py-0.5 text-[11px] font-bold text-black/80">{b.cta || "Explore"} →</span>
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
                    <Button size="xs" icon={<Pencil />} onClick={() => edit(b)}>
                      Edit
                    </Button>
                    {(b.status === "live" || b.status === "paused") && (
                      <Button size="xs" variant={b.status === "paused" ? "soft" : "ghost"} icon={b.status === "paused" ? <Play /> : <Pause />} loading={busy === b.id} onClick={() => togglePause(b)}>
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
              <Field label="Tag (optional)" htmlFor="bn-eyebrow" help="Small label above the title, e.g. SPECIAL OFFER.">
                <Input id="bn-eyebrow" name="eyebrow" maxLength={24} defaultValue={editing.eyebrow} placeholder="SPECIAL OFFER" />
              </Field>
              <Field label="Button text (optional)" htmlFor="bn-cta" help="Defaults to Explore.">
                <Input id="bn-cta" name="cta" maxLength={20} defaultValue={editing.cta} placeholder="Recharge now" />
              </Field>
            </div>
            <Field label="Subtitle (optional)" htmlFor="bn-subtitle" help="One short line under the title.">
              <Input id="bn-subtitle" name="subtitle" maxLength={120} defaultValue={editing.subtitle} placeholder="Get 50% extra on every recharge this week" />
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
            <Field label="Banner image" help="PNG or JPG, 1080 × 400 px, up to 500 KB. The text is drawn over the image on a dark shade, so keep the left side free of text.">
              <label className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border-strong bg-surface-2 px-4 py-6 text-center hover:bg-surface-3">
                <ImagePlus className="size-5 text-muted" />
                <span className="text-sm font-semibold text-text-2">{fileName || "Click to upload"}</span>
                <span className="text-xs text-muted">{editing.image ? "Choose a file to replace the current image" : "Optional"}</span>
                <input type="file" name="image" accept="image/png,image/jpeg" className="sr-only" onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")} />
              </label>
              {editing.image && (
                <label className="mt-2 flex items-center gap-2 text-xs text-text-2">
                  <input type="checkbox" name="removeImage" /> Remove the current image (use the colour background)
                </label>
              )}
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
              <Button type="submit" variant="primary" loading={busy === "form"}>
                {editing.id ? "Save banner" : "Create banner"}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
