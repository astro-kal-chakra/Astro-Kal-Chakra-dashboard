"use server";

import { ApiError, api, seg } from "@/lib/api";
import { num, run, str } from "@/lib/action";

/* ---------------- Payments & refunds ---------------- */
/** Goes to the refunds queue (or is auto-approved under the Settings limit). */
export async function requestRefund(paymentId, reason, data = {}) {
  return run(() =>
    api(`/payments/${seg(paymentId)}/refunds`, {
      method: "POST",
      body: { amount: num(data.amount), destination: data.destination === "source" ? "source" : "wallet", reason },
      withMessage: true,
    })
  );
}

/** Re-processes a failed (5xx) webhook delivery. `index` is its position in the payment's webhook list. */
export async function retryWebhook(paymentId, index) {
  return run(() => api(`/payments/${seg(paymentId)}/webhooks/${seg(String(index))}/retry`, { method: "POST" }));
}

export async function approveRefund(id, reason) {
  return run(() => api(`/refunds/${seg(id)}/approve`, { method: "POST", body: { reason } }));
}

export async function rejectRefund(id, reason) {
  return run(() => api(`/refunds/${seg(id)}/reject`, { method: "POST", body: { reason } }));
}

/* ---------------- Reconciliation ---------------- */
const REPORT_TYPES = /\.(csv|xlsx)$/i;
const MAX_REPORT_BYTES = 10 * 1024 * 1024;

/** Gateway settlement report (.csv / .xlsx, ≤ 10 MB). Matching runs in the background → `{ runId }`. */
export async function uploadReport(formData) {
  return run(async () => {
    const file = formData.get("file");
    if (!file || typeof file === "string" || !file.size) throw new ApiError(400, "NO_FILE", "Choose a .csv or .xlsx file.");
    if (!REPORT_TYPES.test(file.name)) throw new ApiError(400, "BAD_FILE", "Only .csv and .xlsx reports are supported.");
    if (file.size > MAX_REPORT_BYTES) throw new ApiError(400, "FILE_TOO_LARGE", "The report is larger than 10 MB.");
    const form = new FormData();
    form.append("file", file, file.name);
    const unit = str(formData.get("amountUnit")) === "paise" ? "?amountUnit=paise" : "";
    return api(`/reconciliation/upload${unit}`, { method: "POST", form });
  });
}

export async function resolveReconRow(rowId, reason) {
  return run(() => api(`/reconciliation/rows/${seg(rowId)}/resolve`, { method: "POST", body: { reason } }));
}

/* ---------------- Payouts ---------------- */
export async function approvePayout(id) {
  return run(() => api(`/payouts/${seg(id)}/approve`, { method: "POST" }));
}

/** The amount goes back to the astrologer's earnings. */
export async function rejectPayout(id, reason) {
  return run(() => api(`/payouts/${seg(id)}/reject`, { method: "POST", body: { reason } }));
}

/** `{ approved, results: [{ id, ok, error? }] }` — each approval is audit-logged. */
export async function bulkApprovePayouts(ids) {
  return run(() => api("/payouts/bulk-approve", { method: "POST", body: { ids: (ids ?? []).slice(0, 200).map(seg) } }));
}

export async function markPayoutProcessing(id) {
  return run(() => api(`/payouts/${seg(id)}/processing`, { method: "POST" }));
}

/** Bank transfer done: needs the UTR from the bank. */
export async function markPayoutPaid(id, reason, data = {}) {
  return run(() => api(`/payouts/${seg(id)}/mark-paid`, { method: "POST", body: { utr: str(data.utr), reason } }));
}
