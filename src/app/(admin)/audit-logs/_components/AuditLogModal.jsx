"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState, useSyncExternalStore } from "react";
import { ArrowUpRight, Lock } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn, formatDateTime, timeAgo } from "@/lib/utils";

const noop = () => () => {};

const istFull = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  weekday: "short",
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: true,
});

/**
 * Full details of one audit entry: who did it, what, to which record, when, from where,
 * why, through which request, and every field that changed. Opened via `?log=<id>`.
 * Read-only by design — there are no edit or delete controls.
 */
export function AuditLogModal({ log, moduleLabel, closeHref }) {
  const router = useRouter();
  const close = useCallback(() => router.replace(closeHref, { scroll: false }), [router, closeHref]);
  const [raw, setRaw] = useState(false);

  // Modal portals into document.body, so only render it in the browser.
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  if (!log || !mounted) return null;

  const before = log.before ?? {};
  const after = log.after ?? {};
  const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])];
  const changed = keys.filter((k) => JSON.stringify(before[k]) !== JSON.stringify(after[k]));
  const unchanged = keys.filter((k) => !changed.includes(k));
  const hasDiff = log.before != null || log.after != null;
  const t = log.targetInfo;
  const who = log.adminName ?? "System";
  const targetText = t?.name ? `${t.name} (${log.target})` : log.target !== "—" ? log.target : null;

  return (
    <Modal open onClose={close} size="xl" title={log.label} description={`${log.id} · ${formatDateTime(log.createdAt)}`} footer={<Button onClick={close}>Close</Button>}>
      <div className="space-y-5">
        {/* One-line summary */}
        <p className="rounded-xl bg-primary-soft px-4 py-3 text-sm text-text">
          <span className="font-semibold">{who}</span>
          {log.adminRoleName ? <span className="text-text-2"> ({log.adminRoleName})</span> : null}{" "}
          <span className="lowercase">{log.label}</span>
          {targetText ? (
            <>
              {" — "}
              <span className="font-semibold">{targetText}</span>
            </>
          ) : null}
          {log.reason ? <span className="text-text-2"> · reason: “{log.reason}”</span> : null}
          <span className="text-text-2"> · {timeAgo(log.createdAt)}</span>
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          <Section title="Who">
            <Row label="Name" value={who} />
            <Row label="Admin ID" value={log.adminId ? <span className="font-mono text-xs">{log.adminId}</span> : "—"} />
            <Row label="Role" value={log.adminRoleName ?? "—"} />
            <Row label="Email" value={log.adminEmail ?? "—"} />
            {log.adminNow && (
              <Row
                label="Account now"
                value={
                  <span className="inline-flex flex-wrap items-center gap-1.5">
                    <Badge tone={log.adminNow.status === "active" ? "success" : "neutral"}>{log.adminNow.status}</Badge>
                    {log.adminNow.roleName !== log.adminRoleName && <span className="text-xs text-muted">now {log.adminNow.roleName}</span>}
                  </span>
                }
              />
            )}
          </Section>

          <Section title="What">
            <Row label="Action" value={log.label} />
            <Row label="Action code" value={<span className="font-mono text-xs">{log.action}</span>} />
            <Row label="Module" value={moduleLabel ?? log.module} />
            <Row label="Reason" value={log.reason ?? <span className="text-muted">Not required for this action</span>} />
          </Section>

          <Section title="Target">
            <Row label="Record" value={t?.type ?? (log.target === "—" ? "—" : "Other")} />
            <Row label="Name" value={t?.name ?? <span className="text-muted">{t && !t.exists ? "No longer exists" : "—"}</span>} />
            <Row
              label="ID"
              value={
                t?.href && t.exists ? (
                  <Link href={t.href} className="inline-flex items-center gap-1 font-mono text-xs text-primary hover:underline">
                    {log.target} <ArrowUpRight className="size-3.5" />
                  </Link>
                ) : (
                  <span className="font-mono text-xs">{log.target}</span>
                )
              }
            />
          </Section>

          <Section title="When & where">
            <Row label="Time (IST)" value={istFull.format(new Date(log.createdAt))} />
            <Row label="UTC" value={<span className="font-mono text-xs">{new Date(log.createdAt).toISOString()}</span>} />
            <Row label="IP address" value={log.ip ? <span className="font-mono text-xs">{log.ip}</span> : "—"} />
            <Row label="Device" value={log.device ? `${log.device.device} · ${log.device.browser}` : "—"} />
            <Row label="User agent" value={log.userAgent ? <span className="text-xs break-all text-text-2">{log.userAgent}</span> : "—"} />
          </Section>
        </div>

        <Section title="Request">
          <div className="grid gap-x-6 sm:grid-cols-2">
            <Row label="Endpoint" value={log.method || log.path ? <span className="font-mono text-xs break-all">{[log.method, log.path].filter(Boolean).join(" ")}</span> : "—"} />
            <Row label="Request ID" value={log.requestId ? <span className="font-mono text-xs break-all">{log.requestId}</span> : "—"} />
            <Row label="Sign-in session" value={log.sessionId ? <span className="font-mono text-xs break-all">{log.sessionId}</span> : "—"} />
          </div>
        </Section>

        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs font-semibold tracking-wide text-muted uppercase">Changes</p>
            {hasDiff && (
              <button type="button" onClick={() => setRaw((v) => !v)} className="text-xs font-semibold text-primary hover:underline">
                {raw ? "Show table" : "Show raw data"}
              </button>
            )}
          </div>
          {!hasDiff ? (
            <p className="rounded-lg bg-surface-2 px-3 py-2.5 text-sm text-muted">No field values changed for this action.</p>
          ) : raw ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <JsonPane title="Before" obj={log.before} />
              <JsonPane title="After" obj={log.after} />
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-2 text-xs font-semibold tracking-wide text-muted uppercase">
                    <th className="px-3 py-2">Field</th>
                    <th className="px-3 py-2">Before</th>
                    <th className="px-3 py-2">After</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[...changed, ...unchanged].map((k) => {
                    const hot = changed.includes(k);
                    return (
                      <tr key={k} className={cn(!hot && "text-muted")}>
                        <td className="px-3 py-2 font-medium whitespace-nowrap">{humanKey(k)}</td>
                        <td className={cn("px-3 py-2 align-top", hot && "bg-danger-soft text-danger")}>
                          <Value v={before[k]} present={k in before} />
                        </td>
                        <td className={cn("px-3 py-2 align-top", hot && "bg-success-soft text-success")}>
                          <Value v={after[k]} present={k in after} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="flex items-start gap-2 rounded-lg bg-surface-2 px-3 py-2.5 text-xs text-muted">
          <Lock className="mt-0.5 size-3.5 shrink-0" />
          Logs are append-only — they can&apos;t be edited or deleted.
        </p>
      </div>
    </Modal>
  );
}

function Section({ title, children }) {
  return (
    <section className="min-w-0 rounded-xl border border-border p-3.5">
      <p className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">{title}</p>
      <dl className="space-y-1.5">{children}</dl>
    </section>
  );
}

function Row({ label, value }) {
  return (
    <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-2 text-sm">
      <dt className="text-muted">{label}</dt>
      <dd className="min-w-0 text-text">{value}</dd>
    </div>
  );
}

/** "approvalStatus" → "Approval status", "kyc.status" → "Kyc › status" */
const humanKey = (k) =>
  String(k)
    .split(".")
    .map((p) => p.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/_/g, " "))
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join(" › ");

function Value({ v, present }) {
  if (!present) return <span className="text-muted italic">not set</span>;
  if (v === null || v === undefined || v === "") return <span className="text-muted">—</span>;
  if (typeof v === "boolean") return <span>{v ? "Yes" : "No"}</span>;
  if (typeof v === "object") return <pre className="font-mono text-xs whitespace-pre-wrap">{JSON.stringify(v, null, 2)}</pre>;
  return <span className="break-all">{String(v)}</span>;
}

function JsonPane({ title, obj }) {
  return (
    <div className="min-w-0 overflow-hidden rounded-xl border border-border">
      <p className="border-b border-border bg-surface-2 px-3 py-1.5 text-xs font-semibold text-muted">{title}</p>
      <pre className="overflow-x-auto bg-surface px-3 py-2 font-mono text-xs leading-5 text-text-2">{obj == null ? "null" : JSON.stringify(obj, null, 2)}</pre>
    </div>
  );
}
