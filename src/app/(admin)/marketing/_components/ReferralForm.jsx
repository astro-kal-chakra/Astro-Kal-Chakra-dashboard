"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Field, Input, Select } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { useToast } from "@/providers/ToastProvider";
import { useAdmin } from "@/providers/AdminProvider";
import { formatCurrency } from "@/lib/utils";
import { saveReferralRules } from "@/actions/marketing";

const TRIGGERS = [
  { value: "signup", label: "Friend signs up" },
  { value: "first_recharge", label: "Friend's first recharge" },
  { value: "first_session", label: "Friend's first paid session" },
];

export function ReferralForm({ rules }) {
  const [enabled, setEnabled] = useState(rules.enabled);
  const [trigger, setTrigger] = useState(rules.trigger);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState({ referrer: rules.referrerReward, referee: rules.refereeReward });
  const toast = useToast();
  const { can } = useAdmin();
  // UI mirror of marketing:edit — the backend enforces the same check.
  const readOnly = !can("marketing", "edit");

  const save = async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.currentTarget));
    setSaving(true);
    // Disabled fieldsets don't submit their inputs: fall back to the saved values.
    const r = await saveReferralRules({
      enabled,
      trigger,
      referrerReward: d.referrerReward ?? rules.referrerReward,
      refereeReward: d.refereeReward ?? rules.refereeReward,
      minRecharge: d.minRecharge ?? rules.minRecharge,
      maxRewardsPerUser: d.maxRewardsPerUser ?? rules.maxRewardsPerUser,
      rewardExpiryDays: d.rewardExpiryDays ?? rules.rewardExpiryDays,
    });
    setSaving(false);
    if (!r.ok) return toast(r.error.message, { type: "error" });
    toast("Referral rules saved", { description: enabled ? "New rules apply to referrals from now on." : "Referral programme is turned off." });
  };

  return (
    <Card>
      <CardHeader
        title="Referral rules"
        description="Both rewards are credited to the wallet as bonus balance."
        action={
          <label className="flex items-center gap-2 text-sm font-semibold text-text-2">
            {enabled ? "Enabled" : "Disabled"}
            <Switch checked={enabled} onChange={setEnabled} name="enabled" label="Referral programme enabled" disabled={readOnly} />
          </label>
        }
      />
      <CardBody>
        <form onSubmit={save} className="space-y-5">
          <fieldset disabled={readOnly || !enabled} className="grid gap-4 disabled:opacity-60 sm:grid-cols-2">
            <Field label="Referrer reward (₹)" htmlFor="rf-referrer" help="Paid to the user who shared the code.">
              <Input
                id="rf-referrer"
                name="referrerReward"
                type="number"
                min="0"
                required
                defaultValue={rules.referrerReward}
                onChange={(e) => setPreview((p) => ({ ...p, referrer: Number(e.target.value) }))}
              />
            </Field>
            <Field label="Referee reward (₹)" htmlFor="rf-referee" help="Paid to the new user.">
              <Input
                id="rf-referee"
                name="refereeReward"
                type="number"
                min="0"
                required
                defaultValue={rules.refereeReward}
                onChange={(e) => setPreview((p) => ({ ...p, referee: Number(e.target.value) }))}
              />
            </Field>
            <Field label="Reward trigger" htmlFor="rf-trigger">
              <Select id="rf-trigger" name="trigger" value={trigger} onChange={(e) => setTrigger(e.target.value)} options={TRIGGERS} />
            </Field>
            <Field label="Min recharge (₹)" htmlFor="rf-min" help={trigger === "first_recharge" ? "Friend must recharge at least this much." : "Only used with the recharge trigger."}>
              <Input id="rf-min" name="minRecharge" type="number" min="0" defaultValue={rules.minRecharge} disabled={trigger !== "first_recharge"} />
            </Field>
            <Field label="Max rewards per user" htmlFor="rf-max">
              <Input id="rf-max" name="maxRewardsPerUser" type="number" min="1" required defaultValue={rules.maxRewardsPerUser} />
            </Field>
            <Field label="Reward expiry (days)" htmlFor="rf-exp" help="Unused bonus balance expires after this.">
              <Input id="rf-exp" name="rewardExpiryDays" type="number" min="1" required defaultValue={rules.rewardExpiryDays} />
            </Field>
          </fieldset>

          <p className="rounded-lg bg-surface-2 px-3 py-2.5 text-sm text-text-2">
            {enabled ? (
              <>
                When a friend completes <span className="font-semibold text-text">{TRIGGERS.find((t) => t.value === trigger)?.label.toLowerCase()}</span>, the referrer gets{" "}
                <span className="font-semibold text-success">{formatCurrency(preview.referrer)}</span> and the friend gets{" "}
                <span className="font-semibold text-success">{formatCurrency(preview.referee)}</span>.
              </>
            ) : (
              "Referral programme is off. Existing codes stop earning rewards."
            )}
          </p>

          {!readOnly && (
            <div className="flex justify-end">
              <Button type="submit" variant="primary" icon={<Save />} loading={saving}>
                Save rules
              </Button>
            </div>
          )}
        </form>
      </CardBody>
    </Card>
  );
}
