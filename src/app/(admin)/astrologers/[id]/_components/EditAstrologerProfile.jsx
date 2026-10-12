"use client";

import { useState } from "react";
import { UserPen } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { ReasonDialog } from "@/components/common/ReasonDialog";
import { useAdmin } from "@/providers/AdminProvider";
import { useToast } from "@/providers/ToastProvider";
import { cn } from "@/lib/utils";
import { openAstrologerProfile, saveAstrologerProfile } from "@/actions/astrologers";

const REASONS = ["Astrologer asked support to update it", "Correcting wrong information", "Policy / content issue", "Bank details changed (verified)"];
const MODES = [
  { key: "chat", label: "Chat" },
  { key: "voice", label: "Voice" },
  { key: "video", label: "Video" },
];
// App order Mon–Sun; backend days are 0 = Sunday … 6 = Saturday
const DAYS = [
  ["Mon", 1],
  ["Tue", 2],
  ["Wed", 3],
  ["Thu", 4],
  ["Fri", 5],
  ["Sat", 6],
  ["Sun", 0],
];
const GENDERS = [
  { value: "", label: "Not set" },
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

/** Form state from the API's editable profile. */
function toForm(p) {
  return {
    name: p.name,
    displayName: p.displayName,
    email: p.email,
    gender: p.gender ?? "",
    dob: p.dob ?? "",
    experienceYears: String(p.experienceYears ?? 0),
    city: p.city,
    state: p.state,
    languages: (p.languages ?? []).join(", "),
    skills: p.skills ?? [],
    bio: p.bio,
    about: p.about,
    pricing: { ...p.pricing },
    availability: { ...p.availability },
    schedule: DAYS.map(([label, day]) => {
      const slot = p.schedule?.find((d) => d.day === day)?.slots?.[0];
      return { label, day, on: Boolean(slot), start: slot?.start ?? "10:00", end: slot?.end ?? "20:00" };
    }),
    autoConnect: p.autoConnect,
    breakSeconds: String(p.breakSeconds ?? 15),
    bank: { accountHolder: p.bank.accountHolder, accountNumber: "", ifsc: p.bank.ifsc, bankName: p.bank.bankName, upiId: p.bank.upiId },
    removeAvatar: false,
  };
}

/** Only what changed, in the API's shape. */
function changes(orig, f) {
  const o = toForm(orig);
  const out = {};
  for (const k of ["name", "displayName", "email", "city", "state", "bio", "about"]) if (f[k].trim() !== (o[k] ?? "").trim()) out[k] = f[k].trim();
  if (f.gender !== o.gender) out.gender = f.gender || null;
  if (f.dob !== o.dob) out.dob = f.dob || null;
  if (f.experienceYears !== o.experienceYears) out.experienceYears = Number(f.experienceYears);
  const langs = f.languages.split(",").map((x) => x.trim()).filter(Boolean);
  if (JSON.stringify(langs) !== JSON.stringify(orig.languages ?? [])) out.languages = langs;
  if (JSON.stringify([...f.skills].sort()) !== JSON.stringify([...(orig.skills ?? [])].sort())) out.skills = f.skills;
  const pricing = Object.fromEntries(MODES.filter((m) => Number(f.pricing[m.key]) !== Number(o.pricing[m.key])).map((m) => [m.key, Number(f.pricing[m.key])]));
  if (Object.keys(pricing).length) out.pricing = pricing;
  const availability = Object.fromEntries(MODES.filter((m) => f.availability[m.key] !== o.availability[m.key]).map((m) => [m.key, f.availability[m.key]]));
  if (Object.keys(availability).length) out.availability = availability;
  if (JSON.stringify(f.schedule) !== JSON.stringify(o.schedule)) out.schedule = f.schedule.filter((d) => d.on).map((d) => ({ day: d.day, slots: [{ start: d.start, end: d.end }] }));
  if (f.autoConnect !== o.autoConnect) out.autoConnect = f.autoConnect;
  if (f.breakSeconds !== o.breakSeconds) out.breakSeconds = Number(f.breakSeconds);
  const bank = {};
  for (const k of ["accountHolder", "ifsc", "bankName", "upiId"]) if (f.bank[k].trim() !== (o.bank[k] ?? "").trim()) bank[k] = f.bank[k].trim();
  if (f.bank.accountNumber.trim()) bank.accountNumber = f.bank.accountNumber.trim();
  if (Object.keys(bank).length) out.bank = bank;
  if (f.removeAvatar) out.removeAvatar = true;
  return out;
}

/**
 * Edit everything the astrologer can change in the app: profile, languages and skills, prices and
 * modes, weekly schedule, preferences and bank details. Opening needs a reason (it shows unmasked
 * data); saving needs a reason too. Both go to the audit log.
 */
export function EditAstrologerProfile({ id, skillOptions = [] }) {
  const { can } = useAdmin();
  const toast = useToast();
  const [asking, setAsking] = useState(false);
  const [orig, setOrig] = useState(null);
  const [f, setF] = useState(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  if (!can("astrologers", "edit")) return null;

  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const setIn = (group, k, v) => setF((s) => ({ ...s, [group]: { ...s[group], [k]: v } }));
  const setDay = (i, patch) => setF((s) => ({ ...s, schedule: s.schedule.map((d, j) => (j === i ? { ...d, ...patch } : d)) }));

  const save = async (e) => {
    e.preventDefault();
    const c = changes(orig, f);
    if (!Object.keys(c).length) return toast("Nothing changed", { type: "info" });
    if (reason.trim().length < 3) return toast("Add a reason for the change", { type: "error" });
    setBusy(true);
    const r = await saveAstrologerProfile(id, c, reason);
    setBusy(false);
    if (!r.ok) return toast(r.error.message, { type: "error" });
    toast("Profile updated", { description: `${Object.keys(c).length} field${Object.keys(c).length === 1 ? "" : "s"} changed · logged to audit` });
    setOrig(null);
    setF(null);
  };

  const limits = orig?.limits ?? {};

  return (
    <>
      <Button size="sm" icon={<UserPen />} onClick={() => setAsking(true)}>
        Edit profile
      </Button>
      <ReasonDialog
        open={asking}
        onClose={() => setAsking(false)}
        title="Edit astrologer profile"
        description="The editor shows contact, birth and bank details, so opening it is logged."
        confirmLabel="Open editor"
        reasons={REASONS}
        onConfirm={async (why) => {
          const r = await openAstrologerProfile(id, why);
          if (!r.ok) {
            toast(r.error.message, { type: "error" });
            return false;
          }
          setOrig(r.data);
          setF(toForm(r.data));
          setReason(why);
        }}
      />

      <Modal
        open={Boolean(f)}
        onClose={() => setF(null)}
        title={`Edit profile · ${orig?.id ?? ""}`}
        description={orig ? `Phone ${orig.phone} (sign-in number, can't be changed here)` : ""}
        size="xl"
      >
        {f && (
          <form onSubmit={save} className="space-y-6">
            <Section title="Profile">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Full name" htmlFor="ap-name">
                  <Input id="ap-name" required minLength={2} maxLength={80} value={f.name} onChange={(e) => set("name", e.target.value)} />
                </Field>
                <Field label="Display name (shown to users)" htmlFor="ap-dname">
                  <Input id="ap-dname" maxLength={80} value={f.displayName} onChange={(e) => set("displayName", e.target.value)} />
                </Field>
                <Field label="Email" htmlFor="ap-email">
                  <Input id="ap-email" type="email" value={f.email} onChange={(e) => set("email", e.target.value)} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Gender" htmlFor="ap-gender">
                    <Select id="ap-gender" value={f.gender} onChange={(e) => set("gender", e.target.value)} options={GENDERS} />
                  </Field>
                  <Field label="Date of birth" htmlFor="ap-dob">
                    <Input id="ap-dob" type="date" value={f.dob} onChange={(e) => set("dob", e.target.value)} />
                  </Field>
                </div>
                <Field label="Experience (years)" htmlFor="ap-exp">
                  <Input id="ap-exp" type="number" min="0" max="80" value={f.experienceYears} onChange={(e) => set("experienceYears", e.target.value)} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="City" htmlFor="ap-city">
                    <Input id="ap-city" value={f.city} onChange={(e) => set("city", e.target.value)} />
                  </Field>
                  <Field label="State" htmlFor="ap-state">
                    <Input id="ap-state" value={f.state} onChange={(e) => set("state", e.target.value)} />
                  </Field>
                </div>
                <Field label="Languages" htmlFor="ap-langs" help="Separate with commas, e.g. Hindi, English">
                  <Input id="ap-langs" value={f.languages} onChange={(e) => set("languages", e.target.value)} />
                </Field>
              </div>
              <Field label="Skills" className="mt-3">
                <div className="flex flex-wrap gap-1.5">
                  {[...new Set([...skillOptions, ...f.skills])].map((s) => {
                    const on = f.skills.includes(s);
                    return (
                      <button
                        type="button"
                        key={s}
                        onClick={() => set("skills", on ? f.skills.filter((x) => x !== s) : [...f.skills, s])}
                        className={cn("rounded-full border px-2.5 py-1 text-xs font-semibold", on ? "border-primary bg-primary-soft text-primary-ink" : "border-border text-text-2 hover:bg-surface-2")}
                        aria-pressed={on}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </Field>
              <Field label="Short bio" htmlFor="ap-bio" hint={`${f.bio.length}/300`} className="mt-3">
                <Textarea id="ap-bio" rows={3} minLength={20} maxLength={300} value={f.bio} onChange={(e) => set("bio", e.target.value)} />
              </Field>
              <Field label="About (long description)" htmlFor="ap-about" className="mt-3">
                <Textarea id="ap-about" rows={4} maxLength={4000} value={f.about} onChange={(e) => set("about", e.target.value)} />
              </Field>
              {orig.avatar && (
                <label className="mt-3 flex items-center gap-2 text-sm text-text-2">
                  <input type="checkbox" checked={f.removeAvatar} onChange={(e) => set("removeAvatar", e.target.checked)} className="size-4 accent-primary" />
                  Remove profile photo
                </label>
              )}
            </Section>

            <Section title="Prices & modes" hint="₹ per minute · 0 turns the mode off">
              <div className="grid gap-3 sm:grid-cols-3">
                {MODES.map((m) => (
                  <div key={m.key} className="rounded-xl border border-border p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-semibold text-text">{m.label}</span>
                      <Switch checked={f.availability[m.key]} onChange={(v) => setIn("availability", m.key, v)} label={`${m.label} on`} />
                    </div>
                    <Input
                      type="number"
                      min="0"
                      aria-label={`${m.label} price`}
                      value={f.pricing[m.key]}
                      onChange={(e) => setIn("pricing", m.key, e.target.value)}
                    />
                    {limits[m.key] && (
                      <p className="mt-1 text-[11px] text-muted">
                        Allowed ₹{limits[m.key].min}–₹{limits[m.key].max}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Weekly schedule">
              <ul className="space-y-1.5">
                {f.schedule.map((d, i) => (
                  <li key={d.label} className="flex flex-wrap items-center gap-3 rounded-lg border border-border px-3 py-2">
                    <span className="w-10 text-sm font-semibold text-text">{d.label}</span>
                    <Switch checked={d.on} onChange={(v) => setDay(i, { on: v })} label={`${d.label} available`} />
                    <Input type="time" aria-label={`${d.label} from`} value={d.start} disabled={!d.on} onChange={(e) => setDay(i, { start: e.target.value })} className="w-32" />
                    <span className="text-xs text-muted">to</span>
                    <Input type="time" aria-label={`${d.label} to`} value={d.end} disabled={!d.on} onChange={(e) => setDay(i, { end: e.target.value })} className="w-32" />
                  </li>
                ))}
              </ul>
            </Section>

            <Section title="Preferences">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2.5">
                  <span className="text-sm text-text">Auto-connect the next user in the waitlist</span>
                  <Switch checked={f.autoConnect} onChange={(v) => set("autoConnect", v)} label="Auto-connect" />
                </label>
                <Field label="Break between sessions (seconds)" htmlFor="ap-break">
                  <Input id="ap-break" type="number" min="0" max="600" value={f.breakSeconds} onChange={(e) => set("breakSeconds", e.target.value)} />
                </Field>
              </div>
            </Section>

            <Section title="Bank details" hint={orig.bank.accountLast4 ? `Account on file ends in ${orig.bank.accountLast4}` : "No bank account on file"}>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Account holder" htmlFor="ap-holder">
                  <Input id="ap-holder" value={f.bank.accountHolder} onChange={(e) => setIn("bank", "accountHolder", e.target.value)} />
                </Field>
                <Field label="New account number" htmlFor="ap-acc" help="Leave empty to keep the current one">
                  <Input id="ap-acc" inputMode="numeric" pattern="\d{9,18}" value={f.bank.accountNumber} onChange={(e) => setIn("bank", "accountNumber", e.target.value.replace(/\D/g, ""))} />
                </Field>
                <Field label="IFSC" htmlFor="ap-ifsc">
                  <Input id="ap-ifsc" className="font-mono uppercase" value={f.bank.ifsc} onChange={(e) => setIn("bank", "ifsc", e.target.value)} />
                </Field>
                <Field label="Bank name" htmlFor="ap-bank">
                  <Input id="ap-bank" value={f.bank.bankName} onChange={(e) => setIn("bank", "bankName", e.target.value)} />
                </Field>
                <Field label="UPI ID" htmlFor="ap-upi">
                  <Input id="ap-upi" value={f.bank.upiId} onChange={(e) => setIn("bank", "upiId", e.target.value)} />
                </Field>
              </div>
            </Section>

            <div className="space-y-3 border-t border-border pt-4">
              <Field label="Reason for this change" htmlFor="ap-reason" help="Saved in the audit log with every changed field.">
                <Input id="ap-reason" required minLength={3} value={reason} onChange={(e) => setReason(e.target.value)} />
              </Field>
              <div className="flex justify-end gap-2">
                <Button onClick={() => setF(null)}>Cancel</Button>
                <Button type="submit" variant="primary" loading={busy}>
                  Save changes
                </Button>
              </div>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}

function Section({ title, hint, children }) {
  return (
    <section>
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-bold text-text">{title}</h3>
        {hint && <span className="text-xs text-muted">{hint}</span>}
      </div>
      {children}
    </section>
  );
}
