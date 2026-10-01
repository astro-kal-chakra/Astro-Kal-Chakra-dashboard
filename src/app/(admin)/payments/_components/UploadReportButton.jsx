"use client";

import { useRef } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAdmin } from "@/providers/AdminProvider";
import { useToast } from "@/providers/ToastProvider";

/**
 * UI only: picks a gateway settlement file and shows a toast. In production
 * the file is uploaded to the backend, which re-checks payments:edit,
 * parses it and re-runs the match.
 */
export function UploadReportButton() {
  const input = useRef(null);
  const { can } = useAdmin();
  const toast = useToast();
  if (!can("payments", "edit")) return null;
  return (
    <>
      <input
        ref={input}
        type="file"
        accept=".csv,.xlsx"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) toast("Report uploaded", { description: `${file.name} · matching runs in the background` });
          e.target.value = "";
        }}
      />
      <Button size="sm" variant="primary" icon={<Upload />} onClick={() => input.current?.click()}>
        Upload gateway report
      </Button>
    </>
  );
}
