import { notFound } from "next/navigation";
import { checkAccess } from "@/lib/session";
import { getTranscript } from "@/services";
import { formatCurrency, formatDateTime, formatDuration } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { TranscriptGate } from "../_components/TranscriptGate";

export async function generateMetadata({ params }) {
  const { id } = await params;
  return { title: `Chat ${id}` };
}

export default async function ChatTranscriptPage({ params }) {
  const { denied } = await checkAccess("chats");
  if (denied) return denied;

  const { id } = await params;
  const data = await getTranscript(id);
  if (!data || data.session.mode !== "chat") notFound();

  const { session, messages } = data;
  const summary = {
    id: session.id,
    userName: session.userName,
    userId: session.userId,
    astrologerName: session.astrologerName,
    astrologerId: session.astrologerId,
    started: formatDateTime(session.startedAt),
    duration: formatDuration(session.duration),
    amount: session.free ? "Free" : formatCurrency(session.amount),
    messageCount: messages.length,
    flaggedCount: messages.filter((m) => m.flagged).length,
  };

  return (
    <>
      <PageHeader
        back={{ href: "/chats", label: "All chats" }}
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
      {/*
        UI-only demo: messages are passed as props so the gate can reveal them.
        In production the transcript is NOT sent with this page. The client
        POSTs the reason to the backend (which checks chats:view and writes the
        audit log) and only then fetches the messages.
      */}
      <TranscriptGate summary={summary} messages={messages} />
    </>
  );
}
