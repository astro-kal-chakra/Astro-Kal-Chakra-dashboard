"use client";

import { useState } from "react";
import { Eye, Mail, MessageCircle, Phone } from "lucide-react";
import { useServerState } from "@/lib/useServerState";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { Field, Select, Textarea } from "@/components/ui/Input";
import { DescriptionList } from "@/components/ui/Card";
import { useAdmin } from "@/providers/AdminProvider";
import { useToast } from "@/providers/ToastProvider";
import { formatDateTime, timeAgo } from "@/lib/utils";
import { updateLead } from "@/actions/leads";

const STATUS = {
  new: { label: "New", tone: "warning" },
  contacted: { label: "Contacted", tone: "info" },
  closed: { label: "Closed", tone: "success" },
};
const TOPICS = {
  consultation: "Consultation",
  payment: "Payment",
  refund: "Refund",
  technical: "Technical problem",
  account: "Account",
  feedback: "Feedback",
  partnership: "Partnership",
  other: "Other",
};
const list = (v) => (Array.isArray(v) ? v.join(", ") : v || "—");
const digits = (p) => String(p || "").replace(/\D/g, "");

/** Enquiries table + detail dialog (contact details, the message / application, status and a team note). */
export function LeadsTable({ rows: initial, type }) {
  const [rows, setRows] = useServerState(initial);
  const [open, setOpen] = useState(null);
  const [busy, setBusy] = useState(false);
  const { can } = useAdmin();
  const toast = useToast();
  const canEdit = can("support", "edit");

  const save = async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.currentTarget));
    setBusy(true);
    const r = await updateLead(open.id, { status: d.status, note: d.note });
    setBusy(false);
    if (!r.ok) return toast(r.error.message, { type: "error" });
    setRows((list) => list.map((x) => (x.id === open.id ? { ...x, ...r.data } : x)));
    toast("Enquiry updated", { description: `${open.name} · ${STATUS[r.data?.status]?.label ?? d.status}` });
    setOpen(null);
  };

  const columns = [
    {
      key: "name",
      label: type === "contact" ? "From" : "Applicant",
      render: (l) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-text">{l.name}</p>
          <p className="truncate text-xs text-muted">{l.email || l.phone || "—"}</p>
        </div>
      ),
    },
    type === "contact"
      ? { key: "topic", label: "Topic", render: (l) => <Badge>{TOPICS[l.topic] ?? l.topic ?? "—"}</Badge> }
      : { key: "city", label: "City · experience", hideOnMobile: true, render: (l) => `${l.details?.city ?? "—"} · ${l.details?.experience ? `${l.details.experience} yrs` : "—"}` },
    {
      key: "message",
      label: type === "contact" ? "Message" : "Specialties",
      className: "max-w-80",
      hideOnMobile: true,
      render: (l) => <span className="line-clamp-2 text-text-2">{type === "contact" ? l.message : list(l.details?.specialties)}</span>,
    },
    { key: "status", label: "Status", render: (l) => <Badge tone={STATUS[l.status]?.tone}>{STATUS[l.status]?.label ?? l.status}</Badge> },
    { key: "createdAt", label: "Received", render: (l) => <span className="text-muted">{timeAgo(l.createdAt)}</span> },
    { key: "view", label: "", align: "right", render: (l) => <Button size="xs" variant="ghost" icon={<Eye />} onClick={() => setOpen(l)}>Open</Button> },
  ];

  const d = open?.details ?? {};
  return (
    <>
      <DataTable
        columns={columns}
        rows={rows}
        empty={{ title: type === "contact" ? "No contact messages" : "No applications yet", description: "Submissions from the website appear here." }}
      />

      <Modal
        open={Boolean(open)}
        onClose={() => setOpen(null)}
        size="lg"
        title={open?.name ?? ""}
        description={open ? `${open.ref ?? ""} · ${type === "contact" ? "Contact message" : "Astrologer application"} · ${formatDateTime(open.createdAt)}` : ""}
      >
        {open && (
          <form onSubmit={save} className="space-y-5">
            <div className="flex flex-wrap gap-2">
              {open.phone && (
                <>
                  <Button size="sm" href={`tel:+91${digits(open.phone).slice(-10)}`} icon={<Phone />}>Call</Button>
                  <Button size="sm" href={`https://wa.me/91${digits(open.phone).slice(-10)}`} target="_blank" icon={<MessageCircle />}>WhatsApp</Button>
                </>
              )}
              {open.email && (
                <Button size="sm" href={`mailto:${open.email}?subject=${encodeURIComponent(`Re: your message to Astro Kaal Chakra (${open.ref ?? ""})`)}`} icon={<Mail />}>
                  Email
                </Button>
              )}
            </div>

            <DescriptionList
              cols={2}
              items={[
                { label: "Email", value: open.email },
                { label: "Phone", value: open.phone ? `+91 ${digits(open.phone).slice(-10)}` : null },
                ...(type === "contact"
                  ? [{ label: "Topic", value: TOPICS[open.topic] ?? open.topic }]
                  : [
                      { label: "City", value: d.city },
                      { label: "Gender", value: d.gender },
                      { label: "Experience", value: d.experience ? `${d.experience} years` : null },
                      { label: "Specialties", value: list(d.specialties) },
                      { label: "Languages", value: list(d.languages) },
                      { label: "Consultation modes", value: list(d.modes) },
                      { label: "Available days", value: list(d.days) },
                      { label: "Time slots", value: list(d.slots) },
                      { label: "Hours per day", value: d.hoursPerDay },
                    ]),
              ]}
            />

            <div>
              <p className="text-xs font-medium text-muted">{type === "contact" ? "Message" : "About them"}</p>
              <p className="mt-1 rounded-lg bg-surface-2 p-3 text-sm whitespace-pre-wrap text-text">{open.message || "—"}</p>
            </div>

            {type === "become_astrologer" && (
              <p className="rounded-lg bg-info-soft px-3 py-2.5 text-xs text-info">
                To onboard them, ask them to install the Astrologer app and register with this mobile number. Their profile then appears under Astrologers → Pending for KYC and approval.
              </p>
            )}

            <div className="grid gap-3 sm:grid-cols-[180px_1fr]">
              <Field label="Status" htmlFor="ld-status">
                <Select id="ld-status" name="status" defaultValue={open.status} disabled={!canEdit} options={Object.entries(STATUS).map(([value, s]) => ({ value, label: s.label }))} />
              </Field>
              <Field label="Team note" htmlFor="ld-note" help="Only visible to the admin team.">
                <Textarea id="ld-note" name="note" rows={3} maxLength={1000} defaultValue={open.note ?? ""} disabled={!canEdit} placeholder="e.g. Called on 15 Oct, sending app link" />
              </Field>
            </div>

            <div className="flex justify-end gap-2 border-t border-border pt-3">
              <Button onClick={() => setOpen(null)}>Close</Button>
              {canEdit && (
                <Button type="submit" variant="primary" loading={busy}>
                  Save
                </Button>
              )}
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
