"use client";

import { useActionState, useState } from "react";
import { AlertTriangle, ArrowLeft, Eye, EyeOff, KeyRound, Lock, Mail } from "lucide-react";
import { login } from "@/actions/auth";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/config/demoAccounts";
import { ROLE_MAP } from "@/config/permissions";

const MAX_ATTEMPTS = 5;

export function LoginForm() {
  const [state, action, pending] = useActionState(login, null);
  const [step, setStep] = useState("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [failures, setFailures] = useState(0);
  // The server result we already showed; a new credentials submit dismisses it.
  const [seen, setSeen] = useState(null);

  const locked = failures >= MAX_ATTEMPTS;
  const credentialsError = state?.step === "credentials" && state !== seen ? state.error : null;
  const onTwoFactor = step === "2fa" && !credentialsError;

  // Demo: the server checks credentials + TOTP together. Here we split the
  // UI into two steps and count failed code attempts for the lockout banner.
  const submitCredentials = (e) => {
    e.preventDefault();
    if (email && password) {
      setSeen(state);
      setStep("2fa");
    }
  };

  if (locked) {
    return (
      <div className="text-center">
        <span className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-danger-soft text-danger">
          <Lock className="size-6" />
        </span>
        <h2 className="text-xl font-extrabold text-text">Account temporarily locked</h2>
        <p className="mt-2 text-sm text-muted">Too many failed attempts. Try again in 15 minutes, or ask a Super Admin to unlock your account.</p>
      </div>
    );
  }

  if (!onTwoFactor) {
    return (
      <form onSubmit={submitCredentials} className="space-y-4">
        <div className="mb-6">
          <h2 className="text-2xl font-extrabold tracking-tight text-text">Sign in</h2>
          <p className="mt-1 text-sm text-muted">Use your staff email and password.</p>
        </div>
        <Field label="Email" htmlFor="email">
          <Input id="email" type="email" autoComplete="username" required icon={<Mail />} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@astroadmin.in" />
        </Field>
        <Field label="Password" htmlFor="password">
          <div className="relative">
            <Input
              id="password"
              type={show ? "text" : "password"}
              autoComplete="current-password"
              required
              icon={<Lock />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
            <button type="button" onClick={() => setShow(!show)} className="absolute top-1/2 right-2.5 -translate-y-1/2 p-1 text-muted hover:text-text" aria-label={show ? "Hide password" : "Show password"}>
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </Field>
        {credentialsError && (
          <p className="flex items-start gap-2 rounded-lg bg-danger-soft px-3 py-2.5 text-sm text-danger" role="alert">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            {credentialsError}
          </p>
        )}
        <Button type="submit" variant="primary" size="lg" className="w-full justify-center">
          Continue
        </Button>
        <DemoAccounts
          onPick={(a) => {
            setEmail(a.email);
            setPassword(DEMO_PASSWORD);
          }}
        />
      </form>
    );
  }

  return (
    <form
      action={(fd) => {
        if (!/^\d{6}$/.test(String(fd.get("code")).replace(/\s/g, ""))) setFailures((f) => f + 1);
        return action(fd);
      }}
      className="space-y-4"
    >
      <button type="button" onClick={() => setStep("credentials")} className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-text">
        <ArrowLeft className="size-3.5" /> Back
      </button>
      <div className="mb-2">
        <span className="mb-3 flex size-11 items-center justify-center rounded-xl bg-primary-soft text-primary-ink">
          <KeyRound className="size-5" />
        </span>
        <h2 className="text-2xl font-extrabold tracking-tight text-text">Two-factor verification</h2>
        <p className="mt-1 text-sm text-muted">
          Enter the 6-digit code from your authenticator app for <span className="font-semibold text-text-2">{email}</span>.
        </p>
      </div>
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="password" value={password} />
      <Field label="Authentication code" htmlFor="code">
        <Input
          id="code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={7}
          autoFocus
          required
          placeholder="123 456"
          className="text-center font-mono text-lg tracking-[0.4em]"
        />
      </Field>
      {state?.error && (
        <p className="flex items-start gap-2 rounded-lg bg-danger-soft px-3 py-2.5 text-sm text-danger" role="alert">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span>
            {state.error}
            {failures > 0 && ` ${MAX_ATTEMPTS - failures} attempt${MAX_ATTEMPTS - failures === 1 ? "" : "s"} left before lockout.`}
          </span>
        </p>
      )}
      <Button type="submit" variant="primary" size="lg" loading={pending} className="w-full justify-center">
        Verify and sign in
      </Button>
      <p className="text-center text-xs text-muted">Demo: any 6 digits work. Lost your device? Contact a Super Admin.</p>
    </form>
  );
}

/** Demo-only helper: one account per role, click to fill. Remove with real auth. */
function DemoAccounts({ onPick }) {
  return (
    <div className="rounded-xl border border-dashed border-border-strong p-3">
      <p className="mb-2 text-xs font-semibold text-text-2">
        Demo accounts · password <span className="font-mono text-text">{DEMO_PASSWORD}</span> · any 6-digit code
      </p>
      <ul className="space-y-1">
        {DEMO_ACCOUNTS.map((a) => (
          <li key={a.email}>
            <button
              type="button"
              onClick={() => onPick(a)}
              className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-xs hover:bg-surface-3"
            >
              <span className="font-semibold text-text">{ROLE_MAP[a.role].name}</span>
              <span className="truncate font-mono text-muted">{a.email}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
