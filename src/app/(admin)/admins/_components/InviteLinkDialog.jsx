"use client";

import { useRef, useState } from "react";
import { Check, Copy, MessageCircle, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { formatDateTime } from "@/lib/utils";

/**
 * Shows an admin invite link to share by hand (email isn't set up on the backend, or it failed).
 * Copy works on http too (falls back to selecting the text), and WhatsApp opens with a ready message.
 */
export function InviteLinkDialog({ invite, onClose }) {
  const inputRef = useRef(null);
  const [copied, setCopied] = useState(false);
  if (!invite) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(invite.url);
    } catch {
      // No clipboard API on plain http: select the text and use the legacy copy command
      inputRef.current?.select();
      document.execCommand?.("copy");
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const message = `Hi ${invite.name || ""}, you've been invited to the Astro Kaal Chakra admin dashboard. Set your password here (link valid until ${formatDateTime(invite.expiresAt)}): ${invite.url}`;

  return (
    <Modal open onClose={onClose} title="Share the invite link" description={`${invite.email} · ${invite.role}`}>
      <div className="space-y-4">
        <p className="flex items-start gap-2 rounded-lg bg-warning-soft px-3 py-2.5 text-xs text-warning">
          <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
          {invite.emailSent ? "The invite email was sent. You can also share this link directly." : "Email isn't set up yet, so no email was sent. Send this link to them yourself."}
        </p>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            readOnly
            value={invite.url}
            onFocus={(e) => e.target.select()}
            className="min-w-0 flex-1 rounded-lg border border-border bg-surface-2 px-3 py-2 font-mono text-xs text-text"
            aria-label="Invite link"
          />
          <Button size="sm" icon={copied ? <Check /> : <Copy />} onClick={copy}>
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
        <p className="text-xs text-muted">
          Valid until {formatDateTime(invite.expiresAt)}. Only share it with {invite.email} — whoever opens it can set the password for this account. They set up two-factor authentication on first login.
        </p>
        <div className="flex justify-end gap-2 border-t border-border pt-3">
          <a href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer">
            <Button size="sm" icon={<MessageCircle />}>
              Share on WhatsApp
            </Button>
          </a>
          <Button size="sm" variant="primary" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
}
