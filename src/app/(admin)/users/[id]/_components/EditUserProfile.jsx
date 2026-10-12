"use client";

import { useState } from "react";
import { UserPen } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Field, Input, Select } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { ReasonDialog } from "@/components/common/ReasonDialog";
import { useAdmin } from "@/providers/AdminProvider";
import { useToast } from "@/providers/ToastProvider";
import { openUserProfile, saveUserProfile } from "@/actions/users";

const REASONS = ["User asked support to update it", "Correcting wrong birth details", "Correcting contact details", "Policy / content issue"];
const GENDERS = [
  { value: "", label: "Not set" },
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];
const LANGUAGES = [
  ["en", "English"],
  ["hi", "Hindi"],
  ["ta", "Tamil"],
  ["te", "Telugu"],
  ["kn", "Kannada"],
  ["ml", "Malayalam"],
  ["mr", "Marathi"],
  ["bn", "Bengali"],
  ["gu", "Gujarati"],
  ["pa", "Punjabi"],
].map(([value, label]) => ({ value, label }));
const PREFS = [
  ["push", "Push notifications"],
  ["sms", "SMS"],
  ["promotional", "Offers & promotions"],
  ["horoscope", "Daily horoscope"],
];

const toForm = (p) => ({
  name: p.name,
  email: p.email,
  gender: p.gender ?? "",
  dob: p.dob ?? "",
  birthTime: p.birthTime ?? "",
  birthTimeUnknown: p.birthTimeUnknown,
  placeName: p.birthPlace?.name ?? "",
  placeLat: p.birthPlace?.lat != null ? String(p.birthPlace.lat) : "",
  placeLng: p.birthPlace?.lng != null ? String(p.birthPlace.lng) : "",
  language: p.language,
  city: p.city,
  state: p.state,
  prefs: { ...p.notificationPrefs },
  removeAvatar: false,
});

function changes(orig, f) {
  const o = toForm(orig);
  const out = {};
  for (const k of ["name", "email", "city", "state"]) if (f[k].trim() !== (o[k] ?? "").trim()) out[k] = f[k].trim();
  if (f.gender !== o.gender) out.gender = f.gender || null;
  if (f.dob !== o.dob) out.dob = f.dob || null;
  if (f.language !== o.language) out.language = f.language;
  if (f.birthTimeUnknown !== o.birthTimeUnknown) out.birthTimeUnknown = f.birthTimeUnknown;
  if (!f.birthTimeUnknown && f.birthTime !== o.birthTime) out.birthTime = f.birthTime || null;
  if (f.placeName !== o.placeName || f.placeLat !== o.placeLat || f.placeLng !== o.placeLng) {
    out.birthPlace = f.placeName.trim() ? { name: f.placeName.trim(), lat: Number(f.placeLat), lng: Number(f.placeLng) } : null;
  }
  const prefs = Object.fromEntries(PREFS.filter(([k]) => f.prefs[k] !== o.prefs[k]).map(([k]) => [k, f.prefs[k]]));
  if (Object.keys(prefs).length) out.notificationPrefs = prefs;
  if (f.removeAvatar) out.removeAvatar = true;
  return out;
}

/**
 * Edit everything the user can change in the app: name, contact, birth details (used for kundli and
 * readings), language, location and notification settings. Opening needs a reason (unmasked birth
 * details); saving needs a reason too. Both go to the audit log.
 */
