import Link from "next/link";
import { notFound } from "next/navigation";
import { Ban, CircleCheck, CircleX, FilePlus2, Landmark, RotateCcw, Star } from "lucide-react";
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

export async function generateMetadata({ params }) {
  const { id } = await params;
  return { title: `Astrologer ${id}` };
}

const TABS = [
  { value: "performance", label: "Performance" },
  { value: "reviews", label: "Reviews" },
  { value: "complaints", label: "Complaints" },
  { value: "settings", label: "Settings" },
];

const REJECT_REASONS = ["Blurry KYC document", "Certification not verifiable", "Failed interview", "Incomplete profile", "Duplicate application"];
const DOC_REQUEST_REASONS = ["Document is blurry", "Document expired", "Name does not match", "Missing document"];
const BLOCK_REASONS = ["Asked users to pay outside the app", "Abusive behaviour", "Repeated complaints", "Fraud / abuse investigation", "Fake documents"];

/** Mock: builds a full account number for the reveal demo. A real API returns it only from POST /reveal. */
const fullAccount = (a) => `5010${a.id.replace(/\D/g, "")}00${a.bank.account.slice(-4)}`;

function VerificationActions({ a }) {
  // The UI hides these by permission; the backend enforces the same check.
  const approve = (
    <ActionButton
      module="astrologers"
      action="approve"
      variant="success"
      icon={<CircleCheck />}
      confirm
      dialogTitle="Approve astrologer"
      dialogDescription={`${a.name} can go online and take paid sessions right away.`}
      confirmLabel="Approve"
      success="Astrologer approved"
    >
      Approve
    </ActionButton>
  );
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
  if (a.status === "approved") return block;
  if (a.status === "blocked")
    return (
      <ActionButton module="astrologers" reason icon={<CircleCheck />} dialogTitle="Unblock astrologer" success="Astrologer unblocked">
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
  const a = await getAstrologer(id);
  if (!a) notFound();

  const tab = TABS.some((t) => t.value === sp.tab) ? sp.tab : "performance";
  const tabs = TABS.map((t) =>
    t.value === "reviews" ? { ...t, count: a.reviews.length } : t.value === "complaints" ? { ...t, count: a.complaintsList.length } : t
  );
  const approved = a.status === "approved";

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
        actions={<VerificationActions a={a} />}
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-5">
        <div className="min-w-0 space-y-4 lg:space-y-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MiniStat label="Rating" value={a.rating ? `${a.rating.toFixed(1)} ★` : "—"} hint={`${formatNumber(a.reviewsCount)} reviews`} accent />
            <MiniStat label="Sessions" value={formatNumber(a.sessions)} />
            <MiniStat label="Online hours" value={formatNumber(a.onlineHours)} hint="Last 30 days" />
            <MiniStat label="Complaints" value={formatNumber(a.complaints)} />
          </div>

          <Card>
            <CardHeader title="KYC documents" description="Opened only through short-lived signed links" />
            <KycDocuments docs={a.kyc} astrologerName={a.name} />
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
                      { key: "duration", label: "Duration", align: "right", render: (s) => formatDuration(s.duration) },
                      { key: "amount", label: "Amount", align: "right", render: (s) => (s.free ? <Badge tone="info">Free</Badge> : formatCurrency(s.amount)) },
                      { key: "status", label: "Status", hideOnMobile: true, render: (s) => <StatusBadge status={s.status} /> },
                      { key: "startedAt", label: "Started", hideOnMobile: true, render: (s) => formatDateTime(s.startedAt) },
                    ]}
                  />
                </div>
                <div>
                  <h3 className="px-4 pb-2 text-sm font-bold text-text sm:px-5">Payouts</h3>
                  <DataTable
                    dense
                    rows={a.payouts}
                    rowHref={(p) => `/payouts/${p.id}`}
                    empty={{ title: "No payouts yet" }}
                    columns={[
                      { key: "id", label: "Payout", render: (p) => <span className="font-mono text-xs">{p.id}</span> },
                      { key: "period", label: "Period" },
                      { key: "gross", label: "Gross", align: "right", hideOnMobile: true, render: (p) => formatCurrency(p.gross) },
                      { key: "commission", label: "Commission", align: "right", hideOnMobile: true, render: (p) => formatCurrency(p.commission) },
                      { key: "net", label: "Net", align: "right", render: (p) => <span className="font-semibold text-text">{formatCurrency(p.net)}</span> },
                      { key: "status", label: "Status", render: (p) => <StatusBadge status={p.status} /> },
                    ]}
                  />
                </div>
              </div>
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
                astrologer={{ name: a.name, commission: a.commission, chatPrice: a.chatPrice, voicePrice: a.voicePrice, videoPrice: a.videoPrice, badges: a.badges }}
              />
            )}
          </Card>
        </div>

        <aside className="min-w-0 space-y-4 lg:space-y-5">
          <Card>
            <CardHeader title="Profile" />
            <CardBody className="space-y-4">
              <p className="text-sm text-text-2">{a.bio}</p>
              <DescriptionList
                cols={1}
                items={[
                  { label: "Phone", value: <MaskedValue masked={maskPhone(a.phone)} value={`+${a.phone}`} label="phone number" module="astrologers" mono /> },
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

          <Card>
            <CardHeader title="Bank details" description="Hidden by default · reveal is logged" action={<Landmark className="size-4 text-muted" />} />
            <CardBody>
              <DescriptionList
                cols={1}
                items={[
                  { label: "Bank", value: a.bank.bank },
                  { label: "Account number", value: <MaskedValue masked={a.bank.account} value={fullAccount(a)} label="bank account" module="astrologers" mono /> },
                  { label: "IFSC", value: <span className="font-mono text-[13px]">{a.bank.ifsc}</span> },
                ]}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Pricing" action={<Star className="size-4 text-muted" />} />
            <CardBody>
              <DescriptionList
                cols={2}
                items={[
                  { label: "Chat", value: `₹${a.chatPrice}/min` },
                  { label: "Voice", value: `₹${a.voicePrice}/min` },
                  { label: "Video", value: `₹${a.videoPrice}/min` },
                  { label: "Commission", value: `${a.commission}%` },
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
