"use client";

import { useState } from "react";
import { Gift, Send } from "lucide-react";
import { Field, Textarea } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ActionButton } from "@/components/common/ActionButton";
import { useToast } from "@/providers/ToastProvider";
import { useAdmin } from "@/providers/AdminProvider";
import { requestFreeChat, turnOffFreeChat } from "@/actions/freeChat";

const MODE_LABELS = { chat: "Chat", call: "Voice call", video: "Video call" };
const STATUS_TONE = { online: "success", busy: "warning", offline: "neutral" };
const DEFAULT_MESSAGE = 'New users are waiting for their free first session. Please turn on "Free chat available" in the app and help them get started.';

/** ["chat", "call"] → "Chat + Voice call" */
export const modesLabel = (modes) => (modes?.length ? modes : ["chat"]).map((m) => MODE_LABELS[m] || m).join(" + ");

/**
 * Inside Settings → Free first chat: ask chosen astrologers (IDs) to take free sessions in the modes picked here
 * (any of chat / voice / video), optionally switching "Free chat" on for them, and see who is in free mode now.
 * The modes are saved per astrologer; the Settings modes above are only the default.
 */
export function FreeChatAstrologers({ data, modes: defaultModes, minutes, unsaved }) {
  const toast = useToast();
  const { can } = useAdmin();
  const editable = can("settings", "edit");
  const [ids, setIds] = useState("");
  const [message, setMessage] = useState("");
  const [enable, setEnable] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [modes, setModes] = useState(defaultModes?.length ? defaultModes : ["chat"]);
  const rows = data?.rows ?? [];
  const count = ids.split(/[\s,]+/).filter(Boolean).length;
  const freeLabel = modes.length ? modesLabel(modes) : "…";
  const paused = Object.keys(MODE_LABELS)
    .filter((m) => !modes.includes(m))
    .map((m) => MODE_LABELS[m].toLowerCase());

  const send = async (e) => {
    e.preventDefault();
    if (!count) return toast("Enter at least one astrologer ID", { type: "error" });
    setBusy(true);
    if (!modes.length) return toast("Pick at least one free mode", { type: "error" });
    const r = await requestFreeChat({ astrologers: ids, message, enable, modes });
    setBusy(false);
    if (!r.ok) return toast(r.error.message, { type: "error", duration: 6000 });
    setResult(r.data.data);
    toast(r.data.message || "Sent", { description: enable ? `Free ${freeLabel} switched on and astrologers notified` : "Astrologers notified" });
    if (!r.data.data.notFound?.length && !r.data.data.skipped?.length) setIds("");
  };

  return (
    <div className="mt-4 space-y-4 border-t border-border pt-4">
      <div>
        <p className="text-sm font-semibold text-text">Free chat astrologers</p>
        <p className="text-xs text-muted">
          Ask chosen astrologers to take free sessions for new users ({minutes ?? 3} min each) in the modes you pick here. They get a push and an in-app notification.
        </p>
      </div>
      {unsaved && (
        <p className="rounded-lg bg-warning-soft px-3 py-2 text-sm text-warning" role="status">
          You changed the free chat settings above. Save them first: astrologers switched on here use the saved minutes.
        </p>
      )}
      <form onSubmit={send} className="space-y-4">
        <Field label="Astrologer IDs" htmlFor="fc-ids" help="Separate with commas, e.g. A201, A305, A412 (up to 200).">
          <Textarea id="fc-ids" rows={2} value={ids} onChange={(e) => setIds(e.target.value)} placeholder="A201, A305" disabled={!editable} className="font-mono text-[13px]" />
        </Field>
        <fieldset>
          <legend className="mb-1.5 text-sm font-medium text-text">Free for these astrologers</legend>
          <div className="flex flex-wrap gap-2">
            {Object.entries(MODE_LABELS).map(([mode, label]) => {
              const on = modes.includes(mode);
              return (
                <label
                  key={mode}
                  className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-sm ${on ? "border-primary bg-primary-soft text-text" : "border-border text-muted"}`}
                >
                  <input
                    type="checkbox"
                    checked={on}
                    disabled={!editable}
                    onChange={(e) => setModes((cur) => (e.target.checked ? [...new Set([...cur, mode])] : cur.filter((m) => m !== mode)))}
                  />
                  {label}
                </label>
              );
            })}
          </div>
          <p className="mt-1.5 text-xs text-muted">Any one, two or all three. Saved for each astrologer; the modes above are only the default for astrologers you haven&apos;t set.</p>
        </fieldset>
        <Field label="Message (optional)" htmlFor="fc-msg" help="Leave empty to send the standard message.">
          <Textarea id="fc-msg" rows={2} maxLength={300} value={message} onChange={(e) => setMessage(e.target.value)} placeholder={DEFAULT_MESSAGE} disabled={!editable} />
        </Field>
        <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-3.5">
          <div>
            <p className="text-sm font-semibold text-text">Make selected astrologers available for free {freeLabel}</p>
            <p className="text-xs text-muted">
              Switches &ldquo;Free chat&rdquo; on for them now: users who haven&apos;t had their free session get a free {freeLabel} session
              (₹0 for the user, no earning for the astrologer). Everyone else books their normal paid sessions. On until they or you turn it off.
            </p>
          </div>
          <Switch checked={enable} onChange={setEnable} label={`Make selected astrologers available for free ${freeLabel}`} disabled={!editable || unsaved || !modes.length} />
        </div>
        {editable && (
          <div className="flex justify-end">
            <Button type="submit" variant="primary" icon={<Send />} loading={busy} disabled={!count || !modes.length || (enable && unsaved)}>
              {enable ? `Switch on & notify${count ? ` (${count})` : ""}` : `Send request${count ? ` (${count})` : ""}`}
            </Button>
          </div>
        )}
      </form>

      {result && (result.notFound?.length > 0 || result.skipped?.length > 0) && (
        <div className="rounded-lg border border-border p-3 text-sm" role="status">
          {result.notFound?.length > 0 && <p className="text-danger">Not found: {result.notFound.join(", ")}</p>}
          {result.skipped?.map((s) => (
            <p key={s.id} className="text-warning">
              {s.id}: {s.reason}
            </p>
          ))}
        </div>
      )}

      <div>
        <p className="mb-2 text-sm font-semibold text-text">In free mode now ({rows.length})</p>
        {rows.length === 0 ? (
          <p className="text-sm text-muted">No astrologer has free chat on.</p>
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border">
            {rows.map((a) => (
              <li key={a.id} className="flex items-center gap-3 px-3 py-2.5">
                <Gift className="size-4 shrink-0 text-primary" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text">{a.name}</p>
                  <p className="font-mono text-xs text-muted">
                    {a.id} · free {modesLabel(a.freeModes)}
                  </p>
                </div>
                <Badge tone={STATUS_TONE[a.status] || "neutral"} dot>
                  {a.status}
                </Badge>
                <ActionButton
                  module="settings"
                  size="xs"
                  variant="ghost"
                  confirm
                  dialogTitle="Turn off free chat"
                  dialogDescription={`${a.name} goes back to paid sessions and gets a notification.`}
                  confirmLabel="Turn off"
                  success="Free chat turned off"
                  run={turnOffFreeChat.bind(null, a.id)}
                >
                  Turn off
                </ActionButton>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
