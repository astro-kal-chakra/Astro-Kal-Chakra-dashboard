"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAdmin } from "@/providers/AdminProvider";
import { useToast } from "@/providers/ToastProvider";
import { downloadCSV } from "@/lib/utils";

/**
 * CSV export, permission-checked. In production this should call an export
 * endpoint (which re-checks permission and audit-logs the export) instead of
 * serialising rows in the browser.
 */
export function ExportButton({ filename = "export.csv", rows = [], columns, module, action = "view", label = "Export CSV", size = "sm" }) {
  const { can } = useAdmin();
  const toast = useToast();
  const allowed = !module || can(module, action);

  return (
    <Button
      size={size}
      icon={<Download />}
      disabled={!allowed || !rows.length}
      title={allowed ? undefined : "You don't have permission to export this data"}
      onClick={() => {
        downloadCSV(filename, rows, columns);
        toast("Export started", { description: `${rows.length} rows · ${filename}` });
      }}
    >
      <span className="max-sm:hidden">{label}</span>
    </Button>
  );
}
