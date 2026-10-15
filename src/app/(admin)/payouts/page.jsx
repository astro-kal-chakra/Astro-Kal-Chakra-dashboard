import { checkAccess } from "@/lib/session";
import { getPayouts } from "@/services";
import { flatParams } from "@/lib/url";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import { MiniStat } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { Pagination } from "@/components/ui/Table";
import { TabLinks } from "@/components/ui/Tabs";
import { FilterBar } from "@/components/common/FilterBar";
import { ExportButton } from "@/components/common/ExportButton";
import { PayoutTable } from "./_components/PayoutTable";
import { MarkSeen } from "@/components/common/MarkSeen";

export const metadata = { title: "Payouts" };

const STATUSES = [
  { value: "requested", label: "Requested" },
  { value: "approved", label: "Approved" },
  { value: "processing", label: "Processing" },
  { value: "paid", label: "Paid" },
  { value: "rejected", label: "Rejected" },
];

export default async function PayoutsPage({ searchParams }) {
  const { denied } = await checkAccess("payouts");
  if (denied) return denied;

  const params = flatParams(await searchParams);
  const status = STATUSES.some((s) => s.value === params.status) ? params.status : "requested";
  const data = await getPayouts({ ...params, status });
  const { summary } = data;

  // Plain data only: the client table formats values itself.
  const rows = data.rows.map((p) => ({ ...p, requestedLabel: formatDate(p.requestedAt) }));

  return (
    <>
      <MarkSeen section="payouts" />
      <PageHeader
        title="Payouts"
        description={`${formatNumber(data.counts.requested ?? 0)} payout requests waiting for approval`}
        actions={
          <ExportButton module="payouts" filename={`payouts-${status}.csv`} endpoint="payouts" params={{ ...params, status }} />
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:mb-5 lg:grid-cols-4">
        <MiniStat label="Pending amount" value={formatCurrency(summary.pendingAmount)} accent hint="Net, awaiting approval" />
        <MiniStat label="Paid amount" value={formatCurrency(summary.paidAmount)} hint="Net, sent to banks" />
        <MiniStat label="Requested (gross)" value={formatCurrency(summary.gross)} hint="Earnings withdrawn" />
        <MiniStat label="Platform charges" value={formatCurrency(summary.commission)} hint="Deducted from payouts" />
      </div>

      <Card>
        <TabLinks
          tabs={STATUSES.map((s) => ({ ...s, count: data.counts[s.value] ?? 0 }))}
          active={status}
          param="status"
          basePath="/payouts"
          params={params}
          className="px-2"
        />
        <FilterBar searchPlaceholder="Search astrologer, payout ID or UTR" />
        <PayoutTable rows={rows} status={status} />
        <Pagination {...data} basePath="/payouts" params={params} />
      </Card>
    </>
  );
}
