import Link from "next/link";
import { checkAccess } from "@/lib/session";
import { getWalletLedger } from "@/services";
import { flatParams } from "@/lib/url";
import { cn, formatCurrency, formatDateTime, formatNumber } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { DataTable, Pagination } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { PersonCell } from "@/components/ui/Avatar";
import { FilterBar } from "@/components/common/FilterBar";
import { ExportButton } from "@/components/common/ExportButton";

export const metadata = { title: "Wallet ledger" };

const REASONS = ["Recharge", "Recharge bonus", "Refund", "Referral reward", "Admin adjustment", "Chat session", "Voice session", "Video session"];

const FILTERS = [
  {
    name: "type",
    label: "Credits and debits",
    options: [
      { value: "credit", label: "Credits only" },
      { value: "debit", label: "Debits only" },
    ],
  },
  { name: "reason", label: "Any reason", options: REASONS.map((r) => ({ value: r, label: r })) },
];

/** Links a ledger reference to its session or order when we know the record. */
function Reference({ value }) {
  const href = value.startsWith("ORD") ? `/payments/${value}` : value.startsWith("S") ? `/sessions/${value}` : null;
  if (!href) return <span className="font-mono text-xs">{value}</span>;
  return (
    <Link href={href} className="font-mono text-xs text-primary hover:underline">
      {value}
    </Link>
  );
}

export default async function WalletLedgerPage({ searchParams }) {
  const { denied } = await checkAccess("payments");
  if (denied) return denied;

  const params = flatParams(await searchParams);
  const data = await getWalletLedger(params);

  const columns = [
    { key: "createdAt", label: "Date", render: (l) => formatDateTime(l.createdAt) },
    { key: "userName", label: "User", render: (l) => <PersonCell name={l.userName} sub={l.userId} /> },
    { key: "type", label: "Type", hideOnMobile: true, render: (l) => <Badge tone={l.type === "credit" ? "success" : "neutral"}>{l.type === "credit" ? "Credit" : "Debit"}</Badge> },
    { key: "reason", label: "Reason", render: (l) => <span className="text-text">{l.reason}</span> },
    { key: "reference", label: "Reference", render: (l) => <Reference value={l.reference} /> },
    {
      key: "amount",
      label: "Amount",
      align: "right",
      render: (l) => (
        <span className={cn("font-semibold", l.type === "credit" ? "text-success" : "text-text")}>
          {l.type === "credit" ? "+" : "−"}
          {formatCurrency(l.amount)}
        </span>
      ),
    },
    { key: "balanceAfter", label: "Balance", align: "right", hideOnMobile: true, render: (l) => formatCurrency(l.balanceAfter) },
    { key: "by", label: "By", hideOnMobile: true },
    { key: "id", label: "Entry", hideOnMobile: true, render: (l) => <span className="font-mono text-xs text-muted">{l.id}</span> },
  ];

  return (
    <>
      <PageHeader
        back={{ href: "/payments", label: "Payments" }}
        title="Wallet ledger"
        description={`${formatNumber(data.total)} entries · every credit and debit has a reason and a reference`}
        actions={
          <ExportButton module="payments" filename="wallet-ledger.csv" endpoint="wallet-ledger" params={params} />
        }
      />
      <Card>
        <FilterBar searchPlaceholder="Search user, entry or reference" filters={FILTERS} />
        <DataTable columns={columns} rows={data.rows} basePath="/payments/wallet" params={params} empty={{ title: "No ledger entries found" }} />
        <Pagination {...data} basePath="/payments/wallet" params={params} />
      </Card>
    </>
  );
}
