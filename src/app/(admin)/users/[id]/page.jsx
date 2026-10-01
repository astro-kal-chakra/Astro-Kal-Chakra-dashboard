import Link from "next/link";
import { notFound } from "next/navigation";
import { Ban, CircleCheck, Gift, Smartphone, Trash2, Wallet } from "lucide-react";
import { checkAccess } from "@/lib/session";
import { getUser } from "@/services";
import { flatParams } from "@/lib/url";
import { cn, formatCurrency, formatDate, formatDateTime, formatDuration, formatNumber, maskPhone, maskText, timeAgo } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import { MiniStat } from "@/components/ui/StatCard";
import { Card, CardBody, CardHeader, DescriptionList } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/Table";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { TabLinks } from "@/components/ui/Tabs";
import { Field, Input, Select } from "@/components/ui/Input";
import { MaskedValue } from "@/components/common/MaskedValue";
import { ActionButton } from "@/components/common/ActionButton";

export async function generateMetadata({ params }) {
  const { id } = await params;
  return { title: `User ${id}` };
}

const TABS = [
  { value: "wallet", label: "Wallet ledger" },
  { value: "sessions", label: "Sessions" },
  { value: "payments", label: "Payments" },
  { value: "tickets", label: "Tickets" },
];

export default async function UserDetailPage({ params, searchParams }) {
  const { denied } = await checkAccess("users");
  if (denied) return denied;

  const { id } = await params;
  const sp = flatParams(await searchParams);
  const user = await getUser(id);
  if (!user) notFound();

  const tab = TABS.some((t) => t.value === sp.tab) ? sp.tab : "wallet";
  const blocked = user.status === "blocked";

  return (
    <>
      <PageHeader
        back={{ href: "/users", label: "All users" }}
        title={
          <span className="flex items-center gap-3">
            <Avatar name={user.name} size="lg" />
            <span className="min-w-0">
              {user.name}
              <span className="mt-0.5 block text-sm font-medium text-muted">
                {user.id} · Joined {formatDate(user.joinedAt)}
              </span>
            </span>
          </span>
        }
        meta={
          <>
            <StatusBadge status={user.status} />
            <Badge tone="primary">{user.language}</Badge>
            <Badge>{user.city}</Badge>
          </>
        }
        actions={
          <>
            <ActionButton
              module="users"
              reason
              icon={<Wallet />}
              dialogTitle="Adjust wallet"
              dialogDescription={`Current balance: ${formatCurrency(user.wallet)}`}
              confirmLabel="Apply adjustment"
              success="Wallet adjusted"
              fields={
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Type" htmlFor="adj-type">
                    <Select id="adj-type" name="type" options={[{ value: "credit", label: "Credit (+)" }, { value: "debit", label: "Debit (−)" }]} />
                  </Field>
                  <Field label="Amount (₹)" htmlFor="adj-amount">
                    <Input id="adj-amount" name="amount" type="number" min="1" max="10000" required placeholder="100" />
                  </Field>
                </div>
              }
            >
              Adjust wallet
            </ActionButton>
            {blocked ? (
              <ActionButton module="users" reason icon={<CircleCheck />} dialogTitle="Unblock user" success="User unblocked">
                Unblock
              </ActionButton>
            ) : (
              <ActionButton
                module="users"
                reason
                variant="danger-soft"
                icon={<Ban />}
                dialogTitle="Block user"
                dialogDescription="The user is signed out and can't start sessions or recharge."
                success="User blocked"
              >
                Block
              </ActionButton>
            )}
            <ActionButton
              module="users"
              action="delete"
              reason
              variant="ghost"
              icon={<Trash2 />}
              dialogTitle="Delete / anonymise user"
              dialogDescription="Personal data is anonymised. Payment and session records are kept for legal and tax purposes."
              confirmLabel="Anonymise user"
              dialogVariant="danger"
              reasons={["User requested deletion", "Compliance / legal request", "Duplicate account"]}
              success="Anonymisation scheduled"
            >
              <span className="max-sm:hidden">Delete</span>
            </ActionButton>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-5">
        <div className="min-w-0 space-y-4 lg:space-y-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MiniStat label="Wallet balance" value={formatCurrency(user.wallet)} accent />
            <MiniStat label="Total spend" value={formatCurrency(user.totalSpend)} />
            <MiniStat label="Sessions" value={formatNumber(user.sessionsCount)} />
            <MiniStat label="Last active" value={timeAgo(user.lastActiveAt)} />
          </div>

          <Card>
            <TabLinks tabs={TABS} active={tab} basePath={`/users/${id}`} params={sp} className="px-2" />
            {tab === "wallet" && (
              <DataTable
                dense
                rows={user.ledger}
                empty={{ title: "No wallet activity" }}
                columns={[
                  { key: "createdAt", label: "Date", render: (l) => formatDateTime(l.createdAt) },
                  { key: "reason", label: "Reason" },
                  { key: "reference", label: "Reference", render: (l) => <span className="font-mono text-xs">{l.reference}</span> },
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
                  { key: "by", label: "By", hideOnMobile: true },
                ]}
              />
            )}
            {tab === "sessions" && (
              <DataTable
                dense
                rows={user.sessions}
                rowHref={(s) => `/sessions/${s.id}`}
                empty={{ title: "No sessions yet" }}
                columns={[
                  { key: "id", label: "Session", render: (s) => <span className="font-mono text-xs">{s.id}</span> },
                  { key: "astrologerName", label: "Astrologer" },
                  { key: "mode", label: "Mode", render: (s) => <span className="capitalize">{s.mode}</span> },
                  { key: "duration", label: "Duration", align: "right", render: (s) => formatDuration(s.duration) },
                  { key: "amount", label: "Amount", align: "right", render: (s) => (s.free ? <Badge tone="info">Free</Badge> : formatCurrency(s.amount)) },
                  { key: "status", label: "Status", render: (s) => <StatusBadge status={s.status} /> },
                  { key: "startedAt", label: "Started", render: (s) => formatDateTime(s.startedAt) },
                ]}
              />
            )}
            {tab === "payments" && (
              <DataTable
                dense
                rows={user.payments}
                rowHref={(p) => `/payments/${p.id}`}
                empty={{ title: "No payments yet" }}
                columns={[
                  { key: "id", label: "Order", render: (p) => <span className="font-mono text-xs">{p.id}</span> },
                  { key: "pack", label: "Pack" },
                  { key: "method", label: "Method" },
                  { key: "amount", label: "Amount", align: "right", render: (p) => <span className="font-semibold text-text">{formatCurrency(p.amount)}</span> },
                  { key: "status", label: "Status", render: (p) => <StatusBadge status={p.status} /> },
                  { key: "createdAt", label: "Date", render: (p) => formatDateTime(p.createdAt) },
                ]}
              />
            )}
            {tab === "tickets" && (
              <DataTable
                dense
                rows={user.tickets}
                rowHref={(t) => `/support/${t.id}`}
                empty={{ title: "No support tickets" }}
                columns={[
                  { key: "id", label: "Ticket", render: (t) => <span className="font-mono text-xs">{t.id}</span> },
                  { key: "subject", label: "Subject", className: "max-w-72 truncate" },
                  { key: "priority", label: "Priority", render: (t) => <StatusBadge status={t.priority} /> },
                  { key: "status", label: "Status", render: (t) => <StatusBadge status={t.status} /> },
                  { key: "createdAt", label: "Opened", render: (t) => timeAgo(t.createdAt) },
                ]}
              />
            )}
          </Card>
        </div>

        <aside className="min-w-0 space-y-4 lg:space-y-5">
          <Card>
            <CardHeader title="Profile" />
            <CardBody>
              <DescriptionList
                cols={1}
                items={[
                  { label: "Phone", value: <MaskedValue masked={maskPhone(user.phone)} value={`+${user.phone}`} label="phone number" mono /> },
                  { label: "Email", value: user.email },
                  { label: "Gender", value: user.gender },
                  { label: "Location", value: `${user.city}, ${user.state}` },
                ]}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Birth details" description="Hidden by default · reveal is logged" />
            <CardBody>
              <DescriptionList
                cols={1}
                items={[
                  { label: "Date of birth", value: <MaskedValue masked={maskText(user.birth.date)} value={formatDate(user.birth.date)} label="birth details" /> },
                  { label: "Time of birth", value: <MaskedValue masked={maskText(user.birth.time)} value={user.birth.time} label="birth details" /> },
                  { label: "Place of birth", value: <MaskedValue masked={maskText(user.birth.place)} value={user.birth.place} label="birth details" /> },
                ]}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Devices" />
            <ul className="divide-y divide-border">
              {user.devices.map((d) => (
                <li key={d.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-surface-3 text-muted">
                    <Smartphone className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-text">{d.model}</p>
                    <p className="text-xs text-muted">
                      {d.os} · App {d.appVersion}
                    </p>
                  </div>
                  <span className="text-xs text-muted">{timeAgo(d.lastSeen)}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <CardHeader title="Referrals" action={<Gift className="size-4 text-muted" />} />
            <CardBody>
              <DescriptionList
                cols={2}
                items={[
                  { label: "Referral code", value: <span className="font-mono">{user.referralCode}</span> },
                  { label: "Friends referred", value: formatNumber(user.referrals) },
                  {
                    label: "Referred by",
                    value: user.referredBy ? (
                      <Link href={`/users/${user.referredBy}`} className="text-primary hover:underline">
                        {user.referredBy}
                      </Link>
                    ) : (
                      "Organic"
                    ),
                  },
                ]}
              />
            </CardBody>
          </Card>
        </aside>
      </div>
    </>
  );
}

