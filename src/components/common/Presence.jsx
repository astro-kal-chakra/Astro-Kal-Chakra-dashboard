import { Globe, Smartphone } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { cn, formatDuration } from "@/lib/utils";

const PLATFORM = {
  android: { label: "Android", icon: Smartphone, cls: "text-success" },
  ios: { label: "iOS", icon: Smartphone, cls: "text-text-2" },
  web: { label: "Website", icon: Globe, cls: "text-info" },
  app: { label: "App", icon: Smartphone, cls: "text-text-2" },
};

/** "Android · v1.0.0", "Website" — where an account signed up / logged in / was last active. */
export function PlatformTag({ platform, version, className }) {
  const p = PLATFORM[platform];
  if (!p) return <span className={cn("text-muted", className)}>—</span>;
  const Icon = p.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-semibold whitespace-nowrap text-text-2", className)}>
      <Icon className={cn("size-3.5", p.cls)} />
      {p.label}
      {version ? <span className="font-normal text-muted">· v{version}</span> : null}
    </span>
  );
}

const MODE = { chat: "chat", voice: "call", video: "video call" };

/** What a user is doing right now (users list / detail). */
export function NowBadge({ now }) {
  if (!now || now.state === "idle") return <span className="text-muted">—</span>;
  if (now.state === "in_session") {
    return (
      <Badge tone="info" dot>
        In {MODE[now.session?.mode] ?? "session"} · {formatDuration(now.session?.elapsed ?? 0)}
      </Badge>
    );
  }
  if (now.state === "requesting") return <Badge tone="warning" dot>Requesting {MODE[now.session?.mode] ?? "session"}</Badge>;
  if (now.state === "queue_turn") return <Badge tone="success" dot>Turn offered</Badge>;
  return (
    <Badge tone="primary" dot>
      In queue · #{now.queue?.position ?? "?"}
    </Badge>
  );
}

/** Astrologer "Now" cell: in a session (mode, user, time), online with a queue, or offline. */
export function AstroNow({ a }) {
  if (a.currentSession) {
    return (
      <span className="flex flex-col gap-0.5">
        <Badge tone="info" dot>
          In {MODE[a.currentSession.mode] ?? "session"} · {formatDuration(a.currentSession.elapsed)}
        </Badge>
        <span className="text-[11px] text-muted">with {a.currentSession.userId ?? a.currentSession.userName}</span>
      </span>
    );
  }
  if (a.inSession) return <Badge tone="info" dot>In session</Badge>;
  if (a.online) {
    return (
      <span className="flex flex-col gap-0.5">
        <Badge tone="success" dot>Online</Badge>
        {a.queueLength ? <span className="text-[11px] text-muted">{a.queueLength} in queue</span> : null}
      </span>
    );
  }
  return <Badge dot>Offline</Badge>;
}
