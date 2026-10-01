import Link from "next/link";
import { notFound } from "next/navigation";
import { RefreshCw, RotateCcw } from "lucide-react";
import { checkAccess } from "@/lib/session";
import { getPayment } from "@/services";
import { cn, formatCurrency, formatDateTime } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import { MiniStat } from "@/components/ui/StatCard";
import { Card, CardBody, CardHeader, DescriptionList } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/Table";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field, Input, Select } from "@/components/ui/Input";
import { ActionButton } from "@/components/common/ActionButton";
import { CopyButton } from "../_components/CopyButton";

export async function generateMetadata({ params }) {
  const { id } = await params;
  return { title: `Payment ${id}` };
}

export default async function PaymentDetailPage({ params }) {
  const { denied } = await checkAccess("payments");
  if (denied) return denied;

  const { id } = await params;
  const p = await getPayment(id);
  if (!p) notFound();

  const canRefund = p.status === "success" && !p.refund;
  const failedHooks = p.webhooks.filter((w) => w.status >= 500).length;

  return (
    <>
      <PageHeader
        back={{ href: "/payments", label: "All payments" }}
        title={<span className="font-mono">{p.id}</span>}
        description={`${p.pack} · ${formatDateTime(p.createdAt)}`}
        meta={
          <>
            <StatusBadge status={p.status} />
            <Badge>{p.method}</Badge>
            <Badge tone="primary">{p.gateway}</Badge>
            {failedHooks > 0 && <Badge tone="danger">Webhook failed</Badge>}
          </>
        }
        actions={
          canRefund && (
            // Hidden without refunds:edit; the backend enforces the same check.
            <ActionButton
              module="refunds"
              reason
              icon={<RotateCcw />}
              dialogTitle="Request refund"
              dialogDescription={`Paid ${formatCurrency(p.amount)} by ${p.method}. The request goes to the refunds queue for approval.`}
              confirmLabel="Send for approval"
              success="Refund requested"
              fields={
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Amount (₹)" htmlFor="rf-amount" hint={`Max ${formatCurrency(p.amount)}`}>
                    <Input id="rf-amount" name="amount" type="number" min="1" max={p.amount} defaultValue={p.amount} required />
                  </Field>
                  <Field label="Refund to" htmlFor="rf-dest">
                    <Select
                      id="rf-dest"
                      name="destination"
                      options={[
                        { value: "wallet", label: "Wallet" },
                        { value: "source", label: "Original method" },
                      ]}
                    />
                  </Field>
                </div>
              }
            >
              Request refund
            </ActionButton>
          )
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-5">
        <div className="min-w-0 space-y-4 lg:space-y-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MiniStat label="Amount" value={formatCurrency(p.amount)} accent />
            <MiniStat label="Bonus credit" value={formatCurrency(p.bonus)} />
            <MiniStat label="Method" value={p.method} />
            <MiniStat label="Coupon" value={p.coupon ?? "—"} />
          </div>

          <Card>
            <CardHeader title="Gateway" description={p.gateway} />
            <CardBody>
              <DescriptionList
                items={[
                  { label: "Gateway order ID", value: <IdValue value={p.gatewayOrderId} label="Order ID" /> },
                  { label: "Gateway payment ID", value: <IdValue value={p.gatewayPaymentId} label="Payment ID" /> },
                  { label: "Status", value: <StatusBadge status={p.status} /> },
                  { label: "Method", value: p.method },
                  { label: "Coupon", value: p.coupon ? <Badge tone="accent">{p.coupon}</Badge> : "None" },
                  { label: "Failure reason", value: p.failureReason ? <span className="text-danger">{p.failureReason}</span> : "—" },
                ]}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Webhook events" description="Events from the gateway and the HTTP status we returned" />
            <ol className="px-4 py-4 sm:px-5">
              {p.webhooks.map((w, i) => {
                const failed = w.status >= 500;
                return (
                  <li key={`${w.event}-${i}`} className="relative flex gap-3 pb-5 last:pb-0">
                    {i < p.webhooks.length - 1 && <span className="absolute top-4 left-[4.5px] h-full w-px bg-border" aria-hidden />}
                    <span className={cn("relative mt-1.5 size-2.5 shrink-0 rounded-full", failed ? "bg-danger" : "bg-success")} />
                    <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className={cn("font-mono text-xs font-semibold", failed ? "text-danger" : "text-text")}>{w.event}</p>
                        <p className="text-xs text-muted">{formatDateTime(w.at)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge tone={failed ? "danger" : "success"} className="font-mono">
                          HTTP {w.status}
                        </Badge>
                        {failed && (
                          <ActionButton
                            module="payments"
                            size="xs"
                            variant="danger-soft"
                            icon={<RefreshCw />}
                            confirm
                            dialogTitle="Retry webhook"
                            dialogDescription={`Process ${w.event} for ${p.id} again. Safe to retry: the handler ignores duplicates.`}
                            confirmLabel="Retry now"
                            success="Webhook queued for retry"
                          >
                            Retry webhook
                          </ActionButton>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </Card>

          <Card>
            <CardHeader title="Wallet ledger entries" description="Wallet entries that reference this order" />
            <DataTable
              dense
              rows={p.ledger}
              empty={{ title: "No ledger entries", description: "No wallet entry references this order." }}
              columns={[
                { key: "id", label: "Entry", render: (l) => <span className="font-mono text-xs">{l.id}</span> },
                { key: "createdAt", label: "Date", render: (l) => formatDateTime(l.createdAt) },
                { key: "reason", label: "Reason" },
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
                { key: "balanceAfter", label: "Balance", align: "right", render: (l) => formatCurrency(l.balanceAfter) },
              ]}
            />
          </Card>
        </div>

        <aside className="min-w-0 space-y-4 lg:space-y-5">
          <Card>
            <CardHeader title="Customer" />
            <CardBody>
              <DescriptionList
                cols={1}
                items={[
                  {
                    label: "User",
                    value: (
                      <Link href={`/users/${p.userId}`} className="text-primary hover:underline">
                        {p.userName}
                      </Link>
                    ),
                  },
                  { label: "User ID", value: <span className="font-mono text-xs">{p.userId}</span> },
                ]}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Refund" action={p.refund && <StatusBadge status={p.refund.status} />} />
            {p.refund ? (
              <CardBody>
                <DescriptionList
                  cols={1}
                  items={[
                    { label: "Refund ID", value: <span className="font-mono text-xs">{p.refund.id}</span> },
                    { label: "Amount", value: formatCurrency(p.refund.amount) },
                    { label: "Reason", value: p.refund.reason },
                    { label: "Refund to", value: p.refund.destination === "wallet" ? "Wallet" : "Original method" },
                    { label: "Requested by", value: `${p.refund.requestedBy} · ${formatDateTime(p.refund.requestedAt)}` },
                  ]}
                />
                <Link href={`/payments/refunds?status=${p.refund.status}`} className="mt-4 inline-block text-xs font-semibold text-primary hover:underline">
                  Open refunds queue
                </Link>
              </CardBody>
            ) : (
              <EmptyState className="py-8" title="No refund" description={canRefund ? "Use Request refund to start one." : "Only successful payments can be refunded."} />
            )}
          </Card>
        </aside>
      </div>
    </>
  );
}

function IdValue({ value, label }) {
  if (!value) return <span className="text-muted">—</span>;
  return (
    <span className="flex items-center gap-1">
      <span className="min-w-0 font-mono text-xs break-all">{value}</span>
      <CopyButton value={value} label={label} />
    </span>
  );
}
