"use client";

import { useState } from "react";
import { CircleCheck, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Field, Textarea } from "@/components/ui/Input";
import { useAdmin } from "@/providers/AdminProvider";
import { useToast } from "@/providers/ToastProvider";
import { approveAstrologer } from "@/actions/astrologers";

/**
 * Approve an application. By default the astrologer starts the 6-day training with the support
 * team and can go online only after it. Experienced astrologers can skip it (reason required).
 */
export function ApproveButton({ id, name }) {
  const { can } = useAdmin();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [skip, setSkip] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  if (!can("astrologers", "approve")) return null;

  const submit = async () => {
    if (skip && reason.trim().length < 3) return toast("Give a reason for skipping training", { type: "error" });
    setBusy(true);
    const r = await approveAstrologer(id, { skipTraining: skip, reason });
    setBusy(false);
    if (!r.ok) return toast(r.error.message, { type: "error" });
    toast("Astrologer approved", { description: r.data?.message });
    setOpen(false);
  };

  return (
    <>
      <Button variant="success" size="sm" icon={<CircleCheck />} onClick={() => setOpen(true)}>
        Approve
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Approve astrologer"
        description={name}
        size="md"
        footer={
          <>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="success" loading={busy} onClick={submit}>
              {skip ? "Approve & skip training" : "Approve & start training"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="flex items-start gap-2 rounded-lg bg-info-soft px-3 py-2.5 text-sm text-info">
            <GraduationCap className="mt-0.5 size-4 shrink-0" />
            <span>
              After approval {name} does <span className="font-semibold">6 days of training</span> with the support team (phone or app). They can go online
              only when the training is completed or bypassed.
            </span>
          </p>
          <label className="flex items-start gap-2.5 rounded-xl border border-border p-3 text-sm">
            <input type="checkbox" checked={skip} onChange={(e) => setSkip(e.target.checked)} className="mt-0.5 size-4 accent-primary" />
            <span>
              <span className="block font-semibold text-text">Skip training</span>
              <span className="block text-xs text-muted">For experienced astrologers. They can go online right away.</span>
            </span>
          </label>
          {skip && (
            <Field label="Reason for skipping" htmlFor="skip-reason" help="Saved in the audit log.">
              <Textarea id="skip-reason" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. 12 years on another platform, interviewed by Ops" />
            </Field>
          )}
        </div>
      </Modal>
    </>
  );
}
