"use client";

import { useState } from "react";
import { Check, CircleCheck, FastForward, GraduationCap, Pencil } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Field, Textarea } from "@/components/ui/Input";
import { ReasonDialog } from "@/components/common/ReasonDialog";
import { useAdmin } from "@/providers/AdminProvider";
import { useToast } from "@/providers/ToastProvider";
import { useServerState } from "@/lib/useServerState";
import { cn, formatDate, formatDateTime } from "@/lib/utils";
import { bypassTraining, completeTraining, setTrainingDay } from "@/actions/astrologers";

const BYPASS_REASONS = ["Experienced astrologer", "Trained on another platform", "Interviewed and assessed by Ops", "Returning astrologer"];

/**
 * The 6-day training after approval. Support marks each day done (with notes from the call);
 * Super Admin / Ops (astrologers:approve) complete it when all days are done, or bypass it.
 */
export function TrainingCard({ astrologerId, name, training: initial }) {
  const [t, setT] = useServerState(initial);
  const { can } = useAdmin();
  const toast = useToast();
  const [editing, setEditing] = useState(null); // day being edited
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(null);
  const [bypassing, setBypassing] = useState(false);
  if (!t) return null;

  const active = t.status === "in_progress";
  const canMark = active && can("astrologers", "edit");
  const canDecide = active && can("astrologers", "approve");
  const pct = Math.round((t.done / t.total) * 100);

  const saveDay = async (day, done, text) => {
    setBusy(day);
    const r = await setTrainingDay(astrologerId, day, done, text);
    setBusy(null);
    if (!r.ok) return toast(r.error.message, { type: "error" });
    setT((cur) => ({ ...cur, ...r.data }));
    setEditing(null);
    toast(done ? `Day ${day} marked done` : `Day ${day} marked not done`);
  };

  const complete = async () => {
    setBusy("complete");
    const r = await completeTraining(astrologerId);
    setBusy(null);
    if (!r.ok) return toast(r.error.message, { type: "error" });
    toast("Training completed", { description: `${name} can go online now.` });
  };

  return (
    <Card>
      <CardHeader
        title={
          <span className="inline-flex items-center gap-2">
            <GraduationCap className="size-4 text-primary" /> Training
          </span>
        }
        description={
          active
            ? `Started ${formatDate(t.startedAt)} · planned until ${formatDate(t.endsAt)} · ${t.done}/${t.total} days done`
            : `${t.status === "bypassed" ? "Bypassed" : "Completed"} ${t.completedAt ? formatDateTime(t.completedAt) : ""}${t.decidedBy ? ` by ${t.decidedBy}` : ""}`
        }
        action={<StatusBadge status={active ? "training" : t.status} />}
      />
      {t.reason && !active && <p className="mx-4 mb-3 rounded-lg bg-surface-2 px-3 py-2 text-sm text-text-2 sm:mx-5">Reason: {t.reason}</p>}

      {t.days?.length > 0 && (
        <>
          <div className="px-4 pb-2 sm:px-5">
            <div className="h-2 overflow-hidden rounded-full bg-surface-3" aria-hidden>
              <div className={cn("h-full rounded-full", t.done === t.total ? "bg-success" : "bg-primary")} style={{ width: `${pct}%` }} />
            </div>
          </div>
          <ol className="divide-y divide-border">
            {t.days.map((d) => (
              <li key={d.day} className="flex items-start gap-3 px-4 py-3 sm:px-5">
                <button
                  type="button"
                  disabled={!canMark || busy === d.day}
                  onClick={() => saveDay(d.day, !d.done, d.note)}
                  aria-label={d.done ? `Mark day ${d.day} not done` : `Mark day ${d.day} done`}
                  className={cn(
                    "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors",
                    d.done ? "border-success bg-success text-white" : "border-border-strong text-muted",
                    canMark && "hover:border-primary"
                  )}
                >
                  {d.done ? <Check className="size-3.5" /> : d.day}
                </button>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-text">
                    Day {d.day} · {d.title}
                  </p>
                  <p className="text-xs text-muted">{d.detail}</p>
                  {d.note && <p className="mt-1 rounded-md bg-surface-2 px-2 py-1 text-xs text-text-2">“{d.note}”</p>}
                  {d.done && d.by && (
                    <p className="mt-1 text-[11px] text-muted">
                      Done by {d.by} · {formatDateTime(d.at)}
                    </p>
                  )}
                </div>
                {canMark && (
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label={`Add a note for day ${d.day}`}
                    icon={<Pencil />}
                    onClick={() => {
                      setNote(d.note ?? "");
                      setEditing(d);
                    }}
                  />
                )}
              </li>
            ))}
          </ol>
        </>
      )}

      {canDecide && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3 sm:px-5">
          <p className="text-xs text-muted">{t.done === t.total ? "All days done — complete the training to let them go online." : "Experienced? You can bypass the rest of the training."}</p>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" icon={<FastForward />} onClick={() => setBypassing(true)}>
              Bypass training
            </Button>
            <Button size="sm" variant="success" icon={<CircleCheck />} disabled={t.done < t.total} loading={busy === "complete"} onClick={complete}>
              Complete training
            </Button>
          </div>
        </div>
      )}
      {active && !canMark && <p className="border-t border-border px-4 py-3 text-xs text-muted sm:px-5">The support team updates training progress here.</p>}
      {!active && t.status === "bypassed" && (
        <p className="border-t border-border px-4 py-3 sm:px-5">
          <Badge>Training was skipped</Badge>
        </p>
      )}

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing ? `Day ${editing.day} · ${editing.title}` : ""}
        description="Notes from the call with the astrologer"
        size="md"
        footer={
          <>
            <Button onClick={() => setEditing(null)}>Cancel</Button>
            {editing && !editing.done && (
              <Button loading={busy === editing.day} onClick={() => saveDay(editing.day, false, note)}>
                Save note
              </Button>
            )}
            <Button variant="primary" loading={busy === editing?.day} onClick={() => saveDay(editing.day, true, note)}>
              Save & mark done
            </Button>
          </>
        }
      >
        <Field label="Note" htmlFor="tr-note">
          <Textarea id="tr-note" rows={4} value={note} onChange={(e) => setNote(e.target.value)} placeholder="What was covered, how it went, follow-ups…" />
        </Field>
      </Modal>

      <ReasonDialog
        open={bypassing}
        onClose={() => setBypassing(false)}
        title="Bypass training"
        description={`${name} can go online right away. The rest of the training is skipped.`}
        confirmLabel="Bypass training"
        reasons={BYPASS_REASONS}
        onConfirm={async (reason) => {
          const r = await bypassTraining(astrologerId, reason);
          if (!r.ok) {
            toast(r.error.message, { type: "error" });
            return false;
          }
          toast("Training bypassed", { description: `${name} can go online now.` });
        }}
      />
    </Card>
  );
}
