import Link from "next/link";
import { AlertTriangle, Ban, Percent, X } from "lucide-react";
import { checkAccess } from "@/lib/session";
import { getFlaggedChats } from "@/services";
import { buildHref, flatParams } from "@/lib/url";
import { cn, formatDateTime, formatNumber, timeAgo } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { DataTable, Pagination } from "@/components/ui/Table";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { TabLinks } from "@/components/ui/Tabs";
import { Field, Input } from "@/components/ui/Input";
import { FilterBar } from "@/components/common/FilterBar";
import { ActionButton } from "@/components/common/ActionButton";

export const metadata = { title: "Flagged chats" };

const TYPE_TONES = { phone: "warning", upi: "danger", link: "info", abuse: "danger", off_platform: "accent" };
const SEVERITY = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

export default async function FlaggedChatsPage({ searchParams }) {
  const { denied } = await checkAccess("chats");
  if (denied) return denied;

  const params = flatParams(await searchParams);
  const status = params.status === "resolved" ? "resolved" : "open";
  const data = await getFlaggedChats({ ...params, status });
  const { typeLabels, counts } = data;

  const filters = [
    { name: "type", label: "All types", options: Object.entries(typeLabels).map(([value, label]) => ({ value, label })) },
    { name: "severity", label: "Any severity", options: SEVERITY },
  ];

  const columns = [
    {
      key: "message",
      label: "Message",
      className: "whitespace-normal min-w-64 max-w-md",
      render: (f) => (
        <div className="space-y-1">
          <Badge tone={TYPE_TONES[f.type] ?? "neutral"}>{typeLabels[f.type] ?? f.type}</Badge>
          <p className="line-clamp-2 text-sm text-text">&ldquo;{f.message}&rdquo;</p>
        </div>
      ),
    },
    { key: "severity", label: "Severity", render: (f) => <StatusBadge status={f.severity} /> },
    {
      key: "sender",
      label: "Sender",
      render: (f) => <span className="capitalize">{f.sender === "user" ? `User · ${f.userName}` : "Astrologer"}</span>,
    },
    {
      key: "astrologerName",
      label: "Astrologer",
      hideOnMobile: true,
      render: (f) => (
        <Link href={`/astrologers/${f.astrologerId}`} className="text-primary hover:underline">
          {f.astrologerName}
        </Link>
      ),
    },
    {
      key: "sessionId",
      label: "Session",
      render: (f) => (
        <Link href={`/chats/${f.sessionId}`} className="font-mono text-xs text-primary hover:underline">
          {f.sessionId}
        </Link>
      ),
    },
    { key: "flaggedAt", label: "Flagged", hideOnMobile: true, render: (f) => <span title={formatDateTime(f.flaggedAt)}>{timeAgo(f.flaggedAt)}</span> },
    status === "open"
      ? { key: "actions", label: "Actions", render: (f) => <FlagActions flag={f} /> }
      : { key: "status", label: "Outcome", render: (f) => <StatusBadge status={f.status} /> },
  ];

  return (
    <>
      <PageHeader
        back={{ href: "/chats", label: "All chats" }}
        title="Flagged chats"
        description="Messages caught by the filters: phone numbers, UPI IDs, links, abuse and off-platform requests."
      />

      <div className="mb-4 flex flex-wrap gap-2 lg:mb-5">
        {Object.entries(typeLabels).map(([type, label]) => {
          const active = params.type === type;
          return (
            <Link
              key={type}
              href={buildHref("/chats/flagged", params, { type: active ? "" : type })}
              scroll={false}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                active ? "border-primary bg-primary-soft text-primary-ink" : "border-border bg-surface text-text-2 hover:border-border-strong"
              )}
            >
              {label}
              <span className="tabular-nums text-muted">{formatNumber(counts[type] ?? 0)}</span>
            </Link>
          );
        })}
      </div>

      <Card>
        <TabLinks
          tabs={[
            { value: "open", label: "Open" },
            { value: "resolved", label: "Resolved" },
          ]}
          active={status}
          param="status"
          basePath="/chats/flagged"
          params={params}
          className="px-2"
        />
        <FilterBar searchPlaceholder="Search user, astrologer, session or text" filters={filters} />
        <DataTable
          columns={columns}
          rows={data.rows}
          basePath="/chats/flagged"
          params={params}
          empty={{ title: status === "open" ? "No open flags" : "No resolved flags", description: "Try changing the filters." }}
        />
        <Pagination {...data} basePath="/chats/flagged" params={params} />
      </Card>
    </>
  );
}

/** Moderation actions. Hidden without chats:edit; the backend enforces the same check. */
function FlagActions({ flag }) {
  const who = flag.sender === "user" ? flag.userName : flag.astrologerName;
  return (
    <div className="flex items-center gap-1.5">
      <ActionButton
        module="chats"
        size="xs"
        icon={<AlertTriangle />}
        confirm
        dialogTitle={`Warn ${who}`}
        dialogDescription="They get an in-app warning about this message. Repeat warnings lead to a block."
        confirmLabel="Send warning"
        success="Warning sent"
      >
        Warn
      </ActionButton>
      <ActionButton
        module="chats"
        size="xs"
        reason
        variant="danger-soft"
        icon={<Ban />}
        dialogTitle={`Block ${who}`}
        dialogDescription="The account is signed out and can't take or start sessions."
        success="Account blocked"
      >
        Block
      </ActionButton>
      {flag.sender === "astrologer" && (
        <ActionButton
          module="chats"
          size="xs"
          reason
          icon={<Percent />}
          dialogTitle={`Reduce commission · ${flag.astrologerName}`}
          dialogDescription="Sets a new platform commission for this astrologer's future sessions."
          confirmLabel="Apply new commission"
          success="Commission updated"
          fields={
            <Field label="New commission (%)" htmlFor={`comm-${flag.id}`} hint="Platform share">
              <Input id={`comm-${flag.id}`} name="commission" type="number" min="1" max="90" required placeholder="40" />
            </Field>
          }
        >
          Commission
        </ActionButton>
      )}
      <ActionButton
        module="chats"
        size="xs"
        variant="ghost"
        icon={<X />}
        confirm
        dialogTitle="Dismiss flag"
        dialogDescription="Mark this as a false positive. No action is taken on the account."
        confirmLabel="Dismiss"
        success="Flag dismissed"
      >
        Dismiss
      </ActionButton>
    </div>
  );
}
