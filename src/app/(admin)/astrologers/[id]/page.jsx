import Link from "next/link";
import { notFound } from "next/navigation";
import { Activity, Ban, CircleCheck, CircleX, FilePlus2, Landmark, Percent, RotateCcw, Star } from "lucide-react";
import { checkAccess } from "@/lib/session";
import { getAstrologer } from "@/services";
import { flatParams } from "@/lib/url";
import { formatCurrency, formatDate, formatDateTime, formatDuration, formatNumber, maskPhone, timeAgo } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import { MiniStat } from "@/components/ui/StatCard";
import { Card, CardBody, CardHeader, DescriptionList } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/Table";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { TabLinks } from "@/components/ui/Tabs";
import { Field, Textarea } from "@/components/ui/Input";
import { MaskedValue } from "@/components/common/MaskedValue";
import { ActionButton } from "@/components/common/ActionButton";
import { KycDocuments } from "./_components/KycDocuments";
import { ReviewsList } from "./_components/ReviewsList";
import { AstrologerSettingsForm } from "./_components/AstrologerSettingsForm";
import { ApproveButton } from "./_components/ApproveButton";
import { TrainingCard } from "./_components/TrainingCard";
import { EditAstrologerProfile } from "./_components/EditAstrologerProfile";
import { AutoRefresh } from "@/components/common/AutoRefresh";
import { AstroNow, PlatformTag } from "@/components/common/Presence";
import { getAstrologerFilterOptions } from "@/services/astrologers";
import {
  blockAstrologer,
  rejectAstrologer,
  reopenAstrologer,
  requestDocuments,
  revealAstrologer,
  unblockAstrologer,
} from "@/actions/astrologers";

export async function generateMetadata({ params }) {
  const { id } = await params;
  return { title: `Astrologer ${id}` };
}

const MODE = { chat: "Chat", voice: "Voice call", video: "Video call" };
const ENDED_BY = { user: "User", astrologer: "Astrologer", system: "System", admin: "Admin" };
const QUEUE_TONE = { accepted: "success", waiting: "primary", offered: "info", left: "neutral", expired: "warning", skipped: "warning", cleared: "neutral" };

