"use client";

import { useState } from "react";
import { Lock, MessageSquareText, Send, StickyNote } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Select, Textarea } from "@/components/ui/Input";
import { useToast } from "@/providers/ToastProvider";
import { useAdmin } from "@/providers/AdminProvider";
import { cn, formatDateTime } from "@/lib/utils";
import { NOW } from "@/lib/clock";

/** Conversation thread + reply composer. Sending is simulated: the message is appended locally. */
export function TicketThread({ ticketId, userName, initialMessages, cannedReplies }) {
  const [messages, setMessages] = useState(initialMessages);
  const [mode, setMode] = useState("reply");
  const [text, setText] = useState("");
  const [canned, setCanned] = useState("");
  const [sending, setSending] = useState(false);
  const toast = useToast();
  const { admin, can } = useAdmin();
  // UI mirror of the backend rule: only admins with support:edit can reply.
  const canReply = can("support", "edit");
  const firstName = userName.split(" ")[0];

  const insertCanned = (id) => {
    setCanned("");
    const reply = cannedReplies.find((c) => c.id === id);
    if (!reply) return;
    const body = reply.body.replaceAll("{{name}}", firstName);
    setText((t) => (t.trim() ? `${t.trimEnd()}\n\n${body}` : body));
  };

  const send = async () => {
    if (!text.trim()) return;
    setSending(true);
    await new Promise((r) => setTimeout(r, 300)); // simulated API call
    setMessages((m) => [
      ...m,
      { id: `local-${m.length + 1}`, from: mode === "note" ? "note" : "agent", author: admin?.name ?? "You", text: text.trim(), at: NOW },
    ]);
    setText("");
    setSending(false);
    toast(mode === "note" ? "Internal note added" : "Reply sent", {
      description: mode === "note" ? "Only visible to the support team." : `Sent to ${userName} on ticket ${ticketId}.`,
    });
  };

  return (
    <Card>
      <CardHeader title="Conversation" description={`${messages.length} messages`} />
      <ol className="space-y-4 p-4 sm:p-5">
        {messages.map((m) => (
          <Message key={m.id} m={m} />
        ))}
      </ol>

      {canReply && (
        <div className="border-t border-border p-4 sm:p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex rounded-lg bg-surface-3 p-0.5" role="radiogroup" aria-label="Message type">
              {[
                { value: "reply", label: "Reply", icon: <Send className="size-3.5" /> },
                { value: "note", label: "Internal note", icon: <StickyNote className="size-3.5" /> },
              ].map((o) => (
                <button
                  key={o.value}
                  type="button"
                  role="radio"
                  aria-checked={mode === o.value}
                  onClick={() => setMode(o.value)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
                    mode === o.value ? "bg-surface text-text shadow-card" : "text-muted hover:text-text"
                  )}
                >
                  {o.icon}
                  {o.label}
                </button>
              ))}
            </div>
            <Select
              aria-label="Insert canned reply"
              value={canned}
              onChange={(e) => insertCanned(e.target.value)}
              placeholder="Insert canned reply…"
              options={cannedReplies.map((c) => ({ value: c.id, label: c.title }))}
              className="w-full sm:w-60"
            />
          </div>
          <Textarea
            aria-label={mode === "note" ? "Internal note" : "Reply"}
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            placeholder={mode === "note" ? "Write a note for the team. The user won't see this." : `Reply to ${firstName}…`}
            className={cn(mode === "note" && "border-warning/40 bg-warning-soft/40")}
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-xs text-muted">
              {mode === "note" ? <Lock className="size-3.5" /> : <MessageSquareText className="size-3.5" />}
              {mode === "note" ? "Only the support team can see internal notes." : "The user gets this in the app and by email."}
            </p>
            <Button variant={mode === "note" ? "soft" : "primary"} size="sm" icon={<Send />} onClick={send} loading={sending} disabled={!text.trim()}>
              {mode === "note" ? "Add note" : "Send reply"}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

function Message({ m }) {
  if (m.from === "note") {
    return (
      <li className="rounded-xl border border-warning/30 bg-warning-soft px-4 py-3">
        <p className="mb-1 flex flex-wrap items-center gap-x-2 text-xs font-semibold text-warning">
          <StickyNote className="size-3.5" />
          Internal note · {m.author}
          <span className="font-normal text-muted">{formatDateTime(m.at)}</span>
        </p>
        <p className="text-sm whitespace-pre-line text-text">{m.text}</p>
      </li>
    );
  }
  const agent = m.from === "agent";
  return (
    <li className={cn("flex gap-3", agent && "flex-row-reverse")}>
      <Avatar name={m.author} size="sm" />
      <div className={cn("max-w-[85%] min-w-0", agent && "text-right")}>
        <p className="mb-1 text-xs text-muted">
          <span className="font-semibold text-text-2">{m.author}</span>
          {agent && " · Support"} · {formatDateTime(m.at)}
        </p>
        <div
          className={cn(
            "inline-block rounded-2xl px-4 py-2.5 text-left text-sm whitespace-pre-line",
            agent ? "rounded-tr-sm bg-primary-soft text-text" : "rounded-tl-sm bg-surface-3 text-text"
          )}
        >
          {m.text}
        </div>
      </div>
    </li>
  );
}
