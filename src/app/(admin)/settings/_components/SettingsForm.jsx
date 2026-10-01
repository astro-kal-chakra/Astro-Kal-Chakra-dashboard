"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, Save } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Field, Input, Textarea } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/providers/ToastProvider";
import { useAdmin } from "@/providers/AdminProvider";
import { cn } from "@/lib/utils";

/** Human labels for every setting, used in the "before → after" confirm list. */
const LABELS = {
  defaultCommission: "Default commission (%)",
  freeChatEnabled: "Free first chat",
  freeChatMinutes: "Free chat minutes",
  minWalletBalance: "Minimum wallet balance (₹)",
  minBalanceMinutes: "Minimum balance (minutes)",
  refundAutoApproveLimit: "Refund auto-approve limit (₹)",
  queueMaxLength: "Max queue length",
  queueOfferTimeoutSec: "Offer timeout (seconds)",
  maintenanceMode: "Maintenance mode",
  maintenanceMessage: "Maintenance message",
  androidMinVersion: "Android minimum version",
  androidLatestVersion: "Android latest version",
  iosMinVersion: "iOS minimum version",
  iosLatestVersion: "iOS latest version",
};

const FEATURES = {
  videoCalls: ["Video calls", "Users can start video consultations."],
  voiceCalls: ["Voice calls", "Users can start voice consultations."],
  kundliMatching: ["Kundli matching", "Free kundli matching tool on the home screen."],
  liveStreams: ["Live streams", "Astrologers can go live to many users at once."],
  referrals: ["Referrals", "Invite friends and earn wallet credit."],
  giftsInChat: ["Gifts in chat", "Users can send paid gifts during a chat."],
};

const show = (v) => (typeof v === "boolean" ? (v ? "On" : "Off") : v === "" || v == null ? "—" : String(v));

function diff(before, after) {
  const out = [];
  for (const key of Object.keys(LABELS)) {
    if (before[key] !== after[key]) out.push({ key, label: LABELS[key], from: show(before[key]), to: show(after[key]) });
  }
  for (const key of Object.keys(FEATURES)) {
    if (before.features?.[key] !== after.features?.[key]) {
      out.push({ key: `features.${key}`, label: `Feature: ${FEATURES[key][0]}`, from: show(before.features?.[key]), to: show(after.features?.[key]) });
    }
  }
  return out;
}

