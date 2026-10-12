"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, Copy, Download, Eye, EyeOff, Info, KeyRound, Lock, Mail, ShieldCheck } from "lucide-react";
import { startLogin, verifyLogin } from "@/actions/auth";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { downloadCSV, formatDateTime } from "@/lib/utils";

const NOTICES = {
  idle: "You were signed out after 30 minutes of inactivity.",
  expired: "Your session ended. Sign in again.",
  invited: "Password set. Sign in to set up two-factor authentication.",
  elsewhere: "You were signed out because your account signed in on another device. Only one device can be signed in at a time.",
};

/**
 * Two-step sign-in against the auth API: email + password, then the 6-digit
 * authenticator code. First sign-in (or after a 2FA reset) shows the QR code to
 * enrol and the one-time recovery codes. Tokens are set as httpOnly cookies by
 * the server action; this component never sees them.
 */
export function LoginForm({ notice }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [step, setStep] = useState("credentials"); // credentials | 2fa | 2fa_setup | recovery | locked
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState(null);
  const [setup, setSetup] = useState(null);
  const [codes, setCodes] = useState([]);
  const [lockedUntil, setLockedUntil] = useState(null);

  const handle = (r) => {
    if (r?.locked) {
      setLockedUntil(r.lockedUntil);
      setStep("locked");
      return;
    }
    setError(r?.error ? { message: r.error, attemptsLeft: r.attemptsLeft } : null);
  };

  const submitCredentials = (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const r = await startLogin(fd);
      if (r?.step) {
        setError(null);
        setSetup(r.setup ?? null);
        setStep(r.step);
      } else handle(r);
    });
  };

  const submitCode = (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const r = await verifyLogin(fd);
      if (r?.step === "recovery") {
        setCodes(r.recoveryCodes);
        setStep("recovery");
      } else if (r?.restart) {
        setStep("credentials");
        setError({ message: r.error });
      } else handle(r);
    });
  };

  if (step === "locked") {
    return (
      <div className="text-center">
        <span className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-danger-soft text-danger">
          <Lock className="size-6" />
        </span>
        <h2 className="text-xl font-extrabold text-text">Account temporarily locked</h2>
        <p className="mt-2 text-sm text-muted">
          Too many failed attempts. Try again {lockedUntil ? `after ${formatDateTime(lockedUntil)}` : "in 15 minutes"}, or ask a Super Admin to unlock your account.
        </p>
        <Button className="mt-5" onClick={() => setStep("credentials")}>
          Back to sign in
        </Button>
      </div>
    );
  }

  if (step === "recovery") return <RecoveryCodes codes={codes} onDone={() => router.replace("/")} />;

  if (step === "credentials") {
    return (
      <form onSubmit={submitCredentials} className="space-y-4">
        <div className="mb-6">
          <h2 className="text-2xl font-extrabold tracking-tight text-text">Sign in</h2>
          <p className="mt-1 text-sm text-muted">Use your staff email and password.</p>
        </div>
        {notice && NOTICES[notice] && (
          <p className="flex items-start gap-2 rounded-lg bg-info-soft px-3 py-2.5 text-sm text-info" role="status">
            <Info className="mt-0.5 size-4 shrink-0" />
            {NOTICES[notice]}
          </p>
        )}
        <Field label="Email" htmlFor="email">
          <Input id="email" name="email" type="email" autoComplete="username" required icon={<Mail />} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@astroadmin.in" />
        </Field>
        <Field label="Password" htmlFor="password">
          <div className="relative">
            <Input
              id="password"
              name="password"
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
        <ErrorNote error={error} />
        <Button type="submit" variant="primary" size="lg" loading={pending} className="w-full justify-center">
          Continue
        </Button>
        <p className="text-center text-xs text-muted">New admins get an invite link by email. Forgot your password? Contact a Super Admin.</p>
      </form>
    );
  }

  const enrolling = step === "2fa_setup";
  return (
    <form onSubmit={submitCode} className="space-y-4">
      <button
        type="button"
        onClick={() => {
          setError(null);
          setStep("credentials");
        }}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-text"
      >
        <ArrowLeft className="size-3.5" /> Back
      </button>
      <div className="mb-2">
        <span className="mb-3 flex size-11 items-center justify-center rounded-xl bg-primary-soft text-primary-ink">
          {enrolling ? <ShieldCheck className="size-5" /> : <KeyRound className="size-5" />}
        </span>
        <h2 className="text-2xl font-extrabold tracking-tight text-text">{enrolling ? "Set up two-factor authentication" : "Two-factor verification"}</h2>
        <p className="mt-1 text-sm text-muted">
          {enrolling ? (
            "Two-factor authentication is required. Scan the code with Google Authenticator, Authy or 1Password, then enter the 6-digit code it shows."
          ) : (
            <>
              Enter the 6-digit code from your authenticator app for <span className="font-semibold text-text-2">{email}</span>.
            </>
          )}
        </p>
      </div>
      {enrolling && setup && (
        <div className="space-y-3 rounded-xl border border-border bg-surface-2 p-3">
          {setup.qrDataUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- data: URL from the API, not an optimisable asset
            <img src={setup.qrDataUrl} alt="QR code for your authenticator app" className="mx-auto size-44 rounded-lg bg-white p-2" />
          )}
          {setup.manualKey && (
            <div>
              <p className="mb-1 text-xs font-semibold text-text-2">Can&apos;t scan? Enter this key</p>
              <div className="flex gap-2">
                <Input readOnly value={setup.manualKey} aria-label="Manual setup key" className="min-w-0 flex-1 font-mono text-xs tracking-wider" />
                <Button size="icon" aria-label="Copy key" icon={<Copy />} onClick={() => navigator.clipboard?.writeText(setup.manualKey.replace(/\s/g, ""))} />
              </div>
            </div>
          )}
        </div>
      )}
      <Field label="Authentication code" htmlFor="code" help={enrolling ? undefined : "Lost your phone? Enter one of your recovery codes instead."}>
        <Input
          id="code"
          name="code"
          inputMode={enrolling ? "numeric" : "text"}
          autoComplete="one-time-code"
          maxLength={10}
          autoFocus
          required
          placeholder="123 456"
          className="text-center font-mono text-lg tracking-[0.4em]"
        />
      </Field>
      <ErrorNote error={error} />
      <Button type="submit" variant="primary" size="lg" loading={pending} className="w-full justify-center">
        {enrolling ? "Verify and finish setup" : "Verify and sign in"}
      </Button>
    </form>
  );
}