/** Current session + waiting queue, refreshed every 15 seconds while something is happening. */
function LiveNow({ a }) {
  const s = a.now?.session;
  const q = a.now?.queue ?? [];
  return (
    <Card className="border-primary/40">
      <CardHeader
        title={<span className="flex items-center gap-2"><Activity className="size-4 text-primary" /> Live now</span>}
        description="Refreshes every 15 seconds"
        action={<AstroNow a={{ ...a, currentSession: s?.status === "active" ? s : null, queueLength: q.length }} />}
      />
      {s && (
        <CardBody className="border-b border-border">
          <DescriptionList
            cols={3}
            items={[
              { label: s.status === "active" ? "Session" : "Incoming request", value: <Link href={`/sessions/${s.id}`} className="font-mono text-primary hover:underline">{s.id}</Link> },
              { label: "User", value: s.userId ? <Link href={`/users/${s.userId}`} className="text-primary hover:underline">{s.userName}</Link> : s.userName },
              { label: "Mode", value: `${MODE[s.mode] ?? s.mode}${s.free ? " · Free" : ""}` },
              { label: "Requested", value: formatDateTime(s.requestedAt) },
              { label: s.status === "active" ? "Started" : "Ringing for", value: s.status === "active" ? formatDateTime(s.startedAt) : formatDuration(s.waitingSec) },
              { label: "Duration", value: s.status === "active" ? formatDuration(s.elapsed) : "—" },
              { label: "Rate", value: `${formatCurrency(s.ratePerMin)}/min` },
              { label: "Charged so far", value: s.free ? "Free" : formatCurrency(s.runningCharge) },
              { label: "From queue", value: s.fromQueue ? "Yes" : "No" },
            ]}
          />
        </CardBody>
      )}
      <div>
        <h3 className="px-4 pt-3 pb-2 text-sm font-bold text-text sm:px-5">Queue · {q.length} waiting</h3>
        <DataTable
          dense
          rows={q.map((x) => ({ ...x, id: x.entryId }))}
          empty={{ title: "No one in the queue" }}
          columns={[
            { key: "position", label: "#", render: (x) => <span className="font-semibold">#{x.position}</span> },
            { key: "userName", label: "User", render: (x) => (x.userId ? <Link href={`/users/${x.userId}`} className="text-primary hover:underline">{x.userName}</Link> : x.userName) },
            { key: "mode", label: "Mode", render: (x) => MODE[x.mode] ?? x.mode },
            { key: "joinedAt", label: "Joined", render: (x) => formatDateTime(x.joinedAt) },
            { key: "waitingSec", label: "Waiting", align: "right", render: (x) => formatDuration(x.waitingSec) },
            { key: "status", label: "Status", render: (x) => <Badge tone={x.status === "offered" ? "success" : "primary"}>{x.status === "offered" ? "Turn offered" : "Waiting"}</Badge> },
          ]}
        />
      </div>
    </Card>
  );
}

const TABS = [
  { value: "performance", label: "Performance" },
  { value: "queue", label: "Queue history" },
  { value: "reviews", label: "Reviews" },
  { value: "complaints", label: "Complaints" },
  { value: "settings", label: "Settings" },
];

const REJECT_REASONS = ["Blurry KYC document", "Certification not verifiable", "Failed interview", "Incomplete profile", "Duplicate application"];
const DOC_REQUEST_REASONS = ["Document is blurry", "Document expired", "Name does not match", "Missing document"];
const BLOCK_REASONS = ["Asked users to pay outside the app", "Abusive behaviour", "Repeated complaints", "Fraud / abuse investigation", "Fake documents"];

function VerificationActions({ a }) {
  // The UI hides these by permission; the backend enforces the same check.
  const approve = <ApproveButton id={a.id} name={a.name} />;
  const reject = (
    <ActionButton
      module="astrologers"
      action="approve"
      reason
      reasons={REJECT_REASONS}
      variant="danger-soft"
      icon={<CircleX />}
      dialogTitle="Reject application"
      dialogDescription="The astrologer is told the reason and can apply again after 30 days."
      confirmLabel="Reject"
      success="Application rejected"
      run={rejectAstrologer.bind(null, a.id)}
    >
      Reject
    </ActionButton>
  );
  const requestDocs = (
    <ActionButton
      module="astrologers"
      action="approve"
      reason
      reasons={DOC_REQUEST_REASONS}
      icon={<FilePlus2 />}
      dialogTitle="Request more documents"
      dialogDescription="The astrologer gets a notification to upload the selected documents."
      confirmLabel="Send request"
      success="Document request sent"
      run={requestDocuments.bind(null, a.id)}
      fields={
        <div className="space-y-3">
          <fieldset>
            <legend className="mb-1.5 text-xs font-semibold text-text-2">Documents needed</legend>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {a.kyc.map((d) => (
                <label key={d.id} className="flex items-center gap-2 rounded-lg border border-border px-2.5 py-2 text-sm text-text">
                  <input type="checkbox" name={`doc-${d.id}`} defaultChecked={d.status !== "verified"} className="size-4 accent-primary" />
                  {d.name}
                </label>
              ))}
            </div>
          </fieldset>
          <Field label="Note to astrologer" htmlFor="doc-note">
            <Textarea id="doc-note" name="note" rows={2} placeholder="e.g. Please upload a clear photo of the back side." />
          </Field>
        </div>
      }
    >
      Request documents
    </ActionButton>
  );
  const block = (
    <ActionButton
      module="astrologers"
      reason
      reasons={BLOCK_REASONS}
      variant="danger-soft"
      icon={<Ban />}
      dialogTitle="Block astrologer"
      dialogDescription="They go offline at once, running sessions end and payouts are put on hold."
      success="Astrologer blocked"
      run={blockAstrologer.bind(null, a.id)}
    >
      Block
    </ActionButton>
  );

  if (a.status === "pending")
    return (
      <>
        {requestDocs}
        {reject}
        {approve}
      </>
    );
  if (a.status === "approved" || a.status === "training") return block;
  if (a.status === "blocked")
    return (
      <ActionButton module="astrologers" reason icon={<CircleCheck />} dialogTitle="Unblock astrologer" success="Astrologer unblocked" run={unblockAstrologer.bind(null, a.id)}>
        Unblock
      </ActionButton>
    );
  return (
    <ActionButton
      module="astrologers"
      action="approve"
      confirm
      icon={<RotateCcw />}
      dialogTitle="Reopen application"
      dialogDescription="The application moves back to Pending for another review."
      confirmLabel="Reopen"
      success="Application reopened"
      run={reopenAstrologer.bind(null, a.id)}
    >
      Reopen application
    </ActionButton>
  );
}

export default async function AstrologerDetailPage({ params, searchParams }) {
  const { denied } = await checkAccess("astrologers");
  if (denied) return denied;

  const { id } = await params;
  const sp = flatParams(await searchParams);
  const [a, options] = await Promise.all([getAstrologer(id), getAstrologerFilterOptions()]);
  if (!a) notFound();

  const tab = TABS.some((t) => t.value === sp.tab) ? sp.tab : "performance";
  const tabs = TABS.map((t) =>
    t.value === "reviews" ? { ...t, count: a.reviews.length } : t.value === "complaints" ? { ...t, count: a.complaintsList.length } : t
  );
  const approved = a.status === "approved" || a.status === "training";

  return (
    <>
      <PageHeader
        back={{ href: `/astrologers?status=${a.status}`, label: "All astrologers" }}
        title={
          <span className="flex items-center gap-3">
            <Avatar name={a.name} size="lg" />
            <span className="min-w-0">
              {a.name}
              <span className="mt-0.5 block text-sm font-medium text-muted">
                {a.id} · {a.status === "pending" ? `Applied ${timeAgo(a.appliedAt)}` : `Since ${formatDate(a.appliedAt)}`}
              </span>
            </span>
          </span>
        }
        meta={
          <>
            <StatusBadge status={a.status} />
            {approved &&
              (a.inSession ? (
                <Badge tone="info" dot>In session</Badge>
              ) : a.online ? (
                <Badge tone="success" dot>Online</Badge>
              ) : (
                <Badge dot>Offline</Badge>
              ))}
            {a.badges.map((b) => (
              <Badge key={b} tone="primary">
                {b}
              </Badge>
            ))}
            {a.rejectionReason && <Badge tone="danger">Rejected: {a.rejectionReason}</Badge>}
          </>
        }
        actions={
          <>
            <EditAstrologerProfile id={a.id} skillOptions={options.skills} />
            <VerificationActions a={a} />
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-5">
        <div className="min-w-0 space-y-4 lg:space-y-5">
          {(a.now?.session || a.now?.queue?.length || a.online) && a.status === "approved" ? (
            <>
              <AutoRefresh seconds={15} />
              <LiveNow a={a} />
            </>
          ) : null}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MiniStat label="Rating" value={a.rating ? `${a.rating.toFixed(1)} ★` : "—"} hint={`${formatNumber(a.reviewsCount)} reviews`} accent />
            <MiniStat label="Sessions" value={formatNumber(a.sessions)} />
            <MiniStat label="Online hours" value={formatNumber(a.onlineHours)} hint="Last 30 days" />
            <MiniStat label="Complaints" value={formatNumber(a.complaints)} />
            <MiniStat label="Today" value={`${formatNumber(a.today?.sessions ?? 0)} sessions`} hint={`${formatNumber(a.today?.minutes ?? 0)} min · ${formatCurrency(a.today?.gross ?? 0)} billed`} />
            <MiniStat label="Earned today" value={formatCurrency(a.today?.earned ?? 0)} />
            <MiniStat label="Queue (30 days)" value={`${formatNumber(a.queueStats?.connected ?? 0)}/${formatNumber(a.queueStats?.joined ?? 0)} connected`} hint={`${formatNumber(a.queueStats?.dropped ?? 0)} dropped`} />
            <MiniStat label="Avg queue wait" value={formatDuration(a.queueStats?.avgWaitSec ?? 0)} hint="Before connecting" />
          </div>

          {a.training && <TrainingCard astrologerId={a.id} name={a.name} training={a.training} />}

          <Card>
            <CardHeader title="KYC documents" description="Opened only through short-lived signed links" />
            <KycDocuments docs={a.kyc} astrologerId={a.id} astrologerName={a.name} />
          </Card>

          <Card>
            <TabLinks tabs={tabs} active={tab} basePath={`/astrologers/${id}`} params={sp} className="px-2" />

            {tab === "performance" && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-3 px-4 sm:grid-cols-3 sm:px-5 xl:grid-cols-5">
                  <MiniStat label="Sessions" value={formatNumber(a.sessions)} />
                  <MiniStat label="Earnings" value={formatCurrency(a.earnings, true)} />
                  <MiniStat label="Rating" value={a.rating ? a.rating.toFixed(1) : "—"} />
                  <MiniStat label="Avg response" value={formatDuration(a.responseTime)} />
                  <MiniStat label="Missed requests" value={formatNumber(a.missedRequests)} />
                </div>
                <div>
                  <h3 className="px-4 pb-2 text-sm font-bold text-text sm:px-5">Recent sessions</h3>
                  <DataTable
                    dense
                    rows={a.recentSessions}
                    rowHref={(s) => `/sessions/${s.id}`}
                    empty={{ title: "No sessions yet", description: "Sessions appear once the astrologer is approved and online." }}
                    columns={[
                      { key: "id", label: "Session", render: (s) => <span className="font-mono text-xs">{s.id}</span> },
                      { key: "userName", label: "User" },
                      { key: "mode", label: "Mode", render: (s) => <span className="capitalize">{s.mode}</span> },
                      { key: "status", label: "Status", hideOnMobile: true, render: (s) => <StatusBadge status={s.status} /> },
                      { key: "queueWait", label: "Queue wait", align: "right", hideOnMobile: true, render: (s) => (s.queueWait != null ? formatDuration(s.queueWait) : "—") },
                      { key: "waitTime", label: "Answered in", align: "right", hideOnMobile: true, render: (s) => (s.waitTime != null ? formatDuration(s.waitTime) : "—") },
                      { key: "startedAt", label: "Started", hideOnMobile: true, render: (s) => formatDateTime(s.startedAt) },
                      { key: "endedAt", label: "Ended", hideOnMobile: true, render: (s) => formatDateTime(s.endedAt) },
                      { key: "duration", label: "Duration", align: "right", render: (s) => formatDuration(s.duration) },
                      { key: "amount", label: "Amount", align: "right", render: (s) => (s.free ? <Badge tone="info">Free</Badge> : formatCurrency(s.amount)) },
                      { key: "endedBy", label: "Ended by", hideOnMobile: true, render: (s) => (s.endedBy ? ENDED_BY[s.endedBy] ?? s.endedBy : "—") },
                    ]}
                  />
                </div>
                <div>
                  <h3 className="px-4 pb-2 text-sm font-bold text-text sm:px-5">Payouts</h3>
                  <DataTable
                    dense
                    rows={a.payouts}
                    rowHref={(p) => `/payouts?status=${p.status}&q=${p.id}`}
                    empty={{ title: "No payouts yet" }}
                    columns={[
                      { key: "id", label: "Payout", render: (p) => <span className="font-mono text-xs">{p.id}</span> },
                      { key: "period", label: "Period" },
                      { key: "gross", label: "Gross", align: "right", hideOnMobile: true, render: (p) => formatCurrency(p.gross) },
                      { key: "commission", label: "Platform charge", align: "right", hideOnMobile: true, render: (p) => formatCurrency(p.commission) },
                      { key: "net", label: "Net", align: "right", render: (p) => <span className="font-semibold text-text">{formatCurrency(p.net)}</span> },
                      { key: "status", label: "Status", render: (p) => <StatusBadge status={p.status} /> },
                    ]}
                  />
                </div>
              </div>
            )}

            {tab === "queue" && (
              <DataTable
                dense
                rows={a.queueHistory ?? []}
                empty={{ title: "No queue activity yet" }}
                columns={[
                  { key: "userName", label: "User", render: (q) => (q.userId ? <Link href={`/users/${q.userId}`} className="text-primary hover:underline">{q.userName}</Link> : q.userName) },
                  { key: "mode", label: "Mode", render: (q) => MODE[q.mode] ?? q.mode },
                  { key: "joinedAt", label: "Joined", render: (q) => formatDateTime(q.joinedAt) },
                  { key: "waitedSec", label: "Waited", align: "right", render: (q) => formatDuration(q.waitedSec) },
                  { key: "outcome", label: "Outcome", render: (q) => <Badge tone={QUEUE_TONE[q.status] ?? "neutral"}>{q.outcome}</Badge> },
                  { key: "sessionId", label: "Session", render: (q) => (q.sessionId ? <Link href={`/sessions/${q.sessionId}`} className="font-mono text-xs text-primary hover:underline">{q.sessionId}</Link> : "—") },
                ]}
              />
            )}

            {tab === "reviews" && <ReviewsList reviews={a.reviews} />}

            {tab === "complaints" && (
              <DataTable
                dense
                rows={a.complaintsList}
                rowHref={(t) => `/support/${t.id}`}
                empty={{ title: "No complaints" }}
                columns={[
                  { key: "id", label: "Ticket", render: (t) => <span className="font-mono text-xs">{t.id}</span> },
                  { key: "subject", label: "Complaint", className: "max-w-72 truncate" },
                  { key: "userName", label: "From", hideOnMobile: true },
                  { key: "priority", label: "Priority", render: (t) => <StatusBadge status={t.priority} /> },
                  { key: "status", label: "Status", render: (t) => <StatusBadge status={t.status} /> },
                  { key: "createdAt", label: "Opened", hideOnMobile: true, render: (t) => timeAgo(t.createdAt) },
                ]}
              />
            )}

            {tab === "settings" && (
              <AstrologerSettingsForm
                astrologer={{ id: a.id, name: a.name, commission: a.commission, chatPrice: a.chatPrice, voicePrice: a.voicePrice, videoPrice: a.videoPrice, badges: a.badges, settings: a.settings }}
              />
            )}
          </Card>
        </div>

        <aside className="min-w-0 space-y-4 lg:space-y-5">
          <Card>
            <CardHeader title="Access & activity" description="App sign-up, logins and online time" />
            <CardBody>
              <DescriptionList
                cols={1}
                items={[
                  { label: "Registered via", value: <span className="flex flex-wrap items-center gap-2"><PlatformTag platform={a.signupPlatform} version={a.signupAppVersion} /><span className="text-xs text-muted">{formatDateTime(a.appliedAt)}</span></span> },
                  { label: "Last login", value: a.lastLoginAt ? <span className="flex flex-wrap items-center gap-2"><PlatformTag platform={a.lastLoginPlatform} version={a.lastLoginAppVersion} /><span className="text-xs text-muted">{formatDateTime(a.lastLoginAt)}</span></span> : "—" },
                  { label: "Last active in app", value: a.lastSeenAt ? timeAgo(a.lastSeenAt) : "—" },
                  { label: "Last online", value: a.online ? <Badge tone="success" dot>Online now</Badge> : a.lastOnlineAt ? formatDateTime(a.lastOnlineAt) : "—" },
                  { label: "Logins", value: formatNumber(a.loginCount ?? 0) },
                ]}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Profile" />
            <CardBody className="space-y-4">
              <p className="text-sm text-text-2">{a.bio}</p>
              <DescriptionList
                cols={1}
                items={[
                  { label: "Phone", value: <MaskedValue masked={maskPhone(a.phone)} reveal={revealAstrologer.bind(null, a.id, "phone")} label="phone number" module="astrologers" mono /> },
                  { label: "Email", value: a.email },
                  { label: "Experience", value: `${a.experience} years` },
                  {
                    label: "Skills",
                    value: (
                      <span className="flex flex-wrap gap-1">
                        {a.skills.map((s) => (
                          <Badge key={s} tone="primary">
                            {s}
                          </Badge>
                        ))}
                      </span>
                    ),
                  },
                  { label: "Languages", value: a.languages.join(", ") },
                  { label: "Location", value: `${a.city}, ${a.state}` },
                  { label: "Gender", value: a.gender },
                ]}
              />
            </CardBody>
          </Card>

          {/* Registration form answers: custom fields added in Settings → Astrologer registration + other built-ins */}
          {a.answers?.length > 0 && (
            <Card>
              <CardHeader title="Application answers" description="From the registration form" />
              <CardBody>
                <DescriptionList cols={1} items={a.answers.map((x) => ({ label: x.label, value: x.value == null || x.value === "" ? <span className="text-muted">Not answered</span> : String(x.value) }))} />
              </CardBody>
            </Card>
          )}

          <Card>
            <CardHeader title="Bank details" description="Hidden by default · reveal is logged" action={<Landmark className="size-4 text-muted" />} />
            <CardBody>
              <DescriptionList
                cols={1}
                items={[
                  { label: "Bank", value: a.bank?.bank ?? "—" },
                  { label: "Account number", value: <MaskedValue masked={a.bank?.account ?? "—"} reveal={a.bank?.account ? revealAstrologer.bind(null, a.id, "bank_account") : undefined} label="bank account" module="astrologers" mono /> },
                  { label: "IFSC", value: <span className="font-mono text-[13px]">{a.bank?.ifsc ?? "—"}</span> },
                ]}
              />
            </CardBody>
          </Card>

          {a.money && (
            <Card>
              <CardHeader
                title="Earnings & platform charge"
                description={`Sessions pay in full · ${a.money.commission}% is deducted from each payout`}
                action={<Percent className="size-4 text-muted" />}
              />
              <CardBody className="space-y-3">
                <DescriptionList
                  cols={1}
                  items={[
                    { label: "Total earned", value: formatCurrency(a.money.earned) },
                    { label: "Earnings balance", value: <span className="font-semibold text-text">{formatCurrency(a.money.balance)}</span> },
                    { label: `Platform charge on balance (${a.money.commission}%)`, value: `−${formatCurrency(a.money.platformChargeOnBalance)}` },
                    { label: "Payable now (after TDS)", value: formatCurrency(a.money.payableOnBalance) },
                    { label: "Platform charges collected", value: <span className="font-semibold text-success">{formatCurrency(a.money.platformChargesTaken)}</span> },
                    { label: "Paid to bank", value: formatCurrency(a.money.paidOut) },
                    { label: "Payouts in progress", value: formatCurrency(a.money.pendingPayouts) },
                  ]}
                />
              </CardBody>
            </Card>
          )}

          <Card>
            <CardHeader title="Pricing" action={<Star className="size-4 text-muted" />} />
            <CardBody>
              <DescriptionList
                cols={2}
                items={[
                  { label: "Chat", value: `₹${a.chatPrice}/min` },
                  { label: "Voice", value: `₹${a.voicePrice}/min` },
                  { label: "Video", value: `₹${a.videoPrice}/min` },
                  { label: "Platform charge", value: `${a.commission}% of payouts` },
                  { label: "Queue now", value: formatNumber(a.queueLength) },
                  { label: "Payouts", value: <Link href={`/payouts?q=${a.id}`} className="text-primary hover:underline">View all</Link> },
                ]}
              />
            </CardBody>
          </Card>
        </aside>
      </div>
    </>
  );
}
