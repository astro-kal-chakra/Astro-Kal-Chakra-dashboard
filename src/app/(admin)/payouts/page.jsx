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
      <PageHeader
        title="Payouts"
        description={`${formatNumber(data.counts.requested ?? 0)} payout requests waiting for approval`}
        actions={
          <ExportButton
            module="payouts"
            filename={`payouts-${status}.csv`}
            rows={data.rows.map((p) => ({
              id: p.id,
              astrologer: p.astrologerName,
              period: p.period,
              gross: p.gross,
              commissionRate: p.commissionRate,
              commission: p.commission,
              tds: p.tds,
              net: p.net,
              status: p.status,
              utr: p.utr ?? "",
              bank: p.bank,
            }))}
          />
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:mb-5 lg:grid-cols-4">
        <MiniStat label="Pending amount" value={formatCurrency(summary.pendingAmount)} accent hint="Net, awaiting approval" />
        <MiniStat label="Paid amount" value={formatCurrency(summary.paidAmount)} hint="Net, sent to banks" />
        <MiniStat label="Gross earnings" value={formatCurrency(summary.gross)} />
        <MiniStat label="Platform commission" value={formatCurrency(summary.commission)} />
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
