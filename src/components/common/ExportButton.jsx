"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAdmin } from "@/providers/AdminProvider";
import { useToast } from "@/providers/ToastProvider";
import { downloadCSV } from "@/lib/utils";

/**
 * CSV export, permission-checked.
 *
 * - `endpoint` (e.g. "users") + `params` (the page's filters): the backend builds
 *   the CSV from every matching row (not just this page), re-checks permission
 *   and writes the export to the audit log. Served through `/export`.
 * - `rows`: serialises the given rows in the browser (for computed data such as analytics series).
 */
export function ExportButton({ filename = "export.csv", endpoint, params = {}, rows = [], columns, module, action = "view", label = "Export CSV", size = "sm" }) {
  const { can } = useAdmin();
  const toast = useToast();
  const allowed = !module || can(module, action);
  const [busy, setBusy] = useState(false);

  const href = () => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v != null && v !== "" && v !== "all" && k !== "page") qs.set(k, String(v));
    qs.set("filename", filename);
    return `/export/${endpoint}?${qs}`;
  };

  return (
    <Button
      size={size}
      icon={<Download />}
      disabled={!allowed || (!endpoint && !rows.length)}
      title={allowed ? undefined : "You don't have permission to export this data"}
      loading={busy}
      onClick={async () => {
        if (endpoint) {
          setBusy(true);
          try {
            const res = await fetch(href(), { cache: "no-store" });
            if (res.redirected && new URL(res.url).pathname === "/login") return window.location.assign(res.url);
            if (!res.ok) throw new Error((await res.text()) || "Export failed");
            const url = URL.createObjectURL(await res.blob());
            Object.assign(document.createElement("a"), { href: url, download: filename }).click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            toast("Export downloaded", { description: `${filename} · all matching rows · logged to audit` });
          } catch (err) {
            toast("Export failed", { type: "error", description: err.message });
          } finally {
            setBusy(false);
          }
        } else {
          downloadCSV(filename, rows, columns);
          toast("Export started", { description: `${rows.length} rows · ${filename}` });
        }
      }}
    >
      <span className="max-sm:hidden">{label}</span>
    </Button>
  );
}
