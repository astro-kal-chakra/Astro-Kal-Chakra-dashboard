import { RotateCcw, Scale, Wallet } from "lucide-react";
import { checkAccess } from "@/lib/session";
import { getPayments } from "@/services";
import { flatParams } from "@/lib/url";
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DataTable, Pagination } from "@/components/ui/Table";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { PersonCell } from "@/components/ui/Avatar";
import { TabLinks } from "@/components/ui/Tabs";
import { FilterBar } from "@/components/common/FilterBar";
import { ExportButton } from "@/components/common/ExportButton";

export const metadata = { title: "Payments" };

const STATUSES = [
  { value: "success", label: "Success" },
  { value: "failed", label: "Failed" },
  { value: "pending", label: "Pending" },
  { value: "refunded", label: "Refunded" },
];
const METHODS = ["UPI", "Card", "Netbanking", "Wallet"].map((m) => ({ value: m, label: m }));

export default async function PaymentsPage({ searchParams }) {
  const { denied } = await checkAccess("payments");
  if (denied) return denied;

  const params = flatParams(await searchParams);
  const status = STATUSES.some((s) => s.value === params.status) ? params.status : "all";
  const data = await getPayments({ ...params, status });
  const totalAll = Object.values(data.counts).reduce((s, n) => s + n, 0);

  const columns = [
    { key: "id", label: "Order", sortable: true, render: (p) => <span className="font-mono text-xs">{p.id}</span> },
    { key: "userName", label: "User", sortable: true, render: (p) => <PersonCell name={p.userName} sub={p.userId} /> },
    { key: "pack", label: "Pack", hideOnMobile: true },
    { key: "method", label: "Method", hideOnMobile: true },
    { key: "amount", label: "Amount", align: "right", sortable: true, render: (p) => <span className="font-semibold text-text">{formatCurrency(p.amount)}</span> },
    { key: "coupon", label: "Coupon", hideOnMobile: true, render: (p) => (p.coupon ? <Badge tone="accent">{p.coupon}</Badge> : <span className="text-muted">—</span>) },
    { key: "status", label: "Status", render: (p) => <StatusBadge status={p.status} /> },
    { key: "gatewayPaymentId", label: "Gateway ID", hideOnMobile: true, render: (p) => <span className="font-mono text-xs">{p.gatewayPaymentId ?? "—"}</span> },
    { key: "createdAt", label: "Date", sortable: true, render: (p) => formatDateTime(p.createdAt) },
  ];

  return (
    <>
      <PageHeader
        title="Payments"
        description={`${formatNumber(data.total)} orders match your filters`}
        actions={
          <>
            <Button size="sm" href="/payments/refunds" icon={<RotateCcw />}>
              Refunds
            </Button>
            <Button size="sm" href="/payments/wallet" icon={<Wallet />}>
              Wallet ledger
            </Button>
            <Button size="sm" href="/payments/reconciliation" icon={<Scale />}>
              <span className="max-sm:hidden">Reconciliation</span>
            </Button>
            <ExportButton module="payments" filename="payments.csv" endpoint="payments" params={params} />
          </>
        }
      />
      <Card>
        <TabLinks
          tabs={[{ value: "all", label: "All", count: totalAll }, ...STATUSES.map((s) => ({ ...s, count: data.counts[s.value] ?? 0 }))]}
          active={status}
          param="status"
          basePath="/payments"
          params={params}
          className="px-2"
        />
        <FilterBar searchPlaceholder="Search order, user or gateway ID" filters={[{ name: "method", label: "All methods", options: METHODS }]} />
        <DataTable columns={columns} rows={data.rows} basePath="/payments" params={params} rowHref={(p) => `/payments/${p.id}`} empty={{ title: "No payments found" }} />
        <Pagination {...data} basePath="/payments" params={params} />
      </Card>
    </>
  );
}
