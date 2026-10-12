import Link from "next/link";
import { notFound } from "next/navigation";
import { Activity, Ban, CircleCheck, Gift, Smartphone, Trash2, Wallet } from "lucide-react";
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
import { adjustWallet, blockUser, deleteUser, revealUser, unblockUser } from "@/actions/users";
import { EditUserProfile } from "./_components/EditUserProfile";
import { AutoRefresh } from "@/components/common/AutoRefresh";
import { NowBadge, PlatformTag } from "@/components/common/Presence";

const MODE = { chat: "Chat", voice: "Voice call", video: "Video call" };
const ENDED_BY = { user: "User", astrologer: "Astrologer", system: "System", admin: "Admin" };
const QUEUE_TONE = { accepted: "success", waiting: "primary", offered: "info", left: "neutral", expired: "warning", skipped: "warning", cleared: "neutral" };

/** "In a session / requesting / waiting in a queue" panel at the top of the user page. */
function LiveNow({ now }) {
  const s = now.session;
  const q = now.queue;
  return (
    <Card className="border-primary/40">
      <CardHeader title={<span className="flex items-center gap-2"><Activity className="size-4 text-primary" /> Live now</span>} description="Refreshes every 15 seconds" action={<NowBadge now={now} />} />
      <CardBody className="space-y-4">
        {s && (
          <DescriptionList
            cols={3}
            items={[
              { label: s.status === "active" ? "Session" : "Request", value: <Link href={`/sessions/${s.id}`} className="font-mono text-primary hover:underline">{s.id}</Link> },
              { label: "Astrologer", value: s.astrologerId ? <Link href={`/astrologers/${s.astrologerId}`} className="text-primary hover:underline">{s.astrologerName}</Link> : s.astrologerName },
              { label: "Mode", value: `${MODE[s.mode] ?? s.mode}${s.free ? " · Free" : ""}` },
              { label: "Requested", value: formatDateTime(s.requestedAt) },
              { label: s.status === "active" ? "Started" : "Waiting for answer", value: s.status === "active" ? formatDateTime(s.startedAt) : formatDuration(s.waitingSec) },
              { label: "Duration", value: s.status === "active" ? formatDuration(s.elapsed) : "—" },
              { label: "Rate", value: `${formatCurrency(s.ratePerMin)}/min` },
              { label: "Charged so far", value: s.free ? "Free" : formatCurrency(s.runningCharge) },
              { label: "From queue", value: s.fromQueue ? "Yes" : "No" },
            ]}
          />
        )}
        {q && (
          <DescriptionList
            cols={3}
            items={[
              { label: "Queue of", value: q.astrologerId ? <Link href={`/astrologers/${q.astrologerId}`} className="text-primary hover:underline">{q.astrologerName}</Link> : q.astrologerName },
              { label: "Position", value: `#${q.position ?? "?"}` },
              { label: "Mode", value: MODE[q.mode] ?? q.mode },
              { label: "Joined", value: formatDateTime(q.joinedAt) },
              { label: "Waiting", value: formatDuration(q.waitingSec) },
              { label: "Status", value: q.status === "offered" ? `Turn offered${q.offerExpiresAt ? ` · until ${formatDateTime(q.offerExpiresAt)}` : ""}` : "Waiting" },
            ]}
          />
        )}
      </CardBody>
    </Card>
  );
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  return { title: `User ${id}` };
}

