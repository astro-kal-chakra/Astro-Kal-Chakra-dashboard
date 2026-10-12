import Link from "next/link";
import { Check, ShieldAlert, X } from "lucide-react";
import { checkAccess } from "@/lib/session";
import { getRefunds } from "@/services";
import { flatParams } from "@/lib/url";
import { formatCurrency, formatDateTime, formatNumber, timeAgo } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { DataTable, Pagination } from "@/components/ui/Table";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { PersonCell } from "@/components/ui/Avatar";
import { TabLinks } from "@/components/ui/Tabs";
import { FilterBar } from "@/components/common/FilterBar";
import { ActionButton } from "@/components/common/ActionButton";
import { approveRefund, rejectRefund } from "@/actions/payments";

export const metadata = { title: "Refunds" };

const STATUSES = [
  { value: "requested", label: "Requested" },
  { value: "approved", label: "Approved" },
  { value: "processed", label: "Processed" },
  { value: "rejected", label: "Rejected" },
];

export default async function RefundsPage({ searchParams }) {
  const { admin, denied } = await checkAccess("refunds");
  if (denied) return denied;

  const params = flatParams(await searchParams);
  const status = STATUSES.some((s) => s.value === params.status) ? params.status : "requested";
  const data = await getRefunds({ ...params, status });
  // Roles without a limit (Super Admin, Finance) can approve any amount.
  // The backend applies the same limit when the approval is submitted.
  const limit = data.limit !== undefined ? data.limit : (admin.role.refundLimit ?? null);

  const columns = [
    { key: "id", label: "Refund", render: (r) => <span className="font-mono text-xs">{r.id}</span> },
    { key: "userName", label: "User", render: (r) => <PersonCell name={r.userName} sub={r.userId} /> },
    { key: "amount", label: "Amount", align: "right", render: (r) => <span className="font-semibold text-text">{formatCurrency(r.amount)}</span> },
    { key: "reason", label: "Reason", hideOnMobile: true },
    {
      key: "destination",
      label: "Refund to",
      render: (r) => <Badge tone={r.destination === "wallet" ? "primary" : "info"}>{r.destination === "wallet" ? "Wallet" : "Original method"}</Badge>,
    },
    {
      key: "paymentId",
      label: "Payment",
      hideOnMobile: true,
      render: (r) => (
        <Link href={`/payments/${r.paymentId}`} className="font-mono text-xs text-primary hover:underline">
          {r.paymentId}
        </Link>
      ),
    },
    {
      key: "requestedBy",
      label: "Requested by",
      render: (r) => (
        <div>
          <p className="text-sm text-text">{r.requestedBy}</p>
          <p className="text-xs text-muted" title={formatDateTime(r.requestedAt)}>
            {timeAgo(r.requestedAt)}
          </p>
        </div>
      ),
    },
    status === "requested"
      ? { key: "actions", label: "Decision", render: (r) => <RefundActions refund={r} limit={limit} /> }
      : { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
  ];

  return (
    <>
      <PageHeader
        back={{ href: "/payments", label: "Payments" }}
        title="Refunds"
        description={
          limit != null
            ? `Your role (${admin.role.name}) can approve refunds up to ${formatCurrency(limit)}. Larger refunds need Finance.`
            : `${formatNumber(data.counts.requested ?? 0)} refunds waiting for a decision`
        }
      />
      <Card>
        <TabLinks
          tabs={STATUSES.map((s) => ({ ...s, count: data.counts[s.value] ?? 0 }))}
          active={status}
          param="status"
          basePath="/payments/refunds"
          params={params}
          className="px-2"
        />
        <FilterBar searchPlaceholder="Search refund, user, payment or session" />
        <DataTable columns={columns} rows={data.rows} basePath="/payments/refunds" params={params} empty={{ title: "No refunds here" }} />
        <Pagination {...data} basePath="/payments/refunds" params={params} />
      </Card>
    </>
  );
}

/** Approve / reject. Hidden without refunds:approve; the backend enforces the same check and the role limit. */
function RefundActions({ refund, limit }) {
  const overLimit = limit != null && refund.amount > limit;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {overLimit && (
        <Badge tone="warning">
          <ShieldAlert className="size-3" /> Needs Finance approval
        </Badge>
      )}
      <ActionButton
        module="refunds"
        action="approve"
        reason
        size="xs"
        variant="success"
        icon={<Check />}
        disabled={overLimit}
        dialogTitle={`Approve refund ${refund.id}`}
        dialogDescription={`${formatCurrency(refund.amount)} to ${refund.userName}'s ${refund.destination === "wallet" ? "wallet" : "original payment method"}.`}
        confirmLabel="Approve refund"
        success="Refund approved"
        run={approveRefund.bind(null, refund.id)}
      >
        Approve
      </ActionButton>
      <ActionButton
        module="refunds"
        action="approve"
        reason
        size="xs"
        variant="danger-soft"
        icon={<X />}
        dialogTitle={`Reject refund ${refund.id}`}
        dialogDescription="The requester sees your reason."
        confirmLabel="Reject refund"
        success="Refund rejected"
        run={rejectRefund.bind(null, refund.id)}
      >
        Reject
      </ActionButton>
    </div>
  );
}