function ErrorNote({ error }) {
  if (!error?.message) return null;
  return (
    <p className="flex items-start gap-2 rounded-lg bg-danger-soft px-3 py-2.5 text-sm text-danger" role="alert">
      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
      <span>
        {error.message}
        {error.attemptsLeft != null && ` ${error.attemptsLeft} attempt${error.attemptsLeft === 1 ? "" : "s"} left before lockout.`}
      </span>
    </p>
  );
}

/** One-time recovery codes after enrolling. They are never shown again. */
function RecoveryCodes({ codes, onDone }) {
  const [saved, setSaved] = useState(false);
  return (
    <div className="space-y-4">
      <span className="flex size-11 items-center justify-center rounded-xl bg-success-soft text-success">
        <ShieldCheck className="size-5" />
      </span>
      <h2 className="text-2xl font-extrabold tracking-tight text-text">Save your recovery codes</h2>
      <p className="text-sm text-muted">Each code works once if you lose your phone. They won&apos;t be shown again.</p>
      <ul className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-surface-2 p-3">
        {codes.map((c) => (
          <li key={c} className="text-center font-mono text-sm text-text tabular-nums">
            {c}
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" icon={<Copy />} onClick={() => navigator.clipboard?.writeText(codes.join("\n"))}>
          Copy
        </Button>
        <Button size="sm" icon={<Download />} onClick={() => downloadCSV("recovery-codes.csv", codes.map((code) => ({ code })))}>
          Download
        </Button>
      </div>
      <label className="flex items-center gap-2 text-sm text-text-2">
        <input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} className="size-4 accent-primary" />
        I&apos;ve saved these codes somewhere safe
      </label>
      <Button variant="primary" size="lg" disabled={!saved} onClick={onDone} className="w-full justify-center">
        Continue to dashboard
      </Button>
    </div>
  );
}
