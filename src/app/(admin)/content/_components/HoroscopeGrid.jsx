"use client";

import { useServerState } from "@/lib/useServerState";
import { useState } from "react";
import { AlertTriangle, ArrowDown, ArrowUp, ChevronLeft, ChevronRight, PenLine, Plus, Trash2 } from "lucide-react";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/providers/ToastProvider";
import { useAdmin } from "@/providers/AdminProvider";
import { cn } from "@/lib/utils";
import { getHoroscopes, saveHoroscope } from "@/actions/content";

const GLYPHS = { Aries: "♈", Taurus: "♉", Gemini: "♊", Cancer: "♋", Leo: "♌", Virgo: "♍", Libra: "♎", Scorpio: "♏", Sagittarius: "♐", Capricorn: "♑", Aquarius: "♒", Pisces: "♓" };
const COLOURS = ["Red", "Orange", "Yellow", "Green", "Blue", "Purple", "Pink", "White", "Silver", "Gold"];
const PERIODS = [
  { value: "daily", label: "Daily", now: "Today", unit: "day" },
  { value: "weekly", label: "Weekly", now: "This week", unit: "week" },
  { value: "monthly", label: "Monthly", now: "This month", unit: "month" },
  { value: "yearly", label: "Yearly", now: "This year", unit: "year" },
];
/** One-click additions in the editor; any other title can be typed. */
const SUGGESTED = ["Love", "Career", "Money", "Health", "Family", "Travel", "Education", "Remedy"];
const DEFAULT_SECTIONS = ["Love", "Career", "Money", "Health"];

const MIN_TEXT = 40;

let uid = 0;
const row = (title = "", text = "") => ({ key: `s${++uid}`, title, text });

/** YYYY-MM-DD of today in India (the backend's periods are in IST). */
const todayIST = () => new Date(Date.now() + 330 * 60000).toISOString().slice(0, 10);

/** Moves a YYYY-MM-DD anchor by one period. */
function shift(date, period, dir) {
  const d = new Date(`${date}T00:00:00Z`);
  if (period === "daily") d.setUTCDate(d.getUTCDate() + dir);
  else if (period === "weekly") d.setUTCDate(d.getUTCDate() + 7 * dir);
  else if (period === "monthly") d.setUTCMonth(d.getUTCMonth() + dir, 1);
  else d.setUTCFullYear(d.getUTCFullYear() + dir, 0, 1);
  return d.toISOString().slice(0, 10);
}

