"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { ReasonDialog } from "@/components/common/ReasonDialog";
import { useAdmin } from "@/providers/AdminProvider";
import { useToast } from "@/providers/ToastProvider";

const BADGES = [
  { value: "Verified", hint: "KYC and certificates checked" },
  { value: "Top Rated", hint: "Shown at the top of search" },
  { value: "Celebrity", hint: "Featured on the home banner" },
  { value: "Rising Star", hint: "New astrologer with good ratings" },
];

const MODES = [
  { key: "chat", label: "Chat" },
  { key: "voice", label: "Voice" },
  { key: "video", label: "Video" },
];

const OFFLINE_REASONS = ["Repeated missed requests", "Complaint under review", "Quality review", "Astrologer asked for it"];

/**
 * Per-astrologer settings. UI-only: Save shows a toast. The backend must
 * re-check `astrologers.edit` and validate the limits.
 */
export function AstrologerSettingsForm({ astrologer }) {
  const { can } = useAdmin();
  const toast = useToast();
  const editable = can("astrologers", "edit");

  const [badges, setBadges] = useState(astrologer.badges);
  const [forcedOffline, setForcedOffline] = useState(false);
  const [offlineReason, setOfflineReason] = useState("");
  const [askReason, setAskReason] = useState(false);
  const [queuePaused, setQueuePaused] = useState(false);
  const [saving, setSaving] = useState(false);

  const toggleBadge = (b, on) => setBadges((list) => (on ? [...list, b] : list.filter((x) => x !== b)));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400)); // simulated API call
    setSaving(false);
    toast("Settings saved", { type: "success", description: `${astrologer.name} · recorded in audit log` });
  };

  return (
    <>
      <form onSubmit={submit}>
        <fieldset disabled={!editable} className="space-y-6 p-4 sm:p-5">
          {!editable && <p className="rounded-lg bg-surface-2 px-3 py-2.5 text-xs text-muted">You can view these settings but not change them.</p>}
  
          <section>
            <h3 className="mb-3 text-sm font-bold text-text">Commission and pricing</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Platform commission (%)" htmlFor="commission" help="Taken from every paid session.">
                <Input id="commission" name="commission" type="number" min="0" max="80" step="1" defaultValue={astrologer.commission} required />
              </Field>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {MODES.map((m) => (
                <div key={m.key} className="rounded-xl border border-border p-3">
                  <p className="mb-2 text-xs font-semibold text-text-2">
                    {m.label} · now ₹{astrologer[`${m.key}Price`]}/min
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="Min ₹/min" htmlFor={`${m.key}-min`}>
                      <Input id={`${m.key}-min`} name={`${m.key}Min`} type="number" min="0" defaultValue={5} />
                    </Field>
                    <Field label="Max ₹/min" htmlFor={`${m.key}-max`}>
                      <Input id={`${m.key}-max`} name={`${m.key}Max`} type="number" min="1" defaultValue={Math.ceil((astrologer[`${m.key}Price`] * 1.5) / 10) * 10} />
                    </Field>
                  </div>
                </div>
              ))}
            </div>
          </section>
  
          <section>
            <h3 className="mb-3 text-sm font-bold text-text">Badges</h3>
            <ul className="grid gap-2 sm:grid-cols-2">
              {BADGES.map((b) => (
                <li key={b.value} className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2.5">
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-text">{b.value}</span>
                    <span className="block text-xs text-muted">{b.hint}</span>
                  </span>
                  <Switch checked={badges.includes(b.value)} onChange={(on) => toggleBadge(b.value, on)} label={`${b.value} badge`} name={`badge-${b.value}`} disabled={!editable} />
                </li>
              ))}
            </ul>
          </section>
  
          <section>
            <h3 className="mb-3 text-sm font-bold text-text">Availability</h3>
            <ul className="space-y-2">
              <li className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2.5">
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-text">Force offline</span>
                  <span className="block text-xs text-muted">{forcedOffline ? `Reason: ${offlineReason}` : "Takes the astrologer offline until you turn this off. Needs a reason."}</span>
                </span>
                <Switch
                  checked={forcedOffline}
                  disabled={!editable}
                  label="Force offline"
                  name="forceOffline"
                  onChange={(on) => {
                    if (on) setAskReason(true);
                    else {
                      setForcedOffline(false);
                      setOfflineReason("");
                    }
                  }}
                />
              </li>
              <li className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2.5">
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-text">Pause queue</span>
                  <span className="block text-xs text-muted">Stops new requests. Running sessions continue.</span>
                </span>
                <Switch checked={queuePaused} onChange={setQueuePaused} label="Pause queue" name="pauseQueue" disabled={!editable} />
              </li>
            </ul>
            <input type="hidden" name="offlineReason" value={offlineReason} />
          </section>
  
          {editable && (
            <div className="flex justify-end border-t border-border pt-4">
              <Button type="submit" variant="primary" icon={<Save />} loading={saving}>
                Save settings
              </Button>
            </div>
          )}
        </fieldset>
      </form>

      {/* Kept outside the form: portal submit events still bubble through the React tree. */}
      <ReasonDialog
        open={askReason}
        onClose={() => setAskReason(false)}
        title="Force offline"
        description="The astrologer goes offline now. Save to apply."
        confirmLabel="Force offline"
        variant="danger"
        reasons={OFFLINE_REASONS}
        onConfirm={(reason) => {
          setForcedOffline(true);
          setOfflineReason(reason);
        }}
      />
    </>
  );
}
