"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useToast } from "@/providers/ToastProvider";
import { useAdmin } from "@/providers/AdminProvider";
import { ReasonDialog } from "./ReasonDialog";

/**
 * Masked by default. The server sends only `masked`; the clear value comes from
 * `reveal(reason)` — a Server Action (bound in the page) that calls the backend's
 * `POST …/reveal`, which records the reason in the audit log.
 */
export function MaskedValue({ masked, reveal, label = "details", module = "users", action = "edit", mono }) {
  const [value, setValue] = useState(null);
  const [shown, setShown] = useState(false);
  const [open, setOpen] = useState(false);
  const toast = useToast();
  const { can } = useAdmin();
  const allowed = Boolean(reveal) && can(module, action);

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={mono ? "font-mono text-[13px]" : undefined}>{shown && value != null ? value : masked}</span>
      {allowed && (
        <button
          type="button"
          onClick={() => (shown ? setShown(false) : value != null ? setShown(true) : setOpen(true))}
          className="rounded p-0.5 text-muted hover:bg-surface-3 hover:text-primary"
          aria-label={shown ? `Hide ${label}` : `Reveal ${label}`}
          title={shown ? "Hide" : "Reveal (logged)"}
        >
          {shown ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
        </button>
      )}
      {allowed && (
        <ReasonDialog
          open={open}
          onClose={() => setOpen(false)}
          title={`Reveal ${label}`}
          description="Hidden details are shown only with a reason."
          confirmLabel="Reveal"
          onConfirm={async (reason) => {
            const r = await reveal(reason);
            if (!r?.ok) {
              toast(r?.error?.message ?? "Couldn't reveal this value.", { type: "error" });
              return false;
            }
            setValue(r.data ?? "—");
            setShown(true);
            toast(`${label[0].toUpperCase()}${label.slice(1)} revealed`, { description: "Access recorded in audit log", type: "info" });
          }}
        />
      )}
    </span>
  );
}
