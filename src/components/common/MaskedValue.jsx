"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useToast } from "@/providers/ToastProvider";
import { useAdmin } from "@/providers/AdminProvider";
import { ReasonDialog } from "./ReasonDialog";

/**
 * Masked by default. Revealing needs a reason and is audit-logged.
 * In production the server returns only `masked`; the clear value comes from
 * a separate `POST /reveal` call that records the reason — never ship both.
 */
export function MaskedValue({ masked, value, label = "details", module = "users", action = "edit", mono }) {
  const [revealed, setRevealed] = useState(false);
  const [open, setOpen] = useState(false);
  const toast = useToast();
  const { can } = useAdmin();
  const allowed = can(module, action);

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={mono ? "font-mono text-[13px]" : undefined}>{revealed ? value : masked}</span>
      {allowed && (
        <button
          type="button"
          onClick={() => (revealed ? setRevealed(false) : setOpen(true))}
          className="rounded p-0.5 text-muted hover:bg-surface-3 hover:text-primary"
          aria-label={revealed ? `Hide ${label}` : `Reveal ${label}`}
          title={revealed ? "Hide" : "Reveal (logged)"}
        >
          {revealed ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
        </button>
      )}
      <ReasonDialog
        open={open}
        onClose={() => setOpen(false)}
        title={`Reveal ${label}`}
        description="Hidden details are shown only with a reason."
        confirmLabel="Reveal"
        onConfirm={(reason) => {
          setRevealed(true);
          toast(`${label[0].toUpperCase()}${label.slice(1)} revealed`, { description: "Access recorded in audit log", type: "info" });
        }}
      />
    </span>
  );
}
