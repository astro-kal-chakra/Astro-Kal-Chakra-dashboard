"use client";

import { useState } from "react";
import { AlertTriangle, PenLine } from "lucide-react";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/providers/ToastProvider";
import { useAdmin } from "@/providers/AdminProvider";
import { cn, formatDate } from "@/lib/utils";

const GLYPHS = { Aries: "♈", Taurus: "♉", Gemini: "♊", Cancer: "♋", Leo: "♌", Virgo: "♍", Libra: "♎", Scorpio: "♏", Sagittarius: "♐", Capricorn: "♑", Aquarius: "♒", Pisces: "♓" };
const COLOURS = ["Red", "Orange", "Yellow", "Green", "Blue", "Purple", "Pink", "White", "Silver", "Gold"];

export function HoroscopeGrid({ initial }) {
  const [items, setItems] = useState(initial);
  const [editing, setEditing] = useState(null);
  const toast = useToast();
  const { can } = useAdmin();
  // UI mirror of content:edit / content:approve — the backend enforces the same.
  const canEdit = can("content", "edit");
  const canPublish = can("content", "approve");

  const missing = items.filter((h) => h.status === "missing").length;
  const drafts = items.filter((h) => h.status === "draft").length;

  const save = (publish) => (e) => {
    e?.preventDefault?.();
    const form = document.getElementById("horoscope-form");
    if (!form.reportValidity()) return;
    const d = Object.fromEntries(new FormData(form));
    const status = publish ? "published" : "draft";
    setItems((list) => list.map((h) => (h.id === editing.id ? { ...h, text: d.text, luckyColor: d.luckyColor, luckyNumber: Number(d.luckyNumber), status } : h)));
    toast(publish ? `${editing.sign} published` : `${editing.sign} saved as draft`, { description: publish ? "Live in the app for today." : undefined });
    setEditing(null);
  };

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted">Today · {formatDate(items[0]?.date)}</p>
        <p className="text-sm text-text-2">
          {missing > 0 && <span className="font-semibold text-danger">{missing} missing</span>}
          {missing > 0 && drafts > 0 && " · "}
          {drafts > 0 && <span className="font-semibold text-warning">{drafts} draft</span>}
          {!missing && !drafts && <span className="font-semibold text-success">All 12 signs published</span>}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4">
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
                <p className="mt-1 line-clamp-2 flex-1 text-xs text-muted">{h.text}</p>
              )}
              {canEdit && (
                <Button size="xs" variant={isMissing ? "danger-soft" : "ghost"} icon={<PenLine />} className="mt-3 self-start" onClick={() => setEditing(h)}>
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
        title={editing ? `${GLYPHS[editing.sign]} ${editing.sign} — daily horoscope` : ""}
        description={editing ? formatDate(editing.date) : ""}
        size="lg"
        footer={
          <>
            <Button onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={save(false)}>Save draft</Button>
            {canPublish && (
              <Button variant="primary" onClick={save(true)}>
                Publish
              </Button>
            )}
          </>
        }
      >
        {editing && (
          <form id="horoscope-form" onSubmit={save(true)} className="space-y-4">
            <Field label="Horoscope" htmlFor="hs-text" help="2–4 short sentences. Avoid health or financial guarantees.">
              <Textarea id="hs-text" name="text" required minLength={40} rows={5} defaultValue={editing.text} placeholder="A good day to…" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Lucky colour" htmlFor="hs-colour">
                <Select id="hs-colour" name="luckyColor" defaultValue={editing.luckyColor} options={COLOURS.includes(editing.luckyColor) ? COLOURS : [editing.luckyColor, ...COLOURS]} />
              </Field>
              <Field label="Lucky number" htmlFor="hs-number">
                <Input id="hs-number" name="luckyNumber" type="number" min="1" max="99" required defaultValue={editing.luckyNumber} />
              </Field>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
