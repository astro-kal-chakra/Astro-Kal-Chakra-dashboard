"use client";

import { useState } from "react";
import { Copy, Download, RefreshCw, ShieldCheck } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Field, Input } from "@/components/ui/Input";
import { useToast } from "@/providers/ToastProvider";
import { useRouter } from "next/navigation";
import { cn, downloadCSV, formatDate } from "@/lib/utils";
import { finish2faSetup, start2faSetup } from "@/actions/profile";

// The server generates the secret (POST /me/2fa/setup) and the recovery codes
// (POST /me/2fa/verify); the codes are shown once and never again.
const STEPS = ["Scan", "Verify", "Save codes"];

export function TwoFactorCard({ email, twoFactor }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [enabledAt, setEnabledAt] = useState(twoFactor.enabledAt);
  const [setup, setSetup] = useState(null); // { manualKey, qrDataUrl }
  const [codes, setCodes] = useState([]);
  const [codesLeft, setCodesLeft] = useState(twoFactor.recoveryCodesLeft);
  const [starting, setStarting] = useState(false);
  const router = useRouter();

  const begin = async () => {
    setStarting(true);
    const r = await start2faSetup();
    setStarting(false);
    if (!r.ok) return toast(r.error.message, { type: "error" });
    setSetup(r.data);
    setOpen(true);
  };

  const close = () => {
    setOpen(false);
    setStep(0);
    setCode("");
    setError("");
    setSetup(null);
    setCodes([]);
  };

  const verify = async (e) => {
    e.preventDefault();
    if (code.length !== 6) return;
    setBusy(true);
    const r = await finish2faSetup(code);
    setBusy(false);
    if (!r.ok) {
      setError(r.error.message);
      return;
    }
    setError("");
    setCodes(r.data?.recoveryCodes ?? []);
    setCodesLeft(r.data?.recoveryCodes?.length ?? codesLeft);
    setStep(2);
  };

  const finish = () => {
    setEnabledAt(Date.now());
    close();
    router.refresh();
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
              Set up {formatDate(enabledAt)} · {codesLeft} recovery codes left
            </p>
          </div>
        </div>
        <Button size="sm" icon={<RefreshCw />} loading={starting} onClick={begin}>
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
              {setup?.qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- data: URL from the API
                <img src={setup.qrDataUrl} alt="QR code for your authenticator app" className="size-44 rounded-xl border border-border bg-white p-2" />
              ) : (
                <p className="text-sm text-muted">QR code unavailable — use the key below.</p>
              )}
            </div>
            <Field label="Can't scan? Enter this key manually" htmlFor="tfa-key" help={`Account: ${email}`}>
              <div className="flex gap-2">
                <Input id="tfa-key" readOnly value={setup?.manualKey ?? ""} className="min-w-0 flex-1 font-mono tracking-wider" />
                <Button size="icon" aria-label="Copy key" icon={<Copy />} onClick={() => copy(String(setup?.manualKey ?? "").replace(/\s/g, ""), "Key")} />
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
              {codes.map((c) => (
                <li key={c} className="text-center font-mono text-sm text-text tabular-nums">
                  {c}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" icon={<Copy />} onClick={() => copy(codes.join("\n"), "Recovery codes")}>
                Copy
              </Button>
              <Button size="sm" icon={<Download />} onClick={() => downloadCSV("recovery-codes.csv", codes.map((c) => ({ code: c })))}>
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
