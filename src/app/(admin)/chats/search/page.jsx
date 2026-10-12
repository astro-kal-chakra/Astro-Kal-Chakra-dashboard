import Link from "next/link";
import { Lock, ScrollText, Search } from "lucide-react";
import { checkAccess } from "@/lib/session";
import { can } from "@/config/permissions";
import { searchChats } from "@/services";
import { flatParams } from "@/lib/url";
import { formatDateTime, formatNumber } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Pagination } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterBar } from "@/components/common/FilterBar";

export const metadata = { title: "Chat search" };

export default async function ChatSearchPage({ searchParams }) {
  const { admin, denied } = await checkAccess("chats");
  if (denied) return denied;

  // Keyword search across transcripts is limited to chats:delete (Super Admin, Moderator).
  // The backend enforces the same check and logs every search.
  if (!can(admin.role, "chats", "delete")) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
        <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-danger-soft text-danger">
          <Lock className="size-6" />
        </div>
        <h1 className="text-lg font-bold text-text">Chat search is restricted</h1>
        <p className="mt-1 max-w-md text-sm text-muted">
          Only Super Admins and Moderators can search across chat transcripts. Your role{" "}
          <span className="font-semibold text-text-2">{admin.role.name}</span> can open single chats with a reason.
        </p>
        <Button href="/chats" variant="primary" className="mt-5">
          Back to chats
        </Button>
      </div>
    );
  }

  const params = flatParams(await searchParams);
  const q = params.q?.trim() ?? "";
  const data = await searchChats(params);

  return (
    <>
      <PageHeader back={{ href: "/chats", label: "All chats" }} title="Search chats" description="Find a keyword across recent chat transcripts." />
      <Card>
        <FilterBar searchPlaceholder="Keyword, e.g. WhatsApp" />
        <p className="mx-3 mb-3 flex items-start gap-2 rounded-lg bg-warning-soft px-3 py-2.5 text-xs text-warning sm:mx-4">
          <ScrollText className="mt-0.5 size-3.5 shrink-0" />
          Searches are logged. Your name, keyword and time are saved in the audit log.
        </p>
        {!q ? (
          <EmptyState icon={<Search />} title="Type a keyword to search" description="Results show matching messages with a link to the session." />
        ) : data.tooShort ? (
          <EmptyState icon={<Search />} title="Type at least 3 characters" description="Short keywords match too many messages." />
        ) : !data.rows.length ? (
          <EmptyState title={`No messages match “${q}”`} description="Try a shorter or different word." />
        ) : (
          <>
            <p className="border-t border-border px-4 py-2.5 text-xs text-muted">
              {formatNumber(data.total)} matching messages for <span className="font-semibold text-text-2">&ldquo;{q}&rdquo;</span>
            </p>
            <ul className="divide-y divide-border border-t border-border">
              {data.rows.map((m) => (
                <li key={m.id} className="px-4 py-3 sm:px-5">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                    <Link href={`/chats/${m.sessionId}`} className="font-mono font-semibold text-primary hover:underline">
                      {m.sessionId}
                    </Link>
                    <span>·</span>
                    <span>
                      {m.userName} with {m.astrologerName}
                    </span>
                    <Badge tone={m.from === "user" ? "neutral" : "primary"}>{m.from === "user" ? "User" : "Astrologer"}</Badge>
                    <span className="ml-auto">{formatDateTime(m.at)}</span>
                  </div>
                  <p className="mt-1.5 text-sm break-words text-text">{highlight(m.text, q)}</p>
                </li>
              ))}
            </ul>
          </>
        )}
        <Pagination {...data} basePath="/chats/search" params={params} />
      </Card>
    </>
  );
}

function highlight(text, term) {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return text.split(new RegExp(`(${escaped})`, "gi")).map((part, i) =>
    part.toLowerCase() === term.toLowerCase() ? (
      <mark key={i} className="rounded bg-warning-soft px-0.5 text-text">
        {part}
      </mark>
    ) : (
      part
    )
  );
}