export function EditUserProfile({ id }) {
  const { can } = useAdmin();
  const toast = useToast();
  const [asking, setAsking] = useState(false);
  const [orig, setOrig] = useState(null);
  const [f, setF] = useState(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  if (!can("users", "edit")) return null;

  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));

  const save = async (e) => {
    e.preventDefault();
    const c = changes(orig, f);
    if (!Object.keys(c).length) return toast("Nothing changed", { type: "info" });
    if (c.birthPlace && (!Number.isFinite(c.birthPlace.lat) || !Number.isFinite(c.birthPlace.lng))) return toast("Birth place needs latitude and longitude", { type: "error" });
    if (reason.trim().length < 3) return toast("Add a reason for the change", { type: "error" });
    setBusy(true);
    const r = await saveUserProfile(id, c, reason);
    setBusy(false);
    if (!r.ok) return toast(r.error.message, { type: "error" });
    toast("Profile updated", { description: `${Object.keys(c).length} field${Object.keys(c).length === 1 ? "" : "s"} changed · logged to audit` });
    setF(null);
    setOrig(null);
  };

  return (
    <>
      <Button size="sm" icon={<UserPen />} onClick={() => setAsking(true)}>
        Edit profile
      </Button>
      <ReasonDialog
        open={asking}
        onClose={() => setAsking(false)}
        title="Edit user profile"
        description="The editor shows birth details, so opening it is logged."
        confirmLabel="Open editor"
        reasons={REASONS}
        onConfirm={async (why) => {
          const r = await openUserProfile(id, why);
          if (!r.ok) {
            toast(r.error.message, { type: "error" });
            return false;
          }
          setOrig(r.data);
          setF(toForm(r.data));
          setReason(why);
        }}
      />
      <Modal open={Boolean(f)} onClose={() => setF(null)} title={`Edit profile · ${orig?.id ?? ""}`} description={orig ? `Phone ${orig.phone} (sign-in number, can't be changed here)` : ""} size="lg">
        {f && (
          <form onSubmit={save} className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Name" htmlFor="up-name">
                <Input id="up-name" required minLength={2} maxLength={80} value={f.name} onChange={(e) => set("name", e.target.value)} />
              </Field>
              <Field label="Email" htmlFor="up-email">
                <Input id="up-email" type="email" value={f.email} onChange={(e) => set("email", e.target.value)} />
              </Field>
              <Field label="Gender" htmlFor="up-gender">
                <Select id="up-gender" value={f.gender} onChange={(e) => set("gender", e.target.value)} options={GENDERS} />
              </Field>
              <Field label="App language" htmlFor="up-lang">
                <Select id="up-lang" value={f.language} onChange={(e) => set("language", e.target.value)} options={LANGUAGES} />
              </Field>
              <Field label="City" htmlFor="up-city">
                <Input id="up-city" value={f.city} onChange={(e) => set("city", e.target.value)} />
              </Field>
              <Field label="State" htmlFor="up-state">
                <Input id="up-state" value={f.state} onChange={(e) => set("state", e.target.value)} />
              </Field>
            </div>

            <section className="space-y-3 rounded-xl border border-border p-3.5">
              <h3 className="text-sm font-bold text-text">Birth details</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Date of birth" htmlFor="up-dob">
                  <Input id="up-dob" type="date" value={f.dob} onChange={(e) => set("dob", e.target.value)} />
                </Field>
                <Field label="Time of birth" htmlFor="up-time">
                  <Input id="up-time" type="time" value={f.birthTime} disabled={f.birthTimeUnknown} onChange={(e) => set("birthTime", e.target.value)} />
                </Field>
              </div>
              <label className="flex items-center gap-2 text-sm text-text-2">
                <input type="checkbox" checked={f.birthTimeUnknown} onChange={(e) => set("birthTimeUnknown", e.target.checked)} className="size-4 accent-primary" />
                Birth time not known
              </label>
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_110px_110px]">
                <Field label="Place of birth" htmlFor="up-place">
                  <Input id="up-place" value={f.placeName} onChange={(e) => set("placeName", e.target.value)} placeholder="Jaipur, Rajasthan" />
                </Field>
                <Field label="Latitude" htmlFor="up-lat">
                  <Input id="up-lat" type="number" step="any" min="-90" max="90" value={f.placeLat} onChange={(e) => set("placeLat", e.target.value)} />
                </Field>
                <Field label="Longitude" htmlFor="up-lng">
                  <Input id="up-lng" type="number" step="any" min="-180" max="180" value={f.placeLng} onChange={(e) => set("placeLng", e.target.value)} />
                </Field>
              </div>
              <p className="text-xs text-muted">Latitude and longitude are used for kundli calculations. Changing the birth details changes the user&apos;s chart.</p>
            </section>

            <section>
              <h3 className="mb-2 text-sm font-bold text-text">Notifications</h3>
              <ul className="grid gap-2 sm:grid-cols-2">
                {PREFS.map(([k, label]) => (
                  <li key={k} className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2">
                    <span className="text-sm text-text">{label}</span>
                    <Switch checked={f.prefs[k]} onChange={(v) => setF((s) => ({ ...s, prefs: { ...s.prefs, [k]: v } }))} label={label} />
                  </li>
                ))}
              </ul>
            </section>

            {orig.avatar && (
              <label className="flex items-center gap-2 text-sm text-text-2">
                <input type="checkbox" checked={f.removeAvatar} onChange={(e) => set("removeAvatar", e.target.checked)} className="size-4 accent-primary" />
                Remove profile photo
              </label>
            )}

            <div className="space-y-3 border-t border-border pt-4">
              <Field label="Reason for this change" htmlFor="up-reason" help="Saved in the audit log with every changed field.">
                <Input id="up-reason" required minLength={3} value={reason} onChange={(e) => setReason(e.target.value)} />
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
