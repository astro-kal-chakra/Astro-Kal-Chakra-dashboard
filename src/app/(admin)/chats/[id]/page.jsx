import { notFound } from "next/navigation";
import { getCurrentAdmin } from "@/lib/session";
import { can } from "@/config/permissions";
import { getChatMessages, getTranscript } from "@/services";
import { flatParams } from "@/lib/url";
import { formatCurrency, formatDateTime, formatDuration } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import AccessDenied from "@/components/common/AccessDenied";
import { TranscriptGate } from "../_components/TranscriptGate";

export async function generateMetadata({ params }) {
  const { id } = await params;
  return { title: `Chat ${id}` };
}

export default async function ChatTranscriptPage({ params, searchParams }) {
  const admin = await getCurrentAdmin();
  const { ticket } = flatParams(await searchParams);
  // Support agents have no Chats module: they come here only from a linked ticket.
  // The backend checks that the ticket really is linked to this session.
  const viaTicket = Boolean(ticket) && !can(admin.role, "chats", "view") && can(admin.role, "support", "edit");
  if (!can(admin.role, "chats", "view") && !viaTicket) return <AccessDenied module="chats" roleName={admin.role.name} />;

  const { id } = await params;
  const data = await getTranscript(id);
  if (!data || data.session.mode !== "chat") notFound();

  // The transcript itself is only sent after a logged reason (POST /chats/:id/open).
  // While that grant is still valid (15 min) the messages can be loaded directly.
  const opened = data.access ? await getChatMessages(id) : null;

  const { session } = data;
  const summary = {
    id: session.id,
    userName: session.userName,
    userId: session.userId,
    astrologerName: session.astrologerName,
    astrologerId: session.astrologerId,
    started: formatDateTime(session.startedAt),
    duration: formatDuration(session.duration),
    amount: session.free ? "Free" : formatCurrency(session.amount),
    messageCount: data.messageCount,
    flaggedCount: data.flaggedCount,
  };

  return (
    <>
      <PageHeader
        back={viaTicket ? { href: `/support/${ticket}`, label: `Ticket ${ticket}` } : { href: "/chats", label: "All chats" }}
        title={<span className="font-mono">{session.id}</span>}
        description={`${session.userName} with ${session.astrologerName}`}
        meta={
          <>
            <StatusBadge status={session.status} />
            <Badge tone="primary">Chat</Badge>
            <Badge>Read-only</Badge>
          </>
        }
      />
      <TranscriptGate summary={summary} ticketId={viaTicket ? ticket : null} initial={opened} />
    </>
  );
}
