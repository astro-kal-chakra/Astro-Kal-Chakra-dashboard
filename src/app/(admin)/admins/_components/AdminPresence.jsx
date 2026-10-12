import { timeAgo } from "@/lib/utils";

const STYLES = {
  online: { dot: "bg-success", text: "text-success", label: "Online" },
  away: { dot: "bg-warning", text: "text-warning", label: "Away" },
  offline: { dot: "bg-border-strong", text: "text-muted", label: "Offline" },
};

/**
 * Live status from the backend: online = signed in and active in the last 5 minutes,
 * away = signed in but idle (signed out automatically after 30 minutes), offline = no live session.
 */
export function AdminPresence({ presence = "offline", lastActiveAt }) {
  const s = STYLES[presence] ?? STYLES.offline;
  return (
    <span className="block">
      <span className={`inline-flex items-center gap-1.5 text-sm font-semibold ${s.text}`}>
        <span className="relative flex size-2.5">
          {presence === "online" && <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />}
          <span className={`relative inline-flex size-2.5 rounded-full ${s.dot}`} />
        </span>
        {s.label}
      </span>
      <span className="block text-xs text-muted">{lastActiveAt ? `Active ${timeAgo(lastActiveAt)}` : "No activity yet"}</span>
    </span>
  );
}
