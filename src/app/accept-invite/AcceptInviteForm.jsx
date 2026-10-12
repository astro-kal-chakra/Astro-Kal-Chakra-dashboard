"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, Check, Lock, X } from "lucide-react";
import { acceptInvite } from "@/actions/auth";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

// Same rules as the backend (400 WEAK_PASSWORD) and the profile password form.
const RULES = [
  { label: "At least 12 characters", test: (p) => p.length >= 12 },
  { label: "Upper and lower case letters", test: (p) => /[a-z]/.test(p) && /[A-Z]/.test(p) },
  { label: "At least one number", test: (p) => /\d/.test(p) },
  { label: "At least one symbol", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

export function AcceptInviteForm({ token }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState(token ? null : "This invite link is incomplete. Ask a Super Admin for a new invite.");
  const [pending, start] = useTransition();

  const valid = token && RULES.every((r) => r.test(password)) && password === confirm;

  const submit = (e) => {
    e.preventDefault();
    if (!valid) return;
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const r = await acceptInvite(fd);
      if (r?.error) setError(r.error);
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="mb-6">
        <h2 className="text-2xl font-extrabold tracking-tight text-text">Set your password</h2>
        <p className="mt-1 text-sm text-muted">You&apos;ll set up two-factor authentication when you first sign in.</p>
      </div>
      <input type="hidden" name="token" value={token} />
      <Field label="New password" htmlFor="inv-pw">
        <Input id="inv-pw" name="password" type="password" autoComplete="new-password" required icon={<Lock />} value={password} onChange={(e) => setPassword(e.target.value)} />
      </Field>
      <ul className="grid gap-1 sm:grid-cols-2">
        {RULES.map((r) => {
          const ok = r.test(password);
          return (
            <li key={r.label} className={cn("flex items-center gap-1.5 text-xs", ok ? "text-success" : "text-muted")}>
              {ok ? <Check className="size-3.5" /> : <X className="size-3.5" />}
              {r.label}
            </li>
          );
        })}
      </ul>
      <Field label="Confirm password" htmlFor="inv-confirm" help={confirm && confirm !== password ? <span className="text-danger">Passwords don&apos;t match.</span> : null}>
        <Input id="inv-confirm" type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      </Field>
      {error && (
        <p className="flex items-start gap-2 rounded-lg bg-danger-soft px-3 py-2.5 text-sm text-danger" role="alert">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      )}
      <Button type="submit" variant="primary" size="lg" loading={pending} disabled={!valid} className="w-full justify-center">
        Set password
      </Button>
    </form>
  );
}
