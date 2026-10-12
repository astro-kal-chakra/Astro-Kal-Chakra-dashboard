import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, CreditCard, Headphones, ReceiptIndianRupee } from "lucide-react";
import { checkAccess } from "@/lib/session";
import { getTicket } from "@/services";
import { formatCurrency, formatDateTime, formatDuration, timeAgo } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader, DescriptionList } from "@/components/ui/Card";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { PersonCell } from "@/components/ui/Avatar";
import { Field, Input } from "@/components/ui/Input";
import { ActionButton } from "@/components/common/ActionButton";
import { TicketThread } from "../_components/TicketThread";
import { OpenChatButton, TicketControls } from "../_components/TicketControls";
import { requestTicketRefund } from "@/actions/support";

export async function generateMetadata({ params }) {
  const { id } = await params;
  return { title: `Ticket ${id}` };
}

export default async function TicketDetailPage({ params }) {
  const { denied } = await checkAccess("support");
  if (denied) return denied;

  const { id } = await params;
  const ticket = await getTicket(id);
  if (!ticket) notFound();

  const { session, payment } = ticket;
  const refundMax = payment?.amount ?? session?.amount ?? 2000;

  return (
    <>
      <PageHeader
        back={{ href: "/support", label: "Ticket inbox" }}
        title={ticket.subject}
        description={`${ticket.id} · Opened ${formatDateTime(ticket.createdAt)} · Updated ${timeAgo(ticket.updatedAt)}`}
        meta={
          <>
            <StatusBadge status={ticket.status} />
            <StatusBadge status={ticket.priority} />
            <Badge className="capitalize">{ticket.category}</Badge>
            {!ticket.assignee && <Badge tone="warning">Unassigned</Badge>}
          </>
        }
        actions={
          // Refunds go through the refunds module; the backend checks refunds:edit and the role's refund limit.
          <ActionButton
            module="refunds"
            reason
            icon={<ReceiptIndianRupee />}
            dialogTitle="Request refund"
            dialogDescription={`Raised from ticket ${ticket.id}. Finance or Ops approves it on the Refunds page.`}
            confirmLabel="Submit refund request"
            success="Refund requested"
            run={requestTicketRefund.bind(null, ticket.id)}
            apiMessage
            reasons={["Payment captured, wallet not credited", "Session disconnected", "Astrologer misconduct", "Duplicate charge"]}
            fields={
              <Field label="Amount (₹)" htmlFor="refund-amount" hint={`Max ${formatCurrency(refundMax)}`}>
                <Input id="refund-amount" name="amount" type="number" min="1" max={refundMax} required placeholder={String(Math.min(refundMax, 100))} />
              </Field>
            }
          >
            Request refund
          </ActionButton>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-5">
        <div className="min-w-0">
          <TicketThread key={ticket.messages?.length ?? 0} ticketId={ticket.id} userName={ticket.userName} initialMessages={ticket.messages ?? []} cannedReplies={ticket.cannedReplies ?? []} />
        </div>

        <aside className="min-w-0 space-y-4 lg:space-y-5">
          <Card>
            <CardHeader title="Ticket" />
            <CardBody>
              <TicketControls ticket={{ id: ticket.id, status: ticket.status, priority: ticket.priority, assigneeId: ticket.assigneeId }} agents={ticket.agentOptions ?? []} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="User"
              action={
                <Link href={`/users/${ticket.userId}`} className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                  View profile <ArrowUpRight className="size-3.5" />
                </Link>
              }
            />
            <CardBody>
              <Link href={`/users/${ticket.userId}`} className="block rounded-lg hover:bg-surface-2">
                <PersonCell name={ticket.userName} sub={ticket.userId} />
              </Link>
            </CardBody>
          </Card>

          {session && (
            <Card>
              <CardHeader
                title="Linked session"
                action={<Headphones className="size-4 text-muted" />}
              />
              <CardBody className="space-y-4">
                <DescriptionList
                  cols={2}
                  items={[
                    {
                      label: "Session",
                      value: (
                        <Link href={`/sessions/${session.id}`} className="font-mono text-xs text-primary hover:underline">
                          {session.id}
                        </Link>
                      ),
                    },
                    { label: "Mode", value: <span className="capitalize">{session.mode}</span> },
                    { label: "Astrologer", value: session.astrologerName },
                    { label: "Duration", value: formatDuration(session.duration) },
                    { label: "Amount", value: session.free ? <Badge tone="info">Free</Badge> : formatCurrency(session.amount) },
                    { label: "Status", value: <StatusBadge status={session.status} /> },
                  ]}
                />
                {session.mode === "chat" && (
                  <div className="space-y-1.5">
                    {/* Support agents can open chats only through a linked ticket — see OpenChatButton. */}
                    <OpenChatButton ticketId={ticket.id} sessionId={session.id} />
                    <p className="text-center text-xs text-muted">Reason required · access is logged</p>
                  </div>
                )}
              </CardBody>
            </Card>
          )}

          {payment && (
            <Card>
              <CardHeader title="Linked payment" action={<CreditCard className="size-4 text-muted" />} />
              <CardBody>
                <DescriptionList
                  cols={2}
                  items={[
                    {
                      label: "Order",
                      value: (
                        <Link href={`/payments/${payment.id}`} className="font-mono text-xs text-primary hover:underline">
                          {payment.id}
                        </Link>
                      ),
                    },
                    { label: "Amount", value: <span className="font-semibold">{formatCurrency(payment.amount)}</span> },
                    { label: "Method", value: payment.method },
                    { label: "Status", value: <StatusBadge status={payment.status} /> },
                    { label: "Date", value: formatDateTime(payment.createdAt) },
                    { label: "Gateway ID", value: <span className="font-mono text-xs">{payment.gatewayPaymentId ?? "—"}</span> },
                  ]}
                />
              </CardBody>
            </Card>
          )}
        </aside>
      </div>
    </>
  );
}