const TABS = [
  { value: "wallet", label: "Wallet ledger" },
  { value: "sessions", label: "Sessions" },
  { value: "payments", label: "Payments" },
  { value: "queue", label: "Queue history" },
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
  const live = user.now && user.now.state !== "idle";
  const m = user.money ?? {};

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
            <EditUserProfile id={user.id} />
            <ActionButton
              module="users"
              reason
              icon={<Wallet />}
              dialogTitle="Adjust wallet"
              dialogDescription={`Current balance: ${formatCurrency(user.wallet)}`}
              confirmLabel="Apply adjustment"
              success="Wallet adjusted"
              run={adjustWallet.bind(null, user.id)}
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
              <ActionButton module="users" reason icon={<CircleCheck />} dialogTitle="Unblock user" success="User unblocked" run={unblockUser.bind(null, user.id)}>
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
                run={blockUser.bind(null, user.id)}
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
              run={deleteUser.bind(null, user.id)}
            >
              <span className="max-sm:hidden">Delete</span>
            </ActionButton>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-5">
        <div className="min-w-0 space-y-4 lg:space-y-5">
          {live && (
            <>
              <AutoRefresh seconds={15} />
              <LiveNow now={user.now} />
            </>
          )}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MiniStat label="Wallet balance" value={formatCurrency(user.wallet)} accent />
            <MiniStat label="Total recharged" value={formatCurrency(m.recharged ?? 0)} hint={`${formatNumber(m.rechargeCount ?? 0)} payments`} />
            <MiniStat label="Consultation spend" value={formatCurrency(m.consultationSpend ?? user.totalSpend)} hint={`${formatNumber(user.sessionsCount)} sessions`} />
            <MiniStat label="Bonus received" value={formatCurrency(m.bonusReceived ?? 0)} hint="Recharge bonus + referral" />
            <MiniStat label="Refunds" value={formatCurrency(m.refunds ?? 0)} />
            <MiniStat label="Other spend" value={formatCurrency(m.otherSpend ?? 0)} hint="Reports, gifts, questions" />
            <MiniStat label="Last recharge" value={m.lastRechargeAt ? timeAgo(m.lastRechargeAt) : "Never"} hint={m.firstRechargeAt ? `First ${formatDate(m.firstRechargeAt)}` : undefined} />
            <MiniStat label="Last active" value={timeAgo(user.lastActiveAt)} hint={user.lastSeenPlatform ? `on ${user.lastSeenPlatform === "web" ? "website" : user.lastSeenPlatform}` : undefined} />
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
                  { key: "status", label: "Status", render: (s) => <StatusBadge status={s.status} /> },
                  { key: "requestedAt", label: "Requested", hideOnMobile: true, render: (s) => formatDateTime(s.requestedAt) },
                  { key: "queueWait", label: "Queue wait", align: "right", hideOnMobile: true, render: (s) => (s.queueWait != null ? formatDuration(s.queueWait) : "—") },
                  { key: "waitTime", label: "Answered in", align: "right", hideOnMobile: true, render: (s) => (s.waitTime != null ? formatDuration(s.waitTime) : "—") },
                  { key: "startedAt", label: "Started", render: (s) => formatDateTime(s.startedAt) },
                  { key: "endedAt", label: "Ended", hideOnMobile: true, render: (s) => formatDateTime(s.endedAt) },
                  { key: "duration", label: "Duration", align: "right", render: (s) => formatDuration(s.duration) },
                  { key: "amount", label: "Amount", align: "right", render: (s) => (s.free ? <Badge tone="info">Free</Badge> : formatCurrency(s.amount)) },
                  { key: "endedBy", label: "Ended by", hideOnMobile: true, render: (s) => (s.endedBy ? `${ENDED_BY[s.endedBy] ?? s.endedBy}${s.endReason ? ` · ${s.endReason}` : ""}` : "—") },
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
            {tab === "queue" && (
              <>
                <div className="grid grid-cols-2 gap-3 border-b border-border p-4 sm:grid-cols-4">
                  <MiniStat label="Joined (30 days)" value={formatNumber(user.queueStats?.joined ?? 0)} />
                  <MiniStat label="Connected" value={formatNumber(user.queueStats?.connected ?? 0)} />
                  <MiniStat label="Dropped" value={formatNumber(user.queueStats?.dropped ?? 0)} hint="Left, expired or closed" />
                  <MiniStat label="Average wait" value={formatDuration(user.queueStats?.avgWaitSec ?? 0)} />
                </div>
                <DataTable
                  dense
                  rows={user.queueHistory ?? []}
                  empty={{ title: "Never joined a queue" }}
                  columns={[
                    { key: "astrologerName", label: "Astrologer", render: (q) => (q.astrologerId ? <Link href={`/astrologers/${q.astrologerId}`} className="text-primary hover:underline">{q.astrologerName}</Link> : q.astrologerName) },
                    { key: "mode", label: "Mode", render: (q) => MODE[q.mode] ?? q.mode },
                    { key: "joinedAt", label: "Joined", render: (q) => formatDateTime(q.joinedAt) },
                    { key: "waitedSec", label: "Waited", align: "right", render: (q) => formatDuration(q.waitedSec) },
                    { key: "outcome", label: "Outcome", render: (q) => <Badge tone={QUEUE_TONE[q.status] ?? "neutral"}>{q.outcome}</Badge> },
                    { key: "sessionId", label: "Session", render: (q) => (q.sessionId ? <Link href={`/sessions/${q.sessionId}`} className="font-mono text-xs text-primary hover:underline">{q.sessionId}</Link> : "—") },
                  ]}
                />
              </>
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
                  { label: "Phone", value: <MaskedValue masked={maskPhone(user.phone)} reveal={revealUser.bind(null, user.id, "phone", null)} label="phone number" mono /> },
                  { label: "Email", value: user.email },
                  { label: "Gender", value: user.gender },
                  { label: "Location", value: `${user.city}, ${user.state}` },
                ]}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Access & activity" description="Where the account signed up and is used" />
            <CardBody>
              <DescriptionList
                cols={1}
                items={[
                  { label: "Registered via", value: <span className="flex flex-wrap items-center gap-2"><PlatformTag platform={user.signupPlatform} version={user.signupAppVersion} /><span className="text-xs text-muted">{formatDateTime(user.joinedAt)}</span></span> },
                  { label: "Last login", value: user.lastLoginAt ? <span className="flex flex-wrap items-center gap-2"><PlatformTag platform={user.lastLoginPlatform} version={user.lastLoginAppVersion} /><span className="text-xs text-muted">{formatDateTime(user.lastLoginAt)}</span></span> : "—" },
                  { label: "Last active", value: <span className="flex flex-wrap items-center gap-2"><PlatformTag platform={user.lastSeenPlatform} /><span className="text-xs text-muted">{timeAgo(user.lastActiveAt)}</span></span> },
                  { label: "Logins", value: formatNumber(user.loginCount ?? 0) },
                  { label: "Profile", value: user.activity?.profileCompleted ? `Completed${user.activity.profileCompletedAt ? ` · ${formatDateTime(user.activity.profileCompletedAt)}` : ""}` : <Badge tone="warning">Not completed</Badge> },
                  { label: "Free chat", value: user.activity?.freeChatUsed ? "Used" : "Not used" },
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
                  { label: "Date of birth", value: <MaskedValue masked={maskText(user.birth?.date)} reveal={revealUser.bind(null, user.id, "birth", "date")} label="birth details" /> },
                  { label: "Time of birth", value: <MaskedValue masked={maskText(user.birth?.time)} reveal={revealUser.bind(null, user.id, "birth", "time")} label="birth details" /> },
                  { label: "Place of birth", value: <MaskedValue masked={maskText(user.birth?.place)} reveal={revealUser.bind(null, user.id, "birth", "place")} label="birth details" /> },
                ]}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Devices" />
            <ul className="divide-y divide-border">
              {(user.devices ?? []).map((d) => (
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

