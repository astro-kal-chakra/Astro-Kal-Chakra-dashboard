"use client";

import { useServerState } from "@/lib/useServerState";
import { useEffect, useState } from "react";
import { CircleCheck, CircleX, ExternalLink, FileText, Loader2, Lock, ShieldAlert } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { ReasonDialog } from "@/components/common/ReasonDialog";
import { useAdmin } from "@/providers/AdminProvider";
import { useToast } from "@/providers/ToastProvider";
import { cn, formatDateTime } from "@/lib/utils";
import { getKycLink, rejectKycDoc, verifyKycDoc } from "@/actions/astrologers";

const LINK_TTL = 5 * 60; // seconds
const REJECT_REASONS = ["Document is blurry", "Document expired", "Name does not match", "Wrong document type", "Looks edited or tampered"];

/**
 * KYC documents are never served from a public URL. Opening one asks the
 * backend for a short-lived signed link (5 min); verify/reject are checked
 * server-side against the `astrologers.approve` permission as well.
 */
export function KycDocuments({ docs: initial, astrologerId, astrologerName }) {
  const [docs, setDocs] = useServerState(initial);
  const [openId, setOpenId] = useState(null);
  const [rejecting, setRejecting] = useState(false);
  const [left, setLeft] = useState(LINK_TTL);
  const [link, setLink] = useState(null); // { url } | { error }
  const [preview, setPreview] = useState(true); // false when the file isn't an image
  const [verifying, setVerifying] = useState(false);
  const { can } = useAdmin();
  const toast = useToast();
  const canReview = can("astrologers", "approve");

  const doc = docs.find((d) => d.id === openId);

  useEffect(() => {
    if (!openId) return;
    const t = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [openId]);

  // Each open asks the backend for a fresh signed link (the view is audit-logged).
  const open = async (id) => {
    setOpenId(id);
    setLink(null);
    setPreview(true);
    setLeft(LINK_TTL);
    const r = await getKycLink(astrologerId, id);
    if (!r.ok) return setLink({ error: r.error.message });
    setLink({ url: r.data.url });
    setLeft(r.data.expiresIn ?? LINK_TTL);
  };

  const verify = async () => {
    setVerifying(true);
    const r = await verifyKycDoc(astrologerId, doc.id);
    setVerifying(false);
    if (!r.ok) return toast(r.error.message, { type: "error" });
    setStatus(doc.id, "verified");
    toast(`${doc.name} verified`, { type: "success", description: "Recorded in audit log" });
  };

  const setStatus = (id, status) => setDocs((list) => list.map((d) => (d.id === id ? { ...d, status } : d)));

  const verified = docs.filter((d) => d.status === "verified").length;
  const expired = left === 0;
  const mmss = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;

  return (
    <>
      <div className="flex items-center justify-between gap-3 px-4 pt-3 text-xs text-muted sm:px-5">
        <span>
          <span className="font-semibold text-text tabular-nums">
            {verified}/{docs.length}
          </span>{" "}
          documents verified
        </span>
        <span className="inline-flex items-center gap-1">
          <Lock className="size-3.5" /> Private · signed links only
        </span>
      </div>
      <ul className="divide-y divide-border">
        {docs.map((d) => (
          <li key={d.id}>
            <button type="button" onClick={() => open(d.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface-2 sm:px-5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-3 text-muted">
                <FileText className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-text">{d.name}</span>
                <span className="block text-xs text-muted">Uploaded {formatDateTime(d.uploadedAt)}</span>
              </span>
              <StatusBadge status={d.status} />
            </button>
          </li>
        ))}
      </ul>

      <Modal
        open={Boolean(doc)}
        onClose={() => setOpenId(null)}
        title={doc?.name}
        description={`${astrologerName} · ${doc?.id ?? ""}`}
        size="lg"
        footer={
          doc && (
            <>
              <Button onClick={() => setOpenId(null)}>Close</Button>
              {canReview && (
                <>
                  <Button variant="danger-soft" icon={<CircleX />} disabled={doc.status === "rejected"} onClick={() => setRejecting(true)}>
                    Reject
                  </Button>
                  <Button
                    variant="success"
                    icon={<CircleCheck />}
                    disabled={doc.status === "verified"}
                    loading={verifying}
                    onClick={verify}
                  >
                    Verify
                  </Button>
                </>
              )}
            </>
          )
        }
      >
        {doc && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <StatusBadge status={doc.status} />
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold tabular-nums",
                  expired ? "bg-danger-soft text-danger" : "bg-surface-2 text-text-2"
                )}
              >
                <Lock className="size-3.5" />
                {expired ? "Signed link expired · close and reopen" : `Signed private link · expires in ${mmss}`}
              </span>
            </div>
            <div
              className={cn(
                "relative flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border border-dashed border-border-strong bg-surface-2 text-muted",
                expired && "opacity-40"
              )}
            >
              {!link ? (
                <Loader2 className="size-8 animate-spin" />
              ) : link.error ? (
                <p className="px-4 text-center text-sm text-danger">{link.error}</p>
              ) : expired ? (
                <p className="text-sm">Link expired</p>
              ) : preview ? (
                // eslint-disable-next-line @next/next/no-img-element -- private signed URL, must not go through the image optimiser
                <img src={link.url} alt={doc.name} referrerPolicy="no-referrer" onError={() => setPreview(false)} className="absolute inset-0 size-full bg-surface object-contain" />
              ) : (
                <>
                  <FileText className="size-10" />
                  <p className="text-sm font-semibold text-text-2">{doc.name}</p>
                  <a href={link.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                    Open document <ExternalLink className="size-3.5" />
                  </a>
                </>
              )}
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-2xl font-extrabold tracking-widest text-text/5 uppercase select-none -rotate-12">
                Confidential · Admin view
              </span>
            </div>
            <p className="flex items-start gap-2 rounded-lg bg-surface-2 px-3 py-2.5 text-xs text-muted">
              <ShieldAlert className="mt-0.5 size-3.5 shrink-0" />
              Do not download or share. Every view is recorded in the audit log.
            </p>
          </div>
        )}
      </Modal>

      <ReasonDialog
        open={rejecting}
        onClose={() => setRejecting(false)}
        title={`Reject ${doc?.name ?? "document"}`}
        description="The astrologer is asked to upload this document again."
        confirmLabel="Reject document"
        variant="danger"
        reasons={REJECT_REASONS}
        onConfirm={async (reason) => {
          const r = await rejectKycDoc(astrologerId, doc.id, reason);
          if (!r.ok) {
            toast(r.error.message, { type: "error" });
            return false;
          }
          setStatus(doc.id, "rejected");
          toast(`${doc.name} rejected`, { type: "warning", description: `Reason: ${reason}` });
        }}
      />
    </>
  );
}
