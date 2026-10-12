import Link from "next/link";
import { CircleCheck } from "lucide-react";
import { checkAccess } from "@/lib/session";
import { getReconciliation } from "@/services";
import { flatParams } from "@/lib/url";
import { cn, formatCurrency, formatDateTime, formatNumber } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import { MiniStat } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { Pagination } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterBar } from "@/components/common/FilterBar";
import { ActionButton } from "@/components/common/ActionButton";
import { UploadReportButton } from "../_components/UploadReportButton";
import { resolveReconRow } from "@/actions/payments";

export const metadata = { title: "Reconciliation" };

const MISMATCH_LABELS = { amount: "Amount", status: "Status", missing_in_db: "Missing in DB" };
const FILTERS = [{ name: "only", label: "All rows", options: [{ value: "mismatch", label: "Only mismatches" }] }];

export default async function ReconciliationPage({ searchParams }) {
  const { denied } = await checkAccess("payments");
  if (denied) return denied;

  const params = flatParams(await searchParams);
  const data = await getReconciliation(params);
  const { summary } = data;
  const diff = summary.gatewayTotal - summary.dbTotal;

  return (
    <>
      <PageHeader
        back={{ href: "/payments", label: "Payments" }}
        title="Reconciliation"
        description={
          data.run
            ? `Report ${data.run.fileName ?? data.run.id} · ${data.run.status}${data.run.error ? ` · ${data.run.error}` : ""} · uploaded ${formatDateTime(data.run.createdAt)}${data.run.uploadedBy ? ` by ${data.run.uploadedBy}` : ""}`
            : "Upload a gateway settlement report to compare it with our database"
        }
        actions={<UploadReportButton />}
      />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:mb-5 lg:grid-cols-5">
        <MiniStat label="Checked" value={formatNumber(summary.checked)} />
        <MiniStat label="Matched" value={formatNumber(summary.matched)} />
        <MiniStat label="Mismatched" value={formatNumber(summary.mismatched)} accent={summary.mismatched > 0} />
        <MiniStat label="Gateway total" value={formatCurrency(summary.gatewayTotal)} />
        <MiniStat label="DB total" value={formatCurrency(summary.dbTotal)} hint={diff ? `${formatCurrency(diff)} difference` : "Totals match"} />
      </div>

      <Card>
        <FilterBar search={false} filters={FILTERS} />
        {data.rows.length ? (
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-max text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-2 text-xs font-semibold tracking-wide text-muted uppercase">
                  <th className="px-4 py-2.5">Order</th>
                  <th className="px-4 py-2.5 max-md:hidden">Gateway payment</th>
                  <th className="px-4 py-2.5 max-md:hidden">Date</th>
                  <th className="px-4 py-2.5 text-right">Gateway</th>
                  <th className="px-4 py-2.5 text-right">DB</th>
                  <th className="px-4 py-2.5">Status (GW / DB)</th>
                  <th className="px-4 py-2.5">Result</th>
                  <th className="px-4 py-2.5">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.rows.map((r) => (
                  <tr key={r.id ?? r.orderId} className={cn("text-text-2", r.mismatch && "bg-danger-soft")}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Link href={`/payments/${r.orderId}`} className="font-mono text-xs text-primary hover:underline">
                        {r.orderId}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs whitespace-nowrap max-md:hidden">{r.gatewayPaymentId}</td>
                    <td className="px-4 py-3 whitespace-nowrap max-md:hidden">{formatDateTime(r.date)}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap tabular-nums">{formatCurrency(r.gatewayAmount)}</td>
                    <td className={cn("px-4 py-3 text-right whitespace-nowrap tabular-nums", r.mismatch === "amount" && "font-semibold text-danger")}>
                      {r.dbAmount == null ? "—" : formatCurrency(r.dbAmount)}
                    </td>
                    <td className={cn("px-4 py-3 whitespace-nowrap capitalize", r.mismatch === "status" && "font-semibold text-danger")}>
                      {r.gatewayStatus} / {r.dbStatus}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {r.mismatch ? <Badge tone="danger">{MISMATCH_LABELS[r.mismatch]}</Badge> : <Badge tone="success">Matched</Badge>}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {r.mismatch && (
                        // Hidden without payments:edit; the backend enforces the same check.
                        <ActionButton
                          module="payments"
                          size="xs"
                          reason
                          icon={<CircleCheck />}
                          dialogTitle={`Mark ${r.orderId} resolved`}
                          dialogDescription={`${MISMATCH_LABELS[r.mismatch]} mismatch. Note what you fixed so Finance can follow it.`}
                          reasons={["Corrected in DB", "Gateway report error", "Refund issued", "Duplicate entry"]}
                          confirmLabel="Mark resolved"
                          success="Marked resolved"
                          run={resolveReconRow.bind(null, r.id)}
                        >
                          Mark resolved
                        </ActionButton>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title={data.run ? "No mismatches" : "No report yet"} description={data.run ? "Every checked order matches the gateway report." : "Upload the gateway settlement report (.csv or .xlsx) to start."} />
        )}
        <Pagination {...data} basePath="/payments/reconciliation" params={params} />
      </Card>
    </>
  );
}