/** Horoscopes for all 12 signs, per period (daily / weekly / monthly / yearly), with any number of sections. */
export function HoroscopeGrid({ initial }) {
  const [items, setItems] = useServerState(initial);
  const [period, setPeriod] = useState("daily");
  const [date, setDate] = useState(todayIST);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [sections, setSections] = useState([]);
  const [mainText, setMainText] = useState("");
  // Field errors shown under each input: { text, luckyNumber, sections: { [rowKey]: { title, text } } }
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const { can } = useAdmin();
  // UI mirror of content:edit / content:approve — the backend enforces the same.
  const canEdit = can("content", "edit");
  const canPublish = can("content", "approve");
  const meta = PERIODS.find((p) => p.value === period);

  const load = async (nextPeriod, nextDate) => {
    setPeriod(nextPeriod);
    setDate(nextDate);
    setLoading(true);
    const r = await getHoroscopes(nextPeriod, nextDate);
    setLoading(false);
    if (!r.ok) return toast(r.error.message, { type: "error" });
    setItems(r.data);
  };

  const open = (h) => {
    setSections(h.sections?.length ? h.sections.map((s) => row(s.title, s.text)) : h.status === "missing" ? DEFAULT_SECTIONS.map((t) => row(t)) : []);
    setMainText(h.text || "");
    setErrors({});
    setEditing(h);
  };

  const setSection = (key, patch) => {
    setSections((list) => list.map((s) => (s.key === key ? { ...s, ...patch } : s)));
    // Editing a field clears its error
    setErrors((e) => {
      if (!e.sections?.[key]) return e;
      const own = { ...e.sections[key] };
      Object.keys(patch).forEach((k) => delete own[k]);
      return { ...e, sections: { ...e.sections, [key]: own } };
    });
  };
  const sectionError = (key, field) => errors.sections?.[key]?.[field];

  /** Same rules as the backend, checked here so every message appears under its own field. */
  const validate = (luckyNumber) => {
    const e = { sections: {} };
    const len = mainText.trim().length;
    if (len < MIN_TEXT) e.text = len ? `Write at least ${MIN_TEXT} characters (now ${len}).` : "Write the horoscope.";
    for (const s of sections) {
      const title = s.title.trim();
      const text = s.text.trim();
      if (!title && !text) continue; // empty rows are dropped on save
      const own = {};
      if (title.length < 2) own.title = "Give this section a title.";
      if (text.length < 3) own.text = `Write the text for ${title || "this section"}.`;
      if (Object.keys(own).length) e.sections[s.key] = own;
    }
    const n = Number(luckyNumber);
    if (!Number.isInteger(n) || n < 1 || n > 99) e.luckyNumber = "Enter a number from 1 to 99.";
    return e;
  };
  const hasErrors = (e) => Boolean(e.text || e.luckyNumber || Object.keys(e.sections || {}).length);

  /** Scrolls to and focuses the first field with an error. */
  const focusFirstError = (e) => {
    const firstSection = sections.find((s) => e.sections?.[s.key]);
    const id = e.text ? "hs-text" : firstSection ? `hs-s-${firstSection.key}-${e.sections[firstSection.key].title ? "title" : "text"}` : e.luckyNumber ? "hs-number" : null;
    const el = id && document.getElementById(id);
    if (el) {
      el.scrollIntoView({ block: "center", behavior: "smooth" });
      el.focus({ preventScroll: true });
      // Continue typing after what is already there
      if (typeof el.value === "string" && el.type !== "number") el.setSelectionRange(el.value.length, el.value.length);
    }
  };
  const move = (i, dir) =>
    setSections((list) => {
      const next = [...list];
      [next[i], next[i + dir]] = [next[i + dir], next[i]];
      return next;
    });

  const missing = items.filter((h) => h.status === "missing").length;
  const drafts = items.filter((h) => h.status === "draft").length;
  const label = items[0]?.periodLabel || date;

  const save = (publish) => async (e) => {
    e?.preventDefault?.();
    const form = document.getElementById("horoscope-form");
    const d = { ...Object.fromEntries(new FormData(form)), text: mainText };
    const found = validate(d.luckyNumber);
    setErrors(found);
    if (hasErrors(found)) return focusFirstError(found);
    const kept = sections.filter((s) => s.title.trim() || s.text.trim());
    const list = kept.map(({ title, text }) => ({ title: title.trim(), text: text.trim() }));
    setBusy(true);
    const r = await saveHoroscope(editing.sign, d, publish, { period, date, sections: list });
    setBusy(false);
    if (!r.ok) {
      // Validation from the server: put each message under its field ("text", "sections.2.title", "luckyNumber")
      const server = { sections: {} };
      for (const x of r.error.details || []) {
        const [field, i, sub] = String(x.field || "").split(".");
        if (field === "sections" && kept[i]) server.sections[kept[i].key] = { ...server.sections[kept[i].key], [sub || "text"]: x.message };
        else if (field === "text" || field === "luckyNumber") server[field] = x.message;
      }
      if (hasErrors(server)) {
        setErrors(server);
        return focusFirstError(server);
      }
      return toast(r.error.message, { type: "error" });
    }
    setItems((all) => all.map((h) => (h.sign === editing.sign ? { ...h, ...r.data } : h)));
    toast(publish ? `${editing.sign} published` : `${editing.sign} saved as draft`, { description: publish ? `Live on the website and app for ${label}.` : undefined });
    setEditing(null);
  };

  return (
    <>
      <Card className="mb-4 flex flex-wrap items-center justify-between gap-3 p-3">
        <div className="flex rounded-lg bg-surface-2 p-1" role="tablist" aria-label="Horoscope period">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              type="button"
              role="tab"
              aria-selected={period === p.value}
              onClick={() => period !== p.value && load(p.value, todayIST())}
              className={cn("rounded-md px-3 py-1.5 text-sm font-semibold transition-colors", period === p.value ? "bg-surface text-text shadow-sm" : "text-muted hover:text-text")}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <Button size="icon-sm" variant="ghost" icon={<ChevronLeft />} aria-label={`Previous ${meta.unit}`} onClick={() => load(period, shift(date, period, -1))} disabled={loading} />
          <span className="min-w-36 text-center text-sm font-semibold text-text">{loading ? "Loading…" : label}</span>
          <Button size="icon-sm" variant="ghost" icon={<ChevronRight />} aria-label={`Next ${meta.unit}`} onClick={() => load(period, shift(date, period, 1))} disabled={loading} />
          <Button size="sm" onClick={() => load(period, todayIST())} disabled={loading}>
            {meta.now}
          </Button>
        </div>
        <p className="w-full text-sm text-text-2 sm:w-auto">
          {missing > 0 && <span className="font-semibold text-danger">{missing} missing</span>}
          {missing > 0 && drafts > 0 && " · "}
          {drafts > 0 && <span className="font-semibold text-warning">{drafts} draft</span>}
          {!missing && !drafts && <span className="font-semibold text-success">All 12 signs published</span>}
        </p>
      </Card>

      <div className={cn("grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4", loading && "pointer-events-none opacity-60")}>
        {items.map((h) => {
          const isMissing = h.status === "missing";
          return (
            <Card
              key={h.id}
              className={cn("flex flex-col p-4", isMissing && "border-danger/50 bg-danger-soft/40 ring-2 ring-danger/15", h.status === "draft" && "border-warning/40")}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-2xl leading-none text-primary" aria-hidden>
                  {GLYPHS[h.sign]}
                </span>
                <StatusBadge status={h.status} />
              </div>
              <p className="mt-2 text-sm font-bold text-text">{h.sign}</p>
              {isMissing ? (
                <p className="mt-1 flex flex-1 items-start gap-1 text-xs text-danger">
                  <AlertTriangle className="mt-px size-3.5 shrink-0" /> Not written yet
                </p>
              ) : (
                <>
                  <p className="mt-1 line-clamp-2 flex-1 text-xs text-muted">{h.text}</p>
                  {h.sections?.length > 0 && <p className="mt-1 truncate text-[11px] text-text-2">{h.sections.map((s) => s.title).join(" · ")}</p>}
                </>
              )}
              {canEdit && (
                <Button size="xs" variant={isMissing ? "danger-soft" : "ghost"} icon={<PenLine />} className="mt-3 self-start" onClick={() => open(h)}>
                  {isMissing ? "Write now" : "Edit"}
                </Button>
              )}
            </Card>
          );
        })}
      </div>

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing ? `${GLYPHS[editing.sign]} ${editing.sign} — ${meta.label.toLowerCase()} horoscope` : ""}
        description={editing ? label : ""}
        size="lg"
        footer={
          <>
            <Button onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={save(false)} disabled={busy}>
              Save draft
            </Button>
            {canPublish && (
              <Button variant="primary" loading={busy} onClick={save(true)}>
                Publish
              </Button>
            )}
          </>
        }
      >
        {editing && (
          <form id="horoscope-form" onSubmit={save(true)} noValidate className="space-y-4">
            <Field
              label="Horoscope"
              htmlFor="hs-text"
              hint={`${mainText.trim().length} / ${MIN_TEXT}+ characters`}
              help="The main reading, shown first. Avoid health or financial guarantees."
              error={errors.text}
            >
              <Textarea
                id="hs-text"
                value={mainText}
                onChange={(e) => {
                  setMainText(e.target.value);
                  if (errors.text) setErrors((x) => ({ ...x, text: undefined }));
                }}
                maxLength={3000}
                rows={4}
                placeholder="A good time to…"
                aria-invalid={Boolean(errors.text)}
                aria-describedby={errors.text ? "hs-text-error" : undefined}
              />
            </Field>

            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-text">Sections</p>
                <p className="text-xs text-muted">{sections.length ? `${sections.length} shown on the website, in this order` : "None: only the main reading is shown"}</p>
              </div>
              <ul className="space-y-3">
                {sections.map((s, i) => (
                  <li key={s.key} className="rounded-lg border border-border p-3">
                    <div className="flex items-center gap-1">
                      <Input
                        id={`hs-s-${s.key}-title`}
                        aria-label={`Section ${i + 1} title`}
                        value={s.title}
                        onChange={(e) => setSection(s.key, { title: e.target.value })}
                        maxLength={40}
                        placeholder="Title, e.g. Love"
                        className="flex-1"
                        aria-invalid={Boolean(sectionError(s.key, "title"))}
                      />
                      <Button size="icon-sm" variant="ghost" icon={<ArrowUp />} aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)} />
                      <Button size="icon-sm" variant="ghost" icon={<ArrowDown />} aria-label="Move down" disabled={i === sections.length - 1} onClick={() => move(i, 1)} />
                      <Button size="icon-sm" variant="ghost" icon={<Trash2 />} aria-label={`Remove ${s.title || "section"}`} onClick={() => setSections((list) => list.filter((x) => x.key !== s.key))} />
                    </div>
                    {sectionError(s.key, "title") && (
                      <p role="alert" className="mt-1 text-xs font-medium text-danger">
                        {sectionError(s.key, "title")}
                      </p>
                    )}
                    <Textarea
                      id={`hs-s-${s.key}-text`}
                      aria-label={`${s.title || `Section ${i + 1}`} text`}
                      value={s.text}
                      onChange={(e) => setSection(s.key, { text: e.target.value })}
                      maxLength={1200}
                      rows={2}
                      className="mt-2"
                      placeholder="What to expect…"
                      aria-invalid={Boolean(sectionError(s.key, "text"))}
                    />
                    {sectionError(s.key, "text") && (
                      <p role="alert" className="mt-1 text-xs font-medium text-danger">
                        {sectionError(s.key, "text")}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
              {sections.length < 10 && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Button size="xs" icon={<Plus />} onClick={() => setSections((list) => [...list, row()])}>
                    Add section
                  </Button>
                  {SUGGESTED.filter((t) => !sections.some((s) => s.title.trim().toLowerCase() === t.toLowerCase())).map((t) => (
                    <button key={t} type="button" onClick={() => setSections((list) => [...list, row(t)])} className="rounded-full border border-border px-2.5 py-0.5 text-xs font-semibold text-text-2 hover:bg-surface-2">
                      + {t}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Lucky colour" htmlFor="hs-colour">
                <Select id="hs-colour" name="luckyColor" defaultValue={editing.luckyColor ?? COLOURS[0]} options={!editing.luckyColor || COLOURS.includes(editing.luckyColor) ? COLOURS : [editing.luckyColor, ...COLOURS]} />
              </Field>
              <Field label="Lucky number" htmlFor="hs-number" error={errors.luckyNumber}>
                <Input
                  id="hs-number"
                  name="luckyNumber"
                  type="number"
                  min="1"
                  max="99"
                  defaultValue={editing.luckyNumber}
                  aria-invalid={Boolean(errors.luckyNumber)}
                  onChange={() => errors.luckyNumber && setErrors((x) => ({ ...x, luckyNumber: undefined }))}
                />
              </Field>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
