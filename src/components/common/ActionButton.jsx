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
 * `run(reason, fields)` is the API call — usually a Server Action bound in the
 * page (`run={blockUser.bind(null, user.id)}`) returning `{ ok, data, error }`.
 * On failure the dialog stays open and the backend's message is shown; on
 * success the `success` toast shows and `onDone(reason, fields, data)` runs.
 * `apiMessage`: use the backend's message (actions called with `withMessage`) as the toast text.
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
  apiMessage,
  run,
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

  /** Returns false when the call failed, so dialogs stay open. */
  const finish = async (why, data) => {
    let result = null;
    if (run) {
      try {
        result = await run(why, data);
      } catch {
        result = { ok: false, error: { message: "Couldn't reach the server. Try again." } };
      }
      if (!result?.ok) {
        toast(result?.error?.message ?? "Something went wrong. Try again.", { type: "error" });
        return false;
      }
    }
    // `apiMessage` shows the backend's message (e.g. "Refund auto-approved"); from client
    // components `successDescription` can also be a function of the result.
    const fromResult = apiMessage ? result?.data?.message : typeof successDescription === "function" ? successDescription(result?.data) : null;
    toast(success, { description: fromResult || (why ? `Reason: ${why}` : typeof successDescription === "function" ? undefined : successDescription) });
    onDone?.(why, data, result?.data);
    return true;
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
        disabled={disabled || busy}
        loading={!reason && !confirm && busy}
        onClick={async () => {
          if (reason || confirm) return setOpen(true);
          setBusy(true);
          await finish();
          setBusy(false);
        }}
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
                  const ok = await finish();
                  setBusy(false);
                  if (ok) setOpen(false);
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
