"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/providers/ToastProvider";
import { useAdmin } from "@/providers/AdminProvider";
import { ReasonDialog } from "./ReasonDialog";

/**
 * A button for an admin action. Hidden when the admin lacks `module`/`action`
 * permission (the backend enforces the same rule).
 *
 * - `reason`: opens the mandatory ReasonDialog (sensitive actions)
 * - `confirm`: a plain "are you sure" dialog
 * - neither: runs immediately
 *
 * UI-only: shows a toast with `success`. Wire the API call in `onDone`.
 */
export function ActionButton({
  module,
  action = "edit",
  reason,
  confirm,
  dialogTitle,
  dialogDescription,
  confirmLabel,
  success = "Done",
  successDescription,
  onDone,
  fields,
  reasons,
  variant = "secondary",
  dialogVariant,
  size = "sm",
  icon,
  children,
  className,
  disabled,
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const { can } = useAdmin();

  if (module && !can(module, action)) return null;

  const finish = (why, data) => {
    toast(success, { description: why ? `Reason: ${why}` : successDescription });
    onDone?.(why, data);
  };

  const dialogTone = dialogVariant ?? (variant.startsWith("danger") ? "danger" : "primary");
  const title = dialogTitle ?? (typeof children === "string" ? children : "Confirm action");

  return (
    <>
      <Button
        variant={variant}
        size={size}
        icon={icon}
        className={className}
        disabled={disabled}
        onClick={() => (reason || confirm ? setOpen(true) : finish())}
      >
        {children}
      </Button>

      {reason && (
        <ReasonDialog
          open={open}
          onClose={() => setOpen(false)}
          onConfirm={finish}
          title={title}
          description={dialogDescription}
          confirmLabel={confirmLabel ?? title}
          variant={dialogTone}
          reasons={reasons}
        >
          {fields}
        </ReasonDialog>
      )}

      {confirm && !reason && (
        <Modal
          open={open}
          onClose={() => setOpen(false)}
          title={title}
          size="sm"
          footer={
            <>
              <Button onClick={() => setOpen(false)}>Cancel</Button>
              <Button
                variant={dialogTone}
                loading={busy}
                onClick={async () => {
                  setBusy(true);
                  await new Promise((r) => setTimeout(r, 300));
                  setBusy(false);
                  setOpen(false);
                  finish();
                }}
              >
                {confirmLabel ?? "Confirm"}
              </Button>
            </>
          }
        >
          <p className="text-sm text-text-2">{dialogDescription ?? (typeof confirm === "string" ? confirm : "Are you sure?")}</p>
        </Modal>
      )}
    </>
  );
}
