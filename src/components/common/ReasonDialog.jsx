"use client";

import { useState } from "react";
import { ScrollText } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Select, Textarea } from "@/components/ui/Input";
import { SENSITIVE_REASONS } from "@/config/constants";

/**
 * Mandatory-reason prompt for sensitive actions (block, wallet adjust, refund,
 * force end, open chat, reveal hidden details). The reason is sent with the
 * API call and stored in the audit log.
 *
 * `children` renders extra fields above the reason (e.g. amount). Their values
 * are collected through the form and passed to onConfirm as the 2nd argument.
 * `onConfirm` may return a promise; resolving to `false` keeps the dialog open.
 */
export function ReasonDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  variant = "primary",
  reasons = SENSITIVE_REASONS,
  children,
}) {
  const [preset, setPreset] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const reason = [preset, note.trim()].filter(Boolean).join(" — ");
  const valid = preset && (preset !== "Other" || note.trim().length >= 5);

  const close = () => {
    setPreset("");
    setNote("");
    onClose();
  };

  const submit = async (e) => {
    e.preventDefault();
    // Portals still bubble React events; don't submit a parent form.
    e.stopPropagation();
    if (!valid) return;
    setBusy(true);
    const data = Object.fromEntries(new FormData(e.currentTarget));
    // onConfirm may be async (the API call); returning false keeps the dialog open to retry.
    const ok = await onConfirm?.(reason, data);
    setBusy(false);
    if (ok !== false) close();
  };

  return (
    <Modal open={open} onClose={close} title={title} description={description} size="md">
      <form onSubmit={submit} className="space-y-4">
        {children}
        <Field label="Reason" htmlFor="reason-preset">
          <Select
            id="reason-preset"
            value={preset}
            onChange={(e) => setPreset(e.target.value)}
            placeholder="Select a reason"
            options={[...reasons, "Other"]}
            required
          />
        </Field>
        <Field label="Details" htmlFor="reason-note" hint={preset === "Other" ? "Required" : "Optional"}>
          <Textarea id="reason-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ticket ID, context…" rows={3} />
        </Field>
        <p className="flex items-start gap-2 rounded-lg bg-surface-2 px-3 py-2.5 text-xs text-muted">
          <ScrollText className="mt-0.5 size-3.5 shrink-0" />
          This action and your reason are recorded in the audit log with your name, IP and time.
        </p>
        <div className="flex justify-end gap-2 pt-1">
          <Button onClick={close}>Cancel</Button>
          <Button type="submit" variant={variant} disabled={!valid} loading={busy}>
            {confirmLabel}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
