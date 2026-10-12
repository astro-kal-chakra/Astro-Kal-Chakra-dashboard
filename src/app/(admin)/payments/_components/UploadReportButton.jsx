"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAdmin } from "@/providers/AdminProvider";
import { useToast } from "@/providers/ToastProvider";
import { uploadReport } from "@/actions/payments";

/**
 * Uploads a gateway settlement report (.csv / .xlsx, Razorpay columns
 * order_id, payment_id, amount, status, created_at; amounts in ₹). The backend
 * re-checks payments:edit, parses it and runs the match in the background.
 */
export function UploadReportButton() {
  const input = useRef(null);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const { can } = useAdmin();
  const toast = useToast();
  if (!can("payments", "edit")) return null;

  const upload = async (file) => {
    const fd = new FormData();
    fd.append("file", file);
    setBusy(true);
    const r = await uploadReport(fd);
    setBusy(false);
    if (!r.ok) return toast("Upload failed", { type: "error", description: r.error.message });
    toast("Report uploaded", { description: `${file.name} · matching runs in the background` });
    // The match usually finishes within seconds; show the new run when it does.
    setTimeout(() => router.refresh(), 4000);
  };

  return (
    <>
      <input
        ref={input}
        type="file"
        accept=".csv,.xlsx"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload(file);
          e.target.value = "";
        }}
      />
      <Button size="sm" variant="primary" icon={<Upload />} loading={busy} onClick={() => input.current?.click()}>
        Upload gateway report
      </Button>
    </>
  );
}
