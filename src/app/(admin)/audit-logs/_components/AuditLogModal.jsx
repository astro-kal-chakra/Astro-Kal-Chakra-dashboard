"use client";

import { useRouter } from "next/navigation";
import { useCallback, useSyncExternalStore } from "react";
import { Lock } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { DescriptionList } from "@/components/ui/Card";
import { cn, formatDateTime } from "@/lib/utils";

const noop = () => () => {};

/** Read-only details for one audit entry. Opened via `?log=<id>`; there are no edit or delete controls by design. */
export function AuditLogModal({ log, moduleLabel, closeHref }) {
  const router = useRouter();
  const close = useCallback(() => router.replace(closeHref, { scroll: false }), [router, closeHref]);

  // Modal portals into document.body, so only render it in the browser.
  const mounted = useSyncExternalStore(noop, () => true, () => false);

  if (!log || !mounted) return null;

  const before = log.before ?? {};
  const after = log.after ?? {};
  const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])];
  const changed = new Set(keys.filter((k) => JSON.stringify(before[k]) !== JSON.stringify(after[k])));
  const hasDiff = log.before != null || log.after != null;

  return (
    <Modal
      open
      onClose={close}
      size="lg"
      title={log.label}
      description={`${log.id} · ${formatDateTime(log.createdAt)}`}
      footer={<Button onClick={close}>Close</Button>}
    >
      <div className="space-y-5">
        <DescriptionList
          items={[
            { label: "Admin", value: `${log.adminName} (${log.adminId})` },
            { label: "Action", value: <span className="font-mono text-xs">{log.action}</span> },
            { label: "Module", value: moduleLabel ?? log.module },
            { label: "Target", value: <span className="font-mono text-xs">{log.target}</span> },
            { label: "Reason", value: log.reason ?? "Not required for this action" },
            { label: "IP address", value: <span className="font-mono text-xs">{log.ip}</span> },
            { label: "User agent", value: log.userAgent },
            { label: "Time", value: new Date(log.createdAt).toISOString() },
          ]}
        />

        <div>
          <p className="mb-2 text-xs font-semibold text-text-2">Changes</p>
          {hasDiff ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <JsonPane title="Before" obj={log.before} keys={keys} changed={changed} tone="before" />
              <JsonPane title="After" obj={log.after} keys={keys} changed={changed} tone="after" />
            </div>
          ) : (
            <p className="rounded-lg bg-surface-2 px-3 py-2.5 text-sm text-muted">No field values changed for this action.</p>
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

/** Pretty-printed JSON, one line per key, with changed keys highlighted. */
function JsonPane({ title, obj, keys, changed, tone }) {
  return (
    <div className="min-w-0 overflow-hidden rounded-xl border border-border">
      <p className="border-b border-border bg-surface-2 px-3 py-1.5 text-xs font-semibold text-muted">{title}</p>
      <pre className="relative overflow-x-auto bg-surface px-0 py-2 font-mono text-xs leading-5 text-text-2">
        {obj == null ? (
          <span className="px-3 text-muted">null</span>
        ) : (
          <>
            <span className="block px-3">{"{"}</span>
            {keys.map((k, i) => {
              const present = k in obj;
              const hot = changed.has(k);
              return (
                <span
                  key={k}
                  className={cn(
                    "block px-3",
                    hot && (tone === "before" ? "bg-danger-soft text-danger" : "bg-success-soft text-success"),
                    !present && "opacity-50"
                  )}
                >
                  {"  "}
                  {present ? `${JSON.stringify(k)}: ${JSON.stringify(obj[k], null, 2).replace(/\n/g, "\n  ")}${i < keys.length - 1 ? "," : ""}` : `// ${k}: (not set)`}
                </span>
              );
            })}
            <span className="block px-3">{"}"}</span>
          </>
        )}
      </pre>
    </div>
  );
}
