"use client";

import { useState } from "react";
import { Copy, Download, RefreshCw, ShieldCheck } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Field, Input } from "@/components/ui/Input";
import { useToast } from "@/providers/ToastProvider";
import { cn, downloadCSV, formatDate } from "@/lib/utils";

// Demo values. In production the server generates the secret and codes, and
// only shows recovery codes once.
const MANUAL_KEY = "JBSW Y3DP EHPK 3PXP KQ7M 2RZL";
const RECOVERY_CODES = ["8F3K-29QD", "MX7P-4LTA", "2HWN-Q8VC", "R5YE-K1ZB", "T9GU-6NJS", "C4DA-P7XM", "W2LF-H3QR", "N6BV-E8TK"];
const STEPS = ["Scan", "Verify", "Save codes"];

export function TwoFactorCard({ email, twoFactor }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [enabledAt, setEnabledAt] = useState(twoFactor.enabledAt);

  const close = () => {
    setOpen(false);
    setStep(0);
    setCode("");
    setError("");
  };

  const verify = async (e) => {
    e.preventDefault();
    if (code.length !== 6) return;
    setBusy(true);
    await new Promise((r) => setTimeout(r, 450)); // simulated POST /me/2fa/verify
    setBusy(false);
    if (code === "000000") {
      setError("That code didn't match. Check your phone's time and try again.");
      return;
    }
    setError("");
    setStep(2);
  };

  const finish = () => {
    setEnabledAt(Date.now());
    close();
    toast("Two-factor authentication reconfigured", { description: "Old authenticator and recovery codes no longer work · logged to audit" });
  };

  const copy = async (text, what) => {
    try {
      await navigator.clipboard.writeText(text);
      toast(`${what} copied`, { type: "info" });
    } catch {
      toast("Couldn't copy", { type: "error", description: "Select the text and copy it manually." });
    }
  };

  return (
    <Card>
      <CardHeader
        title="Two-factor authentication"
        description="Required for every admin account."
        action={
          <Badge tone="success" dot>
            Enabled
          </Badge>
        }
      />
      <CardBody className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-success-soft text-success">
            <ShieldCheck className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text">{twoFactor.method}</p>
            <p className="text-xs text-muted">
              Set up {formatDate(enabledAt)} · {twoFactor.recoveryCodesLeft} recovery codes left
            </p>
          </div>
        </div>
        <Button size="sm" icon={<RefreshCw />} onClick={() => setOpen(true)}>
          Reconfigure
        </Button>
      </CardBody>

      <Modal
        open={open}
        onClose={close}
        title="Reconfigure two-factor authentication"
        description="Your current authenticator keeps working until you finish."
        size="md"
      >
        <ol className="mb-5 flex items-center gap-2 text-xs font-semibold">
          {STEPS.map((s, i) => (
            <li key={s} className="flex items-center gap-2">
              <span
                className={cn(
                  "flex size-6 items-center justify-center rounded-full tabular-nums",
                  i < step ? "bg-success text-white" : i === step ? "bg-primary text-white" : "bg-surface-3 text-muted"
                )}
              >
                {i + 1}
              </span>
              <span className={i === step ? "text-text" : "text-muted"}>{s}</span>
              {i < STEPS.length - 1 && <span className="h-px w-4 bg-border sm:w-8" />}
            </li>
          ))}
        </ol>

        {step === 0 && (
          <div className="space-y-4">
            <p className="text-sm text-text-2">Scan this code with Google Authenticator, Authy or 1Password.</p>
            <div className="flex justify-center">
              <QrPlaceholder />
            </div>
            <Field label="Can't scan? Enter this key manually" htmlFor="tfa-key" help={`Account: ${email}`}>
              <div className="flex gap-2">
                <Input id="tfa-key" readOnly value={MANUAL_KEY} className="min-w-0 flex-1 font-mono tracking-wider" />
                <Button size="icon" aria-label="Copy key" icon={<Copy />} onClick={() => copy(MANUAL_KEY.replace(/\s/g, ""), "Key")} />
              </div>
            </Field>
            <div className="flex justify-end gap-2 pt-1">
              <Button onClick={close}>Cancel</Button>
              <Button variant="primary" onClick={() => setStep(1)}>
                Next
              </Button>
            </div>
          </div>
        )}

        {step === 1 && (
          <form onSubmit={verify} className="space-y-4">
            <Field label="6-digit code from your app" htmlFor="tfa-code" help={error ? <span className="text-danger">{error}</span> : "The code changes every 30 seconds."}>
              <Input
                id="tfa-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="\d{6}"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="123456"
                autoFocus
                className="h-12 text-center font-mono text-xl tracking-[0.5em]"
                aria-invalid={error ? true : undefined}
              />
            </Field>
            <div className="flex justify-between gap-2 pt-1">
              <Button variant="ghost" onClick={() => setStep(0)}>
                Back
              </Button>
              <Button type="submit" variant="primary" disabled={code.length !== 6} loading={busy}>
                Verify
              </Button>
            </div>
          </form>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-text-2">
              Save these recovery codes somewhere safe. Each works once if you lose your phone. They won&apos;t be shown again.
            </p>
            <ul className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-surface-2 p-3">
              {RECOVERY_CODES.map((c) => (
                <li key={c} className="text-center font-mono text-sm text-text tabular-nums">
                  {c}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" icon={<Copy />} onClick={() => copy(RECOVERY_CODES.join("\n"), "Recovery codes")}>
                Copy
              </Button>
              <Button size="sm" icon={<Download />} onClick={() => downloadCSV("recovery-codes.csv", RECOVERY_CODES.map((c) => ({ code: c })))}>
                Download
              </Button>
            </div>
            <div className="flex justify-end pt-1">
              <Button variant="primary" onClick={finish}>
                I&apos;ve saved my codes
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </Card>
  );
}

/** Deterministic QR-like grid. A placeholder — the real QR comes from the server. */
function QrPlaceholder({ size = 25 }) {
  const cells = [];
  const finder = (x, y) => {
    const inBox = (ox, oy) => x >= ox && x < ox + 7 && y >= oy && y < oy + 7;
    for (const [ox, oy] of [[0, 0], [size - 7, 0], [0, size - 7]]) {
      if (inBox(ox, oy)) {
        const dx = x - ox;
        const dy = y - oy;
        const ring = dx === 0 || dx === 6 || dy === 0 || dy === 6;
        const core = dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4;
        return ring || core ? 1 : 0;
      }
      if (x >= ox - 1 && x <= ox + 7 && y >= oy - 1 && y <= oy + 7) return 0;
    }
    return null;
  };
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const f = finder(x, y);
      const on = f ?? ((x * 7 + y * 13 + ((x * y) % 11)) * 2654435761) % 7 < 3;
      if (on) cells.push(<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" />);
    }
  }
  return (
    <svg viewBox={`-2 -2 ${size + 4} ${size + 4}`} className="size-44 rounded-xl border border-border bg-white" role="img" aria-label="QR code for your authenticator app">
      <g fill="#111">{cells}</g>
    </svg>
  );
}
