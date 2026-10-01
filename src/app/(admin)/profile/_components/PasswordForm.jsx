"use client";

import { useState } from "react";
import { Check, Eye, EyeOff, X } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/providers/ToastProvider";
import { cn } from "@/lib/utils";

const RULES = [
  { label: "At least 12 characters", test: (p) => p.length >= 12 },
  { label: "Upper and lower case letters", test: (p) => /[a-z]/.test(p) && /[A-Z]/.test(p) },
  { label: "At least one number", test: (p) => /\d/.test(p) },
  { label: "At least one symbol", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

const LEVELS = [
  { label: "Too weak", bar: "bg-danger", text: "text-danger" },
  { label: "Weak", bar: "bg-danger", text: "text-danger" },
  { label: "Fair", bar: "bg-warning", text: "text-warning" },
  { label: "Good", bar: "bg-info", text: "text-info" },
  { label: "Strong", bar: "bg-success", text: "text-success" },
];

export function PasswordForm() {
  const toast = useToast();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  const passed = RULES.filter((r) => r.test(next)).length;
  const score = next ? passed : 0;
  const level = LEVELS[score];
  const mismatch = confirm && confirm !== next;
  const sameAsOld = next && next === current;
  const valid = current && passed === RULES.length && next === confirm && !sameAsOld;

  const submit = async (e) => {
    e.preventDefault();
    if (!valid) return;
    setBusy(true);
    await new Promise((r) => setTimeout(r, 450)); // simulated POST /me/password
    setBusy(false);
    setCurrent("");
    setNext("");
    setConfirm("");
    toast("Password changed", { description: "Other sessions were signed out · logged to audit" });
  };

  const type = show ? "text" : "password";

  return (
    <Card>
      <CardHeader
        title="Change password"
        description="Changing it signs you out everywhere else."
        action={
          <Button size="xs" variant="ghost" icon={show ? <EyeOff /> : <Eye />} onClick={() => setShow((s) => !s)}>
            {show ? "Hide" : "Show"}
          </Button>
        }
      />
      <CardBody>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Current password" htmlFor="pw-current">
            <Input id="pw-current" type={type} autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
          </Field>
          <Field label="New password" htmlFor="pw-new">
            <Input id="pw-new" type={type} autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} required aria-describedby="pw-rules" />
          </Field>

          <div aria-live="polite">
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((i) => (
                <span key={i} className={cn("h-1.5 flex-1 rounded-full", i <= score ? level.bar : "bg-surface-3")} />
              ))}
            </div>
            <p className={cn("mt-1.5 text-xs font-semibold", next ? level.text : "text-muted")}>{next ? `Strength: ${level.label}` : "Strength"}</p>
            <ul id="pw-rules" className="mt-2 grid gap-1 sm:grid-cols-2">
              {RULES.map((r) => {
                const ok = r.test(next);
                return (
                  <li key={r.label} className={cn("flex items-center gap-1.5 text-xs", ok ? "text-success" : "text-muted")}>
                    {ok ? <Check className="size-3.5" /> : <X className="size-3.5" />}
                    {r.label}
                  </li>
                );
              })}
            </ul>
            {sameAsOld && <p className="mt-2 text-xs text-danger">New password must be different from the current one.</p>}
          </div>

          <Field label="Confirm new password" htmlFor="pw-confirm" help={mismatch ? <span className="text-danger">Passwords don&apos;t match.</span> : null}>
            <Input id="pw-confirm" type={type} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required aria-invalid={mismatch || undefined} />
          </Field>

          <div className="flex justify-end">
            <Button type="submit" variant="primary" disabled={!valid} loading={busy}>
              Update password
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
