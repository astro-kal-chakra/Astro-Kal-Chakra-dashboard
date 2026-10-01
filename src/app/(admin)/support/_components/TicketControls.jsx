"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessagesSquare } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, Select } from "@/components/ui/Input";
import { ReasonDialog } from "@/components/common/ReasonDialog";
import { useToast } from "@/providers/ToastProvider";
import { useAdmin } from "@/providers/AdminProvider";
import { TICKET_PRIORITIES, TICKET_STATUSES } from "./constants";

/** Status / priority / assignee selects. Changes are simulated with a toast. */
export function TicketControls({ ticket, agents }) {
  const [values, setValues] = useState({ status: ticket.status, priority: ticket.priority, assignee: ticket.assignee ?? "" });
  const toast = useToast();
  const { can } = useAdmin();
  // UI mirror only — the backend enforces support:edit on these updates too.
  const disabled = !can("support", "edit");

  const change = (key, label, options) => (e) => {
    const value = e.target.value;
    setValues((v) => ({ ...v, [key]: value }));
    const text = options.find((o) => o.value === value)?.label ?? "Unassigned";
    toast(`${label} updated`, { description: `${ticket.id} → ${text}` });
  };

  const agentOptions = [{ value: "", label: "Unassigned" }, ...agents.map((a) => ({ value: a, label: a }))];

  return (
    <div className="space-y-3">
      <Field label="Status" htmlFor="t-status">
        <Select id="t-status" value={values.status} disabled={disabled} onChange={change("status", "Status", TICKET_STATUSES)} options={TICKET_STATUSES} />
      </Field>
      <Field label="Priority" htmlFor="t-priority">
        <Select id="t-priority" value={values.priority} disabled={disabled} onChange={change("priority", "Priority", TICKET_PRIORITIES)} options={TICKET_PRIORITIES} />
      </Field>
      <Field label="Assigned to" htmlFor="t-assignee">
        <Select id="t-assignee" value={values.assignee} disabled={disabled} onChange={change("assignee", "Assignee", agentOptions)} options={agentOptions} />
      </Field>
    </div>
  );
}

/**
 * Support agents have no direct access to the Chats module: they may only
 * open a chat transcript through the ticket it is linked to. So this button is
 * gated on support:edit (not chats:view), always asks for a reason, and the
 * backend issues a ticket-scoped, audit-logged grant for that one session.
 */
export function OpenChatButton({ ticketId, sessionId }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const toast = useToast();
  const { can } = useAdmin();
  if (!can("support", "edit")) return null;

  return (
    <>
      <Button size="sm" variant="soft" icon={<MessagesSquare />} onClick={() => setOpen(true)} className="w-full justify-center">
        Open chat via this ticket
      </Button>
      <ReasonDialog
        open={open}
        onClose={() => setOpen(false)}
        title="Open chat transcript"
        description={`Access is limited to session ${sessionId} and linked to ticket ${ticketId}.`}
        confirmLabel="Open chat"
        reasons={["User requested via support ticket", "Payment dispute", "Quality review", "Fraud / abuse investigation"]}
        onConfirm={(reason) => {
          toast("Chat access granted", { description: `Reason: ${reason}` });
          router.push(`/chats/${sessionId}?ticket=${ticketId}`);
        }}
      />
    </>
  );
}