export function SettingsForm({ initial }) {
  const toast = useToast();
  const { can } = useAdmin();
  // UI mirror of the backend check: only admins with settings:edit can change values.
  const editable = can("settings", "edit");

  const [saved, setSaved] = useState(initial);
  const [values, setValues] = useState(initial);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const changes = useMemo(() => diff(saved, values), [saved, values]);
  const dirty = changes.length > 0;

  const set = (key, value) => setValues((v) => ({ ...v, [key]: value }));
  const setNum = (key) => (e) => set(key, e.target.value === "" ? "" : Number(e.target.value));
  const setStr = (key) => (e) => set(key, e.target.value);
  const setFeature = (key, value) => setValues((v) => ({ ...v, features: { ...v.features, [key]: value } }));

  const save = async () => {
    setBusy(true);
    await new Promise((r) => setTimeout(r, 400)); // simulated PUT /settings
    setBusy(false);
    setSaved(values);
    setConfirmOpen(false);
    toast("Settings saved · logged to audit", { description: `${changes.length} change${changes.length === 1 ? "" : "s"} applied` });
  };

  const num = (key, props = {}) => (
    <Input id={key} type="number" inputMode="numeric" value={values[key]} onChange={setNum(key)} disabled={!editable} className="tabular-nums" {...props} />
  );

  return (
    <div className="space-y-4 lg:space-y-5">
      {values.maintenanceMode && (
        <div role="alert" className="flex items-start gap-3 rounded-2xl border border-danger/40 bg-danger-soft p-4 sm:p-5">
          <AlertTriangle className="mt-0.5 size-6 shrink-0 text-danger" />
          <div className="min-w-0">
            <p className="text-base font-bold text-danger">Maintenance mode is {saved.maintenanceMode ? "ON" : "about to be turned ON"}</p>
            <p className="mt-1 text-sm text-text-2">
              Users can&apos;t start chats, calls or recharges. Live sessions keep running until they end. Turn it off as soon as the work is done.
            </p>
          </div>
        </div>
      )}

      {!editable && (
        <p className="rounded-xl bg-surface-2 px-4 py-3 text-sm text-muted">You can view these settings but not change them.</p>
      )}

      <div className="grid gap-4 lg:grid-cols-2 lg:gap-5">
        <Card>
          <CardHeader title="Commission & billing" description="Applies to new sessions only." />
          <CardBody className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={LABELS.defaultCommission} htmlFor="defaultCommission" help="Platform share of each paid minute.">
                {num("defaultCommission", { min: 0, max: 100 })}
              </Field>
              <Field label={LABELS.refundAutoApproveLimit} htmlFor="refundAutoApproveLimit" help="Refunds up to this amount skip review.">
                {num("refundAutoApproveLimit", { min: 0 })}
              </Field>
            </div>
            <div className="rounded-xl border border-border p-3.5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-text">Free first chat</p>
                  <p className="text-xs text-muted">New users get a free chat on their first session.</p>
                </div>
                <Switch checked={values.freeChatEnabled} onChange={(v) => set("freeChatEnabled", v)} label="Free first chat" disabled={!editable} />
              </div>
              {values.freeChatEnabled && (
                <Field label={LABELS.freeChatMinutes} htmlFor="freeChatMinutes" className="mt-3">
                  {num("freeChatMinutes", { min: 1, max: 30 })}
                </Field>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={LABELS.minWalletBalance} htmlFor="minWalletBalance" help="Needed to start a paid session.">
                {num("minWalletBalance", { min: 0 })}
              </Field>
              <Field label={LABELS.minBalanceMinutes} htmlFor="minBalanceMinutes" help="Balance must cover this many minutes.">
                {num("minBalanceMinutes", { min: 1 })}
              </Field>
            </div>
          </CardBody>
        </Card>

        <div className="space-y-4 lg:space-y-5">
          <Card>
            <CardHeader title="Queue rules" description="How users wait for busy astrologers." />
            <CardBody className="grid gap-4 sm:grid-cols-2">
              <Field label={LABELS.queueMaxLength} htmlFor="queueMaxLength" help="Per astrologer.">
                {num("queueMaxLength", { min: 1, max: 50 })}
              </Field>
              <Field label={LABELS.queueOfferTimeoutSec} htmlFor="queueOfferTimeoutSec" help="Time to accept before the next user is offered.">
                {num("queueOfferTimeoutSec", { min: 10, max: 300 })}
              </Field>
            </CardBody>
          </Card>

          <Card className={cn(values.maintenanceMode && "border-danger/50")}>
            <CardHeader
              title="Maintenance mode"
              description="Blocks new sessions and recharges across the apps."
              action={<Switch checked={values.maintenanceMode} onChange={(v) => set("maintenanceMode", v)} label="Maintenance mode" disabled={!editable} />}
            />
            <CardBody>
              <Field label="Message shown to users" htmlFor="maintenanceMessage">
                <Textarea id="maintenanceMessage" rows={3} value={values.maintenanceMessage} onChange={setStr("maintenanceMessage")} disabled={!editable} />
              </Field>
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardHeader title="App versions" description="Below the minimum, users must update. Below the latest, they see a prompt." />
          <CardBody className="grid gap-4 sm:grid-cols-2">
            {[
              ["androidMinVersion", "Android minimum", "Force update"],
              ["androidLatestVersion", "Android latest", "Soft prompt"],
              ["iosMinVersion", "iOS minimum", "Force update"],
              ["iosLatestVersion", "iOS latest", "Soft prompt"],
            ].map(([key, label, hint]) => (
              <Field key={key} label={label} hint={hint} htmlFor={key}>
                <Input id={key} value={values[key]} onChange={setStr(key)} disabled={!editable} className="font-mono" placeholder="4.3.0" pattern="\d+\.\d+\.\d+" />
              </Field>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Feature flags" description="Turn features on or off without an app release." />
          <ul className="divide-y divide-border">
            {Object.entries(FEATURES).map(([key, [label, desc]]) => (
              <li key={key} className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-sm font-semibold text-text">
                    {label}
                    {saved.features[key] !== values.features[key] && <Badge tone="warning">Changed</Badge>}
                  </p>
                  <p className="text-xs text-muted">{desc}</p>
                </div>
                <Switch checked={values.features[key]} onChange={(v) => setFeature(key, v)} label={label} disabled={!editable} />
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {dirty && (
        <div className="sticky bottom-3 z-30 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-4 py-3 shadow-pop">
          <p className="text-sm text-text-2">
            <span className="font-semibold text-text">{changes.length}</span> unsaved change{changes.length === 1 ? "" : "s"}
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setValues(saved)}>
              Discard
            </Button>
            <Button variant="primary" icon={<Save />} onClick={() => setConfirmOpen(true)}>
              Save changes
            </Button>
          </div>
        </div>
      )}

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Save settings?"
        description="These changes apply to all users right away and are logged to the audit log."
        footer={
          <>
            <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button variant="primary" loading={busy} onClick={save}>
              Save {changes.length} change{changes.length === 1 ? "" : "s"}
            </Button>
          </>
        }
      >
        <ul className="divide-y divide-border rounded-xl border border-border">
          {changes.map((c) => (
            <li key={c.key} className="px-3 py-2.5">
              <p className="text-xs font-semibold text-muted">{c.label}</p>
              <p className="mt-0.5 flex flex-wrap items-center gap-2 text-sm">
                <span className="break-all text-muted line-through">{c.from}</span>
                <ArrowRight className="size-3.5 shrink-0 text-muted" />
                <span className="font-semibold break-all text-text">{c.to}</span>
              </p>
            </li>
          ))}
        </ul>
      </Modal>
    </div>
  );
}
